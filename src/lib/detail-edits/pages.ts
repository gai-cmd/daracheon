/**
 * 상세페이지 시안 편집기 — 편집 가능한 시안 목록(허용 목록).
 *
 * 슬러그는 이 11개뿐이다. 그 밖의 값은 모든 API·편집 페이지에서 404 로 거절한다
 * (저장소 파일명·업스트림 fetch URL 에 쓰이므로 허용 목록이 곧 SSRF/경로 주입 방어선).
 * 표지(index)는 편집 대상이 아니다.
 *
 * 제목(h3)과 부제(설명 p 의 첫 문장)는 시안 표지 카드(daeracheon-detail-concepts index.html)의 문구를
 * 그대로 옮겼다. 표지가 바뀌면 이 표도 손으로 맞춘다 — __tests__/pages.test.ts 가 백업 표지와 대조한다.
 */

export interface DetailPage {
  slug: string;
  /** 표지의 "시안 N" 번호 */
  no: number;
  /** 표지 카드 제목(h3) */
  title: string;
  /** 표지 카드 설명(p)의 첫 문장 — 목록 화면에 한 줄로 보여 주기 위해 첫 문장만 쓴다 */
  subtitle: string;
}

export const DETAIL_PAGES: readonly DetailPage[] = [
  { slug: 's1_gift', no: 1, title: '명절 선물 에디션', subtitle: '남색 보자기와 금색.' },
  { slug: 's2_check', no: 2, title: '구매 전 체크리스트', subtitle: '흰 바탕에 적갈색 하나.' },
  { slug: 'c_field', no: 3, title: '농장 일지', subtitle: '사람과 농장, 한 그루의 시간을 따라가는 다큐형 상세.' },
  { slug: 's4_plum', no: 4, title: '沈 — 자두색 정물', subtitle: '자두색·백자색·명조.' },
  { slug: 's5_field', no: 5, title: '원본 문구 · 농장 일지 디자인', subtitle: '원본 상세페이지의 문구를 한 글자도 바꾸지 않고, 3안(농장 일지)의 크림·숲 초록·테라코타와 폴라로이드 사진, 점선 타임라인을 입혔습니다.' },
  { slug: 's6_plum', no: 6, title: '원본 문구 · 자두색 정물 디자인', subtitle: '원본 상세페이지의 문구를 한 글자도 바꾸지 않고, 4안(자두색 정물)의 자두색·종이색과 명조 제목, 가는 선, 자두색 머리줄 표를 입혔습니다.' },
  { slug: 's7_black', no: 7, title: 'v6 문구 · 흑금 디자인', subtitle: 'v6 상세페이지 문구를 그대로 두고, 정관장 황진단의 먹색·금색 격식, 조선비책식 큰 숫자, 광동제약식 규격 숫자 강조를 입혔습니다.' },
  { slug: 's8_copy', no: 8, title: '학명으로 증명된 침향 · 칠흑과 금', subtitle: '광동제약·정관장·조선비책을 벤치마킹해 카피와 디자인을 모두 새로 만들었습니다.' },
  { slug: 's9_clean', no: 9, title: 'v6 문구 · 흰 바탕 남색·초록 인포그래픽', subtitle: 'v6 문구를 한 글자도 바꾸지 않고, 종근당건강(락토핏)·고려은단·뉴트리원 상세의 문법을 입혔습니다.' },
  { slug: 's10_gift', no: 10, title: 'v6 문구 · 크림·버건디 선물 카탈로그', subtitle: 'v6 문구를 그대로 두고, 정관장 선물세트·한삼인·NS홈쇼핑 상세의 문법을 입혔습니다.' },
  { slug: 's11_astra', no: 11, title: 'v6 문구 · 산지 기록장', subtitle: '디자인(CSS)을 ChatGPT Astra가 직접 짰습니다.' },
];

export type DetailSlug = (typeof DETAIL_PAGES)[number]['slug'];

const BY_SLUG: ReadonlyMap<string, DetailPage> = new Map(DETAIL_PAGES.map((p) => [p.slug, p]));

export const DETAIL_SLUGS: readonly string[] = DETAIL_PAGES.map((p) => p.slug);

/** 허용 목록에 있는 슬러그인가. Map 조회라 `__proto__`·`constructor` 같은 값에도 안전하다. */
export function isDetailSlug(value: unknown): value is DetailSlug {
  return typeof value === 'string' && BY_SLUG.has(value);
}

export function getDetailPage(slug: string): DetailPage | undefined {
  return BY_SLUG.get(slug);
}

/** 화면 표시용 제목 — "시안 7 · v6 문구 · 흑금 디자인" */
export function displayTitle(page: DetailPage): string {
  return `시안 ${page.no} · ${page.title}`;
}
