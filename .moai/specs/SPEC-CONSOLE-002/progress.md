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

### M2 — 화면 (2026-11-15, manager-develop, cycle_type=tdd)

**바뀐 것**

| 파일 | 내용 |
|---|---|
| `src/lib/console/password-gen.ts` (신규) | `generatePassword(20)`: 네 종류 각 1자 + 나머지, Fisher–Yates 섞기. 난수는 `crypto.getRandomValues` 한 바이트씩, `randomIndex`가 `256 - 256 % n` 이상을 버림(거부 표본추출) |
| `src/lib/console/browser-guide.ts` (신규) | `detectBrowser(ua)`(design.md §2.6 순서), `guideFor(info)`(설정 주소는 데스크톱 Chrome·Edge·Whale·Firefox만, 단계 문구 키), `shouldAutoOpenGuide`, `GUIDE_LATER_KEY`(sessionStorage) |
| `src/lib/console/ui-model.ts` | `ItemKind`, `kindOf`, `linkMemoryFor`, `applyKind`(CS2-D12 왕복 복원), `needsCredDeleteConfirm`(CS2-D11), `hasCredential`, `LINK_ACCESS_METHODS` |
| `src/lib/console/i18n.ts` | 새 문구 한·영(`kind`, `share`, `hidePw*`, `fLoginUrl`, `fMemo*`, `genPw`, `newCategory`, `addCategory`, `credSet/Unset`, `credDel`, `card.*`, `act.*`, `guide.*`). 자격증명 행을 `card.*`로 옮기면서 쓰이지 않게 된 9개 키(`pUser`·`pPw`·`pUrl`·`copyPw`·`copyId`·`showId`·`hideId`·`idCopied`·`pwCopied`)는 지움 |
| `src/app/console/ItemForm.tsx` | 맨 위 종류 radiogroup(화살표·Home·End, 선택된 쪽만 tabindex 0) → 분류 select(관리자는 마지막에 `+ 새 분류 만들기…`) → 제목. 공유 계정: 로그인 주소·아이디·비밀번호(눈·생성)·메모(안내 문구)·공유 대상 라디오 3개·숨기기 체크가 첫 화면, 연동 주소는 더 보기로. 링크: SPEC-CONSOLE-001 첫 화면 그대로, 더 보기 접속 방식에서 `shared-credential` 뺌. 저장 본문에 `hide_password`(링크면 false). 저장된 계정 정보가 있는 항목을 링크로 저장하면 요청 전에 확인 대화상자. 아이디 칸 `autocomplete="off"`, 비밀번호 칸 `new-password`, 두 칸 모두 `data-1p-ignore`·`data-lpignore="true"` |
| `src/app/console/DetailPanel.tsx` | 자격증명 카드(`data-cred-card`): 로그인 주소 → 아이디 → 비밀번호 → 마지막 수정. 복사는 `purpose: 'copy'` → 클립보드로 바로, 상태에 안 둠. 숨기기 대상(편집 권한 없음)에게 비밀번호 보기 없음. 로그인 열기(아이디 복사 → `window.open('', '_blank')` → `opener = null` → `location.replace`, 막히면 토스트 안 링크). 빈 상태 + 편집 권한자 "계정 정보 입력"(`requestEdit(id,'id')`). 편집 권한자만 `<details>` 사용 기록(펼칠 때 `/activity` 1회). 카드에 "자동 입력 끄기 안내" |
| `src/app/console/clipboard.ts` (신규) | `writeClipboard`: ConsoleApp `copyText`의 복사 부분을 분리(동작 같음). 클립보드 API 먼저, 대체 경로 임시 textarea는 `aria-hidden`·`opacity:0`·`tabIndex -1`, 같은 작업에서 `remove()` |
| `src/app/console/AutofillGuideDialog.tsx` (신규) | 기존 `Dialog` 사용. "이 사이트는 브라우저 설정을 직접 바꿀 수 없어요…" 첫 줄, 이유, 브라우저별 번호 단계, 설정 주소가 있으면 주소 표시 + "설정 화면 열기"(복사 + 토스트), 확인했어요 / 나중에. 닫기(X·Esc)는 나중에와 같음 |
| `src/app/console/ConsoleApp.tsx` | 첫 데이터 뒤 다음 프레임에 한 번 자동 표시(`prefs.autofillGuideAck`가 false이고 sessionStorage 표시 없음, 다른 대화상자가 없을 때만). 나중에 → sessionStorage, 확인했어요 → `POST /api/console/me/autofill-guide {version:1}` 후 `prefs` 갱신. `addCategory()`(양식용: 추가 id 또는 null, 화면 이동 없음), 사이드바 "+"(관리자), `writeClipboard`·`openAutofillGuide`를 AppContext로 |
| `src/app/console/AccountMenu.tsx` | 팝오버 본문을 `AccountMenuBody`로 분리(정적 렌더 테스트용), 모든 사람에게 "자동 입력 끄기 안내" 항목 |
| `src/app/console/Sidebar.tsx` | `onAddCategory`가 있을 때(관리자) 분류 제목 옆 `aria-label="분류 추가"` "+" |
| `src/app/console/ListView.tsx` | 공유 계정 보기에서만 행에 "계정 정보 있음 / 없음" |
| `src/app/console/Toasts.tsx`, `app-context.ts`, `api.ts` | 토스트 `href`(새 탭 링크), `fetchActivity`, `ackAutofillGuide`, `BootstrapData.prefs?` |
| `src/app/console/console.module.css` | 스크롤바(design.md §2.5): `:global(html):has(.root)` thin + `#d6d0c4 #f2efe8`, `::-webkit-scrollbar*` 8px·둥근 막대·hover `#bdb5a6`, `.root, .root *` thin + 같은 색, `.root *::-webkit-scrollbar*`(트랙 transparent). 새 컨트롤 스타일은 고정 hex. `globals.css`·`dark-theme.css`는 수정 없음 |
| 테스트 (신규) | `src/lib/console/__tests__/{password-gen,browser-guide,item-kind}.test.ts`, `src/lib/__tests__/console-scrollbar-style.test.ts`(범위·색·순수성 검사·globals 그대로), `src/app/console/__tests__/{item-form,detail-panel,shared-ui}.test.ts`(정적 렌더), `{item-form-dom,detail-panel-dom,console-guide-dom,clipboard}.test.ts`(jsdom 클릭 동작), 도우미 `render-helpers.ts`. `i18n.test.ts`에 새 키·한국어 문구 확인 2건 추가 |

