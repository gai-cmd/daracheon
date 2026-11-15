# SPEC Review Report: SPEC-CONSOLE-002
Iteration: 1/3
Verdict: FAIL
Overall Score: 0.86

> Reasoning context ignored per M1 Context Isolation. 판정 근거는 spec.md·plan.md·acceptance.md·progress.md와 워크트리 코드(HEAD 9ef773c0)뿐이다.
> 감사 대상: `.moai/specs/SPEC-CONSOLE-002/` (tier: M → 입력 spec.md + plan.md + acceptance.md, progress.md 참고)
> 교차 모델 감사 백엔드: 호출하지 않음(이 감사 세션에 MCP 감사 도구가 노출되지 않음). Claude 단독 판정.

FAIL 사유는 하나다. plan.md §2.5대로 구현하면 `next build`가 CSS 모듈 순수성 검사에서 멈춘다(D1, 실행으로 확인함). 나머지 결함은 막는 결함이 아니지만, 같은 개정에서 함께 고치기를 권한다.

## Must-Pass Results

- [PASS] MP-1 REQ 번호 일관성: `grep -o '^\*\*REQ-CS2-[0-9]*' spec.md` → REQ-CS2-001 ~ 021 21개, 빈 번호·중복 없음, 세 자리 0 채움 동일(spec.md:L54~L104). AC도 AC-CS2-001 ~ 022 연속(acceptance.md:L20~L188).
- [PASS] MP-2 GEARS 형식(요구사항 층 기준): 21개 REQ 모두 GEARS 패턴. 예) Ubiquitous "The console item model shall carry…"(L54), Event "When a user who is neither…, the server shall answer 403"(L60), State "While a console screen … is mounted, the console shall style…"(L68), Where "Where the user is a console admin, the form's category selector shall end with…"(L80). AC는 검증 층이라 Given-When-Then으로 따로 채점했다(Group 4).
- [PASS] MP-3 frontmatter: spec.md:L2~L13에 정식 12개 필드가 모두 있고 형식도 맞다. `id`, `title`, `version: "0.1.0"`(따옴표 semver), `status: draft`, `created/updated: 2026-11-15`, `author`, `priority: P1`, `phase`, `module`, `lifecycle: spec-anchored`, `tags`(쉼표 문자열). 거부되는 별칭(`created_at` 등)은 없다. 선택 필드 `tier: M`, `depends_on`이 있다.
- [N/A] MP-4 언어 중립성: Next.js/TypeScript 단일 저장소 SPEC이다.
- [PASS] MP-5 D7 교차 SPEC: 참조는 SPEC-CONSOLE-001뿐이고 `status: in-progress`(SPEC-CONSOLE-001/spec.md:L5)다. retired/superseded/archived가 아니므로 BLOCKING 없음.
- [PASS] MP-6 D8: `grep -n syscall *.md` 0건 → 자동 PASS.
- [PASS] MP-7 확인 필요 표식: `grep -rn 'NEEDS CLARIFICATION' plan.md` 0건. research.md는 없다(Tier M).

## Category Scores (0.0-1.0, rubric-anchored)

| Dimension | Score | Rubric Band | Evidence |
|-----------|-------|-------------|----------|
| Clarity | 0.80 | 0.75 | 요구사항 문장은 명확하다. 다만 설계가 요구사항과 어긋나는 곳이 셋 있다. plan.md:L157 `noopener` 판정 불가(D2), plan.md:L165 안쪽 스크롤 영역 `thin` 누락(D5), plan.md:L204와 acceptance.md:L206의 기존 테스트 처리 모순(D4) |
| Completeness | 0.90 | 0.75~1.0 | 필수 절이 모두 있다. HISTORY(L20), 배경(L26), 범위(L28~L40), REQ(L50), AC 추적표(L139), Out of Scope H3 3개(L118, L127, L133)와 그 아래 `-` 항목들. 감점 요인: 요구사항 21·인수 기준 22개로 Tier M 상한 16/16을 넘음(D6), 공유 계정→링크 전환 시 비밀값이 삭제되는 문제를 다루지 않음(D3) |
| Testability | 0.85 | 0.75~1.0 | 대부분 이진 판정이 가능하다(AC-CS2-004 표, AC-CS2-005의 20건·내림차순, AC-CS2-011 거부 표본추출). 판단이 끼는 곳: AC-CS2-007 Safari 스크린샷 "밝은 색"(L83), AC-CS2-018 "브라우저를 닫고 새 세션"(L163, 세션 복원 기능이 sessionStorage를 되살릴 수 있음) |
| Traceability | 1.00 | 1.0 | spec.md §6 표(L143~L166)에서 REQ 21개가 모두 AC에 걸린다. 모든 AC가 실재하는 REQ를 가리키고, 고아 AC가 없다. 각 AC 머리말의 "maps REQ-…"가 표와 일치한다 |

