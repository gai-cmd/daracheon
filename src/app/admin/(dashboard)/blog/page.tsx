'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { BlogCategory, BlogPost } from '@/types/blog';

interface PostsResponse {
  posts: BlogPost[];
  stats: { total: number; published: number; drafts: number };
}

interface CategoriesResponse {
  categories: (BlogCategory & { postCount: number })[];
  total: number;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function refetch() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (q.trim()) params.set('q', q.trim());
      const [postsRes, catsRes] = await Promise.all([
        fetch(`/api/admin/blog-posts?${params.toString()}`).then((r) => r.json() as Promise<PostsResponse>),
        fetch('/api/admin/blog-categories').then((r) => r.json() as Promise<CategoriesResponse>),
      ]);
      setPosts(postsRes.posts ?? []);
      setStats(postsRes.stats ?? { total: 0, published: 0, drafts: 0 });
      setCategories(catsRes.categories ?? []);
    } catch (err) {
      console.error(err);
      setToast({ msg: '목록을 불러오는데 실패했습니다.', ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const allChecked = posts.length > 0 && posts.every((p) => selectedIds.has(p.id));
  function toggleAll() {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(posts.map((p) => p.id)));
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkStatus(status: 'published' | 'draft') {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/blog-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      });
      const data = (await res.json()) as { success?: boolean; updated?: number; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message);
      setToast({ msg: `${data.updated}건 ${status === 'published' ? '발행' : '비공개'} 처리됨`, ok: true });
      setSelectedIds(new Set());
      await refetch();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : '실패', ok: false });
    } finally {
      setBulkBusy(false);
    }
  }

  async function deletePost(post: BlogPost) {
    setBulkBusy(true);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message);
      setToast({ msg: '삭제되었습니다.', ok: true });
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : '삭제 실패', ok: false });
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-warm-900">블로그</h1>
          <p className="mt-1 text-sm text-warm-600">
            전체 {stats.total} · 발행 {stats.published} · 초안 {stats.drafts}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/categories"
            className="rounded border border-warm-300 px-3 py-1.5 text-sm text-warm-800 hover:bg-warm-100"
          >
            카테고리 관리
          </Link>
          <Link
            href="/admin/blog/new"
            className="rounded bg-warm-900 px-3 py-1.5 text-sm font-semibold text-warm-50 hover:bg-warm-800"
          >
            + 새 글
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-warm-200 bg-white p-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded border border-warm-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">상태: 전체</option>
          <option value="published">발행됨</option>
          <option value="draft">초안</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded border border-warm-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">카테고리: 전체</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') refetch();
          }}
          placeholder="제목 / 요약 / 태그 검색"
          className="flex-1 min-w-[200px] rounded border border-warm-300 bg-white px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={refetch}
          className="rounded border border-warm-300 px-3 py-1.5 text-sm text-warm-800 hover:bg-warm-100"
        >
          검색
        </button>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded border border-gold-300 bg-gold-50 px-3 py-2 text-sm">
          <span className="font-medium text-gold-800">{selectedIds.size}건 선택됨</span>
          <button
            type="button"
            onClick={() => bulkStatus('published')}
            disabled={bulkBusy}
            className="rounded border border-warm-300 bg-white px-2 py-1 text-xs hover:bg-warm-100 disabled:opacity-50"
          >
            일괄 발행
          </button>
          <button
            type="button"
            onClick={() => bulkStatus('draft')}
            disabled={bulkBusy}
            className="rounded border border-warm-300 bg-white px-2 py-1 text-xs hover:bg-warm-100 disabled:opacity-50"
          >
            일괄 비공개
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto rounded px-2 py-1 text-xs text-warm-700 hover:bg-warm-100"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded border border-warm-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-warm-50 text-left text-xs text-warm-700">
            <tr>
              <th className="w-10 px-3 py-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2">제목</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">발행일</th>
              <th className="px-3 py-2">수정일</th>
              <th className="w-32 px-3 py-2 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-warm-600">
                  로딩 중…
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-warm-600">
                  글이 없습니다. 첫 글을 작성해보세요.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-t border-warm-200 hover:bg-warm-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/blog/${p.id}`} className="font-medium text-warm-900 hover:underline">
                      {p.title || '(제목 없음)'}
                    </Link>
                    {p.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-warm-600">{p.excerpt}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-warm-700">
                    {categoryMap.get(p.categoryId) ?? p.categoryId}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        p.status === 'published'
                          ? 'bg-sage-100 text-sage-700'
                          : 'bg-warm-200 text-warm-700',
                      ].join(' ')}
                    >
                      {p.status === 'published' ? '발행됨' : '초안'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-warm-600">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-warm-600">
                    {new Date(p.updatedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/blog/${p.id}`} className="mr-2 text-xs text-warm-700 hover:underline">
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      className="text-xs text-terracotta hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-warm-900">글 삭제</h3>
            <p className="mt-2 text-sm text-warm-700">
              &ldquo;{deleteTarget.title}&rdquo; 글을 삭제합니다. 삭제 직전 스냅샷이 자동 저장됩니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={bulkBusy}
                className="rounded border border-warm-300 px-3 py-1.5 text-sm hover:bg-warm-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => deletePost(deleteTarget)}
                disabled={bulkBusy}
                className="rounded bg-terracotta-solid px-3 py-1.5 text-sm font-semibold text-white hover:bg-terracotta-hover disabled:opacity-50"
              >
                {bulkBusy ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-sm shadow-lg',
            toast.ok ? 'bg-sage-600 text-white' : 'bg-terracotta-solid text-white',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
