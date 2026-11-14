# SPEC-CONSOLE-001 — 구현 계획 (plan.md)

Tier L(예상 1,000줄 이상, 20개 넘는 파일). 개발 방식: `quality.yaml` `development_mode: ddd` — 기존 콜백·sanitize·robots는 특성 테스트로 현재 동작을 먼저 고정하고, 새 모듈은 테스트를 먼저 쓴다.

마일스톤 순서는 바뀔 가능성이 큰 결정(데이터 모델, 권한 규칙, 로그인 흐름)을 앞에, 기계적인 작업(이식, 등록, 헤더)을 뒤에 둔다. 시간 예측은 적지 않는다.

## 1. 마일스톤

### M1 — 데이터 모델과 권한 규칙 (우선순위 높음)

결정이 가장 많이 바뀔 수 있는 부분. 오너 확인 D2·D3·D4의 답이 여기에 들어간다.

- `src/lib/console/types.ts` — 항목·분류·사람·비밀 레코드·감사 기록 타입(design.md §3)
- `src/lib/console/validate.ts` — 프로토타입 `validateDataset`의 서버판(URL 스킴, 길이, enum, 상한)
- `src/lib/console/permissions.ts` — `isAdmin`·`isOwner`·`canEdit`·`credAccess`·노출 필드 거르기(`toListItem`)
- `src/lib/console/config.ts` — 세 환경변수 점검(design.md §4.1)
- 테스트: 권한 행렬, 검증 경계값, 설정 무효 조건

### M2 — 로그인과 세션 (우선순위 높음)

- 특성 테스트 먼저: 기존 `sanitizeNextPath`, 콜백의 관리자·워크숍 경로가 지금처럼 동작함을 고정
- `src/lib/google-oauth.ts` — `/console` 계열 허용, `isConsoleNext`
- `src/lib/console/session.ts` — 토큰 서명·검증(Web Crypto), 쿠키 옵션
- `src/app/api/admin/auth/google/start/route.ts` — 콘솔 모드 오류 경로
- `src/app/api/admin/auth/google/callback/route.ts` — admin-users 조회 앞 콘솔 분기(`consoleEntry`)
- `src/middleware.ts` — 콘솔 블록
- `src/app/api/console/auth/logout/route.ts`
- 테스트: 도메인 판정 표(acceptance.md AC-CON-002), 토큰 교차 거부, 비밀값 무효 시 닫힘

### M3 — 자격증명 보관과 열람 (우선순위 높음)

- `src/lib/console/vault.ts` — AES-256-GCM, AAD, 키 점검
- `src/lib/console/audit.ts` — 콘솔 감사 기록 쓰기·읽기·최근 열람 수 세기, 5,000건 정리
- `src/lib/audit.ts` — `AuditModule`에 `'console'` 추가
- `src/lib/db.ts` — `FILE_KEY`에 `console-people`(email), `console-secrets`(itemId) 등록
- `src/app/api/console/items/[id]/credential/route.ts`
- 테스트: 왕복 암복호화, 변조·항목 바꿔치기·키 불일치 실패, 열람 상한, 기록 실패 시 값 미반환, 응답·기록에 평문 없음

### M4 — 항목 API와 관리자 기능 (우선순위 중간)

- `src/app/api/console/bootstrap/route.ts`
- `src/app/api/console/items/route.ts`(POST), `items/[id]/route.ts`(PATCH·DELETE), `items/[id]/restore/route.ts`
- `src/app/api/console/categories/route.ts`, `people/route.ts`, `settings/route.ts`
- `src/app/api/console/import/route.ts`, `export/route.ts`, `audit/route.ts`
- 공통 가드: 세션·Origin·Content-Type·no-store(`src/lib/console/http.ts`)
- 테스트: 권한별 성공·거부, 409 충돌, 소프트 삭제·되돌리기, 가져오기에서 자격증명 무시, 내보내기에 자격증명 없음

### M5 — 화면 이식 (우선순위 중간)

- `src/app/console/layout.tsx`, `page.tsx`, `login/page.tsx`
- `src/app/console/ConsoleApp.tsx`와 하위 컴포넌트(사이드바, 홈, 목록·거르기·정렬, 상세 패널, 편집 양식, 검색, 계정 메뉴, 관리자 대화상자)
- `src/app/console/console.module.css` — 라이트 팔레트, `:root` 미사용
- `src/lib/console/i18n.ts`, `src/lib/console/brand-marks.ts`
- `src/components/layout/ChromeGate.tsx` — `/console` 추가
- 테스트: i18n 키 집합 동일, `brandOf` 판별 표, 접속 표시 매핑

