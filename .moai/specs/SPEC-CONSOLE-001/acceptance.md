# SPEC-CONSOLE-001 — 인수 기준 (acceptance.md)

각 기준은 통과·실패로만 판정한다. "카나리 값"은 테스트에서만 쓰는 가짜 비밀번호 `canary-Pw-7f3e`, 가짜 아이디 `canary-id-91ab`를 말한다. 실제 비밀값은 테스트에 쓰지 않는다. 테스트 데이터의 사람 이름·email·드라이브 id도 모두 지어낸 값을 쓴다(공개 저장소).

## 1. 로그인과 세션

**AC-CON-001** — maps REQ-CON-003, REQ-CON-004
- 기준: 콘솔 입장 성공
- Given 구글 콜백이 `next=/console`로 돌아오고, userinfo와 ID 토큰 모두 `email_verified=true`, email `minji@try-n.com`, `hd=try-n.com`, `aud`=설정된 클라이언트 id이며, 이 주소는 admin-users에 없다
- When 콜백이 처리된다
- Then 응답은 `/console`로 302이고 `zoel_console_session` 쿠키(HttpOnly, SameSite=Lax)가 설정되며, `daracheon_admin_session` 쿠키는 설정·삭제되지 않고, admin-users 문서는 쓰이지 않으며, 콘솔 감사 기록에 `auth.login` 1건이 생긴다

**AC-CON-002** — maps REQ-CON-002, REQ-CON-003
- 기준: 도메인·검증 조건 거절 표와 콘솔 모드 오류 출구
- Given next 쿠키가 `/console`인 상태로 콜백이 호출된다
- When 신원이 생긴 뒤 거절되는 계정이 아래 중 하나다
  - `x@try-n.com.evil.io` / `x@mail.try-n.com` / `x@evil-try-n.com` / `x@try-n.co`
  - `a@b@try-n.com`(`@` 2개) / `@try-n.com`(로컬 부분 없음)
  - `x@try-n.com`이지만 `hd` 없음(개인 구글 계정) 또는 `hd=evil.io`
  - `x@try-n.com`이지만 userinfo의 `email_verified`가 false(기존 콜백 L172보다 앞에서 콘솔 분기가 처리함)
  - `x@try-n.com`이지만 ID 토큰의 `email_verified`가 false
  - `x@try-n.com`이지만 ID 토큰 `aud`가 다른 클라이언트
  - ID 토큰 email과 userinfo email이 다름
- Then 각 경우 모두 `/console/login?error=not_allowed`로 302, 콘솔 쿠키 없음, 관리자 쿠키 없음, 콘솔 감사 기록에 `auth.login_failed` 1건
- And `X@TRY-N.COM`(대소문자만 다르고 나머지 조건 충족)은 통과하며 세션 email은 `x@try-n.com`(소문자)이다
- And 신원이 생기기 전 단계의 실패는 아래 코드로 `/console/login`에 302하고, `/admin/login`으로 가는 경우가 하나도 없으며, 콘솔 감사 기록 건수가 늘지 않는다

| 상황 | 기대 위치 |
|---|---|
| OAuth 설정 없음 | `/console/login?error=sso_not_configured` |
| `CONSOLE_SESSION_SECRET` 무효 | `/console/login?error=console_not_configured` |
| state 쿠키 없음 또는 불일치 | `/console/login?error=oauth_state` |
| 토큰 엔드포인트 4xx 또는 `access_token` 없음 | `/console/login?error=oauth_token` |
| userinfo 4xx | `/console/login?error=oauth_userinfo` |
| userinfo에 email 없음 | `/console/login?error=oauth_email` |
| 처리 중 예외 | `/console/login?error=oauth_failed` |

- And 같은 상황을 next 쿠키 `/admin`으로 재현하면 기존과 같은 `/admin/login?error=<같은 코드>`로 간다

