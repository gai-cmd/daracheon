'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  primary: string;
  gallery?: string[];
  alt: string;
  badge?: string;
  outOfStock?: boolean;
}

export default function ImageGallery({ primary, gallery, alt, badge, outOfStock }: Props) {
  const allImages = [primary, ...(gallery ?? []).filter((url) => url && url !== primary)];
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = allImages[activeIdx] ?? primary;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden bg-white">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={activeIdx === 0}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">이미지 없음</div>
        )}
        {badge && (
          <span className="absolute top-6 left-6 bg-gold-500 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[#0a0b10]">
            {badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-6 right-6 bg-[#0a0b10]/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-white">
            준비 중
          </span>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {allImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative aspect-square overflow-hidden border-2 transition ${
                idx === activeIdx ? 'border-gold-500' : 'border-neutral-200 hover:border-gold-300'
              }`}
            >
              <Image src={img} alt={`${alt} - ${idx + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
