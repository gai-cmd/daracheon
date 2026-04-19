'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/data/products';

function getVariantDisplay(product: Product): { variantCount: string | null; priceLabel: string } {
  const variants = product.variants;
  if (!variants || variants.length === 0) {
    return { variantCount: null, priceLabel: product.priceDisplay };
  }
  const inStockVariants = variants.filter((v) => v.inStock);
  const source = inStockVariants.length > 0 ? inStockVariants : variants;
  const minPrice = Math.min(...source.map((v) => v.price));
  const variantCount = `${variants.length}가지 옵션`;
  const priceLabel = minPrice > 0 ? `₩${minPrice.toLocaleString()}~` : product.priceDisplay;
  return { variantCount, priceLabel };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { variantCount, priceLabel } = getVariantDisplay(product);
  const badgeUpper = (product.badge || '').toUpperCase();
  const isNew = badgeUpper === 'NEW' || badgeUpper === 'BEST';
  const isSoldOut = !product.inStock;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col text-lx-ivory no-underline transition-transform duration-[500ms] ease-out-soft hover:-translate-y-1.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden border border-gold-500/20 bg-gradient-to-b from-lx-slate to-lx-ink">
        {/* Badge (top-left) */}
        {product.badge && (
          <span
            className={`absolute top-4 left-4 z-20 px-3 py-1.5 font-mono text-[0.58rem] tracking-en-tag uppercase backdrop-blur-md border ${
              isNew
                ? 'bg-gold-500 text-lx-black border-gold-500 font-medium'
                : 'bg-lx-black/85 text-gold-500 border-gold-500'
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Sold out badge (top-right) */}
        {isSoldOut && (
          <span className="absolute top-4 right-4 z-20 px-3 py-1.5 font-mono text-[0.58rem] tracking-en-tag uppercase bg-white/8 border border-white/30 text-white/80 backdrop-blur-md">
            준비 중
          </span>
        )}

        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw"
          className="object-cover transition-transform duration-900 ease-out-soft group-hover:scale-[1.06]"
        />

        {/* Variant count (bottom-left) */}
        {variantCount && (
          <span className="absolute bottom-4 left-4 z-20 px-2.5 py-1 bg-lx-black/75 text-white/80 font-mono text-[0.58rem] tracking-[0.18em] backdrop-blur-sm">
            {variantCount}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="pt-[22px]">
        <p className="font-mono text-[0.6rem] tracking-en-tag uppercase text-gold-500 mb-2.5">
          {product.categoryEn}
        </p>
        <h3 className="text-[1.2rem] font-normal tracking-kr-body leading-[1.3] text-white mb-1.5">
          {product.name}
        </h3>
        <p className="text-[0.85rem] text-white/55 font-light leading-[1.7] mb-[18px] line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Meta: price + arrow */}
        <div className="flex items-baseline justify-between pt-4 border-t border-gold-500/15">
          {isSoldOut ? (
            <span className="font-mono text-[0.72rem] tracking-[0.2em] uppercase text-white/40">
              준비 중
            </span>
          ) : (
            <span className="font-serif text-[1.3rem] font-normal tracking-[0.02em] text-gold-500">
              {priceLabel}
            </span>
          )}
          <span className="font-mono text-[0.62rem] tracking-en-tag uppercase text-white/50 transition-colors duration-400 group-hover:text-gold-500">
            {isSoldOut ? '알림 신청 →' : '자세히 →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