**AC-CON-003** — maps REQ-CON-002
- 기준: 복귀 경로 판정, 열린 리디렉트 차단, 관리자 흐름 보존
- Given OAuth 시작 요청과 콜백
- When `next`가 `/console`, `/console/`, `/console/x`이면 콘솔 모드, `/console-evil`, `/consolex`, `//evil.io/console`, `https://evil.io/console`, `/console\evil.io`, `/%2Fevil.io`, `/console%2F..%2Fadmin`이면 콘솔 모드가 아니거나 콘솔 경로 안에 머문다(단위 테스트로 각 값의 `isConsoleNext`·`sanitizeNextPath` 결과를 고정)
- Then 콘솔 모드가 아닌 값은 기존처럼 `/admin`으로 정리되고, 기존 관리자 로그인·워크숍 member 출구 테스트가 수정 없이 모두 통과한다
- And `next`가 `/console/../admin`인 콘솔 입장 성공 응답의 `Location`은 `/admin`으로 가지 않는다(정리 단계에서 거부되거나, 경로가 `/console` 아래로 정규화됨). 모든 성공 응답의 `Location` 호스트는 요청 호스트와 같다

**AC-CON-004** — maps REQ-CON-005
- 기준: 비밀값 무효 시 닫힘
- Given `ADMIN_SESSION_SECRET`, `WORKSHOP_SSO_SECRET`, `PARTNER_SESSION_SECRET`, `BACKUP_ENCRYPTION_KEY`, `CONSOLE_SECRETS_KEY`가 서로 다른 유효 값으로 설정돼 있고(그래서 (a)에서 콘솔 코드가 몰래 `ADMIN_SESSION_SECRET`으로 서명하면 토큰이 발급되어 실패로 드러난다), `CONSOLE_SESSION_SECRET`이 (a) 없음 (b) 공백 (c) 31자 (d) `ADMIN_SESSION_SECRET`과 같음 (e) `WORKSHOP_SSO_SECRET`과 같음 (f) `CONSOLE_SECRETS_KEY`와 같음 (g) `PARTNER_SESSION_SECRET`과 같음 (h) `BACKUP_ENCRYPTION_KEY`와 같음
- When `/api/admin/auth/google/start?next=/console`, `/console`, `GET /api/console/bootstrap`을 요청한다
- Then 콘솔 토큰은 발급되지 않고, 시작 요청은 `/console/login?error=console_not_configured`, 콘솔 API는 503이며, 로그에 비밀값 원문이 없다
- And 소스에 콘솔 비밀값의 리터럴 기본값이 없다(`git grep -nE "CONSOLE_(SESSION_SECRET|SECRETS_KEY|ADMIN_EMAILS) *(\?\?|\|\|) *['\"]" src` 결과 0줄)

**AC-CON-005** — maps REQ-CON-004, REQ-CON-006
- 기준: 토큰 교차 거부
- Given 유효한 관리자 세션 토큰, 워크숍 핸드오프 토큰, 파트너 토큰, 서명은 맞지만 `k` 표식이 없거나 만료된 토큰
- When 각각을 `zoel_console_session` 쿠키로 넣어 `GET /api/console/bootstrap`을 요청한다
- Then 모두 401이다
- And 유효한 콘솔 토큰을 `daracheon_admin_session` 쿠키로 넣어 `/api/admin/*`을 요청하면 401이다
- And `POST /api/console/auth/logout` 뒤 같은 브라우저의 콘솔 요청은 401이다
- And 콘솔 쿠키 없이 같은 출처에서 `POST /api/console/auth/logout`을 보내면 401이 아니라 성공(쿠키 `Max-Age=0`)이고, `Origin: https://evil.io`이면 403이다(REQ-CON-001 예외, REQ-CON-013)

