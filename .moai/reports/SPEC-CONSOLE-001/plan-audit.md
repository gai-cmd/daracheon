# SPEC Review Report: SPEC-CONSOLE-001
Iteration: 4/3 (3차 STOP 뒤 사용자 지시 "계속해"로 연장된 반복)
Verdict: PASS
Overall Score: 0.93

verdict: PASS
signal: none
audited_sha: 4979ea30
overall_score: 0.93
previous_score: 0.87
must_pass_failed: 0
blocking_count: 0
plan_artifact_hash: sha256:792fdf8ac52d5fe9bd9528cf51319d8214d133a968805b502066281d35e00512

> 작성자 개정 보고서에 담긴 추론은 M1(맥락 격리)에 따라 판정 근거로 쓰지 않았다. 판정 근거는 SPEC 산출물 5개(spec·design·acceptance·plan·research), progress.md, `git diff ce78c096 4979ea30`, 프로토타입 `~/personal/works/zoellife/zoel-console/index.html`을 직접 읽고 돌려 본 결과뿐이다.
> 4차는 3차 결함 8건(막는 결함 CON-D24·D25, 선택 결함 CON-D20·D22·D23·D26·D27·D28)의 해소 여부를 확인하고, 개정으로 바뀐 부분이 새 모순을 만들지 않았는지 SPEC 전체를 다시 훑었다.
> `plan_artifact_hash`는 감사자가 직접 계산했다(`cat acceptance.md design.md plan.md research.md spec.md | shasum -a 256`).
> 교차 모델 감사는 하지 않았다. `moai verify audit-plan` 출력이 `"cross_model_active": false`, `"cross_model_required": false`다.

3차의 막는 결함 2건이 모두 풀렸고, 선택 결함 6건도 모두 반영됐다. 개정이 새로 만든 막는 결함은 없다. 새로 찾은 것은 선택 결함 4건(CON-D29~D32)이며 모두 한두 줄로 고칠 수 있다. 점수는 0.87에서 0.93으로 올라 Tier L 기준 0.85(`spec-workflow.md` L142)를 넘는다. 판정은 PASS다.

## Must-Pass Results

- [PASS] MP-1 REQ 번호 일관성: `grep -c "^\*\*REQ-CON-" spec.md` 결과가 26이다. 문서 안 순서가 spec.md:L61(001)부터 L127(026)까지 번호 순서 그대로이고, 빈 번호와 중복이 없다. AC는 26개이고 `uniq -d` 결과가 없다.
- [PASS] MP-2 GEARS 형식(요구사항 층에서 판정): REQ 26개 모두 GEARS 패턴이다. 새로 나뉜 두 요구사항을 따로 봤다.
  - REQ-CON-025(spec.md:L125): Ubiquitous("The console navigation shall show a Wiki section …", "the navigation shall not list individual Wiki items"), Event("When the user selects the Wiki entry, the console shall show …", "when there are none, the console shall show an empty-state message …")의 복합 요구사항이다. "Because any signed-in user may add a Wiki item (REQ-CON-010), …"는 GEARS 수식어가 아닌 근거 구절이지만, 규범 부분("the empty-state message shall not state …")은 Unwanted 형식이다. 형식 실패로 보지 않고 선택 결함 CON-D29로만 남긴다(2차의 CON-D22와 같은 종류).
  - REQ-CON-026(spec.md:L127): Ubiquitous와 Event("When an admin requests to add …", "When an import file lists …")를 섞은 복합 요구사항이다.
  - AC-CON-026은 Given-When-Then 형식이며, 검증 층에 맞는 형식이다.
