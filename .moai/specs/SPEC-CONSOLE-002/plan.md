# SPEC-CONSOLE-002 — 구현 계획 (plan.md)

Tier L이다(2026-11-15 리드 결정, plan-audit CS2-PA-D6 (a)). 바뀌는 소스 파일은 §3 기준 22개(M1 10개, M2 12개)이고 요구사항 21개·인수 기준 22개라 Tier M 상한(파일 5~15, 요구사항·인수 기준 각 16)을 넘는다. 오너가 자동 입력 끄기 안내(S6)를 이번 작업에 넣기를 바라므로 범위를 나누지 않고 Tier를 올렸다. 그래서 산출물은 spec·plan·acceptance·design·research 5개이고, plan-audit PASS 기준은 0.85, 진행 경로는 Route B(PR 경로)다. PR 생성·머지·배포는 사람 승인 후에만 한다. 결정과 설계는 design.md, 코드 조사 근거는 research.md에 있다. 기존 모듈 위에 얹는 변경이다. 개발 방식: `quality.yaml` `development_mode` 설정을 따른다. 기존 자격증명 라우트·양식은 SPEC-CONSOLE-001 테스트가 이미 고정하고 있으므로, 바뀌는 동작마다 실패하는 테스트를 먼저 쓴다. 시간 예측은 적지 않는다.

순서는 바뀔 가능성이 큰 결정(데이터 모델, API 계약, 양식 흐름)을 앞에 두고 스타일·문구 같은 기계적 작업을 뒤에 둔다.

## 1~2. 결정과 설계 — design.md로 옮김

0.3.0부터 결정 표(CS2-D1~D12)와 설계(데이터 모델, API 계약, 양식 배치, 상세 카드, 스크롤바 범위, 자동 입력 끄기 안내, 입력 칸 속성)는 [design.md](design.md) §1~§2에 있다. 번호는 그대로이므로 아래에서 "CS2-Dn"은 design.md §1, "design.md §2.n"은 해당 설계 절을 뜻한다. 코드 조사 근거는 [research.md](research.md)에 있다.

## 3. 마일스톤

### M1 — 서버와 데이터 (우선순위 높음) — 범위 S4 + S6의 저장 부분

되돌리기 가장 어려운 결정(저장 칸, API 계약)을 먼저 굳힌다.

- `src/lib/console/types.ts` — `hide_password`, `ConsoleUserPrefs`, `CONSOLE_DOCS.userPrefs`, `AUTOFILL_GUIDE_VERSION`
- `src/lib/console/validate.ts` — `hide_password` boolean 검사, 접속 방식에 따른 `false` 정규화
- `src/lib/console/permissions.ts` — `toListItem`에 `hide_password`
- `src/lib/console/import-map.ts`, `src/app/api/console/export/route.ts` — 가져오기 허용 목록·내보내기 표식
- `src/lib/db.ts` — `FILE_KEY`에 `console-user-prefs`
- `src/app/api/console/items/[id]/credential/route.ts` — design.md §2.2 7단계 숨김 판정
- `src/app/api/console/items/[id]/activity/route.ts` — 신규
- `src/app/api/console/me/autofill-guide/route.ts` — 신규
- `src/app/api/console/bootstrap/route.ts` — 최상위 `prefs.autofillGuideAck`(CS2-D10, `me`는 그대로)
- 테스트(실패를 먼저 보고 구현): AC-CS2-001 ~ 006. 기존 SPEC-CONSOLE-001 자격증명·가져오기·내보내기·bootstrap 테스트가 수정 없이 통과해야 한다. `bootstrap.test.ts:L33`의 `me` 엄격 비교가 깨지지 않도록 새 값은 `me` 밖에 둔다.

### M2 — 화면 (우선순위 높음) — 범위 S1, S2, S3, S5, S6 + S4의 화면 표시

