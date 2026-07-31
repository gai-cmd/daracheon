import { describe, it, expect } from 'vitest';
import { buildSummary } from '@/lib/ai-tools/summary';

/**
 * 시드 데이터(data/db/ai-tools.json)를 fs 로 읽어(hasBlob=false in test) 집계를
 * 검증한다. 시드는 Account info 시트 대조(설계서 ⑨-2)로 확정되며, 금액이 있는
 * 건은 Claude $200(active·estimated) · Floot $50(active·confirmed) ·
 * Runway $15(cancelled) 세 건이다.
 */
describe('ai-tools summary (seed)', () => {
  it('전사 월 비용·미확정·유료 툴 수 집계', async () => {
    const s = await buildSummary({ now: new Date('2026-07-15T00:00:00Z') });
    // 금액이 있는 active 2건: (200 + 50) USD * 155 = 38750
    expect(s.totalMonthlyJpy).toBe(38750);
    // active && cost>0: Claude + Floot
    expect(s.paidToolCount).toBe(2);
    // active/trial 중 금액 확정(confirmed + cost)은 Floot 뿐 — 나머지는 전부 +α
    expect(s.unconfirmedCount).toBe(32);
    // 통화 단위는 항상 JPY
    expect(s.currency).toBe('JPY');
  });

  it('해지(cancelled) 툴은 금액이 있어도 집계·결제예정에서 제외', async () => {
    const s = await buildSummary({ now: new Date('2026-07-15T00:00:00Z') });
    // Runway 는 monthlyCost=15 이지만 status=cancelled → 합계에 15*155=2325 가 섞이면 안 된다.
    expect(s.totalMonthlyJpy).not.toBe(38750 + 2325);
    expect(s.upcoming.some((u) => u.toolName === 'Runway')).toBe(false);
  });

  it('결제 예정: Claude billingDay 22 는 7/15 기준 7일 후', async () => {
    const s = await buildSummary({ now: new Date('2026-07-15T00:00:00Z') });
    const claude = s.upcoming.find((u) => u.toolName.startsWith('Claude'));
    expect(claude).toBeTruthy();
    expect(claude?.nextDate).toBe('2026-07-22');
    expect(claude?.daysUntil).toBe(7);
  });

  it('월별 추이는 6개월 구간을 반환', async () => {
    const s = await buildSummary({ now: new Date('2026-07-15T00:00:00Z') });
    expect(s.monthlySeries).toHaveLength(6);
    expect(s.monthlySeries.at(-1)?.month).toBe('2026-07');
  });
});
