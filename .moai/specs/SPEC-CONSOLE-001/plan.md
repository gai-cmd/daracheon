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
- `src/lib/console/categories.ts` — 분류 `kind`(`resource`·`knowledge`) 기본값, 내장 지식 분류 `wiki`, 메뉴 묶음 `groupNavCategories`(design.md §3.5, REQ-CON-025)
- 테스트: 권한 행렬, 검증 경계값, 설정 무효 조건, `kind` 기본값·모르는 값 거절·`wiki` 예약

### M2 — 로그인과 세션 (우선순위 높음)

- 특성 테스트 먼저: 기존 `sanitizeNextPath`, 콜백의 관리자·워크숍 경로, 관리자 모드의 오류 출구 8종(`sso_not_configured`·`oauth_state`·`oauth_token`·`oauth_userinfo`·`oauth_email`·`not_authorized`·`account_locked`·`oauth_failed` → `/admin/login`)이 지금처럼 동작함을 고정
- `src/lib/google-oauth.ts` — `/console` 계열 허용, `isConsoleNext`(점 세그먼트 거부 포함, design.md §2.1 표)
- `src/lib/console/session.ts` — 토큰 서명·검증(Web Crypto), 쿠키 옵션
- `src/app/api/admin/auth/google/start/route.ts` — 콘솔 모드 오류 경로
- `src/app/api/admin/auth/google/callback/route.ts` — next 해석을 맨 앞으로 옮기고 오류 출구를 `fail(code)` 하나로 모은 뒤, userinfo 직후(L172 거절 앞) 콘솔 분기(`consoleEntry`) — design.md §2.3
- `src/middleware.ts` — 콘솔 블록
- `src/app/api/console/auth/logout/route.ts`
- 테스트: 도메인 판정 표와 콘솔 모드 오류 출구 표(acceptance.md AC-CON-002), 열린 리디렉트 사례(AC-CON-003), 토큰 교차 거부, 비밀값 무효 시 닫힘

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
- `src/lib/console/import-map.ts` — 가져오기 형식 대응 순수 함수 `mapImportFile`(design.md §5.3)
- 교체 계열 쓰기는 `removedIds = 기존 키 − 새 키`(design.md §5.4)
- 테스트: 권한별 성공·거부, 409 충돌, 소프트 삭제·되돌리기, `mapImportFile` 대응표(이름 나누기·email 찾기·미일치·`admin` 무시·팀 고정·`people`/`categories` 키 없으면 유지·분류 `kind`·`wiki` 무시), 가져오기에서 자격증명 무시, 파일에 없는 기존 항목·사람 제거, 내보내기에 자격증명 없음

### M5 — 화면 이식 (우선순위 중간)

- `src/app/console/layout.tsx`, `page.tsx`, `login/page.tsx`
- `src/app/console/ConsoleApp.tsx`와 하위 컴포넌트(사이드바, 홈, 목록·거르기·정렬, 상세 패널, 편집 양식, 검색, 계정 메뉴, 관리자 대화상자)
- `src/app/console/console.module.css` — 라이트 팔레트, `:root` 미사용
- `src/lib/console/i18n.ts`, `src/lib/console/brand-marks.ts`
- `src/components/layout/ChromeGate.tsx` — `/console` 추가
- 왼쪽 메뉴 최상단 위키 구역(제목·구분선·빈 상태), `book` 아이콘 마크, i18n 키 `nav.wiki`·`wiki.empty`(design.md §3.5, §6.1)
- 테스트: i18n 키 집합 동일, `brandOf` 판별 표, 접속 표시 매핑, 메뉴 순서와 위키 빈 상태(AC-CON-026)

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
| 신규 | `src/lib/console/categories.ts` | M1 |
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
| 신규 | `src/lib/console/import-map.ts` | M4 |
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
- 반대로 교체 계열 쓰기(가져오기, 사람 목록 교체, 감사 기록 정리)는 `writeDataMerged`가 "새 배열에 없는 레코드"를 되살리므로 지운 키를 반드시 `removedIds`로 넘긴다.
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
| 공개 Blob + 비밀 prefix 의존 | prefix가 새면 `console-items`(드라이브·시트·Slack id)와 `console-people`·`console-audit-log`(직원 email)를 인증 없이 읽을 수 있음. prefix는 2026-07에 실제로 공개 저장소에 노출된 적이 있음 | 자격증명은 암호문만 저장(prefix가 새도 평문 없음). 나머지 문서는 기존 고객 PII 문서와 같은 수준의 보호. 받아들일지는 오너 결정 D13 |
| 개별 세션을 서버에서 끊을 수단 없음 | 퇴사·계정 정지 직원도 남은 세션 수명(기본 12시간, 최대 168시간) 동안 콘솔과 자격증명 열람을 쓸 수 있음 | 수명 기본 12시간 유지, 비상시 `CONSOLE_SESSION_SECRET` 교체 후 재배포로 전체 세션 무효화(§7). 개별 폐기는 범위 제외 |
| 익명 콜백 요청으로 감사 기록 밀어내기 | 5,000건 상한이 차서 열람 기록이 지워짐 | 신원이 생기기 전 실패는 기록하지 않음(design.md §2.3, AC-CON-016). 신원 있는 실패는 구글 왕복이 필요해 대량 생성이 어려움 |
| 위키 구역을 지식 기반으로 넓힐 때 데이터 모델 재작업 | 나중에 LLM 지식 기반으로 쓰려면 id·필드를 바꿔야 할 수 있음 | 이번 판부터 안정 id·한·영 짝 필드·담당자·`updatedAt`·자격증명 없는 내보내기를 유지(spec.md §4). 작성 기능과 지식 기반은 범위 제외 |
| D2 기본값(A) 선택 시 항목 주소 노출 | '팀'·'본인' 항목의 주소·연동 주소(내부 드라이브 폴더 등)가 try-n.com 직원 전원에게 보임. 시드 기준 '팀' 11개·'본인' 5개 | 오너가 D2에서 알고 고르게 함 |

