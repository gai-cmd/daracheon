'use client';

import { useState } from 'react';
import type { ProductVariant } from '@/data/products';

interface Props {
  variants: ProductVariant[];
  basePrice: number;
  basePriceDisplay: string;
}

function formatPrice(price: number, fallback: string): string {
  if (price > 0) return `${price.toLocaleString('ko-KR')}원`;
  return fallback;
}

export default function VariantSelector({ variants, basePrice, basePriceDisplay }: Props) {
  const defaultVariant = variants.find((v) => v.inStock) ?? variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultVariant?.id);

  if (!variants || variants.length === 0) {
    return (
      <div className="mt-8 flex items-baseline gap-3 border-t border-neutral-200 pt-8">
        <span className="font-display text-3xl text-gold-500">{formatPrice(basePrice, basePriceDisplay)}</span>
      </div>
    );
  }

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const priceLabel = selected.priceDisplay ?? formatPrice(selected.price, basePriceDisplay);

  return (
    <div className="mt-8 border-t border-neutral-200 pt-8">
      <p className="mb-4 text-[0.68rem] tracking-[0.25em] uppercase text-gold-500">옵션 선택</p>
      <div className="space-y-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId;
          const isAvailable = v.inStock;
          return (
            <button
              key={v.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => setSelectedId(v.id)}
              className={`
                flex w-full items-center justify-between border px-4 py-3 text-left transition
                ${
                  isSelected
                    ? 'border-gold-500 bg-gold-500/5'
                    : 'border-neutral-200 hover:border-gold-400'
                }
                ${!isAvailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`inline-block h-4 w-4 rounded-full border ${
                    isSelected ? 'border-gold-500 bg-gold-500' : 'border-neutral-300'
                  }`}
                />
                <span className="text-sm text-neutral-800">{v.label || '옵션'}</span>
                {!isAvailable && (
                  <span className="ml-2 text-[0.65rem] tracking-wider text-neutral-400">품절</span>
                )}
              </span>
              <span className="font-display text-base text-gold-600">
                {v.priceDisplay ?? formatPrice(v.price, '문의')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <span className="text-[0.68rem] tracking-[0.2em] uppercase text-neutral-400">선택한 옵션</span>
        <span className="font-display text-3xl text-gold-500">{priceLabel}</span>
      </div>
    </div>
  );
}
