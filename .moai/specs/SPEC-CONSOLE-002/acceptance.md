# SPEC-CONSOLE-002 — 인수 기준 (acceptance.md)

각 기준은 통과·실패로만 판정한다. 판정 수단은 두 가지다.

- **테스트**: vitest 단위·라우트 테스트, 또는 `renderToStaticMarkup` 정적 렌더 테스트(이 저장소의 vitest 환경은 `node`이고 jsdom이 없다).
- **브라우저 확인**: §0 환경에서 실제 브라우저로 확인하고, 명령·화면 결과를 progress.md §E.2에 남긴다.

"카나리 값"은 테스트 전용 가짜 값 `canary-Pw-7f3e`(비밀번호), `canary-id-91ab`(아이디)다. 사람 이름·email은 모두 지어낸 값(`a@try-n.com`, `owner@try-n.com`, `member@try-n.com`, `admin@try-n.com`)을 쓴다. 공개 저장소이므로 실제 직원 정보는 쓰지 않는다.

## 0. 브라우저 확인 환경

- 로컬 개발 서버(`http://localhost:<port>`)에서만 확인한다. zoellife.com에는 요청하지 않는다.
- `BLOB_READ_WRITE_TOKEN`을 비운 채 실행해 데이터가 로컬 `data/db/*.json`에만 쓰이게 한다(`src/lib/db.ts` 개발 모드). 프로덕션 Blob에는 읽기·쓰기 모두 하지 않는다. 이렇게 생긴 `data/db/console-*.json` 파일은 커밋하지 않는다.
- 콘솔 비밀값(`CONSOLE_SESSION_SECRET`, `CONSOLE_SECRETS_KEY`, `CONSOLE_ADMIN_EMAILS`)은 이 확인에만 쓰는 임시 값을 셸에 넣는다. 저장소나 문서에 적지 않는다.
- 로그인은 구글을 거치지 않고, 임시 비밀값으로 서명한 콘솔 세션 쿠키를 스크래치 디렉터리의 일회성 스크립트로 만들어 넣는다(스크립트는 커밋하지 않음). 계정은 `owner@try-n.com`(담당자), `member@try-n.com`(일반 멤버), `admin@try-n.com`(관리자).
- 시드: 지어낸 공유 계정 항목 2개(하나는 아이디·비밀번호 저장, 하나는 비어 있음)와 링크 항목 1개.

## 1. 서버와 데이터 (M1)

**AC-CS2-001** — maps REQ-CS2-001 · 테스트
- Given `owner@try-n.com` 세션
- When (a) `hide_password: "yes"`로 항목을 만든다 (b) `access_method: "shared-credential"`, `hide_password: true`로 만든다 (c) `access_method: "public"`, `hide_password: true`로 만든다 (d) `hide_password` 칸이 없는 기존 저장 항목이 있는 상태에서 bootstrap을 부른다
- Then (a) 400이고 오류 목록에 `field: "hide_password"`가 있으며 `console-items`가 바뀌지 않는다 (b) 저장값과 bootstrap 값이 `true` (c) 저장값과 bootstrap 값이 `false` (d) bootstrap의 모든 항목에 `hide_password`가 boolean으로 있고 (d)의 항목은 `false`
- And PATCH로 (b) 항목의 접속 방식을 `public`으로 바꾸면 저장값이 `false`가 된다

**AC-CS2-002** — maps REQ-CS2-001, REQ-CS2-002 · 테스트
- Given 카나리 자격증명이 저장된 `hide_password: true` 공유 계정 항목과 칸이 없는 항목
- When 관리자가 내보내기를 받는다
- Then 모든 항목에 `hide_password`가 boolean으로 있고(앞의 것 `true`, 뒤의 것 `false`), 응답 본문에 카나리 문자열이 없다
- And 가져오기 파일의 항목이 `hide_password: "true"`(문자열)를 가지면 400이고, 가져오기 전후 `console-items`·`console-people`·`console-categories`·`console-secrets` 내용이 같다
- And 칸이 없는 항목은 `false`로, `true`인 공유 계정 항목은 `true`로 들어간다

**AC-CS2-003** — maps REQ-CS2-003 · 테스트 (기존 동작 보존)
- Given `hide_password: false` 공유 계정 항목, 카나리 비밀번호 저장, `member@try-n.com`이 공개 범위상 열람 가능
- When `purpose: "copy"`와 `purpose: "view"`로 각각 비밀번호를 요청한다
- Then 둘 다 200 `{ value: "canary-Pw-7f3e" }`, `Cache-Control`에 `no-store`, 감사 기록에 `credential.copy` 1건과 `credential.view` 1건이 따로 생긴다
- And 10분 안에 view·copy를 합쳐 30번 성공한 뒤 31번째 `copy`는 429이고 `credential.rate_limited`가 남는다
- And 감사 기록 쓰기가 실패하도록 만들면 `copy`도 503 `audit_unavailable`이고 본문에 값이 없다
- And `Origin: https://evil.io`인 `copy` 요청은 403이다
- And SPEC-CONSOLE-001의 기존 자격증명 테스트(`src/app/api/console/items/[id]/credential/__tests__/credential.test.ts`)가 수정 없이 통과한다

**AC-CS2-004** — maps REQ-CS2-004 · 테스트
- Given 공개 범위 `전체`, `hide_password: true`, 카나리 아이디·비밀번호가 저장된 공유 계정 항목, 담당자 `owner@try-n.com`

| 요청자 | field | purpose | 기대 |
|---|---|---|---|
| member | password | view | 403 `{ error: "reveal_hidden" }`, 본문에 카나리 없음, `credential.deny` + `meta.reason = "reveal_hidden"` 1건, `credential.view` 0건 |
| member | password | copy | 200, 값 반환, `credential.copy` 1건 |
| member | login_id | view | 200, 값 반환 |
| owner | password | view | 200 |
| admin | password | view | 200 |

- And 같은 항목의 `hide_password`를 `false`로 바꾸면 member의 password view가 200이다
- And 공개 범위 `본인` + `hide_password: true`일 때 member의 password view는 `reveal_hidden`이 아니라 기존 `forbidden`으로 403이다(공개 범위 판정이 먼저)
- And `reveal_hidden` 거절은 열람 상한 계산(view·copy 건수)에 들어가지 않는다

