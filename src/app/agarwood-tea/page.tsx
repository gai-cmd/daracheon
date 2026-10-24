import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import TopicHub from '@/components/seo/TopicHub';
import { AGARWOOD_TEA } from '@/content/topics/agarwood-tea';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';
import { canonicalProductSlug } from '@/lib/product-slugs';

// '침향차' 검색어 허브. 제품 공개/비공개 토글이 바로 반영되도록 동적 렌더.
export const dynamic = 'force-dynamic';

// 요청된 제목에 이미 브랜드가 들어 있어 레이아웃 템플릿을 건너뛴다(absolute).
const TITLE = "침향차 우리는 법·고르는 법 | 대라천 '참'침향";
// og:title 은 템플릿이 적용되지 않는다 — 40자 이내(네이버 가이드).
const OG_TITLE = '침향차 우리는 법·고르는 법';
const DESCRIPTION =
  '침향 파라미냐차·침향차·수 세트·침향스틱의 물 양과 3탕까지 우리는 법, 중량·구성·소비기한 비교, 보관법과 주의사항.';

// 차로도 우려 마시는 원목 제품 — '차' 분류는 아니지만 이 허브에 함께 보여 준다.
const EXTRA_SLUGS = ['agarwood-stick-100g'];

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ['침향차', '침향 차', '침향차 우리는 법', '침향차 마시는 법', '침향 파라미냐차', '침향차 세트', '침향스틱 차', '沈香茶'],
  alternates: { canonical: `${SITE_URL}${AGARWOOD_TEA.path}` },
  openGraph: pageOpenGraph({
    path: AGARWOOD_TEA.path,
    title: OG_TITLE,
    description: DESCRIPTION,
    image: AGARWOOD_TEA.heroImage?.src,
  }),
};

export default async function AgarwoodTeaPage() {
  const products = await readDataSafe<Product>('products');
  const teas = products
    .filter(
      (p) =>
        p.published !== false &&
        p.slug &&
        (p.category === '차' || EXTRA_SLUGS.includes(canonicalProductSlug(p.slug))),
    )
    .map((p) => ({
      slug: canonicalProductSlug(p.slug),
      name: p.name,
      image: p.image,
      shortDescription: p.shortDescription,
      category: p.categoryEn ?? p.category,
    }));
  return <TopicHub content={AGARWOOD_TEA} products={teas} />;
}
