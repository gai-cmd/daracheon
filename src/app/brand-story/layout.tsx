import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '브랜드 스토리 - 25년의 집념, 자연의 진실된 가치 | ZOEL LIFE',
  description:
    '대라천 참침향의 브랜드 스토리. 1998년부터 시작된 25년의 여정, 베트남 5개 성(하띤·동나이·냐짱·푸국·람동) 하띤성 200ha 부지 400만 그루 규모 농장, 국제 인증, 생산 공정을 소개합니다.',
  alternates: { canonical: 'https://www.daracheon.com/brand-story' },
};

export default function BrandStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
