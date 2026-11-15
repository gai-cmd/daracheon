# SPEC-CONSOLE-002 — 조사 (research.md)

조사 기준: 워크트리 `zoel-console`(브랜치 `zoel-console`, HEAD `5100e84a`, 코드는 origin/main `7dc9bd4e`와 같음), 2026-11-15. 0.5.0 추가분(§5~§7)의 기준은 HEAD `4085f34d`다. 아래 줄 번호는 이 트리에서 파일을 열거나 `grep -n`으로 확인한 값이다. 설계 판단은 design.md에 있고, 이 문서는 그 판단의 근거가 된 사실만 적는다.

## 1. 근거 자료

| 자료 | 확인 내용 |
|---|---|
| 오너 요청 2건(2026-11-15) | 스크롤바·분류 선택기·TeamPassword식 계정 공유, 이어서 자동 입력 끄기 안내 팝업과 설정 화면 안내. 요지는 spec.md §1 |
| 오너 스크린샷 | 콘솔 목록 화면 오른쪽의 어두운 트랙 + 금색 막대 스크롤바, 항목 추가 패널(분류·제목·주소·한 줄 설명·연동 주소·더 보기), TeamPassword 레코드 편집(이름·로그인 URL·사용자 이름·패스워드(눈·생성)·비고·공유처 "팀 / 본인만(비공개)"), 일회용 공유 대화상자, 사용자·그룹 화면 |
| TeamPassword 도움말 센터 | §3. 아래 표의 문서를 직접 열어 확인했다 |
| SPEC-CONSOLE-001 | 운영 중인 콘솔의 요구사항·설계. 특히 design.md §6.2 스타일 격리(포털 없음) |

## 2. 코드 조사

### 2.1 자격증명 라우트 `src/app/api/console/items/[id]/credential/route.ts`

- 용도는 이미 두 가지다: `const PURPOSES = ['view', 'copy'] as const;`(L24). 본문 검사에서 그 밖의 값은 거절된다(L54).
- 판정 순서 주석(L31): 세션 + Origin → 항목 → 공개 범위(거절은 감사 기록) → 열람 상한(감사 기록) → …
- 공개 범위 거절은 `credential.deny`(L76), 상한 초과는 `credential.rate_limited`(L85) 후 429(L89).
- 정상 열람의 감사 동작은 `` `credential.${purpose}` ``(L98)이라 `view`와 `copy`가 이미 따로 남는다.
- 열람 상한 계산 `countRecentCredentialReveals`(`src/lib/console/audit.ts` L44~L55)는 `credential.view`와 `credential.copy`만 센다. 따라서 새 `reveal_hidden` 거절(`credential.deny`)은 상한에 들어가지 않는다.
- 편집 권한 `canEdit`(`src/lib/console/permissions.ts` L36~L38)는 `user.isAdmin || isOwner(user, item)`이다. 숨기기 예외 대상(design.md CS2-D2)과 같은 집합이다.

이 사실로 design.md §2.2의 새 7단계는 공개 범위 판정 뒤, 상한 앞에 들어가며 `copy`에는 기존 관문이 그대로 걸린다.

### 2.2 링크로 바꿔 저장할 때의 비밀 기록 삭제

- `PATCH /api/console/items/[id]` 주석(`src/app/api/console/items/[id]/route.ts` L23~L25): 공유 계정에서 벗어나면 비밀 기록을 지운다.
- 실제 처리 `planSecretChange`(`src/lib/console/store.ts` L85): `item.access_method !== 'shared-credential'`이면 기존 기록이 있을 때 `{ kind: 'remove' }`(L94).

이 동작이 design.md CS2-D11(저장 전 삭제 확인)의 근거다. 서버 동작은 바꾸지 않는다.

### 2.3 "공유 계정" 보기 `#/shared`

