import { beforeEach, describe, expect, it, vi } from 'vitest';

// 공개 읽기 API — 구역 배치(layout, 부록 A1)를 싣되 updatedBy 는 여전히 싣지 않고,
// layout 없는 문서(2차 웨이브)의 응답 본문은 바이트 단위로 그대로다.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);

import { detailEditStore } from '@/lib/detail-edits/store';
import { buildRequest, ctx, mem, resetMemDb } from '@/lib/detail-edits/__tests__/test-helpers';
import { GET } from '../route';

const CONCEPT = 'https://daeracheon-detail-concepts.vercel.app';
const SLUG = 's7_black';
const S1 = 's:ab12cd:0';
const LAYOUT = {
  sequence: [{ k: S1 }, { c: 'c1' }],
  clones: [{ id: 'c1', of: S1 }],
  gaps: [{ k: S1, top: 24, bottom: null }],
  secbg: [{ k: 'c1', color: '#102030' }],
};
const req = () => buildRequest(`https://zoellife.com/api/detail-edits/${SLUG}`, { origin: null, headers: { origin: CONCEPT } });

beforeEach(() => {
  resetMemDb();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/detail-edits/<slug> — layout', () => {
  it('layout 과 복제본 접두 키를 돌려주고 updatedBy 는 어디에도 없다', async () => {
    await detailEditStore.save(SLUG, {
      baseVersion: 0,
      actor: 'secret-admin@try-n.com',
      doc: {
        texts: [{ k: 'c1!t:ab12cd:0', o: 'x', html: '<b>복제</b>' }],
        images: [],
        bgs: [],
        hidden: [],
        layout: LAYOUT,
      },
    });
    const res = await GET(req(), ctx(SLUG));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe(CONCEPT);
    const text = await res.text();
    expect(text).not.toContain('updatedBy');
    expect(text).not.toContain('secret-admin');
    const json = JSON.parse(text);
    expect(json.layout).toEqual(LAYOUT);
    expect(json.texts[0].k).toBe('c1!t:ab12cd:0');
    expect(Object.keys(json)).toEqual(['schema', 'page', 'version', 'updatedAt', 'texts', 'images', 'bgs', 'hidden', 'layout']);
  });

  it('layout 없는 저장본(2차 웨이브)의 응답 본문은 바이트 단위로 그대로다', async () => {
    mem.set(`detail-edits__${SLUG}`, {
      schema: 1, page: SLUG, version: 2, updatedAt: '2026-11-03T01:02:03.000Z', updatedBy: 'old@try-n.com',
      texts: [{ k: 't:ab12cd:1', o: 'a', html: '<b>v</b>' }], images: [], bgs: [], hidden: [],
    });
    const res = await GET(req(), ctx(SLUG));
    expect(await res.text()).toBe(
      '{"schema":1,"page":"s7_black","version":2,"updatedAt":"2026-11-03T01:02:03.000Z",' +
        '"texts":[{"k":"t:ab12cd:1","o":"a","html":"<b>v</b>"}],"images":[],"bgs":[],"hidden":[]}',
    );
  });

  it('저장된 layout 이 규칙을 어기면 200 + 빈 문서 + X-DE-Degraded (fail-open)', async () => {
    mem.set(`detail-edits__${SLUG}`, {
      schema: 1, page: SLUG, version: 2, updatedAt: '2026-11-03T01:02:03.000Z',
      texts: [], images: [], bgs: [], hidden: [], layout: { sequence: [{ c: 'c9' }] },
    });
    const res = await GET(req(), ctx(SLUG));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-de-degraded')).toBe('1');
    expect(await res.json()).toEqual({ schema: 1, page: SLUG, version: 0, updatedAt: null, texts: [], images: [], bgs: [], hidden: [] });
  });
});
