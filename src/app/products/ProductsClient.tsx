'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Product } from '@/data/products';
import styles from './page.module.css';

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

function productMinPrice(p: Product): number {
  if (p.variants && p.variants.length > 0) {
    return Math.min(...p.variants.map((v) => v.price));
  }
  return 0;
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

type SortMode = 'featured' | 'new' | 'price-asc' | 'price-desc';

export default function ProductsClient({ products, productCategories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  const filtered = useMemo(() => {
    const list = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory);
    const sorted = [...list];
    if (sortMode === 'price-asc') sorted.sort((a, b) => productMinPrice(a) - productMinPrice(b));
    else if (sortMode === 'price-desc') sorted.sort((a, b) => productMinPrice(b) - productMinPrice(a));
    // 'new' 정렬은 Product 타입에 date 필드 없어 featured와 동일 동작 (TODO: CMS에 createdAt 추가 시 활성화)
    return sorted;
  }, [activeCategory, sortMode, products]);

  return (
    <>
      {/* FILTER BAR */}
      <section className={styles.filters}>
        <div className={styles.wrap}>
          <div className={styles.filterGroup}>
            {productCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id ? styles.active : ''}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className={styles.sortGroup}>
            <span className={styles.count}>
              총 <b>{filtered.length}</b>개 제품
            </span>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="featured">Featured</option>
              <option value="new">신상품순</option>
              <option value="price-asc">낮은가격순</option>
              <option value="price-desc">높은가격순</option>
            </select>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className={styles.gridSection}>
        <div className={styles.wrap}>
          <div className={styles.prodGrid}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>해당 카테고리의 제품이 없습니다.</div>
            ) : (
              filtered.map((product) => {
                const { priceLabel } = getVariantDisplay(product);
                const badge = product.badge ?? (!product.inStock ? 'SOLD' : null);
                const badgeClass =
                  !product.inStock
                    ? styles.prodTagSold
                    : badge && badge.toLowerCase().includes('new')
                      ? styles.prodTagNew
                      : '';
                return (
                  <Link key={product.id} href={`/products/${product.slug}`} className={styles.prod}>
                    <div className={styles.prodImg}>
                      {badge && (
                        <span className={`${styles.prodTag} ${badgeClass}`}>{badge}</span>
                      )}
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={600}
                        height={750}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.prodBody}>
                      <div className={styles.prodCat}>{product.categoryEn}</div>
                      <h3 className={styles.prodTitle}>{product.name}</h3>
                      <p className={styles.prodSub}>{product.shortDescription}</p>
                      <div className={styles.prodMeta}>
                        {product.inStock ? (
                          <div className={styles.prodPrice}>{priceLabel}</div>
                        ) : (
                          <div className={styles.prodPrice} style={{ color: 'rgba(255,255,255,0.4)' }}>
                            준비 중
                          </div>
                        )}
                        <div className={styles.prodArrow}>{product.inStock ? '자세히 →' : '알림 →'}</div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
}
