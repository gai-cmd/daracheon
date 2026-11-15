---
id: SPEC-CONSOLE-002
title: "팀 콘솔 공유 계정 정비 — 양식 종류 선택, 비밀번호 숨김 공유, 사용 기록, 자동 입력 끄기 안내, 콘솔 스크롤바"
version: "0.3.0"
status: draft
created: 2026-11-15
updated: 2026-11-15
author: manager-spec
priority: P1
phase: "v1.2.0 target"
module: "src/app/console, src/app/api/console, src/lib/console"
lifecycle: spec-anchored
tags: "console, shared-account, credentials, hide-password, audit, autofill, scrollbar, i18n, a11y"
tier: L
depends_on: [SPEC-CONSOLE-001]
---

# SPEC-CONSOLE-002 — 팀 콘솔 공유 계정 정비

## HISTORY

| 버전 | 날짜 | 작성 | 내용 |
|---|---|---|---|
| 0.1.0 | 2026-11-15 | manager-spec | 최초 작성(draft). 오너 요청 2건(2026-11-15: 스크롤바·분류 선택기·TeamPassword식 계정 공유, 자동 입력 끄기 안내)과 리드가 정한 범위 S1~S6을 근거로 함 |
| 0.2.0 | 2026-11-15 | manager-spec | plan-audit 1차(FAIL 0.86) 결함 반영. CS2-PA-D1 스크롤바 선택자를 CSS 모듈 순수성 검사를 통과하는 형태로 교체, D2 새 탭 차단 판정 방식 교체(REQ-CS2-014), D3 링크 전환 시 저장된 계정 정보 삭제 확인(REQ-CS2-009), D4 안내 확인 값을 `me` 밖으로 이동(REQ-CS2-006), D5 안쪽 스크롤 영역 굵기, D7 종류 왕복 시 원래 형식·접속 방식 복원(REQ-CS2-009), D8 판정 절차 수치화. D6(Tier 초과)은 리드 결정 대기 |
| 0.3.0 | 2026-11-15 | manager-spec | plan-audit 2차(FAIL 0.91) 반영. CS2-PA-D6 리드 결정 (a): 범위 S1~S6을 유지하고 Tier L로 승격(오너가 S6을 이번 작업에 요청). design.md 추가(0.2.0 plan.md §1~§2 이전, 입력 칸 속성 §2.7과 요구사항 대응표 §3 추가), research.md 추가(코드 조사·TeamPassword 도움말 조사). PASS 기준 0.85, 진행 경로 Route B. R2-D1 "SPEC-CONSOLE-001 design.md §6.2"로 명시, R2-D2 AC-CS2-014 Safari 판정을 "새 탭 또는 토스트 안 링크"로 완화. 요구사항·인수 기준 본문 번호는 바꾸지 않음 |

## 1. 배경과 목적

SPEC-CONSOLE-001로 `/console`이 운영 중이다. 오너가 실제로 써 보고 세 가지를 짚었다.

1. 오른쪽 세로 스크롤바가 사이트 공용 스타일(어두운 트랙 + 금색 막대)을 그대로 받아 콘솔의 밝은 스튜디오 톤과 어긋난다. 원인은 `src/styles/globals.css`의 `html` `scrollbar-color`와 `::-webkit-scrollbar` 규칙이다.
2. 항목 추가 화면이 링크 카드만 만드는 것처럼 보인다. 공유 계정 기능은 이미 있지만, 접속 방식과 공개 범위가 "더 보기" 안에 있고 접속 방식을 "공유 계정"으로 바꿔야 아이디·비밀번호 칸이 나타나서 오너가 찾지 못했다. 분류를 새로 만드는 길도 양식에서 보이지 않는다.
3. 목적은 TeamPassword 수준의 최소 기능이다. 회사가 운영하는 사이트의 로그인을 콘솔에 맡겨 두고, 멤버는 비밀번호를 몰라도 그 사이트에 들어갈 수 있어야 한다.

