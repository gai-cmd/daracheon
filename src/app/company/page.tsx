import type { Metadata } from 'next';
import { readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import styles from '@/styles/zoel/story-page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회사소개 - ZOEL LIFE(조엘라이프) | ZOEL LIFE',
  description:
    'ZOEL LIFE(조엘라이프) 회사 소개. 베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축하는 프리미엄 침향 브랜드.',
  alternates: { canonical: 'https://www.daracheon.com/company' },
};

// LocalBusiness + Organization + BreadcrumbList 통합 JSON-LD
// Naver/Google 지식 그래프 카드, "회사 소개 박스" 노출 + AI Overview 엔티티 매칭.
const companyJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://www.daracheon.com/#localbusiness',
      name: '대라천 ZOEL LIFE Co., Ltd.',
      alternateName: ['대라천', 'ZOEL LIFE', '조엘라이프', '大羅天'],
      description:
        '1999년 베트남 하띤 직영 농장에서 시작해 2003년 한국에 본사를 설립한 침향 전문 기업. 원산지·원료·제조·시험 4단계 검증 체계.',
      url: 'https://www.daracheon.com',
      logo: 'https://www.daracheon.com/images/logo.png',
      image: 'https://www.daracheon.com/images/og-default.jpg',
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
        url: 'https://www.daracheon.com/products',
      },
      sameAs: [
        'https://www.daracheon.com',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.daracheon.com' },
        { '@type': 'ListItem', position: 2, name: '회사소개', item: 'https://www.daracheon.com/company' },
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
  {
    num: '04',
    tag: 'Contact',
    title: '본사 · 찾아오시는 길',
    body:
      '주소 · 서울특별시 강남구 테헤란로 521, 파르나스타워 5층\n' +
      '교통 · 지하철 2호선 삼성역 5번 출구 도보 3분\n' +
      '운영 · 평일 09:00~18:00 (토·일·공휴일 휴무)\n' +
      '전화 · 070-4140-4086',
  },
];

export default async function CompanyPage() {
  const pagesData = await readSingleSafe<{ company?: CompanyData }>('pages');
  const settings = await readSingleSafe<{ brandLogo?: string; companyLogo?: string }>('company');
  const brandLogo = settings?.brandLogo || '/images/logo-brand.png';
  const companyLogo = settings?.companyLogo ?? '';

  const hero: CompanyHero = pagesData?.company?.hero
    ? { ...DEFAULT_HERO, ...pagesData.company.hero }
    : DEFAULT_HERO;
  const chapters: CompanyChapter[] =
    pagesData?.company?.chapters && pagesData.company.chapters.length > 0
      ? pagesData.company.chapters
      : DEFAULT_CHAPTERS;

  return (
    <>
      <JsonLd data={companyJsonLd} />
      {/* HERO */}
      <section
        className={`${styles.hero} orn-grain orn-grain--faint`}
        style={{
          paddingBottom: '108px',
          ...(hero.heroImage ? {
            background: `radial-gradient(1200px 600px at 20% 30%, rgba(212,168,67,.10), transparent 60%), linear-gradient(180deg, rgba(10,11,16,.50) 0%, rgba(20,22,31,.58) 100%), url("${hero.heroImage}") center/cover no-repeat`,
          } : {}),
        }}
      >
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
    </>
  );
}
