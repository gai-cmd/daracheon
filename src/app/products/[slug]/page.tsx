import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readData } from '@/lib/db';
import type { Product } from '@/data/products';
import VariantSelector from './VariantSelector';
import ImageGallery from './ImageGallery';

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

  return (
    <main className="bg-[#fdfbf7] pb-28 pt-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Breadcrumb */}
        <nav className="mb-10 text-[0.7rem] tracking-[0.2em] uppercase text-neutral-500">
          <Link href="/" className="hover:text-gold-500">홈</Link>
          <span className="mx-2 text-neutral-300">/</span>
          <Link href="/products" className="hover:text-gold-500">제품</Link>
          <span className="mx-2 text-neutral-300">/</span>
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
            <p className="mb-2 text-[0.7rem] font-light uppercase tracking-[0.3em] text-gold-500">
              {product.categoryEn || product.category}
            </p>
            <h1 className="font-serif text-4xl font-light leading-tight text-neutral-900">
              {product.name}
            </h1>
            {product.nameEn && (
              <p className="mt-2 font-display italic text-lg text-neutral-500">
                {product.nameEn}
              </p>
            )}

            <div className="mt-6 h-px w-12 bg-gold-500" />

            <p className="mt-6 text-[0.95rem] leading-8 text-neutral-700">
              {product.description}
            </p>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mt-8 border-t border-neutral-200 pt-8">
                <p className="mb-4 text-[0.68rem] tracking-[0.25em] uppercase text-gold-500">
                  제품 특징
                </p>
                <ul className="space-y-2.5">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
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
              <div className="mt-8 border-t border-neutral-200 pt-8">
                <p className="text-sm text-neutral-500">현재 판매 준비 중입니다. 출시 시 안내드립니다.</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-block bg-gold-500 px-8 py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.25em] text-[#0a0b10] transition hover:bg-gold-600"
              >
                제품 문의
              </Link>
              <Link
                href="/home-shopping"
                className="inline-block border border-neutral-900 px-8 py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.25em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
              >
                홈쇼핑 방송 확인
              </Link>
            </div>
          </div>
        </div>

        {/* Specs */}
        {specEntries.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-serif text-2xl font-light text-neutral-900">제품 정보</h2>
            <div className="overflow-hidden border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {specEntries.map(([key, value]) => (
                    <tr key={key} className="border-b border-neutral-100 last:border-b-0">
                      <th className="w-48 bg-neutral-50 px-5 py-4 text-left font-serif text-xs font-normal tracking-wider text-neutral-500">
                        {key}
                      </th>
                      <td className="px-5 py-4 text-neutral-800">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-serif text-2xl font-light text-neutral-900">관련 제품</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-white">
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
                    <p className="text-[0.62rem] uppercase tracking-[0.25em] text-gold-500">
                      {p.categoryEn || p.category}
                    </p>
                    <p className="mt-1 font-serif text-base text-neutral-800 group-hover:text-gold-600">
                      {p.name}
                    </p>
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
