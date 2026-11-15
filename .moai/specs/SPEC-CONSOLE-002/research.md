# SPEC-CONSOLE-002 — 조사 (research.md)

조사 기준: 워크트리 `zoel-console`(브랜치 `zoel-console`, HEAD `5100e84a`, 코드는 origin/main `7dc9bd4e`와 같음), 2026-11-15. 아래 줄 번호는 이 트리에서 파일을 열거나 `grep -n`으로 확인한 값이다. 설계 판단은 design.md에 있고, 이 문서는 그 판단의 근거가 된 사실만 적는다.

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
- 양식 입력 칸은 대부분 `autoComplete="off"`이지만 비밀번호 칸 `f-pw`는 `autoComplete="new-password"`다(`ItemForm.tsx` L412). `data-1p-ignore`·`data-lpignore`는 아직 없다. REQ-CS2-020이 이를 바꾼다(design.md §2.7).

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
- 운영 데이터의 공유 계정 항목 수와 계정 정보 저장 비율 — 운영 Blob을 읽지 않는 작업이라 조사하지 않았다.
