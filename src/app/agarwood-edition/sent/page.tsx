import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '메일을 확인해 주세요 | 대라천 디지털 에디션',
  robots: { index: false, follow: false },
};

export default function SentPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(1400px 700px at 50% -20%, rgba(184,140,45,0.12), transparent 60%), #050608',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 40px)',
      }}
    >
      <div style={{ maxWidth: 540, textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 32px',
            border: '1px solid var(--accent)',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--accent)',
            fontFamily: "'Noto Serif KR', serif",
            fontSize: '1.6rem',
            fontWeight: 300,
          }}
          aria-hidden
        >
          ✓
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.66rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 18,
          }}
        >
          Verification Sent
        </div>
        <h1
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 300,
            fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)',
            lineHeight: 1.4,
            margin: 0,
            marginBottom: 24,
          }}
        >
          받은 편지함을 확인해 주세요.
        </h1>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.95,
            color: 'rgba(255,255,255,0.72)',
            marginBottom: 18,
            fontWeight: 300,
          }}
        >
          입력하신 이메일로 한정 공개 링크가 발송되었습니다.
          <br />
          메일 안 <strong style={{ color: 'var(--accent-soft)' }}>"디지털 에디션 열람 →"</strong>{' '}
          버튼을 클릭하시면 즉시 열람하실 수 있습니다.
        </p>
        <p
          style={{
            fontSize: '0.86rem',
            lineHeight: 1.85,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 40,
            fontWeight: 300,
          }}
        >
          메일이 보이지 않는다면 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>스팸함</strong>을
          확인해 주세요. 5분 이내에 도착하지 않으면 받은 편지함 주소를 다시 확인하시고 재신청해
          주세요.
        </p>
        <div
          style={{
            display: 'inline-flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/agarwood-edition"
            style={{
              padding: '14px 24px',
              border: '1px solid rgba(212,168,67,0.4)',
              color: 'var(--accent-soft)',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            ← 신청 화면으로
          </Link>
          <Link
            href="/"
            style={{
              padding: '14px 24px',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            zoellife.com 홈
          </Link>
        </div>
      </div>
    </main>
  );
}
