import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readData } from '@/lib/db';
import type { Product } from '@/data/products';
import VariantSelector from './VariantSelector';
import ImageGallery from './ImageGallery';
import ProductTabs, { type TabItem } from '@/components/product-detail/ProductTabs';
import VerificationTimeline from '@/components/product-detail/VerificationTimeline';

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await readData<Product>('products');
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const products = await readData<Product>('products');
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
  const products = await readData<Product>('products');
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);

  const specEntries = Object.entries(product.specs ?? {});

  // ProductTabs 구성: TabItem[] 형태 — content는 ReactNode 수용
  const tabs: TabItem[] = [
    {
      id: 'desc',
      label: '제품설명',
      content: (
        <div className="space-y-5 text-[0.95rem] font-light leading-[1.95] text-white/75">
          <p>{product.description}</p>
        </div>
      ),
    },
    {
      id: 'ingredients',
      label: '원료·성분',
      // TODO: 원료/성분 전용 필드 없음 — features를 임시 표시. CMS 스키마 확장 필요.
      content:
        product.features && product.features.length > 0 ? (
          <ul className="space-y-3">
            {product.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[0.95rem] font-light leading-[1.85] text-white/75"
              >
                <span className="mt-2 block h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                {f}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-light text-white/55">원료·성분 정보가 준비 중입니다.</p>
        ),
    },
    {
      id: 'intake',
      label: '섭취법',
      // TODO: 섭취법 전용 필드 없음 — CMS 확장 필요.
      content: (
        <p className="text-[0.95rem] font-light leading-[1.95] text-white/75">
          섭취법 안내는 제품에 동봉된 설명서를 참고해 주세요. 상세 가이드는 준비 중입니다.
        </p>
      ),
    },
    {
      id: 'cert',
      label: '인증·시험',
      content:
        specEntries.length > 0 ? (
          <div className="overflow-hidden border border-gold-500/20">
            <table className="w-full text-sm">
              <tbody>
                {specEntries.map(([key, value]) => (
                  <tr
                    key={key}
                    className="border-b border-gold-500/10 last:border-b-0"
                  >
                    <th className="w-48 bg-lx-ink px-5 py-4 text-left font-mono text-[0.68rem] font-normal uppercase tracking-[0.2em] text-gold-500">
                      {key}
                    </th>
                    <td className="px-5 py-4 font-light text-white/80">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm font-light text-white/55">인증·시험 정보가 준비 중입니다.</p>
        ),
    },
  ];

  return (
    <main className="bg-lx-black pb-28 pt-32 text-lx-ivory">
      <div className="mx-auto max-w-page px-7 lg:px-16">
        {/* Breadcrumb */}
        <nav className="mb-12 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/50">
          <Link href="/" className="transition-colors hover:text-gold-400">홈</Link>
          <span className="mx-2 text-white/25">/</span>
          <Link href="/products" className="transition-colors hover:text-gold-400">제품</Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-gold-500">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <ImageGallery
            primary={product.image}
            gallery={product.gallery}
            alt={product.name}
            badge={product.badge}
            outOfStock={!product.inStock}
          />

          {/* Info */}
          <div>
            <p className="mb-3 font-mono text-[0.66rem] font-light uppercase tracking-[0.3em] text-gold-500">
              {product.categoryEn || product.category}
            </p>
            <h1 className="font-serif text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory">
              {product.name}
            </h1>
            {product.nameEn && (
              <p className="mt-3 font-serif text-lg italic text-white/55">
                {product.nameEn}
              </p>
            )}

            <div className="mt-6 h-px w-12 bg-gold-500" />

            <p className="mt-6 text-[0.95rem] font-light leading-[1.95] text-white/75">
              {product.description}
            </p>

            {/* Lot grid — 3칸 */}
            <div className="mt-8 grid grid-cols-3 gap-px border border-gold-500/15 bg-gold-500/15">
              <div className="bg-lx-black p-4">
                <p className="mb-1 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-gold-500">
                  Lot
                </p>
                {/* TODO: Lot 번호 필드 없음 — CMS 추가 필요 */}
                <p className="font-mono text-xs text-lx-ivory">—</p>
              </div>
              <div className="bg-lx-black p-4">
                <p className="mb-1 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-gold-500">
                  Origin
                </p>
                <p className="font-mono text-xs text-lx-ivory">VN · Ha Tinh</p>
              </div>
              <div className="bg-lx-black p-4">
                <p className="mb-1 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-gold-500">
                  Category
                </p>
                <p className="font-mono text-xs text-lx-ivory">
                  {product.categoryEn || product.category}
                </p>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mt-8 border-t border-gold-500/15 pt-8">
                <p className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.25em] text-gold-500">
                  제품 특징
                </p>
                <ul className="space-y-2.5">
                  {product.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm font-light text-white/75"
                    >
                      <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variant selector or base price */}
            {product.inStock ? (
              <VariantSelector
                variants={product.variants ?? []}
                basePrice={product.price}
                basePriceDisplay={product.priceDisplay}
              />
            ) : (
              <div className="mt-8 border-t border-gold-500/15 pt-8">
                <p className="text-sm font-light text-white/55">
                  현재 판매 준비 중입니다. 출시 시 안내드립니다.
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-block bg-gold-500 px-8 py-3.5 text-center font-mono text-[0.7rem] font-medium uppercase tracking-[0.25em] text-lx-black transition hover:bg-gold-400"
              >
                제품 문의
              </Link>
              <Link
                href="/home-shopping"
                className="inline-block border border-gold-500/40 px-8 py-3.5 text-center font-mono text-[0.7rem] font-medium uppercase tracking-[0.25em] text-lx-ivory transition hover:border-gold-500 hover:bg-gold-500/10 hover:text-gold-400"
              >
                홈쇼핑 방송 확인
              </Link>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <section className="mt-24">
          <ProductTabs tabs={tabs} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="mb-8 font-serif text-2xl font-light tracking-kr-tight text-lx-ivory">
              관련 제품
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-lx-ink">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-gold-500">
                      {p.categoryEn || p.category}
                    </p>
                    <p className="mt-1 font-serif text-base font-light text-lx-ivory transition-colors group-hover:text-gold-400">
                      {p.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Verification Timeline */}
      {/* TODO: Lot 검증 이력 데이터 없음 — CMS 추가 필요 */}
      <div className="mt-24">
        <VerificationTimeline />
      </div>
    </main>
  );
}