## 범위 대조 (리드 범위 S1~S6 → REQ/AC)

| 범위 | REQ | AC | 판정 |
|---|---|---|---|
| S1 콘솔 스크롤바(로그인 화면 포함, 공개 사이트·/admin 불변) | 007, 008 | 007, 008 | 다룸. 설계 결함 D1(빌드 실패), D5(안쪽 영역 굵기) |
| S2 양식 종류 선택·공유 계정 칸·생성기·공유 대상·숨기기·새 분류 | 009~012 | 009~012 | 다룸. D3(전환 시 비밀값 삭제), D7(원래 type 소실) |
| S3 자격증명 카드·로그인 열기·빈 상태·사용 기록 | 013~016 | 013~016, 022 | 다룸. D2(새 탭 차단 판정) |
| S4 서버 hide_password·copy·activity·공유 계정 보기 | 001~005, 017 | 001~005, 017, 022 | 다룸. 보안 점검은 아래 |
| S5 한·영, 키보드·스크린리더, 레이아웃 이동 없음, 375px | 021 | 021 | 다룸 |
| S6 자동 입력 끄기 안내(사람별 확인, 브라우저 판별, 설정 주소 복사, 입력 속성, 정직한 한계) | 006, 018~020 | 006, 018~020 | 다룸. localStorage 대신 서버 저장을 택한 근거가 plan.md CS2-D5(L15)에 있다 |
| 제외 항목(확장 프로그램 자동 입력, 일회용 외부 링크, 변경 알림, 첨부, TOTP, 팀 밖 그룹) | — | — | spec.md:L118~L125에 모두 있음 |
| 정직성("복사만 허용"은 화면 수준 장치, 사이트는 브라우저 설정을 못 바꿈) | — | 019 | spec.md:L38~L40, L129~L130, REQ-CS2-019(L98) |

## S4 보안 점검 (코드 대조)

- 서버 측 `view` 차단: plan.md §2.2 7단계(L62)가 공개 범위 판정(6단계) 뒤, 열람 상한(8단계) 앞에 온다. 기존 라우트 순서와 맞는다(`src/app/api/console/items/[id]/credential/route.ts:L34~L102`: Origin → 세션 → 키 → 본문 → 항목 → `credAccess` → 상한 → not_set → 감사 → 복호화). 예외 대상 `isAdmin || isOwner`는 `canEdit`(permissions.ts:L36~L38)와 같은 집합이다. PASS.
- `copy`에도 기존 관문이 그대로 걸림: `PURPOSES = ['view','copy']`(route.ts:L24)는 이미 있다. 감사 동작은 `credential.${purpose}`(L98)로 이미 view와 copy를 나눠 남긴다. 상한 계산은 view·copy만 센다(audit.ts:L48~L54). 그래서 `reveal_hidden` 거절은 상한에 들어가지 않고, AC-CS2-004:L55와도 맞는다. PASS.
- activity 엔드포인트: 담당자·관리자만 200, 그 밖의 사용자는 403, 세션 없음 401, 없거나 삭제된 항목 404, `no-store`. 응답에 값·`iv`·`tag`·`ct`가 없다(REQ-CS2-005, AC-CS2-005:L60~L64). PASS.
- 내보내기는 표식만 내보내고 값은 없다. 카나리 부재를 검사한다(AC-CS2-002:L29). PASS.
- 남는 위험(정직하게 적혀 있음): `copy`가 같은 값을 돌려주므로 `view` 403은 화면 단계의 장치다. 멤버가 개발자 도구에서 `purpose:"copy"`로 요청하면 응답 본문으로 값을 읽을 수 있다. spec.md:L38이 이를 명시한다. 결함이 아니다.

## 스크롤바 누출 점검

- 콘솔 표식: `data-admin-root="console"`은 ConsoleApp.tsx:L443, L576과 login/LoginScreen.tsx:L59에만 있다. `/admin`은 `data-admin-root="true"`(`src/app/admin/(dashboard)/layout.tsx:L20`)라 `[data-admin-root="console"]`에 걸리지 않는다. 범위 설계는 맞다.
- 공용 파일 불변: spec.md:L111과 AC-CS2-008:L90(`git diff`에 globals.css·dark-theme.css 없음)이 막는다. 클라이언트 이동 뒤 원복도 AC-CS2-008:L88이 확인한다.
- 그러나 계획된 선택자는 빌드되지 않는다(D1).

