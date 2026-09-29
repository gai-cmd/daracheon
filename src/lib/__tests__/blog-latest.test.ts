import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readLatestPublishedPostsSafe } from '@/lib/blog/store';

/**
 * 메인 블로그 타일용 가벼운 읽기(readLatestPublishedPostsSafe) 검증.
 * Neon(postgres 태그 템플릿)과 Blob 폴백(readDataSafe)을 목으로 대신해
 * 선택 컬럼·정렬·LIMIT, 발행글만 최신순, 실패·지연 시 [] 를 고정한다.
 */

const h = vi.hoisted(() => ({
  readDataSafe: vi.fn(),
  sqlCalls: [] as { text: string; values: unknown[] }[],
  sqlImpl: { current: async (): Promise<unknown[]> => [] },
}));
const { readDataSafe, sqlCalls } = h;

vi.mock('@/lib/db', () => ({
  readDataSafe: (...args: unknown[]) => h.readDataSafe(...args),
  readDataUncached: vi.fn(),
  readDataForWrite: vi.fn(),
  writeDataMerged: vi.fn(),
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

const post = (slug: string, status: string, publishedAt: string | undefined, createdAt: string) => ({
  id: slug,
  slug,
  title: `제목 ${slug}`,
  excerpt: '',
  content: '<p>본문</p>',
  categoryId: 'c',
  tags: [],
  author: '',
  status,
  publishedAt,
  createdAt,
  updatedAt: createdAt,
});

beforeEach(() => {
  sqlCalls.length = 0;
  setSql(async () => []);
  readDataSafe.mockReset();
  globalThis.__blog_sql = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.DATABASE_URL;
  vi.restoreAllMocks();
});

describe('readLatestPublishedPostsSafe — Blob 폴백', () => {
  it('returns only published posts, newest first by publishedAt then createdAt, limited', async () => {
    readDataSafe.mockResolvedValue([
      post('old', 'published', '2026-01-01T00:00:00.000Z', '2025-12-01T00:00:00.000Z'),
      post('draft', 'draft', undefined, '2026-09-20T00:00:00.000Z'),
      post('no-pub-date', 'published', undefined, '2026-09-10T00:00:00.000Z'),
      post('new', 'published', '2026-09-15T00:00:00.000Z', '2026-09-01T00:00:00.000Z'),
      post('mid', 'published', '2026-05-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
    ]);
    const out = await readLatestPublishedPostsSafe(3);
    expect(out.map((p) => p.slug)).toEqual(['new', 'no-pub-date', 'mid']);
    expect(out[0]).toEqual({
      slug: 'new',
      title: '제목 new',
      publishedAt: '2026-09-15T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    expect(sqlCalls).toHaveLength(0);
  });

  it('returns [] when the read throws', async () => {
    readDataSafe.mockRejectedValue(new Error('blob down'));
    await expect(readLatestPublishedPostsSafe(3)).resolves.toEqual([]);
  });

  it('returns [] when the read does not answer within the time box', async () => {
    readDataSafe.mockReturnValue(new Promise(() => {}));
    await expect(readLatestPublishedPostsSafe(3, 20)).resolves.toEqual([]);
  });
});

describe('readLatestPublishedPostsSafe — Neon', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://user@localhost:5432/test';
  });

  it('selects only the tile columns of published posts, ordered like /blog, with LIMIT', async () => {
    setSql(async () => [
      {
        slug: 'a',
        title: '글 A',
        published_at: new Date('2026-09-15T00:00:00.000Z'),
        created_at: new Date('2026-09-01T00:00:00.000Z'),
      },
      { slug: 'b', title: '글 B', published_at: null, created_at: new Date('2026-09-10T00:00:00.000Z') },
    ]);
    const out = await readLatestPublishedPostsSafe(3);

    expect(sqlCalls).toHaveLength(1);
    const q = sqlCalls[0].text.replace(/\s+/g, ' ');
    expect(q).toContain('SELECT slug, title, published_at, created_at FROM blog_posts');
    expect(q).toContain("WHERE status = 'published'");
    expect(q).toContain('ORDER BY COALESCE(published_at, created_at) DESC');
    expect(q).toContain('LIMIT $');
    expect(sqlCalls[0].values).toEqual([3]);
    expect(readDataSafe).not.toHaveBeenCalled();

    expect(out).toEqual([
      { slug: 'a', title: '글 A', publishedAt: '2026-09-15T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
      { slug: 'b', title: '글 B', publishedAt: undefined, createdAt: '2026-09-10T00:00:00.000Z' },
    ]);
  });

  it('returns [] when the query fails', async () => {
    setSql(async () => {
      throw new Error('neon down');
    });
    await expect(readLatestPublishedPostsSafe(3)).resolves.toEqual([]);
  });

  it('returns [] when Neon is slower than the time box', async () => {
    setSql(() => new Promise(() => {}));
    await expect(readLatestPublishedPostsSafe(3, 20)).resolves.toEqual([]);
  });
});
