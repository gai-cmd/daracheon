# SPEC-CONSOLE-001 — progress

## §E.1 Plan-phase Audit-Ready Signal

- plan_status: audit-ready
- plan_complete_at: 2026-11-15
- tier: L (spec.md, plan.md, acceptance.md, design.md, research.md)
- requirements: 26 (REQ-CON-001 ~ REQ-CON-026)
- acceptance_criteria: 26 (AC-CON-001 ~ AC-CON-026)
- revision: 0.4.0 (plan-audit iteration 3 FAIL 0.87 → blocking CON-D24·D25 반영, optional CON-D20·D22·D23·D26·D27·D28 반영, REQ-CON-025를 REQ-CON-025·026으로 분리). 이전: 0.3.0 (plan-audit iteration 2 FAIL 0.88 → blocking CON-D16~D18 반영, optional CON-D8·D19·D21 반영, 오너 요청 위키 구역 REQ-CON-025·AC-CON-026 추가). 이전: 0.2.0 (iteration 1 FAIL 0.78 → CON-D1~D15)
- open_owner_decisions: plan.md §6 D1 ~ D14 (실행 단계 진입 전 답 필요. D2·D13은 (B) 선택 시 SPEC 개정·재감사 선행)
- owner_decisions: _<Implementation Kickoff에서 오케스트레이터가 D1~D14 답을 기록>_

## §E.2 Run-phase Evidence

### M1–M3 (cycle_type=tdd, 2026-11-15)

증거 파일(로컬, `.moai/state/` 는 커밋 대상 아님): `.moai/state/verify/console-m1m3/`

| 단계 | 명령 | 관찰 결과 |
|---|---|---|
| M1 RED | `npx vitest run src/lib/console/__tests__` | `Test Files 4 failed (4)` — `Cannot find module '../categories' / '../config' / '../permissions' / '../validate'` (`m1-red.txt`) |
| M1 GREEN | 같은 명령 | `Test Files 4 passed (4)`, `Tests 138 passed (138)` (`m1-green.txt`) |
| M2 특성 고정(수정 전) | `npx vitest run src/app/api/admin/auth/google/callback/__tests__` | `Test Files 2 passed (2)`, `Tests 70 passed (70)` — 관리자 모드 오류 출구 8종·start·sanitizeNextPath 를 기존 코드에 고정 (`m2-characterization-before.txt`) |
| M2 RED | 콘솔 모드 테스트 5개 파일 | `Test Files 5 failed (5)`, `Failed Tests 29` — `isConsoleNext is not a function`, `Cannot find module '../session'`, logout `../route` 없음 (`m2-red.txt`) |
| M2 GREEN | 위 + 특성·기존 콜백 테스트 | `Test Files 12 passed (12)`, `Tests 314 passed (314)` (`m2-green.txt`) |
| M3 RED (audit) | `npx vitest run src/lib/console/__tests__/audit.test.ts` | `Cannot find module '/src/lib/console/audit'` (`m3-audit-red.txt`) — 구현을 테스트 실행 전에 써서 파일을 치운 뒤 RED 를 받고 같은 내용으로 다시 둠 |
| M3 RED | vault·credential·db-keys | `Test Files 3 failed (3)`; db-keys `expected [ 'A' ] to deeply equal [ 'A', 'B' ]` (FILE_KEY 미등록 증명) (`m3-red.txt`) |
| M3 GREEN | `npx vitest run src/lib/console/__tests__ src/app/api/console` | `Test Files 11 passed (11)`, `Tests 223 passed (223)` (`m3-green.txt`) |
| 최종 타입 | `npx tsc --noEmit` | exit 0, 출력 없음 |
| 최종 린트 | `npx eslint <바뀐 경로>` | exit 0, 출력 없음 |
| 최종 테스트 | 콘솔·콜백·start·logout·credential + 기존 workshop-sso·auth·db-concurrency·record-versioning | `Test Files 19 passed (19)`, `Tests 478 passed (478)` (`final-targeted.txt`) |
| AC-CON-004 grep | `git grep --untracked -nE "CONSOLE_(SESSION_SECRET\|SECRETS_KEY\|ADMIN_EMAILS) *(\?\?\|\|\|) *['\"]" src` | 0줄 (exit 1) |

M1–M3 에서 단위·라우트 수준으로 확인한 인수 기준: AC-CON-001, 002, 003(단위·콜백·start), 004(설정·start·콜백·미들웨어 — `/api/console/bootstrap` 은 미들웨어 503 까지), 005, 006(미들웨어 302·401 부분), 008, 009(서버 부분), 010, 011·015(판정·검증 함수 부분), 016(로그인 기록·50회 state 실패·5,000건 정리·기록 실패 503), 024, 026(분류 단위 부분). 화면·M4 API 가 필요한 나머지는 M4~M7 에서.

실행 중 정한 해석(설계 문서와 함께 볼 것):
- CON-D31: 일반 분류 아이콘은 프로토타입 8종만 허용(없으면 `folder`, 그 밖은 오류) — `categories.ts`.
- CON-D32: 가져오기 파일의 `id: "wiki"` 분류는 다른 칸을 검사하지 않고 무시.
- 기존 `audit-log` 의 콘솔 로그인 1줄은 `module: 'console'`(design §5.2 에 맞춤; §2.3 의 "module auth" 표기와 다름).
- 공유 계정이 아니거나 값이 저장되지 않은 항목의 열람은 감사 기록 전에 404 `not_set`(값이 나가지 않으므로 기록하지 않음).
- `data/db` 는 실제로 gitignore 대상이 아니었다(design §3 서술과 다름) — `.gitignore` 에 `data/db/console-*.json` 추가.

## §E.3 Run-phase Audit-Ready Signal

_<M4~M7 완료 뒤 기록>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
