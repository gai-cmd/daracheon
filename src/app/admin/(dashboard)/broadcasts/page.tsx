'use client';

import { useEffect, useMemo, useState } from 'react';

interface Broadcast {
  id: string;
  channel: string;
  scheduledAt: string;
  durationMinutes: number;
  host?: string;
  productIds: string[];
  specialPrice?: number;
  regularPrice?: number;
  discountRate?: number;
  livestreamUrl?: string;
  vodUrl?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  salesCount?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductLite {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<Broadcast['status'], string> = {
  scheduled: '편성 예정',
  live: '방송 중',
  ended: '방송 종료',
  canceled: '취소됨',
};

const STATUS_COLORS: Record<Broadcast['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  live: 'bg-red-50 text-red-700 border-red-200',
  ended: 'bg-gray-100 text-gray-700 border-gray-200',
  canceled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function fmtDateTimeLocal(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDisplay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emptyDraft(): Broadcast {
  return {
    id: '',
    channel: '',
    scheduledAt: new Date().toISOString(),
    durationMinutes: 60,
    productIds: [],
    status: 'scheduled',
    createdAt: '',
    updatedAt: '',
  };
}

export default function AdminBroadcastsPage() {
  const [items, setItems] = useState<Broadcast[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | Broadcast['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [draft, setDraft] = useState<Broadcast | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    try {
      const res = await fetch('/api/admin/broadcasts', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch (err) {
      console.error('[Admin Broadcasts] fetch error:', err);
      setToast('방송 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      const list = (data.products || data.items || []) as Array<{ id: string; name: string }>;
      setProducts(list.map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error('[Admin Broadcasts] products fetch error:', err);
    }
  }

  useEffect(() => {
    refresh();
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !b.channel.toLowerCase().includes(q) &&
          !(b.host ?? '').toLowerCase().includes(q) &&
          !(b.description ?? '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  function openAdd() {
    setDraft(emptyDraft());
    setIsAddMode(true);
  }

  function openEdit(item: Broadcast) {
    setDraft(JSON.parse(JSON.stringify(item)));
    setIsAddMode(false);
  }

  function closeEdit() {
    setDraft(null);
    setIsAddMode(false);
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.channel.trim() || !draft.scheduledAt) {
      setToast('방송사와 일시는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const endpoint = '/api/admin/broadcasts';
      const method = isAddMode ? 'POST' : 'PUT';
      const payload: Record<string, unknown> = { ...draft };
      if (isAddMode) delete (payload as Record<string, unknown>).id;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '저장에 실패했습니다.');
        return;
      }
      setToast(isAddMode ? '방송이 등록되었습니다.' : '방송이 수정되었습니다.');
      closeEdit();
      await refresh();
    } catch (err) {
      console.error('[Admin Broadcasts] save error:', err);
      setToast('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '삭제에 실패했습니다.');
        return;
      }
      setToast('방송이 삭제되었습니다.');
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      console.error('[Admin Broadcasts] delete error:', err);
      setToast('삭제 중 오류가 발생했습니다.');
    }
  }

  function toggleProductId(id: string) {
    if (!draft) return;
    const exists = draft.productIds.includes(id);
    setDraft({
      ...draft,
      productIds: exists ? draft.productIds.filter((x) => x !== id) : [...draft.productIds, id],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-gray-500">총 {items.length}건</p>
          <p className="mt-1 text-sm text-gray-400">홈쇼핑 방송 편성 일정과 성과를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gold-600"
        >
          + 방송 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(['all', 'scheduled', 'live', 'ended', 'canceled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                statusFilter === s
                  ? 'border-gold-500 bg-gold-50 text-gold-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? '전체' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="방송사/MC/설명 검색..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:w-64"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">등록된 방송이 없습니다.</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-3 text-xs font-medium text-gold-600 hover:underline"
          >
            + 첫 방송 등록하기
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-[0.72rem] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">방송사</th>
                <th className="px-4 py-3 text-left font-medium">일시</th>
                <th className="px-4 py-3 text-left font-medium">MC</th>
                <th className="px-4 py-3 text-left font-medium">특가</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.channel}</div>
                    {b.description && (
                      <div className="mt-0.5 line-clamp-1 max-w-xs text-xs text-gray-400">{b.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {fmtDisplay(b.scheduledAt)}
                    <div className="text-xs text-gray-400">{b.durationMinutes}분</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.host || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.specialPrice ? `${b.specialPrice.toLocaleString('ko-KR')}원` : '-'}
                    {b.discountRate ? (
                      <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[0.65rem] text-red-600">
                        -{b.discountRate}%
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(b)}
                      className="mr-2 text-xs text-gold-600 hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold">{isAddMode ? '방송 등록' : '방송 수정'}</h2>
              <button type="button" onClick={closeEdit} className="text-2xl text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    방송사 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.channel}
                    onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
                    placeholder="롯데홈쇼핑"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">MC / 호스트</label>
                  <input
                    type="text"
                    value={draft.host ?? ''}
                    onChange={(e) => setDraft({ ...draft, host: e.target.value })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    방송 일시 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={fmtDateTimeLocal(draft.scheduledAt)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft({ ...draft, scheduledAt: v ? new Date(v).toISOString() : '' });
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">방송 시간(분)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={draft.durationMinutes}
                    onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">정가</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.regularPrice ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, regularPrice: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">특가</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.specialPrice ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, specialPrice: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">할인율(%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.discountRate ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, discountRate: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">라이브 스트림 URL</label>
                  <input
                    type="url"
                    value={draft.livestreamUrl ?? ''}
                    onChange={(e) => setDraft({ ...draft, livestreamUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">VOD URL</label>
                  <input
                    type="url"
                    value={draft.vodUrl ?? ''}
                    onChange={(e) => setDraft({ ...draft, vodUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">판매 제품 연결</label>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 제품이 없습니다.</p>
                ) : (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-gray-200 p-3">
                    {products.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.productIds.includes(p.id)}
                          onChange={() => toggleProductId(p.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">설명</label>
                <textarea
                  rows={3}
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">상태</label>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as Broadcast['status'] })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="scheduled">편성 예정</option>
                    <option value="live">방송 중</option>
                    <option value="ended">방송 종료</option>
                    <option value="canceled">취소</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">판매량(개)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.salesCount ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, salesCount: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {(draft.status === 'ended' || draft.feedback) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">방송 후 피드백</label>
                  <textarea
                    rows={3}
                    value={draft.feedback ?? ''}
                    onChange={(e) => setDraft({ ...draft, feedback: e.target.value })}
                    className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-60"
              >
                {saving ? '저장 중...' : isAddMode ? '등록' : '수정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">방송 삭제</h3>
            <p className="mb-5 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{deleteTarget.channel}</span> ({fmtDisplay(deleteTarget.scheduledAt)}) 방송을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
