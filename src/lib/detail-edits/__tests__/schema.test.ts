import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LIMITS,
  bodyBytes,
  docBodySchema,
  emptyBody,
  emptyPublicDoc,
  isAllowedAssetSrc,
  parseStoredDoc,
  putBodySchema,
  restoreBodySchema,
} from '../schema';
import { DETAIL_PAGES, DETAIL_SLUGS, displayTitle, getDetailPage, isDetailSlug } from '../pages';

const BLOB = 'https://abc123xyz.public.blob.vercel-storage.com/uploads/detail-concepts/1730000000000-ab12cd34ef.jpg';
const CONCEPT = 'https://daeracheon-detail-concepts.vercel.app/assets/img/a.jpg';

const text = (i: number, extra: Record<string, unknown> = {}) => ({ k: `t:ab12cd:${i}`, o: 'orig', ...extra });
const image = (i: number, extra: Record<string, unknown> = {}) => ({ k: `i:ab12cd:${i}`, o: 'a.jpg', ...extra });
const bg = (i: number, extra: Record<string, unknown> = {}) => ({ k: `b:ab12cd:${i}`, o: 'u', ...extra });
const hid = (i: number) => ({ k: `s:ab12cd:${i}`, o: 'section' });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('허용 시안 목록', () => {
  it('정확히 11개이고 계약의 슬러그와 같다', () => {
    expect(DETAIL_SLUGS).toEqual([
      's1_gift', 's2_check', 'c_field', 's4_plum', 's5_field', 's6_plum',
      's7_black', 's8_copy', 's9_clean', 's10_gift', 's11_astra',
    ]);
    expect(DETAIL_PAGES).toHaveLength(11);
  });
  it('모든 시안에 제목이 있다', () => {
    for (const p of DETAIL_PAGES) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(displayTitle(p)).toBe(`시안 ${p.no} · ${p.title}`);
    }
    expect(getDetailPage('s7_black')?.title).toBe('v6 문구 · 흑금 디자인');
  });
  it('허용 목록 밖은 모두 거절 (프로토타입 키·경로 주입 포함)', () => {
    for (const bad of ['index', '', 's7_black.html', '../s7_black', 's7_black/', '__proto__', 'constructor', 'toString', 'S7_BLACK', 's12_x', null, undefined, 7]) {
      expect(isDetailSlug(bad), String(bad)).toBe(false);
    }
    expect(isDetailSlug('s7_black')).toBe(true);
  });
});

describe('이미지 src 허용 규칙', () => {
  it('Blob 업로드 경로와 시안 오리진은 허용', () => {
    expect(isAllowedAssetSrc(BLOB)).toBe(true);
    expect(isAllowedAssetSrc('https://x.public.blob.vercel-storage.com/uploads/detail-concepts/a_b-1.PNG')).toBe(true);
    expect(isAllowedAssetSrc(CONCEPT)).toBe(true);
  });

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:image/png;base64,AAAA'],
    ['빈 문자열', ''],
    ['프로토콜 상대', '//evil.test/a.jpg'],
    ['http Blob', 'http://x.public.blob.vercel-storage.com/uploads/detail-concepts/a.jpg'],
    ['다른 Blob 경로', 'https://x.public.blob.vercel-storage.com/uploads/blog/a.jpg'],
    ['다른 호스트', 'https://evil.test/uploads/detail-concepts/a.jpg'],
    ['Blob 호스트 흉내', 'https://x.public.blob.vercel-storage.com.evil.test/uploads/detail-concepts/a.jpg'],
    ['호스트 접두 흉내', 'https://public.blob.vercel-storage.com/uploads/detail-concepts/a.jpg'],
    ['계정정보', 'https://u:p@x.public.blob.vercel-storage.com/uploads/detail-concepts/a.jpg'],
    ['쿼리', `${BLOB}?x=1`],
    ['해시', `${BLOB}#x`],
    ['경로 탈출', 'https://x.public.blob.vercel-storage.com/uploads/detail-concepts/../../evil.jpg'],
    ['인코딩된 경로 탈출', 'https://x.public.blob.vercel-storage.com/uploads/detail-concepts/%2e%2e/a.jpg'],
    ['허용되지 않는 확장자', 'https://x.public.blob.vercel-storage.com/uploads/detail-concepts/a.svg'],
    ['시안 오리진 흉내', 'https://daeracheon-detail-concepts.vercel.app.evil.test/a.jpg'],
    ['시안 오리진 쿼리', `${CONCEPT}?x=1`],
    ['공백', 'https://x.public.blob.vercel-storage.com/uploads/detail-concepts/a b.jpg'],
    ['역슬래시', 'https://x.public.blob.vercel-storage.com\\uploads\\detail-concepts\\a.jpg'],
    ['개행', `${BLOB}\n`],
  ])('거절: %s', (_name, src) => {
    expect(isAllowedAssetSrc(src)).toBe(false);
  });

  it('너무 긴 값은 거절', () => {
    expect(isAllowedAssetSrc(`${CONCEPT}${'a'.repeat(LIMITS.srcUrl)}`)).toBe(false);
  });

  it('루트 상대 /uploads/detail-concepts 는 비운영에서만 허용', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedAssetSrc('/uploads/detail-concepts/1730000000000-ab12.jpg')).toBe(true);
    expect(isAllowedAssetSrc('/uploads/other/a.jpg')).toBe(false);
    expect(isAllowedAssetSrc('/uploads/detail-concepts/../a.jpg')).toBe(false);
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedAssetSrc('/uploads/detail-concepts/1730000000000-ab12.jpg')).toBe(false);
  });

  it('로컬 오버라이드 시안 오리진은 비운영에서만 허용', () => {
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedAssetSrc('http://127.0.0.1:4101/assets/a.jpg')).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedAssetSrc('http://127.0.0.1:4101/assets/a.jpg')).toBe(false);
  });
});

