# SPEC-CONSOLE-002 — 설계 (design.md)

이 문서는 SPEC-CONSOLE-002의 결정(§1)과 설계(§2)를 담는다. 0.2.0까지 plan.md §1~§2에 있던 내용을 Tier L 승격(plan-audit CS2-PA-D6, 리드 결정 (a))에 따라 그대로 옮기고, 입력 칸 속성 절(§2.7)과 요구사항·설계 대응표(§3)를 더했다. 구현 순서·파일 목록·위험·완료 조건은 plan.md, 코드 조사 근거는 research.md, 판정 절차는 acceptance.md에 있다.

결정 번호 CS2-D1~D12와 절 번호 §2.1~§2.6은 0.2.0 plan.md와 같다. 0.5.0 추가분(M3·M4)은 결정 CS2-D13~D28과 절 §2.8~§2.15를 더했다. 다른 문서와 감사 보고서가 이 번호를 그대로 가리킬 수 있게 바꾸지 않았다.

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
| CS2-D8 | 로그인 열기는 "아이디 복사 → 새 탭 열기" 순서. 새 탭은 `noopener` 없이 빈 탭으로 열고, 열린 뒤 `opener`를 끊고 주소로 보낸다 | 새 탭을 먼저 열면 콘솔 문서가 포커스를 잃어 `navigator.clipboard.writeText`가 거절된다. 대신 비동기 요청 뒤 열기는 팝업 차단에 걸릴 수 있어, 막히면 링크를 띄운다(REQ-CS2-014). `window.open`에 `noopener`를 주면 HTML 표준상 열기에 성공해도 반환값이 언제나 `null`이라 차단 여부를 알 수 없다(plan-audit CS2-PA-D2, 표준 지식 근거 — 실행 단계 AC-CS2-014에서 확인) |
| CS2-D9 | 사용 기록은 펼칠 때 불러온다 | 패널을 열 때마다 요청하지 않는다. 담당자가 아닌 사람에겐 섹션 자체가 없다 |
| CS2-D10 | 안내 확인 값은 bootstrap 최상위 `prefs.autofillGuideAck`에 둔다. `me`는 건드리지 않는다 | 기존 `bootstrap.test.ts:L33`이 `me`를 `toEqual`로 엄격 비교한다. `me` 밖에 두면 SPEC-CONSOLE-001 테스트를 고치지 않아도 된다(plan-audit CS2-PA-D4) |
| CS2-D11 | 저장된 계정 정보가 있는 항목을 링크로 바꿔 저장하면 저장 전에 삭제 확인을 받는다. 서버 동작(공유 계정에서 벗어나면 비밀 기록 삭제)은 바꾸지 않는다 | 기존 PATCH는 접속 방식이 `shared-credential`이 아니면 비밀 기록을 지운다(`src/app/api/console/items/[id]/route.ts:L24~L25`, `store.ts` `planSecretChange` L94). 종류 선택이 양식 맨 위로 올라와 실수로 누르기 쉬워졌으므로 화면에서 막는다. 서버에서 비밀 기록을 남겨 두는 방식은 링크 항목에 쓰이지 않는 암호문을 남기고 SPEC-CONSOLE-001 동작을 바꾸므로 택하지 않는다(plan-audit CS2-PA-D3) |
| CS2-D12 | 종류를 링크 → 공유 계정 → 링크로 왕복하면, 양식이 마지막으로 링크였을 때의 형식·접속 방식으로 되돌린다 | `project`·`sso` 같은 원래 값을 잃지 않게 한다. 링크였던 적이 없으면(새 항목, 공유 계정으로 열린 항목) `link`·`public`(plan-audit CS2-PA-D7) |
| CS2-D13 | (0.5.0) "목록"은 지금의 행을 다듬어 쓰고, "카드"는 새로 만든다 | 리드 범위 문구는 "카드 = 지금의 같은 높이 카드 격자"였지만, 코드에는 항목 카드 격자가 없다. 목록 보기는 SPEC-CONSOLE-001 REQ-CON-020의 단일 높이 행뿐이고(`ListView.tsx` `<ul className={s.rows}>`, 주석 "no density toggle"), 격자는 홈 고정 칩(`.pins` 4열)뿐이다(research.md §5.1). 그래서 카드 모양은 고정 칩·분류 요약 칸의 시각 언어(흰 바탕, `#e3dfd4` 계열 테두리, 둥근 모서리)를 따르는 새 컴포넌트로 둔다. 행의 둘째 줄은 리드 범위대로 설명(없으면 호스트)으로 바꾼다 |
| CS2-D14 | (0.5.0) 보기 방식은 브라우저 하나에 하나, 모든 항목 목록 보기가 함께 쓴다. 키 `zoel-console:view`, 값 `list`·`cards` | 보기마다 따로 기억하면 사용자가 "왜 여기선 카드지"를 겪는다. 기존 `LANG_STORAGE_KEY`(`zoel-console:lang`)와 같은 이름 규칙. 저장값이 없으면 폭 480px 이하 목록, 그보다 넓으면 카드(리드 범위) |
| CS2-D15 | (0.5.0) 홈의 고정 칩과 분류별 요약에는 보기 전환을 두지 않는다. 홈 "최근 수정한 카드" 펼침은 목록 보기로 보고 전환을 따른다 | 칩과 요약은 항목 목록이 아니라 바로 가기 묶음이다. 첫 화면을 단순하게 두라는 오너 피드백(직원 화면은 단순하게)과도 맞다 |
| CS2-D16 | (0.5.0) 영어 화면 양식은 칸 위치는 그대로 두고, 그 자리에 들어가는 값만 영문 칸으로 바꾼다. 한국어 칸은 더 보기 안 "Korean text" 묶음으로 옮긴다. 한국어 제목이 비면 저장할 때 영문 제목을 한국어 제목에도 넣는다 | 서버는 한국어 `title`을 필수로 검사한다(`validate.ts:L178`). 서버 규칙을 바꾸면 SPEC-CONSOLE-001 동작과 테스트가 바뀌므로 화면에서 채운다. 한국어 화면에서는 REQ-CON-023 대체 규칙대로 그 값이 보이므로 손실이 없다 |
| CS2-D17 | (0.5.0) 사람 영문 이름은 화면에서 사람 목록(`people[].name_en`)을 email로 찾아 쓴다. bootstrap `me`에는 칸을 더하지 않는다 | bootstrap은 이미 `people`에 `name_en`을 담아 보낸다(`bootstrap/route.ts` L58~L65). `me`를 바꾸면 `bootstrap.test.ts`의 엄격 비교가 깨진다(CS2-D10과 같은 이유) |
| CS2-D18 | (0.5.0) 한글 문자열 검사는 `src/app/console/**/*.tsx`(테스트 폴더 제외)만, 주석은 빼고, 허용 목록은 (파일, 문자열, 이유) 세 칸 | 코드 주석은 한국어가 규칙이다(`language.yaml` `code_comments: ko`). 현재 남은 한글 문자열은 데이터 값(팀·공개 범위 이름), 언어 선택기의 자국어 이름(`한국어`·`한`), 페이지 메타데이터 제목 정도다(research.md §5.4). 쓰이지 않는 허용 항목도 실패로 잡아 목록이 낡지 않게 한다 |
| CS2-D19 | (0.5.0) 채널 목록은 새 문서가 아니라 기존 `console-settings` 문서의 `channels` 칸에 둔다. 읽기·저장은 새 경로 `GET`·`PUT /api/console/channels`(관리자 전용) | 설정 문서는 이미 백업 대상이고(`backup.ts`), 새 문서를 만들면 `FILE_KEY`·`DB_FILES`·등록 테스트를 함께 고쳐야 한다. 기존 `PUT /api/console/settings`는 `teamPins`가 없으면 400인 계약이라, 그 경로에 칸을 얹으면 SPEC-CONSOLE-001 계약이 흔들린다. 새 경로는 `{ ...현재 문서, channels }`로 써서 `teamPins`를 보존한다 |
| CS2-D20 | (0.5.0) 피드는 bootstrap에 넣지 않고 홈이 그려진 뒤 따로 부른다 | 바깥 피드는 느리거나 실패할 수 있다. bootstrap에 넣으면 콘솔 첫 화면 전체가 가장 느린 피드를 기다린다 |
| CS2-D21 | (0.5.0) 캐시는 서버 메모리의 `Map`, 키는 출처마다 `${kind}:${source}`, 성공 30분·실패 5분 | 리드 범위("채널 설정 해시로 키")를 출처 단위로 잘게 나눴다. 채널 하나를 고쳐도 나머지 출처의 캐시가 살아 있다. 실패를 짧게 캐시해 응답하지 않는 출처를 매 요청 두드리지 않는다. 인스턴스마다 따로라는 한계는 spec.md §1.2에 적었다 |
| CS2-D22 | (0.5.0) 바깥 요청은 `src/lib/ssrf.ts`의 `assertPublicHttpUrl`을 다시 쓰고, `https:` 전용·허용 목록·리다이렉트 한 번·크기 상한·쿠키와 Referer 없음을 더한 콘솔 전용 함수로 감싼다 | 저장소에 이미 사설 대역 차단과 DNS 해석 검사가 있다(단순성 사다리 2단계: 있는 것을 다시 쓴다). 기존 `safeFetch`는 `http:`를 허용하고 리다이렉트 3번·허용 목록 없음이라 그대로는 쓸 수 없다. Referer를 빼는 이유는 실측: 네이버 이미지 서버가 다른 사이트 Referer에는 403, Referer가 없으면 200을 돌려줬다(research.md §6.3) |
| CS2-D23 | (0.5.0) XML은 새 의존성 없이 작은 관대한 파서로 읽는다. 문서형 선언(`<!DOCTYPE …>`)은 통째로 버린다 | 설치된 XML 파서가 없다(research.md §5.6). 필요한 칸이 제목·주소·날짜·썸네일 몇 개뿐이다. 엔티티 선언을 펼치지 않으므로 XXE와 엔티티 폭증이 생기지 않는다 |
| CS2-D24 | (0.5.0) 모든 타일 그림은 썸네일 경로를 거친다. 자사 Blob 이미지도 같다. SVG는 받지 않는다 | 리드 범위("타일 `<img>`는 이 경로나 같은 출처 자산만")를 그대로 따른다. 헌법은 우리 Blob 직접 사용을 허용하지만 타일 하나에 두 경로를 두지 않는다. SVG는 같은 출처로 내보내면 스크립트를 품을 수 있어 뺀다 |
| CS2-D25 | (0.5.0) 가져오기에 실패한 채널과 인스타그램은 채널 공개 주소로 가는 링크 타일 하나로 보인다 | 2026-11-15 확인에서 유튜브 채널 피드가 404였다(research.md §6.1). 실패를 숨기면 채널이 사라진 것처럼 보이므로 "<채널>에서 보기"를 남긴다. 공개 주소는 종류로 정한다: 유튜브 `https://www.youtube.com/channel/<id>`, 네이버 `https://blog.naver.com/<id>`, RSS는 피드 주소의 출처(origin), 인스타그램은 설정한 주소, 자사 블로그는 `/blog` |
| CS2-D26 | (0.5.0) 채널 편집기는 `AdminDialogs.tsx`에 새 대화상자로 두고, 계정 메뉴의 관리자 도구에서 연다 | 리드 범위는 "기존 관리자 설정 대화상자"였지만 그런 대화상자는 없다. 관리자 도구는 가져오기·내보내기·사람·분류·감사 기록 대화상자이고, 팀 고정은 홈 화면 편집으로 한다(research.md §5.5). 같은 자리에 "채널 관리"를 더한다 |
| CS2-D27 | (0.5.0) 자사 블로그는 `src/lib/blog/store.ts`의 `readLatestPublishedPostsSafe(6)`로 읽는다 | 리드 범위는 "`src/lib/db`의 blogPosts"였지만 블로그는 Neon이 켜져 있으면 Postgres, 아니면 Blob이다(`readPostsSafe`, `isNeonEnabled`). 이 함수는 두 경우를 모두 처리하고 발행 글만 최신순으로, 본문 없이 돌려준다(research.md §5.7) |
| CS2-D28 | (0.5.0) 썸네일 허용 목록의 자사 Blob 호스트는 `src/lib/db.ts`가 이미 정한 공개 Blob 주소에서 얻는다(작은 내보내기 함수 하나 추가). 콘솔 코드에 호스트 문자열을 새로 적지 않는다 | `db.ts`는 `BLOB_PUBLIC_BASE` 환경변수와 기존 기본값으로 공개 주소를 정한다. 같은 판단을 두 곳에 두면 스토어를 바꿀 때 한쪽이 남는다 |

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

