# zoellife.com 풀스택 구조·보안·성능 진단 보고서

- 대상: `daerachoen` (zoellife.com) — Next.js 15 App Router + React 19 + TypeScript, Vercel 배포, Vercel Blob(JSON) 데이터 저장
- 진단일: 2026-07-07
- 방식: 소유자 본인 코드베이스에 대한 읽기 전용 정적 분석 + 라이브 사이트 비파괴 응답 헤더/TTFB 실측 (파괴적 스캔·침투 없음)
- 규모: `src` 기준 137 `.ts` + 128 `.tsx`, API 라우트 약 76개, admin 페이지 36, partner 2, Blob 컬렉션 19종

---

## 1. 총평

전반적으로 **1인 운영 사이트로서는 평균 이상으로 견고**합니다. 인증(PBKDF2 10만 회·HMAC 세션·로그인 잠금·TOTP), 3중 백업(Blob/GitHub/암호화 이메일), 그리고 실제 데이터 유실 사고(2026-06-07)의 교훈이 `db.ts`에 outbox/tombstone 형태로 코드화돼 있는 점은 우수합니다.

그러나 다음 네 축에서 **즉시 조치가 필요한 결함**이 확인됐습니다.

| 축 | 상태 | 핵심 문제 |
|---|---|---|
| 보안 | 심각 결함 2건 | editor→super_admin 권한 상승, 무인증 콘텐츠 덮어쓰기 |
| 데이터/DB | 심각 결함 3건 | 고객 PII가 공개 Blob에 노출(비밀 prefix가 repo에 하드코딩), 싱글턴 저장 유실 경로, 백업 커버리지 40% 누락 |
| 성능 | 구조적 저하 | 전 페이지 `force-dynamic` + 무캐싱 Blob 읽기로 TTFB 웜 1.4~3.1s / 콜드 7.6s |
| 구조/품질 | 기반 취약 | 자동화 테스트 0건, ESLint 미설치, CI 품질 게이트 없음 |

심각도 분포: **Critical/High 8건, Medium 10건, Low 다수.**

우선순위 원칙: **(P0) 원격 도달 가능한 보안·PII 결함 → (P1) 성능 Quick Win → (P2) 데이터 신뢰성·구조 개선.**

---

## 2. P0 — 즉시 조치 (원격 악용 가능)

### SEC-1 (High, 확증) 관리자 사용자 관리 API에 역할 검사 부재 → 권한 상승
- 위치: `src/app/api/admin/users/route.ts` POST/PUT/DELETE
- 내용: 이 라우트는 미들웨어(`src/middleware.ts`)의 "유효 세션 존재" 검사에만 의존하며, 미들웨어는 `super_admin`/`admin`/`editor`를 구분하지 않고 모두 통과시킴. 핸들러 내부에 `session.role` 검사가 전혀 없음(대조적으로 `export/[module]`·`db/resync`·`backup/snapshots`는 `session.role !== 'super_admin'`을 명시 검사).
- 악용: 최저 권한 `editor`가 `POST /api/admin/users {role:'super_admin'}` 또는 자기 레코드를 `PUT role:'super_admin'`으로 승격 → 관리자 계층 완전 장악.
- 대책: 핸들러 내부에서 세션을 재검증하고 모든 변경 동사에 `super_admin`을 요구. 역할 민감 작업은 미들웨어만 믿지 말 것.

### SEC-2 (High, 확증) 무인증·GET 방식 프로덕션 콘텐츠 덮어쓰기
- 위치: `src/middleware.ts:15`(`PUBLIC_ADMIN_API_PREFIXES`에 등록) + `src/app/api/admin/seed-process-tab/route.ts`
- 내용: `/api/admin/seed-process-tab`가 공개 화이트리스트에 올라가 있고, 그 `GET` 핸들러가 `writeSingle('pages', ...)`로 프로덕션 Blob의 brand-story 콘텐츠를 하드코딩 값으로 덮어씀.
- 악용: 익명 방문자(또는 `<img src>`·링크를 통한 CSRF)가 GET 한 번으로 홈 brand-story를 변조(디페이스먼트). 심어지는 값에 외부 CDN URL이 포함돼 프로젝트 자체 규칙도 위반.
- 대책: 화이트리스트에서 제거해 미들웨어 보호 하에 두고, `POST`+`super_admin`으로 전환. 일회성 시드였다면 배포본에서 삭제.

