import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import { llmsProductPath, llmsProductPrice, llmsProductPriceAndStock, robotsCrawlerLine } from './llms-facts';

describe('llmsProductPrice', () => {
  it('숫자 price 가 표시 문자열과 어긋나면 숫자 쪽을 쓴다 (제품 페이지와 같은 순서)', () => {
    expect(llmsProductPrice({ price: 250000, priceDisplay: '650,000원', inStock: false })).toBe('250,000원');
  });

  it('표시 문자열이 같은 금액이면 그 문자열을 그대로 쓴다', () => {
    expect(llmsProductPrice({ price: 890000, priceDisplay: '890,000원~', inStock: true })).toBe('890,000원~');
    expect(llmsProductPrice({ price: 300000, priceDisplay: '300,000원', inStock: true })).toBe('300,000원');
  });

  it('price 가 0 이면 표시 문자열에서 복원하고, 금액이 없으면 null', () => {
    expect(llmsProductPrice({ price: 0, priceDisplay: '180,000원', inStock: true })).toBe('180,000원');
    expect(llmsProductPrice({ price: 0, priceDisplay: '가격 문의', inStock: true })).toBeNull();
  });
});

describe('llmsProductPriceAndStock', () => {
  it('가격 뒤에 재고 상태를 붙인다', () => {
    expect(llmsProductPriceAndStock({ price: 250000, priceDisplay: '650,000원', inStock: false })).toBe(
      '250,000원 · 품절',
    );
    expect(llmsProductPriceAndStock({ price: 300000, priceDisplay: '300,000원', inStock: true })).toBe(
      '300,000원 · 판매 중',
    );
    expect(llmsProductPriceAndStock({ price: 0, priceDisplay: '준비 중', inStock: false })).toBe('품절');
  });
});

describe('llmsProductPath', () => {
  it('정식 slug 로 바꾼다', () => {
    expect(llmsProductPath({ slug: 'daerachoen-cham-agarwood-oil-capsule' })).toBe(
      '/products/daeracheon-cham-agarwood-oil-capsule',
    );
    expect(llmsProductPath({ slug: 'agarwood-gibodan' })).toBe('/products/agarwood-gibodan');
  });
});

describe('robotsCrawlerLine', () => {
  it('규칙에서 허용·차단 목록을 만든다 (와일드카드 제외)', () => {
    const line = robotsCrawlerLine({
      rules: [
        { userAgent: '*', allow: '/', disallow: ['/api/'] },
        { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/api/'] },
        { userAgent: 'Yeti', allow: '/' },
        { userAgent: 'GPTBot', disallow: '/' },
      ],
    });
    expect(line).toBe('- robots.txt: 명시 허용(Allow) — OAI-SearchBot · Yeti / 차단(Disallow) — GPTBot.');
  });

  it('실제 robots.ts 와 맞는다 — 차단 크롤러를 허용이라고 적지 않는다', () => {
    const line = robotsCrawlerLine(robots());
    const [allowPart, blockPart] = line.split(' / 차단(Disallow) — ');
    for (const ua of ['GPTBot', 'Google-Extended', 'CCBot']) {
      expect(blockPart).toContain(ua);
      expect(allowPart).not.toContain(ua);
    }
    for (const ua of ['OAI-SearchBot', 'PerplexityBot', 'Yeti']) {
      expect(allowPart).toContain(ua);
    }
  });
});