**AC-CON-006** — maps REQ-CON-001, REQ-CON-006, REQ-CON-009
- 기준: 로그인 전 차단과 페이지 소스
- Given 콘솔 쿠키가 없다
- When `/console`, `/console/x`, `GET /api/console/bootstrap`, `POST /api/console/items`를 요청한다
- Then 페이지는 `/console/login?next=...`로 302, API는 401 JSON이다
- And 로그인한 상태의 `/console` 서버 HTML에 시드 항목 제목(예: "홈페이지 관리자"), `drive.google.com/drive/folders/`, `docs.google.com/spreadsheets/d/` 문자열이 없다
- And `/console/x`로 302된 로그인 화면의 로그인 버튼은 `next=%2Fconsole%2Fx`로 시작 요청을 보내고, 로그인 성공 뒤 `/console/x`로 돌아온다. `/console/login?next=/admin`이면 버튼은 `next=%2Fconsole`을 보낸다

## 2. 데이터 노출

**AC-CON-007** — maps REQ-CON-015
- 기준: 자격증명은 목록·내보내기·저장 문서에 평문으로 없다
- Given 공유 계정 항목에 카나리 아이디·비밀번호를 저장했다
- When `GET /api/console/bootstrap`(일반 사용자·관리자 각각), `GET /api/console/export`, 해당 항목 PATCH 응답, `console-items` 문서, `console-secrets` 문서를 읽는다
- Then 어느 응답·문서에도 카나리 문자열이 없고, 목록의 그 항목에는 `hasLoginId: true`, `hasPassword: true`만 있다

**AC-CON-008** — maps REQ-CON-014
- 기준: 암호화와 결속
- Given 저장된 비밀 레코드
- When (a) 같은 키로 복호화 (b) `ct` 1바이트 변조 (c) 레코드의 `itemId`를 다른 항목 id로 바꿔 그 항목으로 열람 (d) `password` 암호문을 `login_id` 자리로 옮김 (e) 다른 키로 복호화
- Then (a)만 원래 값이 나오고 (b)~(e)는 값 없이 실패하며 응답 본문에 암호문·키 일부가 없다
- And 같은 값을 두 번 저장하면 `iv`와 `ct`가 서로 다르다

## 3. 자격증명 열람

**AC-CON-009** — maps REQ-CON-016, REQ-CON-017
- 기준: 허용된 열람과 화면 동작
- Given 항목 A(team 한국팀, visibility 팀, 담당 a@try-n.com), 사용자 b(한국팀), 카나리 값 저장
- When b가 상세 패널을 연다
- Then 비밀번호는 가림 문자로 보이고 네트워크에 비밀번호 요청이 없다
- And 눈 아이콘을 누르면 `POST .../credential {field:"password", purpose:"view"}` 1회 후 실제 값이 보이고, 다시 누르면 가려진다
- And 복사를 누르면 `purpose:"copy"` 요청 1회 후 클립보드에 실제 값이 들어간다
- And 값을 드러낸 채 상세 패널을 닫았다가 같은 항목을 다시 열면 비밀번호는 다시 가림 문자이고, 눈 아이콘을 누르기 전까지 비밀번호 요청이 없다
- And 응답 헤더는 `Cache-Control: no-store`이고, 감사 기록에 `credential.view`, `credential.copy`가 각 1건(actor b, targetId A, meta.field="password")이며 기록 어디에도 카나리 값이 없다

**AC-CON-010** — maps REQ-CON-016
- 기준: 공개 범위 판정 행렬
- Given 담당 o@try-n.com, 관리자 adm@try-n.com, 한국팀 k, 방글라데시팀 g, 사람 목록에 없는 n
- When 각 사용자가 아래 항목의 비밀번호를 요청한다

| visibility / team | o | adm | k | g | n |
|---|---|---|---|---|---|
| 전체 / 한국팀 | 200 | 200 | 200 | 200 | 200 |
| 팀 / 한국팀 | 200 | 200 | 200 | 403 | 403 |
| 팀 / 공통 | 200 | 200 | 200 | 200 | 200 |
| 본인 / 방글라데시팀 | 200 | 200 | 403 | 403 | 403 |

- Then 응답 코드가 표와 같고, 403 응답에는 값이 없으며 각 403마다 `credential.deny` 기록 1건이 생긴다

## 4. 항목 권한과 편집

