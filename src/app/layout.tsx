import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/ui/JsonLd';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { readSingleSafe } from '@/lib/db';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.daracheon.com'),
  title: {
    default: '대라천 — 프리미엄 침향 전문 브랜드',
    template: '%s | 대라천',
  },
  description:
    '베트남 최고급 Aquilaria agallocha 침향 전문 브랜드 대라천. 400만 그루 직접 관리, GC-MS 인증, 대한약전 적합. 프리미엄 침향 원목, 에센셜 오일, 건강차.',
  keywords: [
    '침향', '대라천', 'agarwood', '沈香', '침향 효능', '침향 구매',
    '프리미엄 침향', 'Aquilaria agallocha', '침향차', '침향 오일',
    '베트남 침향', '대한약전', 'GC-MS',
  ],
  authors: [{ name: '대라천 (Daracheon)', url: 'https://www.daracheon.com' }],
  creator: '대라천',
  publisher: '대라천',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.daracheon.com',
    siteName: '대라천',
    title: '대라천 — 프리미엄 침향 전문 브랜드',
    description:
      '베트남 최고급 A. agallocha 침향. 400만 그루, 20년 이상 수령. 대라천이 엄선한 프리미엄 침향을 만나보세요.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: '대라천 프리미엄 침향',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '대라천 — 프리미엄 침향 전문 브랜드',
    description:
      '베트남 최고급 A. agallocha 침향. 400만 그루, 20년 이상 수령.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://www.zoellife.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  // 검색엔진 사이트 인증 — env 에 코드를 박으면 자동 적용.
  //   GOOGLE_SITE_VERIFICATION
  //   NAVER_SITE_VERIFICATION
  //   BING_SITE_VERIFICATION
  // 코드 미설정이면 메타 태그 자체가 출력되지 않음(빈 'undefined' 가짜 신호 방지).
  verification: (() => {
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
  })(),
};

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
  const announcement = await readSingleSafe<Announcement>('announcement');
  const showBanner = !!(announcement?.enabled && announcement.text);

  // Navigation lives in the DB so admins can edit labels / order / links
  // without a code deploy. Fall back to the compiled-in defaults if the
  // seed hasn't been written yet (first deploy, or Blob store empty).
  const nav = await readSingleSafe<NavigationData>('navigation');
  const mainNav = nav?.main ?? DEFAULT_MAIN_NAV;

  // 브랜드 로고 (좌측 상단) — settings(company)에서 관리
  const settings = await readSingleSafe<{ brandLogo?: string; companyLogo?: string }>('company');
  const brandLogo = settings?.brandLogo ?? '';

  return (
    <html lang="ko">
      <head>
        <JsonLd data={organizationJsonLd} />
        <GoogleAnalytics />
      </head>
      <body data-palette="gold">
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
        <main>{children}</main>
        <Footer />
        {/* Vercel Analytics + Speed Insights — 실제 사용자 LCP/CLS/INP 수집.
            DNT 자동 존중. 환경변수 없이도 동작 (Vercel 대시보드에서 확인). */}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
