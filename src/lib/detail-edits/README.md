# 상세페이지 시안 편집기 — 서버 쪽 (zoellife)

시안 사이트(`daeracheon-detail-concepts.vercel.app`, 별도 정적 프로젝트)의 11개 상세페이지를 관리자가 화면에서 바로 고치고,
공개 시안에는 "편집 문서(JSON)"를 덧입혀 보여 주는 기능의 **서버 절반**이다. 브라우저 쪽(`public/detail-edit/apply.js`, `editor.js`)은 다른 폴더에 있다.

## 구조

1. 저장: 기존 `src/lib/db.ts` 의 단일 객체 API 만 쓴다(새 Blob 스토어·토큰·환경변수 없음). 시안마다 파일 두 개:
   `detail-edits__<slug>`(현재 문서), `detail-edits-history__<slug>`(이력, 최대 50개). 로컬(Blob 토큰 없음)에서는 `data/db/*.json` 으로 떨어진다.
2. 공개 읽기 `GET /api/detail-edits/<slug>` 는 인증이 없다. 시안 사이트가 `apply.js` 로 이 문서를 읽어 화면에 적용한다. 실패하면 원본 그대로 보인다(fail-open).
3. 관리자 쓰기 `/api/admin/detail-edits/**` 는 미들웨어(관리자 쿠키)와 핸들러(세션 재검증 + Origin=Host 검사) 이중으로 막는다.
4. 저장 전에 `html` 은 서버에서 다시 정제한다(`sanitize.ts`, DOMPurify + 속성 값 재검사, 고정점까지 반복). 클라이언트 정제를 믿지 않는다.
5. 편집 화면 `GET /admin/detail-concepts/edit/<slug>` 는 시안 HTML 을 서버에서 가져와(`edit-page.ts`) 스크립트·`on*`·`<base>`·meta refresh·뷰어 스니펫을 걷어 내고,
   `<base href=시안오리진>` 과 편집기 스크립트 2개(zoellife 절대 URL)를 넣은 뒤 전용 CSP 와 함께 **zoellife 오리진**으로 돌려준다. 그래서 관리자 쿠키가 편집기 API 호출에 같은 오리진으로 실린다.
6. 목록 `/admin/detail-concepts`(대시보드 그룹)는 11개 시안의 제목·부제·버전·마지막 수정·건수와 "편집"/"공개 보기" 링크를 보여 준다. 사이드바 한 줄(`AdminSidebar.tsx`)로 연결한다.

파일: `schema.ts`(zod 스키마·한도·src 규칙), `sanitize.ts`, `origin.ts`(시안 오리진·CORS·CSRF), `pages.ts`(허용 슬러그 11개·제목), `store.ts`(저장·이력·낙관적 동시성), `edit-page.ts`(업스트림 fetch·변환·CSP), `http.ts`(라우트 공용).

## 데이터 모델 (schema 1)

```json
{ "schema": 1, "page": "s7_black", "version": 7, "updatedAt": "ISO", "updatedBy": "관리자 이메일(공개 응답엔 없음)",
  "texts":  [{ "k": "t:ab12cd:0", "o": "원문 발췌", "html": "정제된 innerHTML", "fs": 28, "color": "#aa3322", "run": 0 }],
  "images": [{ "k": "i:ab12cd:0", "o": "원본 src", "src": "새 주소", "alt": "새 대체 텍스트" }],
  "bgs":    [{ "k": "b:ab12cd:0", "o": "원본 url", "src": "새 주소" }],
  "hidden": [{ "k": "s:ab12cd:0", "o": "섹션 글 발췌" }],
  "layout": { "sequence": [{ "k": "s:ab12cd:0" }, { "c": "c1" }], "clones": [{ "id": "c1", "of": "s:ab12cd:0" }],
              "gaps": [{ "k": "s:ab12cd:0", "top": 24, "bottom": null }], "secbg": [{ "k": "c1", "color": "#102030" }] } }
```

- `layout` 은 선택 항목이다(아래 "구역 배치"). 없는 문서(2차 웨이브까지의 저장본)는 그대로 유효하다.
- 키(`k`)는 클라이언트 코어가 원본 DOM 에서 계산한 값이라 서버에겐 불투명하다(형식 `^(c[0-9]{1,3}!)?(t|i|b|s):[0-9a-z]{4,16}:[0-9]{1,4}$` 과 배열 안 중복만 본다).
  `cN!` 접두는 복제본 안의 편집이다 — 접두 키는 `layout.clones` 에 그 복제본이 있어야 저장된다.