**인수 기준 (M2)** — "테스트"는 이번 회차에 돌린 vitest, "브라우저"는 로컬 개발 서버(`localhost:3457`) + 헤드리스 Chrome 157(CDP)로 본 것.

| AC | 판정 | 근거 / 남은 것 |
|---|---|---|
| AC-CS2-007 | PASS(테스트·Chrome) / 미확인(Firefox·Safari·로그인 후 `/console`) | 테스트: `console-scrollbar-style.test.ts` 8건(고정 hex만, `var(--` 없음, 순수성 검사 통과). 개발 서버 `/console/login` 200, 컴파일된 CSS에 `html:has(.console_root__j9GAA)…` 확인. Chrome `/console/login`: html `rgb(214, 208, 196) rgb(242, 239, 232)`/`thin`, 콘솔 루트·안쪽 div 같음. Firefox 미설치, Safari 픽셀 측정·세션 필요한 `/console` 안쪽 영역은 리드 확인 필요. `next build`는 돌리지 않음 |
| AC-CS2-008 | PASS(Chrome `/`·`/admin/login`, diff) / 미확인(Firefox, `/console`→`/` 이동) | Chrome `/`, `/admin/login`: `rgb(212, 168, 67) rgb(20, 22, 29)`. `git diff HEAD -- src/styles/globals.css src/styles/zoel/dark-theme.css` 출력 없음 |
| AC-CS2-009 | PASS(테스트) / 미확인(네트워크 탭) | `item-form.test.ts`(radiogroup→분류 select 순서, aria-checked), `item-kind.test.ts`(4개 왕복 사례), `item-form-dom.test.ts`(공유 계정 저장 본문 `account`/`shared-credential`, 삭제 확인: 취소 시 요청 0건·입력값 유지, 삭제하고 저장 시 PATCH 1건, 저장된 정보 없으면 묻지 않음) |
| AC-CS2-010 | PASS(테스트) | `item-form.test.ts` 4건(더 보기 밖 배치, 메모 안내 ko/en, 링크 양식 칸 구성 `f-cat,f-title,f-url,f-desc`+연동 주소, 접속 방식에 `shared-credential` 없음) |
| AC-CS2-011 | PASS(테스트) | `password-gen.test.ts` 4건(10,000회, 스파이, 거부 표본추출) + `item-form-dom` 생성 버튼 20자·눈 켜짐 |
| AC-CS2-012 | PASS(테스트) / 미확인(브라우저) | 정적 렌더(관리자 마지막 선택지, 멤버 없음, 사이드바 `분류 추가`), `item-form-dom`(추가 → 새 분류·제목 유지, 취소 → 이전 분류) |
| AC-CS2-013 | PASS(테스트) / 미확인(실브라우저 클립보드) | `detail-panel.test.ts`(행·버튼, 숨김 시 멤버 보기 없음·담당자 있음, 아이디 보기 둘 다), `detail-panel-dom`(copy 요청 본문, `writeClipboard(카나리)`, body·input에 카나리 없음) |
| AC-CS2-014 | 부분(jsdom) / 미확인(Chrome·Safari 실제 새 탭, `opener`·`referrer`, 감사 1건) | `detail-panel-dom` 3건: `login_id` copy → 클립보드 → `open('', '_blank')` → `opener = null` → `replace(url)` → 토스트 문구, 막히면 토스트 `href`, 아이디 없으면 요청 없이 이동. 실제 팝업 차단·`document.referrer` 확인은 세션이 필요해 못 함 |
| AC-CS2-015 | PASS(테스트) | 정적 렌더(빈 상태 문구, 행 없음, 담당자만 버튼) + `detail-panel-dom`(`requestEdit('it-1','id')`) |
| AC-CS2-016 | PASS(테스트) / 미확인(브라우저) | 정적 렌더(담당자·관리자만, 렌더 시 fetch 0) + `detail-panel-dom`(펼치면 `/activity` 1회, 다시 펼쳐도 1회, 누가·복사 표시) |
| AC-CS2-017 | PASS(테스트) | `shared-ui.test.ts`(ko/en, 다른 보기엔 없음) |
| AC-CS2-018 | PASS(테스트) / 미확인(다른 브라우저 실확인) | `browser-guide.test.ts`(판정표 4경우), `shared-ui`(계정 메뉴), `detail-panel`(카드), `console-guide-dom`(첫 표시 → 나중에 → 재마운트 안 뜸 → sessionStorage 비우면 뜸 → 확인했어요 POST `{version:1}` → 안 뜸 → 계정 메뉴로 열림) |
| AC-CS2-019 | PASS(테스트) / 미확인(설정 주소 실확인) | `browser-guide.test.ts` 9개 UA + 주소 유무 + 단계 키 ko/en, `shared-ui`(주소 없으면 버튼 없음, 한계 문구 ko/en). 설치된 브라우저: Chrome, Safari. 주소 붙여넣기 확인은 이번 회차에 하지 않음. Edge·Whale·Firefox 미설치(미확인). iOS 메뉴 이름(설정 → 일반 → 자동 완성 및 암호)도 미확인 후보값. `x-apple.systempreferences:` 딥링크는 확인 못 해 넣지 않음(메뉴 경로만) |
| AC-CS2-020 | PASS(테스트) / 미확인(같은 출처 저장 비밀번호 Chrome 확인) | `item-form.test.ts`(칸별 속성), `clipboard.test.ts` 3건(임시 칸 aria-hidden·opacity 0·복사 뒤 0개) |
| AC-CS2-021 | PASS(테스트) / 미확인(레이아웃 이동·375px) | `i18n.test.ts`(키 집합 같음 + 새 키), 정적 렌더(radiogroup 이름 2개, 체크박스 label, 생성·보기·복사·사이드바 + aria-label), `item-form-dom`(화살표 키로 바뀌고 초점 이동) |
| AC-CS2-022 | 미확인 | 흐름 전체 브라우저 확인은 세션이 필요해 리드 몫. 구성 요소는 AC-CS2-003/004(M1)·013·016 테스트로 고정 |

