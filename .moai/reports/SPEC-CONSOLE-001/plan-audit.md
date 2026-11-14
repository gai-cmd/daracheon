# SPEC Review Report: SPEC-CONSOLE-001
Iteration: 3/3
Verdict: FAIL (STOP — 점수 하락, 반복 상한 도달)
Overall Score: 0.87

verdict: FAIL
signal: STOP
audited_sha: ce78c096
overall_score: 0.87
previous_score: 0.88
must_pass_failed: 0
blocking_count: 2
plan_artifact_hash: sha256:16fd6a55995e018dcfd4beb9ddfd2ed3a0e719fd3030ee9f4f864007976d0c1f

> 작성자 보고서에 담긴 추론은 M1(맥락 격리)에 따라 판정 근거로 쓰지 않았다. 판정 근거는 SPEC 산출물 5개(spec·design·acceptance·plan·research), progress.md, 워크트리 코드, 프로토타입 `~/personal/works/zoellife/zoel-console/index.html`을 직접 읽고 돌려 본 결과뿐이다.
> 3차 감사라서 2차 결함 9건의 해소 여부를 확인하고, 새로 들어온 위키 구역(REQ-CON-025, AC-CON-026)은 처음부터 감사했다.
> `plan_artifact_hash`는 감사자가 직접 계산했다(`cat acceptance.md design.md plan.md research.md spec.md | shasum -a 256`).
> 교차 모델 감사는 하지 않았다. `moai verify audit-plan` 출력이 `"cross_model_active": false`, `"cross_model_required": false`다.

2차에서 막았던 결함 3건(CON-D16·D17·D18)은 모두 풀렸다. 원래 범위만 보면 이제 막는 결함이 없다. 판정이 FAIL인 이유는 이번에 새로 넣은 위키 구역에서 막는 결함 2건이 나왔기 때문이다(CON-D24, CON-D25). 점수는 0.88에서 0.87로 내려가 STOP 신호를 낸다. 3차가 반복 상한이므로 오케스트레이터는 더 반복하지 말고 오너에게 선택지를 물어야 한다(맨 아래 권고).

## Must-Pass Results

- [PASS] MP-1 REQ 번호 일관성: `grep -c "^\*\*REQ-CON-" spec.md` 결과가 25다. 001~025에 빈 번호와 중복이 없다. 다만 문서 안 순서가 `…023, 025, 024`다(REQ-CON-025는 L120의 §3.8, REQ-CON-024는 L124의 §3.9). 번호 자체는 맞으므로 선택 결함 CON-D27로만 남긴다. AC는 26개이고 중복이 없다(`uniq -d` 결과 없음).
- [PASS] MP-2 GEARS 형식(요구사항 층에서 판정): REQ 25개 모두 GEARS 패턴이다. 새 REQ-CON-025(spec.md:L120)는 Ubiquitous("The console navigation shall show…", "Each category shall carry…")와 Event("When the Wiki section has no items, the console shall show…", "When an admin imports the seed file, … shall reach…")를 섞은 복합 요구사항이다. 주어가 데이터 항목인 문장이 있지만 GEARS가 일반화 주어를 허용하므로 감점하지 않았다(명료성 문제는 CON-D28). AC-CON-026은 Given-When-Then 형식이며, 검증 층에 맞는 형식이다.
- [PASS] MP-3 frontmatter: spec.md:L1-15에 12개 필드가 모두 있다. version은 따옴표가 붙은 `"0.3.0"`, status는 `draft`, priority는 `P1`, lifecycle은 `spec-anchored`, tags는 문자열(`wiki` 추가), tier는 `L`이다. 거부되는 별칭은 없다. `moai spec lint SPEC-CONSOLE-001` 결과는 `0 error(s), 0 warning(s)`이다(INFO 1건은 첫 커밋 c20202ee에 트레일러가 없다는 기존 알림).
- [N/A] MP-4 언어 중립성: TypeScript/Next.js 한 언어로 된 프로젝트의 SPEC이다.
- [PASS] MP-5 D7: `grep -Eoh 'SPEC-([A-Z][A-Z0-9]+-)+[0-9]+' *.md | sort -u` 결과는 `SPEC-CONSOLE-001` 하나다. BLOCKING 0건.
- [PASS] MP-6 D8: 산출물 6개 모두 `grep -c syscall` 결과가 0이다.
- [PASS] MP-7 확인 필요 표식: `grep -rn "NEEDS CLARIFICATION" .moai/specs/SPEC-CONSOLE-001/`의 종료 코드가 1이다(일치 0건).