describe('편집 문서 스키마', () => {
  it('빈 문서와 정상 문서를 통과시킨다', () => {
    expect(docBodySchema.safeParse(emptyBody()).success).toBe(true);
    const ok = docBodySchema.safeParse({
      texts: [text(0, { html: '<b>x</b>', fs: 28, color: '#aa3322', run: 1 }), text(1, { fs: null, color: null })],
      images: [image(0, { src: BLOB, alt: '새 대체 텍스트' })],
      bgs: [bg(0, { src: BLOB })],
      hidden: [hid(0)],
    });
    expect(ok.success).toBe(true);
  });

  it('네 배열이 모두 있어야 한다 / 배열만 허용', () => {
    expect(docBodySchema.safeParse({ texts: [], images: [], bgs: [] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: {} }).success).toBe(false);
    expect(docBodySchema.safeParse([]).success).toBe(false);
    expect(docBodySchema.safeParse(null).success).toBe(false);
  });

  it('알 수 없는 속성은 어디서든 거절 (최상위·항목)', () => {
    expect(docBodySchema.safeParse({ ...emptyBody(), extra: 1 }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [text(0, { evil: true })] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), images: [image(0, { onerror: 'x' })] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), hidden: [{ ...hid(0), src: BLOB }] }).success).toBe(false);
    // JSON.parse 가 만드는 own __proto__ 키도 거절
    const polluted = JSON.parse('{"texts":[],"images":[],"bgs":[],"hidden":[],"__proto__":{"x":1}}');
    expect(docBodySchema.safeParse(polluted).success).toBe(false);
  });

  it('키 형식', () => {
    for (const k of ['x:ab12cd:0', 't:ab:0', 't:ab12cd', 't:AB12CD:0', 't:ab12cd:12345', 't:ab12cd:-1', '', 't:ab12cd:0 ', 't:ab12cd:0\n']) {
      expect(docBodySchema.safeParse({ ...emptyBody(), texts: [{ k, o: '' }] }).success, JSON.stringify(k)).toBe(false);
    }
    for (const k of ['t:ab12:0', 't:0123456789abcdef:9999', 'i:zz99zz:7']) {
      expect(docBodySchema.safeParse({ ...emptyBody(), texts: [{ k, o: '' }] }).success, k).toBe(true);
    }
  });

  it('같은 배열 안의 중복 키는 거절', () => {
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [text(0), text(0)] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), hidden: [hid(1), hid(1)] }).success).toBe(false);
  });

  it('배열 개수 상한: texts 1500 / images 200 / bgs 50 / hidden 100', () => {
    const many = <T>(n: number, make: (i: number) => T) => Array.from({ length: n }, (_, i) => make(i));
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: many(1500, (i) => text(i)) }).success).toBe(true);
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: many(1501, (i) => text(i)) }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), images: many(200, (i) => image(i)) }).success).toBe(true);
    expect(docBodySchema.safeParse({ ...emptyBody(), images: many(201, (i) => image(i)) }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), bgs: many(50, (i) => bg(i)) }).success).toBe(true);
    expect(docBodySchema.safeParse({ ...emptyBody(), bgs: many(51, (i) => bg(i)) }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), hidden: many(100, (i) => hid(i)) }).success).toBe(true);
    expect(docBodySchema.safeParse({ ...emptyBody(), hidden: many(101, (i) => hid(i)) }).success).toBe(false);
  });

  it('html 8000자 / alt 300자 / 글자 크기 10..200 / 색 / run', () => {
    const t = (extra: Record<string, unknown>) => docBodySchema.safeParse({ ...emptyBody(), texts: [text(0, extra)] }).success;
    expect(t({ html: 'a'.repeat(8000) })).toBe(true);
    expect(t({ html: 'a'.repeat(8001) })).toBe(false);
    expect(t({ fs: 10 })).toBe(true);
    expect(t({ fs: 200 })).toBe(true);
    expect(t({ fs: 9 })).toBe(false);
    expect(t({ fs: 201 })).toBe(false);
    expect(t({ fs: 22.5 })).toBe(false);
    expect(t({ color: '#AaBb09' })).toBe(true);
    for (const c of ['red', '#fff', '#12345g', '#1234567', 'rgb(1,2,3)', 'url(x)']) expect(t({ color: c }), c).toBe(false);
    expect(t({ run: 0 })).toBe(true);
    expect(t({ run: 99 })).toBe(true);
    expect(t({ run: 100 })).toBe(false);
    expect(t({ run: -1 })).toBe(false);
    const i = (alt: string) => docBodySchema.safeParse({ ...emptyBody(), images: [image(0, { alt })] }).success;
    expect(i('a'.repeat(300))).toBe(true);
    expect(i('a'.repeat(301))).toBe(false);
  });

  it('이미지/배경 src 는 허용 규칙을 따른다', () => {
    expect(docBodySchema.safeParse({ ...emptyBody(), images: [image(0, { src: 'javascript:alert(1)' })] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), bgs: [bg(0, { src: 'data:image/png;base64,AAAA' })] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), bgs: [bg(0, { src: 'https://evil.test/a.jpg' })] }).success).toBe(false);
  });

  it('값 타입이 틀리면 거절', () => {
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [{ k: 't:ab12cd:0', o: 5 }] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [text(0, { html: ['x'] })] }).success).toBe(false);
    expect(docBodySchema.safeParse({ ...emptyBody(), texts: [null] }).success).toBe(false);
  });
});

