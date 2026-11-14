# SPEC-CONSOLE-001 — 설계 (design.md)

> spec.md는 무엇을·왜를, 이 문서는 어떻게를 다룬다. 이름·경로·형식은 실행 단계에서 바꿀 수 있는 제안이며, 바꿀 때는 이 문서를 함께 고친다.

## 1. 전체 구조

```
브라우저 /console  ──(콘솔 쿠키 없음)──▶ /console/login ──▶ /api/admin/auth/google/start?next=/console
                                                                    │ (기존 OAuth 클라이언트·state 쿠키)
                                                                    ▼
                                   /api/admin/auth/google/callback  ── next 가 /console 계열? ──┐
                                        │ 아니오: 기존 관리자 흐름 그대로                         │ 예: 콘솔 모드
                                        ▼                                                      ▼
                                   (변경 없음)                             try-n.com 검증 → 콘솔 쿠키 발급 → 302 /console
                                                                           (관리자 쿠키·admin-users 손대지 않음)

/console (서버 페이지: 데이터 없이 껍데기만) ──▶ 클라이언트 ConsoleApp ──fetch──▶ /api/console/* (콘솔 세션 검사)
                                                                                     │
                                                       Blob JSON (기존 db 헬퍼, 기존 비밀 prefix)
                                                       console-items · console-categories · console-people
                                                       console-settings · console-secrets(암호문) · console-audit-log
```

## 2. 로그인

### 2.1 next 경로 판정

`src/lib/google-oauth.ts`

- 새 판정 함수 `isConsoleNext(next)`: 아래 네 조건을 모두 만족할 때만 true. start·callback·로그인 화면이 같은 함수를 쓴다.
  1. `/`로 시작하고 `//`로 시작하지 않으며 `\`와 제어 문자가 없다.
  2. `?`·`#` 앞의 경로를 `/`로 나눈 첫 세그먼트가 정확히 `console`이다(`/console`, `/console/`, `/console/x`). `/console-x`, `/consolex`, `/console%2F..%2Fadmin`(첫 세그먼트가 `console%2F..%2Fadmin`)은 여기서 떨어진다.
  3. 점 세그먼트가 없다. 각 세그먼트를 소문자로 바꾸고 `%2e`를 `.`으로 바꾼 값이 `.`이나 `..`이면 false다. WHATWG URL 파서가 점 세그먼트로 해석하는 형태(`.`, `..`, `%2E`, `%2e%2E`, `.%2e` 등)와 같은 범위다.
  4. 이중 확인: `new URL(next, 'https://console.invalid')`의 출처가 그 기준 출처와 같고, `pathname`이 `/console`이거나 `/console/`로 시작한다.
- `sanitizeNextPath`: `isConsoleNext`가 true면 값을 그대로 돌려주고, 아니면 기존 `/admin` 규칙(L40-45)을 그대로 적용한다. 그래서 점 세그먼트가 든 콘솔 경로는 콘솔 모드가 아니며 `/admin`으로 정리된다(관리자 흐름으로 처리되고 콘솔 쿠키는 발급되지 않는다).

| 입력 | `isConsoleNext` | `sanitizeNextPath` |
|---|---|---|
| `/console/../admin` | false | `/admin` |
| `/console/%2E%2E/admin` | false | `/admin` |
| `/console/./../admin` | false | `/admin` |
| `/console%2F..%2Fadmin` | false | `/admin` |
| `/console/%252E%252E/x` | true | 그대로(파서가 점 세그먼트로 보지 않아 경로가 `/console/` 아래에 남음) |

이 규칙 덕분에 콘솔 쿠키를 발급하는 성공 응답의 `Location` 경로는 항상 `/console`이거나 `/console/` 아래다(`new URL(next, request.url)`로 정규화해도 바뀌지 않음, AC-CON-003).

### 2.2 start 라우트

- OAuth 설정이 없을 때 콘솔 모드면 `/console/login?error=sso_not_configured`로, 아니면 기존대로 `/admin/login`으로 보낸다.
- `next`는 쿼리값을 `sanitizeNextPath`로 정리한 결과를 쓴다. 로그인 화면이 넘긴 깊은 링크(`/console/x`)는 그대로 next 쿠키에 담기고, 콘솔 경로가 아닌 값은 기존처럼 `/admin`이 된다(콘솔 모드가 아님).
- 콘솔 세션 비밀값이 무효(§4.1)면 콘솔 모드 진입 자체를 거부하고 `/console/login?error=console_not_configured`.

### 2.3 callback 라우트 — 콘솔 분기

현재 콜백(`route.ts`)은 설정 검사(L110) → state 검사(L121-123) → next 쿠키 해석(L125-138) → 토큰 교환(L155-157) → userinfo(L163) → email·email_verified 거절(L172-174) → admin-users 조회(L177) 순서다. 오류 출구는 모두 `redirectToLogin` → `/admin/login`이다. 콘솔 모드는 이 출구들보다 **먼저** 정해야 한다.

순서 변경:

