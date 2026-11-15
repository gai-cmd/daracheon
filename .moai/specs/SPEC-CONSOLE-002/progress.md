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
- addendum_0_5_0 (2026-11-15, manager-spec):
  - 근거: 운영 중인 콘솔을 본 오너 후속 요청 3건(보기 전환, 영문 모드, 홈 채널 새 소식)과 M2 감사의 작은 결함 2건(안내 단계 번호, 공유 계정 설명 문구). 범위는 리드가 정했다(오너가 설계를 위임)
  - 추가: M3 보기 전환·영문 모드·작은 수정 (REQ-CS2-022~029, AC-CS2-023~030), M4 채널 새 소식 (REQ-CS2-030~038, AC-CS2-031~040. AC-CS2-039는 M3·M4 공통)
  - 합계: requirements 38 (REQ-CS2-001 ~ REQ-CS2-038), acceptance_criteria 40 (AC-CS2-001 ~ AC-CS2-040), milestones M1~M4. 기존 001~022 번호·본문은 바꾸지 않음
  - 바뀐 문서: spec.md(0.5.0, §1.2·§2·§3.7~§3.9·§4·§5·§6), plan.md(M3·M4·위험·완료 조건), acceptance.md(§10~§13, §8·§9), design.md(CS2-D13~D28, §2.8~§2.15, §3), research.md(§5~§7)
  - SPEC-CONSOLE-001 REQ-CON-020의 두 조항(단일 높이 목록 행, 홈 최근 수정 목록)을 이 추가분이 바꾼다(spec.md §4)
  - 리드에게 알릴 사실: (1) 리드 범위의 "카드 = 지금의 카드 격자"와 달리 코드에 항목 카드 격자가 없어 카드 보기는 새로 만든다(research.md §5.1, design.md CS2-D13). (2) "기존 관리자 설정 대화상자"가 없어 채널 편집기를 새 관리자 대화상자로 둔다(CS2-D26). (3) 유튜브 채널 피드 주소가 2026-11-15 확인에서 공개 채널 5곳 모두 404였다. 형식은 2024-12-25 보관본으로 확인했고, 실패 채널은 링크 타일로 보인다(research.md §6.1, CS2-D25). (4) WebFetch는 유튜브 피드에서 404, `rss.blog.naver.com`·`web.archive.org`에서 가져오기 거절이라 `curl`로 확인했다(research.md §6)
  - audit: 별도 plan-audit 회차 없이 리드가 수용. 이유: 오너가 설계를 리드에게 위임했고, 리드가 범위를 파일·수치 수준까지 정해 넘겼다(2026-11-15). 구현 뒤 sync-auditor 관문은 그대로 거친다
  - addendum_accepted: true (리드 수용, 2026-11-15, revision 0.5.0, plan-audit 회차 없음)

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


### M3 — 보기 전환·영문 모드·작은 수정 (2026-11-15, manager-develop, cycle_type=tdd)

**바뀐 것**

