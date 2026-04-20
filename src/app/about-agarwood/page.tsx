import { readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import AboutAgarwoodClient from './AboutAgarwoodClient';

// Admin 저장 즉시 반영을 위해 dynamic 렌더링 (CDN/ISR 캐시 우회).
// readSingleSafe 는 내부적으로 unstable_cache + tag 무효화를 사용하므로
// blob 비용은 admin 저장 시점에만 발생.
export const dynamic = 'force-dynamic';

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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '침향이란 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '침향(沈香)은 팥꽃나무과(Thymeleaceae)에 속하는 Aquilaria 속 나무가 외부 상처나 곰팡이 감염에 대응하여 분비한 수지가 수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목입니다.' } },
    { '@type': 'Question', name: '공식 침향의 학명은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '대한민국약전외한약(생약)규격집과 식약처 식품공전에 공식 등록된 침향은 Aquilaria Agallocha Roxburgh(AAR)입니다.' } },
    { '@type': 'Question', name: '침향의 대표적인 효능은 무엇인가요?', acceptedAnswer: { '@type': 'Answer', text: '기혈 순환, 원기 회복, 신경 안정 및 숙면 유도, 항염 및 혈관 건강 개선, 뇌 질환 예방, 소화 기능 향상 등이 주요 효능으로 알려져 있습니다.' } },
  ],
};

export interface FormationStep { step: string; title: string; description: string }
export interface SpecialReason { title: string; description: string }
export interface Benefit { title: string; description: string }
export interface Literature { title: string; author: string; year: string; topic: string; description: string }
export interface Paper { title: string; journal: string; year: string; citations: string; authors?: string; link?: string }
export interface MediaItem { outlet: string; date?: string; title: string; summary?: string; image?: string; link?: string }
export interface TestimonialItem { name: string; role?: string; rating?: number; body: string; product?: string; image?: string }
export interface RegistryRow { label: string; value: string }
export interface RegistrySection { title: string; subtitle?: string; rows: RegistryRow[] }

export interface AboutAgarwoodData {
  hero: { sectionTag: string; titleKr: string; titleEn: string; subtitle: string; heroImage: string };
  definitionSection: { title: string; subtitle: string; body: string; officialNameCallout: string };
  registrySection?: RegistrySection;
  formationSteps: FormationStep[];
  specialReasons: SpecialReason[];
  benefits: Benefit[];
  literatures: Literature[];
  papers: Paper[];
  cta: { title: string; buttonProducts: string; buttonProductsHref: string; buttonBrand: string; buttonBrandHref: string };
  mediaTab?: { tag: string; title: string; subtitle?: string; items: MediaItem[] };
  testimonialsTab?: { tag: string; title: string; subtitle?: string; items: TestimonialItem[] };
}

export default async function AboutAgarwoodPage() {
  const pagesData = await readSingleSafe<{ aboutAgarwood: AboutAgarwoodData; brandStory: unknown }>('pages');
  const data: AboutAgarwoodData | null = pagesData?.aboutAgarwood ?? null;

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <AboutAgarwoodClient data={data} />
    </>
  );
}
