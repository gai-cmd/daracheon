'use client';

import { useState } from 'react';
import NextImage from 'next/image';
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
      <section className={`${storyStyles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero.heroImage && (
          <NextImage
            src={hero.heroImage}
            alt=""
            fill
            sizes="100vw"
            priority
            unoptimized
            aria-hidden
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
          />
        )}
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
        </div>
      </section>

      {/* STICKY TAB NAV — 침향이야기와 동일 */}
      <nav
        style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 10,
          background: 'rgba(10,11,16,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
        }}
      >
        <div className={storyStyles.wrap} style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className={storyStyles.chapterGrid}>
            <div aria-hidden />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
        </div>
      </nav>

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