| 파일 | 내용 |
|---|---|
| `src/lib/console/ui-model.ts` | `ViewMode`, `VIEW_STORAGE_KEY = 'zoel-console:view'`, `resolveViewMode(stored, width)`(저장값 `list`·`cards`만, 아니면 480px 이하 목록·넘으면 카드), `personName(email, fallbackName, people, lang)`, `nameLabel(label, people, lang)`(이름만 저장된 마지막 수정자·사용 기록 행위자), `enFormTitles(title, titleEn)`(CS2-D16) |
| `src/app/console/radio-keys.ts` (신규) | `nextInGroup`: radiogroup 화살표·Home·End 공용 처리. 종류 선택과 보기 방식이 함께 씀(plan.md M3 "같아지면 공용 도우미로") |
| `src/app/console/ViewToggle.tsx` (신규) | 목록 \| 카드 radiogroup(`aria-label` 보기 방식 / View), 선택된 쪽만 `tabindex=0`, 버튼 너비 고정(74px) |
| `src/app/console/ItemCard.tsx` (신규) | 카드 한 장(아이콘·제목 버튼 2줄·설명 2줄·분류·접속 방식·계정 정보 표시·담당자·열기·더 보기). 행과 같이 쓰는 `itemMenu`, `RowConfirm`, `AccTag`를 여기로 옮김(HomeView↔ListView 순환 import 방지) |
| `src/app/console/ListView.tsx` | 툴바 오른쪽에 `ViewToggle`(빈 목록에도 있음). `ItemList`(목록이면 `ul[data-view=list]` 행, 카드면 `ul[data-view=cards]` 격자) 분리·export. 카드 방식은 열 머리(`HeadRow`)를 그리지 않음. 행 둘째 줄 = 설명(화면 언어) → 없으면 호스트 → 주소도 없으면 "주소 미확인" |
| `src/app/console/HomeView.tsx` | 최근 수정 목록을 "최근 수정한 카드 보기" 펼침(`aria-expanded`, 처음 닫힘) 안으로, 같은 `ItemList` + `ViewToggle`. 고정 칩·분류별 요약은 그대로(컨트롤 없음). `recentOpen` prop(처음 펼침 상태, 정적 렌더 테스트용) |
| `src/app/console/ConsoleApp.tsx`, `app-context.ts` | `viewMode`·`setViewMode`를 AppContext로. 처음 값은 `useState` 초기화 함수에서 `resolveViewMode(store.get(...), window.innerWidth)`(서버 렌더는 목록이 없어 기본값), 저장은 기존 `store.set`(예외 삼킴). 편집 권한 없음 토스트의 담당자 이름도 `ownersText`(영문 이름) |
| `src/app/console/ItemForm.tsx` | 영어 화면: 제목 자리 `f-title-en`, 설명(메모) 자리 `f-desc-en`, 더 보기 메모 `f-note-en`, 링크 이름 칸이 `label_en`(`data-link-label="en"`), 빈 영문 칸은 한국어 값이 placeholder. 한국어 칸(`f-title`·`f-desc`·`f-note`·링크 한국어 이름)은 더 보기 안 "Korean text" 묶음(`role=group`). 저장: 한국어 제목이 비면 영문 제목을 함께, 둘 다 비면 `f-title-en`에 오류·요청 없음, 영문 메모·링크 영문 이름은 그대로 보냄(한국어 값을 지우지 않음). 한국어 화면의 "한국어 값을 고치면 영문 값을 비우는" 규칙은 한국어 화면에서만. 담당자 처음 값·`datalist`는 영어 화면에서 영문 이름, 같은 사람으로 되돌아오는지 검사는 `ownersFromText` 왕복으로 |
| `src/app/console/AccountMenu.tsx` | 계정 칩·팝오버 머리 이름과 아바타 글자에 `personName`(`me` 객체는 그대로) |
| `src/app/console/DetailPanel.tsx` | 마지막 수정한 사람(2곳)과 사용 기록 행위자에 `nameLabel` |
| `src/lib/console/i18n.ts` | 새 키 한·영: `view.label/list/cards`, `recentToggle`, `koGroup`, `fTitleKo`·`fDescKo`·`fNoteKo`·`fLinkLabelKo`. `sharedDesc`를 REQ-CS2-029 문구로, `accNote.shared-credential`을 "아이디"/"login ID"로(보기 약속 없음) |
| `src/lib/console/brand-marks.ts` | 카드 보기 아이콘 `grid`(내장 SVG, 바깥 참조 없음) |
| `src/app/console/console.module.css` | `.viewSeg`(선택 `#dcefe8`/`#1f6f5c`), `.cards` 격자(`repeat(auto-fill, minmax(220px, 1fr))`, `grid-auto-rows: 1fr`), `.card*`(제목·설명 `-webkit-line-clamp: 2`, 설명은 두 줄 자리를 늘 확보), 좁은 목록(`@container list` ≤520px) 1열, `.koGroup`, `.guideSteps { list-style: decimal }`(REQ-CS2-028). 사이트 토큰·`:root` 없음, 콘솔 루트 변수와 고정 hex만 |
| 테스트 (신규) | `src/lib/console/__tests__/view-mode.test.ts`, `src/app/console/__tests__/{list-views,item-form-en,names-en,no-hangul-literals}.test.ts`(정적 렌더·소스 검사), `{list-views-dom,item-form-en-dom}.test.ts`(jsdom, fetch 가짜), 검사 함수 `__tests__/hangul-scan.ts`(TypeScript 파서로 문자열·템플릿·JSX 글자 노드만 봄 — 주석은 노드가 아니라 빠짐), `src/lib/__tests__/console-guide-style.test.ts`. `i18n.test.ts`에 M3 문구 3건, `render-helpers.ts`의 `makeApp`에 `viewMode: 'list'`(기존 정적 렌더 테스트가 행을 보므로) |

**한글 문자열 검사 허용 목록** (`no-hangul-literals.test.ts`): `Sidebar.tsx`의 `'한국어'`·`'한'`(언어 고르기의 자국어 이름), `layout.tsx`의 메타데이터 제목. 팀(`CONSOLE_TEAMS`)·공개 범위(`CONSOLE_VISIBILITIES`) 저장값과 정확히 같은 문자열은 데이터 값으로 자동 허용(`ItemForm`의 `'전체'`·`'팀'`·`'본인'`, `ListView`·`AdminDialogs`의 `'공통'`). 스캔 결과 그 밖의 한글 문자열은 원래 없었다 — 영어 화면에 남던 한국어는 화면 문구가 아니라 데이터(한국어 칸·한국어 이름)였고, 이번 회차에 양식 영문 칸·영문 이름 표시로 고쳤다.

**인수 기준 (M3)** — "테스트"는 이번 회차에 돌린 vitest.