1. 핸들러 맨 앞에서 next 쿠키를 읽고 정리한다(L125-138의 코드를 위로 옮김, 해석 실패 시 `null` → `/admin`인 점은 그대로). `const consoleMode = isConsoleNext(next)`.
2. 오류 출구 함수 하나로 모은다: `fail(code)` = 콘솔 모드면 `/console/login?error=<code>`, 아니면 기존 `redirectToLogin(request, code)`. 두 경우 모두 OAuth 임시 쿠키를 정리한다. **관리자 모드의 출구 주소·오류 코드·순서는 바이트 단위로 그대로**다(M2 특성 테스트로 고정).
3. 설정 검사(`sso_not_configured`), state 검사(`oauth_state`), 토큰 교환(`oauth_token`), userinfo(`oauth_userinfo`), `catch`(`oauth_failed`)는 모두 `fail(code)`로 바꾼다. 콘솔 모드에서는 이 시점에 `isConsoleConfigured()`도 확인해 무효면 `fail('console_not_configured')`.
4. userinfo를 받은 직후, L172의 email·email_verified 거절 **이전에** `if (consoleMode) return consoleEntry(...)`. 콘솔 모드는 L172를 거치지 않고 `consoleEntry`가 email 누락·미검증을 직접 판정한다. 관리자 모드는 L172 이후를 그대로 탄다.

```
next = sanitizeNextPath(decode(cookie))      // 맨 앞
consoleMode = isConsoleNext(next)
config 없음            → fail('sso_not_configured')
consoleMode && 콘솔 설정 무효 → fail('console_not_configured')
state 불일치           → fail('oauth_state')
토큰 교환 실패          → fail('oauth_token')
userinfo 실패          → fail('oauth_userinfo')
consoleMode            → return consoleEntry(...)   // admin-users 를 읽지도 쓰지도 않는다
(관리자 모드: 기존 L170~ 그대로)
catch                  → fail('oauth_failed')
```

`consoleEntry` 판정(전부 충족해야 통과):

1. userinfo email이 있고, `decodeGoogleIdToken(tokens.id_token)` 성공(iss·exp 검사 포함), ID 토큰 email(소문자)이 userinfo email(소문자)과 같음
2. `isWorkshopOpenAccount({email, emailVerified: userinfo.email_verified === true && claims.email_verified === true, hd, aud}, {clientId, domains: ['try-n.com']})` — 이 함수가 이미 `@` 1개, 정확한 도메인 일치, `hd` 일치, `aud` 일치를 검사한다. 콘솔 도메인 목록은 `WORKSHOP_OPEN_DOMAINS`를 읽지 않고 상수 `['try-n.com']`으로 고정한다(워크숍 설정 변경이 콘솔 출입을 넓히지 않도록).
3. 통과: 콘솔 감사 기록 `auth.login`, 기존 감사 기록(`audit-log`, module `auth`)에도 "콘솔 입장" 1줄 → 콘솔 쿠키 발급 → `new URL(next, request.url)`로 302(같은 출처 절대 URL — 열린 리디렉트 방지는 기존 L228과 같음) → OAuth 임시 쿠키 정리.
4. 실패: `fail('not_allowed')`. userinfo email이 없으면 `fail('oauth_email')`.

감사 기록 규칙(콘솔 모드):

- 신원이 생긴 뒤의 실패(구글이 email을 돌려준 뒤 `consoleEntry`가 거절)는 콘솔 감사 `auth.login_failed`(사유 코드와 시도한 email, 토큰·코드 원문 없음) + 기존 감사 기록 1줄.
- 따라서 기존 `audit-log`에는 콘솔 로그인 시도마다 — 성공(위 3번)이든 신원이 생긴 뒤의 거절이든 — 정확히 1줄이 늘어난다. 성공 1회와 신원 있는 거절 1회가 있는 흐름이면 2줄이다(AC-CON-016). 열람·편집 등 다른 콘솔 동작은 기존 기록에 쓰지 않는다.
- 신원이 없는 단계의 실패(`sso_not_configured`, `console_not_configured`, `oauth_state`, `oauth_token`, `oauth_userinfo`, `oauth_email`, `oauth_failed`)는 감사 기록을 쓰지 않고 서버 로그에 사유 코드만 남긴다. 누구나 인증 없이 콜백을 두드릴 수 있으므로, 여기서 기록하면 익명 요청이 5,000건 상한을 채워 열람 기록을 밀어낼 수 있다.

관리자 세션 쿠키는 콘솔 모드에서 설정·삭제·갱신하지 않는다.

### 2.4 콘솔 세션 토큰

`src/lib/console/session.ts` (Edge 런타임 호환 — 미들웨어에서 검증하므로 Web Crypto 사용, `auth.ts`와 같은 방식)

- 형식: `base64url(payload).base64url(HMAC-SHA256(CONSOLE_SESSION_SECRET, payload))`
- payload: `{ "k": "console", "email": "...", "name": "...", "iat": <ms>, "exp": <ms> }`
- 검증: 서명 상수시간 비교 → JSON 파싱 → `k === "console"`, `typeof exp === "number"`, `exp > now`, email이 여전히 `@try-n.com` 정확 일치. 하나라도 어긋나면 null.
- 관리자 토큰(`expiresAt`·role, `k` 없음), 워크숍 토큰(`role`·`exp`, `k` 없음), 파트너 토큰은 `k` 검사에서 떨어진다. 비밀값이 서로 달라 서명 단계에서 먼저 떨어지는 것이 정상 경로이고, `k` 검사는 이중 장치다.
- 쿠키: 이름 `zoel_console_session`, `HttpOnly`, `Secure`(프로덕션), `SameSite=Lax`(구글에서 돌아오는 최상위 GET에 실려야 함), `Path=/`, `Max-Age` = 수명.
- 수명: 기본 12시간. `CONSOLE_SESSION_MAX_AGE_HOURS`(선택, 1~168 정수)로 조정, 범위 밖이면 기본값.
- 로그아웃: `POST /api/console/auth/logout` → 쿠키 `Max-Age=0`.