**AC-CS2-005** — maps REQ-CS2-005 · 테스트
- Given 항목 A에 자격증명 사건 25건(view·copy·deny·rate_limited 섞음, 시각이 모두 다름), 항목 B에 사건 3건, 항목 A에 `item.update` 2건, 사람 목록에 `member@try-n.com` = 이름 "지어낸멤버"
- When `GET /api/console/items/A/activity`를 요청한다
- Then 세션 없음 401, member(담당자 아님·관리자 아님) 403, 없는 id 404, 삭제된 항목 404
- And owner와 admin은 200이고 `events`가 정확히 20건, 시각 내림차순, 모두 항목 A의 `credential.*` 사건, B의 사건과 `item.update`는 없다
- And member의 사건은 `actor: "지어낸멤버"`, 사람 목록에 없는 actor는 email 그대로
- And `action`은 `view`·`copy`·`deny`·`rate_limited` 중 하나, `reveal_hidden` 거절에는 `reason: "reveal_hidden"`이 있다
- And 응답 본문에 카나리 문자열, `iv`·`tag`·`ct` 키가 없고 `Cache-Control`에 `no-store`가 있다

**AC-CS2-006** — maps REQ-CS2-006 · 테스트
- Given `a@try-n.com`과 `b@try-n.com` 세션, `console-user-prefs` 비어 있음
- When a가 bootstrap → `POST /api/console/me/autofill-guide { version: 1 }` → bootstrap 순으로 부른다
- Then 첫 bootstrap `prefs.autofillGuideAck === false`, POST 200 `{ autofillGuideAck: true }`, 두 번째 bootstrap `prefs.autofillGuideAck === true`
- And bootstrap의 `me` 키는 `email`·`name`·`team`·`isAdmin` 네 개 그대로이고, 기존 `src/app/api/console/__tests__/bootstrap.test.ts`가 수정 없이 통과한다
- And 같은 POST를 한 번 더 보내도 200이고 a의 레코드는 1개다
- And b의 bootstrap은 여전히 `false`이고, b가 확인한 뒤에도 a의 레코드가 남아 있다
- And 저장된 레코드의 키는 `email`, `autofillGuide`뿐이고 `autofillGuide`의 키는 `version`, `at`뿐이다
- And 세션 없는 POST 401, `Origin: https://evil.io` 403, `{ version: 2 }` 400
- And `console-user-prefs` 읽기가 실패하도록 만들면 bootstrap은 200이고 `prefs.autofillGuideAck === true`다

## 2. 스크롤바 (M2)

**AC-CS2-007** — maps REQ-CS2-007 · 브라우저 확인 + 테스트
- Given §0 환경
- When Chrome과 Firefox로 `/console`(로그인 후)과 `/console/login`을 연다
- Then 두 화면 모두 `getComputedStyle(document.documentElement).scrollbarColor`가 `rgb(214, 208, 196) rgb(242, 239, 232)`이고 `scrollbarWidth`가 `thin`이다
- And 목록·상세 패널·사이드바 스크롤 요소의 계산된 `scrollbarColor`도 같고, 계산된 `scrollbarWidth`도 `thin`이다
- And Safari: macOS 시스템 설정 "스크롤 막대 보기"를 "항상"으로 둔 채 `/console`을 열어 화면을 캡처하고, 세로 스크롤 막대의 막대 중앙 픽셀이 `#d6d0c4`(214, 208, 196)와 각 채널 ±16 이내, 트랙 픽셀이 `#f2efe8`(242, 239, 232)와 각 채널 ±16 이내다(측정한 RGB 값을 진행 기록에 남긴다)
- And 테스트: `console.module.css`의 스크롤바 규칙이 `#f2efe8`(또는 `transparent`), `#d6d0c4`, `#bdb5a6`만 쓰고 `var(--`를 쓰지 않는다
- And 테스트: `console.module.css` 전체를 Next에 번들된 `postcss-modules-local-by-default`(`mode: 'pure'`)로 처리하면 오류가 없다(전역만 있는 선택자 금지 — plan-audit CS2-PA-D1). 그리고 로컬 개발 서버에서 `/console/login`이 200으로 열린다(CSS 컴파일 오류 없음). 부하가 36 미만이면 `npx next build`도 통과한다

**AC-CS2-008** — maps REQ-CS2-008 · 브라우저 확인 + 테스트
- Given §0 환경
- When Chrome과 Firefox로 `/`와 `/admin/login`을 연다. 그리고 `/console`을 연 탭에서 `/`로 이동한다
- Then 세 경우 모두 `document.documentElement`의 계산된 `scrollbarColor`가 `rgb(212, 168, 67) rgb(20, 22, 29)`이다
- And 테스트: 이 SPEC의 변경 전후 `git diff`에 `src/styles/globals.css`와 `src/styles/zoel/dark-theme.css`가 없다

## 3. 추가·편집 양식 (M2)

**AC-CS2-009** — maps REQ-CS2-009 · 테스트 + 브라우저 확인
- Given 새 항목 양식과, `access_method: "shared-credential"`인 기존 항목의 편집 양식
- When 각각 정적 렌더한다
- Then 첫 입력 컨트롤이 `role="radiogroup"`이고 그 안에 `role="radio"`가 2개(링크, 공유 계정)이며 바로 다음 컨트롤이 분류 `select`다
- And 새 양식은 링크가 `aria-checked="true"`, 공유 계정 항목의 편집 양식은 공유 계정이 `aria-checked="true"`다
- And 종류를 저장 칸으로 바꾸는 순수 함수(단위 테스트):
  - 새 항목: 공유 계정 → `{ type: "account", access_method: "shared-credential" }`, 다시 링크 → `{ type: "link", access_method: "public" }`
  - `type: "project"`, `access_method: "sso"`로 열린 항목: 공유 계정 → 링크로 왕복하면 `{ type: "project", access_method: "sso" }`로 돌아온다
  - 위 항목에서 링크 상태로 접속 방식을 `invite`로 바꾼 뒤 공유 계정 → 링크로 왕복하면 `{ type: "project", access_method: "invite" }`이다(마지막 링크 상태 값)
  - `access_method: "shared-credential"`로 열린 항목에서 링크로 → `{ type: "link", access_method: "public" }`
- And 브라우저: 공유 계정을 눌러 저장하면 요청 본문의 `type`이 `account`, `access_method`가 `shared-credential`이다(네트워크 탭)
- And 저장 전 삭제 확인(단위 테스트 또는 브라우저): 저장된 아이디나 비밀번호가 있는 공유 계정 항목을 편집하며 링크로 바꾸고 저장을 누르면, PATCH 요청 전에 "저장된 아이디·비밀번호가 영구히 삭제돼요"(영어판 대응 문구)가 있는 확인 대화상자가 뜬다. "취소"하면 PATCH 요청이 0건이고 양식 입력값과 서버의 `console-secrets` 기록이 그대로다. "삭제하고 저장"을 누르면 PATCH 1건이 나간다
- And 저장된 계정 정보가 없는 공유 계정 항목이나 새 항목을 링크로 저장할 때는 확인 대화상자가 뜨지 않는다

