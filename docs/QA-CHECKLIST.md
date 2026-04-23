# 대라천 프로젝트 QA 체크리스트

> 작성일: 2026-04-23
> 범위: 관리자 ↔ 공개 프론트 연동 · 보안 · 빌드/타입
> PM 관점 전체 QA 산출물. 수동 검증용 체크리스트.

## 검사 결과 서머리

| 영역 | 결과 |
|---|---|
| TypeScript `tsc --noEmit` | ✅ PASS |
| ESLint `next lint` | ✅ PASS |
| 관리자↔공개 연동 | ⚠ 구조적 결함 6건 |
| 보안 (고객정보) | 🔴 CRITICAL 1건 + HIGH 6건 |

---

## 🔴 P0 — 즉시 수정 (배포 전 필수)

### [P0-1] Vercel Blob 공개 노출 — 고객 개인정보 유출 리스크

**위치**: `src/lib/db.ts:176-182`, `src/lib/storage.ts:69-74`

```ts
await put(`${BLOB_PREFIX}${filename}.json`, ..., {
  access: 'public',          // ← 누구나 URL만 알면 접근
  addRandomSuffix: false,    // ← 경로도 예측 가능 (db/inquiries.json)
  ...
});
```

**시나리오**: 이미지 업로드 URL이 공개되면 Blob store ID가 노출됨. 그 순간 아래 URL 전수 노출:
- `https://<storeId>.public.blob.vercel-storage.com/db/inquiries.json` — 모든 고객 이름/이메일/전화/문의
- `https://<storeId>.public.blob.vercel-storage.com/db/admin-users.json` — 관리자 해시 (오프라인 크래킹 대상)
- `https://<storeId>.public.blob.vercel-storage.com/db/password-reset-tokens.json` — 활성 재설정 토큰

**체크**:
- [ ] `db/*.json` 파일들을 Vercel Blob **private** 저장소로 이전 (또는 Vercel KV/Postgres 전환)
- [ ] 현재 Blob에 쌓인 `db/*.json` 전부 수동 삭제 (이미 노출됐을 수 있음 전제)
- [ ] `access` 옵션을 `'private'`으로 하거나 토큰 기반 읽기로 변경
- [ ] 업로드 이미지만 public으로 유지, 데이터 JSON은 분리

---

### [P0-2] 관리자 설정 GET/PUT await 누락 (Race Condition)

**위치**: `src/app/api/admin/settings/route.ts:9, 30`

```ts
const company = readSingle<...>('company');   // ← await 누락 → Promise 반환
const existing = readSingle<...>('company');  // ← 동일
```

**영향**:
- GET은 `Promise {}` 직렬화 → 관리자 settings 페이지가 빈 데이터로 로드
- PUT은 `{...Promise, ...body}` → Promise의 non-enumerable 프로퍼티가 날아가 body만 저장 (기존 필드 전부 소실)

**체크**:
- [ ] 두 줄에 `await` 추가
- [ ] 관리자 화면에서 "회사 정보" 진입 → 기존값 표시 확인
- [ ] 필드 하나만 수정 → 저장 후 다른 필드가 유지되는지 확인

---

## 🟠 P1 — 배포 전후 빠르게

### [P1-1] 관리자 저장 후 공개 페이지 즉시 미반영

**위치**: 아래 API들 모두 `revalidatePath` 호출 누락
- `src/app/api/admin/products/route.ts`
- `src/app/api/admin/reviews/route.ts`
- `src/app/api/admin/faq/route.ts`
- `src/app/api/admin/announcement/route.ts`
- `src/app/api/admin/broadcasts/route.ts`
- `src/app/api/admin/settings/route.ts`

(정상: `navigation/route.ts:79`, `pages/route.ts:108` — 이 둘은 호출하고 있음)

**현상**: 저장 직후 공개 페이지에 반영 안 됨 → 새로고침 반복해야 보이는 "간신히 맞춰놓음" 상태의 근본 원인.

**체크**: 각 엔드포인트 쓰기 성공 직후 아래 중 해당 경로 추가:
- [ ] products: `revalidatePath('/products','layout'); revalidatePath('/products/[slug]','layout');`
- [ ] reviews: `revalidatePath('/reviews','layout');`
- [ ] faq: `revalidatePath('/support','layout');`
- [ ] announcement: `revalidatePath('/','layout');` (Header 표출)
- [ ] broadcasts: `revalidatePath('/','layout');` (BroadcastCountdown)
- [ ] settings: `revalidatePath('/company','layout'); revalidatePath('/','layout');`

