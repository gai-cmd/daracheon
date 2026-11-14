# SPEC-CONSOLE-002 — 구현 계획 (plan.md)

Tier M(파일 15개 안팎, 기존 모듈 위에 얹는 변경). 개발 방식: `quality.yaml` `development_mode` 설정을 따른다. 기존 자격증명 라우트·양식은 SPEC-CONSOLE-001 테스트가 이미 고정하고 있으므로, 바뀌는 동작마다 실패하는 테스트를 먼저 쓴다. 시간 예측은 적지 않는다.

순서는 바뀔 가능성이 큰 결정(데이터 모델, API 계약, 양식 흐름)을 앞에 두고 스타일·문구 같은 기계적 작업을 뒤에 둔다.

## 1. 앞서 정한 결정과 근거

| 번호 | 결정 | 근거 |
|---|---|---|
| CS2-D1 | 새 항목 칸은 `hide_password` 하나. 로그인 주소는 기존 `url`, 메모는 기존 `description`을 쓴다 | 데이터 모델 변경을 최소로. 공유 계정 항목의 "주소"가 곧 로그인 주소다. 개인 메모(`note`)는 담당자·관리자 전용이라 TeamPassword "비고"(공유 대상 모두가 봄)와 성격이 달라 `description`에 대응시킨다 |
| CS2-D2 | "숨기기 예외 대상" = 편집 권한자(관리자 또는 담당자) | 화면은 이미 받는 `canEdit`로 보기 버튼 노출을 판단할 수 있고, 서버는 `isAdmin ∨ isOwner` 한 줄이다. 새 응답 필드가 필요 없다 |
| CS2-D3 | `hide_password`는 비밀번호에만 적용. 아이디는 영향 없음 | 아이디는 로그인 열기 때 복사되고 화면에 보여도 위험이 작다. 오너 요청 문구도 "비밀번호 숨기기"다 |
| CS2-D4 | 접속 방식이 `shared-credential`이 아니면 서버가 `hide_password`를 `false`로 저장 | 링크 항목에 남은 표식이 나중에 엉뚱하게 살아나는 일을 막는다. 대신 종류를 링크로 바꿨다가 되돌리면 표식이 꺼진다(양식이 다시 보여 주므로 사용자가 알 수 있음) |
| CS2-D5 | 안내 확인 표시는 서버의 새 문서 `console-user-prefs`(email 키)에 둔다. localStorage 폴백은 쓰지 않는다 | 비용이 작다: 문서 1개, `FILE_KEY` 한 줄, 라우트 1개, bootstrap 칸 1개. 오너 요청은 "각자의 컴퓨터"지만 리드 범위는 "사람마다 한 번"이고, 브라우저 저장만 쓰면 기기·브라우저를 바꿀 때마다 다시 뜬다. `console-settings`(관리자 전용 PUT, `teamPins`)에 섞지 않는 이유는 쓰기 권한과 동시 쓰기 충돌을 분리하기 위해서다 |
| CS2-D6 | "나중에"는 서버에 아무것도 쓰지 않고 `sessionStorage`에만 표시 | 다음 방문에 다시 보여야 하므로 영구 기록이 필요 없다 |
| CS2-D7 | 안내 버전 상수 `AUTOFILL_GUIDE_VERSION = 1`. 확인 기록은 버전을 함께 담는다 | 안내 내용이 크게 바뀌면 버전만 올려 모두에게 다시 띄울 수 있다 |
| CS2-D8 | 로그인 열기는 "아이디 복사 → 새 탭 열기" 순서 | 새 탭을 먼저 열면 콘솔 문서가 포커스를 잃어 `navigator.clipboard.writeText`가 거절된다. 대신 비동기 요청 뒤 열기는 팝업 차단에 걸릴 수 있어, 막히면 링크를 띄운다(REQ-CS2-014) |
| CS2-D9 | 사용 기록은 펼칠 때 불러온다 | 패널을 열 때마다 요청하지 않는다. 담당자가 아닌 사람에겐 섹션 자체가 없다 |

## 2. 설계

### 2.1 데이터 모델

