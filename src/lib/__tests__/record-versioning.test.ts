import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

/**
 * 레코드 버저닝(_rev/_mt) 불변식 테스트 — 진단 DATA-5·8.
 *
 * writeDataMerged 의 per-record 충돌 해소를 고정한다:
 *  1) stale base 전체 배열 쓰기가 다른 writer 의 최신 편집을 되돌리지 못한다 (newest-wins)
 *  2) 정상 편집(최신 base)은 적용되고 _rev 증가·_mt 갱신
 *  3) 내용 무변경 레코드는 스탬프가 바뀌지 않는다 (churn 방지)
 *  4) 스탬프 없는 레거시 레코드는 종전 동작(writer 승) 유지 — 무회귀
 *  5) stripRecordMeta 가 클라이언트 왕복 메타를 제거한다
 *
 * 목/env 스캐폴딩은 db-concurrency.test.ts 와 동일 패턴.
 */

const URL_BASE = 'https://blob.test/';
const store = new Map<string, { body: string; uploadedAt: number }>();
let seq = 0;

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
  revalidateTag: () => {},
  revalidatePath: () => {},
}));

vi.mock('@vercel/blob', () => ({
  put: async (pathname: string, body: string) => {
    store.set(pathname, { body, uploadedAt: Date.now() + seq++ });
    return { url: URL_BASE + pathname, pathname };
  },
  list: async ({ prefix }: { prefix: string }) => ({
    blobs: [...store.entries()]
      .filter(([p]) => p.startsWith(prefix))
      .map(([p, v]) => ({ pathname: p, url: URL_BASE + p, uploadedAt: new Date(v.uploadedAt).toISOString(), size: v.body.length })),
    hasMore: false,
    cursor: undefined,
  }),
  del: async (t: string | string[]) => {
    for (const u of Array.isArray(t) ? t : [t]) {
      const p = u.startsWith(URL_BASE) ? u.slice(URL_BASE.length) : u;
      store.delete(p);
    }
  },
  head: async () => null,
}));

vi.mock('fs', () => {
  const stub = {
    existsSync: () => false,
    readFileSync: () => {
      throw new Error('ENOENT');
    },
    writeFileSync: () => {},
    mkdirSync: () => {},
  };
  return { default: stub, ...stub };
});

function installFetch() {
  globalThis.fetch = (async (input: unknown) => {
    const u = String(input).split('?')[0];
    const p = u.startsWith(URL_BASE) ? u.slice(URL_BASE.length) : u;
    const rec = store.get(p);
    if (!rec) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => JSON.parse(rec.body) };
  }) as typeof fetch;
}

type Rec = { id: string; title?: string; _rev?: number; _mt?: number };
const FILE = 'faq'; // outbox/tombstone 비대상 — 버저닝 로직만 관찰

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

beforeAll(() => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  process.env.BLOB_DATA_PREFIX = 'testdb';
  installFetch();
});

beforeEach(async () => {
  vi.resetModules();
  store.clear();
  seq = 0;
  db = await import('@/lib/db');
});

async function readBack(): Promise<Rec[]> {
  return await db.readDataUncached(FILE);
}
function byId(rows: Rec[], id: string): Rec {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new Error(`record ${id} not found`);
  return r;
}

describe('record versioning (_rev/_mt)', () => {
  it('신규 레코드는 _rev=1 로 스탬프된다', async () => {
    await db.writeDataMerged(FILE, [{ id: 'a', title: '초판' }]);
    const a = byId(await readBack(), 'a');
    expect(a._rev).toBe(1);
    expect(typeof a._mt).toBe('number');
  });

  it('정상 편집(최신 base)은 적용되고 _rev 가 증가한다', async () => {
    await db.writeDataMerged(FILE, [{ id: 'a', title: '초판' }]);
    const base = await readBack();
    const edited = base.map((r) => (r.id === 'a' ? { ...r, title: '수정판' } : r));
    await db.writeDataMerged(FILE, edited);
    const a = byId(await readBack(), 'a');
    expect(a.title).toBe('수정판');
    expect(a._rev).toBe(2);
  });

  it('newest-wins: stale base 배열 쓰기가 다른 writer 의 최신 편집을 되돌리지 못한다', async () => {
    // 초판 저장 → 두 writer 가 같은 base 를 읽음
    await db.writeDataMerged(FILE, [
      { id: 'a', title: '초판A' },
      { id: 'b', title: '초판B' },
    ]);
    const staleBase = await readBack(); // writer2 의 낡은 스냅샷

    // writer1: a 를 편집·저장 (blob 의 a 가 최신본이 됨)
    const w1 = staleBase.map((r) => (r.id === 'a' ? { ...r, title: 'writer1 편집' } : r));
    await db.writeDataMerged(FILE, w1);

    // writer2: 낡은 base 로 b 만 편집해 전체 배열 저장 —
    // 종전(last-writer-wins)이라면 a 가 초판A 로 되돌아간다(유실).
    const w2 = staleBase.map((r) => (r.id === 'b' ? { ...r, title: 'writer2 편집' } : r));
    await db.writeDataMerged(FILE, w2);

    const rows = await readBack();
    expect(byId(rows, 'a').title).toBe('writer1 편집'); // 보존 (핵심 불변식)
    expect(byId(rows, 'b').title).toBe('writer2 편집'); // writer2 의 편집도 적용
  });

  it('내용 무변경 레코드는 _mt/_rev 가 바뀌지 않는다 (churn 방지)', async () => {
    await db.writeDataMerged(FILE, [{ id: 'a', title: '고정' }]);
    const before = byId(await readBack(), 'a');
    await db.writeDataMerged(FILE, await readBack()); // 그대로 재저장
    const after = byId(await readBack(), 'a');
    expect(after._mt).toBe(before._mt);
    expect(after._rev).toBe(before._rev);
  });

  it('레거시(스탬프 없음) 레코드는 종전 동작(writer 승) — 무회귀', async () => {
    // 스탬프 없는 기존 데이터를 blob 에 직접 심는다 (writeData 는 merge 없이 기록)
    await db.writeData(FILE, [{ id: 'a', title: '레거시' }]);
    // 레거시 클라이언트: 스탬프 없는 편집본 저장 → writer 가 이긴다
    await db.writeDataMerged(FILE, [{ id: 'a', title: '레거시 편집' }]);
    const a = byId(await readBack(), 'a');
    expect(a.title).toBe('레거시 편집');
    expect(a._rev).toBe(1); // 첫 스탬프
  });

  it('stripRecordMeta: 클라이언트 왕복 메타를 제거한다', async () => {
    const body = { id: 'a', title: '폼 저장', _rev: 3, _mt: 123 };
    const stripped = db.stripRecordMeta(body);
    expect(stripped).toEqual({ id: 'a', title: '폼 저장' });
    // 원본은 불변
    expect(body._rev).toBe(3);
  });
});
