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

interface GitHubBackupEntry {
  path: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
  label: string;
  createdAt: string;
}

interface TierStatus {
  tier1_blob?: boolean;
  tier2_github?: boolean;
  tier3_email?: boolean;
  encryption?: boolean;
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

function TierBadge({
  title,
  desc,
  on,
  envHint,
  required,
}: {
  title: string;
  desc: string;
  on: boolean;
  envHint?: string;
  required?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        on
          ? 'border-emerald-200 bg-emerald-50/50'
          : required
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-gray-200 bg-gray-50/50'
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            on ? 'bg-emerald-500' : required ? 'bg-amber-500' : 'bg-gray-400'
          }`}
        />
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      <div className="text-xs text-gray-600">{desc}</div>
      {envHint && <div className="mt-1 font-mono text-[0.65rem] text-gray-400">{envHint}</div>}
    </div>
  );
}

export default function AdminBackupPage() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [githubBackups, setGithubBackups] = useState<GitHubBackupEntry[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [tierStatus, setTierStatus] = useState<TierStatus>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoringPath, setRestoringPath] = useState<string | null>(null);
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
        const body = (await snapRes.json()) as {
          snapshots?: SnapshotSummary[];
          status?: TierStatus;
        };
        setSnapshots(body.snapshots ?? []);
        setTierStatus(body.status ?? {});
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

  async function fetchGitHubBackups() {
    setGithubLoading(true);
    try {
      const res = await fetch('/api/admin/backup/snapshots?source=github', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) {
        setToast({ msg: `GitHub 목록 로드 실패: ${body?.message ?? res.status}`, type: 'error' });
        return;
      }
      setGithubBackups(body.backups ?? []);
    } catch (err) {
      setToast({ msg: `GitHub 로드 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setGithubLoading(false);
    }
  }

  async function handleRestoreGitHub(path: string) {
    const warning =
      `GitHub 백업 '${path}' 로 DB 를 복원합니다 (자동 복호화).\n` +
      `복원 전 현재 상태는 'pre-restore' 스냅샷에 보관됩니다.\n` +
      `${restoreUsers ? '- 관리자 계정도 덮어쓰기\n' : ''}` +
      `${restoreAuditLog ? '- 감사 로그도 덮어쓰기\n' : ''}` +
      `계속할까요?`;
    if (!confirm(warning)) return;

    setRestoringPath(path);
    try {
      const res = await fetch('/api/admin/backup/snapshots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'github', path, restoreUsers, restoreAuditLog }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setToast({ msg: `GitHub 복원 실패: ${body?.message ?? 'unknown'}`, type: 'error' });
      } else {
        setToast({
          msg: `GitHub 복원 완료 — ${body.restored?.length ?? 0}개 · 롤백용: ${body.preRestoreId ?? '없음'}`,
          type: 'success',
        });
        await fetchList();
      }
    } catch (err) {
      setToast({ msg: `복원 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setRestoringPath(null);
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

        {/* 3중 백업 티어 상태 */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">3중 백업 티어</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TierBadge
              title="Tier 1 · Vercel Blob"
              desc="매일 자동 스냅샷 · 즉시 복원 가능"
              on
            />
            <TierBadge
              title="Tier 2 · GitHub"
              desc="일일 암호화 커밋 (backups 브랜치)"
              on={!!tierStatus.tier2_github}
              envHint="GITHUB_BACKUP_TOKEN · GITHUB_BACKUP_REPO"
            />
            <TierBadge
              title="Tier 3 · Email"
              desc="주 1회 암호화 첨부 발송 (일요일)"
              on={!!tierStatus.tier3_email}
              envHint="RESEND_API_KEY · BACKUP_EMAIL_RECIPIENT"
            />
            <TierBadge
              title="외부 전송 암호화"
              desc="AES-256-GCM · Tier 2/3 고객 PII 보호"
              on={!!tierStatus.encryption}
              envHint="BACKUP_ENCRYPTION_KEY (32B hex)"
              required
            />
          </div>
          {!tierStatus.encryption && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              ⚠ BACKUP_ENCRYPTION_KEY 가 설정되지 않아 Tier 2 · Tier 3 미러링이 중단되어 있습니다
              (평문으로 외부 전송하지 않음). Vercel 환경변수에 32바이트 hex 키를 추가하면 자동 활성화됩니다.
              <br />
              키 생성 명령: <code className="rounded bg-white/60 px-1">node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</code>
            </div>
          )}
        </section>

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

        {/* Tier 2 — GitHub 백업 */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Tier 2 · GitHub 백업 ({githubBackups.length})
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Vercel Blob 전체가 삭제되어도 GitHub 의 backups 브랜치에 암호화된 JSON 커밋이 영구 보관됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchGitHubBackups}
              disabled={!tierStatus.tier2_github || githubLoading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              title={!tierStatus.tier2_github ? 'GITHUB_BACKUP_TOKEN 미설정' : undefined}
            >
              {githubLoading ? '로드 중…' : '목록 불러오기'}
            </button>
          </div>
          {!tierStatus.tier2_github ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Tier 2 가 비활성화되어 있습니다. Vercel 환경변수에 <code>GITHUB_BACKUP_TOKEN</code>,{' '}
              <code>GITHUB_BACKUP_REPO</code>, <code>BACKUP_ENCRYPTION_KEY</code> 를 추가하면 일일 cron 이 자동으로 미러링합니다.
            </div>
          ) : githubBackups.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              &quot;목록 불러오기&quot; 를 누르면 GitHub backups 브랜치의 최근 커밋을 조회합니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">경로</th>
                    <th className="px-6 py-3 font-medium">라벨</th>
                    <th className="px-6 py-3 font-medium">커밋일시</th>
                    <th className="px-6 py-3 font-medium">크기</th>
                    <th className="px-6 py-3 text-right font-medium">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {githubBackups.map((b) => (
                    <tr key={b.sha} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">{b.path}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_STYLE[b.label] ?? 'bg-gray-100 text-gray-700'}`}>
                          {b.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600">{formatDate(b.createdAt)}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">{formatBytes(b.size)}</td>
                      <td className="px-6 py-3 text-right">
                        <a
                          href={`/api/admin/backup/snapshots?source=github&path=${encodeURIComponent(b.path)}`}
                          className="mr-2 inline-block rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          다운로드
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRestoreGitHub(b.path)}
                          disabled={!isSuperAdmin || restoringPath !== null}
                          className="inline-block rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
                        >
                          {restoringPath === b.path ? '복원 중…' : '복원'}
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
          <h3 className="mb-2 text-sm font-semibold text-gray-700">3중 백업 정책</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Tier 1 (Vercel Blob)</strong>: 매일 자정(KST) cron 이 전체 DB 스냅샷 생성. 삭제 직전(pre-delete) · 수동(manual) · 복원 직전(pre-restore) 스냅샷도 포함.</li>
            <li><strong>Tier 2 (GitHub)</strong>: 일일 cron 에서 Tier 1 생성 성공 시 backups 브랜치에 암호화 JSON 커밋. Vercel Blob 이 전부 삭제되어도 GitHub 히스토리로 복구 가능.</li>
            <li><strong>Tier 3 (Email)</strong>: 매주 일요일(UTC) cron 이 관리자 이메일로 암호화 <code>.json.gz</code> 첨부 발송. GitHub 도 잃었을 때의 최후 보루.</li>
            <li><strong>암호화</strong>: Tier 2 · Tier 3 로 나가는 모든 스냅샷은 <code>BACKUP_ENCRYPTION_KEY</code> (32B hex) 로 AES-256-GCM 암호화. 복원 시 자동 복호화.</li>
            <li>고객 PII (inquiries) · 관리자 해시(admin-users) 등 전 테이블 포함 백업.</li>
            <li>복원은 Tier 1 / Tier 2 / 업로드(JSON) 어디서든 가능하며 모두 복원 전 pre-restore 스냅샷 자동 생성.</li>
            <li>관리자 계정(<code>admin-users</code>) · 감사 로그(<code>audit-log</code>) 는 기본 복원 제외 (체크 시 덮어쓰기).</li>
            <li>보존: daily 14 / manual 30 / pre-delete 20 / pre-restore 10 (Tier 1 기준). Tier 2 (GitHub) 는 git 히스토리로 영구.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
