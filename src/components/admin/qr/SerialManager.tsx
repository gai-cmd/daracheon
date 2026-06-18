'use client';

import { useCallback, useEffect, useState } from 'react';
import { encodeMatrix } from '@/lib/qr/encoder';
import { renderSvg } from '@/lib/qr/render';
import { getStyle } from '@/lib/qr/presets';

interface Batch {
  id: string;
  product: string;
  lot?: string;
  quantity: number;
  createdAt: string;
}

function downloadText(text: string, filename: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SerialManager({ siteOrigin }: { siteOrigin: string }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState('');
  const [lot, setLot] = useState('');
  const [qty, setQty] = useState('100');
  const [creating, setCreating] = useState(false);
  const [voidCode, setVoidCode] = useState('');
  const [stats, setStats] = useState<Record<string, { total: number; activated: number; suspicious: number }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/qr/serials', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success) setBatches(j.batches ?? []);
    } catch {
      setToast('불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const authUrl = (code: string) => `${siteOrigin}/auth/${code}`;

  const create = async () => {
    if (!product.trim()) return setToast('제품명을 입력하세요.');
    const n = Number(qty) || 0;
    if (n < 1) return setToast('수량을 입력하세요.');
    setCreating(true);
    try {
      const r = await fetch('/api/admin/qr/serials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', product: product.trim(), lot: lot.trim() || undefined, quantity: n }),
      });
      const j = await r.json();
      if (!j?.success) return setToast(j?.message ?? '생성 실패');
      setToast(`${j.codes.length}개 시리얼이 생성되었습니다.`);
      setProduct('');
      setLot('');
      await fetchBatches();
    } catch {
      setToast('생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const getCodes = async (batchId: string): Promise<string[]> => {
    const r = await fetch(`/api/admin/qr/serials?batchId=${encodeURIComponent(batchId)}`, { cache: 'no-store' });
    const j = await r.json();
    if (j?.success) {
      setStats((p) => ({ ...p, [batchId]: j.stats }));
      return j.codes ?? [];
    }
    return [];
  };

  const loadStats = async (batchId: string) => {
    setBusy(`stats-${batchId}`);
    try {
      await getCodes(batchId);
    } finally {
      setBusy(null);
    }
  };

  const downloadCsv = async (b: Batch) => {
    setBusy(`csv-${b.id}`);
    try {
      const codes = await getCodes(b.id);
      const rows = ['serial,auth_url', ...codes.map((c) => `${c},${authUrl(c)}`)];
      downloadText(rows.join('\n'), `정품시리얼_${b.product}_${codes.length}개.csv`);
    } finally {
      setBusy(null);
    }
  };

  const printSheet = async (b: Batch) => {
    setBusy(`sheet-${b.id}`);
    try {
      const codes = await getCodes(b.id);
      const style = getStyle('white-black');
      const cells = codes
        .map((c) => {
          const svg = renderSvg(encodeMatrix(authUrl(c), 'M'), style, { modulePx: 4 });
          return `<div class="cell"><div class="qr">${svg}</div><div class="code">${c}</div></div>`;
        })
        .join('');
      const w = window.open('', '_blank');
      if (!w) return setToast('팝업이 차단되었습니다. 허용 후 다시 시도하세요.');
      w.document.write(`<!doctype html><html><head><title>정품 QR 시트 — ${b.product}</title><style>
        @page{margin:10mm}body{font-family:sans-serif;margin:0}
        h2{font-size:14px;margin:8px}
        .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:8px}
        .cell{border:1px solid #eee;border-radius:6px;padding:6px;text-align:center;break-inside:avoid}
        .qr svg{width:100%;height:auto;display:block}
        .code{font-family:monospace;font-size:9px;margin-top:3px;word-break:break-all}
      </style></head><body><h2>${b.product}${b.lot ? ` · LOT ${b.lot}` : ''} — ${codes.length}개</h2><div class="grid">${cells}</div>
      <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
      w.document.close();
    } finally {
      setBusy(null);
    }
  };

  const doVoid = async () => {
    const c = voidCode.trim().toUpperCase();
    if (!c) return;
    if (!confirm(`코드 ${c} 를 무효 처리하시겠습니까? (해당 코드 스캔 시 '무효' 안내가 표시됩니다)`)) return;
    try {
      const r = await fetch('/api/admin/qr/serials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'void', code: c }) });
      const j = await r.json();
      setToast(j?.success ? '무효 처리되었습니다.' : j?.message ?? '실패');
      if (j?.success) setVoidCode('');
    } catch {
      setToast('처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-gray-900">정품인증 배치 만들기</h3>
        <p className="mb-3 text-xs text-gray-500">제품 단위 고유 코드(QR)를 대량 생성합니다. 스캔하면 <code className="rounded bg-gray-100 px-1">/auth/코드</code>에서 등록 여부·최초 인증을 확인합니다.</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-gray-600">제품명</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="예: 대라천 참침향 오일 캡슐" />
          </label>
          <label className="w-32">
            <span className="mb-1 block text-xs text-gray-600">LOT(선택)</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={lot} onChange={(e) => setLot(e.target.value)} placeholder="2026-A" />
          </label>
          <label className="w-24">
            <span className="mb-1 block text-xs text-gray-600">수량</span>
            <input type="number" min={1} max={5000} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <button type="button" className="adm-btn-primary" disabled={creating} onClick={create}>{creating ? '생성 중…' : '생성'}</button>
        </div>
      </div>

      {/* 무효 처리 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">코드 무효 처리</span>
          <input className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" value={voidCode} onChange={(e) => setVoidCode(e.target.value)} placeholder="ZA-XXXXXXXXXX" />
          <button type="button" className="rounded-lg border border-terracotta px-3 py-2 text-xs font-medium text-terracotta hover:bg-terracotta-bg" onClick={doVoid}>무효 처리</button>
          <span className="text-[11px] text-gray-400">분실·도난·반품 코드를 무효화하면 스캔 시 경고가 표시됩니다.</span>
        </div>
      </div>

      {/* 배치 목록 */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-gray-900">생성된 배치</h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : batches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">아직 생성된 배치가 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const st = stats[b.id];
              return (
                <div key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="min-w-[160px] flex-1">
                    <div className="font-medium text-gray-900">{b.product}</div>
                    <div className="text-xs text-gray-500">{b.lot ? `LOT ${b.lot} · ` : ''}{b.quantity.toLocaleString()}개 · {b.createdAt.slice(0, 10)}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {st ? (
                      <span>활성 <b>{st.activated}</b>/{st.total}{st.suspicious > 0 && <span className="ml-1 text-terracotta">· 의심 {st.suspicious}</span>}</span>
                    ) : (
                      <button type="button" className="text-gold-700 hover:underline" disabled={busy === `stats-${b.id}`} onClick={() => loadStats(b.id)}>{busy === `stats-${b.id}` ? '집계 중…' : '활성 현황 보기'}</button>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="text-xs font-medium text-gold-700 hover:underline" disabled={busy === `csv-${b.id}`} onClick={() => downloadCsv(b)}>{busy === `csv-${b.id}` ? '…' : 'CSV'}</button>
                    <button type="button" className="text-xs font-medium text-gray-700 hover:underline" disabled={busy === `sheet-${b.id}`} onClick={() => printSheet(b)}>{busy === `sheet-${b.id}` ? '…' : 'QR 시트 인쇄'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <div className="animate-fade-in fixed bottom-6 right-6 z-[100] rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}
