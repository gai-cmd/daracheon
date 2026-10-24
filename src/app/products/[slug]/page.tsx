import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { readDataSafe, readDataUncached } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import {
  buildProductOffers,
  pickRelatedProducts,
  productOfferPrice,
  productSeoDescription,
  productSeoTitle,
} from '@/lib/seo/product-meta';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import type { Product } from '@/data/products';
import { productGuides as defaultGuides, type ProductGuide } from '@/data/productGuides';
import { SMARTSTORE_PRODUCT_URL } from '@/data/store';
import JsonLd from '@/components/ui/JsonLd';
import { imageObject } from '@/lib/seo/image';
import { canonicalProductSlug, isSameProductSlug } from '@/lib/product-slugs';
import VariantSelector from './VariantSelector';
import ImageGallery from './ImageGallery';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const products = await readDataSafe<Product>('products');
  // 비공개 제품은 sitemap/정적 빌드 대상에서 제외.
  return products.filter((p) => p.published !== false).map((p) => ({ slug: canonicalProductSlug(p.slug) }));
}

// 포장 표시사항(제품상세)에서 "라벨: 값" 한 줄의 값을 꺼낸다 (예: 제조국, 내용량).
function guideField(guide: ProductGuide | undefined, label: string): string | undefined {
  const re = new RegExp(`^${label}\\s*[:：]\\s*(.+)$`);
  return guide?.sections
    .flatMap((sec) => sec.body)
    .map((line) => re.exec(line.trim())?.[1]?.trim())
    .find(Boolean);
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const [products, categories, storedGuides] = await Promise.all([
    readDataSafe<Product>('products'),
    // /products 필터와 같은 원천 — 카테고리 id → 화면 라벨(예: 환 → 침향환).
    readDataSafe<{ id: string; label: string }>('productCategories'),
    readDataSafe<ProductGuide>('product-guides'),
  ]);
  const product = products.find((p) => isSameProductSlug(p.slug, slug));
  if (!product) return { title: '제품 상세 | ZOEL LIFE' };
  const url = `https://zoellife.com/products/${canonicalProductSlug(product.slug)}`;
  const categoryLabel = categories.find((c) => c.id === product.category)?.label;
  const guide = (storedGuides.length > 0 ? storedGuides : defaultGuides).find((g) => isSameProductSlug(g.slug, product.slug));
  const title = productSeoTitle(product, categoryLabel);
  const description = productSeoDescription(product, categoryLabel, {
    countryOfManufacture: guideField(guide, '제조국'),
    netContent: guideField(guide, '내용량'),
  });
  return {
    // absolute — 루트 template 이 브랜드를 또 붙여 "…참'침향 | 조엘라이프 대라천 '참'침향"
    // 으로 이중화되던 것을 차단(브랜드 1회).
    title: { absolute: title },
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
      title,
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
  const [products, storedGuides] = await Promise.all([
    readDataUncached<Product>('products'),
    // 제품상세(포장 표시사항) — /guide 와 같은 원천: 어드민 저장값(blob) 우선, 없으면 코드 기본값.
    readDataSafe<ProductGuide>('product-guides'),
  ]);
  const product = products.find((p) => isSameProductSlug(p.slug, slug));
  if (!product) notFound();
  // 구조화 데이터·내부 링크는 항상 정식 slug — 운영 데이터 slug 정정 전에도 옛 주소를 내보내지 않는다.
  const pageSlug = canonicalProductSlug(product.slug);

  // 비공개 제품은 관리자 세션이 있을 때만 접근 허용.
  if (product.published === false) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) notFound();
  }

  // 같은 카테고리 먼저, 모자라면 다른 제품으로 채워 항상 2~3개 내부 링크를 둔다.
  const related = pickRelatedProducts(products, product, 3);

  const specEntries = Object.entries(product.specs ?? {});

  // 포장 표시사항을 상세 본문에도 싣는다 — 종전엔 /guide 로 가는 버튼뿐이라 제품 상세 본문이
  // 450~750자로 얇았다. 표시사항 "그대로"라 효능 문구가 섞이지 않는다.
  const guide = (storedGuides.length > 0 ? storedGuides : defaultGuides).find((g) => isSameProductSlug(g.slug, product.slug));
  const countryOfOrigin = guideField(guide, '제조국');

  // 검색어 주제 페이지로 가는 내부 링크 — 제품 카테고리에 맞는 정보 랜딩을 맨 앞에.
  // (오일 → '침향 오일', 환(침향단·기보단) → '침향환·침향단', 차 → '침향차')
  const topicLinks = [
    ...(product.category === '오일'
      ? [{ href: '/agarwood-oil', label: '침향 오일 고르는 법', desc: '72시간 증류 공정과 좋은 침향 오일의 기준' }]
      : []),
    ...(product.category === '환'
      ? [{ href: '/agarwood-hwan', label: '침향환·침향단 고르는 법', desc: '라벨에서 침향 함량 읽는 법과 섭취법' }]
      : []),
    ...(product.category === '차'
      ? [{ href: '/agarwood-tea', label: '침향차 우리는 법', desc: '제품별 우리는 법과 고를 때 확인할 것' }]
      : []),
    { href: '/vietnam-agarwood', label: '베트남 침향', desc: '고문헌이 기록한 침향의 주산지와 5개 직영 농장' },
    { href: '/about-agarwood#tab-1', label: '진짜 침향 구별법', desc: '학명·산지·증빙 서류로 확인하는 법' },
    { href: '/about-agarwood', label: '침향이란?', desc: '학명·형성 과정·문헌으로 보는 침향' },
  ];

  // Product JSON-LD (Google 제품 리치 결과 + AI Overview 엔티티 매칭)
  // aggregateRating / review 는 의도적으로 출력하지 않는다 — reviews 데이터에는 네이버 블로그 등
  // 외부에서 가져온 후기가 섞여 있어, 자사 사이트가 이를 제품 리뷰로 마크업하면 Google 의
  // 자기 홍보성 리뷰 정책 위반(수동 조치 위험)이 된다.

  // Google 의 Merchant listings 가이드라인을 충족하도록 hasMerchantReturnPolicy /
  // shippingDetails 는 의도적으로 생략(직판 정책이 페이지마다 다르므로 잘못된
  // 신호가 되지 않도록). priceValidUntil 은 저장된 유효기한이 없어 생략한다
  // (종전엔 요청 시각 +1년 — 매 요청마다 바뀌는 근거 없는 날짜였다).

  // Offer 가격: price(숫자) 우선, 0 이면 화면에 이미 노출 중인 priceDisplay 에서 복원한다.
  // price:0 + InStock 을 방출하면 화면과 불일치해 Google 리치결과 거부·수동조치 대상이 되므로
  // availability 는 항상 inStock 을 따르고, 가격을 특정할 수 없으면 offers 를 생략한다.
  // (offers/review/aggregateRating 이 모두 없으면 Search Console 제품 스니펫 심각 오류.)
  // 판매 중 + 옵션 가격이 여럿이면 옵션별 Offer 배열 (buildProductOffers 참고).
  const offerPrice = productOfferPrice(product);
  const hasPrice = offerPrice !== null;
  const offers = buildProductOffers(product, {
    url: `https://zoellife.com/products/${pageSlug}`,
    sellerId: 'https://zoellife.com/#organization',
  });
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://zoellife.com/products/${pageSlug}#product`,
    name: product.name,
    ...(product.nameEn ? { alternateName: product.nameEn } : {}),
    description: product.description,
    sku: product.id,
    productID: product.id,
    inLanguage: 'ko-KR',
    // 문자열 URL 배열 대신 완전한 ImageObject 배열 — GSC 「이미지 메타데이터」가
    // 요구하는 creator/creditText/copyrightNotice/license/acquireLicensePage 포함.
    image: (product.gallery?.length ? product.gallery : product.image ? [product.image] : []).map(
      (url, i) =>
        imageObject({
          url,
          name: product.name,
          caption: i === 0 ? product.description || product.name : product.name,
        })
    ),
    brand: { '@id': 'https://zoellife.com/#brand' },
    manufacturer: { '@id': 'https://zoellife.com/#organization' },
    category: product.category,
    ...(countryOfOrigin ? { countryOfOrigin: { '@type': 'Country', name: countryOfOrigin } } : {}),
    isPartOf: { '@id': 'https://zoellife.com/#website' },
    ...(offers ? { offers } : {}),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://zoellife.com' },
      { '@type': 'ListItem', position: 2, name: '제품 소개', item: 'https://zoellife.com/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://zoellife.com/products/${pageSlug}` },
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
              // 품절 제품도 가격이 확인되면 화면에 노출한다 — Offer(price + OutOfStock) 를
              // 방출하는데 페이지에는 가격이 없으면 구조화 데이터와 화면이 불일치한다.
              <div className={styles.notice}>
                {hasPrice && (
                  <div className={styles.noticePrice}>{formatPrice(offerPrice!)}</div>
                )}
                {hasPrice ? '현재 재고가 없습니다. 재고·주문은 문의 부탁드립니다.' : '가격 및 재고는 문의 부탁드립니다.'}
              </div>
            )}

            <div className={styles.ctas}>
              {/* 구매 진입 — 스마트스토어 제품 페이지로 직행 (로그인 경유 없음).
                  (종전 "제품 문의 →" CTA 를 교체 — 문의는 푸터 문의하기가 담당.) */}
              <a
                href={SMARTSTORE_PRODUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnNaver}
              >
                네이버 스마트스토어 →
              </a>
              {guide && (
                <Link href={`/guide#${pageSlug}`} className={styles.btnOutline}>
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

        {/* 섭취·보관 안내 — 포장 표시사항(제품상세) 원문 */}
        {guide && guide.sections.length > 0 && (
          <section className={styles.guide} aria-labelledby="product-guide-title">
            <div className={styles.specsHead}>Guide · 섭취·보관 안내</div>
            <h2 id="product-guide-title">
              {product.name} <em>섭취·보관 안내</em>
            </h2>
            {guide.tagline && <p className={styles.guideTagline}>{guide.tagline}</p>}
            <div className={styles.guideGrid}>
              {guide.sections.map((sec) => (
                <div key={sec.title} className={styles.guideCard}>
                  <h3 className={styles.guideTitle}>{sec.title}</h3>
                  <ul className={styles.guideList}>
                    {sec.body.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className={styles.guideNote}>
              포장의 식품 한글표시사항을 옮긴 내용입니다. 큰 글씨로 보기:{' '}
              <Link href={`/guide#${pageSlug}`}>복용 가이드</Link>
            </p>
          </section>
        )}

        {/* 함께 읽어보세요 — 주제 허브 내부 링크 */}
        <section className={styles.topics} aria-labelledby="product-topics-title">
          <h2 id="product-topics-title">
            함께 <em>읽어보세요</em>
          </h2>
          <ul className={styles.topicGrid}>
            {topicLinks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className={styles.topicCard}>
                  <span className={styles.topicLabel}>{t.label} →</span>
                  <span className={styles.topicDesc}>{t.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2>
              관련 <em>제품</em>
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <Link key={p.id} href={`/products/${canonicalProductSlug(p.slug)}`} className={styles.relatedCard}>
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
