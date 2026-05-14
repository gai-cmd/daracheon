'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BlogCategory } from '@/types/blog';

type CategoryWithCount = BlogCategory & { postCount: number };

interface CategoriesResponse {
  categories: CategoryWithCount[];
  total: number;
}

export default function BlogCategoriesPage() {
  const [items, setItems] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function refetch() {
    setLoading(true);
    try {
      const data = (await fetch('/api/admin/blog-categories').then((r) => r.json())) as CategoriesResponse;
      setItems(data.categories ?? []);
    } catch {
      setToast({ msg: '카테고리 목록을 불러오는데 실패했습니다.', ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  async function addCategory() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/blog-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: newDesc.trim() || undefined }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message);
      setToast({ msg: '카테고리가 추가되었습니다.', ok: true });
      setNewName('');
      setNewDesc('');
      await refetch();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : '추가 실패', ok: false });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c: CategoryWithCount) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDesc(c.description ?? '');
  }

  async function saveEdit(c: CategoryWithCount) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/blog-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, name: editName.trim(), description: editDesc.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message);
      setToast({ msg: '저장되었습니다.', ok: true });
      setEditingId(null);
      await refetch();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : '저장 실패', ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function move(c: CategoryWithCount, direction: -1 | 1) {
    const idx = items.findIndex((x) => x.id === c.id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= items.length) return;
    const orders = items.map((x, i) => {
      if (i === idx) return { id: x.id, order: targetIdx };
      if (i === targetIdx) return { id: x.id, order: idx };
      return { id: x.id, order: i };
    });
    setBusy(true);
    try {
      await fetch('/api/admin/blog-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/blog-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deleteTarget.id,
          reassignTo: reassignTo || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        reassignedCount?: number;
      };
      if (!res.ok || !data.success) throw new Error(data.message);
      setToast({
        msg:
          data.reassignedCount && data.reassignedCount > 0
            ? `${data.reassignedCount}개 글 재배치 후 삭제됨`
            : '삭제되었습니다.',
        ok: true,
      });
      setDeleteTarget(null);
      setReassignTo('');
      await refetch();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : '삭제 실패', ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/blog" className="text-sm text-warm-600 hover:underline">
            ← 블로그
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-warm-900">블로그 카테고리</h1>
        </div>
      </div>

      {/* Add form */}
      <div className="rounded border border-warm-200 bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-warm-800">새 카테고리 추가</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr_auto]">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="이름 (예: 침향 지식)"
            className="rounded border border-warm-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="설명 (선택)"
            className="rounded border border-warm-300 bg-white px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={busy || !newName.trim()}
            className="rounded bg-warm-900 px-3 py-1.5 text-sm font-semibold text-warm-50 hover:bg-warm-800 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded border border-warm-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-warm-50 text-left text-xs text-warm-700">
            <tr>
              <th className="w-16 px-3 py-2">순서</th>
              <th className="px-3 py-2">이름 / 설명</th>
              <th className="w-32 px-3 py-2">ID (slug)</th>
              <th className="w-20 px-3 py-2 text-center">글</th>
              <th className="w-48 px-3 py-2 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-warm-600">
                  로딩 중…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-warm-600">
                  카테고리가 없습니다. 위에서 추가하세요.
                </td>
              </tr>
            ) : (
              items.map((c, i) => (
                <tr key={c.id} className="border-t border-warm-200">
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(c, -1)}
                        disabled={i === 0 || busy}
                        className="rounded border border-warm-300 px-1.5 py-0.5 text-xs hover:bg-warm-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(c, 1)}
                        disabled={i === items.length - 1 || busy}
                        className="rounded border border-warm-300 px-1.5 py-0.5 text-xs hover:bg-warm-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {editingId === c.id ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-warm-300 px-2 py-1 text-sm"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="설명"
                          className="w-full rounded border border-warm-300 px-2 py-1 text-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-warm-900">{c.name}</p>
                        {c.description && <p className="mt-0.5 text-xs text-warm-600">{c.description}</p>}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-warm-700">{c.id}</td>
                  <td className="px-3 py-2 text-center text-xs text-warm-700">{c.postCount}</td>
                  <td className="px-3 py-2 text-right">
                    {editingId === c.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(c)}
                          disabled={busy}
                          className="mr-2 rounded bg-warm-900 px-2 py-1 text-xs font-semibold text-warm-50 hover:bg-warm-800"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-warm-300 px-2 py-1 text-xs"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="mr-2 text-xs text-warm-700 hover:underline"
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(c);
                            setReassignTo('');
                          }}
                          className="text-xs text-terracotta hover:underline"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-warm-900">카테고리 삭제</h3>
            <p className="mt-2 text-sm text-warm-700">
              &ldquo;{deleteTarget.name}&rdquo; 삭제 ({deleteTarget.postCount}개 글)
            </p>
            {deleteTarget.postCount > 0 && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-warm-800">
                  글을 어디로 옮길까요?
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full rounded border border-warm-300 px-2 py-1.5 text-sm"
                >
                  <option value="">미분류 (자동 생성)</option>
                  {items
                    .filter((c) => c.id !== deleteTarget.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
                className="rounded border border-warm-300 px-3 py-1.5 text-sm hover:bg-warm-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="rounded bg-terracotta-solid px-3 py-1.5 text-sm font-semibold text-white hover:bg-terracotta-hover disabled:opacity-50"
              >
                {busy ? '삭제 중…' : '삭제'}
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
