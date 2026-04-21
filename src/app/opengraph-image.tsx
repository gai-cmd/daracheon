import { ImageResponse } from 'next/og';

// Dynamic OpenGraph image (1200x630) — rendered at the edge per request.
// Next.js 자동으로 <head> 에 og:image / twitter:image 링크 삽입.
// 브랜드 일관성: 침향 골드(gold-400 #d4a843) + 블랙 배경 + 학명 서명.

export const runtime = 'edge';
export const alt = '대라천 ZOEL LIFE — 프리미엄 침향 전문 브랜드';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 90px',
          background:
            'radial-gradient(ellipse 60% 70% at 30% 30%, rgba(212,168,67,0.22), transparent 60%), linear-gradient(180deg, #0a0b10 0%, #14161f 100%)',
          color: '#fdfbf7',
          fontFamily: 'serif',
        }}
      >
        {/* Top: brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #d4a843 0%, #b88c2d 100%)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, letterSpacing: '0.18em', color: '#d4a843', fontWeight: 600 }}>
              ZOEL LIFE
            </span>
            <span style={{ fontSize: 14, letterSpacing: '0.34em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
              대라천 · 침향
            </span>
          </div>
        </div>

        {/* Center: tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.32em',
              color: '#d4a843',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Agarwood Story
          </div>
          <div style={{ fontSize: 78, lineHeight: 1.08, fontWeight: 300, color: '#fff', maxWidth: 1000 }}>
            이젠 진짜 침향,
            <br />
            <span style={{ color: '#d4a843', fontWeight: 400 }}>학명부터 확인하세요.</span>
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', marginTop: 6 }}>
            Aquilaria Agallocha Roxburgh · 식약처 공식 등재
          </div>
        </div>

        {/* Bottom: domain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: 'rgba(255,255,255,0.55)' }}>
          <span style={{ letterSpacing: '0.22em' }}>www.daracheon.com</span>
          <span style={{ letterSpacing: '0.22em' }}>EST · 2003</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
