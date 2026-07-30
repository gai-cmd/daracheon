import { listTools, listTeams, listPayments } from './store';
import { toJpy } from './currency';
import type { AiTool, Team } from './types';

/**
 * 대시보드·슬랙 통지·MCP 공용 집계.
 *
 * 월 비용 합계는 active/trial 툴의 monthlyCost 를 JPY 환산해 더한다. 미확정
 * (monthlyCost=null 또는 dataState!=='confirmed')은 합계에서 제외하고 "+α" 로
 * 분리 카운트한다 — 설계서 ④ 대시보드의 "¥39,194 +α" 표현.
 */

export interface TeamCost {
  teamId: string | null;
  teamName: string;
  region: string | null;
  monthlyJpy: number;
  toolCount: number;
  unconfirmedCount: number;
}

export interface MonthlySeriesPoint {
  month: string; // YYYY-MM
  jpy: number;
}

export interface UpcomingBilling {
  toolId: string;
  toolName: string;
  billingDay: number;
  amountLabel: string;
  daysUntil: number;
  nextDate: string; // YYYY-MM-DD
}

export interface Summary {
  totalMonthlyJpy: number;
  unconfirmedCount: number; // 확인 필요/미확정 금액 툴 수
  paidToolCount: number; // active + 유료(monthlyCost>0)
  byTeam: TeamCost[];
  monthlySeries: MonthlySeriesPoint[];
  upcoming: UpcomingBilling[];
  currency: 'JPY';
  generatedAt: string;
}

function isBillable(t: AiTool): boolean {
  return t.status === 'active' || t.status === 'trial';
}

function monthlyJpyOf(t: AiTool): number {
  if (!isBillable(t)) return 0;
  if (t.monthlyCost === null || t.monthlyCost === undefined) return 0;
  const j = toJpy(t.monthlyCost, t.currency);
  return j ?? 0;
}

function isUnconfirmed(t: AiTool): boolean {
  if (!isBillable(t)) return false;
  return (
    t.monthlyCost === null ||
    t.monthlyCost === undefined ||
    t.dataState === 'todo' ||
    t.dataState === 'estimated'
  );
}

/** billing_day 로부터 다음 결제 예정일과 남은 일수 계산 (오늘 포함 앞으로). */
function nextBilling(billingDay: number, from: Date): { nextDate: Date; daysUntil: number } {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const clampDay = (year: number, month: number, day: number) => {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(day, last);
  };
  let candidate = new Date(Date.UTC(y, m, clampDay(y, m, billingDay)));
  const today = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  if (candidate < today) {
    candidate = new Date(Date.UTC(y, m + 1, clampDay(y, m + 1, billingDay)));
  }
  const daysUntil = Math.round((candidate.getTime() - today.getTime()) / 86_400_000);
  return { nextDate: candidate, daysUntil };
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function buildSummary(opts: { now?: Date; months?: number } = {}): Promise<Summary> {
  const now = opts.now ?? new Date();
  const monthsBack = opts.months ?? 6;

  const [tools, teams, payments] = await Promise.all([
    listTools(),
    listTeams(),
    listPayments(),
  ]);

  const teamById = new Map<string, Team>(teams.map((t) => [t.id, t]));

  // 팀별 집계
  const teamAgg = new Map<string, TeamCost>();
  const ensure = (teamId: string | null): TeamCost => {
    const key = teamId ?? '__none__';
    let e = teamAgg.get(key);
    if (!e) {
      const team = teamId ? teamById.get(teamId) : undefined;
      e = {
        teamId,
        teamName: team?.name ?? (teamId ? '(알 수 없는 팀)' : '미지정'),
        region: team?.region ?? null,
        monthlyJpy: 0,
        toolCount: 0,
        unconfirmedCount: 0,
      };
      teamAgg.set(key, e);
    }
    return e;
  };

  let totalMonthlyJpy = 0;
  let unconfirmedCount = 0;
  let paidToolCount = 0;

  for (const t of tools) {
    const e = ensure(t.teamId ?? null);
    e.toolCount += 1;
    const jpy = monthlyJpyOf(t);
    e.monthlyJpy += jpy;
    totalMonthlyJpy += jpy;
    if (isUnconfirmed(t)) {
      unconfirmedCount += 1;
      e.unconfirmedCount += 1;
    }
    if (t.status === 'active' && (t.monthlyCost ?? 0) > 0) paidToolCount += 1;
  }

  const byTeam = [...teamAgg.values()].sort((a, b) => b.monthlyJpy - a.monthlyJpy);

  // 월별 추이 — tool_payments 의 amountJpy(없으면 환산) 합산, 최근 N개월.
  const seriesMap = new Map<string, number>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    seriesMap.set(d.toISOString().slice(0, 7), 0);
  }
  for (const p of payments) {
    const month = p.paidOn.slice(0, 7);
    if (!seriesMap.has(month)) continue;
    const jpy = p.amountJpy ?? toJpy(p.amount, p.currency) ?? 0;
    seriesMap.set(month, (seriesMap.get(month) ?? 0) + jpy);
  }
  const monthlySeries: MonthlySeriesPoint[] = [...seriesMap.entries()].map(([month, jpy]) => ({
    month,
    jpy,
  }));

  // 다가오는 결제 예정 (billingDay 있는 active/trial, 30일 이내), 가까운 순.
  const upcoming: UpcomingBilling[] = [];
  for (const t of tools) {
    if (!isBillable(t) || !t.billingDay) continue;
    const { nextDate, daysUntil } = nextBilling(t.billingDay, now);
    if (daysUntil > 30) continue;
    const { formatAmount } = await import('./currency');
    upcoming.push({
      toolId: t.id,
      toolName: t.name,
      billingDay: t.billingDay,
      amountLabel: formatAmount(t.monthlyCost ?? null, t.currency),
      daysUntil,
      nextDate: fmtDate(nextDate),
    });
  }
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    totalMonthlyJpy,
    unconfirmedCount,
    paidToolCount,
    byTeam,
    monthlySeries,
    upcoming,
    currency: 'JPY',
    generatedAt: now.toISOString(),
  };
}

/** billing_day − N일에 해당하는 결제 리마인드 대상 (기본 3일 전). */
export async function billingReminders(daysBefore = 3, now = new Date()): Promise<UpcomingBilling[]> {
  const summary = await buildSummary({ now });
  return summary.upcoming.filter((u) => u.daysUntil === daysBefore);
}