| AC | 판정 | 근거 / 남은 것 |
|---|---|---|
| AC-CS2-023 | PASS(테스트) / 미확인(브라우저 `top` 고정) | `list-views.test.ts`: radiogroup 1개·이름 보기 방식/View·radio 목록/카드(List/Cards)·선택된 쪽만 `tabindex="0"`(ko·en × 두 방식), 위키·분류·공유 계정·내 항목·검색·빈 목록에도 있음, 홈은 펼침 안에만(고정 칩·요약 밖). `list-views-dom.test.ts`: 오른쪽 화살표 → 카드·초점 이동, Home → 목록, End → 카드 |
| AC-CS2-024 | PASS(테스트) / 미확인(브라우저 카드 높이 0px 차이·두 줄 자르기) | 정적 렌더: 목록 둘째 줄(설명 / 호스트 / 주소 미확인), 동작 칸 직접 버튼 ≤2(열기·편집) + 더 보기 1, `data-view` 구분, 카드 구성·주소 있을 때만 열기·SSO 표시 1개·공개 표시 없음, `data-id` 순서 같음, 공유 계정 보기 두 방식 모두 계정 정보 있음/없음. jsdom: 행·카드 제목 모두 `openDetail('x2')` |
| AC-CS2-025 | PASS(테스트) | `view-mode.test.ts`(사례 8개, 키 이름), jsdom: `getItem`·`setItem` 예외에도 기본(1280px → 카드) 렌더·전환 가능, 저장값 목록 + 1280px 에서 MutationObserver 로 `data-view="cards"` 0회, 카드로 바꾼 뒤 분류 보기로 옮겨도 카드·`localStorage` 에 `"cards"` |
| AC-CS2-026 | PASS(테스트) | `item-form-en.test.ts` 7건(첫 화면 `f-title-en`·`f-desc-en` + placeholder, 순서 `f-cat, f-title-en, f-url`, Korean text 묶음 안 `f-title`·`f-desc`·`f-note`, `f-note-en`·링크 영문 이름 먼저 + placeholder, 한국어 화면 배치 그대로). `item-form-en-dom.test.ts`: 새 항목 영문 제목만 → `title`·`title_en` 둘 다 "Alpha", 두 제목 비면 요청 0·`aria-invalid`·"Enter a title.", 영문 설명만 고치면 `description` 그대로, 영문 메모·링크 영문 이름 저장 + 한국어 값 유지. 기존 한국어 양식 테스트(`item-form*.test.ts`)는 기대값 수정 없이 통과 |
| AC-CS2-027 | PASS(테스트) | `names-en.test.ts` 6건(계정 칩·팝오버 "Gana"·`initials("Gana")`, 한국어 화면 그대로, 행·카드·상세 "Gana, 다라", 마지막 수정자 "Gana", 영문 빈 항목·분류는 한국어, 담당자 처음 값·제안 목록). `item-form-en-dom`: "Member, Gana" 입력 → 두 사람 email. `bootstrap.test.ts` 는 손대지 않고 통과(같은 실행에 포함) |
| AC-CS2-028 | PASS(테스트) | `no-hangul-literals.test.ts` 7건: 현재 트리 통과, 허용 항목마다 이유 + 실제 소스에 있음(낡은 항목 검사), `login/` 포함 확인, `<span>안녕</span>`·`title="안녕"`·`` `안녕 ${x}` `` 각 1건, 주석 3종 0건, `'https://…'; // 안녕` 0건 |
| AC-CS2-029 | PASS(테스트) / 미확인(브라우저 `listStyleType`) | `console-guide-style.test.ts`: `.guideSteps` 에 `list-style: decimal`, ko·en 모두 `<ol>` 안 `<li>` 2개 이상 |
| AC-CS2-030 | PASS(테스트) | `i18n.test.ts`: `sharedDesc` 한·영 정확히 일치, `accNote.shared-credential` 에 아이디/login ID, 사용자 이름/username 없음, "볼 수"·see·view 없음 |
| AC-CS2-039 (M3 몫) | PASS(테스트) / 미확인(브라우저 키보드·영어 화면 갈무리) | 한·영 키 집합 테스트 통과(새 키 포함), 보기 방식 radiogroup 이름. 채널 칩·채널 편집기 부분은 M4 |

**RED** (구현 전, 새 테스트 8개 파일 + `i18n.test.ts`, 로그 `.moai/state/verify/cs2-m3/red.log`):

```
 FAIL  src/app/console/__tests__/no-hangul-literals.test.ts [ src/app/console/__tests__/no-hangul-literals.test.ts ]
Error: Cannot find module './hangul-scan' imported from …/src/app/console/__tests__/no-hangul-literals.test.ts
TypeError: resolveViewMode is not a function
TypeError: personName is not a function
TypeError: enFormTitles is not a function
AssertionError: expected [] to have a length of 1 but got +0
 Test Files  9 failed (9)
      Tests  40 failed | 20 passed (60)
```

