import { describe, expect, it } from 'vitest';
import { categoryOgImage, DEFAULT_OG_IMAGE } from '@/lib/blog/post-seo';

/** 카테고리 OG 이미지 — 최신 글 커버(Blob·/public 만), 없으면 기본 이미지. */

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

function p(over: { categoryId?: string; coverImage?: string; publishedAt?: string; status?: 'draft' | 'published' }) {
  return {
    status: over.status ?? ('published' as const),
    categoryId: over.categoryId ?? 'a',
    coverImage: over.coverImage,
    publishedAt: over.publishedAt,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('categoryOgImage', () => {
  it('같은 카테고리 발행 글 중 가장 최신 글의 Blob 커버를 고른다', () => {
    const posts = [
      p({ coverImage: `${BLOB}/old.png`, publishedAt: '2026-02-01T00:00:00.000Z' }),
      p({ coverImage: `${BLOB}/new.png`, publishedAt: '2026-03-01T00:00:00.000Z' }),
      p({ categoryId: 'b', coverImage: `${BLOB}/other.png`, publishedAt: '2026-04-01T00:00:00.000Z' }),
      p({ status: 'draft', coverImage: `${BLOB}/draft.png`, publishedAt: '2026-05-01T00:00:00.000Z' }),
    ];
    expect(categoryOgImage(posts, 'a')).toBe(`${BLOB}/new.png`);
  });

  it('외부 CDN·SVG 커버는 건너뛰고 다음 최신 글로 내려간다', () => {
    const posts = [
      p({ coverImage: 'https://res.cloudinary.com/x/y.png', publishedAt: '2026-03-03T00:00:00.000Z' }),
      p({ coverImage: `${BLOB}/logo.svg`, publishedAt: '2026-03-02T00:00:00.000Z' }),
      p({ coverImage: '/images/cover.jpg', publishedAt: '2026-03-01T00:00:00.000Z' }),
    ];
    expect(categoryOgImage(posts, 'a')).toBe('/images/cover.jpg');
  });

  it('쓸 수 있는 커버가 없으면 사이트 기본 OG 이미지', () => {
    expect(categoryOgImage([p({}), p({ coverImage: '//evil.example/x.png' })], 'a')).toBe(DEFAULT_OG_IMAGE);
    expect(categoryOgImage([], 'a')).toBe('/opengraph-image.jpg');
  });
});
