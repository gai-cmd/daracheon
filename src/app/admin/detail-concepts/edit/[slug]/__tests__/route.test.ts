import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 편집 페이지 라우트 — 슬러그 허용 목록, 세션, 업스트림 fetch 제약, 변환 결과, 응답 헤더(CSP 포함).

import { buildRequest, ctx, sessionToken } from '@/lib/detail-edits/__tests__/test-helpers';
import { DETAIL_SLUGS } from '@/lib/detail-edits/pages';
import { GET } from '../route';

const CONCEPT = 'https://daeracheon-detail-concepts.vercel.app';
const ORIGIN = 'https://zoellife.com';
const url = (slug: string) => `${ORIGIN}/admin/detail-concepts/edit/${slug}`;

// 계약 §4 + 분석 트랙 보정(img-src·media-src 에 시안 오리진)
const CONTRACT_CSP =
  "default-src 'none'; script-src 'self'; " +
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net ${CONCEPT}; ` +
  `font-src ${CONCEPT} https://fonts.gstatic.com https://cdn.jsdelivr.net data:; ` +
  `img-src https: data: blob: ${CONCEPT}; media-src https: ${CONCEPT}; ` +
  `connect-src 'self'; base-uri ${CONCEPT}; form-action 'none'; object-src 'none'; frame-ancestors 'self'`;

const PAGE =
  '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>시안 7</title>' +
  '<base href="https://evil.test/"><meta http-equiv="refresh" content="5;url=https://evil.test">' +
  '<link rel="stylesheet" href="assets/a.css"></head>' +
  '<body onload="steal()"><h1 onclick="x()">제목</h1><script>steal()</script>' +
  '<img src="assets/a.jpg" onerror="steal()"><p>본문</p></body></html>';

const htmlResponse = (html: string, init: ResponseInit = {}) =>
  new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => htmlResponse(PAGE));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function open(slug: string, token?: string | null) {
  const t = token === undefined ? await sessionToken() : token;
  return GET(buildRequest(url(slug), { token: t }), ctx(slug));
}

