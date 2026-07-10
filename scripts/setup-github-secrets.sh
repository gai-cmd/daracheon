#!/usr/bin/env bash
# GitHub Actions 배포에 필요한 secrets 를 .env.local 에서 읽어 gai-cmd/daracheon 에 등록한다.
# 값은 화면에 출력하지 않고 gh 로 직접 파이프한다.
#
# 사전조건: gh 가 gai-cmd 계정(리포 admin)으로 활성화돼 있어야 한다.
#   gh auth switch -u gai-cmd
#
# 실행: bash scripts/setup-github-secrets.sh
set -euo pipefail

REPO="gai-cmd/daracheon"
ENV_FILE=".env.local"
PROD_PREFIX="${BLOB_DATA_PREFIX:?BLOB_DATA_PREFIX 환경변수 필요 (비밀값 — 하드코딩 금지)}"

if [ ! -f "$ENV_FILE" ]; then echo "ERROR: $ENV_FILE 없음"; exit 1; fi

read_env() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']$//"; }

BLOB_TOKEN="$(read_env BLOB_READ_WRITE_TOKEN)"
if [ -z "$BLOB_TOKEN" ]; then echo "ERROR: BLOB_READ_WRITE_TOKEN 값이 비어 있음"; exit 1; fi

printf '%s' "$BLOB_TOKEN"  | gh secret set BLOB_READ_WRITE_TOKEN --repo "$REPO" --app actions
printf '%s' "$PROD_PREFIX" | gh secret set BLOB_DATA_PREFIX     --repo "$REPO" --app actions

echo "등록 완료. 현재 secrets:"
gh api "repos/$REPO/actions/secrets" --jq '.secrets[].name'

echo
echo "선택: @claude 태그를 CI 에서 쓰려면 구독 토큰도 등록 (metered API 회피)"
echo "  claude setup-token   # 출력된 토큰 복사"
echo "  gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo $REPO --app actions   # 붙여넣기"
