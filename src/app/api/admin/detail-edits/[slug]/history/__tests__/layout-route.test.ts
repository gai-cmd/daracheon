import { beforeEach, describe, expect, it, vi } from 'vitest';

// 이력 API — 구역 배치(layout, 부록 A1): 목록 counts.layout, 단건 조회, 복원(layout 있음/없음), 초기화 버전.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);
vi.mock('@/lib/audit', () => ({ logAdmin: vi.fn(async () => {}) }));

import {
  buildRequest,
  ctx,
  emptyDocBody,
  mem,
  resetMemDb,
  sessionToken,
} from '@/lib/detail-edits/__tests__/test-helpers';
import { PUT } from '../../route';
import { GET, POST } from '../route';

const SLUG = 's2_check';
const DOC_URL = `https://zoellife.com/api/admin/detail-edits/${SLUG}`;
const HISTORY_URL = `${DOC_URL}/history`;
const S1 = 's:ab12cd:0';

const LAYOUT = {
  sequence: [{ k: S1 }, { c: 'c1' }],
  clones: [{ id: 'c1', of: S1 }],
  gaps: [{ k: S1, top: 24, bottom: null }],
  secbg: [{ k: 'c1', color: '#102030' }],
};
const withLayout = () => ({
  ...emptyDocBody(),
  texts: [{ k: 'c1!t:ab12cd:0', o: 'x', html: '<b>복제본</b>' }],
  layout: LAYOUT,
});

async function save(baseVersion: number, doc: unknown) {
  const res = await PUT(
    buildRequest(DOC_URL, { method: 'PUT', token: await sessionToken(), body: { baseVersion, doc } }),
    ctx(SLUG),
  );
  expect(res.status).toBe(200);
  return res.json();
}
const list = async () => (await GET(buildRequest(HISTORY_URL, { token: await sessionToken() }), ctx(SLUG))).json();
const entry = async (v: number) =>
  (await GET(buildRequest(`${HISTORY_URL}?version=${v}`, { token: await sessionToken() }), ctx(SLUG))).json();
const restore = async (version: number, baseVersion: number) =>
  POST(buildRequest(HISTORY_URL, { method: 'POST', token: await sessionToken(), body: { version, baseVersion } }), ctx(SLUG));
const current = () => mem.get(`detail-edits__${SLUG}`) as Record<string, unknown>;

beforeEach(() => {
  resetMemDb();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('이력 — layout', () => {
  it('목록 counts 에 layout 이 있고(없는 버전은 0), 단건 조회에 layout 이 실린다', async () => {
    await save(0, emptyDocBody());
    await save(1, withLayout());

    const { versions } = await list();
    expect(versions.map((v: { version: number }) => v.version)).toEqual([2, 1]);
    expect(versions[0].counts).toEqual({ texts: 1, images: 0, bgs: 0, hidden: 0, layout: 5 });
    expect(versions[1].counts).toEqual({ texts: 0, images: 0, bgs: 0, hidden: 0, layout: 0 });

    const e2 = await entry(2);
    expect(e2.entry.doc.layout).toEqual(LAYOUT);
    expect(e2.entry.counts.layout).toBe(5);
    expect((await entry(1)).entry.doc).not.toHaveProperty('layout');
  });

  it('layout 이 있는 버전을 복원하면 같은 layout 의 새 버전이 된다', async () => {
    await save(0, withLayout());
    await save(1, emptyDocBody());
    const res = await restore(1, 2);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, version: 3 });
    expect(current().layout).toEqual(LAYOUT);
    expect((await list()).versions[0].counts.layout).toBe(5);
  });

  it('layout 이 없는 버전을 복원하면 layout 이 사라진다 (저장 JSON 에 키도 없다)', async () => {
    await save(0, emptyDocBody());
    await save(1, withLayout());
    expect((await restore(1, 2)).status).toBe(200);
    expect(current()).not.toHaveProperty('layout');
    expect(current().version).toBe(3);
  });

  it('초기화 버전(모든 배열 빈) 뒤에도 이전 layout 버전을 복원할 수 있다', async () => {
    await save(0, withLayout());
    await save(1, { ...emptyDocBody(), layout: { sequence: [], clones: [], gaps: [], secbg: [] } });
    expect((await list()).versions[0].counts).toEqual({ texts: 0, images: 0, bgs: 0, hidden: 0, layout: 0 });
    expect((await restore(1, 2)).status).toBe(200);
    expect(current().layout).toEqual(LAYOUT);
  });
});
