'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import type { Review } from '@/data/reviews';
import CsvImportButton from '@/components/admin/CsvImportButton';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span className={`${sizeClass} tracking-wide`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-gold-500' : 'text-gray-300'}>
          {i < rating ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [productFilter, setProductFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch reviews ─── */
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      setReviewList(data.reviews || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setToast('리뷰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const uniqueProducts = useMemo(() => {
    const names = [...new Set(reviewList.map((r) => r.product))];
    return names.sort();
  }, [reviewList]);

  const stats = useMemo(() => {
    const total = reviewList.length;
    const avgRating = total > 0 ? reviewList.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const verified = reviewList.filter((r) => r.verified).length;
    const pending = reviewList.filter((r) => !r.verified).length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = reviewList.filter((r) => new Date(r.date) >= sevenDaysAgo).length;

    return { total, avgRating, verified, pending, recentCount };
  }, [reviewList]);

  const filteredReviews = useMemo(() => {
    let result = [...reviewList];

    if (productFilter !== 'all') {
      result = result.filter((r) => r.product === productFilter);
    }
    if (ratingFilter > 0) {
      result = result.filter((r) => r.rating === ratingFilter);
    }
    if (verifiedFilter === 'verified') {
      result = result.filter((r) => r.verified);
    } else if (verifiedFilter === 'unverified') {
      result = result.filter((r) => !r.verified);
    }

    result.sort((a, b) => {
      if (sortBy === 'date') return b.date.localeCompare(a.date);
      return b.rating - a.rating;
    });

    return result;
  }, [reviewList, productFilter, ratingFilter, verifiedFilter, sortBy]);

  /* ─── Selection helpers ─── */
  const isAllSelected =
    filteredReviews.length > 0 && filteredReviews.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openEdit(review: Review) {
    setEditingReview(JSON.parse(JSON.stringify(review)));
    setIsEditOpen(true);
  }

  async function handleSave() {
    if (!editingReview) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast('리뷰가 수정되었습니다.');
      setIsEditOpen(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (err) {
      console.error('Save error:', err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('리뷰가 삭제되었습니다.');
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
      await fetchReviews();
    } catch (err) {
      console.error('Delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  async function handleBulkVerify(verified: boolean) {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), verified }),
      });
      if (!res.ok) throw new Error('Bulk update failed');
      const data = await res.json();
      setToast(`${data.updatedCount}건을 ${verified ? '인증' : '미인증'}으로 변경했습니다.`);
      setSelectedIds(new Set());
      await fetchReviews();
    } catch (err) {
      console.error('Bulk verify error:', err);
      setToast('일괄 처리에 실패했습니다.');
    } finally {
      setIsBulkLoading(false);
    }
  }

  function updateEditField<K extends keyof Review>(key: K, value: Review[K]) {
    if (!editingReview) return;
    setEditingReview({ ...editingReview, [key]: value });
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-body">
        <div className="mb-6">
          <div className="h-8 w-32 rounded bg-gray-200 animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-12 rounded bg-gray-200" />
                    <div className="h-5 w-8 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 animate-pulse">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-body">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
          <div className="flex items-center gap-2">
            <CsvImportButton
              endpoint="/api/admin/reviews/import"
              sampleFilename="reviews-sample.csv"
              sampleCSV={`id,author,age,product,rating,title,content,date,verified\n,김*진,40대,침향 연질캡슐,5,정말 좋아요,복용 후 컨디션이 좋아졌습니다,${new Date().toISOString()},false`}
              onImported={fetchReviews}
            />
            <a
              href="/api/admin/export/reviews"
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV 내보내기
            </a>
          </div>
        </div>

        {/* Stats Bar — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">총 리뷰</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
              <span className="text-gold-600 text-lg">{'\u2605'}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">평균 평점</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">승인 대기</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">최근 7일</p>
              <p className="text-xl font-bold text-gray-900">{stats.recentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          >
            <option value="all">전체 제품</option>
            {uniqueProducts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          >
            <option value={0}>전체 평점</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {'\u2605'.repeat(r)} ({r}점)
              </option>
            ))}
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as 'all' | 'verified' | 'unverified')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          >
            <option value="all">전체 인증</option>
            <option value="verified">인증됨</option>
            <option value="unverified">미인증</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 sm:ml-auto"
          >
            <option value="date">최신순</option>
            <option value="rating">평점순</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-xl px-5 py-3 mb-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gold-800">{selectedIds.size}건 선택됨</span>
          <button
            onClick={() => handleBulkVerify(true)}
            disabled={isBulkLoading}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isBulkLoading ? '처리 중...' : '일괄 인증'}
          </button>
          <button
            onClick={() => handleBulkVerify(false)}
            disabled={isBulkLoading}
            className="px-3 py-1.5 bg-gray-500 text-white text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isBulkLoading ? '처리 중...' : '일괄 미인증'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-neutral-500 hover:text-neutral-700"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-gold-500 focus:ring-gold-500/30"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8" />
                <th className="text-left px-4 py-3 font-semibold text-gray-600">작성자</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">제품</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">평점</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">제목</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">날짜</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">인증</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p>조건에 맞는 리뷰가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const isSelected = selectedIds.has(review.id);
                  return (
                    <Fragment key={review.id}>
                      <tr
                        className={`border-b border-gray-50 hover:bg-gold-50/30 transition-colors ${isSelected ? 'bg-gold-50/20' : ''}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(review.id)}
                            className="rounded border-gray-300 text-gold-500 focus:ring-gold-500/30"
                          />
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => toggleExpand(review.id)}>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedId === review.id ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => toggleExpand(review.id)}>
                          <div className="font-medium text-gray-900">{review.author}</div>
                          <div className="text-xs text-gray-400">{review.age}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{review.product}</td>
                        <td className="px-4 py-3">
                          <StarRating rating={review.rating} />
                        </td>
                        <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{review.title}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{review.date}</td>
                        <td className="px-4 py-3">
                          {review.verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              인증
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                              미인증
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(review)}
                              className="px-3 py-1.5 text-xs font-medium text-gold-700 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => setDeleteTarget(review)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === review.id && (
                        <tr className="bg-gold-50/20">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="max-w-2xl">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {review.content}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredReviews.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            총 {filteredReviews.length}개 리뷰
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">리뷰 편집</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Author info (read-only) */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">
                  작성자: <span className="font-medium text-gray-900">{editingReview.author}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  {editingReview.age}
                  <span className="mx-2 text-gray-300">|</span>
                  제품: {editingReview.product}
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateEditField('rating', star)}
                      className={`text-2xl transition-colors ${
                        star <= editingReview.rating ? 'text-gold-500' : 'text-gray-300'
                      } hover:text-gold-400`}
                    >
                      {star <= editingReview.rating ? '\u2605' : '\u2606'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={editingReview.title}
                  onChange={(e) => updateEditField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  rows={5}
                  value={editingReview.content}
                  onChange={(e) => updateEditField('content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                />
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">인증 여부</label>
                <button
                  type="button"
                  onClick={() => updateEditField('verified', !editingReview.verified)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingReview.verified ? 'bg-gold-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      editingReview.verified ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-gold-500 text-white rounded-lg font-medium hover:bg-gold-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setIsEditOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">리뷰 삭제</h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-700">{deleteTarget.author}</span>님의 리뷰를 정말 삭제하시겠습니까?
                <br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
