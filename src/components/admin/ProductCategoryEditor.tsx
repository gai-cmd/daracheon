'use client';

import { useEffect, useState } from 'react';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

/** 편집 행. originalId 는 최초 로드 시점의 id 로, rename 감지에 쓰인다. */
interface EditableCategory extends ProductCategory {
  /** 새로 추가된 행이면 undefined. 기존 행이면 DB 의 원래 id. */
  originalId?: string;
}

interface ConflictProduct {
  id: string;
  name: string;
  slug?: string;
}

interface ConflictTarget {
  id: string;
  label: string;
}

interface ConflictState {
  inUse: Record<string, ConflictProduct[]>;
  targets: ConflictTarget[];
  /** 마지막 저장 시도에서 보낸 categories — 매핑 후 재시도에 그대로 사용. */
  pendingCategories: Array<EditableCategory>;
  /** 카테고리별 사용자가 선택한 이동 대상. */
  selection: Record<string, string>;
}

interface Props {
  /** 카테고리가 저장될 때 호출. 부모(/admin/products)가 필터/기본값을 갱신할 수 있도록 한다. */
  onSaved?: (categories: ProductCategory[]) => void;
}

const ALL_ENTRY: EditableCategory = { id: 'all', label: '전체', labelEn: 'All', originalId: 'all' };