- `src/app/console/ItemForm.tsx` — 종류 선택, 공유 계정 칸, 공유 대상, 숨기기 체크, 생성 버튼, 새 분류 선택지(design.md §2.3), 자격증명 입력 칸 속성(design.md §2.7)
- `src/lib/console/password-gen.ts` — 신규 `generatePassword`
- `src/app/console/DetailPanel.tsx` — 자격증명 카드, 로그인 열기, 빈 상태, 사용 기록(design.md §2.4)
- `src/app/console/api.ts` — `fetchActivity`, `ackAutofillGuide`
- `src/app/console/Sidebar.tsx` — 분류 제목 옆 "+"(관리자)
- `src/app/console/ListView.tsx` — 공유 계정 보기의 "계정 정보 있음/없음" 표시
- `src/app/console/AutofillGuideDialog.tsx`, `src/lib/console/browser-guide.ts` — 신규 팝업·판별·단계표(design.md §2.6)
- `src/app/console/AccountMenu.tsx`, `src/app/console/ConsoleApp.tsx` — 메뉴 항목, 첫 자동 표시, 대화상자 연결
- `src/lib/console/i18n.ts` — 새 문구 한·영
- `src/app/console/console.module.css` — 스크롤바 범위 규칙(design.md §2.5), 새 컨트롤 스타일(고정 hex)
- 테스트: AC-CS2-007 ~ 022. 정적 렌더(`renderToStaticMarkup`) 테스트와 순수 함수 테스트를 먼저, 브라우저 확인은 로컬 개발 서버(`localhost`)에서만 한다. zoellife.com에는 요청하지 않는다.

## 4. 위험

| 위험 | 영향 | 대응 |
|---|---|---|
| 브라우저가 입력 칸 속성을 무시하고 저장을 제안 | 멤버 브라우저에 공유 비밀번호가 저장됨 | 속성은 넣되(REQ-CS2-020) 안내 팝업이 본 대책. 남는 위험은 spec.md §1.1에 적음 |
| 새 탭을 연 뒤 클립보드 쓰기 거절, 또는 비동기 요청 뒤 팝업 차단 | 로그인 열기가 반쪽만 동작 | 복사 먼저, 막히면 링크(CS2-D8). AC-CS2-014에서 Chrome·Safari로 확인 |
| 설정 주소가 브라우저 버전마다 다름 | 붙여 넣어도 다른 화면이 열림 | 후보값을 실행 단계에서 확인하고 진행 기록에 남김. 미설치 브라우저는 미확인 항목으로 표시 |
| 공유 계정 항목을 실수로 링크로 바꿔 저장 | 저장된 공유 아이디·비밀번호가 되돌릴 수 없이 삭제됨 | 저장 전 삭제 확인(CS2-D11, REQ-CS2-009, AC-CS2-009). 확인을 누르면 지워지는 것은 기존 동작 그대로다 |
| 스크롤바 선택자가 CSS 모듈 순수성 검사에 걸림 | `next build`·`next dev` 실패 | 지역 클래스를 품은 `:global(html):has(.root)` 형태(design.md §2.5). 순수성 검사 테스트로 고정(AC-CS2-007) |
| `:has()` 미지원 구형 브라우저 | 콘솔에서도 사이트 공용 스크롤바가 보임 | 기능 손상은 없음(색만 다름). 지원 버전은 design.md §2.5 |
| `console-user-prefs` 쓰기 동시성 | 두 사람이 동시에 확인하면 한쪽 기록이 사라질 수 있음 | email 키 병합 쓰기(`writeDataMerged`)로 다른 사람 레코드를 보존. 최악이어도 팝업이 한 번 더 뜰 뿐 |
| 숨김 거절 반복으로 감사 기록이 늘어남 | 기록 5,000건 창이 빨리 밀림 | 화면이 숨김 대상에게 보기 버튼을 아예 보여 주지 않으므로 정상 사용에선 생기지 않음 |

## 5. 실행 전 확인할 가정

오너가 범위를 리드에게 맡겼으므로 아래는 리드 판단으로 진행하고, Implementation Kickoff에서 한 번에 보여 준다.

1. "메모"는 공유 대상 모두가 보는 `description`이다(CS2-D1). 담당자만 보는 메모가 필요하면 "더 보기"의 확인할 일을 쓴다.
2. 숨기기 예외는 관리자와 담당자다(CS2-D2). 팀장 같은 별도 역할은 없다.
3. "나중에"를 누르면 다음 방문(새 브라우저 세션)에 다시 뜬다(CS2-D6).
4. 안내 확인 기록은 서버에 사람별로 남는다(CS2-D5).

## 6. 완료 조건

- acceptance.md의 22개 기준이 모두 통과하고 근거가 progress.md §E.2에 남는다.
- `npx tsc --noEmit`, 바뀐 경로의 `npx eslint`, 콘솔 관련 테스트(`src/lib/console`, `src/app/api/console`, `src/app/console`, 콜백 테스트)가 통과한다. 전체 스위트는 CI에 맡긴다(부하가 36 미만일 때만 로컬 전체 실행).
- 공개 저장소 점검: 새 파일에 비밀값 리터럴, 직원 이름, 실제 email, 내부 id가 없다.
