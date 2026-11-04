import { beforeEach, describe, expect, it, vi } from 'vitest';

// 관리자 편집 API — 인증·CSRF·검증·정제·동시성·이력을 라우트 핸들러 수준에서 검증한다.
// 저장소는 인메모리 db 목(운영 Blob·fs 와 무관), 감사 로그는 스텁.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);
vi.mock('@/lib/audit', () => ({ logAdmin: vi.fn(async () => {}) }));

import { logAdmin } from '@/lib/audit';
import { LIMITS } from '@/lib/detail-edits/schema';
import { __setPurifyLoaderForTests } from '@/lib/detail-edits/sanitize';
import {
  BLOB_SRC,
  buildRequest,
  ctx,
  emptyDocBody,
  failures,
  mem,
  resetMemDb,
  sessionToken,
} from '@/lib/detail-edits/__tests__/test-helpers';
import { GET as publicGet } from '@/app/api/detail-edits/[slug]/route';
import { GET, PUT } from '../route';

const URL_BASE = 'https://zoellife.com/api/admin/detail-edits';
const url = (slug: string) => `${URL_BASE}/${slug}`;
const SLUG = 's7_black';

const textEdit = (n: number, html: string, extra: Record<string, unknown> = {}) => ({
  k: `t:ab12cd:${n}`,
  o: `orig ${n}`,
  html,
  ...extra,
});

async function put(body: unknown, opts: { token?: string | null; origin?: string | null; slug?: string; rawBody?: string; headers?: Record<string, string> } = {}) {
  const token = opts.token === undefined ? await sessionToken() : opts.token;
  const req = buildRequest(url(opts.slug ?? SLUG), {
    method: 'PUT',
    token,
    origin: opts.origin,
    body,
    rawBody: opts.rawBody,
    headers: opts.headers,
  });
  return PUT(req, ctx(opts.slug ?? SLUG));
}

beforeEach(() => {
  resetMemDb();
  vi.mocked(logAdmin).mockClear();
  __setPurifyLoaderForTests(null);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('슬러그 검증', () => {
  it('허용 목록 밖은 GET·PUT 모두 404 NOT_FOUND (인증된 요청이라도)', async () => {
    const token = await sessionToken();
    for (const slug of ['index', 's12_x', '..%2fs7_black', '__proto__', 's7_black.html', 'S7_BLACK']) {
      const g = await GET(buildRequest(url(slug), { token }), ctx(slug));
      expect(g.status, slug).toBe(404);
      expect(await g.json()).toMatchObject({ success: false, code: 'NOT_FOUND' });
      const p = await put({ baseVersion: 0, doc: emptyDocBody() }, { slug });
      expect(p.status, slug).toBe(404);
    }
    expect(mem.size).toBe(0);
  });
});

describe('인증 (핸들러 수준 방어)', () => {
  it('쿠키 없음 → 401', async () => {
    const g = await GET(buildRequest(url(SLUG)), ctx(SLUG));
    expect(g.status).toBe(401);
    expect(await g.json()).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
    const p = await put({ baseVersion: 0, doc: emptyDocBody() }, { token: null });
    expect(p.status).toBe(401);
    expect(mem.size).toBe(0);
  });

  it('위조·변조·쓰레기 토큰 → 401', async () => {
    const good = await sessionToken();
    const [payload, sig] = good.split('.');
    for (const token of ['garbage', `${payload}.${sig.slice(0, -2)}AA`, `${payload.slice(0, -2)}AA.${sig}`, '.', 'a.b.c', `${payload}.`]) {
      const g = await GET(buildRequest(url(SLUG), { token }), ctx(SLUG));
      expect(g.status, token).toBe(401);
      const p = await put({ baseVersion: 0, doc: emptyDocBody() }, { token });
      expect(p.status, token).toBe(401);
    }
    expect(mem.size).toBe(0);
  });

  it('다른 비밀로 서명된 토큰은 거절', async () => {
    const forged = await sessionToken();
    process.env.ADMIN_SESSION_SECRET = 'another-secret';
    const g = await GET(buildRequest(url(SLUG), { token: forged }), ctx(SLUG));
    expect(g.status).toBe(401);
  });

  it('모든 관리자 역할(editor 포함)은 통과', async () => {
    for (const role of ['editor', 'admin', 'super_admin'] as const) {
      const token = await sessionToken('x@try-n.com', role);
      const g = await GET(buildRequest(url(SLUG), { token }), ctx(SLUG));
      expect(g.status, role).toBe(200);
    }
  });
});

describe('GET', () => {
  it('저장본이 없으면 version 0 의 빈 문서', async () => {
    const res = await GET(buildRequest(url(SLUG), { token: await sessionToken() }), ctx(SLUG));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      success: true,
      doc: { schema: 1, page: SLUG, version: 0, updatedAt: null, ...emptyDocBody() },
    });
  });

  it('저장 뒤에는 updatedBy 를 포함해 돌려준다', async () => {
    const token = await sessionToken('who@try-n.com');
    await put({ baseVersion: 0, doc: { ...emptyDocBody(), hidden: [{ k: 's:ab12cd:0', o: '섹션' }] } }, { token });
    const res = await GET(buildRequest(url(SLUG), { token }), ctx(SLUG));
    const body = await res.json();
    expect(body.doc).toMatchObject({ version: 1, updatedBy: 'who@try-n.com' });
    expect(body.doc.hidden).toHaveLength(1);
  });

  it('저장소 장애는 503 STORE_UNAVAILABLE', async () => {
    failures.readForWrite = true;
    const res = await GET(buildRequest(url(SLUG), { token: await sessionToken() }), ctx(SLUG));
    expect(res.status).toBe(503);
    const raw = JSON.stringify(await res.json());
    expect(raw).toContain('STORE_UNAVAILABLE');
    expect(raw).not.toContain('blob down');
  });
});

