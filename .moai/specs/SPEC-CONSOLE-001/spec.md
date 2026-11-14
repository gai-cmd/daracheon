---
id: SPEC-CONSOLE-001
title: "조엘라이프 팀 콘솔 (/console) 배포판 — try-n.com SSO, 항목 관리, 공유 계정 보관"
version: "0.3.0"
status: draft
created: 2026-11-15
updated: 2026-11-15
author: manager-spec
priority: P1
phase: "v1.1.0 target"
module: "src/app/console, src/app/api/console, src/lib/console"
lifecycle: spec-anchored
tags: "console, sso, google-oauth, credentials, aes-256-gcm, audit, i18n, blob, wiki"
tier: L
---

# SPEC-CONSOLE-001 — 조엘라이프 팀 콘솔 배포판

## HISTORY

| 버전 | 날짜 | 작성 | 내용 |
|---|---|---|---|
| 0.1.0 | 2026-11-15 | manager-spec | 최초 작성(draft). 승인된 프로토타입(`zoel-console/index.html`)과 PLAN.md "최종 결정"(2026-11-14)을 근거로 함 |
| 0.2.0 | 2026-11-15 | manager-spec | plan-audit 1차(FAIL 0.78) 반영. 콘솔 모드 오류 출구(CON-D1), 가져오기 형식(CON-D2)과 교체 쓰기 규칙(CON-D3), D2 충돌 명시(CON-D4), 공개 Blob 의존(CON-D5), 클립보드 조항 삭제(CON-D6), 로그아웃 예외(CON-D7), 선택 결함 D8~D15 반영. 범위는 그대로 |
| 0.3.0 | 2026-11-15 | manager-spec | plan-audit 2차(FAIL 0.88) 막는 결함 반영: 가져오기의 사람·분류 제거를 키가 있을 때로 한정(CON-D16), 콘솔 복귀 경로의 점(`.`·`..`) 세그먼트 거부(CON-D17), 기존 audit-log 건수를 성공·신원 있는 거절 합계 2줄로 맞춤(CON-D18). 선택 결함 CON-D8·D19·D21 반영. 오너 요청(2026-11-15 "위키가 있다면 상위 카테고리로 근간을 만들어 놔")으로 위키 구역 추가: 분류 `kind`(`resource`·`knowledge`) 표식, 내장 지식 분류 `wiki`, 메뉴 최상단 위키 구역과 빈 상태(REQ-CON-025, AC-CON-026). 위키 작성 기능과 LLM 지식 기반은 범위 제외 |

## 1. 배경과 목적

조엘라이프 유통·판매 팀의 주소·계정·자료가 사람마다 흩어져 있고, 같은 주소를 묻는 요청이 Slack에서 반복된다. 오너가 승인한 단일 파일 프로토타입(구글 관리 콘솔 구조, 콘텐츠 워크숍 스튜디오 톤, 한·영 전환, TeamPass 방식 공유 계정)을 zoellife.com의 `/console` 경로에 실제 서비스로 올린다.

프로토타입은 브라우저 저장소만 쓰고 로그인·권한·암호화·기록이 모두 흉내였다. 배포판은 이 네 가지를 서버에서 실제로 강제하는 것이 핵심이다.

### 1.1 확정된 오너 결정 (재론하지 않음)

- 화면 구조: 구글 관리 콘솔 방식 — 왼쪽 메뉴, 차분한 홈(고정·최근 수정·분류별 요약), 넉넉한 단일 높이 목록 행, 오른쪽 상세 패널, 분류 거르기, 좌측 정렬 전폭 콘텐츠
- 겉모습: 콘텐츠 워크숍 스튜디오 팔레트, 작은 서비스 아이콘, 한국어 기본 + 영어 전환
- 로그인: 구글이 인증한 `@try-n.com` 주소면 누구나 입장(개인별 등록 없음). zoellife.com 관리자 화면은 기존 등록 사용자 명단을 그대로 유지
- 접속 표시: SSO / 초대 / 공유 계정 / 별도 로그인
- 공유 계정: 아이디 + 비밀번호, 가림 표시, 눈 아이콘으로 보기, 복사는 실제 값
- 편집: 모든 항목에 연필, 편집·삭제는 담당자 또는 관리자만, 삭제는 인라인 확인 + 되돌리기
- 워크숍 하위 앱은 한 항목으로 통합, GA4 항목은 속성 홈으로 연결(데이터 차원의 결정)
- 신규 유료 구독 없음