- 화면 상태에 `{ name: 'shared' }`가 이미 있다(`src/lib/console/ui-model.ts` L19). 사이드바 항목의 주소는 `'#/shared'`(L227)이고 `src/app/console/__tests__/sidebar.test.ts` L47이 이를 고정한다.
- 제목·설명: `ConsoleApp.tsx` L501~L508(`t('nav.shared')`, `t('sharedDesc')`).
- 목록: `ListView.tsx` L103에서 공유 계정 보기일 때 접속 방식 거르기 칩을 숨긴다. 계정 정보가 있는지 표시하는 부분은 아직 없다(REQ-CS2-017이 새로 요구).
- 접속 방식 판정은 화면 여러 곳에서 `access_method === 'shared-credential'`로 한다(`DetailPanel.tsx` L221, `ItemForm.tsx` L137, `SearchBox.tsx` L95).

### 2.4 사이트 공용 스크롤바 `src/styles/globals.css`

- 스크롤바 규칙은 `@layer base {`(L134) 안에 있다. `html { scrollbar-width: auto; scrollbar-color: #d4a843 #14161d; }`(L142~L145), `::-webkit-scrollbar` 14px(L146), 트랙 `#14161d`(L150), 막대 `#d4a843`(L153), 마우스 올림 `#e2b857`(L159).
- 같은 파일에 `@layer components`(L168), `@layer utilities`(L224)가 이어진다.
- CSS 층 규칙상 층에 속하지 않은 선언은 층 안 선언보다 우선하므로, 층 없는 `console.module.css` 규칙이 `@layer base`를 이긴다(design.md §2.5). 공용 파일은 고치지 않는다.

### 2.5 콘솔 루트와 CSS 모듈 순수성

- 콘솔 루트는 두 화면 모두 같은 `console.module.css`의 `.root`를 쓴다: `ConsoleApp.tsx` L443·L575, `login/LoginScreen.tsx` L59. 둘 다 `data-admin-root="console"` 속성도 붙어 있다.
- 콘솔 대화상자는 `<dialog>`를 콘솔 루트 안에 그린다(`src/app/console/Dialog.tsx` L9 주석, L47). `createPortal`은 쓰지 않는다(`grep` 0건).
- 순수성 검사 재실행(2026-11-15, 이 워크트리): Next에 번들된 `node_modules/next/dist/compiled/postcss-modules-local-by-default`를 `mode: 'pure'`로 돌린 결과

  ```
  FAIL | :global(html:has([data-admin-root="console"])) … is not pure (pure selectors must contain at least one local class or id)
  PASS | :global(html):has(.root) => html:has(:local(.root))
  PASS | :global(html):has(.root)::-webkit-scrollbar-thumb:hover => html:has(:local(.root))::-webkit-scrollbar-thumb:hover
  PASS | .root, .root * => :local(.root), :local(.root) *
  PASS | .root *::-webkit-scrollbar-thumb => :local(.root) *::-webkit-scrollbar-thumb
  ```

  그래서 design.md §2.5는 전역만 있는 선택자 대신 지역 클래스 `.root`를 `:has()` 안에 넣는다.

### 2.6 복사와 입력 칸

