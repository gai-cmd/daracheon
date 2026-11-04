import { beforeEach, describe, expect, it, vi } from 'vitest';

// 이력 API — 목록·단건 조회·복원(새 버전 생성)·인증·CSRF.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);
vi.mock('@/lib/audit', () => ({ logAdmin: vi.fn(async () => {}) }));

import { logAdmin } from '@/lib/audit';
import {
  buildRequest,
  ctx,
  emptyDocBody,
  failures,
  mem,
  resetMemDb,
  sessionToken,
} from '@/lib/detail-edits/__tests__/test-helpers';
import { PUT } from '../../route';
import { GET, POST } from '../route';

const SLUG = 's2_check';
const HISTORY_URL = `https://zoellife.com/api/admin/detail-edits/${SLUG}/history`;

async function save(baseVersion: number, label: string, token?: string) {
  const res = await PUT(
    buildRequest(`https://zoellife.com/api/admin/detail-edits/${SLUG}`, {
      method: 'PUT',
      token: token ?? (await sessionToken()),
      body: {
        baseVersion,
        note: `노트 ${label}`,
        doc: { ...emptyDocBody(), texts: [{ k: 't:ab12cd:0', o: 'x', html: `<b>${label}</b>` }] },
      },
    }),
    ctx(SLUG),
  );
  expect(res.status).toBe(200);
  return res.json();
}

const historyGet = async (query = '', token?: string | null) =>
  GET(buildRequest(`${HISTORY_URL}${query}`, { token: token === undefined ? await sessionToken() : token }), ctx(SLUG));

async function restore(body: unknown, opts: { token?: string | null; origin?: string | null; slug?: string; rawBody?: string } = {}) {
  return POST(
    buildRequest(HISTORY_URL, {
      method: 'POST',
      token: opts.token === undefined ? await sessionToken() : opts.token,
      origin: opts.origin,
      body,
      rawBody: opts.rawBody,
    }),
    ctx(opts.slug ?? SLUG),
  );
}

beforeEach(() => {
  resetMemDb();
  vi.mocked(logAdmin).mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /history', () => {
  it('인증 없으면 401, 알 수 없는 슬러그면 404', async () => {
    expect((await historyGet('', null)).status).toBe(401);
    expect((await GET(buildRequest(HISTORY_URL, { token: await sessionToken() }), ctx('nope'))).status).toBe(404);
  });

  it('이력이 없으면 빈 목록', async () => {
    const res = await historyGet();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ success: true, versions: [] });
  });

  it('최신순 목록: version·updatedAt·updatedBy·note·counts (doc 은 없다)', async () => {
    await save(0, 'one', await sessionToken('a@try-n.com'));
    await save(1, 'two', await sessionToken('b@try-n.com'));
    const { versions } = await (await historyGet()).json();
    expect(versions.map((v: { version: number }) => v.version)).toEqual([2, 1]);
    expect(versions[0]).toMatchObject({
      version: 2,
      updatedBy: 'b@try-n.com',
      note: '노트 two',
      counts: { texts: 1, images: 0, bgs: 0, hidden: 0, layout: 0 },
    });
    expect(typeof versions[0].updatedAt).toBe('string');
    expect(versions[0]).not.toHaveProperty('doc');
  });

  it('?version=N 은 doc 을 포함한 단건, 없으면 404', async () => {
    await save(0, 'one');
    const ok = await historyGet('?version=1');
    expect(ok.status).toBe(200);
    const { entry } = await ok.json();
    expect(entry).toMatchObject({ version: 1, note: '노트 one' });
    expect(entry.doc.texts[0].html).toBe('<b>one</b>');

    const missing = await historyGet('?version=9');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ success: false, code: 'NOT_FOUND' });
    expect((await historyGet('?version=0')).status).toBe(404);
  });

  it('version 이 정수가 아니면 400', async () => {
    for (const q of ['?version=abc', '?version=1.5', '?version=-1', '?version=', '?version=1e3', '?version=99999999']) {
      expect((await historyGet(q)).status, q).toBe(400);
    }
  });

  it('저장소 장애는 503', async () => {
    failures.readForWrite = true;
    const res = await historyGet();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('blob down');
  });
});

