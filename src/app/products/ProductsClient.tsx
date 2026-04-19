'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { Product } from '@/data/products';

function getVariantDisplay(product: Product): { badge: string | null; priceLabel: string } {
  const variants = product.variants;
  if (!variants || variants.length === 0) {
    return { badge: null, priceLabel: product.priceDisplay };
  }
  const inStockVariants = variants.filter((v) => v.inStock);
  const source = inStockVariants.length > 0 ? inStockVariants : variants;
  const minPrice = Math.min(...source.map((v) => v.price));
  const badge = `${variants.length}가지 옵션`;
  const priceLabel = minPrice > 0 ? `${minPrice.toLocaleString()}원~` : product.priceDisplay;
  return { badge, priceLabel };
}

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

interface ProductsClientProps {
  products: Product[];
  productCategories: ProductCategory[];
}

export default function ProductsClient({ products, productCategories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Category Filter */}
      <section className="py-4 px-6 bg-[#fdfbf7] border-b border-neutral-200 sticky top-[60px] z-50">
        <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto pb-2">
          {productCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex-shrink-0 px-5 py-2.5 text-xs tracking-[0.15em] uppercase border transition-colors
                ${
                  activeCategory === cat.id
                    ? 'border-gold-500 text-gold-500 bg-gold-500/5'
                    : 'border-neutral-300 text-neutral-600 hover:border-gold-500 hover:text-gold-500'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((product, i) => {
              const { badge: variantBadge, priceLabel } = getVariantDisplay(product);
              return (
                <RevealOnScroll key={product.id} delay={(i % 3) * 100}>
                  <Link href={`/products/${product.slug}`} className="group block">
                    <article className="bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
                      {/* Image */}
                      <div className="relative h-[300px] overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        {/* Badge */}
                        <span className="absolute top-4 left-4 px-3 py-1 bg-gold-500 text-[#0a0b10] text-[0.6rem] tracking-[0.2em] uppercase font-medium">
                          {product.badge}
                        </span>

                        {/* Variant count badge */}
                        {variantBadge && (
                          <span className="absolute bottom-4 left-4 px-2.5 py-1 bg-[#0a0b10]/70 text-white text-[0.6rem] tracking-[0.12em] rounded">
                            {variantBadge}
                          </span>
                        )}

                        {/* Availability Badge */}
                        {!product.inStock && (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-neutral-800/80 text-white text-[0.6rem] tracking-[0.15em] uppercase">
                            준비 중
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-6">
                        <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold-500 mb-1">
                          {product.categoryEn}
                        </p>
                        <h2 className="font-serif text-xl font-normal tracking-wide mb-2">
                          {product.name}
                        </h2>
                        <p className="text-sm text-neutral-500 leading-7 mb-4 line-clamp-2">
                          {product.shortDescription}
                        </p>

                        {/* Price or status */}
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                          {product.inStock ? (
                            <span className="font-display text-lg text-gold-500">
                              {priceLabel}
                            </span>
                          ) : (
                            <span className="text-sm text-neutral-400 tracking-wider">
                              준비 중
                            </span>
                          )}
                          <span className="text-xs text-gold-500 tracking-[0.15em] uppercase group-hover:underline">
                            {product.inStock ? '자세히 보기' : '알림 신청'}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-400 text-sm">
                해당 카테고리의 제품이 없습니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
