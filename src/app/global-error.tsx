'use client';

import { useEffect } from 'react';

// 루트 에러 바운더리 — 루트 레이아웃 자체가 렌더에 실패한 최악의 경우까지 잡는다.
// 이 컴포넌트는 레이아웃을 대체하므로 자체 <html>/<body> 를 렌더하고, 외부 CSS 에
// 의존하지 않도록 스타일을 전부 인라인으로 둔다(전역 스타일이 로드 안 될 수 있음).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error?.digest ?? '', error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#0a0b10',
            color: '#fdfbf7',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', lineHeight: 1, color: 'rgba(212,168,67,0.35)', marginBottom: 16 }}>
              !
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 600, margin: '0 0 12px' }}>
              일시적인 문제가 발생했습니다
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'rgba(253,251,247,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
              사이트를 표시하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '11px 24px',
                background: '#d4a843',
                color: '#1a1a17',
                border: 0,
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            {error?.digest && (
              <p style={{ marginTop: 24, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(253,251,247,0.25)' }}>
                오류 코드: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