- [PASS] MP-3 frontmatter: spec.md:L1-15에 12개 필드가 모두 있다. version은 따옴표가 붙은 `"0.4.0"`, status는 `draft`, priority는 `P1`, lifecycle은 `spec-anchored`, tags는 문자열, tier는 `L`이다. 거부되는 별칭은 없다. `moai spec lint SPEC-CONSOLE-001` 결과는 `0 error(s), 0 warning(s)`다(INFO 1건은 첫 커밋 c20202ee에 트레일러가 없다는 기존 알림).
- [N/A] MP-4 언어 중립성: TypeScript/Next.js 한 언어로 된 프로젝트의 SPEC이다.
- [PASS] MP-5 D7: `grep -Eoh 'SPEC-([A-Z][A-Z0-9]+-)+[0-9]+' *.md | sort -u` 결과는 `SPEC-CONSOLE-001` 하나다. BLOCKING 0건.
- [PASS] MP-6 D8: 산출물 6개 모두 `grep -c syscall` 결과가 0이다.
- [PASS] MP-7 확인 필요 표식: `grep -rn "NEEDS CLARIFICATION" .moai/specs/SPEC-CONSOLE-001/`의 종료 코드가 1이다(일치 0건).

## Category Scores

| Dimension | Score | Rubric Band | Evidence |
|---|---|---|---|
| Clarity | 0.90 | 0.75~1.0 | 3차의 모호점 두 곳이 풀렸다. 메뉴 모양은 spec.md:L125("exactly one entry labeled 위키 / Wiki … the navigation shall not list individual Wiki items"), design.md:L204, acceptance.md:L270이 같은 모양을 말한다. `wiki`가 아닌 `knowledge` 분류는 spec.md:L127, design.md:L202·L296, acceptance.md:L273이 모두 400이다. 남은 것은 엔지니어가 같은 쪽으로 풀 작은 틈뿐이다(CON-D31 아이콘 중복 금지의 적용 범위, CON-D32 `{id:"wiki"}` 항목의 검사 순서). |
| Completeness | 0.93 | 0.75~1.0 | 절이 모두 있고 H3 범위 제외가 4개다(spec.md:L142, L152, L159, L169). 오너 결정 표에 D14가 들어갔다(plan.md:L170). 다만 D14의 대안을 고르면 설계 개정이 먼저인데, 개정이 먼저인 결정 목록에는 여전히 D2·D13만 있다(CON-D30). |
| Testability | 0.92 | 0.75~1.0 | 3차에서 해석을 먼저 골라야 판정할 수 있던 AC-CON-026 L270-L274가 이제 모두 통과·실패로 판정된다. 링크 개수 정확히 1, 주소 `#/cat/wiki`, 글자 "위키", 아이콘 `library`, 개수 0과 1, `{id:"kb", kind:"knowledge"}` 400과 저장 문서 무변경, 일반 사용자의 위키 항목 생성, 문구 금지어 4개(대소문자 무시)를 각각 확인할 수 있다. 아이콘 중복 금지는 기본 분류 8개로만 검증한다(CON-D31). |
| Traceability | 0.98 | 1.0 | REQ 26개가 모두 AC에 걸린다(spec.md:L181-L206). AC-CON-026이 REQ-CON-025·026에 걸리고(spec.md:L206, acceptance.md:L266), AC-CON-005 행이 REQ-CON-001·004·006·013으로 보완됐다(spec.md:L185, acceptance.md:L63). AC-CON-005 L70이 로그아웃 예외(REQ-CON-001)와 Origin 403(REQ-CON-013)을 실제로 검증하므로 이 매핑은 근거가 있다. 존재하지 않는 REQ를 가리키는 AC는 없다. |

집계 점수 0.93은 네 항목의 조화평균이다(4 / (1/0.90 + 1/0.93 + 1/0.92 + 1/0.98) = 0.932).

## Regression Check (3차 결함 8건)

- CON-D24 위키 메뉴 모양 — **RESOLVED**
  - spec.md:L125가 프로토타입 방식 하나로 정했다. 일반 분류 제목 위, 구분선으로 떨어진 구역에 "위키 / Wiki" 링크 한 줄(내장 `wiki` 아이콘, 삭제되지 않은 항목 수)만 두고, 메뉴에 위키 항목을 늘어놓지 않는다. 누르면 본문에 목록이나 빈 상태 안내가 뜬다.
  - design.md:L204와 acceptance.md:L270-L271이 같은 모양을 말한다. 메뉴 순서(홈 → 전체 항목 → 구분선 → 위키 링크 → 구분선 → 분류 제목 → 일반 분류 → 구분선 → 공유 계정 → 내 항목)도 두 문서가 같다.
  - 프로토타입 대조: `renderSide`(index.html L1648-L1663)는 홈 → 전체 항목 → `side-sep` → `side-h`(`cats`) → 분류 링크들 → `side-sep` → 공유 계정 → 내 항목이고, 링크마다 `href: '#/cat/' + c.id`와 개수 `n`을 붙인다. 개정안은 이 구조의 첫 구분선과 분류 제목 사이에 같은 모양의 링크 한 줄과 구분선 하나를 끼운 것이다. 주소 `#/cat/wiki`는 프로토타입의 해시 경로 규칙(L1596 `hashOf`)과 같다.
  - 3차에서 지적한 "제목과 링크가 둘 다 '위키'" 문제는 구역 제목을 없애 해결했다(design.md:L204 "별도 제목 없이 링크 **한 줄**").
