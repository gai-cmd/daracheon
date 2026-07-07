'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types (API 응답과 동일 구조) ─────────────────────── */

interface SubmissionFile {
  url: string;
  type: 'photo' | 'video';
  size: number;
  name?: string;
}

interface Submission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  note?: string;
  files: SubmissionFile[];
  partnerName: string;
  location?: { lat: number; lng: number; accuracy?: number; source?: string };
  weather?: { tempC: number; humidity?: number; windKmh?: number; text?: string };
  capturedAt?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
  mediaIds?: string[];
}

interface PartnerAccountView {
  id: string;
  loginId: string;
  name: string;
  active: boolean;
  memo?: string;
  createdAt: string;
  lastLoginAt?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '승인 대기',
  approved: '게시됨',
  rejected: '반려',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(n / 1024))}KB`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '-';
  return iso.replace('T', ' ').slice(0, 16);
}

/* ─── Component ────────────────────────────────────────── */

export default function SubmissionsAdminPanel() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [accounts, setAccounts] = useState<PartnerAccountView[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);

  // 계정 생성 폼
  const [newLoginId, setNewLoginId] = useState('');
  const [newName, setNewName] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [issuedPassword, setIssuedPassword] = useState<{ loginId: string; password: string } | null>(null);

  // 비번 재설정 인라인 폼 (행 단위)
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, accRes] = await Promise.all([
        fetch('/api/admin/media-submissions', { cache: 'no-store' }),
        fetch('/api/admin/partner-accounts', { cache: 'no-store' }),
      ]);
      const subJson = await subRes.json();
      const accJson = await accRes.json();
      if (Array.isArray(subJson.submissions)) setSubmissions(subJson.submissions);
      if (Array.isArray(accJson.accounts)) setAccounts(accJson.accounts);
    } catch (err) {
      console.error(err);
      setToast('데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── 승인/거절 ─── */

  const review = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/media-submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...(reason ? { reason } : {}) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setToast(json.message ?? '처리에 실패했습니다.');
        return;
      }
      setToast(action === 'approve' ? '승인 완료 — /media 에 게시되었습니다.' : '반려 처리되었습니다.');
      setRejectingId(null);
      setRejectReason('');
      fetchAll();
    } catch {
      setToast('처리 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  /* ─── 계정 관리 ─── */

  const createAccount = async () => {
    if (!newLoginId.trim() || !newName.trim()) {
      setToast('아이디와 이름을 입력하세요.');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setToast('비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    setCreatingAccount(true);
    try {
      const res = await fetch('/api/admin/partner-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: newLoginId.trim(),
          name: newName.trim(),
          ...(newPassword ? { password: newPassword } : {}),
          ...(newMemo.trim() ? { memo: newMemo.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setToast(json.message ?? '계정 생성에 실패했습니다.');
        return;
      }
      setIssuedPassword({ loginId: json.account.loginId, password: json.password });
      setNewLoginId('');
      setNewName('');
      setNewMemo('');
      setNewPassword('');
      fetchAll();
    } catch {
      setToast('계정 생성 중 오류가 발생했습니다.');
    } finally {
      setCreatingAccount(false);
    }
  };

  const accountAction = async (
    id: string,
    action: 'toggle-active' | 'reset-password',
    password?: string
  ) => {
    if (password && password.length < 4) {
      setToast('비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/partner-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...(password ? { password } : {}) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setToast(json.message ?? '처리에 실패했습니다.');
        return;
      }
      if (action === 'reset-password' && json.password) {
        setIssuedPassword({ loginId: json.account.loginId, password: json.password });
      }
      setResetTargetId(null);
      setResetPassword('');
      fetchAll();
    } catch {
      setToast('처리 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteAccount = async (id: string, loginId: string) => {
    if (!window.confirm(`파트너 계정 "${loginId}" 를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/partner-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setToast(json.message ?? '삭제에 실패했습니다.');
        return;
      }
      setToast('계정이 삭제되었습니다.');
      fetchAll();
    } catch {
      setToast('삭제 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  /* ─── Render ─── */

  const pending = submissions.filter((s) => s.status === 'pending');
  const processed = submissions.filter((s) => s.status !== 'pending');

  const metaChips = (s: Submission) => (
    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
      <span className="rounded bg-gray-100 px-2 py-0.5">업로더: {s.partnerName}</span>
      {s.capturedAt && <span className="rounded bg-gray-100 px-2 py-0.5">촬영 {fmtDate(s.capturedAt)}</span>}
      <span className="rounded bg-gray-100 px-2 py-0.5">제출 {fmtDate(s.submittedAt)}</span>
      {s.location && (
        <a
          href={`https://maps.google.com/?q=${s.location.lat},${s.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-blue-50 px-2 py-0.5 text-blue-700 hover:underline"
        >
          GPS {s.location.lat.toFixed(5)}, {s.location.lng.toFixed(5)}
          {s.location.source === 'exif' ? ' (사진 EXIF)' : ' (기기)'}
        </a>
      )}
      {s.weather && (
        <span className="rounded bg-sky-50 px-2 py-0.5 text-sky-700">
          {s.weather.text ?? '날씨'} {Math.round(s.weather.tempC)}°C
          {typeof s.weather.humidity === 'number' ? ` · 습도 ${s.weather.humidity}%` : ''}
        </span>
      )}
    </div>
  );

  const fileGrid = (s: Submission) => (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {s.files.map((f, i) => (
        <a
          key={`${s.id}-${i}`}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-lg border border-gray-200 bg-gray-900"
          style={{ aspectRatio: '1' }}
        >
          {f.type === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.url} alt={f.name ?? ''} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <video src={f.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {f.type === 'video' ? '▶ 영상' : '사진'} · {fmtBytes(f.size)}
          </span>
        </a>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* 발급 비밀번호 모달 */}
      {issuedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">파트너 계정 비밀번호</h3>
            <p className="mt-2 text-sm text-gray-600">
              지금 한 번만 표시됩니다. 위탁업체에 안전한 채널로 전달하세요.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 font-mono text-sm">
              <div>아이디: <b>{issuedPassword.loginId}</b></div>
              <div className="mt-1">비밀번호: <b>{issuedPassword.password}</b></div>
              <div className="mt-1 text-xs text-gray-500">로그인 주소: https://zoellife.com/partner/login</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `ZOEL LIFE 현장 업로드\nhttps://zoellife.com/partner/login\n아이디: ${issuedPassword.loginId}\n비밀번호: ${issuedPassword.password}`
                  );
                  setToast('클립보드에 복사했습니다.');
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                복사
              </button>
              <button
                type="button"
                onClick={() => setIssuedPassword(null)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400">불러오는 중…</div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-10">
          {/* ── 승인 대기 ── */}
          <section>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-lg font-bold text-neutral-900">승인 대기</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
                {pending.length}
              </span>
            </div>
            {pending.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
                대기 중인 현장 제출이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {pending.map((s) => (
                  <div key={s.id} className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status]}`}>
                            {STATUS_LABEL[s.status]}
                          </span>
                          <h3 className="truncate text-base font-semibold text-neutral-900">{s.title}</h3>
                        </div>
                        {s.note && <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{s.note}</p>}
                        {metaChips(s)}
                      </div>
                    </div>
                    {fileGrid(s)}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => review(s.id, 'approve')}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {busyId === s.id ? '처리 중…' : `승인 → /media 게시 (${s.files.length}건)`}
                      </button>
                      {rejectingId === s.id ? (
                        <>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="반려 사유 (파트너에게 표시됨)"
                            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={busyId === s.id}
                            onClick={() => review(s.id, 'reject', rejectReason)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            반려 확정
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRejectingId(s.id)}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          반려
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── 처리 완료 ── */}
          <section>
            <button
              type="button"
              onClick={() => setShowProcessed((v) => !v)}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              <span>{showProcessed ? '▾' : '▸'}</span>
              처리 완료 내역 ({processed.length})
            </button>
            {showProcessed && (
              <div className="space-y-3">
                {processed.map((s) => (
                  <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                      <span className="truncate text-sm font-medium text-neutral-800">{s.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-gray-400">
                        {fmtDate(s.reviewedAt)} · {s.reviewedBy}
                      </span>
                    </div>
                    {s.rejectReason && (
                      <div className="mt-1 text-xs text-red-500">사유: {s.rejectReason}</div>
                    )}
                    {metaChips(s)}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── 파트너 계정 관리 ── */}
          <section>
            <h2 className="mb-1 text-lg font-bold text-neutral-900">파트너 계정 관리</h2>
            <p className="mb-4 text-sm text-gray-500">
              외부 위탁업체용 업로드 계정입니다. 로그인 주소:{' '}
              <span className="font-mono text-gray-700">zoellife.com/partner/login</span>
            </p>

            {/* 생성 폼 */}
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4">
              <label className="text-xs text-gray-500">
                아이디
                <input
                  type="text"
                  value={newLoginId}
                  onChange={(e) => setNewLoginId(e.target.value)}
                  placeholder="vn-hatinh"
                  className="mt-1 block w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                표시 이름 (업체/담당자)
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="하띤 촬영팀"
                  className="mt-1 block w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                비밀번호 (4자 이상)
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="직접 입력 (비우면 자동 생성)"
                  autoComplete="off"
                  className="mt-1 block w-44 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                메모 (선택)
                <input
                  type="text"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  placeholder="담당: OOO, 연락처…"
                  className="mt-1 block w-52 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={creatingAccount}
                onClick={createAccount}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {creatingAccount ? '생성 중…' : '+ 계정 생성'}
              </button>
            </div>

            {/* 계정 목록 */}
            {accounts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
                등록된 파트너 계정이 없습니다.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {accounts.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-mono text-sm font-semibold text-neutral-900">{a.loginId}</span>
                    <span className="text-sm text-gray-700">{a.name}</span>
                    {a.memo && <span className="text-xs text-gray-400">{a.memo}</span>}
                    <span className="ml-auto text-xs text-gray-400">
                      최근 로그인: {a.lastLoginAt ? fmtDate(a.lastLoginAt) : '없음'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {resetTargetId === a.id ? (
                        <>
                          <input
                            type="text"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="새 비밀번호 (비우면 자동 생성)"
                            autoComplete="off"
                            className="w-52 rounded border border-amber-300 px-2.5 py-1 font-mono text-xs"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => accountAction(a.id, 'reset-password', resetPassword || undefined)}
                            className="rounded bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                          >
                            {busyId === a.id ? '적용 중…' : '적용'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setResetTargetId(null); setResetPassword(''); }}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => accountAction(a.id, 'toggle-active')}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            {a.active ? '비활성화' : '활성화'}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => { setResetTargetId(a.id); setResetPassword(''); }}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            비번 재설정
                          </button>
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => deleteAccount(a.id, a.loginId)}
                            className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
