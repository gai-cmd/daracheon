'use client';

import { useEffect, useState } from 'react';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

interface Props {
  /** 카테고리가 저장될 때 호출. 부모(/admin/products)가 필터/기본값을 갱신할 수 있도록 한다. */
  onSaved?: (categories: ProductCategory[]) => void;
}

const ALL_ENTRY: ProductCategory = { id: 'all', label: '전체', labelEn: 'All' };

export default function ProductCategoryEditor({ onSaved }: Props) {
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  /* ─── Fetch ─── */
  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/product-categories', { cache: 'no-store' });
      const data = await res.json();
      const list: ProductCategory[] = Array.isArray(data?.categories) ? data.categories : [];
      // 'all' 보장 + 첫 위치.
      const withoutAll = list.filter((c) => c.id !== 'all');
      const all = list.find((c) => c.id === 'all') ?? ALL_ENTRY;
      setItems([all, ...withoutAll]);
    } catch (err) {
      console.error('[ProductCategoryEditor] fetch failed', err);
      setToast({ kind: 'err', text: '카테고리를 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Mutators ─── */
  function updateField(idx: number, field: keyof ProductCategory, value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const target = idx + dir;
      // 'all' 은 항상 0번 위치 — 1번과 swap 불가.
      if (idx === 0 || target === 0 || target < 1 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { id: '', label: '', labelEn: '' },
    ]);
  }

  function removeRow(idx: number) {
    setItems((prev) => {
      if (prev[idx]?.id === 'all') return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }

  /* ─── Save ─── */
  async function handleSave() {
    // 클라이언트 사전 검증.
    const trimmed = items.map((c) => ({
      id: c.id.trim(),
      label: c.label.trim(),
      labelEn: c.labelEn.trim(),
    }));
    const ids = trimmed.filter((c) => c.id !== 'all').map((c) => c.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);

    for (const c of trimmed) {
      if (!c.id) {
        setToast({ kind: 'err', text: '비어있는 id 가 있습니다.' });
        return;
      }
      if (!c.label) {
        setToast({ kind: 'err', text: `"${c.id}" 항목의 한글 라벨이 비어있습니다.` });
        return;
      }
    }
    if (dupes.length > 0) {
      setToast({ kind: 'err', text: `id 중복: ${[...new Set(dupes)].join(', ')}` });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/product-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setToast({
          kind: 'err',
          text: data?.message ?? '저장에 실패했습니다.',
        });
        return;
      }
      const saved: ProductCategory[] = Array.isArray(data?.categories)
        ? data.categories
        : trimmed;
      setItems(saved);
      setToast({ kind: 'ok', text: '카테고리가 저장되었습니다.' });
      onSaved?.(saved);
    } catch (err) {
      console.error('[ProductCategoryEditor] save error', err);
      setToast({ kind: 'err', text: '네트워크 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  /* ─── Render ─── */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      {/* Header (collapse toggle) */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">카테고리 관리</span>
          <span className="text-xs text-gray-400">
            · /products 페이지의 탭 라벨과 순서를 편집합니다
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 px-5 py-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto_auto] gap-2 px-1 mb-2 text-xs text-gray-400">
                <span></span>
                <span>id (제품의 category 값과 일치해야 함)</span>
                <span>한글 라벨</span>
                <span>영문 라벨</span>
                <span className="text-center w-16">순서</span>
                <span className="text-center w-12">삭제</span>
              </div>

              <div className="space-y-2">
                {items.map((c, i) => {
                  const isAll = c.id === 'all';
                  return (
                    <div
                      key={`${c.id}-${i}`}
                      className="grid grid-cols-[28px_1fr_1fr_1fr_auto_auto] gap-2 items-center"
                    >
                      <span className="text-xs text-gray-300 text-center">{i + 1}</span>
                      <input
                        type="text"
                        value={c.id}
                        onChange={(e) => updateField(i, 'id', e.target.value)}
                        disabled={isAll}
                        placeholder="예: 오일"
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) => updateField(i, 'label', e.target.value)}
                        disabled={isAll}
                        placeholder="예: 오일"
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <input
                        type="text"
                        value={c.labelEn}
                        onChange={(e) => updateField(i, 'labelEn', e.target.value)}
                        disabled={isAll}
                        placeholder="예: Essential Oil"
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={isAll || i <= 1}
                          aria-label="위로"
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={isAll || i >= items.length - 1}
                          aria-label="아래로"
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={isAll}
                        aria-label="삭제"
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={addRow}
                  className="text-xs font-medium text-gold-700 hover:text-gold-800"
                >
                  + 카테고리 추가
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchCategories}
                    disabled={saving}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    되돌리기
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-gold-500 text-white text-xs font-medium hover:bg-gold-600 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-gray-400 leading-5">
                · <strong>전체</strong> 항목은 자동으로 첫 번째에 고정되며 편집/삭제할 수 없습니다.<br />
                · <strong>id</strong> 는 제품 데이터의 <code>category</code> 필드와 정확히 일치해야 합니다 (예: <code>오일</code>, <code>환</code>).<br />
                · 현재 사용 중인 id 를 삭제하려고 하면 저장이 차단됩니다 — 먼저 해당 제품들의 카테고리를 변경하세요.
              </p>
            </>
          )}
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 text-sm font-medium rounded-xl shadow-lg ${
            toast.kind === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
