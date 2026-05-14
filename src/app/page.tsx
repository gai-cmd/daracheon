import type { Metadata } from 'next';
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
}

export interface SpeciesRow {
  latin: string;
  alias: string;
  pharmacopoeia: boolean;
  foodCode: boolean;
  note: string;
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
  speciesTitle: "같은 'Aquilaria' 라도, 약전 기준은 다릅니다",
  species: [
    { latin: 'Aquilaria agallocha Roxburgh', alias: 'AAR · 조엘라이프 침향', pharmacopoeia: true, foodCode: true, note: '한약(생약) · 식품 양쪽 모두 공식 기원 식물.' },
    { latin: 'Aquilaria malaccensis Lam.', alias: '말라켄시스', pharmacopoeia: false, foodCode: true, note: '식용 원료로만 허용 · 한약 기원 식물은 아님.' },
  ],
  speciesFoot: '시장에서는 두 종 모두 "침향" · "아가우드"로 표시될 수 있어, 학명까지 확인하지 않으면 어떤 종인지 알 수 없습니다.',
};

const DEFAULT_SOLUTION_CTA: HomeSolutionCta = {
  title: '조엘라이프는 *학명 · 인증 · 산지*를 기준으로\n고객이 직접 확인할 수 있는 침향을 제안합니다.',
  pillars: [
    { label: '학명', text: 'Aquilaria Agallocha Roxburgh — 식약처 등재' },
    { label: '인증', text: 'CITES · OCOP · HACCP · GMP · FDA — 12건 인증' },
    { label: '산지', text: '베트남 하띤 직영 200ha — 역사적 정품 산지' },
  ],
  buttons: [
    { label: '구매 전 확인사항 보기', href: '/about-agarwood', variant: 'gold' },
    { label: '조엘라이프 검증 기준 보기', href: '/brand-story', variant: 'outline' },
  ],
};

