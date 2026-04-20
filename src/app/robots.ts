import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.daracheon.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/about-agarwood', '/brand-story', '/products'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/about-agarwood', '/brand-story', '/products'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
