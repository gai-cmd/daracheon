import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '침향 제품 - 프리미엄 침향 연질캡슐 침향오일 | ZOEL LIFE',
  description:
    '대라천 프리미엄 침향 제품: 연질캡슐, 침향오일, 침향수, 침향환, 침향 비누, 침향 스틱, 선물세트. CITES, HACCP, Organic 인증 제품을 만나보세요.',
  alternates: { canonical: 'https://www.daracheon.com/products' },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