```ts
// src/lib/console/types.ts — 추가분
interface ConsoleItem {
  // ...기존 칸
  /** 없으면 false. access_method !== 'shared-credential'이면 서버가 false로 저장 */
  hide_password?: boolean;
}
type ConsoleListItem = /* 기존 */ & { hide_password: boolean }; // 항상 boolean

// 새 문서 console-user-prefs (CONSOLE_DOCS.userPrefs), FILE_KEY: email
interface ConsoleUserPrefs {
  email: string;                                 // 소문자
  autofillGuide?: { version: number; at: string }; // ISO 시각
}
export const AUTOFILL_GUIDE_VERSION = 1;
```

- `validate.ts`: `hide_password`가 있으면 boolean만 허용(아니면 `{ field: 'hide_password', reason: 'type' }`).
- `permissions.ts` `toListItem`: `hide_password: item.access_method === 'shared-credential' && item.hide_password === true`.
- `import-map.ts` `ITEM_FIELDS`에 `hide_password` 추가, 없으면 `false`, boolean 아니면 가져오기 전체 400.
- `export/route.ts` `toExportItem`: `hide_password: boolean`.
- `db.ts` `FILE_KEY`에 `'console-user-prefs': (r) => r.email` 한 줄.
- 감사 기록 타입은 그대로. 숨김 거절은 기존 `credential.deny`에 `meta.reason = 'reveal_hidden'`.

### 2.2 API 계약

**`POST /api/console/items/[id]/credential`** (기존, 동작 추가)

요청 `{ "field": "login_id" | "password", "purpose": "view" | "copy" }` — 지금과 같다.

판정 순서(번호가 앞선 것이 먼저):
1. Origin 검사 → 403
2. 세션 → 401
3. 자격증명 키 → 503 `credentials_not_configured`
4. 본문 검사 → 400 `invalid_body`
5. 항목(삭제 안 된 것) → 404 `not_found`
6. 공개 범위 판정 → 403 `forbidden` + `credential.deny`
7. **새 단계**: `field === 'password' && purpose === 'view' && hide_password && !(isAdmin || isOwner)` → 403 `reveal_hidden` + `credential.deny`(`meta: { field, reason: 'reveal_hidden' }`)
8. 열람 상한(10분 30건, view·copy만 셈) → 429 + `credential.rate_limited`
9. 값 없음 → 404 `not_set`
10. 감사 기록(`credential.view` 또는 `credential.copy`) 실패 → 503 `audit_unavailable`, 값 없음
11. 복호화 → 200 `{ "value": "..." }`, `Cache-Control: no-store`

**`GET /api/console/items/[id]/activity`** (신규)

- 401: 세션 없음 / 404 `not_found`: 없는 항목 또는 삭제된 항목 / 403 `forbidden`: 관리자도 담당자도 아님
- 200, `Cache-Control: no-store`:

```json
{
  "events": [
    { "at": "2026-11-15T09:12:00.000Z", "actor": "지어낸 이름 또는 a@try-n.com",
      "action": "copy", "field": "password" },
    { "at": "2026-11-15T09:10:00.000Z", "actor": "b@try-n.com",
      "action": "deny", "field": "password", "reason": "reveal_hidden" }
  ]
}
```

- `action` ∈ `view` | `copy` | `deny` | `rate_limited` (감사 동작 `credential.*`에서 접두어를 뗀 값). `targetId`가 이 항목인 것만, 최신순 최대 20건. `field`·`reason`은 기록에 있을 때만.
- `actor`는 사람 목록에서 email이 맞는 사람의 `name`, 없으면 email. 값·암호문·토큰은 응답에 없다.
- GET이라 Origin 검사는 하지 않는다(기존 GET 라우트와 같음). 이 조회 자체는 감사 기록에 남기지 않는다.

**`POST /api/console/me/autofill-guide`** (신규)

- 요청 `{ "version": 1 }`. Origin 검사 → 403, 세션 → 401, `version !== AUTOFILL_GUIDE_VERSION` → 400.
- 내 레코드를 `{ email, autofillGuide: { version, at } }`로 쓴다(새로 읽기 → 내 레코드만 바꿈 → 병합 쓰기). 이미 같은 버전이면 다시 써도 결과가 같다.
- 200 `{ "autofillGuideAck": true }`. 관리자가 아니어도 된다.