**AC-CS2-010** — maps REQ-CS2-010 · 테스트
- Given 종류가 공유 계정인 양식과 링크인 양식
- When 정적 렌더한다
- Then 공유 계정 양식에서 로그인 주소·아이디·비밀번호·생성 버튼·메모·공유 대상 라디오 3개(값 `전체`·`팀`·`본인`, 이름 "전체 멤버"·"우리 팀"·"나만(비공개)")·"멤버에게 비밀번호 숨기기 (복사만 허용)" 체크박스가 모두 "더 보기" 영역(`#f-more`) 밖에 있다
- And 메모 칸의 안내 문구에 "비밀번호는 적지 마세요"(영어판 대응 문구)가 있다
- And 링크 양식에는 아이디·비밀번호 칸이 없고, "더 보기" 안 접속 방식 선택지에 `shared-credential`이 없다
- And 링크 양식의 첫 화면(`#f-more` 밖) 칸 구성은 종류·분류를 빼면 SPEC-CONSOLE-001 양식과 같다(제목·주소·한 줄 설명·연동 주소)

**AC-CS2-011** — maps REQ-CS2-011 · 테스트
- Given `generatePassword`
- When 10,000번 호출한다
- Then 모든 결과가 20자이고, 각 결과에 소문자·대문자·숫자·기호가 1자 이상 있으며, 허용 문자 집합 밖의 문자가 없다
- And 난수원으로 `crypto.getRandomValues`가 호출된다(스파이)
- And 허용 범위 밖 바이트를 먼저 내놓는 가짜 난수원을 넣으면 그 바이트가 버려지고(거부 표본추출) 결과가 범위 안 바이트만으로 정해진다

**AC-CS2-012** — maps REQ-CS2-012 · 테스트 + 브라우저 확인
- Given 관리자와 일반 멤버
- When 양식과 사이드바를 정적 렌더한다
- Then 관리자 양식의 분류 `select` 마지막 선택지가 "+ 새 분류 만들기…"이고, 관리자 사이드바의 분류 제목 옆에 접근 가능한 이름이 있는 "+" 버튼이 있다
- And 일반 멤버에게는 둘 다 없다
- And 브라우저: 관리자가 제목을 적은 뒤 "+ 새 분류 만들기…"로 분류를 추가하면 대화상자가 닫힌 뒤 분류 선택값이 새 분류이고 제목이 그대로다. 취소하면 이전 분류가 선택돼 있다. 사이드바 "+"는 같은 대화상자를 연다

## 4. 공유 계정 상세 (M2)

**AC-CS2-013** — maps REQ-CS2-013 · 테스트 + 브라우저 확인
- Given 아이디·비밀번호가 있는 공유 계정 항목(`hide_password: true`)
- When 편집 권한이 없는 멤버와 담당자 기준으로 상세 패널을 정적 렌더한다
- Then 둘 다 로그인 주소·아이디·비밀번호 행과 "아이디 복사"·"비밀번호 복사" 버튼이 있다
- And 멤버 렌더에는 비밀번호 "보기" 버튼이 없고, 담당자 렌더에는 있다. 아이디 "보기"는 둘 다 있다
- And 브라우저(member): "비밀번호 복사"를 누르면 요청이 `purpose: "copy"`이고, 직후 `document.body.innerText`와 모든 `input`·`textarea` 값에 카나리가 없으며, 클립보드 내용이 카나리다

**AC-CS2-014** — maps REQ-CS2-014 · 브라우저 확인
- Given 로그인 주소와 카나리 아이디가 있는 공유 계정 항목, member 세션
- When Chrome과 Safari에서 "로그인 열기"를 누른다
- Then 두 브라우저 모두 클립보드 내용이 카나리 아이디이고, 토스트 "아이디를 복사했어요 — 비밀번호 복사 후 붙여넣으세요"가 보인다
- And Chrome 기본 설정(팝업 차단 켜짐, 이 사이트 예외 없음)에서는 새 탭이 로그인 주소로 열리고, 콘솔에 대체 링크가 보이지 않는다
- And Safari에서는 새 탭이 로그인 주소로 열리거나, 막히면 토스트 안에 로그인 주소로 가는 링크가 보인다. 어느 쪽이었는지 progress.md §E.2에 남긴다
- And 사이트 설정에서 팝업을 차단한 Chrome에서는 새 탭이 열리지 않고, 그 대신 로그인 주소로 가는 링크가 토스트 안에 보인다
- And 새 탭에서 `window.opener`가 `null`이고 `document.referrer`가 빈 문자열이다
- And 감사 기록에 `login_id`의 `credential.copy` 1건이 생긴다

**AC-CS2-015** — maps REQ-CS2-015 · 테스트
- Given 아이디·비밀번호가 둘 다 없는 공유 계정 항목
- When 담당자와 멤버 기준으로 상세 패널을 정적 렌더한다
- Then 둘 다 "아직 계정 정보가 없어요"가 보이고 아이디·비밀번호 행이 없다
- And 담당자 렌더에만 "계정 정보 입력" 버튼이 있다. 이 버튼의 동작은 편집 양식을 아이디 칸 초점으로 여는 것이다(`requestEdit(id, 'id')` 호출을 확인하는 단위 테스트 또는 브라우저 확인)

**AC-CS2-016** — maps REQ-CS2-016 · 테스트 + 브라우저 확인
- Given 공유 계정 항목
- When 담당자·관리자·멤버 기준으로 정적 렌더한다
- Then 담당자와 관리자 렌더에만 "사용 기록" 펼침이 있고, 렌더만으로는 `/activity` 요청이 생기지 않는다
- And 브라우저(owner): 패널을 열 때 `/activity` 요청이 0건, "사용 기록"을 펼치면 1건이고, member가 앞서 한 복사가 "누가·복사·언제" 행으로 보인다

**AC-CS2-017** — maps REQ-CS2-017 · 테스트
- Given 공유 계정 보기에 항목 2개(하나는 `hasPassword: true`, 하나는 아이디·비밀번호 모두 없음)
- When 목록을 정적 렌더한다
- Then 앞 항목 행에 "계정 정보 있음", 뒤 항목 행에 "계정 정보 없음"(영어판 대응 문구)이 있다

## 5. 자동 입력 끄기 안내 (M2)

