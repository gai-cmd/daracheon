---
id: SPEC-CONSOLE-002
title: "팀 콘솔 공유 계정 정비 — 양식 종류 선택, 비밀번호 숨김 공유, 사용 기록, 자동 입력 끄기 안내, 콘솔 스크롤바, 보기 전환, 영문 모드, 채널 새 소식"
version: "0.5.0"
status: in-progress
created: 2026-11-15
updated: 2026-11-15
author: manager-spec
priority: P1
phase: "v1.2.0 target"
module: "src/app/console, src/app/api/console, src/lib/console"
lifecycle: spec-anchored
tags: "console, shared-account, credentials, hide-password, audit, autofill, scrollbar, i18n, a11y, view-toggle, english-mode, channel-feed, ssrf"
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
| 0.4.0 | 2026-11-15 | manager-spec | plan-audit 3차(FAIL 0.93) 반영, 리드가 이 수정으로 3차를 수용(재감사 없음). CS2-PA-R3-D1: REQ-CS2-020을 칸별로 나눔 — 아이디 칸 `autocomplete="off"`, 비밀번호 칸 `autocomplete="new-password"` 유지(같은 출처 `/admin/login`의 저장된 비밀번호가 공유 계정 양식에 채워지는 위험), 두 칸 모두 `data-1p-ignore`·`data-lpignore="true"`. §1.1 한계 문장, design.md §2.7, AC-CS2-020(칸별 판정 + 같은 출처 저장 비밀번호 브라우저 확인), research.md §2.6·§4 함께 고침. CS2-PA-R3-D2: AC-CS2-014 Chrome 조건을 "Chrome 기본 설정(팝업 차단 켜짐, 이 사이트 예외 없음)"으로 고침. 요구사항·인수 기준 번호는 바꾸지 않음 |
| 0.5.0 | 2026-11-15 | manager-spec | 추가분(addendum). 운영 중인 콘솔을 본 오너의 후속 요청 3건(2026-11-15: 목록·카드 두 가지 보기, 영문일 때 양식·이름도 영문, 홈 "최근 업데이트"를 채널별 썸네일로)과 M2 감사의 작은 결함 2건을 리드가 정한 범위로 반영. M3(보기 전환 REQ-CS2-022~024, 영문 모드 025~027, 작은 수정 028~029)와 M4(채널 새 소식 030~038)를 더함. 인수 기준 AC-CS2-023~040. 기존 요구사항·인수 기준 001~022의 번호와 본문은 바꾸지 않음. 리드가 별도 감사 회차 없이 수용(progress.md §E.1), 구현 뒤 sync-auditor 관문은 그대로 |

## 1. 배경과 목적

SPEC-CONSOLE-001로 `/console`이 운영 중이다. 오너가 실제로 써 보고 세 가지를 짚었다.

1. 오른쪽 세로 스크롤바가 사이트 공용 스타일(어두운 트랙 + 금색 막대)을 그대로 받아 콘솔의 밝은 스튜디오 톤과 어긋난다. 원인은 `src/styles/globals.css`의 `html` `scrollbar-color`와 `::-webkit-scrollbar` 규칙이다.
2. 항목 추가 화면이 링크 카드만 만드는 것처럼 보인다. 공유 계정 기능은 이미 있지만, 접속 방식과 공개 범위가 "더 보기" 안에 있고 접속 방식을 "공유 계정"으로 바꿔야 아이디·비밀번호 칸이 나타나서 오너가 찾지 못했다. 분류를 새로 만드는 길도 양식에서 보이지 않는다.
3. 목적은 TeamPassword 수준의 최소 기능이다. 회사가 운영하는 사이트의 로그인을 콘솔에 맡겨 두고, 멤버는 비밀번호를 몰라도 그 사이트에 들어갈 수 있어야 한다.

이어서 오너는 "각자의 컴퓨터에 자동 입력 기능을 끄라는 팝업과, 어디로 가야 하는지 해당 설정 화면으로 안내"를 요청했다. 멤버가 공유 비밀번호를 붙여 넣을 때 브라우저가 저장을 제안하면, 나중에 브라우저 비밀번호 관리자에서 그 값을 그대로 읽을 수 있기 때문이다.

### 1.1 솔직한 한계 (요구사항이 약속하지 않는 것)