- 최상위 `prefs: { autofillGuideAck: boolean }` — 내 레코드의 `autofillGuide.version >= AUTOFILL_GUIDE_VERSION`이면 `true`. `me`의 모양(`email`·`name`·`team`·`isAdmin`)은 바꾸지 않는다(CS2-D10).
- `items[].hide_password: boolean`.
- `console-user-prefs` 읽기가 실패해도 bootstrap은 실패시키지 않고 `prefs.autofillGuideAck: true`로 답한다(안내 팝업 때문에 콘솔 전체가 막히지 않게. 계정 메뉴로 다시 열 수 있다).

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
- 링크 ↔ 공유 계정을 바꿔도 입력한 제목·주소·분류·설명은 지우지 않는다. 아이디·비밀번호 입력값은 공유 계정에서 벗어나면 저장 본문에 넣지 않는다.
- **링크로 바꿔 저장하면 저장된 계정 정보가 지워진다(기존 서버 동작, CS2-D11).** 편집을 시작할 때 항목에 저장된 아이디나 비밀번호가 있었고(`hasLoginId || hasPassword`) 종류가 링크인 채로 저장을 누르면, 요청을 보내기 전에 기존 확인 대화상자로 "저장된 아이디·비밀번호가 영구히 삭제돼요. 계속할까요?"를 묻는다. "삭제하고 저장"을 누를 때만 PATCH를 보내고, "취소"하면 요청 없이 양식으로 돌아간다(입력값 유지). 저장된 계정 정보가 없거나 새 항목이면 묻지 않는다.
- 종류 왕복 규칙(CS2-D12): 양식은 "링크일 때의 형식·접속 방식"을 따로 기억한다. 처음 값은 편집을 시작할 때의 `type`·`access_method`(접속 방식이 `shared-credential`이면 `link`·`public`, 새 항목이면 `link`·`public`)이고, 링크 상태에서 사용자가 "더 보기"로 형식·접속 방식을 바꾸면 그 값으로 갱신한다. 공유 계정 → 링크로 돌아오면 이 값을 되살린다. 이 변환은 순수 함수(예: `applyKind(form, kind, linkMemory)`)로 두고 단위 테스트한다.
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
- 로그인 열기: `login_id`를 `copy`로 받아 클립보드에 쓴 뒤 `const w = window.open('', '_blank')`(`noopener` 없이 — CS2-D8). `w`가 `null`이면 새 탭이 막힌 것이므로 토스트 안에 `<a href={url} target="_blank" rel="noopener noreferrer">` 링크를 보인다. `w`가 있으면 `w.opener = null` 후 `w.location.replace(url)`로 보내고 링크는 보이지 않는다. 아이디가 없으면 주소만 연다.
- 리퍼러: 콘솔 응답에는 이미 `Referrer-Policy: no-referrer`가 붙는다(`src/middleware.ts` `withConsoleHeaders`). 콘솔 스크립트가 시작한 `w.location.replace` 이동에도 이 정책이 적용될 것으로 보지만 추정이므로, AC-CS2-014에서 새 탭의 `document.referrer`가 빈 문자열인지 확인한다. 비어 있지 않으면 이동 대상을 `<a rel="noreferrer">`를 만들어 누르는 방식 등으로 바꾸고 그 결과를 진행 기록에 남긴다.
- 사용 기록: `<details>` 형태의 펼침. 펼칠 때 `/activity` 한 번 요청, 실패하면 섹션 안에 오류 한 줄.
- 공유 계정 목록 보기: 각 행에 "계정 정보 있음 / 없음" 작은 표시(`hasLoginId || hasPassword`).