**`GET /api/console/bootstrap`** (기존, 칸 추가)

- `me.autofillGuideAck: boolean` — 내 레코드의 `autofillGuide.version >= AUTOFILL_GUIDE_VERSION`이면 `true`.
- `items[].hide_password: boolean`.
- `console-user-prefs` 읽기가 실패해도 bootstrap은 실패시키지 않고 `autofillGuideAck: true`로 답한다(안내 팝업 때문에 콘솔 전체가 막히지 않게. 계정 메뉴로 다시 열 수 있다).

**`POST /api/console/items`, `PATCH /api/console/items/[id]`** (기존, 칸 추가)

- 본문에 `hide_password?: boolean`. 규칙은 §2.1.

### 2.3 추가·편집 양식 배치

```
┌ 항목 추가 ──────────────────────────────┐
│ 종류   [ 링크 | 공유 계정 ]  ← radiogroup  │
│ 분류   [ 홈페이지        ▾]              │
│        └ (관리자) + 새 분류 만들기…       │
│ 제목   [                    ]           │
│ ── 공유 계정일 때 ──                      │
│ 로그인 주소 [ https://…          ]       │
│ 아이디      [                    ]       │
│ 비밀번호    [ ••••••••  (눈) (생성) ]    │
│ 메모        [                    ]       │
│   ↳ 항목을 볼 수 있는 모두에게 보여요.     │
│     비밀번호는 적지 마세요.               │
│ 공유 대상  (•) 전체 멤버                  │
│            ( ) 우리 팀 (한국팀)           │
│            ( ) 나만(비공개)              │
│ [✓] 멤버에게 비밀번호 숨기기 (복사만 허용)  │
│ ── 링크일 때 ──                           │
│ 주소 / 한 줄 설명 / 연동 주소 (지금 그대로)  │
│ [ 더 보기 ⌄ ]                            │
│   형식·팀·담당자·태그·영문·확인할 일 …      │
│   (링크일 때만) 접속 방식(공유 계정 제외)·공개 범위 │
│   (공유 계정일 때) 연동 주소              │
│                     [취소] [저장]        │
└─────────────────────────────────────────┘
```

- 종류 버튼은 `role="radiogroup"` 안의 두 `role="radio"`, 화살표 키로 이동, `aria-checked`.
- "우리 팀"의 팀 이름은 양식의 팀 값(기본은 내 팀)을 괄호로 보여 준다. 팀이 `공통`이면 우리 팀은 사실상 전체와 같다(SPEC-CONSOLE-001 규칙).
- 링크 ↔ 공유 계정을 바꿔도 입력한 제목·주소·분류·설명은 지우지 않는다. 아이디·비밀번호 입력값은 공유 계정에서 벗어나면 저장 본문에 넣지 않는다(서버도 무시함 — 기존 동작).
- 기존 항목 편집: `access_method === 'shared-credential'`이면 공유 계정으로 열린다. 저장된 비밀번호는 지금처럼 보여 주지 않고 빈 칸 = 유지.
- 비밀번호 생성기 `generatePassword(length = 20)`: 소문자·대문자·숫자·기호 `!@#$%^&*-_=+?` 각 1자 이상, `crypto.getRandomValues` + 거부 표본추출(나머지 편향 없음), 자리 섞기도 같은 난수원. 생성하면 눈 토글이 켜져 사용자가 값을 확인할 수 있다(작성자 본인 화면).
- 관리자 "+ 새 분류 만들기…": 선택지를 고르면 선택값을 바꾸지 않은 채 기존 `CategoryDialog`를 연다. 추가되면 새 id를 선택, 취소하면 이전 분류 유지. 양식은 그대로 남는다.

### 2.4 공유 계정 상세 카드

```
┌ 계정 ─────────────────────────────────────┐
│ 로그인 주소  https://…          (복사)       │
│ 아이디       ••••••••      (보기)(복사)      │
│ 비밀번호     ••••••••      (보기)(복사)      │
│              ↑ 숨기기 대상 멤버에겐 (복사)만   │
│ [ 로그인 열기 ]   자동 입력 끄기 안내 ›        │
│ 마지막 수정 …                               │
│ ▸ 사용 기록 (담당자·관리자만)                 │
└───────────────────────────────────────────┘
값이 둘 다 없으면:  아직 계정 정보가 없어요  [계정 정보 입력](편집 권한자)
```