이어서 오너는 "각자의 컴퓨터에 자동 입력 기능을 끄라는 팝업과, 어디로 가야 하는지 해당 설정 화면으로 안내"를 요청했다. 멤버가 공유 비밀번호를 붙여 넣을 때 브라우저가 저장을 제안하면, 나중에 브라우저 비밀번호 관리자에서 그 값을 그대로 읽을 수 있기 때문이다.

### 1.1 솔직한 한계 (요구사항이 약속하지 않는 것)

- **복사만 허용은 화면 수준의 장치다.** "비밀번호 숨기기"를 켜도 복사하는 순간 비밀번호는 멤버의 브라우저와 클립보드로 간다. 붙여 넣은 칸을 개발자 도구로 보거나 다른 곳에 붙여 넣으면 값을 알 수 있다. 암호학적 비밀 유지가 아니라 "화면에 보여 주지 않고, 누가 언제 복사했는지 남기는" 장치다.
- **이 사이트는 브라우저 설정을 바꿀 수 없다.** 웹 페이지는 `chrome://`, `edge://`, `about:` 같은 내부 설정 주소로 이동할 수 없다. 콘솔은 안내하고, 설정 주소를 복사해 주고, 멤버가 확인했다는 표시를 받을 뿐이다. 멤버가 실제로 껐는지는 확인할 수 없다.
- **입력 칸 속성은 권고일 뿐이다.** `autocomplete="off"` 같은 속성을 브라우저가 무시하고 저장을 제안할 수 있다. 그래서 안내 팝업이 필요하다.

## 2. 용어

- **종류(kind of entry)**: 양식 맨 위의 두 갈래 선택. "링크"는 지금까지의 항목이고, "공유 계정"은 접속 방식이 `shared-credential`인 항목이다. 저장되는 칸은 기존 `type`과 `access_method`이며 새 칸이 아니다.
- **비밀번호 숨기기(hide_password)**: 항목 단위의 새 표식. 켜져 있으면 담당자와 콘솔 관리자가 아닌 사람은 비밀번호를 볼 수 없고 복사만 할 수 있다.
- **편집 권한자**: 콘솔 관리자 또는 항목 담당자(SPEC-CONSOLE-001 REQ-CON-010). 이 SPEC에서 "숨기기 예외 대상"과 "사용 기록 열람자"는 모두 편집 권한자와 같은 사람이다.
- **자격증명 사건**: 기존 콘솔 감사 기록 중 `credential.view`, `credential.copy`, `credential.deny`, `credential.rate_limited` 동작.
- **자동 입력 끄기 안내**: 브라우저의 비밀번호 저장 제안과 자동 로그인·자동 완성을 끄는 방법을 알려 주는 팝업.

## 3. 요구사항 (GEARS)

### 3.1 서버와 데이터 (M1)

**REQ-CS2-001** — The console item model shall carry an optional boolean `hide_password` whose absence on a stored item means `false`. When an item is created or updated, the server shall reject a non-boolean `hide_password` as invalid input (400), and shall store `false` whenever the item's access method is not `shared-credential`. Every item in list and bootstrap payloads shall carry `hide_password` as a boolean.

**REQ-CS2-002** — The item export shall include `hide_password` as a boolean flag and no credential value. When an import file item carries `hide_password`, the server shall accept a boolean and treat absence as `false`; when it carries a non-boolean value, the server shall reject the whole import as invalid (400) and shall change no stored document.

**REQ-CS2-003** — The credential endpoint shall continue to accept the purposes `view` and `copy`, shall record them as the distinct audit actions `credential.view` and `credential.copy`, and shall apply the existing Origin check, visibility gate, per-user reveal cap, and audit-before-reveal rule (503 with no value when the audit write fails) to both purposes unchanged.

**REQ-CS2-004** — When a user who is neither a console admin nor an owner of the item requests the `password` field with purpose `view` from an item whose `hide_password` is `true`, the server shall answer 403 with `{ "error": "reveal_hidden" }`, shall return no value, and shall record a `credential.deny` audit entry whose reason is `reveal_hidden`. The same request with purpose `copy` shall be decided by the existing gates alone, and the `login_id` field shall not be affected by `hide_password`.