### 2.5 스크롤바 범위

- 공용 규칙은 `globals.css`의 `@layer base` 안에 있다. 콘솔 규칙은 `console.module.css`(층 없음)에 두므로 층 순서상 항상 이긴다. `globals.css`는 고치지 않는다.
- **선택자는 Next.js CSS 모듈 순수성 검사(`mode: 'pure'`)를 통과해야 한다.** 모든 선택자에 지역 클래스가 하나 이상 있어야 하므로 `:global(html:has([data-admin-root="console"]))`처럼 전역만 있는 선택자는 빌드를 멈춘다(plan-audit CS2-PA-D1). 대신 콘솔 루트 클래스 `.root`를 `:has()` 안에 넣는다.
- 페이지 스크롤바: `:global(html):has(.root) { scrollbar-width: thin; scrollbar-color: #d6d0c4 #f2efe8; }`, 그리고 `:global(html):has(.root)::-webkit-scrollbar`·`::-webkit-scrollbar-track`·`::-webkit-scrollbar-thumb`·`::-webkit-scrollbar-thumb:hover`(너비 8px, 둥근 막대, 막대 `#d6d0c4`, 마우스 올림 `#bdb5a6`, 트랙 `#f2efe8`).
- 내부 스크롤 영역: `.root, .root * { scrollbar-width: thin; }`와 `.root *::-webkit-scrollbar*`. `scrollbar-color`는 상속 속성이라 페이지 설정이 안쪽까지 내려가지만 **`scrollbar-width`는 상속되지 않으므로** 안쪽 요소에 직접 준다(plan-audit CS2-PA-D5). 콘솔 대화상자(`Dialog.tsx`의 `<dialog>`)는 루트 안에 그려지므로(SPEC-CONSOLE-001 design.md §6.2, 포털 없음) `.root *`에 걸린다.
- 콘솔 표식: 콘솔 앱 루트 2곳(`ConsoleApp.tsx`)과 로그인 화면(`login/LoginScreen.tsx`)이 모두 같은 `console.module.css`의 `.root`를 쓴다. 그래서 `html:has(:local(.root))`는 콘솔 화면에만 걸리고, 공개 사이트와 `/admin`에는 이 해시 클래스가 없다. 기존 `data-admin-root="console"` 속성은 그대로 둔다.
- 사전 확인(2026-11-15, 이 워크트리): Next에 번들된 `postcss-modules-local-by-default`를 `mode: 'pure'`로 돌려 `:global(html:has([data-admin-root="console"]))`는 `is not pure` 오류, `:global(html):has(.root)`·`:global(html):has(.root)::-webkit-scrollbar`·`:global(html):has(.root)::-webkit-scrollbar-thumb:hover`·`.root, .root *`·`.root *::-webkit-scrollbar-thumb`는 통과(각각 `html:has(:local(.root))…`, `:local(.root) *…`로 변환)함을 확인했다. 실행 단계에서 같은 검사를 테스트로 고정한다(AC-CS2-007).
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
- 첫 자동 표시는 bootstrap의 `prefs.autofillGuideAck`가 `false`이고 이번 브라우저 세션에 "나중에"를 누른 적이 없을 때, 콘솔 첫 화면이 그려진 뒤 한 번.

