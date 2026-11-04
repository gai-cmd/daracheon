import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  bodyBytes,
  countsOf,
  docBodySchema,
  emptyBody,
  emptyPublicDoc,
  parseStoredDoc,
  pickBody,
  putBodySchema,
} from '../schema';

// 구역 배치(layout, 계약 부록 A1) 검증 — 규칙마다 통과 사례와 거절 사례를 한 쌍씩 둔다.

const S1 = 's:ab12cd:0';
const S2 = 's:cd34ef:0';

const text = (k: string) => ({ k, o: 'orig' });
const image = (k: string) => ({ k, o: 'a.jpg' });
const bg = (k: string) => ({ k, o: 'u' });
const hid = (k: string) => ({ k, o: 'section' });

type Layout = Record<string, unknown>;
const withLayout = (layout: Layout, extra: Record<string, unknown> = {}) => ({ ...emptyBody(), ...extra, layout });
const ok = (layout: Layout, extra: Record<string, unknown> = {}) => docBodySchema.safeParse(withLayout(layout, extra)).success;
const issuesOf = (layout: Layout, extra: Record<string, unknown> = {}) => {
  const r = docBodySchema.safeParse(withLayout(layout, extra));
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

/** 계약 부록의 예시 그대로 */
const EXAMPLE = {
  sequence: [{ k: S1 }, { c: 'c1' }, { k: S2 }],
  clones: [{ id: 'c1', of: S1 }],
  gaps: [{ k: S1, top: 24, bottom: null }],
  secbg: [{ k: 'c1', color: '#102030' }],
};

describe('layout — 구조', () => {
  it('부록 A1 의 예시 문서는 통과', () => {
    expect(ok(EXAMPLE)).toBe(true);
  });

  it('layout 은 선택이고 멤버도 전부 선택 — 빈 객체·빈 배열도 통과', () => {
    expect(docBodySchema.safeParse(emptyBody()).success).toBe(true);
    expect(ok({})).toBe(true);
    expect(ok({ sequence: [], clones: [], gaps: [], secbg: [] })).toBe(true);
    expect(ok({ gaps: [{ k: S1, top: 8 }] })).toBe(true);
    expect(ok({ sequence: [{ k: S1 }, { k: S2 }] })).toBe(true);
  });

  it('layout 이 객체가 아니면 거절', () => {
    for (const bad of [null, [], 'x', 7]) {
      expect(docBodySchema.safeParse({ ...emptyBody(), layout: bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('알 수 없는 속성은 모든 단계에서 거절 (strict)', () => {
    expect(ok({ ...EXAMPLE, extra: 1 })).toBe(false);
    expect(ok({ sequence: [{ k: S1, extra: 1 }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1', extra: 1 }], clones: [{ id: 'c1', of: S1 }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1, extra: 1 }] })).toBe(false);
    expect(ok({ gaps: [{ k: S1, top: 1, extra: 1 }] })).toBe(false);
    expect(ok({ secbg: [{ k: S1, color: '#102030', extra: 1 }] })).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), layouts: {} }).success).toBe(false);
  });

  it('own __proto__ 키가 있는 layout 도 거절', () => {
    const polluted = JSON.parse('{"texts":[],"images":[],"bgs":[],"hidden":[],"layout":{"__proto__":{"x":1}}}');
    expect(docBodySchema.safeParse(polluted).success).toBe(false);
  });
});

describe('layout.sequence', () => {
  it('항목은 {k}(원본 구역 키) 또는 {c}(복제본 id) 중 정확히 하나', () => {
    expect(ok({ sequence: [{ k: S1 }] })).toBe(true);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }] })).toBe(true);
    expect(ok({ sequence: [{}] })).toBe(false);
    expect(ok({ sequence: [{ k: S1, c: 'c1' }], clones: [{ id: 'c1', of: S1 }] })).toBe(false);
  });

  it('k 는 접두 없는 구역 키(s:)만 — 글·이미지·배경 키와 복제본 접두 키는 거절', () => {
    expect(ok({ sequence: [{ k: 't:ab12cd:0' }] })).toBe(false);
    expect(ok({ sequence: [{ k: 'i:ab12cd:0' }] })).toBe(false);
    expect(ok({ sequence: [{ k: 'c1!s:ab12cd:0' }], clones: [{ id: 'c1', of: S1 }] })).toBe(false);
    expect(ok({ sequence: [{ k: 'c1' }] })).toBe(false);
    expect(ok({ sequence: [{ k: 's:ab:0' }] })).toBe(false);
  });

  it('c 는 ^c[0-9]{1,3}$ 형식만', () => {
    const clones = (id: string) => [{ id, of: S1 }];
    for (const id of ['c0', 'c1', 'c12', 'c999']) {
      expect(ok({ sequence: [{ c: id }], clones: clones(id) }), id).toBe(true);
    }
    for (const id of ['c', 'c1000', 'C1', 'c-1', 'c1a', ' c1', 'cc1', '']) {
      expect(ok({ sequence: [{ c: id }], clones: clones(id) }), JSON.stringify(id)).toBe(false);
    }
  });

  it('같은 항목이 두 번 있으면 거절', () => {
    expect(ok({ sequence: [{ k: S1 }, { k: S2 }] })).toBe(true);
    expect(ok({ sequence: [{ k: S1 }, { k: S1 }] })).toBe(false);
    expect(
      ok({ sequence: [{ c: 'c1' }, { k: S1 }, { c: 'c1' }], clones: [{ id: 'c1', of: S1 }] }),
    ).toBe(false);
  });

  it('{c} 는 clones 에 있는 복제본만 가리킬 수 있다', () => {
    expect(ok({ sequence: [{ c: 'c2' }], clones: [{ id: 'c1', of: S1 }, { id: 'c2', of: S2 }] })).toBe(false); // c1 이 sequence 에 없음
    expect(ok({ sequence: [{ c: 'c9' }] })).toBe(false);
    expect(issuesOf({ sequence: [{ c: 'c9' }] })).toContain('layout.sequence.0.c: 존재하지 않는 복제본입니다.');
  });

  it('한도 200: 200개 통과, 201개 거절', () => {
    const seq = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}` }));
    expect(ok({ sequence: seq(LIMITS.layoutSequence) })).toBe(true);
    expect(ok({ sequence: seq(LIMITS.layoutSequence + 1) })).toBe(false);
  });
});

describe('layout.clones', () => {
  it('id 형식과 of(원본 구역 키)', () => {
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }] })).toBe(true);
    // 복제본의 복제본(of 가 cN)·접두 키·글 키는 거절
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: 'c2' }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: 'c2!s:ab12cd:0' }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: 't:ab12cd:0' }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: '' }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1' }] })).toBe(false);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ of: S1 }] })).toBe(false);
  });

  it('한 구역을 여러 번 복제해도 된다 (id 만 다르면)', () => {
    expect(
      ok({
        sequence: [{ k: S1 }, { c: 'c1' }, { c: 'c2' }],
        clones: [{ id: 'c1', of: S1 }, { id: 'c2', of: S1 }],
      }),
    ).toBe(true);
  });

  it('id 가 겹치면 거절', () => {
    expect(
      ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }, { id: 'c1', of: S2 }] }),
    ).toBe(false);
  });

  it('모든 복제본은 sequence 에 정확히 한 번 있어야 한다', () => {
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }] })).toBe(true);
    expect(ok({ sequence: [], clones: [{ id: 'c1', of: S1 }] })).toBe(false);
    expect(ok({ clones: [{ id: 'c1', of: S1 }] })).toBe(false);
    expect(ok({ sequence: [{ k: S1 }], clones: [{ id: 'c1', of: S1 }] })).toBe(false);
    expect(issuesOf({ sequence: [{ k: S1 }], clones: [{ id: 'c1', of: S1 }] })).toContain(
      'layout.clones.0.id: 복제본이 sequence 에 없습니다.',
    );
    // 두 번 있는 경우는 sequence 중복 규칙에서 걸린다 (위 sequence 절)
  });

  it('한도 40: 40개 통과, 41개 거절', () => {
    const mk = (n: number) => ({
      sequence: Array.from({ length: n }, (_, i) => ({ c: `c${i}` })),
      clones: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, of: S1 })),
    });
    expect(ok(mk(LIMITS.layoutClones))).toBe(true);
    expect(ok(mk(LIMITS.layoutClones + 1))).toBe(false);
  });
});

describe('layout.gaps', () => {
  it('top·bottom 은 0..400 정수 또는 null (경계값 포함)', () => {
    for (const v of [0, 1, 24, 399, 400, null]) {
      expect(ok({ gaps: [{ k: S1, top: v, bottom: v }] }), String(v)).toBe(true);
    }
    for (const v of [-1, 401, 1.5, NaN, Infinity, '24', '', true, [], {}]) {
      expect(ok({ gaps: [{ k: S1, top: v }] }), `top ${String(v)}`).toBe(false);
      expect(ok({ gaps: [{ k: S1, bottom: v }] }), `bottom ${String(v)}`).toBe(false);
    }
  });

  it('top·bottom 을 생략해도 된다 (한쪽만 지정)', () => {
    expect(ok({ gaps: [{ k: S1, top: 12 }] })).toBe(true);
    expect(ok({ gaps: [{ k: S1, bottom: 12 }] })).toBe(true);
    expect(ok({ gaps: [{ k: S1, top: null, bottom: null }] })).toBe(true);
  });

  it('k 는 원본 구역 키 또는 복제본 id', () => {
    expect(ok({ gaps: [{ k: S1, top: 1 }] })).toBe(true);
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }], gaps: [{ k: 'c1', top: 1 }] })).toBe(true);
    for (const k of ['t:ab12cd:0', 'c1!s:ab12cd:0', 'x', '', 'c1000', 's:ab:0']) {
      expect(ok({ gaps: [{ k, top: 1 }] }), JSON.stringify(k)).toBe(false);
    }
    expect(ok({ gaps: [{ top: 1 }] })).toBe(false);
  });

  it('없는 복제본을 가리키거나 같은 항목이 두 번이면 거절', () => {
    expect(ok({ gaps: [{ k: 'c3', top: 1 }] })).toBe(false);
    expect(ok({ gaps: [{ k: S1, top: 1 }, { k: S1, bottom: 2 }] })).toBe(false);
    expect(ok({ gaps: [{ k: S1, top: 1 }, { k: S2, top: 2 }] })).toBe(true);
  });

  it('한도 200', () => {
    const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}`, top: 1 }));
    expect(ok({ gaps: mk(LIMITS.layoutGaps) })).toBe(true);
    expect(ok({ gaps: mk(LIMITS.layoutGaps + 1) })).toBe(false);
  });
});

