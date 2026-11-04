import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditBody } from '../schema';

// 저장소 계층 — 인메모리 db 목으로 낙관적 동시성, 이력 상한, 복원, 공개 응답의 updatedBy 제외, fail-open 을 검증한다.
// (운영 파일·Blob 은 전혀 건드리지 않는다. 실제 fs 저장소 왕복은 store-fs.test.ts.)

const mem = new Map<string, unknown>();
const failures = { read: false, readForWrite: false, writeFor: new Set<string>() };
let writeCount = 0;

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

vi.mock('@/lib/db', () => ({
  readSingleUncached: vi.fn(async (name: string) => {
    if (failures.read) throw new Error('blob down');
    return mem.has(name) ? clone(mem.get(name)) : null;
  }),
  readSingleForWrite: vi.fn(async (name: string) => {
    if (failures.readForWrite) throw new Error('blob down');
    await Promise.resolve(); // 비동기 틈을 만들어 락이 없으면 경합이 드러나게 한다
    return mem.has(name) ? clone(mem.get(name)) : null;
  }),
  writeSingle: vi.fn(async (name: string, data: unknown) => {
    for (const marker of failures.writeFor) {
      if (name.includes(marker)) throw new Error(`write failed: ${name}`);
    }
    await Promise.resolve();
    writeCount++;
    mem.set(name, clone(data));
  }),
}));

import { createDetailEditStore } from '../store';

const store = createDetailEditStore({ doc: 'de-test', history: 'de-test-history' });
const SLUG = 's7_black';

const body = (n: number, extra: Partial<EditBody> = {}): EditBody => ({
  texts: [{ k: `t:ab12cd:${n % 1000}`, o: `orig ${n}`, html: `<b>v${n}</b>` }],
  images: [],
  bgs: [],
  hidden: [],
  ...extra,
});

beforeEach(() => {
  mem.clear();
  failures.read = false;
  failures.readForWrite = false;
  failures.writeFor.clear();
  writeCount = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('읽기', () => {
  it('저장본이 없으면 공개는 빈 문서(version 0), 관리자는 빈 문서', async () => {
    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(false);
    expect(pub.doc).toEqual({ schema: 1, page: SLUG, version: 0, updatedAt: null, texts: [], images: [], bgs: [], hidden: [] });
    const adm = await store.readAdmin(SLUG);
    expect(adm.version).toBe(0);
    expect(adm.updatedBy).toBeUndefined();
  });

  it('공개 응답에는 updatedBy 가 없고, 관리자 응답에는 있다', async () => {
    const saved = await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'someone@try-n.com' });
    expect(saved.ok).toBe(true);
    const pub = await store.readPublic(SLUG);
    expect(pub.doc.version).toBe(1);
    expect(Object.keys(pub.doc)).not.toContain('updatedBy');
    expect(JSON.stringify(pub.doc)).not.toContain('someone@try-n.com');
    const adm = await store.readAdmin(SLUG);
    expect(adm.updatedBy).toBe('someone@try-n.com');
  });

  it('공개 읽기는 저장소가 실패해도 throw 하지 않고 빈 문서 + degraded', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    failures.read = true;
    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(true);
    expect(pub.doc.version).toBe(0);
    expect(pub.doc.texts).toEqual([]);
  });

  it('손상·구버전 문서는 공개에서 빈 문서(degraded)로 대체', async () => {
    mem.set(`de-test__${SLUG}`, { schema: 9, page: SLUG, version: 3, texts: 'garbage' });
    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(true);
    expect(pub.doc.version).toBe(0);
  });

  it('관리자 읽기는 저장소 장애를 숨기지 않는다', async () => {
    failures.readForWrite = true;
    await expect(store.readAdmin(SLUG)).rejects.toThrow('blob down');
  });

  it('요약 읽기는 장애 시 null', async () => {
    failures.read = true;
    expect(await store.readSummary(SLUG)).toBeNull();
  });
});

