# 대라천 관리자 페이지 운영 가이드

## 🔑 최초 로그인

- URL: `https://<도메인>/admin/login` 또는 로컬 `http://localhost:3000/admin/login`
- 환경변수 `.env.local`
  - `ADMIN_EMAIL` — 관리자 로그인 이메일
  - `ADMIN_PASSWORD` — 로그인 비밀번호
  - `ADMIN_SESSION_SECRET` — **반드시 배포 전 긴 랜덤 문자열로 교체** (쿠키 서명 키)
  - `ADMIN_SESSION_MAX_AGE_DAYS` — 로그인 세션 유지 일수 (기본 7일)

## 📦 관리 모듈

| 메뉴 | 경로 | 기능 |
|---|---|---|
| 대시보드 | `/admin` | 오늘 신규 문의 / 승인 대기 리뷰 / 예정 방송 / 재고 경고 / 최근 리스트 |
| 제품 관리 | `/admin/products` | CRUD + 이미지 업로드 + 카테고리 |
| 홈쇼핑 방송 | `/admin/broadcasts` | 방송 편성 CRUD + 상태(예정/진행중/종료/취소) + 제품 연결 + 판매량·피드백 |
| 리뷰 관리 | `/admin/reviews` | CRUD + 일괄 승인/거부 + 평균별점·승인대기 통계 |
| 문의 관리 | `/admin/inquiries` | 상태 변경 + 답변 저장 + 답변 이력 + 일괄 상태 변경 |
| 미디어 관리 | `/admin/media` | 언론보도/기사/영상 CRUD + 이미지 업로드 |
| FAQ 관리 | `/admin/faq` | 카테고리별 FAQ CRUD |
| 설정 | `/admin/settings` | 회사 정보 / 로고 / 소셜 / 농장 / 인증 / 수상 / SEO |

## 💾 데이터 저장 방식

- 현재: **JSON 파일 DB** (`data/db/*.json`) — 초기 MVP 단계
  - 파일 목록: `products.json`, `productCategories.json`, `reviews.json`, `inquiries.json`, `media.json`, `broadcasts.json`, `faq.json`, `company.json`
- 이미지: **로컬 파일 시스템** (`public/uploads/<subdir>/`)
- 향후 확장: PostgreSQL + Prisma + S3/Supabase Storage로 마이그레이션 예정

## 🔗 공개 사이트 연동 (ISR)

- 공개 페이지 (`/products`, `/reviews`, `/media`, `/home-shopping`, `/support`)는 JSON DB에서 데이터를 읽음
- **1분 간격 ISR** — 관리자 페이지에서 수정하면 최대 60초 안에 공개 사이트에 반영
- 즉시 반영이 필요한 경우: `next build` 재빌드 또는 `revalidateTag` 도입 고려

## 📧 이메일 자동응답 (Resend)

- 환경변수 `RESEND_API_KEY` 설정 시 실제 발송
- 미설정 시 **dry-run 모드** (콘솔 로그만) — 개발 편의
- 고객 접수 확인 메일 + 관리자 알림 메일 자동 발송 (`/api/contact`)
- 발신 도메인은 `src/lib/mail.ts`에서 관리 (기본 `no-reply@daracheon.com`)

## 🚀 배포 (Vercel)

1. Vercel에 GitHub 리포지토리 연결
2. 환경변수 설정 (Production):
   ```
   ADMIN_EMAIL
   ADMIN_PASSWORD
   ADMIN_SESSION_SECRET    ← 긴 랜덤 문자열로 교체
   ADMIN_SESSION_MAX_AGE_DAYS=7
   RESEND_API_KEY          ← 이메일 사용 시
   NEXT_PUBLIC_SITE_URL
   CONTACT_EMAIL
   ```
3. **주의**: Vercel은 서버리스 환경 — JSON 파일 쓰기가 **읽기만 가능**한 경우 있음. 운영 환경에서는 DB 마이그레이션 필요.
4. 이미지 업로드는 Vercel에서 로컬 저장 불가 — Cloudinary/S3로 마이그레이션 필요 (향후 과제).

## ⚠️ 운영 시 주의

- 배포 전 `ADMIN_SESSION_SECRET`은 반드시 **긴 랜덤 문자열**로 교체
- `ADMIN_PASSWORD`도 기본값 변경 필수
- JSON DB는 동시 쓰기에 취약 — 트래픽 적은 관리자 페이지에서만 사용
- 이미지 업로드는 8MB 제한 (`src/app/api/admin/upload/route.ts`)

## 🗂 주요 파일

- 인증 로직: `src/lib/auth.ts`, `middleware.ts`
- DB 유틸: `src/lib/db.ts`
- 이메일 유틸: `src/lib/mail.ts`
- 업로드 API: `src/app/api/admin/upload/route.ts`
- 이미지 업로드 공통 컴포넌트: `src/components/admin/ImageUploadField.tsx`
- 관리자 레이아웃: `src/app/admin/(dashboard)/layout.tsx`
- 로그인 페이지: `src/app/admin/login/page.tsx`