**수동 검증 절차** (수정 후):
- [ ] 관리자에서 제품 1건 가격 수정 → 3초 내 `/products` 반영
- [ ] 리뷰 verified ON 토글 → 3초 내 `/reviews` 목록 반영
- [ ] FAQ 새 항목 등록 → 3초 내 `/support` 반영
- [ ] 공지 배너 ON 토글 → 3초 내 모든 페이지 Header 반영
- [ ] 회사정보 전화번호 수정 → 3초 내 `/company` + Footer 반영

---

### [P1-2] /api/contact Rate Limit · 봇 방어 부재

**위치**: `src/app/api/contact/route.ts`

- Rate limit 없음. CAPTCHA 없음. IP 로깅 없음.
- 봇이 초당 수백 건 가짜 문의 투입 시 `inquiries.json` 오염 + 관리자 메일 스팸 + Blob 비용 증가.

**체크**:
- [ ] IP 기반 제한 (예: 1시간당 5건) 또는 Vercel edge middleware rate limit 적용
- [ ] Cloudflare Turnstile / hCaptcha 연동
- [ ] 동일 이메일 중복 투입 체크 (최소 1시간 간격)

---

### [P1-3] SVG 업로드 허용 — Stored XSS

**위치**: `src/app/api/admin/upload/route.ts:9-16`, `src/lib/storage.ts:20`

SVG는 `<script>` 실행 가능. 관리자 UI에서 미리보기로 열면 XSS. 공개 노출되면 고객 브라우저에서 실행.

**체크**:
- [ ] `ALLOWED_MIME`에서 `image/svg+xml` 제거
- [ ] 이미 업로드된 SVG 전수 점검 (`public/uploads/**/*.svg`, Blob uploads)

---

### [P1-4] 비밀번호 재설정 토큰 수명 과다

**위치**: `src/app/api/admin/auth/password-reset/route.ts`

토큰 유효기간 60분. 이메일 경유로 로그/프록시에 노출된 토큰을 공격자가 재사용할 시간.

**체크**:
- [ ] 유효기간 15분으로 단축
- [ ] 사용 후 즉시 삭제 (`used: true` 유지가 아닌 delete)

---

### [P1-5] 세션 시크릿 / ADMIN_PASSWORD 검증

**체크**:
- [ ] `ADMIN_SESSION_SECRET` 프로덕션에 32바이트 이상 랜덤 값으로 설정되어 있는지 Vercel 환경변수 확인
- [ ] `ADMIN_EMAIL/ADMIN_PASSWORD` (시드 계정) — 더 이상 사용 안 하면 제거. DB 기반 `admin-users`만 사용하도록 로그인 로직 정리
- [ ] `.env.local`이 git에 체크인 안 됐는지 `git log --all -- '**/.env*'` 확인

---

## 🟡 P2 — 이번 달 안에

### [P2-1] 감사 로그 PII 기록

`logAdmin` summary에 고객 이름 기록 (inquiries route.ts:168, contact route.ts:57)
→ 로그 대신 `targetId`만 기록. 이름은 `meta` 에도 넣지 말 것.

- [ ] inquiries PATCH: `summary: '문의 답변 작성: ${body.id}'`로 변경
- [ ] contact POST console.log: ID만 남기고 payload 기록 금지

---

### [P2-2] fs seed 스키마 동기화 리스크

`data/db/*.json`은 `readSingleSafe`의 최후 fallback. Admin이 새 필드 추가하면 Blob엔 반영되지만 seed는 구식 상태. Blob 장애 시 구식 데이터가 공개 페이지에 노출됨.

- [ ] Admin 저장 시 Blob 쓰기 성공 후 `data/db/*.json`도 덮어쓰는 동기화 스크립트 (dev에서만) 또는
- [ ] 배포 파이프라인에 "seed 스키마 검증" 단계 추가

---

### [P2-3] 보안 헤더 미비

`next.config.ts` 헤더에 CSP · HSTS 없음.

- [ ] `Content-Security-Policy` 추가 (최소: `frame-ancestors 'none'; object-src 'none'`)
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `Permissions-Policy` 필요 권한만 허용

---

### [P2-4] 세션 쿠키 `sameSite: 'strict'`로 강화

`src/app/api/admin/auth/login/route.ts:164` — 현재 `'lax'`. 관리자 계정은 cross-site 필요성 없으므로 strict 가능.

---

### [P2-5] TOTP window 축소

