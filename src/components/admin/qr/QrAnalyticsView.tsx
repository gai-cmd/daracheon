'use client';

import { useEffect, useState } from 'react';
import MiniBarChart from '@/components/admin/MiniBarChart';
import type { QrAnalytics, CountBucket } from '@/lib/qr/types';

const RANGES = [
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 90, label: '90일' },
  { days: 365, label: '1년' },
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-warm-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-warm-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-warm-500">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, data, unit = '건' }: { title: string; data: CountBucket[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-xl border border-warm-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-warm-800">{title}</h4>
      {data.length === 0 ? (
        <p className="text-xs text-warm-400">데이터 없음</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-warm-700" title={d.key}>
                {d.label || d.key}
              </span>
              <span className="relative h-4 flex-1 overflow-hidden rounded bg-warm-100">
                <span
                  className="absolute inset-y-0 left-0 rounded bg-gold-400"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-xs font-medium text-warm-700">
                {d.count.toLocaleString()}{unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function QrAnalyticsView({ slug }: { slug?: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<QrAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ slug: slug ?? 'all', days: String(days) });
    fetch(`/api/admin/qr/analytics?${qs}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success) setData(j.analytics);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, days]);

  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                days === r.days ? 'bg-warm-900 text-white' : 'bg-white text-warm-700 border border-warm-300 hover:bg-warm-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-warm-400">불러오는 중…</span>}
      </div>

      {t && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="총 스캔" value={t.scans.toLocaleString()} />
            <Stat label="순 방문자" value={t.uniqueVisitors.toLocaleString()} />
            <Stat label="재방문 스캔" value={t.revisits.toLocaleString()} />
            <Stat label="사이트 내 페이지뷰" value={t.pageviews.toLocaleString()} />
            <Stat label="CTA 클릭" value={t.ctaClicks.toLocaleString()} />
            <Stat label="참여율" value={`${Math.round(t.engagementRate * 100)}%`} sub="스캔 후 추가 페이지 열람" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <MiniBarChart
              title="일자별 스캔 추이"
              unit="회"
              data={data!.scansByDay.slice(-30).map((d) => ({ label: d.key.slice(5), value: d.count }))}
            />
            <MiniBarChart
              title="시간대별 스캔 (KST)"
              unit="회"
              data={data!.scansByHour.map((d) => ({ label: d.key, value: d.count }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Breakdown title="기기" data={data!.byDevice} unit="회" />
            <Breakdown title="OS" data={data!.byOs} unit="회" />
            <Breakdown title="브라우저" data={data!.byBrowser} unit="회" />
            <Breakdown title="국가" data={data!.byCountry} unit="회" />
            <Breakdown title="도시" data={data!.byCity} unit="회" />
            <Breakdown title="유입 경로" data={data!.byReferrer} unit="회" />
            <Breakdown title="목적지 분산" data={data!.byDestination} unit="회" />
            <Breakdown title="유입 후 많이 본 페이지" data={data!.topPages} unit="뷰" />
            <Breakdown title="CTA 클릭 유형" data={data!.byCta} unit="회" />
          </div>

          {data!.bySlug && data!.bySlug.length > 0 && (
            <Breakdown title="QR별 스캔 (전체)" data={data!.bySlug} unit="회" />
          )}

          {t.scans === 0 && (
            <p className="rounded-lg border border-dashed border-warm-300 bg-warm-50 p-4 text-center text-sm text-warm-500">
              아직 스캔 데이터가 없습니다. QR을 인쇄·배포한 뒤 스캔이 발생하면 여기에 집계됩니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
