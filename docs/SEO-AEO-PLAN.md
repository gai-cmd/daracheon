# 검색·AI 인용 최적화 종합 계획 (SEO + AEO + GEO)

> 작성일: 2026-04-25
> 대상 도메인: https://www.zoellife.com
> 목표: 구글·네이버 자연 노출 + ChatGPT·Perplexity·AI Overview 인용

---

## 0. 현재 상태 진단

### ✅ 이미 잘 구축된 부분
- `robots.ts` — 25개 AI 봇 (GPTBot · Claude · Perplexity · Google-Extended · Naver Yeti · Daumoa 등) 명시 허용
- `sitemap.ts` — 정적 10개 + 제품 상세 동적 포함
- 페이지별 JSON-LD: WebSite · Organization · LocalBusiness · Article · FAQPage · BreadcrumbList · Product · ItemList · ScholarlyArticle · VideoObject
- 페이지별 `metadata` (title · description · keywords · openGraph · twitter · canonical)
- CSP/HSTS/X-Frame-Options 등 보안 헤더 → 신뢰도 신호

### 🔴 즉시 수정 (이번 커밋)
- **NEXT_PUBLIC_SITE_URL 환경변수 줄바꿈 오류** — sitemap URL `https://daracheon.vercel.app\n` 형태로 깨져 색인 불가. `\s+` 제거 로직 추가 + 기본값 `www.zoellife.com` 으로 변경.
- **비공개 제품 sitemap 노출** — published=false 제품도 sitemap 에 들어가 검색엔진이 404 만나도록 → 필터 추가.
- **llms.txt 신규** — LLM 친화 마크다운 요약 (학명·인증·공정·연혁·연락처) 한 번에 흡수.

### 🟡 운영자 액션 필요 (Vercel 환경변수)
1. `NEXT_PUBLIC_SITE_URL=https://www.zoellife.com` (줄바꿈/공백 없이 단일 라인)
2. 도메인 연결 확인: zoellife.com → daracheon-tryn.vercel.app (이미 운영 도메인이 zoellife.com 이라고 가정)

---

## 1. SEO 기본 — 구글 중심

### 1-1. Google Search Console
- [ ] https://search.google.com/search-console 에서 `https://www.zoellife.com` 속성 추가
- [ ] DNS TXT 또는 HTML meta 인증 (메타 인증 코드는 `src/app/layout.tsx` `metadata.verification.google` 에 추가)
- [ ] sitemap 제출: `https://www.zoellife.com/sitemap.xml`
- [ ] URL 검사 도구로 주요 페이지 색인 요청
- [ ] Core Web Vitals · Mobile Usability 보고서 점검 (월 1회)

### 1-2. Bing Webmaster
- [ ] https://www.bing.com/webmasters — Bing/Copilot 노출 + ChatGPT Search 가 Bing 인덱스 사용
- [ ] sitemap 제출

### 1-3. 구조화 데이터 점검
이미 적용 (페이지별):
- `/` Organization · WebSite
- `/about-agarwood` Article · FAQPage · BreadcrumbList · ScholarlyArticle (논문)
- `/brand-story` AboutPage · BreadcrumbList · VideoObject (영상)
- `/products` CollectionPage · ItemList · BreadcrumbList
- `/products/[slug]` Product (이름·이미지·설명·SKU·offers·aggregateRating 등)
- `/company` LocalBusiness · BreadcrumbList
- `/reviews` Product · AggregateRating · Review

추가 권장:
- [ ] `/process` 에 **HowTo** schema (14단계 침향 생산 공정) — AI 가 "침향 어떻게 만드나?" 질문에 우리 사이트 인용 가능성 ↑
- [ ] 모든 제품 상세에 **GTIN/MPN** (있다면) 추가 — 네이버 쇼핑/구글 쇼핑 노출 조건

### 1-4. Core Web Vitals
이미 양호한 인프라: Next.js 15 RSC + Vercel Edge, 이미지 Vercel Blob CDN. 점검 항목:
- [ ] LCP < 2.5s — 모바일 hero 이미지 우선순위(`priority` prop) 적용 확인
- [ ] CLS < 0.1 — 이미지 width/height 명시 또는 `aspect-ratio` 박스 (이미 대부분 적용됨)
- [ ] INP < 200ms — JS 번들 크기 점검 (next build 결과 100KB 이하 양호)

---

## 2. 네이버 SEO 특화

### 2-1. 네이버 서치어드바이저 등록
- [ ] https://searchadvisor.naver.com 사이트 등록
- [ ] HTML 메타 태그 인증 (코드 발급 후 `src/app/layout.tsx` `metadata.verification.other['naver-site-verification']` 에 추가)
- [ ] sitemap 제출: `/sitemap.xml`
- [ ] RSS 피드 등록 (블로그·뉴스 섹션 추가 시)
- [ ] 모바일 친화도 검사 통과 확인

### 2-2. 네이버 검색 알고리즘 대응
네이버는 구글 대비:
- **체류시간·재방문**을 가중치로 반영 → 풍부한 본문 + 내부 링크 강화
- **이미지 검색** 비중이 큼 → 이미지 alt 텍스트 한국어 핵심 키워드, 파일명도 의미 있게
- **문서 구조** (h1·h2·h3) 위계 엄격 → 페이지마다 h1 1개, h2/h3 의미 있게