describe('저장 — 낙관적 동시성', () => {
  it('baseVersion 이 저장 버전과 같으면 version+1 로 저장', async () => {
    const r1 = await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test', note: '첫 수정' });
    expect(r1).toMatchObject({ ok: true, version: 1, historySaved: true });
    const r2 = await store.save(SLUG, { baseVersion: 1, doc: body(2), actor: 'a@b.test' });
    expect(r2).toMatchObject({ ok: true, version: 2 });
    expect((await store.readAdmin(SLUG)).texts[0].html).toBe('<b>v2</b>');
  });

  it('낡은 baseVersion 은 409(VERSION_CONFLICT)이고 아무것도 쓰지 않는다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    const before = writeCount;
    const stale = await store.save(SLUG, { baseVersion: 0, doc: body(99), actor: 'x@y.test' });
    expect(stale).toEqual({ ok: false, code: 'VERSION_CONFLICT', currentVersion: 1 });
    expect(writeCount).toBe(before);
    expect((await store.readAdmin(SLUG)).texts[0].html).toBe('<b>v1</b>');
  });

  it('앞선 baseVersion·미래 baseVersion 모두 충돌', async () => {
    expect(await store.save(SLUG, { baseVersion: 5, doc: body(1), actor: 'a@b.test' })).toEqual({
      ok: false, code: 'VERSION_CONFLICT', currentVersion: 0,
    });
  });

  it('충돌 응답의 currentVersion 으로 덮어쓰기 저장이 가능', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    const conflict = await store.save(SLUG, { baseVersion: 0, doc: body(2), actor: 'b@b.test' });
    expect(conflict.ok).toBe(false);
    const overwrite = await store.save(SLUG, {
      baseVersion: conflict.ok ? 0 : conflict.currentVersion,
      doc: body(2),
      actor: 'b@b.test',
    });
    expect(overwrite).toMatchObject({ ok: true, version: 2 });
  });

  it('같은 인스턴스의 동시 저장은 직렬화되어 하나만 성공한다', async () => {
    const results = await Promise.all([
      store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' }),
      store.save(SLUG, { baseVersion: 0, doc: body(2), actor: 'b@b.test' }),
      store.save(SLUG, { baseVersion: 0, doc: body(3), actor: 'c@b.test' }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.code === 'VERSION_CONFLICT')).toHaveLength(2);
    expect((await store.readAdmin(SLUG)).version).toBe(1);
  });

  it('슬러그가 다르면 서로 막지 않는다', async () => {
    const [a, b] = await Promise.all([
      store.save('s1_gift', { baseVersion: 0, doc: body(1), actor: 'a@b.test' }),
      store.save('s2_check', { baseVersion: 0, doc: body(2), actor: 'a@b.test' }),
    ]);
    expect(a.ok && b.ok).toBe(true);
  });

  it('저장본이 있는데 해석되지 않으면 덮어쓰지 않고 예외', async () => {
    mem.set(`de-test__${SLUG}`, { schema: 1, page: SLUG, version: 'x' });
    await expect(store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' })).rejects.toThrow(/해석/);
    expect(mem.get(`de-test__${SLUG}`)).toEqual({ schema: 1, page: SLUG, version: 'x' });
  });

  it('현재 문서 쓰기가 실패하면 예외이고 이력도 남기지 않는다', async () => {
    failures.writeFor.add('de-test__');
    await expect(store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' })).rejects.toThrow('write failed');
    expect(mem.size).toBe(0);
    // 락이 풀려 다음 저장은 정상 진행
    failures.writeFor.clear();
    expect(await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' })).toMatchObject({ ok: true, version: 1 });
  });

  it('이력 쓰기만 실패하면 저장은 성공하고 historySaved=false', async () => {
    failures.writeFor.add('de-test-history__');
    const r = await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    expect(r).toMatchObject({ ok: true, version: 1, historySaved: false });
    expect((await store.readAdmin(SLUG)).version).toBe(1);
  });
});

describe('이력', () => {
  it('최신순 목록과 메타(counts)', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test', note: '하나' });
    await store.save(SLUG, {
      baseVersion: 1,
      doc: body(2, { hidden: [{ k: 's:ab12cd:0', o: 'sec' }], images: [{ k: 'i:ab12cd:0', o: 'a.jpg', alt: 'x' }] }),
      actor: 'b@b.test',
      note: '둘',
    });
    const list = await store.listHistory(SLUG);
    expect(list.map((m) => m.version)).toEqual([2, 1]);
    expect(list[0]).toMatchObject({ updatedBy: 'b@b.test', note: '둘', counts: { texts: 1, images: 1, bgs: 0, hidden: 1, layout: 0 } });
    expect(list[0]).not.toHaveProperty('doc');
  });

  it('50개 상한 — 오래된 것부터 버리고 버전 번호는 계속 증가', async () => {
    for (let v = 0; v < 55; v++) {
      const r = await store.save(SLUG, { baseVersion: v, doc: body(v + 1), actor: 'a@b.test' });
      expect(r.ok).toBe(true);
    }
    const list = await store.listHistory(SLUG);
    expect(list).toHaveLength(50);
    expect(list[0].version).toBe(55);
    expect(list[49].version).toBe(6);
    expect(await store.readHistoryEntry(SLUG, 5)).toBeNull();
    expect(await store.readHistoryEntry(SLUG, 6)).not.toBeNull();
    expect((await store.readAdmin(SLUG)).version).toBe(55);
  });

  it('특정 버전 조회에는 doc 이 포함되고, 없는 버전은 null', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    const entry = await store.readHistoryEntry(SLUG, 1);
    expect(entry?.doc.texts[0].html).toBe('<b>v1</b>');
    expect(await store.readHistoryEntry(SLUG, 7)).toBeNull();
    expect(await store.readHistoryEntry(SLUG, 0)).toBeNull();
  });

  it('이력이 없는 시안의 목록은 빈 배열', async () => {
    expect(await store.listHistory(SLUG)).toEqual([]);
  });

  it('손상된 이력 항목은 건너뛴다', async () => {
    mem.set(`de-test-history__${SLUG}`, { items: [null, { version: 'x' }, { version: 2, doc: 5 }, 7] });
    expect(await store.listHistory(SLUG)).toEqual([]);
  });
});

