# SPEC-CONSOLE-002 — 구현 계획 (plan.md)

Tier L이다(2026-11-15 리드 결정, plan-audit CS2-PA-D6 (a)). 바뀌는 소스 파일은 §3 기준 22개(M1 10개, M2 12개)이고 요구사항 21개·인수 기준 22개라 Tier M 상한(파일 5~15, 요구사항·인수 기준 각 16)을 넘는다. 오너가 자동 입력 끄기 안내(S6)를 이번 작업에 넣기를 바라므로 범위를 나누지 않고 Tier를 올렸다. 그래서 산출물은 spec·plan·acceptance·design·research 5개이고, plan-audit PASS 기준은 0.85, 진행 경로는 Route B(PR 경로)다. PR 생성·머지·배포는 사람 승인 후에만 한다. 결정과 설계는 design.md, 코드 조사 근거는 research.md에 있다. 기존 모듈 위에 얹는 변경이다. 개발 방식: `quality.yaml` `development_mode` 설정을 따른다. 기존 자격증명 라우트·양식은 SPEC-CONSOLE-001 테스트가 이미 고정하고 있으므로, 바뀌는 동작마다 실패하는 테스트를 먼저 쓴다. 시간 예측은 적지 않는다.

순서는 바뀔 가능성이 큰 결정(데이터 모델, API 계약, 양식 흐름)을 앞에 두고 스타일·문구 같은 기계적 작업을 뒤에 둔다.

**0.5.0 추가분**: 오너 후속 요청 3건과 M2 감사의 작은 결함 2건을 M3·M4로 더했다(spec.md §1.2). 요구사항은 38개(REQ-CS2-022~038 추가), 인수 기준은 40개(AC-CS2-023~040 추가)가 됐다. Tier L, Route B는 그대로다. M1·M2는 로컬 커밋(`a922db30`, `4085f34d`)까지 됐고 운영 반영 전이다. M3·M4는 같은 브랜치에서 이어서 하고, 배포는 M1~M4를 묶어 사람 승인 뒤 한 번에 한다.

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

### M3 — 보기 전환·영문 모드·작은 수정 (우선순위 높음, 0.5.0) — REQ-CS2-022~029

마일스톤 안의 순서도 되돌리기 어려운 것부터: 보기 상태의 모양과 저장 키(여러 화면이 함께 씀) → 영어 화면 양식 규칙(저장 본문이 바뀜) → 이름 표시 → 문구·스타일.

- `src/lib/console/ui-model.ts` — `ViewMode`, `VIEW_STORAGE_KEY = 'zoel-console:view'`, `resolveViewMode(stored, width)`, `personName(email, fallbackName, people, lang)`, 영어 화면 저장 본문 도우미(한국어 제목이 비면 영문 제목 복사, design.md §2.9)
- `src/app/console/ConsoleApp.tsx`, `src/app/console/app-context.ts` — `viewMode`·`setViewMode`를 AppContext로(첫 목록 렌더 전에 정함), 관리자 동작 `channels` 자리(M4에서 씀)
- `src/app/console/ViewToggle.tsx` (신규) — radiogroup 컨트롤. 키 처리는 종류 선택(M2, `ItemForm.tsx` L56)과 같은 방식이고, 두 곳이 같아지면 작은 공용 도우미로 뺀다
- `src/app/console/ItemCard.tsx` (신규) — 카드 한 장(design.md §2.8)
- `src/app/console/ListView.tsx` — 툴바에 컨트롤, 방식에 따라 행/카드, 행 둘째 줄을 설명(없으면 호스트)으로
- `src/app/console/HomeView.tsx` — 최근 수정 목록을 펼침 안으로 옮기고 같은 행/카드 사용(M4의 채널 구역 자리를 만든다)
- `src/app/console/ItemForm.tsx` — 영어 화면 주 입력·"Korean text" 묶음·placeholder·저장 규칙, 담당자 처음 값과 제안 목록의 영문 이름
- `src/app/console/AccountMenu.tsx` — 계정 칩·아바타 글자에 `personName`
- `src/lib/console/i18n.ts` — 새 키(보기 방식, Korean text 묶음 등), `sharedDesc`·`accNote.shared-credential` 한·영 문구(REQ-CS2-029)
- `src/app/console/console.module.css` — 카드 격자·같은 높이·두 줄 자르기, 보기 컨트롤, `.guideSteps`에 `list-style: decimal`(REQ-CS2-028). 고정 hex만
- 테스트(실패를 먼저 보고 구현): `src/lib/console/__tests__/view-mode.test.ts`(AC-CS2-025), `src/app/console/__tests__/list-views.test.ts`(정적 렌더, AC-CS2-023·024), `list-views-dom.test.ts`(jsdom 화살표·저장·첫 렌더, AC-CS2-023·025), `item-form-en.test.ts`·`item-form-en-dom.test.ts`(AC-CS2-026), `names-en.test.ts`(AC-CS2-027), `no-hangul-literals.test.ts`(AC-CS2-028), `i18n.test.ts`에 문구 판정 추가(AC-CS2-030), `console-guide-style` 판정(AC-CS2-029 — 기존 `console-scrollbar-style.test.ts`처럼 CSS 텍스트 검사)
- 바뀌는 소스 파일 11개(신규 2), 테스트 파일 8개 안팎