## 공개 저장소 위생

- 세 문서의 email은 모두 `@try-n.com` 지어낸 주소다(`grep -noE '[A-Za-z0-9._-]+@…' *.md | grep -v try-n.com` 0건). 직원 이름, Drive·Sheet·Slack id, 내부 주소가 없다. 팀 이름(한국팀 등)은 이미 `src/lib/console/types.ts:L4`에 공개돼 있다.
- 비밀값 폴백 금지 점검 명령: acceptance.md:L207. 로컬 시드와 쿠키 스크립트는 커밋하지 않음: L13~L15, L214. PASS.

## Defects Found (structured defect-list)

D1. CS2-PA-D1 — plan.md:L164~L165 (§2.5) — 페이지 스크롤바 규칙을 `console.module.css`에 `:global(html:has([data-admin-root="console"]))`로 넣는 설계는 Next.js CSS 모듈의 순수성 검사(`mode: 'pure'`, `node_modules/next/dist/build/webpack/config/blocks/css/loaders/modules.js:L61`)를 통과하지 못한다. 그래서 `next build`/`next dev`가 실패한다. Next 번들 `postcss-modules-local-by-default`로 직접 돌려 확인했다: `Selector ":global(html:has([data-admin-root="console"]))" is not pure (pure selectors must contain at least one local class or id)`. `::-webkit-scrollbar`를 붙인 형태도 똑같이 실패한다. — Severity: major — Class: blocking — Required fix: plan.md §2.5의 선택자를 지역 클래스를 품은 형태로 바꾼다. 예) `:global(html):has(.root) { scrollbar-width: thin; scrollbar-color: #d6d0c4 #f2efe8; }`, `:global(html):has(.root)::-webkit-scrollbar…`. 같은 검사기로 돌려 보니 `html:has(:local(.root))`로 변환되며 통과했다. `.root`는 ConsoleApp과 LoginScreen이 같은 `console.module.css`에서 쓰므로 로그인 화면에도 걸린다. 그리고 AC-CS2-007의 테스트 줄에 "`next build`(또는 CSS 모듈 순수성 검사)가 통과한다"를 더한다.

D2. CS2-PA-D2 — plan.md:L157 (§2.4), spec.md:L86 (REQ-CS2-014) — `window.open(url, '_blank', 'noopener,noreferrer')`는 HTML 표준상 `noopener`가 있으면 열기에 성공해도 언제나 `null`을 돌려준다. 그래서 "반환값이 null이면 링크 표시" 판정은 새 탭이 막혔는지 구별하지 못한다. 결국 링크 대체 경로가 매번 뜬다. 이 판단은 표준 지식에 근거한 것이고, 이번 감사에서 실행해 확인하지는 않았다. — Severity: major — Class: optional — Required fix: plan.md §2.4를 고친다. 예) `const w = window.open('', '_blank'); if (!w) { 링크 표시 } else { w.opener = null; w.location.replace(url); }`처럼 `noopener` 없이 연 뒤 `opener`를 끊는다. referrer도 막으려면 그 방법을 함께 적는다. AC-CS2-014에는 "막히지 않은 Chrome에서는 링크 대체 경로가 보이지 않는다"를 더한다.

D3. CS2-PA-D3 — spec.md:L74 (REQ-CS2-009), plan.md:L135 — 기존 PATCH는 "공유 계정에서 벗어나면 비밀 기록을 지운다"(`src/app/api/console/items/[id]/route.ts:L24~L25`). 지금까지는 그 전환이 "더 보기" 안에 묻혀 있었다. 이 SPEC은 양식 맨 위에 두 갈래 종류 선택을 두므로, 공유 계정 항목을 편집하다 실수로 "링크"를 누르고 저장하면 저장된 아이디·비밀번호가 되돌릴 수 없이 지워진다. 회사 공유 비밀번호는 다른 곳에 사본이 없을 수 있다. SPEC은 이 부작용을 언급하지 않는다(plan.md:L135는 "서버도 무시함"이라고만 적어 오해를 부른다). — Severity: major — Class: optional — Required fix: 저장된 자격증명이 있는 항목에서 종류를 링크로 바꿀 때의 동작을 요구사항으로 정한다. 예) 저장 전 확인 문구 "저장된 아이디·비밀번호가 삭제돼요"와 취소 경로를 두거나, 전환 시 비밀 기록을 남겨 두도록 한다. 대응 AC도 추가한다. plan.md:L135의 "서버도 무시함"은 "저장하면 비밀 기록이 삭제됨(기존 동작)"으로 고친다.

