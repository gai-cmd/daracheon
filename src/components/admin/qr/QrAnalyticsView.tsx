'use client';

import { useEffect, useState } from 'react';
import MiniBarChart from '@/components/admin/MiniBarChart';
import type { QrAnalytics, CountBucket } from '@/lib/qr/types';

const RANGES = [
  { days: 1, label: '오늘(실시간)' },
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 90, label: '90일' },
  { days: 365, label: '1년' },
];
const REALTIME_POLL_MS = 20_000;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, data, unit = '건' }: { title: string; data: CountBucket[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-gray-800">{title}</h4>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400">데이터 없음</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-gray-700" title={d.key}>
                {d.label || d.key}
              </span>
              <span className="relative h-4 flex-1 overflow-hidden rounded bg-gray-100">
                <span
                  className="absolute inset-y-0 left-0 rounded bg-gold-400"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-xs font-medium text-gray-700">
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
  const [nonce, setNonce] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const realtime = days <= 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ slug: slug ?? 'all', days: String(days), fresh: '1' });
    fetch(`/api/admin/qr/analytics?${qs}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success) {
          setData(j.analytics);
          setUpdatedAt(new Date().toLocaleTimeString('ko-KR'));
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, days, nonce]);

  // 실시간(오늘) 선택 시 자동 갱신.
  useEffect(() => {
    if (!realtime) return;
    const t = setInterval(() => setNonce((n) => n + 1), REALTIME_POLL_MS);
    return () => clearInterval(t);
  }, [realtime]);

  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                days === r.days ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {realtime && (
            <span className="inline-flex items-center gap-1 text-sage-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-500" /> 실시간
            </span>
          )}
          {updatedAt && <span>업데이트 {updatedAt}</span>}
          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            {loading ? '갱신 중…' : '↻ 새로고침'}
          </button>
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-gray-400">
        ※ 스캔/이동 기록은 저장소 전파로 인해 발생 후 <b>최대 1분</b> 뒤 집계에 반영됩니다. 비활성 QR은 스캔해도 기록되지 않습니다.
      </p>

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
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
              아직 스캔 데이터가 없습니다. QR을 인쇄·배포한 뒤 스캔이 발생하면 여기에 집계됩니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