### DATA-1 (High) 고객 PII·자격증명이 공개 Blob URL로 접근 가능, 비밀 prefix가 repo에 커밋됨
- 위치: `src/lib/db.ts:420-426`(`access:'public'` 쓰기), `db.ts:40-53`(보호가 "추측 불가 prefix"뿐임을 코드가 시인), `scripts/deploy-db-to-blob.mjs:41` 및 `CLAUDE.md:54`(프로덕션 prefix `fd290…`가 평문 커밋), `db.ts:427`(쓰기마다 전체 Blob URL을 로그 출력)
- 노출 목록: `inquiries.json`(이름·이메일·전화·문의내용), `leads.json`(+ IP·User-Agent), `admin-users.json`·`partner-accounts.json`(PBKDF2 해시), `password-reset-tokens.json`(유효 재설정 토큰 → 계정 탈취), 타임스탬프로 예측 가능한 `_snapshots/daily-<ISO>.json`
- 내용: 보안 모델 전체가 "URL을 못 맞춘다"에 의존하나, URL 구성요소(host + prefix)가 소스와 문서에 커밋되고 Vercel 로그로도 새어나감. repo 읽기 권한/로그 유출 시 단일 무인증 GET으로 전체 PII·해시·재설정 토큰 덤프 가능.
- 대책(순서): (a) `BLOB_DATA_PREFIX` 즉시 로테이션, `deploy-db-to-blob.mjs`·`CLAUDE.md`의 하드코딩 fallback 제거(env 없으면 실패하도록). (b) 전체 Blob URL 로그 출력 중단. (c) 중기: PII 파일을 실제 접근 제어 뒤로 이동 — Vercel Blob private access(플랜 확인) 또는 기존 `backup-crypto.ts`의 AES-GCM으로 저장 시 암호화, 혹은 Supabase(타 프로젝트에서 이미 유료 사용 중)로 이관.

> 참고: 자매 프로젝트(KIOSK-CRM)의 안전 원칙 "복원 리허설 통과 전 데이터 불가침"·"유출 시 즉시 로테이션"과 동일 선상. 본 prefix 로테이션은 그 원칙의 직접 적용입니다.

### 그 밖의 P0 인접 항목
- SEC-M3: `src/middleware.ts:41` — `THESIS_TOKEN`이 `'zoel-thesis-2026-ok'`로, `thesis-unlock` 비밀번호가 `'agarwooding'`으로 소스에 하드코딩. env 미설정 시 이 값이 실제 잠금 해제값이 됨. → 리터럴 제거, 미설정 시 fail-closed.
- SEC-M2: `src/app/api/admin/mirror-url/route.ts:52` — 프로토콜만 검사하는 서버측 fetch(SSRF). 사설/링크로컬 IP(169.254.169.254 등) 차단·리다이렉트 재검증 추가.

---

## 3. 성능 진단 (로딩 속도)

라이브 실측: 홈 TTFB 웜 1.4~2.3s(콜드 7.6s), /products 1.8~3.1s, /blog 1.9s. 홈 응답 헤더는 `cache-control: no-store` + `x-vercel-cache: MISS`로, **CDN 캐싱이 전혀 걸리지 않음**을 확인. TTFB가 지배적 병목이며 폰트·비최적 이미지가 그다음.