describe('PUT — CSRF', () => {
  it('교차 사이트 Origin → 403 CSRF, 저장되지 않는다', async () => {
    for (const origin of ['https://daeracheon-detail-concepts.vercel.app', 'https://evil.test', 'https://zoellife.com.evil.test', 'null']) {
      const res = await put({ baseVersion: 0, doc: emptyDocBody() }, { origin });
      expect(res.status, origin).toBe(403);
      expect(await res.json()).toMatchObject({ success: false, code: 'CSRF' });
    }
    expect(mem.size).toBe(0);
  });

  it('Origin 이 없어도 403', async () => {
    const res = await put({ baseVersion: 0, doc: emptyDocBody() }, { origin: null });
    expect(res.status).toBe(403);
    expect(mem.size).toBe(0);
  });

  it('인증이 없으면 CSRF 보다 먼저 401', async () => {
    const res = await put({ baseVersion: 0, doc: emptyDocBody() }, { token: null, origin: 'https://evil.test' });
    expect(res.status).toBe(401);
  });
});

describe('PUT — 본문 검증', () => {
  it('깨진 JSON → 400 INVALID', async () => {
    for (const rawBody of ['{', 'not json', '', '[1,2', '{"baseVersion":}']) {
      const res = await put(undefined, { rawBody });
      expect(res.status, rawBody).toBe(400);
      expect(await res.json()).toMatchObject({ success: false, code: 'INVALID' });
    }
  });

  it('JSON 이지만 객체가 아니거나 필드가 없으면 400 + issues', async () => {
    for (const body of [[], 'x', 5, null, {}, { baseVersion: 0 }, { doc: emptyDocBody() }, { baseVersion: '0', doc: emptyDocBody() }]) {
      const res = await put(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('INVALID');
      expect(Array.isArray(json.issues)).toBe(true);
    }
  });

  it('알 수 없는 속성은 400 (최상위·doc·항목, updatedBy 위조 포함)', async () => {
    const base = { baseVersion: 0, doc: emptyDocBody() };
    const cases = [
      { ...base, updatedBy: 'boss@zoellife.com' },
      { ...base, version: 99 },
      { ...base, doc: { ...emptyDocBody(), evil: [] } },
      { ...base, doc: { ...emptyDocBody(), texts: [textEdit(0, '<b>x</b>', { onclick: 'x' })] } },
      JSON.parse('{"baseVersion":0,"doc":{"texts":[],"images":[],"bgs":[],"hidden":[]},"__proto__":{"admin":true}}'),
    ];
    for (const body of cases) {
      const res = await put(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect(mem.size).toBe(0);
  });

  it('상한 위반은 400: html 8001자, alt 301자, 글자 크기 9, 색 형식, 배열 개수', async () => {
    const bad = [
      { texts: [textEdit(0, 'a'.repeat(8001))] },
      { texts: [textEdit(0, 'x', { fs: 9 })] },
      { texts: [textEdit(0, 'x', { fs: 201 })] },
      { texts: [textEdit(0, 'x', { color: 'red' })] },
      { images: [{ k: 'i:ab12cd:0', o: 'a', alt: 'a'.repeat(301) }] },
      { hidden: Array.from({ length: 101 }, (_, i) => ({ k: `s:ab12cd:${i}`, o: 's' })) },
      { bgs: Array.from({ length: 51 }, (_, i) => ({ k: `b:ab12cd:${i}`, o: 'u' })) },
    ];
    for (const part of bad) {
      const res = await put({ baseVersion: 0, doc: { ...emptyDocBody(), ...part } });
      expect(res.status, JSON.stringify(part).slice(0, 60)).toBe(400);
    }
    expect(mem.size).toBe(0);
  });

  it('이미지 src 는 허용 규칙만 통과 (javascript:, data:, 외부 호스트, 쿼리 → 400)', async () => {
    for (const src of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'https://evil.test/a.jpg', `${BLOB_SRC}?x=1`, '//evil.test/a.jpg', '/uploads/other/a.jpg']) {
      const img = await put({ baseVersion: 0, doc: { ...emptyDocBody(), images: [{ k: 'i:ab12cd:0', o: 'a.jpg', src }] } });
      expect(img.status, src).toBe(400);
      const bg = await put({ baseVersion: 0, doc: { ...emptyDocBody(), bgs: [{ k: 'b:ab12cd:0', o: 'u', src }] } });
      expect(bg.status, src).toBe(400);
    }
    const ok = await put({ baseVersion: 0, doc: { ...emptyDocBody(), images: [{ k: 'i:ab12cd:0', o: 'a.jpg', src: BLOB_SRC, alt: '새 이미지' }] } });
    expect(ok.status).toBe(200);
  });

  it('루트 상대 업로드 경로는 운영에서 400, 비운영에서만 허용', async () => {
    const doc = { ...emptyDocBody(), images: [{ k: 'i:ab12cd:0', o: 'a.jpg', src: '/uploads/detail-concepts/1730000000000-ab12.jpg' }] };
    vi.stubEnv('NODE_ENV', 'production');
    expect((await put({ baseVersion: 0, doc })).status).toBe(400);
    vi.stubEnv('NODE_ENV', 'development');
    expect((await put({ baseVersion: 0, doc })).status).toBe(200);
    vi.unstubAllEnvs();
  });

  it('본문이 상한을 넘으면 413 (Content-Length 선언·실제 크기 모두)', async () => {
    const huge = JSON.stringify({ baseVersion: 0, doc: emptyDocBody(), note: 'x'.repeat(LIMITS.bodyBytes) });
    const res = await put(undefined, { rawBody: huge });
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ code: 'TOO_LARGE' });

    // Content-Length 를 속이거나 생략해도 실제 바이트로 판단한다
    const noLength = await put(undefined, { rawBody: huge, headers: { 'content-length': '10' } });
    expect(noLength.status).toBe(413);
    expect(mem.size).toBe(0);
  });

  it('본문은 상한 안이지만 문서가 400KB 를 넘으면 413', async () => {
    // 본문 상한(문서 상한 + 봉투 여유) 안쪽이면서 문서 자체는 400KB 를 넘는 크기 — 정제 뒤 크기 검사가 잡는다.
    const texts = Array.from({ length: 51 }, (_, i) => textEdit(i, 'a'.repeat(8000)));
    const payload = JSON.stringify({ baseVersion: 0, doc: { ...emptyDocBody(), texts } });
    expect(Buffer.byteLength(JSON.stringify({ ...emptyDocBody(), texts }))).toBeGreaterThan(LIMITS.docBytes);
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(LIMITS.bodyBytes);
    const res = await put(undefined, { rawBody: payload });
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ code: 'TOO_LARGE' });
    expect(mem.size).toBe(0);
  });

  it('400KB 이하의 큰 문서는 저장된다', async () => {
    const texts = Array.from({ length: 40 }, (_, i) => textEdit(i, 'a'.repeat(8000)));
    const res = await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts } });
    expect(res.status).toBe(200);
  });
});