파일별 실패 수(로그의 `FAIL` 줄): `view-mode` 8, `list-views` 9, `item-form-en` 7, `list-views-dom` 5, `item-form-en-dom` 4, `names-en` 3, `i18n` 3(새 M3 판정), `console-guide-style` 1, `no-hangul-literals` 파일 단위(검사 함수 없음). 통과한 20건은 기본 보고 형식에 항목별로 남지 않아 개수로만 맞춰 본 추정이다: `names-en` 3건(담당자 표시는 기존 `ownerName`이 이미 영문 이름을 씀, 한국어 화면 칩, 영문 빈 항목·분류의 한국어 대체), `item-form-en-dom` 1건(영문 설명 — 기존 더 보기의 `f-desc-en`), `list-views` 1건(공유 계정 표시 — 카드 방식이 없어 두 경우 모두 행으로 그려짐), `console-guide-style` 1건(`<ol>`·`<li>` 구조는 M2부터), 나머지 14건은 `i18n.test.ts`의 기존 판정.

**RED 뒤 테스트 수정 2건** (구현이 아니라 판정이 넓었던 것): `list-views.test.ts`의 "둘째 줄에 호스트 없음"이 제목 옆 바깥 링크 아이콘의 `href`까지 잡아서 둘째 줄(`rL2`)만 보도록 좁힘. `item-form-en.test.ts`의 "한국어 화면에 '한국어 내용' 없음"이 기존 문구 `fEnHint`("…한국어 내용을 보여 줘요")에 걸려서 묶음 id(`f-ko-l`) 검사로 바꿈. 같은 파일의 링크 이름 판정은, 링크 종류의 연동 주소가 M2(AC-CS2-010)대로 첫 화면에 있어서 "더 보기 안"이 아니라 "영문 칸이 Korean text 묶음보다 앞"으로 고쳤다(구현 전에 고침).

**GREEN / 검증** (같은 트리, 이 회차 실행, 부하 1.1~1.5):

```
$ npx vitest run src/lib/console src/app/api/console src/app/console src/lib/__tests__/console-scrollbar-style.test.ts src/lib/__tests__/console-screen-style.test.ts src/lib/__tests__/console-guide-style.test.ts
 Test Files  45 passed (45)
      Tests  575 passed (575)

$ npx tsc --noEmit
tsc=0

$ npx eslint <바뀐·새 ts·tsx 24개>
eslint=0   (출력 0바이트)
```

공개 저장소 점검: `git grep -nE "CONSOLE_(SESSION_SECRET|SECRETS_KEY|ADMIN_EMAILS) *(\?\?|\|\|) *['\"]" src` 0줄. 새 테스트의 email 은 `a@`·`b@`·`c@`·`g@try-n.com` 지어낸 주소뿐. 바깥 이미지·폰트·스크립트 참조 없음(`console-screen-style.test.ts`·`brand-marks.test.ts` 통과). 로그 원본 `.moai/state/verify/cs2-m3/`(커밋 안 함).

**미룬 것 / 남은 일**

- 브라우저 확인은 이번 회차에 하지 않았다(로그인 세션이 필요한 `/console` 목록 화면): AC-CS2-023 전환 중 툴바·목록 머리 `top` 고정, AC-CS2-024 카드 첫 줄 높이 차이 0px·두 줄 자르기(제목 80자·설명 300자), AC-CS2-029 `listStyleType`·번호 표시, AC-CS2-039 키보드만으로 조작·영어 화면 갈무리, 375px 폭. 리드 확인 필요.
- 홈: M3 만 배포하면 최근 수정 목록이 처음에 닫혀 보인다(REQ-CS2-037 의 펼침 구조를 먼저 들임). M4 의 채널 새 소식이 그 위에 들어오므로 M3·M4 를 함께 배포하는 편이 낫다. 홈 머리의 "더 보기"(전체 항목, 최근 수정 순) 링크는 그대로 둠.
- 영어 화면 양식에서 한국어 칸을 비운 채 영문만 넣은 설명·메모는 한국어 화면에서 빈 칸으로 보인다(`localized`는 영문 → 한국어 방향만 대체). 제목만 REQ-CS2-025 대로 영문을 한국어 제목으로도 보낸다.
- 사용 기록 행위자·마지막 수정자는 이름 문자열만 저장돼 있어, 사람 목록의 한국어 이름과 정확히 같을 때만 영문 이름으로 바뀐다(`nameLabel`). 이름이 같은 사람이 둘이면 첫 사람의 영문 이름이 보인다.
- `next build`는 돌리지 않았다.

### M4 — 채널 새 소식 (2026-11-15, manager-develop, cycle_type=tdd)

**바뀐 것**