### M4 — 채널 새 소식 (우선순위 높음, 0.5.0) — REQ-CS2-030~038

마일스톤 안의 순서: 채널 설정 모양과 저장 경로(데이터 계약) → 바깥 요청 방어(보안 경계) → 파서 → 모으기·캐시 → 썸네일 경로 → 화면. 유튜브 피드는 2026-11-15 현재 404이므로(research.md §6.1) 실패 채널의 링크 타일(REQ-CS2-035)이 처음부터 실제로 쓰이는 경로라는 점을 감안해 그 부분을 화면 작업 앞쪽에 둔다.

- `src/lib/console/types.ts` — `CONSOLE_CHANNEL_KINDS`, `ConsoleChannel`, `ConsoleSettings.channels?`, `MAX_CHANNELS`
- `src/lib/console/channels.ts` (신규) — `validateChannels`, `channelHome`, `readChannels`
- `src/app/api/console/channels/route.ts` (신규) — GET·PUT, 관리자 전용, `{ ...current, channels }` 쓰기, 감사 `settings.update`
- `src/lib/console/feed-fetch.ts` (신규) — `fetchAllowed`(design.md §2.12), `src/lib/ssrf.ts`의 `assertPublicHttpUrl` 재사용
- `src/lib/console/feed-parse.ts` (신규) — `parseFeed`(design.md §2.13)
- `src/lib/console/feed.ts` (신규) — 채널별 가져오기, 자사 블로그(`readLatestPublishedPostsSafe(6)`), 인스타그램, 캐시, 썸네일 주소 만들기, `thumbAllowed(host, channels)`
- `src/lib/db.ts` — 공개 Blob 호스트를 돌려주는 작은 내보내기 함수 하나(design.md CS2-D28). 기존 동작은 바꾸지 않는다
- `src/app/api/console/feed/route.ts` (신규) — GET, 세션 필요, `Cache-Control: private, max-age=1800`
- `src/app/api/console/feed/thumb/route.ts` (신규) — GET, 세션 필요, 허용 목록·형식·크기 검사, 기본 그림
- `src/app/console/ChannelFeed.tsx` (신규) — 칩·타일·링크 타일·자리 표시·빈 상태·"최근 수정한 카드 보기" 펼침
- `src/app/console/HomeView.tsx` — 최근 수정 구역 자리에 `ChannelFeed`
- `src/app/console/AdminDialogs.tsx` — `ChannelsDialog`
- `src/app/console/AccountMenu.tsx`, `src/app/console/ConsoleApp.tsx` — 관리자 도구 "채널 관리", 대화상자 연결
- `src/app/console/api.ts` — `fetchFeed`, `fetchChannels`, `saveChannels`
- `src/lib/console/ui-model.ts` — `badgeTextColor(hex)`(대비 4.5:1, REQ-CS2-038)
- `src/lib/console/i18n.ts`, `src/app/console/console.module.css` — 새 문구 한·영, 타일 격자(16:9, 두 줄 자르기, 375px 두 열), 칩 줄. 고정 hex만
- 테스트 고정 데이터: `src/lib/console/__tests__/fixtures/feeds/{youtube-atom,naver-rss,rss2-generic,atom-generic,hostile}.xml` — research.md §6 구조를 지어낸 값으로(`UCfake…`, `fake…` id, `example.com`·`example.org`)
- 테스트: `channels.test.ts`·`src/app/api/console/__tests__/channels.test.ts`(AC-CS2-031), `feed.test.ts`(AC-CS2-032·033·036), `feed-fetch.test.ts`(AC-CS2-034), `feed-parse.test.ts`(AC-CS2-035), `src/app/api/console/__tests__/feed-thumb.test.ts`(AC-CS2-037), `src/app/console/__tests__/channel-feed.test.ts`·`channel-feed-dom.test.ts`(AC-CS2-038), `badge-color.test.ts`(AC-CS2-039). 모든 테스트는 바깥 네트워크에 요청하지 않는다(가짜 fetch·DNS 주입)
- 바뀌는 소스 파일 17개(신규 8), 테스트 파일 9개 안팎

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
| (0.5.0) 유튜브 채널 피드가 2026-11-15 현재 404 | 유튜브 채널에 썸네일이 나오지 않음 | 실패 채널은 링크 타일(REQ-CS2-035). 피드가 다시 응답하면 코드 변경 없이 썸네일이 나온다. 유료 API·API 키 방식은 쓰지 않는다(spec.md §5). 운영에서도 계속 404면 대안을 오너와 다시 정한다 |
| (0.5.0) 썸네일 경로가 바깥 서버를 대신 부르는 통로가 됨(SSRF) | 내부 주소·메타데이터 노출 | 세션 필요, https 전용, 허용 목록, IP 문자열·사설 대역 거부(기존 `assertPublicHttpUrl`), 리다이렉트 한 번, 크기 상한, SVG 거부(design.md §2.12·§2.14). AC-CS2-034·037에 우회 주소 표 |
| (0.5.0) 피드 XML이 크거나 악의적임 | 서버 메모리·CPU 소모, 엔티티 폭증 | 1MB 상한, 5초 시간 제한, 문서형 선언 무시(엔티티 미해석). AC-CS2-035 적대적 입력 |
| (0.5.0) 서버 메모리 캐시가 인스턴스마다 따로 | 첫 요청이 느림, 바깥 피드에 요청이 몰릴 수 있음 | 실패도 5분 캐시. 직원 수가 적어 요청 수가 작다. 예약 작업·별도 저장소는 범위 밖 |
| (0.5.0) 카드 보기 도입으로 SPEC-CONSOLE-001 목록 테스트가 깨짐 | 회귀 | 목록 방식의 행 구조는 유지하고(둘째 줄 내용만 바뀜), 바뀌는 판정은 진행 기록에 적는다. 첫 렌더 기본값이 넓은 화면에서 카드이므로, 기존 행 테스트는 방식을 "목록"으로 정해 렌더하게 고친다(기대값은 그대로) |
| (0.5.0) 영어 화면 저장 규칙이 한국어 값을 지움 | 한국어 메모·링크 이름 손실 | 영어 화면에서는 "한국어를 고치면 영문을 비우는" 규칙을 끈다(design.md §2.9). AC-CS2-026에 한국어 값 보존 판정 |
| (0.5.0) 채널 설정과 팀 필수 저장이 같은 문서를 동시에 씀 | 한쪽 변경이 사라질 수 있음 | 두 경로 모두 새로 읽은 문서에 자기 칸만 바꿔 쓴다. 관리자 몇 명이 드물게 쓰는 문서라 남는 위험은 작다. 사라지면 다시 저장하면 된다 |

