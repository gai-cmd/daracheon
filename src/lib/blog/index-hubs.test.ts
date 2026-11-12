import { describe, expect, it } from 'vitest';
import { BLOG_INDEX_HUBS } from '@/lib/blog/post-seo';

/** /blog 목록의 주제 허브 줄. */

describe('BLOG_INDEX_HUBS', () => {
  it('허브 6개를 중복 없이 싣는다', () => {
    expect(BLOG_INDEX_HUBS.map((h) => h.href)).toEqual([
      '/about-agarwood',
      '/vietnam-agarwood',
      '/agarwood-oil',
      '/agarwood-benefits',
      '/agarwood-hwan',
      '/agarwood-tea',
    ]);
    expect(BLOG_INDEX_HUBS.every((h) => h.label.trim().length > 0)).toBe(true);
  });
});