| 파일 | 내용 |
|---|---|
| `src/lib/console/types.ts` | `CONSOLE_CHANNEL_KINDS`, `ConsoleChannel`, `ConsoleSettings.channels?`, `MAX_CHANNELS = 12`, 피드 응답 형식 `FeedChannelInfo`·`FeedItemInfo`·`FeedResponse`·`FeedErrorCode`(화면과 서버가 함께 씀) |
| `src/lib/console/channels.ts` (신규) | `validateChannels`(종류별 출처 규칙, 색 `#rrggbb` 소문자 저장, 이름 1~40자, 영문 이름 0~40자, 중복·모르는 id, 13개 이상 → 오류 목록, 새 행에 `ch-` + 8자 id, order 다시 매김), `normalizeStoredChannels`(저장된 틀린 행 버림), `readChannels`, `channelHome`(CS2-D25) |
| `src/app/api/console/channels/route.ts` (신규) | GET·PUT, 관리자 전용(`authorizeConsole(..., { admin: true })`, PUT 은 Origin·Content-Type 검사), `{ ...current, channels }` 쓰기(teamPins 보존), 감사 `settings.update` `meta: { channels: n }` |
| `src/lib/console/feed-fetch.ts` (신규) | `fetchAllowed`: https 전용, IP 문자열·localhost 거부, 요청별 허용 목록, `assertPublicHttpUrl`(src/lib/ssrf.ts) 재사용, 리다이렉트는 같은 검사를 통과한 곳으로 한 번만, 5초 `AbortController`, `content-length`·스트림 읽기로 크기 상한, `credentials: 'omit'`·`referrerPolicy: 'no-referrer'`·`redirect: 'manual'`, 쿠키·Referer 머리글 없음 |
| `src/lib/console/feed-parse.ts` (신규) | 의존성 없는 정규식 파서: CDATA 는 남기고 주석·`<!DOCTYPE>`(내부 부분집합 포함)·처리 명령 제거, XML 기본·숫자 엔티티만 풂, 제목 태그 제거·200자, Atom `rel=alternate`(rel 없음 포함) → 첫 `link`, `pubDate`→`published`→`updated`→`dc:date`, 썸네일 `media:thumbnail` → 그림 `media:content` → 그림 `enclosure` → 설명 속 첫 `<img src>`. 피드가 아닌 문서는 `null` |
| `src/lib/console/feed.ts` (신규) | `buildFeed`(켜진 채널만 설정 순서, 채널당 6건, 전체 최신순·날짜 없는 것 뒤, 같은 출처는 한 번만 요청, 실패 격리), 모듈 캐시 `${kind}:${source}` 성공 30분·실패 5분·설정에 없는 키 정리, 자사 블로그 `readLatestPublishedPostsSafe(6)` → `/blog/<slug>`, 인스타그램 요청 없음, `thumbAllowed`·`thumbUrl`(허용 목록 그림만 썸네일 경로, 아니면 null). 시계·fetch·블로그 읽기·Blob 호스트 주입 가능 |
| `src/lib/db.ts` | `publicBlobHost()` 내보내기 하나(CS2-D28). 기존 동작 그대로 |
| `src/app/api/console/feed/route.ts` (신규) | GET, 세션 필요(401), `Cache-Control: private, max-age=1800` |
| `src/app/api/console/feed/thumb/route.ts` (신규) | GET, 세션 필요(401), `u` ≤ 2048자, `fetchAllowed`(상한 2MB) + 허용 목록, `image/*`(SVG 제외)만 → 원본 형식·`nosniff`·`private, max-age=86400`·`Content-Security-Policy: default-src 'none'`. 그 밖은 코드에 묶은 16×9 단색 PNG(77바이트), `private, max-age=300`, `X-Thumb-Fallback: 1` |
| `src/app/console/ChannelFeed.tsx` (신규) | 칩 radiogroup(이름 채널/Channels, 화살표·Home·End, 선택된 칩만 탭 순서), 글 타일(16:9 그림 또는 빈 상자, 채널 색 배지, 두 줄 제목, `<time>`), 링크 타일, 자리 표시(`aria-busy`), 빈 상태(관리자만 채널 관리), 오류 + 다시 시도. `<img>` 는 썸네일 경로로 시작할 때만 그림 |
| `src/app/console/HomeView.tsx` | "최근 수정된 항목" 구역 자리에 "채널 새 소식"(`h-feed`). 최근 수정 목록은 그 구역 안 "최근 수정한 카드 보기" 펼침으로(M3 구조 그대로, "더 보기"는 펼침 안으로). props `feed`·`feedRev`·`onManageChannels` |
| `src/app/console/AdminDialogs.tsx` | `ChannelsDialog`(행마다 종류·이름·영문 이름·출처(자사 블로그는 칸 없음, 종류별 placeholder)·색·켜기·위아래·삭제, 12개까지 추가, 서버 오류를 행 번호로 표시) |
| `src/app/console/AccountMenu.tsx`, `ConsoleApp.tsx`, `api.ts` | 관리자 도구 "채널 관리"/"Channels", 대화상자 연결, 저장 뒤 `feedRev` 를 올려 피드를 새로 받음, `fetchFeed(fresh)`·`fetchChannels`·`saveChannels` |
| `src/lib/console/ui-model.ts` | `badgeTextColor`(콘솔 잉크색 `#1c1b18`·흰색 중 대비가 큰 쪽, 둘 다 4.5:1 미만이면 검정 `#000000`), `contrastRatio`, `feedHref`(http(s)·같은 출처 경로만) |
| `src/lib/console/i18n.ts` | `mChannels`, `feed.*`, `chan.*` 한·영 |
| `src/app/console/console.module.css` | `.feedChips`(칩 줄만 `overflow-x: auto`), `.fchip`, `.tiles`(`minmax(200px, 1fr)`, 콘텐츠 640px 이하 두 열), `.tileImg`(`aspect-ratio: 16 / 9`), `.tileT`(`-webkit-line-clamp: 2`), `.badge`, `.feedSkel`(`min-height: 320px`), `.chrow` 등. 고정 hex 와 콘솔 루트 변수만 |
| 테스트 (신규) | `src/lib/console/__tests__/{channels,feed-fetch,feed-parse,feed,badge-color}.test.ts`, `src/app/api/console/__tests__/{channels,feed-thumb}.test.ts`, `src/app/console/__tests__/{channel-feed,channel-feed-dom}.test.ts`, 고정 데이터 `src/lib/console/__tests__/fixtures/feeds/{youtube-atom,naver-rss,rss2-generic,atom-generic,hostile}.xml`(지어낸 값) |
| 테스트 (수정) | `support.ts` 의 db 가짜에 `publicBlobHost`, `render-helpers.ts` 에 `makeFeed`, `brand-marks.test.ts` 의 지어낸 주소 두 개를 `fakeexample` 로(AC-CS2-040 grep 이 id 부분 `fake` 시작을 요구) |

