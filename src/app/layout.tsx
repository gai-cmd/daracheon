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
const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png';

interface SeoData { metaTitle?: string; metaDescription?: string; keywords?: string; ogImage?: string }

export async function generateMetadata(): Promise<Metadata> {
  const company = await readSingleSafe<{ seo?: SeoData }>('company');
  const seo = company?.seo;

  const title = seo?.metaTitle || DEFAULT_TITLE;
  const description = seo?.metaDescription || DEFAULT_DESCRIPTION;
  const keywords = seo?.keywords
    ? seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;
  const ogImage = seo?.ogImage || DEFAULT_OG_IMAGE;

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

  return {
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: '/images/ZOEL-LIFE-logo.png',
      shortcut: '/images/ZOEL-LIFE-logo.png',
      apple: '/images/ZOEL-LIFE-logo.png',
    },
    title: { default: title, template: '%s | 대라천 ZOEL LIFE' },
    description,
    keywords,
    authors: [{ name: '대라천 ZOEL LIFE (Daracheon)', url: SITE_URL }],
    creator: '대라천 ZOEL LIFE',
    publisher: '대라천 ZOEL LIFE',
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: SITE_URL,
      siteName: '대라천 ZOEL LIFE',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: '대라천 ZOEL LIFE — 베트남 직영 프리미엄 침향' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: SITE_URL },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    verification: verificationEntries,
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

  // 브랜드 로고 (좌측 상단) + 푸터 회사 정보 — settings(company)에서 관리
  const settings = await readSingleSafe<{
    name?: string;
    description?: string;
    ceo?: string;
    businessReg?: string;
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
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    brandDesc: footerBrandDesc,
  };

  return (
    <html lang="ko">
      <head>
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
