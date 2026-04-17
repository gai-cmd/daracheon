'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailFromLink = searchParams.get('email') ?? '';

  const [mode] = useState<'request' | 'reset'>(token ? 'reset' : 'request');

  const [email, setEmail] = useState(emailFromLink);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage({
        type: res.ok && data.success ? 'ok' : 'err',
        text: data.message ?? '요청 실패',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ type: 'err', text: '비밀번호는 8자 이상이어야 합니다.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/password-reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'ok', text: '비밀번호가 변경되었습니다. 3초 후 로그인 페이지로 이동합니다.' });
        setTimeout(() => router.replace('/admin/login'), 3000);
      } else {
        setMessage({ type: 'err', text: data.message ?? '실패' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a0a08] via-[#15130d] to-[#0a0a08] px-6">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 font-serif text-3xl tracking-[0.2em] text-gold-500">大羅天</div>
          <div className="font-display text-[0.65rem] tracking-[0.4em] text-gold-400">PASSWORD RESET</div>
        </div>

        {mode === 'request' ? (
          <form onSubmit={handleRequest} className="rounded-sm border border-gold-500/15 bg-[#14120c]/80 p-8 shadow-2xl backdrop-blur">
            <h1 className="mb-1 font-serif text-xl font-light tracking-wider text-white">비밀번호 재설정 요청</h1>
            <p className="mb-8 text-xs text-white/40">가입된 이메일로 재설정 링크를 보내드립니다.</p>

            {message && (
              <div
                className={`mb-6 rounded-sm border px-4 py-3 text-xs ${
                  message.type === 'ok'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <label className="mb-6 block">
              <span className="mb-2 block font-serif text-[0.7rem] uppercase tracking-[0.2em] text-gold-500">Email</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-500/60"
                placeholder="admin"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.25em] text-[#171717] transition hover:bg-gold-600 disabled:opacity-60"
            >
              {loading ? '요청 중...' : '재설정 링크 보내기'}
            </button>

            <p className="mt-6 text-center">
              <a href="/admin/login" className="text-[0.7rem] text-white/40 hover:text-gold-400">
                ← 로그인으로 돌아가기
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleReset} className="rounded-sm border border-gold-500/15 bg-[#14120c]/80 p-8 shadow-2xl backdrop-blur">
            <h1 className="mb-1 font-serif text-xl font-light tracking-wider text-white">새 비밀번호 설정</h1>
            <p className="mb-8 text-xs text-white/40">{emailFromLink || '계정'}의 새 비밀번호를 입력해주세요.</p>

            {message && (
              <div
                className={`mb-6 rounded-sm border px-4 py-3 text-xs ${
                  message.type === 'ok'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <label className="mb-6 block">
              <span className="mb-2 block font-serif text-[0.7rem] uppercase tracking-[0.2em] text-gold-500">New Password (8+ chars)</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-500/60"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.25em] text-[#171717] transition hover:bg-gold-600 disabled:opacity-60"
            >
              {loading ? '저장 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
