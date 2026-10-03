import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import TopicHub from '@/components/seo/TopicHub';
import { VIETNAM_AGARWOOD } from '@/content/topics/vietnam-agarwood';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';

// '베트남 침향' 검색어 허브. 제품 공개/비공개 토글이 바로 반영되도록 동적 렌더.
export const dynamic = 'force-dynamic';

const TITLE = '베트남 침향 — 역사 속 산지·학명·직영 농장';
const DESCRIPTION = '고문헌이 기록한 침향의 주산지 베트남. 학명 아갈로차, 하띤·동나이 등 5개 직영 농장, 구매 시 확인할 증빙.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['베트남 침향', '베트남산 침향', '베트남 침향 농장', '하띤 침향', '베트남 침향 구별', '아갈로차 침향', 'Aquilaria Agallocha Roxburgh', '베트남 침향 가격'],
  alternates: { canonical: `${SITE_URL}${VIETNAM_AGARWOOD.path}` },
  openGraph: pageOpenGraph({
    path: VIETNAM_AGARWOOD.path,
    title: `${TITLE} | 대라천 '참'침향`,
    description: DESCRIPTION,
    image: VIETNAM_AGARWOOD.heroImage?.src,
  }),
};

export default async function VietnamAgarwoodPage() {
  const products = await readDataSafe<Product>('products');
  // 대표 제품(어드민 순서 앞쪽) — 베트남 원료 전 라인업을 대표하는 4종.
  const featured = products
    .filter((p) => p.published !== false && p.slug)
    .slice(0, 4)
    .map((p) => ({ slug: p.slug, name: p.name, image: p.image, shortDescription: p.shortDescription, category: p.categoryEn ?? p.category }));
  return <TopicHub content={VIETNAM_AGARWOOD} products={featured} />;
}
