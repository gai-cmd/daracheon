# 검색·AI 인용 기술 상태 (SEO + AEO)

> 2026-11-12 기준으로 다시 썼다. 이전 판(2026-04-25)은 지금 사이트와 맞지 않는 내용
> (www 정규 도메인, /reviews 평점 마크업, 살아 있는 /process 페이지 등)을 담고 있어 교체했다.
> 이 저장소는 공개 저장소이므로 **코드에서 확인할 수 있는 기술 상태만** 적는다.
> 계정·수치·운영 판단은 여기에 적지 않는다.

답변 엔진(AEO) 대응은 별도 기법이 아니라 크롤링 가능 · 색인 가능 · 신뢰 가능 · 최신이라는
기본 SEO 와 같은 일이다. `llms.txt` 는 노출 수단이 아니다.

---

## 1. 주소 · 색인 기본기

| 항목 | 상태 | 위치 |
|---|---|---|
| 정규 도메인 | `https://zoellife.com` (apex). `www` 는 apex 로 308 한 번 | `next.config.ts` redirects |
| canonical | 페이지마다 자기 주소. 루트 레이아웃에 기본값을 두지 않는다(404·noindex 페이지가 홈 canonical 을 물려받지 않게) | 각 `page.tsx` 의 `alternates.canonical` |
| 메타데이터 위치 | 모든 UA 에 `<head>` 로 보낸다(스트리밍 메타데이터 끔) | `next.config.ts` `htmlLimitedBots` |
| robots.txt | 관리자·API·`/edition/`·`/agarwood-edition`·`/thesis` 제외. 크롤러별 허용·차단 목록 | `src/app/robots.ts` |
| sitemap.xml | 공개 페이지·발행 제품·발행 글·글이 있는 카테고리. 1시간 주기 재생성 + 어드민 저장 시 즉시 재생성 | `src/app/sitemap.ts` |
| 색인 제외 | 미디어 상세(`/media/[id]`), 글이 0편인 카테고리, 초안 미리보기 — `noindex` | 각 `page.tsx` |
| 영구 이동 | `/process` → `/media`, `/support` → `/company#contact`, 옛 제품·글 슬러그 → 새 슬러그 | `next.config.ts` redirects |
| RSS | `/rss.xml` — 발행 글 전문 | `src/app/rss.xml/route.ts` |
| IndexNow(네이버) | 어드민에서 글·제품·페이지를 저장하면 해당 주소를 알린다. 발행 글·공개 제품이 내려가거나 삭제되거나 주소가 바뀌면 옛 주소도 알린다. 영구 이동되는 주소는 보내지 않는다. 프로덕션에서만 동작 | `src/lib/seo/indexnow.ts`, `src/app/api/admin/**` |

### sitemap 의 lastmod 규칙

lastmod 는 **실제 수정 시각을 아는 URL 에만** 넣는다. 요청 시각을 넣지 않는다.

- 블로그 글·카테고리·`/blog`: 글의 `updatedAt`
- 제품: 저장 레코드의 마지막 편집 시각(`_mt`)
- 주제 허브 5개: 콘텐츠 파일(`src/content/topics/*.ts`)의 `dateModified`. 허브 내용을 고치는 커밋에서 이 값을 함께 올린다
- 어드민 편집 페이지(`/about-agarwood`, `/brand-story`, `/showroom`): 어드민 저장 시 `pages` 레코드의 `pageUpdatedAt` 에 적히는 키별 저장 시각. 기록이 없으면 lastmod 를 생략한다

블로그 DB 가 켜져 있는데 발행 글이 0편으로 읽히면 sitemap 생성은 실패로 끝난다 —
블로그 URL 이 빠진 사본을 캐시하지 않고 직전 사본을 유지하기 위해서다.

### sitemap 의 이미지 항목

제품(대표·갤러리), 글(커버 + 본문 이미지 최대 5개), `/media` 사진, 주제 허브 대표 이미지,
`/about-agarwood`·`/brand-story`·`/showroom` 의 저장된 페이지 이미지. Vercel Blob 원본과
`/public` 자산만 넣고, `/_next/image` 주소와 외부 호스트는 넣지 않는다(`src/lib/seo/sitemap-images.ts`).

---

## 2. 구조화 데이터 (JSON-LD)

