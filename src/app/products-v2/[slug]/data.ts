/**
 * 상품 상세 v2 — 초안 전용 데이터 (한국어).
 *
 * 흐름은 상세페이지 통이미지(photo_2026-05-24)를 사이트 네이티브 화면으로
 * 재구성한 것: Brand → Product → From Vietnam → Agalocha → Aganwood →
 * Aganwood Oil → Needs → 제품정보/구매.
 *
 * ⚠️ 라이브 products.json(Blob)과 무관한 독립 데이터. 기존 /products,
 *    어드민, 공개 API 어디에도 영향을 주지 않는다. slug 를 키로 항목을
 *    추가하면 그대로 카탈로그가 된다.
 *
 * 사진은 /public/products-v2/<제품>/ 에 최적화 저장된 자사 자산(구글
 * 드라이브 원본 → 1600px 압축). 외부 CDN 직링크는 사용하지 않는다.
 */

export interface DraftPersona {
  image: string;
  caption: string;
}

export interface DraftSpecRow {
  key: string;
  value: string;
}

export interface DraftPriceOption {
  id: string;
  label: string;
  priceKRW: number;
}

export interface DraftProduct {
  slug: string;
  categoryLabel: string;
  nameHanja: string;
  name: string;
  nameEn: string;
  tagline: string;
  /** Brand 히어로 (다크 풀블리드 배경) */
  heroImage: string;
  /** Product 섹션 뷰티 컷 */
  productImage: string;
  productLead: string;
  /** 캡슐/보틀 디테일 컷 */
  detailImage: string;
  specs: DraftSpecRow[];
  /** Needs — 추천 대상 인물 카드 */
  personas: DraftPersona[];
  usage: string[];
  warnings: string[];
  options: DraftPriceOption[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

/* ─────────────────────────────────────────────────────────
   공통 콘텐츠 (모든 제품 공유 — 통이미지의 중간 스토리 섹션)
   ───────────────────────────────────────────────────────── */

const IMG_COMMON = '/products-v2/cham-oil';

export const commonContent = {
  vietnam: {
    tag: 'From Vietnam',
    title: '100% 베트남 침향',
    headline: '베트남 산림청 임·격·관리',
    body: '대라천이 사용하는 모든 원료는 베트남 직영 농장에서 재배되어, 베트남 산림청의 임업·규격·관리 체계 아래 합법적으로 채취·반출됩니다.',
    image: `${IMG_COMMON}/vietnam.jpg`,
    imageAlt: '베트남 침향 직영 농장 — 산림청 관리 표식이 부착된 침향나무',
    cites: {
      label: 'CITES',
      title: '멸종위기종 국제거래협약 정품 인증',
      note: '합법 원료임을 증명하는 국제 인증서 — 위조할 수 없는 신뢰의 근거입니다.',
    },
  },

  agalocha: {
    tag: 'Agalocha',
    scientificName: 'Aquilaria Agallocha Roxburgh',
    title: '아퀼라리아 아갈로차 록스버그',
    body: '이름만 ‘침향’인 제품이 많습니다. 진짜 침향은 식약처에 등재된 정품 학명, 단 하나로 가려집니다.',
    gradeNote: '침향은 수지(樹脂) 밀도에 따라 등급이 나뉩니다. 밀도가 높을수록 향과 성분이 진합니다.',
    grades: [
      { label: '상위 등급 — 대라천 원료', density: '수지 밀도 매우 높음', tier: 'top' },
      { label: '중상 등급', density: '높음', tier: 'mid' },
      { label: '중간 등급', density: '보통', tier: 'low' },
      { label: '일반 등급', density: '낮음', tier: 'base' },
    ],
  },

  aganwood: {
    tag: 'Aganwood',
    title: '오랜 세월이 만들어 내는 품질관리 시스템',
    body: '침향은 나무가 스스로를 지키기 위해 수십 년에 걸쳐 만들어 내는 수지입니다. 시간을 단축할 수 없기에, 우리는 정직하게 기다립니다.',
    image: `${IMG_COMMON}/aganwood.jpg`,
    imageAlt: '20년 이상 자란 베트남 직영 농장의 침향나무 숲',
    stats: [
      { num: '20', unit: '년 이상', label: '침향나무 재배' },
      { num: '3', unit: '년 이상', label: '수지 침착·숙성' },
    ],
  },

  aganwoodOil: {
    tag: 'Aganwood Oil',
    title: '귀하게 얻어지는 침향 오일',
    body: '원목에서 침향 오일을 얻기까지 — 그 수율은 약 0.004%에 불과합니다.',
    bgImage: `${IMG_COMMON}/oil-bg.jpg`,
    yield: [
      { label: '원목', value: '500', unit: 'kg', tier: 'wide' },
      { label: '정제 오일', value: '100', unit: 'kg', tier: 'mid' },
      { label: '침향 오일', value: '20', unit: 'g', tier: 'narrow' },
    ],
    percent: '약 0.004% 수율',
  },

  needs: {
    tag: 'Needs',
    title: '어떤 분들께 추천하나요?',
    lede: '오랜 시간 축적된 자연의 에너지를, 활력과 균형이 필요한 일상에.',
  },

  trust: {
    tag: 'Guarantee',
    title: '기획 보증 · 품질 보증',
    body: '원료의 채취부터 가공·유통까지 전 과정이 국제·국내 인증으로 검증되었습니다.',
    badges: ['CITES', 'HACCP', 'ORGANIC', 'ISO', 'OCOP', 'FDA'],
  },
} as const;

/* ─────────────────────────────────────────────────────────
   제품별 데이터 (slug 키로 추가 → 카탈로그)
   ───────────────────────────────────────────────────────── */

const IMG = '/products-v2/cham-oil';

export const draftProducts: Record<string, DraftProduct> = {
  'daerachoen-cham-agarwood-oil-capsule': {
    slug: 'daerachoen-cham-agarwood-oil-capsule',
    categoryLabel: '에센셜 오일 · 연질 캡슐',
    nameHanja: '大羅天 沈香',
    name: '대라천 참침향 오일 캡슐',
    nameEn: 'Daeracheon Cham Agarwood Oil Capsule',
    tagline: '25년산 정품 ‘참’침향 연질캡슐 · 100% 아갈로차 오일',
    heroImage: `${IMG}/01-hero.jpg`,
    productImage: `${IMG}/02-product.jpg`,
    productLead: '베트남 침향유 캡슐 · 정식 수입 완제품',
    detailImage: `${IMG}/04-capsules.jpg`,
    specs: [
      { key: '학명·품종', value: 'Aquilaria Agallocha Roxburgh' },
      { key: '수지 오일 함량', value: '0.59%' },
      { key: '성분', value: '침향오일, 적송오일, 오메가3, 비타민E' },
      { key: '포장', value: '유리병(뚜껑 폴리프로필렌) · 1병 30캡슐' },
      { key: '유통기한', value: '3년' },
      { key: '인증', value: 'ISO · Organic · HACCP · OCOP' },
    ],
    personas: [
      { image: `${IMG}/needs-01.jpg`, caption: '잦은 야근과 스트레스로 지친 직장인' },
      { image: `${IMG}/needs-02.jpg`, caption: '건강을 함께 챙기고 싶은 부부' },
      { image: `${IMG}/needs-03.jpg`, caption: '환절기 컨디션 관리가 필요한 분' },
      { image: `${IMG}/needs-04.jpg`, caption: '활력 있는 하루를 원하는 분' },
      { image: `${IMG}/needs-05.jpg`, caption: '부모님 건강 선물을 고민하는 분' },
      { image: `${IMG}/needs-06.jpg`, caption: '활기찬 노년을 준비하는 분' },
    ],
    usage: ['1일 1회, 1회 1캡슐을 충분한 물과 함께 복용하세요.'],
    warnings: [
      '직사광선을 피하고 서늘한 곳에 보관, 개봉 후에는 냉장 보관하여 빠른 시간 안에 드시는 것이 좋습니다.',
      '성분에 과민증이 있거나 임산부·수유부는 복용하지 마십시오.',
      '본 제품은 의약품이 아니며, 질병의 예방·치료를 보장하지 않습니다.',
    ],
    options: [
      { id: 'cap-30', label: '30캡슐 (1통)', priceKRW: 1_290_000 },
      { id: 'cap-60', label: '60캡슐 (2통)', priceKRW: 1_980_000 },
    ],
    ctaPrimary: { label: '제품 문의', href: '/company#contact' },
    ctaSecondary: { label: '홈쇼핑 방송 확인', href: '/home-shopping' },
  },
};

export function getDraftProduct(slug: string): DraftProduct | undefined {
  return draftProducts[slug];
}

export function getDraftSlugs(): string[] {
  return Object.keys(draftProducts);
}
