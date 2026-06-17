'use client';

import { useState, type CSSProperties } from 'react';
import type { AgeBand, Gender } from '@/lib/qr/types';

/**
 * QR 스캔 동의 수집 화면 (공개 사이트, 다크 럭셔리 테마).
 * 진입 차단 없음 — '동의하고 혜택 받기' 또는 '동의 없이 계속' 모두 목적지로 이동.
 * 동의 시에만 연령·성별·연락처를 수집한다(PIPA: 선택 동의 + 거부권·불이익 고지).
 */

const AGES: AgeBand[] = ['10대', '20대', '30대', '40대', '50대', '60대+', '비공개'];
const GENDERS: Gender[] = ['남성', '여성', '비공개'];

const GOLD = '#d4a843';
const INK = '#14161f';
const IVORY = '#fdfbf7';

export default function ScanConsent({ benefitText, destUrl }: { benefitText?: string; destUrl: string }) {
  const benefit = (benefitText && benefitText.trim()) || '추가 구매 할인 혜택';
  const [age, setAge] = useState<AgeBand | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function post(consented: boolean) {
    setBusy(true);
    try {
      await fetch('/api/q/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          consented
            ? { consented: true, age: age ?? undefined, gender: gender ?? undefined, contact: contact.trim() || undefined, name: name.trim() || undefined }
            : { consented: false },
        ),
      });
    } catch {
      /* 기록 실패해도 이동 */
    } finally {
      window.location.href = destUrl;
    }
  }

  const canSubmit = agreed && !!age && !!gender && !busy;

  const chip = (active: boolean): CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${active ? GOLD : 'rgba(253,251,247,0.25)'}`,
    background: active ? 'rgba(212,168,67,0.16)' : 'transparent',
    color: active ? GOLD : 'rgba(253,251,247,0.85)',
    fontSize: 14,
    cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0a0b10' }}>
      <div style={{ width: '100%', maxWidth: 460, background: INK, border: '1px solid rgba(212,168,67,0.25)', borderRadius: 18, padding: '28px 24px', color: IVORY }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: GOLD, textTransform: 'uppercase' }}>ZOEL LIFE · 대라천</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px' }}>
            잠깐! <span style={{ color: GOLD }}>{benefit}</span>
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(253,251,247,0.78)' }}>
            아래 정보 제공에 동의하시면 <b style={{ color: GOLD }}>{benefit}</b>을 받으실 수 있습니다.
            <br />동의하지 않으셔도 사이트 이용에는 제한이 없으나, 혜택 대상에서는 제외됩니다.
          </p>
        </div>

        {/* 연령대 */}
        <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 8 }}>연령대</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {AGES.map((a) => (
            <button key={a} type="button" onClick={() => setAge(a)} style={chip(age === a)}>{a}</button>
          ))}
        </div>

        {/* 성별 */}
        <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 8 }}>성별</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {GENDERS.map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)} style={chip(gender === g)}>{g}</button>
          ))}
        </div>

        {/* 연락처 (선택) */}
        <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 8 }}>연락처 (선택 — 혜택 안내 수신)</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="이메일 또는 휴대폰 번호"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(253,251,247,0.2)', background: 'rgba(255,255,255,0.04)', color: IVORY, fontSize: 14, marginBottom: 10 }}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(253,251,247,0.2)', background: 'rgba(255,255,255,0.04)', color: IVORY, fontSize: 14, marginBottom: 16 }}
        />

        {/* 수집·이용 고지 + 동의 */}
        <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(253,251,247,0.55)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(253,251,247,0.1)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          · 수집 항목: 연령대·성별(선택: 연락처·이름) · 수집·이용 목적: 혜택 제공 및 마케팅 분석 · 보유·이용 기간: 동의 철회 또는 목적 달성 시까지(최대 1년) · 제3자 제공·광고 활용 안 함.
          <br />· 동의를 거부할 권리가 있으며, 거부 시 위 혜택 대상에서 제외됩니다(사이트 이용은 정상).
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
          <span>개인정보 수집·이용에 동의합니다. <span style={{ color: GOLD }}>(필수 — 혜택 수령 시)</span></span>
        </label>

        {/* 액션 */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => post(true)}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: canSubmit ? GOLD : 'rgba(212,168,67,0.35)', color: '#1a1206', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', marginBottom: 10 }}
        >
          {busy ? '이동 중…' : '동의하고 혜택 받기'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => post(false)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(253,251,247,0.2)', background: 'transparent', color: 'rgba(253,251,247,0.6)', fontSize: 13.5, cursor: 'pointer' }}
        >
          동의 없이 계속
        </button>
      </div>
    </div>
  );
}