### 2.5 미들웨어

`src/middleware.ts`에 `/thesis`·`/partner` 블록과 같은 독립 블록을 추가한다(관리자 블록보다 앞).

| 경로 | 세션 없음 | 콘솔 비밀값 무효 |
|---|---|---|
| `/console/login` | 통과 | 통과(화면이 "설정 안 됨" 안내) |
| `/console`, `/console/*` | `/console/login?next=<경로>` 302 | `/console/login?error=console_not_configured` |
| `/api/console/auth/logout` | 통과(쿠키 삭제만, Origin 검사는 그대로 — REQ-CON-001 예외) | 통과 |
| `/api/console/*` | 401 JSON | 503 JSON |

통과한 응답에 `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`를 붙인다. 관리자 쿠키는 이 블록에서 검사하지 않는다(서로 무효).

## 3. 데이터

모든 문서는 `src/lib/db.ts`의 `readData` / `readDataForWrite` / `writeDataMerged` / `readSingle` / `writeSingle`로 읽고 쓴다(기존 비밀 prefix 아래, 기존 Blob 스토어). 개발 환경(Blob 토큰 없음)에서는 `data/db/console-*.json`에 쓰이며 이 경로는 `.gitignore`(data/db 전체)로 커밋되지 않는다. `.vercelignore`의 화이트리스트에 넣지 않는다.

### 3.1 문서 목록

| 문서 | 형태 | 키 | 비고 |
|---|---|---|---|
| `console-items` | 배열 | `id` | 항목. 자격증명 없음 |
| `console-categories` | 배열 | `id` | 8개 일반 분류 + 관리자가 추가한 분류. 내장 지식 분류 `wiki`는 저장하지 않는다(§3.5) |
| `console-people` | 배열 | `email` | `FILE_KEY`에 email 키 등록 |
| `console-settings` | 단일 | — | `teamPins: string[]` 등 |
| `console-secrets` | 배열 | `itemId` | `FILE_KEY`에 itemId 키 등록. 암호문만 |
| `console-audit-log` | 배열 | `id` | 최대 5,000건 유지(오래된 것부터 정리) |

### 3.2 항목 필드

```ts
interface ConsoleItem {
  id: string;                 // 'item-' + 시간 + 난수, 또는 시드 id
  category: string;           // console-categories.id
  type: 'project' | 'link' | 'channel' | 'account';
  status: 'ok' | 'run' | 'needs-url' | 'planned';
  access_method: 'public' | 'sso' | 'invite' | 'shared-credential' | 'internal-login';
  visibility: '전체' | '팀' | '본인';
  team: '한국팀' | '방글라데시팀' | '공통';
  owners: { name: string; email?: string }[];   // 소유 판정은 email 로만
  url: string;                // '' 허용(주소 미확인)
  title: string; title_en: string;
  description: string; description_en: string;
  tags: string[];
  links: { label: string; label_en: string; url: string }[];
  note: string; note_en: string;               // 담당자·관리자에게만 내려감
  version: number;            // 갱신마다 +1 (충돌 검사)
  updatedAt: string; updatedBy: string;        // updatedBy 는 표시 이름
  deletedAt?: string; deletedBy?: string;      // 소프트 삭제
}
```

검증 규칙은 프로토타입 `validateDataset`을 서버로 옮긴다: URL은 `http:`·`https:`·`mailto:`만, 제목 200자, 설명 500자, 태그 20개×40자, 연동 주소 20개, 분류 id `^[a-z0-9-]{1,40}$`, 항목 3,000개 상한.

### 3.3 자격증명 보관

`src/lib/console/vault.ts` (Node 런타임)

- 키: `CONSOLE_SECRETS_KEY`, 64자리 hex(32바이트)만 허용. 다른 형식이면 scrypt 등으로 늘리지 않고 무효 처리 → 자격증명 기능만 503(항목 열람·편집은 계속 동작). 다른 세 비밀값과 같으면 무효.
- 암호화: AES-256-GCM, 필드마다 새 12바이트 IV, AAD = `console:v1:<itemId>:<field>` — 암호문을 다른 항목이나 다른 필드로 옮기면 복호화가 실패한다.
- 저장 형태:

```ts
interface ConsoleSecretRecord {
  itemId: string;
  login_id?: { v: 1; kv: 1; iv: string; tag: string; ct: string };
  password?: { v: 1; kv: 1; iv: string; tag: string; ct: string };
  updatedAt: string; updatedBy: string;
}
```

- `kv`(키 버전)는 후속 키 교체 도구를 위한 자리다. 이번에는 1만 쓴다.
- 항목의 접속 방식이 공유 계정이 아니게 바뀌면 그 항목의 비밀 레코드를 지운다(`removedIds`). 소프트 삭제 때는 지우지 않는다(되돌리기 대비).