// "*텍스트*" 마커를 <em> 으로, "\n" 을 <br /> 로 렌더링.
// admin 에서 강조 부분과 줄바꿈을 직접 편집할 수 있게 한다.
function renderMarked(text: string, emClass?: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let idx = 0;
    while (remaining.length > 0) {
      const start = remaining.indexOf('*');
      if (start === -1) {
        parts.push(remaining);
        break;
      }
      if (start > 0) parts.push(remaining.slice(0, start));
      const end = remaining.indexOf('*', start + 1);
      if (end === -1) {
        parts.push(remaining.slice(start));
        break;
      }
      parts.push(
        <em key={`em-${li}-${idx++}`} className={emClass}>
          {remaining.slice(start + 1, end)}
        </em>,
      );
      remaining = remaining.slice(end + 1);
    }
    return (
      <span key={`line-${li}`}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
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
  const processDurations = home.process?.durations ?? PROCESS_DURATIONS;
  const showroomImage = home.showroomImage;
  // problem 섹션: 신규 problem.image 우선, 없으면 legacy problemImage 사용
  const problem: HomeProblem = home.problem
    ? { ...DEFAULT_PROBLEM, ...home.problem, cards: home.problem.cards ?? DEFAULT_PROBLEM.cards, species: home.problem.species ?? DEFAULT_PROBLEM.species }
    : DEFAULT_PROBLEM;
  const problemImage = problem.image ?? home.problemImage;
  const solutionCta: HomeSolutionCta = home.solutionCta
    ? { ...DEFAULT_SOLUTION_CTA, ...home.solutionCta, pillars: home.solutionCta.pillars ?? DEFAULT_SOLUTION_CTA.pillars, buttons: home.solutionCta.buttons ?? DEFAULT_SOLUTION_CTA.buttons }
    : DEFAULT_SOLUTION_CTA;

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
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
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
                {verification.map((row, i) => (
                  <div key={`${row.num}-${i}`} className={styles.heroTrustRow}>
                    <div className={styles.heroTrustNum}>{row.num}</div>
                    <div className={styles.heroTrustLabel}>{row.label}</div>
                    <div className={styles.heroTrustMeta}>{row.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className={styles.trustStrip}>
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

      {/* SHOWROOM IMAGE — 트러스트 스트립 직후 */}
      {showroomImage?.src && (
        <section className={styles.section} aria-label="대라천 침향 전시장">
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
      )}

      {/* PROBLEM — 불안 건드리기 (학명·인증·산지 + 말라켄시스 비교) */}
      <section className={styles.problem} aria-label="침향 시장의 위험과 진짜 침향 구별 기준">
        <div className={styles.wrap}>
          <div className={styles.problemHeadRow}>
            <div className={styles.problemHead}>
              <span className={styles.problemWarning}>{problem.tag}</span>
              <h2 className={styles.problemQuote}>{renderMarked(problem.title)}</h2>
              <div className={styles.problemHeadLine} />
              <p className={styles.problemLead}>{renderMarked(problem.lead)}</p>
            </div>

            {/* 우측: 다큐멘터리 정물 사진 (인증서·도장·CITES 마크) */}
            <div className={styles.problemImageWrap}>
              {problemImage?.src ? (
                <Image
                  src={problemImage.src}
                  alt={problemImage.alt ?? '인증서·도장·CITES 마크 정물'}
                  fill
                  sizes="(max-width: 1000px) 100vw, 45vw"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.problemImagePlaceholder} aria-hidden="true">
                  <span>Documentary Still Life</span>
                  <span className={styles.problemImagePlaceholderSub}>
                    인증서 · 도장 · CITES 마크
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.problemGrid}>
            {problem.cards.map((c, i) => (
              <div key={`${c.tag}-${i}`} className={styles.problemCard}>
                <div className={styles.problemCardTag}>{c.tag}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>

          {/* agallocha vs malaccensis */}
          <div className={styles.speciesCompare}>
            <div className={styles.speciesCompareTitle}>{problem.speciesTitle}</div>
            <div className={styles.speciesTable}>
              {problem.species.map((s, i) => (
                <div key={`${s.latin}-${i}`} className={styles.speciesRow}>
                  <div className={styles.speciesLatin}>{s.latin}</div>
                  <div className={styles.speciesAlias}>{s.alias}</div>
                  <div className={styles.speciesMarks}>
                    <span className={styles.speciesMark}>
                      <span className={s.pharmacopoeia ? styles.markOk : styles.markNo}>
                        {s.pharmacopoeia ? '✓' : '✗'}
                      </span>{' '}
                      약전외한약규격집
                    </span>
                    <span className={styles.speciesMark}>
                      <span className={s.foodCode ? styles.markOk : styles.markNo}>
                        {s.foodCode ? '✓' : '✗'}
                      </span>{' '}
                      식품공전
                    </span>
                  </div>
                  <p className={styles.speciesNote}>{s.note}</p>
                </div>
              ))}
            </div>
            <p className={styles.speciesFoot}>{problem.speciesFoot}</p>
          </div>
        </div>
      </section>

      {/* VERIFIED */}
      <section className={styles.verified} id="verified">
        <div className={styles.wrap}>
          <div className={styles.verifiedHead}>
            <span className={styles.tag}>Notice — 식약처 고시 기준</span>
            <h2 className={styles.h2}>
              가짜가 많을수록,
              <br />
              <em>진짜는 드러난다</em>
            </h2>
            <div className={styles.line} />
            <p>
              이젠 학명/품종부터 확인하세요!<br />
              식품의약품안전처(식약처) 고시 &lsquo;대한민국약전외한약(생약)규격집&rsquo;,
              &lsquo;식품공전&rsquo;, &lsquo;한약재 관능검사 해설서&rsquo;와
              &lsquo;한국한의학연구원 한약자원연구센터&rsquo;에<br />
              공식 등록된 침향은{' '}
              <em style={{ color: 'var(--accent)', fontStyle: 'normal', fontFamily: "'Noto Serif KR', serif", fontWeight: 400 }}>
                &lsquo;Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)&rsquo;
              </em>
              입니다.
            </p>
            <p>
              대라천 &lsquo;참&rsquo;침향은 첫 묘목부터 완제품까지 모든 단계와 과정을 투명하게 공개합니다.
            </p>
          </div>

          <div className={styles.refGrid}>
            {[
              { num: '01', label: '대한민국약전외한약\n(생약)규격집' },
              { num: '02', label: '식약처\n식품공전' },
              { num: '03', label: '한약재 관능검사\n해설서' },
              { num: '04', label: '한국한의학연구원\n한약자원연구센터' },
            ].map(({ num, label }) => (
              <div key={num} className={styles.refCard}>
                <span className={styles.refNum}>{num}</span>
                <p className={styles.refLabel}>{label.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}</p>
              </div>
            ))}
          </div>

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

          {/* SOLUTION CTA */}
          <div className={styles.solutionCta}>
            <h3 className={styles.solutionCtaTitle}>{renderMarked(solutionCta.title)}</h3>
            <div className={styles.solutionCtaPillars}>
              {solutionCta.pillars.map((p, i) => (
                <div key={`${p.label}-${i}`} className={styles.solutionCtaPillar}>
                  <div className={styles.solutionCtaPillarLabel}>{p.label}</div>
                  <div className={styles.solutionCtaPillarText}>{p.text}</div>
                </div>
              ))}
            </div>
            <div className={styles.solutionCtaButtons}>
              {solutionCta.buttons.map((b, i) => (
                <Link
                  key={`${b.label}-${i}`}
                  href={b.href}
                  className={b.variant === 'outline' ? styles.btnOutline : styles.btnGold}
                >
                  {b.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AGARWOOD INTRO */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
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

      {/* BENEFITS */}
      <section className={styles.section} id="benefits">
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

      {/* PROCESS */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="process">
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
    </div>
  );
}
