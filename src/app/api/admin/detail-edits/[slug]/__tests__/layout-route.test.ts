import { beforeEach, describe, expect, it, vi } from 'vitest';

// 관리자 편집 API — 구역 배치(layout, 부록 A1): 저장·검증(400)·크기(413)·읽기·초기화·감사 로그.
// 저장소는 인메모리 db 목, 감사 로그는 스텁 (운영 Blob·fs 와 무관).

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);
vi.mock('@/lib/audit', () => ({ logAdmin: vi.fn(async () => {}) }));

import { logAdmin } from '@/lib/audit';
import { LIMITS } from '@/lib/detail-edits/schema';
import { __setPurifyLoaderForTests } from '@/lib/detail-edits/sanitize';
import {
  buildRequest,
  ctx,
  emptyDocBody,
  mem,
  resetMemDb,
  sessionToken,
} from '@/lib/detail-edits/__tests__/test-helpers';
import { GET, PUT } from '../route';

const SLUG = 's7_black';
const URL_ = `https://zoellife.com/api/admin/detail-edits/${SLUG}`;
const S1 = 's:ab12cd:0';
const S2 = 's:cd34ef:0';

const LAYOUT = {
  sequence: [{ k: S1 }, { c: 'c1' }, { k: S2 }],
  clones: [{ id: 'c1', of: S1 }],
  gaps: [{ k: S1, top: 24, bottom: null }],
  secbg: [{ k: 'c1', color: '#102030' }],
};
const doc = (extra: Record<string, unknown> = {}) => ({ ...emptyDocBody(), ...extra });
const text = (k: string, html = '<b>x</b>') => ({ k, o: 'orig', html });

async function put(body: unknown, opts: { rawBody?: string } = {}) {
  return PUT(
    buildRequest(URL_, { method: 'PUT', token: await sessionToken(), body, rawBody: opts.rawBody }),
    ctx(SLUG),
  );
}
const adminGet = async () => GET(buildRequest(URL_, { token: await sessionToken() }), ctx(SLUG));
const stored = () => mem.get(`detail-edits__${SLUG}`) as Record<string, unknown> | undefined;

beforeEach(() => {
  resetMemDb();
  vi.mocked(logAdmin).mockClear();
  __setPurifyLoaderForTests(null);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PUT — layout 저장', () => {
  it('복제본 안의 편집(접두 키)까지 포함한 문서를 저장하고 관리자 GET 이 그대로 돌려준다', async () => {
    const body = doc({
      texts: [text('t:ab12cd:1'), text('c1!t:ab12cd:1', '<i>복제본 글</i>')],
      hidden: [{ k: 'c1!s:cd34ef:0', o: 'sec' }],
      layout: LAYOUT,
    });
    const res = await put({ baseVersion: 0, doc: body, note: '배치' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, version: 1 });

    expect(stored()?.layout).toEqual(LAYOUT);
    const got = await (await adminGet()).json();
    expect(got.doc.layout).toEqual(LAYOUT);
    expect(got.doc.texts.map((t: { k: string }) => t.k)).toEqual(['t:ab12cd:1', 'c1!t:ab12cd:1']);
    expect(got.doc.updatedBy).toBe('editor@try-n.com');
  });

  it('layout 없는 저장은 저장 JSON 에 layout 키를 만들지 않는다 (2차 웨이브와 동일)', async () => {
    const res = await put({ baseVersion: 0, doc: doc({ texts: [text('t:ab12cd:1')] }) });
    expect(res.status).toBe(200);
    expect(Object.keys(stored() ?? {})).toEqual(['schema', 'page', 'version', 'updatedAt', 'updatedBy', 'texts', 'images', 'bgs', 'hidden']);
  });

  it('초기화 — 네 배열과 layout 의 모든 배열이 빈 문서도 저장된다', async () => {
    await put({ baseVersion: 0, doc: doc({ layout: LAYOUT }) });
    const res = await put({
      baseVersion: 1,
      doc: doc({ layout: { sequence: [], clones: [], gaps: [], secbg: [] } }),
      note: '원본으로',
    });
    expect(res.status).toBe(200);
    expect(stored()).toMatchObject({ version: 2, texts: [], layout: { sequence: [], clones: [], gaps: [], secbg: [] } });
  });

  it('감사 로그 counts 에 layout 항목 수가 들어간다', async () => {
    await put({ baseVersion: 0, doc: doc({ layout: LAYOUT }) });
    expect(logAdmin).toHaveBeenCalledWith(
      'settings',
      'update',
      expect.objectContaining({
        meta: expect.objectContaining({ counts: { texts: 0, images: 0, bgs: 0, hidden: 0, layout: 6 } }),
      }),
    );
  });

  it('텍스트 html 정제는 복제본 안의 글에도 똑같이 적용된다', async () => {
    const res = await put({
      baseVersion: 0,
      doc: doc({
        texts: [text('c1!t:ab12cd:1', '<b onclick="x()">굵게</b><script>alert(1)</script>')],
        layout: { sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }] },
      }),
    });
    expect(res.status).toBe(200);
    const html = (stored()?.texts as Array<{ html: string }>)[0].html;
    expect(html).not.toMatch(/onclick|<script|alert/i);
    expect(html).toContain('굵게');
  });
});

