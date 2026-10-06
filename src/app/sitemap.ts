import type { MetadataRoute } from 'next';
import { readDataSafe } from '@/lib/db';
import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import { blogSitemapDates } from '@/lib/blog/sitemap-dates';
import type { Product } from '@/data/products';
import { canonicalProductSlug } from '@/lib/product-slugs';

// 신규 블로그·제품(blob 즉시 반영)이 다음 배포 없이도 sitemap 에 반영되도록
// 최대 1시간 주기로 재생성. 발행 핸들러의 revalidatePath('/sitemap.xml') 와 병행.
export const revalidate = 3600;

// env 값에 줄바꿈/공백 섞이면 sitemap URL 이 깨져 검색엔진 색인 실패.
// 모든 공백·제어문자 제거 + trailing slash 정리.
function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, '')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  // lastmod 는 실제 수정 시각을 아는 블로그 글·카테고리·목록에만 넣는다. 정적 페이지·제품에
  // 요청 시각을 넣으면 매 크롤마다 '방금 바뀜'이 되어 검색엔진이 사이트 전체 lastmod 를 불신한다.

  // 모든 URL 에 단일 ko-KR + x-default hreflang 신호를 부여 — Google 이
  // 다국어 변형이 없음을 명확히 인지하도록 한다. (단일 한국어 사이트.)
  const withAlternates = (url: string) => ({
    languages: { 'ko-KR': url, 'x-default': url },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0, alternates: withAlternates(baseUrl) },
    { url: `${baseUrl}/about-agarwood`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/about-agarwood`) },
    // 핵심 검색어 주제 허브 — '베트남 침향' · '침향 오일'
    { url: `${baseUrl}/vietnam-agarwood`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/vietnam-agarwood`) },
    { url: `${baseUrl}/agarwood-oil`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/agarwood-oil`) },
    { url: `${baseUrl}/brand-story`, changeFrequency: 'monthly', priority: 0.8, alternates: withAlternates(`${baseUrl}/brand-story`) },
    { url: `${baseUrl}/showroom`, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/showroom`) },
    { url: `${baseUrl}/products`, changeFrequency: 'weekly', priority: 0.9, alternates: withAlternates(`${baseUrl}/products`) },
    { url: `${baseUrl}/home-shopping`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/home-shopping`) },
    { url: `${baseUrl}/company`, changeFrequency: 'monthly', priority: 0.6, alternates: withAlternates(`${baseUrl}/company`) },
    { url: `${baseUrl}/media`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/media`) },
    { url: `${baseUrl}/reviews`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/reviews`) },
    { url: `${baseUrl}/process`, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/process`) },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.8, alternates: withAlternates(`${baseUrl}/blog`) },
    { url: `${baseUrl}/guide`, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/guide`) },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/privacy`) },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/terms`) },
    // 모든 ImageObject 의 license · acquireLicensePage 목적지 — 크롤러가 실제로
    // 도달해야 이미지 라이선스 구조화 데이터가 유효하다.
    { url: `${baseUrl}/image-license`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/image-license`) },
  ];

  let productDetailRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await readDataSafe<Product>('products');
    // 비공개(published=false) 제품은 sitemap 에서 제외 — 검색엔진에 노출하지 않음.
    productDetailRoutes = products
      .filter((p) => p.slug && p.published !== false)
      .map((p) => {
        const url = `${baseUrl}/products/${canonicalProductSlug(p.slug)}`;
        return {
          url,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          alternates: withAlternates(url),
        };
      });
  } catch {
    /* DB 조회 실패 시 정적 경로만 반환 */
  }

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const [posts, categories] = await Promise.all([
      readPostsSafe(),
      readCategoriesSafe(),
    ]);
    // 잘못된/빈 updatedAt 은 helper 가 publishedAt 또는 '날짜 없음'으로 처리 — Invalid Date 가
    // toISOString RangeError 로 catch 에 흘러 블로그 전량이 sitemap 에서 사라지던 경로도 막는다.
    const dates = blogSitemapDates(posts, categories);
    const blogIndex = staticRoutes.find((r) => r.url === `${baseUrl}/blog`);
    if (blogIndex && dates.latest) blogIndex.lastModified = dates.latest;
    const postRoutes: MetadataRoute.Sitemap = dates.posts.map((p) => {
      const url = `${baseUrl}/blog/${p.slug}`;
      return {
        url,
        ...(p.lastModified ? { lastModified: p.lastModified } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: withAlternates(url),
      };
    });
    // 발행 글이 0편인 카테고리는 noindex 페이지라 sitemap 에서 뺀다 (helper 가 걸러 줌).
    const categoryRoutes: MetadataRoute.Sitemap = dates.categories.map((c) => {
      const url = `${baseUrl}/blog/category/${c.id}`;
      return {
        url,
        ...(c.lastModified ? { lastModified: c.lastModified } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
        alternates: withAlternates(url),
      };
    });
    blogRoutes = [...categoryRoutes, ...postRoutes];
  } catch {
    /* 블로그 데이터 로드 실패 시 정적 경로만 */
  }

  return [...staticRoutes, ...productDetailRoutes, ...blogRoutes];
}
