import type { QrEvent, QrAnalytics, CountBucket, ScanLocation } from './types';

/**
 * 이벤트 배열 → 어드민 분석 집계 (온리드, 순수 함수).
 * 시간 차원은 KST(UTC+9) 기준 — GA4 속성/사이트 운영 시간대와 일치.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']; // getUTCDay 인덱스
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 표시 순서: 월~일
const LANG_LABELS: Record<string, string> = {
  ko: '한국어', ja: '日本語', en: 'English', vi: 'Tiếng Việt', zh: '中文', th: 'ไทย',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function dayStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function kstParts(iso: string): { day: string; hour: number; weekday: number } | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + KST_OFFSET_MS);
  return { day: dayStr(d), hour: d.getUTCHours(), weekday: d.getUTCDay() };
}

/** [from, to] 의 KST 일자 문자열 (zero-fill 용). to 기준 최근 cap 일로 제한. */
function kstDayRange(from: Date, to: Date, cap = 120): string[] {
  const kstMidnight = (x: Date) => {
    const d = new Date(x.getTime() + KST_OFFSET_MS);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };
  const end = kstMidnight(to);
  let start = kstMidnight(from);
  const minStart = new Date(end);
  minStart.setUTCDate(end.getUTCDate() - (cap - 1));
  if (start < minStart) start = minStart;
  const out: string[] = [];
  for (const cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    out.push(dayStr(cur));
  }
  return out;
}

function langLabel(lang?: string): string {
  if (!lang) return '(미상)';
  const base = lang.toLowerCase().slice(0, 2);
  return LANG_LABELS[base] ?? lang.slice(0, 12);
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
  const consents = events.filter((e) => e.type === 'consent');

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

  // 참여율 + 퍼널: 스캔 세션(qsid) 중 사이트 탐색(2P+)·CTA 도달.
  const scanQsids = new Set(scans.map((s) => s.qsid).filter(Boolean));
  const qsidsWithPageview = new Set(pageviews.map((p) => p.qsid).filter(Boolean));
  const qsidsWithCta = new Set(ctas.map((c) => c.qsid).filter(Boolean));
  let engaged = 0;
  let ctaSessions = 0;
  for (const q of scanQsids) {
    if (qsidsWithPageview.has(q)) engaged++;
    if (qsidsWithCta.has(q)) ctaSessions++;
  }
  const engagementRate = scanQsids.size > 0 ? engaged / scanQsids.size : 0;

  // 차원별 카운터
  const byDay = new Map<string, number>();
  const byHour = new Map<string, number>();
  const byWeekdayMap = new Map<number, number>();
  const byDevice = new Map<string, number>();
  const byOs = new Map<string, number>();
  const byBrowser = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byRegion = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byLanguage = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  const byDestination = new Map<string, number>();
  const bySlug = new Map<string, number>();
  // 지도용 위치 클러스터 (도시/지역 단위 centroid)
  const locMap = new Map<string, { sumLat: number; sumLng: number; count: number; label: string }>();

  for (const s of scans) {
    const parts = kstParts(s.at);
    if (parts) {
      byDay.set(parts.day, (byDay.get(parts.day) ?? 0) + 1);
      byHour.set(pad2(parts.hour), (byHour.get(pad2(parts.hour)) ?? 0) + 1);
      byWeekdayMap.set(parts.weekday, (byWeekdayMap.get(parts.weekday) ?? 0) + 1);
    }
    bump(byDevice, s.device);
    bump(byOs, s.os);
    bump(byBrowser, s.browser);
    bump(byCountry, s.country, '(미상)');
    bump(byRegion, s.region, '(미상)');
    bump(byCity, s.city, '(미상)');
    bump(byLanguage, langLabel(s.lang), '(미상)');
    byReferrer.set(referrerHost(s.referrer), (byReferrer.get(referrerHost(s.referrer)) ?? 0) + 1);
    bump(byDestination, s.dest, '/');
    bump(bySlug, s.slug);
    if (typeof s.lat === 'number' && typeof s.lng === 'number') {
      const key = s.city || s.region || s.country || `${s.lat.toFixed(2)},${s.lng.toFixed(2)}`;
      const loc = locMap.get(key) ?? { sumLat: 0, sumLng: 0, count: 0, label: key };
      loc.sumLat += s.lat;
      loc.sumLng += s.lng;
      loc.count++;
      locMap.set(key, loc);
    }
  }

  const topPages = new Map<string, number>();
  for (const p of pageviews) bump(topPages, p.path, '/');

  const byCta = new Map<string, number>();
  for (const c of ctas) bump(byCta, c.ctaType, '기타');

  // 동의 수집(인구통계) — 동의한 건만 연령·성별 집계
  const byAge = new Map<string, number>();
  const byGender = new Map<string, number>();
  let consentedCount = 0;
  let withContact = 0;
  for (const c of consents) {
    if (!c.consented) continue;
    consentedCount++;
    if (c.contact) withContact++;
    if (c.age) bump(byAge, c.age, '비공개');
    if (c.gender) bump(byGender, c.gender, '비공개');
  }

  // scansByDay: 빈 날짜를 0으로 채워 추이 그래프 막대 폭을 일정하게 (그래프 비대 방지)
  const scansByDay = kstDayRange(opts.from, opts.to).map((key) => ({ key, count: byDay.get(key) ?? 0 }));
  const scansByHour = Array.from({ length: 24 }, (_, h) => ({ key: pad2(h), count: byHour.get(pad2(h)) ?? 0 }));
  const byWeekday = WEEKDAY_ORDER.map((idx) => ({ key: WEEKDAY_LABELS[idx], count: byWeekdayMap.get(idx) ?? 0 }));

  const scanLocations: ScanLocation[] = [...locMap.values()]
    .map((l) => ({ lat: l.sumLat / l.count, lng: l.sumLng / l.count, count: l.count, label: l.label }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 200);

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
    byWeekday,
    byDevice: topBuckets(byDevice),
    byOs: topBuckets(byOs),
    byBrowser: topBuckets(byBrowser),
    byCountry: topBuckets(byCountry),
    byRegion: topBuckets(byRegion),
    byCity: topBuckets(byCity),
    byLanguage: topBuckets(byLanguage),
    byReferrer: topBuckets(byReferrer),
    byDestination: topBuckets(byDestination),
    topPages: topBuckets(topPages, 15),
    byCta: topBuckets(byCta),
    funnel: { scans: scans.length, engaged, cta: ctaSessions },
    byAge: topBuckets(byAge),
    byGender: topBuckets(byGender),
    consent: { prompts: consents.length, consented: consentedCount, withContact },
    scanLocations,
    ...(opts.slug ? {} : { bySlug: topBuckets(bySlug, 50) }),
  };
}
