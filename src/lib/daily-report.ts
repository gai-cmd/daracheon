import { fetchDailyReport, getGa4Config, type Ga4DailyReport, type Ga4DailyTotals } from '@/lib/ga4';
import { sendTelegramMessage } from '@/lib/integrations';

/* ───────── 포매팅 헬퍼 ───────── */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

function fmtDelta(curr: number, prev: number): string {
  if (prev === 0 && curr === 0) return '—';
  if (prev === 0) return ' <i>(신규)</i>';
  const pct = ((curr - prev) / prev) * 100;
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '·';
  const sign = pct > 0 ? '+' : '';
  return ` <i>(${arrow}${sign}${pct.toFixed(1)}%)</i>`;
}

function fmtDuration(seconds: number): string {
  if (seconds <= 0) return '0초';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function fmtKstDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-');
  return `${y}-${m}-${d}`;
}

/* ───────── 메시지 빌더 ───────── */

function totalsBlock(curr: Ga4DailyTotals, prev: Ga4DailyTotals): string {
  return [
    `👥 활성 사용자: <b>${fmtInt(curr.activeUsers)}</b>${fmtDelta(curr.activeUsers, prev.activeUsers)}`,
    `🆕 신규 사용자: <b>${fmtInt(curr.newUsers)}</b>${fmtDelta(curr.newUsers, prev.newUsers)}`,
    `🔁 세션: <b>${fmtInt(curr.sessions)}</b>${fmtDelta(curr.sessions, prev.sessions)}`,
    `📄 페이지뷰: <b>${fmtInt(curr.screenPageViews)}</b>${fmtDelta(curr.screenPageViews, prev.screenPageViews)}`,
    `⏱ 평균 세션: <b>${fmtDuration(curr.averageSessionDuration)}</b>`,
    `🚪 이탈률: <b>${fmtPct(curr.bounceRate)}</b>`,
  ].join('\n');
}

function topPagesBlock(report: Ga4DailyReport): string {
  if (report.topPages.length === 0) return '<i>데이터 없음</i>';
  return report.topPages
    .map((p, i) => {
      const title = (p.pageTitle || p.pagePath).slice(0, 50);
      return `${i + 1}. ${escapeHtml(title)} — <b>${fmtInt(p.views)}</b>`;
    })
    .join('\n');
}

function topSourcesBlock(report: Ga4DailyReport): string {
  if (report.topSources.length === 0) return '<i>데이터 없음</i>';
  return report.topSources
    .map((s, i) => {
      const label = s.source === '(direct)' ? '(직접유입)' : s.source;
      return `${i + 1}. ${escapeHtml(label)} <span>/${escapeHtml(s.medium)}</span> — <b>${fmtInt(s.sessions)}</b>`;
    })
    .join('\n');
}

function devicesBlock(report: Ga4DailyReport): string {
  if (report.devices.length === 0) return '<i>데이터 없음</i>';
  const total = report.devices.reduce((acc, d) => acc + d.sessions, 0) || 1;
  const labelMap: Record<string, string> = { mobile: '모바일', desktop: '데스크탑', tablet: '태블릿' };
  return report.devices
    .map((d) => {
      const label = labelMap[d.category] ?? d.category;
      const pct = ((d.sessions / total) * 100).toFixed(0);
      return `${label}: <b>${pct}%</b> (${fmtInt(d.sessions)})`;
    })
    .join(' · ');
}

export function buildDailyReportMessage(report: Ga4DailyReport): string {
  const lines = [
    `<b>📊 ZOEL LIFE 일일 리포트</b>`,
    `<i>${fmtKstDate(report.dateLabel)} (KST)</i>`,
    ``,
    totalsBlock(report.yesterday, report.dayBefore),
    ``,
    `<b>📄 인기 페이지 Top 5</b>`,
    topPagesBlock(report),
    ``,
    `<b>🌐 트래픽 소스 Top 5</b>`,
    topSourcesBlock(report),
    ``,
    `<b>📱 디바이스</b>`,
    devicesBlock(report),
  ];
  return lines.join('\n');
}

/* ───────── 한 번에 실행 (cron + admin test 공용) ───────── */

export interface DailyReportResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
  dateLabel?: string;
}

export async function sendDailyReport(): Promise<DailyReportResult> {
  const cfg = getGa4Config();
  if (!cfg.ready) {
    return { ok: false, skipped: true, error: 'GA4 환경변수가 설정되지 않았습니다.' };
  }
  try {
    const report = await fetchDailyReport();
    const text = buildDailyReportMessage(report);
    const sent = await sendTelegramMessage(text);
    if (!sent.ok) {
      return { ok: false, error: sent.error ?? '텔레그램 발송 실패', skipped: sent.skipped };
    }
    return { ok: true, dateLabel: report.dateLabel };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