D4. CS2-PA-D4 — plan.md:L204 vs acceptance.md:L206 — plan M1은 "기존 … bootstrap 테스트가 수정 없이 통과해야 한다"고 적었다. 그런데 `src/app/api/console/__tests__/bootstrap.test.ts:L33`은 `expect(r.json.me).toEqual({ email, name, team, isAdmin })`로 `me`를 엄격 비교하므로, REQ-CS2-006의 `me.autofillGuideAck` 추가로 반드시 깨진다. acceptance §8은 `hide_password` 스냅샷 차이만 허용한다고 적혀 있어 두 문서가 어긋난다. — Severity: minor — Class: optional — Required fix: 둘 중 하나를 고른다. (a) `autofillGuideAck`를 `me` 밖의 최상위 칸(예: `prefs.autofillGuideAck`)으로 옮기고 REQ-CS2-006·AC-CS2-006·plan §2.2를 맞춘다. (b) plan M1과 acceptance §8에 "bootstrap.test.ts:L33의 `me` 기대값에 `autofillGuideAck`만 더한다"를 명시한다.

D5. CS2-PA-D5 — plan.md:L165 (§2.5), spec.md:L68 (REQ-CS2-007) — REQ는 안쪽 스크롤 영역도 "thin"이어야 한다고 정한다. 그런데 `scrollbar-width`는 상속되지 않는다(`scrollbar-color`만 상속됨). 계획처럼 `html`에만 `scrollbar-width: thin`을 주면 Chrome 121+와 Firefox에서 사이드바·목록·상세 패널의 스크롤바는 기본 굵기로 남는다. 이 브라우저들은 표준 속성이 걸리면 `::-webkit-scrollbar` 너비 규칙을 무시한다. AC-CS2-007:L82도 안쪽 영역의 색만 보고 굵기는 보지 않는다. — Severity: minor — Class: optional — Required fix: plan §2.5에 `.root, .root * { scrollbar-width: thin; }`(또는 스크롤 컨테이너 클래스별 지정)을 넣는다. AC-CS2-007:L82에 "안쪽 스크롤 요소의 계산된 `scrollbarWidth`도 `thin`"을 더한다.

D6. CS2-PA-D6 — spec.md:L14 `tier: M`, progress.md:L8~L9 — 요구사항 21개·인수 기준 22개다. Tier M 상한은 각각 16개다(`.claude/rules/moai/workflow/spec-workflow.md` § SPEC Complexity Tier, REQ/AC budget). plan.md §3이 꼽는 바뀌는 파일도 22개 안팎이라, Tier M 범위(5~15개)를 넘는다. — Severity: major — Class: optional — Required fix: 둘 중 하나를 고른다. (a) S6(자동 입력 끄기 안내: REQ-CS2-006, 018~020)을 별도 SPEC으로 떼어 Tier M 안으로 줄인다. (b) `tier: L`로 올리고 PASS 기준 0.85를 적용한다. 이 경우 design.md·research.md가 필요하며, plan.md §1~§2를 design.md로 옮기면 된다. 리드 결정 사항이다.

D7. CS2-PA-D7 — spec.md:L74 (REQ-CS2-009) — "공유 계정에서 링크로 바꾸면 `type: link`, `access_method: public`"이라는 규칙 때문에 문제가 생긴다. 원래 `type: project`·`access_method: sso` 같은 비링크 항목을 편집하다 링크 → 공유 계정 → 링크로 왕복하면, 원래 type과 접속 방식을 잃는다. — Severity: minor — Class: optional — Required fix: 왕복 시 편집을 시작할 때의 type·access_method로 되돌린다는 문장을 REQ-CS2-009에 더하고, AC-CS2-009 순수 함수 테스트에 그 사례를 추가한다.

D8. CS2-PA-D8 — acceptance.md:L163 (AC-CS2-018), L83 (AC-CS2-007) — 두 판정 절차가 모호하다. "브라우저를 닫고 새 세션으로 들어오면 다시 뜬다"는 Chrome의 "이전 세션 이어서 열기"가 sessionStorage를 되살리면 결과가 달라진다. Safari 스크린샷의 "밝은 색"은 판단에 기댄다. — Severity: minor — Class: optional — Required fix: AC-CS2-018은 "새 시크릿 창(또는 sessionStorage를 지운 뒤)"처럼 결과가 하나로 정해지는 절차로 바꾼다. AC-CS2-007 Safari 항목은 스크린샷 막대 픽셀 색이 `#d6d0c4`에 가깝다(예: 각 채널 ±16)는 식의 수치 기준으로 바꾼다.

