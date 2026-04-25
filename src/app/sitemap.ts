import type { MetadataRoute } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';

// env 값에 줄바꿈/공백 섞이면 sitemap URL 이 깨져 검색엔진 색인 실패.
// 모든 공백·제어문자 제거 + trailing slash 정리.
function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zoellife.com')
    .replace(/\s+/g, '')
    .replace(/\/$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about-agarwood`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/brand-story`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/products`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/home-shopping`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/company`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/media`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/reviews`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/process`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/support`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
  ];

  let productDetailRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await readDataSafe<Product>('products');
    // 비공개(published=false) 제품은 sitemap 에서 제외 — 검색엔진에 노출하지 않음.
    productDetailRoutes = products
      .filter((p) => p.slug && p.published !== false)
      .map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
  } catch {
    /* DB 조회 실패 시 정적 경로만 반환 */
  }

  return [...staticRoutes, ...productDetailRoutes];
}
