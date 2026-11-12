import { describe, expect, it } from 'vitest';
import {
  blogPostChangePaths,
  buildIndexNowUrls,
  dropRedirectingPaths,
  productChangePaths,
} from '@/lib/seo/indexnow';

/** IndexNow 변경 경로 — 내려간·삭제된·주소가 바뀐 글과 제품의 옛 주소, 영구 이동 경로 제외. */

describe('blogPostChangePaths', () => {
  const pub = (slug: string, categoryId = 'c1') => ({ slug, categoryId, status: 'published' });
  const draft = (slug: string, categoryId = 'c1') => ({ slug, categoryId, status: 'draft' });

  it('발행 글 저장 — 지금 주소만', () => {
    expect(blogPostChangePaths(pub('a'), pub('a'))).toEqual(['/blog/a', '/blog', '/blog/category/c1']);
    expect(blogPostChangePaths(null, pub('a'))).toEqual(['/blog/a', '/blog', '/blog/category/c1']);
    expect(blogPostChangePaths(draft('a'), pub('a'))).toEqual(['/blog/a', '/blog', '/blog/category/c1']);
  });

  it('발행 → 초안: 내려간 옛 주소를 알린다', () => {
    expect(blogPostChangePaths(pub('a'), draft('a'))).toEqual(['/blog/a', '/blog', '/blog/category/c1']);
  });

  it('발행 글 삭제: 없어진 주소를 알린다', () => {
    expect(blogPostChangePaths(pub('a'), null)).toEqual(['/blog/a', '/blog', '/blog/category/c1']);
  });

  it('슬러그·카테고리 변경: 새 주소와 옛 주소를 함께, 중복 없이', () => {
    expect(blogPostChangePaths(pub('old'), pub('new'))).toEqual([
      '/blog/new',
      '/blog',
      '/blog/category/c1',
      '/blog/old',
    ]);
    expect(blogPostChangePaths(pub('a', 'c1'), pub('a', 'c2'))).toEqual([
      '/blog/a',
      '/blog',
      '/blog/category/c2',
      '/blog/category/c1',
    ]);
  });

  it('발행된 적 없는 초안은 아무것도 알리지 않는다', () => {
    expect(blogPostChangePaths(draft('a'), draft('b'))).toEqual([]);
    expect(blogPostChangePaths(draft('a'), null)).toEqual([]);
    expect(blogPostChangePaths(null, draft('a'))).toEqual([]);
  });
});

describe('productChangePaths', () => {
  it('공개 제품 저장 — 지금 주소와 목록', () => {
    expect(productChangePaths('a', 'a')).toEqual(['/products/a', '/products']);
    expect(productChangePaths(null, 'a')).toEqual(['/products/a', '/products']);
  });

  it('비공개 전환·삭제·주소 변경이면 옛 주소도', () => {
    expect(productChangePaths('a', null)).toEqual(['/products/a', '/products']);
    expect(productChangePaths('old', 'new')).toEqual(['/products/new', '/products/old', '/products']);
  });

  it('공개된 적이 없으면 알리지 않는다', () => {
    expect(productChangePaths(null, null)).toEqual([]);
  });
});

describe('dropRedirectingPaths', () => {
  it('/process 는 /media 로 영구 이동되므로 뺀다', () => {
    expect(dropRedirectingPaths(['/process', '/media'])).toEqual(['/media']);
    expect(dropRedirectingPaths(['/about-agarwood'])).toEqual(['/about-agarwood']);
    expect(buildIndexNowUrls(dropRedirectingPaths(['/process', '/media']))).toEqual([
      'https://zoellife.com/media',
    ]);
  });
});