describe('복원', () => {
  it('복원은 해당 버전 내용을 "새 버전"으로 저장하고 이력은 지우지 않는다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 1, doc: body(2), actor: 'a@b.test' });
    await store.save(SLUG, { baseVersion: 2, doc: body(3), actor: 'a@b.test' });

    const r = await store.restore(SLUG, { version: 1, baseVersion: 3, actor: 'r@b.test' });
    expect(r).toMatchObject({ ok: true, version: 4 });

    const current = await store.readAdmin(SLUG);
    expect(current.version).toBe(4);
    expect(current.texts[0].html).toBe('<b>v1</b>');
    expect(current.updatedBy).toBe('r@b.test');

    const list = await store.listHistory(SLUG);
    expect(list.map((m) => m.version)).toEqual([4, 3, 2, 1]);
    expect(list[0].note).toBe('v1 복원');
    // 원래 버전 2, 3 은 그대로 남아 있다
    expect((await store.readHistoryEntry(SLUG, 3))?.doc.texts[0].html).toBe('<b>v3</b>');
  });

  it('없는 버전은 NOT_FOUND, 낡은 baseVersion 은 VERSION_CONFLICT', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    expect(await store.restore(SLUG, { version: 9, baseVersion: 1, actor: 'r@b.test' })).toEqual({ ok: false, code: 'NOT_FOUND' });
    expect(await store.restore(SLUG, { version: 1, baseVersion: 0, actor: 'r@b.test' })).toEqual({
      ok: false, code: 'VERSION_CONFLICT', currentVersion: 1,
    });
  });

  it('이력 항목의 문서가 스키마에 맞지 않으면 복원하지 않는다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    mem.set(`de-test-history__${SLUG}`, {
      items: [{ version: 1, updatedAt: 'x', updatedBy: 'x', note: '', doc: { texts: [{ k: 'bad', o: '' }], images: [], bgs: [], hidden: [] } }],
    });
    expect(await store.restore(SLUG, { version: 1, baseVersion: 1, actor: 'r@b.test' })).toEqual({ ok: false, code: 'NOT_FOUND' });
    expect(await store.readHistoryEntry(SLUG, 1)).toBeNull();
  });

  it('초기화("원본으로")는 네 배열이 빈 저장이며 새 버전이 된다', async () => {
    await store.save(SLUG, { baseVersion: 0, doc: body(1), actor: 'a@b.test' });
    const reset = await store.save(SLUG, {
      baseVersion: 1,
      doc: { texts: [], images: [], bgs: [], hidden: [] },
      actor: 'a@b.test',
      note: '원본으로',
    });
    expect(reset).toMatchObject({ ok: true, version: 2 });
    const pub = await store.readPublic(SLUG);
    expect(pub.doc).toMatchObject({ version: 2, texts: [], images: [], bgs: [], hidden: [] });
  });
});
