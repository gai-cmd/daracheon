/**
 * 제품 상세(/products/[slug]) 메타데이터·구조화 데이터·관련 제품 계산.
 *
 * 원칙: 화면에 보이는 글(제품명·설명·카테고리 라벨·스펙)이 정본이다. 여기서는 이미 데이터에
 * 있는 값만 조합하고, 새 문구(효능·인증·날짜)를 지어내지 않는다.
 */
import type { Product } from '@/data/products';
import { parseDisplayPrice } from '@/lib/utils';
import { isSameProductSlug } from '@/lib/product-slugs';

export const PRODUCT_TITLE_SUFFIX = "대라천 '참'침향";
const TITLE_MAX = 60;
const DESC_MIN = 60;
const DESC_MAX = 120;

function productText(p: Product): string {
  return [
    p.name,
    p.nameEn,
    p.shortDescription,
    p.description,
    ...(p.features ?? []),
    ...Object.values(p.specs ?? {}),
  ]
    .filter(Boolean)
    .join(' ');
}

// 제목에 덧붙일 검색어 — 코드/데이터에 이미 있는 라벨만 쓴다.
// · /products 필터가 '침향환' 으로 표기하는 카테고리
// · 데이터가 이미 '침향차' / '沈香茶' 를 쓰는 차 제품
function titleKeyword(p: Product, categoryLabel?: string): string | undefined {
  if (categoryLabel === '침향환') return '침향환';
  const isTea = p.category === '차' || p.categoryEn === 'Tea';
  if (isTea && /침향차|沈香茶/.test(productText(p))) return '침향차';
  return undefined;
}

/** 제품 상세 <title>. seoTitle 이 있으면 그대로, 없으면 "제품명 | 브랜드" (+ 검색어). */
export function productSeoTitle(p: Product, categoryLabel?: string): string {
  const custom = p.seoTitle?.trim();
  // 상세 <title> 은 absolute 로 렌더되므로 어드민 입력값에 브랜드가 없으면 여기서 붙인다.
  if (custom) return custom.includes('대라천') ? custom : `${custom} | ${PRODUCT_TITLE_SUFFIX}`;
  const base = `${p.name} | ${PRODUCT_TITLE_SUFFIX}`;
  const kw = titleKeyword(p, categoryLabel);
  if (!kw || p.name.includes(kw)) return base;
  const withKw = `${p.name} — ${kw} | ${PRODUCT_TITLE_SUFFIX}`;
  return withKw.length <= TITLE_MAX ? withKw : base;
}