### PERF-1 (Critical) 전 페이지 `force-dynamic` + 요청마다 무캐싱 Blob 왕복
- 20개 이상 라우트가 `force-dynamic`(홈 `page.tsx:16` 포함). 미선언 페이지도 `readSingleUncached`가 `fetch(cache:'no-store')`라 사실상 동적.
- `readSingleUncached`/`readDataUncached`(`db.ts:333-386`)는 매 읽기가 **2회 순차 HTTP**(Blob 인덱스 `list()` → 캐시 무력화 쿼리 fetch). 루트 레이아웃(`layout.tsx:347,350,366`)만으로 navigation→productCategories→company **3회 직렬 await**(최대 6 왕복)가 모든 페이지·모든 요청에서 발생. `/products`는 여기에 3회 더 추가(그중 `pages.json`은 165KB, 매 요청 무캐싱).
- 대책(레버리지 순):
  1. 이미 존재하는 캐시 경로 활용: `blobReadRaw`가 `unstable_cache`+`tags:['db:<file>']`+`revalidate:300`을 감싸고, admin 쓰기마다 `revalidateTag`·`revalidatePath` 호출됨. 공개 페이지·레이아웃의 `*Uncached` → `readSingleSafe`/`readDataSafe`로 교체하면 태그 무효화로 신선도는 유지되면서 TTFB 대폭 감소(−0.5~1s 예상).
  2. 레이아웃·/products의 독립 읽기를 `Promise.all`로 병렬화.
  3. 중기: 콘텐츠 라우트를 `force-dynamic` → ISR(`revalidate=300`)로 전환. 태그/경로 무효화가 있으므로 admin 저장 시 즉시 반영은 유지. TTFB ~100~300ms 목표 가능.
  4. `list()` 생략: Blob 경로가 결정적(`${prefix}${file}.json`)이므로 URL 직접 구성으로 왕복 절반.

### PERF-3 (High) Google Fonts를 번들 CSS `@import`로, 14종 굵기, preconnect 없음
- `src/styles/zoel/tokens.css:5` — Noto Sans KR 7 + Noto Serif KR 4 + JetBrains Mono 3 굵기를 `@import`. HTML→CSS→fonts.googleapis→gstatic 4-hop 렌더 블로킹 체인이며 폰트 도메인 preconnect 없음.
- 대책: `next/font/google`로 셀프호스트(외부 체인 제거, swap-CLS 자동 완화), 실제 사용 굵기 3~4종으로 축소. 단기라면 최소 `preconnect`(fonts.gstatic.com/googleapis.com) 추가.

### PERF-4 (High) 공개 페이지 `next/image`에 광범위한 `unoptimized`
- 20곳(LCP 후보 포함: `products/ProductsPageClient.tsx:51` 히어로, `page.tsx:1059` 등). AVIF/WebP·리사이즈·srcset 비활성 → 모바일이 원본 JPEG(0.5~5.4MB) 다운로드. `next.config.ts:15`가 Blob 호스트를 이미 허용하므로 `unoptimized`는 불필요한 잔재로 보임.
- 대책: 공개 페이지 이미지에서 `unoptimized` 제거. 홈 히어로는 `background-image` → `<Image fill priority>`로 전환해 뷰포트 폭 AVIF 제공.

### PERF-6 (Medium) 블로그 커버 이미지에 치수 없음, 첫 이미지까지 lazy
- `blog/[slug]/page.tsx:233` 원시 `<img>`에 width/height 없음 → CLS, LCP 우선순위 힌트 없음. `blog/sanitize.ts:204`는 모든 본문 이미지에 `loading="lazy"`(폴드 위 포함).
- 대책: 커버에 aspect-ratio + `fetchpriority=high`, 새니타이저는 첫 이미지 lazy 제외.

### PERF-7 (Medium) 배포 위생
- `public/uploads`에 49MB(27MB MP4 5개 포함) — 프로젝트 자체 "미디어는 Blob" 규칙과 상충하며 매 배포에 포함. 루트의 `zoel-app.js`(2.1MB)·`.pptx`(27MB)·`backups/`(424MB)·`source-assets/`(59MB)·`dist/`(22MB)는 런타임엔 무영향이나 배포 업로드를 무겁게 함(빌드 지연).
- 대책: 영상/대용량 스캔은 Blob로 이동(`<video preload="none">` + 포스터), `.vercelignore`에 `backups/`·`source-assets/`·`dist/`·`new design/`·`zoel-app.js`·`*.pptx` 추가.

성능 클린 판정(우수): TinyMCE는 admin 전용 `next/dynamic`으로 격리돼 공개 번들 누수 없음. GA4는 `lazyOnload`. 무거운 서버 전용 라이브러리가 클라이언트 컴포넌트로 새는 곳 없음.

### 성능 Quick Win(시간 단위) vs 심화(일 단위)
- Quick Win: 레이아웃·/products 읽기 `Promise.all` → `*Safe` 캐시 전환 → 공개 이미지 `unoptimized` 제거 → 폰트 preconnect·굵기 축소 → 블로그 커버 치수/우선순위 → `.vercelignore` 정리.
- 심화: 폰트 `next/font` 이관 → 콘텐츠 라우트 ISR 전환 → `list()` 제거·리트라이 핫패스 이탈 → 히어로 `next/image` → reveal-on-scroll의 폴드 위 opacity:0 제거.

