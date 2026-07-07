# 대라천 (zoellife.com) 프로젝트 헌법

> 이 파일은 프로젝트 루트에 두며, Claude Code 가 자동으로 컨텍스트에 로드한다.
> **이 파일이 이 프로젝트의 단일 규칙 소스다.** (예전의 워크스페이스 룰 `D:\…\CLAUDE.md`·글로벌 룰
> 참조는 윈도우 환경 잔재였고, 현재 작업 머신은 macOS — 그런 외부 룰 파일은 없다.)

## 🖥 작업 환경 (macOS)

- 작업 디렉터리: `/Users/gai/personal/daerachoen` (git remote `gai-cmd/daracheon`).
- **배포 = main 푸시**. 이 머신은 SSH 키가 GitHub 미등록이라 `gh` 토큰으로 **HTTPS 푸시**한다
  (`git -c credential.helper='!gh auth git-credential' push https://github.com/gai-cmd/daracheon.git main`).
- 프로덕션 콘텐츠(Blob) 직접 읽기/쓰기 레시피·자격증명 위치는 **Claude 메모리**(`MEMORY.md`)에 정리돼 있다.

## 🎨 CSS 토큰 함정 — dark-theme.css 가 변수 의미를 리맵한다

`src/styles/zoel/dark-theme.css` 는 `:root` 에서 라이트 토큰을 다크 값으로 **반전 재정의**한다:
`--lx-ivory`=블랙, `--lx-sand`/`--lx-cream`=다크 슬레이트, **`--lx-ink`=크림(#fdfbf7)**.
즉 tokens.css 의 정의값을 보고 `var(--lx-ink)` 를 "어두운 잉크색"으로 쓰면 런타임엔 크림색이
나온다 (2026-07-07 /partner/login 텍스트 실종 사고 원인). 추가로 dark-theme 는 body·input·label·
h1~h6 등에 전역 `!important` 색상을 강제한다.

**규칙**:
- 새 화면(특히 /admin·/partner 처럼 자체 완결 UI)은 전역 토큰 var() 에 의존하지 말고
  고정 hex 리터럴 또는 자체 스코프 변수를 쓴다.
- 전역 토큰을 쓰려면 tokens.css 가 아니라 **dark-theme.css 의 재정의값**을 기준으로 판단한다.
- 새 페이지는 배포 전 실제 브라우저 렌더링(스크린샷)으로 텍스트 대비를 확인한다.

## 🚫 외부 CDN 의존 금지 (불변 원칙)

**모든 사이트 이미지·미디어 자산은 Vercel Blob (또는 git 저장소의 `/public/`) 안에만 둔다.**

다음은 **콘텐츠 URL 로 사용 금지**:
- ❌ `lh3.googleusercontent.com/...` (Google Drive 썸네일/공유 CDN)
- ❌ `drive.google.com/...` 직접 링크
- ❌ `res.cloudinary.com/ddsu7fl1o/...` (이전 마이그레이션 잔재)
- ❌ 그 외 외부 호스트의 이미지/영상 직링크

**허용**:
- ✅ `https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/...` (Vercel Blob — 우리 인프라)
- ✅ `/uploads/...`, `/images/...` 등 git 저장소에 번들된 정적 자산
- ✅ `youtube.com/embed/...`, `drive.google.com/file/.../preview` (iframe 임베드 — 다운된다고 사이트 깨지지 않음)

**근거**:
- 외부 CDN 은 우리가 통제 못 함 — 호스트가 이미지 삭제하거나, rate-limit 걸거나, 도메인 정책 바뀌면 사이트가 즉시 깨진다.
- 대라천은 Vercel **유료 플랜**을 사용하고 Vercel Blob 이 포함된다 — 무료 한도 걱정으로 외부에 의존할 이유가 없다.
- 이미 Drive 에서 받아온 이미지를 노출용으로 쓸 거면, 첫 사용 시점에 Vercel Blob 으로 복사해 두고 그 URL 을 DB(`pages.json`)에 저장한다. (예: `scripts/migrate-farm-chapter-images-to-blob.ts`, `scripts/deploy-showroom.ts`)

**적용 시점**:
- 새 이미지를 admin 으로 업로드: `ImageUploadField` 컴포넌트가 자동으로 Vercel Blob 에 올린다 — 그대로 사용.
- 외부 URL 을 코드/데이터에 박는 PR 은 **머지 금지**. 발견 즉시 마이그레이션 스크립트 작성 후 교체.

## 데이터 저장 위치

- 콘텐츠 데이터(JSON): `BLOB_DATA_PREFIX` 가 붙은 Vercel Blob (프로덕션 prefix: `fd290ae46c4cb398d2afcdc4fc7cfe95/`).
- 시드 데이터: `data/db/*.json` — 빌드 시 `prebuild` 가 blob → seed 동기화. **로컬 시드 수정만으로는 프로덕션 반영 안 됨** — blob 직접 갱신해야 한다.

## 배포

- main 푸시 → Vercel 자동 빌드 → zoellife.com.
- 콘텐츠 변경(blob)은 빌드 없이 즉시 반영 (`force-dynamic` + `readSingleUncached`).
- 어드민 저장 시 관련 경로 `revalidatePath` 자동 트리거 (`src/app/api/admin/pages/route.ts` 의 `PAGE_PUBLIC_PATHS`).