### M6 — 검색 노출·운영 등록 (우선순위 낮음, 기계적)

- `src/app/robots.ts` — 두 disallow 배열에 `/console`
- `vercel.json` — `/console`, `/console/:path*`, `/api/console/:path*`에 `X-Robots-Tag`
- `src/lib/env-check.ts` — 세 변수 등록
- `src/lib/backup.ts` — 콘솔 문서 추가
- 테스트: robots 출력, sitemap에 콘솔 없음

### M7 — 검증 (우선순위 낮음)

- `npm run typecheck`, 바뀐 부분 관련 테스트(`vitest run <경로>`) — 전체 스위트는 CI에 맡김(맥 부하 규칙)
- 로컬 `next dev`에서 콘솔 화면 스크린샷(라이트 팔레트, 입력칸·label 대비) — `.env.local`에 개발용 값을 직접 넣어 확인. 운영 값은 쓰지 않음
- `git grep`으로 비밀값 리터럴·시드 id 잔존 확인(acceptance.md AC-CON-025)

## 2. 파일 변경 목록

| 구분 | 경로 | 마일스톤 |
|---|---|---|
| 신규 | `src/lib/console/types.ts` | M1 |
| 신규 | `src/lib/console/validate.ts` | M1 |
| 신규 | `src/lib/console/permissions.ts` | M1 |
| 신규 | `src/lib/console/config.ts` | M1 |
| 신규 | `src/lib/console/session.ts` | M2 |
| 수정 | `src/lib/google-oauth.ts` | M2 |
| 수정 | `src/app/api/admin/auth/google/start/route.ts` | M2 |
| 수정 | `src/app/api/admin/auth/google/callback/route.ts` | M2 |
| 수정 | `src/middleware.ts` | M2 |
| 신규 | `src/app/api/console/auth/logout/route.ts` | M2 |
| 신규 | `src/lib/console/vault.ts` | M3 |
| 신규 | `src/lib/console/audit.ts` | M3 |
| 수정 | `src/lib/audit.ts` | M3 |
| 수정 | `src/lib/db.ts` (`FILE_KEY` 2줄) | M3 |
| 신규 | `src/app/api/console/items/[id]/credential/route.ts` | M3 |
| 신규 | `src/lib/console/http.ts` | M4 |
| 신규 | `src/app/api/console/bootstrap/route.ts` | M4 |
| 신규 | `src/app/api/console/items/route.ts` | M4 |
| 신규 | `src/app/api/console/items/[id]/route.ts` | M4 |
| 신규 | `src/app/api/console/items/[id]/restore/route.ts` | M4 |
| 신규 | `src/app/api/console/categories/route.ts` | M4 |
| 신규 | `src/app/api/console/people/route.ts` | M4 |
| 신규 | `src/app/api/console/settings/route.ts` | M4 |
| 신규 | `src/app/api/console/import/route.ts` | M4 |
| 신규 | `src/app/api/console/export/route.ts` | M4 |
| 신규 | `src/app/api/console/audit/route.ts` | M4 |
| 신규 | `src/app/console/layout.tsx`, `page.tsx`, `login/page.tsx` | M5 |
| 신규 | `src/app/console/ConsoleApp.tsx` + 하위 컴포넌트(여러 파일) | M5 |
| 신규 | `src/app/console/console.module.css` | M5 |
| 신규 | `src/lib/console/i18n.ts`, `brand-marks.ts` | M5 |
| 수정 | `src/components/layout/ChromeGate.tsx` | M5 |
| 수정 | `src/app/robots.ts` | M6 |
| 수정 | `vercel.json` | M6 |
| 수정 | `src/lib/env-check.ts` | M6 |
| 수정 | `src/lib/backup.ts` | M6 |
| 신규 | 각 모듈 옆 `__tests__/*.test.ts` | M1~M6 |

커밋하지 않는 것: 시드 JSON(프로토타입 내보내기 파일), `.env.local`, `data/db/console-*.json`.

## 3. 기술 접근 요지