---

## 4. 보안 진단 (요약)

P0의 SEC-1/2/M3/M2 외 잔여 항목.

- SEC-M1 (Medium) 관리자 세션 폐기 불가·역할 동결: `verifySessionToken`이 서명·만료만 검사, 서버측 폐기 없음(파트너 측은 `active`+`passwordChangedAt` 재검증 있음). 비밀번호 재설정·삭제·강등이 발급된 토큰(기본 7일)을 무효화하지 못함. → admin에 `passwordChangedAt`/토큰 버전 도입, 공유 가드에서 현재 사용자 레코드와 재검증, max-age 단축.
- SEC-M4 (Medium) CSP `script-src`에 `unsafe-inline`·`unsafe-eval`(라이브 확인). Next hydration 제약이나 XSS 방어를 약화. → 미들웨어 nonce 기반 CSP로 전환.
- SEC-L1 TOTP 재사용 방지가 프로세스 로컬 Map(다중 인스턴스에서 재생 가능) → 공유 저장소로.
- SEC-L2/L3 cron·telegram 시크릿 비교가 비상수시간 `===`, cron은 헤더 존재 fallback → `Authorization: Bearer` + 상수시간 비교, 미설정 시 deny.
- SEC-L4 `blog/sanitize.ts`가 DOMPurify 로드 실패 시 원본 HTML 반환(fail-open) + `style` 허용 → fail-closed로, `style` 제거/화이트리스트.
- SEC-L5 `middleware.ts:114-115`가 admin 이메일/역할을 응답 헤더로 노출(확인) → 요청 헤더로 옮기거나 제거.

우수: PBKDF2-SHA256 10만 회·상수시간 비교, 세션 쿠키 `HttpOnly/SameSite=strict/Secure`, 5회/15분 로그인 잠금, 파트너 세션 폐기 정상 구현, 업로드 MIME·크기·경로 검증 및 SVG 의도적 제외, 재설정 토큰 SHA-256 저장·단일 사용·열거 방지, 보안 헤더 풀세트(CSP·HSTS preload·X-Frame-Options DENY·nosniff·Permissions-Policy) 라이브 적용 확인. 파트너 데이터 IDOR 없음.

---

## 5. 데이터/DB 진단 (요약)

DATA-1(P0)에 더해:

