import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

/**
 * db.ts 동시성/내구성 불변식 테스트.
 *
 * outbox·tombstone·reconcile 는 `hasBlob=true`(운영 Blob 모드)에서만 작동한다.
 * 과거 2회 데이터 유실(2026-06-07 inquiries 등)이 정확히 이 경로에서 났고 무검증
 * 이었다. 인메모리 Blob 스토어 + next/cache·fs 목으로 운영 모드를 재현해, 병합·
 * 부활 차단·유실 복원의 핵심 불변식을 고정한다.
 *
 * env 는 db.ts 가 import 시점에 hasBlob 을 상수로 캐치하므로 beforeAll 에서
 * 먼저 세팅하고, 테스트마다 resetModules 로 모듈 내부 상태(LKG)를 초기화한다.
 */

const URL_BASE = 'https://blob.test/';
// pathname -> { body, uploadedAt(ms) }
const store = new Map<string, { body: string; uploadedAt: number }>();
let seq = 0;

vi.mock('next/cache', () => ({
  // 캐시 없이 통과 — 각 호출이 실제 blob 읽기를 수행하게 한다.
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
  // 시드(data/db/*.json) 간섭 제거 — 시드는 항상 '없음'.
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

// blob 콘텐츠 URL fetch → 인메모리 스토어 조회.
function installFetch() {
  globalThis.fetch = (async (input: unknown) => {
    const u = String(input).split('?')[0];
    const p = u.startsWith(URL_BASE) ? u.slice(URL_BASE.length) : u;
    const rec = store.get(p);
    if (!rec) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => JSON.parse(rec.body) };
  }) as typeof fetch;
}

type Rec = { id: string; v?: number };
const A: Rec = { id: 'a', v: 1 };
const B: Rec = { id: 'b', v: 2 };
const C: Rec = { id: 'c', v: 3 };
const FILE = 'inquiries'; // OUTBOX + TOMBSTONE 대상

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

const ids = (rows: Rec[]) => rows.map((r) => r.id).sort();

describe('db concurrency (blob mode)', () => {
  it('writeDataMerged → read 왕복', async () => {
    await db.writeDataMerged(FILE, [A, B]);
    expect(ids(await db.readDataUncached(FILE))).toEqual(['a', 'b']);
  });

  it('lost-update 방지: stale writer 가 동시 추가분을 지우지 않는다', async () => {
    await db.writeDataMerged(FILE, [A]); // blob=[A]
    await db.writeDataMerged(FILE, [A, B]); // 다른 writer 가 B 추가 → blob=[A,B]
    // stale writer: 자기 next 엔 B 가 없음(옛 스냅샷). merge 가 B 를 보존해야 함.
    await db.writeDataMerged(FILE, [A]);
    expect(ids(await db.readDataUncached(FILE))).toEqual(['a', 'b']);
  });

  it('tombstone: 삭제된 레코드는 stale writer 가 되살릴 수 없다', async () => {
    await db.writeDataMerged(FILE, [A, B]);
    await db.writeDataMerged(FILE, [A], { removedIds: ['b'] }); // B 삭제 + tombstone
    // stale writer 가 B 를 다시 next 에 담아도 tombstone 이 제외한다.
    await db.writeDataMerged(FILE, [A, B]);
    expect(ids(await db.readDataUncached(FILE))).toEqual(['a']);
  });

  it('read 자가치유: tombstone 된 레코드가 배열에 되살아나도 조회에서 제외', async () => {
    await db.writeDataMerged(FILE, [A, B]);
    await db.writeDataMerged(FILE, [A], { removedIds: ['b'] }); // tomb(B)
    // rogue 직접 쓰기(병합/tombstone 무시)로 B 재삽입.
    await db.writeData(FILE, [A, B]);
    // 자가치유 경로(reconcile)가 B 를 걸러낸다.
    expect(ids(await db.readDataUncached(FILE))).toEqual(['a']);
  });

  it('revivedIds: 의도적 재생성은 tombstone 을 뚫고 살아난다', async () => {
    await db.writeDataMerged(FILE, [A, B]);
    await db.writeDataMerged(FILE, [A], { removedIds: ['b'] }); // tomb(B)
    await db.writeDataMerged(FILE, [A, B], { revivedIds: ['b'] }); // B 부활
    expect(ids(await db.readDataUncached(FILE))).toEqual(['a', 'b']);
  });

  it('outbox: 배열에서 사라진 append 는 복원된다', async () => {
    const res = await db.appendData(FILE, C); // outbox 사본 + 배열 write
    expect(res).toEqual({ merged: true });
    // rogue 직접 쓰기로 배열을 비워 C 를 잃게 만든다.
    await db.writeData(FILE, []);
    // reconcile 이 outbox 사본에서 C 를 복원.
    expect(ids(await db.readDataUncached(FILE))).toEqual(['c']);
  });

  it('readDataForWrite: blob NOT_FOUND 인데 이전 데이터 흔적(LKG)이 있으면 stale 베이스 제공을 거부(throw)', async () => {
    await db.writeDataMerged(FILE, [A, B]); // write 가 LKG 를 [A,B] 로 채움
    store.clear(); // blob 소실 시뮬레이션 (전파 지연/blip)
    seq = 0;
    await expect(db.readDataForWrite(FILE)).rejects.toThrow();
  });

  it('readDataForWrite: 진짜 첫 부트스트랩(흔적 없음)만 [] 로 시작', async () => {
    // 아무 것도 없음 + 시드 없음(fs 목) + LKG 없음(resetModules) → []
    expect(await db.readDataForWrite(FILE)).toEqual([]);
  });
});
