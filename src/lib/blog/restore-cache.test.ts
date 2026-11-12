import { describe, expect, it } from 'vitest';
import { restoreTouchedBlog } from '@/lib/blog/restore-cache';

/** 스냅샷 복원 뒤 공개 블로그 캐시를 비울지 — 블로그 테이블이 복원됐을 때만. */

describe('restoreTouchedBlog', () => {
  it('글 또는 카테고리가 복원되면 true', () => {
    expect(restoreTouchedBlog(['products', 'blogPosts'])).toBe(true);
    expect(restoreTouchedBlog(['blogCategories'])).toBe(true);
    expect(restoreTouchedBlog(['blogCategories', 'blogPosts', 'pages'])).toBe(true);
  });

  it('블로그 테이블이 백업에 없어 복원되지 않았으면 false', () => {
    expect(restoreTouchedBlog([])).toBe(false);
    expect(restoreTouchedBlog(['products', 'pages', 'reviews'])).toBe(false);
  });
});