**AC-CON-011** — maps REQ-CON-010
- 기준: 담당자·관리자만 편집·삭제, 메모 노출 제한
- Given 항목 B(담당 o@try-n.com, note "확인할 일 메모")
- When 담당자가 아닌 일반 사용자 u가 PATCH·DELETE를 보낸다
- Then 둘 다 403이고 항목은 바뀌지 않는다
- And o와 관리자는 같은 요청이 성공한다
- And u의 bootstrap 응답에서 B에는 `note` 필드가 없고 `canEdit: false`, o의 응답에는 `note`가 있다
- And u가 새 항목을 만들면 성공하고 owners에 u의 email이 들어간다
- And 관리자가 아닌 o가 owners에서 자기 email을 빼고 저장하면 400이다

**AC-CON-012** — maps REQ-CON-007
- 기준: 관리자 권한은 환경변수에서만
- Given `CONSOLE_ADMIN_EMAILS=adm@try-n.com`
- When adm이 남의 항목을 고친 뒤 변수에서 adm을 빼고 같은 세션으로 다시 고친다
- Then 첫 요청은 성공, 두 번째는 403이다
- And 일반 사용자가 요청 본문이나 사람 목록에 `admin: true`를 넣어도 관리자 API(`/api/console/import`, `/people`, `/audit`)는 403이다

**AC-CON-013** — maps REQ-CON-011
- 기준: 삭제 확인과 되돌리기
- Given 담당자가 자격증명이 저장된 항목 C를 보고 있다
- When 행 메뉴 또는 상세 패널에서 삭제를 누른다
- Then 항목은 바로 지워지지 않고 같은 자리에 "정말 삭제할까요? [삭제] [취소]"가 나타나며 브라우저 확인 창은 뜨지 않는다
- And 삭제를 누르면 C가 목록·홈·검색에서 사라지고 "되돌리기" 토스트가 뜨며, 감사 기록 `item.delete` 1건이 생긴다
- And 되돌리기를 누르면 C가 원래 분류에 돌아오고, 그 비밀번호를 다시 열람하면 저장했던 카나리 값이 나오며, `item.restore` 1건이 생긴다

**AC-CON-014** — maps REQ-CON-012
- 기준: 오래된 버전으로 덮어쓰기 거부
- Given 항목 D의 `version`이 3이다
- When 사용자 1이 version 3으로 저장해 4가 된 뒤 사용자 2가 version 3으로 저장한다
- Then 두 번째 요청은 409이고 D는 사용자 1의 내용 그대로이며, 화면은 최신 내용을 다시 불러오라는 안내를 보인다

**AC-CON-015** — maps REQ-CON-013
- 기준: 입력 검증과 출처 검사
- Given 로그인한 담당자
- When 주소가 `javascript:alert(1)`, `data:text/html,x`, `ftp://x`인 항목, 없는 분류 id, 201자 제목, 21개 연동 주소를 저장한다
- Then 모두 400이고 저장되지 않는다(`mailto:` 주소와 빈 주소는 허용, 빈 주소는 "주소 미확인"으로 표시)
- And `Origin: https://evil.io`인 POST·PATCH·DELETE와 `Content-Type: text/plain` POST는 403이다

## 5. 기록

**AC-CON-016** — maps REQ-CON-018
- 기준: 기록 범위와 평문 부재
- Given 한 번의 테스트 흐름에서 로그인 성공·실패, 생성, 수정, 삭제, 되돌리기, 열람, 복사, 거부, 가져오기, 사람 목록 수정, 분류 추가, 팀 고정 목록 수정을 수행했다
- When `console-audit-log`를 읽는다
- Then 각 동작에 해당하는 action이 최소 1건씩 있고, 어떤 기록에도 카나리 값·암호문·세션 토큰·OAuth 코드가 없다
- And 감사 기록 쓰기를 실패하게 만든 상태에서 열람을 요청하면 값 없이 503이다
- And 기존 `audit-log`에는 콘솔 로그인 1줄만 늘고 열람 기록은 들어가지 않는다
- And 콘솔 쿠키 없이 state가 틀린 콜백 요청을 50회 보내도 `console-audit-log` 건수가 늘지 않는다
- And 기록이 5,000건을 넘어 정리된 뒤 다시 읽어도 정리된 기록이 되살아나지 않는다(건수 5,000 이하)

