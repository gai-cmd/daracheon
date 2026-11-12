import { canonicalProductSlug } from '@/lib/product-slugs';
import type { TopicLink } from './TopicLinks';

interface ProductLinkSource {
  slug?: string;
  name?: string;
  shortDescription?: string;
  published?: boolean;
}

/**
 * 공개 중인 제품 하나를 TopicLinks 카드로 만든다.
 * 제품이 없거나 비공개면 null — 죽은 링크를 만들지 않는다. 라벨·설명은 저장된 제품명·짧은 설명 그대로.
 */
export function productTopicLink(products: readonly ProductLinkSource[], slug: string): TopicLink | null {
  const want = canonicalProductSlug(slug);
  const p = products.find((x) => x.published !== false && !!x.slug && canonicalProductSlug(x.slug) === want);
  if (!p || !p.name?.trim()) return null;
  return { href: `/products/${want}`, label: p.name.trim(), desc: (p.shortDescription ?? '').trim() };
}

/** 공개 제품 전체의 이름 링크 — 어드민 순서 그대로, 같은 제품은 한 번만. */
export function productNameLinks(products: readonly ProductLinkSource[]): { href: string; label: string }[] {
  const seen = new Set<string>();
  const out: { href: string; label: string }[] = [];
  for (const p of products) {
    if (p.published === false || !p.slug || !p.name?.trim()) continue;
    const slug = canonicalProductSlug(p.slug);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ href: `/products/${slug}`, label: p.name.trim() });
  }
  return out;
}
