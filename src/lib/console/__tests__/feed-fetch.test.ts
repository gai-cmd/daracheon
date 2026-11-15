import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// SPEC-CONSOLE-002 AC-CS2-034 — 바깥 요청 방어(design.md §2.12). 진짜 네트워크·DNS 는 쓰지 않는다:
// DNS 는 node:dns/promises 를 가짜로, fetch 는 주입한 가짜로 바꾼다.

const dns = vi.hoisted(() => ({ table: new Map<string, string>() }));
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    const addr = dns.table.get(host) ?? '93.184.216.34';
    return [{ address: addr, family: addr.includes(':') ? 6 : 4 }];
  }),
}));

import { fetchAllowed } from '../feed-fetch';

const allow = (h: string) => h === 'www.youtube.com' || h === 'rss.blog.naver.com';
const MB = 1024 * 1024;

function streamOf(total: number, chunk = 64 * 1024) {
  let sent = 0;
  const reads = { n: 0 };
  const body = new ReadableStream<Uint8Array>({
    pull(ctrl) {
      reads.n++;
      if (sent >= total) return ctrl.close();
      const n = Math.min(chunk, total - sent);
      sent += n;
      ctrl.enqueue(new Uint8Array(n));
    },
  });
  return { body, reads };
}

beforeEach(() => dns.table.clear());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('fetchAllowed — refused before any request', () => {
  it.each([
    'http://www.youtube.com/feeds/videos.xml',
    'https://127.0.0.1/x',
    'https://[::1]/x',
    'https://localhost/x',
    'https://example.net/x',
    'https://www.youtube.com.example.net/x',
    'not a url',
  ])('%s', async (url) => {
    const fetchImpl = vi.fn();
    const r = await fetchAllowed(url, { allow, maxBytes: MB, fetchImpl });
    expect(r).toEqual({ ok: false, error: 'not_allowed' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses an allowed host whose DNS answer is private', async () => {
    dns.table.set('www.youtube.com', '10.0.0.5');
    const fetchImpl = vi.fn();
    expect(await fetchAllowed('https://www.youtube.com/feeds/videos.xml', { allow, maxBytes: MB, fetchImpl })).toEqual({ ok: false, error: 'not_allowed' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('fetchAllowed — redirects', () => {
  it('fails on a redirect to http: without a second request (research.md §6.2 shape)', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://rss.blog.naver.com/fakex' } }));
    expect(await fetchAllowed('https://rss.blog.naver.com/fakeold.xml', { allow, maxBytes: MB, fetchImpl })).toEqual({ ok: false, error: 'redirect_rejected' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails on two redirects in a row', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 301, headers: { location: 'https://rss.blog.naver.com/fakenext.xml' } }));
    expect(await fetchAllowed('https://rss.blog.naver.com/fakea.xml', { allow, maxBytes: MB, fetchImpl })).toEqual({ ok: false, error: 'redirect_rejected' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('follows one redirect to an allowed https address', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/fakenew.xml' } }))
      .mockResolvedValueOnce(new Response('<rss/>', { status: 200, headers: { 'content-type': 'text/xml' } }));
    const r = await fetchAllowed('https://rss.blog.naver.com/fakeold.xml', { allow, maxBytes: MB, fetchImpl });
    expect(r.ok).toBe(true);
    expect(fetchImpl.mock.calls[1][0]).toBe('https://rss.blog.naver.com/fakenew.xml');
    if (r.ok) {
      expect(new TextDecoder().decode(r.bytes)).toBe('<rss/>');
      expect(r.contentType).toBe('text/xml');
    }
  });
});

describe('fetchAllowed — limits and request shape', () => {
  it('fails with too_large past the cap and stops reading', async () => {
    const big = streamOf(MB + 1);
    const fetchImpl = vi.fn(async () => new Response(big.body, { status: 200 }));
    expect(await fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl })).toEqual({ ok: false, error: 'too_large' });
    // 64KB 조각 17개째에서 상한을 넘는다. 그 뒤로는 더 당기지 않는다 (스트림 큐 미리 읽기 1회 여유).
    expect(big.reads.n).toBeLessThanOrEqual(18);

    const exact = streamOf(MB);
    const ok = await fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl: vi.fn(async () => new Response(exact.body, { status: 200 })) });
    expect(ok.ok && ok.bytes.byteLength).toBe(MB);
  });

  it('fails with http_status on a non-2xx answer and network on a thrown fetch', async () => {
    expect(await fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl: vi.fn(async () => new Response('x', { status: 404 })) })).toEqual({ ok: false, error: 'http_status' });
    expect(await fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl: vi.fn(async () => Promise.reject(new TypeError('boom'))) })).toEqual({ ok: false, error: 'network' });
  });

  it('fails with timeout when no answer comes within 5 seconds', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })
    );
    const p = fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl });
    await vi.advanceTimersByTimeAsync(4999);
    let settled = false;
    void p.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(await p).toEqual({ ok: false, error: 'timeout' });
  });

  it('sends no Cookie or Referer and asks for omit / no-referrer / manual redirect', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }));
    await fetchAllowed('https://www.youtube.com/f', { allow, maxBytes: MB, fetchImpl });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'manual' });
    const headers = new Headers(init.headers);
    expect(headers.has('cookie')).toBe(false);
    expect(headers.has('referer')).toBe(false);
  });

  it('checks public addresses with assertPublicHttpUrl from src/lib/ssrf.ts', () => {
    const src = readFileSync(path.resolve(__dirname, '../feed-fetch.ts'), 'utf8');
    expect(src).toMatch(/import \{[^}]*\bassertPublicHttpUrl\b[^}]*\} from '@\/lib\/ssrf'/);
  });
});
