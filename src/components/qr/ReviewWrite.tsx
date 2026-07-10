'use client';

import { useState, type CSSProperties } from 'react';

/**
 * QR 후기 작성 화면 (공개 사이트, 다크 럭셔리 테마).
 * 별점·제품·제목·내용·이름(연령 선택) → /api/q/review 제출(승인 대기).
 * couponHint 있으면 작성 인센티브로 쿠폰 발급 안내 + 제출 후 코드 표시.
 */

const GOLD = '#d4a843';
const INK = '#14161f';
const IVORY = '#fdfbf7';
const AGES = ['10대', '20대', '30대', '40대', '50대', '60대+', '비공개'];

export default function ReviewWrite({ slug, product, couponHint }: { slug: string; product: string; couponHint: string | null }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [prod, setProd] = useState(product);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [age, setAge] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ coupon: { code: string; discount: string; validUntil: string } | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const field: CSSProperties = {
    width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(253,251,247,0.2)',
    background: 'rgba(255,255,255,0.04)', color: IVORY, fontSize: 14, marginBottom: 12,
  };

  async function submit() {
    setErr(null);
    if (rating < 1) return setErr('별점을 선택해주세요.');
    if (!prod.trim()) return setErr('제품을 입력해주세요.');
    if (!title.trim()) return setErr('제목을 입력해주세요.');
    if (content.trim().length < 10) return setErr('내용을 10자 이상 입력해주세요.');
    if (!author.trim()) return setErr('이름을 입력해주세요.');
    setBusy(true);
    try {
      const r = await fetch('/api/q/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, author: author.trim(), age: age || undefined, product: prod.trim(), rating, title: title.trim(), content: content.trim() }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j?.error ?? '제출에 실패했습니다.');
        setBusy(false);
        return;
      }
      setDone({ coupon: j.coupon ?? null });
    } catch {
      setErr('네트워크 오류가 발생했습니다.');
      setBusy(false);
    }
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0a0b10' }}>
      <div style={{ width: '100%', maxWidth: 460, background: INK, border: '1px solid rgba(212,168,67,0.25)', borderRadius: 18, padding: '28px 24px', color: IVORY }}>
        {children}
      </div>
    </div>
  );

  // ── 완료 화면 ──
  if (done) {
    return wrap(
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🙏</div>
        <h1 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px' }}>소중한 후기 감사합니다</h1>
        <p style={{ fontSize: 13.5, color: 'rgba(253,251,247,0.7)', marginBottom: done.coupon ? 18 : 24 }}>검토 후 사이트에 게시됩니다.</p>
        {done.coupon && (
          <>
            <p style={{ fontSize: 13, color: GOLD, marginBottom: 8 }}>🎁 후기 작성 감사 쿠폰이 발급되었습니다 ({done.coupon.discount})</p>
            <div style={{ border: '1.5px dashed rgba(212,168,67,0.6)', borderRadius: 12, padding: '14px 12px', marginBottom: 12, background: 'rgba(212,168,67,0.08)' }}>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 24, fontWeight: 700, letterSpacing: '0.12em', color: GOLD }}>{done.coupon.code}</div>
            </div>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(done.coupon!.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}
              style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(212,168,67,0.5)', background: 'transparent', color: GOLD, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
              {copied ? '복사됨 ✓' : '코드 복사'}
            </button>
          </>
        )}
        <a href="/reviews" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, background: GOLD, color: '#1a1206', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}>
          다른 후기 보러 가기 →
        </a>
      </div>,
    );
  }

  // ── 작성 폼 ──
  return wrap(
    <>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.28em', color: GOLD, textTransform: 'uppercase' }}>ZOEL LIFE · 대라천</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px' }}>후기를 남겨주세요</h1>
        {couponHint && (
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(253,251,247,0.8)' }}>
            후기를 작성하시면 <b style={{ color: GOLD }}>{couponHint} 할인 쿠폰</b>을 드립니다 🎁
          </p>
        )}
      </div>

      {/* 별점 */}
      <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>별점</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, fontSize: 32, lineHeight: 1 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ cursor: 'pointer', color: (hover || rating) >= n ? GOLD : 'rgba(253,251,247,0.25)' }}>★</span>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>제품</label>
      <input value={prod} onChange={(e) => setProd(e.target.value)} placeholder="제품명" style={field} />

      <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>제목</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="한 줄 요약" maxLength={100} style={field} />

      <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>내용</label>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="솔직한 후기를 남겨주세요 (10자 이상)" rows={4} maxLength={2000} style={{ ...field, resize: 'vertical' }} />

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>이름</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="홍길동" maxLength={20} style={field} />
        </div>
        <div style={{ width: 120 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'rgba(253,251,247,0.6)', marginBottom: 6 }}>연령(선택)</label>
          <select value={age} onChange={(e) => setAge(e.target.value)} style={field}>
            <option value="">선택</option>
            {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {err && <p style={{ color: '#e88', fontSize: 13, margin: '2px 0 10px' }}>{err}</p>}

      <button type="button" disabled={busy} onClick={submit}
        style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: busy ? 'rgba(212,168,67,0.4)' : GOLD, color: '#1a1206', fontSize: 15, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', marginTop: 4 }}>
        {busy ? '제출 중…' : couponHint ? '후기 남기고 쿠폰 받기' : '후기 등록'}
      </button>
      <p style={{ fontSize: 11, color: 'rgba(253,251,247,0.4)', textAlign: 'center', marginTop: 10 }}>작성하신 후기는 검토 후 게시되며, 이름은 일부 가려져 표시됩니다.</p>
    </>,
  );
}
