import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '침향이란? 침향의 정의 효능 등급 역사 완벽 가이드 | ZOEL LIFE',
  description:
    '식약처 고시 공식 등록 침향의 정의, 효능, 문헌, 논문을 완벽 가이드합니다. Aquilaria Agallocha Roxburgh 정품 침향의 모든 것.',
  alternates: { canonical: 'https://www.daracheon.com/about-agarwood' },
  openGraph: {
    title: '침향이란? 침향의 정의 효능 등급 역사 완벽 가이드 | ZOEL LIFE',
    description: '식약처 고시 공식 등록 침향의 정의, 효능, 문헌, 논문을 완벽 가이드합니다.',
    url: 'https://www.daracheon.com/about-agarwood',
  },
};

export default function AboutAgarwoodLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