- DATA-2 (High) 싱글턴 쓰기 경로가 stale seed로 조용히 저하: `readSingleUncached`는 절대 throw하지 않고 실패 시 LKG→fs seed→`null` 반환. `pages/route.ts:88-104`(168KB `pages.json`) 및 `mail-settings`·`settings`·`integration-settings`·`announcement`·`navigation`이 이 base 위에 한 키만 병합 후 전체 덮어씀. Blob 블립/콜드 인스턴스에서 저장하면 배포 이후 편집분 전체가 날아갈 수 있음(2026-06-07 유실 메커니즘이 싱글턴에 여전히 열림). 라우트의 503 가드는 read가 throw 못 해 사문화. → 배열용 `readDataForWrite`와 동형의 `readSingleForWrite`(전이 실패 시 throw, 이전 데이터 존재 시 NOT_FOUND 거부) 신설 후 6개 라우트에 적용.
- DATA-3 (High) 백업 커버리지 약 60%: `leads`·`partner-accounts`·`media-submissions`·`blogPosts`/`blogCategories`·`qr-codes` 및 QR 하위(`qr-events/*`·`qr-serials/*`·`qr-coupons/*`)·`mail-settings`·`integration-settings` 등이 어느 티어에도 백업 안 됨. Blob 손상·토큰 유출 삭제 시 영구 손실. → `DB_FILES`/`SINGLETON_FILES`(+restore)에 추가, QR prefix는 walker/주간 아카이브 잡.
- DATA-4 (Medium) Blob 장애 중 스냅샷이 빈 배열을 정상처럼 기록("poison backup") → 복원 시 데이터 삭제. `payload.meta.degraded` 기록, degraded 복원 거부/경고, cron 실패 시 텔레그램 알림.
- DATA-5 (Medium) 동시성: 추가·삭제는 봉인됐으나 같은 레코드 동시 업데이트는 last-writer-wins, 싱글턴은 보호 전무 → 레코드 `rev`/`updatedAt` + newest-wins·충돌 로그, `pages`는 `uploadedAt` 기반 poor-man ETag.
- DATA-6 (Medium) `seed-sync.ts:32`가 잘못된 prefix(`'db/'`) 사용 + 문서가 주장하는 prebuild 시드 동기화 미존재 → prefix를 `BLOB_DATA_PREFIX`에서 파생(1줄 수정), prebuild 배선 또는 CLAUDE.md 정정.
- DATA-7 (Medium) Blob에서 읽은 문서 스키마 검증·버저닝 없음(Zod는 요청 경계에만) → 파일별 Zod 스키마를 write/restore 시 검증, `_schema` 필드.
- DATA-8 (Medium) O(n) 전체 재기록 핫스팟·무한 증가: 문의 1건 제출에 5~8 Blob 왕복, `inquiries`/`leads`/`reviews`/`media-submissions` 보존정책 없음, QR 분석은 이벤트 blob을 대시보드마다 개별 fetch(코드가 P1로 명시), GitHub 목록은 N+1 → 아카이빙·QR 롤업·Git Trees API.
- DATA-L6 복원 리허설 기록 없음: 복원 경로는 잘 방호돼 있으나 end-to-end 드릴 문서 부재 + DATA-3 커버리지 갭 상속 → 프리뷰 환경 대상 드릴 예약(자매 프로젝트 원칙 준수). 백업 암호화 키(`BACKUP_ENCRYPTION_KEY`) 에스크로 위치 미문서화(KIOSK-CRM은 Apple 암호 앱 보관) → 본 repo에도 키 사본 위치 명문화.

우수: 사고 기반 하드닝(del→put 금지·NOT_FOUND 3-상태 구분·seed base 거부), outbox+tombstone 설계, QR 이벤트의 `allowOverwrite:false` 원자 생성, 3티어 AES-256-GCM 백업, 태그 기반 캐시 무효화.

---

## 6. 구조·코드 품질 진단 (요약)

- ARCH-1 (Critical) 자동화 테스트 0건: `*.test.*`/`*.spec.*` 및 vitest/jest/playwright 전무. 76개 라우트·손수 구현한 auth/TOTP/HMAC·outbox/tombstone 동시성·백업/복원·QR 토큰 로직이 무검증(이미 프로덕션 데이터를 2회 유실). → vitest + fs-mode Blob 계층(이미 존재)으로 `writeDataMerged`/`reconcile`/`appendData` 시나리오 테스트, `auth`/`totp`/`qr/token`/`csv-parser` 단위 테스트.
- ARCH-2 (High) 품질 게이트 부재: `npm run lint`이 `next lint`이나 ESLint가 devDeps에 없고 설치·설정도 없음(`// eslint-disable` 주석은 실행 안 되는 규칙을 방어). CI(`.github/workflows`)는 claude 봇·deploy-blob뿐, typecheck/lint 실행 없음. `tsconfig` strict는 켜져 있고 프로덕션 빌드가 타입은 강제하는 점은 양호. → eslint+설정 추가, PR/push에 `tsc --noEmit`+lint(+테스트) 워크플로.
- ARCH-3 (High) 환경변수 산개: src에서 50개(스크립트 포함 63개) `process.env` 참조, 검증 config 모듈 없음(Zod 미적용), `.env.example`은 약 40개 중 7개만 기재. `GEMINI_API_KEY`와 `GOOGLE_GENAI_API_KEY` 중복. → `src/lib/env.ts` 단일 Zod 스키마(server/client 분리), `.env.example` 재생성.
- ARCH-4 (High) 관측성 부재: 로깅은 302개 `console.*`(Sentry/pino 없음), 에러 바운더리(`error.tsx`/`global-error.tsx`) 전무, Blob 저하 시 사람에게 알림 없음(사고 이력 감안 위험). → `global-error.tsx`+세그먼트 `error.tsx`, Sentry(무료 티어), Blob 읽기 실패 경고 알림.
- ARCH-5 (Medium) 데이터 접근 문자열 타이핑: 파일명 리터럴이 84개 import 파일에 산재(`'products'`×21 등), 오타 시 조용히 빈 컬렉션 생성. 일부는 저장소 모듈, 일부는 라우트 원시 접근으로 경계 불일치. → `collections.ts` 타입드 레지스트리.
- ARCH-6 (Medium) 데드코드/레거시: `/products-v2/[slug]`는 어디서도 참조 안 되는 고아 라우트인데 공개 라우팅되어 중복/구버전 상품 콘텐츠가 크롤링됨(게이트/삭제). `data/zoel-life-source/`(824KB)+`.zip`이 git 커밋(구 Vite+Firebase 사본, 혼란 유발). `scripts/` 249개 중 170개가 prod Blob 자격증명 읽음(주기적 정리 필요). `csv.ts`/`csv-parser.ts` 분리, `GEMINI_*` 이중.
- ARCH-7 (Medium) IMAP 폴링(`inbound.ts`, 5분 cron)이 서버리스 함수 내에서 매 호출 연결 수립 — 취약. 재검토 권장.