describe('PUT — XSS 정제', () => {
  const attacks = [
    '<script>alert(1)</script>안녕',
    '<img src=x onerror=alert(1)>안녕',
    '<svg onload=alert(1)></svg>안녕',
    '<a href="javascript:alert(1)">안녕</a>',
    '<span style="background:url(javascript:alert(1))">안녕</span>',
    '<span style="width:expression(alert(1))">안녕</span>',
    '<svg><p><style><a title="</style><img src onerror=alert(1)>">안녕',
    '<math><mi//xlink:href="data:x,<script>alert(1)</script>">안녕',
    '<!--<script>alert(1)</script>-->안녕',
    '<iframe src="javascript:alert(1)"></iframe>안녕',
    '<B ONCLICK="alert(1)">안녕</B>',
    '<span style="background:image-set(&quot;//evil.test/x.png&quot; 1x)">안녕</span>',
    '<a href="&#106;avascript:alert(1)">안녕</a>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">안녕',
  ];

  it('저장된 html 에는 위험 요소가 남지 않는다 (관리자·공개 응답 모두)', async () => {
    const token = await sessionToken();
    const texts = attacks.map((html, i) => textEdit(i, html));
    const res = await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts } }, { token });
    expect(res.status).toBe(200);

    const admin = await (await GET(buildRequest(url(SLUG), { token }), ctx(SLUG))).json();
    const pub = await (await publicGet(buildRequest(`https://zoellife.com/api/detail-edits/${SLUG}`), ctx(SLUG))).json();
    for (const doc of [admin.doc, pub]) {
      for (const t of doc.texts as Array<{ html: string }>) {
        expect(t.html).not.toMatch(/<script|<img|<svg|<math|<iframe|onerror|onload|onclick|javascript:|expression\(|url\(|image-set|evil\.test/i);
      }
      // svg/math 안에 갇힌 글자는 내용째 사라지는 게 정상이다. 그 밖의 벡터는 글자가 남아야 한다.
      const kept = (doc.texts as Array<{ html: string }>).filter((t, i) => !/svg|math/i.test(attacks[i]) && t.html.includes('안녕'));
      expect(kept.length).toBe(attacks.filter((a) => !/svg|math/i.test(a)).length);
    }
    // 이력에도 정제본만 남는다
    expect(JSON.stringify([...mem.values()])).not.toMatch(/onerror|<script|javascript:/i);
  });

  it('html 이 없는 항목(글자 크기·색만 변경)은 그대로 저장', async () => {
    const token = await sessionToken();
    await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts: [{ k: 't:ab12cd:0', o: 'x', fs: 28, color: '#aa3322' }] } }, { token });
    const doc = (await (await GET(buildRequest(url(SLUG), { token }), ctx(SLUG))).json()).doc;
    expect(doc.texts[0]).toEqual({ k: 't:ab12cd:0', o: 'x', fs: 28, color: '#aa3322' });
  });

  it('정제기를 쓸 수 없으면 원문을 저장하지 않고 503 SANITIZER_UNAVAILABLE', async () => {
    __setPurifyLoaderForTests(() => {
      throw new Error('boom');
    });
    const res = await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts: [textEdit(0, '<script>alert(1)</script>')] } });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: 'SANITIZER_UNAVAILABLE' });
    expect(mem.size).toBe(0);
    // html 이 없는 저장은 정제기가 필요 없으므로 영향 없음
    const ok = await put({ baseVersion: 0, doc: { ...emptyDocBody(), hidden: [{ k: 's:ab12cd:0', o: 's' }] } });
    expect(ok.status).toBe(200);
  });
});

