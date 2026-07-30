# 전사 AI툴 관리 CRM (MVP)

설계서 **「AI툴 관리툴 설계서 v2」(2026-07-30)** 를 이 저장소(daracheon / Next.js 15 +
Vercel)에 맞춰 구현한 MVP. 웹 CRM 3화면 + REST API + 슬랙 통지(Cron) + MCP 서버를
자체 완결 모듈(`/ai-tools`)로 제공한다.

## 아키텍처 결정 (설계서 대비 변경점)

설계서는 **Supabase(Auth + PostgreSQL + RLS)** 를 권장했으나, 이 MVP는 **기존
저장소 인프라를 재사용**한다. 이유:

- 이 레포는 이미 **Vercel Blob JSON 스토어**(`src/lib/db.ts` — lost-update 방지·
  tombstone·outbox 정합 로직 내장), **자체 세션 auth**(`src/lib/auth.ts`), **슬랙
  webhook**(`src/lib/integrations.ts`), **Cron 인증**(`src/lib/cron-auth.ts`)을
  운영 중이다. 별도 Supabase 프로젝트·자격증명 없이 **지금 이 레포에서 빌드·배포·
  테스트가 되는** MVP를 만드는 것이 목표라 이 자산을 그대로 썼다.
- 설계서 ③의 DDL 스키마는 `src/lib/ai-tools/types.ts` 의 타입으로 1:1 이식했다.
  나중에 Supabase 로 옮길 때 이 타입이 그대로 테이블 매핑 근거가 된다.
- 권한(설계서 ⑤ viewer/editor/admin)은 MVP에서 **기존 관리자 세션**으로 근사한다
  (로그인한 사내 관리자 = 열람·편집 가능). 세분화된 팀별 RLS 는 Supabase 이관 시 도입.

## 데이터 모델

JSON Blob 파일 4개 (`data/db/*.json` 시드 → 런타임엔 Blob):

| 파일 | 설계서 테이블 | 내용 |
|---|---|---|
| `ai-teams` | teams | 본사부서·한국팀·방글팀 |
| `ai-tools` | ai_tools | 툴 마스터(핵심) |
| `ai-tool-payments` | tool_payments | 월별 결제 실적 |
| `ai-tool-reviews` | tool_reviews | 효율화 판단 이력 |

비용은 **계약 통화 그대로 저장**하고 JPY 환산은 표시·집계 시점에만 적용
(`src/lib/ai-tools/currency.ts`, 고정 환율 테이블). 금액 미확정은 `monthlyCost=null`
+ `dataState='todo'` 로 표현해 집계에서 `+α` 로 분리 표시.

## 화면 (`/ai-tools`)

- `/ai-tools` — 대시보드: 월 비용 합계(+α)·유료 툴 수·확인 필요·다가오는 결제,
  팀별 막대, 월별 추이, 결제 예정 목록.
- `/ai-tools/tools` — 툴 목록: 검색·상태·팀·데이터 필터, 월비용 내림차순, 미확정 뮤트 표시.
- `/ai-tools/tools/new` — 신규 등록.
- `/ai-tools/tools/[id]` — 상세·수정·해지, 결제 이력 추가, 효율화 판단 기록 추가.

> ⚠️ 화면 스타일은 CLAUDE.md 의 dark-theme.css 함정을 피해 **고정 hex + 자체 스코프
> 클래스**만 쓰고, 루트에 `data-reading-surface` 를 붙여 전역 테이블 규칙을 무력화한다.

## REST API (`/api/ai-tools`)

| 메서드·경로 | 기능 |
|---|---|
| `GET /api/ai-tools/tools?team=&status=&data_state=&q=` | 목록 |
| `POST /api/ai-tools/tools` | 신규 등록 |
| `GET /api/ai-tools/tools/:id` | 상세(툴+결제+판단) |
| `PATCH /api/ai-tools/tools/:id` | 수정(상태 변경 포함) |
| `POST /api/ai-tools/tools/:id/payments` | 결제 기록 추가 |
| `POST /api/ai-tools/tools/:id/reviews` | 효율화 판단 기록 |
| `GET /api/ai-tools/summary` | 팀별·월별 비용 집계(JPY) |
| `GET /api/ai-tools/teams` | 팀 목록 |
| `GET /api/ai-tools/cron/notify` | 슬랙 통지 잡 (CRON_SECRET) |
| `POST /api/ai-tools/mcp` | MCP 서버 (Bearer) |

페이지·API 는 미들웨어에서 관리자 세션을 강제한다. **예외**: `/api/ai-tools/mcp`
(자체 Bearer), `/api/ai-tools/cron`(CRON_SECRET).

## MCP 서버 (`/api/ai-tools/mcp`)

의존성 없이 **JSON-RPC 2.0 over HTTP(streamable)** 로 구현. `initialize` /
`tools/list` / `tools/call` / `ping` 지원. 인증은 `Authorization: Bearer` 로 read/write
토큰 분리.

| 툴 | 권한 |
|---|---|
| `list_ai_tools` | read |
| `get_monthly_cost` | read |
| `register_tool` | write |
| `update_tool` | write |
| `log_payment` | write |

write 호출은 슬랙 `#06_ai-tool-admin` 에 변경 통지(감사 로그)를 남긴다.

Claude 커스텀 커넥터 등록 예시:

```
URL:  https://<배포도메인>/api/ai-tools/mcp
Auth: Bearer <AI_TOOLS_MCP_READ_TOKEN 또는 AI_TOOLS_MCP_WRITE_TOKEN>
```

## 슬랙 통지 (설계서 ⑧)

`GET /api/ai-tools/cron/notify` 를 Vercel Cron 이 매일 09:10 JST(`10 0 * * *`)에 호출.
날짜별 분기: 매일 결제 리마인드(billing_day−3), 매월 1일 월간 리포트, 매월 5일 정합성 점검.
수동 트리거: `?type=monthly|reminder|reconcile` (CRON_SECRET Bearer 필요).

## 환경변수

`.env.example` 의 「전사 AI툴 관리 CRM」 섹션 참조:

- `AI_TOOLS_SLACK_WEBHOOK_URL` — 전용 통지 채널 웹훅(미설정 시 공용 `SLACK_WEBHOOK_URL` 폴백)
- `AI_TOOLS_MCP_READ_TOKEN` / `AI_TOOLS_MCP_WRITE_TOKEN` — MCP Bearer 토큰
- `AI_TOOLS_FX_JSON` — 고정 환율 오버라이드(선택)
- `CRON_SECRET` — 크론 통지 인증(공용 재사용)

## 테스트

```
npx vitest run src/lib/ai-tools   # 환산·집계 단위 테스트
npm run build                     # 전체 라우트 컴파일 확인
```

## 향후(설계서 로드맵)

- 시드 확정: Google Drive 「Account info 시트」 재인증 후 대조(설계서 ⑨-2).
- Gmail 영수증 수신 → `log_payment` 자동 호출 파이프라인(설계서 ⑦ 2단계).
- Supabase 이관 시 팀별 RLS·도메인 로그인(설계서 ⑤) 도입.
