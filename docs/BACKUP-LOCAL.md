# zoellife.com 백업 운영 안내 (서버 정기 + 로컬)

작성 2026-07-08. 데이터 절대 소실 방지를 위한 다축 백업 체계.

## 백업 축 요약

| 축 | 수단 | 주기 | 위치 | 상태 |
|---|---|---|---|---|
| Tier 1 | Vercel Blob 스냅샷 | 매일 (크론 15:00 UTC = 00:00 KST) | 프로덕션 Blob `_snapshots/` | 운영 중 |
| Tier 2 | GitHub 암호화 커밋 | 매일 | GitHub backups 브랜치 | 운영 중 |
| Tier 3 | 암호화 이메일 첨부 | 매주 일요일 | 관리자 메일 | 운영 중 |
| Tier 4 (신규) | **로컬(내 Mac)** | 매일 03:00 (launchd) 또는 수동 | `~/Backups/zoellife/` | 본 문서 |

Tier 1~3 은 `src/lib/backup.ts` + `/api/cron/daily-backup` 가 담당한다. 2026-07-08 진단(DATA-3/4)에 따라 백업 대상을 leads·partner-accounts·media-submissions·blogPosts·blogCategories·qr-codes·product-guides·mail-settings·integration-settings·telegram-bot-state 까지 확장했고, 읽기 실패를 빈 값으로 저장하지 않도록(poison 방지) 강화했다.

## 로컬 백업 (Tier 4)

프로덕션 Blob 을 **읽기 전용**으로 내려받아 내 Mac 에 저장한다. 라이브 DB 에 절대 쓰지 않는다.

### 무엇을 받나

`BLOB_DATA_PREFIX` 아래 전체(`_snapshots/` 제외). 즉 모든 live 컬렉션 + **QR per-record 레코드(qr-events/·qr-serials/·qr-coupons/)와 tombstone(tomb/)까지** 포함 — 서버 스냅샷이 아직 다루지 못하는 QR 하위 레코드가 로컬 축에서는 보존된다.

### 설정 (1회)

`.env.local` 에 다음을 추가한다.

- `BLOB_DATA_PREFIX=<프로덕션 prefix>` — 필수. 비밀값이므로 소스·문서에 하드코딩하지 않는다.
- `BLOB_READ_WRITE_TOKEN=<Vercel Blob 토큰>` — 이미 설정돼 있음.
- `BACKUP_ENCRYPTION_KEY=<64자 hex>` — 권장. 설정 시 각 파일을 AES-256-GCM 으로 암호화 저장(PII·비밀번호 해시 보호). 키 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. 이 키는 서버(Vercel)의 `BACKUP_ENCRYPTION_KEY` 와 **같은 값**으로 두면 Tier 2/3 과 호환된다.

선택 환경변수: `BACKUP_LOCAL_DIR`(기본 `~/Backups/zoellife`), `BACKUP_KEEP`(보관 회차, 기본 30).

### 수동 실행

```
npm run backup:local          # 전체 백업 (암호화 키 있으면 암호화)
npm run backup:local -- --dry-run   # 다운로드 없이 대상만 확인
npm run backup:local -- --plain     # 키가 있어도 평문으로 저장
```

성공 시 `~/Backups/zoellife/zoellife-backup-<타임스탬프>/` 아래에 파일들과 `manifest.json`(파일 목록·크기·sha256)이 생성된다. 일부라도 실패하면 종료코드 2 로 알린다.

### 정기 실행 (launchd, 매일 03:00)

```
cp scripts/launchd/com.zoellife.backup-local.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.zoellife.backup-local.plist
launchctl start com.zoellife.backup-local     # 즉시 1회 테스트
```

로그: `~/Backups/zoellife-backup-local.log` / `.err.log`. node·프로젝트 경로가 다르면 plist 를 수정한다.

해제: `launchctl unload ~/Library/LaunchAgents/com.zoellife.backup-local.plist`

## 복원 절차 (수동 · 신중 — 라이브 DB 를 덮어씀)

복원은 라이브 데이터를 덮어쓰므로 **이 도구는 복원을 자동 실행하지 않는다.** 실제 복원이 필요할 때만, 승인 하에 아래를 따른다.

