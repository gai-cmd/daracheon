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

## 아직 남은 강화 항목

- 서버 Tier 1~3 의 QR per-record prefix(qr-events/·serials/·coupons/) 아카이빙 — 현재는 로컬 축에서만 보존. prefix 워커 추가 예정.
- 백업 암호화 키(`BACKUP_ENCRYPTION_KEY`) 사본 보관 위치의 명문화(자매 프로젝트는 Apple 암호 앱 보관).
- 자동 복원 리허설 파이프라인.