describe('layout.secbg', () => {
  it('color 는 #RRGGBB (대소문자 모두)', () => {
    for (const color of ['#102030', '#ABCDEF', '#abcdef', '#0a1B2c']) {
      expect(ok({ secbg: [{ k: S1, color }] }), color).toBe(true);
    }
    for (const color of ['#123', '#12345', '#1234567', '102030', '#10203g', 'red', 'rgb(1,2,3)', '#102030;x', ' #102030', '#102030\n', '', null, 5]) {
      expect(ok({ secbg: [{ k: S1, color }] }), JSON.stringify(color)).toBe(false);
    }
    expect(ok({ secbg: [{ k: S1 }] })).toBe(false);
  });

  it('k 는 원본 구역 키 또는 존재하는 복제본 id, 중복 금지', () => {
    expect(ok({ sequence: [{ c: 'c1' }], clones: [{ id: 'c1', of: S1 }], secbg: [{ k: 'c1', color: '#102030' }] })).toBe(true);
    expect(ok({ secbg: [{ k: 'c1', color: '#102030' }] })).toBe(false);
    expect(ok({ secbg: [{ k: 't:ab12cd:0', color: '#102030' }] })).toBe(false);
    expect(ok({ secbg: [{ k: S1, color: '#102030' }, { k: S1, color: '#ffffff' }] })).toBe(false);
  });

  it('한도 200', () => {
    const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ k: `s:ab12cd:${i}`, color: '#102030' }));
    expect(ok({ secbg: mk(LIMITS.layoutSecbg) })).toBe(true);
    expect(ok({ secbg: mk(LIMITS.layoutSecbg + 1) })).toBe(false);
  });
});