### 2.7 입력 칸 속성과 화면에 보이지 않는 복사

- 콘솔이 그리는 자격증명 입력 칸은 칸마다 속성이 다르다(REQ-CS2-020).
  - 아이디 칸: `autocomplete="off"`(지금과 같음).
  - 비밀번호 칸: `autocomplete="new-password"`를 그대로 둔다(SPEC-CONSOLE-001 값, research.md §2.6). 이유: 브라우저는 비밀번호 칸의 `off`를 따르지 않을 수 있고, 같은 출처의 `/admin/login`에 저장된 관리자 비밀번호가 이 칸에 채워지면 "빈 칸 = 유지" 규칙(§2.3)이 깨져 공유 비밀번호가 관리자 개인 비밀번호로 바뀐 채 멤버에게 복사될 수 있다(plan-audit CS2-PA-R3-D1).
  - 두 칸 모두 `data-1p-ignore`, `data-lpignore="true"`를 더한다.
- 브라우저가 이 속성도 무시할 수 있다는 점은 spec.md §1.1에 적었다. 그래서 AC-CS2-020은 속성 확인과 함께, 같은 출처 비밀번호가 저장된 브라우저에서 칸이 비어 있고 저장해도 값이 바뀌지 않는지를 실제로 확인한다.
- 복사는 기존 `copyText`(research.md §2.6)를 그대로 쓴다. `navigator.clipboard.writeText`가 먼저이고, 쓸 수 없을 때만 임시 `textarea`를 쓴다. 임시 칸은 이미 `opacity:0`·1px·`aria-hidden="true"`이고 같은 작업 안에서 `remove()`된다. 값을 보이는 요소에 넣는 새 경로는 만들지 않는다.

### 2.8 보기 전환 (M3, 0.5.0)

```
┌ 전체 항목 ─────────────────────────────────────────────┐
│ [분류 ▾][접속 방식 ▾][담당자 ▾] …        보기 [목록|카드] │ ← 툴바 오른쪽 끝, 위치 고정
├────────────────────────────────────────────────────────┤
│ 목록:  (아이콘) 제목                 담당자   [열기][✎][⋯] │
│              설명 한 줄(없으면 호스트)                     │
│ 카드:  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│        │(아이콘) │ │        │ │        │ │        │  같은 높이 │
│        │제목 2줄 │ │        │ │        │ │        │        │
│        │설명 2줄 │ │        │ │        │ │        │        │
│        │분류·접속│ │        │ │        │ │        │        │
│        │담당자   │ │        │ │        │ │        │        │
│        │[열기][⋯]│ │        │ │        │ │        │        │
│        └────────┘ └────────┘ └────────┘ └────────┘        │
└────────────────────────────────────────────────────────┘
```

