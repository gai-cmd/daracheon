import type { MetadataRoute } from 'next';

// env 값에 줄바꿈/공백 섞임 방지 — sitemap 라인이 깨지면 색인 실패.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zoellife.com')
  .replace(/\s+/g, '')
  .replace(/\/$/, '');

// AI 크롤러 정책: 전 공개 페이지 인용 허용 (GEO 대응).
// 브랜드 인지·세일즈 목적이므로 ChatGPT/Perplexity/Claude/Gemini·
// Google AI Overview 등이 회사·제품·후기·공정을 모두 인용할 수 있게
// 한다. 관리자/API 는 당연 차단.
const AI_CRAWLERS = [
  'GPTBot', // OpenAI ChatGPT
  'OAI-SearchBot', // OpenAI SearchGPT
  'ChatGPT-User', // ChatGPT 브라우징
  'Google-Extended', // Google Gemini / AI Overviews 학습
  'Googlebot-News',
  'Applebot-Extended', // Apple Intelligence
  'anthropic-ai', // Anthropic Claude (웹 크롤)
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot', // Common Crawl (다수 LLM 학습용)
  'Amazonbot',
  'Bytespider', // TikTok / Doubao
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'cohere-ai',
  'Bingbot', // Bing / Copilot
  'DuckDuckBot',
  'YetiBot', // Naver
  'NaverBot',
  'Yeti',
  'Daumoa', // Daum / Kakao
];

export default function robots(): MetadataRoute.Robots {
  const aiRules = AI_CRAWLERS.map((ua) => ({
    userAgent: ua,
    allow: '/',
    disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition'],
  }));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition'],
      },
      ...aiRules,
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