이미 잘 되어 있는 부분:
- 한국어 콘텐츠 + 한국어 키워드 (침향·대라천·아갈로차 등)
- 한국어 FAQ schema

추가 권장:
- [ ] 페이지마다 `<h1>` 단 1개인지 검사
- [ ] 모든 `<img>`/`<Image>` 의 `alt` 가 핵심 키워드 포함하도록 (예: "대라천 침향 오일 캡슐 베트남 하띤성 농장")
- [ ] 본문에 "침향이란", "침향 효능", "Aquilaria Agallocha Roxburgh" 등 핵심 키워드 자연스럽게 반복

### 2-3. 네이버 비즈니스 (외부 신호)
- [ ] **네이버 플레이스** 등록 (오프라인 본사 주소 기반) — 지역검색 + 지도 노출
- [ ] **네이버 쇼핑** 입점 (제품 등록) — 쇼핑검색 + 상품 페이지에서 zoellife.com 백링크
- [ ] **네이버 블로그/카페** 활용 — 외부 인용 = 권위 신호
  - 이미 `/about-agarwood` 후기 탭에 9건 네이버 블로그 후기 링크 → 양방향 신호 확보
  - 추가: 자체 네이버 블로그 운영 (제품 사용기·공정 영상 캡처 등)

### 2-4. 네이버 SEO 체크리스트
- [x] robots.txt 에 `Yeti` · `NaverBot` · `Daumoa` Allow
- [x] sitemap.xml 정상
- [ ] `<meta name="naver-site-verification">` 추가
- [ ] 한국어 메타 description (이미 적용됨, 페이지마다 검수 필요)
- [ ] 외부 백링크 (네이버 블로그·카페·뉴스)
- [ ] 모바일 페이지 속도 (LCP 2.5s 이하)
- [ ] og:image 1200x630 (이미 일부 페이지 설정)

---

## 3. AEO/GEO/AAO — AI 인용 최적화

**용어 정리**:
- **AEO** (Answer Engine Optimization) — Google AI Overview · Perplexity 같은 답변 엔진 인용
- **GEO** (Generative Engine Optimization) — ChatGPT · Claude · Gemini 학습/검색 인용
- **AAO** (AI Agent Optimization) — AI 에이전트가 사이트를 탐색·요약·인용 가능하도록

### 3-1. 기술 인프라 (이미 적용)
- [x] robots.txt 에 25개 AI 봇 명시 Allow
- [x] sitemap 으로 전 페이지 발견 가능
- [x] 페이지별 풍부한 JSON-LD (Article · FAQPage · ScholarlyArticle · VideoObject 등)
- [x] HTTPS · HSTS · CSP — 신뢰 신호

### 3-2. 이번 커밋 추가
- [x] **`/llms.txt`** — LLM 전용 마크다운 요약. 학명·인증·14단계 공정·연혁·제품·연락처를 한 번에 흡수 가능. ChatGPT/Claude 가 이 파일을 우선 참조하도록 유도.
  - 위치: `https://www.zoellife.com/llms.txt`
  - 동적 생성: 제품·회사 정보가 DB 기반이라 항상 최신
  - 표준: https://llmstxt.org

### 3-3. 콘텐츠 형식 (AI 친화)

#### 답변형 H2/H3 구성
AI 는 "질문 → 답" 구조를 선호. 현재 페이지를 다음처럼 보강:

| 페이지 | 추가할 H2 패턴 |
|---|---|
| /about-agarwood | "침향이란 무엇인가?" / "공식 침향의 학명은?" / "침향의 효능은?" / "하루 적정 복용량은?" — 이미 구조 잡혀있음 ✓ |
| /brand-story | "대라천 농장은 어디에 있나?" / "200ha 에 몇 그루?" / "어떤 인증을 받았나?" / "생산 공정은 몇 단계?" |
| /products/[slug] | "이 제품의 학명은?" / "복용법은?" / "보관방법은?" — Product schema + FAQ block |
| /process | "1단계는?" "수지유도란?" "고온증류 시간은?" — HowTo schema 추가 권장 |

#### E-E-A-T 강화
Google E-E-A-T (Experience · Expertise · Authoritativeness · Trustworthiness):

| 신호 | 현 상태 | 강화 방법 |
|---|---|---|
| 저자 정보 | 일부 페이지에 박병주 대표 명시 | 제품·논문 페이지에 "검수자: 박병주 (전 식품영양학과 교수)" 추가 |
| 출처/인용 | 식약처·논문 인용 일부 | 모든 효능 주장에 출처 (논문 DOI · 식약처 고시 번호) |
| 인증서 표시 | 페이지에 표시 | JSON-LD `Certification` 또는 `award` 필드 추가 |
| 외부 백링크 | 네이버 블로그 9건 | 학술지 인용 · 언론 보도 추가 |
| 회사 정보 | LocalBusiness schema 적용 | sameAs 에 Instagram · YouTube · 네이버 블로그 URL 추가 |

