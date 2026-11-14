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

### M5 (cycle_type=tdd, 2026-11-15)

증거 파일(로컬, 커밋 대상 아님): `.moai/state/verify/console-m5/` (스크린샷은 `screens/`, 화면 확인 기록은 `screens/render-check.txt`)

| 단계 | 명령 | 관찰 결과 |
|---|---|---|
| RED | `npx vitest run src/lib/console/__tests__/{i18n,brand-marks,ui-model}.test.ts src/app/console/__tests__` | `Test Files 5 failed (5)`, `Tests 4 failed \| 4 passed (8)` — `Cannot find module '../i18n'`·`'../brand-marks'`·`'../ui-model'`, `Cannot find package '@/lib/console/ui-model'`, 스타일 검사 4건 실패(화면 파일·`data-admin-root`·팔레트·ChromeGate 없음) (`m5-red.txt`) |
| GREEN (M5 테스트만) | 위 + `src/lib/__tests__/console-screen-style.test.ts` | `Test Files 5 passed (5)`, `Tests 80 passed (80)` |
| 타입 | `npx tsc --noEmit` | exit 0, 출력 없음 (`tsc.txt`) |
| 린트 | `npx eslint src/app/console src/lib/console src/components/layout/ChromeGate.tsx` | exit 0, 출력 없음 (`eslint.txt`) |
| 대상 테스트 | `npx vitest run src/lib/console/__tests__ src/app/console/__tests__ src/app/api/console src/lib/__tests__/console-screen-style.test.ts` | `Test Files 21 passed (21)`, `Tests 399 passed (399)` (`m5-green.txt`) |
| AC-CON-022 grep | `git grep -nE "var\(--lx-\|:root" src/app/console`, 전역 클래스·`<footer`·`createPortal` grep | 둘 다 0줄 (exit 1) |
| AC-CON-023 grep | `git grep -nE "https?://…\.(png\|…)\|favicon\|s2/favicons\|cdn\." src/app/console src/lib/console` | 0줄 (exit 1) |
| AC-CON-025·026 grep | 시드 주소 패턴·비밀값 폴백·`zoel-workshop.vercel.app/apps/wiki` | 모두 0줄 (exit 1) |