describe('편집 키 — cN! 접두', () => {
  const clonedLayout = { sequence: [{ k: S1 }, { c: 'c1' }], clones: [{ id: 'c1', of: S1 }] };

  it('새 키 정규식: 접두 없는 키와 cN! 접두 키 모두 통과', () => {
    for (const k of ['t:ab12cd:0', 'c1!t:ab12cd:0', 'c12!t:0123456789abcdef:9999', 'c999!t:ab12:7']) {
      const layout = { sequence: [{ c: k.split('!')[0] }], clones: [{ id: k.split('!')[0], of: S1 }] };
      const doc = k.includes('!') ? withLayout(layout, { texts: [text(k)] }) : { ...emptyBody(), texts: [text(k)] };
      expect(docBodySchema.safeParse(doc).success, k).toBe(true);
    }
  });

  it('잘못된 접두·형식은 거절', () => {
    for (const k of ['c!t:ab12cd:0', 'c1000!t:ab12cd:0', 'C1!t:ab12cd:0', 'c1!!t:ab12cd:0', 'c1!c2!t:ab12cd:0', 'c1t:ab12cd:0', 'c1!x:ab12cd:0', 'c1!t:ab:0', '!t:ab12cd:0', 'c1! t:ab12cd:0', 'c1!t:ab12cd:0\n']) {
      expect(docBodySchema.safeParse(withLayout(clonedLayout, { texts: [text(k)] })).success, JSON.stringify(k)).toBe(false);
    }
  });

  it('texts·images·bgs·hidden 네 배열 모두 접두 키를 받는다', () => {
    expect(
      docBodySchema.safeParse(
        withLayout(clonedLayout, {
          texts: [text('c1!t:ab12cd:0')],
          images: [image('c1!i:ab12cd:0')],
          bgs: [bg('c1!b:ab12cd:0')],
          hidden: [hid('c1!s:ab12cd:0')],
        }),
      ).success,
    ).toBe(true);
  });

  it('접두 키의 복제본이 없으면 네 배열 모두 거절 (layout 이 아예 없을 때 포함)', () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['texts', { texts: [text('c1!t:ab12cd:0')] }],
      ['images', { images: [image('c1!i:ab12cd:0')] }],
      ['bgs', { bgs: [bg('c1!b:ab12cd:0')] }],
      ['hidden', { hidden: [hid('c1!s:ab12cd:0')] }],
    ];
    for (const [name, extra] of cases) {
      // layout 없음
      expect(docBodySchema.safeParse({ ...emptyBody(), ...extra }).success, `${name} / layout 없음`).toBe(false);
      // layout 은 있지만 다른 복제본만 있음
      expect(docBodySchema.safeParse(withLayout({ sequence: [{ c: 'c2' }], clones: [{ id: 'c2', of: S1 }] }, extra)).success, `${name} / c2 만`).toBe(false);
      // 복제본 목록이 비어 있음
      expect(docBodySchema.safeParse(withLayout({ sequence: [{ k: S1 }] }, extra)).success, `${name} / clones 없음`).toBe(false);
    }
    expect(
      issuesOf({ sequence: [{ k: S1 }] }, { texts: [text('c1!t:ab12cd:0')] }),
    ).toContain('texts.0.k: 존재하지 않는 복제본의 키입니다.');
  });

  it('같은 배열에서 접두 키와 원본 키는 서로 다른 키다 (중복이 아니다)', () => {
    expect(
      docBodySchema.safeParse(withLayout(clonedLayout, { texts: [text('t:ab12cd:0'), text('c1!t:ab12cd:0')] })).success,
    ).toBe(true);
    expect(
      docBodySchema.safeParse(withLayout(clonedLayout, { texts: [text('c1!t:ab12cd:0'), text('c1!t:ab12cd:0')] })).success,
    ).toBe(false);
  });

  it('접두 없는 키는 layout 과 무관하게 통과 (2차 웨이브 호환)', () => {
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [text('t:ab12cd:0')], hidden: [hid('s:ab12cd:0')] }).success).toBe(true);
  });
});

