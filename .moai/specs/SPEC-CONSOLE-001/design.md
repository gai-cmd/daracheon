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

- `sanitizeNextPath`: 기존 `/admin` 규칙은 그대로 두고, `/console` 정확 일치 또는 `/console/`로 시작하는 경로를 추가로 허용한다. `//`로 시작하는 값, `/console-x`·`/consolex` 같은 접두 유사 경로, 절대 URL은 기존처럼 `/admin`으로 떨어진다.
- 새 판정 함수 `isConsoleNext(next)`: 위 두 형태일 때만 true. start·callback이 같은 함수를 쓴다.

### 2.2 start 라우트

- OAuth 설정이 없을 때 콘솔 모드면 `/console/login?error=sso_not_configured`로, 아니면 기존대로 `/admin/login`으로 보낸다.
- 콘솔 세션 비밀값이 무효(§4.1)면 콘솔 모드 진입 자체를 거부하고 `/console/login?error=console_not_configured`.

### 2.3 callback 라우트 — 콘솔 분기

state 검증·코드 교환·userinfo 조회까지는 기존 코드를 그대로 쓰고, admin-users 조회 **이전에** 분기한다.

```
if (isConsoleNext(next)) return consoleEntry(...)   // admin-users 를 읽지도 쓰지도 않는다
```

`consoleEntry` 판정(전부 충족해야 통과):

1. `decodeGoogleIdToken(tokens.id_token)` 성공(iss·exp 검사 포함), ID 토큰 email(소문자)이 userinfo email과 같음
2. `isWorkshopOpenAccount({email, emailVerified: userinfo.email_verified === true && claims.email_verified === true, hd, aud}, {clientId, domains: ['try-n.com']})` — 이 함수가 이미 `@` 1개, 정확한 도메인 일치, `hd` 일치, `aud` 일치를 검사한다. 콘솔 도메인 목록은 `WORKSHOP_OPEN_DOMAINS`를 읽지 않고 상수 `['try-n.com']`으로 고정한다(워크숍 설정 변경이 콘솔 출입을 넓히지 않도록).
3. 통과: 콘솔 감사 기록 `auth.login`, 기존 감사 기록(`audit-log`, module `auth`)에도 "콘솔 입장" 1줄 → 콘솔 쿠키 발급 → `next`로 302 → OAuth 임시 쿠키 정리.
4. 실패: 콘솔 감사 기록 `auth.login_failed`(사유 코드만, 토큰 원문 없음) + 기존 감사 기록 → `/console/login?error=not_allowed`.

관리자 세션 쿠키는 이 분기에서 설정·삭제·갱신하지 않는다.

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
| `/api/console/auth/logout` | 통과 | 통과 |
| `/api/console/*` | 401 JSON | 503 JSON |

통과한 응답에 `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`를 붙인다. 관리자 쿠키는 이 블록에서 검사하지 않는다(서로 무효).

## 3. 데이터

모든 문서는 `src/lib/db.ts`의 `readData` / `readDataForWrite` / `writeDataMerged` / `readSingle` / `writeSingle`로 읽고 쓴다(기존 비밀 prefix 아래, 기존 Blob 스토어). 개발 환경(Blob 토큰 없음)에서는 `data/db/console-*.json`에 쓰이며 이 경로는 `.gitignore`(data/db 전체)로 커밋되지 않는다. `.vercelignore`의 화이트리스트에 넣지 않는다.

### 3.1 문서 목록

| 문서 | 형태 | 키 | 비고 |
|---|---|---|---|
| `console-items` | 배열 | `id` | 항목. 자격증명 없음 |
| `console-categories` | 배열 | `id` | 8개 분류 + 관리자가 추가한 분류 |
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
- 일반 사용자에게는 담당자 고르기용으로 `name`·`name_en`·`team`만 내려주고 email은 관리자에게만 내려준다.

## 4. 권한

### 4.1 비밀값 점검 (`src/lib/console/config.ts`)