## Category Scores

| Dimension | Score | Rubric Band | Evidence |
|---|---|---|---|
| Clarity | 0.78 | 0.75 | 2차의 모호점 두 곳(CON-D16, CON-D18)은 풀렸다(spec.md:L106, design.md:L87). 대신 위키 구역에서 새로 두 곳이 생겼다. 메뉴의 위키 구역이 항목 링크를 늘어놓는 것인지, 개수가 붙은 분류 한 줄인지가 REQ·design·AC 사이에서 갈린다(CON-D24). 가져오기 파일에 `wiki`가 아닌 `knowledge` 분류가 들어오면 어떻게 되는지 정해져 있지 않다(CON-D25). 둘 다 엔지니어마다 다르게 만들 수 있는 모호점이다. |
| Completeness | 0.90 | 0.75~1.0 | 절이 모두 있고, H3 범위 제외가 4개로 늘었다(spec.md:L139, L149, L156, L166). §4에 지식 친화 데이터 모델 제약(L133)과 내장 분류 근거(L134)가, plan 위험표에 위키 행이 들어갔다. email 공개 전환이 오너 결정 표에 없는 문제(CON-D20)는 그대로 남아 있다. |
| Testability | 0.85 | 0.75~1.0 | 2차에서 문제였던 두 곳이 풀렸다. AC-CON-003 L47-L51의 기대값은 감사자가 설계대로 구현해 확인했고, AC-CON-016 L170은 전제 쿠키가 바로잡혔다. AC-CON-026은 `kind` 기본값, 400 거절, 예약 id, i18n 키, `git grep` 0줄처럼 대부분 통과·실패로 판정된다. 그러나 L270-L271, L274("위키를 누르면", "메뉴의 위키 항목 수", "위키 구역의 첫 항목")은 CON-D24의 해석을 먼저 골라야 판정할 수 있다. |
| Traceability | 0.95 | 1.0 | REQ 25개가 모두 AC에 걸리고, AC-CON-026이 REQ-CON-025에 걸린다(spec.md:L203). 존재하지 않는 REQ를 가리키는 AC는 없다. AC-CON-005가 REQ-CON-001·013을 검증하는데 추적표 L182에는 없다는 점(CON-D23)은 그대로다. |

집계 점수 0.87은 네 항목의 조화평균이다(4 / (1/0.78 + 1/0.90 + 1/0.85 + 1/0.95) = 0.865).

## Regression Check (2차 결함 9건)

- CON-D16 가져오기의 사람·분류 제거 조건 — **RESOLVED**
  - REQ-CON-019(spec.md:L106)가 "when the file includes a people list or a categories list … while a file without that key leaves the stored list unchanged"로 조건을 걸었다.
  - design §5.3 L295의 `categories` 행("없으면 저장된 분류 유지")과 일치한다.
  - AC-CON-018 L192가 `people`·`categories` 키가 없는 두 경우를 검증한다(P0 유지).
- CON-D17 점 세그먼트 — **RESOLVED**
  - REQ-CON-002(spec.md:L62)에 "A return path any of whose segments is `.` or `..`, in literal or percent-encoded form, shall not count as a console path"가 들어갔다.
  - design §2.1 L30-L45가 판정 조건 4개와 기대값 표를 정했다.
  - 감사자 실측: design의 조건 4개를 그대로 옮긴 함수를 `node`로 돌렸다. 결과는 아래와 같고 design 표, AC-CON-003 L47-L51과 모두 일치한다.
    - `/console/../admin`, `/console/%2E%2E/admin`, `/console/./../admin`, `/console%2F..%2Fadmin`, `/console/.%2e/admin`은 `isConsoleNext`가 false, `sanitizeNextPath`가 `/admin`이다.
    - `/console/%252E%252E/x`는 true이고, `new URL` 정규화 뒤에도 경로가 `/console/%252E%252E/x`다.
  - 코드 대조: google-oauth.ts L40-45는 `/admin`으로 시작하지 않는 값을 `/admin`으로 돌려준다. design §2.1 L35의 서술과 같다.
