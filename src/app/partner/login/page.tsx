'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STRINGS = {
  ko: {
    kicker: 'ZOEL LIFE · Field Upload',
    title: '현장 업로드 포털',
    desc: '베트남 현장 사진·영상 업로드 전용 페이지입니다.\n발급받은 계정으로 로그인하세요.',
    loginId: '아이디',
    password: '비밀번호',
    idHint: '관리자에게 발급받은 아이디입니다 — 이메일·관리자 계정이 아닙니다.',
    submit: '로그인',
    submitting: '확인 중…',
  },
  vi: {
    kicker: 'ZOEL LIFE · Field Upload',
    title: 'Cổng tải lên hiện trường',
    desc: 'Trang tải ảnh & video hiện trường Việt Nam.\nĐăng nhập bằng tài khoản được cấp.',
    loginId: 'Tên đăng nhập',
    password: 'Mật khẩu',
    idHint: 'Tên đăng nhập do quản trị viên cấp — không phải email.',
    submit: 'Đăng nhập',
    submitting: 'Đang kiểm tra…',
  },
} as const;

type Lang = keyof typeof STRINGS;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  border: '1px solid rgba(212,168,67,0.25)',
  borderRadius: '10px',
  fontSize: '1rem',
  outline: 'none',
};

export default function PartnerLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ko');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('partner_lang');
    if (saved === 'vi' || saved === 'ko') setLang(saved);
  }, []);

  const t = STRINGS[lang];

  const switchLang = (next: Lang) => {
    setLang(next);
    localStorage.setItem('partner_lang', next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/partner/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.replace('/partner');
        return;
      }
      setError(json.message ?? '로그인에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다. / Lỗi mạng.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* 언어 토글 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 22 }}>
          {(['ko', 'vi'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLang(l)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: `1px solid ${lang === l ? '#b88c2d' : 'rgba(255,255,255,0.2)'}`,
                background: lang === l ? 'rgba(212,168,67,0.15)' : 'transparent',
                color: lang === l ? '#d4a843' : 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {l === 'ko' ? '한국어' : 'Tiếng Việt'}
            </button>
          ))}
        </div>

        <div
          style={{
            background: '#14161f',
            border: '1px solid rgba(212,168,67,0.25)',
            borderRadius: '24px',
            padding: '36px 28px',
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: '0.68rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#b88c2d',
              marginBottom: 10,
            }}
          >
            {t.kicker}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 10px', fontFamily: "var(--font-serif), serif" }}>
            {t.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 26 }}>
            {t.desc}
          </p>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={t.loginId}
              autoComplete="username"
              autoCapitalize="none"
              required
              style={inputStyle}
            />
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginTop: -4 }}>
              {t.idHint}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
            {error && (
              <div style={{ color: '#f0726a', fontSize: '0.82rem', lineHeight: 1.5 }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 6,
                padding: '14px',
                background: busy ? 'rgba(212,168,67,0.4)' : '#b88c2d',
                color: '#0a0b10',
                border: 0,
                borderRadius: '999px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: busy ? 'default' : 'pointer',
              }}
            >
              {busy ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
