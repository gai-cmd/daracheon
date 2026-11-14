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

### M4 (cycle_type=tdd, 2026-11-15)

증거 파일(로컬, 커밋 대상 아님): `.moai/state/verify/console-m4/`

| 단계 | 명령 | 관찰 결과 |
|---|---|---|
| import-map RED | `npx vitest run src/lib/console/__tests__/import-map.test.ts` | `Error: Cannot find module '../import-map'`, `Test Files 1 failed (1)` (`import-map-red.txt`) |
| import-map GREEN | 같은 명령 | `Test Files 1 passed (1)`, `Tests 30 passed (30)` (`import-map-green.txt`) |
| 항목·bootstrap RED | `npx vitest run src/app/api/console/__tests__/{items,bootstrap}.test.ts` | `Cannot find module '/src/app/api/console/bootstrap/route'`·`'/items/route'`, `Test Files 2 failed (2)` (`items-bootstrap-red.txt`) |
| 항목·bootstrap GREEN | 같은 명령 | `Test Files 2 passed (2)`, `Tests 40 passed (40)` (`items-bootstrap-green.txt`) |
| 관리자·가져오기 RED | `npx vitest run src/app/api/console/__tests__/{admin,import-export}.test.ts` | `Cannot find module '/src/app/api/console/categories/route'`·`'/import/route'`, `Test Files 2 failed (2)` (`admin-import-red.txt`) |
| 관리자·가져오기 GREEN | 같은 명령 | `Test Files 2 passed (2)`, `Tests 26 passed (26)` (`admin-import-green.txt`) |
| 타입 | `npx tsc --noEmit` | exit 0, 출력 없음 |
| 린트 | `npx eslint src/lib/console src/app/api/console` | exit 0, 출력 없음 |
| 대상 테스트 | 콘솔 lib·API 전체 + 콜백·google-oauth-console·workshop-sso·auth·db-concurrency·record-versioning | `Test Files 24 passed (24)`, `Tests 574 passed (574)` (`final-targeted.txt`) |
| 커버리지 | `npx vitest run ... --coverage` | 측정 불가: `MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'` (node_modules 는 기본 체크아웃 공유 심링크라 설치하지 않음) |

M4 에서 라우트 수준으로 확인한 인수 기준: AC-CON-004(라우트 503), 005·006(401), 007(bootstrap·PATCH·내보내기·문서에 카나리 없음), 011, 012, 013(서버 부분), 014, 015, 017(API 부분), 018(가져오기·내보내기·사람 목록·분류·팀 고정 API), 026(분류 API·가져오기 거절, bootstrap 위키 선두). 화면 부분은 M5.

테스트용 가짜 db(`src/app/api/console/__tests__/support.ts`)는 실제 `writeDataMerged` 처럼 새 배열에 없는 레코드를 `removedIds` 에 없으면 되살린다 — 교체 쓰기에서 `removedIds` 누락이 테스트 실패로 드러난다.

실행 중 정한 해석:
- 공통 가드 `authorizeConsole`(http.ts): Origin·Content-Type → 콘솔 설정(503) → 세션(401) → 사람 목록 → 관리자(403). `DELETE` 는 본문이 없어 Origin 만 검사한다.
- 항목 id 는 API 경로에 들어가므로 가져오기에서 `^[A-Za-z0-9_.:-]{1,80}$` 만 받는다(프로토타입 시드 id 형식과 맞음을 확인).
- 가져오기 파일 2MB 초과는 413.
- 가져오기 `teamPins` 는 가져온 항목 id 만 남긴 뒤 8개를 넘으면 400(설정 API 와 같은 상한).
- items 형식에서 email 이 없거나 @try-n.com 이 아닌 담당자는 모두 `unmatchedOwners` 에 넣는다.
- 항목 생성·수정·삭제 뒤의 감사 기록 실패는 로그만 남기고 응답은 성공(이미 쓴 변경을 되돌리지 않음). 자격증명 열람만 기록 실패 시 값을 주지 않는다(M3).
- 자격증명 값을 넣은 생성·수정은 `CONSOLE_SECRETS_KEY` 무효면 503, 값이 없으면 키 없이도 동작(acceptance §10).
- `updatedBy`·`me.name` 은 사람 목록 이름, 없으면 구글 프로필 이름.

## §E.3 Run-phase Audit-Ready Signal

_<M4~M7 완료 뒤 기록>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