### 1.2 PLAN.md 본문과의 관계

PLAN.md 8절 본문은 "별도 비공개 저장소 + Neon + 핸드오프 토큰"을 제안했으나, 이 SPEC은 오너가 지정한 방향(zoellife.com 저장소 안의 `/console` 경로, 기존 OAuth 콜백의 콘솔 모드, Blob JSON 저장)을 따른다. 저장소가 공개라는 사실에서 나오는 제약(시드 데이터 비커밋, 비밀값 비커밋)은 아래 요구사항으로 흡수한다. 이 선택의 최종 확인은 plan.md §6 오너 확인 항목 D9에 남긴다.

## 2. 용어

- **콘솔 세션**: zoellife.com 관리자 세션과 별개의 서명 쿠키. 콘솔 전용 비밀값으로만 서명된다.
- **콘솔 관리자**: 환경변수 허용 목록에 이메일이 있는 사용자. zoellife.com 관리자 역할과 무관하다.
- **항목(item)**: 프로토타입의 카드. 제목, 주소, 담당자, 팀, 분류, 접속 방식, 공개 범위, 연동 주소, 확인할 일 메모를 가진다.
- **자격증명(credential)**: 접속 방식이 공유 계정인 항목의 아이디와 비밀번호. 둘 다 암호화 보관 대상이다.
- **공개 범위(visibility)**: 전체 / 팀 / 본인. 이 판에서는 자격증명 열람 권한을 정한다. 항목 자체까지 가릴지는 오너 결정 D2에 달려 있다(plan.md §6 D2 — PLAN.md 3절 표와 충돌하므로 실행 전에 답이 필요).

## 3. 요구사항 (GEARS)

### 3.1 입장과 세션

**REQ-CON-001** — The console shall be served under the `/console` path of zoellife.com, and every console page and console API other than the console sign-in page and the console sign-out endpoint shall require a valid console session.

**REQ-CON-002** — When a user starts console sign-in, the sign-in flow shall reuse the existing Google OAuth client and its existing callback in a console mode selected only by a sanitized return path equal to `/console` or a path beneath `/console/`, so that no new OAuth redirect URI is required. A return path any of whose segments is `.` or `..`, in literal or percent-encoded form, shall not count as a console path. When the console sign-in page is opened with a requested return path, the sign-in flow shall carry that path only if it is itself a console path, and shall use `/console` otherwise. The callback shall determine console mode from the return-path cookie before evaluating any other step, and when the callback runs in console mode and any step fails (OAuth not configured, console not configured, state mismatch, token exchange, userinfo lookup, admission, or an unexpected error), the callback shall redirect to the console sign-in page with an error code and shall not redirect to the admin sign-in page.

**REQ-CON-003** — When the Google callback completes in console mode, the callback shall admit the account only if all of the following hold: the email is reported verified by both the userinfo response and the ID token; the address contains exactly one `@` with a non-empty local part; its domain equals `try-n.com` exactly (case-insensitive, no subdomain, no lookalike); the ID token `hd` claim equals that domain; and the ID token audience equals the configured OAuth client id. Registration in the zoellife.com admin user list shall not be required.

**REQ-CON-004** — The console-mode callback shall not issue, refresh, or modify the zoellife.com admin session cookie or any admin user record, and a zoellife.com admin session shall not grant console access, nor shall a console session grant admin access.

**REQ-CON-005** — The console session shall be signed only with a dedicated secret. When that secret is unset, blank, shorter than 32 characters, or equal to any configured value among the admin session secret, the workshop handoff secret, the partner session secret, the serial scan secret, the QR tracking secret, the backup encryption key, or the console credential key, the console shall fail closed (sign-in refused, console APIs answering "not configured") and shall not fall back to any other secret or to a literal value.

**REQ-CON-006** — The console session token shall carry a console-specific marker and an expiry (default 12 hours), so that admin session tokens, workshop handoff tokens, and partner tokens never verify as console sessions. When the user signs out, the console shall clear the console session cookie.

**REQ-CON-007** — Where a signed-in user's email appears in the console admin allow-list environment variable, the console shall grant console-admin rights; admin rights shall be evaluated on every request from that variable alone and never from stored data or client input.

### 3.2 데이터 보관과 노출