### 3.4 사람 목록과 팀

```ts
interface ConsolePerson { email: string; name: string; name_en: string; team: '한국팀'|'방글라데시팀'|'공통'; role?: string; }
```

- 로그인 사용자의 팀은 이 목록에서 email로 찾는다. 없으면 `공통`(plan.md D3).
- 관리자 여부는 이 목록과 무관하다(`CONSOLE_ADMIN_EMAILS`만).
- 사람 목록(`name`·`name_en`·`team`·`email`)과 항목의 `owners[].email`은 로그인한 모든 사용자에게 같은 형태로 내려준다. `role`(직무 메모)은 관리자에게만 내려준다. 근거: 볼 수 있는 사람은 모두 구글이 인증한 `@try-n.com` 직원이고(같은 Workspace 디렉터리에서 서로의 주소가 이미 보임), 일반 사용자가 담당자를 고르려면 email이 있어야 한다. 한쪽 경로에서만 email을 빼면 다른 경로로 같은 정보가 나가므로(plan-audit CON-D12) 두 경로를 같게 둔다.

### 3.5 분류와 위키 구역

```ts
interface ConsoleCategory {
  id: string;                          // ^[a-z0-9-]{1,40}$, 'wiki' 는 예약
  kind: 'resource' | 'knowledge';      // 저장·파일에 없으면 'resource'
  icon: string; name: string; name_en: string;
  short: string; short_en: string;
  description: string; description_en: string;
}
```

- 필드 모양은 프로토타입 `CATEGORIES`(index.html L781~)와 같고 `kind`만 더한다. 기존 8개 분류와 프로토타입 내보내기 파일에는 `kind`가 없으므로 읽을 때 `resource`로 채운다. `resource`·`knowledge` 밖의 값은 검증 오류다.
- 내장 지식 분류: `src/lib/console/categories.ts`의 상수 `WIKI_CATEGORY = { id: 'wiki', kind: 'knowledge', icon: 'library', name: '위키', name_en: 'Wiki', short: '위키', short_en: 'Wiki', description: '팀이 함께 보는 지식 문서와 자료실', description_en: 'Shared knowledge pages and the team library' }`. bootstrap은 저장된 분류 앞에 이 상수를 붙여 내려준다. 아이콘 `library`(책꽂이 모양 마크)는 이번에 `brand-marks.ts` 아이콘 세트에 더하는 번들 SVG이고(REQ-CON-022), 일반 분류 `guides-team`의 `book`과 겹치지 않는다(REQ-CON-026). 쓰임 구분: 위키는 팀이 함께 읽는 지식 문서·자료실, `guides-team`은 가이드·교육·워크스페이스 도구. 직원 이름·주소·내부 id가 없으므로 코드에 두어도 시드 금지(REQ-CON-008)와 충돌하지 않는다.
- `wiki`는 예약 id다. 가져오기 파일의 `categories`에 `id: 'wiki'`가 있으면 그 항목은 무시하고 내장 정의를 쓴다(`kind`를 `resource`로 바꿀 수 없음). `POST /api/console/categories`는 `id: 'wiki'`나 `kind: 'knowledge'`를 400으로 거절하고 `resource` 분류만 만든다. 가져오기 파일의 `categories`에 `id`가 `wiki`가 아니면서 `kind: 'knowledge'`인 분류가 하나라도 있으면 가져오기 전체를 400으로 거절하고 저장된 문서를 하나도 바꾸지 않는다(§5.3). 그래서 저장된 분류에는 `knowledge`가 생기지 않고, 지식 분류는 언제나 내장 `wiki` 하나다. 항목 검증의 "알려진 분류 id"에는 `wiki`가 들어가고, 항목 추가·편집 양식의 분류 선택지는 맨 앞에 위키, 그 뒤에 일반 분류를 둔다(로그인한 누구나 위키 항목을 만들 수 있음, REQ-CON-010).
- 메뉴 묶음은 순수 함수 `groupNavCategories(categories)` → `{ wiki: WIKI_CATEGORY, regular: [...] }`로 계산한다(단위 테스트 대상). `wiki`는 언제나 내장 상수이고, `regular`는 저장된 `resource` 분류 전부다(위 거절 규칙 때문에 저장된 `knowledge` 분류는 없다).
- 메뉴 모양(프로토타입 `renderSide` 방식): 위키 구역은 별도 제목 없이 링크 **한 줄**이다. 아이콘 `library`, 글자 `nav.wiki`("위키" / "Wiki"), 삭제되지 않은 위키 항목 수, 주소 `#/cat/wiki`(다른 분류 링크와 같은 `cat:wiki` 화면). 메뉴에 위키 항목 링크를 하나씩 늘어놓지 않는다. 링크를 누르면 본문에 위키 항목 목록(다른 분류와 같은 목록 행, 상세 패널)을 띄운다. 왼쪽 메뉴 순서: 홈 → 전체 항목 → 구분선 → 위키 링크 → 구분선(`role="separator"`) → 분류 제목(`cats`) → 일반 분류 → 구분선 → 공유 계정 → 내 항목.
- 위키 항목은 `category: 'wiki'`인 보통 항목이다. 권한·편집·삭제·자격증명·감사 기록 규칙이 다른 항목과 같고, 전체 항목·검색·내 항목·최근 수정에도 나온다. 홈의 분류별 요약은 일반 분류만 센다.
- 빈 상태: 삭제되지 않은 위키 항목이 없으면 위키 링크의 개수는 0이고, 링크를 눌렀을 때 본문의 목록 자리에 `wiki.empty` 안내를 보인다.
- 첫 항목인 워크숍 위키(`자료실 · 대라천 참 침향 위키`, `https://zoel-workshop.vercel.app/apps/wiki`, `access_method: 'sso'`, `team: '공통'`)는 오너가 시드 파일의 `cards`에 넣어 가져온다(plan.md §7 4번). 담당자 이름은 시드 파일에만 적고 저장소에 남기지 않는다.
- 이번 판의 지식 친화 성질(spec.md §4): 항목 id는 가져오기·내보내기 왕복에서 유지되고, 한·영 짝 필드와 `owners`·`updatedAt`이 내보내기에 남으며, 내보내기에는 자격증명이 없다.

