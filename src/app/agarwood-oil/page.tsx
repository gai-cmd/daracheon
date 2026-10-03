import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import TopicHub from '@/components/seo/TopicHub';
import { AGARWOOD_OIL } from '@/content/topics/agarwood-oil';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';

// '침향 오일' 검색어 허브. 제품 공개/비공개 토글이 바로 반영되도록 동적 렌더.
export const dynamic = 'force-dynamic';

const TITLE = '침향 오일이란? 만드는 법·고르는 법·사용법';
const DESCRIPTION = '침향 오일의 정의, 72시간 증류 12단계 공정, 좋은 침향 오일 고르는 기준과 에센셜 오일·캡슐 차이.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['침향 오일', '침향오일', '침향 에센셜 오일', '침향 오일 캡슐', '침향 오일 효능', '침향 오일 고르는 법', '침향 오일 사용법', '아갈로차 침향 오일'],
  alternates: { canonical: `${SITE_URL}${AGARWOOD_OIL.path}` },
  openGraph: pageOpenGraph({
    path: AGARWOOD_OIL.path,
    title: `${TITLE} | 대라천 '참'침향`,
    description: DESCRIPTION,
    image: AGARWOOD_OIL.heroImage?.src,
  }),
};

export default async function AgarwoodOilPage() {
  const products = await readDataSafe<Product>('products');
  const oils = products
    .filter((p) => p.published !== false && p.slug && p.category === '오일')
    .map((p) => ({ slug: p.slug, name: p.name, image: p.image, shortDescription: p.shortDescription, category: p.categoryEn ?? p.category }));
  return <TopicHub content={AGARWOOD_OIL} products={oils} />;
}