- 복사 버튼은 값을 받아 바로 클립보드에 쓰고 지역 변수 참조를 버린다. 상태에 넣지 않는다. 자바스크립트 문자열은 메모리에서 지울 수 없으므로 "참조를 남기지 않는다"까지만 약속한다.
- 보기 토글은 지금처럼 값을 컴포넌트 상태에만 두고 패널이 닫히면 버린다(REQ-CON-017).
- 로그인 열기: `login_id`를 `copy`로 받아 클립보드에 쓴 뒤 `window.open(url, '_blank', 'noopener,noreferrer')`. 반환값이 `null`이면 토스트 안에 `<a target="_blank" rel="noopener noreferrer">` 링크. 아이디가 없으면 주소만 연다.
- 사용 기록: `<details>` 형태의 펼침. 펼칠 때 `/activity` 한 번 요청, 실패하면 섹션 안에 오류 한 줄.
- 공유 계정 목록 보기: 각 행에 "계정 정보 있음 / 없음" 작은 표시(`hasLoginId || hasPassword`).

### 2.5 스크롤바 범위

- 공용 규칙은 `globals.css`의 `@layer base` 안에 있다. 콘솔 규칙은 `console.module.css`(층 없음)에 두므로 층 순서상 항상 이긴다. `globals.css`는 고치지 않는다.
- 페이지 스크롤바: `:global(html:has([data-admin-root="console"]))`에 `scrollbar-width: thin; scrollbar-color: #d6d0c4 #f2efe8;` 그리고 같은 선택자의 `::-webkit-scrollbar*`(너비 8px, 둥근 막대, 막대 `#d6d0c4`, 마우스 올림 `#bdb5a6`, 트랙 `#f2efe8`).
- 내부 스크롤 영역: `.root` 아래 모든 요소의 `::-webkit-scrollbar*`. `scrollbar-color`는 상속 속성이라 페이지 설정이 안쪽까지 내려간다. 대화상자(`dialog`)가 루트 밖에 붙는 경우도 `html:has(...)` 아래로 잡는다.
- 콘솔 표식은 이미 있는 `data-admin-root="console"`(콘솔 앱 루트 2곳, 로그인 화면 1곳)을 쓴다. 다른 화면에는 이 속성이 없다.
- 브라우저별 차이(솔직하게): Chrome 121 이후와 Firefox는 표준 `scrollbar-color`를 쓰며, 표준 속성이 걸리면 Chrome은 `::-webkit-scrollbar`를 무시한다. 그래서 마우스 올림 색 `#bdb5a6`은 Safari처럼 `::-webkit-scrollbar`를 쓰는 브라우저에서만 보인다. `:has()`는 Chrome 105, Safari 15.4, Firefox 121부터 지원한다.

### 2.6 자동 입력 끄기 안내

판별 함수 `detectBrowser(ua) → { browser: 'chrome' | 'edge' | 'whale' | 'safari' | 'firefox' | 'other', mobile: boolean }`. 순서: `Edg/`·`EdgA/`·`EdgiOS/` → edge, `Whale/` → whale, `Firefox/`·`FxiOS/` → firefox, `CriOS/`·`Chrome/` → chrome, 그 밖의 `Safari/` → safari. `mobile`은 `Mobi`·`Android`·`iPhone`·`iPad` 포함 여부. 데스크톱 모드 iPad는 UA로 구별할 수 없어 데스크톱 Safari 안내가 나간다(알려진 한계).