- CON-D25 가져오기로 둘째 지식 분류 만들기 — **RESOLVED**
  - spec.md:L127 "When an import file lists a category whose kind is `knowledge` and whose id is not `wiki`, the server shall reject the whole import as invalid (400) and shall change no stored document."
  - design.md:L296(§5.3 `categories` 행)과 L202(§3.5)가 같은 규칙이고, L289의 원자성("하나라도 오류가 있으면 아무것도 쓰지 않고 400")과 맞는다.
  - AC-CON-026 L273이 `{id: "kb", kind: "knowledge"}` 사례로 검증한다. `groupNavCategories`의 반환값이 `{ wiki, regular }`로 바뀌어(design.md:L203, acceptance.md:L272) wiki 하나라는 가정과 맞는다. 범위 제외 spec.md:L156도 "분류 추가와 가져오기 어느 쪽으로도 늘릴 수 없다"로 맞춰졌다.
- CON-D26 빈 상태 문구 — **RESOLVED**: design.md:L350의 문구가 "아직 위키 항목이 없습니다. 항목을 추가할 때 분류를 위키로 고르면 여기에 나옵니다." / "No wiki entries yet. Add an item and choose Wiki as its category to list it here."다. 두 문구 모두 "관리자"·"가져오기"·"admin"·"import"를 담지 않는다(감사자가 문구를 읽어 확인). 편집 양식 분류 선택지에 위키가 들어갔고(spec.md:L127, design.md:L202), AC-CON-026 L274가 일반 사용자의 위키 항목 생성을 검증한다.
- CON-D27 REQ 순서 — **RESOLVED**: §3.8이 REQ-CON-024(L121), §3.9가 REQ-CON-025·026(L125, L127)이다.
- CON-D28 REQ-CON-025 과적재 — **RESOLVED**
  - 메뉴·빈 상태·언어 키·홈 요약 제외(REQ-CON-025)와 분류 `kind`·내장 `wiki`·거절 규칙·양식 선택지·작성 기능 제외(REQ-CON-026)로 나뉘었다.
  - 시드 항목 문장은 요구사항에서 빠졌다. §4 spec.md:L137은 "시스템 요구사항이 아니라 오너의 운영 절차다(plan.md §7 4번)"라고 적고, plan.md:L177에 그 절차가 있다.
  - 홈 요약 제외가 REQ-CON-025 끝과 REQ-CON-020("a per-category summary of the regular categories", spec.md:L111)에 들어갔다.
  - 아이콘이 `library`로 바뀌었다(design.md:L201). 프로토타입 `CAT_ICONS`(index.html L541)는 `['globe', 'pen', 'video', 'folder', 'chart', 'cart', 'sparkles', 'book']`이고 `library`는 없으므로 기본 분류 8개와 겹치지 않는다. `guides-team`과의 쓰임 구분도 design.md:L201에 적혔다.
- CON-D20 email 공개 결정 — **RESOLVED**: plan.md:L170에 D14 행(제안: 공개, 대안: 관리자에게만)이 있고, plan.md:L153, acceptance.md:L302, progress.md:L11-L12가 "D1~D14"다. `grep -n "D1~D13\|D1 ~ D13" *.md` 결과가 0건이다.
- CON-D22 REQ-CON-009 비규범 문장 — **RESOLVED**: spec.md:L79는 규범 문장만 남았고, "REQ-CON-009는 브라우저로 가는 경로만 다루고 …"가 §4 저장 한계(spec.md:L138)로 옮겨졌다. `grep -n "This requirement governs" spec.md` 결과가 0건이다.
- CON-D23 AC-005 추적 — **RESOLVED**: 위 Traceability 항목 참고.