로컬 화면 확인(지어낸 데이터 `data/db/console-*.json` — gitignore, 확인 뒤 삭제 / 일회용 비밀값 / `BLOB_READ_WRITE_TOKEN` 없이 로컬 파일 저장소 / `next dev -p 3456` + 헤드리스 Chromium), `render-check.txt` 원문 요지:
- 계산된 스타일: 루트 `rgb(250, 248, 243)`(#faf8f3), 사이드바 `rgb(242, 239, 232)`(#f2efe8), 주 버튼 `rgb(31, 111, 92)`(#1f6f5c), 입력칸 배경 `rgb(255, 255, 255)`·글자 `rgb(28, 27, 24)`, label `rgb(92, 90, 82)`, 사이트 헤더·푸터 보이는 개수 0 (로그인·홈·편집 양식·사람 목록 대화상자에서 각각 측정)
- 메뉴 순서: `#/` `#/all` sep `#/cat/wiki` sep heading 일반 분류 8개 sep `#/shared` `#/mine`; 위키 개수 0, 위키 클릭 시 `wiki.empty` 문구, 홈 분류별 요약은 일반 분류 8개만
- English 전환 뒤 새로고침해도 위키 링크 글자 `Wiki`; 목록 첫 거르기 칩 `분류`; 행 12개·연필 12개
- 자격증명: 눈 아이콘 1회 → 요청 본문 `{"field":"password","purpose":"view"}` 1건 뒤 값 표시, 다시 누르면 가림, 패널을 닫았다 다시 열면 값 없음(추가 요청 없음)
- 삭제 인라인 확인 → 되돌리기 토스트(콘솔 루트 안) → 되돌리기로 행 복귀; 대화상자는 루트 자손
- 외부 요청: 루트 레이아웃의 Vercel Analytics·Speed Insights 디버그 스크립트 2건뿐(레이아웃 소관, 로컬 CSP 가 차단). 콘솔 화면 자체의 외부 요청 없음
- 로그인 화면: `<meta name="robots" content="noindex, nofollow">`, 버튼 주소 `/api/admin/auth/google/start?next=%2Fconsole`

실행 중 정한 해석:
- 공유 계정의 아이디도 암호문으로만 저장되므로(M3) 상세 패널에서 아이디 줄도 가림 표시 + 눈 아이콘·복사 요청으로 보인다(프로토타입은 아이디를 평문으로 보였음).
- 팀 필수는 하드코딩하지 않고 `console-settings.teamPins` 를 쓴다. 관리자는 계정 메뉴의 "내 고정을 팀 필수로 지정"으로 바꾼다. 팀 필수가 비어 있으면 안내 문구만 보인다.
- 담당자 입력칸은 이름 또는 회사 이메일을 쉼표로 받아 사람 목록과 맞춰 `{name, email}` 로 보낸다. 관리자가 아닌 사람이 편집에서 자기 자신을 빼면 화면에서 먼저 막는다(서버도 400).
- 버전 충돌(409)은 입력값을 지우지 않고 양식 위에 안내를 띄우며, "최신 내용 불러오기"로 최신판 양식을 다시 연다(AC-CON-014 화면 부분).
- 검색 결과 묶음의 "가이드"(프로토타입은 시드 분류 id 에 의존)를 "위키" 묶음으로 바꿨다.
- 정적 스타일 검사 테스트는 `src/lib/__tests__/console-screen-style.test.ts` 에 둔다. `src/app/console` 안에 두면 AC-CON-022·023 grep 이 테스트에 적힌 패턴 자체를 잡는다.
- 사이트 리셋(`* { margin: 0 }`)이 네이티브 `<dialog>` 의 가운데 정렬을 없애므로 `.dlg { margin: auto }` 를 둔다. 요소 리셋(`button`·`a` 등)은 `:where(.root)` 로 감싸 컴포넌트 클래스보다 낮은 우선순위를 유지한다.

### M6 (cycle_type=tdd, 2026-11-15)

증거 파일(로컬, 커밋 대상 아님): `.moai/state/verify/console-m6/`

| 단계 | 명령 | 관찰 결과 |
|---|---|---|
| RED | `npx vitest run src/app/__tests__/console-seo.test.ts src/lib/console/__tests__/ops-registration.test.ts` | `Failed Tests 15` — robots `expected [ '/api/', '/admin/', …(3) ] to include '/console'`, vercel.json `expected undefined to be 'noindex, nofollow'`, env-check `expected undefined to be defined`, backup `DB_FILES is not iterable` (`red.log`) |
| GREEN | 위 + `src/lib/__tests__/{env-check,backup-crypto,backup-snapshot-id}.test.ts` | `Test Files 5 passed (5)`, `Tests 41 passed (41)` (`green.log`) |
| 기존 robots 소비자 | `npx vitest run src/app/llms.txt/llms-facts.test.ts` | `Tests 7 passed (7)` |
| 타입 | `npx tsc --noEmit` | exit 0, 출력 없음 (`tsc.log`) |
| 린트 | `npx eslint src/app/robots.ts src/lib/backup.ts src/lib/env-check.ts <새 테스트 2개>` | exit 0, `0 errors, 2 warnings` — 두 경고(`listGitHubBackups`·`GitHubBackupEntry` 미사용 import, backup.ts 3행)는 HEAD 판에도 같은 2건이 있음(`git show HEAD:src/lib/backup.ts \| npx eslint --stdin` 으로 확인) |

M6 에서 확인한 인수 기준: AC-CON-021 중 robots(`*` 그룹과 allow 가 있는 모든 AI 크롤러 그룹 disallow 에 `/console`), sitemap(콘솔 URL 0개), `vercel.json` 헤더(`/console`·`/console/:path*`·`/api/console/:path*` 에 `X-Robots-Tag: noindex, nofollow`), 레이아웃 metadata `robots: { index: false, follow: false }`. 실제 응답 헤더·HTML meta 는 M5 로컬 화면 확인(로그인 화면 meta)과 미들웨어 헤더(M2)로 일부 확인했고, 세 응답의 헤더 확인은 M7 에서.

실행 중 정한 해석:
- env-check 에는 design §8 대로 세 변수(`CONSOLE_SESSION_SECRET`·`CONSOLE_SECRETS_KEY`·`CONSOLE_ADMIN_EMAILS`)만 `feature` 로 등록했다. 선택 변수 `CONSOLE_SESSION_MAX_AGE_HOURS` 는 등록하지 않았다(없어도 기본 12시간).
- `console-audit-log` 복원은 기존 `audit-log` 와 같이 `restoreAuditLog` 를 줄 때만 한다. 기본 복원이 자격증명 열람 기록을 스냅샷 시점으로 되돌려 지우지 않게 하려는 것이다.
- `DB_FILES`·`SINGLETON_FILES` 는 테스트에서 콘솔 문서 등록을 확인하려고 export 했다(동작 변화 없음).
- `src/app/api/admin/backup/route.ts` 의 별도 `DB_FILES`(관리자 화면의 JSON 내려받기·올리기 복원)는 plan 범위 밖이라 그대로 두었다 — 그 경로의 백업 파일에는 콘솔 문서가 들어가지 않는다.

## §E.3 Run-phase Audit-Ready Signal

_<M4~M7 완료 뒤 기록>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