describe('요청 본문 스키마', () => {
  it('PUT 본문: baseVersion 정수, note 200자, 알 수 없는 속성 거절', () => {
    const ok = { baseVersion: 3, doc: emptyBody() };
    expect(putBodySchema.safeParse(ok).success).toBe(true);
    expect(putBodySchema.safeParse({ ...ok, note: 'n'.repeat(200) }).success).toBe(true);
    expect(putBodySchema.safeParse({ ...ok, note: 'n'.repeat(201) }).success).toBe(false);
    expect(putBodySchema.safeParse({ ...ok, baseVersion: -1 }).success).toBe(false);
    expect(putBodySchema.safeParse({ ...ok, baseVersion: 1.5 }).success).toBe(false);
    expect(putBodySchema.safeParse({ ...ok, baseVersion: '3' }).success).toBe(false);
    expect(putBodySchema.safeParse({ doc: emptyBody() }).success).toBe(false);
    expect(putBodySchema.safeParse({ ...ok, updatedBy: 'someone@x.test' }).success).toBe(false);
  });
  it('복원 본문', () => {
    expect(restoreBodySchema.safeParse({ version: 2, baseVersion: 5 }).success).toBe(true);
    expect(restoreBodySchema.safeParse({ version: 0, baseVersion: 5 }).success).toBe(false);
    expect(restoreBodySchema.safeParse({ version: 2 }).success).toBe(false);
    expect(restoreBodySchema.safeParse({ version: 2, baseVersion: 5, doc: {} }).success).toBe(false);
  });
});

describe('저장 문서 해석', () => {
  const stored = (extra: Record<string, unknown> = {}) => ({
    schema: 1, page: 's7_black', version: 4, updatedAt: '2026-11-04T08:12:00.000Z', updatedBy: 'a@b.test', ...emptyBody(), ...extra,
  });
  it('정상 문서 / 빈 공개 문서', () => {
    expect(parseStoredDoc(stored(), 's7_black')?.version).toBe(4);
    expect(emptyPublicDoc('s7_black')).toEqual({ schema: 1, page: 's7_black', version: 0, updatedAt: null, ...emptyBody() });
  });
  it('스키마·페이지·버전이 어긋나면 null', () => {
    expect(parseStoredDoc(stored({ schema: 2 }), 's7_black')).toBeNull();
    expect(parseStoredDoc(stored(), 's1_gift')).toBeNull();
    expect(parseStoredDoc(stored({ version: -1 }), 's7_black')).toBeNull();
    expect(parseStoredDoc(stored({ version: 1.5 }), 's7_black')).toBeNull();
    expect(parseStoredDoc(stored({ texts: 'x' }), 's7_black')).toBeNull();
    expect(parseStoredDoc([], 's7_black')).toBeNull();
    expect(parseStoredDoc(null, 's7_black')).toBeNull();
  });
  it('문서 크기 계산', () => {
    expect(bodyBytes(emptyBody())).toBe(Buffer.byteLength(JSON.stringify(emptyBody())));
    expect(bodyBytes({ ...emptyBody(), texts: [text(0, { html: '한글' })] })).toBeGreaterThan(bodyBytes(emptyBody()));
  });
});
