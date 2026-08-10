import type { MetadataRoute } from 'next';

// env 값에 줄바꿈/공백 섞임 방지 — sitemap 라인이 깨지면 색인 실패.
// 정규 도메인은 zoellife.com (no www) — sitemap.ts / layout.tsx canonical 과 일치.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\\[nrt]/g, '')
  .replace(/\s+/g, '')
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\/+$/, '');

// AI 크롤러 정책 (2026-08-11 개정, awesome-geo 기준): "노출 O, 학습 X".
// 검색·답변 노출용 봇(AI 검색 인용, 브랜드 인지·세일즈에 기여)은 허용하고,
// 순수 모델 학습용 크롤러만 차단한다. 관리자/API 는 당연 차단.
const AI_CRAWLERS = [
  'OAI-SearchBot', // OpenAI ChatGPT search 노출
  'ChatGPT-User', // ChatGPT 브라우징 (사용자 요청 시 fetch)
  'Googlebot-News',
  'Applebot-Extended', // Apple Intelligence
  'ClaudeBot', // Anthropic — Claude 검색 인용 노출
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'Amazonbot',
  'Bytespider', // TikTok / Doubao
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'cohere-ai',
  'Bingbot', // Bing / Copilot — 스키마 활용을 공식 언급하는 유일한 엔진
  'DuckDuckBot',
  'YetiBot', // Naver
  'NaverBot',
  'Yeti',
  'Daumoa', // Daum / Kakao
];

// 학습 전용 크롤러 — 검색 노출과 무관하게 모델 학습에만 쓰이므로 차단.
// (OAI-SearchBot 등 노출용 봇이 허용돼 있는 한 AI 검색 인용은 유지된다.)
const TRAINING_CRAWLERS = [
  'GPTBot', // OpenAI 모델 학습
  'Google-Extended', // Google Gemini 학습 (검색 색인은 Googlebot 별도)
  'anthropic-ai', // Anthropic 구 학습 크롤러
  'CCBot', // Common Crawl — 다수 LLM 학습 코퍼스
];

export default function robots(): MetadataRoute.Robots {
  const aiRules = AI_CRAWLERS.map((ua) => ({
    userAgent: ua,
    allow: '/',
    // /thesis 는 THESIS_PASSWORD 로 잠긴 논문 아카이브 — 인증 없이는 401 이다.
    // 푸터에서 공개 링크로 노출되므로 크롤러가 계속 401 을 받아 "색인 생성되지
    // 않음"으로 쌓인다. 크롤 대상에서 제외한다.
    disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition', '/thesis'],
  }));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /thesis 는 THESIS_PASSWORD 로 잠긴 논문 아카이브 — 인증 없이는 401 이다.
    // 푸터에서 공개 링크로 노출되므로 크롤러가 계속 401 을 받아 "색인 생성되지
    // 않음"으로 쌓인다. 크롤 대상에서 제외한다.
    disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition', '/thesis'],
      },
      ...aiRules,
      ...TRAINING_CRAWLERS.map((ua) => ({ userAgent: ua, disallow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
