'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import type { Product } from '@/data/products';
import storyStyles from '@/styles/zoel/story-page.module.css';
import StickyTabBar from '@/components/layout/StickyTabBar';
import { useHashTab, setTabHash } from '@/lib/use-hash-tab';
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

  const validIds = productCategories.map((c) => c.id);
  useHashTab(
    (k) => setActiveCategory(k),
    (k) => validIds.includes(k)
  );

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

      <StickyTabBar
        tabs={productCategories.map((c) => ({ key: c.id, label: c.label }))}
        activeKey={activeCategory}
        onChange={(k) => {
          setActiveCategory(k);
          setTabHash(k);
        }}
      />

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