**AC-CON-017** — maps REQ-CON-018
- 기준: 관리자 기록 보기
- Given 관리자와 일반 사용자
- When 각각 `GET /api/console/audit`를 요청한다
- Then 관리자는 최근 순서의 기록을 받고 일반 사용자는 403이다
- And 관리자 화면 메뉴에 기록 보기가 있고 일반 사용자 메뉴에는 없다

## 6. 관리자 기능

**AC-CON-018** — maps REQ-CON-019
- 기준: 가져오기 형식·교체 의미·내보내기·사람 목록·분류·팀 고정
- Given 저장소에 파일에 없는 기존 항목 X1, X2(X1은 공유 계정이고 카나리 비밀번호 저장), 파일에 없는 기존 사람 P0가 있다
- And 가져올 파일은 프로토타입 "JSON 내보내기" 형식(`{app, version:2, exportedAt, categories, cards[]}`)이고, 카드에 `login_id` 값과 테스트가 덧붙인 `password` 값이 있으며, 최상위에 `people`과 `teamPins`를 덧붙였다. `people`에는 정상 2명(가 나다 `ga@try-n.com`, 라 마바 `ra@try-n.com`), `admin: true`만 있고 email이 없는 1명, email이 `x@try-n.com.evil.io`인 1명이 있다. 카드 하나의 owner는 `"가 나다, 라  마바"`(공백 2개)이고, 다른 카드의 owner는 목록에 없는 이름 `"사 아자"`다 (이름·주소는 모두 테스트용으로 지어낸 값)
- When 관리자가 가져오기를 확인한다
- Then 항목 수가 파일의 카드 수와 같고, X1·X2는 bootstrap·내보내기·`console-items` 문서 어디에도 없으며, X1의 비밀 레코드는 `console-secrets`에서 사라지고, P0는 `console-people`에서 사라진다
- And 어떤 항목에도 파일 안의 비밀번호·아이디가 저장되지 않는다(`hasLoginId: false`, `hasPassword: false`, 열람 시 "미입력")
- And owner `"가 나다, 라  마바"` 카드는 owners 2개(`ga@try-n.com`, `ra@try-n.com`)가 되고, `"사 아자"` 카드는 owners `[{name:"사 아자"}]`(email 없음)이며 결과의 `unmatchedOwners`에 `"사 아자"`가 있다
- And email이 없는 사람과 위장 도메인 사람은 저장되지 않고 결과의 `peopleSkipped`에 있다. 저장된 어느 사람도 관리자 권한을 받지 않는다(`admin: true`는 무시)
- And `console-settings.teamPins`가 파일의 `teamPins` 중 가져온 항목에 있는 id만으로 바뀐다. `teamPins` 키가 없는 파일을 가져오면 저장된 값이 그대로다
- And 같은 파일을 한 번 더 가져오면 결과가 같다. X1과 같은 id를 가진 카드가 든 파일을 그 뒤에 가져오면 그 항목이 들어온다(콘솔 문서는 tombstone 대상이 아님)
- And `cards`와 `items`를 함께 가진 파일, 주소가 `javascript:alert(1)`인 카드가 하나 섞인 파일, 파일 안에서 id가 겹치는 파일은 400이고 저장된 문서가 하나도 바뀌지 않는다
- And 일반 사용자의 가져오기는 403이다
- And 내보내기 파일에는 `password`·`login_id` 키 자체가 없고, 그 파일을 `items` 형식으로 다시 가져오면 같은 항목 집합이 된다
- And 관리자가 `PUT /api/console/people`로 한 명을 뺀 목록을 보내면 그 사람이 문서에서 사라진다
- And 관리자가 분류를 추가하면 왼쪽 메뉴에 나타나고, 일반 사용자에게는 분류 추가 메뉴가 없다
- And 관리자가 `PUT /api/console/settings`로 팀 고정 목록을 바꾸면 홈의 팀 필수 목록이 바뀌고 감사 기록 `settings.update` 1건이 생긴다. 일반 사용자의 같은 요청은 403이다