## 4. 권한

### 4.1 비밀값 점검 (`src/lib/console/config.ts`)

| 변수 | 조건 | 무효일 때 |
|---|---|---|
| `CONSOLE_SESSION_SECRET` | trim 후 32자 이상, 아래 "비교 대상" 중 설정된 값 모두와 다름 | 콘솔 전체 닫힘 |
| `CONSOLE_SECRETS_KEY` | 64자리 hex, `CONSOLE_SESSION_SECRET`과 아래 "비교 대상" 중 설정된 값 모두와 다름 | 자격증명 기능만 닫힘 |
| `CONSOLE_ADMIN_EMAILS` | 쉼표 구분, trim·소문자, `@try-n.com` 정확 일치만 채택 | 관리자 0명(편집은 본인 항목만) |

비교 대상: `ADMIN_SESSION_SECRET`, `WORKSHOP_SSO_SECRET`, `PARTNER_SESSION_SECRET`, `SERIAL_SCAN_SECRET`, `QR_TRACK_SECRET`, `BACKUP_ENCRYPTION_KEY`. 미설정인 변수는 비교에서 빠진다(그 변수들이 코드에서 `ADMIN_SESSION_SECRET`으로 폴백하더라도 `ADMIN_SESSION_SECRET` 자체와 비교하므로 결과는 같다). 비교는 trim한 값끼리 상수시간으로 한다.

무효 사유는 로그에 사유만 남기고 값은 남기지 않는다. 어떤 변수에도 리터럴 기본값을 두지 않고, 콘솔 코드는 다른 비밀값 변수를 읽어 서명에 쓰지 않는다(비교 용도로만 읽음).

### 4.2 판정 함수 (`src/lib/console/permissions.ts`, 순수 함수 — 단위 테스트 대상)

```
isAdmin(user)        = CONSOLE_ADMIN_EMAILS 에 user.email
isOwner(user, item)  = item.owners 중 email 이 user.email 과 같은 것이 있음 (소문자 비교)
canEdit(user, item)  = isAdmin || isOwner
credAccess(user, item, team):
  isAdmin || isOwner            → ok
  visibility == '본인'           → denied
  visibility == '팀' && item.team != '공통' && item.team != team → denied
  그 밖                          → ok
```

- 새 항목: 만든 사람이 owners에 자동으로 들어간다.
- 관리자가 아닌 사람이 저장할 때 owners에서 자기 자신을 빼면 서버가 거부한다(자기 잠금 방지).
- `note`·`note_en`은 `canEdit`일 때만 응답에 넣는다.

## 5. API

모든 응답에 `Cache-Control: no-store`. 상태를 바꾸는 요청은 `Origin`이 `NEXT_PUBLIC_SITE_URL` 또는 요청 origin과 같아야 하고 `Content-Type: application/json`이어야 한다(아니면 403).

| 메서드·경로 | 권한 | 내용 |
|---|---|---|
| `GET /api/console/bootstrap` | 로그인 | me(이름·팀·관리자 여부), categories, people(공개 필드), settings, items(목록 형태) |
| `POST /api/console/items` | 로그인 | 생성. 자격증명 필드가 있으면 암호화해 secrets에 기록 |
| `PATCH /api/console/items/:id` | canEdit | `version` 필수, 다르면 409. 비밀번호 칸이 비면 유지, `clearPassword: true`면 삭제 |
| `DELETE /api/console/items/:id` | canEdit | 소프트 삭제 |
| `POST /api/console/items/:id/restore` | canEdit(삭제 전 기준) | 되돌리기 |
| `POST /api/console/items/:id/credential` | credAccess | body `{field: 'login_id'|'password', purpose: 'view'|'copy'}` → `{value}` |
| `POST /api/console/categories` | 관리자 | 일반(`resource`) 분류 추가. `id: 'wiki'`·`kind: 'knowledge'`는 400(§3.5) |
| `PUT /api/console/people` | 관리자 | 사람 목록 교체(§5.4 교체 쓰기 규칙) |
| `PUT /api/console/settings` | 관리자 | 팀 필수 고정 목록 `teamPins`(최대 8개, 있는 항목 id만). 감사 `settings.update` |
| `POST /api/console/import` | 관리자 | §5.3 형식의 파일로 항목(+선택: categories, people, teamPins) 전체 교체(§5.4). 파일 안의 `password`·`login_id`는 읽지 않음 |
| `GET /api/console/export` | 관리자 | 자격증명 없는 JSON. `items`와 `categories`(`kind` 포함, 내장 `wiki` 제외) |
| `GET /api/console/audit` | 관리자 | 최근 200건 |
| `POST /api/console/auth/logout` | 누구나 | 쿠키 삭제 |

