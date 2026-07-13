import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { readDataSafe, readDataUncached } from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import type { Product } from '@/data/products';
import { getGuide } from '@/data/productGuides';
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
  // 비공개 제품은 sitemap/정적 빌드 대상에서 제외.
  return products.filter((p) => p.published !== false).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const products = await readDataSafe<Product>('products');
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: '제품 상세 | ZOEL LIFE' };
  const url = `https://zoellife.com/products/${product.slug}`;
  const description = product.shortDescription || product.description?.slice(0, 160);
  return {
    // absolute — 루트 template 이 브랜드를 또 붙여 "…참'침향 | 조엘라이프 대라천 '참'침향"
    // 으로 이중화되던 것을 차단(브랜드 1회).
    title: { absolute: `${product.name} | 대라천 '참'침향` },
    description,
    // self-canonical — 없으면 상위 products/layout·루트 canonical 을 상속해
    // 모든 제품 상세가 목록/홈으로 정규화되어 색인에서 탈락한다.
    alternates: { canonical: url },
    // 루트 openGraph 는 deep-merge 되지 않고 통째로 대체되므로 url/type/siteName/locale 을 명시.
    openGraph: {
      type: 'website',
      url,
      siteName: '대라천 ZOEL LIFE',
      locale: 'ko_KR',
      title: `${product.name} | 대라천 '참'침향`,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // products 는 uncached — 어드민 토글이 즉시 반영되도록.
  const [products, reviews] = await Promise.all([
    readDataUncached<Product>('products'),
    readDataSafe<ReviewRecord>('reviews'),
  ]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  // 비공개 제품은 관리자 세션이 있을 때만 접근 허용.
  if (product.published === false) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) notFound();
  }

  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category && p.published !== false)
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

  // Google 의 Merchant listings 가이드라인을 충족하도록 hasMerchantReturnPolicy /
  // shippingDetails 는 의도적으로 생략(직판 정책이 페이지마다 다르므로 잘못된
  // 신호가 되지 않도록). priceValidUntil 은 기본 1년 후로 설정.
  const priceValidUntil = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  // 가격 미정(0원·'가격 문의') 제품은 offers 를 생략한다. price:0 + InStock 을
  // 방출하면 화면의 "가격 문의"와 불일치해 Google 리치결과 거부·수동조치 대상이 된다.
  const hasPrice = typeof product.price === 'number' && product.price > 0;
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://zoellife.com/products/${product.slug}#product`,
    name: product.name,
    ...(product.nameEn ? { alternateName: product.nameEn } : {}),
    description: product.description,
    sku: product.id,
    productID: product.id,
    inLanguage: 'ko-KR',
    image: product.gallery?.length ? product.gallery : (product.image ? [product.image] : undefined),
    brand: { '@id': 'https://zoellife.com/#brand' },
    manufacturer: { '@id': 'https://zoellife.com/#organization' },
    category: product.category,
    isPartOf: { '@id': 'https://zoellife.com/#website' },
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'KRW',
            priceValidUntil,
            itemCondition: 'https://schema.org/NewCondition',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: `https://zoellife.com/products/${product.slug}`,
            seller: { '@id': 'https://zoellife.com/#organization' },
          },
        }
      : {}),
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
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://zoellife.com' },
      { '@type': 'ListItem', position: 2, name: '제품 소개', item: 'https://zoellife.com/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://zoellife.com/products/${product.slug}` },
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
                baseOriginalPrice={product.originalPrice}
                baseDiscountRate={product.discountRate}
              />
            ) : (
              <div className={styles.notice}>가격 및 재고는 문의 부탁드립니다.</div>
            )}

            <div className={styles.ctas}>
              <Link href="/company#contact" className={styles.btnGold}>
                제품 문의 →
              </Link>
              {getGuide(product.slug) && (
                <Link href={`/guide#${product.slug}`} className={styles.btnOutline}>
                  📖 복용법·사용설명서
                </Link>
              )}
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