## Regression Check (Iteration 2+ only)

해당 없음(1차 감사).

## Recommendation

1. **D1(막는 결함)**: plan.md §2.5의 `:global(html:has([data-admin-root="console"]))`를 `:global(html):has(.root)`로 바꾸고, `::-webkit-scrollbar*` 규칙도 같은 앞부분을 쓰게 고친다. AC-CS2-007에 빌드 통과 확인을 더한다.
2. D3: 공유 계정 → 링크 전환 시 저장된 자격증명이 삭제되는 동작을 요구사항으로 다룬다(확인 문구 또는 보존). 대응 AC를 추가하고 plan.md:L135 문구를 고친다.
3. D2: 로그인 열기의 새 탭 차단 판정을 `noopener` 없이 연 뒤 `opener = null`로 끊는 방식으로 바꾼다.
4. D4: `autofillGuideAck` 위치를 정하거나 기존 bootstrap 테스트를 고치도록 허용하는 문장을 넣어 plan M1과 acceptance §8을 맞춘다.
5. D5: 안쪽 스크롤 영역에 `scrollbar-width: thin`을 직접 주고 AC에 굵기 확인을 더한다.
6. D6: 범위를 나눌지(S6 분리) Tier L로 올릴지 리드가 정한다.
7. D7·D8은 고칠지 말지 작성자 재량이다.

재감사는 위 결함 목록에 한정해 진행한다. D1이 해결되고 새 결함이 생기지 않으면 PASS 판정이 가능하다. 현재 점수 0.86은 Tier M 기준 0.80을 넘는다. D6에서 Tier L로 올리면 기준은 0.85다.

---

# SPEC Review Report: SPEC-CONSOLE-002 (2차)
Iteration: 2/3
Verdict: FAIL
Overall Score: 0.91

> Reasoning context ignored per M1 Context Isolation. 판정 근거는 개정본(HEAD 0263e838, spec 0.2.0)의 spec.md·plan.md·acceptance.md·progress.md와 워크트리 코드뿐이다.
> 재감사 범위: 1차 결함 CS2-PA-D1~D8의 해결 여부 확인과, 개정으로 바뀐 부분(`git diff 9ef773c0 0263e838`)에서 새로 생긴 결함 찾기.
> 교차 모델 감사 백엔드: 호출하지 않음(이 감사 세션에 MCP 감사 도구가 노출되지 않음). Claude 단독 판정.

1차에서 막는 결함이던 D1은 해결됐다. 이번에는 실행해서 확인했다. D2·D3·D4·D5·D7·D8도 모두 반영됐다. 남은 것은 D6(Tier M 상한 초과) 하나다. 개정본은 이를 고치지 않고 "리드 결정 대기"로만 적어 두었다(plan.md:L3, progress.md:L15). 그래서 frontmatter의 `tier: M`(spec.md:L14)을 SPEC 자신의 본문이 부정하는 상태가 됐다. Tier는 산출물 구성, 진행 경로(Tier M은 main 직접, Tier L은 PR), PASS 기준을 정한다. 또 상한 초과 시 "Tier를 올리거나 나누라"는 규칙은 HARD 규칙이다(`spec-workflow.md` § SPEC Complexity Tier, L152). 재감사 계약상 이전 회차 결함이 풀리지 않으면 FAIL이다. 그래서 이번 FAIL 사유는 이것 하나다. 나머지 판정 기준은 모두 통과했다.

## Must-Pass Results

- [PASS] MP-1 REQ 번호 일관성: `grep -c '^\*\*REQ-CS2-' spec.md` → 21(REQ-CS2-001~021, spec.md:L55~L105). AC는 `grep -c '^\*\*AC-CS2-'` → 22이고, `uniq -d` 결과 중복 0건이다. 개정 과정에서 번호를 새로 붙이거나 뺀 곳은 없다.
- [PASS] MP-2 GEARS 형식(요구사항 층 기준): 고쳐진 REQ-CS2-006(L65)·009(L75)·014(L87)도 Event 패턴("When the user selects 링크 after 공유 계정, the form shall restore…", "When the browser blocks the new tab, the console shall show…")과 Ubiquitous 패턴을 지킨다. AC는 검증 층이라 Given-When-Then으로 따로 채점했다.
- [PASS] MP-3 frontmatter: 12개 정식 필드가 모두 있다(spec.md:L2~L13). `version: "0.2.0"`으로 올렸고 HISTORY 0.2.0 행(L25)과 맞는다.
- [N/A] MP-4 언어 중립성: Next.js/TypeScript 단일 저장소 SPEC이다.
- [PASS] MP-5 D7 교차 SPEC: 참조는 SPEC-CONSOLE-001뿐이다. `grep '^status:' ../SPEC-CONSOLE-001/spec.md` → `status: in-progress`. BLOCKING 없음.
- [PASS] MP-6 D8: `grep -rn syscall` 0건이라 자동 PASS다.
- [PASS] MP-7 확인 필요 표식: `grep -rn 'NEEDS CLARIFICATION'` 0건이다. research.md는 없다(Tier M 기준).