정체 판정: 세 반복 연속 바뀌지 않은 결함은 없다.

## 새 모순 점검 (개정 전체 대상)

개정이 건드린 모든 줄(`git diff --stat ce78c096 4979ea30`: spec 29, acceptance 25, design 13, plan 11, progress 8줄)과 그 줄을 참조하는 곳을 대조했다.

- REQ-CON-020(spec.md:L111)의 메뉴 목록, REQ-CON-025, design.md:L204, AC-CON-020 L215, AC-CON-026 L270이 메뉴 항목과 순서를 같은 말로 쓴다. 모순 없음.
- 분류 추가 API(design.md:L253), §3.5 L202, REQ-CON-026, AC-CON-026 L273이 `id: "wiki"`와 `kind: "knowledge"` 거절을 같은 말로 쓴다. 모순 없음.
- 내보내기는 내장 `wiki`를 빼고(design.md:L257) 가져오기는 `id: "wiki"`를 무시하며, 항목이 쓰는 분류 id 검사는 내장 `wiki`를 포함한 최종 목록 기준이다(L296). 그래서 위키 항목이 든 내보내기 파일도 다시 가져올 수 있다. 왕복이 안정적이다.
- plan §7 4번(L177)의 운영 절차는 프로토타입 내보내기 파일(분류에 `kind` 없음 → `resource`)에 `category: "wiki"` 카드를 덧붙이는 방식이다. 새 400 규칙에 걸리지 않는다.
- 새 i18n 문구와 아이콘 이름에 직원 이름·내부 id·내부 주소가 없다. `git grep -n "zoel-workshop.vercel.app/apps/wiki" -- src data scripts`는 여전히 실행 단계 검사로 남아 있다(AC-CON-026 L276).
- 새로 찾은 작은 틈 4건은 아래 결함 목록의 CON-D29~D32다. 어느 것도 두 문서가 서로 다른 동작을 요구하는 모순은 아니다.

## Defects Found (structured defect-list)

D1. CON-D29 — spec.md:L125
- 문제: REQ-CON-025 안에 근거 구절 "Because any signed-in user may add a Wiki item (REQ-CON-010), …"이 들어 있다. 규범 부분은 GEARS 형식이지만, 근거는 요구사항 문장 밖에 두는 것이 이 SPEC의 관례다(CON-D22에서 같은 이유로 옮김).
- Severity: minor — Class: optional (blocking: false)
- Required fix: "Because … (REQ-CON-010), "를 지워 "The empty-state message shall not state that adding a Wiki item requires an admin or an import."로 두고, 근거는 design §3.5나 §4에 한 줄로 둔다.

D2. CON-D30 — plan.md:L153 vs plan.md:L170, acceptance.md:L302, progress.md:L11
- 문제: D14 행은 대안(email을 관리자에게만)을 고르면 design §3.4를 개정한다고 쓴다. 그런데 plan §6 머리말, 완료 조건, progress의 open_owner_decisions는 "D2·D13에서 (B)를 고르면 SPEC 개정과 재감사가 먼저"라고만 적어, D14 대안도 개정이 먼저라는 점이 빠져 있다.
- Severity: minor — Class: optional (blocking: false). D14 행 자체에 개정 의무가 적혀 있어 오케스트레이터가 그 행을 읽으면 같은 결론에 이른다.
- Required fix: 세 곳의 "D2·D13"을 "D2·D13·D14(대안 선택 시)"로 고친다.

