import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// SPEC-CONSOLE-002 AC-CS2-032·033(피드 경로: 401, Cache-Control), AC-CS2-037(썸네일 경로, design.md §2.14).
// 진짜 네트워크·DNS 는 쓰지 않는다: fetch 는 가짜, DNS 는 node:dns/promises 를 가짜로 바꾼다.

const dns = vi.hoisted(() => ({ table: new Map<string, string>() }));
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) => [{ address: dns.table.get(host) ?? '93.184.216.34', family: 4 }]),
}));
vi.mock('@/lib/db', async () => (await import('./support')).dbMock);
vi.mock('@/lib/blog/store', () => ({ readLatestPublishedPostsSafe: vi.fn(async () => []) }));

import { GET as getFeed } from '../feed/route';
import { GET as getThumb } from '../feed/thumb/route';
import { clearFeedCache } from '@/lib/console/feed';
import { read, request, resetStore, restoreEnv, store } from './support';

const BLOB = 'fakeblob.public.blob.vercel-storage.com';
const YT = 'UCfake000000000000000001';
const saved: Record<string, string | undefined> = {};
let fetchSpy: ReturnType<typeof vi.spyOn>;

const channel = (id: string, kind: string, source: string, order: number, enabled = true) => ({ id, label: id, label_en: '', kind, source, color: '#1f6f5c', enabled, order });

beforeEach(() => {
  resetStore(saved);
  clearFeedCache();
  dns.table.clear();
  store.singles.set('console-settings', {
    teamPins: [],
    channels: [channel('ch-rss00001', 'rss', 'https://example.com/feed.xml', 0), channel('ch-yt000001', 'youtube', YT, 1)],
  });
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});
afterEach(() => restoreEnv(saved));

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
const image = (type = 'image/png', bytes: Uint8Array = PNG) => new Response(new Blob([new Uint8Array(bytes)]), { status: 200, headers: { 'content-type': type } });
const thumb = (u: string | null, email: string | null = 'o@try-n.com') =>
  request('GET', `/api/console/feed/thumb${u === null ? '' : `?u=${encodeURIComponent(u)}`}`, { email, contentType: null, origin: null }).then(getThumb);

describe('GET /api/console/feed/thumb', () => {
  it('answers 401 without a session', async () => {
    expect((await thumb('https://i.ytimg.com/vi/x/hqdefault.jpg', null)).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    'https://i.ytimg.com/vi/x/hqdefault.jpg',
    'https://i2.ytimg.com/vi/x/hqdefault.jpg',
    'https://blogthumb.pstatic.net/a.png',
    `https://${BLOB}/blog/a.png`,
    'https://example.com/a.jpg',
  ])('proxies %s with the upstream type, nosniff and a day of private cache', async (u) => {
    fetchSpy.mockResolvedValueOnce(image('image/jpeg'));
    const res = await thumb(u);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('private, max-age=86400');
    expect(res.headers.get('x-thumb-fallback')).toBeNull();
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'manual' });
  });

  it.each([
    ['no u', null],
    ['2049-character u', `https://i.ytimg.com/${'a'.repeat(2049 - 'https://i.ytimg.com/'.length)}`],
    ['http', 'http://i.ytimg.com/vi/x/hqdefault.jpg'],
    ['foreign host', 'https://evil.example/a.png'],
    ['suffix trick 1', 'https://ytimg.com.evil.example/a.png'],
    ['suffix trick 2', 'https://i.ytimg.com.evil.example/a.png'],
    ['IP literal', 'https://127.0.0.1/a.png'],
    ['localhost', 'https://localhost/a.png'],
    ['disabled rss host', 'https://example.net/a.png'],
  ])('returns the placeholder without a request for %s', async (_n, u) => {
    store.singles.set('console-settings', {
      teamPins: [],
      channels: [channel('ch-rss00001', 'rss', 'https://example.com/feed.xml', 0), channel('ch-rss00002', 'rss', 'https://example.net/feed.xml', 1, false)],
    });
    const res = await thumb(u);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, max-age=300');
    expect(res.headers.get('x-thumb-fallback')).toBe('1');
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['svg', () => image('image/svg+xml')],
    ['html', () => image('text/html')],
    ['too large', () => image('image/png', new Uint8Array(2 * 1024 * 1024 + 1))],
    ['redirect off the allowlist', () => new Response(null, { status: 302, headers: { location: 'https://evil.example/a.png' } })],
    ['upstream 404', () => new Response('x', { status: 404 })],
  ])('returns the placeholder when the upstream answer is %s', async (_n, make) => {
    fetchSpy.mockImplementation(async () => make());
    const res = await thumb('https://i.ytimg.com/vi/x/hqdefault.jpg');
    expect(res.headers.get('x-thumb-fallback')).toBe('1');
    expect(res.headers.get('cache-control')).toBe('private, max-age=300');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('bundles the placeholder in code (no file or external asset)', () => {
    const src = readFileSync(path.resolve(__dirname, '../feed/thumb/route.ts'), 'utf8');
    expect(src).not.toMatch(/https?:\/\//);
  });
});

describe('GET /api/console/feed', () => {
  it('answers 401 without a session', async () => {
    const r = await request('GET', '/api/console/feed', { email: null, contentType: null, origin: null }).then(getFeed).then(read);
    expect(r.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('answers 200 with private 30-minute caching and isolates a failing channel', async () => {
    const atom = readFileSync(path.resolve(__dirname, '../../../../lib/console/__tests__/fixtures/feeds/atom-generic.xml'), 'utf8');
    fetchSpy.mockImplementation(async (u: RequestInfo | URL) =>
      String(u).startsWith('https://example.com/') ? new Response(atom, { status: 200 }) : new Response('nope', { status: 404 })
    );
    const r = await request('GET', '/api/console/feed', { email: 'u@try-n.com', contentType: null, origin: null }).then(getFeed).then(read);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('private, max-age=1800');
    const channels = r.json.channels as Record<string, unknown>[];
    expect(channels.map((c) => [c.id, c.ok, c.error])).toEqual([
      ['ch-rss00001', true, undefined],
      ['ch-yt000001', false, 'http_status'],
    ]);
    expect((r.json.items as unknown[]).length).toBe(2);
  });
});
