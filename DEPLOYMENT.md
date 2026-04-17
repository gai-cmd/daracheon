# 대라천 Vercel 배포 가이드

## 🎯 배포 전 체크리스트

### 1. Cloudinary Unsigned Upload Preset 생성 (10분)

Vercel 서버리스에서는 로컬 파일 쓰기가 불가능하므로 이미지 저장소를 Cloudinary로 교체합니다.

1. https://cloudinary.com 로그인 (이미 `ddsu7fl1o` 계정 있음)
2. Settings → Upload → **Add upload preset**
3. 설정:
   - **Signing Mode**: `Unsigned`
   - **Preset name**: `daracheon_unsigned` (또는 원하는 이름)
   - **Folder**: `daracheon`
   - **Access mode**: Public
   - **Use filename**: No (자동 생성 권장)
   - (선택) Transformations → `f_auto, q_auto` 로 자동 최적화
4. Save

→ 환경변수 추가:
```
CLOUDINARY_CLOUD_NAME=ddsu7fl1o
CLOUDINARY_UPLOAD_PRESET=daracheon_unsigned
```
이 2개가 설정되면 `src/lib/storage.ts` 가 자동으로 Cloudinary 경로로 전환됩니다. 설정 안 하면 로컬 `/public/uploads` fallback.

### 2. 데이터베이스 선택 (20분)

**현재 상태**: JSON 파일 DB (`data/db/*.json`)
**문제**: Vercel 서버리스는 파일 쓰기 불가 → 관리자 변경이 다음 배포 때 덮어씌워짐
**해결**: Postgres 기반 DB로 마이그레이션 필요

**추천 옵션 (비용순)**:
- **Supabase** (무료 500MB + auth/storage 번들) — https://supabase.com
- **Neon** (무료 Postgres) — https://neon.tech
- **Vercel Postgres** (월 $0~) — 콘솔에서 바로 생성

1. 프로젝트 생성 후 connection string 복사
2. `.env.local` 및 Vercel 환경변수에 추가:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```
3. 마이그레이션 실행:
   ```bash
   npx tsx scripts/migrate-to-postgres.ts
   ```
   (스크립트는 현재 스켈레톤 상태 — Prisma 통합 시 완성)

**옵션 C — 당분간 JSON 유지**:
Vercel 배포하되 **관리자 변경은 커밋/재배포로만 반영**하는 모드. 긴급 MVP 가능하지만 운영 편의성 떨어짐.

### 3. 환경변수 (Vercel Dashboard → Settings → Environment Variables)

Production에 설정:

| 키 | 값 예시 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.daracheon.com` | ✅ |
| `NEXT_PUBLIC_SITE_NAME` | `대라천` | ✅ |
| `ADMIN_EMAIL` | `admin@daracheon.com` | ✅ |
| `ADMIN_PASSWORD` | (강력한 비밀번호) | ✅ |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 48` 로 생성 | ✅ |
| `ADMIN_SESSION_MAX_AGE_DAYS` | `7` | ⚠️ |
| `CLOUDINARY_CLOUD_NAME` | `ddsu7fl1o` | ✅ |
| `CLOUDINARY_UPLOAD_PRESET` | `daracheon_unsigned` | ✅ |
| `RESEND_API_KEY` | `re_...` | ⚠️ (이메일 사용 시) |
| `DATABASE_URL` | Postgres 연결 문자열 | ⚠️ (DB 전환 시) |
| `CONTACT_EMAIL` | `contact@daracheon.com` | ⚠️ |

⚠️ = 선택(없으면 fallback 동작)

## 🚀 배포 플로우

```bash
# 1. 코드 푸시
git add . && git commit -m "chore: deploy" && git push

# 2. Vercel에서 자동 배포 (Git 연동 시)
# 또는 CLI:
npm i -g vercel
vercel --prod
```

## 🧪 배포 후 검증

1. `https://<your-domain>/` — 공개 홈
2. `https://<your-domain>/admin/login` — 로그인 페이지
3. 로그인 → 대시보드 정상 렌더링
4. 제품 관리에서 이미지 업로드 시 `res.cloudinary.com/<cloud>/...` URL 반환 확인 (로컬 `/uploads/...` 아님)
5. 배너/공지/FAQ 수정 → 60초 내 공개 페이지 반영 (ISR)

## ⚠️ 알려진 제약 (JSON DB 유지 시)

- `/api/admin/products` POST → 200 응답하지만 **재배포 시 손실**
- 관리자 변경 사항을 영구 보존하려면 커밋 또는 Postgres 마이그레이션 필요
- `data/db/` 의 파일을 읽기 전용으로 인식하고 **초기 시드 데이터**로만 사용 권장

## 📋 배포 후 체크리스트

- [ ] Cloudinary 이미지 업로드 정상
- [ ] 로그인 + 세션 쿠키 유지
- [ ] 대시보드 위젯 · 사이드바 배지 표시
- [ ] 공개 페이지 ISR 작동 (60초 후 수정 내용 반영)
- [ ] `/admin/audit-log` 에서 작업 이력 조회
- [ ] 이메일 자동 답변 (RESEND_API_KEY 설정 시) 실제 전송
- [ ] `ADMIN_PASSWORD` 기본값 변경됨
- [ ] `ADMIN_SESSION_SECRET` 32자 이상 랜덤 값으로 교체

## 🔒 보안 권장사항

1. `ADMIN_SESSION_SECRET` 을 Vercel Production/Preview/Development 에 **각기 다른** 값으로 설정
2. `.env.local` 은 절대 커밋하지 말 것 (이미 `.gitignore` 처리됨)
3. `data/db/` 도 `.gitignore` 처리됨 — 민감 고객 데이터가 들어갈 수 있으므로
4. Vercel Dashboard → Deployment Protection → Preview 배포에 암호 걸기 권장
5. 배포 후 `ADMIN_PASSWORD` 는 사용하지 말고 `/admin/users` 에서 실제 관리자 계정 추가 후 env 계정은 비상용으로만 보관
