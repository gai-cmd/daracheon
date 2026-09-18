import Script from 'next/script';

// zoellife.com 의 GTM 컨테이너 ID — env 미설정 시에도 동작하도록 기본값 하드코딩.
// 컨테이너 ID 는 페이지 HTML 에 그대로 노출되는 공개 값이라 비밀값 하드코딩 금지 대상이 아니다.
// 다른 컨테이너로 전환 시 NEXT_PUBLIC_GTM_ID env 로 덮어씀.
const DEFAULT_GTM_ID = 'GTM-W9QZFW8X';

function resolveGtmId(): string {
  return process.env.NEXT_PUBLIC_GTM_ID || DEFAULT_GTM_ID;
}

/**
 * GTM 컨테이너 스니펫 — <head> 안에 둔다.
 * afterInteractive: 태그가 첫 상호작용 전에 준비돼야 page_view·클릭 트리거를 놓치지 않는다.
 * (GA 는 lazyOnload 지만 GTM 은 트리거 수집기라 유휴 시점까지 미루면 초기 이벤트가 빠진다.)
 */
export default function GoogleTagManager() {
  const gtmId = resolveGtmId();
  if (!gtmId) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}

/** GTM noscript 폴백 — <body> 여는 태그 바로 뒤에 둔다. CSP frame-src 에 googletagmanager.com 필요. */
export function GoogleTagManagerNoScript() {
  const gtmId = resolveGtmId();
  if (!gtmId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
