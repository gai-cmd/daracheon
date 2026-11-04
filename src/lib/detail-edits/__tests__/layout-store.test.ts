import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditBody } from '../schema';

// 저장소 계층 — 구역 배치(layout, 부록 A1): 저장·공개 읽기·이력 counts·복원·초기화, 2차 웨이브 문서와의 바이트 호환.
// (인메모리 db 목. 운영 파일·Blob 은 전혀 건드리지 않는다.)

const mem = new Map<string, unknown>();
const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

vi.mock('@/lib/db', () => ({
  readSingleUncached: vi.fn(async (name: string) => (mem.has(name) ? clone(mem.get(name)) : null)),
  readSingleForWrite: vi.fn(async (name: string) => {
    await Promise.resolve();
    return mem.has(name) ? clone(mem.get(name)) : null;
  }),
  writeSingle: vi.fn(async (name: string, data: unknown) => {
    await Promise.resolve();
    mem.set(name, clone(data));
  }),
}));

import { createDetailEditStore } from '../store';

const store = createDetailEditStore({ doc: 'de-lay', history: 'de-lay-history' });
const SLUG = 's7_black';
const S1 = 's:ab12cd:0';
const S2 = 's:cd34ef:0';

const LAYOUT = {
  sequence: [{ k: S1 }, { c: 'c1' }, { k: S2 }],
  clones: [{ id: 'c1', of: S1 }],
  gaps: [{ k: S1, top: 24, bottom: null }],
  secbg: [{ k: 'c1', color: '#102030' }],
};

const plain = (n = 1): EditBody => ({
  texts: [{ k: `t:ab12cd:${n}`, o: `orig ${n}`, html: `<b>v${n}</b>` }],
  images: [],
  bgs: [],
  hidden: [],
});
const withLayout = (n = 1, layout: EditBody['layout'] = LAYOUT): EditBody => ({
  ...plain(n),
  // 복제본 안의 편집(접두 키)
  texts: [...plain(n).texts, { k: 'c1!t:ab12cd:1', o: 'orig', html: '<i>clone</i>' }],
  layout,
});

beforeEach(() => {
  mem.clear();
});

describe('layout — 저장과 읽기', () => {
  it('layout 이 있는 문서를 저장하면 관리자·공개 읽기 모두 layout 을 돌려준다', async () => {
    const r = await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    expect(r).toMatchObject({ ok: true, version: 1 });

    const admin = await store.readAdmin(SLUG);
    expect(admin.layout).toEqual(LAYOUT);
    expect(admin.updatedBy).toBe('a@b.test');
    expect(admin.texts).toHaveLength(2);

    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(false);
    expect(pub.doc.layout).toEqual(LAYOUT);
    expect(pub.doc.texts.map((t) => t.k)).toEqual(['t:ab12cd:1', 'c1!t:ab12cd:1']);
  });

  it('공개 응답에는 layout 이 있어도 updatedBy 가 없다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'secret-admin@b.test' });
    const { doc } = await store.readPublic(SLUG);
    expect(doc).not.toHaveProperty('updatedBy');
    expect(JSON.stringify(doc)).not.toContain('secret-admin@b.test');
    expect(Object.keys(doc)).toEqual(['schema', 'page', 'version', 'updatedAt', 'texts', 'images', 'bgs', 'hidden', 'layout']);
  });

  it('요약 읽기도 layout 을 싣는다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    expect((await store.readSummary(SLUG))?.layout).toEqual(LAYOUT);
  });

  it('저장본의 layout 이 규칙을 어기면 공개는 빈 문서(degraded), 관리자는 예외, 저장은 덮어쓰지 않는다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mem.set(`de-lay__${SLUG}`, {
      schema: 1, page: SLUG, version: 3, updatedAt: '2026-11-04T00:00:00.000Z', ...plain(),
      layout: { sequence: [{ c: 'c9' }] }, // 없는 복제본
    });
    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(true);
    expect(pub.doc.version).toBe(0);
    expect(pub.doc).not.toHaveProperty('layout');
    await expect(store.readAdmin(SLUG)).rejects.toThrow(/해석할 수 없습니다/);
    await expect(store.save(SLUG, { baseVersion: 3, doc: plain(), actor: 'a@b.test' })).rejects.toThrow();
    expect((mem.get(`de-lay__${SLUG}`) as { version: number }).version).toBe(3);
  });
});

describe('layout — 2차 웨이브 문서와 바이트 호환', () => {
  it('layout 없이 저장하면 저장 JSON 에 layout 키가 없고 키 순서도 2차 웨이브와 같다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: plain(), actor: 'a@b.test' });
    const raw = mem.get(`de-lay__${SLUG}`) as Record<string, unknown>;
    expect(Object.keys(raw)).toEqual(['schema', 'page', 'version', 'updatedAt', 'updatedBy', 'texts', 'images', 'bgs', 'hidden']);
    expect(raw).not.toHaveProperty('layout');
    const hist = mem.get(`de-lay-history__${SLUG}`) as { items: Array<{ doc: Record<string, unknown> }> };
    expect(Object.keys(hist.items[0].doc)).toEqual(['texts', 'images', 'bgs', 'hidden']);
  });

  it('2차 웨이브가 남긴 문서를 읽고 그 위에 layout 을 더해 저장할 수 있다', async () => {
    mem.set(`de-lay__${SLUG}`, {
      schema: 1, page: SLUG, version: 2, updatedAt: '2026-11-03T00:00:00.000Z', updatedBy: 'old@b.test', ...plain(5),
    });
    const before = await store.readPublic(SLUG);
    expect(before.doc).not.toHaveProperty('layout');
    expect(before.doc.version).toBe(2);

    const r = await store.save(SLUG, { baseVersion: 2, doc: { ...plain(5), layout: { gaps: [{ k: S1, top: 10 }] } }, actor: 'a@b.test' });
    expect(r).toMatchObject({ ok: true, version: 3 });
    expect((await store.readPublic(SLUG)).doc.layout).toEqual({ gaps: [{ k: S1, top: 10 }] });
  });

  it('layout 없는 문서를 저장해도 이전 버전의 layout 이 남지 않는다 (문서 통째 교체)', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 1, doc: plain(), actor: 'a@b.test' });
    expect(await store.readAdmin(SLUG)).not.toHaveProperty('layout');
    expect(mem.get(`de-lay__${SLUG}`)).not.toHaveProperty('layout');
  });
});

