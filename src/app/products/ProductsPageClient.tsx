'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import type { Product } from '@/data/products';
import storyStyles from '@/styles/zoel/story-page.module.css';
import StickyTabBar from '@/components/layout/StickyTabBar';
import { useHashTab, setTabHash } from '@/lib/use-hash-tab';
import ProductsClient from './ProductsClient';
import pageStyles from './page.module.css';

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
            alt="대라천 '참'침향 제품 소개 대표 이미지"
            fill
            sizes="100vw"
            priority
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
            <div className={pageStyles.heroCol}>
              {/* H1 은 검색어('침향 제품')가 든 고정 문구(페이지 og:title 과 같은 표현).
                  어드민에 저장된 첫 화면 문구는 그대로 두고 단락으로 내려 같은 모양으로 보여 준다. */}
              <h1 className={pageStyles.heroH1}>대라천 침향 제품 라인업</h1>
              <p className={pageStyles.heroTitle}>
                {hero.titleLine1}
                <br />
                {/* h1 em 에 자동으로 붙던 곡선 밑줄 — 같은 모양의 기존 클래스(curves.css) */}
                <em className="orn-underline orn-underline--double">{hero.titleEmphasis}</em>
              </p>
            </div>
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
