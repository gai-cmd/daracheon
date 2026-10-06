/**
 * 제품 주소(slug) 정정 이력 — 옛 slug → 현재 정식 slug.
 *
 * 2026-10-06: 'daerachoen-…'(e·o 순서 오타) → 'daeracheon-…'. 옛 주소는 next.config.ts 에서
 * 301 로 넘기고, 운영 데이터(Blob)의 slug 가 정정되기 전·후 어느 쪽이어도 같은 제품을
 * 찾도록 비교는 항상 정식 slug 기준으로 한다.
 */
export const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  'daerachoen-cham-agarwood-oil-capsule': 'daeracheon-cham-agarwood-oil-capsule',
};

export function canonicalProductSlug(slug: string): string {
  return LEGACY_PRODUCT_SLUGS[slug] ?? slug;
}

export function isSameProductSlug(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && canonicalProductSlug(a) === canonicalProductSlug(b);
}