- CON-D18 기존 audit-log 건수 — **RESOLVED**: AC-CON-016 L165(Given: 성공 1회 + 신원 있는 거절 1회)와 L169("합계 정확히 2줄"), design §2.3 L87이 같은 건수를 말한다. 같은 AC L170의 state 오류 50회는 design L88에 따라 기록을 쓰지 않으므로 2줄 단언과 충돌하지 않는다.
- CON-D8 비밀값 비교 대상 — **RESOLVED**: AC-CON-004 L58의 Given에 `SERIAL_SCAN_SECRET`·`QR_TRACK_SECRET`이 들어갔고, (i)·(j) 사례가 추가됐다.
- CON-D19 관리자 오류 출구 수 — **RESOLVED**: plan.md:L22가 8종을 나열한다. 코드 대조: callback route.ts에서 찾은 코드는 L110 `sso_not_configured`, L122 `oauth_state`, L155 `oauth_token`, L163 `oauth_userinfo`, L173 `oauth_email`, L196 `not_authorized`, L204 `account_locked`, L243 `oauth_failed`로 정확히 8개다.
- CON-D21 AC-016 전제 쿠키 — **RESOLVED**: AC-CON-016 L170이 "next 쿠키가 `/console`이고 state가 틀린 콜백 요청"이고, 기대값은 `/console/login?error=oauth_state` 302다.
- CON-D20 email 공개 전환이 오너 결정 표에 없음 — **UNRESOLVED (optional)**: plan §6에 D14 행이 없다. 선택 결함이고 이번 지시 범위 밖이었다.
- CON-D22 REQ-CON-009 비규범 문장 — **UNRESOLVED (optional)**: spec.md:L78 끝에 "This requirement governs delivery to the browser only; …"가 그대로 있다.
- CON-D23 AC-005 추적표 누락 — **UNRESOLVED (optional)**: spec.md:L182가 여전히 `REQ-CON-004, REQ-CON-006`만 적고 있다.

선택 결함 3건은 2차에 처음 나왔으므로 정체 판정(세 반복 연속 미변경) 대상이 아니다. M6에 따라 선택 결함은 판정을 FAIL로 만들지 않는다. 이번 FAIL은 아래의 새 막는 결함 2건 때문이다.

### 작성자의 지시 이탈 판단 (담당자 이름)

오너가 말한 위키 담당자 실명을 SPEC에 적지 않은 판단은 맞다. 근거는 세 가지다. REQ-CON-008(spec.md:L76)이 공개 저장소에 직원 이름을 금지한다. 헌법(`.claude/rules/daerachoen-constitution.md` L64)이 이 저장소를 PUBLIC으로 명시한다. `grep -rn` 결과 SPEC 폴더에 그 이름이 0건이다(종료 코드 1). plan.md:L176은 이름을 시드 파일에만 적도록 했다. 결함으로 보지 않는다.

## 위키 구역 감사 (REQ-CON-025, AC-CON-026)

잘 된 점:
- 범위 제외가 구체적이다(spec.md:L149-L154). 작성 기능, LLM 지식 기반, 지식 분류 여러 개, 동기화가 각각 따로 적혀 있다.
- 시드 금지와 맞물린다. 실제 위키 항목은 시드 파일로만 들어오고(design.md:L206, plan.md:L176), AC-CON-026 L276의 `git grep -n "zoel-workshop.vercel.app/apps/wiki" -- src data scripts`는 지금 종료 코드 1이다(0줄). 같은 호스트가 `src`의 SSO 핸드오프 테스트에 나오지만(handoff.test.ts L20 등) `/apps/wiki` 경로는 없어 이 검사가 오탐을 내지 않는다.
- 내장 분류 `wiki`를 코드에 두는 판단이 REQ-CON-008과 충돌하지 않는다는 근거가 있다(spec.md:L134, design.md:L201).
- 기존 프로토타입 분류 id 8개(`sites`, `blog-content`, `sns-video`, `assets-drive`, `marketing-search`, `sales-commerce`, `ai-tools`, `guides-team`, index.html L781-L798)가 새 id 규칙 `^[a-z0-9-]{1,40}$`(design.md:L192)을 모두 통과하므로 기존 내보내기 파일이 가져오기에서 깨지지 않는다.
- 내보내기가 내장 `wiki`를 빼고(design.md:L256), 가져오기는 `wiki`를 무시하므로(L295) 왕복이 안정적이다.

