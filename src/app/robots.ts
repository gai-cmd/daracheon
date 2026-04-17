import type { MetadataRoute } from 'next';

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
    sitemap: 'https://www.daracheon.com/sitemap.xml',
  };
}
