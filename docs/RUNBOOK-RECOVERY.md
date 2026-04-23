# 고객 DB 복구 런북 (Recovery Runbook)

> 문의/제품/리뷰/관리자 계정 등 고객 DB 가 손상·삭제·오염되었을 때의 표준 복구 절차.
> 작성일: 2026-04-24

---

## 0. 즉시 판단 — 어떤 유형의 사고인가?

| 증상 | 유형 | 해당 섹션 |
|---|---|---|
| 특정 문의/제품/리뷰 1건이 실수로 삭제됨 | **A: 단건 오삭제** | §1 |
| 다수 레코드가 한꺼번에 사라짐 · 빈 목록 | **B: 벌크 손실** | §2 |
| 데이터가 이상하게 변경됨 (내용 오염·구조 이상) | **C: 오염** | §3 |
| 공개 페이지 전체가 빈 화면·에러 | **D: 전면 장애** | §4 |
| 관리자 계정 전부 로그인 불가 | **E: Lockout** | §5 |
| Blob URL 에 고객 정보 직접 노출 의심 | **F: 유출 의심** | §6 |

---

## §1. 단건 오삭제 복구

**전제**: 삭제 시 `pre-delete` 스냅샷이 자동 생성되어 있음 (inquiries/products/reviews/faq/broadcasts/media/admin-users 모두 커버).

### 절차
1. 관리자 로그인 (`super_admin` 권한 필요)
2. `/admin/backup` 이동
3. 상단에 최근 `pre-delete` 스냅샷 존재 확인 — 삭제 시각과 일치하는지 확인
4. **"복원 옵션"** 에서 기본값 유지 (관리자 계정·감사 로그 덮어쓰기 체크 해제)
5. 해당 `pre-delete` 행의 "복원" 버튼 클릭 → 경고창 확인 → 진행
6. 복원 후 자동으로 현재 상태가 `pre-restore` 스냅샷으로 저장됨 → 문제 시 즉시 롤백 가능
7. 공개 페이지에서 데이터 복구 확인

### 주의사항
- 복원은 **전체 테이블 덮어쓰기**. 삭제 시각 이후에 추가된 다른 데이터도 함께 롤백됨
- 한 건만 살리고 나머지는 유지하고 싶으면 → **수동 JSON 편집 경로** 사용 (§7)

---

## §2. 벌크 손실 (여러 건 동시 삭제)

**원인 예시**: 관리자 실수, 스크립트 버그, blob 동기화 실패

### 절차
1. 감사 로그(`/admin/audit-log`) 확인 → 언제·누가·어떤 action 을 수행했는지 타임라인 파악
2. `/admin/backup` 에서 사고 시각 **이전의** 가장 가까운 스냅샷 선택
   - 전날 자정 `daily` 스냅샷이 가장 안전한 기준점
   - 수동(`manual`) 스냅샷이 있다면 그것도 후보
3. 복원 전에 **수동 스냅샷** 한 번 더 찍기 ("+ 수동 스냅샷" 버튼) — 현재 상태를 명시적으로 보존
4. 선택한 스냅샷 복원
5. 복원 후 이후 추가된 정상 데이터가 함께 소실되지 않았는지 검증
   - 필요하면 §7 의 병합 경로 사용

---

## §3. 데이터 오염 (구조 이상·잘못된 값)

**증상**: 필드 타입이 이상함, 외부에서 주입된 스크립트 흔적, 외래키 깨짐

### 절차
1. **즉시** `/admin/backup` 에서 수동 스냅샷 생성 (현재 오염된 상태를 증거로 보존)
2. 감사 로그로 최근 변경 주체 식별
3. 오염 발생 직전 스냅샷(daily 또는 직전 manual) 복원
4. 복원 후 보안 조치:
   - 의심되는 관리자 세션 강제 만료: `ADMIN_SESSION_SECRET` 을 새 값으로 교체 → 모든 세션 무효화
   - `/admin/audit-log` 에서 해당 시간대 의심 로그인 기록 확인
5. 근본 원인(주입/버그) 수정 전까지는 쓰기 API 차단 고려

---

## §4. 전면 장애 (모든 공개 페이지가 빈 화면·에러)

**원인 후보**: Vercel Blob 토큰 만료/회수, BLOB_DATA_PREFIX 변경 누락, Blob store 삭제

### 진단 순서
1. 관리자 로그인 시도
   - 로그인 가능 → §4A
   - 로그인 불가 → §5
2. `/admin/db` 진입 → "Blob 개요" 표 확인
   - `Blob 토큰: ✗ 없음` → 토큰 누락 (Vercel 환경변수 점검)
   - 파일 수 0 / 불일치 다수 → Blob 데이터 손실

### §4A. 토큰은 있는데 데이터 없음
1. `/admin/db` → **"E2E Probe"** 실행 → 어느 단계에서 실패하는지 확인
2. Probe 성공이지만 데이터 0 → 
   - `BLOB_DATA_PREFIX` 가 변경되었거나 기존 blob 이 삭제되었을 가능성
   - Vercel 환경변수 확인: 현재 값 vs 이전 값
   - `/admin/backup` 에 가장 최근 `daily` 스냅샷 있으면 즉시 복원
