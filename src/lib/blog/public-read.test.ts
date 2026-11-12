import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readCategoriesCachedSafe,
  readPublishedPost,
  readPublishedPostList,
  readPublishedPostListSafe,
} from '@/lib/blog/store';

/**
 * 공개 블로그 경로용 읽기 검증 — 본문 없는 발행 글 목록, 슬러그로 찾는 발행 글 한 건.
 * 글 한 건 읽기는 "없음(null)"과 "읽기 실패(throw)"를 구분해야 한다:
 * 실패를 null 로 삼키면 살아 있는 글이 404 로 나간다.
 */

const h = vi.hoisted(() => ({
  readDataSafe: vi.fn(),
  readDataUncached: vi.fn(),
  sqlCalls: [] as { text: string; values: unknown[] }[],
  sqlImpl: { current: async (): Promise<unknown[]> => [] },
}));
const { readDataSafe, sqlCalls } = h;

vi.mock('@/lib/db', () => ({
  readDataSafe: (...args: unknown[]) => h.readDataSafe(...args),
  readDataUncached: (...args: unknown[]) => h.readDataUncached(...args),
  readDataForWrite: vi.fn(),
  writeDataMerged: vi.fn(),
}));

// unstable_cache 는 Next 런타임 밖에서 동작하지 않으므로 통과 함수로 대신한다.
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock('postgres', () => ({
  default: () =>
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      h.sqlCalls.push({ text: strings.join('$'), values });
      return h.sqlImpl.current();
    },
}));

function setSql(impl: () => Promise<unknown[]>) {
  h.sqlImpl.current = impl;
}

const row = (slug: string, over: Record<string, unknown> = {}) => ({
  id: slug,
  slug,
  title: `제목 ${slug}`,
  excerpt: '요약',
  cover_image: null,
  category_id: 'c',
  tags: ['침향'],
  author: 'jay',
  status: 'published',
  published_at: new Date('2026-09-15T00:00:00.000Z'),
  created_at: new Date('2026-09-01T00:00:00.000Z'),
  updated_at: new Date('2026-09-16T00:00:00.000Z'),
  reading_time: 3,
  seo: { seoTitle: '검색 제목', authorEmail: 'a@b.c' },
  reviewed: true,
  view_count: 7,
  ...over,
});

beforeEach(() => {
  sqlCalls.length = 0;
  setSql(async () => []);
  readDataSafe.mockReset();
  h.readDataUncached.mockReset();
  globalThis.__blog_sql = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.DATABASE_URL;
  vi.restoreAllMocks();
});

describe('공개 블로그 읽기 — Neon', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://user@localhost:5432/test';
  });

  it('목록은 본문 컬럼 없이 발행 글만 최신순으로 읽는다', async () => {
    setSql(async () => [row('a'), row('b', { published_at: null, seo: null })]);
    const out = await readPublishedPostList();

    expect(sqlCalls).toHaveLength(1);
    const q = sqlCalls[0].text.replace(/\s+/g, ' ');
    expect(q).toContain('FROM blog_posts');
    expect(q).toContain("WHERE status = 'published'");
    expect(q).toContain('ORDER BY COALESCE(published_at, created_at) DESC');
    expect(q).not.toMatch(/SELECT \*/);
    expect(q).not.toMatch(/\bcontent\b/);
    expect(q).not.toContain('content_json');

    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({
      id: 'a',
      slug: 'a',
      title: '제목 a',
      excerpt: '요약',
      coverImage: undefined,
      categoryId: 'c',
      tags: ['침향'],
      author: 'jay',
      authorEmail: 'a@b.c',
      status: 'published',
      publishedAt: '2026-09-15T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-16T00:00:00.000Z',
      readingTime: 3,
      seoTitle: '검색 제목',
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      reviewed: true,
      viewCount: 7,
    });
    expect('content' in out[0]).toBe(false);
    expect(out[1].publishedAt).toBeUndefined();
  });

  it('글 한 건은 슬러그·발행 상태로 찾고 본문을 싣되 content_json 은 읽지 않는다', async () => {
    setSql(async () => [row('a', { content: '<p>본문</p>' })]);
    const post = await readPublishedPost('a');

    const q = sqlCalls[0].text.replace(/\s+/g, ' ');
    expect(q).toContain("WHERE slug = $ AND status = 'published'");
    expect(q).toContain('LIMIT 1');
    expect(q).not.toContain('content_json');
    expect(sqlCalls[0].values).toEqual(['a']);
    expect(post?.content).toBe('<p>본문</p>');
    expect(post?.contentJson).toBeUndefined();
    expect(post?.slug).toBe('a');
  });

  it('없는 슬러그는 null — 404 대상', async () => {
    setSql(async () => []);
    await expect(readPublishedPost('missing')).resolves.toBeNull();
  });

  it('읽기 실패는 던진다 — 404 가 아니라 500 으로 나가야 한다', async () => {
    setSql(async () => {
      throw new Error('neon down');
    });
    await expect(readPublishedPost('a')).rejects.toThrow('neon down');
  });

  it('목록 읽기 실패: 날것은 던지고(캐시에 빈 목록이 굳지 않게), Safe 는 [] 로 끝낸다', async () => {
    setSql(async () => {
      throw new Error('neon down');
    });
    await expect(readPublishedPostList()).rejects.toThrow('neon down');
    await expect(readPublishedPostListSafe()).resolves.toEqual([]);
    await expect(readCategoriesCachedSafe()).resolves.toEqual([]);
  });
});

describe('공개 블로그 읽기 — Blob 폴백', () => {
  const stored = (slug: string, status: string, publishedAt?: string) => ({
    id: slug,
    slug,
    title: `제목 ${slug}`,
    excerpt: '',
    content: '<p>본문</p>',
    contentJson: { type: 'doc' },
    categoryId: 'c',
    tags: [],
    author: '',
    status,
    publishedAt,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  it('목록은 발행 글만 최신순, 본문 필드를 뺀다', async () => {
    readDataSafe.mockResolvedValue([
      stored('old', 'published', '2026-01-01T00:00:00.000Z'),
      stored('draft', 'draft'),
      stored('new', 'published', '2026-09-01T00:00:00.000Z'),
    ]);
    const out = await readPublishedPostList();
    expect(out.map((p) => p.slug)).toEqual(['new', 'old']);
    expect('content' in out[0]).toBe(false);
    expect('contentJson' in out[0]).toBe(false);
    expect(sqlCalls).toHaveLength(0);
  });

  it('글 한 건은 발행 글만 찾는다', async () => {
    readDataSafe.mockResolvedValue([stored('a', 'published'), stored('d', 'draft')]);
    await expect(readPublishedPost('a')).resolves.toMatchObject({ slug: 'a', content: '<p>본문</p>' });
    await expect(readPublishedPost('d')).resolves.toBeNull();
  });
});