- **복사만 허용은 화면 수준의 장치다.** "비밀번호 숨기기"를 켜도 복사하는 순간 비밀번호는 멤버의 브라우저와 클립보드로 간다. 붙여 넣은 칸을 개발자 도구로 보거나 다른 곳에 붙여 넣으면 값을 알 수 있다. 암호학적 비밀 유지가 아니라 "화면에 보여 주지 않고, 누가 언제 복사했는지 남기는" 장치다.
- **이 사이트는 브라우저 설정을 바꿀 수 없다.** 웹 페이지는 `chrome://`, `edge://`, `about:` 같은 내부 설정 주소로 이동할 수 없다. 콘솔은 안내하고, 설정 주소를 복사해 주고, 멤버가 확인했다는 표시를 받을 뿐이다. 멤버가 실제로 껐는지는 확인할 수 없다.
- **입력 칸 속성은 권고일 뿐이다.** 브라우저는 로그인·비밀번호 칸의 `autocomplete="off"`를 따르지 않을 수 있다. 그래서 비밀번호 칸은 이 사이트에 저장된 다른 비밀번호가 채워지지 않도록 `autocomplete="new-password"`로 둔다. 그래도 브라우저가 속성을 무시하고 채우거나 저장을 제안할 수 있다. 그래서 안내 팝업이 필요하다.

### 1.2 후속 요청 (0.5.0 추가분, M3·M4)

오너가 운영 중인 콘솔을 보고 2026-11-15에 세 가지를 더 요청했다.

1. **보기 전환** — "리스트 형식과 카드 형식으로 뷰를 2가지 타입으로 해줘." 지금 목록 보기는 SPEC-CONSOLE-001 REQ-CON-020의 "한 가지 높이의 넉넉한 목록 행"뿐이고 카드 격자는 없다(research.md §5.1). 이 추가분은 목록 보기에 한해 REQ-CON-020의 단일 밀도 조항을 대신해 목록·카드 두 방식을 둔다.
2. **영문 모드** — "영문일 때는 여기도 영문으로 해야지." 영어 화면에서도 추가·편집 양식이 한국어 칸을 주 입력으로 보여 주고, 계정 칩과 담당자 이름이 한국어로 나온다.
3. **채널 새 소식** — "최근 업데이트는 리스트가 아니라 동영상이나 썸네일로 알 수 있게, 채널별로 올라오는 것을 구별되도록." 홈의 "최근 수정된 항목" 목록을 회사 채널(유튜브, 자사 블로그, 네이버 블로그, 그 밖의 RSS, 인스타그램)의 최신 글 썸네일 격자로 바꾼다.

함께 M2 감사가 짚은 작은 결함 두 가지(안내 단계에 번호가 보이지 않음, 공유 계정 설명이 "사용자 이름"이라 부르고 비밀번호를 볼 수 있다고 약속함)를 고친다.

솔직한 한계(추가분):

- **채널 캐시는 서버 인스턴스마다 따로다.** 서버 메모리 캐시라 인스턴스가 새로 뜨면 첫 요청이 다시 가져온다. 별도 저장소나 예약 작업은 두지 않는다(§5).
- **유튜브 채널 RSS는 2026-11-15 확인 시점에 응답하지 않았다.** 공개 채널 5곳의 피드 주소가 모두 404였다(research.md §6.1). 그래서 피드를 가져오지 못한 채널은 항목 대신 그 채널로 가는 링크 타일을 보인다(REQ-CS2-035). 유튜브 피드가 다시 응답하면 코드 변경 없이 썸네일이 나온다.
- **썸네일은 우리 서버를 거친다.** 외부 이미지를 브라우저가 직접 불러오지 않게 하려는 것(헌법 "외부 CDN 의존 금지")이며, 원본 사이트가 막거나 지우면 기본 그림이 보인다.

## 2. 용어

