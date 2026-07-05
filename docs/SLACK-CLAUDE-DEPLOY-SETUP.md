# 슬랙/Claude 세션에서 배포까지 완주하는 환경 셋업

## 왜 지난번에 "배포에서 막혔나"

이 사이트(zoellife.com)는 **런타임에 Vercel Blob 을 읽는다**(`force-dynamic`). 그래서
`data/db/*.json` 시드를 git 에 커밋·푸시해도 프로덕션은 바뀌지 않는다 — Blob 에 직접 써야
라이브 반영된다. Blob 쓰기는 `BLOB_READ_WRITE_TOKEN` 이 필요한데, **슬랙 Claude 클라우드
세션 환경에는 이 토큰이 없다.** 그래서 Claude 는 브랜치 커밋·PR 까지만 하고 마지막 배포
단계에서 막혔다.

## 해결 전략

토큰을 가진 **GitHub Actions** 가 배포를 대신 완료하게 만든다. 그러면 슬랙 legacy 봇이든,
새 "Claude Tag" 든, GitHub 의 `@claude` 든 — 어떤 Claude 표면이 작업하든 **"main 에 머지 →
Actions 가 자동 배포"** 로 끝난다. Claude 표면은 토큰을 몰라도 된다.

## 구성 요소 (이 브랜치에 포함)

- `scripts/deploy-db-to-blob.mjs` — 시드 → 운영 Blob 배포. 콘텐츠 파일만 화이트리스트 배포,
  런타임 데이터(inquiries/reviews/audit-log 등) 오배포 방지, 덮어쓰기 전 백업.
- `.github/workflows/deploy-blob.yml` — main 푸시 시 바뀐 `data/db/*.json` 만 자동 배포
  (+ 수동 `workflow_dispatch`).
- `.github/workflows/claude.yml` — GitHub 에서 `@claude` 태그 → CI 안에서 Claude Code 실행.
- `scripts/setup-github-secrets.sh` — 배포 secrets 등록 헬퍼.
- `npm run deploy:blob` — 로컬 수동 배포 (`node scripts/deploy-db-to-blob.mjs [파일...]`).

## 셋업 순서 (사용자가 직접 실행할 단계)

### 1. GitHub Actions secrets 등록 (필수)

```bash
cd /Users/gai/personal/works/daerachoen
gh auth switch -u gai-cmd          # 리포 owner 계정으로
bash scripts/setup-github-secrets.sh
```

등록되는 것: `BLOB_READ_WRITE_TOKEN`, `BLOB_DATA_PREFIX`.

### 2. 워크플로 파일 푸시 (필수, workflow 스코프 필요)

현재 gh 토큰에 `workflow` 스코프가 없어서 `.github/workflows/*` 푸시가 거부된다. 한 번만 갱신:

```bash
gh auth refresh -h github.com -s workflow -s repo   # 브라우저 인증 1회
git -c credential.helper='!gh auth git-credential' \
  push https://github.com/gai-cmd/daracheon.git chore/ci-blob-deploy
```

그다음 GitHub 에서 `chore/ci-blob-deploy` → `main` PR 생성·머지.

### 3. (선택) GitHub `@claude` 태그 활성화

1. https://github.com/apps/claude 에서 `gai-cmd/daracheon` 에 설치.
2. 구독 토큰 등록(정책상 metered API 회피):
   ```bash
   claude setup-token
   gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo gai-cmd/daracheon --app actions
   ```
   이후 이슈/PR 코멘트에 `@claude ...` 로 지시.

### 4. (선택) 슬랙 "Claude Tag" 활성화

슬랙 스레드에 떴던 안내("admin can enable Claude ... Tag here")의 링크는 Anthropic/슬랙
**관리자 콘솔** 설정이라 코드로는 못 켠다. 관리자 계정으로 그 링크에서 Tag 를 켜면 된다.
단, Tag 든 legacy 봇이든 배포는 위 2·3 단계의 GitHub Actions 가 완료하므로, 이 단계 없이도
"머지 → 자동 배포" 는 동작한다.

## 동작 확인

```bash
# 수동 배포 트리거 (Actions 탭에서도 Run workflow 가능)
gh workflow run deploy-blob.yml --repo gai-cmd/daracheon -f files=pages
gh run list --repo gai-cmd/daracheon --workflow deploy-blob.yml --limit 3
```