**AC-CS2-018** — maps REQ-CS2-018 · 테스트 + 브라우저 확인
- Given 자동 표시 판정 순수 함수 `shouldAutoOpenGuide({ ack, laterThisSession })`
- Then `{ false, false }`만 `true`이고 나머지 세 경우는 `false`다(단위 테스트)
- And 계정 메뉴와 자격증명 카드의 정적 렌더에 "자동 입력 끄기 안내" 항목이 있다
- And 브라우저: 처음 들어온 `a@try-n.com`에게 팝업이 1번 뜬다 → "나중에" → 같은 탭 새로고침 시 안 뜬다 → 개발자 도구 콘솔에서 `sessionStorage.clear()`를 실행하고 새로고침하면 다시 뜬다(새 브라우저 세션과 같은 상태. 세션 복원 기능의 영향을 받지 않도록 브라우저를 닫는 절차는 쓰지 않는다) → "확인했어요" → 새로고침해도 안 뜬다 → 다른 브라우저(또는 새 프로필)로 같은 계정에 들어와도 안 뜬다 → 계정 메뉴의 "자동 입력 끄기 안내"를 누르면 열린다

**AC-CS2-019** — maps REQ-CS2-019 · 테스트 + 브라우저 확인
- Given `detectBrowser`와 안내표(design.md §2.6)
- When 공개된 표준 UA 문자열 표(Chrome·Edge·Whale·Firefox·Safari 데스크톱, Chrome Android, iPhone Safari, iPhone Chrome, 알 수 없는 UA)로 단위 테스트한다
- Then 각 UA가 기대한 `{ browser, mobile }`로 판별되고, Edge·Whale UA는 `chrome`으로 판별되지 않는다
- And 데스크톱 Chrome·Edge·Whale·Firefox는 설정 주소가 있고 Safari·모바일·기타는 없다. 대화상자 정적 렌더에서 주소가 없는 경우 "설정 화면 열기" 버튼이 없고 메뉴 경로 단계가 있다
- And 모든 경우의 정적 렌더에 "이 사이트는 브라우저 설정을 직접 바꿀 수 없어요"(영어판 대응 문구)가 있다
- And 브라우저: 이 맥에 설치된 각 브라우저에서 "설정 화면 열기"를 누르면 클립보드에 그 브라우저의 주소가 들어가고, 새 탭 주소창에 붙여 넣으면 비밀번호 저장 제안을 끄는 설정이 있는 화면이 열린다. 브라우저마다 결과(열린 화면, 맞지 않으면 고친 주소)를 진행 기록에 남기고, 설치되지 않은 브라우저는 "미확인"으로 적는다. 설치된 브라우저 중 하나라도 맞지 않는 주소가 남아 있으면 실패다

**AC-CS2-020** — maps REQ-CS2-020 · 테스트 + 브라우저 확인
- Given 공유 계정 양식과 상세 패널
- When 정적 렌더한다
- Then 아이디 입력에 `autocomplete="off"`가 있다
- And 비밀번호 입력에 `autocomplete="new-password"`가 있고 `autocomplete="off"`가 아니다
- And 아이디 입력과 비밀번호 입력 모두에 `data-1p-ignore`와 `data-lpignore="true"`가 있다
- And 브라우저: 같은 출처(콘솔을 띄운 로컬 개발 서버의 `/admin/login`)의 아이디·비밀번호를 저장해 둔 Chrome 프로필로, 카나리 아이디·카나리 비밀번호가 저장된 공유 계정 항목의 편집 양식을 열면 아이디 칸과 비밀번호 칸이 둘 다 비어 있다(자동 채우기 없음). 다른 칸만 고쳐 저장하면 PATCH 요청 본문에 `login_id`·`password` 값이 없고, 저장 뒤 담당자가 "보기"로 확인한 아이디·비밀번호가 저장 전 카나리 값과 같다. 칸이 채워졌거나 값이 바뀌면 실패다
- And 복사 대체 경로(클립보드 API가 없을 때)의 임시 요소는 `aria-hidden="true"`, 투명(opacity 0)이며 복사 직후 문서에서 사라진다(단위 테스트 또는 브라우저 확인에서 복사 뒤 `document.querySelectorAll('textarea[aria-hidden="true"]').length === 0`)

## 6. 공통 (M2)

**AC-CS2-021** — maps REQ-CS2-021 · 테스트 + 브라우저 확인
- Given `src/lib/console/i18n.ts`
- Then 한·영 키 집합이 같다는 기존 테스트가 새 키를 포함해 통과한다
- And 정적 렌더: 종류 radiogroup과 공유 대상 radiogroup에 접근 가능한 이름이 있고, 체크박스는 `label`과 연결되며, 새로 생긴 아이콘 전용 버튼(생성, 보기, 복사, 사이드바 "+")에 모두 `aria-label`이 있다
- And 브라우저: 키보드만으로 종류 컨트롤에 들어가 화살표 키로 공유 계정으로 바꿀 수 있다. 종류를 바꾸거나 "더 보기"·"사용 기록"을 펼쳐도 그 위에 있는 제목 칸(양식)·계정 카드 제목(상세)의 `getBoundingClientRect().top`이 그대로다
- And 브라우저: 폭 375px에서 양식(공유 계정), 계정 카드, 안내 팝업 각각을 띄웠을 때 `document.documentElement.scrollWidth <= 375`다

**AC-CS2-022** — maps REQ-CS2-003, REQ-CS2-004, REQ-CS2-013 · 브라우저 확인 (흐름 전체)
- Given owner가 공유 계정 양식으로 항목을 만든다: 로그인 주소, 카나리 아이디, 생성 버튼으로 만든 비밀번호, 공유 대상 "전체 멤버", "멤버에게 비밀번호 숨기기" 켬
- When member로 들어가 상세를 열고 "비밀번호 복사"를 누른 뒤, 개발자 도구에서 같은 항목에 `purpose: "view"`로 직접 요청한다
- Then 복사는 성공하고, 직접 요청은 403 `reveal_hidden`이다
- And owner로 다시 들어가 "사용 기록"을 펼치면 member의 복사 1건과 거절 1건이 보이고, owner는 비밀번호 "보기"로 값을 볼 수 있다

## 7. 경계 사례 (위 기준에 포함되지 않은 확인)

- 숨기기를 켠 채 종류를 링크로 바꿔 저장하면 `hide_password`가 `false`로 저장된다(AC-CS2-001의 PATCH 사례와 같은 규칙). 저장된 계정 정보가 있으면 그 전에 삭제 확인이 뜬다(AC-CS2-009).
- 담당자가 아닌 관리자도 숨김 예외다(AC-CS2-004 표의 admin 행).
- 아이디만 있고 비밀번호가 없는 공유 계정은 빈 상태가 아니라 기존 행 표시를 쓴다(비밀번호 행은 "없음" 표시).
- 로그인 주소가 없는 공유 계정에서는 "로그인 열기"를 보이지 않는다.
- 팝업이 떠 있는 동안 다른 대화상자(삭제 확인 등)를 열지 않는다. 팝업은 첫 화면이 그려진 뒤에만 뜬다.

