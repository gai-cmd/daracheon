import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChromeGate from '@/components/layout/ChromeGate';
import JsonLd from '@/components/ui/JsonLd';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { readSingleSafe, readSingleUncached } from '@/lib/db';
import Link from 'next/link';
import {
  DEFAULT_MAIN_NAV,
  type NavigationData,
} from '@/data/navigation';
import '@/styles/globals.css';

interface Announcement {
  enabled: boolean;
  text: string;
  link: string;
  linkLabel: string;
  variant: 'gold' | 'dark' | 'red';
  updatedAt: string;
}

const BANNER_STYLES: Record<Announcement['variant'], string> = {
  gold: 'bg-amber-600 text-white',
  dark: 'bg-gray-900 text-white',
  red: 'bg-red-600 text-white',
};

const DEFAULT_TITLE = '대라천 — 베트남 직영 프리미엄 침향 전문 브랜드 | ZOEL LIFE';
const DEFAULT_DESCRIPTION =
  '식약처 공식 등재 침향(Aquilaria Agallocha Roxburgh) 전문 브랜드. 베트남 하띤성 200ha 직영 농장, 25년 재배 노하우. 침향 오일·캡슐·침향단·선향 한국 직판. 학명 보증 정품 침향만 취급.';
const DEFAULT_KEYWORDS = [
  '침향', '대라천', 'ZOEL LIFE', '조엘라이프',
  '침향 효능', '침향 오일', '침향환', '침향 캡슐', '침향단', '침향 선향',
  '침향수', '침향차', '베트남 침향', '프리미엄 침향',
  'Aquilaria Agallocha Roxburgh', '침향 구매',
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

  const verificationEntries = (() => {
    const google = process.env.GOOGLE_SITE_VERIFICATION;
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
    metadataBase: new URL('https://www.daracheon.com'),
    icons: {
      icon: '/images/ZOEL-LIFE-logo.png',
      shortcut: '/images/ZOEL-LIFE-logo.png',
      apple: '/images/ZOEL-LIFE-logo.png',
    },
    title: { default: title, template: '%s | 대라천' },
    description,
    keywords,
    authors: [{ name: '대라천 (Daracheon)', url: 'https://www.daracheon.com' }],
    creator: '대라천',
    publisher: '대라천',
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: 'https://www.daracheon.com',
      siteName: '대라천',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: '대라천 프리미엄 침향' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: 'https://www.zoellife.com' },
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '대라천',
  alternateName: ['Daracheon', '大羅天', 'Đại La Thiên'],
  url: 'https://www.daracheon.com',
  logo: 'https://www.daracheon.com/images/logo.png',
  description:
    '베트남 최고급 Aquilaria agallocha 침향 전문 브랜드. 400만 그루 직접 관리.',
  foundingDate: '2003',
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
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await readSingleUncached<Announcement>('announcement');
  const showBanner = !!(announcement?.enabled && announcement.text);

  // Navigation lives in the DB so admins can edit labels / order / links
  // without a code deploy. Fall back to the compiled-in defaults if the
  // seed hasn't been written yet (first deploy, or Blob store empty).
  const nav = await readSingleSafe<NavigationData>('navigation');
  const mainNav = nav?.main ?? DEFAULT_MAIN_NAV;

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
        <JsonLd data={organizationJsonLd} />
        <GoogleAnalytics />
      </head>
      <body data-palette="gold">
        <ChromeGate>
          {showBanner && (
            <div className={`w-full py-2 px-4 text-center text-xs font-bold ${BANNER_STYLES[announcement.variant]}`}>
              <span>{announcement.text}</span>
              {announcement.link && (
                <Link
                  href={announcement.link}
                  className="ml-2 underline underline-offset-2 opacity-90 hover:opacity-100"
                >
                  {announcement.linkLabel || '자세히 보기'}
                </Link>
              )}
            </div>
          )}
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