## 5. 품질 게이트

- 실행 단계: 타입 오류 0, 바뀐 모듈 테스트 통과, 새 모듈 커버리지 85% 이상(권한·세션·보관·검증 모듈 기준)
- 동기화 단계: acceptance.md의 Definition of Done 충족

## 6. 오너 확인 필요 (실행 전에 답이 필요한 것)

아래 D1~D13은 확인 필요 표식 없이 표로 적은 열린 결정이라 기계 검사(MP-7)로는 잡히지 않는다. 오케스트레이터는 Implementation Kickoff Approval에서 각 항목의 답을 받아 progress.md §E.1 "owner_decisions"에 그대로 기록한 뒤 실행 단계로 넘긴다. D2·D13에서 (B)를 고르면 SPEC 개정과 재감사가 먼저다.

| # | 내용 | 제안(기본값) |
|---|---|---|
| D1 | 시드 데이터를 공개 저장소에 넣지 않고, 배포 뒤 관리자가 콘솔에서 JSON 가져오기로 넣는다 | 이렇게 한다. 프로토타입 "JSON 내보내기"(비밀번호 제외) 파일에 사람 목록을 붙여 가져온다 |
| D2 | 공개 범위(전체·팀·본인)가 무엇을 가리는가. **PLAN.md 3절 표와 충돌한다**: 그 표는 "열람: 공개 범위 '전체'인 카드 열람·검색", "팀 범위: 공개 범위 '팀' 카드 열람"으로 항목 자체를 가리는 규칙이고, "최종 결정" 절은 "항목별 공개 범위"라고만 써서 이 표를 뒤집지 않는다. 반면 프로토타입 `credAccess`(index.html L1425-1431)는 자격증명만 막는다. **(A)** 자격증명 열람에만 적용: 항목 제목·주소·연동 주소·담당자는 로그인한 try-n.com 직원 전원에게 보인다. 시드 기준 '팀' 11개·'본인' 5개 항목의 주소(내부 드라이브 폴더·시트 링크 포함)가 다른 팀과 무관한 직원에게도 보인다. 현재 REQ-CON-016·020, AC-CON-010·020이 이 안으로 쓰여 있다. **(B)** PLAN 3절대로 항목 자체를 가림: 권한 없는 사용자는 목록·검색·홈 요약·상세에서 그 항목을 보지 못한다. 고르면 실행 전에 REQ-CON-016·020과 AC-CON-010·020을 개정하고 M1 `toListItem`에서 거른다(범위는 콘솔 안, 화면·API 파일 수는 같음) | 제안: (A) — 프로토타입 동작과 같고 오너가 승인한 화면이 이 동작이다. 다만 PLAN 3절과 다르므로 오너가 명시적으로 골라야 한다 |
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
| D13 | 콘솔 문서는 기존 db 헬퍼대로 공개 접근 Blob에 비밀 prefix로만 보호된다(spec.md §4 저장 한계, §4 위험 행). **(A)** 받아들인다: 자격증명만 암호문, 항목·사람·기록은 기존 고객 PII 문서와 같은 수준. REQ-CON-009는 브라우저 전달 경로만 보장한다. **(B)** 항목·사람·기록 문서도 저장 시점에 암호화한다: 새 요구사항과 새 키(또는 `CONSOLE_SECRETS_KEY` 파생 키)가 필요하고, 백업·시드 동기화 스크립트가 그 문서를 해석할 수 없게 된다. 고르면 실행 전에 SPEC을 개정한다 | 제안: (A) — 같은 저장소의 고객 문의·파트너 계정 문서가 이미 같은 보호 수준이고, prefix는 2026-07에 교체됐다. 다만 prefix 유출 이력이 있으므로 오너가 명시적으로 골라야 한다 |