## 8. 품질 게이트

- `npx tsc --noEmit` 오류 0
- 바뀐 경로에 대한 `npx eslint` 오류 0
- 콘솔 관련 테스트(`src/lib/console`, `src/app/api/console`, `src/app/console`, 관리자 콜백 테스트) 전부 통과. SPEC-CONSOLE-001 테스트는 기대값을 바꾸지 않는다. 안내 확인 값은 `me` 밖(`prefs`)에 두므로 `bootstrap.test.ts`의 `me` 엄격 비교도 그대로 통과해야 한다. 예외는 새 칸 `hide_password` 추가로 깨지는 항목 스냅샷뿐이며, 그 차이만 반영하고 진행 기록에 적는다
- 공개 저장소 점검: `git grep -nE "CONSOLE_(SESSION_SECRET|SECRETS_KEY|ADMIN_EMAILS) *(\?\?|\|\|) *['\"]" src` 0줄, 새 파일에 실제 직원 이름·email·내부 id 없음
- 외부 호스트 자산 없음: 새 코드에 `https://` 이미지·폰트·스크립트 참조 없음
- (0.5.0) 채널 새 소식의 `<img>`는 모두 `/api/console/feed/thumb?u=…` 또는 같은 출처 경로를 가리킨다(AC-CS2-037). 피드를 가져오는 서버 코드와 썸네일 경로는 바깥 요청 검사(AC-CS2-034)를 통과해야 한다
- (0.5.0) 실제 채널 id·블로그 id·피드 주소가 콘솔 코드(`src/lib/console`, `src/app/console`, `src/app/api/console`)와 그 테스트에 없다(AC-CS2-040)

## 9. 완료 정의

- 40개 기준(M1·M2의 001~022, 0.5.0 추가분 M3·M4의 023~040)이 모두 통과하고, 기준별 명령·관찰 결과가 progress.md §E.2에 있다
- 브라우저 확인 중 확인하지 못한 항목(설치되지 않은 브라우저 등)은 "미확인"으로 명시돼 있다
- 로컬 확인용 `data/db/console-*.json`, 세션 쿠키 스크립트, 임시 비밀값이 커밋에 없다

## 10. 보기 전환·영문 모드·작은 수정 (M3, 0.5.0 추가분)

판정 수단은 §0~§1과 같다. M2부터 클릭 동작은 파일 단위 jsdom 환경 테스트(`*-dom.test.ts`)로도 판정한다(progress.md §E.2 M2). "넓은 화면"은 폭 1280px, "좁은 화면"은 폭 375px이다.

**AC-CS2-023** — maps REQ-CS2-022 · 테스트 + 브라우저 확인
- Given 전체 항목 보기를 한국어와 영어로 정적 렌더한다
- Then 목록 머리에 `role="radiogroup"`이 하나 있고 접근 가능한 이름이 "보기 방식" / "View"이며, 그 안에 `role="radio"` 두 개 "목록"·"카드"("List"·"Cards")가 있고, `aria-checked="true"`인 쪽만 `tabindex="0"`이다
- And 위키, 분류, 공유 계정, 내 항목, 검색 결과, 홈 "최근 수정한 카드" 펼침의 렌더에도 같은 컨트롤이 있고, 홈의 고정 칩과 분류별 요약 영역 안에는 없다
- And jsdom: 컨트롤에 초점을 둔 채 오른쪽 화살표를 누르면 "카드"가 선택되고 초점이 옮겨 가며, Home은 "목록", End는 "카드"를 고른다
- And 브라우저(넓은 화면, 항목 10개 이상): 목록 → 카드 → 목록으로 바꾸는 동안 툴바와 목록 머리의 `getBoundingClientRect().top`이 세 번 모두 같다

**AC-CS2-024** — maps REQ-CS2-023 · 테스트 + 브라우저 확인
- Given 항목 3개(설명이 있는 것, 설명 없이 주소만 있는 것, 주소가 없는 것)와, 공유 계정 보기의 항목 2개(계정 정보 있음·없음)
- When 목록 방식과 카드 방식으로 각각 정적 렌더한다
- Then 목록: 행마다 브랜드 아이콘, 제목, 둘째 줄이 있고 둘째 줄은 첫 항목에서 설명, 둘째 항목에서 주소의 호스트다. 담당자가 보이고, 직접 버튼은 "열기"·"편집" 두 개 이하이며 그 밖에는 더 보기 메뉴 버튼만 있다
- And 카드: 목록 영역에 `data-view="cards"`가 있고, 카드마다 브랜드 아이콘, 제목, 설명, 분류 이름, 담당자, 더 보기 메뉴 버튼이 있으며, 주소가 있는 카드에만 "열기"가 있다. 공개가 아닌 접속 방식의 항목에는 접속 방식 표시가 하나 있다
- And 공유 계정 보기에서는 두 방식 모두 "계정 정보 있음"·"계정 정보 없음"이 보인다
- And 두 방식의 `data-id` 순서가 같다
- And jsdom: 카드 제목을 누르면 행 제목을 누를 때와 같은 항목으로 상세 패널 열기가 호출된다
- And 브라우저(넓은 화면): 제목 80자·설명 300자인 항목이 섞여 있어도 카드 첫 줄의 카드 높이(`getBoundingClientRect().height`)가 모두 같다(차이 0px). 제목은 두 줄, 설명은 두 줄까지만 보인다

**AC-CS2-025** — maps REQ-CS2-024 · 테스트
- Given 순수 함수 `resolveViewMode(stored, width)`
- Then `('list', 1280)` → 목록, `('cards', 375)` → 카드, `(null, 1280)` → 카드, `(null, 481)` → 카드, `(null, 480)` → 목록, `('grid', 1280)` → 카드(알 수 없는 값은 기본값)
- And jsdom: `localStorage.getItem`과 `setItem`이 예외를 던지게 해도 목록 보기가 기본 방식으로 그려지고 오류가 나지 않는다
- And jsdom: 저장값을 "목록"으로 둔 채 넓은 화면으로 마운트하면 첫 렌더부터 행이고, 마운트 뒤 어느 시점에도 `data-view="cards"` 요소가 생기지 않는다(MutationObserver로 확인)
- And jsdom: "카드"로 바꾼 뒤 다른 목록 보기(분류)로 옮기면 그 보기도 카드이고, 저장소에 그 값이 남는다