**REQ-CON-008** — The console shall persist items, categories, and the people directory as JSON documents through the existing Blob-backed data helpers under the existing data prefix, and the public repository shall not contain console seed content (internal Drive folder ids, Sheet ids, Slack channel ids, staff names, or staff emails).

**REQ-CON-009** — The console shall deliver item, people, and audit data to the browser only through authenticated console API responses, and shall not embed that data in server-rendered HTML, page source, or static assets. This requirement governs delivery to the browser only; protection of the stored documents themselves is the storage limitation stated in §4 and owner decision D13 in plan.md §6.

### 3.3 항목 권한과 편집

**REQ-CON-010** — When a signed-in user creates an item, the console shall record that user as an owner. When a user edits or deletes an item, the server shall permit the change only if the user is a console admin or one of the item's owners matched by email. The item's private note ("확인할 일") shall be returned only to its owners and console admins.

**REQ-CON-011** — When an owner or console admin deletes an item, the console shall first ask for inline confirmation, then remove the item from every list while retaining it as deleted, and shall offer an undo action. When undo is invoked, the console shall restore the item together with its stored credentials.

**REQ-CON-012** — When an item update is submitted against a version older than the stored one, the server shall reject the update as a conflict instead of overwriting the newer version.

**REQ-CON-013** — The server shall validate every item, category, people, and import input (URL schemes limited to `http`, `https`, `mailto`; known enum values; known category ids; length caps), and shall reject state-changing requests whose `Origin` is not the site's own origin.

### 3.4 공유 계정(자격증명)

**REQ-CON-014** — The server shall encrypt each shared-credential login ID and password with AES-256-GCM using a dedicated key supplied by environment variable, shall bind each ciphertext to its item id, and shall store ciphertexts in a document separate from item data.

**REQ-CON-015** — The console shall not include any credential value in list, detail, export, page, or error payloads; list payloads shall expose only whether a login ID and a password are present.

**REQ-CON-016** — When a signed-in user requests to view or copy a credential field, the server shall return the decrypted value only if the user is permitted by the item's visibility (전체: any signed-in user; 팀: owners, console admins, and members of the item's team, with team `공통` meaning everyone; 본인: owners and console admins), shall record an audit entry before returning the value, shall mark the response non-cacheable, and shall cap the number of reveals per user within a time window. When the request is denied or capped, the server shall return no value and shall record the denial.

**REQ-CON-017** — While a credential is displayed in the detail panel, the console shall show the password masked by default, reveal it only while the eye toggle is on, and copy the real value on the copy action; the console shall not keep a revealed value after the detail panel closes.

### 3.5 기록

**REQ-CON-018** — The console shall record an audit entry for console sign-in success and failure, item create, update, delete, and restore, credential view, copy, and denial, import, people, category, and team-pin changes; no audit entry shall contain a credential value. Where the user is a console admin, the console shall show recent console audit entries.

### 3.6 관리자 기능

**REQ-CON-019** — Where the user is a console admin, the console shall provide: replacing all items from an uploaded JSON file in the accepted import format (credential fields in the file ignored; stored items absent from the file removed rather than retained; and, when the file includes a people list or a categories list, stored people or categories absent from that list removed rather than retained, while a file without that key leaves the stored list unchanged), exporting items without credentials, maintaining the people directory (name, English name, email, team), adding categories, and maintaining the team-pinned item list shown on the home.

### 3.7 화면

**REQ-CON-020** — The console shall present the prototype's Google admin-console structure: a left navigation (home, all items, the Wiki section of REQ-CON-025, the eight regular categories, shared accounts, my items); a home with pinned or team-essential items, recently updated items, a per-category summary, and a single needs-attention line; single-density roomy list rows; a right-side detail panel; filters by category, access method, owner, team, my items, and needs-attention; left-aligned full-width content; a pencil edit action on every item; and exactly one access label per item drawn from SSO / 초대 / 공유 계정 / 별도 로그인, with no label on public items.

**REQ-CON-021** — The console shall use scoped styles with fixed color literals of the content workshop studio palette (background `#faf8f3`, sidebar `#f2efe8`, accent `#1f6f5c`), shall not depend on site-wide design tokens, shall keep text legible despite the site-wide dark theme overrides, and shall not render the public site header or footer.

**REQ-CON-022** — The console shall render service icons from markup bundled in the repository and shall not load any image, font, icon, or script from an external host.