3. 최후 수단: 저장소의 `data/db/*.json` fs seed 상태로 자동 fallback 되므로, 관리자가 재입력하거나 복원할 때까지 공개 페이지는 seed 로 렌더됨 (서비스 중단 방지)

---

## §5. Lockout — 관리자 계정 전부 로그인 불가

**방어 장치**: `/api/admin/users` DELETE 는 마지막 `super_admin` 삭제를 차단함 (409 응답).
**그럼에도 발생한다면**: 스냅샷 복원으로만 로그인 불가에서 벗어날 수 있음 — 하지만 로그인 못 하면 스냅샷 UI 도 못 쓰는 악순환.

### 절차 (개발자 레벨 개입 필요)

#### Option A: 시드 계정 임시 활성화
1. Vercel 환경변수에 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 를 임시로 설정
2. 재배포 (환경변수 반영)
3. 시드 계정으로 로그인 → `/admin/backup` 에서 최근 스냅샷 복원 (⚠ "관리자 계정도 덮어쓰기" 체크)
4. 복원 완료 후 시드 환경변수 제거 → 재배포

#### Option B: Vercel CLI 로 blob 직접 편집
1. `vercel env pull .env.local` (또는 대시보드에서 `BLOB_READ_WRITE_TOKEN` · `BLOB_DATA_PREFIX` 복사)
2. 로컬에서 `node scripts/restore-admin-user.ts <email> <password>` 와 같은 복구 스크립트 실행 (없으면 작성)
3. 또는 `/admin/backup` 의 JSON 스냅샷을 로컬에서 편집 후 `/api/admin/backup` POST 로 업로드 복원

---

## §6. 유출 의심 (공개 Blob URL 접근 흔적)

### 즉시 조치
1. Vercel 환경변수 `BLOB_DATA_PREFIX` 를 **완전히 새로운 값** 으로 교체 (예: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`)
2. 재배포 → 이후 모든 쓰기가 새 prefix 에 저장됨
3. Vercel Blob 대시보드에서 **이전 prefix 경로의 모든 파일 수동 삭제**:
   - `<old-prefix>/*.json`
   - `<old-prefix>/_snapshots/*.json`
4. `/api/admin/backup/snapshots` 에서 신규 스냅샷 생성 (새 prefix 상 초기화 확인)
5. 감사 로그·서버 로그에서 접근 패턴 분석 → 필요 시 고객 통지
6. `ADMIN_SESSION_SECRET` 회전 → 모든 세션 강제 만료

### 사후 보강
- `next.config.ts` 의 `Content-Security-Policy` 에 `<old-storeId>` 블록 추가 (이전 URL 에 섹션 간 참조 방지)
- PIPA/GDPR 고지 의무 체크리스트 확인

---

## §7. 수동 병합 — 스냅샷으로 "선택적 복원"

전체 테이블 덮어쓰기 대신 일부만 살리고 싶을 때.

### 절차
1. `/admin/backup?id=<snapshot-id>` 다운로드 (JSON)
2. 현재 DB 상태도 수동 스냅샷으로 별도 다운로드
3. 로컬에서 두 JSON 을 `jq`/편집기로 병합
   - 예: `inquiries` 배열에서 특정 id 한 건만 과거 버전으로 교체
4. `/api/admin/backup` POST 로 병합된 JSON 업로드 → 원자적 복원
5. 결과 검증 → 문제 시 직전 `pre-restore` 스냅샷으로 즉시 롤백

---

## 정기 점검 체크리스트 (주 1회)

- [ ] `/admin/backup` 에서 최근 7일 `daily` 스냅샷 존재 확인
- [ ] 감사 로그에서 비정상 패턴 (심야 시간대 대량 삭제 등) 확인
- [ ] `/admin/db` 에서 Blob/seed 불일치 항목 0 확인
- [ ] `/api/admin/db/probe` 수동 실행하여 쓰기 경로 정상 확인
- [ ] 월 1회: 수동 스냅샷 복원 훈련 (테스트 환경 또는 무해한 테이블 대상)

---

## 환경변수 복구 노트

사고 해결 중 환경변수 교체가 필요한 경우:

| 변수 | 효과 | 교체 후 필수 작업 |
|---|---|---|
| `ADMIN_SESSION_SECRET` | 모든 세션 무효화 | 없음 — 사용자가 자연스럽게 재로그인 |
| `BLOB_DATA_PREFIX` | DB 경로 이동 | ① 이전 경로 blob 전량 삭제, ② 스냅샷 복원 또는 재입력 |
| `BLOB_READ_WRITE_TOKEN` | Blob 접근 복구 | 공개 페이지가 fs seed 로 fallback 중이면 재배포로 해소 |
| `CRON_SECRET` | 일일 백업 수동 트리거 가능 | 새 값을 cron 호출 시 `Authorization: Bearer <값>` 로 전달 |

---

## 연락/에스컬레이션

- 1차: super_admin (로컬 대응)
- 2차: 개발자 (스크립트·코드 수정 필요 시)
- Vercel 팀 연락: https://vercel.com/help — Blob store 자체 복구 필요 시
