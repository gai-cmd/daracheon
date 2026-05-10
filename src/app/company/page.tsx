import type { Metadata } from 'next';
import Image from 'next/image';
import { readDataSafe, readSingleSafe, readSingleUncached } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import type { FaqItem } from '@/data/company';
import styles from '@/styles/zoel/story-page.module.css';
import CompanyContactSection, { type SupportData } from './CompanyContactSection';

export const dynamic = 'force-dynamic';

interface FaqItemWithMeta extends FaqItem {
  id?: string;
  category?: string;
}

export const metadata: Metadata = {
  title: '회사소개 — 조엘라이프(주)',
  description:
    '대라천 ZOEL LIFE(조엘라이프) 회사 소개·문의·FAQ·오시는 길. 1998년 캄보디아에서 시작, 베트남 하띤성 200ha 직영 농장 25년 — 원산지부터 글로벌 유통까지 완벽한 가치사슬을 구축한 프리미엄 침향 전문 브랜드.',
  keywords: [
    '대라천', '대라천 회사', '대라천 본사', 'ZOEL LIFE', 'ZOEL LIFE 회사', '조엘라이프', '조엘라이프 회사소개',
    '침향 회사', '침향 전문 회사', '침향 브랜드 회사',
    '베트남 침향 회사', '하띤 침향 회사',
    '대라천 문의', '대라천 FAQ', '침향 문의',
  ],
  alternates: { canonical: 'https://zoellife.com/company' },
  openGraph: {
    type: 'website',
    title: '회사소개 — 조엘라이프(주) ZOEL LIFE',
    description: '1998년 캄보디아에서 시작, 베트남 하띤 200ha 직영 농장 25년 — 원산지부터 글로벌 유통까지의 프리미엄 침향 전문 브랜드 조엘라이프 회사 소개.',
    url: 'https://zoellife.com/company',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    images: [{
      url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/company-hero-default.jpg',
      alt: '조엘라이프(주) 대라천 ZOEL LIFE — 베트남 직영 25년 프리미엄 침향 브랜드',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '회사소개 — 조엘라이프(주) ZOEL LIFE',
    description: '베트남 하띤 200ha 직영 농장 25년 — 프리미엄 침향 전문 브랜드 회사 소개.',
    images: ['https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/company-hero-default.jpg'],
  },
};

// LocalBusiness + Organization + BreadcrumbList 통합 JSON-LD
// Naver/Google 지식 그래프 카드, "회사 소개 박스" 노출 + AI Overview 엔티티 매칭.
const companyJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://zoellife.com/#localbusiness',
      name: '대라천 ZOEL LIFE Co., Ltd.',
      alternateName: ['대라천', 'ZOEL LIFE', '조엘라이프', '大羅天'],
      description:
        '1999년 베트남 하띤 직영 농장에서 시작해 2003년 한국에 본사를 설립한 침향 전문 기업. 원산지·원료·제조·시험 4단계 검증 체계.',
      url: 'https://zoellife.com',
      logo: 'https://zoellife.com/images/logo.png',
      image: 'https://zoellife.com/images/og-default.jpg',
      telephone: '+82-70-4140-4086',
      email: 'contact@daracheon.com',
      foundingDate: '2003',
      founder: {
        '@type': 'Person',
        name: '박병주',
        jobTitle: '대표',
        description: '전 식품영양학과 교수, 베트남 농업부 자문위원. 25년간 침향 원목 수확까지 직접 관리.',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '테헤란로 521 파르나스타워 5층',
        addressLocality: '강남구',
        addressRegion: '서울특별시',
        addressCountry: 'KR',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        },
      ],
      areaServed: ['KR', 'VN'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: '대라천 침향 제품',
        url: 'https://zoellife.com/products',
      },
      sameAs: [
        'https://zoellife.com',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://zoellife.com' },
        { '@type': 'ListItem', position: 2, name: '회사소개', item: 'https://zoellife.com/company' },
      ],
    },
  ],
};

interface CompanyChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  image?: string;
}

interface CompanyHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
  heroImage?: string;
}

interface CompanyData {
  hero?: CompanyHero;
  chapters?: CompanyChapter[];
}

const DEFAULT_HERO: CompanyHero = {
  kicker: '회사 소개 · About Us',
  titleLine1: '진짜를 증명하는 일에',
  titleEmphasis: '25년을 쓰다',
  lede:
    '대라천 ZOEL LIFE Co., Ltd. — 베트남 직영 농장 기반의 침향 전문 기업. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시 규격집에 등재된 공식 침향만을 다룹니다.',
};

