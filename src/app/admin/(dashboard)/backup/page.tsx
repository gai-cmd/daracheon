'use client';

import { useEffect, useState } from 'react';

interface SnapshotSummary {
  id: string;
  label: string;
  createdAt: string;
  size: number;
  url: string;
  pathname: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}

const LABEL_STYLE: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-700',
  manual: 'bg-emerald-100 text-emerald-700',
  'pre-delete': 'bg-amber-100 text-amber-700',
  'pre-restore': 'bg-violet-100 text-violet-700',
};

export default function AdminBackupPage() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [restoreUsers, setRestoreUsers] = useState(false);
  const [restoreAuditLog, setRestoreAuditLog] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchList() {
    setLoading(true);
    try {
      const [snapRes, meRes] = await Promise.all([
        fetch('/api/admin/backup/snapshots', { cache: 'no-store' }),
        fetch('/api/admin/session', { cache: 'no-store' }),
      ]);
      if (!snapRes.ok) {
        const body = await snapRes.json().catch(() => ({}));
        setToast({ msg: `목록 로드 실패: ${body?.message ?? snapRes.status}`, type: 'error' });
      } else {
        const body = (await snapRes.json()) as { snapshots?: SnapshotSummary[] };
        setSnapshots(body.snapshots ?? []);
      }
      if (meRes.ok) {
        const me = await meRes.json();
        setRole(me?.role ?? null);
      }
    } catch (err) {
      setToast({ msg: `네트워크 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleCreate() {
    if (!confirm('현재 DB 상태의 수동 스냅샷을 생성합니다. 계속할까요?')) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/backup/snapshots', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setToast({ msg: `생성 실패: ${body?.message ?? 'unknown'}`, type: 'error' });
      } else {
        setToast({
          msg: `수동 스냅샷 생성됨 — ${body.snapshot?.id ?? ''}`,
          type: 'success',
        });
        await fetchList();
      }
    } catch (err) {
      setToast({ msg: `오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore(id: string) {
    const warning =
      `스냅샷 '${id}' 로 DB 를 덮어씁니다.\n` +
      `복원 전 현재 상태는 자동으로 'pre-restore' 스냅샷에 보관됩니다.\n` +
      `${restoreUsers ? '- 관리자 계정도 덮어쓰기\n' : ''}` +
      `${restoreAuditLog ? '- 감사 로그도 덮어쓰기\n' : ''}` +
      `계속할까요?`;
    if (!confirm(warning)) return;

    setRestoringId(id);
    try {
      const res = await fetch('/api/admin/backup/snapshots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, restoreUsers, restoreAuditLog }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setToast({ msg: `복원 실패: ${body?.message ?? 'unknown'}`, type: 'error' });
      } else {
        setToast({
          msg: `복원 완료 — ${body.restored?.length ?? 0}개 복원 · 롤백용: ${body.preRestoreId ?? '없음'}`,
          type: 'success',
        });
        await fetchList();
      }
    } catch (err) {
      setToast({ msg: `복원 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setRestoringId(null);
    }
  }

  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">백업 & 복원</h1>
            <p className="mt-1 text-sm text-gray-500">
              매일 자동 스냅샷 + 수동 스냅샷 + 삭제 직전 자동 스냅샷으로 고객 DB 를 보호합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchList}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? '로드 중…' : '새로고침'}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !isSuperAdmin}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
              title={!isSuperAdmin ? 'super_admin 전용' : undefined}
            >
              {creating ? '생성 중…' : '+ 수동 스냅샷'}
            </button>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            이 페이지는 super_admin 전용입니다. 편집 작업은 비활성화됩니다.
          </div>
        )}

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">복원 옵션</h2>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={restoreUsers}
                onChange={(e) => setRestoreUsers(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-gray-700">관리자 계정도 덮어쓰기</span>
              <span className="text-xs text-red-500">(로그인 불가 리스크)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={restoreAuditLog}
                onChange={(e) => setRestoreAuditLog(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-gray-700">감사 로그도 덮어쓰기</span>
              <span className="text-xs text-gray-500">(기본: 유지)</span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              스냅샷 목록 ({snapshots.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">로딩 중…</div>
          ) : snapshots.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              아직 스냅샷이 없습니다. 수동으로 생성하거나, 매일 cron 이 실행되면 자동 생성됩니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">라벨</th>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">생성일시</th>
                    <th className="px-6 py-3 font-medium">크기</th>
                    <th className="px-6 py-3 text-right font-medium">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {snapshots.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            LABEL_STYLE[s.label] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">{s.id}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">{formatDate(s.createdAt)}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">{formatBytes(s.size)}</td>
                      <td className="px-6 py-3 text-right">
                        <a
                          href={`/api/admin/backup/snapshots?id=${encodeURIComponent(s.id)}`}
                          className="mr-2 inline-block rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          다운로드
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRestore(s.id)}
                          disabled={!isSuperAdmin || restoringId !== null}
                          className="inline-block rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
                        >
                          {restoringId === s.id ? '복원 중…' : '복원'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-xs text-gray-500 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">백업 정책</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>매일 자정(KST) Vercel Cron 이 <code>/api/cron/daily-backup</code> 을 호출해 전체 DB 를 스냅샷합니다.</li>
            <li>문의/제품/리뷰/회사 정보 등의 민감한 테이블은 삭제 직전 자동으로 <code>pre-delete</code> 스냅샷이 생성됩니다.</li>
            <li>수동 스냅샷은 super_admin 이 아무 때나 버튼으로 생성 가능합니다.</li>
            <li>복원 실행 시 현재 상태가 <code>pre-restore</code> 스냅샷으로 먼저 저장되어 즉시 롤백 가능합니다.</li>
            <li>보존: daily 14개 / manual 30개 / pre-delete 20개 / pre-restore 10개. 오래된 스냅샷은 cron 실행 시 자동 정리됩니다.</li>
            <li>관리자 계정(<code>admin-users</code>)과 감사 로그(<code>audit-log</code>)는 기본 복원 대상에서 제외됩니다. 체크 시에만 덮어씁니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