- 한도: texts 1500 · images 200 · bgs 50 · hidden 100 · html 8000자 · alt 300자 · 문서 JSON 400KB. 알 수 없는 속성은 모두 거절(`.strict()`).
- `src` 허용: `https://*.public.blob.vercel-storage.com/uploads/detail-concepts/<파일>`, 시안 오리진의 절대 URL(원본 자산으로 되돌리기), 비운영에서만 루트 상대 `/uploads/detail-concepts/<파일>`. `javascript:`·`data:`·`//host` 는 거절.
- `html` 허용 태그 `b strong i em u s small mark sup sub br span a code abbr`, 속성 `class`·`style`(허용 속성만)·`a` 의 `href`(http/https/mailto/tel)·`target`.
  `a` 에는 `rel="noopener noreferrer"` 를 강제한다. **계약 보정**: style 허용 속성에 *색 하나만 받는* `background` 단축 속성을 더했다(실제 시안 s2_check 표가 `style="background:#85858C"` 를 쓴다 — 빼면 정제가 원본 서식을 깎는다).
- 이력 항목: `{ version, updatedAt, updatedBy, note, doc }`. 저장할 때마다 한 줄 추가, 50개를 넘으면 오래된 것부터 버린다(용량 8MB 안전망도 있음). 버전 번호는 계속 증가한다.

### 구역 배치 (`layout`, 계약 부록 A1)

구역(section)의 순서·위아래 간격·복제·배경색을 "원본 위에 덧입히는" 선택 항목이다. 서버는 의미를 해석하지 않고 **모양과 짝**만 검사한다(어긋나면 400 `INVALID`, `issues[].path` 가 `doc.layout.…` 로 항목을 가리킨다).

| 멤버 | 항목 | 규칙 |
|---|---|---|
| `sequence` | `{ k }` 원본 구역 키(`s:…`, 접두 없음) 또는 `{ c }` 복제본 id — 정확히 하나 | 최대 200, 같은 항목 두 번 금지, `c` 는 `clones` 에 있어야 함 |
| `clones` | `{ id, of }` — `id` 는 `^c[0-9]{1,3}$`, `of` 는 **원본** 구역 키(복제본의 복제본 금지) | 최대 40, id 중복 금지, 모든 복제본이 `sequence` 에 정확히 한 번 있어야 함 |
| `gaps` | `{ k, top?, bottom? }` — 0..400 정수 px 또는 `null`(해제) | 최대 200, 같은 `k` 두 번 금지 |
| `secbg` | `{ k, color }` — `^#[0-9a-fA-F]{6}$` | 최대 200, 같은 `k` 두 번 금지 |

- `gaps`·`secbg` 의 `k` 는 원본 구역 키 또는 **존재하는** 복제본 id. 없는 복제본을 가리키면 거절한다(계약에 명시된 규칙은 아니고 같은 맥락의 해석 — 복제본 id 가 재사용될 때 남은 값이 엉뚱한 복제본에 붙는 것을 막는다).
- 멤버는 모두 선택이고 빈 배열도 유효하다. `sequence` 에 없는 원본 구역은 뷰어가 제자리에 둔다(서버는 모른다).
- 한도 안에서도 문서 전체(`layout` 포함)가 400KB 를 넘으면 413 `TOO_LARGE`.
- **하위 호환**: `layout` 을 보내지 않으면 저장 JSON·이력·공개 응답에 `layout` 키가 생기지 않는다(2차 웨이브와 바이트 단위로 같다). 저장은 문서 통째 교체라 `layout` 없이 저장하면 이전 `layout` 은 사라진다.
  보낸 `layout` 은 있는 그대로 저장한다(빈 배열도 정규화하지 않음) — 클라이언트가 보낸 것과 되읽은 것이 같다.
- 이력·복원·초기화는 그대로: 복원은 그 버전의 `layout` 까지 새 버전으로 쓰고, "원본으로 초기화" 는 `texts·images·bgs·hidden` 과 `layout` 의 모든 배열을 비워 보낸다(`layout` 을 아예 생략해도 된다).
- 이력 목록의 `counts` 는 `{ texts, images, bgs, hidden, layout }` — `layout` 은 `sequence + clones + gaps + secbg` 배열 길이의 합(없으면 0). 목록 화면은 합이 0 보다 클 때만 "배치 N" 을 덧붙인다.

## API

