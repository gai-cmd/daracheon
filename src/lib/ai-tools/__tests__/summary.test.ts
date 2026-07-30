import { describe, it, expect } from 'vitest';
import { buildSummary } from '@/lib/ai-tools/summary';

/**
 * 시드 데이터(data/db/ai-tools.json)를 fs 로 읽어(hasBlob=false in test) 집계를
 * 검증한다. 시드: Claude $200 USD active estimated + 미확정 5건(active null) +
 * ChatGPT(review).
 */
describe('ai-tools summary (seed)', () => {
  it('전사 월 비용·미확정·유료 툴 수 집계', async () => {
    const s = await buildSummary({ now: new Date('2026-07-15T00:00:00Z') });
    // Claude 만 확정성 금액: 200 USD * 155 = 31000
    expect(s.totalMonthlyJpy).toBe(31000);
    // active/trial 중 미확정(null 또는 estimated/todo): Claude + Google + Slack + Vercel + Supabase + Whois = 6
    expect(s.unconfirmedCount).toBe(6);
    // active && cost>0: Claude 만
    expect(s.paidToolCount).toBe(1);
    // 통화 단위는 항상 JPY
    expect(s.currency).toBe('JPY');
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
