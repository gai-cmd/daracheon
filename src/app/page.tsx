import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import styles from './page.module.css';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\\[nrt]/g, '')
  .replace(/\s+/g, '')
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\/+$/, '');

export const dynamic = 'force-dynamic';

export interface HomeHero {
  sectionTag: string;
  titleKr: string;
  subtitle: string;
  heroBg: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

export interface HomeStat { value: string; label: string }
export interface NoticeItem { num: string; text: string }

export interface HomeNotice {
  tag: string;
  title: string;
  body: string;
  items: NoticeItem[];
  badges: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface AgarwoodCard { title: string; description: string; kicker?: string; image?: string }
export interface HomeAgarwood { tag: string; title: string; cards: AgarwoodCard[] }
export interface BenefitItem { title: string; description: string; kicker?: string; image?: string }
export interface HomeBenefits { tag: string; title: string; items: BenefitItem[] }
export interface ProcessStepItem { title: string; duration?: string }
export interface HomeProcess {
  tag: string;
  title: string;
  steps: string[];
  durations?: string[];
}

export interface VerificationRow { num: string; label: string; meta: string }
export interface VerifiedCard { step: string; title: string; en: string; body: string }
export interface CertChip { mark: string; name: string; sub: string }

export interface HomeShowroomImage {
  src: string;
  tag?: string;
  title?: string;
  body?: string;
}

export interface HomeProblemImage {
  src: string;
  alt?: string;
}

export interface ProblemCard {
  tag: string;
  title: string;
  body: string;
  image?: { src: string; alt?: string };
}

export interface SpeciesRow {
  latin: string;
  alias: string;
  pharmacopoeia: boolean;
  foodCode: boolean;
  note: string;
  image?: { src: string; alt: string };
}

export interface SpeciesDef {
  tag: string;
  title: string;
  body: string;
}

export interface HomeProblem {
  tag: string;
  title: string;
  lead: string;
  image?: HomeProblemImage;
  cards: ProblemCard[];
  speciesTitle: string;
  species: SpeciesRow[];
  speciesFoot: string;
  speciesDefHerb?: SpeciesDef;
  speciesDefFood?: SpeciesDef;
  // 종 비교 카드 안 ✓/✗ 라벨 — admin 에서 편집 가능. 비어있으면 아래 기본값.
  pharmacopoeiaLabel?: string;
  foodCodeLabel?: string;
}

export interface SolutionPillar {
  label: string;
  text: string;
}

export interface SolutionButton {
  label: string;
  href: string;
  variant?: 'gold' | 'outline';
}

export interface HomeSolutionCta {
  title: string;
  pillars: SolutionPillar[];
  buttons: SolutionButton[];
}

// 새 섹션: 원산지·학명 권위 (식약처 고시 + 역사적 기록 + 5개 지역 농장) — 2026-05-17 추가.
export interface OriginEra {
  era: string;       // "당나라 시대"
  text: string;      // 해당 시대의 침향 산지 기록 설명
}
export interface OriginAuthorityRegulationBlock {
  numTag: string;       // "01 식약처 고시 — 아퀼라리아 아갈로차 록스버그"
  titleLine1: string;   // "침향을 고를 때,"
  titleLine2: string;   // "이젠 학명·품종부터 확인하세요!"
  intro: string;        // "가짜가 많을수록 진짜가 드러납니다."
  body: string;         // 식약처 등록 출처 본문 — *강조* / \n 줄바꿈
}
export interface OriginAuthorityHistoryBlock {
  numTag: string;       // "02 역사적 기록 — 베트남이 정품 산지"
  title: string;        // "역사적 기록에서는 '베트남산'을 최고로 여기고 있습니다."
  lead: string;         // "수천 년 동안 이어진 문헌들이 그 가치를 증명합니다."
  eras: OriginEra[];    // 왕조별 기록
  closing: string;      // "이처럼 시대를 거슬러 올라가도 ..."
}
export interface OriginAuthorityFarmsBlock {
  numTag: string;       // "03 베트남 5개 지역 직영"
  text: string;         // "그 베트남산 침향을 베트남 현지 5개 지역에 농장을 두고 있다"
}
export interface HomeOriginAuthority {
  regulation: OriginAuthorityRegulationBlock;
  history: OriginAuthorityHistoryBlock;
  farms: OriginAuthorityFarmsBlock;
}

export type HomeSectionId =
  | 'hero'
  | 'trustStrip'
  | 'showroom'
  | 'problem'
  | 'verified'
  | 'certs'
  | 'originAuthority'
  | 'agarwood'
  | 'benefits'
  | 'process';

const DEFAULT_SECTION_ORDER: HomeSectionId[] = [
  'hero',
  'trustStrip',
  'showroom',
  'problem',
  'verified',
  'certs',
  'originAuthority',
  'agarwood',
  'benefits',
  'process',
];

// 섹션별 옵셔널 메타 슬롯 — 어드민에서 섹션 단위로 켤 수 있는 공통 부속.
// 기존 schema 는 손대지 않고, 값이 있는 슬롯만 위/아래에 덧붙는다.
export interface SectionMetaCta {
  label: string;
  href: string;
  variant?: 'gold' | 'outline';
}
export interface SectionMeta {
  hidden?: boolean;        // true → 해당 섹션 자체를 렌더하지 않음
  topTag?: string;         // 섹션 상단 태그 (예: "Notice · 침향을 고르기 전에")
  titleQuote?: string;     // 제목 인용문 — *...* 강조 / \n 줄바꿈 지원
  bodyLead?: string;       // 본문 리드 — *...* 강조 / \n 줄바꿈 지원
  cta?: SectionMetaCta;    // 섹션 하단 CTA 버튼
}

export interface HomeData {
  hero?: HomeHero;
  stats?: HomeStat[];
  notice?: HomeNotice;
  agarwood?: HomeAgarwood;
  benefits?: HomeBenefits;
  process?: HomeProcess;
  verification?: VerificationRow[];
  verifiedCards?: VerifiedCard[];
  certs?: CertChip[];
  showroomImage?: HomeShowroomImage;
  problemImage?: HomeProblemImage;
  problem?: HomeProblem;
  solutionCta?: HomeSolutionCta;
  originAuthority?: HomeOriginAuthority;
  sectionOrder?: HomeSectionId[];
  sectionMeta?: Partial<Record<HomeSectionId, SectionMeta>>;
}

const DEFAULT_HERO: HomeHero = {
  sectionTag: 'Genuine Only · 진짜 침향만',
  titleKr: '대라천은, 진짜 침향만 다룹니다',
  subtitle: '한 품종, 한 나라 — Aquilaria Agallocha Roxburgh, 베트남 직영.\n25년, 한 회사 — 베트남 직영 생산 · 한국 직판. 조엘라이프가 원산지부터 연결합니다.\n프리미엄이 아니라 근거로 증명합니다.',
  heroBg:
    'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/home-hero-default.jpg',
  ctaPrimaryLabel: '검증 과정 보기 →',
  ctaPrimaryHref: '/brand-story',
  ctaSecondaryLabel: '제품 보기',
  ctaSecondaryHref: '/products',
};

const DEFAULT_STATS: HomeStat[] = [
  { value: '25년+', label: '연구 및 재배' },
  { value: '200ha', label: '400만 그루' },
  { value: '12건+', label: '특허 및 인증' },
  { value: '5개 지역', label: '직영 농장' },
];

const DEFAULT_VERIFICATION = [
  { num: '01', label: '원산지 — 베트남 하띤 직영 200ha', meta: 'CITES' },
  { num: '02', label: '원료 — Aquilaria Agallocha Roxburgh', meta: '식약처' },
  { num: '03', label: '제조 — HACCP · GMP 시설', meta: '인증' },
  { num: '04', label: '시험 — 중금속·유해물질 0건', meta: 'LOT별' },
];

const DEFAULT_NOTICE: HomeNotice = {
  tag: 'Notice — 식약처 고시 기준',
  title: '가짜가 많을수록,\n*진짜는 드러난다*',
  body:
    "이젠 학명/품종부터 확인하세요!\n식품의약품안전처(식약처) 고시 '대한민국약전외한약(생약)규격집', '식품공전', '한약재 관능검사 해설서'와 '한국한의학연구원 한약자원연구센터'에\n공식 등록된 침향은 *‘Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)’* 입니다.\n\n대라천 ‘참’침향은 첫 묘목부터 완제품까지 모든 단계와 과정을 투명하게 공개합니다.",
  items: [
    { num: '01', text: '대한민국약전외한약\n(생약)규격집' },
    { num: '02', text: '식약처\n식품공전' },
    { num: '03', text: '한약재 관능검사\n해설서' },
    { num: '04', text: '원색\n한약재감별도감' },
    { num: '05', text: '한국한의학연구원\n한약자원연구센터' },
  ],
  badges: [],
  ctaLabel: '',
  ctaHref: '',
};

const DEFAULT_VERIFIED_CARDS = [
  {
    step: '01 · Origin',
    title: '학명 확인된 AAR',
    en: 'Aquilaria Agallocha Roxburgh',
    body:
      "식약처 '대한민국약전외한약(생약)규격집'에 등록된 공식 학명. 유전자(DNA) 검증으로 종 일치 확인 후에만 가공 단계로 진입합니다.",
  },
  {
    step: '02 · Process',
    title: 'HACCP·GMP 생산',
    en: 'Controlled Manufacturing',
    body:
      '원료 수령·분쇄·배합·충전·포장의 5단계 공정을 HACCP 및 GMP 시설에서 관리. 공정별 기록이 Lot 단위로 유지됩니다.',
  },
  {
    step: '03 · Evidence',
    title: 'Lot별 시험성적서',
    en: 'Per-Batch Lab Reports',
    body:
      '중금속(납·카드뮴·비소·수은)·잔류농약·유해물질 검사를 제조 Lot 단위로 실시. 결과는 제품 패키지 QR로 언제든 열람 가능합니다.',
  },
];

const DEFAULT_CERTS = [
  { mark: 'V', name: '원산지 증명', sub: '베트남 100% 원산지' },
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'O', name: 'OCOP', sub: '베트남 정부 품질' },
  { mark: 'R', name: '유기농 재배', sub: '무농약 유기 농법' },
  { mark: 'Z', name: '청정지역', sub: '토양·환경 청정' },
  { mark: 'P', name: '유기농 완제품', sub: '유기 성분 인증' },
  { mark: 'T', name: '수지 특허', sub: '식용 수지 특허' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전 관리' },
  { mark: 'G', name: 'GMP', sub: '우수 제조 시설' },
  { mark: 'F', name: 'FDA', sub: '미국 FDA 등록' },
  { mark: 'S', name: '유해물질', sub: '중금속·잔류농약 0' },
  { mark: 'L', name: '성분 검사서', sub: '수지 함량 분석' },
];

const DEFAULT_AGARWOOD: HomeAgarwood = {
  tag: 'Agarwood · 신들의 나무',
  title: '수천 년을 지나온 가장 귀한 약재이자 향',
  cards: [
    {
      title: '동서양의 역사적 가치',
      description: '수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다.',
    },
    {
      title: '20년 이상의 긴 생육 시간',
      description: '20년 이상 생육된 침향나무에서 채취한 수지는 함량이 높아 약재로서 효능과 가치를 인정받습니다.',
    },
    {
      title: '논문에서 발표하는 침향',
      description: '침향 연구는 전 세계에서 활발히 이뤄지고 있으며, SCI급 논문도 실제 효과를 속속 보고합니다.',
    },
  ],
};

const DEFAULT_BENEFITS: HomeBenefits = {
  tag: 'Benefits · 연구 기반 효능',
  title: '침향의 가치, 여섯 가지 효능',
  items: [
    { kicker: 'Qi Circulation', title: '기 뚫고 원기 회복 · 자양강장', description: '몸속 기혈 순환으로 막힌 기를 뚫고 찬 기운을 몰아내 따뜻한 성질로 몸의 기운을 보강, 피로 해소와 활력 증진을 돕습니다.' },
    { kicker: 'Menstruation & Stamina', title: '냉감 · 정력 감퇴 · 복통에 탁월', description: '하복부 냉감, 월경불순, 남성 정력 감퇴, 잦은 소변 증상에 탁월하고, 이런 증상에 수반해 하복통 심한 사람에게 많이 활용됩니다.' },
    { title: '신경 안정 · 숙면', description: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할. 예민해진 신경을 이완시키고 심리적 안정과 불면증 개선에 효과적입니다." },
    { title: '항염 · 혈관 건강', description: '항염 작용으로 사이토카인을 억제하고 혈전을 막아, 만성 염증을 가라앉히고 혈관을 튼튼하게 합니다.' },
    { title: '뇌 질환 예방', description: '뇌혈류를 개선하고 뇌세포를 보호해, 뇌졸중·퇴행성 뇌 질환 예방 가능성을 높입니다.' },
    { title: '소화 · 복통 완화', description: '기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추게 합니다.' },
  ],
};

const DEFAULT_PROCESS: HomeProcess = {
  tag: 'Craftsmanship · 6단계 공정',
  title: '씨앗에서 완제품까지 20년이 넘는 시간',
  steps: [
    '씨앗 발아 및 묘목 육성',
    '베트남 직영 농장 식재',
    '20년 이상 오르가닉 육성',
    '특허 수지유도제 주입',
    '벌목 및 원물 정밀 채취',
    '전통 증기 증류 · 최종 검수',
  ],
};

const PROCESS_DURATIONS = ['6 — 12 Months', 'Ha Tinh 200ha', '20+ Years', '3 — 5 Years', 'Controlled Harvest', 'Steam Distillation · GMP'];

const PROCESS_IMAGES = [
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-01-seedling.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-02-farm.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-03-organic.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-04-resin.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-05-harvest.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-06-distill.jpg',
];

const DEFAULT_PROBLEM: HomeProblem = {
  tag: 'Notice · 침향을 고르기 전에',
  title: '침향을 구매할 때 가장 흔한 실수는\n*"좋다"는 말만 듣고 고르는 것*입니다.',
  lead: 'SCI급 논문이 늘며 침향 제품도 빠르게 늘어나는 지금,\n\'침향\' 두 글자 · \'아가우드\' 한 단어만으로는 충분하지 않습니다.\n진짜 침향은 *학명 · 인증 · 산지* 세 가지로 확인됩니다.',
  cards: [
    { tag: '01 · 학명', title: '정부 공식 학명을 확인할 수 있는가?', body: "제품 설명에 '침향' · '아가우드'라고만 표기된 경우가 많습니다. 식약처 기준 학명까지 명시되어야 진짜를 분별할 수 있습니다." },
    { tag: '02 · 인증', title: '증빙 문서가 공개되어 있는가?', body: 'CITES, 원산지 증명, 자유판매증명서, 학명·품종 인증, 정식 수입 증빙 — 진짜 침향일수록 이력을 숨기지 않습니다.' },
    { tag: '03 · 산지', title: '어느 나라, 어느 농장에서 왔는가?', body: '베트남? 인도네시아? 중국? 시대를 막론하고 베트남이 정품 산지로 기록되어 왔습니다. 산지 이력 추적이 가능해야 합니다.' },
  ],
  speciesTitle: '같은 침향(아퀼라리아 · Aquilaria) 이라도, 품종에 따라 식약처 고시 기준은 다릅니다',
  species: [
    {
      latin: 'Aquilaria agallocha Roxburgh',
      alias: '베트남산 아퀼라리아 아갈로차 록스버그 침향',
      pharmacopoeia: true,
      foodCode: true,
      note: '대한약전외한약(생약)규격집 · 식품공전 양쪽 모두 공식 등록.',
      image: {
        src: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/pages/species-card-roxburgh.jpg',
        alt: '베트남산 아퀼라리아 아갈로차 록스버그 침향 원목 단면',
      },
    },
    {
      latin: 'Aquilaria malaccensis Lam.',
      alias: '인도네시아산 말라센시스 램 침향',
      pharmacopoeia: false,
      foodCode: true,
      note: '대한약전외한약(생약)규격집 미등록 — 식용 원료로만 허용되는 등급의 침향.',
      image: {
        src: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/pages/species-card-malaccensis.jpg',
        alt: '인도네시아산 아퀼라리아 말라센시스 침향 원목 단면 — 수지가 적고 결이 거친 식용 등급',
      },
    },
  ],
  speciesFoot: '시장에서는 두 종 모두 "침향" · "아가우드"로 표시될 수 있어, 학명까지 확인하지 않으면 어떤 종인지 알 수 없습니다.',
  speciesDefHerb: {
    tag: '의약품 · 한약(생약)',
    title: '‘대한약전외한약(생약)규격집 등록’ 이란?',
    body: '해당 한약재·생약이 식품의약품안전처의 공식 품질 기준에 따라 안전성과 유효성을 인정받아 *의약품 원료*로 등록되고, 법적으로 제조·유통·판매할 수 있음을 의미합니다.',
  },
  speciesDefFood: {
    tag: '식품 · 식용 원료',
    title: '‘식품공전 등록’ 이란?',
    body: '해당 식품·원료가 식품의약품안전처의 국가 안전·품질 기준을 충족해, 합법적으로 제조·유통·판매할 수 있는 *공식 식품*으로 인정받았음을 의미합니다.',
  },
};

const DEFAULT_ORIGIN_AUTHORITY: HomeOriginAuthority = {
  regulation: {
    numTag: '01 식약처 고시 - 아퀼라리아 아갈로차 록스버그',
    titleLine1: '침향을 고를 때,',
    titleLine2: '이젠 학명·품종부터 확인하세요!',
    intro: '*가짜가 많을수록 진짜가 드러납니다.*',
    body:
      "식품의약품안전처(식약처) 고시 '대한민국약전외한약(생약)규격집', '식품공전'과 식약처 발간 '한약재 관능검사 해설서',\n'원색 한약재감별도감', 그리고 '한국한의학연구원 한약자원연구센터'에 공식 등록 및 기재된 침향은\n*'아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)'* 입니다.",
  },
  history: {
    numTag: '02 역사적 기록 - 베트남이 정품 산지',
    title: "역사적 기록에서는 *'베트남산'을 최고로 여기고 있습니다.*",
    lead: '수천 년 동안 이어진 문헌들이 그 가치를 증명하고 있습니다.',
    eras: [
      { era: '당나라 시대', text: '침향의 주요 산지를 교지, 임읍으로 기록하고 있는데 이 지역은 현재의 베트남에 해당합니다.' },
      { era: '송나라 시대', text: '교지, 안남, 점성 등 지금의 베트남 지역이 주요 산지로 기록되어 있습니다.' },
      { era: '원나라 시대', text: '안남 지역으로 현재의 베트남에 해당합니다.' },
      { era: '명나라 시대', text: "'대명회전'에서도 역시 안남과 점성이 핵심 산지로 등장합니다." },
      { era: "'향승'", text: '진납을 최상으로, 점성을 그 다음으로 평하고 있는데 이 역시 모두 베트남 지역권입니다.' },
      { era: '조선 시대', text: "조선의 기록에서는 청나라 시대에 베트남이 침향 생산과 무역을 주도했으며 베트남산이 '정품'으로 인정받았다는 내용까지 확인됩니다." },
    ],
    closing:
      '이처럼 시대를 거슬러 올라가도, 그리고 여러 나라의 기록을 살펴봐도 공통적으로 등장하는 중심지는 바로 *지금의 베트남 지역*입니다. 그래서 오늘날에도 베트남산 침향이 높은 가치를 인정받고 있는 것입니다.',
  },
  farms: {
    numTag: '03 베트남 5개 지역 직영 농장',
    text: '역사적으로 *베트남산을 최고로 여기는* 그 베트남산 침향을, 대라천은 *베트남 현지 5개 지역(하띤·동나이·냐짱·푸꾸옥·람동)* 에 직영 농장을 두고 직접 재배합니다.',
  },
};

// admin 인라인 마크업.
//
//   *텍스트*               → 골드 <em> (legacy, 기존 데이터 유지)
//   **텍스트**             → <strong> (굵게, 색 유지)
//   [red]텍스트[/]         → 색 — gold/red/green/white/gray
//   [lg]텍스트[/]          → 크기 — xs/sm/lg/xl/2xl (배수)
//   [red,b,lg]텍스트[/]    → 콤마로 조합 (색·크기·b 굵게)
//   [/red] 처럼 명시적 close 도 허용 (실제로는 [/...] 무엇이든 close)
//   \n                     → <br />
//   중첩 OK — parseInline 이 재귀 호출.
const COLOR_MAP: Record<string, string> = {
  gold: 'var(--accent, #d4a843)',
  red: '#e07b6e',
  green: '#7fb18c',
  white: '#ffffff',
  gray: 'rgba(255,255,255,0.55)',
};
const SIZE_MAP: Record<string, string> = {
  xs: '0.75em',
  sm: '0.875em',
  lg: '1.25em',
  xl: '1.5em',
  '2xl': '2em',
};
const KNOWN_TAGS = new Set<string>([
  ...Object.keys(COLOR_MAP),
  ...Object.keys(SIZE_MAP),
  'b',
  'bold',
]);

function parseInline(
  text: string,
  emClass: string | undefined,
  keyPrefix: string,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let idx = 0;
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        nodes.push(
          <strong key={`${keyPrefix}-b${idx++}`}>
            {parseInline(text.slice(i + 2, end), emClass, `${keyPrefix}-bi${idx}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        nodes.push(
          <em key={`${keyPrefix}-e${idx++}`} className={emClass}>
            {parseInline(text.slice(i + 1, end), emClass, `${keyPrefix}-ei${idx}`)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '[') {
      const tagEnd = text.indexOf(']', i + 1);
      if (tagEnd !== -1) {
        const rawTag = text.slice(i + 1, tagEnd).trim().toLowerCase();
        const parts = rawTag.split(/[,\s+]+/).filter(Boolean);
        const isKnown = parts.length > 0 && parts.every((p) => KNOWN_TAGS.has(p));
        if (isKnown) {
          // close: [/] 또는 [/anything]
          const closeMatch = text.slice(tagEnd + 1).match(/\[\/[^\]]*\]/);
          if (closeMatch && closeMatch.index !== undefined) {
            const innerStart = tagEnd + 1;
            const innerEnd = innerStart + closeMatch.index;
            const inner = text.slice(innerStart, innerEnd);
            const style: React.CSSProperties = {};
            let bold = false;
            for (const p of parts) {
              if (COLOR_MAP[p]) style.color = COLOR_MAP[p];
              else if (SIZE_MAP[p]) style.fontSize = SIZE_MAP[p];
              else if (p === 'b' || p === 'bold') bold = true;
            }
            const childNodes = parseInline(inner, emClass, `${keyPrefix}-si${idx}`);
            const styled = (
              <span
                key={`${keyPrefix}-s${idx++}`}
                style={Object.keys(style).length ? style : undefined}
              >
                {bold ? <strong>{childNodes}</strong> : childNodes}
              </span>
            );
            nodes.push(styled);
            i = innerEnd + closeMatch[0].length;
            continue;
          }
        }
      }
    }
    let j = i + 1;
    while (j < text.length && text[j] !== '*' && text[j] !== '[') j++;
    nodes.push(text.slice(i, j));
    i = j;
  }
  return nodes;
}

function renderMarked(text: string, emClass?: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => (
    <span key={`line-${li}`}>
      {parseInline(line, emClass, `${li}`)}
      {li < lines.length - 1 && <br />}
    </span>
  ));
}

// 홈은 root layout 의 SITE_URL/siteJsonLd 를 사용 — 별도 canonical/JSON-LD 미부착.
// (root metadata 의 alternates.canonical 이 이미 zoellife.com 으로 지정됨.)
export const metadata: Metadata = {
  title: "조엘라이프 대라천 '참'침향 - 100% 베트남산 아갈로차 침향",
  // Naver 검색엔진 사이트 설명 가이드라인: 80자 이내.
  // (긴 본문은 OG description / FAQ schema / 본문 카피로 보강.)
  description:
    '식약처 등재 정품 침향(Aquilaria Agallocha Roxburgh). 베트남 200ha 직영 농장 25년 한국 직판.',
  alternates: { canonical: '/' },
};

// 홈 전용 ItemList JSON-LD — AI 검색이 "대라천 침향 제품" 질문에 직접 응답할 때
// 인용 후보로 활용. 실제 제품 슬러그를 외부 데이터에서 빌드해 나열.
function buildHomeItemListJsonLd(siteUrl: string) {
  const items = [
    { name: '침향 오일', slug: 'agarwood-oil' },
    { name: '침향 캡슐', slug: 'agarwood-capsule' },
    { name: '침향단(환)', slug: 'agarwood-pill' },
    { name: '선향(스틱)', slug: 'agarwood-incense' },
    { name: '침향수', slug: 'agarwood-water' },
    { name: '침향차', slug: 'agarwood-tea' },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '대라천 ZOEL LIFE 대표 침향 제품',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/products/${it.slug}`,
      name: it.name,
    })),
  };
}

export default async function HomePage() {
  const pagesData = await readSingleSafe<{ home?: HomeData }>('pages');
  const home = pagesData?.home ?? {};
  const hero = home.hero ?? DEFAULT_HERO;
  const stats = home.stats ?? DEFAULT_STATS;
  const agarwood = home.agarwood ?? DEFAULT_AGARWOOD;
  const benefits = home.benefits ?? DEFAULT_BENEFITS;
  const processData = home.process ?? DEFAULT_PROCESS;
  const verification = home.verification ?? DEFAULT_VERIFICATION;
  const verifiedCards = home.verifiedCards ?? DEFAULT_VERIFIED_CARDS;
  const certs = home.certs ?? DEFAULT_CERTS;
  const notice: HomeNotice = home.notice
    ? {
        ...DEFAULT_NOTICE,
        ...home.notice,
        items: home.notice.items && home.notice.items.length > 0 ? home.notice.items : DEFAULT_NOTICE.items,
      }
    : DEFAULT_NOTICE;
  // verifiedCards 는 현재 프론트에서 렌더되지 않음 — admin 호환 위해 변수는 유지.
  void verifiedCards;
  const sectionOrder: HomeSectionId[] =
    Array.isArray(home.sectionOrder) && home.sectionOrder.length > 0
      ? home.sectionOrder.filter((id): id is HomeSectionId => DEFAULT_SECTION_ORDER.includes(id as HomeSectionId))
      : DEFAULT_SECTION_ORDER;
  // 누락된 섹션 ID 가 있으면 끝에 append 해 모든 섹션이 항상 렌더되게 한다.
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }
  const processDurations = home.process?.durations ?? PROCESS_DURATIONS;
  const showroomImage = home.showroomImage;
  // problem 섹션: 신규 problem.image 우선, 없으면 legacy problemImage 사용
  const problem: HomeProblem = home.problem
    ? { ...DEFAULT_PROBLEM, ...home.problem, cards: home.problem.cards ?? DEFAULT_PROBLEM.cards, species: home.problem.species ?? DEFAULT_PROBLEM.species }
    : DEFAULT_PROBLEM;
  const problemImage = problem.image ?? home.problemImage;
  // solutionCta 는 2026-05-17 부터 about-agarwood (진짜 침향 구별 탭) 로 이동.
  // 기존 home.solutionCta blob 데이터는 about-agarwood/page.tsx 의 legacy fallback 이 처리.
  const originAuthority: HomeOriginAuthority = home.originAuthority
    ? {
        regulation: { ...DEFAULT_ORIGIN_AUTHORITY.regulation, ...home.originAuthority.regulation },
        history: {
          ...DEFAULT_ORIGIN_AUTHORITY.history,
          ...home.originAuthority.history,
          eras:
            Array.isArray(home.originAuthority.history?.eras) && home.originAuthority.history.eras.length > 0
              ? home.originAuthority.history.eras
              : DEFAULT_ORIGIN_AUTHORITY.history.eras,
        },
        farms: { ...DEFAULT_ORIGIN_AUTHORITY.farms, ...home.originAuthority.farms },
      }
    : DEFAULT_ORIGIN_AUTHORITY;
  const sectionMetaMap = home.sectionMeta ?? {};

