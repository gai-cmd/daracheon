import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 외부 위탁업체 전용 포털 — 검색엔진 노출 금지.
export const metadata: Metadata = {
  title: 'ZOEL LIFE 현장 업로드 포털',
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--lx-black, #0a0b10)',
        color: '#fff',
      }}
    >
      {children}
    </div>
  );
}
