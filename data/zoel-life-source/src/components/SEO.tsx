import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  jsonLd?: object;
}

export default function SEO({ title, description, keywords, ogImage, ogUrl, canonical, jsonLd }: SEOProps) {
  const siteName = "ZOEL LIFE (ZOEL LIFE)";
  const defaultKeywords = "침향, ZOEL LIFE, ZOEL LIFE, 수지유도제, 아가우드, 베트남 침향, 최고급 침향, 천연 침향, 프리미엄 침향, 침향 효능, 침향 오일, 침향수";
  const combinedKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;
  const fullTitle = `${title} | ${siteName}`;
  const defaultOgImage = "https://ais-dev-afdqxaxs475vwvxgpuvwj5-303170167157.asia-northeast1.run.app/og-image.jpg";

  return (
    <Helmet>
      <html lang="ko" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={combinedKeywords} />
      <meta name="theme-color" content="#1a1a2e" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      <link rel="alternate" hrefLang="ko" href={ogUrl || "https://www.daracheon.com"} />
      <link rel="alternate" hrefLang="en" href={ogUrl || "https://www.daracheon.com"} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="ZOEL LIFE" />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
