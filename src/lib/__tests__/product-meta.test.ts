import { describe, expect, it } from 'vitest';
import type { Product } from '@/data/products';
import seed from '../../../data/db/products.json';
import {
  buildProductOffers,
  pickRelatedProducts,
  productSeoDescription,
  productSeoTitle,
} from '../seo/product-meta';

const products = seed as unknown as Product[];
const bySlug = (s: string) => products.find((p) => p.slug === s)!;
const ctx = { url: 'https://zoellife.com/products/x', sellerId: 'https://zoellife.com/#organization' };

describe('productSeoTitle', () => {
  it('seoTitle 이 있으면 쓰고, 브랜드가 없으면 브랜드를 붙인다', () => {
    expect(productSeoTitle({ ...bySlug('agarwood-gibodan'), seoTitle: '맞춤 제목' }, '침향환')).toBe(
      "맞춤 제목 | 대라천 '참'침향",
    );
    expect(
      productSeoTitle({ ...bySlug('agarwood-gibodan'), seoTitle: '맞춤 제목 | 대라천' }, '침향환'),
    ).toBe('맞춤 제목 | 대라천');
  });

  it("'침향환' 라벨 카테고리는 제목에 침향환을 붙인다", () => {
    expect(productSeoTitle(bySlug('agarwood-chimhyangdan'), '침향환')).toBe(
      "침향단 (沈香丹) — 침향환 | 대라천 '참'침향",
    );
  });

  it('沈香茶 를 쓰는 차 제품은 침향차를 붙이고, 이름에 이미 있으면 붙이지 않는다', () => {
    expect(productSeoTitle(bySlug('agarwood-paramignya-tea'), '침향차')).toBe(
      "침향 파라미냐차 (沈香茶) — 침향차 | 대라천 '참'침향",
    );
    expect(productSeoTitle(bySlug('agarwood-tea-water-set'), '침향차')).toBe(
      "침향차·수 세트 (沈香茶·水) | 대라천 '참'침향",
    );
  });

  it("제품명에 '대라천' 이 있으면 브랜드 접미사를 붙이지 않는다", () => {
    expect(productSeoTitle(bySlug('daeracheon-cham-agarwood-oil-capsule'), '침향오일')).toBe(
      '대라천 참침향 오일 캡슐',
    );
  });

  it("'침향오일' 라벨 카테고리는 이름에 침향 오일이 없을 때만 붙인다", () => {
    expect(productSeoTitle(bySlug('agarwood-essential-oil-1ml'), '침향오일')).toBe(
      "대라천 '참'침향 에센셜 오일 — 침향 오일",
    );
    expect(
      productSeoTitle({ ...bySlug('agarwood-gibodan'), name: '침향오일 블렌드' }, '침향오일'),
    ).toBe("침향오일 블렌드 | 대라천 '참'침향");
  });

  it('그 외 제품은 기존 제목 그대로', () => {
    expect(productSeoTitle(bySlug('agarwood-water-500ml'), '침향수')).toBe("침향수 (沈香水) | 대라천 '참'침향");
  });

  it('모든 시드 제품 제목이 60자 이하', () => {
    for (const p of products) {
      expect(productSeoTitle(p, '침향환').length).toBeLessThanOrEqual(60);
      expect(productSeoTitle(p, '침향오일').length).toBeLessThanOrEqual(60);
    }
  });
});

describe('productSeoDescription', () => {
  it('seoDescription 이 있으면 그대로 쓴다', () => {
    expect(productSeoDescription({ ...bySlug('agarwood-gibodan'), seoDescription: '맞춤 설명' })).toBe('맞춤 설명');
  });

  it('짧은 설명은 구조화 필드로 조합하고 120자를 넘지 않는다', () => {
    for (const p of products) {
      const d = productSeoDescription(p, '라벨')!;
      expect(d.length).toBeLessThanOrEqual(120);
      expect(d).toContain(p.name);
      expect(d).toContain(p.shortDescription);
    }
    const tea = productSeoDescription(bySlug('agarwood-paramignya-tea'), '침향차')!;
    expect(tea).toContain('용량 1포 2.5g × 30포 (1박스 75g).');
  });

  it('60자 이상인 기존 설명은 그대로 둔다', () => {
    const long = 'ㄱ'.repeat(70);
    expect(productSeoDescription({ ...bySlug('agarwood-gibodan'), shortDescription: long })).toBe(long);
  });
});

describe('buildProductOffers', () => {
  it('priceValidUntil 을 내보내지 않는다', () => {
    const p = { ...bySlug('agarwood-water-500ml'), price: 50000, inStock: true };
    expect(buildProductOffers(p, ctx)).not.toHaveProperty('priceValidUntil');
  });

  it('판매 중이고 옵션 가격이 다르면 옵션별 Offer 배열', () => {
    const offers = buildProductOffers(bySlug('daeracheon-cham-agarwood-oil-capsule'), ctx) as Record<string, unknown>[];
    expect(Array.isArray(offers)).toBe(true);
    expect(offers.map((o) => o.price)).toEqual([300000, 580000]);
  });

  it('가격을 특정할 수 없으면 undefined', () => {
    expect(buildProductOffers({ ...bySlug('agarwood-gibodan'), price: 0, priceDisplay: '가격 문의', variants: [] }, ctx)).toBeUndefined();
  });
});

describe('pickRelatedProducts', () => {
  it('같은 카테고리 먼저, 나머지로 채워 3개', () => {
    const cur = bySlug('agarwood-chimhyangdan');
    const rel = pickRelatedProducts(products, cur);
    expect(rel).toHaveLength(3);
    expect(rel[0].slug).toBe('agarwood-gibodan');
    expect(rel.some((p) => p.id === cur.id)).toBe(false);
  });
});
