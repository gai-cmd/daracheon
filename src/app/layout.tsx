import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChromeGate from '@/components/layout/ChromeGate';
import JsonLd from '@/components/ui/JsonLd';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { readSingleSafe, readSingleUncached } from '@/lib/db';
import {
  DEFAULT_MAIN_NAV,
  type NavigationData,
} from '@/data/navigation';
import '@/styles/globals.css';

// 사이트 단일 정규 도메인 — 모든 메타/JSON-LD/sitemap 이 이 값을 기준.
// 환경변수로 오버라이드 가능 (스테이징/프리뷰 대응).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\s+/g, '')
  .replace(/\/$/, '');

const DEFAULT_TITLE = '대라천 ZOEL LIFE — 베트남 직영 프리미엄 침향(Aquilaria Agallocha Roxburgh) 전문 브랜드';
const DEFAULT_DESCRIPTION =
  '식약처 공식 등재 침향(Aquilaria Agallocha Roxburgh) 전문 브랜드 대라천 ZOEL LIFE. 베트남 하띤성 200ha 직영 농장에서 25년간 재배·연구한 정품 침향만 취급합니다. 침향 오일·캡슐·침향단(환)·선향(스틱)·침향수·침향차 한국 직판. HACCP·GMP·CITES·FDA 인증, Lot별 시험성적서 공개.';

// 검색 의도별로 키워드 카테고리화 — Title/Description 으로 잡기 어려운 long-tail
// 까지 metadata.keywords 로 보강. (Google 자체는 keywords 가중치 낮지만
// Naver/Bing/AI 크롤러가 토픽 분류에 활용.)
const KW_BRAND = ['대라천', 'ZOEL LIFE', '조엘라이프', '대라천 침향', '조엘라이프 침향', '大羅天', 'Đại La Thiên'];
const KW_PRODUCT = [
  '침향 오일', '침향오일', '침향 캡슐', '침향캡슐', '참 침향 캡슐',
  '침향환', '침향단', '침향 선향', '침향 스틱', '침향수', '침향차',
  '침향 보석함', '침향 선물세트', '침향 명절선물',
];
const KW_BENEFIT = [
  '침향 효능', '침향 효과', '침향 부작용', '침향 복용법',
  '침향 자양강장', '침향 숙면', '침향 항염', '침향 혈관',
  '침향 신경 안정', '침향 소화', '침향 뇌 건강', '아가로스피롤',
];
const KW_ORIGIN = [
  '베트남 침향', '하띤 침향', '베트남 하띤성 침향', '직영 농장 침향',
  'Aquilaria Agallocha Roxburgh', '아퀼라리아 아갈로차 록스버그',
  '식약처 등재 침향', '대한민국약전외한약 침향', 'CITES 침향',
];
const KW_COMPARE = [
  '진짜 침향', '정품 침향', '프리미엄 침향', '명품 침향',
  '침향 가짜 구별', '침향 구매', '침향 직구', '침향 한국 직판',
  '국산 침향 vs 베트남 침향', '침향 추천',
];
const KW_AUTHORITY = [
  'HACCP 침향', 'GMP 침향', 'FDA 등록 침향', 'OCOP 침향',
  '침향 시험성적서', '침향 중금속 검사', '침향 학명 보증',
];
const DEFAULT_KEYWORDS = [
  '침향',
  ...KW_BRAND, ...KW_PRODUCT, ...KW_BENEFIT,
  ...KW_ORIGIN, ...KW_COMPARE, ...KW_AUTHORITY,
];
// 정적 OG 이미지 — public/opengraph-image.jpg (1200x630, 단일 진실 공급원).
// 어드민 SEO ogImage 입력은 호환을 위해 인터페이스만 유지.
const SITE_OG_IMAGE_PATH = '/opengraph-image.jpg';
const SITE_OG_IMAGE_ALT =
  '대라천 ZOEL LIFE — 베트남 직영 25년, 학명 Aquilaria Agallocha Roxburgh 정품 침향';
const SITE_TW_IMAGE_PATH = '/twitter-image.jpg';