**AC-CS2-026** — maps REQ-CS2-025 · 테스트
- Given 영어 화면에서 `title: "가나 제목"`, `title_en: ""`, `description: "가나 설명"`, `description_en: ""`, `note: "가나 메모"`, `note_en: ""`, 링크 하나(`label: "가나 링크"`, `label_en: ""`)를 가진 기존 항목의 편집 양식을 정적 렌더한다
- Then 첫 화면(더 보기 밖)의 제목 자리에 `f-title-en`이 있고 `placeholder="가나 제목"`이다. 설명 자리에는 `f-desc-en`(`placeholder="가나 설명"`)이 있다
- And `f-title`·`f-desc`·`f-note`(한국어)는 더 보기 안 "Korean text" 묶음에 있고, 더 보기 안 메모 칸과 링크 이름 칸은 영문 칸(`note_en`·`label_en`)을 먼저 보여 주며 각각 한국어 값을 placeholder로 가진다
- And jsdom: 영어 화면 새 항목에서 영문 제목만 "Alpha"로 채워 저장하면 POST 본문이 `title: "Alpha"`, `title_en: "Alpha"`다
- And jsdom: 영어 화면에서 두 제목이 모두 비어 있으면 요청이 0건이고 `f-title-en`에 `aria-invalid="true"`와 필수 입력 오류 문구가 있다
- And jsdom: 영어 화면에서 영문 설명만 고쳐 저장하면 PATCH 본문의 `description`이 "가나 설명" 그대로다(한국어 값을 지우지 않음)
- And 한국어 화면의 기존 양식 테스트(SPEC-CONSOLE-001, M2 `item-form*.test.ts`)가 기대값을 바꾸지 않고 통과한다

**AC-CS2-027** — maps REQ-CS2-026 · 테스트
- Given 사람 목록 `{ email: "a@try-n.com", name: "가나", name_en: "Gana" }`, `{ email: "b@try-n.com", name: "다라", name_en: "" }`, 로그인한 사람 `a@try-n.com`, `title_en`이 빈 항목 하나, `name_en`이 빈 분류 하나
- When 영어 화면으로 계정 메뉴, 목록 행, 카드, 상세 패널, 편집 양식의 담당자 제안 목록을 정적 렌더한다
- Then 계정 칩 이름은 "Gana"이고 아바타 글자는 `initials("Gana")`의 결과다
- And 담당자 표시는 a가 "Gana", b가 "다라"이고, 제안 목록에 "Gana"가 있다
- And 담당자 입력 "Gana"는 `a@try-n.com`으로 해석된다
- And `title_en`이 빈 항목은 한국어 제목이, `name_en`이 빈 분류는 한국어 이름이 보인다
- And `bootstrap.test.ts`의 `me` 엄격 비교가 수정 없이 통과한다

**AC-CS2-028** — maps REQ-CS2-027 · 테스트
- Given 새 테스트 `src/app/console/__tests__/no-hangul-literals.test.ts`와 그 검사 함수
- Then 현재 트리의 `src/app/console/**/*.tsx`(테스트 폴더 제외)에서 통과하고, 허용 목록의 모든 항목에 이유 문구가 있다
- And 검사 함수에 `<span>안녕</span>`, `title="안녕"`, `` `안녕 ${x}` ``가 든 소스 문자열을 넣으면 각각 1건을 보고하고, `// 안녕`, `/* 안녕 */`, `{/* 안녕 */}`만 든 문자열은 0건이다
- And 허용 목록에 소스에 없는 항목을 하나 더하면 테스트가 실패한다(허용 목록이 낡지 않음)

**AC-CS2-029** — maps REQ-CS2-028 · 테스트 + 브라우저 확인
- Given `console.module.css`와 안내 대화상자 정적 렌더
- Then `.guideSteps` 규칙에 `list-style: decimal`(또는 `list-style-type: decimal`)이 있고, 단계는 `<ol>` 안의 `<li>`다
- And 브라우저: 안내 대화상자에서 `getComputedStyle(ol).listStyleType === "decimal"`이고 단계 앞에 1., 2., 3.이 보인다(한국어·영어 각 1회)

**AC-CS2-030** — maps REQ-CS2-029 · 테스트
- Then 한국어 `sharedDesc`가 정확히 "팀이 함께 쓰는 로그인이에요. 항목을 열어 아이디와 비밀번호를 복사해 로그인하세요."이고 영어가 정확히 "Logins the team shares. Open an item to copy the login ID and password and sign in."이다
- And 한국어 `accNote.shared-credential`에 "아이디"가 있고 "사용자 이름"이 없으며, 영어판에 "login ID"가 있고 "username"이 없다
- And 두 키의 한국어 문구에 "볼 수", 영어 문구에 "see"·"view"가 없다

## 11. 채널 새 소식 (M4, 0.5.0 추가분)

M4 테스트는 바깥 네트워크에 요청하지 않는다. 피드·썸네일 요청은 주입한 가짜 fetch와 가짜 DNS 조회로 판정하고, 피드 고정 데이터(fixture)는 research.md §6에서 확인한 구조를 지어낸 값으로 다시 쓴 파일이다. 유튜브 id는 `UCfake`로 시작하는 22자 꼬리 값(예: `UCfakechannel00000000001`), 네이버 블로그 id는 `fake`로 시작하는 값, RSS·인스타그램 주소는 `https://example.com/…`·`https://example.org/…`만 쓴다. 시간은 주입한 시계로 움직인다.

**AC-CS2-031** — maps REQ-CS2-030 · 테스트
- Given 관리자 `admin@try-n.com` 세션, `teamPins: ["it-1"]`가 저장된 설정 문서
- When 올바른 채널 5개(종류마다 하나)를 저장한다
- Then 200이고 설정 문서의 `channels`가 보낸 순서·값과 같으며 `teamPins`가 `["it-1"]` 그대로이고, 감사 기록에 `settings.update` 1건이 남는다. 새 행의 id는 서버가 붙이고 기존 id는 유지된다
- And `member@try-n.com`의 읽기·저장은 403, 세션이 없으면 401, `Origin: https://evil.io`인 저장은 403이다
- And 다음 각 경우는 400이고 설정 문서가 저장 전과 같다: `youtube` 출처 `UCshort`, `naver` 출처 `Bad.Id`, `rss` 출처 `http://example.com/feed`, `instagram` 출처 `https://u:p@example.org/x`, `zoellife-blog` 출처 `x`, 색 `red`, 빈 이름, 41자 이름, 같은 id 두 개, 채널 13개
- And 채널 편집기 정적 렌더(관리자): 행마다 종류 선택, 이름, 영문 이름, 출처, 색, 켜기/끄기, 위·아래 버튼이 있고, 계정 메뉴의 관리자 도구에 "채널 관리" / "Channels"가 있다. 멤버 렌더에는 그 항목이 없다

