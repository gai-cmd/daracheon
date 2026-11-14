# SPEC-CONSOLE-001 — 조사 (research.md)

조사 기준: 워크트리 `zoel-console`(origin/main `1a1b302f`), 2026-11-15. 아래는 이번 계획 단계에서 실제로 파일을 열어 확인한 내용이다.

## 1. 근거 자료

| 자료 | 확인 내용 |
|---|---|
| `~/personal/works/zoellife/zoel-console/PLAN.md` | "최종 결정"(2026-11-14)이 본문보다 우선. 본문 8절의 별도 저장소·Neon·핸드오프 안은 이번 방향과 다름(spec.md §1.2) |
| `~/personal/works/zoellife/zoel-console/index.html` (2,599줄) | 구조·문구·검증 로직·시드 데이터의 원본. `index.en.html`은 기본 언어만 영어인 같은 앱 |

### 1.1 프로토타입에서 옮길 것

- 상수: `TEAMS`(한국팀·방글라데시팀·공통), `TYPES`, `STATUSES`, `ACCESS`(5종), `VIS`(전체·팀·본인), `CATEGORIES` 8개, `TEAM_PINS` 7개, `MAX_PINS = 8`
- `I18N.ko` / `I18N.en` — 같은 키 구성(배포판은 키 집합 동일성을 테스트로 고정)
- `brandOf(url, title)` — 주소의 호스트로 서비스 마크를 고르고, 주소가 없으면 제목으로 일부 추정. `MARKS`(인라인 SVG 상수), `LETTERS`(글자 타일)
- `parseTryn` — 도메인 정확 일치(`x@try-n.com.evil.io` 거절). 서버 쪽은 `isWorkshopOpenAccount`가 같은 일을 이미 한다
- `validateDataset` — 서버 검증 규칙의 원본(URL 스킴, 길이, enum, 3,000개 상한, 연동 주소 20개)
- `credAccess` — 공개 범위 판정 원본("배포판은 서버에서 강제"라는 주석이 붙어 있음)
- 삭제: 행 안 인라인 확인 → 삭제 → 6초 토스트 "되돌리기"
- 편집 권한 없음: 토스트 + "요청 문구 복사"

### 1.2 시드 데이터 실측

`SEED_CARDS` 55개를 파이썬으로 세었다.

| 필드 | 분포 |
|---|---|
| visibility | 전체 39 · 팀 11 · 본인 5 |
| team | 한국팀 25 · 공통 18 · 방글라데시팀 12 |
| access_method | invite 26 · shared-credential 13 · public 11 · sso 4 · internal-login 1 |
| status | run 35 · ok 13 · needs-url 6 · planned 1 |
| owner | 담당자 지정 49 · 담당자 없음 6 (이름은 공개 저장소라 적지 않음) |

- 드라이브 폴더 id 17개, 구글 시트 id 3개, Slack 채널 id 3개, 직원 이름, 이메일 일부(`PEOPLE.email_hint`)가 들어 있다. PLAN 7절도 이 때문에 프로토타입을 비공개로 두라고 적었다. 이 저장소는 공개이므로 시드는 커밋하지 않는다(REQ-CON-008).
- 시드에는 비밀번호·로그인 아이디가 없다(주석 "Seed data carries no passwords or login IDs" 확인).
- `PEOPLE` 9명 중 email이 있는 사람은 2명. 소유 판정을 email로 바꾸면 나머지 담당자의 email을 사람 목록에 채워야 한다(plan.md D4).

## 2. 재사용할 기존 코드 (워크트리에서 열어 확인)