describe('layout — 이력', () => {
  it('목록 메타 counts 에 layout(항목 수 합)이 들어간다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: plain(), actor: 'a@b.test', note: '일반' });
    await store.save(SLUG, { baseVersion: 1, doc: withLayout(), actor: 'b@b.test', note: '배치' });
    const list = await store.listHistory(SLUG);
    expect(list[0].counts).toEqual({ texts: 2, images: 0, bgs: 0, hidden: 0, layout: 3 + 1 + 1 + 1 });
    expect(list[1].counts).toEqual({ texts: 1, images: 0, bgs: 0, hidden: 0, layout: 0 });
  });

  it('특정 버전 조회에 layout 이 포함된다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    const entry = await store.readHistoryEntry(SLUG, 1);
    expect(entry?.doc.layout).toEqual(LAYOUT);
    expect(entry?.counts.layout).toBe(6);
  });

  it('이력 항목의 layout 이 규칙을 어기면 조회·복원 대상에서 제외된다', async () => {
    mem.set(`de-lay-history__${SLUG}`, {
      items: [{ version: 1, updatedAt: '2026-11-04T00:00:00.000Z', updatedBy: 'a@b.test', note: '', doc: { ...plain(), layout: { sequence: [{ c: 'c1' }] } } }],
    });
    expect(await store.readHistoryEntry(SLUG, 1)).toBeNull();
    expect(await store.restore(SLUG, { version: 1, baseVersion: 0, actor: 'a@b.test' })).toEqual({ ok: false, code: 'NOT_FOUND' });
  });
});

describe('layout — 복원과 초기화', () => {
  it('layout 이 있던 버전을 복원하면 같은 layout 으로 새 버전이 생긴다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 1, doc: plain(9), actor: 'a@b.test' });
    const r = await store.restore(SLUG, { version: 1, baseVersion: 2, actor: 'c@b.test' });
    expect(r).toMatchObject({ ok: true, version: 3 });

    const now = await store.readAdmin(SLUG);
    expect(now.version).toBe(3);
    expect(now.layout).toEqual(LAYOUT);
    expect(now.texts).toEqual(withLayout().texts);

    const list = await store.listHistory(SLUG);
    expect(list.map((m) => m.version)).toEqual([3, 2, 1]);
    expect(list[0]).toMatchObject({ note: 'v1 복원', updatedBy: 'c@b.test' });
    expect(list[0].counts.layout).toBe(6);
  });

  it('layout 이 없던 버전을 복원하면 현재 layout 이 사라진다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: plain(), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 1, doc: withLayout(), actor: 'a@b.test' });
    await store.restore(SLUG, { version: 1, baseVersion: 2, actor: 'a@b.test' });
    const now = await store.readAdmin(SLUG);
    expect(now.version).toBe(3);
    expect(now).not.toHaveProperty('layout');
    expect(mem.get(`de-lay__${SLUG}`)).not.toHaveProperty('layout');
  });

  it('초기화("원본으로"): 네 배열과 layout 의 모든 배열이 빈 문서도 새 버전으로 저장된다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    const reset: EditBody = {
      texts: [], images: [], bgs: [], hidden: [],
      layout: { sequence: [], clones: [], gaps: [], secbg: [] },
    };
    const r = await store.save(SLUG, { baseVersion: 1, doc: reset, actor: 'a@b.test', note: '초기화' });
    expect(r).toMatchObject({ ok: true, version: 2 });
    const pub = await store.readPublic(SLUG);
    expect(pub.doc.version).toBe(2);
    expect(pub.doc.texts).toEqual([]);
    expect(pub.doc.layout).toEqual({ sequence: [], clones: [], gaps: [], secbg: [] });
    expect((await store.listHistory(SLUG))[0].counts).toEqual({ texts: 0, images: 0, bgs: 0, hidden: 0, layout: 0 });
  });

  it('초기화 직전 버전(layout 포함)으로 다시 복원할 수 있다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: withLayout(), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 1, doc: { texts: [], images: [], bgs: [], hidden: [], layout: { sequence: [], clones: [], gaps: [], secbg: [] } }, actor: 'a@b.test' });
    expect(await store.restore(SLUG, { version: 1, baseVersion: 2, actor: 'a@b.test' })).toMatchObject({ ok: true, version: 3 });
    expect((await store.readAdmin(SLUG)).layout).toEqual(LAYOUT);
  });
});