목록 형태의 항목에는 `note`(권한 없을 때), `deletedAt` 항목, 자격증명 값이 없고 대신 `hasLoginId`, `hasPassword`, `canEdit`, `credAccess`(`ok`|`denied`)가 붙는다. `owners`는 `{name, email?}` 그대로 내려간다(§3.4).

### 5.1 자격증명 열람 순서

1. 세션·Origin 검사 → 항목 조회(삭제된 항목이면 404)
2. `credAccess` 판정 → denied면 감사 기록 `credential.deny` 후 403
3. 열람 상한: 같은 사용자의 최근 10분간 `credential.view`·`credential.copy` 기록이 30건 이상이면 감사 기록 `credential.rate_limited` 후 429. 별도 저장소 없이 `console-audit-log`에서 센다.
4. 감사 기록 `credential.view` 또는 `credential.copy`를 **먼저** 쓴다. 기록에 실패하면 값을 내주지 않고 503.
5. 복호화 → `{ value }` 반환. 복호화 실패(키 불일치·변조)면 값 없이 500, 사유 코드만 로그.

### 5.2 감사 기록 형식

기존 `AuditEntry`와 같은 모양을 쓰되 콘솔 전용 문서에 쓴다(기존 `audit-log`의 2,000건 한도를 열람 기록이 밀어내지 않도록).

```ts
{ id, at, actor: email, actorRole: 'console-admin' | 'console-member',
  module: 'console', action: 'auth.login' | 'auth.login_failed' | 'item.create' | 'item.update' | 'item.delete'
        | 'item.restore' | 'credential.view' | 'credential.copy' | 'credential.deny' | 'credential.rate_limited'
        | 'import' | 'people.update' | 'category.create' | 'settings.update',
  targetId?, summary?, meta? }   // meta 에 값·암호문·토큰을 넣지 않는다. field 이름만.
```

`src/lib/audit.ts`의 `AuditModule`에 `'console'`을 추가해 로그인 1줄은 기존 기록에도 남긴다(`auditSsoLogin`과 같은 방식).

기록 추가는 fresh 읽기 → 추가 → 5,000건 넘는 오래된 것 정리 → `writeDataMerged('console-audit-log', next, { removedIds: 정리한 id들 })` 순서다. 정리한 id를 `removedIds`로 넘기지 않으면 §5.4의 이유로 정리한 기록이 되살아난다.

### 5.3 가져오기 형식

순수 함수 `mapImportFile(file, { now, actor, storedCategories })` → `{ items, categories?, people?, teamPins?, report }` 또는 오류 목록. 단위 테스트 대상이며 저장은 하지 않는다. 하나라도 오류가 있으면 아무것도 쓰지 않고 400과 오류 목록(레코드 번호·사유)을 돌려준다(원자적).

받는 파일 모양(JSON 객체, 크기 2MB 이하):

| 키 | 필수 | 내용 |
|---|---|---|
| `cards` 또는 `items` | 둘 중 정확히 하나 | `cards`: 프로토타입 "JSON 내보내기" 형식(`{app:'zoel-console', version:2, exportedAt, categories, cards[]}`). 최상위가 배열이면 `{cards: 배열}`로 본다(프로토타입 `validateDataset`과 같음). `items`: 콘솔 내보내기 형식(`GET /api/console/export`) |
| `categories` | 선택 | 있으면 저장된 분류를 이 목록으로 교체. 없으면 저장된 분류 유지. `kind`가 없으면 `resource`, 모르는 값이면 오류. `id: 'wiki'` 항목은 무시(§3.5). `id`가 `wiki`가 아닌데 `kind`가 `knowledge`면 오류(400, 저장 문서 변경 없음). 항목이 쓰는 분류 id는 모두 최종 분류 목록(내장 `wiki` 포함)에 있어야 함 |
| `people` | 선택 | 있으면 사람 목록 교체. 프로토타입 내보내기에는 없으므로 오너가 직접 붙인다(plan.md D1) |
| `teamPins` | 선택 | 있으면 `console-settings.teamPins` 교체. 프로토타입 `TEAM_PINS`(index.html L544)는 내보내기에 들어 있지 않으므로 옮기려면 오너가 이 키로 붙인다. 없으면 저장된 값 유지 |
| `app`, `version`, `exportedAt` | 선택 | 읽지 않음(형식 판별에 쓰지 않음) |

카드·항목 필드 대응:

- 받는 필드만 화이트리스트로 읽는다: `id`, `category`, `type`, `status`, `access_method`, `visibility`, `team`, `url`, `title`, `title_en`, `description`, `description_en`, `tags`, `links`, `note`, `note_en`, 그리고 `owner`(cards) 또는 `owners`(items). 그 밖의 키 — `password`, `login_id`(프로토타입 내보내기에는 `login_id`가 들어 있음), `version`, `updatedAt`, `deletedAt`, `hasPassword` 등 — 는 버린다.
- `id`가 없으면 새로 만든다. 파일 안에서 `id`가 겹치면 오류.
- enum·URL·길이 검사는 §3.2 규칙 그대로(프로토타입처럼 모르는 값을 기본값으로 바꾸지 않고 오류로 처리).
- `version: 1`, `updatedAt: now`, `updatedBy: actor 이름`으로 새로 찍는다. 삭제 표시는 들어오지 않는다.