**REQ-CON-023** — The console shall provide Korean and English interface text with a header toggle, defaulting to Korean and remembering the choice; both languages shall define the same set of text keys; when an item's English title or description is empty, the English view shall show the Korean text.

### 3.8 위키 구역

**REQ-CON-025** — The console navigation shall show a top-level 위키 / Wiki section above the regular categories, visually separated from them by its own heading and a divider, and listing the items of the knowledge category. Each category shall carry a kind of `resource` or `knowledge`; a category stored or imported without a kind shall be treated as `resource`, and the console shall always provide the built-in knowledge category `wiki` (위키 / Wiki) whether or not any stored category defines it. When the Wiki section has no items, the console shall show an empty-state message in place of the list. The Wiki section's interface text shall be defined under the same keys in Korean and English. When an admin imports the seed file, the content-workshop wiki entry (자료실 · 대라천 참 침향 위키 / Library · Daracheon agarwood wiki, `https://zoel-workshop.vercel.app/apps/wiki`, access label SSO, team `공통`) shall reach the Wiki section through the same import path as every other item, and the repository shall not contain that entry as seed data. The console shall not provide wiki page authoring in this release beyond the regular item create and edit actions.

### 3.9 검색 노출

**REQ-CON-024** — The console pages and console APIs shall be marked `noindex, nofollow`, robots.txt shall disallow `/console` for every user-agent group that has an allow rule, and the sitemap shall not list any console URL.

## 4. 제약

- 기존 인프라만 쓴다: Vercel(기존 프로젝트), Vercel Blob, 기존 Google OAuth 클라이언트. 신규 유료 구독·종량제 서비스 없음.
- 저장소는 공개다. 비밀값 리터럴, `process.env.X ?? '<literal>'` 형태의 비밀값 폴백, 시드 데이터를 커밋하지 않는다(`.claude/rules/daerachoen-constitution.md`).
- `dark-theme.css`가 `:root` 토큰 의미를 뒤집고 body·input·label·h1~h6 색을 `!important`로 강제한다. 콘솔은 자체 범위 스타일과 고정 hex만 쓴다.
- 외부 CDN 자산 금지(헌법 불변 원칙).
- 기존 관리자 SSO 동작(등록 사용자만 입장, 워크숍 member 출구, 관리자 모드 오류 출구 `/admin/login`)은 바꾸지 않는다.
- 지식 친화 데이터 모델: 콘솔은 나중에 조엘라이프의 LLM 지식 기반이 될 수 있다(범위 제외 참고). 그래서 이번 판의 데이터도 안정된 id(가져오기·내보내기 왕복에서 유지), 구조화된 JSON, 한·영 짝 필드(`title`·`title_en` 등), 담당자와 `updatedAt`, 자격증명을 뺀 깨끗한 내보내기를 유지한다. 이 성질을 깨는 변경(예: id 재발급, 영문 필드 제거)은 이 SPEC 개정 없이 하지 않는다.
- 위키 분류 `wiki`는 코드에 내장된 정의다. 분류 이름·표식만 담고 직원 이름·주소·내부 id는 담지 않으므로 REQ-CON-008의 시드 금지와 충돌하지 않는다. 위키 항목 자체(주소·담당자)는 시드 파일로만 들어온다.
- 저장 한계: 기존 db 헬퍼는 Vercel Blob을 공개 접근(`access: 'public'`)으로 쓰고, 비밀 prefix(`BLOB_DATA_PREFIX`)가 유일한 보호 수단이다. 따라서 `console-items`(드라이브·시트·Slack id), `console-people`·`console-audit-log`(직원 email)는 prefix가 새면 인증 없이 읽힌다. prefix는 2026-07에 실제로 공개 저장소에 노출된 적이 있다(헌법). 자격증명 값만은 암호문으로 저장되므로 prefix가 새도 평문이 나가지 않는다. 이 한계를 받아들일지는 오너 결정 D13이다.

## 5. 범위 제외

### Out of Scope — 기능