| 브라우저 | 설정 화면 열기 동작 | 안내 단계 요지 |
|---|---|---|
| Chrome 데스크톱 | `chrome://password-manager/settings` 복사 | 주소창에 붙여넣기 → "비밀번호 저장 제안" 끄기 → "자동 로그인" 끄기 |
| Edge 데스크톱 | `edge://settings/passwords` 복사 | 붙여넣기 → "비밀번호 저장 제안" 끄기 → 자동 로그인·자동 완성 끄기 |
| Whale 데스크톱 | `whale://settings/passwords` 복사 | 붙여넣기 → 비밀번호 저장 제안 끄기 → 자동 로그인 끄기 |
| Firefox 데스크톱 | `about:preferences#privacy` 복사 | 붙여넣기 → "로그인과 비밀번호" 칸에서 저장 여부 묻기 끄기 → 자동 채우기 끄기 |
| Safari 데스크톱 | 복사 버튼 없음, 메뉴 경로 표시 | Safari 메뉴 → 설정… → 자동 완성 → "사용자 이름 및 암호" 끄기 |
| 모바일(모든 브라우저) | 복사 버튼 없음, 메뉴 경로 표시 | 브라우저별 메뉴 경로(예: Chrome ⋮ → 설정 → 비밀번호 관리자 → 설정) |
| 기타 | 복사 버튼 없음 | 브라우저 설정에서 "비밀번호"를 검색해 저장 제안·자동 입력 끄기 |

- 위 주소와 메뉴 이름은 **실행 단계에서 실제 브라우저로 확인할 후보값**이다. 이 맥에 설치된 브라우저는 직접 확인하고(acceptance.md AC-CS2-019), 설치되지 않은 브라우저는 확인하지 못한 것으로 진행 기록에 남긴다. 확인해 보니 다른 주소가 맞으면 표의 값을 고친다.
- macOS 시스템 설정 딥링크(`x-apple.systempreferences:`)는 Safari의 자동 완성 설정이 Safari 앱 안에 있어 쓸모가 불확실하다. 브라우저에서 실제로 해당 화면이 열리는 것을 확인한 경우에만 추가하고, 확인하지 못하면 메뉴 경로만 둔다.
- 팝업 본문 맨 위에 한 줄: "이 사이트는 브라우저 설정을 직접 바꿀 수 없어요. 아래 순서대로 한 번만 꺼 주세요."
- 설정 주소 복사는 버튼을 누른 그 순간(사용자 동작 안)에 한다. 복사 결과는 토스트로 알린다: "주소를 복사했어요 — 새 탭 주소창에 붙여넣으세요".
- 첫 자동 표시는 bootstrap이 `autofillGuideAck: false`이고 이번 브라우저 세션에 "나중에"를 누른 적이 없을 때, 콘솔 첫 화면이 그려진 뒤 한 번.

## 3. 마일스톤

### M1 — 서버와 데이터 (우선순위 높음) — 범위 S4 + S6의 저장 부분

되돌리기 가장 어려운 결정(저장 칸, API 계약)을 먼저 굳힌다.

- `src/lib/console/types.ts` — `hide_password`, `ConsoleUserPrefs`, `CONSOLE_DOCS.userPrefs`, `AUTOFILL_GUIDE_VERSION`
- `src/lib/console/validate.ts` — `hide_password` boolean 검사, 접속 방식에 따른 `false` 정규화
- `src/lib/console/permissions.ts` — `toListItem`에 `hide_password`
- `src/lib/console/import-map.ts`, `src/app/api/console/export/route.ts` — 가져오기 허용 목록·내보내기 표식
- `src/lib/db.ts` — `FILE_KEY`에 `console-user-prefs`
- `src/app/api/console/items/[id]/credential/route.ts` — §2.2 7단계 숨김 판정
- `src/app/api/console/items/[id]/activity/route.ts` — 신규
- `src/app/api/console/me/autofill-guide/route.ts` — 신규
- `src/app/api/console/bootstrap/route.ts` — `me.autofillGuideAck`
- 테스트(실패를 먼저 보고 구현): AC-CS2-001 ~ 006. 기존 SPEC-CONSOLE-001 자격증명·가져오기·내보내기·bootstrap 테스트가 수정 없이 통과해야 한다.

### M2 — 화면 (우선순위 높음) — 범위 S1, S2, S3, S5, S6 + S4의 화면 표시