function specValue(p: Product, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = p.specs?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export interface ProductDescriptionExtras {
  /** 포장 표시사항의 '제조국' (스펙에 원산지가 없을 때만 쓴다) */
  countryOfManufacture?: string;
  /** 포장 표시사항의 '내용량' (스펙에 중량이 없을 때만 쓴다) */
  netContent?: string;
}

/**
 * 제품 상세 meta description.
 * seoDescription 이 있으면 그대로. 없고 기존 설명이 60자 미만이면 구조화 필드로 조합한다.
 *
 * 템플릿 (최대 120자, 넘치는 뒤쪽 항목부터 생략):
 *   "{제품명} — 대라천 '참'침향 {카테고리 라벨}. {짧은 설명} 용량 {중량}. 원산지 {원산지}. 성분 {성분}."
 *   결과가 70자 미만이면 제품명 뒤에 " · {영문명}" 을 넣는다.
 */
export function productSeoDescription(
  p: Product,
  categoryLabel?: string,
  extras: ProductDescriptionExtras = {},
): string | undefined {
  const custom = p.seoDescription?.trim();
  if (custom) return custom;
  const base = (p.shortDescription || p.description?.slice(0, 160) || '').trim();
  if (base.length >= DESC_MIN) return base;

  const rawLabel = categoryLabel || p.category;
  // 제품명에 이미 들어 있는 브랜드·카테고리 라벨은 반복하지 않는다.
  const label =
    rawLabel && !p.name.includes(rawLabel) && !p.name.includes(rawLabel.replace(/^침향/, ''))
      ? rawLabel
      : '';
  const brand = p.name.includes('대라천') ? '' : PRODUCT_TITLE_SUFFIX;
  const brandBody = [brand, label].filter(Boolean).join(' ');
  const brandPart = brandBody ? `— ${brandBody}.` : '—';
  // 짧은 설명 끝에 마침표가 없으면 붙여 뒤 항목과 문장을 나눈다 (문구 자체는 그대로).
  const baseSentence = base && !/[.!?。]$/.test(base) ? `${base}.` : base;
  const head = `${p.name} ${brandPart}${baseSentence ? ` ${baseSentence}` : ''}`;
  if (head.length > DESC_MAX) return base || undefined;

  const capacity = specValue(p, ['중량', '내용량', '용량', '부피', '포장']) ?? extras.netContent;
  const origin = specValue(p, ['원산지']);
  const ingredient = specValue(p, ['성분', '원료', '원재료']);
  // 짧은 설명에 이미 같은 값이 있으면 반복하지 않는다.
  const fresh = (v?: string) => (v && !base.includes(v) ? v : undefined);
  const capacityText = fresh(capacity);
  const originText = fresh(origin);
  const madeIn = fresh(extras.countryOfManufacture);
  const ingredientText = fresh(ingredient);
  const optional = [
    capacityText ? `용량 ${capacityText}.` : '',
    originText ? `원산지 ${originText}.` : madeIn && !origin ? `제조국 ${madeIn}.` : '',
    ingredientText ? `성분 ${ingredientText}.` : '',
  ].filter(Boolean);

  let out = head;
  for (const seg of optional) {
    const next = `${out} ${seg}`;
    if (next.length <= DESC_MAX) out = next;
  }
  // 스펙이 비어 짧으면 영문 제품명(데이터에 있는 값)을 제품명 뒤에 덧붙인다.
  const nameEn = p.nameEn?.trim();
  if (out.length < 70 && nameEn) {
    const withEn = out.replace(`${p.name} ${brandPart}`, `${p.name} · ${nameEn} ${brandPart}`);
    if (withEn.length <= DESC_MAX) out = withEn;
  }
  return out;
}

export interface OfferContext {
  url: string;
  sellerId: string;
}

/**
 * Product JSON-LD offers.
 * · 요청 시각으로 계산한 priceValidUntil 은 넣지 않는다 (저장된 유효기한 데이터가 없음 —
 *   매 요청마다 바뀌는 날짜는 실제 가격 정책이 아니다).
 * · 판매 중이고 옵션 가격이 2가지 이상이면 옵션마다 Offer 를 낸다 (화면 VariantSelector 와 일치).
 * · 그 외에는 단일 Offer — price(숫자) 우선, 0 이면 화면의 priceDisplay 에서 복원.
 *   가격을 특정할 수 없으면 undefined (offers 생략).
 */
export function buildProductOffers(
  p: Product,
  ctx: OfferContext,
): Record<string, unknown> | Record<string, unknown>[] | undefined {
  const common = {
    '@type': 'Offer',
    priceCurrency: 'KRW',
    itemCondition: 'https://schema.org/NewCondition',
    url: ctx.url,
    seller: { '@id': ctx.sellerId },
  };
  const availability = (inStock: boolean) =>
    inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  if (p.inStock) {
    const priced = (p.variants ?? [])
      .map((v) => ({ v, price: v.price > 0 ? v.price : parseDisplayPrice(v.priceDisplay) }))
      .filter((x): x is { v: (typeof x)['v']; price: number } => x.price !== null);
    if (priced.length >= 2 && new Set(priced.map((x) => x.price)).size >= 2) {
      return priced.map(({ v, price }) => ({
        ...common,
        name: v.label,
        ...(v.sku ? { sku: v.sku } : {}),
        price,
        availability: availability(v.inStock),
      }));
    }
  }

  const price = productOfferPrice(p);
  if (price === null) return undefined;
  return { ...common, price, availability: availability(p.inStock) };
}

/** 대표 가격 — price(숫자) 우선, 0 이면 priceDisplay 에서 복원. 없으면 null. */
export function productOfferPrice(p: Product): number | null {
  return typeof p.price === 'number' && p.price > 0 ? p.price : parseDisplayPrice(p.priceDisplay);
}

/** 관련 제품 — 공개 제품 중 같은 카테고리 먼저, 모자라면 다른 카테고리로 채운다. */
export function pickRelatedProducts(all: Product[], current: Product, limit = 3): Product[] {
  const others = all.filter(
    (p) => p.published !== false && p.id !== current.id && !isSameProductSlug(p.slug, current.slug),
  );
  const same = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);
  return [...same, ...rest].slice(0, limit);
}