D3. CON-D31 — spec.md:L127 vs design.md:L194, L305, index.html L541
- 문제: REQ-CON-026은 내장 `wiki`의 아이콘이 "every regular category's icon"과 달라야 한다고 쓴다. 그런데 일반 분류의 `icon` 값은 `string`으로만 정해져 있고(design.md:L194), 가져오기나 분류 추가에서 허용하는 아이콘 이름 목록이 설계에 없다. 가져오기 파일의 분류가 `icon: "library"`를 가지면 요구사항을 어기는 상태가 저장될 수 있다. AC-CON-026 L270은 기본 분류 8개만 비교한다.
- Severity: minor — Class: optional (blocking: false). 설계가 요구사항과 반대되는 동작을 정한 것은 아니고, 막는 규칙 하나가 빠진 것이다.
- Required fix: 둘 중 하나. (a) design §3.5에 "일반 분류의 `icon`은 프로토타입 `CAT_ICONS` 8개 중 하나여야 하고, 아니면 검증 오류"를 적는다(분류 추가 API가 프로토타입처럼 `folder`를 쓰면 함께 적는다). (b) REQ-CON-026 문구를 "distinct from the icons of the default regular categories"로 좁힌다.

D4. CON-D32 — design.md:L296
- 문제: 가져오기 파일에 `{id: "wiki", kind: "article"}`처럼 `id`는 `wiki`이고 다른 칸이 무효인 분류가 있을 때, "무시"가 먼저인지 "모르는 값이면 오류"가 먼저인지 정해져 있지 않다. 결과가 성공(무시)과 400 사이에서 갈린다.
- Severity: minor — Class: optional (blocking: false). 둘 다 저장 상태를 망가뜨리지 않는 결과라 영향이 작다.
- Required fix: §5.3 `categories` 행에 "`id: 'wiki'` 항목은 다른 칸을 검사하지 않고 무시한다"(또는 "검사한 뒤 무시한다")를 한 구절로 적고, 단위 테스트 표에 그 사례를 넣는다.

## Gaps

- 교차 모델 의견이 없다(`cross_model_active: false`).
- 위키 링크와 `library` 아이콘의 실제 화면은 아직 없으므로, 렌더링 판단은 문서와 프로토타입 코드만으로 했다. `library` SVG가 `book`과 눈으로 구분되는지는 실행 단계에서 확인할 일이다.
- design §5.3의 `cards` 필드 이름과 `login_id` 포함 여부는 1차 감사의 프로토타입 대조 결과를 이어받았고, 이번에 다시 대조하지 않았다.
- 콘솔 화면 라우팅이 해시(`#/cat/wiki`)인 점과, 로그인 복귀 경로가 서버 경로(`/console/x`, AC-CON-006 L78)라는 점의 관계는 이번 개정과 무관해 다시 보지 않았다. 해시 부분은 복귀 경로에 실리지 않는다.
- 이 보고서는 워크트리에 쓰기만 했고 커밋하지 않았다.

## Recommendation

PASS. 근거는 다음과 같다.

- 막는 결함 0건. 3차의 막는 결함 CON-D24(spec.md:L125, design.md:L204, acceptance.md:L270-L271)와 CON-D25(spec.md:L127, design.md:L296, acceptance.md:L273)가 세 문서에 같은 말로 들어갔다.
- 필수 기준 7개 모두 PASS 또는 N/A(MP-4). 근거 명령과 출력은 위 Must-Pass Results에 있다.
- 점수 0.93이 Tier L 기준 0.85를 넘고, 3차 0.87보다 올라 STOP 신호가 없다.

선택 결함 CON-D29~D32는 오케스트레이터 재량이다. 실행 단계에 넘긴다면 CON-D31(아이콘 허용 목록)과 CON-D32(검사 순서)는 M1의 `categories.ts`·M4의 `mapImportFile` 단위 테스트를 쓸 때 함께 정하면 되고, CON-D29·D30은 한 줄 수정이다. plan §6 D1~D14의 답은 여전히 Implementation Kickoff에서 받아 progress.md §E.1에 기록해야 한다. 이번 PASS는 그 게이트를 대신하지 않는다.

### 반복 이력

| 반복 | SHA | 점수 | 판정 | 막는 결함 |
|---|---|---|---|---|
| 1 | c20202ee | 0.78 | FAIL | CON-D1~D7 |
| 2 | e7c805f1 | 0.88 | FAIL | CON-D16~D18(D1~D7 모두 해소) |
| 3 | ce78c096 | 0.87 | FAIL + STOP | CON-D24·D25(D16~D18 모두 해소, 위키 구역에서 새로 생김) |
| 4 | 4979ea30 | 0.93 | PASS | 없음(D24·D25 해소, 선택 결함 CON-D29~D32만 남음) |
