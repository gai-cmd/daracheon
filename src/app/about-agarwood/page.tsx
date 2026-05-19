import type { Metadata } from 'next';
import { readSingleUncached } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import AboutAgarwoodClient from './AboutAgarwoodClient';

// Admin 저장 / 외부 시드 스크립트로 blob 갱신 시 즉시 반영.
// readSingleUncached 는 unstable_cache 우회하므로 blob 1 회 read 비용은
// 페이지 요청마다 발생하지만, 라이브 업데이트 신뢰성이 우선.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '침향 이야기 — 학명 Aquilaria Agallocha Roxburgh',
  description:
    '식약처 공식 등재 침향(沈香, Aquilaria Agallocha Roxburgh)의 정의·형성 과정·효능·문헌·논문·매체 보도를 한 페이지에 정리. 수십 년 숙성이 만든 세계 3대 향의 모든 것.',
  keywords: [
    // 토픽
    '침향', '沈香', 'Agarwood', 'Aquilaria Agallocha Roxburgh', '아퀼라리아 아갈로차 록스버그',
    // 정의/지식 의도
    '침향이란', '침향 정의', '침향 학명', '침향 등급', '침향 종류',
    '침향 형성 과정', '침향 수지', '침향 향', '세계 3대 향',
    // 효능
    '침향 효능', '침향 효과', '침향 부작용', '침향 복용법',
    '아가로스피롤', '침향 신경 안정', '침향 자양강장',
    // 문헌/근거
    '식약처 침향', '대한민국약전외한약 침향', '한국한의학연구원 침향',
    '동의보감 침향', '본초강목 침향', '향약집성방 침향',
    // 브랜드
    '대라천', 'ZOEL LIFE', '조엘라이프',
  ],
  alternates: { canonical: 'https://zoellife.com/about-agarwood' },
  openGraph: {
    type: 'article',
    title: '침향 이야기 — 식약처 등재 Aquilaria Agallocha Roxburgh',
    description: '학명·정의·효능·문헌·논문·매체 보도까지, 진짜 침향을 알아야 할 모든 것.',
    url: 'https://zoellife.com/about-agarwood',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    images: [{
      url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/agarwood-definition.png',
      alt: '침향 이야기 — 식약처 등재 Aquilaria Agallocha Roxburgh 정의·효능·문헌',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '침향 이야기 — 학명 Aquilaria Agallocha Roxburgh',
    description: '식약처 공식 등재 침향의 정의·형성·효능·문헌·논문 종합 가이드.',
    images: ['https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/agarwood-definition.png'],
  },
};

const SITE_URL = 'https://zoellife.com';

// hero 이미지는 OG 이미지(우리 인프라)로 통일 — 외부 CDN 의존 금지(CLAUDE.md).
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${SITE_URL}/about-agarwood#article`,
  headline: '침향이란? 침향의 정의 효능 등급 역사 완벽 가이드',
  description: '식약처 고시 공식 등록 침향의 정의, 효능, 문헌, 논문을 완벽 가이드합니다.',
  inLanguage: 'ko-KR',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntityOfPage: `${SITE_URL}/about-agarwood`,
  about: { '@id': `${SITE_URL}/#brand` },
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
  datePublished: '2026-01-07',
  dateModified: '2026-04-17',
  image: `${SITE_URL}/opengraph-image.jpg`,
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: '침향 이야기', item: `${SITE_URL}/about-agarwood` },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/about-agarwood#faq`,
  inLanguage: 'ko-KR',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#brand` },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['[itemprop=acceptedAnswer]'],
  },
  mainEntity: [
    { '@type': 'Question', name: '침향이란 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '침향(沈香)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지가 수십 년간 나무 속에 쌓여 굳은 향목입니다.' } },
    { '@type': 'Question', name: '공식 침향의 학명은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '대한민국약전외한약(생약)규격집과 식약처 식품공전에 공식 등록된 침향은 Aquilaria Agallocha Roxburgh(AAR)입니다.' } },
    { '@type': 'Question', name: '침향의 대표적인 효능은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '기혈 순환, 원기 회복, 신경 안정 및 숙면 유도, 항염 및 혈관 건강 개선, 뇌 질환 예방, 소화 기능 향상 등이 주요 효능으로 알려져 있습니다.' } },
  ],
};

export interface FormationStep { step: string; title: string; description: string; image?: string }
export interface SpecialReason { title: string; description: string; image?: string }
export interface Benefit { title: string; description: string; image?: string }
export interface DosageItem { num: string; title: string; body: string; image?: string }
export interface DosageSection { tag?: string; title: string; items: DosageItem[] }
export interface Literature { title: string; author: string; year: string; topic: string; description: string }
export interface Scripture { title: string; author: string; year: string; topic: string; description: string }
export interface Paper {
  title: string;
  titleKr?: string;
  journal: string;
  year: string;
  citations: string;
  authors?: string;
  link?: string;
  /** 한글 요약 (300자 내외) — 카드의 "요약 보기" 모달에 표시 */
  summaryKr?: string;
}
export interface RegistryRow { label: string; value: string }
export interface RegistrySection { title: string; subtitle?: string; rows: RegistryRow[] }
export interface UsageItem { product: string; instruction: string; }
export interface UsageTab {
  tag?: string;
  title?: string;
  subtitle?: string;
  introLines?: string[];
  items: UsageItem[];
}

export interface OfficialSource {
  num: string;
  name: string;
  authority: string;
  finding: string;
  detail: string;
  highlight?: string;
}
export interface OfficialSourcesSection {
  title: string;
  subtitle: string;
  sources: OfficialSource[];
  conclusionTitle: string;
  conclusionBody: string;
}

export interface AuthenticitySource { label: string; value: string; }
export interface AuthenticityDoc { doc: string; desc: string; highlight?: boolean; }
export interface AuthenticitySummary {
  // 신규(권장): line1 안에 **강조어** 마커로 강조 부분 지정.
  line1?: string;
  // 구버전 호환 — 분리 저장된 prefix / highlight / suffix.
  prefix?: string;
  highlight?: string;
  suffix?: string;
  line2: string;
}
export interface SolutionPillar { label: string; text: string }
export interface SolutionButton { label: string; href: string; variant?: 'gold' | 'outline' }
export interface SolutionCta {
  title: string;
  pillars: SolutionPillar[];
  buttons: SolutionButton[];
}

export interface AuthenticityEra {
  era: string;
  body: string;
}

export interface AuthenticityTab {
  subtitle: string;
  intro: string;
  // 진짜 침향 구별 — 상단 상징 이미지 바로 아래 표시되는 결론 박스.
  // 홈에서 이동(2026-05-17). 기존 home.solutionCta 데이터는 서버 컴포넌트가 fallback.
  solutionCta?: SolutionCta;
  check01Title: string;
  check01Body: string;
  check01Sources: AuthenticitySource[];
  check01Summary?: AuthenticitySummary;
  check02Title: string;
  check02Body: string;
  check02QuoteSource: string;
  check02QuoteBody: string;
  // CHECK 02 인용 박스 아래에 노출되는 시대별 산지 기록 블록 (옵션).
  // intro/outro 는 *...* 골드 강조 마커 지원.
  check02EraIntro?: string;
  check02Eras?: AuthenticityEra[];
  check02EraOutro?: string;
  check03Title: string;
  check03Body: string;
  check03Docs: AuthenticityDoc[];
}

export interface TabHeroes {
  tab0?: string;  // 침향이란?
  tab1?: string;  // 진짜 침향 구별 방법
  tab2?: string;  // 문헌에 실린 침향
  tab3?: string;  // 논문에 실린 침향
  tab4?: string;  // 복용 및 사용법
  // 2026-05-18 추가 — 새 탭(경전에 실린 침향) 히어로 이미지.
  // 기존 tab0..tab4 key 는 CMS 에 저장된 의미와 그대로 묶여 있어 위치만 시프트.
  tabScriptures?: string; // 경전에 실린 침향
}

export interface AboutAgarwoodData {
  hero: { sectionTag: string; titleKr: string; titleEn: string; subtitle: string; heroImage: string };
  tabHeroes?: TabHeroes;
  definitionSection: { title: string; subtitle: string; body: string; officialNameCallout: string; images?: string[] };
  officialSourcesSection?: OfficialSourcesSection;
  registrySection?: RegistrySection;
  formationSteps: FormationStep[];
  formationSectionTitle?: string;
  specialReasons: SpecialReason[];
  specialReasonsSectionTitle?: string;
  benefits: Benefit[];
  benefitsSectionTitle?: string;
  dosageSection?: DosageSection;
  authenticityTab?: AuthenticityTab;
  literatures: Literature[];
  scriptures?: Scripture[];
  papers: Paper[];
  cta: { title: string; buttonProducts: string; buttonProductsHref: string; buttonBrand: string; buttonBrandHref: string };
  usageTab?: UsageTab;
}

export default async function AboutAgarwoodPage() {
  const pagesData = await readSingleUncached<{
    aboutAgarwood: AboutAgarwoodData;
    home?: { solutionCta?: SolutionCta };
    brandStory: unknown;
  }>('pages');
  const rawAbout: AboutAgarwoodData | null = pagesData?.aboutAgarwood ?? null;
  // Legacy fallback — solutionCta 는 2026-05-17 이전엔 home.solutionCta 에 저장됐다.
  // about-agarwood 어드민에서 새로 저장하기 전까지는 기존 home 값을 그대로 노출.
  const legacyHomeSolutionCta = pagesData?.home?.solutionCta;
  const data: AboutAgarwoodData | null = rawAbout
    ? {
        ...rawAbout,
        authenticityTab: rawAbout.authenticityTab
          ? {
              ...rawAbout.authenticityTab,
              solutionCta: rawAbout.authenticityTab.solutionCta ?? legacyHomeSolutionCta,
            }
          : rawAbout.authenticityTab,
      }
    : null;

  // ScholarlyArticle JSON-LD — 검증된 논문 데이터(저자·연도·저널·링크
  // 모두 갖춘 항목) 만 schema 에 포함. dummy / 일부만 입력된 항목은 제외.
  // 빈 schema 출력은 가짜 신호이므로 입력 충실한 것이 1건 이상일 때만 emit.
  const verifiedPapers = (data?.papers ?? []).filter(
    (p) => p.title && p.authors && p.year && p.journal && p.link,
  );
  const scholarlyJsonLd = verifiedPapers.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '대라천 사이트에 인용된 침향 관련 학술 논문',
    itemListElement: verifiedPapers.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'ScholarlyArticle',
        headline: p.title,
        author: { '@type': 'Person', name: p.authors! },
        datePublished: String(p.year),
        isPartOf: { '@type': 'Periodical', name: p.journal },
        url: p.link,
        sameAs: p.link,
        ...(p.citations && p.citations !== '-' ? { citation: p.citations } : {}),
      },
    })),
  } : null;

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {scholarlyJsonLd && <JsonLd data={scholarlyJsonLd} />}
      <AboutAgarwoodClient data={data} />
    </>
  );
}