담당자 대응(`owner` 문자열 → `owners[]`):

1. `owner`를 쉼표(`,`, 전각 `，` 포함)로 나누고 각 조각을 trim, NFC 정규화, 연속 공백을 공백 하나로 줄인다. 빈 조각은 버린다. 빈 문자열이면 `owners: []`(담당자 없음).
2. 각 이름을 최종 사람 목록(파일에 `people`이 있으면 그 목록, 없으면 저장된 목록)의 `name`과 같은 정규화로 비교한다. 정확히 한 사람과 맞으면 `{name, email}`.
3. 맞는 사람이 없거나 둘 이상이면 `{name}`만 둔다(소유자로 판정되지 않음 — 관리자만 고칠 수 있음). 그 이름은 결과의 `report.unmatchedOwners`에 한 번씩 들어간다.
4. 항목당 담당자 최대 10명.
- `items` 형식의 `owners[]`는 그대로 받되 email은 소문자로 바꾸고 `@try-n.com` 정확 일치가 아니면 email을 빼고 `{name}`만 둔다(`report.unmatchedOwners`에 기록).

사람 목록 대응(`people[]`):

- 받는 필드: `email`, `name`, `name_en`, `team`, `role`. 프로토타입 `PEOPLE`의 `admin`, `email_hint`는 읽지 않는다. 관리자는 `CONSOLE_ADMIN_EMAILS`로만 정해지므로 `admin: true`는 아무 효과가 없다. `email_hint`는 email로 쓰지 않는다(값을 확인한 사람이 `email`에 직접 넣는다).
- `email`은 trim·소문자, `@try-n.com` 정확 일치여야 한다. 없거나 맞지 않는 사람은 저장하지 않고 `report.peopleSkipped`(이름)에 넣는다. email이 겹치면 오류.
- `team`은 세 값 중 하나, 아니면 오류.

결과 `report`: `{ items: n, categories: n|null, people: n|null, teamPins: n|null, removed: { items, people, categories }, unmatchedOwners: string[], peopleSkipped: string[] }` — 화면은 이를 가져오기 결과로 보여 준다.

### 5.4 교체 쓰기 규칙 (`writeDataMerged`의 되살리기 주의)

`writeDataMerged`(db.ts L820-827)는 fresh 읽기에는 있고 새 배열에는 없는 레코드를 "동시 쓰기"로 보고 되살린다. `removedIds`에 든 키만 되살리지 않는다. 그래서 "교체" 성격의 쓰기는 반드시 지운 키를 넘긴다.

| 쓰기 | `removedIds` |
|---|---|
| 가져오기 — `console-items` | 저장된 모든 항목 id(소프트 삭제된 것 포함) − 새 항목 id |
| 가져오기 — `console-categories`(파일에 있을 때) | 저장된 분류 id − 새 분류 id |
| 가져오기·`PUT /people` — `console-people` | 저장된 email − 새 email |
| 가져오기 — `console-secrets` | 저장된 itemId 중 (새 항목에 없음) 또는 (새 항목의 접속 방식이 공유 계정이 아님) |
| PATCH(공유 계정 → 다른 방식) — `console-secrets` | `[itemId]` |
| 감사 기록 정리 — `console-audit-log` | 정리한 기록 id |

- 가져오기 뒤에도 남는 공유 계정 항목(같은 id, 같은 접속 방식)의 비밀 레코드는 유지한다. 파일 안의 값으로 덮어쓰지 않는다.
- 콘솔 문서는 `TOMBSTONE_FILES`(db.ts L145-148)에 넣지 않는다. 그래서 `removedIds`로 지운 id를 다음 가져오기에서 다시 들여올 수 있다(테스트로 고정).
- 쓰기 순서: 항목 → 분류 → 사람 → 비밀 → 설정. 중간 실패 시 500과 실패 단계 이름을 돌려주고, 같은 파일을 다시 가져오면 같은 결과가 된다(멱등).

## 6. 화면

### 6.1 파일

- `src/app/console/layout.tsx` — `metadata.robots = { index: false, follow: false }`, 콘솔 루트 래퍼
- `src/app/console/page.tsx` — 서버 컴포넌트. 데이터 없이 `<ConsoleApp />`만 렌더
- `src/app/console/login/page.tsx` — "try-n.com 계정으로 로그인" 버튼(→ `/api/admin/auth/google/start?next=<복귀 경로>`). 복귀 경로는 쿼리 `next`가 `isConsoleNext`를 통과하면 그 값, 아니면 `/console`(인코딩해 넘김). 오류 코드 안내(한·영, §2.3의 코드 전부)
- `src/app/console/ConsoleApp.tsx` 외 하위 컴포넌트(사이드바, 홈, 목록, 상세 패널, 편집 양식, 계정 메뉴, 검색) — 프로토타입 DOM 로직을 React로 옮긴다
- `src/app/console/console.module.css` — 프로토타입 CSS 이식(라이트 팔레트만)
- `src/lib/console/i18n.ts` — 프로토타입 `I18N` 이식, 자격증명 안내 문구는 배포판 문구로 교체. 위키 구역 키 `nav.wiki`("위키" / "Wiki"), `wiki.empty`("아직 위키 항목이 없습니다. 항목을 추가할 때 분류를 위키로 고르면 여기에 나옵니다." / "No wiki entries yet. Add an item and choose Wiki as its category to list it here.")를 두 언어에 같이 둔다
- `src/lib/console/categories.ts` — 내장 `WIKI_CATEGORY`, `kind` 기본값 채우기, `groupNavCategories`(§3.5)
- `src/lib/console/brand-marks.ts` — 프로토타입 `brandOf`·`MARKS`·`LETTERS` 이식(상수 SVG 문자열, 사용자 데이터는 넣지 않음)

