'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FormState {
  name: string;
  email: string;
  company: string;
  role: string;
}

const ROLES = [
  '경영진 / 임원',
  '구매 / 소싱',
  'MD / 바이어',
  '마케팅 / 브랜드',
  '미디어 / 기자',
  '기타',
];

export default function AgarwoodEditionForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    role: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/agarwood-edition/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          utm_source: sp.get('utm_source') ?? undefined,
          utm_medium: sp.get('utm_medium') ?? undefined,
          utm_campaign: sp.get('utm_campaign') ?? undefined,
          referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        }),
      });
      const data = (await res.json()) as { success: boolean; message?: string; errors?: string[] };
      if (!res.ok || !data.success) {
        const msg = data.errors?.[0] ?? data.message ?? '신청 처리 중 오류가 발생했습니다.';
        setError(msg);
        setSubmitting(false);
        return;
      }
      router.push('/agarwood-edition/sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(212,168,67,0.25)',
    color: '#fff',
    fontSize: '0.95rem',
    fontFamily: "'Noto Sans KR', sans-serif",
    outline: 'none',
    transition: 'border-color 200ms',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: '0.62rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--accent-soft)',
    marginBottom: 10,
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <label htmlFor="name" style={labelStyle}>
          이름 *
        </label>
        <input
          id="name"
          required
          maxLength={50}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="email" style={labelStyle}>
          이메일 *
        </label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
          autoComplete="email"
          placeholder="business@company.com"
        />
        <p
          style={{
            marginTop: 8,
            fontSize: '0.74rem',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
          }}
        >
          입력하신 이메일로 한정 공개 링크가 발송됩니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label htmlFor="company" style={labelStyle}>
            회사명
          </label>
          <input
            id="company"
            maxLength={80}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            style={inputStyle}
            autoComplete="organization"
          />
        </div>
        <div>
          <label htmlFor="role" style={labelStyle}>
            역할
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">선택 안 함</option>
            {ROLES.map((r) => (
              <option key={r} value={r} style={{ background: '#0a0b10' }}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(255,100,80,0.4)',
            background: 'rgba(255,100,80,0.06)',
            color: 'rgba(255,180,170,0.95)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 8,
          padding: '18px 28px',
          background: submitting ? 'rgba(184,140,45,0.5)' : 'var(--accent)',
          color: 'var(--lx-black)',
          border: 'none',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '0.78rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'background 200ms',
        }}
      >
        {submitting ? '처리 중...' : '디지털 에디션 받기 →'}
      </button>

      <p
        style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.7,
          marginTop: 4,
        }}
      >
        제출 시 대라천의 개인정보 처리 방침에 동의하는 것으로 간주됩니다. 마케팅 이메일 수신은 언제든
        해지할 수 있습니다.
      </p>
    </form>
  );
}