describe('PUT — 저장·버전·감사', () => {
  it('성공 응답 형태와 버전 증가, updatedBy 는 세션에서만 온다', async () => {
    const token = await sessionToken('first@try-n.com');
    const r1 = await put({ baseVersion: 0, note: '첫 수정', doc: { ...emptyDocBody(), texts: [textEdit(0, '<b>하나</b>')] } }, { token });
    expect(r1.status).toBe(200);
    expect(r1.headers.get('cache-control')).toBe('no-store');
    const j1 = await r1.json();
    expect(j1).toMatchObject({ success: true, version: 1 });
    expect(typeof j1.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(j1.updatedAt))).toBe(false);
    expect(j1).not.toHaveProperty('warning');

    const r2 = await put({ baseVersion: 1, doc: emptyDocBody() }, { token: await sessionToken('second@try-n.com') });
    expect((await r2.json()).version).toBe(2);
    const stored = mem.get(`detail-edits__${SLUG}`) as { updatedBy: string; version: number };
    expect(stored).toMatchObject({ version: 2, updatedBy: 'second@try-n.com' });
  });

  it('낡은 baseVersion → 409 VERSION_CONFLICT + currentVersion, 저장되지 않음', async () => {
    await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts: [textEdit(0, '<b>하나</b>')] } });
    const stale = await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts: [textEdit(0, '<b>덮어쓰기</b>')] } });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ success: false, code: 'VERSION_CONFLICT', currentVersion: 1 });
    expect((mem.get(`detail-edits__${SLUG}`) as { texts: Array<{ html: string }> }).texts[0].html).toBe('<b>하나</b>');
    expect(vi.mocked(logAdmin)).toHaveBeenCalledTimes(1);
  });

  it('감사 로그를 남긴다 (기존 settings 분류 사용)', async () => {
    await put({ baseVersion: 0, doc: { ...emptyDocBody(), hidden: [{ k: 's:ab12cd:0', o: 's' }] } });
    expect(logAdmin).toHaveBeenCalledWith(
      'settings',
      'update',
      expect.objectContaining({
        targetId: `detail-edits:${SLUG}`,
        summary: expect.stringContaining('s7_black v1'),
        meta: expect.objectContaining({ kind: 'detail-edits', page: SLUG, version: 1, counts: { texts: 0, images: 0, bgs: 0, hidden: 1, layout: 0 } }),
      }),
    );
  });

  it('저장소 쓰기 장애는 503 STORE_UNAVAILABLE (내부 오류 문구 비노출)', async () => {
    failures.write = true;
    const res = await put({ baseVersion: 0, doc: emptyDocBody() });
    expect(res.status).toBe(503);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('STORE_UNAVAILABLE');
    expect(text).not.toContain('write failed');
    expect(logAdmin).not.toHaveBeenCalled();
  });

  it('이력은 50개까지만 남는다 (라우트 경유 55회 저장)', async () => {
    const token = await sessionToken();
    for (let v = 0; v < 55; v++) {
      const res = await put({ baseVersion: v, doc: { ...emptyDocBody(), hidden: [{ k: 's:ab12cd:0', o: `v${v + 1}` }] } }, { token });
      expect(res.status).toBe(200);
    }
    const history = mem.get(`detail-edits-history__${SLUG}`) as { items: Array<{ version: number }> };
    expect(history.items).toHaveLength(50);
    expect(history.items[0].version).toBe(6);
    expect(history.items[49].version).toBe(55);
  });

  it('초기화("원본으로") = 네 배열이 빈 PUT → 새 버전, 공개 문서도 비어 있다', async () => {
    const token = await sessionToken();
    await put({ baseVersion: 0, doc: { ...emptyDocBody(), texts: [textEdit(0, '<b>하나</b>')] } }, { token });
    const reset = await put({ baseVersion: 1, doc: emptyDocBody(), note: '원본으로' }, { token });
    expect(reset.status).toBe(200);
    const pub = await (await publicGet(buildRequest(`https://zoellife.com/api/detail-edits/${SLUG}`), ctx(SLUG))).json();
    expect(pub).toMatchObject({ version: 2, texts: [], images: [], bgs: [], hidden: [] });
  });
});