모든 테스트는 바깥 네트워크에 요청하지 않는다: fetch 는 주입하거나 `vi.spyOn(globalThis, 'fetch')`, DNS 는 `node:dns/promises` 가짜, 블로그 저장소는 가짜.

**설계와 다르게 정한 것 (리드 확인용)**

- 자사 블로그 커버 그림이 상대 경로(`/images/…`)면 `thumb` 는 `null` 이다. CS2-D24("모든 타일 그림은 썸네일 경로를 거친다")와 AC-CS2-037("thumb 는 null 이거나 썸네일 경로")을 글자 그대로 따랐다. 관리자 업로드 커버는 Blob 이므로(헌법) 썸네일 경로로 나온다.
- 가져오기는 성공했지만 보여 줄 글이 0건인 채널(없는 네이버 id 가 빈 `<channel>` 을 돌려주는 경우, research.md §6.2)도 링크 타일로 보인다. 채널이 사라진 것처럼 보이지 않게 하려는 CS2-D25 의 취지를 넓혀 적용했다.
- 배지 글자색은 design.md 의 "검정 `#1c1b18`과 흰색" 그대로 고르되, `#777777` 처럼 둘 다 4.5:1 에 못 미치는 중간 밝기에서만 순수 검정을 쓴다(그 색에서 `#1c1b18` 3.85:1, 흰색 4.48:1, 검정 4.69:1 — node 로 WCAG 공식 계산).
- 썸네일 경로는 `authorizeConsole` 대신 세션만 확인한다(그림마다 사람 목록 문서를 읽지 않으려고). 관리자 권한은 필요 없는 경로이고 미들웨어도 같은 세션을 검사한다. 채널 목록은 캐시되는 `readSingle` 로 읽는다.
- 자사 블로그 글은 피드 메모리 캐시에 넣지 않는다. 바깥 요청이 없고, 블로그 저장소 함수가 이미 5분 캐시와 2초 제한을 갖고 있다.
- 브라우저는 피드 응답을 30분 개인 캐시로 다시 쓰고, 관리자가 채널을 저장한 직후에만 `cache: 'no-cache'` 로 새로 받는다.

**인수 기준 (M4)** — "테스트"는 이번 회차에 돌린 vitest.

