import { describe, expect, it } from 'vitest';
import {
  selectPopularPosts,
  selectRelatedRail,
  stableHash,
  topicHubsForCategory,
  urlMatchesHost,
} from '@/lib/blog/post-seo';
import { absolutize, absolutizeHtmlUrls, cdata, imageMimeType } from '@/lib/blog/rss';
import type { BlogPost } from '@/types/blog';

/** 내부 링크 보강 순수 로직 — 관련 글 레일 보충, 인기 글 동률 회전, 허브 매핑, 인용 호스트, RSS 유틸. */

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

const day = (n: number) => `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`;

describe('selectRelatedRail', () => {
  it('같은 카테고리가 3개 이상이면 그 안에서만 고른다', () => {
    const cur = post('cur', { categoryId: 'a' });
    const pool = [
      cur,
      post('a1', { categoryId: 'a', publishedAt: day(1) }),
      post('a2', { categoryId: 'a', publishedAt: day(2) }),
      post('a3', { categoryId: 'a', publishedAt: day(3) }),
      post('b1', { categoryId: 'b', publishedAt: day(9) }),
    ];
    const r = selectRelatedRail(cur, pool, 5);
    expect(r.posts.map((p) => p.id)).toEqual(['a3', 'a2', 'a1']);
    expect(r.crossCategory).toBe(false);
  });

  it('3개 미만이면 태그 공유 글 → 최신순으로 5개까지 채운다', () => {
    const cur = post('cur', { categoryId: 'a', tags: ['침향'] });
    const pool = [
      cur,
      post('a1', { categoryId: 'a', publishedAt: day(1) }),
      post('b-old-tag', { categoryId: 'b', tags: ['침향'], publishedAt: day(2) }),
      post('b-new', { categoryId: 'b', publishedAt: day(9) }),
      post('c-new', { categoryId: 'c', publishedAt: day(8) }),
      post('c-mid', { categoryId: 'c', publishedAt: day(5) }),
      post('c-old', { categoryId: 'c', publishedAt: day(3) }),
    ];
    const r = selectRelatedRail(cur, pool, 5);
    expect(r.posts.map((p) => p.id)).toEqual(['a1', 'b-old-tag', 'b-new', 'c-new', 'c-mid']);
    expect(r.crossCategory).toBe(true);
  });

  it('채울 글이 없으면 같은 카테고리 결과 그대로, 현재 글 제외', () => {
    const cur = post('cur', { categoryId: 'a' });
    const r = selectRelatedRail(cur, [cur, post('a1', { categoryId: 'a' })], 5);
    expect(r.posts.map((p) => p.id)).toEqual(['a1']);
    expect(r.crossCategory).toBe(false);
  });
});

describe('selectPopularPosts', () => {
  const pool = [
    post('v10', { viewCount: 10, publishedAt: day(1) }),
    post('v5', { viewCount: 5, publishedAt: day(2) }),
    ...Array.from({ length: 8 }, (_, i) => post(`z${i}`, { publishedAt: day(10 + i) })),
  ];

  it('조회수 높은 글이 먼저, 현재 글 제외, limit 준수', () => {
    const out = selectPopularPosts({ id: 'v10', slug: 'v10' }, pool, 5);
    expect(out).toHaveLength(5);
    expect(out[0].id).toBe('v5');
    expect(out.some((p) => p.id === 'v10')).toBe(false);
  });

  it('동률 묶음은 슬러그 해시로 회전 — 같은 글은 항상 같은 결과', () => {
    const a = selectPopularPosts({ id: 'x', slug: 'some-post' }, pool, 5).map((p) => p.id);
    const b = selectPopularPosts({ id: 'x', slug: 'some-post' }, pool, 5).map((p) => p.id);
    expect(a).toEqual(b);
    expect(a.slice(0, 2)).toEqual(['v10', 'v5']);
    // 0회 묶음(최신순 z7..z0)이 해시만큼 회전된 순서로 이어진다.
    const zeros = ['z7', 'z6', 'z5', 'z4', 'z3', 'z2', 'z1', 'z0'];
    const k = stableHash('some-post') % zeros.length;
    expect(a.slice(2)).toEqual([...zeros.slice(k), ...zeros.slice(0, k)].slice(0, 3));
  });

  it('글마다 다른 오래된 글이 노출된다(최신 글로 고정되지 않음)', () => {
    const tails = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) =>
        selectPopularPosts({ id: 'x', slug: s }, pool, 5)
          .slice(2)
          .map((p) => p.id)
          .join(','),
      ),
    );
    expect(tails.size).toBeGreaterThan(1);
  });
});

