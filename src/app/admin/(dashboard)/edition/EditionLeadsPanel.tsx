'use client';

import { useEffect, useState } from 'react';
import type { Lead } from '@/lib/leads';

interface ApiResp {
  success: boolean;
  leads?: Lead[];
  error?: string;
}

const STATUS_LABEL: Record<Lead['status'], string> = {
  pending: '대기',
  verified: '인증',
  expired: '만료',
};

const STATUS_COLOR: Record<Lead['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-gray-100 text-gray-500',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function EditionLeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Lead['status']>('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', { cache: 'no-store' });
      const data = (await res.json()) as ApiResp;
      if (!res.ok || !data.success || !data.leads) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setLeads(data.leads.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    verified: leads.filter((l) => l.status === 'verified').length,
    expired: leads.filter((l) => l.status === 'expired').length,
  };

  function exportCsv() {
    const header = [
      'createdAt', 'status', 'name', 'email', 'company', 'role',
      'verifiedAt', 'lastViewedAt', 'viewCount',
      'utm_source', 'utm_medium', 'utm_campaign',
    ];
    const rows = filtered.map((l) => [
      l.createdAt,
      l.status,
      l.name,
      l.email,
      l.company ?? '',
      l.role ?? '',
      l.verifiedAt ?? '',
      l.lastViewedAt ?? '',
      String(l.viewCount),
      l.source?.utm_source ?? '',
      l.source?.utm_medium ?? '',
      l.source?.utm_campaign ?? '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edition-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyCatalogUrl(lead: Lead) {
    const url = `${window.location.origin}/edition/${lead.token}/agarwood`;
    try {
      await navigator.clipboard.writeText(url);
      setToast({ kind: 'ok', msg: '카탈로그 URL을 복사했습니다.' });
    } catch {
      setToast({ kind: 'err', msg: '복사 실패 — 브라우저 권한 확인.' });
    }
  }

  async function resendVerification(lead: Lead) {
    if (actionId) return;
    setActionId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setToast({ kind: 'ok', msg: '인증 메일을 재발송했습니다.' });
        loadLeads();
      } else {
        setToast({ kind: 'err', msg: body.message ?? '재발송 실패' });
      }
    } catch (err) {
      setToast({ kind: 'err', msg: err instanceof Error ? err.message : '네트워크 오류' });
    } finally {
      setActionId(null);
    }
  }

  async function deleteLead(lead: Lead) {
    if (actionId) return;
    if (!confirm(`${lead.name} (${lead.email}) 리드를 삭제할까요?`)) return;
    setActionId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setToast({ kind: 'ok', msg: '리드를 삭제했습니다.' });
        loadLeads();
      } else {
        setToast({ kind: 'err', msg: body.message ?? '삭제 실패' });
      }
    } catch (err) {
      setToast({ kind: 'err', msg: err instanceof Error ? err.message : '네트워크 오류' });
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">/agarwood-edition 에서 신청한 리드 목록.</p>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!leads.length}
          className="rounded-lg border border-gold-500 px-4 py-2 text-sm font-semibold text-gold-700 hover:bg-gold-50 disabled:opacity-40"
        >
          CSV 내보내기
        </button>
      </div>

      {/* Stats / filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: 'all', label: '전체', value: stats.total },
          { k: 'verified', label: '인증', value: stats.verified, color: 'text-emerald-600' },
          { k: 'pending', label: '대기', value: stats.pending, color: 'text-amber-600' },
          { k: 'expired', label: '만료', value: stats.expired, color: 'text-gray-400' },
        ].map((s) => (
          <button
            key={s.k}
            type="button"
            onClick={() => setFilter(s.k as 'all' | Lead['status'])}
            className={`rounded-lg border bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 transition ${
              filter === s.k ? 'ring-2 ring-gold-500' : ''
            }`}
          >
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`mt-1 text-2xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">불러오는 중...</div>}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">신청 일시</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">회사 / 역할</th>
                <th className="px-4 py-3 text-right">View</th>
                <th className="px-4 py-3">최근 열람</th>
                <th className="px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${STATUS_COLOR[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{l.name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.company ?? '—'}
                    {l.role ? <span className="ml-2 text-xs text-gray-400">· {l.role}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{l.viewCount}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(l.lastViewedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={`/edition/${l.token}/agarwood`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-[0.7rem] text-gray-700 hover:border-gold-500 hover:text-gold-600"
                        title="카탈로그를 새 탭으로 열기"
                      >
                        열람 ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => copyCatalogUrl(l)}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-[0.7rem] text-gray-700 hover:border-gold-500 hover:text-gold-600"
                        title="카탈로그 URL 복사"
                      >
                        URL
                      </button>
                      {l.status !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => resendVerification(l)}
                          disabled={actionId === l.id}
                          className="rounded border border-gold-300 bg-white px-2 py-1 text-[0.7rem] text-gold-700 hover:bg-gold-50 disabled:opacity-50"
                          title="인증 메일 재발송"
                        >
                          {actionId === l.id ? '...' : '재발송'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteLead(l)}
                        disabled={actionId === l.id}
                        className="rounded border border-red-200 bg-white px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="리드 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    표시할 리드가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
