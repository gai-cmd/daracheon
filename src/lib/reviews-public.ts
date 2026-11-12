import type { Review } from '@/data/reviews';

/** 원문 주소로 쓸 수 있는 값인가 — http(s) 절대 주소만. */
export function isSourceUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * 공개 /reviews 에 보여 줄 후기 — 승인(verified)됐고 원문 주소가 있는 것만, 저장 순서 그대로.
 * 원문이 없는 후기는 출처를 보여 줄 수 없어 싣지 않는다(2026-11-12 소유자 결정).
 */
export function publicReviews(reviews: Review[]): (Review & { source: string })[] {
  return reviews
    .filter((r) => r.verified === true && isSourceUrl(r.source))
    .map((r) => ({ ...r, source: (r.source as string).trim() }));
}
