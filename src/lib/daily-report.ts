import { fetchDailyReport, getGa4Config, type Ga4DailyReport, type Ga4DailyTotals } from '@/lib/ga4';
import { sendTelegramMessage, sendSlackMessage } from '@/lib/integrations';

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

/* ───────── Slack mrkdwn 빌더 (텔레그램 HTML 과 별도 포맷) ───────── */

// Slack mrkdwn 은 & < > 만 이스케이프하면 안전. (*굵게* _기울임_ 은 리터럴로 사용)
function escapeSlack(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDeltaSlack(curr: number, prev: number): string {
  if (prev === 0 && curr === 0) return '—';
  if (prev === 0) return ' _(신규)_';
  const pct = ((curr - prev) / prev) * 100;
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '·';
  const sign = pct > 0 ? '+' : '';
  return ` _(${arrow}${sign}${pct.toFixed(1)}%)_`;
}

function totalsBlockSlack(curr: Ga4DailyTotals, prev: Ga4DailyTotals): string {
  return [
    `👥 활성 사용자: *${fmtInt(curr.activeUsers)}*${fmtDeltaSlack(curr.activeUsers, prev.activeUsers)}`,
    `🆕 신규 사용자: *${fmtInt(curr.newUsers)}*${fmtDeltaSlack(curr.newUsers, prev.newUsers)}`,
    `🔁 세션: *${fmtInt(curr.sessions)}*${fmtDeltaSlack(curr.sessions, prev.sessions)}`,
    `📄 페이지뷰: *${fmtInt(curr.screenPageViews)}*${fmtDeltaSlack(curr.screenPageViews, prev.screenPageViews)}`,
    `⏱ 평균 세션: *${fmtDuration(curr.averageSessionDuration)}*`,
    `🚪 이탈률: *${fmtPct(curr.bounceRate)}*`,
  ].join('\n');
}

function topPagesBlockSlack(report: Ga4DailyReport): string {
  if (report.topPages.length === 0) return '_데이터 없음_';
  return report.topPages
    .map((p, i) => {
      const title = (p.pageTitle || p.pagePath).slice(0, 50);
      return `${i + 1}. ${escapeSlack(title)} — *${fmtInt(p.views)}*`;
    })
    .join('\n');
}

function topSourcesBlockSlack(report: Ga4DailyReport): string {
  if (report.topSources.length === 0) return '_데이터 없음_';
  return report.topSources
    .map((s, i) => {
      const label = s.source === '(direct)' ? '(직접유입)' : s.source;
      return `${i + 1}. ${escapeSlack(label)} /${escapeSlack(s.medium)} — *${fmtInt(s.sessions)}*`;
    })
    .join('\n');
}

function devicesBlockSlack(report: Ga4DailyReport): string {
  if (report.devices.length === 0) return '_데이터 없음_';
  const total = report.devices.reduce((acc, d) => acc + d.sessions, 0) || 1;
  const labelMap: Record<string, string> = { mobile: '모바일', desktop: '데스크탑', tablet: '태블릿' };
  return report.devices
    .map((d) => {
      const label = labelMap[d.category] ?? d.category;
      const pct = ((d.sessions / total) * 100).toFixed(0);
      return `${label}: *${pct}%* (${fmtInt(d.sessions)})`;
    })
    .join(' · ');
}

export function buildDailyReportSlackMessage(report: Ga4DailyReport): string {
  const lines = [
    `*📊 ZOEL LIFE 일일 리포트*`,
    `_${fmtKstDate(report.dateLabel)} (KST)_`,
    ``,
    totalsBlockSlack(report.yesterday, report.dayBefore),
    ``,
    `*📄 인기 페이지 Top 5*`,
    topPagesBlockSlack(report),
    ``,
    `*🌐 트래픽 소스 Top 5*`,
    topSourcesBlockSlack(report),
    ``,
    `*📱 디바이스*`,
    devicesBlockSlack(report),
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
    const telegramText = buildDailyReportMessage(report);   // Telegram HTML
    const slackText = buildDailyReportSlackMessage(report);  // Slack mrkdwn

    // 두 채널 동시 발송. 각 채널은 미설정 시 skipped(무해), 설정됐는데 실패면 error.
    const [tg, sl] = await Promise.all([
      sendTelegramMessage(telegramText),
      sendSlackMessage(slackText),
    ]);

    // 설정됐는데 실패한 채널은 로그로 남겨 Vercel 로그에서 추적 가능하게.
    if (!tg.ok && !tg.skipped) console.error('[daily-report] 텔레그램 발송 실패:', tg.error);
    if (!sl.ok && !sl.skipped) console.error('[daily-report] 슬랙 발송 실패:', sl.error);

    const delivered = tg.ok || sl.ok;
    if (!delivered) {
      const bothSkipped = !!tg.skipped && !!sl.skipped;
      const errParts = [
        tg.ok || tg.skipped ? null : `텔레그램: ${tg.error}`,
        sl.ok || sl.skipped ? null : `슬랙: ${sl.error}`,
      ].filter(Boolean);
      return {
        ok: false,
        skipped: bothSkipped,
        error: bothSkipped
          ? '발송 채널(텔레그램/슬랙)이 하나도 설정되지 않았습니다.'
          : errParts.join(' | ') || '발송 실패',
        dateLabel: report.dateLabel,
      };
    }
    return { ok: true, dateLabel: report.dateLabel };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
