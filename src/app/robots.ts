import type { MetadataRoute } from 'next';

// env 값에 줄바꿈/공백 섞임 방지 — sitemap 라인이 깨지면 색인 실패.
// 정규 도메인은 zoellife.com (no www) — sitemap.ts / layout.tsx canonical 과 일치.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\\[nrt]/g, '')
  .replace(/\s+/g, '')
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\/+$/, '');

// AI 크롤러 정책 (2026-08-11 개정, awesome-geo 기준): 목표는 "노출 O, 학습 X".
// 실제 동작: AI_CRAWLERS 는 모두 허용, TRAINING_CRAWLERS 4개만 전체 차단, 관리자/API 등은 모든 봇에 차단.
// AI_CRAWLERS 에는 노출용이 아닌 봇(Applebot-Extended·Meta-ExternalAgent·Bytespider·cohere-ai 등)도 들어 있어
// "학습 X" 를 보장하지는 않는다. 목록 조정은 소유자 결정 사항이다(2026-11-12 감사).
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
    // 아래 '*' 그룹과 같은 차단 목록 — 이름이 지정된 봇은 '*' 그룹을 읽지 않으므로 다시 적는다.
    disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition', '/thesis'],
  }));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /thesis 는 THESIS_PASSWORD 로 잠긴 논문 아카이브 — 인증 없이는 401 이다.
        // 푸터 공개 링크는 2026-10-06 에 뺐지만(Footer.tsx), 이미 알려진 주소로 크롤러가 401 을
        // 받아 "색인 생성되지 않음"으로 쌓이지 않도록 크롤 대상에서 계속 제외한다.
        disallow: ['/api/', '/admin/', '/edition/', '/agarwood-edition', '/thesis'],
      },
      ...aiRules,
      ...TRAINING_CRAWLERS.map((ua) => ({ userAgent: ua, disallow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