- 복사 도우미 `copyText`(`ConsoleApp.tsx` L186~L209): 보안 컨텍스트에서 `navigator.clipboard.writeText`를 먼저 쓰고, 실패하거나 쓸 수 없으면 임시 `textarea`를 열린 대화상자 또는 콘솔 루트에 붙였다가 `execCommand('copy')` 뒤 `remove()`한다. 임시 칸은 `readonly`, `aria-hidden="true"`, `position:fixed`·1px·`opacity:0`이다.
- 양식 입력 칸은 대부분 `autoComplete="off"`이지만 비밀번호 칸 `f-pw`는 `autoComplete="new-password"`다(`ItemForm.tsx` L412). `data-1p-ignore`·`data-lpignore`는 아직 없다. REQ-CS2-020은 아이디 칸 `off`와 비밀번호 칸 `new-password`를 그대로 두고 두 칸에 `data-1p-ignore`·`data-lpignore="true"`를 더한다(design.md §2.7).
- 같은 출처의 관리자 로그인 양식 `src/app/admin/login/page.tsx` L107~L109는 `type="password"`·`autoComplete="current-password"`다. 관리자 브라우저에는 이 출처(zoellife.com)의 저장된 비밀번호가 있을 수 있다.
- MDN `autocomplete` 속성 문서(<https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete>)는 브라우저가 로그인 칸의 `off`를 무시할 수 있고, 대부분의 최신 브라우저에서 `off`로는 비밀번호 관리자의 자동 채우기나 저장 제안을 막지 못한다고 적는다. `new-password`는 새 비밀번호 칸용 값이고, 브라우저가 기존 비밀번호를 잘못 채우지 않는 데 쓸 수 있다고 적는다. 문서는 "할 수 있다"로 표현하므로 보장이 아니고, 다른 사람의 비밀번호를 넣는 칸을 직접 다루지는 않는다. 그래서 실제 동작은 AC-CS2-020의 브라우저 확인으로 본다.

### 2.7 bootstrap 응답과 기존 테스트

- `src/app/api/console/__tests__/bootstrap.test.ts` L33: `expect(r.json.me).toEqual({ email, name, team, isAdmin })`로 `me`를 엄격 비교한다. `me`에 칸을 더하면 이 테스트가 깨지므로 안내 확인 값은 최상위 `prefs`에 둔다(design.md CS2-D10).

### 2.8 응답 헤더

- `src/middleware.ts` `withConsoleHeaders`(L39)가 콘솔 응답에 `Referrer-Policy: no-referrer`(L41)를 붙인다. 스크립트가 시작한 새 탭 이동에도 적용되는지는 확인하지 않았다(§4).

### 2.9 테스트 환경

- `vitest.config.ts`: `environment: 'node'`, `include: ['src/**/*.test.ts']`, `oxc.jsx.runtime: 'automatic'`. `package.json`에 `jsdom`·`happy-dom`은 없다.
- 그래서 화면 검증은 `react-dom/server`의 `renderToStaticMarkup` 정적 렌더(기존 예: `src/app/console/__tests__/sidebar.test.ts`)와 순수 함수 단위 테스트로 하고, 클릭·클립보드·새 탭처럼 DOM 동작이 필요한 판정은 로컬 개발 서버에서 브라우저로 확인한다(acceptance.md §0). 새 테스트 환경 의존성은 추가하지 않는다.

## 3. TeamPassword 기능 조사

