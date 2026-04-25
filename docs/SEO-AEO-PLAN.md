# 검색·AI 인용 최적화 작업 리스트 (SEO + AEO)

> 작성일: 2026-04-25 (v2 — 객관적 기술 작업만)
> 대상 도메인: https://www.zoellife.com
>
> 본 문서는 **검증되지 않은 콘텐츠 주장·가짜 권위 신호를 만들지 않는다**.
> 코드/설정 레벨의 객관적 SEO 작업과, 운영자가 결정·확인해야 할 외부 등록
> 절차만 기록한다. 콘텐츠 신뢰도(저자·인증서·인용)는 실제 사실 자료가
> 확보된 후에 별도로 처리한다.

---

## 0. 현재 코드/설정 상태 점검

### 이미 적용된 기술 SEO
| 항목 | 위치 | 상태 |
|---|---|---|
| robots.txt | `src/app/robots.ts` | 25개 AI 봇 + 일반 크롤러 Allow, /api·/admin Disallow |
| sitemap.xml | `src/app/sitemap.ts` | 정적 10개 + 제품 상세 동적, 비공개 제품 제외 |
| 페이지별 metadata | 각 page.tsx | title · description · keywords · canonical · openGraph · twitter |
| JSON-LD | 각 page.tsx | 페이지별 schema.org 타입 적용 (목록은 §1-3) |
| 보안 헤더 | `next.config.ts` | CSP · HSTS · X-Frame · Referrer · Permissions-Policy |
| llms.txt | `src/app/llms.txt/route.ts` | DB 연동 동적 마크다운 |

### 코드 레벨에서 즉시 수정한 것 (이번 커밋)
- env 값에 줄바꿈/공백이 섞여 sitemap URL 이 깨지던 문제 해결 (`\s+` 제거)
- 기본값 도메인 `daracheon.com` → `zoellife.com`
- `published === false` 제품을 sitemap 에서 제외
- llms.txt 라우트 신규 (DB 의 실제 등록값을 그대로 출력 — 가공 없음)

---

## 1. 코드/설정 작업 (객관적 검증 가능 항목만)

### 1-1. 환경변수 / 도메인
- [ ] Vercel 환경변수 `NEXT_PUBLIC_SITE_URL=https://www.zoellife.com` 단일 라인 저장
- [ ] zoellife.com 의 DNS A/CNAME 이 Vercel 프로젝트로 연결 확인
- [ ] 환경변수 변경 후 재배포 → `/sitemap.xml` · `/robots.txt` · `/llms.txt` 의 모든 URL 이 zoellife.com 로 변경됐는지 curl 로 확인

### 1-2. 검색엔진 인증 메타
운영자가 각 콘솔에서 인증 코드를 받아오면 `src/app/layout.tsx` 의 `metadata.verification` 에 추가:
```ts
verification: {
  google: '<코드>',
  other: { 'naver-site-verification': '<코드>' },
},
```
- [ ] Google Search Console 인증 코드 발급 후 추가
- [ ] Naver Search Advisor 인증 코드 발급 후 추가
- [ ] Bing Webmaster (선택) 인증 코드 발급 후 추가

### 1-3. 페이지별 JSON-LD 현황 (이미 적용된 것만 표기)
| 경로 | 적용된 타입 |
|---|---|
| `/` | WebSite, Organization |
| `/about-agarwood` | Article, FAQPage, BreadcrumbList, ScholarlyArticle (논문 목록 입력 시) |
| `/brand-story` | AboutPage, BreadcrumbList, ItemList (영상) |
| `/products` | CollectionPage, ItemList, BreadcrumbList |
| `/products/[slug]` | Product (offers · 등) |
| `/company` | LocalBusiness, BreadcrumbList |
| `/reviews` | Product, AggregateRating, Review |
| `/process` | (없음) |
| `/support` | (없음) |

