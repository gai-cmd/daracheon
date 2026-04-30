import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AgarwoodEditionForm from './AgarwoodEditionForm';

export const metadata: Metadata = {
  title: '대라천 디지털 에디션 — 한정 공개 | 진짜 침향 219,000시간의 기록',
  description:
    '베트남 5개 성 25년 농장 기록, 학명 Aquilaria Agallocha Roxburgh의 모든 것. 신청자에게만 발송되는 한정 디지털 에디션.',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: '잘못된 링크입니다. 다시 신청해 주세요.',
  not_found: '인증 링크를 찾을 수 없습니다. 다시 신청해 주세요.',
  expired: '링크가 만료되었습니다. 다시 신청해 주세요.',
};

export default async function AgarwoodEditionLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(1400px 700px at 80% -20%, rgba(184,140,45,0.12), transparent 60%), #050608',
        color: '#fff',
        padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 40px)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.85fr)',
          gap: 'clamp(40px, 8vw, 100px)',
          alignItems: 'start',
        }}
      >
        {/* LEFT — narrative */}
        <section>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.66rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 24,
            }}
          >
            Digital Edition · Limited Access
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4.4vw, 3rem)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              margin: 0,
              marginBottom: 28,
            }}
          >
            진짜 침향,
            <br />
            <em
              style={{
                color: 'var(--accent)',
                fontStyle: 'normal',
              }}
            >
              219,000시간의 기록
            </em>
          </h1>
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.95,
              color: 'rgba(255,255,255,0.78)',
              marginBottom: 22,
              fontWeight: 300,
            }}
          >
            베트남 5개 성, 200ha의 직영 농장, 25년의 시간. 식약처가 인정한 단 하나의 학명{' '}
            <em style={{ color: 'var(--accent-soft)', fontStyle: 'normal' }}>
              Aquilaria Agallocha Roxburgh
            </em>
            의 진짜 이야기를 한 권에 담았습니다.
          </p>
          <p
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.95,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 36,
              fontWeight: 300,
            }}
          >
            본 디지털 에디션은 <strong style={{ color: '#fff' }}>대라천이 직접 초대하는 분께만</strong>{' '}
            제공됩니다. 신청 시 본인 인증 후 한정 공개 링크가 발송되며, 14일간 유효합니다.
          </p>

          {/* what's inside */}
          <div
            style={{
              padding: '24px 26px',
              border: '1px solid rgba(212,168,67,0.22)',
              background: 'rgba(212,168,67,0.04)',
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.26em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              Inside this Edition
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 12,
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 300,
                lineHeight: 1.6,
              }}
            >
              {[
                '베트남 5개 성 25년 직영 농장 영상 기록',
                '식약처 4대 공식문서가 인정한 단 하나의 학명',
                '진짜 침향을 가리는 3가지 기준 (학명·산지·증빙)',
                'CITES·ISO·GMP 등 보유 인증서 원본',
                '제품 라인업 7종 · 복용·사용법 가이드',
              ].map((line) => (
                <li key={line} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      marginTop: 8,
                    }}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}
          >
            대라천 · ZOEL LIFE — Since 1998
          </div>
        </section>

        {/* RIGHT — form */}
        <aside
          style={{
            position: 'sticky',
            top: 40,
            padding: 'clamp(28px, 4vw, 40px)',
            border: '1px solid rgba(212,168,67,0.3)',
            background: 'rgba(10,11,16,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 12,
            }}
          >
            Request Access
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 400,
              fontSize: '1.45rem',
              lineHeight: 1.4,
              margin: 0,
              marginBottom: 24,
              color: '#fff',
            }}
          >
            한정 공개 링크 받기
          </h2>

          {errorMessage && (
            <div
              style={{
                marginBottom: 22,
                padding: '12px 14px',
                border: '1px solid rgba(255,100,80,0.4)',
                background: 'rgba(255,100,80,0.06)',
                color: 'rgba(255,180,170,0.95)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
              }}
            >
              {errorMessage}
            </div>
          )}

          <Suspense fallback={null}>
            <AgarwoodEditionForm />
          </Suspense>

          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid rgba(212,168,67,0.15)',
              fontSize: '0.74rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.7,
            }}
          >
            이미 링크를 받으셨나요? 받은 편지함의 메일 안 버튼을 클릭해 주세요.
            <br />
            문의:{' '}
            <Link href="mailto:hello@daerachoen.com" style={{ color: 'var(--accent-soft)' }}>
              hello@daerachoen.com
            </Link>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          main > div { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
      `}</style>
    </main>
  );
}
