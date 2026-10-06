import type { BlogCategory, BlogPost } from '@/types/blog';

/** 유효한 ISO 문자열이면 Date, 비었거나 깨졌으면 undefined. */
export function toValidDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const postDate = (p: BlogPost) => toValidDate(p.updatedAt) ?? toValidDate(p.publishedAt);

function newest(list: BlogPost[]): Date | undefined {
  let latest: Date | undefined;
  for (const p of list) {
    const d = postDate(p);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

/**
 * sitemap 의 블로그 lastmod 를 실제 글 수정 시각으로만 정한다.
 * 요청 시각(new Date())을 넣으면 크롤마다 '방금 바뀜'으로 보여 검색엔진이 사이트 전체의
 * lastmod 를 불신하게 된다. 날짜를 알 수 없으면 lastModified 를 비워 두고(태그 생략),
 * 발행 글이 0편인 카테고리는 결과에서 뺀다(빈 카테고리 페이지는 noindex).
 */
export function blogSitemapDates(posts: BlogPost[], categories: BlogCategory[]) {
  const published = posts.filter((p) => p.status === 'published' && p.slug);
  return {
    posts: published.map((p) => ({ slug: p.slug, lastModified: postDate(p) })),
    latest: newest(published),
    categories: categories
      .map((c) => {
        const inCategory = published.filter((p) => p.categoryId === c.id);
        return { id: c.id, count: inCategory.length, lastModified: newest(inCategory) };
      })
      .filter((c) => c.count > 0),
  };
}
