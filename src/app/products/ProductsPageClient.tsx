'use client';

import { useState } from 'react';
import type { Product } from '@/data/products';
import storyStyles from '@/styles/zoel/story-page.module.css';
import ProductsClient from './ProductsClient';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

interface ProductsHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
  heroImage?: string;
}

interface Props {
  products: Product[];
  productCategories: ProductCategory[];
  hero: ProductsHero;
}

export default function ProductsPageClient({ products, productCategories, hero }: Props) {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <>
      {/* HERO — 침향이야기와 동일한 구성 */}
      <section
        className={`${storyStyles.hero} orn-grain orn-grain--faint`}
        style={hero.heroImage ? {
          backgroundImage: `radial-gradient(1200px 600px at 20% 30%, rgba(212,168,67,.10), transparent 60%), linear-gradient(180deg, rgba(10,11,16,.72) 0%, rgba(20,22,31,.78) 100%), url("${hero.heroImage}")`,
          backgroundSize: 'auto, auto, cover',
          backgroundPosition: '20% 30%, 0 0, center',
        } : undefined}
      >
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={storyStyles.wrap}>
          <div className={storyStyles.kicker}>{hero.kicker}</div>
          <div className={storyStyles.heroMain}>
            <h1>
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
            </h1>
            <p className={storyStyles.lede}>{hero.lede}</p>
          </div>
          {/* 카테고리 탭 — hero 내부 (침향이야기 탭과 동일 스타일) */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 48 }}>
            {productCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-current={activeCategory === cat.id ? 'page' : undefined}
                style={{
                  padding: '10px 20px',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: `1px solid ${activeCategory === cat.id ? 'var(--accent)' : 'rgba(212,168,67,0.25)'}`,
                  background: activeCategory === cat.id ? 'var(--accent)' : 'transparent',
                  color: activeCategory === cat.id ? 'var(--lx-black)' : 'rgba(255,255,255,0.7)',
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  transition: 'all 300ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 제품 그리드 — 선택된 카테고리 전달 */}
      <ProductsClient
        products={products}
        productCategories={productCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </>
  );
}