### 1-4. JSON-LD 추가 작업 (코드 가능, 콘텐츠 사실 확인 필요)
다음은 데이터가 이미 DB 에 들어 있을 때만 의미 있음. 빈 데이터로 schema 만 박는 건 가짜 신호이므로 **DB 입력 확인 후** 처리:
- [ ] `/process` HowTo schema — `pages.brandStory.processTab.steps` 가 실제 등록되어 있을 때만 출력
- [ ] `/products/[slug]` 의 Product schema 에 `gtin` · `mpn` 필드 — 관리자에 GTIN/MPN 입력 필드가 추가되고 값이 실제로 들어왔을 때만
- [ ] `/about-agarwood` ScholarlyArticle 은 `papers` 항목이 실제 논문일 때만 출력 (현재 dummy 면 schema 출력 차단)

### 1-5. 메타·접근성 점검 (그렙으로 검증 가능)
- [ ] 페이지마다 `<h1>` 1개 — 자동 검사 스크립트 가능
- [ ] 모든 `<Image>`/`<img>` 의 `alt` 속성 — 비어있는 경우 grep 으로 추출
- [ ] `lang="ko"` 루트에 설정됨 (`src/app/layout.tsx`) — 확인 ✓
- [ ] `viewport` width=device-width — 확인 ✓
- [ ] 모든 페이지 canonical URL 일관성 — `metadata.alternates.canonical` 검사

### 1-6. Core Web Vitals (계측 가능 항목)
- [ ] Vercel Analytics 활성화 → 실제 사용자 LCP/CLS/INP 수집
- [ ] PageSpeed Insights / Lighthouse 로 주요 경로 점수 기록 (월 1회 캡처)
- [ ] LCP 후보 이미지에 `priority` 적용 여부 확인 (각 hero 첫 이미지)

### 1-7. PWA / 모바일 (선택)
- [ ] `public/manifest.webmanifest` 생성 (실제 운영 정책 결정 후)
- [ ] 아이콘 192·512 PNG 준비
- [ ] iOS apple-touch-icon

---

## 2. 외부 등록 (운영자 액션, 코드 외)

코드와 무관하게 운영자가 결정·등록해야 하는 항목. 인증 코드를 받으면 §1-2 에 따라 코드에 박는다.

- [ ] Google Search Console — 사이트 등록 + sitemap 제출
- [ ] Bing Webmaster — 사이트 등록 + sitemap 제출
- [ ] Naver Search Advisor — 사이트 등록 + sitemap 제출 + 모바일 친화도 검사
- [ ] Naver 비즈니스 / 플레이스 (오프라인 사업장 운영 정책에 따라 결정)
- [ ] Naver 쇼핑 (제품 판매 채널 정책에 따라 결정)
- [ ] Google Business Profile (오프라인 사업장 운영 정책에 따라 결정)

> 위 외부 채널의 등록 여부·정보 노출 범위·연결 SNS 는 모두 운영자 비즈니스
> 결정 사항이며, 본 문서가 강제하지 않는다.

---

## 3. AI 크롤러 / LLM 인용 (기술 인프라만)

### 3-1. 이미 적용된 기술 신호
- robots.txt 에서 GPTBot · ClaudeBot · PerplexityBot · Google-Extended · CCBot · Bytespider · Yeti · NaverBot · Daumoa · Bingbot · Applebot-Extended · Meta-ExternalAgent · cohere-ai · Amazonbot 등 25종 명시 Allow
- HTTPS · HSTS · CSP — 신뢰 신호 (브라우저·크롤러 동일 적용)
- 사이트 구조: 정적 라우트 + 동적 RSC + JSON 데이터 — 크롤링 친화적
- llms.txt 동적 라우트 — DB 등록 사실만 출력

### 3-2. llms.txt 정책
- 저장된 DB 값(제품·회사·연혁·인증)만 그대로 출력
- 입증되지 않은 효능 주장·평가어("최고", "유일") 자동 추가 금지
- 외부 인용 정책 안내 (출처 표기 권장 문구) 만 고정 텍스트로 포함