describe('POST /history — 복원', () => {
  it('해당 버전의 내용을 새 버전으로 저장하고 이력은 보존한다', async () => {
    await save(0, 'one');
    await save(1, 'two');
    await save(2, 'three');

    const res = await restore({ version: 1, baseVersion: 3 });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, version: 4 });

    const current = mem.get(`detail-edits__${SLUG}`) as { version: number; texts: Array<{ html: string }> };
    expect(current.version).toBe(4);
    expect(current.texts[0].html).toBe('<b>one</b>');

    const { versions } = await (await historyGet()).json();
    expect(versions.map((v: { version: number }) => v.version)).toEqual([4, 3, 2, 1]);
    expect(versions[0].note).toBe('v1 복원');
    // 감사 로그
    expect(logAdmin).toHaveBeenLastCalledWith(
      'settings',
      'update',
      expect.objectContaining({ meta: expect.objectContaining({ restoredFrom: 1, version: 4 }) }),
    );
  });

  it('낡은 baseVersion → 409 + currentVersion, 없는 버전 → 404', async () => {
    await save(0, 'one');
    const conflict = await restore({ version: 1, baseVersion: 0 });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ code: 'VERSION_CONFLICT', currentVersion: 1 });

    const missing = await restore({ version: 7, baseVersion: 1 });
    expect(missing.status).toBe(404);
  });

  it('인증 없음 401 / 교차 사이트 403 / Origin 없음 403 / 알 수 없는 슬러그 404', async () => {
    await save(0, 'one');
    expect((await restore({ version: 1, baseVersion: 1 }, { token: null })).status).toBe(401);
    expect((await restore({ version: 1, baseVersion: 1 }, { origin: 'https://evil.test' })).status).toBe(403);
    expect((await restore({ version: 1, baseVersion: 1 }, { origin: 'https://daeracheon-detail-concepts.vercel.app' })).status).toBe(403);
    expect((await restore({ version: 1, baseVersion: 1 }, { origin: null })).status).toBe(403);
    expect((await restore({ version: 1, baseVersion: 1 }, { slug: 'index' })).status).toBe(404);
    expect((mem.get(`detail-edits__${SLUG}`) as { version: number }).version).toBe(1);
  });

  it('본문 검증: 깨진 JSON·타입 오류·알 수 없는 속성 → 400', async () => {
    await save(0, 'one');
    expect((await restore(undefined, { rawBody: '{' })).status).toBe(400);
    for (const body of [{}, { version: 1 }, { version: '1', baseVersion: 1 }, { version: 0, baseVersion: 1 }, { version: 1, baseVersion: 1, doc: {} }, []]) {
      expect((await restore(body)).status, JSON.stringify(body)).toBe(400);
    }
    expect((await restore(undefined, { rawBody: JSON.stringify({ version: 1, baseVersion: 1, pad: 'x'.repeat(9000) }) })).status).toBe(413);
  });

  it('복원 후 다시 복원해도 이력은 계속 쌓인다 (비파괴)', async () => {
    await save(0, 'one');
    await save(1, 'two');
    await restore({ version: 1, baseVersion: 2 }); // v3 = one
    await restore({ version: 2, baseVersion: 3 }); // v4 = two
    const { versions } = await (await historyGet()).json();
    expect(versions.map((v: { version: number }) => v.version)).toEqual([4, 3, 2, 1]);
    expect((mem.get(`detail-edits__${SLUG}`) as { texts: Array<{ html: string }> }).texts[0].html).toBe('<b>two</b>');
  });

  it('저장소 쓰기 장애는 503', async () => {
    await save(0, 'one');
    failures.write = true;
    const res = await restore({ version: 1, baseVersion: 1 });
    expect(res.status).toBe(503);
  });
});