- 컨트롤: 새 `ViewToggle` 컴포넌트. 종류 선택(§2.3, `ItemForm.tsx` L56의 키 처리)과 같은 radiogroup 방식(화살표·Home·End, 선택된 쪽만 `tabindex="0"`)이다. 이름은 "보기 방식" / "View". 툴바 오른쪽에 두고, 너비를 고정해 방식이 바뀌어도 툴바 안 다른 요소가 밀리지 않게 한다.
- 상태: `ConsoleApp`이 `viewMode`를 들고 AppContext로 내린다(목록 보기들이 함께 씀, CS2-D14). 처음 값은 첫 렌더 전에 정한다: `resolveViewMode(store.get('zoel-console:view'), window.innerWidth)`. 콘솔은 bootstrap을 받은 뒤에야 목록을 그리므로(불러오는 중 화면이 먼저) 이 값을 첫 목록 렌더 전에 읽을 수 있고, 첫 그리기 뒤 방식이 바뀌는 깜빡임이 없다.
- `resolveViewMode(stored, width)`: `stored`가 `'list'`·`'cards'`면 그 값, 아니면 `width > 480 ? 'cards' : 'list'`. 저장은 기존 `store.set`(예외를 삼킴, `ConsoleApp.tsx` L56~L70)을 쓴다.
- 목록 행(`Row`): 둘째 줄을 `L(item, 'description')`(비면 호스트, 주소도 없으면 지금의 "주소 없음")로 바꾼다. 팀·접속 방식·계정 정보 표시는 둘째 줄 끝에 지금처럼 둔다. 직접 버튼은 열기·편집 두 개, 나머지는 더 보기 메뉴(지금과 같음). 별표 고정 칸은 그대로 둔다(동작 보존).
- 카드(`ItemCard`, 신규): `<li>` 안에 브랜드 아이콘, 제목 버튼(누르면 `openDetail`), 설명, 분류·접속 방식 한 줄, 담당자, 열기(주소 있을 때)와 더 보기 메뉴. 더 보기 메뉴의 항목은 행과 같다(고정, 편집, 링크 복사, 삭제). 별표 고정은 메뉴로만 한다(카드 첫 화면을 단순하게).
- 같은 높이: 격자 `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`, `grid-auto-rows: 1fr`, 카드 `display: flex; flex-direction: column`, 제목·설명 `-webkit-line-clamp: 2`. 컨테이너 쿼리(`@container list`)로 좁은 폭에서 1~2열.
- 홈 "최근 수정한 카드" 펼침(§2.15)도 같은 `Row`/`ItemCard`를 쓴다.

### 2.9 영어 화면의 양식과 이름 (M3, 0.5.0)

| 칸 | 한국어 화면 (지금) | 영어 화면 (0.5.0) |
|---|---|---|
| 제목 자리 | `f-title` (`title`) | `f-title-en` (`title_en`), 빈 칸이면 placeholder = `title` |
| 설명·메모 자리 | `f-desc` (`description`) | `f-desc-en` (`description_en`), placeholder = `description` |
| 더 보기 · 확인할 일 | `f-note` (`note`) | `f-note-en` (`note_en`), placeholder = `note` |
| 더 보기 · 연동 주소 이름 | `label` | `label_en`, placeholder = `label` |
| 더 보기 · 영문/한국어 묶음 | "영문" 묶음: `f-title-en`, `f-desc-en` | "Korean text" 묶음: `f-title`, `f-desc`, `f-note`, 링크 이름(한국어) |

- 저장 규칙: 두 언어 칸을 모두 보낸다. 영어 화면에서 `title`이 비면 `title = title_en`(CS2-D16). 둘 다 비면 오류는 `f-title-en`에 붙이고 요청하지 않는다.
- 지금의 "한국어 메모를 고치면 영문 메모를 비우는" 규칙(`ItemForm.tsx` L280 `note_en: item && item.note === noteT ? … : ''`)과 링크 이름의 같은 규칙(L246)은 한국어 화면에서만 적용한다. 영어 화면에서는 사용자가 영문 값을 직접 고치므로 두 값을 그대로 보낸다.
- 사람 이름: 새 도우미 `personName(email, fallbackName, people, lang)` — 영어면 `people`에서 email이 맞는 사람의 `name_en`, 없으면 `fallbackName`, 그것도 없으면 email. 계정 칩(`AccountMenu.tsx` L37·L132)과 아바타 글자(`initials`)가 이 값을 쓴다. 담당자 표시는 이미 `ownerName`(`ui-model.ts` L123)이 영문 이름을 쓰므로, 행·카드·상세가 모두 그것을 거치는지 확인만 한다.
- 담당자 입력: 영어 화면이면 처음 값과 제안 목록(`<datalist id="f-people">`)을 영문 이름(없으면 한국어 이름)으로 그린다. 해석은 지금의 `ownersFromText`가 영문 이름 토큰도 받는다(`ui-model.ts` L145). 처음 값의 "이름이 같은 사람으로 되돌아오는지" 검사(`ItemForm.tsx` L156)는 영문 이름에도 적용한다.
- 한글 문자열 검사: 소스를 읽어 주석(`//`, `/* */`, JSX `{/* */}`)을 지운 뒤 문자열·템플릿 문자열·JSX 글자에서 한글(가~힣, ㄱ~ㅎ, ㅏ~ㅣ)을 찾는 순수 함수와 그 테스트. 허용 목록 예: `ItemForm.tsx`의 `'전체'`·`'팀'`·`'본인'`(공개 범위 저장값), `'공통'`(팀 저장값), `Sidebar.tsx`의 `'한국어'`·`'한'`(자국어 이름), `layout.tsx`의 메타데이터 제목. `CONSOLE_TEAMS`·`CONSOLE_VISIBILITIES` 값과 정확히 같은 문자열은 데이터 값으로 보고 자동 허용한다.

### 2.10 채널 설정 (M4, 0.5.0)

```ts
// src/lib/console/types.ts — 추가분
export const CONSOLE_CHANNEL_KINDS = ['youtube', 'naver', 'rss', 'zoellife-blog', 'instagram'] as const;
export type ConsoleChannelKind = (typeof CONSOLE_CHANNEL_KINDS)[number];
export interface ConsoleChannel {
  id: string;        // 서버가 붙임: 'ch-' + 무작위 8자. 저장 뒤 바뀌지 않음
  label: string;     // 1~40자
  label_en: string;  // 0~40자, 비면 label
  kind: ConsoleChannelKind;
  source: string;    // 종류별 규칙(REQ-CS2-030)
  color: string;     // '#rrggbb'
  enabled: boolean;
  order: number;     // 0부터, 저장할 때 행 순서로 다시 매김
}
interface ConsoleSettings { teamPins: string[]; channels?: ConsoleChannel[] }
export const MAX_CHANNELS = 12;
```