**REQ-CS2-005** — The console shall provide a per-item activity endpoint that answers only console admins and owners of the item (403 for any other signed-in user, 401 without a session, 404 for an unknown or deleted item) with at most the 20 most recent credential events of that item, newest first, each giving the actor's display name (from the people directory, otherwise the email), the action, the field, the time, and the denial reason where one exists. The response shall contain no credential value and shall be marked non-cacheable.

**REQ-CS2-006** — The console shall keep one autofill-guide acknowledgement per signed-in user, keyed by email on the server, holding only the email, the guide version, and the acknowledgement time. When a signed-in user acknowledges the guide, the server shall record it (Origin-checked, idempotent), and the bootstrap payload shall tell that user whether they have acknowledged the current guide version without changing the existing `me` object, so that the acknowledgement follows the person across browsers and devices.

### 3.2 화면 — 스크롤바 (M2)

**REQ-CS2-007** — While a console screen (the console app or the console sign-in page) is mounted, the console shall style the page scrollbar and every inner scroll area of the console (navigation, list, detail panel, dialogs) as a thin light scrollbar with track `#f2efe8` or transparent and thumb `#d6d0c4`, using a thumb hover color `#bdb5a6` where the browser supports a hover state, with fixed color literals only.

**REQ-CS2-008** — The console scrollbar styles shall apply only while a console screen is mounted, so that the public site and `/admin` keep the site-wide scrollbar colors unchanged.

### 3.3 화면 — 추가·편집 양식 (M2)

**REQ-CS2-009** — The item create and edit form shall show at its top a two-choice kind control, 링크 / 공유 계정 (Link / Shared account), exposed as a radio group, with the category selector directly below it. When the user selects 공유 계정, the form shall set the item type to `account` and the access method to `shared-credential`. When the user selects 링크 after 공유 계정, the form shall restore the type and access method the form last held while it was on 링크; where the form has never been on 링크 (a new item, or an existing item that opened on 공유 계정), it shall use the type `link` and the access method `public`. When an existing item is edited, the form shall open on 공유 계정 exactly when the item's access method is `shared-credential`. When the user saves an existing item that has a stored login ID or password while the kind control is on 링크, the form shall first ask for confirmation, stating that the stored login ID and password will be deleted permanently, and shall send no request when the user cancels.

**REQ-CS2-010** — While the kind control is on 공유 계정, the form shall show without the "더 보기" toggle: the login address (the item address), the login ID, the password (masked, with an eye toggle and a 생성 generate button), a memo (the item description, with a hint that it is visible to everyone who can see the item and must not hold a password), a share-target radio group 전체 멤버 / 우리 팀 / 나만(비공개) mapped to the visibility values 전체 / 팀 / 본인, and a checkbox 멤버에게 비밀번호 숨기기 (복사만 허용) mapped to `hide_password`. While the kind control is on 링크, the form shall keep the current fields, and the access-method choices under "더 보기" shall not include `shared-credential`.

**REQ-CS2-011** — When the user presses 생성, the form shall fill the password field with a 20-character password drawn with a cryptographically secure random source, containing at least one lowercase letter, one uppercase letter, one digit, and one symbol, without modulo bias.

**REQ-CS2-012** — Where the user is a console admin, the form's category selector shall end with the option "+ 새 분류 만들기…", and the navigation's category heading shall carry a "+" button; both shall open the existing category dialog. When a category is added from the form, the form shall select it while keeping every other entered value; when the dialog is cancelled, the form shall restore the previous category. Users who are not console admins shall see neither control.

### 3.4 화면 — 공유 계정 상세 (M2)

**REQ-CS2-013** — While the detail panel shows a shared-credential item that the viewer may access and that has a stored login ID or password, the panel shall show a credential card with the rows 로그인 주소 / 아이디 / 비밀번호 and the actions 아이디 복사, 비밀번호 복사, and a 보기 eye toggle. Copy actions shall request the value with purpose `copy`, write it to the clipboard, and shall not render it in the page or keep it in component state. The 보기 toggle shall not be offered for the password while `hide_password` is `true` and the viewer is not an editor of the item.

