# 대라천 (zoellife.com) 프로젝트 헌법

> 이 파일은 프로젝트 루트에 두며, Claude Code 가 자동으로 컨텍스트에 로드한다.
> 워크스페이스 룰(`D:\99_개인\website\CLAUDE.md`) 과 글로벌 룰을 보충한다.

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