우수: 3개 표면(public/admin/partner) 라우트 분리가 미들웨어에서 일관 강제, `db.ts`는 god-module이 아니라 단일 책임의 제네릭 store, 런타임 의존성 18개로 기능 대비 소수, 사고 후 교훈을 코드 주석으로 축적.

---

## 7. 우선순위 로드맵

### 1단계 — P0 보안·PII (당일~2일)
1. SEC-1: `api/admin/users` POST/PUT/DELETE에 `super_admin` 역할 검사 추가.
2. SEC-2: `seed-process-tab`를 공개 화이트리스트에서 제거·`POST`+`super_admin`화(또는 삭제).
3. DATA-1: `BLOB_DATA_PREFIX` 로테이션, `deploy-db-to-blob.mjs`·`CLAUDE.md`의 하드코딩 prefix 제거(env 없으면 실패), Blob URL 로그 출력 중단.
4. SEC-M3: `THESIS_TOKEN`/thesis 비밀번호 리터럴 제거·fail-closed.
5. SEC-M2: `mirror-url` SSRF 사설망 차단.

### 2단계 — 성능 Quick Win (2~3일)
6. 레이아웃·/products 읽기 `Promise.all` 병렬화.
7. 공개 페이지·레이아웃 `*Uncached` → `*Safe`(캐시) 전환.
8. 공개 이미지 `unoptimized` 제거, 블로그 커버 치수·우선순위.
9. 폰트 preconnect + 굵기 축소, `.vercelignore` 정리.

### 3단계 — 데이터 신뢰성 (3~5일)
10. DATA-2: `readSingleForWrite` 신설·6개 싱글턴 라우트 적용.
11. DATA-3: 백업 커버리지 확장(누락 컬렉션·QR prefix).
12. DATA-4/6: degraded 스냅샷 표시·알림, `seed-sync` prefix 1줄 수정.
13. 복원 리허설 실행·문서화, 백업 키 에스크로 명문화.

### 4단계 — 품질 기반 (지속)
14. ARCH-1: vitest 도입(db 동시성·auth·totp·qr 우선).
15. ARCH-2: ESLint 설치 + CI(typecheck/lint/test) 게이트.
16. ARCH-3: `env.ts` Zod 검증 모듈·`.env.example` 완성.
17. ARCH-4: 에러 바운더리 + Sentry + Blob 저하 알림.
18. 폰트 `next/font` 이관, 콘텐츠 라우트 ISR 전환, `/products-v2`·`zoel-life-source` 정리.

---

## 부록 — 검증 메모

- 직접 확증(실파일/라이브): SEC-1(users 라우트에 role 검사 없음), SEC-2(`middleware.ts:15` 공개 등록), SEC-M3(`middleware.ts:41`), SEC-L5(응답 헤더), SEC-M4(라이브 CSP), 보안 헤더 풀세트 프로덕션 적용, 홈 `cache-control:no-store`+`x-vercel-cache:MISS`, `CLAUDE.md`에 prod prefix 평문.
- 나머지 항목은 4개 병렬 정적 분석 에이전트(보안·데이터·성능·구조)의 파일·라인 근거 기반이며, 조치 착수 시 해당 파일 재확인 권장.