1. 어느 시점으로 되돌릴지 로컬 백업 회차를 고른다(`manifest.json` 확인).
2. 암호화본이면 먼저 복호화한다(`BACKUP_ENCRYPTION_KEY` 필요). `.enc` 파일은 `{cipher(base64), iv(hex), tag(hex)}` JSON — `src/lib/backup-crypto.ts` 의 `decryptString` 과 동일 포맷.
3. 우선순위: 가능하면 **관리자 UI 의 백업/복원 기능**(`/admin/backup`, Tier 1~3 스냅샷 기반)을 사용한다. 로컬 파일을 직접 Blob 으로 올려 복원해야 하는 경우, 반드시 프리뷰/스테이징에서 리허설한 뒤 프로덕션에 적용한다.
4. 복원 전 반드시 현재 상태의 pre-restore 스냅샷을 확보한다(코드가 자동 수행하나, 수동 업로드 경로에선 직접 챙긴다).

권장: 분기 1회 프리뷰 환경 대상 **복원 리허설**을 실행해 백업이 실제로 복구 가능한지 검증한다("복원 리허설 통과 전 데이터 불가침" 원칙).

## 실가동 상태 (2026-07-10)

- Tier 4 최초 실행 완료. 대상 51개 파일(1,358.9KB → 암호화 899.8KB), 실패 0.
- launchd `com.zoellife.backup-local` 등록 완료, 즉시 1회 실행 검증(LastExitStatus 0, stderr 없음).
- **복호화 리허설 통과**: 51/51 파일이 복호화되고 manifest 의 sha256(평문 기준)과 전량 일치, JSON 파싱 전량 성공. 백업이 실제로 복구 가능함을 확인했다. (라이브/스테이징에 실제로 쓰는 복원 리허설은 별개로 남아 있다.)
- 백업 루트·회차 폴더는 `0700`, 파일은 `0600` 으로 스크립트가 강제한다(PII·비밀번호 해시 보호). umask 와 무관하게 매 회차 적용.
- `BACKUP_ENCRYPTION_KEY` 는 **Apple 암호 앱에 보관**한다. 이 키가 없으면 어떤 회차도 복호화할 수 없다 — 키 분실 = 백업 전량 소실.
- `leads.json`·`product-guides.json` 은 아직 blob 이 생성된 적이 없어 백업 목록에 나타나지 않는다(데이터 없음). 로컬 축은 prefix 전체를 훑으므로 최초 쓰기 시점부터 자동 포함된다.

### 옛 prefix 백업 (보존)

`~/Backups/zoellife-oldprefix/oldprefix-FULL-*` 는 2026-07-10 삭제한 옛(노출) prefix 의 전량(스냅샷 36개 포함 87개) 암호화 사본이다. 신 prefix 와 대조해 "구에만 있는 파일 0개"를 확인한 뒤 삭제했으므로 운영상 불필요하나, 롤백 보험으로 남겨 둔다.

## 복원 리허설 (2026-07-10 통과)

`scripts/restore-rehearsal.mjs` — 로컬 백업을 복호화해 격리 prefix `_rehearsal-<타임스탬프>/` 에 업로드하고 재다운로드해 sha256 전량 대조한다. **51/51 round-trip 통과** — 복호화→쓰기→읽기 전 경로가 실증됐으므로, 실제 복원은 대상 prefix 만 바꾼 동일 코드다. 라이브 prefix 는 읽지도 쓰지도 않으며, 기본 dry-run·`--apply` 명시·정리는 `--cleanup`(리허설 prefix 형식 가드) 3중 안전장치. 분기 1회 재실행 권장.

## 서버측 QR 아카이버 (2026-07-10 추가)

`src/lib/qr-archive.ts` — 일일 크론이 qr-events(당월+전월)·qr-coupons·qr-serials per-record blob 을 `_qr-archive/` 월 롤업 JSON 으로 아카이브한다. fetch 실패 시 해당 월을 덮어쓰지 않고 degraded 보고(poison 방지), 빈 대상은 빈 아카이브를 만들지 않는다. `_snapshots/` 밖에 두는 이유: pruneSnapshots 보존 정책의 삭제 대상이 되지 않기 위해. 로컬 Tier 4 는 `_snapshots/` 만 제외하므로 `_qr-archive/` 도 자동 백업된다.

## 아직 남은 강화 항목

- 자동 복원 리허설 파이프라인(현재는 수동 실행).