**AC-CS2-032** — maps REQ-CS2-031 · 테스트
- Given 켜진 채널 4개(유튜브 fixture 15건, 네이버 응답 시간 초과, RSS 500 응답, 자사 블로그 글 3건)와 꺼진 채널 1개
- When 멤버 세션으로 피드를 요청한다
- Then 200이고 `channels`가 설정 순서의 켜진 채널 4개뿐이다. 유튜브·블로그는 `ok: true`, 네이버는 `ok: false`·`error: "timeout"`, RSS는 `ok: false`·`error: "http_status"`다
- And `items`에는 유튜브 6건과 블로그 3건만 있고 `publishedAt` 내림차순이며, 항목마다 `channelId`·`title`·`url`·`publishedAt`·`thumb`(문자열 또는 null) 칸이 있다
- And 세션이 없으면 401이다

**AC-CS2-033** — maps REQ-CS2-032 · 테스트
- Given 가짜 fetch 호출 횟수를 세는 피드 집계와 주입한 시계
- When 같은 설정으로 피드를 두 번 요청하고, 29분 뒤, 31분 뒤에 다시 요청한다
- Then 출처마다 fetch가 처음 1번, 29분 뒤에도 그대로 1번, 31분 뒤 2번이다
- And 실패한 출처는 4분 뒤 요청에서 다시 가져오지 않고 6분 뒤 요청에서 다시 가져온다
- And 한 채널의 출처 값을 바꾸면 다음 요청에서 그 채널만 새로 가져온다
- And 응답의 `Cache-Control`이 `private, max-age=1800`이다

**AC-CS2-034** — maps REQ-CS2-033 · 테스트
- Given 바깥 요청 함수(피드용 허용 목록 `www.youtube.com`), 가짜 DNS 조회, 가짜 fetch
- Then 다음 각 주소는 fetch 호출 없이 거절된다: `http://www.youtube.com/…`, `https://127.0.0.1/…`, `https://[::1]/…`, `https://localhost/…`, 허용 목록에 없는 `https://example.net/…`, `https://www.youtube.com.example.net/…`, DNS가 `10.0.0.5`를 돌려주는 허용 호스트
- And 첫 응답이 `302 Location: http://rss.blog.naver.com/x`(research.md §6.2에서 본 모양)이면 두 번째 요청 없이 실패하고, 리다이렉트가 두 번 이어지면 실패하며, 허용 목록 안의 `https:` 주소로 한 번 넘어가면 성공한다
- And 본문이 1MB + 1바이트이면 `too_large`로 실패하고, 상한을 넘긴 뒤에는 더 읽지 않는다(스트림 읽기 횟수로 확인)
- And 응답이 5초 안에 오지 않으면 `timeout`으로 실패한다(가짜 타이머)
- And 나가는 요청에 `Cookie`·`Referer` 헤더가 없고 `credentials: "omit"`, `referrerPolicy: "no-referrer"`, `redirect: "manual"`이다
- And 이 함수는 `src/lib/ssrf.ts`의 `assertPublicHttpUrl`로 공개 주소를 검사한다(가져오기 문을 `grep`으로 확인)

**AC-CS2-035** — maps REQ-CS2-034 · 테스트
- Given fixture 4종: 유튜브 Atom(15건, `media:thumbnail`이 `i2.ytimg.com`), 네이버 RSS(CDATA 제목·주소, 설명 안 `<img src>`가 `blogthumb.pstatic.net`, `pubDate` `Wed, 04 Nov 2026 10:22:52 +0900` 꼴), 일반 RSS 2.0(`enclosure type="image/jpeg"`, 제목에 `&amp;`·`&#39;`), 일반 Atom(`link rel="alternate"`, `updated`만 있음)
- Then 각 fixture의 첫 항목 제목·주소·`publishedAt`(ISO 문자열)·썸네일 원본 주소가 기대값과 같고, `&amp;`·`&#39;`는 `&`·`'`로 풀린다
- And 적대적 입력: `<!DOCTYPE … <!ENTITY x "…">]>`와 `&x;`가 든 피드에서 엔티티가 펼쳐지지 않고, 제목의 `<script>a</script>b`는 태그가 빠진 글자만 남으며, `javascript:` 주소 항목은 빠지고, 날짜를 읽을 수 없는 항목은 남되 날짜 있는 항목 뒤에 온다
- And 201자 제목은 200자로 잘린다
- And `package.json`의 의존성 목록이 이 마일스톤 전후로 같다

**AC-CS2-036** — maps REQ-CS2-035 · 테스트
- Given 가짜 블로그 저장소(발행 7건, 임시 저장 1건)와 호출을 세는 가짜 fetch
- Then 자사 블로그 채널은 발행 글 6건만, 최신순으로, `url`이 `/blog/<slug>` 꼴이며, fetch 호출이 0건이다
- And 인스타그램 채널은 fetch 호출 0건, `ok: true`, 항목 0건이고 `home`이 설정한 프로필 주소다
- And 홈 정적 렌더: 인스타그램 채널과 `ok: false` 채널마다 링크 타일이 하나씩 있고, 타일은 채널 배지와 "인스타그램에서 보기" / "View on Instagram"(실패한 채널은 "<채널 이름>에서 보기" / "View on <label>")을 보이며, `href`가 그 채널의 `home`, `target="_blank"`, `rel="noopener noreferrer"`다

**AC-CS2-037** — maps REQ-CS2-036 · 테스트
- Given 썸네일 경로, 가짜 fetch, 가짜 DNS, 공개 Blob 호스트를 돌려주는 `src/lib/db.ts` 도우미, 켜진 RSS 채널 `https://example.com/feed.xml`
- Then 세션이 없으면 401이다
- And `https://i.ytimg.com/vi/x/hqdefault.jpg`, `https://i2.ytimg.com/vi/x/hqdefault.jpg`, `https://blogthumb.pstatic.net/a.png`, 공개 Blob 호스트의 이미지, `https://example.com/a.jpg`는 200이고 원본 `Content-Type`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=86400`이 붙는다
- And 다음 각 경우는 fetch 호출 없이 기본 그림(`Cache-Control: private, max-age=300`)을 돌려준다: `u` 없음, 2049자 `u`, `http://i.ytimg.com/…`, `https://evil.example/…`, `https://ytimg.com.evil.example/…`, `https://i.ytimg.com.evil.example/…`, `https://127.0.0.1/…`, `https://localhost/…`
- And 원본이 `image/svg+xml`, `text/html`, 2MB + 1바이트, 허용 목록 밖으로의 리다이렉트이면 기본 그림이다
- And 피드 응답의 `thumb` 값은 모두 `null`이거나 `/api/console/feed/thumb?u=`로 시작하고, 허용 목록 밖 이미지를 가진 항목의 `thumb`는 `null`이다