export default function ProductCategoryEditor({ onSaved }: Props) {
  const [items, setItems] = useState<EditableCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  /* ─── Fetch ─── */
  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/product-categories', { cache: 'no-store' });
      const data = await res.json();
      const list: ProductCategory[] = Array.isArray(data?.categories) ? data.categories : [];
      // 'all' 보장 + 첫 위치. 모든 행에 originalId = 현재 id 부여 (기존 행 표시).
      const withoutAll = list.filter((c) => c.id !== 'all').map((c) => ({ ...c, originalId: c.id }));
      const allRaw = list.find((c) => c.id === 'all');
      const all: EditableCategory = allRaw
        ? { ...allRaw, originalId: 'all' }
        : ALL_ENTRY;
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
  async function performSave(
    payloadCategories: EditableCategory[],
    reassign?: Record<string, string>
  ) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { categories: payloadCategories };
      if (reassign && Object.keys(reassign).length > 0) body.reassign = reassign;

      const res = await fetch('/api/admin/product-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        if (
          res.status === 409 &&
          data?.inUse &&
          typeof data.inUse === 'object' &&
          Array.isArray(data?.targets)
        ) {
          // 첫 사용 가능한 타겟을 기본 선택값으로 깔아준다.
          const firstTarget = (data.targets as ConflictTarget[])[0]?.id ?? '';
          const selection: Record<string, string> = {};
          for (const oldId of Object.keys(data.inUse)) selection[oldId] = firstTarget;
          setConflict({
            inUse: data.inUse as Record<string, ConflictProduct[]>,
            targets: data.targets as ConflictTarget[],
            pendingCategories: payloadCategories,
            selection,
          });
        } else {
          setToast({
            kind: 'err',
            text: data?.message ?? '저장에 실패했습니다.',
          });
        }
        return;
      }
      const saved: ProductCategory[] = Array.isArray(data?.categories)
        ? data.categories
        : payloadCategories;
      // 저장 성공 → 새 originalId 를 현재 id 로 리셋해서 다음 편집 사이클을 준비.
      const refreshed: EditableCategory[] = saved.map((c) => ({ ...c, originalId: c.id }));
      const allRaw = refreshed.find((c) => c.id === 'all') ?? ALL_ENTRY;
      const withoutAll = refreshed.filter((c) => c.id !== 'all');
      setItems([allRaw, ...withoutAll]);
      setConflict(null);

      const renamedCount = data?.renamed ? Object.keys(data.renamed).length : 0;
      const reassignCount = reassign ? Object.keys(reassign).length : 0;
      const okMsg =
        renamedCount > 0 || reassignCount > 0
          ? `저장됨 — ${[
              renamedCount > 0 ? `이름 변경 ${renamedCount}건` : null,
              reassignCount > 0 ? `제품 이동 ${reassignCount}건` : null,
            ]
              .filter(Boolean)
              .join(' · ')} 자동 반영`
          : '카테고리가 저장되었습니다.';
      setToast({ kind: 'ok', text: okMsg });
      onSaved?.(saved);
    } catch (err) {
      console.error('[ProductCategoryEditor] save error', err);
      setToast({ kind: 'err', text: '네트워크 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    // 클라이언트 사전 검증.
    const trimmed: EditableCategory[] = items.map((c) => ({
      id: c.id.trim(),
      label: c.label.trim(),
      labelEn: c.labelEn.trim(),
      originalId: c.originalId,
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

    await performSave(trimmed);
  }

  async function handleConfirmReassign() {
    if (!conflict) return;
    const { selection, targets, inUse, pendingCategories } = conflict;
    const validIds = new Set(targets.map((t) => t.id));
    for (const oldId of Object.keys(inUse)) {
      const picked = selection[oldId];
      if (!picked || !validIds.has(picked)) {
        setToast({ kind: 'err', text: `"${oldId}" 의 이동 대상을 선택해 주세요.` });
        return;
      }
    }
    await performSave(pendingCategories, selection);
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
                  const renamed = !!c.originalId && c.originalId !== c.id;
                  return (
                    <div
                      key={c.originalId ?? `new-${i}`}
                      className="grid grid-cols-[28px_1fr_1fr_1fr_auto_auto] gap-2 items-center"
                    >
                      <span className="text-xs text-gray-300 text-center">{i + 1}</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={c.id}
                          onChange={(e) => updateField(i, 'id', e.target.value)}
                          disabled={isAll}
                          placeholder="예: 오일"
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 disabled:bg-gray-50 disabled:text-gray-400 ${
                            renamed ? 'border-amber-400 bg-amber-50/60' : 'border-gray-200'
                          }`}
                        />
                        {renamed && (
                          <span className="absolute -top-2 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-medium leading-none">
                            {c.originalId} → 자동반영
                          </span>
                        )}
                      </div>
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
                · <strong>이름 변경</strong>: id 를 수정하면 해당 카테고리를 쓰는 제품들도 자동으로 새 id 로 갱신됩니다.<br />
                · <strong>삭제</strong>: 사용 중인 카테고리를 삭제하면 어떤 카테고리로 옮길지 묻는 창이 뜹니다.
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

      {conflict && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
          onClick={() => !saving && setConflict(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              제품을 어디로 옮길까요?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              삭제한 카테고리에 속한 제품들이 있어요. 이동할 카테고리를 선택하면 제품
              데이터에 자동 반영됩니다.
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(conflict.inUse).map(([cat, list]) => (
                <div key={cat} className="border border-amber-200 rounded-lg p-3 bg-amber-50/50">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-xs font-medium text-amber-800">
                      <code className="px-1.5 py-0.5 rounded bg-white">{cat}</code>{' '}
                      <span className="text-gray-500">· {list.length}개 제품</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500">→</span>
                      <select
                        value={conflict.selection[cat] ?? ''}
                        onChange={(e) =>
                          setConflict((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selection: { ...prev.selection, [cat]: e.target.value },
                                }
                              : prev
                          )
                        }
                        className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                      >
                        {conflict.targets.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label} ({t.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {list.map((p) => (
                      <li key={p.id} className="text-sm text-gray-800">
                        · {p.name}
                        {p.slug ? (
                          <span className="text-xs text-gray-400 ml-1.5">({p.slug})</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConflict(null)}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-gold-500 text-white text-xs font-medium hover:bg-gold-600 disabled:opacity-50"
              >
                {saving ? '적용 중...' : '이동하고 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
