import Script from 'next/script';

// zoellife.com 의 GA4 측정 ID — env 미설정 시에도 동작하도록 기본값 하드코딩.
// 다른 속성으로 전환 시 NEXT_PUBLIC_GA_ID env 로 덮어씀.
const DEFAULT_GA_ID = 'G-FJZX5QLJ7R';

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || DEFAULT_GA_ID;
  if (!gaId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
