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
/**
 * 언론에 실린 침향 — 외부 매체 보도 인용 항목.
 * 저작권은 각 언론사에 있으므로 제목·짧은 요약만 인용하고 `link` 로 원문을 가리킨다.
 * outlet / date / link 가 모두 채워진 항목만 NewsArticle 구조화 데이터로 노출된다
 * (미검증 항목이 schema 에 섞이지 않도록 — papers 와 동일 정책).
 */
export interface MediaArticle {
  /** 매체명 (예: 한국경제) */
  outlet: string;
  /** 기사 제목 — 원문 표기 그대로 */
  title: string;
  /** 발행일. 표기용 'YYYY.MM.DD' (구조화 데이터에서 ISO 로 변환) */
  date?: string;
  /** 인용 요약 — 원문 복제가 아닌 자체 요약 1~2문장 */
  summary?: string;
  /** 원문 링크 (필수 권장 — 인용 근거이자 구조화 데이터 url) */
  link?: string;
  image?: string;
}
export interface MediaTabData {
  tag?: string;
  title?: string;
  subtitle?: string;
  items: MediaArticle[];
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
  // 2026-08-16 — 복용 및 사용법 탭이 /brand-story 로 이동하면서 이 자리는
  // '언론에 실린 침향' 히어로가 된다 (어드민의 "탭 5 히어로" 와 동일 key).
  tab4?: string;  // 언론에 실린 침향
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
  // 경전 탭 — 히어로 이미지 아래, 카드 그리드 위에 노출되는 도입 문단.
  // 문단은 빈 줄(\n\n)로 구분. *...* 마커는 골드 강조로 렌더링.
  scriptureIntro?: string;
  papers: Paper[];
  cta: { title: string; buttonProducts: string; buttonProductsHref: string; buttonBrand: string; buttonBrandHref: string };
  // 언론에 실린 침향 탭. 어드민(침향 이야기 편집 → 언론에 실린 침향)에서 편집하며,
  // 항목을 추가하면 아래 pressJsonLd 가 자동으로 구조화 데이터에 반영한다.
  mediaTab?: MediaTabData;
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

  // 언론에 실린 침향 — 외부 매체 보도 인용 목록의 구조화 데이터.
  // 우리가 발행한 기사가 아니므로 페이지의 mainEntity 로 선언하지 않고,
  // ItemList 안의 NewsArticle 로 "이 브랜드를 다룬 외부 기사" 임을 표현한다.
  //   · publisher = 실제 발행 매체
  //   · url       = 원문 링크 (인용 근거)
  //   · about     = 우리 브랜드 엔티티
  // 어드민에서 항목을 추가하면 이 배열이 그대로 늘어나므로 별도 코드 수정이 필요 없다.
  const pressItems = (data?.mediaTab?.items ?? []).filter(
    (m) => m.title && m.outlet && m.link && m.date,
  );
  const pressJsonLd = pressItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/about-agarwood#press`,
    name: '언론에 실린 침향 — 대라천 참침향 보도 모음',
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    itemListElement: pressItems.slice(0, 50).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: m.link,
      item: {
        '@type': 'NewsArticle',
        headline: m.title,
        datePublished: toIsoDate(m.date!),
        url: m.link,
        mainEntityOfPage: m.link,
        publisher: { '@type': 'NewsMediaOrganization', name: m.outlet },
        about: { '@id': `${SITE_URL}/#brand` },
        ...(m.image ? { image: m.image } : {}),
      },
    })),
  } : null;

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {scholarlyJsonLd && <JsonLd data={scholarlyJsonLd} />}
      {pressJsonLd && <JsonLd data={pressJsonLd} />}
      <AboutAgarwoodClient data={data} />
    </>
  );
}

/**
 * 어드민 표기용 날짜('2026.05.16', '2026-05-16', '2026/05/16')를 schema.org 가
 * 요구하는 ISO 8601(YYYY-MM-DD)로 변환. 형식을 못 알아보면 원본을 그대로 돌려주고,
 * 호출부에서 이미 date 존재 여부를 검사하므로 빈 값은 들어오지 않는다.
 */
function toIsoDate(raw: string): string {
  const m = raw.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return raw.trim();
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
