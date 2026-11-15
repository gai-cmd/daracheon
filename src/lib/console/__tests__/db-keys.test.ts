import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// SPEC-CONSOLE-001 M3: console-people is keyed by email and console-secrets by itemId in db.ts
// FILE_KEY, so merged writes keep concurrent records and removedIds really remove (design.md §5.4).
// Same in-memory Blob harness as src/lib/__tests__/db-concurrency.test.ts.

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

const sealed = { v: 1, kv: 1, iv: 'iv', tag: 'tag', ct: 'ct' };
const secret = (itemId: string) => ({ itemId, password: sealed, updatedAt: '2026-11-15T00:00:00.000Z', updatedBy: 'x' });
const person = (email: string) => ({ email, name: email, name_en: '', team: '공통' });

describe('console document keys', () => {
  it('console-secrets: a stale writer keeps a concurrently added record (merge by itemId)', async () => {
    await db.writeDataMerged('console-secrets', [secret('A')]);
    await db.writeDataMerged('console-secrets', [secret('A'), secret('B')]);
    await db.writeDataMerged('console-secrets', [secret('A')]);
    const rows = (await db.readDataUncached('console-secrets')) as Array<{ itemId: string }>;
    expect(rows.map((r) => r.itemId).sort()).toEqual(['A', 'B']);
  });

  it('console-secrets: removedIds removes the record instead of reviving it', async () => {
    await db.writeDataMerged('console-secrets', [secret('A'), secret('B')]);
    await db.writeDataMerged('console-secrets', [secret('B')], { removedIds: ['A'] });
    const rows = (await db.readDataUncached('console-secrets')) as Array<{ itemId: string }>;
    expect(rows.map((r) => r.itemId)).toEqual(['B']);
  });

  it('console-people: keyed by email (merge and removal)', async () => {
    await db.writeDataMerged('console-people', [person('a@try-n.com')]);
    await db.writeDataMerged('console-people', [person('a@try-n.com'), person('b@try-n.com')]);
    await db.writeDataMerged('console-people', [person('a@try-n.com')]);
    let rows = (await db.readDataUncached('console-people')) as Array<{ email: string }>;
    expect(rows.map((r) => r.email).sort()).toEqual(['a@try-n.com', 'b@try-n.com']);

    await db.writeDataMerged('console-people', [person('b@try-n.com')], { removedIds: ['a@try-n.com'] });
    rows = (await db.readDataUncached('console-people')) as Array<{ email: string }>;
    expect(rows.map((r) => r.email)).toEqual(['b@try-n.com']);
  });

  it('console-user-prefs: keyed by email, so two people acknowledging at once both survive (SPEC-CONSOLE-002)', async () => {
    const pref = (email: string) => ({ email, autofillGuide: { version: 1, at: '2026-11-15T00:00:00.000Z' } });
    await db.writeDataMerged('console-user-prefs', [pref('a@try-n.com')]);
    await db.writeDataMerged('console-user-prefs', [pref('b@try-n.com')]);
    const rows = (await db.readDataUncached('console-user-prefs')) as Array<{ email: string }>;
    expect(rows.map((r) => r.email).sort()).toEqual(['a@try-n.com', 'b@try-n.com']);
  });

  it('console documents are not tombstoned: a removed id can be imported again', async () => {
    await db.writeDataMerged('console-secrets', [secret('A')]);
    await db.writeDataMerged('console-secrets', [], { removedIds: ['A'] });
    await db.writeDataMerged('console-secrets', [secret('A')]);
    const rows = (await db.readDataUncached('console-secrets')) as Array<{ itemId: string }>;
    expect(rows.map((r) => r.itemId)).toEqual(['A']);
  });
});