#### 인용 가능한 사실 단위 콘텐츠
AI 가 인용하기 쉬운 짧고 명확한 사실:
- ✓ "1998년 캄보디아에서 시작" → 회사 페이지
- ✓ "200ha · 400만 그루 · 26년 숙성" → 브랜드 스토리
- ✓ "CITES 인증번호 IIA-DNI-007" → 인증 섹션
- ✓ "수지유도 특허 #12835 (2014 등록)" → 인증 섹션
- ✓ "중금속 8종 전부 불검출 (TSL ISO/IEC 17025:2017)" → 품질 섹션
- ✓ "하루 침향 오일 적정 복용량 2~3mg" → 침향 이야기 (방금 추가됨)
- ✓ "식약처가 인정한 식용 침향은 Aquilaria crassna · Aquilaria malaccensis 단 2종" → 가짜 침향 경고

이런 사실들을 `<strong>` 또는 `<em>` 으로 감싸면 AI 추출 정확도 ↑.

### 3-4. AI 인용 검증
주기적으로 다음 쿼리로 결과 확인:
- ChatGPT: "대라천 침향이란?" / "Aquilaria Agallocha Roxburgh 학명 알려줘" / "베트남 침향 농장 큰 곳 알려줘"
- Perplexity: "대라천 ZOEL LIFE" / "200ha 침향 농장"
- Google AI Overview: "침향 학명" / "침향 효능" / "침향 적정 복용량"

목표: 답변에 zoellife.com 또는 "대라천" 인용 등장.

---

## 4. 모바일·PWA 최적화 (모바일 우선 색인)

- [x] viewport 설정 (`src/app/layout.tsx`)
- [x] 반응형 레이아웃 (Tailwind grid)
- [ ] PWA manifest 추가 (`public/manifest.webmanifest`) — 홈 화면 추가 시 앱 같은 경험
- [ ] 서비스워커 (선택) — 오프라인 캐싱

---

## 5. 콘텐츠 캘린더 (3개월)

| 주차 | 작업 | 효과 |
|---|---|---|
| Week 1 | Search Console + 네이버 서치어드바이저 등록 + sitemap 제출 | 색인 시작 |
| Week 2 | 네이버 플레이스·쇼핑 입점 | 외부 신호 |
| Week 3 | /process 페이지에 HowTo schema | AI 인용 |
| Week 4 | 자체 네이버 블로그 글 5편 작성 (제품 사용기·공정 영상) | 백링크 |
| Month 2 | 침향 효능 별 단독 페이지 (예: `/효능/숙면`) | 롱테일 키워드 |
| Month 2 | 외부 언론 보도자료 1건 (한국경제·연합뉴스) | 권위 신호 |
| Month 3 | AI Overview 등장 모니터링 + 부족한 콘텐츠 보강 | 인용율 ↑ |
| Month 3 | Core Web Vitals 모바일 LCP 개선 (이미지 최적화 추가) | 순위 가산 |

---

## 6. 측정 지표 (월간)

### 검색
- Google Search Console: 노출 수 · 클릭 수 · CTR · 평균 순위 (월 보고)
- 네이버 서치어드바이저: 노출 · 클릭 · 검색 키워드
- 핵심 키워드 순위: "대라천 침향", "침향 학명", "침향 효능", "침향 오일 캡슐", "베트남 침향"

### AI 인용
- 월 1회 ChatGPT/Perplexity/Google AI Overview 에 핵심 질문 던져 zoellife.com 인용 빈도 카운트
- llms.txt 접근 로그 (Vercel Analytics)

---

## 7. 즉시 실행 체크리스트

### 코드 (이번 커밋)
- [x] `sitemap.ts` `\s+` 제거 + 기본값 zoellife.com + 비공개 제품 제외
- [x] `robots.ts` 동일 정리
- [x] `/llms.txt` 동적 라우트 신규

### 운영자 (Vercel 환경변수)
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.zoellife.com` (단일 라인, 공백/줄바꿈 없이)
- [ ] zoellife.com → Vercel 프로젝트 도메인 연결 확인
- [ ] 도메인 연결 후 재배포

### 운영자 (외부 등록)
- [ ] Google Search Console 등록 + 인증
- [ ] 네이버 서치어드바이저 등록 + 인증
- [ ] Bing Webmaster 등록
- [ ] 네이버 플레이스 등록
- [ ] 네이버 쇼핑 입점 (제품)
- [ ] Google Business Profile 등록

### 인증 메타 추가 (코드)
인증 코드 받으면 `src/app/layout.tsx` 의 `metadata.verification` 활성화:
```ts
verification: {
  google: '<google-site-verification 코드>',
  other: {
    'naver-site-verification': '<naver 코드>',
  },
},
```

---

## 8. 참고 문서

- llms.txt 표준: https://llmstxt.org
- Google Search Central: https://developers.google.com/search/docs
- 네이버 서치어드바이저 가이드: https://searchadvisor.naver.com/guide
- schema.org 타입: https://schema.org/docs/full.html
- AEO 백서 (Princeton): https://arxiv.org/abs/2311.09735