| 변수 | 조건 | 무효일 때 |
|---|---|---|
| `CONSOLE_SESSION_SECRET` | trim 후 32자 이상, `ADMIN_SESSION_SECRET`·`WORKSHOP_SSO_SECRET`·`CONSOLE_SECRETS_KEY`와 다름 | 콘솔 전체 닫힘 |
| `CONSOLE_SECRETS_KEY` | 64자리 hex, 위 세 값과 다름 | 자격증명 기능만 닫힘 |
| `CONSOLE_ADMIN_EMAILS` | 쉼표 구분, trim·소문자, `@try-n.com` 정확 일치만 채택 | 관리자 0명(편집은 본인 항목만) |

무효 사유는 로그에 사유만 남기고 값은 남기지 않는다. 어떤 변수에도 리터럴 기본값을 두지 않는다.

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
| `POST /api/console/categories` | 관리자 | 분류 추가 |
| `PUT /api/console/people` | 관리자 | 사람 목록 교체 |
| `PUT /api/console/settings` | 관리자 | 팀 필수 고정 목록 |
| `POST /api/console/import` | 관리자 | 항목(+선택: categories, people) 전체 교체. 파일 안의 `password`·`login_id`는 읽지 않음 |
| `GET /api/console/export` | 관리자 | 자격증명 없는 JSON |
| `GET /api/console/audit` | 관리자 | 최근 200건 |
| `POST /api/console/auth/logout` | 누구나 | 쿠키 삭제 |

목록 형태의 항목에는 `note`(권한 없을 때), `deletedAt` 항목, 자격증명 값이 없고 대신 `hasLoginId`, `hasPassword`, `canEdit`, `credAccess`(`ok`|`denied`)가 붙는다.

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

## 6. 화면

### 6.1 파일

- `src/app/console/layout.tsx` — `metadata.robots = { index: false, follow: false }`, 콘솔 루트 래퍼
- `src/app/console/page.tsx` — 서버 컴포넌트. 데이터 없이 `<ConsoleApp />`만 렌더
- `src/app/console/login/page.tsx` — "try-n.com 계정으로 로그인" 버튼(→ `/api/admin/auth/google/start?next=/console`), 오류 코드 안내(한·영)
- `src/app/console/ConsoleApp.tsx` 외 하위 컴포넌트(사이드바, 홈, 목록, 상세 패널, 편집 양식, 계정 메뉴, 검색) — 프로토타입 DOM 로직을 React로 옮긴다
- `src/app/console/console.module.css` — 프로토타입 CSS 이식(라이트 팔레트만)
- `src/lib/console/i18n.ts` — 프로토타입 `I18N` 이식, 자격증명 안내 문구는 배포판 문구로 교체
- `src/lib/console/brand-marks.ts` — 프로토타입 `brandOf`·`MARKS`·`LETTERS` 이식(상수 SVG 문자열, 사용자 데이터는 넣지 않음)

### 6.2 스타일 격리

- 루트 요소에 `data-admin-root="console"`을 단다. `dark-theme.css`의 입력칸·label 강제 규칙은 `:not([data-admin-root] *)`로 속성 **존재**만 보고 빠지므로 콘솔도 제외되고, 값이 `"true"`가 아니어서 `globals.css`의 관리자 라이트 테마(`[data-admin-root="true"]`)는 적용되지 않는다. 실행 단계에서 실제 렌더로 확인한다.
- 루트가 화면 전체를 덮고 배경 `#faf8f3`, 글자 `#1c1b18`을 직접 지정한다. `h1~h6 { color: inherit !important }`는 루트 색을 물려받으므로 문제없다.
- `var(--lx-*)`, `var(--accent)` 등 사이트 전역 토큰은 쓰지 않는다. 프로토타입의 `--bg` 같은 변수는 CSS 모듈 루트 클래스 안에서만 선언한다(`:root` 금지).
- `ChromeGate`의 `IMMERSIVE_PREFIXES`에 `/console`을 넣어 공개 사이트 헤더·푸터를 숨긴다.

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