- 로그인은 기존 OAuth 클라이언트·리디렉트 URI·콜백을 그대로 쓰고 `next` 값으로 모드를 가른다. 관리자 세션과 콘솔 세션은 비밀값·쿠키 이름·토큰 표식이 모두 다르다.
- 도메인 판정은 이미 검증된 `isWorkshopOpenAccount`를 재사용하고, 도메인 목록만 콘솔 상수로 고정한다.
- 자격증명은 항목 문서와 다른 문서에 암호문으로만 둔다. 화면은 값이 필요할 때마다 서버에 묻고, 서버는 기록을 먼저 남긴 뒤 값을 준다.
- 삭제는 소프트 삭제라 `writeDataMerged`의 tombstone을 쓰지 않고, 되돌리기가 자격증명까지 그대로 살린다.
- 화면은 프로토타입 동작을 React로 옮기되, 데이터 출처만 API로 바꾼다. 스타일은 CSS 모듈과 고정 hex.

## 4. 위험과 대응

| 위험 | 영향 | 대응 |
|---|---|---|
| 콜백 수정으로 관리자 로그인 회귀 | 관리자 화면 접근 불가 | M2 첫 단계에서 특성 테스트로 기존 동작 고정, 콘솔 분기는 `isConsoleNext`가 참일 때만 |
| `dark-theme.css`가 콘솔 글자색을 덮음 | 글자 실종(2026-07-07 사고와 같은 유형) | `data-admin-root="console"` 제외 규칙 + 로컬 스크린샷 확인(AC-CON-022) |
| `CONSOLE_SECRETS_KEY` 분실 | 저장된 공유 비밀번호 전부 복구 불가 | 오너가 오프라인 보관, 키 버전 칸 유지 |
| 열람 기록이 Blob 쓰기 경합 | 기록 누락 | 기록 실패 시 값을 내주지 않음(닫힘 쪽으로 실패) |
| 사람 목록에 email 미입력 | 담당자가 자기 항목을 못 고침 | 관리자는 항상 편집 가능, 가져오기 때 email 없는 담당자 목록을 결과로 보여 줌 |
| 프로토타입 2,600줄 이식 분량 | 화면 마일스톤이 길어짐 | M1~M4가 API를 먼저 굳혀 두므로 M5는 화면만 다룸. 필요하면 M5를 하위 SPEC으로 분리 |
| 시드 id가 실수로 커밋됨 | 공개 저장소 노출 | AC-CON-025 grep 검사, 시드 파일은 저장소 밖 경로에서만 다룸 |

## 5. 품질 게이트

- 실행 단계: 타입 오류 0, 바뀐 모듈 테스트 통과, 새 모듈 커버리지 85% 이상(권한·세션·보관·검증 모듈 기준)
- 동기화 단계: acceptance.md의 Definition of Done 충족

## 6. 오너 확인 필요 (실행 전에 답이 필요한 것)

| # | 내용 | 제안(기본값) |
|---|---|---|
| D1 | 시드 데이터를 공개 저장소에 넣지 않고, 배포 뒤 관리자가 콘솔에서 JSON 가져오기로 넣는다 | 이렇게 한다. 프로토타입 "JSON 내보내기"(비밀번호 제외) 파일에 사람 목록을 붙여 가져온다 |
| D2 | 공개 범위(전체·팀·본인)는 **자격증명 열람**에만 적용하고, 항목 자체(제목·주소·담당자)는 로그인한 직원 모두에게 보인다 | 이렇게 한다(프로토타입 동작과 같음). 항목까지 숨기려면 M1에서 바꾼다 |
| D3 | 사용자의 팀은 관리자가 관리하는 사람 목록에서 정한다. 목록에 없는 사람은 `공통`으로 보고, 한국팀·방글라데시팀의 '팀' 범위 자격증명은 볼 수 없다 | 이렇게 한다 |
| D4 | 담당자 판정은 이름이 아니라 email로 한다. 시드 담당자 9명 중 email을 아는 사람은 2명뿐이라 나머지 email이 필요하다. 채워지기 전까지 그 항목은 관리자만 고친다 | 오너가 사람 목록에 email·팀을 채운다 |
| D5 | 콘솔 감사 기록은 별도 문서(`console-audit-log`, 5,000건)에 두고, 로그인 1줄만 기존 감사 기록에도 남긴다 | 이렇게 한다 |
| D6 | 콘솔 세션 수명 | 12시간(관리자 세션 7일보다 짧게) |
| D7 | 프로토타입의 테마 메뉴(시스템·라이트·다크)를 이번 배포판에서 뺀다 | 라이트만. 다크는 후속 |
| D8 | 고정(핀)은 브라우저별로 저장되어 기기 간에 따라가지 않는다 | 이번에는 이렇게 둔다 |
| D9 | PLAN.md 본문 8절(별도 비공개 저장소·Neon·핸드오프) 대신 zoellife.com 저장소의 `/console`로 간다. 콘솔 코드 자체는 공개 저장소에 보인다(데이터·비밀값은 아님) | 오너 지정 방향대로 진행 |
| D10 | 콘솔 관리자는 `CONSOLE_ADMIN_EMAILS`로만 정한다(zoellife.com 관리자 역할과 무관) | 처음 값은 오너 계정 1개 |
| D11 | 같은 사용자의 자격증명 열람 상한 | 10분에 30회 |
| D12 | 콘솔에도 사이트 공통 GA·GTM이 실린다(`/admin`과 같음). 항목 내용은 URL에 넣지 않는다 | 그대로 둔다. 빼려면 레이아웃 변경 별도 작업 |