- 콘솔 화면 안의 GA4 요약 숫자(PLAN 최종 결정의 "보여 줄 수 있다" 항목) — 후속 SPEC 후보
- 홈 맨 위 워크숍 스튜디오 메인 띠(PLAN "미반영" 항목)
- 고정(핀) 목록의 기기 간 동기화 — 이번에는 사용자별로 브라우저에만 저장
- 다크 테마 — 이번 배포판은 라이트 스튜디오 팔레트만 제공(plan.md D7)
- 클립보드 자동 비우기 — 사용자가 그 사이 복사한 다른 내용까지 지울 수 있고 통과·실패로 판정할 수 없어 뺀다(plan-audit CON-D6)
- 삭제 항목 휴지통 화면과 영구 삭제(purge) — 되돌리기 토스트 외 복구 화면 없음
- 댓글, 알림, 콘솔 이용 통계

### Out of Scope — 위키·지식 기반

- 위키 문서 작성 기능(본문 편집기, 마크다운, 문서 이력, 문서 간 링크) — 이번 판의 위키 구역은 다른 항목과 같은 링크 항목만 담는다
- 조엘라이프 LLM 지식 기반 — 콘솔은 나중에 LLM이 읽는 지식 기반이 될 수 있으나, 이번 판에는 임베딩·검색 색인·LLM 호출·지식 API가 없다. 이번 판은 §4 "지식 친화 데이터 모델"만 지킨다
- 관리자가 지식 분류를 새로 만들거나 위키 구역을 여러 개로 나누는 기능 — 지식 분류는 내장 `wiki` 하나
- 워크숍 위키 내용의 콘솔 동기화나 미리보기 — 콘솔은 워크숍 위키로 가는 링크만 둔다

### Out of Scope — 보안·운영

- 자격증명 키 교체(re-encryption) 도구 — 암호문에 키 버전 칸만 남겨 두고 도구는 후속 작업
- 개별 세션의 서버 측 즉시 폐기(차단 목록 등) — 비상시에는 `CONSOLE_SESSION_SECRET` 교체로 전체 세션을 끊는다(plan.md §4 위험 행)
- 콘솔 문서(항목·사람·기록)의 저장 시점 암호화 — 오너 결정 D13에서 고르면 SPEC 개정 후 진행
- 2단계 인증 코드 보관(콘솔은 인증 수단 보유자 이름만 적는다)
- Slack #04_admin 평문 로그인 정보 정리와 비밀번호 교체(콘솔 밖 수동 작업, plan.md §7)
- 공유 로그인의 서비스 약관 검토
- zoellife.com 관리자 화면(`/admin`)의 출입 규칙 변경

### Out of Scope — 인프라

- 별도 Vercel 프로젝트, 별도 저장소, Neon 데이터베이스
- 새 OAuth 클라이언트나 새 리디렉트 URI 등록
- 워크숍 핸드오프 토큰(`/admin/sso-handoff`) 구조 변경

## 6. 추적성

인수 기준과 그 기준이 검증하는 요구사항. Given-When-Then 본문은 acceptance.md에 있다. 25개 요구사항이 모두 하나 이상의 기준에 걸린다.

| 인수 기준 | 검증하는 요구사항 |
|---|---|
| AC-CON-001 | REQ-CON-003, REQ-CON-004 |
| AC-CON-002 | REQ-CON-002, REQ-CON-003 |
| AC-CON-003 | REQ-CON-002 |
| AC-CON-004 | REQ-CON-005 |
| AC-CON-005 | REQ-CON-004, REQ-CON-006 |
| AC-CON-006 | REQ-CON-001, REQ-CON-006, REQ-CON-009 |
| AC-CON-007 | REQ-CON-015 |
| AC-CON-008 | REQ-CON-014 |
| AC-CON-009 | REQ-CON-016, REQ-CON-017 |
| AC-CON-010 | REQ-CON-016 |
| AC-CON-011 | REQ-CON-010 |
| AC-CON-012 | REQ-CON-007 |
| AC-CON-013 | REQ-CON-011 |
| AC-CON-014 | REQ-CON-012 |
| AC-CON-015 | REQ-CON-013 |
| AC-CON-016 | REQ-CON-018 |
| AC-CON-017 | REQ-CON-018 |
| AC-CON-018 | REQ-CON-019 |
| AC-CON-019 | REQ-CON-023 |
| AC-CON-020 | REQ-CON-020 |
| AC-CON-022 | REQ-CON-021 |
| AC-CON-023 | REQ-CON-022 |
| AC-CON-021 | REQ-CON-024 |
| AC-CON-024 | REQ-CON-016 |
| AC-CON-025 | REQ-CON-008 |
| AC-CON-026 | REQ-CON-025 |
