import type { MetadataRoute } from 'next';
import { readDataSafe } from '@/lib/db';
import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import type { Product } from '@/data/products';

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
  const lastModified = new Date();

  // 모든 URL 에 단일 ko-KR + x-default hreflang 신호를 부여 — Google 이
  // 다국어 변형이 없음을 명확히 인지하도록 한다. (단일 한국어 사이트.)
  const withAlternates = (url: string) => ({
    languages: { 'ko-KR': url, 'x-default': url },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1.0, alternates: withAlternates(baseUrl) },
    { url: `${baseUrl}/about-agarwood`, lastModified, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/about-agarwood`) },
    { url: `${baseUrl}/brand-story`, lastModified, changeFrequency: 'monthly', priority: 0.8, alternates: withAlternates(`${baseUrl}/brand-story`) },
    { url: `${baseUrl}/showroom`, lastModified, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/showroom`) },
    { url: `${baseUrl}/products`, lastModified, changeFrequency: 'weekly', priority: 0.9, alternates: withAlternates(`${baseUrl}/products`) },
    { url: `${baseUrl}/home-shopping`, lastModified, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/home-shopping`) },
    { url: `${baseUrl}/company`, lastModified, changeFrequency: 'monthly', priority: 0.6, alternates: withAlternates(`${baseUrl}/company`) },
    { url: `${baseUrl}/media`, lastModified, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/media`) },
    { url: `${baseUrl}/reviews`, lastModified, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/reviews`) },
    { url: `${baseUrl}/process`, lastModified, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/process`) },
    { url: `${baseUrl}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.8, alternates: withAlternates(`${baseUrl}/blog`) },
    { url: `${baseUrl}/guide`, lastModified, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/guide`) },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/privacy`) },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/terms`) },
    // 모든 ImageObject 의 license · acquireLicensePage 목적지 — 크롤러가 실제로
    // 도달해야 이미지 라이선스 구조화 데이터가 유효하다.
    { url: `${baseUrl}/image-license`, lastModified, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/image-license`) },
  ];

  let productDetailRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await readDataSafe<Product>('products');
    // 비공개(published=false) 제품은 sitemap 에서 제외 — 검색엔진에 노출하지 않음.
    productDetailRoutes = products
      .filter((p) => p.slug && p.published !== false)
      .map((p) => {
        const url = `${baseUrl}/products/${p.slug}`;
        return {
          url,
          lastModified,
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
    const published = posts.filter((p) => p.status === 'published' && p.slug);
    const postRoutes: MetadataRoute.Sitemap = published.map((p) => {
      const url = `${baseUrl}/blog/${p.slug}`;
      // 잘못된/빈 updatedAt 이 Invalid Date → toISOString RangeError → catch 로 흘러
      // 블로그 전량이 sitemap 에서 조용히 사라지는 것을 방어.
      const d = new Date(p.updatedAt);
      return {
        url,
        lastModified: Number.isNaN(d.getTime()) ? lastModified : d,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: withAlternates(url),
      };
    });
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => {
      const url = `${baseUrl}/blog/category/${c.id}`;
      return {
        url,
        lastModified,
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