describe('PUT — layout 검증 (400 INVALID, 아무것도 저장하지 않는다)', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['알 수 없는 layout 속성', { layout: { ...LAYOUT, extra: 1 } }],
    ['sequence 항목이 k·c 둘 다', { layout: { sequence: [{ k: S1, c: 'c1' }], clones: [{ id: 'c1', of: S1 }] } }],
    ['sequence 항목이 비어 있음', { layout: { sequence: [{}] } }],
    ['sequence 의 k 가 구역 키가 아님', { layout: { sequence: [{ k: 't:ab12cd:0' }] } }],
    ['sequence 중복 항목', { layout: { sequence: [{ k: S1 }, { k: S1 }] } }],
    ['sequence 의 c 가 clones 에 없음', { layout: { sequence: [{ c: 'c5' }] } }],
    ['복제본이 sequence 에 없음', { layout: { sequence: [{ k: S1 }], clones: [{ id: 'c1', of: S1 }] } }],
    ['clones 의 id 형식', { layout: { sequence: [{ c: 'c1000' }], clones: [{ id: 'c1000', of: S1 }] } }],
    ['복제본의 복제본(of 가 cN)', { layout: { sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: 'c2' }] } }],
    ['clones id 중복', { layout: { sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }, { id: 'c1', of: S2 }] } }],
    ['gap 이 401px', { layout: { gaps: [{ k: S1, top: 401 }] } }],
    ['gap 이 음수', { layout: { gaps: [{ k: S1, bottom: -1 }] } }],
    ['gap 이 소수', { layout: { gaps: [{ k: S1, top: 1.5 }] } }],
    ['gap 항목 중복', { layout: { gaps: [{ k: S1, top: 1 }, { k: S1, top: 2 }] } }],
    ['secbg 색 형식', { layout: { secbg: [{ k: S1, color: 'red' }] } }],
    ['secbg 색 3자리', { layout: { secbg: [{ k: S1, color: '#123' }] } }],
    ['접두 키인데 복제본이 없음 (layout 없음)', { texts: [text('c1!t:ab12cd:1')] }],
    ['접두 키인데 복제본이 없음 (다른 복제본만 있음)', { images: [{ k: 'c1!i:ab12cd:1', o: 'a.jpg' }], layout: { sequence: [{ c: 'c2' }], clones: [{ id: 'c2', of: S1 }] } }],
    ['hidden 접두 키 / 복제본 없음', { hidden: [{ k: 'c3!s:ab12cd:0', o: 's' }] }],
    ['bgs 접두 키 / 복제본 없음', { bgs: [{ k: 'c3!b:ab12cd:0', o: 'u' }] }],
  ];

  it.each(cases)('%s', async (_name, extra) => {
    const res = await put({ baseVersion: 0, doc: doc(extra) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toMatchObject({ success: false, code: 'INVALID' });
    expect(Array.isArray(json.issues)).toBe(true);
    expect(json.issues.length).toBeGreaterThan(0);
    expect(mem.size).toBe(0);
    expect(logAdmin).not.toHaveBeenCalled();
  });

  it('issues 경로가 어느 항목이 문제인지 알려 준다', async () => {
    const res = await put({ baseVersion: 0, doc: doc({ layout: { sequence: [{ k: S1 }, { c: 'c5' }] } }) });
    const json = await res.json();
    expect(json.issues).toEqual(
      expect.arrayContaining([{ path: 'doc.layout.sequence.1.c', message: '존재하지 않는 복제본입니다.' }]),
    );
  });

  it('한도: sequence 201 / clones 41 / gaps 201 / secbg 201 → 400', async () => {
    const seq = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}` }));
    const gaps = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}`, top: 1 }));
    const bgs = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}`, color: '#102030' }));
    const cl = (n: number) => ({
      sequence: Array.from({ length: n }, (_, i) => ({ c: `c${i}` })),
      clones: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, of: S1 })),
    });
    const over = [
      { sequence: seq(LIMITS.layoutSequence + 1) },
      cl(LIMITS.layoutClones + 1),
      { gaps: gaps(LIMITS.layoutGaps + 1) },
      { secbg: bgs(LIMITS.layoutSecbg + 1) },
    ];
    for (const layout of over) {
      expect((await put({ baseVersion: 0, doc: doc({ layout }) })).status, JSON.stringify(Object.keys(layout))).toBe(400);
    }
    // 한도 딱 맞는 값은 통과
    const edge = { ...cl(LIMITS.layoutClones), gaps: gaps(LIMITS.layoutGaps), secbg: bgs(LIMITS.layoutSecbg) };
    expect((await put({ baseVersion: 0, doc: doc({ layout: edge }) })).status).toBe(200);
  });
});

describe('PUT — layout 과 문서 크기 (413)', () => {
  /** 8000자 글 여러 개 + 마지막 글의 길이를 조절해 "layout 이 없으면 한도 안, 있으면 한도 초과"인 문서를 만든다. */
  function boundaryDoc() {
    const layout = {
      gaps: Array.from({ length: 200 }, (_, i) => ({ k: `s:ab12cd:${i}`, top: 24, bottom: 24 })),
      secbg: Array.from({ length: 200 }, (_, i) => ({ k: `s:cd34ef:${i}`, color: '#102030' })),
    };
    const size = (d: unknown) => Buffer.byteLength(JSON.stringify(d), 'utf8');
    const layoutBytes = size({ ...emptyDocBody(), layout }) - size(emptyDocBody());
    const target = LIMITS.docBytes + 200 - layoutBytes; // layout 이 없으면 한도 안(200바이트 여유), 넣으면 초과
    const texts: Array<ReturnType<typeof text>> = [];
    let i = 0;
    while (size({ ...emptyDocBody(), texts }) < target - 8100) texts.push(text(`t:ab12cd:${i++}`, 'a'.repeat(8000)));
    const rest = target - size({ ...emptyDocBody(), texts: [...texts, text(`t:ab12cd:${i}`, '')] });
    texts.push(text(`t:ab12cd:${i}`, 'a'.repeat(Math.max(0, Math.min(8000, rest)))));
    return { texts, layout };
  }

  it('layout 을 빼면 400KB 안이고 넣으면 넘는 문서 → 넣었을 때만 413', async () => {
    const { texts, layout } = boundaryDoc();
    const without = { ...emptyDocBody(), texts };
    const withIt = { ...without, layout };
    expect(Buffer.byteLength(JSON.stringify(without))).toBeLessThanOrEqual(LIMITS.docBytes);
    expect(Buffer.byteLength(JSON.stringify(withIt))).toBeGreaterThan(LIMITS.docBytes);
    // 본문 전체는 요청 상한(문서 상한 + 봉투 여유) 안쪽이어야 "문서 크기 검사"가 잡는다
    const payload = JSON.stringify({ baseVersion: 0, doc: withIt });
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(LIMITS.bodyBytes);

    const ok = await put({ baseVersion: 0, doc: without });
    expect(ok.status).toBe(200);
    resetMemDb();
    const res = await put(undefined, { rawBody: payload });
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ code: 'TOO_LARGE' });
    expect(mem.size).toBe(0);
  });
});
