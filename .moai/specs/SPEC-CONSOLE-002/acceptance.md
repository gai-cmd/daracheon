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
- And Chrome(팝업 차단을 끈 기본 설정)에서는 새 탭이 로그인 주소로 열리고, 콘솔에 대체 링크가 보이지 않는다
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
- Then 아이디 입력과 비밀번호 입력(그리고 콘솔이 그리는 다른 자격증명 입력) 모두에 `autocomplete="off"`, `data-1p-ignore`, `data-lpignore="true"`가 있다
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

## 9. 완료 정의

- 22개 기준이 모두 통과하고, 기준별 명령·관찰 결과가 progress.md §E.2에 있다
- 브라우저 확인 중 확인하지 못한 항목(설치되지 않은 브라우저 등)은 "미확인"으로 명시돼 있다
- 로컬 확인용 `data/db/console-*.json`, 세션 쿠키 스크립트, 임시 비밀값이 커밋에 없다