describe('슬러그·인증', () => {
  it('허용 목록 밖의 슬러그는 404 이고 업스트림을 호출하지 않는다', async () => {
    for (const slug of ['index', 's12_x', '..', 'S7_BLACK', 's7_black.html', '__proto__', 'http://evil.test']) {
      const res = await open(slug);
      expect(res.status, slug).toBe(404);
      expect(res.headers.get('content-type')).toMatch(/text\/html/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('세션이 없거나 유효하지 않으면 401 이고 업스트림을 호출하지 않는다', async () => {
    expect((await open('s7_black', null)).status).toBe(401);
    expect((await open('s7_black', 'garbage.token')).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    const res = await open('s7_black', null);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toContain('/admin/login?next=');
  });
});

describe('성공 응답', () => {
  it('헤더: 계약대로의 CSP, no-store, noindex, same-origin referrer', async () => {
    const res = await open('s7_black');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-security-policy')).toBe(CONTRACT_CSP);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('referrer-policy')).toBe('same-origin');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('본문: 위험 요소 제거 + base/robots/de-page + 절대 URL 스크립트 2개', async () => {
    const html = await (await open('s7_black')).text();
    expect(html).not.toMatch(/steal\(\)/);
    expect(html).not.toMatch(/onload|onclick|onerror/i);
    expect(html).not.toContain('evil.test');
    expect(html).not.toMatch(/http-equiv/i);
    expect((html.match(/<base\b/gi) ?? []).length).toBe(1);
    expect(html).toContain(`<head><base href="${CONCEPT}/"><meta name="robots" content="noindex,nofollow"><meta name="de-page" content="s7_black"><meta charset="utf-8">`);
    expect((html.match(/<script\b/gi) ?? []).length).toBe(2);
    expect(html).toContain(`<script src="${ORIGIN}/detail-edit/apply.js" data-mode="edit" data-api="${ORIGIN}"></script>`);
    expect(html).toContain(`<script src="${ORIGIN}/detail-edit/editor.js"></script>`);
    // 시안 본문은 그대로
    expect(html).toContain('<h1>제목</h1>');
    expect(html).toContain('<img src="assets/a.jpg">');
    expect(html).toContain('<link rel="stylesheet" href="assets/a.css">');
  });

  it('스크립트 오리진은 요청 오리진을 따른다 (로컬 개발 포트 포함)', async () => {
    const res = await GET(buildRequest('http://127.0.0.1:3100/admin/detail-concepts/edit/s1_gift', { token: await sessionToken() }), ctx('s1_gift'));
    const html = await res.text();
    expect(html).toContain('src="http://127.0.0.1:3100/detail-edit/apply.js"');
    expect(html).toContain('src="http://127.0.0.1:3100/detail-edit/editor.js"');
    expect(html).not.toMatch(/src="\/detail-edit/);
  });
});

describe('실제 시안 11개를 업스트림으로 (읽기 전용 백업, 뷰어 스니펫 주입본)', () => {
  const BACKUP = '/Users/gai/personal/works/daeracheon-detail-concepts-deploy.bak-20261104';
  const available = fs.existsSync(path.join(BACKUP, 's7_black.html'));

  it.skipIf(!available)('200 + 계약 헤더, 스니펫·hide 스타일 없음, 스크립트는 우리 2개뿐, 본문 이미지는 그대로', async () => {
    for (const slug of DETAIL_SLUGS) {
      const original = fs.readFileSync(path.join(BACKUP, `${slug}.html`), 'utf-8');
      const injected = original
        .replace(
          /<meta charset="utf-8">/i,
          (m) => `${m}<!--de:begin--><style id="de-hide">html{visibility:hidden}</style><script>setTimeout(function(){var s=document.getElementById('de-hide');if(s)s.remove()},1200)</script><!--de:end-->`,
        )
        .replace(
          '</body>',
          '<!--de:begin--><script src="https://zoellife.com/detail-edit/apply.js" defer data-api="https://zoellife.com"></script><!--de:end--></body>',
        );
      expect(injected, `${slug}: 스니펫 주입 확인`).toContain('id="de-hide"');
      fetchMock.mockImplementationOnce(async () => htmlResponse(injected));

      const res = await open(slug);
      expect(res.status, slug).toBe(200);
      expect(res.headers.get('content-security-policy'), slug).toBe(CONTRACT_CSP);
      const html = await res.text();
      expect(html, slug).not.toContain('de-hide');
      expect(html, slug).not.toContain('de:begin');
      expect(html, slug).not.toContain('de:end');
      expect((html.match(/<script\b/gi) ?? []).length, slug).toBe(2);
      expect((html.match(/<base\b/gi) ?? []).length, slug).toBe(1);
      expect(html, slug).toContain(`name="de-page" content="${slug}"`);
      expect(fetchMock.mock.calls.at(-1)?.[0], slug).toBe(`${CONCEPT}/${slug}`);
      // 이미지 src 개수는 원본과 같다(본문은 건드리지 않는다)
      const count = (h: string) => (h.match(/<img\b/gi) ?? []).length;
      expect(count(html), slug).toBe(count(original));
    }
  });
});

describe('업스트림 fetch 제약 (SSRF)', () => {
  it('고정 오리진 + 허용 슬러그만 정확히 한 번 요청한다 — 11개 시안 모두', async () => {
    for (const slug of DETAIL_SLUGS) {
      fetchMock.mockClear();
      await open(slug);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [target, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(target).toBe(`${CONCEPT}/${slug}`);
      expect(init.redirect).toBe('manual');
      expect(init.cache).toBe('no-store');
    }
  });

  it('운영에서는 DETAIL_CONCEPTS_ORIGIN 을 무시한다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    const res = await open('s7_black');
    expect(fetchMock.mock.calls[0][0]).toBe(`${CONCEPT}/s7_black`);
    expect(res.headers.get('content-security-policy')).toBe(CONTRACT_CSP);
  });

  it('비운영에서는 오버라이드를 쓰고 CSP·base 도 그 오리진을 따른다', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    const res = await open('s7_black');
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:4101/s7_black');
    expect(res.headers.get('content-security-policy')).toContain('base-uri http://127.0.0.1:4101;');
    expect(res.headers.get('content-security-policy')).toContain('img-src https: data: blob: http://127.0.0.1:4101;');
    expect(await res.text()).toContain('<base href="http://127.0.0.1:4101/">');
  });

  it('200 이 아니면 502 (리다이렉트·404·500)', async () => {
    for (const status of [301, 308, 404, 500]) {
      fetchMock.mockImplementation(async () => new Response('x', { status, headers: { 'content-type': 'text/html', location: 'https://evil.test/' } }));
      const res = await open('s7_black');
      expect(res.status, String(status)).toBe(502);
      expect(await res.text()).not.toContain('evil.test');
    }
  });

  it('text/html 이 아니면 502', async () => {
    fetchMock.mockImplementation(async () => new Response('{"a":1}', { status: 200, headers: { 'content-type': 'application/json' } }));
    expect((await open('s7_black')).status).toBe(502);
  });

  it('2MB 를 넘으면 502', async () => {
    fetchMock.mockImplementation(async () => htmlResponse('a'.repeat(2 * 1024 * 1024 + 1)));
    expect((await open('s7_black')).status).toBe(502);
    fetchMock.mockImplementation(async () => htmlResponse('x', { headers: { 'content-type': 'text/html', 'content-length': String(3 * 1024 * 1024) } }));
    expect((await open('s7_black')).status).toBe(502);
  });

  it('네트워크 오류·타임아웃은 502 이고 내부 오류 문구를 노출하지 않는다', async () => {
    fetchMock.mockImplementation(async () => {
      throw new TypeError('connect ECONNREFUSED 10.0.0.1:443 secret-detail');
    });
    const res = await open('s7_black');
    expect(res.status).toBe(502);
    const body = await res.text();
    expect(body).not.toContain('ECONNREFUSED');
    expect(body).not.toContain('secret-detail');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  });
});
