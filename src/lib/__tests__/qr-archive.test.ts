import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

/**
 * qr-archive.ts 불변식 테스트.
 *
 * 핵심 보증 3가지를 고정한다:
 *  1) 월 롤업 — 현재+직전 월 events, coupons/serials 전량이 _qr-archive/ 로 합쳐진다
 *  2) poison 방지 — 레코드 fetch 실패 시 해당 아카이브를 덮어쓰지 않는다 (기존본 보존)
 *  3) 빈 대상 스킵 — 레코드 0개인 대상은 빈 아카이브를 만들지 않는다
 */

const URL_BASE = 'https://blob.test/';
const store = new Map<string, string>();
// fetch 실패를 주입할 pathname 집합
const failPaths = new Set<string>();

vi.mock('@vercel/blob', () => ({
  put: async (pathname: string, body: string) => {
    store.set(pathname, body);
    return { url: URL_BASE + pathname, pathname };
  },
  list: async ({ prefix }: { prefix: string }) => ({
    blobs: [...store.keys()]
      .filter((p) => p.startsWith(prefix))
      .map((p) => ({ pathname: p, url: URL_BASE + p, size: store.get(p)!.length })),
    hasMore: false,
    cursor: undefined,
  }),
}));

const PREFIX = 'testprefix';
const NOW = new Date('2026-07-15T00:00:00Z');

async function loadModule() {
  vi.resetModules();
  return await import('../qr-archive');
}

beforeAll(() => {
  process.env.BLOB_DATA_PREFIX = PREFIX;
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const u = String(input);
    const path = u.slice(URL_BASE.length).split('?')[0];
    if (failPaths.has(path) || !store.has(path)) {
      return { ok: false, status: 500, json: async () => ({}) } as Response;
    }
    return { ok: true, status: 200, json: async () => JSON.parse(store.get(path)!) } as Response;
  });
});

beforeEach(() => {
  store.clear();
  failPaths.clear();
});

function seed(path: string, body: unknown) {
  store.set(`${PREFIX}/${path}`, JSON.stringify(body));
}

describe('archiveQrRecords', () => {
  it('현재+직전 월 events 와 coupons 를 월 롤업으로 아카이브한다', async () => {
    seed('qr-events/2026-07/pageview/a1.json', { id: 'a1', type: 'pageview' });
    seed('qr-events/2026-07/consent/a2.json', { id: 'a2', type: 'consent' });
    seed('qr-events/2026-06/pageview/b1.json', { id: 'b1', type: 'pageview' });
    seed('qr-events/2026-01/pageview/old.json', { id: 'old' }); // 과거 월 — 대상 아님
    seed('qr-coupons/CODE1.json', { code: 'CODE1' });

    const { archiveQrRecords } = await loadModule();
    const result = await archiveQrRecords(NOW);

    expect(result).not.toBeNull();
    expect(result!.ok).toBe(true);
    expect(result!.archived).toEqual({ 'events-2026-06': 1, 'events-2026-07': 2, coupons: 1 });

    const july = JSON.parse(store.get(`${PREFIX}/_qr-archive/events-2026-07.json`)!);
    expect(july.count).toBe(2);
    expect(july.records['qr-events/2026-07/pageview/a1.json']).toEqual({ id: 'a1', type: 'pageview' });
    // 과거 월(1월)은 아카이브가 생기지 않는다
    expect(store.has(`${PREFIX}/_qr-archive/events-2026-01.json`)).toBe(false);
  });

  it('poison 방지 — fetch 실패한 대상은 기존 아카이브를 덮어쓰지 않는다', async () => {
    // 직전 실행이 남긴 완전한 아카이브
    store.set(
      `${PREFIX}/_qr-archive/events-2026-07.json`,
      JSON.stringify({ version: 1, count: 5, records: { keep: true } })
    );
    seed('qr-events/2026-07/pageview/a1.json', { id: 'a1' });
    seed('qr-events/2026-07/pageview/a2.json', { id: 'a2' });
    failPaths.add(`${PREFIX}/qr-events/2026-07/pageview/a2.json`);

    const { archiveQrRecords } = await loadModule();
    const result = await archiveQrRecords(NOW);

    expect(result!.ok).toBe(false);
    expect(result!.degraded).toContain('events-2026-07');
    // 기존 완전본이 그대로 보존된다
    const preserved = JSON.parse(store.get(`${PREFIX}/_qr-archive/events-2026-07.json`)!);
    expect(preserved.count).toBe(5);
    expect(preserved.records.keep).toBe(true);
  });

  it('빈 대상(serials 0개)은 빈 아카이브를 만들지 않는다', async () => {
    seed('qr-coupons/CODE1.json', { code: 'CODE1' });

    const { archiveQrRecords } = await loadModule();
    const result = await archiveQrRecords(NOW);

    expect(result!.ok).toBe(true);
    expect(store.has(`${PREFIX}/_qr-archive/serials.json`)).toBe(false);
    expect(store.has(`${PREFIX}/_qr-archive/coupons.json`)).toBe(true);
  });

  it('blob 미설정이면 no-op null', async () => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { archiveQrRecords } = await loadModule();
    expect(await archiveQrRecords(NOW)).toBeNull();
    process.env.BLOB_READ_WRITE_TOKEN = token;
  });
});
