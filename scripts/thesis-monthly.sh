#!/bin/zsh
# 침향 논문 아카이브 정기 갱신 — launchd(com.zoellife.thesis-monthly / -weekly)가 호출.
#   monthly : 신규 수집 → 빌드 → 보고서. 커밋·푸시는 하지 않는다(사람이 검토 후 커밋·푸시 승인).
#   weekly  : 철회 여부만 재확인. 새로 철회된 논문이 있으면 보고서에 경고.
# 로그: .moai/logs/thesis-cron.log · 보고서: .moai/reports/thesis-cron-YYYYMMDD.md
set -u
MODE="${1:-monthly}"
ROOT="/Users/gai/personal/works/daerachoen"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$ROOT" || exit 1
mkdir -p .moai/logs .moai/reports
LOG=".moai/logs/thesis-cron.log"
REP=".moai/reports/thesis-cron-$(date +%Y%m%d).md"
{
  echo "## thesis-cron $MODE $(date '+%Y-%m-%d %H:%M')"
  if [[ "$MODE" == "monthly" ]]; then
    node scripts/thesis-collect.mjs 2>&1
    echo "--- 한글 번역 대기(pending-ko.json): $(node -e 'console.log(require("./scripts/thesis-data/pending-ko.json").length)') 건 — 채운 뒤 node scripts/thesis-apply-ko.mjs && node scripts/thesis-build.mjs"
    node scripts/thesis-build.mjs 2>&1 | tail -8
    echo "--- git: $(git status --short scripts/thesis-data public/thesis | wc -l | tr -d ' ') 파일 변경 (커밋·푸시는 사람 승인)"
  else
    node scripts/thesis-retraction-check.mjs 2>&1; rc=$?
    if [[ $rc -eq 2 ]]; then echo "⚠ 새로 철회된 논문 발견 — 효능 요약 공개 보류 필요. node scripts/thesis-build.mjs 로 배지 반영."; fi
  fi
} | tee -a "$LOG" >> "$REP"