`src/lib/totp.ts` — 기본 `window=1` (총 90초). `window=0`으로 줄이거나 사용된 코드 기록하여 replay 방지.

---

### [P2-6] /api/health/blob 공개 누출

공격자가 Blob 상태/개수 추정 가능. 관리자만 접근하도록 미들웨어에 포함.

---

### [P2-7] CSV Export 역할 제어

`/api/admin/export/[module]` — 모든 관리자가 고객 PII CSV 다운로드 가능. `super_admin`만 허용, 다운로드 감사 로그 필수.

---

## 🟢 P3 — 개선

- [ ] PBKDF2 100k → Argon2id 또는 PBKDF2 600k 이상
- [ ] 로그인 잠금 15분 → exponential backoff
- [ ] `constantTimeEqual` 길이 비교 timing leak
- [ ] AI chat API 비용 가드레일 (일일 토큰 한도)
- [ ] `/api/admin/db/resync` 2단계 확인 (스냅샷 → 실행)
- [ ] 개인정보 보존기간 정책 (문의 1년 후 자동 삭제 등) — PIPA 준수

---

## 관리자 ↔ 공개 연동 매핑 (수동 검증용)

각 항목을 직접 관리자에서 변경 후 공개 페이지에서 새로고침(F5) 없이 반영되는지 확인.

| 도메인 | 관리자 저장 API | 공개 페이지 | revalidatePath? | 검증 |
|---|---|---|---|---|
| 제품 | `/api/admin/products` | `/products`, `/products/[slug]` | ❌ 없음 | [ ] |
| 리뷰 | `/api/admin/reviews` | `/reviews` | ❌ 없음 | [ ] |
| FAQ | `/api/admin/faq` | `/support` | ❌ 없음 | [ ] |
| 공지 배너 | `/api/admin/announcement` | Header (전체) | ❌ 없음 | [ ] |
| 방송 | `/api/admin/broadcasts` | BroadcastCountdown (Header) | ❌ 없음 | [ ] |
| 회사정보 | `/api/admin/settings` | `/company`, Footer | ❌ 없음 | [ ] |
| 페이지 콘텐츠 | `/api/admin/pages` | `/`, `/about-agarwood`, `/brand-story`, `/process`, `/support`, `/company` | ✅ 있음 | [ ] |
| 네비게이션 | `/api/admin/navigation` | Header/Footer 링크 | ✅ 있음 | [ ] |
| 미디어 | `/api/admin/media` | `/` 미디어 섹션 | ⚠ 미확인 | [ ] |
| 문의 (수신) | `/api/contact` → `/api/admin/inquiries` | (관리자만) | — | [ ] |

---

## 필드 누락 / 타입 미스매치 의심

| 도메인 | 필드 | Admin UI 편집 | 공개 페이지 사용 | 상태 |
|---|---|---|---|---|
| products | `gallery` | ⚠ 미확인 | ✅ 사용 | 관리자에서 편집 불가하면 저장 후 사라짐 — [ ] |
| products | `variants` | ✅ | ✅ | [ ] |
| reviews | `source` | ❌ | ⚠ JSON-LD | [ ] (선택) |
| reviews | `verified` | ✅ bulk | ✅ 필터 | [ ] |
| inquiries | `subject` | ⚠ | — | OK |

---

## 빌드/타입 상태

- [x] `npx tsc --noEmit` — exit 0 (경고 없음)
- [x] `npx next lint` — exit 0
- [ ] `npx next build` — 미실행 (배포 전 필수 실행)
- [ ] Lighthouse 점수 (성능/접근성/SEO) — 미측정

---

## 배포 전 최종 체크

- [ ] P0-1 (Blob 공개) 수정 완료
- [ ] P0-2 (settings await) 수정 완료
- [ ] P1-1 (revalidatePath) 6개 엔드포인트 수정 완료
- [ ] P1-2 (contact rate limit) 적용
- [ ] P1-3 (SVG 제거) 적용
- [ ] `ADMIN_SESSION_SECRET` 32바이트+ 확인
- [ ] `BLOB_READ_WRITE_TOKEN` 프로덕션 설정 확인
- [ ] `ADMIN_EMAIL` 운영자 받은편지함 확인
- [ ] `npx next build` 성공
- [ ] 관리자 로그인 → 각 도메인 1건씩 변경 → 공개 페이지 반영 확인
- [ ] 로그인 실패 5회 → 잠금 동작 확인
- [ ] `/api/contact` 폼 제출 → 관리자 메일 수신 확인