## 5. 실행 전 확인할 가정

오너가 범위를 리드에게 맡겼으므로 아래는 리드 판단으로 진행하고, Implementation Kickoff에서 한 번에 보여 준다.

1. "메모"는 공유 대상 모두가 보는 `description`이다(CS2-D1). 담당자만 보는 메모가 필요하면 "더 보기"의 확인할 일을 쓴다.
2. 숨기기 예외는 관리자와 담당자다(CS2-D2). 팀장 같은 별도 역할은 없다.
3. "나중에"를 누르면 다음 방문(새 브라우저 세션)에 다시 뜬다(CS2-D6).
4. 안내 확인 기록은 서버에 사람별로 남는다(CS2-D5).

## 6. 완료 조건

- acceptance.md의 40개 기준(M1·M2 22개, M3·M4 18개)이 모두 통과하고 근거가 progress.md §E.2에 남는다.
- `npx tsc --noEmit`, 바뀐 경로의 `npx eslint`, 콘솔 관련 테스트(`src/lib/console`, `src/app/api/console`, `src/app/console`, 콜백 테스트)가 통과한다. 전체 스위트는 CI에 맡긴다(부하가 36 미만일 때만 로컬 전체 실행).
- 공개 저장소 점검: 새 파일에 비밀값 리터럴, 직원 이름, 실제 email, 내부 id가 없다.
- (0.5.0) 콘솔 코드와 테스트에 실제 채널 id·블로그 id·피드 주소가 없다(AC-CS2-040). 로컬 확인 데이터(`data/db/console-*.json`)는 커밋하지 않는다.
- (0.5.0) 구현 뒤 sync-auditor 관문을 거친다(progress.md §E.1의 추가분 수용 기록 참고).