**RED** (구현 전, `npx vitest run` 새 테스트 파일 + 기존 `i18n.test.ts`·`sidebar.test.ts`, 로그 `.moai/state/verify/cs2-m2/red.log`):

```
 FAIL  src/app/console/__tests__/clipboard.test.ts [ src/app/console/__tests__/clipboard.test.ts ]
Error: Failed to resolve import "../clipboard" from "src/app/console/__tests__/clipboard.test.ts". Does the file exist?
 FAIL  src/lib/__tests__/console-scrollbar-style.test.ts > console scrollbar (scoped) > has scrollbar rules
AssertionError: expected 0 to be greater than or equal to 5
 Test Files  10 failed | 1 passed (11)
      Tests  39 failed | 19 passed (58)
```

통과한 19건은 기존 `sidebar.test.ts`·`i18n.test.ts` 판정과, 규칙이 아직 없어 빈 집합으로 통과한 스크롤바 검사(순수성·globals 그대로 등)다.

**나중에 쓴 테스트와 변이 확인**: `item-form-dom.test.ts`(9건)와 `console-guide-dom.test.ts`(1건)는 해당 동작을 구현한 뒤에 쓴 클릭 동작 테스트다. 테스트가 동작을 실제로 잡는지 보려고 구현을 일부러 망가뜨려(삭제 확인 끄기, 새 분류 선택 끄기, 화살표 초점 끄기, 생성 끄기, 자동 표시 끄기) 돌렸다:

```
$ npx vitest run src/app/console/__tests__/item-form-dom.test.ts src/app/console/__tests__/console-guide-dom.test.ts   (변이 적용)
 Test Files  2 failed (2)
      Tests  6 failed | 4 passed (10)
```

변이를 되돌린 뒤 같은 명령은 `Tests  10 passed (10)`. 실패하지 않은 4건은 변이와 무관한 동작(공유 계정 저장 본문, 공유 대상·숨기기 본문, 저장된 정보 없을 때 묻지 않음, 새 분류 취소)이다. 로그 `.moai/state/verify/cs2-m2/mutation.log`.

**GREEN / 검증** (같은 트리, 이 회차 실행, 부하 1.7~2.9):

```
$ npx vitest run src/lib/console src/app/api/console src/app/console src/lib/__tests__/console-scrollbar-style.test.ts src/lib/__tests__/console-screen-style.test.ts src/lib/__tests__/backup-crypto.test.ts src/lib/__tests__/backup-snapshot-id.test.ts src/app/api/admin/users/__tests__/users.test.ts
 Test Files  40 passed (40)
      Tests  538 passed (538)

$ npx tsc --noEmit
tsc=0

$ npx eslint <바뀐 ts·tsx 28개>
eslint=0   (출력 0바이트)

$ curl http://localhost:3457/console/login   (npx next dev -p 3457)
login=200
 ✓ Compiled /console/login in 1582ms (1105 modules)

헤드리스 Chrome 157 (CDP, getComputedStyle(document.documentElement))
/console/login  html "rgb(214, 208, 196) rgb(242, 239, 232)" / thin, 루트·안쪽 div 같음
/               html "rgb(212, 168, 67) rgb(20, 22, 29)" / auto
/admin/login    html "rgb(212, 168, 67) rgb(20, 22, 29)" / auto
```

공개 저장소 점검: `git grep -nE "CONSOLE_(SESSION_SECRET|SECRETS_KEY|ADMIN_EMAILS) *(\?\?|\|\|) *['\"]" src` 0줄. 새 코드의 email은 `*@try-n.com` 지어낸 주소뿐, 외부 이미지·폰트·스크립트 참조 없음(`console-screen-style.test.ts` 통과). 로그 원본 `.moai/state/verify/cs2-m2/`(커밋 안 함). 개발 서버와 헤드리스 Chrome은 확인 뒤 종료했고 남은 프로세스 없음(`pgrep` 빈 출력). 개발 서버가 만든 `next-env.d.ts`는 지웠다.

**미룬 것 / 남은 일 (리드 브라우저 확인 필요)**

- 로그인 세션이 필요한 확인 전부: AC-CS2-007 안쪽 스크롤 영역(`/console`), 009 네트워크 탭, 012 대화상자 흐름, 013 실제 클립보드, 014 Chrome·Safari 새 탭·팝업 차단·`window.opener`·`document.referrer`·감사 1건, 016·018 실브라우저 흐름, 020 같은 출처 저장 비밀번호 Chrome 프로필, 021 레이아웃 이동·375px, 022 흐름 전체.
- Firefox·Edge·Whale은 이 맥에 없다(미확인). Safari 스크롤바 픽셀 측정, 설정 주소 붙여넣기 결과(Chrome `chrome://password-manager/settings` 포함)는 이번 회차에 하지 않았다. 단계 문구의 메뉴 이름(예: Chrome "비밀번호 저장 제안", iOS "자동 완성 및 암호")은 후보값이다.
- `npx next build`는 돌리지 않았다(개발 서버 컴파일로 CSS 순수성만 확인).
- `/console` → `/` 앱 안 이동 뒤 스크롤바 복귀는 확인하지 못했다(콘솔 루트가 사라지면 `:has()`가 풀리는 구조라 추정상 문제없음).
- 안내 팝업 "확인했어요" 저장이 실패하면 팝업을 닫지 않고 토스트로 알린다. 서버 `prefs` 읽기 실패 시 bootstrap이 `true`를 주므로(M1) 팝업이 뜨지 않는다.


## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