문제점은 아래 결함 목록의 CON-D24~D28이다.

## Defects Found (structured defect-list)

D1. CON-D24 — spec.md:L120 vs design.md:L203 vs acceptance.md:L270-L274
- 문제: 메뉴의 위키 구역이 무엇을 보여 주는지 세 문서가 다르게 읽힌다.
  - REQ-CON-025는 "a top-level 위키 / Wiki section … listing the items of the knowledge category"라고 쓴다. 메뉴 안에 위키 항목 링크를 하나씩 늘어놓는다는 뜻으로 읽힌다.
  - 프로토타입 메뉴(index.html L1648-L1663 `renderSide`)는 분류마다 링크 한 줄과 개수(`n`)를 붙이고, 누르면 본문에 그 분류의 목록을 띄운다. AC-CON-026 L271의 "위키를 누르면 목록 대신 빈 상태 안내가 보이고 … 메뉴의 위키 항목 수는 0"은 이 방식(제목 "위키" 아래에 개수가 붙은 "위키" 링크 한 줄)으로 읽힌다.
  - design L203의 "위키 구역(제목 "위키" + 위키 항목)"은 두 해석 모두에 맞는다.
- 영향: 이 기능의 핵심인 메뉴 모양을 엔지니어마다 다르게 만들 수 있다. 첫째 해석이라면 메뉴의 항목 링크를 눌렀을 때 상세 패널이 열리는지 외부 주소로 가는지도 정해져 있지 않다. 둘째 해석이라면 제목과 링크가 둘 다 "위키"가 된다. AC-CON-026 L270-L271, L274는 해석을 고르기 전에는 통과·실패를 판정할 수 없다.
- Severity: major — Class: blocking
- Required fix: 하나를 골라 세 문서에 같은 말로 적는다.
  - (a) 권장: 프로토타입 방식. 제목 "위키" 아래에 `cat:wiki` 링크 한 줄(아이콘, 이름, 개수)을 두고, 누르면 본문에 위키 목록이나 `wiki.empty`를 띄운다. REQ-CON-025의 "listing the items of the knowledge category"를 "with an entry that opens the list of the knowledge category's items and shows their count"처럼 고친다.
  - (b) 메뉴가 항목 링크를 직접 늘어놓는 방식. 이 경우 링크를 눌렀을 때의 동작과 항목이 많을 때의 상한을 정한다.
  - 어느 쪽이든 AC-CON-026 L270-L271, L274의 "위키를 누르면", "메뉴의 위키 항목 수", "위키 구역의 첫 항목"을 고른 모양의 요소로 바꿔 적는다.

D2. CON-D25 — design.md:L295 vs design.md:L202-L203, spec.md:L153
- 문제: 가져오기 파일의 `categories`에 `wiki`가 아닌 id로 `kind: "knowledge"`인 분류(예: `{id: "kb", kind: "knowledge"}`)가 들어오는 경우가 정해져 있지 않다.
  - design §5.3 L295는 "모르는 값이면 오류", "`id: 'wiki'` 항목은 무시"만 정한다. `knowledge`는 아는 값이므로 문자 그대로 읽으면 받아들인다.
  - 반면 분류 추가 API는 `kind: 'knowledge'`를 400으로 거절한다(L202, L252). 범위 제외 spec.md:L153은 "지식 분류는 내장 `wiki` 하나"라고 못박는다. `groupNavCategories`의 반환형은 `{ knowledge: [wiki], … }`(L203)로 wiki 하나를 가정하지만, AC-CON-026 L272는 "`knowledge` 분류만 위키 구역에 넣고"라고 쓴다.
