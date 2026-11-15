# SPEC-CONSOLE-002 — progress

## §E.1 Plan-phase Audit-Ready Signal

- status: draft
- plan_complete_at: 2026-11-15
- tier: L (spec.md, plan.md, acceptance.md, design.md, research.md) — 0.3.0에서 M → L 승격 (plan-audit CS2-PA-D6, 리드 결정 (a), 2026-11-15)
- plan_audit_pass_threshold: 0.85 (Tier L)
- route: Route B (PR 경로). PR 생성·머지·배포는 사람 승인 후에만
- requirements: 21 (REQ-CS2-001 ~ REQ-CS2-021)
- acceptance_criteria: 22 (AC-CS2-001 ~ AC-CS2-022)
- milestones: M1 서버·데이터 (REQ-CS2-001~006, AC-CS2-001~006), M2 화면 (REQ-CS2-007~021, AC-CS2-007~022)
- depends_on: SPEC-CONSOLE-001 (운영 중)
- kickoff_assumptions: plan.md §5 1~4 (Implementation Kickoff에서 리드가 한 번에 제시)
- plan_audit:
  - iteration 1: FAIL 0.86 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`, 결함 CS2-PA-D1~D8)
  - revision 0.2.0 (2026-11-15): D1·D2·D3·D4·D5·D7·D8 반영. D6(Tier M 상한 초과: 요구사항 21·인수 기준 22·소스 파일 22)은 리드 결정 대기 — Tier L 승격(design.md·research.md 추가, PASS 기준 0.85) 또는 S6 분리
  - iteration 2: FAIL 0.91 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`). 남은 막는 결함 D6(Tier 분류 모순) 1건, 경미 R2-D1·R2-D2
  - revision 0.3.0 (2026-11-15): D6 → (a) Tier L 승격. 범위 S1~S6 유지(오너가 S6을 이번 작업에 요청). spec.md `tier: L`, design.md 추가(0.2.0 plan.md §1~§2 이전 + §2.7 입력 칸 속성 + §3 요구사항·설계 대응표), research.md 추가(코드 조사, CSS 모듈 순수성 검사 재실행 결과, TeamPassword 도움말 조사), plan.md L3·§1~2 안내로 교체. R2-D1: "SPEC-CONSOLE-001 design.md §6.2"로 명시. R2-D2: AC-CS2-014 Safari 판정을 "새 탭이 열리거나, 막히면 토스트 안 로그인 링크(어느 쪽인지 §E.2에 기록)"로 변경
  - iteration 3: FAIL 0.93 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`). D6·R2-D1·R2-D2 해결 확인. 신규 막는 결함 CS2-PA-R3-D1(major, 비밀번호 칸 `new-password` → `off` 변경 시 같은 출처 저장 비밀번호 자동 채우기 위험), 경미 CS2-PA-R3-D2(AC-CS2-014 Chrome 기본 설정 표현)
  - revision 0.4.0 (2026-11-15): R3-D1 → REQ-CS2-020을 칸별로 나눔(아이디 `autocomplete="off"`, 비밀번호 `autocomplete="new-password"` 유지, 두 칸 모두 `data-1p-ignore`·`data-lpignore="true"`). AC-CS2-020은 칸별 판정 + 같은 출처 저장 비밀번호가 있는 Chrome 프로필에서 두 칸이 비고 저장해도 공유 비밀번호가 바뀌지 않는지 브라우저 확인. design.md §2.7, spec.md §1.1, research.md §2.6·§4 함께 고침. R3-D2 → AC-CS2-014 "Chrome 기본 설정(팝업 차단 켜짐, 이 사이트 예외 없음)"
  - verdict: 리드가 3차를 이 수정 조건으로 수용(2026-11-15). 점수 0.93 ≥ Tier L 기준 0.85, R3-D1·R3-D2 수정 반영 완료, 추가 감사 회차 없음 (3회 상한 도달)
- plan_audit_accepted: true (리드 수용, 2026-11-15, score 0.93, revision 0.4.0)

## §E.2 Run-phase Evidence

### M1 — 서버와 데이터 (2026-11-15, manager-develop, cycle_type=tdd)

**바뀐 것**

| 파일 | 내용 |
|---|---|
| `src/lib/console/types.ts` | `ConsoleItem.hide_password?`, `ConsoleListItem.hide_password: boolean`(항상 boolean), `ConsoleUserPrefs`, `CONSOLE_DOCS.userPrefs = 'console-user-prefs'`, `AUTOFILL_GUIDE_VERSION = 1` |
| `src/lib/console/validate.ts` | `hide_password`: 없으면 false, boolean 아니면 `{ field: 'hide_password', reason: 'type' }`, 공유 계정이 아니면 false로 정규화(CS2-D4) |
| `src/lib/console/permissions.ts` | `hidesPassword(item)` 단일 판정(@MX:ANCHOR), `toListItem`이 `hide_password` boolean을 담음 |
| `src/lib/console/import-map.ts` | `ITEM_FIELDS`에 `hide_password` — 값 검사는 `validateItemFields`가 하므로 문자열이면 가져오기 전체 400 |
| `src/app/api/console/export/route.ts` | `hide_password` 표식만 내보냄(값 없음) |
| `src/lib/db.ts` | `FILE_KEY`에 `console-user-prefs` → email |
| `src/lib/backup.ts` | `DB_FILES`에 `console-user-prefs` — 기존 `ops-registration.test.ts`가 "모든 콘솔 문서 백업"을 강제하므로 필요(계획 파일 목록에 없던 추가 1건) |
| `src/app/api/console/items/[id]/credential/route.ts` | design.md §2.2 7단계: `password`+`view`+숨김+편집 권한 없음 → 403 `reveal_hidden`, `credential.deny`(`meta: { field, reason: 'reveal_hidden' }`). 공개 범위 판정 뒤, 열람 상한 앞. view·copy·Origin·상한·감사 먼저 규칙은 그대로 |
| `src/app/api/console/items/[id]/activity/route.ts` (신규) | GET, 401/404(없음·삭제)/403(편집 권한 없음). 이 항목의 `credential.*` 최신 20건, `{ at, actor, action, field?, reason? }`, actor는 사람 목록 이름 또는 email, no-store |
| `src/app/api/console/me/autofill-guide/route.ts` (신규) | POST `{ version: 1 }`, Origin·Content-Type 검사, 401, 버전 불일치 400. 새로 읽기 → 내 레코드만 교체 → 병합 쓰기. 레코드 키는 `email`, `autofillGuide{version, at}`뿐 |
| `src/app/api/console/bootstrap/route.ts` | 최상위 `prefs: { autofillGuideAck }`(`me`는 그대로, CS2-D10). prefs 읽기 실패 시 `true` |
| `src/app/api/console/__tests__/support.ts` | 가짜 db에 `console-user-prefs` 키(email)와 `failReads` 추가 |
| 테스트 (신규) | `src/lib/console/__tests__/hide-password.test.ts`, `src/app/api/console/__tests__/shared-account.test.ts`(AC-CS2-001~004), `activity.test.ts`(AC-CS2-005), `autofill-guide.test.ts`(AC-CS2-006), `db-keys.test.ts`에 `console-user-prefs` 병합 1건 추가 |
| 테스트 (기존 수정 1줄) | `src/lib/console/__tests__/ui-model.test.ts` 고정 데이터에 `hide_password: false` 한 줄. design.md §2.1이 목록 항목의 `hide_password`를 필수 boolean으로 정해 타입 검사가 요구함. 판정문은 바꾸지 않음 |

공유 계정 보기 데이터(REQ-CS2-017): 목록 항목은 이미 `hasLoginId`·`hasPassword`를 담고 있어 서버 변경이 필요 없었다. `hide-password.test.ts`가 이 칸과 `hide_password`를 함께 고정한다. 화면 표시는 M2.

**인수 기준 (M1)**

| AC | 판정 | 근거 |
|---|---|---|
| AC-CS2-001 | PASS | `shared-account.test.ts` (a)~(d) + PATCH public 전환 → false |
| AC-CS2-002 | PASS | 같은 파일 export/import 2건 (문자열 표식 400 + 전체 문서 스냅샷 동일, 없음→false·true→true) |
| AC-CS2-003 | PASS | view·copy 각 200 no-store + 감사 동작 분리, 30건 뒤 copy 429 + `credential.rate_limited`, 감사 쓰기 실패 copy 503, evil Origin 403. 기존 `credential.test.ts` 수정 없이 통과 |
| AC-CS2-004 | PASS | 표 5행 + 숨김 해제 시 200 + `본인` 항목은 `forbidden` + `reveal_hidden` 거절이 상한에 안 들어감(29건 + 거절 3회 → copy 200 → 다음 copy 429) |
| AC-CS2-005 | PASS | `activity.test.ts` 4건 |
| AC-CS2-006 | PASS | `autofill-guide.test.ts` 4건. 기존 `bootstrap.test.ts` 수정 없이 통과 |

**RED** (구현 전, `npx vitest run <신규 5개 파일>`):

```
 FAIL  src/app/api/console/__tests__/activity.test.ts [ src/app/api/console/__tests__/activity.test.ts ]