## Category Scores (0.0-1.0, rubric-anchored)

| Dimension | Score | Rubric Band | Evidence |
|-----------|-------|-------------|----------|
| Clarity | 0.90 | 0.75~1.0 | 1차의 설계·요구사항 어긋남 세 곳이 맞춰졌다. D2는 plan.md CS2-D8과 §2.4(`window.open('', '_blank')` → `w.opener = null` → `w.location.replace`), D5는 §2.5 `.root, .root *`, D4는 CS2-D10과 acceptance §8에서 해결됐다. 남은 흠: plan.md:L172의 "design.md §6.2"가 어느 SPEC의 design.md인지 밝히지 않는다(R2-D1) |
| Completeness | 0.85 | 0.75~1.0 | 필수 절이 모두 있고 D3(삭제 확인)과 D7(왕복 복원)이 요구사항으로 들어갔다(REQ-CS2-009, L75). 감점: Tier 분류가 본문과 어긋난다(D6). Tier L이 되면 design.md·research.md가 필요하다 |
| Testability | 0.90 | 0.75~1.0 | D8 해결. AC-CS2-018은 `sessionStorage.clear()` 절차로, AC-CS2-007 Safari 항목은 ±16 픽셀 기준으로 바꿨다. 남은 흠: AC-CS2-014는 Safari에서도 새 탭이 열려야 한다고 단정한다(R2-D2) |
| Traceability | 1.00 | 1.0 | REQ 21개가 모두 AC에 걸린다(spec.md §6, L144~L167). D3는 새 AC 대신 AC-CS2-009 안의 검증 줄로 들어갔고, AC-CS2-009의 연결 대상은 REQ-CS2-009로 맞다. 고아 AC 없음 |

## Regression Check (1차 결함)