- **종류(kind of entry)**: 양식 맨 위의 두 갈래 선택. "링크"는 지금까지의 항목이고, "공유 계정"은 접속 방식이 `shared-credential`인 항목이다. 저장되는 칸은 기존 `type`과 `access_method`이며 새 칸이 아니다.
- **비밀번호 숨기기(hide_password)**: 항목 단위의 새 표식. 켜져 있으면 담당자와 콘솔 관리자가 아닌 사람은 비밀번호를 볼 수 없고 복사만 할 수 있다.
- **편집 권한자**: 콘솔 관리자 또는 항목 담당자(SPEC-CONSOLE-001 REQ-CON-010). 이 SPEC에서 "숨기기 예외 대상"과 "사용 기록 열람자"는 모두 편집 권한자와 같은 사람이다.
- **자격증명 사건**: 기존 콘솔 감사 기록 중 `credential.view`, `credential.copy`, `credential.deny`, `credential.rate_limited` 동작.
- **자동 입력 끄기 안내**: 브라우저의 비밀번호 저장 제안과 자동 로그인·자동 완성을 끄는 방법을 알려 주는 팝업.
- **보기 방식(view mode)**: 항목 목록을 그리는 방식. "목록"(한 줄 행)과 "카드"(같은 높이 카드 격자) 두 가지 (0.5.0).
- **항목 목록 보기**: 항목을 나열하는 화면. 전체 항목, 위키, 분류, 공유 계정, 내 항목, 검색 결과, 홈의 "최근 수정한 카드" 펼침. 홈의 고정 칩과 분류별 요약은 항목 목록 보기가 아니다 (0.5.0).
- **채널**: 홈 "채널 새 소식"에 글을 보여 주는 외부·내부 출처 한 곳. 종류는 `youtube`, `naver`, `rss`, `zoellife-blog`, `instagram` (0.5.0).
- **링크 타일**: 글 대신 채널 공개 주소로만 이어지는 타일. 인스타그램 채널과 가져오기에 실패한 채널에 쓴다 (0.5.0).

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

**REQ-CS2-020** — The login-ID input the console renders shall carry `autocomplete="off"`, the password input the console renders shall carry `autocomplete="new-password"`, and both inputs shall carry `data-1p-ignore` and `data-lpignore="true"`; when the console copies a credential value it shall not place that value in any visible element; any temporary copy element shall be invisible, hidden from assistive technology, and removed in the same task.

### 3.6 화면 — 공통 (M2)

**REQ-CS2-021** — Every new interface string shall be defined under the same key in Korean and English. The kind control, share-target group, and checkbox shall be operable by keyboard and announced with their labels by screen readers, every icon-only button shall carry an accessible label, opening or closing new sections shall not shift the layout of the content above them, and the form, credential card, and autofill dialog shall fit a 375 px wide viewport without horizontal scrolling.

### 3.7 화면 — 보기 전환 (M3, 0.5.0)

