'use client';

import { useEffect, useState } from 'react';

interface FileStatus {
  name: string;
  blob: { size: number; uploadedAt: string | null; url: string } | null;
  seed: { size: number; mtime: string } | null;
  match: boolean;
}

interface StatusResponse {
  hasBlobToken: boolean;
  files: FileStatus[];
  totalBlobBytes: number;
  totalSeedBytes: number;
  mismatchCount: number;
  latestUpload: string | null;
  elapsedMs: number;
}

interface ProbeStep {
  step: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

interface ProbeResponse {
  ok: boolean;
  summary: string;
  steps: ProbeStep[];
}

interface ResyncResponse {
  success: boolean;
  attempted?: number;
  written?: number;
  skipped?: number;
  errors?: number;
  reason?: string;
  files?: Array<{ name: string; status: string; bytes?: number; error?: string }>;
  message?: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function AdminDbPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resyncing, setResyncing] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState<ProbeResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchStatus() {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch('/api/admin/db/status', { cache: 'no-store' }),
        fetch('/api/admin/session', { cache: 'no-store' }),
      ]);
      if (sRes.ok) setStatus((await sRes.json()) as StatusResponse);
      if (mRes.ok) {
        const me = await mRes.json();
        setRole(me?.role ?? null);
      }
    } catch (err) {
      setToast({ msg: `상태 로드 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleResync() {
    if (!confirm('Blob의 현재 상태로 번들 seed를 덮어씁니다. 계속할까요?')) return;
    setResyncing(true);
    try {
      const res = await fetch('/api/admin/db/resync', { method: 'POST' });
      const body = (await res.json()) as ResyncResponse;
      if (!res.ok || !body.success) {
        setToast({ msg: `재동기화 실패: ${body.message ?? 'unknown'}`, type: 'error' });
      } else if (body.reason) {
        setToast({ msg: `재동기화 스킵: ${body.reason}`, type: 'error' });
      } else {
        setToast({
          msg: `재동기화 완료 — written ${body.written}, skipped ${body.skipped}, errors ${body.errors}`,
          type: 'success',
        });
        await fetchStatus();
      }
    } catch (err) {
      setToast({ msg: `재동기화 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setResyncing(false);
    }
  }

  async function handleProbe() {
    setProbing(true);
    setProbe(null);
    try {
      const res = await fetch('/api/admin/db/probe', { cache: 'no-store' });
      const body = (await res.json()) as ProbeResponse;
      setProbe(body);
      setToast({
        msg: body.ok ? 'Probe 통과 — 모든 경로 정상' : 'Probe 실패 — 상세 단계 참조',
        type: body.ok ? 'success' : 'error',
      });
    } catch (err) {
      setToast({ msg: `Probe 오류: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setProbing(false);
    }
  }

  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 text-white text-sm font-medium rounded-xl shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DB 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vercel Blob 저장소와 번들 seed의 동기화 상태를 확인·복구합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? '로드 중…' : '새로고침'}
          </button>
        </div>

        {/* Overview */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blob 개요</h2>
          {!status ? (
            <div className="text-gray-400 text-sm">로딩 중…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Blob 토큰" value={status.hasBlobToken ? '✓ 설정됨' : '✗ 없음'} />
              <Stat label="파일 수" value={`${status.files.length}`} />
              <Stat label="Blob 크기" value={formatBytes(status.totalBlobBytes)} />
              <Stat label="Seed 크기" value={formatBytes(status.totalSeedBytes)} />
              <Stat label="불일치" value={`${status.mismatchCount} / ${status.files.length}`} highlight={status.mismatchCount > 0} />
              <Stat label="마지막 업로드" value={formatDate(status.latestUpload)} />
              <Stat label="조회 시간" value={`${status.elapsedMs}ms`} />
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">액션</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleResync}
              disabled={resyncing || !isSuperAdmin || !status?.hasBlobToken}
              className="adm-btn-primary px-5"
              title={!isSuperAdmin ? 'super_admin 권한 필요' : undefined}
            >
              {resyncing ? '재동기화 중…' : '▶ Blob → Seed 재동기화'}
            </button>
            <button
              type="button"
              onClick={handleProbe}
              disabled={probing || !status?.hasBlobToken}
              className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {probing ? 'Probe 중…' : 'E2E Probe'}
            </button>
            {!isSuperAdmin && (
              <span className="text-xs text-amber-600">재동기화는 super_admin 전용</span>
            )}
            {!status?.hasBlobToken && (
              <span className="text-xs text-gray-500">로컬 환경(토큰 없음) — 일부 기능 비활성</span>
            )}
          </div>

          {probe && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className={`text-sm font-medium mb-3 ${probe.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {probe.summary}
              </div>
              <ul className="text-xs font-mono space-y-1">
                {probe.steps.map((s, i) => (
                  <li key={i} className={s.ok ? 'text-gray-700' : 'text-red-600'}>
                    {s.ok ? '✓' : '✗'} {s.step}
                    {s.detail && <span className="text-gray-400"> — {s.detail}</span>}
                    {s.error && <span className="text-red-500"> — {s.error}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* File table */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">파일별 상태</h2>
          {!status ? (
            <div className="text-gray-400 text-sm">로딩 중…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-4 font-medium">파일</th>
                    <th className="py-2 pr-4 font-medium">Blob</th>
                    <th className="py-2 pr-4 font-medium">Seed</th>
                    <th className="py-2 pr-4 font-medium">Blob 업로드</th>
                    <th className="py-2 pr-4 font-medium">Seed mtime</th>
                    <th className="py-2 pr-4 font-medium">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {status.files.map((f) => (
                    <tr key={f.name} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs text-gray-700">{f.name}.json</td>
                      <td className="py-2 pr-4 text-gray-700">
                        {f.blob ? formatBytes(f.blob.size) : <span className="text-gray-400">없음</span>}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {f.seed ? formatBytes(f.seed.size) : <span className="text-gray-400">없음</span>}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{formatDate(f.blob?.uploadedAt ?? null)}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{formatDate(f.seed?.mtime ?? null)}</td>
                      <td className="py-2 pr-4">
                        {f.match ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                            ✓ 일치
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                            ✗ 불일치
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-3">
                * &ldquo;불일치&rdquo;는 Blob/seed 파일 크기 차이로 판정 — 내용 hash 비교가 아닌 빠른 근사. 정확한 내용 비교가 필요하면 재동기화 후 다시 확인.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
