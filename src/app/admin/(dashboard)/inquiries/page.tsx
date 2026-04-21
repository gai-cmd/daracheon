'use client';

import { useState, useEffect, useMemo } from 'react';
import CsvImportButton from '@/components/admin/CsvImportButton';

/* ─── Types ─── */
type InquiryStatus = 'new' | 'replied' | 'resolved';
type InquiryCategory = 'product' | 'order' | 'wholesale' | 'media' | 'other';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: InquiryCategory;
  message: string;
  date: string;
  status: InquiryStatus;
  reply?: string;
  replyAt?: string;
  replyBy?: string;
}

/* ─── Label / Color Maps ─── */
const statusLabel: Record<InquiryStatus, string> = {
  new: '신규',
  replied: '답변완료',
  resolved: '처리완료',
};

const statusColor: Record<InquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-800 border border-blue-300',
  replied: 'bg-yellow-100 text-yellow-900 border border-yellow-400',
  resolved: 'bg-green-100 text-green-800 border border-green-300',
};

const categoryLabel: Record<InquiryCategory, string> = {
  product: '제품',
  order: '주문',
  wholesale: '도매',
  media: '미디어',
  other: '기타',
};

const categoryColor: Record<InquiryCategory, string> = {
  product: 'bg-amber-100 text-amber-900 border border-amber-300',
  order: 'bg-purple-100 text-purple-800 border border-purple-300',
  wholesale: 'bg-teal-100 text-teal-800 border border-teal-300',
  media: 'bg-pink-100 text-pink-800 border border-pink-300',
  other: 'bg-neutral-200 text-neutral-800 border border-neutral-300',
};