- 영향: 가져오기가 범위 제외로 막은 둘째 지식 분류를 만드는 뒷문이 된다. 받아들이면 위키 구역에 분류가 두 개 생기고, 거절하면 400이 된다. 두 구현 모두 문서 어딘가와 맞는다.
- Severity: minor — Class: blocking
- Required fix: design §5.3 L295의 `categories` 행에 "`wiki`가 아닌 분류의 `kind`가 `knowledge`면 400"(또는 "`resource`로 바꿔 저장", 하나만)을 적는다. AC-CON-026 L273에 그 사례 한 줄을 넣는다. `groupNavCategories` 설명도 같은 규칙에 맞춘다.

D3. CON-D26 — design.md:L349 vs spec.md:L82, design.md:L204
- 문제: `wiki.empty` 문구가 "관리자가 가져오기로 추가합니다" / "An admin adds them through import"다. 그런데 REQ-CON-010은 로그인한 누구나 항목을 만들 수 있다고 하고, design §3.5 L202·L204는 `wiki`를 알려진 분류 id로 두고 위키 항목을 "보통 항목"으로 정한다. 일반 사용자도 편집 양식에서 `category: "wiki"` 항목을 만들 수 있다는 뜻이고, 그렇다면 빈 상태 문구가 사실과 다르다. 편집 양식의 분류 선택지에 위키를 넣을지도 정해져 있지 않다.
- Severity: minor — Class: optional
- Required fix: 둘 중 하나로 맞춘다. (a) 문구를 "아직 위키 항목이 없습니다"처럼 추가 경로를 말하지 않게 고친다. (b) 위키 항목 생성을 관리자로 제한하고 REQ-CON-010·025와 권한표에 적는다.

D4. CON-D27 — spec.md:L120, L124
- 문제: REQ-CON-025(§3.8)가 REQ-CON-024(§3.9)보다 앞에 있어, 문서 안 순서가 `…023, 025, 024`다. 번호에 빈칸이나 중복은 없다.
- Severity: minor — Class: optional
- Required fix: §3.8·§3.9의 순서를 바꾸거나, 각 REQ를 번호 순서대로 둔다.

D5. CON-D28 — spec.md:L120
- 문제: REQ-CON-025 한 항목에 의무가 일곱 개 들어 있다(메뉴 위치, `kind` 표식, 기본값, 내장 분류, 빈 상태, 언어 키, 시드 항목과 작성 기능 제외). 그중 "When an admin imports the seed file, the content-workshop wiki entry … shall reach the Wiki section"은 오너가 만드는 시드 파일 내용에 대한 운영 절차라서 시스템이 보장할 수 없다. AC-CON-026 L274는 테스트용 카드로 대신 검증하고, 실제 항목은 plan §7 수동 작업으로만 확인된다. 이와 함께 볼 점이 두 가지 있다.
  - 홈 분류별 요약에서 위키를 빼는 규칙은 design L204와 AC L274에만 있고 REQ에는 없다.
  - 내장 `wiki`의 아이콘 `book`이 기존 `guides-team`(가이드·교육, index.html L797)과 같다. 두 분류의 쓰임(지식 문서 대 가이드·매뉴얼)이 겹쳐 사용자가 어디에 넣을지 헷갈릴 수 있다.
- Severity: minor — Class: optional
- Required fix: REQ-CON-025를 메뉴·분류 표식·빈 상태 정도로 나누고, 시드 항목 문장은 plan §7이나 비규범 주석으로 옮긴다. 홈 요약 제외는 REQ-CON-020이나 025에 한 구절 넣는다. 위키 아이콘을 다른 마크로 바꾸거나, `guides-team`과 위키의 구분을 분류 설명에 적는다.

D6. CON-D20(잔여) — design.md §3.4 / plan.md §6
- 문제: 사람 목록 email을 일반 사용자에게 공개하는 쪽으로 바꾼 결정이 오너 결정 표 D1~D13에 없다.
- Severity: minor — Class: optional
- Required fix: plan §6에 D14 행을 추가한다(제안: 공개, 대안: 관리자에게만 공개).

D7. CON-D22(잔여) — spec.md:L78
- 문제: REQ-CON-009 끝에 비규범 설명 문장이 그대로 붙어 있다.
- Severity: minor — Class: optional
- Required fix: 별도 주석 줄이나 §4로 옮긴다.