- `src/lib/console/channels.ts`(신규): `validateChannels(raw, existingIds)` → `{ ok, channels }` 또는 `{ errors: [{ index, field, reason }] }`, `channelHome(channel)`(CS2-D25), `readChannels()`(설정 문서의 `channels`, 형식이 틀린 행은 버림). 기존 `readSettings`(teamPins만 돌려줌)는 그대로 둔다.
- `GET /api/console/channels`: 관리자만(403/401). `{ channels }` 전체.
- `PUT /api/console/channels`: 관리자, Origin·Content-Type 검사(기존 `authorizeConsole(request, { stateChange: 'json', admin: true })`). 본문 `{ channels: [...] }`. 검사 통과 시 `readSingleForWrite(settings)` → `{ ...current, channels }` → `writeSingle`. 감사 `settings.update`, `meta: { channels: n }`. 새 행(id 없음)에는 id를 붙이고, 모르는 id를 보내면 400(`unknown_id`).
- 출처 규칙: `youtube` `^UC[\w-]{22}$` · `naver` `^[a-z0-9_-]{1,40}$` · `rss`·`instagram` `new URL()`이 되고 `protocol === 'https:'`, `username`·`password` 없음, 2048자 이하 · `zoellife-blog` 빈 문자열. 색 `^#[0-9a-fA-F]{6}$`(저장은 소문자).
- 편집기(`ChannelsDialog`): 행마다 종류 `<select>`, 이름, 영문 이름, 출처(종류마다 placeholder와 짧은 도움말: 유튜브 "UC로 시작하는 채널 ID", 네이버 "블로그 ID", RSS "https:// 피드 주소", 인스타그램 "https:// 프로필 주소", 자사 블로그는 칸 숨김), 색(`<input type="color">`), 켜기 체크, 위·아래·삭제 아이콘 버튼. 오류는 행 아래 한 줄. 사람 목록 대화상자(`PeopleDialog`)와 같은 행 편집 모양을 따른다.

### 2.11 피드 모으기와 캐시 (M4, 0.5.0)

**`GET /api/console/feed`** (신규, 세션 필요 — 401)

```json
{
  "channels": [
    { "id": "ch-1a2b3c4d", "label": "지어낸 채널", "label_en": "Made-up channel",
      "color": "#c4302b", "kind": "youtube", "home": "https://www.youtube.com/channel/UCfake…",
      "ok": false, "error": "http_status" }
  ],
  "items": [
    { "channelId": "ch-5e6f7a8b", "title": "글 제목", "url": "/blog/some-slug",
      "publishedAt": "2026-11-14T01:00:00.000Z",
      "thumb": "/api/console/feed/thumb?u=https%3A%2F%2F…" }
  ]
}
```

- 오류 코드: `timeout`, `network`, `http_status`, `too_large`, `redirect_rejected`, `not_allowed`, `parse_error`.
- 흐름: `readChannels()` → 켜진 채널 → 출처마다 캐시 확인 → 없거나 만료면 가져오기(동시에, `Promise.allSettled`) → 채널마다 최신 6건 → 전체를 `publishedAt` 내림차순(날짜 없는 것 뒤). 같은 출처를 쓰는 채널이 둘이면 가져오기는 한 번.
- 캐시(`src/lib/console/feed.ts`): 모듈 수준 `Map<string, { at: number; ok: boolean; items?: FeedItem[]; error?: string }>`. 성공 30분, 실패 5분(CS2-D21). 시계와 가져오기 함수는 주입할 수 있게 해 테스트에서 바꾼다. 항목 수가 무한히 늘지 않도록 설정에 없는 키는 다음 요청 때 지운다.
- 응답 헤더: `Cache-Control: private, max-age=1800`(기존 `consoleJson`의 기본 헤더를 이 경로에서만 바꿈). 피드에는 비밀값이 없다.
- 썸네일 주소 만들기: 원본 이미지 주소가 §2.14 허용 목록을 통과할 때만 `/api/console/feed/thumb?u=${encodeURIComponent(src)}`, 아니면 `null`.
- 항목 주소: 바깥 피드는 `http:`·`https:`만(파서에서 거름), 자사 블로그는 `/blog/${encodeURIComponent(slug)}`.

### 2.12 바깥 요청과 SSRF 방어 (M4, 0.5.0)

`src/lib/console/feed-fetch.ts`(신규) `fetchAllowed(url, { allow, maxBytes, timeoutMs = 5000, fetchImpl, lookupImpl })`:

1. `new URL(url)` 실패 → `not_allowed`
2. `protocol !== 'https:'` → `not_allowed`
3. 호스트가 IP 문자열(IPv4 점 표기, `[`…`]` IPv6)이거나 `localhost`·`*.localhost` → `not_allowed`
4. `allow(hostname)`가 거짓 → `not_allowed` (허용 목록은 정확한 호스트 비교 또는 `.pstatic.net`처럼 점으로 시작하는 접미사 비교. `ytimg.com.evil.example` 같은 우회를 막으려고 `endsWith('.pstatic.net')` 또는 `=== 'pstatic.net'`만 쓴다)
5. `assertPublicHttpUrl(url)`(`src/lib/ssrf.ts`, DNS 해석 뒤 사설·루프백·링크로컬·메타데이터 대역 거부) 실패 → `not_allowed`
6. `fetch(url, { redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: … }, signal })`, 5초 뒤 `abort` → `timeout`
7. 3xx면 `Location`을 현재 주소 기준으로 풀어 1~5단계를 다시 거친 뒤 한 번만 더 요청. 두 번째 응답도 3xx면 `redirect_rejected`
8. 2xx가 아니면 `http_status`
9. 본문은 `res.body.getReader()`로 읽으며 바이트를 세고, `maxBytes`를 넘으면 `reader.cancel()` 뒤 `too_large`
10. 성공: `{ ok: true, contentType, bytes }`