## 7. 저장소 밖 수동 작업 (오너)

1. Vercel(Production)에 환경변수 추가 후 재배포 — 목록은 §8
2. `CONSOLE_SECRETS_KEY` 값을 비밀번호 관리자 등 저장소·Slack 밖의 안전한 곳에 따로 보관(분실하면 저장된 공유 비밀번호를 되살릴 수 없음)
3. 구글 OAuth 클라이언트: 새 리디렉트 URI 등록은 필요 없다. 기존 `https://zoellife.com/api/admin/auth/google/callback`이 등록돼 있는지만 확인(관리자 SSO가 지금 동작하므로 등록돼 있을 것으로 봄 — 추정)
4. 배포 뒤 관리자 계정으로 콘솔에 들어가 시드 JSON 가져오기(D1). 시드 파일은 저장소 밖에 둔다
5. 사람 목록에 담당자 email·팀 입력(D4)
6. **공유 비밀번호를 넣기 전에** Slack #04_admin(2026-09-22)에 평문으로 남은 인스타그램·유튜브 로그인 정보의 비밀번호를 바꾸고 그 메시지를 삭제(PLAN "즉시 처리", 외부 효력 행위라 오너가 직접)
7. 공유 계정 담당자가 콘솔에서 아이디·비밀번호를 직접 입력
8. 배포 확인: `https://zoellife.com/robots.txt`에 `/console`, try-n.com이 아닌 구글 계정으로 로그인 거절, 콘솔 응답의 `X-Robots-Tag`
9. (콘솔과 별개, PLAN 7·9절) 드라이브·시트 공유 설정 점검, AI 도구 공유 로그인 약관 확인

## 8. 환경변수 (Vercel에 오너가 추가)

| 변수 | 필수 | 값 | 비고 |
|---|---|---|---|
| `CONSOLE_SESSION_SECRET` | 필수 | 무작위 32자 이상(예: `openssl rand -base64 48`) | `ADMIN_SESSION_SECRET`·`WORKSHOP_SSO_SECRET`·`CONSOLE_SECRETS_KEY`와 달라야 함. 없으면 콘솔 전체 닫힘 |
| `CONSOLE_SECRETS_KEY` | 필수 | 64자리 hex(예: `openssl rand -hex 32`) | AES-256-GCM 키. 다른 세 값과 달라야 함. 없으면 자격증명 기능만 닫힘. 오프라인 보관 |
| `CONSOLE_ADMIN_EMAILS` | 필수 | 쉼표 구분 `@try-n.com` 주소(처음엔 오너 계정) | 없으면 관리자 0명 |
| `CONSOLE_SESSION_MAX_AGE_HOURS` | 선택 | 1~168 정수 | 없으면 12 |

이미 있는 값을 그대로 쓴다(바꾸지 않음): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`(설정돼 있다면), `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`, `BLOB_DATA_PREFIX`, `ADMIN_SESSION_SECRET`, `WORKSHOP_SSO_SECRET`.

Preview 환경에는 콘솔 변수를 넣지 않는 것을 권한다(넣지 않으면 Preview에서 콘솔은 닫힌 채로 동작). 로컬 개발은 각자 `.env.local`에 개발용 값을 넣는다.