D8. CON-D23(잔여) — spec.md:L182
- 문제: AC-CON-005 행에 REQ-CON-001·REQ-CON-013이 빠져 있다.
- Severity: minor — Class: optional
- Required fix: 추적표 행에 두 REQ를 더한다.

## Gaps

- design §5.3 가져오기 규칙을 프로토타입 원본과 다시 대조하지 않았다. `cards` 필드 이름과 `login_id` 포함 여부는 1차 감사의 대조 결과를 이어받았다. 이번에는 `CATEGORIES`(L781-L798)와 `renderSide`(L1648-L1663)만 읽었다.
- CON-D17 실측은 design 서술을 감사자가 옮긴 함수로 한 것이다. 실제 `isConsoleNext` 구현은 아직 없다. 또 `/console/%2e%2e%2fadmin`처럼 `%2f`가 섞인 값이 `/console/` 아래에 남는다는 것은 `new URL` 출력으로만 확인했다. Vercel·Next.js 라우터가 이 경로를 다시 해석하는지는 보지 않았다(호스트는 바뀌지 않으므로 외부 리디렉트 위험은 없다).
- 교차 모델 의견이 없다(cross_model_active false).
- 위키 구역의 실제 화면은 아직 없으므로, 렌더링 관련 판단은 문서와 프로토타입 코드만으로 했다.

## Recommendation

FAIL + STOP. 점수가 0.88에서 0.87로 내려갔고, 3차가 반복 상한이다. 오케스트레이터는 manager-spec에 4차 개정을 바로 맡기지 말고, 오너에게 아래 세 가지 중 하나를 물어야 한다.

1. **범위 줄이기(권장)**: 위키 구역(REQ-CON-025, AC-CON-026, design §3.5, spec §4의 위키 두 줄, 범위 제외 "위키·지식 기반")을 후속 SPEC으로 떼어 낸다. 남는 범위에는 막는 결함이 없다. 2차 막는 결함 3건이 모두 풀렸고, 위키를 빼면 점수 기준(Tier L 0.85)도 넘으므로 위키를 빼고 재감사하면 바로 PASS할 수 있다. REQ-CON-020·AC-CON-020의 위키 언급만 v0.2.0 문구로 되돌리면 된다.
2. **조건부 PASS(기술 부채 기록)**: 지금 상태를 받아들이고, CON-D24·D25를 Implementation Kickoff의 결정 사항으로 넘긴다. 이 경우 kickoff에서 메뉴 모양((a) 프로토타입 방식 권장)과 `knowledge` 가져오기 처리(400 권장)를 답으로 받아 progress.md §E.1에 기록해야 한다. 두 답이 정해지기 전에는 M5 화면 이식을 시작하지 않는다.
3. **명시적 연장**: 오너가 4차 반복을 허락하면, manager-spec은 아래 두 가지만 고친다. 고칠 범위는 좁다.
   - CON-D24: spec.md:L120, design.md:L203, acceptance.md:L270-L274에 메뉴 모양을 하나로 적는다.
   - CON-D25: design.md:L295와 acceptance.md:L273에 `wiki`가 아닌 `knowledge` 분류의 처리를 적는다.

선택 결함 CON-D20·D22·D23·D26·D27·D28은 어느 경로를 고르든 오케스트레이터 재량이다. 그중 CON-D26(빈 상태 문구)은 한 줄이면 고칠 수 있어 함께 반영하기를 권한다.

### 반복 이력

| 반복 | SHA | 점수 | 판정 | 막는 결함 |
|---|---|---|---|---|
| 1 | c20202ee | 0.78 | FAIL | CON-D1~D7 |
| 2 | e7c805f1 | 0.88 | FAIL | CON-D16~D18(D1~D7 모두 해소) |
| 3 | ce78c096 | 0.87 | FAIL + STOP | CON-D24·D25(D16~D18 모두 해소, 위키 구역에서 새로 생김) |

세 반복 내내 바뀌지 않은 결함은 없다. 반복마다 이전 막는 결함은 모두 풀렸고, 새 막는 결함은 매번 개정으로 바뀌거나 추가된 부분에서 나왔다.