  // 섹션 메타 블록 — topTag/titleQuote/bodyLead 가 하나라도 있을 때 섹션 위에 렌더.
  function renderMetaPrefix(meta?: SectionMeta) {
    if (!meta) return null;
    const hasAny = meta.topTag || meta.titleQuote || meta.bodyLead;
    if (!hasAny) return null;
    return (
      <section className={styles.sectionMetaPrefix} aria-hidden={false}>
        <div className={styles.wrap}>
          <div className={styles.metaPrefixInner}>
            {meta.topTag && <span className={styles.metaTopTag}>{meta.topTag}</span>}
            {meta.titleQuote && (
              <h2 className={styles.metaTitleQuote}>{renderMarked(meta.titleQuote)}</h2>
            )}
            {meta.bodyLead && (
              <p className={styles.metaBodyLead}>{renderMarked(meta.bodyLead)}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 섹션 하단 CTA 버튼 — label·href 가 모두 있을 때만 렌더.
  function renderMetaSuffix(meta?: SectionMeta) {
    const cta = meta?.cta;
    if (!cta?.label || !cta?.href) return null;
    return (
      <section className={styles.sectionMetaSuffix}>
        <div className={styles.wrap}>
          <div className={styles.metaCtaWrap}>
            <Link
              href={cta.href}
              className={cta.variant === 'outline' ? styles.btnOutline : styles.btnGold}
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      {/* LCP 최적화: hero 배경 이미지를 preload 로 우선 페치.
          background-image 는 브라우저가 CSS 파싱 후에야 로드를 시작해 LCP 가 나빠진다. */}
      <link
        rel="preload"
        as="image"
        href={hero.heroBg}
        // @ts-expect-error fetchPriority 는 React 19 부터 정식 지원
        fetchpriority="high"
      />
      <JsonLd data={buildHomeItemListJsonLd(SITE_URL)} />
      {sectionOrder.map((sectionId) => {
        const meta = sectionMetaMap[sectionId];
        if (meta?.hidden) return null;
        const sectionContent = (() => {
          switch (sectionId) {
          case 'hero':
            return (
      // === HERO ===
      <section key="hero" className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url('${hero.heroBg}')` }}
          aria-hidden
        />
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.heroContent}>
          <div className={styles.wrap}>
            <div className={styles.heroRow}>
              <div>
                <h1>
                  {hero.titleKr.split(',').length > 1 ? (
                    <>
                      {hero.titleKr.split(',')[0]},
                      <br />
                      <em>{hero.titleKr.split(',').slice(1).join(',').trim()}</em>
                    </>
                  ) : (
                    hero.titleKr
                  )}
                </h1>
                <p className={styles.heroSub} style={{ whiteSpace: 'pre-line' }}>{hero.subtitle}</p>
              </div>

              {/* 3-Point Verification Card (edit in /admin/pages/home) */}
              <div className={styles.heroTrust}>
                <div className={styles.heroTrustTitle}>3-Point Verification</div>
                {verification.map((row, i) => {
                  const sepMatch = row.label.match(/^(.+?)\s*[-—–]\s*(.+)$/);
                  const keyword = sepMatch ? sepMatch[1] : row.label;
                  const rest = sepMatch ? sepMatch[2] : '';
                  return (
                    <div key={`${row.num}-${i}`} className={styles.heroTrustRow}>
                      <div className={styles.heroTrustNum}>{row.num}</div>
                      <div className={styles.heroTrustLabel}>
                        <span className={styles.heroTrustKeyword}>{keyword}</span>
                        {rest && (
                          <>
                            <span className={styles.heroTrustSep}> - </span>
                            <span className={styles.heroTrustRest}>{rest}</span>
                          </>
                        )}
                      </div>
                      <div className={styles.heroTrustMeta}>{row.meta}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
            );
          case 'trustStrip':
            return (
      // === TRUST STRIP ===
      <section key="trustStrip" className={styles.trustStrip}>
        <div className={styles.trustStripInner}>
          {stats.map((s) => (
            <div key={s.label} className={styles.trustStat}>
              <div className="num">{s.value}</div>
              <div className="lbl">{s.label}</div>
              <div className="caption">{/* TODO: caption 필드 없음 */}</div>
            </div>
          ))}
        </div>
      </section>
            );
          case 'showroom':
            return showroomImage?.src ? (
      // === SHOWROOM IMAGE ===
        <section key="showroom" className={styles.section} aria-label="대라천 침향 전시장">
          <div className={styles.wrap}>
            <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
              {showroomImage.tag && <span className={styles.tag}>{showroomImage.tag}</span>}
              {showroomImage.title && (
                <h2 className={styles.h2} style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.4rem)' }}>
                  {showroomImage.title}
                </h2>
              )}
              <div className={styles.line} />
              {showroomImage.body && (
                <p style={{ fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>
                  {showroomImage.body}
                </p>
              )}
            </div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 1200,
                margin: '0 auto',
                aspectRatio: '6 / 5',
                overflow: 'hidden',
                border: '1px solid rgba(212,168,67,0.2)',
                background: '#000',
              }}
            >
              <Image
                src={showroomImage.src}
                alt={showroomImage.title ?? '대라천 침향 전시장'}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                style={{ objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </section>
            ) : null;
          case 'problem':
            return (
      // === PROBLEM ===
      <section key="problem" className={styles.problem} aria-label="침향 시장의 위험과 진짜 침향 구별 기준">
        <div className={styles.wrap}>
          <div className={styles.problemHeadRow}>
            <div className={styles.problemHead}>
              <span className={styles.problemWarning}>{problem.tag}</span>
              <h2 className={styles.problemQuote}>{renderMarked(problem.title)}</h2>
              <div className={styles.problemHeadLine} />
              <p className={styles.problemLead}>{renderMarked(problem.lead)}</p>
            </div>

            {/* 우측: 다큐멘터리 정물 사진 — 이미지가 있을 때만 표시 */}
            {problemImage?.src && (
              <div className={styles.problemImageWrap}>
                <Image
                  src={problemImage.src}
                  alt={problemImage.alt ?? '인증서·도장·CITES 마크 정물'}
                  fill
                  sizes="(max-width: 1000px) 100vw, 45vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          <div className={styles.problemGrid}>
            {problem.cards.map((c, i) => (
              <div key={`${c.tag}-${i}`} className={styles.problemCard}>
                {c.image?.src && (
                  <div className={styles.problemCardImage}>
                    <Image
                      src={c.image.src}
                      alt={c.image.alt ?? c.title}
                      fill
                      sizes="(max-width: 800px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className={styles.problemCardBody}>
                  <div className={styles.problemCardTag}>{c.tag}</div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
            );
          case 'verified':
            return (
      // === VERIFIED (notice head + refGrid + speciesCompare + certs) ===
      <section key="verified" className={styles.verified} id="verified">
        <div className={styles.wrap}>
          <div className={styles.verifiedHead}>
            {/* notice.tag 를 problemWarning 스타일로 렌더 — Problem 섹션의 경고 칩과 시각 톤 통일(2026-05-17). */}
            <span className={styles.problemWarning}>{notice.tag}</span>
            <h2 className={styles.h2}>{renderMarked(notice.title)}</h2>
            <div className={styles.line} />
            {notice.body.split('\n\n').map((para, pi) => (
              <p key={`notice-p-${pi}`}>{renderMarked(para)}</p>
            ))}
          </div>

          <div className={styles.refGrid}>
            {notice.items.map(({ num, text }, idx) => (
              <div key={`${num}-${idx}`} className={styles.refCard}>
                <span className={styles.refNum}>{num}</span>
                <p className={styles.refLabel}>{text.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}</p>
              </div>
            ))}
          </div>

          {/* SPECIES COMPARE — refGrid 와 certRow 사이에 삽입(2026-05-17 이동). */}
          <div className={styles.speciesCompare}>
            <div className={styles.speciesCompareTitle}>{problem.speciesTitle}</div>
            <div className={styles.speciesTable}>
              {problem.species.map((s, i) => {
                const isOfficial = s.pharmacopoeia && s.foodCode;
                return (
                  <div
                    key={`${s.latin}-${i}`}
                    className={`${styles.speciesRow} ${isOfficial ? styles.speciesRowOfficial : styles.speciesRowWarning} ${s.image ? styles.speciesRowWithImg : ''}`}
                  >
                    {s.image && (
                      <div className={styles.speciesCardImg}>
                        <Image
                          src={s.image.src}
                          alt={s.image.alt}
                          fill
                          sizes="(max-width: 800px) 110px, 140px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className={styles.speciesBadge}>
                      {isOfficial ? '공식 등록 침향' : '식용 원료 한정'}
                    </div>
                    <div className={styles.speciesHeader}>
                      <div className={styles.speciesKorean}>{s.alias}</div>
                      <div className={styles.speciesLatin}>{s.latin}</div>
                    </div>
                    <div className={styles.speciesMarks}>
                      <div className={`${styles.speciesMark} ${s.pharmacopoeia ? styles.speciesMarkOk : styles.speciesMarkNo}`}>
                        <span className={styles.speciesMarkIcon}>{s.pharmacopoeia ? '✓' : '✗'}</span>
                        <span className={styles.speciesMarkLabel}>{problem.pharmacopoeiaLabel?.trim() || '대한약전외한약(생약)규격집'}</span>
                      </div>
                      <div className={`${styles.speciesMark} ${s.foodCode ? styles.speciesMarkOk : styles.speciesMarkNo}`}>
                        <span className={styles.speciesMarkIcon}>{s.foodCode ? '✓' : '✗'}</span>
                        <span className={styles.speciesMarkLabel}>{problem.foodCodeLabel?.trim() || '식품공전'}</span>
                      </div>
                    </div>
                    <div className={`${styles.speciesSummary} ${isOfficial ? styles.speciesSummaryGood : styles.speciesSummaryWarn}`}>
                      {isOfficial
                        ? '양쪽 모두 공식 등록'
                        : '대한약전외한약(생약)규격집 미등록 — 식용 원료로만 허용'}
                    </div>
                    <p className={styles.speciesNote}>{s.note}</p>
                  </div>
                );
              })}
            </div>
            <p className={styles.speciesFoot}>{problem.speciesFoot}</p>

            <div className={styles.speciesDefs}>
              {problem.speciesDefHerb && (
                <div className={styles.speciesDefHerb}>
                  <div className={styles.speciesDefTag}>{renderMarked(problem.speciesDefHerb.tag)}</div>
                  <div className={styles.speciesDefTitle}>{renderMarked(problem.speciesDefHerb.title)}</div>
                  <p className={styles.speciesDefBody}>{renderMarked(problem.speciesDefHerb.body)}</p>
                </div>
              )}
              {problem.speciesDefFood && (
                <div className={styles.speciesDefFood}>
                  <div className={styles.speciesDefTag}>{renderMarked(problem.speciesDefFood.tag)}</div>
                  <div className={styles.speciesDefTitle}>{renderMarked(problem.speciesDefFood.title)}</div>
                  <p className={styles.speciesDefBody}>{renderMarked(problem.speciesDefFood.body)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Certifications 는 sectionOrder 의 'certs' 로 분리되어 별도 섹션으로 렌더(2026-05-17). */}
          {/* SOLUTION CTA 는 about-agarwood (진짜 침향 구별 탭) 로 이동(2026-05-17) */}
        </div>
      </section>
            );
          case 'certs':
            return (
      // === CERTIFICATIONS ===
      <section key="certs" className={styles.section} id="certs" aria-label="대라천 침향 인증">
        <div className={styles.wrap}>
          <div className={styles.certRow}>
            <span className={styles.tag}>Certifications · {certs.length}건 인증</span>
            <div className={styles.certGrid}>
              {certs.map((c, i) => (
                <div key={`${c.name}-${i}`} className={styles.certTile}>
                  <div className={styles.certDivider} aria-hidden="true" />
                  <div className={styles.certTitle}>{c.name}</div>
                  <div className={styles.certCaption}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
            );
          case 'originAuthority':
            return (
      // === ORIGIN AUTHORITY (역사적 기록 + 5개 지역 직영 — 하나의 섹션으로 통합. 2026-05-17) ===
      // 식약처 고시(regulation) 블록은 verified 섹션에서 다루므로 여기선 렌더하지 않음.
      // 5개 지역(farms) 도 별도 번호 태그 없이 history 본문 끝에 이어붙인다.
      <section key="originAuthority" className={styles.originAuth} aria-label="역사적 기록 · 베트남 5개 지역 직영">
        <div className={styles.wrap}>
          {/* 텍스트 블록 — 920px 가독 폭으로 가운데 정렬 */}
          <div className={styles.originAuthBlock}>
            {/* numTag 를 problemWarning 스타일로(verified 섹션과 시각 톤 통일). title 은 problemQuote 로 다른 섹션 H2 와 사이즈·폰트 통일(2026-05-17). */}
            <span className={styles.problemWarning}>{originAuthority.history.numTag}</span>
            <h2 className={styles.problemQuote}>{renderMarked(originAuthority.history.title)}</h2>
            <p className={styles.originAuthIntro}>{renderMarked(originAuthority.history.lead)}</p>
          </div>

          {/* era 그리드 — originAuthBlock 의 max-width 밖에서 .wrap full-width 로 (certRow/certGrid 좌우 폭과 동일) */}
          <div className={styles.originAuthEras}>
            {originAuthority.history.eras.map((e, i) => (
              <div key={`${e.era}-${i}`} className={styles.originAuthEra}>
                <div className={styles.originAuthEraName}>{e.era}</div>
                <div className={styles.originAuthEraText}>{renderMarked(e.text)}</div>
              </div>
            ))}
          </div>

          {/* 마무리 + 5개 지역 텍스트 — 다시 920px 가독 폭 */}
          <div className={styles.originAuthBlock}>
            <p className={styles.originAuthClosing}>{renderMarked(originAuthority.history.closing)}</p>
            {originAuthority.farms.text && (
              <p className={styles.originAuthFarmsText}>{renderMarked(originAuthority.farms.text)}</p>
            )}
          </div>
        </div>
      </section>
            );
          case 'agarwood':
            return (
      // === AGARWOOD INTRO ===
      <section key="agarwood" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{agarwood.tag}</span>
            <h2 className={styles.h2}>{agarwood.title}</h2>
            <div className={styles.line} />
          </div>
          <div className={styles.agGrid}>
            {agarwood.cards.map((c, i) => {
              const kicker = c.kicker ?? (['Heritage', 'Time', 'Research'][i] ?? 'Insight');
              return (
                <div key={`${c.title}-${i}`} className={styles.agCard} style={{ overflow: 'hidden', padding: 0 }}>
                  {c.image && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                      <Image
                        src={c.image}
                        alt={`${c.title} — ${kicker}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                  <div style={{ padding: 26 }}>
                    <div className={styles.agNum}>{String(i + 1).padStart(2, '0')} · {kicker}</div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
            );
          case 'benefits':
            return (
      // === BENEFITS ===
      <section key="benefits" className={styles.section} id="benefits">
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{benefits.tag}</span>
            <h2 className={styles.h2}>{benefits.title}</h2>
            <div className={styles.line} />
          </div>
          <div className={styles.benGrid}>
            {benefits.items.map((b, i) => {
              const kicker = b.kicker ?? (['Qi Circulation', 'Vitality', 'Relaxation', 'Anti-inflammatory', 'Brain Health', 'Digestion'][i] ?? 'Benefit');
              return (
                <div key={`${b.title}-${i}`} className={styles.benItem} style={{ borderTop: 'none', overflow: 'hidden', padding: 0 }}>
                  {b.image && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                      <Image
                        src={b.image}
                        alt={`침향 효능 ${i + 1} — ${b.title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '18px 0 0', borderTop: '1px solid rgba(212,168,67,0.2)' }}>
                    <div className={styles.benIdx}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={styles.benKo}>{kicker}</div>
                    <h4>{b.title}</h4>
                    <p>{b.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
            );
          case 'process':
            return (
      // === PROCESS ===
      <section key="process" className={`${styles.section} ${styles.sectionAlt}`} id="process">
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{processData.tag}</span>
            <h2 className={styles.h2} style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.4rem)' }}>{processData.title}</h2>
            <div className={styles.line} />
            <p style={{ fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>
              묘목 발아에서 정밀 채취, 최종 검수까지 — 모든 단계의 책임을 감추지 않고 공개합니다.
            </p>
          </div>
          <div className={styles.procGrid}>
            {processData.steps.map((step, i) => (
              <div key={`${step}-${i}`} className={styles.procStep}>
                <div className={styles.procIdx}>{String(i + 1).padStart(2, '0')}</div>
                <h4>{step}</h4>
                <div className={styles.procDur}>{processDurations[i] ?? '—'}</div>
                {PROCESS_IMAGES[i] && (
                  <div className={styles.procImgWrap}>
                    <Image
                      src={PROCESS_IMAGES[i]}
                      alt={`침향 6단계 공정 ${String(i + 1).padStart(2, '0')} — ${step}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.procImg}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
            );
          default:
            return null;
          }
        })();
        const prefix = renderMetaPrefix(meta);
        const suffix = renderMetaSuffix(meta);
        if (!sectionContent && !prefix && !suffix) return null;
        if (!prefix && !suffix) return sectionContent;
        return (
          <React.Fragment key={`wrap-${sectionId}`}>
            {prefix}
            {sectionContent}
            {suffix}
          </React.Fragment>
        );
      })}
    </div>
  );
}