| 페이지 | 타입 |
|---|---|
| 모든 페이지(루트 레이아웃) | `Organization`, `Brand`, `WebSite` — `@id` 로 서로 참조 |
| 홈, 주제 허브, `/company` | `FAQPage` (화면에 보이는 문답만) |
| 주제 허브, `/about-agarwood`, `/brand-story` | `Article` + `BreadcrumbList` |
| `/products` | `CollectionPage` + `ItemList` (url 요약형) |
| `/products/[slug]` | `Product` + `Offer` + `BreadcrumbList` — 가격·재고는 화면과 같은 값 |
| `/blog` | `Blog` + `blogPost`(발행 글 전체) |
| `/blog/category/[id]` | `CollectionPage` + `ItemList` + `BreadcrumbList` |
| `/blog/[slug]` | `BlogPosting` + `BreadcrumbList`, 검증된 DOI 가 있으면 `citation` |
| `/media` | 조건을 충족하는 영상만 `VideoObject`, 사진은 `ImageObject` |
| `/home-shopping` | `BroadcastEvent` |

지키는 선:

- 리뷰·평점 마크업(`Review`, `AggregateRating`)을 내보내지 않는다.
- 검색 기능이 없으므로 `SearchAction` 을 내보내지 않는다.
- 이미지는 `ImageObject` 로 라이선스 정보(`/image-license`)와 함께 내보낸다.
- 글 작성자는 화면 바이라인과 같은 표시 이름을 쓴다. 브랜드·법인명이면 `Organization` 노드로 귀속한다.

구글은 FAQ 리치 결과를 제공하지 않는다. `FAQPage` 마크업은 리치 결과를 기대하고 두는 것이 아니다.

---

## 3. 블로그 읽기 경로

- 공개 블로그 경로(글·`/blog`·카테고리)는 캐시된 읽기를 쓴다: 본문을 뺀 발행 글 목록, 슬러그로 찾는
  발행 글 한 건, 카테고리 목록. 어드민 글·카테고리 저장이 캐시를 즉시 비우고, 그 밖에는 5분 뒤 다시 읽는다
  (`src/lib/blog/store.ts`).
- 글 페이지에서 읽기 실패는 500, 없는 슬러그만 404 다.
- 초안 미리보기와 어드민은 캐시 없는 전체 읽기를 쓴다.

---

## 4. AI 크롤러 · llms.txt

- 크롤러별 허용·차단은 `src/app/robots.ts` 의 두 배열이 정본이다.
- `/llms.txt`, `/llms-full.txt` 는 사이트 안내 파일이다. 노출 수단으로 다루지 않으며, 다른 페이지와
  어긋나는 값을 담지 않도록 다음을 지킨다.
  - 제품 가격·재고는 제품 페이지와 같은 계산(`src/app/llms.txt/llms-facts.ts`)
  - 크롤러 허용·차단 문장은 `robots.ts` 의 실제 규칙에서 생성
  - 영구 이동된 주소를 적지 않는다

---

## 5. 배포 후 확인 (변경 지점만)

```bash
# 글 한 편 — title·canonical 이 </head> 앞에 있는지
curl -s https://zoellife.com/blog/<slug> | awk '/<\/head>/{exit} 1' | grep -c 'rel="canonical"'

# sitemap — URL 수, 블로그 URL 포함 여부
curl -s https://zoellife.com/sitemap.xml | grep -c '<loc>'
curl -s https://zoellife.com/sitemap.xml | grep -c '<loc>https://zoellife.com/blog/'

# llms.txt — 제품 가격을 제품 페이지와 대조
curl -s https://zoellife.com/llms.txt | sed -n '/공개 제품/,/^$/p'
```

"0건"을 확인할 때는 같은 명령 안에 반드시 일치해야 하는 대조 항목을 함께 둔다.

---

## 6. 하지 않는 것 (가짜 신호 회피 규칙)

검증 없이 만들면 거짓 신호가 되므로 작업 항목으로 잡지 않는다.

- 미확인 저자·검수자 표기
- 미확인 인증·수상 표기
- "1위" · "유일" · "최고" 같은 평가어
- 출처 없는 효능 주장, 질병명과 제품을 잇는 표현
- 양 부풀리기(작성하지 않은 논문 수 표기 등)
- 창작한 후기·증언, 자체 작성 후 외부 인용인 것처럼 꾸미기
- 리뷰·평점 구조화 데이터
- 블로그 본문 고쳐 쓰기(본문은 이미지 속성만 손댄다)
- 외부 CDN 이미지 주소
- AI 전용 스키마, AI 답변 인용 수치를 목표로 삼는 것

---

## 7. 참고 문서 (외부)

- robots 표준: https://www.rfc-editor.org/rfc/rfc9309
- schema.org: https://schema.org
- Google Search Central: https://developers.google.com/search/docs
- Naver Search Advisor: https://searchadvisor.naver.com/guide
- Next.js `htmlLimitedBots`: https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots
- llms.txt(비공식 제안): https://llmstxt.org