| AC | 판정 | 근거 / 남은 것 |
|---|---|---|
| AC-CS2-031 | PASS(테스트) | `api/.../channels.test.ts`: 종류마다 하나인 5개 저장 → 200, 순서·값 같음, `teamPins` 그대로, `settings.update` 1건(`{ channels: 5 }`), 다시 저장 시 기존 id 유지·새 행만 새 id. 멤버 읽기·저장 403, 세션 없음 401, `Origin: https://evil.io` 403. `UCshort`·`Bad.Id`·`http://`·`https://u:p@`·자사 블로그 `x`·`red`·빈 이름·41자·같은 id 두 개·13개·모르는 id 모두 400 + 문서 그대로. `channel-feed.test.ts`: 편집기 행마다 종류·이름·영문 이름·출처·색·켜기·위·아래·삭제, 계정 메뉴 관리자 "채널 관리"/"Channels", 멤버 없음 |
| AC-CS2-032 | PASS(테스트) | `feed.test.ts`: 켜진 4 + 꺼진 1 → 채널 4개(설정 순서), 유튜브·블로그 ok, 네이버 `timeout`, RSS `http_status`, 항목 유튜브 6 + 블로그 3 최신순, 항목 칸 5개. `feed-thumb.test.ts`: 경로 401, 200 + 실패 채널 격리 |
| AC-CS2-033 | PASS(테스트) | 두 번 → 1회, 29분 → 1회, 31분 → 2회. 실패 4분 → 재요청 없음, 6분 → 재요청. 출처 바꾼 채널만 새로. 경로 `Cache-Control: private, max-age=1800` |
| AC-CS2-034 | PASS(테스트) | `feed-fetch.test.ts`: `http:`·`127.0.0.1`·`[::1]`·`localhost`·`example.net`·`www.youtube.com.example.net`·DNS `10.0.0.5` 모두 fetch 0회. `302 → http:` 1회 요청 후 `redirect_rejected`, 두 번 리다이렉트 실패, 허용 https 로 한 번 넘어가면 성공. 1MB+1 → `too_large`, 스트림 당김 18회 이하(1MB 정확히는 성공), 가짜 타이머 4999ms 미결·5001ms `timeout`, `credentials: 'omit'`·`no-referrer`·`manual`·쿠키/Referer 없음, `assertPublicHttpUrl` 가져오기 문 |
| AC-CS2-035 | PASS(테스트) | `feed-parse.test.ts`: 4종 첫 항목 제목·주소·ISO 날짜·썸네일(퍼센트 인코딩 유지), `&amp;`·`&#39;` 풀림, DOCTYPE 엔티티 미전개, `<script>a</script>b` → `ab`, `javascript:` 빠짐, 주석 속 항목 무시, 날짜 없는 항목 맨 뒤, 201자 → 200자, HTML 은 `null`. `git diff 0a6d164d --stat -- package.json package-lock.json` 출력 없음 |
| AC-CS2-036 | PASS(테스트) | 자사 블로그 `readBlog(6)`, 6건 `/blog/<slug>`, fetch 0회. 인스타그램 fetch 0회·ok·항목 0·home 프로필. 정적 렌더: 인스타그램·실패 채널마다 링크 타일, 문구 한·영, `href`=home, 새 탭·`noopener noreferrer`, 배지 |
| AC-CS2-037 | PASS(테스트) | `feed-thumb.test.ts`: 401, 허용 5종 200 + 원본 형식·nosniff·`private, max-age=86400`, 거절 9종(없음·2049자·http·외부·접미사 우회 2종·IP·localhost·꺼진 RSS 호스트) fetch 0회 + 기본 그림 `private, max-age=300`, SVG·HTML·2MB+1·허용 밖 리다이렉트·404 → 기본 그림, 경로 소스에 `http(s)://` 없음. `feed.test.ts`: 피드의 `thumb` 는 null 또는 썸네일 경로, 허용 밖 그림은 null, `thumbAllowed` 허용·거절 표 |
| AC-CS2-038 | PASS(테스트) / 미확인(브라우저) | 정적 렌더 한·영 제목, "최근 수정된 항목" 없음, radiogroup 하나에 전체 + 3, 전체 12개 최신순, 타일 그림 src·배지 색·제목·`<time>`·새 탭, CSS 16:9·두 줄·두 열·칩 줄 스크롤, 자리 표시 `aria-busy` + `min-height`, 빈 상태 문구·관리자만 채널 관리, 오류 다시 시도. jsdom: 마운트 시 `/api/console/feed` 1회, 칩 → 그 채널 6개 이하, 펼침 `aria-expanded` false→true + 최근 수정 6개 + 보기 전환. 브라우저 375px `scrollWidth`·두 열 `top`·불러오기 전후 제목 `top` 은 미확인 |
| AC-CS2-039 (M4 몫) | PASS(테스트) / 미확인(브라우저 키보드) | 한·영 키 집합 테스트 통과(새 키 포함), 채널 칩 radiogroup 이름, 편집기 위·아래·삭제 `aria-label`, `badge-color.test.ts` 7색 모두 4.5:1 이상(테스트 안에서 WCAG 공식으로 따로 계산). jsdom 에서 칩 화살표·Home·End·초점 이동 확인 |
| AC-CS2-040 | PASS(명령) / 미확인(브라우저) | 아래 grep 결과. 로컬 데이터 실채널 브라우저 확인은 이번 회차에 하지 않았다 |