| 메서드·경로 | 인증 | 설명 |
|---|---|---|
| `GET /api/detail-edits/<slug>` | 없음 | 공개 문서(`updatedBy` 없음). 없으면 빈 문서(version 0). 시안 오리진에만 CORS. 저장소 장애 시 200 + 빈 문서 + `X-DE-Degraded: 1` + `no-store`. 평소 `s-maxage=15, stale-while-revalidate=60` |
| `OPTIONS /api/detail-edits/<slug>` | 없음 | 204, `GET, OPTIONS`, `Max-Age 600` |
| `GET /api/admin/detail-edits/<slug>` | 관리자 | 현재 문서(`updatedBy` 포함) |
| `PUT /api/admin/detail-edits/<slug>` | 관리자 + Origin=Host | `{ baseVersion, note?, doc }`(`doc` = texts·images·bgs·hidden + 선택 `layout`) → 200 `{ version, updatedAt }` / 409 `VERSION_CONFLICT`(+`currentVersion`) / 400 `INVALID`(+`issues`) / 413 `TOO_LARGE` / 503 |
| `GET /api/admin/detail-edits/<slug>/history` | 관리자 | 최신순 `versions[]`(문서 본문 제외, `counts` 에 `layout` 포함). `?version=N` 은 `entry`(문서 포함) 또는 404 |
| `POST /api/admin/detail-edits/<slug>/history` | 관리자 + Origin=Host | `{ version, baseVersion }` 복원 — 해당 버전과 같은 내용을 **새 버전**으로 저장 |
| `GET /admin/detail-concepts/edit/<slug>` | 관리자 | 편집 페이지(HTML). 업스트림이 200·text/html·2MB 이하가 아니면 502 안내 페이지 |
| `GET /admin/detail-concepts` | 관리자 | 목록 화면 |

슬러그가 허용 목록 밖이면 모든 경로가 404. 이미지 업로드는 기존 `POST /api/admin/upload`(`subdir=detail-concepts`)를 그대로 쓴다.

## 시안(슬러그)을 추가하려면

1. `pages.ts` 의 `DETAIL_PAGES` 에 `{ slug, no, title, subtitle }` 한 줄(제목·부제는 시안 표지 카드의 h3 와 설명 첫 문장). `__tests__/pages.test.ts` 가 표지와 대조한다.
2. 클라이언트 코어의 슬러그 허용 목록과 구역 선택자 지도(`public/detail-edit/apply.js`)에 같은 슬러그를 넣는다. 서버만 고치면 편집기는 열려도 적용되지 않는다.
3. 시안 사이트에 뷰어 스니펫을 넣는다(`C/tools/inject.mjs`). 표지(`index`)는 편집 대상이 아니다.
4. 시안 하나가 늘면 `schema.test.ts`(슬러그 11개 고정 검사)와 목록 테스트의 "11" 을 함께 고친다.

## 되돌리는 길

- **이력 복원**: 편집기 이력 패널 → 복원(또는 `POST …/history`). 지난 버전 내용이 새 버전으로 저장되고 이력은 지워지지 않는다.
- **원본으로 초기화**: `PUT` 으로 네 배열과 `layout` 의 모든 배열을 비워 저장한다. 이것도 새 버전이며 이력에서 다시 복원할 수 있다.
- **편집 적용을 통째로 끄기**: 시안 사이트 각 페이지에서 뷰어 스니펫(`<!--de:begin-->…<!--de:end-->` 두 곳)을 제거한다(`inject.mjs --remove`). 제거하면 시안은 원본 파일과 바이트까지 같아지고, 저장된 문서는 그대로 남는다.
- 공개 반영은 CDN 캐시 때문에 저장 뒤 최대 1~2분 걸린다. 급하면 위 세 가지 중 하나로 되돌린 뒤 같은 시간만큼 기다린다.

## 일부러 지원하지 않는 것

- **동시 편집 잠금/병합**: 낙관적 동시성(`baseVersion`)만 있다. 같은 서버 인스턴스 안에서는 슬러그별 프로세스 락으로 읽기-검사-쓰기를 묶지만, Blob 에는 조건부 쓰기가 없어서 서로 다른 인스턴스가 같은 순간 저장하면 나중 쓰기가 이기는 짧은 틈이 남는다. 관리자가 소수라 감수했다.
- **표지(index)와 시안 원본 파일 수정**: 편집은 항상 "원본 위에 덧입히는 문서"이고 원본 HTML 은 건드리지 않는다.
- **HTML 자유 편집**: 허용 태그·속성 밖의 마크업은 저장 때 제거된다(위 목록). 새 섹션 추가는 불가(기존 구역의 순서·간격·복제·배경색만 `layout` 으로 바꾼다).
- **편집자 역할 구분**: 유효한 관리자 세션이면 역할(super_admin·admin·editor)과 상관없이 쓸 수 있다.
- **이력 무한 보존**: 50개를 넘으면 오래된 것부터 버려진다.
- **감사 로그 전용 분류**: `audit.ts` 의 분류에 이 기능이 없어 `settings` 분류 + `targetId: detail-edits:<slug>` + `meta.kind: 'detail-edits'` 로 남긴다.