### 6.2 스타일 격리

- 루트 요소에 `data-admin-root="console"`을 단다. `dark-theme.css`의 입력칸·label 강제 규칙은 `:not([data-admin-root] *)`로 속성 **존재**만 보고 빠지므로 콘솔도 제외되고, 값이 `"true"`가 아니어서 `globals.css`의 관리자 라이트 테마(`[data-admin-root="true"]`)는 적용되지 않는다. 실행 단계에서 실제 렌더로 확인한다.
- 루트가 화면 전체를 덮고 배경 `#faf8f3`, 글자 `#1c1b18`을 직접 지정한다. `h1~h6 { color: inherit !important }`는 루트 색을 물려받으므로 문제없다.
- `var(--lx-*)`, `var(--accent)` 등 사이트 전역 토큰은 쓰지 않는다. 프로토타입의 `--bg` 같은 변수는 CSS 모듈 루트 클래스 안에서만 선언한다(`:root` 금지).
- `ChromeGate`의 `IMMERSIVE_PREFIXES`에 `/console`을 넣어 공개 사이트 헤더·푸터를 숨긴다.
- `data-admin-root`로 피할 수 있는 것은 입력칸·label·table 규칙뿐이다. `dark-theme.css`의 나머지 전역 규칙을 피하려고 다음을 금지한다.
  - 전역 클래스 이름 문자열: 콘솔 마크업에 `className="card"` 같은 평문 클래스를 쓰지 않는다. 특히 `card`, `page`, `container`, `shell`, `nav`, `topbar`, `hero`, `step`, `footer`(dark-theme.css L32-125, L386-390). CSS 모듈이 만든 해시 클래스만 쓴다.
  - `<footer>` 요소: `footer, .footer { background … !important }`에 걸리므로 콘솔은 쓰지 않는다(`<div role="contentinfo">` 등으로 대신).
  - 제목 색: `h1~h6 { color: inherit !important }` 때문에 제목에 색을 직접 줄 수 없다. 제목 색은 감싸는 요소의 `color`로 준다.
  - 루트 밖 포털: 대화상자·토스트·메뉴를 `document.body`에 포털로 그리지 않는다. 모두 콘솔 루트 요소 안에 그린다(네이티브 `<dialog>`를 쓸 때도 루트 안에 둔다).

### 6.3 프로토타입과 달라지는 점

| 프로토타입 | 배포판 |
|---|---|
| 모의 로그인(직원 고르기) | 실제 구글 로그인, 로그인 전에는 콘솔 화면 자체가 없음 |
| 브라우저 저장소 데이터 | API + Blob |
| 비밀번호를 브라우저 메모리에 보관 | 눈 아이콘·복사 때마다 서버 요청, 화면을 떠나면 값 폐기 |
| 이름으로 담당자 판정, 관리자 = PEOPLE.admin | email로 판정, 관리자 = `CONSOLE_ADMIN_EMAILS` |
| 누구나 JSON 내보내기·가져오기·초기화 | 관리자만 가져오기·내보내기, 초기화 없음 |
| 테마 메뉴(시스템·라이트·다크) | 라이트만(plan.md D7) |
| `protoNote`·`siProto`·`pwProto` 문구 | 삭제 또는 배포판 문구로 교체 |

고정(핀)은 프로토타입처럼 브라우저 저장소에 사용자 email별로 둔다.

## 7. 검색 노출

- `src/app/robots.ts`: `*` 그룹과 AI 크롤러 그룹의 disallow 배열에 `/console` 추가(`/api/`는 이미 있음)
- `vercel.json` 또는 `next.config.ts` headers: `/console/:path*`, `/console`, `/api/console/:path*`에 `X-Robots-Tag: noindex, nofollow`(미들웨어와 이중)
- `src/app/sitemap.ts`: 콘솔 경로가 들어가지 않음을 테스트로 고정

## 8. 운영 연동

- `src/lib/env-check.ts`의 `ENV_REGISTRY`에 세 변수 등록(severity `feature`, 존재 여부만)
- `src/lib/backup.ts`의 `DB_FILES`에 `console-items`, `console-categories`, `console-people`, `console-secrets`, `console-audit-log`, `SINGLETON_FILES`에 `console-settings` 추가. 백업은 이미 `BACKUP_ENCRYPTION_KEY`로 암호화되고, `console-secrets`는 그 안에서도 암호문이다. 키(`CONSOLE_SECRETS_KEY`)는 백업에 들어가지 않는다.
