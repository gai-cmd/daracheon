import { sendSlackMessage } from '@/lib/integrations';
import { buildSummary, billingReminders, type Summary } from './summary';
import { formatJpy } from './currency';

/**
 * AI툴 CRM 슬랙 통지 (Incoming Webhook, 단방향).
 *
 * 설계서 ⑧: 통지 대상은 사내 네이밍 규칙에 맞춘 #06_ai-tool-admin.
 * 전용 Webhook URL 은 `AI_TOOLS_SLACK_WEBHOOK_URL` 로 주입한다. 미설정 시
 * 저장소 공용 `sendSlackMessage`(SLACK_WEBHOOK_URL / 통합설정)로 폴백 —
 * 어느 쪽도 없으면 skipped(무해).
 */

export interface NotifyResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

async function post(text: string): Promise<NotifyResult> {
  const dedicated = process.env.AI_TOOLS_SLACK_WEBHOOK_URL?.trim();
  if (dedicated) {
    try {
      const res = await fetch(dedicated, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, unfurl_links: false, unfurl_media: false }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { ok: false, error: `HTTP ${res.status} ${body.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  // 폴백: 저장소 공용 웹훅
  const r = await sendSlackMessage(text);
  return { ok: r.ok, skipped: r.skipped, error: r.error };
}

function pctDelta(current: number, prev: number): string {
  if (prev <= 0) return current > 0 ? '(신규)' : '';
  const delta = ((current - prev) / prev) * 100;
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
  return `${arrow} ${Math.abs(delta).toFixed(1)}% (전월 대비)`;
}

/** 월간 리포트 — 매월 1일. 전월 팀별 합계·전월 대비 증감·미확정 목록. */
export async function notifyMonthlyReport(now = new Date()): Promise<NotifyResult> {
  const summary = await buildSummary({ now });
  const series = summary.monthlySeries;
  const thisMonth = series.at(-1)?.jpy ?? 0;
  const prevMonth = series.at(-2)?.jpy ?? 0;

  const lines: string[] = [];
  lines.push('📊 *AI툴 월간 비용 리포트*');
  lines.push(`*월 비용 합계* ${formatJpy(summary.totalMonthlyJpy)}${summary.unconfirmedCount > 0 ? ' +α' : ''}`);
  if (series.length >= 2) {
    lines.push(`*결제 실적(당월/전월)* ${formatJpy(thisMonth)} / ${formatJpy(prevMonth)} ${pctDelta(thisMonth, prevMonth)}`);
  }
  lines.push('');
  lines.push('*팀별 월 비용*');
  for (const t of summary.byTeam) {
    const alpha = t.unconfirmedCount > 0 ? ` (+α ${t.unconfirmedCount}건)` : '';
    lines.push(`• ${t.teamName}: ${formatJpy(t.monthlyJpy)}${alpha} — 툴 ${t.toolCount}개`);
  }
  if (summary.unconfirmedCount > 0) {
    lines.push('');
    lines.push(`⚠️ *확인 필요/미확정* ${summary.unconfirmedCount}건 — 금액·플랜 확정 요망`);
  }
  return post(lines.join('\n'));
}

/** 결제 리마인드 — 매일. billing_day − 3일 해당 툴. */
export async function notifyBillingReminders(daysBefore = 3, now = new Date()): Promise<NotifyResult> {
  const due = await billingReminders(daysBefore, now);
  if (due.length === 0) return { ok: true, skipped: true };
  const lines = ['🔔 *결제 예정 리마인드*'];
  for (const u of due) {
    lines.push(`• ${u.toolName} — ${u.nextDate} 결제 예정 (${u.amountLabel})`);
  }
  return post(lines.join('\n'));
}

/** 정합성 점검 — 매월 5일. 지난달 결제 기록이 없는 active 툴. */
export async function notifyReconciliation(now = new Date()): Promise<NotifyResult> {
  const { listTools, listPayments } = await import('./store');
  const [tools, payments] = await Promise.all([listTools(), listPayments()]);
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    .toISOString()
    .slice(0, 7);
  const paidToolIds = new Set(
    payments.filter((p) => p.paidOn.slice(0, 7) === lastMonth).map((p) => p.toolId),
  );
  const missing = tools.filter(
    (t) => t.status === 'active' && (t.monthlyCost ?? 0) > 0 && !paidToolIds.has(t.id),
  );
  if (missing.length === 0) return { ok: true, skipped: true };
  const lines = [`🧾 *정합성 점검 (${lastMonth})* — 지난달 결제 기록 없는 사용중 툴`];
  for (const t of missing) lines.push(`• ${t.name}${t.owner ? ` (담당: ${t.owner})` : ''}`);
  lines.push('→ 경비 채널·영수증과 대조해 주세요.');
  return post(lines.join('\n'));
}

/** 변경 통지 — 등록·해지·플랜 변경, MCP write 감사 로그. 즉시 발송. */
export async function notifyChange(p: {
  action: string; // '등록' · '수정' · '해지' · '결제 기록'
  toolName: string;
  by: string; // 변경자 (세션 이메일 · MCP 토큰명)
  detail?: string;
}): Promise<NotifyResult> {
  const lines = [
    `✏️ *AI툴 변경 — ${p.action}*`,
    `*툴* ${p.toolName}`,
    `*변경자* ${p.by}`,
  ];
  if (p.detail) lines.push(`*내용* ${p.detail}`);
  return post(lines.join('\n'));
}

export type { Summary };
