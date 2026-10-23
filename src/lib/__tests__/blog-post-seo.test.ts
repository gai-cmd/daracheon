import { describe, expect, it } from 'vitest';
import {
  blogOgTitle,
  blogPostTitle,
  categoryMetaDescription,
  pickPostsBySlug,
  selectRelatedPosts,
} from '@/lib/blog/post-seo';
import type { BlogPost } from '@/types/blog';

/** 블로그 템플릿 SEO 순수 로직 — 제목·OG 제목·관련 글·카테고리 메타 설명. */

function post(id: string, over: Partial<BlogPost> = {}): BlogPost {
  return {
    id,
    slug: id,
    title: `글 ${id}`,
    excerpt: '',
    content: '',
    categoryId: 'a',
    tags: [],
    author: '대라천',
    status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as BlogPost;
}

describe('blogPostTitle / blogOgTitle', () => {
  it('seoTitle 우선, 없으면 제목 — 브랜드 접미사를 붙이지 않는다', () => {
    expect(blogPostTitle({ title: '침향 이야기' })).toBe('침향 이야기');
    expect(blogPostTitle({ title: '침향 이야기', seoTitle: '침향 효능 정리' })).toBe('침향 효능 정리');
    expect(blogPostTitle({ title: '침향 이야기', seoTitle: '  ' })).toBe('침향 이야기');
  });

  it('OG 제목은 40자 이내로 자른다', () => {
    expect(blogOgTitle('짧은 제목')).toBe('짧은 제목');
    const long = '가'.repeat(55);
    const og = blogOgTitle(long);
    expect(Array.from(og)).toHaveLength(40);
    expect(og.endsWith('…')).toBe(true);
    expect(blogOgTitle('나'.repeat(40))).toBe('나'.repeat(40));
  });
});

describe('selectRelatedPosts', () => {
  const current = post('cur', { categoryId: 'a', tags: ['침향', '효능'] });

  it('태그 공유 → 같은 카테고리 → 최신순, 현재 글 제외', () => {
    const candidates = [
      current,
      post('new-same-cat', { categoryId: 'a', publishedAt: '2026-09-01' }),
      post('old-two-tags', { categoryId: 'b', tags: ['효능', '침향'], publishedAt: '2025-01-01' }),
      post('one-tag-other', { categoryId: 'b', tags: ['침향'], publishedAt: '2026-08-01' }),
      post('one-tag-same', { categoryId: 'a', tags: ['침향'], publishedAt: '2025-06-01' }),
      post('new-other', { categoryId: 'b', publishedAt: '2026-10-01' }),
    ];
    expect(selectRelatedPosts(current, candidates, 10).map((p) => p.id)).toEqual([
      'old-two-tags',
      'one-tag-same',
      'one-tag-other',
      'new-same-cat',
      'new-other',
    ]);
  });

  it('개수 제한을 지킨다', () => {
    const candidates = [post('x'), post('y'), post('z'), post('w')];
    expect(selectRelatedPosts(current, candidates, 3)).toHaveLength(3);
  });
});

describe('categoryMetaDescription', () => {
  it('충분히 긴 어드민 설명은 그대로', () => {
    const description = '베트남 하띤 직영 농장에서 침향나무를 기르고 수지를 얻기까지의 과정을 기록한 글을 모았습니다.';
    expect(categoryMetaDescription({ name: '농장', description }, ['아무 글'])).toBe(description);
  });

  it('설명이 없으면 글 제목으로 100자 이내 설명을 만든다 (숫자 없음)', () => {
    const titles = [
      '침향나무 접종부터 수확까지',
      '하띤 농장의 우기 관리',
      '침향 수지가 앉는 원리',
      '증류 72시간의 기록',
      '다섯 번째 글 제목도 들어갈까',
    ];
    const d = categoryMetaDescription({ name: '농장 기록' }, titles);
    expect(Array.from(d).length).toBeLessThanOrEqual(100);
    expect(Array.from(d).length).toBeGreaterThanOrEqual(60);
    expect(d).toContain('침향나무 접종부터 수확까지');
    expect(d).not.toMatch(/\d+\s*편/);
  });

  it('글이 없으면 기본 문구', () => {
    expect(categoryMetaDescription({ name: '농장' }, [])).toBe('대라천 블로그 농장 카테고리의 글 모음.');
  });

  it('첫 제목만으로 넘치면 잘라서 100자 이내', () => {
    const d = categoryMetaDescription({ name: '농장' }, ['가'.repeat(150)]);
    expect(Array.from(d).length).toBeLessThanOrEqual(100);
  });
});

describe('pickPostsBySlug', () => {
  it('지정 순서대로, 발행 글만, 없는 슬러그는 건너뛴다', () => {
    const posts = [
      post('b', { title: ' 글 B ' }),
      post('a'),
      post('d', { status: 'draft' } as Partial<BlogPost>),
    ];
    expect(pickPostsBySlug(posts, ['a', 'missing', 'd', 'b'])).toEqual([
      { slug: 'a', title: '글 a' },
      { slug: 'b', title: '글 B' },
    ]);
  });
});