/* ─── Next Status ─── */
function getNextStatus(current: InquiryStatus): InquiryStatus | null {
  if (current === 'new') return 'replied';
  if (current === 'replied') return 'resolved';
  return null;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ─── Component ─── */
export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<InquiryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<InquiryStatus>('resolved');
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch inquiries ─── */
  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/admin/inquiries');
      const data = await res.json();
      setInquiries(data.inquiries || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      setToast('문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  /* Stats */
  const stats = useMemo(() => ({
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    replied: inquiries.filter((i) => i.status === 'replied').length,
    resolved: inquiries.filter((i) => i.status === 'resolved').length,
  }), [inquiries]);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && inq.category !== categoryFilter) return false;
      if (q) {
        const haystack = `${inq.name} ${inq.email} ${inq.message}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [inquiries, statusFilter, categoryFilter, searchQuery]);

  /* ─── Selection helpers ─── */
  const isAllSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
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

  /* ─── Handlers ─── */
  async function handleStatusChange(id: string) {
    const inq = inquiries.find((i) => i.id === id);
    if (!inq) return;
    const next = getNextStatus(inq.status);
    if (!next) return;

    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error('Status change failed');
      setToast(`상태가 "${statusLabel[next]}"(으)로 변경되었습니다.`);
      await fetchInquiries();
    } catch (err) {
      console.error('Status change error:', err);
      setToast('상태 변경에 실패했습니다.');
    }
  }

  async function handleSaveReply(id: string) {
    const text = replyTexts[id]?.trim();
    if (!text) return;

    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: text, status: 'replied' }),
      });
      if (!res.ok) throw new Error('Reply save failed');
      setToast('답변이 저장되었습니다.');
      setReplyTexts((prev) => ({ ...prev, [id]: '' }));
      await fetchInquiries();
    } catch (err) {
      console.error('Reply save error:', err);
      setToast('답변 저장에 실패했습니다.');
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('문의가 삭제되었습니다.');
      if (expandedId === id) setExpandedId(null);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      await fetchInquiries();
    } catch (err) {
      console.error('Delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  async function handleBulkStatusChange() {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch('/api/admin/inquiries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: bulkStatus }),
          })
        )
      );
      setToast(`${selectedIds.size}건을 "${statusLabel[bulkStatus]}"(으)로 변경했습니다.`);
      setSelectedIds(new Set());
      await fetchInquiries();
    } catch (err) {
      console.error('Bulk status error:', err);
      setToast('일괄 변경에 실패했습니다.');
    } finally {
      setIsBulkLoading(false);
    }
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-8">
            <div className="h-8 w-32 rounded bg-gray-200 animate-pulse mb-2" />
            <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 animate-pulse">
                <div className="h-3 w-12 rounded bg-gray-200 mb-2" />
                <div className="h-7 w-10 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-neutral-100 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="flex-1 h-4 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-serif">문의 관리</h1>
            <p className="text-sm text-neutral-500 mt-1">고객 문의를 확인하고 답변을 관리합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <CsvImportButton
              endpoint="/api/admin/inquiries/import"
              sampleFilename="inquiries-sample.csv"
              sampleCSV={`id,name,email,phone,category,subject,message,date,status\n,홍길동,hong@example.com,010-1234-5678,제품문의,침향 연질캡슐 관련,자세히 알고 싶습니다,${new Date().toISOString()},new`}
              onImported={fetchInquiries}
            />
            <a
              href="/api/admin/export/inquiries"
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV 내보내기
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '전체 문의', value: stats.total, color: 'bg-neutral-200 text-neutral-800 border border-neutral-300' },
            { label: '신규', value: stats.new, color: 'bg-blue-100 text-blue-800 border border-blue-300' },
            { label: '답변완료', value: stats.replied, color: 'bg-yellow-100 text-yellow-900 border border-yellow-400' },
            { label: '처리완료', value: stats.resolved, color: 'bg-green-100 text-green-800 border border-green-300' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-neutral-900">{stat.value}</span>
                <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-medium ${stat.color}`}>
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 mb-4">
          {/* Search */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">검색</label>
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 이메일, 내용으로 검색..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-2 block">상태</label>
              <div className="flex gap-2">
                {(['all', 'new', 'replied', 'resolved'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-gold-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s === 'all' ? '전체' : statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-2 block">카테고리</label>
              <div className="flex gap-2">
                {(['all', 'product', 'order', 'wholesale', 'media', 'other'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      categoryFilter === c
                        ? 'bg-gold-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {c === 'all' ? '전체' : categoryLabel[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-5 py-3 mb-4 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gold-800">{selectedIds.size}건 선택됨</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">상태 변경:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as InquiryStatus)}
                className="px-2 py-1 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="new">신규</option>
                <option value="replied">답변완료</option>
                <option value="resolved">처리완료</option>
              </select>
              <button
                onClick={handleBulkStatusChange}
                disabled={isBulkLoading}
                className="px-3 py-1 bg-gold-500 text-white text-xs font-medium rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {isBulkLoading ? '변경 중...' : '일괄 변경'}
              </button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs text-neutral-500 hover:text-neutral-700"
            >
              선택 해제
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2rem_1fr_1.2fr_0.8fr_1.5fr_0.8fr_0.8fr_0.6fr] gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-500">
            <span>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-neutral-300 text-gold-500 focus:ring-gold-500/30"
              />
            </span>
            <span>이름</span>
            <span>이메일</span>
            <span>카테고리</span>
            <span>메시지</span>
            <span>날짜</span>
            <span>상태</span>
            <span>관리</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-neutral-400 text-sm">
              해당하는 문의가 없습니다.
            </div>
          ) : (
            filtered.map((inq) => {
              const isExpanded = expandedId === inq.id;
              const nextStatus = getNextStatus(inq.status);
              const isSelected = selectedIds.has(inq.id);

              return (
                <div key={inq.id} className={`border-b border-neutral-100 last:border-b-0 ${isSelected ? 'bg-gold-50/30' : ''}`}>
                  {/* Row */}
                  <div
                    className="grid grid-cols-1 md:grid-cols-[2rem_1fr_1.2fr_0.8fr_1.5fr_0.8fr_0.8fr_0.6fr] gap-4 px-6 py-4 items-center hover:bg-neutral-50 transition-colors"
                  >
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(inq.id)}
                        className="rounded border-neutral-300 text-gold-500 focus:ring-gold-500/30"
                      />
                    </div>

                    {/* Name — click to expand */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                    >
                      <p className="text-sm font-medium text-neutral-900">{inq.name}</p>
                      {inq.phone && (
                        <p className="text-[0.7rem] text-neutral-400 mt-0.5">{inq.phone}</p>
                      )}
                    </div>

                    <p
                      className="text-sm text-neutral-600 truncate cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                    >
                      {inq.email}
                    </p>

                    <span className={`inline-block w-fit px-2 py-0.5 text-[0.65rem] rounded-full font-medium ${categoryColor[inq.category]}`}>
                      {categoryLabel[inq.category]}
                    </span>

                    <p
                      className="text-sm text-neutral-600 truncate cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                    >
                      {inq.message}
                    </p>

                    <p className="text-xs text-neutral-400">{inq.date}</p>

                    <span className={`inline-block w-fit px-2 py-0.5 text-[0.65rem] rounded-full font-medium ${statusColor[inq.status]}`}>
                      {statusLabel[inq.status]}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                        className="rounded p-1 text-neutral-600 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                        title={isExpanded ? '접기' : '펼치기'}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-neutral-50 border-t border-neutral-100">
                      <div className="pt-5 space-y-4">
                        {/* Full Message */}
                        <div>
                          <label className="text-xs font-medium text-neutral-500 mb-1 block">전체 메시지</label>
                          <div className="bg-white rounded-lg border border-neutral-200 p-4 text-sm text-neutral-700 leading-relaxed">
                            {inq.message}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                          <span>이메일: <strong className="text-neutral-700">{inq.email}</strong></span>
                          {inq.phone && <span>전화: <strong className="text-neutral-700">{inq.phone}</strong></span>}
                          <span>접수일: <strong className="text-neutral-700">{inq.date}</strong></span>
                        </div>

                        {/* Answer History */}
                        {inq.reply && (
                          <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">답변 이력</label>
                            <div className="bg-gold-50 rounded-lg border border-gold-200 p-4 space-y-1">
                              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{inq.reply}</p>
                              <div className="flex gap-3 text-[0.65rem] text-neutral-400 pt-1">
                                {inq.replyAt && <span>답변일시: {formatDateTime(inq.replyAt)}</span>}
                                {inq.replyBy && <span>답변자: {inq.replyBy}</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reply Area */}
                        {inq.status !== 'resolved' && (
                          <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">
                              {inq.reply ? '답변 수정' : '답변 작성'}
                            </label>
                            <textarea
                              value={replyTexts[inq.id] ?? inq.reply ?? ''}
                              onChange={(e) => setReplyTexts((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                              placeholder="고객에게 보낼 답변을 작성하세요..."
                              rows={4}
                              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          {inq.status !== 'resolved' && (
                            <button
                              onClick={() => handleSaveReply(inq.id)}
                              disabled={!replyTexts[inq.id]?.trim()}
                              className="px-4 py-2 bg-gold-500 text-white text-xs font-medium rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              답변 저장
                            </button>
                          )}
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusChange(inq.id)}
                              className="px-4 py-2 bg-white border border-neutral-300 text-xs font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                              {statusLabel[nextStatus]}로 변경
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inq.id)}
                            className="px-4 py-2 bg-red-600 text-xs font-medium text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors ml-auto"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="text-xs text-neutral-400 mt-3 text-right">
            {filtered.length}건 표시 / 전체 {inquiries.length}건
          </p>
        )}
      </div>
    </div>
  );
}