## 7. 화면과 언어

**AC-CON-019** — maps REQ-CON-023
- 기준: 한·영 대응
- Given i18n 사전
- When 단위 테스트가 `ko`와 `en`의 키 집합(중첩 키 포함)을 비교한다
- Then 두 집합이 같다
- And 화면에서 English를 누르면 메뉴·버튼·안내가 영어로 바뀌고, 새로고침 뒤에도 영어가 유지되며, 처음 방문하면 한국어다
- And `title_en`이 빈 항목은 영어 화면에서 한국어 제목을 보인다

**AC-CON-020** — maps REQ-CON-020
- 기준: 화면 구조와 접속 표시
- Given 시드를 가져온 콘솔에 로그인했다
- When 홈과 전체 항목을 연다
- Then 왼쪽 메뉴에 홈·전체 항목·분류 8개·공유 계정·내 항목이 있고, 홈에 팀 필수(또는 내 고정)·최근 수정·분류별 요약이 있으며, 주소 없는 항목이나 담당자 없는 항목이 있을 때만 확인 필요 한 줄이 보인다
- And 목록은 카드 격자가 아닌 한 줄 행이고 행 높이 전환 기능이 없으며, 모든 행에 연필(편집) 동작이 있다
- And 행을 누르면 오른쪽 상세 패널이 열린다
- And 분류·접속 방식·담당자·팀·내 항목·확인 필요 거르기가 각각 목록을 줄인다
- And 접속 표시는 sso→SSO, invite→초대, shared-credential→공유 계정, internal-login→별도 로그인이고 public 항목에는 표시가 없다(단위 테스트로 매핑 고정)

**AC-CON-022** — maps REQ-CON-021
- 기준: 스타일 격리
- Given 로컬 개발 서버에서 사이트 전역 CSS(`dark-theme.css` 포함)가 로드된 상태
- When 콘솔 홈, 상세 패널, 편집 양식, 삭제 인라인 확인, 되돌리기 토스트, 관리자 대화상자(가져오기·사람 목록), 로그인 화면을 스크린샷으로 찍고 계산된 스타일을 확인한다
- Then 콘솔 루트 배경이 `#faf8f3`, 사이드바가 `#f2efe8`, 주 버튼이 `#1f6f5c`이며, 입력칸·label·제목 글자가 밝은 배경 위에서 읽힌다(입력칸 배경이 `#14161f`가 아님)
- And 공개 사이트 헤더·푸터가 보이지 않는다
- And 대화상자·토스트 요소가 콘솔 루트(`[data-admin-root="console"]`)의 자손이다
- And `git grep -nE "var\(--lx-|:root" src/app/console` 결과가 0줄이다
- And `git grep -nE "className=\"(card|page|container|shell|nav|topbar|hero|step|footer)\b|<footer|createPortal" src/app/console` 결과가 0줄이다

**AC-CON-023** — maps REQ-CON-022
- 기준: 외부 자산 없음
- Given 콘솔 화면을 브라우저로 연다
- When 네트워크 기록을 본다
- Then 콘솔 화면이 직접 요청하는 이미지·폰트·아이콘·스크립트는 모두 같은 출처다(사이트 공통 GA·GTM 스크립트는 레이아웃 소관이라 제외)
- And `git grep -nE "https?://[^\"' ]+\.(png|jpe?g|svg|webp|woff2?|ico)|favicon|s2/favicons|cdn\." src/app/console src/lib/console` 결과가 0줄이다
- And 시드에 있는 서비스(YouTube, Instagram, Google Drive·Sheets, GA, Search Console, Naver, Slack, Vercel, Claude, ChatGPT 등)의 마크가 주소로 판별된다(`brandOf` 단위 테스트)

