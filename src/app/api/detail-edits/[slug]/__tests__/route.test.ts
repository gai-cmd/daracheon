import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 공개 읽기 API — 인증 없음, CORS 허용 오리진 에코, updatedBy 미노출, fail-open.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);

import { detailEditStore } from '@/lib/detail-edits/store';
import { buildRequest, ctx, failures, mem, resetMemDb } from '@/lib/detail-edits/__tests__/test-helpers';
import { DETAIL_SLUGS } from '@/lib/detail-edits/pages';
import { GET, OPTIONS } from '../route';

const CONCEPT = 'https://daeracheon-detail-concepts.vercel.app';
const url = (slug: string) => `https://zoellife.com/api/detail-edits/${slug}`;
const pubReq = (slug: string, origin?: string) =>
  buildRequest(url(slug), { origin: origin ?? null, headers: origin ? { origin } : {} });

beforeEach(() => {
  resetMemDb();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/detail-edits/<slug>', () => {
  it('허용 목록 밖의 슬러그는 404 NOT_FOUND', async () => {
    for (const slug of ['index', 's12_x', 'S7_BLACK', '..', '__proto__', 's7_black.html', '%2e%2e']) {
      const res = await GET(pubReq(slug, CONCEPT), ctx(slug));
      expect(res.status, slug).toBe(404);
      expect(await res.json()).toEqual({ success: false, code: 'NOT_FOUND' });
    }
  });

  it('저장본이 없으면 빈 문서(version 0, updatedAt null) — 11개 시안 모두', async () => {
    for (const slug of DETAIL_SLUGS) {
      const res = await GET(pubReq(slug, CONCEPT), ctx(slug));
      expect(res.status, slug).toBe(200);
      expect(await res.json()).toEqual({ schema: 1, page: slug, version: 0, updatedAt: null, texts: [], images: [], bgs: [], hidden: [] });
    }
  });

  it('헤더: CORS 에코·Vary·캐시·noindex', async () => {
    const res = await GET(pubReq('s7_black', CONCEPT), ctx('s7_black'));
    expect(res.headers.get('access-control-allow-origin')).toBe(CONCEPT);
    expect(res.headers.get('vary')).toBe('Origin');
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=15, stale-while-revalidate=60');
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-de-degraded')).toBeNull();
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('허용되지 않은 Origin 이나 Origin 없음에는 ACAO 가 없다 (Vary 는 유지)', async () => {
    for (const origin of ['https://evil.test', 'https://zoellife.com', `${CONCEPT}.evil.test`, 'null', undefined]) {
      const res = await GET(pubReq('s7_black', origin), ctx('s7_black'));
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin'), String(origin)).toBeNull();
      expect(res.headers.get('vary')).toBe('Origin');
    }
  });

  it('공개 응답에는 updatedBy 가 절대 없다', async () => {
    await detailEditStore.save('s7_black', {
      baseVersion: 0,
      doc: { texts: [{ k: 't:ab12cd:0', o: 'x', html: '<b>y</b>' }], images: [], bgs: [], hidden: [] },
      actor: 'secret.person@try-n.com',
    });
    expect((mem.get('detail-edits__s7_black') as { updatedBy: string }).updatedBy).toBe('secret.person@try-n.com');
    const res = await GET(pubReq('s7_black', CONCEPT), ctx('s7_black'));
    const raw = await res.text();
    expect(raw).not.toContain('updatedBy');
    expect(raw).not.toContain('secret.person');
    expect(JSON.parse(raw)).toMatchObject({ version: 1, page: 's7_black' });
  });

  it('저장소가 throw 하면 200 + 빈 문서 + X-DE-Degraded, 캐시하지 않는다 (fail-open)', async () => {
    failures.read = true;
    const res = await GET(pubReq('s7_black', CONCEPT), ctx('s7_black'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-de-degraded')).toBe('1');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('access-control-allow-origin')).toBe(CONCEPT);
    expect(await res.json()).toMatchObject({ version: 0, texts: [], images: [], bgs: [], hidden: [] });
  });

  it('저장된 문서가 손상되었으면 빈 문서로 대체(degraded)', async () => {
    mem.set('detail-edits__s7_black', { schema: 1, page: 's7_black', version: 3, texts: 'oops' });
    const res = await GET(pubReq('s7_black', CONCEPT), ctx('s7_black'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-de-degraded')).toBe('1');
    expect((await res.json()).version).toBe(0);
  });

  it('운영에서는 오버라이드 오리진에 CORS 를 열지 않고, 비운영에서는 연다', async () => {
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    vi.stubEnv('NODE_ENV', 'production');
    const prod = await GET(pubReq('s7_black', 'http://127.0.0.1:4101'), ctx('s7_black'));
    expect(prod.headers.get('access-control-allow-origin')).toBeNull();
    vi.stubEnv('NODE_ENV', 'development');
    const dev = await GET(pubReq('s7_black', 'http://127.0.0.1:4101'), ctx('s7_black'));
    expect(dev.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4101');
    const devConcept = await GET(pubReq('s7_black', CONCEPT), ctx('s7_black'));
    expect(devConcept.headers.get('access-control-allow-origin')).toBe(CONCEPT);
  });

  it('인증 쿠키가 없어도 읽을 수 있다 (공개 API)', async () => {
    const res = await GET(buildRequest(url('s1_gift')), ctx('s1_gift'));
    expect(res.status).toBe(200);
  });
});

describe('OPTIONS /api/detail-edits/<slug>', () => {
  it('204 + 허용 메서드·Max-Age + ACAO(허용 오리진)', async () => {
    const res = await OPTIONS(buildRequest(url('s7_black'), { method: 'OPTIONS', origin: CONCEPT, headers: { origin: CONCEPT } }), ctx('s7_black'));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('access-control-max-age')).toBe('600');
    expect(res.headers.get('access-control-allow-origin')).toBe(CONCEPT);
    expect(res.headers.get('vary')).toBe('Origin');
    expect(await res.text()).toBe('');
  });

  it('허용되지 않은 Origin 에는 ACAO 없음, 알 수 없는 슬러그는 404', async () => {
    const bad = await OPTIONS(buildRequest(url('s7_black'), { method: 'OPTIONS', headers: { origin: 'https://evil.test' } }), ctx('s7_black'));
    expect(bad.status).toBe(204);
    expect(bad.headers.get('access-control-allow-origin')).toBeNull();
    const unknown = await OPTIONS(buildRequest(url('nope'), { method: 'OPTIONS' }), ctx('nope'));
    expect(unknown.status).toBe(404);
  });
});