- 피드 허용 목록: `youtube` → `www.youtube.com`, `naver` → `rss.blog.naver.com`, `rss` → 설정한 주소의 호스트 하나. 크기 상한 1MB.
- 썸네일 허용 목록과 상한은 §2.14.
- 네이버의 바뀐 블로그 id는 `302 Location: http://…`로 넘어가는 것을 확인했다(research.md §6.2). 2단계에서 막히므로 그 채널은 `redirect_rejected`로 보이고 링크 타일이 된다. 관리자가 새 id로 고치면 된다.
- 자사 블로그와 인스타그램은 바깥 요청을 하지 않는다.

### 2.13 피드 파서 (M4, 0.5.0)

`src/lib/console/feed-parse.ts`(신규) `parseFeed(xml: string): FeedItem[]` — 정규식 기반의 작은 파서. DOM이나 새 패키지를 쓰지 않는다(CS2-D23).

- 전처리: `<!DOCTYPE …>`(내부 부분집합 `[...]` 포함)와 `<!-- -->` 주석, `<?xml …?>`를 지운다. 엔티티 선언은 해석하지 않는다.
- 항목 나누기: `<item>`…`</item>`(RSS) 또는 `<entry>`…`</entry>`(Atom). 접두어가 붙은 이름(`media:thumbnail`)은 그대로 이름으로 다룬다.
- 글자 칸 읽기: `<title>` 안의 CDATA를 풀고, 태그를 지우고, 엔티티(`&amp;` `&lt;` `&gt;` `&quot;` `&apos;` `&#NNN;` `&#xHH;`)를 푼 뒤 공백을 하나로 줄이고 200자로 자른다. 정의되지 않은 이름 엔티티는 그대로 둔다.
- 주소: RSS `<link>` 글자, 또는 Atom `<link rel="alternate" href>` → 없으면 첫 `<link href>`. 그 뒤 `new URL()`이 되고 `http:`·`https:`인 것만. 아니면 그 항목을 버린다.
- 날짜: `pubDate`(RFC 822, 예 `Wed, 04 Nov 2026 10:22:52 +0900`) → `published` → `updated`(ISO 8601)를 `Date.parse`로 읽어 ISO 문자열로. 읽을 수 없으면 `null`.
- 썸네일 후보 순서: `<media:thumbnail url>`(유튜브는 `<media:group>` 안) → `<media:content url medium="image">` 또는 `type`이 `image/*` → `<enclosure url type="image/*">` → 설명(`description`, `content:encoded`, `summary`, `content`)을 엔티티까지 푼 뒤 첫 `<img … src="…">`. 썸네일 주소는 퍼센트 인코딩을 그대로 둔다.
- 결과 항목: `{ title, url, publishedAt: string | null, thumbSrc: string | null }`. 제목이 비면 주소의 경로 끝을 제목으로 쓴다.

### 2.14 썸네일 경로 (M4, 0.5.0)

**`GET /api/console/feed/thumb?u=<인코딩된 주소>`** (신규, 세션 필요 — 401)

- 허용 호스트: `i.ytimg.com`, `i1.ytimg.com`~`i9.ytimg.com`(정규식 `^i[0-9]?\.ytimg\.com$`, 실제 피드가 `i2.ytimg.com`을 씀 — research.md §6.1), `img.youtube.com`, `pstatic.net`와 그 하위 호스트, `db.ts`가 정한 공개 Blob 호스트(CS2-D28), 켜진 `rss` 채널 주소의 호스트들.
- 검사: `u` 길이 ≤ 2048 → §2.12 1~9단계(상한 2MB) → `Content-Type`이 `image/`로 시작하고 `image/svg+xml`이 아님.
- 성공: 원본 바이트, 원본 `Content-Type`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=86400`, `Content-Security-Policy: default-src 'none'`(이 응답을 직접 열었을 때 대비).
- 실패: 코드에 묶어 둔 작은 중립색 PNG(배경 `#ece8de` 계열 단색, 외부 자산 아님), `Cache-Control: private, max-age=300`. 응답 상태는 200(그림 태그가 깨진 아이콘을 보이지 않게)이고 `X-Thumb-Fallback: 1` 헤더로 구별한다.
- 원본 요청에는 쿠키·Referer가 없다(§2.12 6단계). 네이버 이미지 서버가 다른 사이트 Referer에 403을 돌려주므로(research.md §6.3) 브라우저 직접 연결은 원래도 깨진다.
- 세션이 필요하므로 이 경로는 인터넷 전체에 열린 중계기가 아니다. `<img>` 요청은 같은 출처라 콘솔 세션 쿠키가 함께 간다.

### 2.15 홈 "채널 새 소식" (M4, 0.5.0)

```
┌ 채널 새 소식 ─────────────────────────────────────────────┐
│ ( 전체 ) ( ●유튜브 ) ( ●블로그 ) ( ●네이버 ) ( ●인스타 )  ← 한 줄, 넘치면 가로 스크롤 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 16:9 그림 │ │          │ │          │ │ ●인스타   │      │
│ │ ●유튜브   │ │ ●블로그   │ │          │ │ 인스타그램 │ ← 링크 타일 │
│ │ 제목 두 줄 │ │          │ │          │ │ 에서 보기 ↗│      │
│ │ 3일 전    │ │          │ │          │ │          │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│ 최근 수정한 카드 보기 ⌄                                    │
└──────────────────────────────────────────────────────────┘
```