**REQ-CS2-014** — When the viewer presses 로그인 열기 on a credential card with a login address, the console shall copy the login ID (purpose `copy`) to the clipboard, show the toast "아이디를 복사했어요 — 비밀번호 복사 후 붙여넣으세요", and open the login address in a new tab without giving the new tab a reference to the console and without sending the console address as the referrer. When the browser blocks the new tab, the console shall show a link to the login address in its place; when the new tab opens, the console shall not show that link.

**REQ-CS2-015** — When a shared-credential item has neither a stored login ID nor a stored password, the detail panel shall show the empty state "아직 계정 정보가 없어요", and for editors an "계정 정보 입력" button that opens the edit form focused on the login ID field.

**REQ-CS2-016** — Where the viewer is an editor of a shared-credential item, the detail panel shall offer a 사용 기록 section that, when opened, loads and lists the item's credential events from the activity endpoint (who, view / copy / denied, when); viewers who are not editors shall not see the section.

**REQ-CS2-017** — While the 공유 계정 view of the navigation is open, every listed item shall show whether its account information is set (login ID or password stored) or not.

### 3.5 화면 — 자동 입력 끄기 안내 (M2)

**REQ-CS2-018** — When a signed-in user has not acknowledged the current autofill guide, the console shall show the autofill-guide dialog once after the console loads, with the buttons 확인했어요 and 나중에. When the user presses 확인했어요, the console shall record the acknowledgement on the server and shall not show the dialog automatically again to that user; when the user presses 나중에, the console shall not show it automatically again in the same browser session. The dialog shall be re-openable at any time from the account menu entry "자동 입력 끄기 안내" and from the credential card.

**REQ-CS2-019** — The autofill-guide dialog shall detect the browser from the user agent (Chrome, Edge, Whale, Safari, Firefox; desktop or mobile; otherwise a generic guide) and shall show numbered steps for that browser to turn off password-save offers and automatic sign-in or autofill. Where the browser is a desktop browser with a known settings address, the primary button 설정 화면 열기 shall copy that address to the clipboard and tell the user to paste it into the address bar; on Safari and on mobile browsers the dialog shall show the menu path instead of a copy button. The dialog shall state that the site cannot change browser settings itself.

**REQ-CS2-020** — Every credential input the console renders shall carry `autocomplete="off"`, `data-1p-ignore`, and `data-lpignore="true"`, and when the console copies a credential value it shall not place that value in any visible element; any temporary copy element shall be invisible, hidden from assistive technology, and removed in the same task.

### 3.6 화면 — 공통 (M2)

**REQ-CS2-021** — Every new interface string shall be defined under the same key in Korean and English. The kind control, share-target group, and checkbox shall be operable by keyboard and announced with their labels by screen readers, every icon-only button shall carry an accessible label, opening or closing new sections shall not shift the layout of the content above them, and the form, credential card, and autofill dialog shall fit a 375 px wide viewport without horizontal scrolling.

## 4. 제약

- SPEC-CONSOLE-001의 요구사항(특히 REQ-CON-014~018 자격증명 암호화·노출 금지·열람 규칙·기록)은 그대로 유지한다. 이 SPEC은 그 위에 얹는 변경이다.
- 기존 인프라만 쓴다(Vercel, Vercel Blob, 기존 Google OAuth). 신규 유료 구독·종량제 서비스 없음.
- 공개 저장소다. 비밀값 리터럴과 `process.env.X ?? '<literal>'` 형태의 폴백을 쓰지 않는다. 테스트와 문서에 직원 이름, 실제 email, Drive·Sheet·Slack id, 내부 주소를 넣지 않는다. 테스트 데이터는 `a@try-n.com` 같은 지어낸 주소를 쓴다(`.claude/rules/daerachoen-constitution.md`).
- `dark-theme.css`가 토큰 의미를 뒤집고 `globals.css`가 사이트 전체 스크롤바를 어둡게 칠한다. 콘솔은 자체 범위 스타일과 고정 hex만 쓴다. 공용 스타일 파일(`globals.css`, `dark-theme.css`)은 고치지 않는다.
- 외부 CDN 자산 금지(헌법 불변 원칙). 비밀번호 생성기와 브라우저 판별은 외부 라이브러리 없이 구현한다.
- 직원 화면은 단순하게(오너 피드백): 양식 첫 화면은 짧게 두고 부수 기능은 "더 보기"나 펼침 섹션에 둔다.
- 안내 확인 표시는 직원 email을 담으므로 다른 콘솔 문서와 같은 비밀 Blob prefix 아래에 둔다. SPEC-CONSOLE-001 §4 "저장 한계"(공개 접근 Blob + 비밀 prefix 보호)가 이 문서에도 똑같이 적용된다.

