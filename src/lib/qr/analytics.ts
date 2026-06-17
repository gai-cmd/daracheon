import type { QrEvent, QrAnalytics, CountBucket } from './types';

/**
 * 이벤트 배열 → 어드민 분석 집계 (온리드, 순수 함수).
 * 시간 차원은 KST(UTC+9) 기준 — GA4 속성/사이트 운영 시간대와 일치.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstParts(iso: string): { day: string; hour: number } | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + KST_OFFSET_MS);
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { day, hour: d.getUTCHours() };
}

function topBuckets(counts: Map<string, number>, limit = 12): CountBucket[] {
  const arr = [...counts.entries()].map(([key, count]) => ({ key, count }));
  arr.sort((a, b) => b.count - a.count);
  if (arr.length <= limit) return arr;
  const head = arr.slice(0, limit);
  const otherCount = arr.slice(limit).reduce((s, b) => s + b.count, 0);
  if (otherCount > 0) head.push({ key: '기타', count: otherCount });
  return head;
}

function bump(map: Map<string, number>, key: string | undefined | null, fallback = '(미상)') {
  const k = (key ?? '').toString().trim() || fallback;
  map.set(k, (map.get(k) ?? 0) + 1);
}

function referrerHost(ref?: string): string {
  if (!ref) return '(직접/오프라인)';
  try {
    return new URL(ref).hostname || '(직접/오프라인)';
  } catch {
    return ref.slice(0, 40);
  }
}

export interface AggregateOptions {
  /** 특정 QR slug 만 집계 (없으면 전체) */
  slug?: string;
  from: Date;
  to: Date;
}

export function aggregate(allEvents: QrEvent[], opts: AggregateOptions): QrAnalytics {
  const events = opts.slug ? allEvents.filter((e) => e.slug === opts.slug) : allEvents;

  const scans = events.filter((e) => e.type === 'scan');
  const pageviews = events.filter((e) => e.type === 'pageview');
  const ctas = events.filter((e) => e.type === 'cta');

  // 고유 방문자: 비-null vid distinct + null vid(프라이버시 거부) 스캔은 각각 1로.
  const vids = new Set<string>();
  let nullVidScans = 0;
  let revisits = 0;
  for (const s of scans) {
    if (s.vid) vids.add(s.vid);
    else nullVidScans++;
    if (s.isRevisit) revisits++;
  }
  const uniqueVisitors = vids.size + nullVidScans;

  // 참여율: 스캔 세션(qsid) 중 사이트 내 추가 페이지를 1개 이상 본 비율.
  const scanQsids = new Set(scans.map((s) => s.qsid).filter(Boolean));
  const qsidsWithPageview = new Set(pageviews.map((p) => p.qsid).filter(Boolean));
  let engaged = 0;
  for (const q of scanQsids) if (qsidsWithPageview.has(q)) engaged++;
  const engagementRate = scanQsids.size > 0 ? engaged / scanQsids.size : 0;

  // 차원별 카운터
  const byDay = new Map<string, number>();
  const byHour = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byOs = new Map<string, number>();
  const byBrowser = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  const byDestination = new Map<string, number>();
  const bySlug = new Map<string, number>();

  for (const s of scans) {
    const parts = kstParts(s.at);
    if (parts) {
      byDay.set(parts.day, (byDay.get(parts.day) ?? 0) + 1);
      const hk = String(parts.hour).padStart(2, '0');
      byHour.set(hk, (byHour.get(hk) ?? 0) + 1);
    }
    bump(byDevice, s.device);
    bump(byOs, s.os);
    bump(byBrowser, s.browser);
    bump(byCountry, s.country, '(미상)');
    bump(byCity, s.city, '(미상)');
    byReferrer.set(referrerHost(s.referrer), (byReferrer.get(referrerHost(s.referrer)) ?? 0) + 1);
    bump(byDestination, s.dest, '/');
    bump(bySlug, s.slug);
  }

  const topPages = new Map<string, number>();
  for (const p of pageviews) bump(topPages, p.path, '/');

  const byCta = new Map<string, number>();
  for (const c of ctas) bump(byCta, c.ctaType, '기타');

  // scansByDay: 날짜순 정렬(추이 그래프용)
  const scansByDay = [...byDay.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => a.key.localeCompare(b.key));
  const scansByHour = Array.from({ length: 24 }, (_, h) => {
    const key = String(h).padStart(2, '0');
    return { key, count: byHour.get(key) ?? 0 };
  });

  return {
    slug: opts.slug,
    range: { from: opts.from.toISOString(), to: opts.to.toISOString() },
    totals: {
      scans: scans.length,
      uniqueVisitors,
      revisits,
      pageviews: pageviews.length,
      ctaClicks: ctas.length,
      engagementRate,
    },
    scansByDay,
    scansByHour,
    byDevice: topBuckets(byDevice),
    byOs: topBuckets(byOs),
    byBrowser: topBuckets(byBrowser),
    byCountry: topBuckets(byCountry),
    byCity: topBuckets(byCity),
    byReferrer: topBuckets(byReferrer),
    byDestination: topBuckets(byDestination),
    topPages: topBuckets(topPages, 15),
    byCta: topBuckets(byCta),
    ...(opts.slug ? {} : { bySlug: topBuckets(bySlug, 50) }),
  };
}