## 운영 메모

- **전역 보안 헤더 (미해결 — `next.config.ts` 수정 필요, 리드 몫)**: `next.config.ts` 의 `headers()` 는 `source: '/(.*)'` 로 편집 페이지(`/admin/detail-concepts/edit/<slug>`)까지 모든 경로에
  CSP(`base-uri 'self'`, `img-src` 에 시안 오리진 없음, `style-src`·`font-src` 에 `cdn.jsdelivr.net` 없음, `frame-ancestors 'none'`)·`X-Frame-Options: DENY`·`Referrer-Policy` 를 붙인다.
  Next 15.5.14 에서 `next start`/`next dev`(Node 서버)는 설정 헤더를 먼저 응답에 올리고(`router-server.js` 329-331행) 라우트 응답의 헤더는 *없는 이름만* 덧붙인다
  (`send-response.js`: `set-cookie`·`www-authenticate`·`proxy-authenticate`·`vary` 만 다중 값 허용). 실제 `sendResponse` 를 불러 확인했다 — **CSP·Referrer-Policy·X-Frame-Options 는 전역 값이 이기고 라우트의 CSP 는 버려진다.**
  결과: 편집 페이지의 전용 CSP(`script-src 'self'`) 방어층이 없어지고 전역 CSP(`'unsafe-inline' 'unsafe-eval'`)가 적용되며, `<base>`(시안 오리진)·시안 이미지·jsdelivr 스타일/글꼴이 막힌다.
  Vercel 운영은 서버가 minimal mode 라 설정 헤더를 Next 가 아니라 플랫폼이 붙인다(`resolve-routes.js` 50행 `opts.minimalMode ? [] : fsChecker.headers`) — 그쪽 병합 규칙은 이 소스로 알 수 없다(미검증).
  플랫폼이 둘 다 보낸다면 브라우저는 CSP 를 각각 적용해 **교집합**으로 막는다(CSP 명세) — 어느 쪽이든 전역 CSP 의 좁은 목록이 편집 페이지를 막는다.
  해법(경로 제외 + 별도 항목)과 정확한 줄은 `tracks/SERVER-progress.md` 의 "next.config.ts 헤더 분석" 참고. 공개 API(`/api/detail-edits/*`)는 JSON 이라 전역 CSP 의 영향이 없다.
- 로컬 시험 환경: `NODE_ENV=development DETAIL_CONCEPTS_ORIGIN=http://127.0.0.1:4101 ADMIN_SESSION_SECRET=<시험용>` 이고 `BLOB_READ_WRITE_TOKEN` 은 비워 둔다.
  `DETAIL_CONCEPTS_ORIGIN` 은 `NODE_ENV=production` 에서는 무시된다. 이때 CSP 의 `img-src`·`media-src`·`base-uri` 가 그 오리진을 따른다.
- 저장이 없는 시안의 공개 읽기는 `db.ts` 의 NOT_FOUND 판정(list 재시도 3회, 사이 대기 250/500ms)을 거쳐 한 번에 1초 안팎 걸릴 수 있다(코드 읽기로 본 추정). CDN 이 15초 캐시하고 stale-while-revalidate 로 가려 준다.
- 시험: `npx vitest run src/lib/detail-edits src/app/api/detail-edits src/app/api/admin/detail-edits src/app/admin/detail-concepts "src/app/admin/(dashboard)/detail-concepts"`.
  `sanitize.test.ts` 는 `src/lib/detail-edits-core/__tests__/sanitize-vectors.json`(클라이언트 코어와 공유하는 벡터)이 있으면 전부 돌리고, 없으면 내장 최소 벡터만 돌린 뒤 안내를 출력한다.
  `sanitize-identity.test.ts` 와 `edit-page.test.ts` 의 "실제 시안 11개" 는 읽기 전용 백업 폴더가 있을 때만 실행된다.
