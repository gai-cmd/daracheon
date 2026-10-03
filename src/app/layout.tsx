import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR, Noto_Serif_KR, JetBrains_Mono } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChromeGate from '@/components/layout/ChromeGate';
import ShippingNoticePopup from '@/components/layout/ShippingNoticePopup';
import JsonLd from '@/components/ui/JsonLd';
import { imageObject } from '@/lib/seo/image';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import GoogleTagManager, { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManager';
import QrBeacon from '@/components/analytics/QrBeacon';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import {
  DEFAULT_MAIN_NAV,
  type NavigationData,
} from '@/data/navigation';
import '@/styles/globals.css';

// ── 폰트 셀프호스트 (진단 PERF-3 근본 개선 · P2) ──────────────────────────
// 종전: tokens.css 의 @import(fonts.googleapis.com) — CSS 체인 뒤에서야 폰트
// CSS 를 발견하는 렌더-블로킹 외부 왕복 2회. next/font 는 빌드 시 폰트를
// 내려받아 자산으로 셀프호스트하고 unicode-range 분할 CSS 를 인라인한다.
// weight 목록은 종전 @import 와 동일하게 유지 (시각 회귀 방지).
// subsets 는 preload 힌트 — 한글 글리프는 unicode-range 로 필요 시 로드된다.
const notoSans = Noto_Sans_KR({
  weight: ['200', '300', '400', '500', '600', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const notoSerif = Noto_Serif_KR({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

// 사이트 단일 정규 도메인 — 모든 메타/JSON-LD/sitemap 이 이 값을 기준.
// 환경변수로 오버라이드 가능 (스테이징/프리뷰 대응).
//
// .env 에 따옴표·줄바꿈이 섞여 들어와도 SEO 신호가 깨지지 않도록 정규화:
//   1) 실제 whitespace (\n / \r / \t / 공백) 제거
//   2) dotenv 가 해석 못 한 리터럴 \n / \r / \t 시퀀스 제거
//   3) 따옴표 strip
//   4) trailing slash 제거
function normalizeSiteUrl(raw: string): string {
  return raw
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, '')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
}
const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com'
);

// Naver 검색엔진 가이드라인: 사이트 제목 / OG 제목 ≤40자, 사이트 설명 / OG 설명 ≤80자.
// (회사 정보 / FAQ / 키워드는 metadata.keywords + JSON-LD 로 보강.)
const DEFAULT_TITLE = "조엘라이프 대라천 '참'침향 - 100% 베트남산 아갈로차 침향";
// OG 제목 — 네이버 웹마스터도구 권고(40자 이내). <title> 은 그대로 두고 OG/트위터만 짧게.
// 어드민 metaTitle 이 40자를 넘으면 이 기본값으로 대체한다 (2026-09-23 네이버 URL 검사 경고).
const OG_TITLE_MAX = 40;
const DEFAULT_OG_TITLE = "조엘라이프 대라천 '참'침향 | 베트남산 아갈로차 정품 침향";
const DEFAULT_DESCRIPTION =
  "조엘라이프 대라천 '참'침향. 식약처 고시 학명 Aquilaria Agallocha Roxburgh, 베트남 5개 지역 직영 농장 200ha.";

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
  '식약처 고시 침향', '대한민국약전외한약 침향', 'CITES 침향',
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
const SITE_TW_IMAGE_PATH = '/twitter-image.jpg';

interface SeoData { metaTitle?: string; metaDescription?: string; keywords?: string; ogImage?: string }

export async function generateMetadata(): Promise<Metadata> {
  const company = await readSingleSafe<{ seo?: SeoData }>('company');
  const seo = company?.seo;

  const title = seo?.metaTitle || DEFAULT_TITLE;
  const description = seo?.metaDescription || DEFAULT_DESCRIPTION;
  const ogTitle = title.length <= OG_TITLE_MAX ? title : DEFAULT_OG_TITLE;
  const keywords = seo?.keywords
    ? seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;
  // ogImage 는 src/app/opengraph-image.jpg 파일이 우선 — 변수 미사용.
  // (어드민 SEO 의 ogImage 입력은 호환성 위해 인터페이스만 유지.)

  // Google Search Console 인증 토큰 — zoellife.com 등록용.
  // env 미설정 시에도 기본값으로 인증이 유지되도록 하드코딩 fallback.
  // (다른 GSC 속성에서 재발급 시 GOOGLE_SITE_VERIFICATION env 로 덮어쓰기.)
  const GSC_DEFAULT = 'RvjwX2kdcOYXh_k3fkUKGQc-r_N_Yby-kb2Vb3lywpM';
  // Naver 웹마스터도구 사이트 소유확인 토큰 — zoellife.com 등록용.
  // 재발급 시 NAVER_SITE_VERIFICATION env 로 덮어쓰기.
  const NAVER_DEFAULT = '78f6f8ac415595d6b1d9e8e33fca157f8194e05f';
  const verificationEntries = (() => {
    const google = process.env.GOOGLE_SITE_VERIFICATION || GSC_DEFAULT;
    const naver = process.env.NAVER_SITE_VERIFICATION || NAVER_DEFAULT;
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
    title: { default: title, template: "%s | 대라천 '참'침향" },
    description,
    keywords,
    authors: [{ name: '대라천 ZOEL LIFE (Daeracheon)', url: SITE_URL }],
    creator: '대라천 ZOEL LIFE',
    publisher: '대라천 ZOEL LIFE',
    applicationName: '대라천 ZOEL LIFE',
    category: 'health',
    // og:image / twitter:image — 단순 URL 한 줄만 출력하도록 문자열로 지정.
    // (객체로 주면 secure_url / width / height / alt / type 메타가 추가 생성됨.)
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: SITE_URL,
      siteName: '대라천 ZOEL LIFE',
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [twImageUrl],
    },
    alternates: {
      canonical: SITE_URL,
      languages: { 'ko-KR': SITE_URL, 'x-default': SITE_URL },
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

// @graph 로 사이트 공통 엔티티(Organization + Brand + WebSite)만 선언 — 모든 페이지 공통.
// Google 의 Knowledge Panel / Sitelinks Searchbox / Brand Card 후보로 진입.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: '대라천 ZOEL LIFE',
      legalName: '조엘라이프 주식회사',
      alternateName: ['대라천', 'Daeracheon', 'ZOEL LIFE', '조엘라이프', '大羅天', 'Đại La Thiên'],
      url: SITE_URL,
      logo: imageObject({
        url: `${SITE_URL}/images/ZOEL-LIFE-logo.png`,
        name: '대라천 ZOEL LIFE 로고',
        caption: '대라천 ZOEL LIFE 브랜드 로고',
      }),
      description:
        '식약처 고시 학명 Aquilaria Agallocha Roxburgh 침향 전문 브랜드. 베트남 5개 지역(하띤·동나이·냐짱·푸꾸옥·람동) 직영 농장 200ha에서 400만 그루를 25년 이상 재배·관리.',
      knowsAbout: [
        '침향', 'Agarwood', 'Aquilaria Agallocha Roxburgh',
        '침향 효능', '한약재', '천연 향료', '베트남 침향',
      ],
      areaServed: ['KR', 'JP', 'VN'],
      sameAs: [
        'https://www.instagram.com/zoellife_official/',
        'https://www.youtube.com/@ZoelLife_official_00',
      ],
      // 공개 이메일 없음 — 문의는 /company 문의하기 폼으로 받는다(접수 시 슬랙 공유).
      // (종전 contact@daracheon.com 은 도메인이 존재하지 않아 수신 불가였다.)
      contactPoint: {
        '@type': 'ContactPoint',
        url: `${SITE_URL}/company#contact`,
        telephone: '+82-70-4140-4086',
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
        '베트남 직영 25년 이상, 학명 보증 정품 침향 전문 브랜드. Aquilaria Agallocha Roxburgh.',
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
    // 홈 전용 노드(WebPage·홈 Breadcrumb·FAQPage)는 src/app/page.tsx 로 옮겼다.
    // 여기 두면 모든 페이지에 홈 WebPage/Breadcrumb/FAQPage 가 중복 삽입돼
    // (FAQPage·BreadcrumbList 2개씩) 구조화 데이터 오류와 '화면에 없는 FAQ' 마크업이 된다.
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Navigation lives in the DB so admins can edit labels / order / links
  // without a code deploy. Fall back to the compiled-in defaults if the
  // seed hasn't been written yet (first deploy, or Blob store empty).
  // unstable_cache 우회 — 외부 스크립트로 blob 을 업데이트했을 때도 즉시 반영.
  // 네비게이션은 페이지마다 한 번 호출되며 blob 1 회 read 라 비용 부담 작음.
  // nav·productCategories·company 를 한 번에 병렬로 읽는다(직렬 3-왕복 → 1 배치).
  // *Safe = unstable_cache(태그 db:<file>) 경유 + LKG/seed 폴백. admin 저장 시
  // revalidateTag 로 즉시 무효화되므로 편집 반영은 유지된다. (앱 외부 스크립트가
  // blob 을 직접 수정한 경우에만 최대 300s 지연 — 그때는 /api/admin/revalidate-pages 호출.)
  const [nav, productCategoriesRaw, settings] = await Promise.all([
    readSingleSafe<NavigationData>('navigation'),
    readDataSafe<{ id: string; label: string }>('productCategories'),
    readSingleSafe<{
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
    }>('company'),
  ]);
  const productCategories = productCategoriesRaw.map((c) => ({ id: c.id, label: c.label }));
  const rawMainNav = nav?.main ?? DEFAULT_MAIN_NAV;
  // 라벨 마이그레이션: '홈쇼핑 특별관' → 'On-Air 특별관' (URL 동일).
  // blob 의 사용자 커스텀 라벨이 있어도 어드민 재저장 없이 즉시 반영.
  const mainNav = rawMainNav.map((item) =>
    item.href === '/home-shopping' && item.label === '홈쇼핑 특별관'
      ? { ...item, label: 'On-Air 특별관' }
      : item
  );

  // 브랜드 로고 (좌측 상단) + 푸터 회사 정보 — settings(company)는 위 Promise.all 에서 함께 읽음.
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
    <html lang="ko" className={`${notoSans.variable} ${notoSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* 이미지·분석 서버 사전 연결 — DNS·TLS 핸드셰이크 비용 제거.
            모든 이미지는 Vercel Blob(우리 인프라)에서만 서빙하므로
            blob 도메인만 preconnect, GA·measurement 은 dns-prefetch 만.
            폰트는 next/font 셀프호스트 — 외부 폰트 호스트 preconnect 불필요. */}
        <link rel="preconnect" href="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* hreflang 는 metadata.alternates.languages 가 자동 생성 — 중복 선언 제거. */}
        {/* RSS 자동 발견 — metadata.alternates.types 는 홈(page.tsx)의 alternates 재정의에
            덮여 사라지므로 head 에 직접 선언. 피드 본체: src/app/rss.xml/route.ts */}
        <link rel="alternate" type="application/rss+xml" title="대라천 ZOEL LIFE 침향 이야기" href={`${SITE_URL}/rss.xml`} />
        <JsonLd data={siteJsonLd} />
        <GoogleTagManager />
        <GoogleAnalytics />
      </head>
      <body data-palette="gold">
        <GoogleTagManagerNoScript />
        <ChromeGate>
          <Header mainNav={mainNav} brandLogo={brandLogo} productCategories={productCategories} />
        </ChromeGate>
        <main>{children}</main>
        <ChromeGate>
          <Footer socialLinks={socialLinks} company={footerCompany} />
        </ChromeGate>
        <ChromeGate>
          <ShippingNoticePopup />
        </ChromeGate>
        {/* Vercel Analytics + Speed Insights — 실제 사용자 LCP/CLS/INP 수집.
            DNT 자동 존중. 환경변수 없이도 동작 (Vercel 대시보드에서 확인). */}
        <VercelAnalytics />
        <SpeedInsights />
        {/* QR 유입 세션 한정 동선·CTA 비콘 (zql_track 쿠키 게이트 + GPC 존중) */}
        <QrBeacon />
      </body>
    </html>
  );
}