Error: Cannot find module '/src/app/api/console/items/[id]/activity/route' imported from .../activity.test.ts
 FAIL  src/app/api/console/__tests__/autofill-guide.test.ts [ src/app/api/console/__tests__/autofill-guide.test.ts ]
 Test Files  5 failed (5)
      Tests  14 failed | 10 passed (24)
```

통과한 10건은 이미 있던 동작을 고정하는 보존 테스트(AC-CS2-003 view·copy, 기존 공개 범위 판정 등)다.

**GREEN / 검증** (같은 트리, 이 회차 실행):

```
$ npx vitest run <신규 5개 파일>
 Test Files  5 passed (5)
      Tests  32 passed (32)

$ npx vitest run src/lib/console src/app/api/console src/app/console src/lib/__tests__/backup-crypto.test.ts src/lib/__tests__/backup-snapshot-id.test.ts src/app/api/admin/users/__tests__/users.test.ts
 Test Files  28 passed (28)
      Tests  447 passed (447)

$ npx vitest run <SPEC-CONSOLE-001 라우트 테스트 4개: credential, bootstrap, import-export, items>
 Test Files  4 passed (4)
      Tests  93 passed (93)
(git diff HEAD 기준 네 파일 모두 수정 없음)

$ npx tsc --noEmit
tsc=0

