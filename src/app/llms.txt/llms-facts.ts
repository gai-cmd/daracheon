// llms.txt · llms-full.txt 가 함께 쓰는 사실 값 계산 — 제품 가격·재고 표기, robots.txt 크롤러 문장.
// 두 파일이 제품 페이지·robots.txt 와 다른 값을 말하지 않도록 같은 출처에서 계산한다.

import type { MetadataRoute } from 'next';
import type { Product } from '@/data/products';
import { canonicalProductSlug } from '@/lib/product-slugs';
import { productOfferPrice } from '@/lib/seo/product-meta';
import { formatPrice, parseDisplayPrice } from '@/lib/utils';

type PricedProduct = Pick<Product, 'price' | 'priceDisplay' | 'inStock'>;

/**
 * 제품 페이지와 같은 순서로 정한 가격 글자 — 숫자 price 우선, 0 이면 priceDisplay 에서 복원.
 * 표시 문자열이 같은 금액을 가리키면 그 문자열('890,000원~' 의 '~' 등)을 그대로 쓰고,
 * 숫자와 어긋나면(옛 표시값이 남은 경우) 숫자 쪽을 쓴다. 가격을 특정할 수 없으면 null.
 */
export function llmsProductPrice(p: PricedProduct): string | null {
  const offer = productOfferPrice(p as Product);
  if (offer === null) return null;
  const display = p.priceDisplay?.trim();
  return display && parseDisplayPrice(display) === offer ? display : formatPrice(offer);
}

/** 가격·재고 표기 — 예: '250,000원 · 품절'. 재고 상태는 제품 페이지와 같은 inStock 값. */
export function llmsProductPriceAndStock(p: PricedProduct): string {
  const stock = p.inStock ? '판매 중' : '품절';
  const price = llmsProductPrice(p);
  return price ? `${price} · ${stock}` : stock;
}

/** 제품 상세 경로 — sitemap 과 같은 정식 slug. */
export function llmsProductPath(p: Pick<Product, 'slug'>): string {
  return `/products/${canonicalProductSlug(p.slug)}`;
}

/**
 * robots.txt 규칙에서 크롤러별 허용·차단 목록을 뽑아 한 줄로 적는다.
 * 손으로 적은 목록은 robots.txt 가 바뀔 때 어긋나므로(GPTBot·Google-Extended·CCBot 은 차단인데
 * 허용이라고 적혀 있었다) 실제 규칙에서 만든다. 평가어 없이 목록만 적는다.
 */
export function robotsCrawlerLine(robots: MetadataRoute.Robots): string {
  const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
  const agents = (ua: string | string[] | undefined) => (Array.isArray(ua) ? ua : ua ? [ua] : []);
  const allowed: string[] = [];
  const blocked: string[] = [];
  for (const r of rules) {
    for (const ua of agents(r.userAgent)) {
      if (ua === '*') continue;
      if (r.disallow === '/') blocked.push(ua);
      else if (r.allow === '/') allowed.push(ua);
    }
  }
  const parts: string[] = [];
  if (allowed.length) parts.push(`명시 허용(Allow) — ${allowed.join(' · ')}`);
  if (blocked.length) parts.push(`차단(Disallow) — ${blocked.join(' · ')}`);
  return `- robots.txt: ${parts.join(' / ')}.`;
}
