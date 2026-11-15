# SPEC-CONSOLE-002 — progress

## §E.1 Plan-phase Audit-Ready Signal

- status: draft
- plan_complete_at: 2026-11-15
- tier: L (spec.md, plan.md, acceptance.md, design.md, research.md) — 0.3.0에서 M → L 승격 (plan-audit CS2-PA-D6, 리드 결정 (a), 2026-11-15)
- plan_audit_pass_threshold: 0.85 (Tier L)
- route: Route B (PR 경로). PR 생성·머지·배포는 사람 승인 후에만
- requirements: 21 (REQ-CS2-001 ~ REQ-CS2-021)
- acceptance_criteria: 22 (AC-CS2-001 ~ AC-CS2-022)
- milestones: M1 서버·데이터 (REQ-CS2-001~006, AC-CS2-001~006), M2 화면 (REQ-CS2-007~021, AC-CS2-007~022)
- depends_on: SPEC-CONSOLE-001 (운영 중)
- kickoff_assumptions: plan.md §5 1~4 (Implementation Kickoff에서 리드가 한 번에 제시)
- plan_audit:
  - iteration 1: FAIL 0.86 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`, 결함 CS2-PA-D1~D8)
  - revision 0.2.0 (2026-11-15): D1·D2·D3·D4·D5·D7·D8 반영. D6(Tier M 상한 초과: 요구사항 21·인수 기준 22·소스 파일 22)은 리드 결정 대기 — Tier L 승격(design.md·research.md 추가, PASS 기준 0.85) 또는 S6 분리
  - iteration 2: FAIL 0.91 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`). 남은 막는 결함 D6(Tier 분류 모순) 1건, 경미 R2-D1·R2-D2
  - revision 0.3.0 (2026-11-15): D6 → (a) Tier L 승격. 범위 S1~S6 유지(오너가 S6을 이번 작업에 요청). spec.md `tier: L`, design.md 추가(0.2.0 plan.md §1~§2 이전 + §2.7 입력 칸 속성 + §3 요구사항·설계 대응표), research.md 추가(코드 조사, CSS 모듈 순수성 검사 재실행 결과, TeamPassword 도움말 조사), plan.md L3·§1~2 안내로 교체. R2-D1: "SPEC-CONSOLE-001 design.md §6.2"로 명시. R2-D2: AC-CS2-014 Safari 판정을 "새 탭이 열리거나, 막히면 토스트 안 로그인 링크(어느 쪽인지 §E.2에 기록)"로 변경
  - iteration 3: FAIL 0.93 (`.moai/reports/SPEC-CONSOLE-002/plan-audit.md`). D6·R2-D1·R2-D2 해결 확인. 신규 막는 결함 CS2-PA-R3-D1(major, 비밀번호 칸 `new-password` → `off` 변경 시 같은 출처 저장 비밀번호 자동 채우기 위험), 경미 CS2-PA-R3-D2(AC-CS2-014 Chrome 기본 설정 표현)
  - revision 0.4.0 (2026-11-15): R3-D1 → REQ-CS2-020을 칸별로 나눔(아이디 `autocomplete="off"`, 비밀번호 `autocomplete="new-password"` 유지, 두 칸 모두 `data-1p-ignore`·`data-lpignore="true"`). AC-CS2-020은 칸별 판정 + 같은 출처 저장 비밀번호가 있는 Chrome 프로필에서 두 칸이 비고 저장해도 공유 비밀번호가 바뀌지 않는지 브라우저 확인. design.md §2.7, spec.md §1.1, research.md §2.6·§4 함께 고침. R3-D2 → AC-CS2-014 "Chrome 기본 설정(팝업 차단 켜짐, 이 사이트 예외 없음)"
  - verdict: 리드가 3차를 이 수정 조건으로 수용(2026-11-15). 점수 0.93 ≥ Tier L 기준 0.85, R3-D1·R3-D2 수정 반영 완료, 추가 감사 회차 없음 (3회 상한 도달)
- plan_audit_accepted: true (리드 수용, 2026-11-15, score 0.93, revision 0.4.0)

## §E.2 Run-phase Evidence

_<pending run-phase>_

## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_