**REQ-CS2-022** — The console shall show, in the header of every item list view (all items, Wiki, a category, shared accounts, my items, search results, and the home's recent-edits list of REQ-CS2-037), a two-choice view control 목록 / 카드 (List / Cards) exposed as a radio group with an accessible name, operable with the arrow, Home and End keys, with only the selected choice in the tab order. When the user changes the choice, the console shall re-render that list in the chosen mode without moving the list header, the toolbar, or any content above the list. The home's pinned chips and per-category summary are not item lists and shall keep their current form without the control.

**REQ-CS2-023** — While the view mode is 목록, the console shall show each item as one compact row carrying the brand icon, the title, one secondary line (the item's description in the current language, or the address host when the description is empty), the owner, and at most two direct actions (열기 and 편집) besides the existing overflow menu. While the view mode is 카드, the console shall show each item as a card in a grid in which every card of a grid row has the same height, carrying the brand icon, the title (at most two lines), the description (at most two lines), the category, the access label of REQ-CON-020 where one exists, the owner, one direct action 열기 where the item has an address, and the overflow menu; selecting a card's title shall open the detail panel as a row's title does. Both modes shall show the same items in the same order, shall show the account-information state of REQ-CS2-017 in the shared accounts view, and shall keep the existing filter, sort, pin, edit and delete behaviour.

**REQ-CS2-024** — The console shall remember one view mode per browser in local storage for all item list views, and where local storage is unavailable, throws, or holds no valid value, it shall use 카드 when the viewport is wider than 480 px and 목록 when it is 480 px wide or narrower, without failing. When an item list first renders, it shall render in the remembered or default mode, so that the list does not switch modes after its first paint.

### 3.8 화면 — 영문 모드와 작은 수정 (M3, 0.5.0)

**REQ-CS2-025** — While the interface language is English, the item create and edit form shall present the English side of every Korean/English text pair of the item (`title_en`, `description_en`, `note_en`, and each link's `label_en`) as the primary input in the place the Korean input occupies in Korean mode, shall move the Korean inputs into the "More options" section under a "Korean text" group, and, where an English input is empty and its Korean counterpart is not, shall show the Korean value as that input's placeholder. When the user saves in English mode with an empty Korean title, the form shall send the English title as the Korean title as well; when both titles are empty, the form shall show the required-title error on the English title input and shall send no request. While the interface language is Korean, the form shall keep its current layout.

**REQ-CS2-026** — While the interface language is English, the console shall show every item, category and link text in English with the Korean text as fallback when the English text is empty, and shall show people by their English name — the account chip, its avatar initials, item owners in rows, cards and the detail panel, and the people suggestions of the owner input — falling back to the Korean name and then to the email when the English name is empty. The owner input shall accept an English name and resolve it to the same person, and the `me` object of the bootstrap payload shall not change.

**REQ-CS2-027** — The console screens under `src/app/console` shall take every user-facing string from the console text table, and a unit test shall fail when a `.tsx` file there carries a string literal, template literal, or JSX text containing Hangul outside comments, except entries on an explicit allowlist that names each exception and its reason (stored data values such as team and visibility names, the language selector's native language names, and page metadata); the test shall also fail when an allowlist entry no longer matches any source text.

**REQ-CS2-028** — The autofill-guide dialog shall display its steps with visible decimal numbers in both languages.

**REQ-CS2-029** — The shared-accounts view description and the shared-credential access note shall call the login ID 아이디 (login ID in English) and shall describe copying the login ID and password to sign in without stating that the password can be viewed; the Korean view description shall read "팀이 함께 쓰는 로그인이에요. 항목을 열어 아이디와 비밀번호를 복사해 로그인하세요." and the English one "Logins the team shares. Open an item to copy the login ID and password and sign in."

### 3.9 채널 새 소식 (M4, 0.5.0)

**REQ-CS2-030** — The console shall store the channel list as data in the console settings document, as at most 12 entries each holding an id, a label, an optional English label, a kind (`youtube`, `naver`, `rss`, `zoellife-blog`, `instagram`), a source, a color, an enabled flag and an order, and shall let only console admins read and replace it, through an Origin-checked request audited as a settings update. When an admin saves the list, the server shall reject the whole list with 400 and store nothing when any entry breaks its kind's rule — a `youtube` source matching `^UC[\w-]{22}$`, a `naver` source matching `^[a-z0-9_-]{1,40}$`, an `rss` or `instagram` source being an `https:` URL without user name or password, a `zoellife-blog` source being empty — or carries a color other than `#rrggbb`, an empty or over-40-character label, or a duplicate id, or when the list has more than 12 entries. Replacing the channel list shall leave the team pins unchanged. The admin tools shall offer a channel editor with one row per channel (kind, label, English label, source, color, on/off, move up/down).

**REQ-CS2-031** — The console shall provide a feed endpoint that answers 401 without a console session and otherwise returns `{ channels, items }`: one channel entry per enabled channel in configured order (id, label, English label, color, kind, a public home address, `ok`, and an `error` code when `ok` is false) and at most 6 items per channel (channel id, title, address, publication time, thumbnail address or null), all items sorted newest first. When one channel's source fails — network error, timeout, non-2xx status, oversized body, rejected redirect, or unparseable content — the endpoint shall mark only that channel `ok: false` and shall still return every other channel's items with status 200.

**REQ-CS2-032** — The feed endpoint shall cache each source's result in server memory, keyed by the channel's kind and source, for 30 minutes after a success and 5 minutes after a failure, shall not fetch a source again while its cache entry is fresh, shall fetch a source anew when its kind or source changes, and shall mark its response `Cache-Control: private, max-age=1800`.

**REQ-CS2-033** — When the console fetches a feed or a thumbnail, it shall request only `https:` addresses whose host is on that request's allowlist, shall reject an address whose host is an IP literal or `localhost` or resolves to a private, loopback, link-local or metadata address, shall follow at most one redirect and only to an address that passes the same checks, shall abort after 5 seconds, shall stop reading and fail when the body exceeds its size cap (1 MB for a feed, 2 MB for a thumbnail), and shall send neither cookies nor a Referer header. The feed allowlist shall be `www.youtube.com` for `youtube`, `rss.blog.naver.com` for `naver`, and the configured URL's own host for `rss`.

**REQ-CS2-034** — The feed parser shall read YouTube channel Atom feeds, Naver blog RSS feeds, generic RSS 2.0 feeds and generic Atom feeds without a new dependency, shall decode CDATA sections and XML character entities, shall ignore any document type declaration without expanding its entities, and shall take the title as plain text (tags removed, at most 200 characters), the address from the RSS `link` or the Atom `link rel="alternate"` (otherwise the first `link`), the publication time from `pubDate`, `published` or `updated`, and the thumbnail from `media:thumbnail`, then an image-typed `media:content` or `enclosure`, then the first `<img src>` in the item description. The parser shall drop items whose address is not `http:` or `https:`, and shall keep items with an unreadable date and sort them after dated items.

**REQ-CS2-035** — For a `zoellife-blog` channel, the feed endpoint shall take the 6 newest published posts from the site's own blog store without an outbound request, each addressed as the same-origin path `/blog/<slug>` with its cover image as thumbnail. For an `instagram` channel, it shall make no request and return the channel with `ok: true` and no items, and the home shall show a link tile to the configured profile. Where a channel has `ok: false`, the home shall show one link tile to that channel's public home address in place of its items.

**REQ-CS2-036** — The console shall provide a thumbnail endpoint that answers 401 without a console session, accepts one `u` parameter of at most 2048 characters, and returns the image only when `u` passes REQ-CS2-033 against the thumbnail allowlist — `i.ytimg.com`, `i1.ytimg.com` to `i9.ytimg.com`, `img.youtube.com`, any host under `pstatic.net`, the site's own public Blob host as resolved by `src/lib/db.ts`, and the hosts of enabled `rss` channels — and the upstream answers 2xx with a `Content-Type` of `image/*` other than `image/svg+xml`; the success response shall carry that content type, `X-Content-Type-Options: nosniff` and `Cache-Control: private, max-age=86400`. When any check fails, the endpoint shall return a bundled neutral placeholder image with `Cache-Control: private, max-age=300`. The feed endpoint shall emit a thumbnail address only as this endpoint's path and only for image addresses on the allowlist, so that the browser loads no feed image from an external host.

**REQ-CS2-037** — The home shall replace its recently-updated item list with a 채널 새 소식 (Channel updates) section holding one row of filter chips (전체 / All plus one chip per enabled channel, exposed as a radio group) above a grid of tiles, each tile showing a 16:9 thumbnail or a neutral placeholder, a channel badge with that channel's color and label, the title in at most two lines, and the date, and opening the post in a new tab with `rel="noopener noreferrer"`. The 전체 chip shall show the 12 newest tiles across channels and a channel chip that channel's tiles. The section shall reserve its space while the feed loads, shall show a short empty-state message when no channel is enabled (with a 채널 관리 button for admins), and shall fit a 375 px viewport in two columns without page-level horizontal scrolling. The previous recent-edits list shall stay reachable through a "최근 수정한 카드 보기 / Recently edited cards" control in that section that expands the list in place.

**REQ-CS2-038** — Every interface string added by M3 and M4 shall be defined under the same key in Korean and English; the view control and the channel chips shall be operable by keyboard and announced with their labels; every icon-only control shall carry an accessible label; and the channel badge text shall have a contrast ratio of at least 4.5:1 against the channel color.

## 4. 제약

- SPEC-CONSOLE-001의 요구사항(특히 REQ-CON-014~018 자격증명 암호화·노출 금지·열람 규칙·기록)은 그대로 유지한다. 이 SPEC은 그 위에 얹는 변경이다.
- 기존 인프라만 쓴다(Vercel, Vercel Blob, 기존 Google OAuth). 신규 유료 구독·종량제 서비스 없음.
- 공개 저장소다. 비밀값 리터럴과 `process.env.X ?? '<literal>'` 형태의 폴백을 쓰지 않는다. 테스트와 문서에 직원 이름, 실제 email, Drive·Sheet·Slack id, 내부 주소를 넣지 않는다. 테스트 데이터는 `a@try-n.com` 같은 지어낸 주소를 쓴다(`.claude/rules/daerachoen-constitution.md`).
- `dark-theme.css`가 토큰 의미를 뒤집고 `globals.css`가 사이트 전체 스크롤바를 어둡게 칠한다. 콘솔은 자체 범위 스타일과 고정 hex만 쓴다. 공용 스타일 파일(`globals.css`, `dark-theme.css`)은 고치지 않는다.
- 외부 CDN 자산 금지(헌법 불변 원칙). 비밀번호 생성기와 브라우저 판별은 외부 라이브러리 없이 구현한다.
- 직원 화면은 단순하게(오너 피드백): 양식 첫 화면은 짧게 두고 부수 기능은 "더 보기"나 펼침 섹션에 둔다.
- 안내 확인 표시는 직원 email을 담으므로 다른 콘솔 문서와 같은 비밀 Blob prefix 아래에 둔다. SPEC-CONSOLE-001 §4 "저장 한계"(공개 접근 Blob + 비밀 prefix 보호)가 이 문서에도 똑같이 적용된다.
- (0.5.0) 이 추가분은 SPEC-CONSOLE-001 REQ-CON-020의 두 조항을 바꾼다. "한 가지 높이의 넉넉한 목록 행"은 목록 보기에서 목록·카드 두 방식(REQ-CS2-022~024)으로, 홈의 "최근 수정된 항목"은 "채널 새 소식"과 그 안의 펼침(REQ-CS2-037)으로 바뀐다. REQ-CON-020의 나머지 조항(왼쪽 메뉴, 오른쪽 상세 패널, 거르기, 연필 편집, 접속 방식 표시)은 그대로다.
- (0.5.0) 채널 목록은 코드가 아니라 데이터다. 실제 채널 id·블로그 id·피드 주소·프로필 주소를 콘솔 코드(`src/lib/console`, `src/app/console`, `src/app/api/console`), 그 테스트, 이 SPEC 문서에 적지 않는다(공개 사이트 코드에 이미 있는 회사 공개 채널 주소는 이 SPEC의 범위가 아니다). 테스트는 `UCfake`로 시작하는 지어낸 유튜브 id와 `fake`로 시작하는 블로그 id, `example.com`·`example.org` 주소만 쓴다. 로컬 확인으로 생긴 `data/db/console-settings.json`은 커밋하지 않는다.
- (0.5.0) 외부 요청은 무료 공개 피드만 쓴다. API 키, 유료 API, 스크래핑은 쓰지 않는다. XML 파서 같은 새 의존성은 들이지 않는다(research.md §5.6).
- (0.5.0) 외부 피드의 제목·주소는 글자로만 그린다. 피드가 준 HTML은 화면에 넣지 않는다.

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

### Out of Scope — 보기 전환·영문 모드 (M3)

- 목록·카드 외의 세 번째 보기(표, 촘촘한 밀도 등)와 보기별 칸 고르기
- 보기 방식을 서버에 사람별로 저장하는 기능(브라우저마다 기억한다)
- 홈 고정 칩과 분류별 요약의 모양 변경
- 기존 항목의 영문 칸 자동 번역
- 사람 목록·분류에 새 영문 칸 추가(이미 있는 `name_en`·`short_en` 등만 쓴다)

### Out of Scope — 채널 새 소식 (M4)

- 유료 API와 API 키가 필요한 공식 API(유튜브 Data API 등)
- 인스타그램 게시물 가져오기와 스크래핑 — 인스타그램은 링크 타일만 둔다
- 서버 예약 작업(cron)으로 미리 가져오기, 캐시를 Blob 같은 저장소에 두기
- 새 글 알림(푸시·이메일·슬랙)
- 채널 순서를 끌어서 바꾸기(위·아래 버튼만 둔다)
- 영상 재생기 임베드 — 타일을 누르면 새 탭으로 연다

## 6. 추적성

인수 기준 본문(Given-When-Then)은 acceptance.md에 있다. 38개 요구사항이 모두 하나 이상의 기준에 걸린다(0.5.0: REQ-CS2-022~038, AC-CS2-023~040 추가).

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
| AC-CS2-023 | REQ-CS2-022 | M3 |
| AC-CS2-024 | REQ-CS2-023 | M3 |
| AC-CS2-025 | REQ-CS2-024 | M3 |
| AC-CS2-026 | REQ-CS2-025 | M3 |
| AC-CS2-027 | REQ-CS2-026 | M3 |
| AC-CS2-028 | REQ-CS2-027 | M3 |
| AC-CS2-029 | REQ-CS2-028 | M3 |
| AC-CS2-030 | REQ-CS2-029 | M3 |
| AC-CS2-031 | REQ-CS2-030 | M4 |
| AC-CS2-032 | REQ-CS2-031 | M4 |
| AC-CS2-033 | REQ-CS2-032 | M4 |
| AC-CS2-034 | REQ-CS2-033 | M4 |
| AC-CS2-035 | REQ-CS2-034 | M4 |
| AC-CS2-036 | REQ-CS2-035 | M4 |
| AC-CS2-037 | REQ-CS2-036 | M4 |
| AC-CS2-038 | REQ-CS2-037 | M4 |
| AC-CS2-039 | REQ-CS2-038 | M3, M4 |
| AC-CS2-040 | REQ-CS2-030, REQ-CS2-035, REQ-CS2-036, REQ-CS2-037 (흐름 전체 + 공개 저장소 점검) | M4 |