## 5. 범위 제외

### Out of Scope — TeamPassword 기능 중 이번에 하지 않는 것

- 브라우저 확장 프로그램을 통한 자동 입력(콘솔이 로그인 칸을 대신 채워 주는 기능)
- 외부인에게 보내는 일회용 공유 링크
- 비밀번호 변경 주기 알림과 오래된 비밀번호 경고
- 첨부 파일 보관
- TOTP(2단계 인증 코드) 보관과 생성
- 기존 팀(한국팀·방글라데시팀·공통)을 넘는 그룹 기능과 사용자·그룹 관리 화면

### Out of Scope — 보안 수준

- 비밀번호를 멤버 브라우저에 전달하지 않는 방식(대리 로그인, 서버 측 세션 주입 등) — 이번 판의 "복사만 허용"은 화면 수준 장치다(§1.1)
- 멤버가 브라우저 설정을 실제로 껐는지 검증하는 기능 — 웹 페이지로는 할 수 없다
- 클립보드 자동 비우기 — SPEC-CONSOLE-001에서 뺀 결정을 유지한다

### Out of Scope — 화면

- 공개 사이트와 `/admin`의 스크롤바 디자인 변경
- 콘솔 다크 테마
- 사용 기록의 기간 거르기, 내보내기, 20건 넘는 페이지 넘김

## 6. 추적성

인수 기준 본문(Given-When-Then)은 acceptance.md에 있다. 21개 요구사항이 모두 하나 이상의 기준에 걸린다.

| 인수 기준 | 검증하는 요구사항 | 마일스톤 |
|---|---|---|
| AC-CS2-001 | REQ-CS2-001 | M1 |
| AC-CS2-002 | REQ-CS2-001, REQ-CS2-002 | M1 |
| AC-CS2-003 | REQ-CS2-003 | M1 |
| AC-CS2-004 | REQ-CS2-004 | M1 |
| AC-CS2-005 | REQ-CS2-005 | M1 |
| AC-CS2-006 | REQ-CS2-006 | M1 |
| AC-CS2-007 | REQ-CS2-007 | M2 |
| AC-CS2-008 | REQ-CS2-008 | M2 |
| AC-CS2-009 | REQ-CS2-009 | M2 |
| AC-CS2-010 | REQ-CS2-010 | M2 |
| AC-CS2-011 | REQ-CS2-011 | M2 |
| AC-CS2-012 | REQ-CS2-012 | M2 |
| AC-CS2-013 | REQ-CS2-013 | M2 |
| AC-CS2-014 | REQ-CS2-014 | M2 |
| AC-CS2-015 | REQ-CS2-015 | M2 |
| AC-CS2-016 | REQ-CS2-016 | M2 |
| AC-CS2-017 | REQ-CS2-017 | M2 |
| AC-CS2-018 | REQ-CS2-018 | M2 |
| AC-CS2-019 | REQ-CS2-019 | M2 |
| AC-CS2-020 | REQ-CS2-020 | M2 |
| AC-CS2-021 | REQ-CS2-021 | M2 |
| AC-CS2-022 | REQ-CS2-003, REQ-CS2-004, REQ-CS2-013 | M2 |
