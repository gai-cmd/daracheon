'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  module: string;
  action: string;
  targetId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}

const MODULE_LABELS: Record<string, string> = {
  products: '제품',
  reviews: '리뷰',
  inquiries: '문의',
  media: '미디어',
  faq: 'FAQ',
  settings: '설정',
  broadcasts: '방송',
  auth: '인증',
  upload: '업로드',
  announcement: '공지',
};

const ACTION_LABELS: Record<string, string> = {
  create: '등록',
  update: '수정',
  delete: '삭제',
  bulk_update: '일괄 수정',
  bulk_delete: '일괄 삭제',
  login: '로그인',
  logout: '로그아웃',
  reply: '답변',
  status_change: '상태 변경',
};

function formatAt(iso: string): { absolute: string; relative: string } {
  const d = new Date(iso);
  const diffMin = (Date.now() - d.getTime()) / 60000;
  let relative = '';
  if (diffMin < 1) relative = '방금 전';
  else if (diffMin < 60) relative = `${Math.floor(diffMin)}분 전`;
  else if (diffMin < 1440) relative = `${Math.floor(diffMin / 60)}시간 전`;
  else relative = `${Math.floor(diffMin / 1440)}일 전`;
  const absolute = d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return { absolute, relative };
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);

  const [expanded, setExpanded] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filterModule) params.set('module', filterModule);
    if (filterAction) params.set('action', filterAction);
    if (filterActor.trim()) params.set('actor', filterActor.trim());
    if (filterFrom) params.set('from', filterFrom);
    if (filterTo) params.set('to', filterTo);
    if (searchQ.trim()) params.set('q', searchQ.trim());
    params.set('page', String(page));
    params.set('pageSize', '50');
    return params.toString();
  }, [filterModule, filterAction, filterActor, filterFrom, filterTo, searchQ, page]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-log?${queryString}`);
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error('[AuditLog] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function resetFilters() {
    setFilterModule('');
    setFilterAction('');
    setFilterActor('');
    setFilterFrom('');
    setFilterTo('');
    setSearchQ('');
    setPage(1);
  }

  function moduleBadgeClass(module: string): string {
    const map: Record<string, string> = {
      products: 'bg-indigo-50 text-indigo-700',
      reviews: 'bg-purple-50 text-purple-700',
      inquiries: 'bg-amber-50 text-amber-700',
      media: 'bg-sky-50 text-sky-700',
      faq: 'bg-teal-50 text-teal-700',
      settings: 'bg-gray-100 text-gray-700',
      broadcasts: 'bg-pink-50 text-pink-700',
      auth: 'bg-blue-50 text-blue-700',
      upload: 'bg-emerald-50 text-emerald-700',
      announcement: 'bg-orange-50 text-orange-700',
    };
    return map[module] ?? 'bg-gray-100 text-gray-700';
  }

  function actionColor(action: string): string {
    if (action === 'delete' || action === 'bulk_delete') return 'text-red-600';
    if (action === 'create') return 'text-emerald-600';
    if (action === 'login' || action === 'logout') return 'text-blue-600';
    return 'text-gold-700';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-gray-500">전체 기록 {total.toLocaleString('ko-KR')}건</p>
          <p className="mt-1 text-sm text-gray-400">관리자가 수행한 모든 작업 기록을 검색/필터할 수 있습니다.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <select
            value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">전체 모듈</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">전체 액션</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="text"
            value={filterActor}
            onChange={(e) => { setFilterActor(e.target.value); setPage(1); }}
            placeholder="actor (이메일)"
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={searchQ}
            onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
            placeholder="summary 텍스트 검색..."
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">조건에 맞는 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {entries.map((e) => {
              const { absolute, relative } = formatAt(e.at);
              const isOpen = expanded === e.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className={`mt-0.5 inline-flex rounded px-2 py-0.5 text-[0.68rem] font-medium ${moduleBadgeClass(e.module)}`}>
                      {MODULE_LABELS[e.module] ?? e.module}
                    </span>
                    <span className={`mt-0.5 text-xs font-medium ${actionColor(e.action)}`}>
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">
                        {e.summary ?? `${e.module}/${e.action}`}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {e.actor} · {e.actorRole}
                        {e.targetId && <span className="ml-2 text-gray-400">#{e.targetId}</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">{relative}</p>
                      <p className="text-[0.7rem] text-gray-400">{absolute}</p>
                    </div>
                    <span className="ml-1 text-xs text-gray-400">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="bg-gray-50 px-6 py-4">
                      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-gray-500">ID</dt>
                          <dd className="font-mono text-gray-800">{e.id}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Target</dt>
                          <dd className="font-mono text-gray-800">{e.targetId ?? '-'}</dd>
                        </div>
                        {e.meta && (
                          <div className="sm:col-span-2">
                            <dt className="mb-1 text-gray-500">Meta</dt>
                            <dd>
                              <pre className="overflow-x-auto rounded bg-white p-3 text-[0.7rem] text-gray-700 ring-1 ring-gray-200">
                                {JSON.stringify(e.meta, null, 2)}
                              </pre>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="text-xs text-gray-500">
                페이지 {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
