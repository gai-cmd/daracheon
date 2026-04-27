import type { Metadata } from 'next';
import { readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import AboutAgarwoodClient from './AboutAgarwoodClient';

// Admin 저장 즉시 반영을 위해 dynamic 렌더링 (CDN/ISR 캐시 우회).
// readSingleSafe 는 내부적으로 unstable_cache + tag 무효화를 사용하므로
// blob 비용은 admin 저장 시점에만 발생.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '침향 이야기 — 학명 Aquilaria Agallocha Roxburgh | 대라천 ZOEL LIFE',
  description:
    '식약처 공식 등재 침향(沈香, Aquilaria Agallocha Roxburgh)의 정의·형성 과정·효능·문헌·논문·매체 보도를 한 페이지에 정리. 수십 년 숙성이 만든 세계 3대 향의 모든 것.',
  keywords: [
    '침향', '沈香', 'Agarwood', 'Aquilaria Agallocha Roxburgh',
    '침향 효능', '침향 학명', '침향 정의', '대라천', 'ZOEL LIFE',
    '식약처 침향', '동의보감 침향', '본초강목 침향',
  ],
  alternates: { canonical: 'https://www.daracheon.com/about-agarwood' },
  openGraph: {
    type: 'article',
    title: '침향 이야기 — 식약처 등재 Aquilaria Agallocha Roxburgh',
    description: '학명·정의·효능·문헌·논문·매체 보도까지, 진짜 침향을 알아야 할 모든 것.',
    url: 'https://www.daracheon.com/about-agarwood',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    images: [{ url: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png', width: 1200, height: 630, alt: '대라천 침향 이야기' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '침향 이야기 — 학명 Aquilaria Agallocha Roxburgh',
    description: '식약처 공식 등재 침향의 정의·형성·효능·문헌·논문 종합 가이드.',
    images: ['https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png'],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '침향이란? 침향의 정의 효능 등급 역사 완벽 가이드',
  description: '식약처 고시 공식 등록 침향의 정의, 효능, 문헌, 논문을 완벽 가이드합니다.',
  author: { '@type': 'Organization', name: 'ZOEL LIFE' },
  publisher: { '@type': 'Organization', name: 'ZOEL LIFE', logo: { '@type': 'ImageObject', url: 'https://www.daracheon.com/images/logo.png' } },
  datePublished: '2026-01-07',
  dateModified: '2026-04-17',
  image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.daracheon.com' },
    { '@type': 'ListItem', position: 2, name: '침향 이야기', item: 'https://www.daracheon.com/about-agarwood' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '침향이란 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '침향(沈香)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지가 수십 년간 나무 속에 쌓여 굳은 향목입니다.' } },
    { '@type': 'Question', name: '공식 침향의 학명은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '대한민국약전외한약(생약)규격집과 식약처 식품공전에 공식 등록된 침향은 Aquilaria Agallocha Roxburgh(AAR)입니다.' } },
    { '@type': 'Question', name: '침향의 대표적인 효능은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '기혈 순환, 원기 회복, 신경 안정 및 숙면 유도, 항염 및 혈관 건강 개선, 뇌 질환 예방, 소화 기능 향상 등이 주요 효능으로 알려져 있습니다.' } },
  ],
};

export interface FormationStep { step: string; title: string; description: string }
export interface SpecialReason { title: string; description: string }
export interface Benefit { title: string; description: string }
export interface DosageItem { num: string; title: string; body: string }
export interface DosageSection { tag?: string; title: string; items: DosageItem[] }
export interface Literature { title: string; author: string; year: string; topic: string; description: string }
export interface Paper { title: string; journal: string; year: string; citations: string; authors?: string; link?: string }
export interface MediaItem { outlet: string; date?: string; title: string; summary?: string; image?: string; link?: string }
export interface TestimonialItem { name: string; role?: string; rating?: number; body: string; product?: string; image?: string; link?: string }
export interface RegistryRow { label: string; value: string }
export interface RegistrySection { title: string; subtitle?: string; rows: RegistryRow[] }

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
export interface AuthenticityTab {
  subtitle: string;
  intro: string;
  check01Title: string;
  check01Body: string;
  check01Sources: AuthenticitySource[];
  check02Title: string;
  check02Body: string;
  check02QuoteSource: string;
  check02QuoteBody: string;
  check03Title: string;
  check03Body: string;
  check03Docs: AuthenticityDoc[];
}

export interface AboutAgarwoodData {
  hero: { sectionTag: string; titleKr: string; titleEn: string; subtitle: string; heroImage: string };
  definitionSection: { title: string; subtitle: string; body: string; officialNameCallout: string };
  officialSourcesSection?: OfficialSourcesSection;
  registrySection?: RegistrySection;
  formationSteps: FormationStep[];
  specialReasons: SpecialReason[];
  benefits: Benefit[];
  dosageSection?: DosageSection;
  authenticityTab?: AuthenticityTab;
  literatures: Literature[];
  papers: Paper[];
  cta: { title: string; buttonProducts: string; buttonProductsHref: string; buttonBrand: string; buttonBrandHref: string };
  mediaTab?: { tag: string; title: string; subtitle?: string; items: MediaItem[] };
  testimonialsTab?: { tag: string; title: string; subtitle?: string; items: TestimonialItem[] };
}

export default async function AboutAgarwoodPage() {
  const pagesData = await readSingleSafe<{ aboutAgarwood: AboutAgarwoodData; brandStory: unknown }>('pages');
  const data: AboutAgarwoodData | null = pagesData?.aboutAgarwood ?? null;

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
