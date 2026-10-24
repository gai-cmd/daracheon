import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import TopicHub from '@/components/seo/TopicHub';
import { AGARWOOD_HWAN } from '@/content/topics/agarwood-hwan';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';
import { canonicalProductSlug } from '@/lib/product-slugs';

// '침향환·침향단' 검색어 허브. 제품 공개/비공개 토글이 바로 반영되도록 동적 렌더.
export const dynamic = 'force-dynamic';

// 요청된 제목에 이미 브랜드가 들어 있어 레이아웃 템플릿을 건너뛴다(absolute).
const TITLE = "침향환 고르는 법 — 침향단 함량·섭취법 정리 | 대라천 '참'침향";
// og:title 은 템플릿이 적용되지 않는다 — 40자 이내(네이버 가이드).
const OG_TITLE = '침향환 고르는 법 — 침향단 함량·섭취법';
const DESCRIPTION =
  '침향환(침향단) 라벨에서 침향 함량·1단 중량 읽는 법, 원료 학명과 증빙 서류 확인, 침향단·기보단 섭취법과 주의사항.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ['침향환', '침향단', '침향 환', '침향단 함량', '침향단 먹는법', '침향환 고르는 법', '기보단', '아갈로차 침향'],
  alternates: { canonical: `${SITE_URL}${AGARWOOD_HWAN.path}` },
  openGraph: pageOpenGraph({
    path: AGARWOOD_HWAN.path,
    title: OG_TITLE,
    description: DESCRIPTION,
    image: AGARWOOD_HWAN.heroImage?.src,
  }),
};

export default async function AgarwoodHwanPage() {
  const products = await readDataSafe<Product>('products');
  const pills = products
    .filter((p) => p.published !== false && p.slug && p.category === '환')
    .map((p) => ({
      slug: canonicalProductSlug(p.slug),
      name: p.name,
      image: p.image,
      shortDescription: p.shortDescription,
      category: p.categoryEn ?? p.category,
    }));
  return <TopicHub content={AGARWOOD_HWAN} products={pills} />;
}