$ npx eslint <바뀐 파일 18개>
✖ 2 problems (0 errors, 2 warnings)
```

eslint 경고 2건은 `src/lib/backup.ts` 3행의 기존 미사용 import(`listGitHubBackups`, `GitHubBackupEntry`)로 HEAD에도 있다. 이번 변경 줄에서 나온 경고는 없다. 로그 원본: `.moai/state/verify/cs2-m1/`(커밋 안 함).

**미룬 것 / 남은 일**

- 화면(M2) 전부: 양식 종류 선택, 상세 자격증명 카드, 사용 기록 화면, 안내 팝업, 스크롤바. M1 단독 배포 시 기존 양식은 `hide_password`를 보내지 않으므로 편집 저장 때 `false`가 된다(PATCH는 양식 전체 교체 방식). 숨김은 M2 양식·가져오기로만 켤 수 있어 M1 단독으로는 영향이 없지만, M1만 먼저 배포하지는 않는 것을 권한다.
- `hide_password: null`은 boolean이 아니므로 400으로 거절한다(REQ-CS2-001 문구대로). 가져오기 파일도 같다.
- 안내 확인 POST의 400 본문은 `{ error: 'invalid', errors: [{ field: 'version', reason: 'unknown_value' }] }` 모양이다(기존 항목 라우트와 같은 형식).
- 전체 스위트는 CI에 맡겼다(부하 3~4, 계획 §6대로 콘솔 관련 테스트만 로컬 실행).


## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
