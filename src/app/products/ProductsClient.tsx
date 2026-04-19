'use client';

import { useMemo, useState } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/data/products';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

interface ProductsClientProps {
  products: Product[];
  productCategories: ProductCategory[];
}

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'new';

export default function ProductsClient({ products, productCategories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  // TODO: 콘텐츠 확인 필요 — Product 타입에 sort 기준(등록일) 없음, CMS 확인
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  const filtered = useMemo(() => {
    const base =
      activeCategory === 'all'
        ? products
        : products.filter((p) => p.category === activeCategory);

    const copy = [...base];
    if (sortMode === 'price-asc') {
      copy.sort((a, b) => a.price - b.price);
    } else if (sortMode === 'price-desc') {
      copy.sort((a, b) => b.price - a.price);
    }
    // 'featured' / 'new' keep original order (no createdAt field on Product)
    return copy;
  }, [activeCategory, products, sortMode]);

  return (
    <>
      {/* §2. Filter bar — sticky, dark */}
      <section className="sticky top-nav z-40 bg-lx-black/90 backdrop-blur-xl border-b border-gold-500/15">
        <div className="max-w-page mx-auto px-7 lg:px-16 py-7 flex flex-wrap gap-5 items-center justify-between">
          {/* Category toggle group */}
          <div
            role="tablist"
            aria-label="제품 카테고리"
            className="flex flex-wrap border border-gold-500/25"
          >
            {productCategories.map((cat, idx) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-[11px] font-mono text-[0.64rem] tracking-en-nav uppercase transition-all duration-300 ${
                    idx < productCategories.length - 1
                      ? 'border-r border-gold-500/15'
                      : ''
                  } ${
                    active
                      ? 'bg-gold-500 text-lx-black font-medium'
                      : 'bg-transparent text-white/65 hover:text-gold-400 hover:bg-gold-500/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Count + sort */}
          <div className="flex gap-3.5 items-center font-mono text-[0.64rem] tracking-en-nav uppercase text-white/50">
            <span>
              총 <b className="text-gold-500 font-medium">{filtered.length}</b>개 제품
            </span>
            <select
              aria-label="정렬"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent border border-gold-500/25 text-lx-ivory px-3.5 py-[11px] font-mono text-[0.64rem] tracking-en-nav uppercase outline-none focus:border-gold-500 transition-colors"
            >
              <option value="featured" className="bg-lx-black">Featured</option>
              <option value="new" className="bg-lx-black">신상품순</option>
              <option value="price-asc" className="bg-lx-black">낮은가격순</option>
              <option value="price-desc" className="bg-lx-black">높은가격순</option>
            </select>
          </div>
        </div>
      </section>

      {/* §3. Product grid */}
      <section className="bg-lx-black text-lx-ivory pt-[60px] pb-[100px]">
        <div className="max-w-page mx-auto px-7 lg:px-16">
          {filtered.length === 0 ? (
            <div className="py-20 px-5 text-center border border-dashed border-gold-500/25 text-white/50">
              해당 카테고리의 제품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] md:gap-10 lg:gap-12">
              {filtered.map((product, i) => (
                <RevealOnScroll key={product.id} delay={(i % 3) * 100}>
                  <ProductCard product={product} />
                </RevealOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
