'use client';

import { useEffect, useState } from 'react';

type Role = 'super_admin' | 'admin' | 'editor';

interface AdminUserView {
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
};

const ROLE_BADGE: Record<Role, string> = {
  super_admin: 'bg-gold-500/15 text-gold-700 border-gold-400',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  editor: 'bg-gray-100 text-gray-700 border-gray-200',
};

function formatAt(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<{ email: string; role: Role } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', role: 'editor' as Role });
  const [saving, setSaving] = useState(false);

  const [pwTarget, setPwTarget] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadSession() {
    try {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json();
      setMe({ email: data.email, role: data.role });
    } catch (err) {
      console.error('[Users] session fetch error:', err);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error('[Users] fetch error:', err);
      setToast('계정 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
    loadUsers();
  }, []);

  async function handleAdd() {
    if (!addForm.email.trim() || !addForm.password || addForm.password.length < 8) {
      setToast('이메일과 8자 이상 비밀번호가 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '계정 추가 실패');
        return;
      }
      setToast('계정이 추가되었습니다.');
      setAddOpen(false);
      setAddForm({ email: '', password: '', role: 'editor' });
      await loadUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(email: string, role: Role) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '역할 변경 실패');
        return;
      }
      setToast('역할이 변경되었습니다.');
      await loadUsers();
    } catch (err) {
      console.error('[Users] role change error:', err);
    }
  }

  async function handleResetPassword() {
    if (!pwTarget || pwValue.length < 8) {
      setToast('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pwTarget, password: pwValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '비밀번호 재설정 실패');
        return;
      }
      setToast('비밀번호가 변경되었습니다.');
      setPwTarget(null);
      setPwValue('');
    } catch (err) {
      console.error('[Users] reset pw error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (me?.email === deleteTarget) {
      setToast('자기 자신은 삭제할 수 없습니다.');
      setDeleteTarget(null);
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteTarget }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '삭제 실패');
        return;
      }
      setToast('삭제되었습니다.');
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      console.error('[Users] delete error:', err);
    }
  }

  const canManage = me?.role !== 'editor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-gray-500">총 {users.length}명 (env 계정 제외)</p>
          <p className="mt-1 text-sm text-gray-400">
            관리자 계정을 추가·삭제·역할 변경합니다. 현재 로그인: <span className="font-medium text-gray-600">{me?.email ?? '-'}</span>
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gold-600"
          >
            + 계정 추가
          </button>
        )}
      </div>

      {!canManage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Editor 역할은 계정을 조회만 할 수 있습니다.
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">등록된 DB 계정이 없습니다. env 계정(<code className="rounded bg-gray-100 px-1">ADMIN_EMAIL</code>)만 로그인 가능합니다.</p>
          {canManage && (
            <button type="button" onClick={() => setAddOpen(true)} className="mt-3 text-xs font-medium text-gold-600 hover:underline">
              + 첫 관리자 계정 만들기
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-[0.72rem] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">이메일</th>
                <th className="px-4 py-3 text-left font-medium">역할</th>
                <th className="px-4 py-3 text-left font-medium">생성일</th>
                <th className="px-4 py-3 text-left font-medium">최근 로그인</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isMe = me?.email === u.email;
                return (
                  <tr key={u.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.email}
                      {isMe && <span className="ml-2 rounded bg-gold-50 px-1.5 py-0.5 text-[0.65rem] text-gold-700">나</span>}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.email, e.target.value as Role)}
                          className={`rounded border px-2 py-1 text-xs ${ROLE_BADGE[u.role]}`}
                        >
                          {(['super_admin', 'admin', 'editor'] as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${ROLE_BADGE[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatAt(u.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatAt(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setPwTarget(u.email); setPwValue(''); }}
                            className="mr-3 text-xs text-gold-600 hover:underline"
                          >
                            비밀번호 재설정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u.email)}
                            disabled={isMe}
                            className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold">관리자 계정 추가</h2>
              <button type="button" onClick={() => setAddOpen(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">이메일</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">비밀번호 (8자 이상)</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">역할</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as Role })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="editor">Editor (편집만)</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setAddOpen(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">취소</button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-60"
              >
                {saving ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password reset modal */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold">비밀번호 재설정</h2>
              <button type="button" onClick={() => setPwTarget(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">{pwTarget}</span> 계정의 새 비밀번호를 입력하세요.</p>
              <input
                type="password"
                value={pwValue}
                onChange={(e) => setPwValue(e.target.value)}
                placeholder="8자 이상"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPwTarget(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">취소</button>
              <button type="button" onClick={handleResetPassword} className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600">재설정</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">계정 삭제</h3>
            <p className="mb-5 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{deleteTarget}</span> 계정을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">취소</button>
              <button type="button" onClick={handleDelete} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