**AC-CS2-038** — maps REQ-CS2-037 · 테스트 + 브라우저 확인
- Given 채널 3개와 항목 20건의 피드 데이터
- When 홈을 한국어·영어로 정적 렌더한다
- Then 제목 "채널 새 소식" / "Channel updates"인 구역이 있고, "최근 수정된 항목" 제목 구역은 없다
- And 거르기 칩이 `role="radiogroup"` 하나 안에 "전체" + 채널 3개로 있고, "전체"에서 타일이 12개, 최신순이다. jsdom에서 채널 칩을 누르면 그 채널 타일만(6개 이하) 남는다
- And 타일마다 `<img>`의 `src`가 `/api/console/feed/thumb?u=`로 시작하거나 기본 그림이고, 채널 배지에 채널 이름과 그 채널 색 배경이 있으며, 제목, 날짜가 있고, 타일 링크는 `target="_blank"`, `rel="noopener noreferrer"`다
- And `console.module.css`의 타일 그림 규칙에 `aspect-ratio: 16 / 9`, 제목 규칙에 두 줄 자르기(`-webkit-line-clamp: 2`)가 있다
- And 불러오는 중 렌더에는 높이가 정해진 자리 표시 영역이 있고, 켜진 채널이 없으면 안내 문구가 있으며 "채널 관리" 버튼은 관리자 렌더에만 있다
- And "최근 수정한 카드 보기" 버튼이 `aria-expanded="false"`이고, jsdom에서 누르면 `true`가 되며 최근 수정 항목 목록(최대 6개)이 보기 전환 컨트롤과 함께 나타난다
- And 브라우저(좁은 화면): 홈에서 `document.documentElement.scrollWidth <= 375`이고 첫 두 타일의 `getBoundingClientRect().top`이 같다(두 열)
- And 브라우저(넓은 화면): 피드를 불러오기 전과 뒤에 "채널 새 소식" 제목의 `top`이 같다

## 12. M3·M4 공통 (0.5.0 추가분)

**AC-CS2-039** — maps REQ-CS2-038 · 테스트 + 브라우저 확인
- Then 한·영 키 집합이 같다는 기존 테스트가 M3·M4 새 키를 포함해 통과한다
- And 정적 렌더: 보기 방식 radiogroup과 채널 칩 radiogroup에 접근 가능한 이름이 있고, 새 아이콘 전용 버튼(채널 편집기의 위·아래·삭제, 링크 타일의 바깥 링크 아이콘이 있다면 그것)에 모두 `aria-label`이 있다
- And 순수 함수 `badgeTextColor(hex)`: `#ffffff`, `#000000`, `#ff0000`, `#1f6f5c`, `#f2c94c`, `#777777`, `#3b5998` 각각에서 고른 글자색과 배경의 대비가 4.5:1 이상이다(WCAG 상대 휘도 공식으로 계산)
- And 브라우저: 키보드만으로 보기 방식 컨트롤과 채널 칩에 들어가 화살표 키로 고를 수 있다. 영어 화면에서 항목 편집 양식·계정 칩·담당자 표시를 화면 갈무리해 한국어가 영문 칸이 빈 데이터 값에만 남아 있음을 확인한다

**AC-CS2-040** — maps REQ-CS2-030, REQ-CS2-035, REQ-CS2-036, REQ-CS2-037 · 명령 + 브라우저 확인 (흐름 전체·공개 저장소 점검)
- Given 이 마일스톤의 커밋이 들어간 트리
- Then `git grep -nE "UC[A-Za-z0-9_-]{22}" -- src/lib/console src/app/console src/app/api/console`의 모든 결과가 `UCfake`로 시작한다. 범위를 콘솔 경로로 한정하는 이유: 공개 사이트 코드(`src/data`, `src/app/layout.tsx` 등)에는 SPEC-CONSOLE-002 이전부터 회사 공개 채널 주소가 있고(research.md §5.8), 이 SPEC은 그 파일을 건드리지 않는다
- And `git grep -nE "rss\.blog\.naver\.com/[a-z0-9_-]+|blog\.naver\.com/[a-z0-9_-]+|instagram\.com/[A-Za-z0-9_.]+" -- src/lib/console src/app/console src/app/api/console`의 모든 결과에서 id 부분이 `fake`로 시작한다
- And `git ls-files data/db | grep console-` 출력이 없다(로컬 확인 데이터 미커밋)
- And 브라우저(§0 환경, 관리자): 채널 편집기에 채널을 넣고(실제 값은 로컬 데이터에만 둔다) 홈을 열면, 가져오기에 성공한 채널은 썸네일 타일, 실패한 채널(2026-11-15 기준 유튜브 포함 예상)과 인스타그램은 링크 타일로 보인다. 개발자 도구 네트워크 탭에서 페이지가 부른 이미지 요청은 모두 같은 출처(`/api/console/feed/thumb` 또는 정적 자산)다. 채널별 결과(썸네일/링크 타일, 실패면 `error` 코드)를 진행 기록에 남기되 채널 id와 주소는 적지 않는다

## 13. M3·M4 경계 사례

- 영어 화면에서 한국어 제목이 이미 있는 항목의 영문 제목만 고쳐도 한국어 제목은 바뀌지 않는다(AC-CS2-026의 설명 사례와 같은 규칙).
- 보기 방식은 목록 보기마다가 아니라 브라우저 하나에 하나다. 한 보기에서 바꾸면 모든 목록 보기에 적용된다.
- 같은 글이 두 채널에 있으면(예: 블로그 글이 RSS로도 나옴) 각각 따로 보인다. 중복 제거는 하지 않는다.
- 피드 항목 주소에 붙은 추적 매개변수(예: 네이버의 `fromRss=true`)는 그대로 둔다.
- 채널이 모두 실패하면 링크 타일만 보이고, 구역 자체는 사라지지 않는다.
- 썸네일 원본 주소의 퍼센트 인코딩(research.md §6.2의 네이버 이미지 경로)은 다시 인코딩하지 않고 그대로 요청한다.