## 7. 저장소 밖 수동 작업 (오너)

1. Vercel(Production)에 환경변수 추가 후 재배포 — 목록은 §8
2. `CONSOLE_SECRETS_KEY` 값을 비밀번호 관리자 등 저장소·Slack 밖의 안전한 곳에 따로 보관(분실하면 저장된 공유 비밀번호를 되살릴 수 없음)
3. 구글 OAuth 클라이언트: 새 리디렉트 URI 등록은 필요 없다. 기존 `https://zoellife.com/api/admin/auth/google/callback`이 등록돼 있는지만 확인(관리자 SSO가 지금 동작하므로 등록돼 있을 것으로 봄 — 추정)
4. 배포 뒤 관리자 계정으로 콘솔에 들어가 시드 JSON 가져오기(D1). 프로토타입 "JSON 내보내기" 파일에 `people`(이름·영문 이름·팀·확인한 email)과, 팀 필수 목록을 옮기려면 `teamPins`(프로토타입 `TEAM_PINS` 7개 id)를 직접 덧붙인다(design.md §5.3). 시드 파일은 저장소 밖에 둔다. 위키 구역의 첫 항목으로 `cards`에 워크숍 위키 카드 하나를 덧붙인다: `category: "wiki"`, `title: "자료실 · 대라천 참 침향 위키"`, `title_en: "Library · Daracheon agarwood wiki"`, `url: "https://zoel-workshop.vercel.app/apps/wiki"`, `access_method: "sso"`, `team: "공통"`, `owner`: 오너가 정한 위키 담당자 이름(`people`에 있는 이름과 같게. 저장소에는 이름을 적지 않는다). 가져오기 결과의 `unmatchedOwners`·`peopleSkipped`를 보고 사람 목록을 보완한다
5. 사람 목록에 담당자 email·팀 입력(D4)
6. **공유 비밀번호를 넣기 전에** Slack #04_admin(2026-09-22)에 평문으로 남은 인스타그램·유튜브 로그인 정보의 비밀번호를 바꾸고 그 메시지를 삭제(PLAN "즉시 처리", 외부 효력 행위라 오너가 직접)
7. 공유 계정 담당자가 콘솔에서 아이디·비밀번호를 직접 입력
8. 배포 확인: `https://zoellife.com/robots.txt`에 `/console`, try-n.com이 아닌 구글 계정으로 로그인 거절, 콘솔 응답의 `X-Robots-Tag`
9. (콘솔과 별개, PLAN 7·9절) 드라이브·시트 공유 설정 점검, AI 도구 공유 로그인 약관 확인
10. 비상시(퇴사자 세션 차단 등): Vercel에서 `CONSOLE_SESSION_SECRET`을 새 값으로 바꾸고 재배포하면 모든 콘솔 세션이 끊긴다(직원은 다시 로그인). 저장된 공유 비밀번호는 `CONSOLE_SECRETS_KEY`로 암호화돼 있어 영향이 없다

## 8. 환경변수 (Vercel에 오너가 추가)

| 변수 | 필수 | 값 | 비고 |
|---|---|---|---|
| `CONSOLE_SESSION_SECRET` | 필수 | 무작위 32자 이상(예: `openssl rand -base64 48`) | `ADMIN_SESSION_SECRET`·`WORKSHOP_SSO_SECRET`·`PARTNER_SESSION_SECRET`·`SERIAL_SCAN_SECRET`·`QR_TRACK_SECRET`·`BACKUP_ENCRYPTION_KEY`·`CONSOLE_SECRETS_KEY` 중 설정된 값과 달라야 함. 없으면 콘솔 전체 닫힘 |
| `CONSOLE_SECRETS_KEY` | 필수 | 64자리 hex(예: `openssl rand -hex 32`) | AES-256-GCM 키. 위 비밀값들과 달라야 함. 없으면 자격증명 기능만 닫힘. 오프라인 보관 |
| `CONSOLE_ADMIN_EMAILS` | 필수 | 쉼표 구분 `@try-n.com` 주소(처음엔 오너 계정) | 없으면 관리자 0명 |
| `CONSOLE_SESSION_MAX_AGE_HOURS` | 선택 | 1~168 정수 | 없으면 12 |

이미 있는 값을 그대로 쓴다(바꾸지 않음): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`(설정돼 있다면), `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`, `BLOB_DATA_PREFIX`, `ADMIN_SESSION_SECRET`, `WORKSHOP_SSO_SECRET`.

Preview 환경에는 콘솔 변수를 넣지 않는 것을 권한다(넣지 않으면 Preview에서 콘솔은 닫힌 채로 동작). 로컬 개발은 각자 `.env.local`에 개발용 값을 넣는다.