describe('PUT 본문과 크기', () => {
  it('putBodySchema 가 doc.layout 을 받는다', () => {
    const parsed = putBodySchema.safeParse({ baseVersion: 0, note: 'n', doc: withLayout(EXAMPLE) });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.doc.layout).toEqual(EXAMPLE);
  });

  it('bodyBytes 는 layout 을 포함한다', () => {
    const plain = emptyBody();
    const withIt = { ...emptyBody(), layout: EXAMPLE };
    expect(bodyBytes(withIt)).toBe(Buffer.byteLength(JSON.stringify(withIt), 'utf8'));
    expect(bodyBytes(withIt)).toBeGreaterThan(bodyBytes(plain));
  });

  it('layout 이 없는 문서의 직렬화는 2차 웨이브 형태와 바이트 단위로 같다', () => {
    const parsed = docBodySchema.parse({ texts: [text('t:ab12cd:0')], images: [], bgs: [], hidden: [] });
    expect(JSON.stringify(parsed)).toBe('{"texts":[{"k":"t:ab12cd:0","o":"orig"}],"images":[],"bgs":[],"hidden":[]}');
    expect(Object.keys(parsed)).toEqual(['texts', 'images', 'bgs', 'hidden']);
    expect(JSON.stringify(emptyBody())).toBe('{"texts":[],"images":[],"bgs":[],"hidden":[]}');
    expect(JSON.stringify(pickBody(parsed))).toBe(JSON.stringify(parsed));
  });

  it('layout 이 있으면 pickBody 가 마지막 키로 싣는다', () => {
    const doc = docBodySchema.parse(withLayout(EXAMPLE));
    expect(Object.keys(pickBody(doc))).toEqual(['texts', 'images', 'bgs', 'hidden', 'layout']);
  });
});