- D1 (스크롤바 선택자 순수성): **RESOLVED**. plan.md §2.5(L170~L174)가 `:global(html):has(.root)`와 `.root, .root *`로 바뀌었다. 직접 실행해 확인했다. Next에 번들된 `postcss-modules-local-by-default`(`mode: 'pure'`)로 현재 `console.module.css` 전체와 계획된 규칙 8개(`:global(html):has(.root)`, 그 `::-webkit-scrollbar`·`-track`·`-thumb`·`-thumb:hover`, `.root, .root *`, `.root *::-webkit-scrollbar`, `.root *::-webkit-scrollbar-thumb:hover`)를 함께 처리했다. 결과는 `OK`였고 `html:has(:local(.root)) …`, `:local(.root), :local(.root) * …`로 변환됐다. `.root`가 실제로 쓰이는지도 확인했다. `ConsoleApp.tsx:L443, L575`, `login/LoginScreen.tsx:L59`에서 `s.root`를 쓴다. 대화상자는 루트 안에 그려진다(`Dialog.tsx:L9` 주석 "rendered inside the console root … no portal"). AC-CS2-007에 순수성 검사 줄도 추가됐다(acceptance.md:L86).
- D2 (`noopener` 판정 불가): **RESOLVED**. REQ-CS2-014(L87)에 "열리면 링크를 보이지 않는다"와 리퍼러 금지가 들어갔다. plan.md CS2-D8과 §2.4는 `noopener` 없이 연 뒤 `opener`를 끊는다. 리퍼러 정책이 적용되는지는 추정이라고 밝히고, AC-CS2-014에서 `document.referrer === ''`로 확인하도록 했다. 정직하게 처리했다.
- D3 (링크 전환 시 비밀값 삭제): **RESOLVED**. REQ-CS2-009에 저장 전 확인을 요구하고, 취소하면 요청 0건으로 정했다. plan.md CS2-D11과 §2.3에 기존 서버 동작(삭제)을 바꾸지 않는 이유가 있다. AC-CS2-009(acceptance.md:L105~L106)가 취소 시 PATCH 0건과 `console-secrets` 보존, 확인 시 PATCH 1건, 계정 정보가 없을 때 대화상자 없음을 확인한다. 판정 근거인 `hasLoginId`·`hasPassword`는 이미 항목 모델에 있다(`src/lib/console/types.ts:L158~L159`).
- D4 (bootstrap `me` 엄격 비교): **RESOLVED**. 값을 최상위 `prefs.autofillGuideAck`로 옮겼다(plan.md CS2-D10, §2.2). `bootstrap.test.ts:L33`은 `r.json.me`만 `toEqual`로 비교하고, 응답 전체를 엄격 비교하는 테스트는 없다(`grep 'json).toEqual'` 결과는 items.test.ts:L263의 자격증명 값 비교 1건뿐). 그래서 새 최상위 키가 기존 테스트를 깨지 않는다. acceptance AC-CS2-006·§8과 plan M1이 서로 맞는다.
- D5 (안쪽 영역 `scrollbar-width`): **RESOLVED**. plan §2.5에 `.root, .root *`가 들어갔고(순수성 통과는 D1에서 확인), AC-CS2-007(L83)이 안쪽 요소의 `scrollbarWidth: thin`을 본다. 공용 규칙은 `globals.css:L142~L162` `@layer base` 안의 `html`과 전체 `::-webkit-scrollbar`다. 콘솔 규칙은 층 밖에 있으므로 우선하고, 색은 `html`에서 상속된다. 설계와 맞다.
- D6 (Tier M 상한 초과): **UNRESOLVED**. 요구사항 21 > 16, 인수 기준 22 > 16(`spec-workflow.md` L146~L152), 바뀌는 소스 파일 22개 > 15개다. 개정본은 초과를 인정하는 문장만 넣었다(plan.md:L3, progress.md:L15). 아래 D6 항목 참고.
- D7 (종류 왕복 시 원래 값 소실): **RESOLVED**. REQ-CS2-009, plan CS2-D12와 §2.3(`applyKind(form, kind, linkMemory)`), AC-CS2-009의 순수 함수 사례 4개(L100~L103)가 서로 맞는다. 공유 계정으로 열린 항목이 링크로 바뀌면 `link`·`public`이 되는 경우도 REQ와 AC 사이에서 어긋나지 않는다.
- D8 (판정 절차 모호): **RESOLVED**. AC-CS2-018(L173)은 `sessionStorage.clear()` 뒤 새로고침으로, AC-CS2-007(L84)은 "스크롤 막대 보기: 항상" 조건과 채널별 ±16 수치 기준으로 바꿨다.

## 개정분 점검 (범위·보안·스크롤바·SPEC-CONSOLE-001 정합·위생)

- 범위 S1~S6: 1차 대조표 그대로 모두 다룬다. 개정으로 빠진 범위는 없다. 소유자가 이어 보낸 요청("자동 입력 끄기 안내 팝업과 설정 화면 안내")은 계속 S6 = REQ-CS2-006, 018~020에 있다. 따라서 D6를 "S6 분리"로 풀면 오너가 요청한 기능이 다른 SPEC으로 밀린다. 이 점은 리드가 판단할 때 고려해야 한다.
- S4 보안: 개정이 서버 판정 순서(plan §2.2)를 건드리지 않았다. D3 해결책은 화면에서만 막고 서버의 비밀 기록 삭제 규칙(`items/[id]/route.ts:L24~L25`)은 그대로 둔다. SPEC-CONSOLE-001 동작과 맞다. 확인을 우회한 PATCH가 오면 기존대로 지워진다. 이것은 SPEC-CONSOLE-001이 정한 서버 계약이라 새 위험이 아니다.
- 스크롤바 누출: `.root`는 해시된 지역 클래스다. 공개 사이트와 `/admin`에는 이 클래스가 없으므로 `html:has(:local(.root))`가 걸리지 않는다. 공용 파일 불변 확인(AC-CS2-008)도 그대로다.
- SPEC-CONSOLE-001 정합: `me` 모양을 유지하고(CS2-D10), 기존 복사 함수(`ConsoleApp.tsx:L186~L209`, `navigator.clipboard` 실패 시 투명하고 `aria-hidden`인 textarea로 대체)를 그대로 쓸 수 있다. REQ-CS2-020의 "보이지 않고, 보조 기술에서 숨기고, 같은 작업 안에서 제거"와도 맞는다.
- 공개 저장소 위생: 네 문서의 email 표기는 모두 `@try-n.com` 지어낸 주소다(`grep -noE '[A-Za-z0-9._-]+@…' *.md | grep -v try-n.com` 0건). 개정분에 직원 이름, 내부 id, 내부 주소가 없다.