- `src/app/console/ItemForm.tsx` — 종류 선택, 공유 계정 칸, 공유 대상, 숨기기 체크, 생성 버튼, 새 분류 선택지(§2.3)
- `src/lib/console/password-gen.ts` — 신규 `generatePassword`
- `src/app/console/DetailPanel.tsx` — 자격증명 카드, 로그인 열기, 빈 상태, 사용 기록(§2.4)
- `src/app/console/api.ts` — `fetchActivity`, `ackAutofillGuide`
- `src/app/console/Sidebar.tsx` — 분류 제목 옆 "+"(관리자)
- `src/app/console/ListView.tsx` — 공유 계정 보기의 "계정 정보 있음/없음" 표시
- `src/app/console/AutofillGuideDialog.tsx`, `src/lib/console/browser-guide.ts` — 신규 팝업·판별·단계표(§2.6)
- `src/app/console/AccountMenu.tsx`, `src/app/console/ConsoleApp.tsx` — 메뉴 항목, 첫 자동 표시, 대화상자 연결
- `src/lib/console/i18n.ts` — 새 문구 한·영
- `src/app/console/console.module.css` — 스크롤바 범위 규칙(§2.5), 새 컨트롤 스타일(고정 hex)
- 테스트: AC-CS2-007 ~ 022. 정적 렌더(`renderToStaticMarkup`) 테스트와 순수 함수 테스트를 먼저, 브라우저 확인은 로컬 개발 서버(`localhost`)에서만 한다. zoellife.com에는 요청하지 않는다.

## 4. 위험

| 위험 | 영향 | 대응 |
|---|---|---|
| 브라우저가 입력 칸 속성을 무시하고 저장을 제안 | 멤버 브라우저에 공유 비밀번호가 저장됨 | 속성은 넣되(REQ-CS2-020) 안내 팝업이 본 대책. 남는 위험은 §1.1에 적음 |
| 새 탭을 연 뒤 클립보드 쓰기 거절, 또는 비동기 요청 뒤 팝업 차단 | 로그인 열기가 반쪽만 동작 | 복사 먼저, 막히면 링크(CS2-D8). AC-CS2-014에서 Chrome·Safari로 확인 |
| 설정 주소가 브라우저 버전마다 다름 | 붙여 넣어도 다른 화면이 열림 | 후보값을 실행 단계에서 확인하고 진행 기록에 남김. 미설치 브라우저는 미확인 항목으로 표시 |
| `:has()` 미지원 구형 브라우저 | 콘솔에서도 사이트 공용 스크롤바가 보임 | 기능 손상은 없음(색만 다름). 지원 버전은 §2.5 |
| `console-user-prefs` 쓰기 동시성 | 두 사람이 동시에 확인하면 한쪽 기록이 사라질 수 있음 | email 키 병합 쓰기(`writeDataMerged`)로 다른 사람 레코드를 보존. 최악이어도 팝업이 한 번 더 뜰 뿐 |
| 숨김 거절 반복으로 감사 기록이 늘어남 | 기록 5,000건 창이 빨리 밀림 | 화면이 숨김 대상에게 보기 버튼을 아예 보여 주지 않으므로 정상 사용에선 생기지 않음 |

## 5. 실행 전 확인할 가정

오너가 범위를 리드에게 맡겼으므로 아래는 리드 판단으로 진행하고, Implementation Kickoff에서 한 번에 보여 준다.

1. "메모"는 공유 대상 모두가 보는 `description`이다(CS2-D1). 담당자만 보는 메모가 필요하면 "더 보기"의 확인할 일을 쓴다.
2. 숨기기 예외는 관리자와 담당자다(CS2-D2). 팀장 같은 별도 역할은 없다.
3. "나중에"를 누르면 다음 방문(새 브라우저 세션)에 다시 뜬다(CS2-D6).
4. 안내 확인 기록은 서버에 사람별로 남는다(CS2-D5).

## 6. 완료 조건

- acceptance.md의 22개 기준이 모두 통과하고 근거가 progress.md §E.2에 남는다.
- `npx tsc --noEmit`, 바뀐 경로의 `npx eslint`, 콘솔 관련 테스트(`src/lib/console`, `src/app/api/console`, `src/app/console`, 콜백 테스트)가 통과한다. 전체 스위트는 CI에 맡긴다(부하가 36 미만일 때만 로컬 전체 실행).
- 공개 저장소 점검: 새 파일에 비밀값 리터럴, 직원 이름, 실제 email, 내부 id가 없다.