- 위치: 지금 "최근 수정된 항목" 구역 자리(`HomeView.tsx` L182~L218). 그 목록 코드는 지우지 않고 펼침 안으로 옮긴다. 펼침은 `<button aria-expanded>` + 영역이고, 펼치면 보기 전환(§2.8)과 최근 수정 6개, "더 보기"(→ `#/all` 수정순)가 보인다.
- 칩: `role="radiogroup"`(이름 "채널" / "Channels"), "전체" + 켜진 채널. 칩 안 점은 채널 색. 칩 줄은 `overflow-x: auto`로 칩 줄 안에서만 가로로 밀린다(페이지는 가로 스크롤 없음).
- 타일: `<a href target="_blank" rel="noopener noreferrer">` 하나가 타일 전체. 그림은 `<img loading="lazy" decoding="async" alt="">`(제목이 링크 이름이므로 그림은 꾸밈), 틀은 `aspect-ratio: 16 / 9; object-fit: cover`. `thumb`가 `null`이면 같은 크기의 중립색 상자. 배지는 채널 색 배경 + `badgeTextColor(color)`(검정 `#1c1b18`과 흰색 중 대비가 큰 쪽, REQ-CS2-038). 날짜는 기존 `relTime`, `title` 속성에 `absTime`.
- 격자: `repeat(auto-fill, minmax(200px, 1fr))`, 375px에서는 `repeat(2, minmax(0, 1fr))`. "전체"는 최신 12개, 채널 칩은 그 채널 6개 이하. 링크 타일(인스타그램, 실패한 채널)은 "전체"에서 글 타일 뒤에, 채널 칩에서는 그 채널 타일 자리에 보인다.
- 불러오기: 홈이 마운트될 때 `fetchFeed()` 한 번. 불러오는 동안 타일 두 줄 높이의 자리 표시(회색 상자)를 그려 구역 높이를 잡아 둔다. 요청 자체가 실패하면 구역 안에 오류 한 줄과 "다시 시도".
- 빈 상태: 켜진 채널이 없으면 "아직 연결한 채널이 없어요." / "No channels connected yet." 관리자에게는 "채널 관리" 버튼(채널 편집기 열기).

## 3. 요구사항과 설계 대응

| 요구사항 | 다루는 설계 | 관련 결정 |
|---|---|---|
| REQ-CS2-001 `hide_password` 칸 | §2.1 | CS2-D1, CS2-D4 |
| REQ-CS2-002 내보내기·가져오기 표식 | §2.1 | CS2-D4 |
| REQ-CS2-003 view·copy 구분과 기존 관문 | §2.2 자격증명 판정 순서 | — |
| REQ-CS2-004 숨김 대상의 `view` 거절 | §2.2 7단계 | CS2-D2, CS2-D3 |
| REQ-CS2-005 항목별 사용 기록 API | §2.2 `/activity` | CS2-D9 |
| REQ-CS2-006 사람별 안내 확인 기록 | §2.1 `console-user-prefs`, §2.2 `/me/autofill-guide`·bootstrap | CS2-D5, CS2-D7, CS2-D10 |
| REQ-CS2-007, 008 콘솔 스크롤바 | §2.5 | — |
| REQ-CS2-009 종류 선택·삭제 확인·왕복 복원 | §2.3 | CS2-D11, CS2-D12 |
| REQ-CS2-010 공유 계정 칸 | §2.3 | CS2-D1 |
| REQ-CS2-011 비밀번호 생성 | §2.3 `generatePassword` | — |
| REQ-CS2-012 관리자 새 분류 만들기 | §2.3 | — |
| REQ-CS2-013 자격증명 카드 | §2.4 | CS2-D2, CS2-D3 |
| REQ-CS2-014 로그인 열기 | §2.4 | CS2-D8 |
| REQ-CS2-015 빈 상태 | §2.4 | — |
| REQ-CS2-016 사용 기록 펼침 | §2.4 | CS2-D9 |
| REQ-CS2-017 공유 계정 보기의 설정 여부 표시 | §2.4 | — |
| REQ-CS2-018 안내 팝업 자동 표시·나중에 | §2.6 | CS2-D6, CS2-D7 |
| REQ-CS2-019 브라우저 판별·단계·설정 주소 복사 | §2.6 | — |
| REQ-CS2-020 입력 칸 속성·화면 비노출 복사 | §2.7, §2.4 복사 버튼 | — |
| REQ-CS2-021 한·영 문구, 접근성, 375 px | §2.3 radiogroup, §2.4, §2.6 (문구는 plan.md M2 `i18n.ts`) | — |
| REQ-CS2-022 보기 전환 컨트롤 | §2.8 | CS2-D14, CS2-D15 |
| REQ-CS2-023 목록 행과 카드 | §2.8 | CS2-D13 |
| REQ-CS2-024 보기 방식 기억·기본값 | §2.8 `resolveViewMode` | CS2-D14 |
| REQ-CS2-025 영어 화면 양식 | §2.9 | CS2-D16 |
| REQ-CS2-026 영문 이름·대체 표시 | §2.9 `personName` | CS2-D17 |
| REQ-CS2-027 한글 문자열 검사 | §2.9 | CS2-D18 |
| REQ-CS2-028 안내 단계 번호 | §2.6 (`ol.guideSteps`에 `list-style: decimal`) | — |
| REQ-CS2-029 공유 계정 설명 문구 | plan.md M3 `i18n.ts` | — |
| REQ-CS2-030 채널 설정 | §2.10 | CS2-D19, CS2-D26 |
| REQ-CS2-031 피드 경로 | §2.11 | CS2-D20 |
| REQ-CS2-032 피드 캐시 | §2.11 | CS2-D21 |
| REQ-CS2-033 바깥 요청 방어 | §2.12 | CS2-D22 |
| REQ-CS2-034 피드 파서 | §2.13 | CS2-D23 |
| REQ-CS2-035 자사 블로그·인스타그램·링크 타일 | §2.11, §2.15 | CS2-D25, CS2-D27 |
| REQ-CS2-036 썸네일 경로 | §2.14 | CS2-D24, CS2-D28 |
| REQ-CS2-037 홈 채널 새 소식 | §2.15 | CS2-D20, CS2-D25 |
| REQ-CS2-038 한·영 문구, 접근성, 배지 대비 | §2.8, §2.15 | — |
