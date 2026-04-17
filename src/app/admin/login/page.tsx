'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, string> = { email, password };
      if (totp.trim()) body.totp = totp.trim();
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.requiresTotp) {
          setTotpRequired(true);
          setError(data.message ?? '2단계 인증 코드를 입력해주세요.');
          return;
        }
        setError(data.message ?? '로그인에 실패했습니다.');
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      console.error('[Login] error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a0a08] via-[#15130d] to-[#0a0a08] px-6">
      <div className="pointer-events-none absolute inset-0 select-none opacity-[0.05]">
        <div className="absolute left-10 top-24 font-serif text-[14rem] leading-none text-gold-500">大</div>
        <div className="absolute bottom-10 right-10 font-serif text-[14rem] leading-none text-gold-500">羅</div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 font-serif text-3xl tracking-[0.2em] text-gold-500">大羅天</div>
          <div className="font-display text-[0.65rem] tracking-[0.4em] text-gold-400">ADMIN CONSOLE</div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-sm border border-gold-500/15 bg-[#14120c]/80 p-8 shadow-2xl backdrop-blur"
        >
          <h1 className="mb-1 font-serif text-xl font-light tracking-wider text-white">관리자 로그인</h1>
          <p className="mb-8 text-xs text-white/40">등록된 계정으로 로그인하세요.</p>

          {error && (
            <div className="mb-6 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <label className="mb-5 block">
            <span className="mb-2 block font-serif text-[0.7rem] uppercase tracking-[0.2em] text-gold-500">ID</span>
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

          <label className="mb-6 block">
            <span className="mb-2 block font-serif text-[0.7rem] uppercase tracking-[0.2em] text-gold-500">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-500/60"
              placeholder="••••••••"
            />
          </label>

          {totpRequired && (
            <label className="mb-8 block">
              <span className="mb-2 block font-serif text-[0.7rem] uppercase tracking-[0.2em] text-gold-500">2FA Code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-white/10 bg-black/30 px-4 py-3 text-center text-xl tracking-[0.5em] text-white outline-none transition focus:border-gold-500/60"
                placeholder="000000"
                autoFocus
              />
            </label>
          )}

          {!totpRequired && <div className="mb-2"></div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.25em] text-[#171717] transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '로그인 중...' : 'Sign In'}
          </button>

          <p className="mt-6 text-center text-[0.7rem]">
            <a href="/admin/password-reset" className="text-white/50 transition hover:text-gold-400">
              비밀번호를 잊으셨나요?
            </a>
          </p>
          <p className="mt-3 text-center text-[0.7rem] text-white/30">
            &copy; 2026 ZOEL LIFE Co., Ltd.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
