import { describe, expect, it } from 'vitest';
import type { BlogCategory, BlogPost } from '@/types/blog';
import { blogSitemapDates, toValidDate } from '../blog/sitemap-dates';

const post = (over: Partial<BlogPost>): BlogPost => ({
  id: over.slug ?? 'x',
  slug: 'x',
  title: 't',
  excerpt: '',
  content: '',
  categoryId: 'science',
  tags: [],
  author: 'a',
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});
const cat = (id: string): BlogCategory => ({ id, name: id, order: 0, createdAt: '', updatedAt: '' });

describe('toValidDate', () => {
  it('parses ISO strings and rejects empty or invalid input', () => {
    expect(toValidDate('2026-08-06T06:05:01.728Z')?.toISOString()).toBe('2026-08-06T06:05:01.728Z');
    expect(toValidDate(undefined)).toBeUndefined();
    expect(toValidDate('')).toBeUndefined();
    expect(toValidDate('not a date')).toBeUndefined();
  });
});

describe('blogSitemapDates', () => {
  const posts = [
    post({ slug: 'a', categoryId: 'science', updatedAt: '2026-08-01T00:00:00.000Z' }),
    post({ slug: 'b', categoryId: 'science', updatedAt: '2026-09-15T00:00:00.000Z' }),
    post({ slug: 'c', categoryId: 'farm', updatedAt: '2026-07-01T00:00:00.000Z' }),
    post({ slug: 'd', categoryId: 'farm', status: 'draft', updatedAt: '2026-10-01T00:00:00.000Z' }),
  ];
  const categories = [cat('science'), cat('farm'), cat('history')];

  it('uses each published post updatedAt and ignores drafts', () => {
    const out = blogSitemapDates(posts, categories);
    expect(out.posts.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
    expect(out.posts[1].lastModified?.toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });

  it('dates the blog index by the newest published post, not by the clock', () => {
    expect(blogSitemapDates(posts, categories).latest?.toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });

  it('dates each category by its newest published post and drops empty categories', () => {
    const out = blogSitemapDates(posts, categories);
    expect(out.categories).toEqual([
      { id: 'science', count: 2, lastModified: new Date('2026-09-15T00:00:00.000Z') },
      { id: 'farm', count: 1, lastModified: new Date('2026-07-01T00:00:00.000Z') },
    ]);
  });

  it('falls back to publishedAt, then omits the date, when updatedAt is unusable', () => {
    const out = blogSitemapDates(
      [
        post({ slug: 'p', updatedAt: 'garbage', publishedAt: '2026-05-14T00:00:00.000Z' }),
        post({ slug: 'q', updatedAt: '' }),
      ],
      [cat('science')],
    );
    expect(out.posts[0].lastModified?.toISOString()).toBe('2026-05-14T00:00:00.000Z');
    expect(out.posts[1].lastModified).toBeUndefined();
  });

  it('skips published posts without a slug', () => {
    expect(blogSitemapDates([post({ slug: '' })], [cat('science')]).posts).toEqual([]);
  });
});