도움말 센터(<https://help.teampassword.com/en/>)의 두 모음 "Using TeamPassword"(11개 문서)와 "Managing Your Organization"(6개 문서)을 열어 확인했다. 레코드 칸 구성(이름·로그인 URL·사용자 이름·패스워드·비고·공유처)은 문서가 아니라 오너 스크린샷에서 확인한 것이다.

| TeamPassword 기능 | 도움말 내용 | 이 SPEC의 대응 |
|---|---|---|
| 레코드(이름·로그인 URL·사용자 이름·패스워드·비고) | 오너 스크린샷 | 공유 계정 종류: 제목·로그인 주소·아이디·비밀번호·메모(REQ-CS2-010, design.md CS2-D1) |
| 공유처 "팀 / 본인만(비공개)" | 오너 스크린샷. Member 역할은 자기가 속한 그룹의 레코드만 보고 다른 레코드는 존재도 모른다(역할 문서) | 공유 대상 전체 멤버 / 우리 팀 / 나만 = 기존 공개 범위 전체·팀·본인(REQ-CS2-010) |
| Read-only 역할 | Enterprise 요금제 전용. "앱 안에서 클릭해 비밀번호를 볼 수 없다", 공유 레코드를 편집할 수 없다. 복사가 되는지는 문서에 없다 | 사람이 아니라 항목 단위의 "멤버에게 비밀번호 숨기기(복사만 허용)"(REQ-CS2-004) |
| 활동 기록(Activity Log) | 조직 소유자·관리자만 본다. 계정 메뉴 → Manage Teams → Activity 탭, 거르기·정렬·CSV 내려받기. 기록하는 사건 종류와 레코드별 기록 여부는 문서에 없다 | 항목별 "사용 기록" 최근 20건, 담당자·관리자만(REQ-CS2-005, 016). 거르기·내보내기는 하지 않음(spec.md §5) |
| One-time Secret | Enterprise 전용 보안 설정. 켜면 read-only가 아닌 사용자가 공유 레코드의 일회용 비밀 링크를 만든다 | 하지 않음(spec.md §5) |
| 브라우저 확장·자동 입력 | "TeamPassword Browser Extensions", "Enable/Disable Autofill" 문서가 있다(제목만 확인) | 하지 않음. 대신 브라우저 자체의 저장·자동 입력을 끄도록 안내(REQ-CS2-018~020) |
| 첨부 파일, TOTP, 알림 날짜 | "Attachments", "How To Use the TOTP Authenticator", "How to add a reminder date to your records" 문서가 있다(제목만 확인) | 하지 않음(spec.md §5) |
| 사용자·그룹·역할 관리 | 역할 4개(Read-only·Member·Admin·Owner). Admin은 그룹을 만들고 사람을 넣고 초대·제거한다 | 기존 팀 3개와 콘솔 관리자 구분만 쓴다. 그룹 기능은 하지 않음(spec.md §5) |
| 조직 보안 설정 | 2단계 인증 강제, Google 로그인 강제, 세션 시간 4·8·12시간. 비밀번호를 멤버에게 숨기는 설정은 문서에 없다 | 콘솔은 이미 Google 로그인만 쓴다(SPEC-CONSOLE-001). 이번 범위 밖 |

확인한 문서:

- Description of Roles — <https://help.teampassword.com/en/articles/6143642-how-to-change-a-user-s-role-description-of-roles>
- Activity Log — <https://help.teampassword.com/en/articles/5968541-activity-log>
- Security Settings — <https://help.teampassword.com/en/articles/9232408-security-settings>
- 모음 목록 — <https://help.teampassword.com/en/collections/2316342-using-teampassword>, <https://help.teampassword.com/en/collections/3293537-managing-your-organization>

정리하면 TeamPassword도 "보지 못하게 하기"는 역할 수준의 화면 제한이고, 복사나 확장 프로그램 자동 입력으로 값은 결국 멤버 쪽에 전달된다. 이 SPEC의 "복사만 허용"이 화면 수준 장치라는 spec.md §1.1의 설명과 같은 성격이다. 다만 TeamPassword 문서가 read-only의 복사 허용 여부를 밝히지 않으므로, 이 비교는 문서에 적힌 범위까지만이다.

## 4. 확인하지 못한 것 (실행 단계에서 확인)

- 비동기 요청 뒤 `window.open('', '_blank')`를 Safari가 막는지 — AC-CS2-014에서 확인하고 어느 쪽이었는지 진행 기록에 남긴다.
- 스크립트가 시작한 새 탭 이동에서 `document.referrer`가 빈 문자열인지 — AC-CS2-014.
- 브라우저별 설정 주소와 메뉴 이름(design.md §2.6 표) — 이 맥에 설치된 브라우저만 직접 확인한다(AC-CS2-019). 설치되지 않은 브라우저는 미확인으로 남긴다.
- macOS `x-apple.systempreferences:` 딥링크가 웹 페이지에서 Safari 자동 완성 설정을 여는지 — 확인한 경우에만 쓴다.
- 같은 출처 비밀번호가 저장된 Chrome 프로필에서 공유 계정 편집 양식의 아이디·비밀번호 칸이 자동으로 채워지지 않는지 — AC-CS2-020 브라우저 확인. 채워지면 실패이며 진행 기록에 남긴다.
- 운영 데이터의 공유 계정 항목 수와 계정 정보 저장 비율 — 운영 Blob을 읽지 않는 작업이라 조사하지 않았다.

## 5. 코드 조사 — 0.5.0 추가분 (M3·M4)

조사 기준: 같은 워크트리, HEAD `4085f34d`(SPEC-CONSOLE-002 M1·M2 로컬 커밋, 운영 반영 전), 2026-11-15. 줄 번호는 이 트리에서 `grep -n`으로 확인했다.

### 5.1 목록 보기와 카드

- `src/app/console/ListView.tsx` L345~L346 주석: "List views (REQ-CON-020): roomy one-line rows only (no density toggle)". L372 `<ul className={s.rows}>`가 유일한 목록 모양이다. 행(`Row`, L220~)은 별표 고정, 브랜드 아이콘·제목·둘째 줄(호스트, 팀, 접속 방식, 공유 계정 보기의 계정 정보 표시), 분류, 접속 표시, 담당자, 수정 시각, 열기·연필·더 보기 버튼을 가진다.
- 항목 카드 격자는 없다. `console.module.css`의 격자는 홈 고정 칩 `.pins`(L780 `repeat(4, minmax(0, 1fr))`)와 분류 요약 칸 등이고, `.cardActs`(L2199)는 M2 자격증명 카드의 버튼 줄이다. 그래서 리드 범위의 "카드 = 지금의 카드 격자"는 코드와 맞지 않고, 카드 보기는 새로 만든다(design.md CS2-D13).
- SPEC-CONSOLE-001 REQ-CON-020은 "single-density roomy list rows"와 홈의 "recently updated items"를 요구한다. 이 추가분이 그 두 조항을 바꾼다(spec.md §4).
- 저장 도우미: `ConsoleApp.tsx` L56~L70의 `store.get`/`store.set`이 `localStorage` 예외를 삼킨다. 언어 키는 `LANG_STORAGE_KEY = 'zoel-console:lang'`(`i18n.ts` L8).

### 5.2 영어 화면의 양식

- `ItemForm.tsx`는 한국어 칸(`f-title` L577, `f-desc` L381, `f-note` L677)을 주 입력으로 두고, 영문 칸(`f-title-en` L681, `f-desc-en` L684)은 더 보기 안에 있다. 그래서 영어 화면에서도 한국어 값이 첫 화면에 보인다(오너 스크린샷과 일치).
- 영문 메모는 한국어 메모가 바뀌면 비워진다(L280 `note_en: item && item.note === noteT ? item.note_en ?? '' : ''`). 링크 영문 이름도 같은 규칙(L246).
- 서버는 한국어 `title`을 필수로 본다(`validate.ts` L177~L178). 영문 칸은 이미 모든 쌍이 타입에 있다: `ConsoleItem.title_en`·`description_en`·`note_en`, `ConsoleLink.label_en`, `ConsoleCategory.name_en`·`short_en`·`description_en`, `ConsolePerson.name_en`(`types.ts`). 새 영문 칸은 필요 없다.

### 5.3 사람 이름

- 담당자 표시는 이미 영문 이름을 쓴다: `ownerName`(`ui-model.ts` L123~L126)이 영어면 `people`의 `name_en`을 쓴다. `ownersFromText`(L145)는 영문 이름 토큰도 사람으로 해석한다.
- 계정 칩과 아바타 글자는 `app.me.name || app.me.email`(`AccountMenu.tsx` L37, L132)이라 영어 화면에서도 한국어 이름이다. bootstrap `me`는 `{ email, name, team, isAdmin }`뿐(`bootstrap/route.ts` L53)이고, `people`은 `name_en`을 담아 보낸다(L57~L65).
- 편집 양식 담당자 처음 값은 `o.name`으로 만든다(`ItemForm.tsx` L154~L156).

### 5.4 콘솔 화면의 한글 문자열

`grep -nP "[가-힣]" src/app/console/*.tsx`에서 주석을 뺀 결과(2026-11-15):

| 파일 | 내용 | 성격 |
|---|---|---|
| `ItemForm.tsx` L43~L45, L166, L543 | `'전체'`·`'팀'`·`'본인'` | 공개 범위 저장값(데이터) |
| `ItemForm.tsx`·`ListView.tsx` L240·`AdminDialogs.tsx` L188 | `'공통'` | 팀 저장값(데이터) |
| `Sidebar.tsx` L16 | `'한국어'`, `'한'` | 언어 선택기의 자국어 이름 |
| `layout.tsx` L7 | `'조엘라이프 팀 콘솔'` | 페이지 메타데이터 제목 |

화면 문구가 하드코딩된 곳은 찾지 못했다. 오너 스크린샷의 한국어는 양식이 한국어 칸을 보여 주는 것(§5.2)과 계정 칩·담당자 이름(§5.3)에서 온다. 검사 테스트는 앞으로 새 문구가 i18n 밖에 생기는 것을 막는 용도다.

### 5.5 관리자 도구와 설정 문서

- 관리자 도구는 계정 메뉴 안의 항목들이다(`AccountMenu.tsx` L104~L113): 내보내기, 가져오기, 사람, 분류 추가, 팀 필수(내 고정을 팀 필수로 저장), 감사 기록. "설정 대화상자"는 없다(design.md CS2-D26).
- `console-settings` 문서는 `{ teamPins }`이고 `PUT /api/console/settings`는 `teamPins`가 배열이 아니면 400이다(`settings/route.ts` L18~L22). 쓰기는 `{ ...current, teamPins }`라 다른 칸을 보존한다. `readSettings`(`store.ts` L25~L29)는 `teamPins`만 돌려준다. 백업 목록에 이미 있다(`backup.ts` L65).

### 5.6 의존성과 기존 도우미

- `package.json`의 의존성에 XML 파서(`fast-xml-parser`, `xml2js`, `sax`, `rss-parser` 등)나 DOM 구현이 없다(`grep -n` 결과 없음).
- `src/lib/ssrf.ts`: `assertPublicHttpUrl`(L56~L82, DNS를 모두 해석해 사설·루프백·링크로컬·메타데이터 대역을 거부)과 `safeFetch`(L85~, `redirect: 'manual'`로 홉마다 재검증, 최대 3홉, `http:` 허용). 관리자 이미지 미러링(`src/app/api/admin/mirror-url/route.ts`)이 쓰고, 단위 테스트(`src/lib/__tests__/ssrf.test.ts`)가 있다.
- 공개 Blob 주소는 `src/lib/db.ts` L64~L67에서 `BLOB_PUBLIC_BASE` 환경변수, 없으면 기존 기본값으로 정한다(공개 호스트, 비밀값 아님). 내보내지 않는 상수다.
- 사이트 전역 CSP의 `img-src`에는 이미 `i.ytimg.com`, `img.youtube.com`, `*.pstatic.net`이 있다(`next.config.ts` L95). 콘솔은 썸네일 경로를 거치므로 CSP를 바꾸지 않는다. 콘솔 응답에는 `Referrer-Policy: no-referrer`가 붙는다(`src/middleware.ts`).

### 5.7 자사 블로그

- 블로그는 Neon이 켜져 있으면 Postgres, 아니면 Blob `blogPosts`다(`src/lib/blog/store.ts` `isNeonEnabled`, `readPostsSafe` L222). `readLatestPublishedPostsSafe(limit, timeoutMs)`(L287)가 발행 글을 최신순으로, 본문 없이 `{ slug, title, publishedAt, createdAt, coverImage }`만 돌려주고 시간 초과 시 빈 배열이다. 공개 글 주소는 `/blog/[slug]`(`src/app/blog/[slug]`).

### 5.8 공개 사이트 코드의 채널 주소

- 공개 사이트 코드(`src/data/…`, `src/app/layout.tsx` 등)에는 SPEC-CONSOLE-002 이전부터 회사 공개 채널 주소가 있다. 이 SPEC은 그 파일을 건드리지 않고, 콘솔 코드에만 채널 값을 두지 않는 규칙을 건다(acceptance.md AC-CS2-040). 여기에도 그 값을 옮겨 적지 않는다.

## 6. 바깥 피드 형식 확인 — 0.5.0 추가분

확인 일시 2026-11-15, 이 맥에서. 공개된 남의 채널을 예로 썼고, 회사 채널 값은 적지 않는다. 내려받은 파일은 세션 스크래치 폴더에만 두었고 커밋하지 않는다.

**도구 메모**: 지시대로 WebFetch를 먼저 썼으나 유튜브 피드 주소는 WebFetch에서도 `HTTP 404`였고, `rss.blog.naver.com`과 `web.archive.org`는 WebFetch가 "unable to fetch"로 거절했다. 그래서 같은 주소를 `curl`로 직접 받아 구조를 확인했다. 아래 "확인"은 모두 `curl` 응답을 읽은 결과다.

### 6.1 유튜브 채널 피드

- 지금 주소: `https://www.youtube.com/feeds/videos.xml?channel_id=<UC로 시작하는 24자 id>`. 공개 채널 5곳(예: Google for Developers `UC_x5XG1OV2P6uZZ5FSM9Ttw`)으로 요청한 결과 모두 `404 text/html`(1,613바이트 오류 페이지)였다. 브라우저 User-Agent를 넣어도, `playlist_id=UU…` 꼴로 바꿔도, `user=` 꼴도 404였다. 같은 시각 채널 페이지 `https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw`는 200, 썸네일 `https://i.ytimg.com/vi/<id>/hqdefault.jpg`는 `200 image/jpeg`였다. WebFetch(다른 네트워크 경로)로도 404였으므로 이 맥만의 차단은 아닌 것으로 보이지만, 피드가 폐지됐는지 일시 장애인지는 확인하지 못했다(추정하지 않음).
- 형식(보관본으로 확인): Internet Archive의 2024-12-25 보관본 `https://web.archive.org/web/20241225135114id_/https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw`(gzip, 4,334바이트, 풀어서 확인):
  - 루트 `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">`, 채널 정보(`<title>`, `<link rel="alternate" href="https://www.youtube.com/channel/<id>">`, `<author>`, `<published>`) 뒤에 `<entry>` 15개
  - `<entry>` 안: `<id>yt:video:<영상 id></id>`, `<yt:videoId>`, `<yt:channelId>`, `<title>`, `<link rel="alternate" href="https://www.youtube.com/watch?v=<영상 id>"/>`, `<author><name/><uri/></author>`, `<published>2024-12-23T22:00:08+00:00</published>`, `<updated>`, `<media:group>` 안에 `<media:title>`, `<media:content url="https://www.youtube.com/v/<영상 id>?version=3" type="application/x-shockwave-flash" …/>`, `<media:thumbnail url="https://i2.ytimg.com/vi/<영상 id>/hqdefault.jpg" width="480" height="360"/>`, `<media:description>`, `<media:community>`
  - 썸네일 호스트가 `i.ytimg.com`이 아니라 `i2.ytimg.com`이다. 그래서 허용 목록을 `i[0-9]?.ytimg.com`으로 둔다(design.md §2.14). `media:content`는 이미지가 아니므로(플래시 형식) 썸네일 후보에서 빠진다.
- 결론: 파서 고정 데이터는 이 보관본 구조를 지어낸 값으로 다시 쓴다. 운영에서 피드가 계속 404면 유튜브 채널은 링크 타일로 보인다(design.md CS2-D25).

### 6.2 네이버 블로그 RSS

- 주소 꼴 `https://rss.blog.naver.com/<블로그 id>.xml`. 예: 네이버 공식 블로그 `https://rss.blog.naver.com/naverofficial.xml` → `200 text/xml;charset=UTF-8`, 99,085바이트.
  - 루트 `<rss xmlns:activity="http://activitystrea.ms/spec/1.0/" version="2.0">`, `<channel>` 안에 `<title>`·`<link>`(CDATA), `<image><url>`(프로필 그림, `http://blogpfthumb.phinf.naver.net/…` — `http:`라 썸네일 후보로 쓰지 않음), `<description>`, `<language>ko</language>`, `<generator>Naver Blog</generator>`, `<pubDate>`
  - `<item>` 50개. 각 항목: `<author>`, `<category>`(CDATA), `<title>`(CDATA), `<link>`(CDATA, `https://blog.naver.com/<id>/<글 번호>?fromRss=true&trackingCode=rss`), `<guid>`(`https://blog.naver.com/<id>/<글 번호>`), `<description>`(CDATA, 본문 앞부분 + `<img src="https://blogthumb.pstatic.net/…?type=s3">`), `<pubDate>Wed, 04 Nov 2026 10:22:52 +0900</pubDate>`, `<tag>`(CDATA), `<activity:verb>`, `<activity:object-type>`
  - 썸네일은 전용 요소가 없고 설명 안 `<img>`뿐이다. 50개 항목 모두 `blogthumb.pstatic.net`의 `<img>`가 있었다. 이미지 경로에 퍼센트 인코딩된 바이트가 들어 있다.
- 없는 블로그 id(`naverblog`)는 `200`에 빈 `<channel>`(제목·항목 없음, 327바이트)을 돌려준다 → 오류가 아니라 "항목 0개"로 보인다.
- 옮겨 간 블로그 id(`naver_diary`)는 `302 Location: http://rss.blog.naver.com/naverofficial`이었다. `https:`가 `http:`로 바뀌고 `.xml`도 빠진다. 바깥 요청 규칙(https 전용)에서 막히므로 `redirect_rejected`가 된다(design.md §2.12).

### 6.3 네이버 이미지와 Referer

- 위 피드의 첫 `<img>` 주소를 `curl`로 받으면 Referer가 없을 때 `200 image/png`(23,701바이트), `-e "https://example.com/"`로 다른 사이트 Referer를 넣으면 `403 text/html`이었다. 브라우저가 콘솔 페이지에서 직접 불러오면 막힐 수 있다는 근거이고, 썸네일 경로가 Referer 없이 요청하는 이유다(design.md CS2-D22).

## 7. 확인하지 못한 것 — 0.5.0 추가분 (실행 단계에서 확인)

- 유튜브 채널 피드가 운영 서버(Vercel)에서도 404인지 — 로컬 개발 서버로만 확인한다(acceptance.md §0, zoellife.com에는 요청하지 않음). 결과는 AC-CS2-040 진행 기록에 채널 id 없이 남긴다.
- 회사 채널 각각의 실제 피드 응답(네이버 블로그 id, 그 밖의 RSS 주소) — 로컬 확인에서 관리자가 값을 넣어 본다. 값은 커밋하지 않는다.
- 회사 RSS 사이트의 이미지가 피드 주소와 같은 호스트에 있는지 — 다른 호스트(CDN)면 그 채널 썸네일은 기본 그림이 된다. 허용 목록을 넓힐지는 결과를 보고 리드가 정한다.
- 서버리스 환경에서 모듈 메모리 캐시가 얼마나 오래 살아 있는지 — 인스턴스마다 다르며, 적중률은 측정하지 않는다.
- 카드 같은 높이가 Safari에서도 지켜지는지 — AC-CS2-024 브라우저 확인은 Chrome 기준이다. Safari는 설치돼 있으나 세션이 필요한 화면은 리드 확인이다(M2와 같음).