const DEFAULT_CHAPTERS: CompanyChapter[] = [
  {
    num: '01',
    tag: 'About',
    title: '회사 개요',
    body: '대라천 ZOEL LIFE Co., Ltd.는 1999년 베트남 하띤 직영 농장에서 시작해, 2003년 한국에 본사를 설립한 침향 전문 기업입니다. "진짜를 증명한다"는 단 하나의 원칙으로 25년간 원산지·원료·제조·시험의 4단계 검증 체계를 구축해왔습니다.',
  },
  {
    num: '02',
    tag: 'Leadership',
    title: '창립자 · 박병주 대표',
    body: '전 식품영양학과 교수, 베트남 농업부 자문위원. 1999년 하띤에서 첫 침향나무를 만난 뒤 25년간 한 그루 한 그루의 수확까지 직접 관리해 왔습니다. 저서 《침향, 수지가 말하는 25년》(2022) — "한국 시장에 진짜 침향을 돌려놓겠다"는 약속으로 일해온 증거.',
  },
  {
    num: '03',
    tag: '인증',
    title: '공식 인증 · 등록',
    body: 'CITES 등록 VN-2008-AAR-003 · 베트남 농업부 수출허가 EXP-VN-2024-112 · 식약처 건강기능식품 전문제조업 허가 · ISO 22000 식품안전경영시스템 · HACCP 인증 제조시설. 모든 인증서는 본사 또는 홈페이지 〈검증〉 메뉴에서 원본 확인이 가능합니다.',
  },
];

interface ProductCategoryRow {
  id: string;
  label: string;
  labelEn?: string;
}

export default async function CompanyPage() {
  const [pagesData, settings, faqItems, productCategories] = await Promise.all([
    // unstable_cache 우회 — blob 외부 변경 즉시 반영. force-dynamic 라우트라 매 요청 fresh.
    readSingleUncached<{ company?: CompanyData; support?: SupportData }>('pages'),
    readSingleSafe<{ brandLogo?: string; companyLogo?: string }>('company'),
    readDataSafe<FaqItemWithMeta>('faq'),
    readDataSafe<ProductCategoryRow>('productCategories'),
  ]);

  const brandLogo = settings?.brandLogo || '/images/logo-brand.png';
  const companyLogo = settings?.companyLogo ?? '';

  const hero: CompanyHero = pagesData?.company?.hero
    ? { ...DEFAULT_HERO, ...pagesData.company.hero }
    : DEFAULT_HERO;
  const chapters: CompanyChapter[] =
    pagesData?.company?.chapters && pagesData.company.chapters.length > 0
      ? pagesData.company.chapters
      : DEFAULT_CHAPTERS;
  // 문의 폼의 "관심 제품 / 제목" 드롭다운은 /admin/products 의 카테고리 관리에서 단일 소스로 제공.
  // 'all' 은 필터 전용이라 제외. 카테고리가 비어 있을 때만 support.productOptions 로 폴백.
  const categoryOptions = productCategories
    .filter((c) => c.id && c.id !== 'all' && c.label)
    .map((c) => c.label);
  const supportBase = pagesData?.support ?? null;
  const supportData: SupportData | null = supportBase
    ? { ...supportBase, productOptions: categoryOptions.length > 0 ? categoryOptions : supportBase.productOptions }
    : categoryOptions.length > 0
      ? { productOptions: categoryOptions }
      : null;

  // FAQPage JSON-LD — 실제 DB 데이터 기반 동적 생성.
  // /support 통합으로 회사소개 페이지가 FAQ 의 정식 위치가 됨.
  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={companyJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero.heroImage && (
          <Image
            src={hero.heroImage}
            alt=""
            fill
            sizes="100vw"
            priority
            unoptimized
            aria-hidden
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
          />
        )}
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero.kicker}</div>
          <div className={styles.heroMain}>
            <h1>
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
            </h1>
            <p className={styles.lede}>{hero.lede}</p>
          </div>
        </div>
      </section>

      {/* CHAPTERS — 01 회사소개 에 브랜드/회사 로고 크게 배치 */}
      {chapters.map((ch, i) => {
        const isFirstChapter = i === 0 || ch.num === '01';
        const showLogos = isFirstChapter && (brandLogo || companyLogo);
        return (
          <section
            key={`${ch.num}-${i}`}
            className={`${styles.chapter} ${i % 2 === 1 ? styles.chapterAlt : ''}`}
          >
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>{ch.num}</div>
                  <div className={styles.chapterTag}>{ch.tag}</div>
                </div>
                <div className={styles.chapterBody}>
                  <h3>{ch.title}</h3>
                  {showLogos && (
                    <div
                      style={{
                        margin: '24px 0 36px',
                        padding: '40px 48px',
                        background: 'rgba(212,168,67,0.05)',
                        border: '1px solid rgba(212,168,67,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 28,
                      }}
                    >
                      <img
                        src={brandLogo}
                        alt="조엘라이프 ZOEL LIFE"
                        style={{
                          height: 'clamp(64px, 10vw, 96px)',
                          width: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <span
                          style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
                            fontWeight: 500,
                            letterSpacing: '0.04em',
                            color: '#fff',
                            lineHeight: 1,
                          }}
                        >
                          조엘라이프(주)
                        </span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
                            fontWeight: 400,
                            letterSpacing: '0.32em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            lineHeight: 1,
                          }}
                        >
                          ZOEL LIFE
                        </span>
                      </div>
                    </div>
                  )}
                  {ch.image && !showLogos && (
                    <div style={{ margin: '24px 0', position: 'relative', width: '100%', maxWidth: 560, aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={ch.image} alt={ch.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}
                  <p>{ch.body}</p>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CONTACT — 문의 양식 + 전화 + 회사 정보 + 지도 + FAQ (구 /support 통합) */}
      <CompanyContactSection faqItems={faqItems} supportData={supportData} />
    </>
  );
}
