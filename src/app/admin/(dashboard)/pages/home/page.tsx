'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

interface HomeHero {
  sectionTag: string;
  titleKr: string;
  subtitle: string;
  heroBg: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

interface HomeStat {
  value: string;
  label: string;
}

interface NoticeItem {
  num: string;
  text: string;
}

interface HomeNotice {
  tag: string;
  title: string;
  body: string;
  items: NoticeItem[];
  badges: string[];
  ctaLabel: string;
  ctaHref: string;
}

interface AgarwoodCard {
  title: string;
  description: string;
}

interface HomeAgarwood {
  tag: string;
  title: string;
  cards: AgarwoodCard[];
}

interface BenefitItem {
  title: string;
  description: string;
  kicker?: string;
}

interface HomeBenefits {
  tag: string;
  title: string;
  items: BenefitItem[];
}

interface HomeProcess {
  tag: string;
  title: string;
  steps: string[];
  durations?: string[];
}

interface VerificationRow { num: string; label: string; meta: string }
interface VerifiedCard { step: string; title: string; en: string; body: string }
interface CertChip { mark: string; name: string; sub: string }

interface ProblemImage { src: string; alt?: string }
interface ProblemCard { tag: string; title: string; body: string; image?: ProblemImage }
interface SpeciesRow {
  latin: string;
  alias: string;
  pharmacopoeia: boolean;
  foodCode: boolean;
  note: string;
  image?: { src: string; alt: string };
}
interface SpeciesDef {
  tag: string;
  title: string;
  body: string;
}
interface HomeProblem {
  tag: string;
  title: string;
  lead: string;
  image?: ProblemImage;
  cards: ProblemCard[];
  speciesTitle: string;
  species: SpeciesRow[];
  speciesFoot: string;
  speciesDefHerb?: SpeciesDef;
  speciesDefFood?: SpeciesDef;
  pharmacopoeiaLabel?: string;
  foodCodeLabel?: string;
}

// solutionCta 는 about-agarwood 어드민으로 이동(2026-05-17). 여기에선 타입 없음.

// === 신규 ===
interface HomeShowroomImage { src: string; tag?: string; title?: string; body?: string }
type HomeSectionId =
  | 'hero'
  | 'trustStrip'
  | 'showroom'
  | 'problem'
  | 'verified'
  | 'agarwood'
  | 'benefits'
  | 'process';

interface SectionMetaCta { label: string; href: string; variant?: 'gold' | 'outline' }
interface SectionMeta {
  hidden?: boolean;
  topTag?: string;
  titleQuote?: string;
  bodyLead?: string;
  cta?: SectionMetaCta;
}
type SectionMetaMap = Partial<Record<HomeSectionId, SectionMeta>>;

interface HomeData {
  hero: HomeHero;
  stats: HomeStat[];
  notice?: HomeNotice;
  agarwood?: HomeAgarwood;
  benefits?: HomeBenefits;
  process?: HomeProcess;
  verification?: VerificationRow[];
  verifiedCards?: VerifiedCard[];
  certs?: CertChip[];
  problem?: HomeProblem;
  // solutionCta 는 about-agarwood 어드민으로 이동(2026-05-17).
  // 기존 prod blob 의 home.solutionCta 데이터는 about-agarwood/page.tsx 가 fallback 으로 읽음.
  showroomImage?: HomeShowroomImage;
  sectionOrder?: HomeSectionId[];
  sectionMeta?: SectionMetaMap;
}

const DEFAULT_HERO: HomeHero = {
  sectionTag: 'Verified Agarwood · 참침향',
  titleKr: '확인되는 침향, 대라천 참침향',
  subtitle:
    '베트남 직영 농장에서 25년. 원산지·원료·제조·시험까지 4단계로 검증된 침향을 프리미엄이 아니라 근거로 증명합니다.',
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

// Notice — Verified 섹션 헤드 (가짜가 많을수록... + 4 인용 카드) 를 제어한다.
const DEFAULT_NOTICE: HomeNotice = {
  tag: 'Notice — 식약처 고시 기준',
  title: '가짜가 많을수록,\n*진짜는 드러난다*',
  body:
    "이젠 학명/품종부터 확인하세요!\n식품의약품안전처(식약처) 고시 '대한민국약전외한약(생약)규격집', '식품공전', '한약재 관능검사 해설서'와 '한국한의학연구원 한약자원연구센터'에\n공식 등록된 침향은 *'Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)'* 입니다.\n\n대라천 '참'침향은 첫 묘목부터 완제품까지 모든 단계와 과정을 투명하게 공개합니다.",
  items: [
    { num: '01', text: '대한민국약전외한약\n(생약)규격집' },
    { num: '02', text: '식약처\n식품공전' },
    { num: '03', text: '한약재 관능검사\n해설서' },
    { num: '04', text: '한국한의학연구원\n한약자원연구센터' },
  ],
  badges: [],
  ctaLabel: '',
  ctaHref: '',
};

const DEFAULT_AGARWOOD: HomeAgarwood = {
  tag: 'Agarwood · 신들의 나무',
  title: '수천 년을 지나온 가장 귀한 약재이자 향',
  cards: [
    {
      title: '동서양의 역사적 가치',
      description:
        '수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다.',
    },
    {
      title: '20년 이상의 긴 생육 시간',
      description:
        '20년 이상 생육된 침향나무에서 채취한 수지는 함량이 높아 약재로서 효능과 가치를 인정받습니다.',
    },
    {
      title: '논문에서 발표하는 침향',
      description:
        '침향 연구는 전 세계에서 활발히 이뤄지고 있으며, SCI급 논문도 실제 효과를 속속 보고합니다.',
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
    '최고급 제품 가공 및 검수',
  ],
  durations: ['6 — 12 Months', 'Ha Tinh 200ha', '20+ Years', '3 — 5 Years', 'Controlled Harvest', 'HACCP · GMP'],
};

const DEFAULT_VERIFICATION: VerificationRow[] = [
  { num: '01', label: '원산지 — 베트남 하띤 직영 200ha', meta: 'CITES' },
  { num: '02', label: '원료 — Aquilaria Agallocha Roxburgh', meta: '식약처' },
  { num: '03', label: '제조 — HACCP · GMP 시설', meta: '인증' },
  { num: '04', label: '시험 — 중금속·유해물질 0건', meta: 'LOT별' },
];

const DEFAULT_VERIFIED_CARDS: VerifiedCard[] = [
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

const DEFAULT_CERTS: CertChip[] = [
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전' },
  { mark: 'G', name: 'GMP', sub: '우수 제조' },
  { mark: 'O', name: 'ORGANIC', sub: '유기농' },
  { mark: 'V', name: '원산지', sub: '베트남 증명' },
  { mark: 'D', name: 'DNA', sub: '유전자 검증' },
  { mark: 'F', name: '식약처', sub: '고시 학명' },
  { mark: 'S', name: 'SGS', sub: '국제 검사' },
];

const DEFAULT_PROBLEM: HomeProblem = {
  tag: 'Notice · 침향을 고르기 전에',
  title: '침향을 구매할 때 가장 흔한 실수는\n*"좋다"는 말만 듣고 고르는 것*입니다.',
  lead: "SCI급 논문이 늘며 침향 제품도 빠르게 늘어나는 지금,\n'침향' 두 글자 · '아가우드' 한 단어만으로는 충분하지 않습니다.\n진짜 침향은 *학명 · 인증 · 산지* 세 가지로 확인됩니다.",
  image: { src: '', alt: '' },
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

// DEFAULT_SOLUTION_CTA 는 about-agarwood 어드민으로 이동(2026-05-17).

const DEFAULT_SHOWROOM: HomeShowroomImage = {
  src: '',
  tag: '',
  title: '',
  body: '',
};

const DEFAULT_SECTION_ORDER: HomeSectionId[] = [
  'hero',
  'trustStrip',
  'showroom',
  'problem',
  'verified',
  'agarwood',
  'benefits',
  'process',
];

const SECTION_LABELS: Record<HomeSectionId, string> = {
  hero: '히어로 (메인 + 3-Point Verification 우측 카드)',
  trustStrip: 'Trust Strip (4 통계)',
  showroom: '쇼룸 이미지',
  problem: 'Problem · 침향 시장 불안 (3 카드)',
  verified: 'Verified · 식약처 고시 기준 (Notice 헤드 + 4 인용 + 종 비교 + 인증)',
  agarwood: 'Agarwood · 신들의 나무',
  benefits: 'Benefits · 6대 효능',
  process: 'Craftsmanship · 6단계 공정',
};

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
    </div>
  );
}

function SectionCard({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{title}</h2>
      {children}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="adm-btn-primary px-6 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}

// 섹션별 옵셔널 메타 슬롯 편집기 — 감추기 토글 + 상단 태그 / 제목 인용문 / 본문 리드 / 하단 CTA.
// 값이 비어 있으면 사이트에 아무것도 추가되지 않음. (기존 섹션 구조 무영향)
function SectionMetaEditor({
  id,
  value,
  onChange,
  onSave,
  saving,
}: {
  id: HomeSectionId;
  value: SectionMeta | undefined;
  onChange: (next: SectionMeta) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const meta: SectionMeta = value ?? {};
  const cta: SectionMetaCta = meta.cta ?? { label: '', href: '', variant: 'gold' };
  const update = (patch: Partial<SectionMeta>) => onChange({ ...meta, ...patch });
  const updateCta = (patch: Partial<SectionMetaCta>) => onChange({ ...meta, cta: { ...cta, ...patch } });
  return (
    <details className="rounded-xl border border-emerald-200 bg-emerald-50/30 open:bg-emerald-50/60">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-emerald-900 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="text-emerald-700">⚙</span>
          <span>섹션 옵션 — 감추기 · 상단 태그 · 제목 인용문 · 본문 리드 · 하단 CTA</span>
        </span>
        <span className="flex items-center gap-2 text-xs">
          {meta.hidden && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">감춤</span>
          )}
          {(meta.topTag || meta.titleQuote || meta.bodyLead || (cta.label && cta.href)) && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">메타 적용</span>
          )}
        </span>
      </summary>
      <div className="space-y-4 px-4 pb-4 pt-2">
        {/* Hide toggle */}
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={!!meta.hidden}
            onChange={(e) => update({ hidden: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">이 섹션을 사이트에서 감춤</div>
            <div className="text-xs text-gray-500">체크하면 / (홈) 에서 해당 섹션이 렌더되지 않습니다. 데이터는 보존됩니다.</div>
          </div>
        </label>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            아래 슬롯은 비어 있으면 사이트에 표시되지 않습니다. 채우면 섹션 <em>위/아래</em>에 골드 톤 블록으로 추가됩니다. <br />
            본문은 <code className="bg-gray-100 px-1 rounded">*텍스트*</code>로 강조, 줄바꿈은 그냥 엔터.
          </p>

          <LabeledInput
            label="상단 태그 (예: Notice · 침향을 고르기 전에)"
            value={meta.topTag ?? ''}
            onChange={(v) => update({ topTag: v })}
          />
          <LabeledTextarea
            label="제목 인용문 (*강조* · 줄바꿈 허용)"
            value={meta.titleQuote ?? ''}
            onChange={(v) => update({ titleQuote: v })}
            rows={2}
          />
          <LabeledTextarea
            label="본문 리드 (*강조* · 줄바꿈 허용)"
            value={meta.bodyLead ?? ''}
            onChange={(v) => update({ bodyLead: v })}
            rows={3}
          />

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-2 text-sm font-medium text-gray-700">하단 CTA 버튼</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <LabeledInput
                label="버튼 라벨 (비우면 미표시)"
                value={cta.label}
                onChange={(v) => updateCta({ label: v })}
              />
              <LabeledInput
                label="버튼 링크 (비우면 미표시)"
                value={cta.href}
                onChange={(v) => updateCta({ href: v })}
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">버튼 스타일</label>
              <select
                value={cta.variant ?? 'gold'}
                onChange={(e) => updateCta({ variant: e.target.value as 'gold' | 'outline' })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="gold">골드 (채움)</option>
                <option value="outline">아웃라인 (테두리)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="adm-btn-primary px-5 py-1.5 text-sm disabled:opacity-50"
            title={`섹션 [${id}] 의 메타 슬롯 저장`}
          >
            {saving ? '저장 중…' : '섹션 옵션 저장'}
          </button>
        </div>
      </div>
    </details>
  );
}

function SectionGroup({
  label,
  index,
  total,
  onMoveUp,
  onMoveDown,
  children,
}: {
  label: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-gold-200 bg-gold-50/30 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[11px] font-medium tracking-wider text-gold-700">
            섹션 {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
          <h3 className="text-base font-bold text-gray-900">{label}</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gold-500 hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="섹션을 위로 이동"
          >
            ▲ 위로
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gold-500 hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="섹션을 아래로 이동"
          >
            ▼ 아래로
          </button>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function removeIndex<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<HomeHero>(DEFAULT_HERO);
  const [stats, setStats] = useState<HomeStat[]>(DEFAULT_STATS);
  const [notice, setNotice] = useState<HomeNotice>(DEFAULT_NOTICE);
  const [agarwood, setAgarwood] = useState<HomeAgarwood>(DEFAULT_AGARWOOD);
  const [benefits, setBenefits] = useState<HomeBenefits>(DEFAULT_BENEFITS);
  const [processSection, setProcessSection] = useState<HomeProcess>(DEFAULT_PROCESS);
  const [verification, setVerification] = useState<VerificationRow[]>(DEFAULT_VERIFICATION);
  const [certs, setCerts] = useState<CertChip[]>(DEFAULT_CERTS);
  const [problem, setProblem] = useState<HomeProblem>(DEFAULT_PROBLEM);
  const [showroomImage, setShowroomImage] = useState<HomeShowroomImage>(DEFAULT_SHOWROOM);
  const [sectionOrder, setSectionOrder] = useState<HomeSectionId[]>(DEFAULT_SECTION_ORDER);
  const [orderDirty, setOrderDirty] = useState(false);
  const [sectionMeta, setSectionMeta] = useState<SectionMetaMap>({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        if (res.status === 404) {
          // No pages doc yet — keep defaults
          return;
        }
        const data = (await res.json()) as { pages?: { home?: HomeData } };
        const d = data.pages?.home;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (Array.isArray(d?.stats) && d.stats.length > 0) setStats(d.stats);
        if (d?.notice) {
          const items = (d.notice.items && d.notice.items.length > 0) ? d.notice.items : DEFAULT_NOTICE.items;
          setNotice({ ...DEFAULT_NOTICE, ...d.notice, items, badges: d.notice.badges ?? [] });
        }
        if (d?.agarwood) setAgarwood({ ...DEFAULT_AGARWOOD, ...d.agarwood, cards: d.agarwood.cards ?? [] });
        if (d?.benefits) setBenefits({ ...DEFAULT_BENEFITS, ...d.benefits, items: d.benefits.items ?? [] });
        if (d?.process) setProcessSection({ ...DEFAULT_PROCESS, ...d.process, steps: d.process.steps ?? [], durations: d.process.durations ?? [] });
        if (Array.isArray(d?.verification)) setVerification(d.verification);
        if (Array.isArray(d?.certs)) setCerts(d.certs);
        if (d?.problem) {
          setProblem({
            ...DEFAULT_PROBLEM,
            ...d.problem,
            image: d.problem.image ?? DEFAULT_PROBLEM.image,
            cards: d.problem.cards ?? DEFAULT_PROBLEM.cards,
            species: d.problem.species ?? DEFAULT_PROBLEM.species,
          });
        }
        // d.solutionCta 는 about-agarwood 어드민으로 이동(2026-05-17). 여기서 로드 안 함.
        if (d?.showroomImage) setShowroomImage({ ...DEFAULT_SHOWROOM, ...d.showroomImage });
        if (Array.isArray(d?.sectionOrder)) {
          const valid = d.sectionOrder.filter((s): s is HomeSectionId => DEFAULT_SECTION_ORDER.includes(s as HomeSectionId));
          const withMissing = [...valid];
          for (const id of DEFAULT_SECTION_ORDER) if (!withMissing.includes(id)) withMissing.push(id);
          setSectionOrder(withMissing);
        }
        if (d?.sectionMeta && typeof d.sectionMeta === 'object') {
          setSectionMeta(d.sectionMeta);
        }
      } catch (err) {
        console.error('Failed to fetch home:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<HomeData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const body = res.ok ? ((await res.json()) as { pages?: { home?: HomeData } }) : { pages: {} };
      const currentHome = body.pages?.home ?? { hero: DEFAULT_HERO, stats: DEFAULT_STATS };
      const merged = { ...currentHome, ...payload };

      const result = await saveAdminPage('home', merged);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
    } catch (err) {
      console.error(`Save ${sectionKey} error:`, err);
      setToast({ msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setSaving(null);
    }
  }

  // 섹션 위치 이동 — UI 즉시 반영 + dirty 상태 표시. 저장은 명시적 버튼으로.
  function moveSection(from: number, to: number) {
    if (to < 0 || to >= sectionOrder.length) return;
    setSectionOrder(moveItem(sectionOrder, from, to));
    setOrderDirty(true);
  }

  async function saveSectionOrder() {
    await saveSection('sectionOrder', { sectionOrder });
    setOrderDirty(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 w-full rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 'speciesCompare' 는 sectionOrder 에 속하지 않는 가상 키 — verified 내부에서 명시적으로 호출.
  function renderGroupContent(id: HomeSectionId | 'speciesCompare'): React.ReactNode {
    switch (id) {
      case 'hero':
        return (
          <>
            {/* Hero */}
            <SectionCard title="Hero · 메인 히어로 (확인되는 침향, 대라천 참침향)" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
              <div className="space-y-5">
                <LabeledInput label="상단 태그라인" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
                <LabeledInput label="메인 제목" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
                <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">배경 이미지</label>
                  <ImageUploadField value={hero.heroBg} onChange={(url) => setHero({ ...hero, heroBg: url })} subdir="pages" />
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <LabeledInput label="CTA 1 라벨" value={hero.ctaPrimaryLabel} onChange={(v) => setHero({ ...hero, ctaPrimaryLabel: v })} />
                  <LabeledInput label="CTA 1 링크" value={hero.ctaPrimaryHref} onChange={(v) => setHero({ ...hero, ctaPrimaryHref: v })} />
                  <LabeledInput label="CTA 2 라벨" value={hero.ctaSecondaryLabel} onChange={(v) => setHero({ ...hero, ctaSecondaryLabel: v })} />
                  <LabeledInput label="CTA 2 링크" value={hero.ctaSecondaryHref} onChange={(v) => setHero({ ...hero, ctaSecondaryHref: v })} />
                </div>
              </div>
            </SectionCard>

            {/* Verification (hero 우측 카드) */}
            <SectionCard title="3-Point Verification · Hero 우측 카드 (01-04)" onSave={() => saveSection('verification', { verification })} saving={saving === 'verification'}>
              <div className="space-y-3">
                <p className="text-xs text-gray-500">히어로 오른쪽 &quot;3-Point Verification&quot; 카드의 행. 번호 / 본문 / 오른쪽 메타(태그).</p>
                {verification.map((r, i) => (
                  <div key={i} className="grid grid-cols-[72px_1fr_140px_auto] items-center gap-2">
                    <input value={r.num} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], num: e.target.value }; setVerification(n); }} placeholder="01" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <input value={r.label} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], label: e.target.value }; setVerification(n); }} placeholder="라벨 (예: 원산지 — 베트남 하띤 직영 200ha)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <input value={r.meta} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], meta: e.target.value }; setVerification(n); }} placeholder="메타 (예: CITES)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setVerification(moveItem(verification, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                      <button type="button" onClick={() => setVerification(moveItem(verification, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                      <button type="button" onClick={() => setVerification(removeIndex(verification, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setVerification([...verification, { num: '', label: '', meta: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 행 추가</button>
              </div>
            </SectionCard>
          </>
        );

      case 'trustStrip':
        return (
          <SectionCard title="Trust Strip · 4 통계 (25년·400만+·200ha·8건)" onSave={() => saveSection('stats', { stats })} saving={saving === 'stats'}>
            <div className="space-y-3">
              {stats.map((stat, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setStats(moveItem(stats, i, i - 1))}
                      disabled={i === 0}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => setStats(moveItem(stats, i, i + 1))}
                      disabled={i === stats.length - 1}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    value={stat.value}
                    onChange={(e) => {
                      const n = [...stats];
                      n[i] = { ...n[i], value: e.target.value };
                      setStats(n);
                    }}
                    placeholder="값 (예: 400만+)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <input
                    value={stat.label}
                    onChange={(e) => {
                      const n = [...stats];
                      n[i] = { ...n[i], label: e.target.value };
                      setStats(n);
                    }}
                    placeholder="레이블 (예: 침향 나무)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setStats(removeIndex(stats, i))}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStats([...stats, { value: '', label: '' }])}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
              >
                + 통계 추가
              </button>
            </div>
          </SectionCard>
        );

      case 'showroom':
        return (
          <SectionCard title="쇼룸 이미지 (선택 · 입력 시 표시)" onSave={() => saveSection('showroomImage', { showroomImage })} saving={saving === 'showroomImage'}>
            <div className="space-y-5">
              <p className="text-xs text-gray-500">트러스트 스트립 바로 아래에 표시되는 쇼룸/전시장 이미지. 이미지가 없으면 섹션 전체가 숨겨집니다.</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">이미지</label>
                <ImageUploadField value={showroomImage.src} onChange={(url) => setShowroomImage({ ...showroomImage, src: url })} subdir="pages" />
              </div>
              <LabeledInput label="태그 (선택, 예: Showroom · 대라천 전시장)" value={showroomImage.tag ?? ''} onChange={(v) => setShowroomImage({ ...showroomImage, tag: v })} />
              <LabeledInput label="제목 (선택)" value={showroomImage.title ?? ''} onChange={(v) => setShowroomImage({ ...showroomImage, title: v })} />
              <LabeledTextarea label="설명 (선택)" value={showroomImage.body ?? ''} onChange={(v) => setShowroomImage({ ...showroomImage, body: v })} rows={3} />
            </div>
          </SectionCard>
        );

      case 'problem':
        return (
          <SectionCard title="Problem · 불안 건드리기 (학명·인증·산지 + 종 비교)" onSave={() => saveSection('problem', { problem })} saving={saving === 'problem'}>
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                💡 강조: 텍스트에 <code className="rounded bg-gray-100 px-1">*강조할 부분*</code> 처럼 별표로 감싸면 금색 강조로 표시됩니다.
                줄바꿈은 그대로 줄바꿈으로 표시됩니다.
              </p>
              <LabeledInput label="상단 태그 (예: Notice · 침향을 고르기 전에)" value={problem.tag} onChange={(v) => setProblem({ ...problem, tag: v })} />
              <LabeledTextarea label="제목 인용문 (*...* 로 강조 · 줄바꿈 허용)" value={problem.title} onChange={(v) => setProblem({ ...problem, title: v })} rows={3} />
              <LabeledTextarea label="본문 리드 (*...* 로 강조 · 줄바꿈 허용)" value={problem.lead} onChange={(v) => setProblem({ ...problem, lead: v })} rows={4} />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">우측 이미지 (인증서·도장·CITES 정물)</label>
                <ImageUploadField
                  value={problem.image?.src ?? ''}
                  onChange={(url) => setProblem({ ...problem, image: { src: url, alt: problem.image?.alt ?? '' } })}
                  subdir="pages"
                />
                <input
                  type="text"
                  value={problem.image?.alt ?? ''}
                  onChange={(e) => setProblem({ ...problem, image: { src: problem.image?.src ?? '', alt: e.target.value } })}
                  placeholder="이미지 대체 텍스트 (예: 인증서·도장·CITES 마크 정물)"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">3 카드 · 학명/인증/산지 ({problem.cards.length})</label>
                <div className="space-y-3">
                  {problem.cards.map((c, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <input value={c.tag} onChange={(e) => { const n = [...problem.cards]; n[i] = { ...n[i], tag: e.target.value }; setProblem({ ...problem, cards: n }); }} placeholder="태그 (예: 01 · 학명)" className="w-44 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <input value={c.title} onChange={(e) => { const n = [...problem.cards]; n[i] = { ...n[i], title: e.target.value }; setProblem({ ...problem, cards: n }); }} placeholder="제목 (예: 정부 공식 학명을 확인할 수 있는가?)" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setProblem({ ...problem, cards: moveItem(problem.cards, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setProblem({ ...problem, cards: moveItem(problem.cards, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setProblem({ ...problem, cards: removeIndex(problem.cards, i) })} className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={3} value={c.body} onChange={(e) => { const n = [...problem.cards]; n[i] = { ...n[i], body: e.target.value }; setProblem({ ...problem, cards: n }); }} placeholder="본문" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="mt-2">
                        <label className="mb-1 block text-xs text-gray-500">카드 이미지 (다큐멘터리 톤 권장 · 4:3 비율)</label>
                        <ImageUploadField
                          value={c.image?.src ?? ''}
                          onChange={(url) => { const n = [...problem.cards]; n[i] = { ...n[i], image: { src: url, alt: n[i].image?.alt ?? '' } }; setProblem({ ...problem, cards: n }); }}
                          subdir="pages"
                        />
                        <input
                          type="text"
                          value={c.image?.alt ?? ''}
                          onChange={(e) => { const n = [...problem.cards]; n[i] = { ...n[i], image: { src: n[i].image?.src ?? '', alt: e.target.value } }; setProblem({ ...problem, cards: n }); }}
                          placeholder="이미지 대체 텍스트 (예: 식약처 약전 페이지 클로즈업)"
                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProblem({ ...problem, cards: [...problem.cards, { tag: '', title: '', body: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 카드 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        );

      case 'speciesCompare':
        return (
          <SectionCard title="종 비교 · 학명별 식약처 등재 비교 + 등록 기준 정의" onSave={() => saveSection('problem', { problem })} saving={saving === 'problem'}>
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                💡 Verified 섹션 내부(4 인용 카드와 인증 그리드 사이)에 렌더링됩니다.
                데이터는 problem.species* 에 저장되어 있어, 저장 시 Problem 데이터와 함께 갱신됩니다.
              </p>
              <div>
                <LabeledInput label="종 비교 섹션 제목" value={problem.speciesTitle} onChange={(v) => setProblem({ ...problem, speciesTitle: v })} />
                <p className="mt-2 text-xs text-gray-500">학명별 등재 여부 비교 (✓ ✗). 라벨 두 개는 아래에서 자유롭게 변경할 수 있습니다.</p>

                {/* 체크박스 라벨 (=프론트엔드 종 카드의 ✓/✗ 옆 텍스트) 편집 — 두 종 카드에 공통 적용. */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="라벨 ① — 약전외한약규격집 자리 (기본: 약전외한약규격집)"
                    value={problem.pharmacopoeiaLabel ?? ''}
                    onChange={(v) => setProblem({ ...problem, pharmacopoeiaLabel: v })}
                  />
                  <LabeledInput
                    label="라벨 ② — 식품공전 자리 (기본: 식품공전)"
                    value={problem.foodCodeLabel ?? ''}
                    onChange={(v) => setProblem({ ...problem, foodCodeLabel: v })}
                  />
                </div>

                <div className="mt-3 space-y-3">
                  {problem.species.map((s, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input value={s.latin} onChange={(e) => { const n = [...problem.species]; n[i] = { ...n[i], latin: e.target.value }; setProblem({ ...problem, species: n }); }} placeholder="학명 (예: Aquilaria agallocha Roxburgh)" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm italic focus:border-gold-500 focus:outline-none" />
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setProblem({ ...problem, species: moveItem(problem.species, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setProblem({ ...problem, species: moveItem(problem.species, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setProblem({ ...problem, species: removeIndex(problem.species, i) })} className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <input value={s.alias} onChange={(e) => { const n = [...problem.species]; n[i] = { ...n[i], alias: e.target.value }; setProblem({ ...problem, species: n }); }} placeholder="별칭 (예: AAR · 조엘라이프 침향)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" checked={s.pharmacopoeia} onChange={(e) => { const n = [...problem.species]; n[i] = { ...n[i], pharmacopoeia: e.target.checked }; setProblem({ ...problem, species: n }); }} />
                          {(problem.pharmacopoeiaLabel?.trim() || '약전외한약규격집') + ' 등재'}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" checked={s.foodCode} onChange={(e) => { const n = [...problem.species]; n[i] = { ...n[i], foodCode: e.target.checked }; setProblem({ ...problem, species: n }); }} />
                          {(problem.foodCodeLabel?.trim() || '식품공전') + ' 등재'}
                        </label>
                      </div>
                      <textarea rows={2} value={s.note} onChange={(e) => { const n = [...problem.species]; n[i] = { ...n[i], note: e.target.value }; setProblem({ ...problem, species: n }); }} placeholder="설명 (예: 한약(생약) · 식품 양쪽 모두 공식 기원 식물.)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="rounded-md border border-gray-200 bg-white p-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">카드 우측 상단 이미지 (정사각형 권장 · 빈 값이면 슬롯 숨김)</label>
                        <ImageUploadField
                          value={s.image?.src ?? ''}
                          onChange={(url) => {
                            const n = [...problem.species];
                            n[i] = url
                              ? { ...n[i], image: { src: url, alt: n[i].image?.alt ?? '' } }
                              : { ...n[i], image: undefined };
                            setProblem({ ...problem, species: n });
                          }}
                          subdir="pages"
                        />
                        <input
                          type="text"
                          value={s.image?.alt ?? ''}
                          onChange={(e) => {
                            const n = [...problem.species];
                            n[i] = { ...n[i], image: { src: n[i].image?.src ?? '', alt: e.target.value } };
                            setProblem({ ...problem, species: n });
                          }}
                          placeholder="이미지 대체 텍스트 (예: 베트남산 아갈로차 침향 원목 단면)"
                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                          disabled={!s.image?.src}
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProblem({ ...problem, species: [...problem.species, { latin: '', alias: '', pharmacopoeia: false, foodCode: false, note: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 종 추가</button>
                </div>
              </div>

              <LabeledTextarea label="종 비교 하단 안내문" value={problem.speciesFoot} onChange={(v) => setProblem({ ...problem, speciesFoot: v })} rows={2} />

              {/* 식약처 등록 기준 정의 — 두 품종에 공통 적용. 풀폭 단일 컬럼 스택 렌더링. */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">두 품종 공통 적용 — 식약처 등록 기준 정의</p>
                  <p className="mt-1 text-xs text-gray-500">
                    종 카드 아래에 풀폭 1열로 표시됩니다. 본문에 <code className="rounded bg-gray-100 px-1">*강조*</code> 별표 마커 사용 가능.
                  </p>
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700">① 의약품 · 한약(생약) 정의 (골드 라인)</p>
                  <input
                    value={problem.speciesDefHerb?.tag ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefHerb: { tag: e.target.value, title: problem.speciesDefHerb?.title ?? '', body: problem.speciesDefHerb?.body ?? '' } })}
                    placeholder="태그 (예: 의약품 · 한약(생약))"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <input
                    value={problem.speciesDefHerb?.title ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefHerb: { tag: problem.speciesDefHerb?.tag ?? '', title: e.target.value, body: problem.speciesDefHerb?.body ?? '' } })}
                    placeholder="제목 (예: '대한약전외한약(생약)규격집 등록' 이란?)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={problem.speciesDefHerb?.body ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefHerb: { tag: problem.speciesDefHerb?.tag ?? '', title: problem.speciesDefHerb?.title ?? '', body: e.target.value } })}
                    placeholder="본문 (*의약품 원료* 처럼 별표로 강조)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-md border border-emerald-200 bg-emerald-50/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-emerald-700">② 식품 · 식용 원료 정의 (그린 라인)</p>
                  <input
                    value={problem.speciesDefFood?.tag ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefFood: { tag: e.target.value, title: problem.speciesDefFood?.title ?? '', body: problem.speciesDefFood?.body ?? '' } })}
                    placeholder="태그 (예: 식품 · 식용 원료)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <input
                    value={problem.speciesDefFood?.title ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefFood: { tag: problem.speciesDefFood?.tag ?? '', title: e.target.value, body: problem.speciesDefFood?.body ?? '' } })}
                    placeholder="제목 (예: '식품공전 등록' 이란?)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={problem.speciesDefFood?.body ?? ''}
                    onChange={(e) => setProblem({ ...problem, speciesDefFood: { tag: problem.speciesDefFood?.tag ?? '', title: problem.speciesDefFood?.title ?? '', body: e.target.value } })}
                    placeholder="본문 (*공식 식품* 처럼 별표로 강조)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        );

      case 'verified':
        return (
          <>
            {/* Notice — Verified 섹션 헤드 + 4 인용 카드 */}
            <SectionCard
              title="Verified 헤드 · &quot;가짜가 많을수록...&quot; + 4 인용 카드"
              onSave={() => saveSection('notice', { notice })}
              saving={saving === 'notice'}
            >
              <div className="space-y-5">
                <p className="text-xs text-gray-500">
                  💡 강조: <code className="rounded bg-gray-100 px-1">*강조*</code> 별표 마커. 줄바꿈은 그대로 표시됩니다.
                  본문은 빈 줄(<code className="rounded bg-gray-100 px-1">\n\n</code>) 로 단락 분리.
                </p>
                <LabeledInput label="상단 태그 (예: Notice — 식약처 고시 기준)" value={notice.tag} onChange={(v) => setNotice({ ...notice, tag: v })} />
                <LabeledTextarea label="제목 (*...* 강조 · 줄바꿈 허용)" value={notice.title} onChange={(v) => setNotice({ ...notice, title: v })} rows={3} />
                <LabeledTextarea label="본문 (단락 분리: 빈 줄)" value={notice.body} onChange={(v) => setNotice({ ...notice, body: v })} rows={6} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">인용 카드 ({notice.items.length}개 · 4개 권장)</label>
                  <p className="mb-2 text-xs text-gray-500">번호 / 본문(줄바꿈 1회 허용). 헤드 아래에 그리드로 표시되는 출처 인용 카드.</p>
                  <div className="space-y-3">
                    {notice.items.map((it, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <input value={it.num} onChange={(e) => { const n = [...notice.items]; n[i] = { ...n[i], num: e.target.value }; setNotice({ ...notice, items: n }); }} placeholder="번호 (예: 01)" className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gold-500 focus:outline-none" />
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setNotice({ ...notice, items: moveItem(notice.items, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
                            <button type="button" onClick={() => setNotice({ ...notice, items: moveItem(notice.items, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
                            <button type="button" onClick={() => setNotice({ ...notice, items: removeIndex(notice.items, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                          </div>
                        </div>
                        <textarea rows={2} value={it.text} onChange={(e) => { const n = [...notice.items]; n[i] = { ...n[i], text: e.target.value }; setNotice({ ...notice, items: n }); }} placeholder="본문 (줄바꿈 1회 허용)" className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setNotice({ ...notice, items: [...notice.items, { num: '', text: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 인용 카드 추가</button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 종 비교 — refGrid 와 Certifications 사이에 인라인 렌더(2026-05-17 이동). */}
            {renderGroupContent('speciesCompare')}

            {/* Certifications */}
            <SectionCard title="Certifications · 인증 칩 그리드" onSave={() => saveSection('certs', { certs })} saving={saving === 'certs'}>
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Verified 섹션 인용 카드 아래의 인증 그리드. 마크(한 글자 이니셜) · 이름 · 부제.</p>
                {certs.map((c, i) => (
                  <div key={i} className="grid grid-cols-[60px_1fr_2fr_auto] items-center gap-2">
                    <input value={c.mark} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], mark: e.target.value }; setCerts(n); }} placeholder="C" maxLength={3} className="rounded-lg border border-gray-300 px-3 py-2 text-center font-serif text-sm focus:border-gold-500 focus:outline-none" />
                    <input value={c.name} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], name: e.target.value }; setCerts(n); }} placeholder="이름 (예: CITES)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <input value={c.sub} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], sub: e.target.value }; setCerts(n); }} placeholder="부제 (예: 국제 보호 수종)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setCerts(moveItem(certs, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                      <button type="button" onClick={() => setCerts(moveItem(certs, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                      <button type="button" onClick={() => setCerts(removeIndex(certs, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setCerts([...certs, { mark: '', name: '', sub: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 인증 추가</button>
              </div>
            </SectionCard>

            {/* Solution CTA 는 침향 이야기 > 진짜 침향 구별 탭으로 이동(2026-05-17).
                /admin/pages/about-agarwood → 진짜 침향 구별 방법 에서 편집. */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-amber-900">
              <strong>Solution CTA 이동 안내</strong>
              <div className="mt-1 text-amber-800">
                &lsquo;학명·인증·산지&rsquo; 결론 박스는 침향 이야기(/about-agarwood) 의
                &lsquo;진짜 침향 구별 방법&rsquo; 탭으로 이동했습니다. 편집은{' '}
                <a href="/admin/pages/about-agarwood" className="underline font-semibold">/admin/pages/about-agarwood</a>{' '}
                → &lsquo;진짜 침향 구별&rsquo; 탭에서 진행하세요.
              </div>
            </div>
          </>
        );

      case 'agarwood':
        return (
          <SectionCard title="Agarwood · 신들의 나무" onSave={() => saveSection('agarwood', { agarwood })} saving={saving === 'agarwood'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={agarwood.tag} onChange={(v) => setAgarwood({ ...agarwood, tag: v })} />
                <LabeledInput label="제목" value={agarwood.title} onChange={(v) => setAgarwood({ ...agarwood, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">카드 ({agarwood.cards.length})</label>
                <div className="space-y-3">
                  {agarwood.cards.map((c, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={c.title} onChange={(e) => { const n = [...agarwood.cards]; n[i] = { ...n[i], title: e.target.value }; setAgarwood({ ...agarwood, cards: n }); }} placeholder="카드 제목" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="ml-2 flex gap-1">
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: moveItem(agarwood.cards, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: moveItem(agarwood.cards, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: removeIndex(agarwood.cards, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={3} value={c.description} onChange={(e) => { const n = [...agarwood.cards]; n[i] = { ...n[i], description: e.target.value }; setAgarwood({ ...agarwood, cards: n }); }} placeholder="설명" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">카드 이미지 (선택)</label>
                        <ImageUploadField value={(c as AgarwoodCard & { image?: string }).image ?? ''} onChange={(url) => { const n = [...agarwood.cards]; n[i] = { ...n[i], image: url } as AgarwoodCard; setAgarwood({ ...agarwood, cards: n }); }} subdir="pages" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: [...agarwood.cards, { title: '', description: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 카드 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        );

      case 'benefits':
        return (
          <SectionCard title="Benefits · 연구 기반 효능 (6개)" onSave={() => saveSection('benefits', { benefits })} saving={saving === 'benefits'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={benefits.tag} onChange={(v) => setBenefits({ ...benefits, tag: v })} />
                <LabeledInput label="제목" value={benefits.title} onChange={(v) => setBenefits({ ...benefits, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">효능 항목 ({benefits.items.length})</label>
                <div className="space-y-3">
                  {benefits.items.map((it, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={it.title} onChange={(e) => { const n = [...benefits.items]; n[i] = { ...n[i], title: e.target.value }; setBenefits({ ...benefits, items: n }); }} placeholder="제목" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="ml-2 flex gap-1">
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: moveItem(benefits.items, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: moveItem(benefits.items, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: removeIndex(benefits.items, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={3} value={it.description} onChange={(e) => { const n = [...benefits.items]; n[i] = { ...n[i], description: e.target.value }; setBenefits({ ...benefits, items: n }); }} placeholder="설명" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">이미지 (선택)</label>
                        <ImageUploadField value={(it as BenefitItem & { image?: string }).image ?? ''} onChange={(url) => { const n = [...benefits.items]; n[i] = { ...n[i], image: url } as BenefitItem; setBenefits({ ...benefits, items: n }); }} subdir="pages" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setBenefits({ ...benefits, items: [...benefits.items, { title: '', description: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 효능 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        );

      case 'process':
        return (
          <SectionCard title="Craftsmanship · 6단계 공정" onSave={() => saveSection('process', { process: processSection })} saving={saving === 'process'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={processSection.tag} onChange={(v) => setProcessSection({ ...processSection, tag: v })} />
                <LabeledInput label="제목" value={processSection.title} onChange={(v) => setProcessSection({ ...processSection, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">공정 단계 + 소요기간 ({processSection.steps.length})</label>
                <p className="mb-2 text-xs text-gray-500">각 단계의 이름과 오른쪽에 표시될 기간·라벨을 짝으로 입력합니다.</p>
                <div className="space-y-2">
                  {processSection.steps.map((s, i) => (
                    <div key={i} className="grid grid-cols-[32px_1fr_1fr_auto] items-center gap-2">
                      <span className="text-center text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                      <input value={s} onChange={(e) => { const n = [...processSection.steps]; n[i] = e.target.value; setProcessSection({ ...processSection, steps: n }); }} placeholder="공정 단계명 (예: 씨앗 발아)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <input value={processSection.durations?.[i] ?? ''} onChange={(e) => { const n = [...(processSection.durations ?? [])]; while (n.length < processSection.steps.length) n.push(''); n[i] = e.target.value; setProcessSection({ ...processSection, durations: n }); }} placeholder="기간 라벨 (예: 6 — 12 Months)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => {
                          const ns = moveItem(processSection.steps, i, i - 1);
                          const nd = moveItem(processSection.durations ?? [], i, i - 1);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                        <button type="button" onClick={() => {
                          const ns = moveItem(processSection.steps, i, i + 1);
                          const nd = moveItem(processSection.durations ?? [], i, i + 1);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                        <button type="button" onClick={() => {
                          const ns = removeIndex(processSection.steps, i);
                          const nd = removeIndex(processSection.durations ?? [], i);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProcessSection({ ...processSection, steps: [...processSection.steps, ''], durations: [...(processSection.durations ?? []), ''] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 단계 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">홈 편집</h1>
        <p className="mb-6 text-gray-500">
          / (홈) 페이지의 모든 섹션을 한 곳에서 편집합니다. 각 섹션 우상단의 <strong className="text-gold-700">▲ 위로 / ▼ 아래로</strong> 버튼으로
          순서를 변경한 뒤 <strong className="text-gold-700">[순서 저장]</strong> 을 눌러야 사이트에 반영됩니다.
        </p>

        {/* 섹션 순서 저장 바 — 변경이 있을 때만 활성. */}
        <div
          className={`sticky top-2 z-30 mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors ${
            orderDirty
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="text-sm">
            {orderDirty ? (
              <span className="font-medium text-amber-700">
                ⚠ 섹션 순서가 변경되었습니다 — 아직 사이트에 반영되지 않았습니다.
              </span>
            ) : (
              <span className="text-gray-500">
                섹션 순서: 변경 사항 없음
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSectionOrder(DEFAULT_SECTION_ORDER);
                setOrderDirty(true);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400"
              title="섹션 순서를 기본값으로 되돌립니다 (저장 전까지 사이트에 반영되지 않음)"
            >
              ↺ 기본 순서
            </button>
            <button
              type="button"
              onClick={saveSectionOrder}
              disabled={!orderDirty || saving === 'sectionOrder'}
              className="adm-btn-primary px-4 py-1.5 text-sm disabled:opacity-40"
            >
              {saving === 'sectionOrder' ? '저장 중…' : '순서 저장'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {sectionOrder.map((id, idx) => (
            <SectionGroup
              key={id}
              label={SECTION_LABELS[id]}
              index={idx}
              total={sectionOrder.length}
              onMoveUp={() => moveSection(idx, idx - 1)}
              onMoveDown={() => moveSection(idx, idx + 1)}
            >
              <SectionMetaEditor
                id={id}
                value={sectionMeta[id]}
                onChange={(next) => setSectionMeta((prev) => ({ ...prev, [id]: next }))}
                onSave={() => saveSection('sectionMeta', { sectionMeta })}
                saving={saving === 'sectionMeta'}
              />
              {renderGroupContent(id)}
            </SectionGroup>
          ))}
        </div>
      </div>
    </div>
  );
}
