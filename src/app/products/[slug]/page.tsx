import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import JsonLd from '@/components/ui/JsonLd';
import VariantSelector from './VariantSelector';
import ImageGallery from './ImageGallery';
import styles from './page.module.css';

interface ReviewRecord {
  productSlug?: string;
  productId?: string;
  rating?: number;
  title?: string;
  body?: string;
  author?: string;
  createdAt?: string;
  verified?: boolean;
  approved?: boolean;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const products = await readDataSafe<Product>('products');
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const products = await readDataSafe<Product>('products');
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: '제품 상세 | ZOEL LIFE' };
  return {
    title: `${product.name} | ZOEL LIFE 대라천 '참'침향`,
    description: product.shortDescription || product.description?.slice(0, 160),
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [products, reviews] = await Promise.all([
    readDataSafe<Product>('products'),
    readDataSafe<ReviewRecord>('reviews'),
  ]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);

  const specEntries = Object.entries(product.specs ?? {});

  // Product JSON-LD (Google 제품 리치 결과 + AI Overview 엔티티 매칭)
  // AggregateRating / Review 는 reviews.json 에서 동일 제품 slug·id 로 필터.
  const productReviews = reviews.filter(
    (r) =>
      (r.productSlug === product.slug || r.productId === product.id) &&
      typeof r.rating === 'number' &&
      r.rating > 0 &&
      r.approved !== false,
  );
  const ratingCount = productReviews.length;
  const ratingAvg =
    ratingCount > 0
      ? productReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingCount
      : 0;

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.nameEn ? { alternateName: product.nameEn } : {}),
    description: product.description,
    sku: product.id,
    image: product.gallery?.length ? product.gallery : (product.image ? [product.image] : undefined),
    brand: { '@type': 'Brand', name: '대라천 ZOEL LIFE' },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'KRW',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://www.daracheon.com/products/${product.slug}`,
    },
  };
  if (ratingCount > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(ratingAvg * 10) / 10,
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
    productJsonLd.review = productReviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      ...(r.author ? { author: { '@type': 'Person', name: r.author } } : {}),
      ...(r.title ? { name: r.title } : {}),
      ...(r.body ? { reviewBody: r.body } : {}),
      ...(r.createdAt ? { datePublished: r.createdAt.slice(0, 10) } : {}),
    }));
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.daracheon.com' },
      { '@type': 'ListItem', position: 2, name: '제품 소개', item: 'https://www.daracheon.com/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://www.daracheon.com/products/${product.slug}` },
    ],
  };

  return (
    <main className={styles.page}>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className={styles.wrap}>
        {/* Crumb */}
        <nav className={styles.crumb}>
          <Link href="/">Home</Link>
          <span className={styles.crumbSep}>/</span>
          <Link href="/products">Products</Link>
          <span className={styles.crumbSep}>/</span>
          <b>{product.name}</b>
        </nav>

        {/* Above the fold */}
        <div className={styles.main}>
          <div className={styles.galleryWrap}>
            <ImageGallery
              primary={product.image}
              gallery={product.gallery}
              alt={product.name}
              badge={product.badge}
              outOfStock={!product.inStock}
            />
          </div>

          <div>
            <div className={styles.cat}>{product.categoryEn || product.category}</div>
            <h1 className={styles.title}>{product.name}</h1>
            {product.nameEn && <p className={styles.titleSub}>{product.nameEn}</p>}
            <div className={styles.divider} />
            <p className={styles.desc}>{product.description}</p>

            {product.features && product.features.length > 0 && (
              <>
                <div className={styles.featuresHead}>제품 특징</div>
                <ul className={styles.features}>
                  {product.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </>
            )}

            {product.inStock ? (
              <VariantSelector
                variants={product.variants ?? []}
                basePrice={product.price}
                basePriceDisplay={product.priceDisplay}
              />
            ) : (
              <div className={styles.notice}>현재 판매 준비 중입니다. 출시 시 안내드립니다.</div>
            )}

            <div className={styles.ctas}>
              <Link href="/support" className={styles.btnGold}>
                제품 문의 →
              </Link>
              <Link href="/home-shopping" className={styles.btnOutline}>
                홈쇼핑 방송 확인
              </Link>
            </div>
          </div>
        </div>

        {/* Specs */}
        {specEntries.length > 0 && (
          <section className={styles.specs}>
            <div className={styles.specsHead}>Specs · 제품 정보</div>
            <h2>
              제품 <em>정보</em>
            </h2>
            <div className={styles.specsGrid}>
              {specEntries.map(([key, value]) => (
                <div key={key} className={styles.specRow}>
                  <div className={styles.specKey}>{key}</div>
                  <div className={styles.specVal}>{String(value)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2>
              관련 <em>제품</em>
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className={styles.relatedCard}>
                  <div className={styles.relatedImg}>
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className={styles.relatedBody}>
                    <div className={styles.relatedCat}>{p.categoryEn || p.category}</div>
                    <div className={styles.relatedTitle}>{p.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