| 파일 | 확인 내용 | 이번 작업에서의 쓰임 |
|---|---|---|
| `src/lib/google-oauth.ts` | `sanitizeNextPath`는 `/admin`으로 시작하는 경로만 허용, 나머지는 `/admin` | `/console` 계열 허용 추가 + `isConsoleNext` |
| `src/app/api/admin/auth/google/start/route.ts` | state·next 쿠키(10분, Lax), `prompt=select_account`, scope `openid email profile` | 그대로 사용. 설정 누락 시 콘솔 모드 오류 경로만 분기 |
| `src/app/api/admin/auth/google/callback/route.ts` | state 검증 → 코드 교환 → userinfo → admin-users 조회 → (미등록) 워크숍 member 출구 또는 거절 → 관리자 세션 발급. `auditSsoLogin` 보유 | admin-users 조회 전에 콘솔 분기 삽입 |
| `src/lib/workshop-sso.ts` | `isWorkshopOpenAccount`(검증 이메일·`@` 1개·정확 도메인·`hd`·`aud`), `decodeGoogleIdToken`(iss·exp 검사, 서명 미검증 — 토큰 엔드포인트 TLS 직수신 근거), `getHandoffSecret`(관리자 비밀값과 같으면 거부) | 도메인 판정 재사용, 비밀값 점검 방식 참고 |
| `src/app/admin/sso-handoff/route.ts` | 관리자 세션이 있어야 도달, 허용 origin으로 60초 토큰 | 콘솔은 같은 사이트라 쓰지 않음 |
| `src/lib/auth.ts` | Web Crypto HMAC 세션, `verifySessionToken`은 역할 화이트리스트와 숫자 `expiresAt`만 수용. 비밀값 없을 때 개발용 리터럴 폴백이 있음 | 형식 참고. 콘솔은 리터럴 폴백 없이 실패로 닫음 |
| `src/middleware.ts` | `/thesis`·`/partner`·`/ai-tools` 독립 블록 후 관리자 블록. `/api/admin/auth/google/`은 공개 | 콘솔 블록 추가 |
| `src/lib/db.ts` | Blob 공개 접근 + 비밀 prefix, `writeDataMerged`(id 병합, removedIds→tombstone), `FILE_KEY`로 id 없는 파일의 키 등록, 개발 시 `data/db` 파일 | 콘솔 문서 저장. `console-people`·`console-secrets` 키 등록 |
| `src/lib/audit.ts` | `logAdmin`은 관리자 쿠키로 행위자를 정함, `audit-log` 2,000건 상한 | 콘솔은 별도 문서 + 명시적 행위자. 로그인 1줄만 기존 기록에 |
| `src/lib/admin-users.ts` | 관리자 역할 3종 | 콘솔에서 쓰지 않음(관리자 여부는 환경변수) |
| `src/lib/backup-crypto.ts` | AES-256-GCM, 64hex 아니면 scrypt로 늘림 | 알고리즘 참고. 콘솔 키는 64hex만 허용(늘리기 없음) |
| `src/app/robots.ts` | `*`와 AI 크롤러 그룹이 같은 disallow 배열(`/api/`, `/admin/`, `/edition/`, `/agarwood-edition`, `/thesis`) | 두 곳에 `/console` 추가 |
| `src/app/sitemap.ts` | 명시적 목록으로 생성 | 콘솔 미포함을 테스트로 고정 |
| `vercel.json` | `/admin/:path*`에만 `X-Robots-Tag` | 콘솔 경로 추가 |
| `src/components/layout/ChromeGate.tsx` | `IMMERSIVE_PREFIXES`로 헤더·푸터 숨김 | `/console` 추가 |
| `src/styles/zoel/dark-theme.css` | body 배경·글자 `!important`, `h1~h6 color: inherit !important`, 입력칸·label은 `:not([data-admin-root] *)`로 제외 | 콘솔 루트에 `data-admin-root="console"` |
| `src/styles/globals.css` | 관리자 라이트 테마는 `[data-admin-root="true"]`에만 적용 | 값이 달라 콘솔에 섞이지 않음 |
| `src/lib/env-check.ts` | 환경변수 존재 여부 레지스트리 | 콘솔 변수 등록 |
| `src/lib/backup.ts` | `DB_FILES`·`SINGLETON_FILES` 명시 목록 | 콘솔 문서 추가 |
| `src/lib/ga4.ts` | 존재 확인만 | 이번 범위 밖 |

### 2.1 확인한 제약

- `next.config.ts` CSP: `connect-src 'self'` 포함 → 같은 출처 API 호출은 추가 설정 없이 된다. 외부 이미지·폰트 호스트를 새로 열 필요가 없다(열지 않는다).
- 루트 레이아웃이 모든 경로에 GA·GTM을 싣는다(`/admin` 포함). 콘솔도 같다. 항목 내용은 URL 경로·쿼리에 넣지 않으므로 GA로 항목 정보가 나가지 않는다(plan.md D12).
- 공용 rate-limit 헬퍼는 없다(`/api/reviews`가 자체 구현). 열람 상한은 콘솔 감사 기록 개수로 센다.
- `.moai/specs`는 이 저장소에 처음 생긴다. 다른 SPEC id와 겹칠 일이 없다.

## 3. 위험 요인

| 위험 | 근거 | 대응 |
|---|---|---|
| 공개 저장소로 내부 자산 목록 유출 | 저장소 PUBLIC, 시드에 드라이브·시트·Slack id | 시드 비커밋, 관리자 가져오기로 주입 |
| Blob 공개 URL | `db.ts` 주석: Blob은 public만 지원, prefix가 유일한 보호 | 자격증명은 암호문으로만 저장. prefix가 새도 평문 없음 |
| 관리자 세션과 콘솔 세션 혼동 | 같은 HMAC 와이어 형식 | 별도 비밀값 + 비밀값 중복 금지 + `k` 표식 |
| 콜백 회귀 | 관리자 로그인의 단일 진입점 | 콘솔 분기를 admin-users 조회 앞에 두고, 기존 콜백 테스트를 그대로 통과시킴 |
| 키 분실 | 키는 Vercel 환경변수에만 존재 | 오너가 오프라인 보관(plan.md §7) |