interface SeoData { metaTitle?: string; metaDescription?: string; keywords?: string; ogImage?: string }

export async function generateMetadata(): Promise<Metadata> {
  const company = await readSingleSafe<{ seo?: SeoData }>('company');
  const seo = company?.seo;

  const title = seo?.metaTitle || DEFAULT_TITLE;
  const description = seo?.metaDescription || DEFAULT_DESCRIPTION;
  const keywords = seo?.keywords
    ? seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;
  // ogImage 는 src/app/opengraph-image.jpg 파일이 우선 — 변수 미사용.
  // (어드민 SEO 의 ogImage 입력은 호환성 위해 인터페이스만 유지.)

  // Google Search Console 인증 토큰 — zoellife.com 등록용.
  // env 미설정 시에도 기본값으로 인증이 유지되도록 하드코딩 fallback.
  // (다른 GSC 속성에서 재발급 시 GOOGLE_SITE_VERIFICATION env 로 덮어쓰기.)
  const GSC_DEFAULT = 'RvjwX2kdcOYXh_k3fkUKGQc-r_N_Yby-kb2Vb3lywpM';
  const verificationEntries = (() => {
    const google = process.env.GOOGLE_SITE_VERIFICATION || GSC_DEFAULT;
    const naver = process.env.NAVER_SITE_VERIFICATION;
    const bing = process.env.BING_SITE_VERIFICATION;
    const v: { google?: string; other?: Record<string, string | string[]> } = {};
    if (google) v.google = google;
    const other: Record<string, string> = {};
    if (naver) other['naver-site-verification'] = naver;
    if (bing) other['msvalidate.01'] = bing;
    if (Object.keys(other).length > 0) v.other = other;
    return Object.keys(v).length > 0 ? v : undefined;
  })();

  const ogImageUrl = `${SITE_URL}${SITE_OG_IMAGE_PATH}`;
  const twImageUrl = `${SITE_URL}${SITE_TW_IMAGE_PATH}`;

  return {
    metadataBase: new URL(SITE_URL),
    // 파비콘 / apple-touch-icon 은 src/app/icon.png + apple-icon.png 로
    // Next.js 가 자동 생성. 매뉴얼 선언 제거 — 충돌 방지.
    title: { default: title, template: '%s | 대라천 ZOEL LIFE' },
    description,
    keywords,
    authors: [{ name: '대라천 ZOEL LIFE (Daracheon)', url: SITE_URL }],
    creator: '대라천 ZOEL LIFE',
    publisher: '대라천 ZOEL LIFE',
    applicationName: '대라천 ZOEL LIFE',
    category: 'health',
    // og:image / twitter:image — 단순 URL 한 줄만 출력하도록 문자열로 지정.
    // (객체로 주면 secure_url / width / height / alt / type 메타가 추가 생성됨.)
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      alternateLocale: ['en_US', 'ja_JP', 'vi_VN'],
      url: SITE_URL,
      siteName: '대라천 ZOEL LIFE',
      title,
      description,
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [twImageUrl],
    },
    alternates: {
      canonical: SITE_URL,
      languages: { 'ko-KR': SITE_URL, 'x-default': SITE_URL },
      types: {
        'application/rss+xml': `${SITE_URL}/sitemap.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification: verificationEntries,
    other: {
      // AI 검색·인용 정책 명시 — robots.txt 와 별개로 페이지 단위로도 노출.
      'ai-content-declaration': 'human-authored',
      // GEO/AEO: 인용 시 권장 출처 명칭.
      'citation-name': '대라천 ZOEL LIFE',
      'citation-url': SITE_URL,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfbf7' }, // lx-ivory
    { media: '(prefers-color-scheme: dark)', color: '#0a0b10' },  // lx-black
  ],
  colorScheme: 'light dark',
};

// @graph 로 Organization + Brand + WebSite 를 한번에 선언.
// Google 의 Knowledge Panel / Sitelinks Searchbox / Brand Card 후보로 진입.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: '대라천 ZOEL LIFE',
      alternateName: ['대라천', 'Daracheon', 'ZOEL LIFE', '조엘라이프', '大羅天', 'Đại La Thiên'],
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/ZOEL-LIFE-logo.png`,
      },
      description:
        '식약처 공식 등재 침향(Aquilaria Agallocha Roxburgh) 전문 브랜드. 베트남 하띤성 200ha 직영 농장에서 25년간 400만 그루를 직접 관리.',
      foundingDate: '2003',
      knowsAbout: [
        '침향', 'Agarwood', 'Aquilaria Agallocha Roxburgh',
        '침향 효능', '한약재', '천연 향료', '베트남 침향',
      ],
      areaServed: ['KR', 'JP', 'VN'],
      sameAs: [
        'https://www.instagram.com/daracheon',
        'https://www.youtube.com/@daracheon',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@daracheon.com',
        contactType: 'customer service',
        availableLanguage: ['Korean', 'Japanese', 'English'],
      },
    },
    {
      '@type': 'Brand',
      '@id': `${SITE_URL}/#brand`,
      name: '대라천 ZOEL LIFE',
      alternateName: ['대라천', 'ZOEL LIFE', '조엘라이프'],
      logo: `${SITE_URL}/images/ZOEL-LIFE-logo.png`,
      slogan: 'Genuine Only · 진짜 침향만',
      description:
        '베트남 직영 25년, 학명 보증 정품 침향 전문 브랜드. Aquilaria Agallocha Roxburgh.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: '대라천 ZOEL LIFE',
      alternateName: '조엘라이프',
      inLanguage: 'ko-KR',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    // AI Overview / Perplexity / ChatGPT Search 가 직접 인용하기 좋은
    // 답변형 FAQ. 홈에 본문은 없지만 schema 로 토픽 권위를 선언.
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      inLanguage: 'ko-KR',
      mainEntity: [
        {
          '@type': 'Question',
          name: '식약처 등재 침향의 학명은 무엇인가요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '대한민국약전외한약(생약)규격집과 식품공전에 공식 등록된 침향의 학명은 Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그, AAR)입니다. 이 학명만 한약재 침향으로 인정됩니다.',
          },
        },
        {
          '@type': 'Question',
          name: '대라천 ZOEL LIFE 침향은 어디에서 재배되나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '베트남 하띤성 200ha 직영 농장에서 25년간 직접 재배·관리한 약 400만 그루의 Aquilaria 나무에서만 채취합니다. 농장→가공→한국 직판까지 단일 회사가 담당합니다.',
          },
        },
        {
          '@type': 'Question',
          name: '진짜 침향과 가짜 침향은 어떻게 구별하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '첫째 학명(Aquilaria Agallocha Roxburgh) 표기 확인, 둘째 CITES 수출입 허가서, 셋째 Lot별 시험성적서(중금속·잔류농약), 넷째 원산지 증명서. 이 네 가지가 동시에 공개되어야 정품으로 볼 수 있습니다.',
          },
        },
        {
          '@type': 'Question',
          name: '침향의 대표 효능은 무엇인가요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '한의학 문헌과 SCI급 논문이 보고하는 대표 효능은 (1) 기혈 순환·자양강장, (2) 신경 안정·숙면(아가로스피롤 성분), (3) 항염·혈관 건강, (4) 뇌혈류 개선, (5) 소화 기능 개선, (6) 하복부 냉감·정력 개선입니다.',
          },
        },
        {
          '@type': 'Question',
          name: '대라천 침향은 어떤 인증을 보유하고 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HACCP, GMP(우수 의약품 제조관리 기준), CITES(국제 보호종 수출입 허가), 미국 FDA 등록, 베트남 OCOP, 원산지·유기농 증명, 식용 수지 특허를 보유하고 있으며, 제조 Lot별 중금속·잔류농약 시험성적서를 공개합니다.',
          },
        },
        {
          '@type': 'Question',
          name: '침향은 어떻게 복용하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '대라천 ZOEL LIFE 는 캡슐, 침향단(환), 침향수, 침향차, 침향 오일, 선향(스틱) 형태로 제공됩니다. 캡슐과 환은 식후 1정/1환을 물과 함께, 차·수는 1일 1~2회 따뜻한 물에 우려 음용합니다. 자세한 복용법은 제품 패키지의 표기를 따르세요.',
          },
        },
      ],
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Navigation lives in the DB so admins can edit labels / order / links
  // without a code deploy. Fall back to the compiled-in defaults if the
  // seed hasn't been written yet (first deploy, or Blob store empty).
  // unstable_cache 우회 — 외부 스크립트로 blob 을 업데이트했을 때도 즉시 반영.
  // 네비게이션은 페이지마다 한 번 호출되며 blob 1 회 read 라 비용 부담 작음.
  const nav = await readSingleUncached<NavigationData>('navigation');
  const rawMainNav = nav?.main ?? DEFAULT_MAIN_NAV;
  // 라벨 마이그레이션: '홈쇼핑 특별관' → 'On-Air 특별관' (URL 동일).
  // blob 의 사용자 커스텀 라벨이 있어도 어드민 재저장 없이 즉시 반영.
  const mainNav = rawMainNav.map((item) =>
    item.href === '/home-shopping' && item.label === '홈쇼핑 특별관'
      ? { ...item, label: 'On-Air 특별관' }
      : item
  );

  // 브랜드 로고 (좌측 상단) + 푸터 회사 정보 — settings(company)에서 관리.
  // unstable_cache 우회 — 어드민 저장 후 즉시 반영 보장.
  // (Navigation 과 동일한 패턴; blob 1 회 read 라 비용 부담 작음.)
  const settings = await readSingleUncached<{
    name?: string;
    description?: string;
    ceo?: string;
    businessReg?: string;
    mailOrderReg?: string;
    importBizReg?: string;
    privacyOfficer?: string;
    address?: string;
    phone?: string;
    email?: string;
    brandLogo?: string;
    companyLogo?: string;
    brandDesc?: string;
    socialLinks?: Array<{ label: string; url: string }>;
  }>('company');
  const brandLogo = settings?.brandLogo ?? '';
  const socialLinks = settings?.socialLinks ?? [];
  // 푸터 브랜드 설명 fallback: brandDesc(전용) → description(회사 소개) → 빈 문자열.
  // Footer 컴포넌트가 빈 값일 때 hardcoded DEFAULT 로 최종 fallback.
  const footerBrandDesc =
    settings?.brandDesc?.trim() || settings?.description?.trim() || '';
  const footerCompany = {
    name: settings?.name ?? '',
    ceo: settings?.ceo ?? '',
    businessReg: settings?.businessReg ?? '',
    mailOrderReg: settings?.mailOrderReg ?? '',
    importBizReg: settings?.importBizReg ?? '',
    privacyOfficer: settings?.privacyOfficer ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    brandDesc: footerBrandDesc,
  };

  return (
    <html lang="ko">
      <head>
        {/* 이미지·분석 서버 사전 연결 — DNS·TLS 핸드셰이크 비용 제거.
            LCP 이미지(Cloudinary·Vercel Blob)는 preconnect, GA·measurement
            은 dns-prefetch 만 (지연 로딩이라 TLS 까지 미리 잡을 필요 없음). */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://assets.floot.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* hreflang — 단일 한국어 사이트지만 검색엔진 신호 차원에서 명시 */}
        <link rel="alternate" hrefLang="ko-KR" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <JsonLd data={siteJsonLd} />
        <GoogleAnalytics />
      </head>
      <body data-palette="gold">
        <ChromeGate>
          <Header mainNav={mainNav} brandLogo={brandLogo} />
        </ChromeGate>
        <main>{children}</main>
        <ChromeGate>
          <Footer socialLinks={socialLinks} company={footerCompany} />
        </ChromeGate>
        {/* Vercel Analytics + Speed Insights — 실제 사용자 LCP/CLS/INP 수집.
            DNT 자동 존중. 환경변수 없이도 동작 (Vercel 대시보드에서 확인). */}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