describe('topicHubsForCategory', () => {
  it('카테고리별 허브 매핑, 미지정은 침향이란?', () => {
    const hrefs = (c: string) => topicHubsForCategory(c).map((h) => h.href);
    expect(hrefs('agarwood-science')).toEqual(['/agarwood-benefits']);
    expect(hrefs('agarwood-life')).toEqual(['/agarwood-benefits']);
    expect(hrefs('real-agarwood')).toEqual(['/about-agarwood', '/vietnam-agarwood']);
    expect(hrefs('agarwood-basics')).toEqual(['/about-agarwood', '/vietnam-agarwood']);
    expect(hrefs('daeracheon-farm')).toEqual(['/vietnam-agarwood']);
    expect(hrefs('agarwood-history')).toEqual(['/about-agarwood']);
    expect(hrefs('brand-news')).toEqual(['/about-agarwood']);
    expect(hrefs('unknown')).toEqual(['/about-agarwood']);
  });
});

describe('urlMatchesHost', () => {
  const hosts = ['doi.org', 'nature.com', 'ncbi.nlm.nih.gov'];
  it('도메인·하위 도메인만 일치, 문자열 포함은 불일치', () => {
    expect(urlMatchesHost('https://doi.org/10.1/x', hosts)).toBe(true);
    expect(urlMatchesHost('https://dx.doi.org/10.1/x', hosts)).toBe(true);
    expect(urlMatchesHost('https://www.nature.com/articles/x', hosts)).toBe(true);
    expect(urlMatchesHost('https://pmc.ncbi.nlm.nih.gov/articles/PMC1/', hosts)).toBe(true);
    expect(urlMatchesHost('https://signature.com/x', hosts)).toBe(false);
    expect(urlMatchesHost('https://example.com/?ref=doi.org', hosts)).toBe(false);
    expect(urlMatchesHost('/blog/x', hosts)).toBe(false);
  });
});

describe('rss utils', () => {
  it("cdata 는 본문의 ']]>' 를 쪼개 CDATA 가 일찍 닫히지 않게 한다", () => {
    expect(cdata('<p>a</p>')).toBe('<![CDATA[<p>a</p>]]>');
    const out = cdata('x]]>y');
    expect(out).toBe('<![CDATA[x]]]]><![CDATA[>y]]>');
    // CDATA 섹션을 풀어 이으면 원문과 같다.
    const joined = Array.from(out.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g))
      .map((m) => m[1])
      .join('');
    expect(joined).toBe('x]]>y');
  });

  it('상대 URL 을 절대 URL 로 — src·href·srcset, 앵커·mailto·절대 URL 은 유지', () => {
    const base = 'https://zoellife.com';
    const html =
      '<a href="/blog/x">a</a><a href="#s">b</a><a href="https://doi.org/1">c</a>' +
      '<img src="/uploads/a.jpg" srcset="/uploads/a.jpg 1x, /uploads/b.jpg 2x"><img src=\'//cdn.example/a.png\'>' +
      '<a href="mailto:a@b.c">m</a>';
    expect(absolutizeHtmlUrls(html, `${base}/`)).toBe(
      '<a href="https://zoellife.com/blog/x">a</a><a href="#s">b</a><a href="https://doi.org/1">c</a>' +
        '<img src="https://zoellife.com/uploads/a.jpg" srcset="https://zoellife.com/uploads/a.jpg 1x, https://zoellife.com/uploads/b.jpg 2x"><img src=\'https://cdn.example/a.png\'>' +
        '<a href="mailto:a@b.c">m</a>',
    );
    expect(absolutize('/x.jpg', base)).toBe('https://zoellife.com/x.jpg');
    expect(absolutize('https://a.b/x.jpg', base)).toBe('https://a.b/x.jpg');
  });

  it('enclosure type 은 확장자로, 모르면 null', () => {
    expect(imageMimeType('https://x/a.JPG')).toBe('image/jpeg');
    expect(imageMimeType('https://x/a.jpeg?w=1')).toBe('image/jpeg');
    expect(imageMimeType('https://x/a.png#f')).toBe('image/png');
    expect(imageMimeType('https://x/a.webp')).toBe('image/webp');
    expect(imageMimeType('https://x/a.gif')).toBe('image/gif');
    expect(imageMimeType('https://x/a.avif')).toBe('image/avif');
    expect(imageMimeType('https://x/a.svg')).toBeNull();
    expect(imageMimeType('https://x/image')).toBeNull();
  });
});