describe('countsOf', () => {
  it('layout 이 없으면 0', () => {
    expect(countsOf(emptyBody())).toEqual({ texts: 0, images: 0, bgs: 0, hidden: 0, layout: 0 });
  });
  it('layout 항목 수 = sequence + clones + gaps + secbg 길이의 합', () => {
    const doc = docBodySchema.parse(withLayout(EXAMPLE, { texts: [text('t:ab12cd:0')], hidden: [hid(S1)] }));
    expect(countsOf(doc)).toEqual({ texts: 1, images: 0, bgs: 0, hidden: 1, layout: 3 + 1 + 1 + 1 });
  });
  it('빈 layout(초기화) 도 0', () => {
    const doc = docBodySchema.parse(withLayout({ sequence: [], clones: [], gaps: [], secbg: [] }));
    expect(countsOf(doc).layout).toBe(0);
  });
});

describe('저장 문서 해석 — layout', () => {
  const stored = (extra: Record<string, unknown> = {}) => ({
    schema: 1,
    page: 's7_black',
    version: 4,
    updatedAt: '2026-11-04T08:12:00.000Z',
    updatedBy: 'a@b.test',
    ...emptyBody(),
    ...extra,
  });

  it('layout 이 있는 저장본은 layout 까지 해석한다', () => {
    const doc = parseStoredDoc(stored({ layout: EXAMPLE }), 's7_black');
    expect(doc?.layout).toEqual(EXAMPLE);
  });

  it('layout 이 없는 저장본(2차 웨이브)은 그대로 유효하고 layout 키가 생기지 않는다', () => {
    const doc = parseStoredDoc(stored(), 's7_black');
    expect(doc).not.toBeNull();
    expect(doc).not.toHaveProperty('layout');
    expect(Object.keys(doc!)).toEqual(['schema', 'page', 'version', 'updatedAt', 'updatedBy', 'texts', 'images', 'bgs', 'hidden']);
  });

  it('규칙을 어기는 저장본은 null (공개 읽기가 원본으로 보이게 하는 fail-open 경로)', () => {
    expect(parseStoredDoc(stored({ layout: { sequence: [{ c: 'c1' }] } }), 's7_black')).toBeNull();
    expect(parseStoredDoc(stored({ layout: 'x' }), 's7_black')).toBeNull();
    expect(parseStoredDoc(stored({ texts: [text('c1!t:ab12cd:0')] }), 's7_black')).toBeNull();
  });

  it('빈 공개 문서에는 layout 키가 없다', () => {
    expect(emptyPublicDoc('s7_black')).not.toHaveProperty('layout');
    expect(JSON.stringify(emptyPublicDoc('s7_black'))).toBe(
      '{"schema":1,"page":"s7_black","version":0,"updatedAt":null,"texts":[],"images":[],"bgs":[],"hidden":[]}',
    );
  });
});
