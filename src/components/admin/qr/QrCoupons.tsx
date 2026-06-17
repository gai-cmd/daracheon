'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Coupon } from '@/lib/qr/types';

export default function QrCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/qr/coupons', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success) setCoupons(j.coupons ?? []);
    } catch {
      setToast('쿠폰을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const markUsed = async (code: string) => {
    if (!confirm(`쿠폰 ${code} 를 사용 처리하시겠습니까?`)) return;
    try {
      const r = await fetch('/api/admin/qr/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (j?.success) {
        setToast('사용 처리되었습니다.');
        setCoupons((prev) => prev.map((c) => (c.code === code ? { ...c, used: true, usedAt: j.coupon?.usedAt } : c)));
      } else {
        setToast(j?.message ?? '처리 실패');
        if (j?.coupon) setCoupons((prev) => prev.map((c) => (c.code === code ? { ...c, used: true } : c)));
      }
    } catch {
      setToast('처리 중 오류가 발생했습니다.');
    }
  };

  const q = query.trim().toUpperCase();
  const filtered = q
    ? coupons.filter((c) => c.code.toUpperCase().includes(q) || (c.contact ?? '').toUpperCase().includes(q) || (c.name ?? '').toUpperCase().includes(q))
    : coupons;

  const total = coupons.length;
  const usedCount = coupons.filter((c) => c.used).length;
  const fmt = (s?: string) => (s ? s.slice(0, 10) : '-');
  const expired = (c: Coupon) => new Date(c.validUntil).getTime() < Date.now();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          발급 <b>{total.toLocaleString()}</b> · 사용 <b>{usedCount.toLocaleString()}</b> · 미사용 <b>{(total - usedCount).toLocaleString()}</b>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="코드·연락처·이름 검색 (현장 사용처리)"
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
          />
          <button type="button" className="adm-btn-secondary" onClick={fetchCoupons}>
            {loading ? '갱신 중…' : '↻'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
          {total === 0 ? '발급된 쿠폰이 없습니다. (동의 수집 + 쿠폰 발급 QR 을 스캔·동의하면 자동 발급됩니다)' : '검색 결과가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="min-w-[120px]">
                <div className="font-mono text-base font-bold text-gray-900">{c.code}</div>
                <div className="text-xs text-gray-500">{c.discount}</div>
              </div>
              <div className="min-w-[140px] flex-1 text-xs text-gray-600">
                <div>{c.qrName ?? c.slug}</div>
                {(c.contact || c.name) && <div className="text-gray-500">{[c.name, c.contact].filter(Boolean).join(' · ')}</div>}
                {(c.age || c.gender) && <div className="text-gray-400">{[c.age, c.gender].filter(Boolean).join(' · ')}</div>}
              </div>
              <div className="text-xs text-gray-500">
                <div>발급 {fmt(c.issuedAt)}</div>
                <div className={expired(c) ? 'text-terracotta' : ''}>~{fmt(c.validUntil)}{expired(c) ? ' (만료)' : ''}</div>
              </div>
              <div className="shrink-0">
                {c.used ? (
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">사용됨 {fmt(c.usedAt)}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => markUsed(c.code)}
                    className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700 hover:bg-sage-200"
                  >
                    사용 처리
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-[100] rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}