## Defects Found (structured defect-list)

D6. CS2-PA-D6 (이월) — spec.md:L14 `tier: M` vs plan.md:L3, progress.md:L15 — 요구사항 21개, 인수 기준 22개, 소스 파일 22개로 Tier M 상한(16 / 16 / 5~15)을 넘는다. 그런데도 frontmatter는 M으로 남아 있다. 1차 이후 결정이 내려지지 않았다. 이 SPEC의 본문이 스스로 Tier M이 아니라고 적고 있어 분류가 내부적으로 모순된다. Tier가 진행 경로(A/B), 산출물 구성, PASS 기준을 정하므로 이 상태로는 run 단계를 어떤 규칙으로 진행할지 정해지지 않는다. 이전 회차에서 풀리지 않은 결함이다. — Severity: major — Class: blocking — Required fix: 리드가 결정하고 문서에 반영한다. (a) **Tier L 승격**: spec.md `tier: L`, design.md를 추가해 plan.md §1~§2 설계를 옮긴다. research.md도 추가해 코드 조사 근거를 담는다. 1차에서 확인한 `credential/route.ts` 판정 순서, `globals.css` 층 구조, CSS 모듈 순수성 실행 결과 등이 들어가면 된다. plan.md:L3의 "리드 결정 대기" 문장과 progress.md를 고친다. PASS 기준은 0.85이고 이번 점수 0.91은 기준을 넘는다. 진행 경로는 Route B(PR)가 된다. (b) **S6 분리**: REQ-CS2-006, 018~020과 AC-CS2-006, 018~020을 별도 SPEC으로 옮겨 각 16개 이하로 줄인다. 이 경우 오너가 이어 요청한 기능이 뒤로 밀린다. 어느 쪽이든 3차 재감사는 이 결함과, (a)를 고르면 새로 생기는 design.md·research.md에 한정한다.

R2-D1. CS2-PA-R2-D1 — plan.md:L172 — "(design.md §6.2, 포털 없음)"은 SPEC-CONSOLE-002에 design.md가 없는 지금, SPEC-CONSOLE-001의 design.md를 가리키는 것으로 읽힌다. 그런데 어느 SPEC의 문서인지 밝히지 않았다. D6를 (a)로 풀어 이 SPEC에 design.md가 생기면 같은 이름의 다른 문서를 가리키게 된다. — Severity: minor — Class: optional — Required fix: "SPEC-CONSOLE-001 design.md §6.2"로 적는다.

R2-D2. CS2-PA-R2-D2 — acceptance.md:L142~L144 (AC-CS2-014) — Then 절이 "Chrome과 Safari에서 … 새 탭이 로그인 주소로 열린다"고 단정한다. 그런데 plan CS2-D8대로라면 새 탭은 아이디 복사 요청(`await`)이 끝난 뒤에 열린다. 비동기 요청 뒤의 `window.open`은 브라우저의 사용자 동작 판정에 따라 막힐 수 있고, plan.md 위험표도 이를 위험으로 적어 두었다. Safari가 이 경우를 막는다면 구현이 SPEC대로 링크 대체 경로를 보여도 이 AC는 FAIL이 된다. Safari 동작은 이번 감사에서 실행해 확인하지 않았다. 따라서 이 항목은 가설이다. — Severity: minor — Class: optional — Required fix: Safari 줄을 "새 탭이 열리거나, 막히면 토스트 안에 로그인 주소 링크가 보인다(어느 쪽이었는지 진행 기록에 남긴다)"로 바꾼다. Chrome 기본 설정에서 새 탭이 열린다는 판정은 그대로 둔다.

## Recommendation

1. **D6(막는 결함, 리드 결정)**: Tier L로 올릴지, S6를 나눌지 정한다. 오너가 S6 기능을 이번 작업에 넣기를 원하는 흐름이라면 (a) Tier L 승격이 자연스럽다. 이 경우 `tier: L`, design.md(plan §1~§2 이전), research.md(1차·2차 감사에서 실행으로 확인한 근거 포함)를 추가하고 plan.md:L3와 progress.md를 고친다.
2. R2-D1·R2-D2는 고칠지 말지 작성자 재량이다. 고치면 D6 개정에 함께 넣으면 된다.
3. 3차 재감사는 D6 해결 여부와 새로 생기는 문서(design.md·research.md)에 한정한다. D6만 풀리고 새 결함이 없으면 PASS다. 현재 점수 0.91은 Tier L 기준 0.85도 넘는다.