### 3-3. 측정 가능한 항목
- [ ] llms.txt 응답 200 + 요청 로그 (Vercel logs) 월 1회 점검
- [ ] robots.txt User-Agent 별 트래픽 로그 확인 (어느 봇이 실제 크롤하는지)

### 3-4. 측정 불가능한 항목 (목표가 아닌 관찰 항목)
ChatGPT / Perplexity / Google AI Overview 답변에 사이트가 인용되는지는
랜덤성·키워드·시점에 의존해 결정론적으로 측정 불가. 본 문서에서는 KPI
로 잡지 않는다. 운영자가 임의 시점에 검증 쿼리를 던져 트래킹할 수는 있음.

---

## 4. 콘텐츠 작업 (사실 자료가 확보된 후 별도 진행)

다음 항목은 **운영자가 입증 가능한 자료를 제공해야** 코드에 반영. 문서·
사진·인증서 PDF 등이 없는 상태에서 페이지에 추가하지 않음.

- [ ] 인증서 스캔본 업로드 (CITES · HACCP · OCOP 등 — 실물 인증번호와 발급일 확인)
- [ ] 논문 목록 입력 (`/about-agarwood` papers 탭) — 실제 DOI/저널/저자/연도 출처
- [ ] 언론 보도 입력 (`/media` press 탭) — 실제 매체/기사 URL
- [ ] 회사 연혁 (`/brand-story` historyTab) — 실제 일자·문서/등기 근거
- [ ] 제품 사양 (GTIN/MPN/SKU·중량·성분) — 패키지 표시 사실
- [ ] 후기 (`/reviews`) — 실제 구매자 동의 받은 후기, 또는 외부 블로그 후기 링크 (이미 9건 등록)

각 항목은 자료 확보 시점에 단독 PR/커밋으로 처리. 일괄 추가하지 않음.

---

## 5. 즉시 검증 가능한 체크 (배포 후 curl)

```bash
# 1. sitemap URL 정상화
curl -s https://www.zoellife.com/sitemap.xml | head -50
#   - 모든 <loc> 가 https://www.zoellife.com/... 로 시작
#   - 줄바꿈으로 깨진 라인 0건

# 2. robots.txt 의 sitemap 라인
curl -s https://www.zoellife.com/robots.txt | grep -i sitemap
#   - "Sitemap: https://www.zoellife.com/sitemap.xml" 한 줄

# 3. llms.txt 도달 가능
curl -sI https://www.zoellife.com/llms.txt
#   - HTTP 200, Content-Type: text/plain

# 4. 비공개 제품 제외 확인
curl -s https://www.zoellife.com/sitemap.xml | grep -c "/products/"
#   - 현재 published=true 인 제품 수와 일치 (대부분 1)
```

---

## 6. 본 문서가 다루지 않는 것 (의도적 제외)

다음은 효과는 있을 수 있으나 **검증 없이 만들면 거짓 신호** 가 되므로
이 문서에서 작업 항목으로 잡지 않는다:

- 미확인 저자/검수자 표기
- 미확인 인증/수상 표기
- "1위" / "유일" / "최고" 같은 평가어
- 출처 없는 효능 주장
- 양 부풀리기 (예: 작성하지 않은 논문 갯수 표기)
- 가짜 외부 백링크 / 자체 작성 후 외부인 인용 주장
- AI 답변 인용 KPI (관찰만 가능, 컨트롤 불가)

이런 신호는 단기적으로 순위·인용을 끌어올릴 수 있으나, 검증 절차에서
제재되거나 신뢰를 잃을 위험이 더 크다. 사실 자료가 확보된 시점에 §4
의 절차로 진입한다.

---

## 7. 참고 문서 (외부)

- robots 표준: https://www.rfc-editor.org/rfc/rfc9309
- llms.txt: https://llmstxt.org
- schema.org: https://schema.org
- Google Search Central: https://developers.google.com/search/docs
- Naver Search Advisor: https://searchadvisor.naver.com/guide