## 8. 검색 노출

**AC-CON-021** — maps REQ-CON-024
- 기준: robots·sitemap·헤더
- Given 빌드된 사이트
- When `robots()` 출력, `sitemap()` 출력, `/console`·`/console/login`·`/api/console/bootstrap` 응답 헤더, `/console` HTML의 meta를 확인한다
- Then robots의 `*` 그룹과 모든 AI 크롤러 그룹 disallow에 `/console`이 있고, sitemap에 `/console`을 포함한 URL이 없으며, 세 응답 모두 `X-Robots-Tag: noindex, nofollow`이고, HTML에 `<meta name="robots" content="noindex, nofollow">`가 있다

## 9. 상한과 위생

**AC-CON-024** — maps REQ-CON-016
- 기준: 열람 상한
- Given 사용자 u가 최근 10분 안에 열람·복사 30회를 했다
- When 31번째 요청을 보낸다
- Then 429이고 값이 없으며 `credential.rate_limited` 기록 1건이 생긴다

**AC-CON-025** — maps REQ-CON-008
- 기준: 공개 저장소 위생
- Given 실행 단계의 마지막 커밋
- When 아래를 실행한다
  - `git grep -nE "drive\.google\.com/drive/folders/|docs\.google\.com/spreadsheets/d/|slack\.com/archives/" -- src data scripts` (콘솔 관련 경로)
  - `git ls-files | grep -iE "console.*(seed|export).*\.json|data/db/console-"`
  - `git grep -nE "process\.env\.[A-Z_]+ *\?\? *['\"][^'\"]{8,}" -- src/lib/console src/app/console src/app/api/console`
- Then 콘솔 시드에서 온 id는 0건, 콘솔 시드·내보내기 JSON 파일 0개, 콘솔 코드의 비밀값 리터럴 폴백 0건이다

## 10. 경계 사례 모음

| 사례 | 기대 |
|---|---|
| 같은 브라우저에 관리자 세션과 콘솔 세션이 함께 있음 | 서로 영향 없음. 콘솔 로그아웃이 관리자 쿠키를 지우지 않음 |
| 접속 방식을 공유 계정에서 초대로 바꿈 | 비밀 레코드 삭제, 이후 열람 404 또는 "미입력" |
| 비밀번호 칸을 비워 저장 | 기존 비밀번호 유지. "저장된 비밀번호 지우기"를 고르면 삭제 |
| 삭제된 항목의 열람 요청 | 404, 값 없음 |
| `CONSOLE_SECRETS_KEY`만 무효 | 항목 열람·편집은 동작, 자격증명 저장·열람은 503 |
| 사람 목록에 없는 신규 직원 | 로그인 가능, 팀은 공통, 본인 항목 생성·편집 가능 |
| 대소문자가 섞인 담당자 email | 소문자 비교로 소유 판정 |

## 11. 품질 게이트

- `npm run typecheck` 오류 0
- 콘솔 관련 테스트 파일과 수정한 기존 모듈(콜백, google-oauth, robots, middleware)의 테스트 통과
- `src/lib/console/*` 커버리지 85% 이상
- 린트 오류 0(바뀐 파일)

## 12. Definition of Done

- [ ] AC-CON-001 ~ AC-CON-025 모두 통과(증거: 명령과 출력, 스크린샷 경로)
- [ ] 기존 관리자 로그인·워크숍 SSO 테스트 수정 없이 통과
- [ ] plan.md §6 오너 확인 D1~D13에 대한 답이 Implementation Kickoff에서 수집되어 progress.md §E.1에 기록됨(D2·D13은 답에 따라 SPEC 개정이 먼저 필요할 수 있음)
- [ ] 시드·비밀값이 커밋되지 않음(AC-CON-025)
- [ ] plan.md §7·§8의 수동 작업·환경변수 목록이 배포 요청과 함께 오너에게 전달됨