**RED** (구현 전, 새 테스트 9개 파일, 로그 `.moai/state/verify/cs2-m4/red.log`):

```
Error: Cannot find module '../channels' imported from …/src/lib/console/__tests__/channels.test.ts
Error: Cannot find module '/src/lib/console/feed-fetch' imported from …/src/lib/console/__tests__/feed-fetch.test.ts
Error: Cannot find module '../feed-parse' imported from …/src/lib/console/__tests__/feed-parse.test.ts
Error: Cannot find module '/src/app/api/console/channels/route' imported from …/src/app/api/console/__tests__/channels.test.ts
TypeError: badgeTextColor is not a function
AssertionError: expected '' to match /<h2 id="h-feed">채널 새 소식<\/h2>/
 Test Files  9 failed (9)
      Tests  24 failed | 1 passed (25)
```

모듈이 없는 5개 파일은 파일 단위로 실패해 테스트 수에 들어가지 않는다. 통과한 1건은 "멤버 계정 메뉴에 채널 관리 없음"(원래 없으므로).

**GREEN 중 고친 것**: 링크 타일 `href` 가 `new URL().href` 정규화로 끝에 `/` 가 붙어 실패 → 검사만 하고 받은 값을 그대로 쓰도록(`feedHref`). `.feedChips` 의 `scrollbar-width` 가 기존 스크롤바 범위 테스트(`.root` 범위 밖 규칙 금지)에 걸려 뺐다. 테스트의 `Uint8Array` 본문 타입 오류(tsc) → `Blob` 으로 감쌈.

**검증** (같은 트리, 이 회차 실행, 부하 2.1~3.4):

```
$ npx vitest run src/lib/console src/app/api/console src/app/console src/lib/__tests__/console-scrollbar-style.test.ts src/lib/__tests__/console-screen-style.test.ts src/lib/__tests__/console-guide-style.test.ts src/lib/__tests__/ssrf.test.ts src/app/__tests__/console-seo.test.ts src/app/api/admin/auth/google/callback/__tests__ src/lib/__tests__/google-oauth-console.test.ts
 Test Files  60 passed (60)
      Tests  856 passed (856)

$ npx tsc --noEmit
tsc=0

$ xargs npx eslint < eslint-files.txt   # 바뀐·새 ts·tsx 29개
eslint=0 bytes= 0
```

공개 저장소 점검 (AC-CS2-040):

```
$ grep -rnoE "UC[A-Za-z0-9_-]{22}" src/lib/console src/app/console src/app/api/console | grep -oE "UC[A-Za-z0-9_-]{22}$" | sort | uniq -c
  39 UCfake000000000000000001
$ grep -rnoE "rss\.blog\.naver\.com/[a-z0-9_-]+|blog\.naver\.com/[a-z0-9_-]+|instagram\.com/[A-Za-z0-9_.]+" src/lib/console src/app/console src/app/api/console | grep -vcE "\.com/fake"
0
$ git ls-files data/db | grep -c console-
0
$ git grep -nE "CONSOLE_(SESSION_SECRET|SECRETS_KEY|ADMIN_EMAILS) *(\?\?|\|\|) *['\"]" src | wc -l
0
```

(커밋 전 작업 트리에서 `grep -r` 로 셌다 — 새 파일이 아직 추적되지 않아 `git grep` 대신 썼다. 커밋 뒤 `git grep` 으로도 같은 결과여야 한다.) 새 코드의 email 은 `*@try-n.com` 지어낸 주소뿐, 바깥 이미지·폰트·스크립트 참조 없음(`console-screen-style.test.ts` 통과). 로그 원본 `.moai/state/verify/cs2-m4/`(커밋 안 함).

**미룬 것 / 남은 일 (리드 확인 필요)**

- 브라우저 확인 전부(로그인 세션 필요): AC-CS2-038 375px `scrollWidth ≤ 375`·첫 두 타일 같은 `top`·불러오기 전후 제목 `top`, AC-CS2-039 키보드만으로 칩·보기 전환, AC-CS2-040 로컬 데이터에 실제 채널을 넣고 썸네일/링크 타일·네트워크 탭 같은 출처 확인과 채널별 결과(값 없이) 기록. 유튜브 피드가 지금도 404 인지는 이번 회차에 바깥 요청을 하지 않아 모른다.
- `next build` 는 돌리지 않았다.
- 썸네일 경로 응답은 원본을 통째로 메모리에 읽은 뒤 보낸다(상한 2MB). 스트리밍 전달은 하지 않는다.
- 캐시는 인스턴스마다 따로다(spec.md §1.2). 한 출처가 5초 시간 초과면 피드 응답도 그만큼 늦는다(출처들은 동시에 가져옴).
- 채널을 저장해도 다른 사람 브라우저는 최대 30분 동안 예전 피드를 볼 수 있다(`private, max-age=1800`).


## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
