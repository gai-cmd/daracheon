'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import ImageUploadField from '@/components/admin/ImageUploadField';

/* ─── Types ─── */
type MediaType = 'video' | 'press' | 'article' | 'photo';

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  source: string;
  date: string;
  image: string;
  excerpt: string;
  url: string;
}

/* ─── Label / Color Maps ─── */
// Order mirrors the /media frontend section order: 01 Videos · 02 Press · 03 Photos.
const typeLabel: Record<MediaType, string> = {
  video: '영상',
  press: '보도',
  article: '기사',
  photo: '사진',
};

const typeColor: Record<MediaType, string> = {
  video: 'adm-badge adm-badge-luxury',
  press: 'adm-badge adm-badge-premium',
  article: 'adm-badge adm-badge-traditional',
  photo: 'adm-badge adm-badge-default',
};

/* ─── Component ─── */
export default function GalleryAdminPanel() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* Empty form template */
  const emptyItem: MediaItem = {
    id: '',
    type: 'article',
    title: '',
    source: '',
    date: new Date().toISOString().slice(0, 10),
    image: '',
    excerpt: '',
    url: '',
  };

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch media ─── */
  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      setItems(data.media || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setToast('미디어 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  /* Filtered list */
  const filtered = useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  /* Handlers */
  async function handleSave() {
    if (!editingItem) return;
    setSaving(true);
    try {
      const method = isAddMode ? 'POST' : 'PUT';
      const res = await fetch('/api/admin/media', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isAddMode ? { ...editingItem, id: `m${Date.now()}` } : editingItem),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast(isAddMode ? '미디어가 추가되었습니다.' : '미디어가 수정되었습니다.');
      setEditingItem(null);
      setIsAddMode(false);
      await fetchMedia();
    } catch (err) {
      console.error('Save error:', err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('미디어가 삭제되었습니다.');
      setDeleteConfirmId(null);
      await fetchMedia();
    } catch (err) {
      console.error('Delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  function openAddModal() {
    setEditingItem({ ...emptyItem });
    setIsAddMode(true);
  }

  function openEditModal(item: MediaItem) {
    setEditingItem({ ...item });
    setIsAddMode(false);
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-32 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="flex gap-2 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-20 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
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

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-serif">침향 농장 이야기</h1>
            <p className="text-sm text-neutral-500 mt-1">
              <span className="font-mono">/media</span> 공개 페이지의 세 섹션(01 Videos · 02 Press · 03 Photos) 콘텐츠를 관리합니다.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="adm-btn-primary px-5 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 미디어 추가
          </button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {(['all', 'video', 'press', 'article', 'photo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                typeFilter === t
                  ? 'bg-[#1F1F1F] text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t === 'all' ? '전체' : typeLabel[t]}
              <span className="ml-1.5 text-xs opacity-70">
                ({t === 'all' ? items.length : items.filter((i) => i.type === t).length})
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 px-6 py-20 text-center text-neutral-400 text-sm">
            미디어 항목이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 text-[0.6rem] tracking-wider uppercase rounded-md font-semibold ${typeColor[item.type]}`}>
                    {typeLabel[item.type]}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1.5 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[0.7rem] text-neutral-400 mb-3">
                    <span>{item.source}</span>
                    <span className="text-neutral-200">|</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
                    {item.excerpt}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="adm-btn-secondary flex-1 px-3"
                    >
                      수정
                    </button>
                    {deleteConfirmId === item.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="adm-btn-destructive-solid px-3"
                        >
                          확인
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="adm-btn-destructive px-3"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                {isAddMode ? '새 미디어 추가' : '미디어 수정'}
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">제목</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    placeholder="미디어 제목"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">유형</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as MediaType })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                  >
                    <option value="video">영상 (01 Videos)</option>
                    <option value="press">보도 (02 Press)</option>
                    <option value="article">기사 (02 Press)</option>
                    <option value="photo">사진 (03 Photos)</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">출처</label>
                  <input
                    type="text"
                    value={editingItem.source}
                    onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    placeholder="출처"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">날짜</label>
                  <input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                  />
                </div>

                {/* Image */}
                <ImageUploadField
                  label="이미지"
                  value={editingItem.image}
                  onChange={(url) => setEditingItem({ ...editingItem, image: url })}
                  subdir="media"
                />

                {/* Excerpt */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">요약</label>
                  <textarea
                    value={editingItem.excerpt}
                    onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                    placeholder="미디어 요약..."
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">링크 URL</label>
                  <input
                    type="text"
                    value={editingItem.url}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    placeholder="/path or https://..."
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
                  disabled={!editingItem.title.trim() || saving}
                  className="adm-btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
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
