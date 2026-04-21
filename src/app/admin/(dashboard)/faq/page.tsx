'use client';

import { useState, useEffect, useMemo } from 'react';

/* ─── Types ─── */
type FaqCategory = '제품' | '배송/결제' | '성분' | '기타';

const FAQ_CATEGORIES: FaqCategory[] = ['제품', '배송/결제', '성분', '기타'];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: FaqCategory;
}

const categoryColor: Record<FaqCategory, string> = {
  '제품': 'bg-gold-700 text-white',
  '배송/결제': 'bg-slate-600 text-white',
  '성분': 'bg-sage-700 text-white',
  '기타': 'bg-stone-500 text-white',
};

/* ─── Component ─── */
export default function FaqAdminPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch FAQ ─── */
  const fetchFaq = async () => {
    try {
      const res = await fetch('/api/admin/faq');
      const data = await res.json();
      setItems(data.faq || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch FAQ:', err);
      setToast('FAQ 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaq();
  }, []);

  /* Filtered + counted per category */
  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return items;
    return items.filter((item) => (item.category ?? '기타') === categoryFilter);
  }, [items, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const cat of FAQ_CATEGORIES) {
      counts[cat] = items.filter((i) => (i.category ?? '기타') === cat).length;
    }
    return counts;
  }, [items]);

  /* Handlers */
  async function handleSave() {
    if (!editingItem) return;
    setSaving(true);
    try {
      const method = isAddMode ? 'POST' : 'PUT';
      const payload = isAddMode
        ? { ...editingItem, id: `faq-${Date.now()}` }
        : editingItem;
      const res = await fetch('/api/admin/faq', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast(isAddMode ? 'FAQ가 추가되었습니다.' : 'FAQ가 수정되었습니다.');
      setEditingItem(null);
      setIsAddMode(false);
      await fetchFaq();
    } catch (err) {
      console.error('Save error:', err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('FAQ가 삭제되었습니다.');
      setDeleteConfirmId(null);
      if (expandedId === id) setExpandedId(null);
      await fetchFaq();
    } catch (err) {
      console.error('Delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  function openAddModal() {
    setEditingItem({ id: '', question: '', answer: '', category: '기타' });
    setIsAddMode(true);
  }

  function openEditModal(item: FaqItem) {
    setEditingItem({ ...item, category: item.category ?? '기타' });
    setIsAddMode(false);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-28 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-10 w-32 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 mb-6 animate-pulse">
            <div className="h-5 w-24 rounded bg-gray-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 px-5 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="flex-1 h-4 rounded bg-gray-200" />
                  <div className="w-20 h-6 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-body">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-serif">FAQ 관리</h1>
            <p className="text-sm text-neutral-500 mt-1">자주 묻는 질문을 관리합니다.</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-gold-500 text-white text-sm font-medium rounded-xl hover:bg-gold-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 질문 추가
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">등록된 FAQ</span>
            <span className="text-lg font-bold text-neutral-900">{items.length}</span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold bg-gold-700 text-white">
              {items.length}개 항목
            </span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
          <label className="text-xs font-medium text-neutral-500 mb-2 block">카테고리 필터</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-gold-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              전체 ({categoryCounts.all})
            </button>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-gold-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat} ({categoryCounts[cat] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 px-6 py-16 text-center text-neutral-400 text-sm">
              {categoryFilter === 'all' ? '등록된 FAQ가 없습니다.' : `"${categoryFilter}" 카테고리의 FAQ가 없습니다.`}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const isDeleteConfirm = deleteConfirmId === item.id;
              const cat = item.category ?? '기타';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Question Row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {/* Drag Handle (visual only) */}
                    <span className="text-neutral-300 text-lg leading-none flex-shrink-0 cursor-grab" title="드래그하여 정렬">
                      ≡
                    </span>

                    {/* Q Number */}
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold-700 text-white flex items-center justify-center text-xs font-bold">
                      Q{index + 1}
                    </span>

                    {/* Question Text */}
                    <p className="flex-1 text-sm font-medium text-neutral-800 leading-snug">
                      {item.question}
                    </p>

                    {/* Category Badge */}
                    <span className={`flex-shrink-0 px-2 py-0.5 text-[0.65rem] rounded-full font-medium ${categoryColor[cat as FaqCategory] ?? categoryColor['기타']}`}>
                      {cat}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-neutral-600 hover:text-gold-700 transition-colors rounded-lg hover:bg-gold-50"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {isDeleteConfirm ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-2 py-1 text-[0.65rem] font-medium text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm transition-colors"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-[0.65rem] font-medium text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-neutral-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}

                      {/* Expand Arrow */}
                      <button className="p-1.5 text-neutral-600 hover:text-neutral-900 transition-colors">
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Answer (Expanded) */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-neutral-100">
                      <div className="pt-4 pl-12">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-600 text-white flex items-center justify-center text-xs font-bold">
                            A
                          </span>
                          <p className="text-sm text-neutral-600 leading-relaxed pt-1">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setEditingItem(null); setIsAddMode(false); }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-neutral-900 font-serif mb-6">
                {isAddMode ? '새 질문 추가' : 'FAQ 수정'}
              </h2>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">카테고리</label>
                  <select
                    value={editingItem.category ?? '기타'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as FaqCategory })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 bg-white"
                  >
                    {FAQ_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Question */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">질문</label>
                  <textarea
                    value={editingItem.question}
                    onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                    placeholder="자주 묻는 질문을 입력하세요..."
                  />
                </div>

                {/* Answer */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">답변</label>
                  <textarea
                    value={editingItem.answer}
                    onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                    placeholder="답변 내용을 입력하세요..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button
                  onClick={() => { setEditingItem(null); setIsAddMode(false); }}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editingItem.question.trim() || !editingItem.answer.trim() || saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : isAddMode ? '추가' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
