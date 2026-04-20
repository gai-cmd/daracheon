import type { MetadataRoute } from 'next';
import { readData } from '@/lib/db';
import type { Product } from '@/data/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.daracheon.com').replace(/\/$/, '');
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
    { url: `${baseUrl}/support`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
  ];

  let productDetailRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await readData<Product>('products');
    productDetailRoutes = products
      .filter((p) => p.slug)
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
