import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/ui/JsonLd';
import { readDataSafe } from '@/lib/db';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import BlogCard from './BlogCard';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '대라천 블로그 — 침향 이야기, 농장 기록, 효능 자료',
  description:
    '대라천 ZOEL LIFE 침향 블로그. 베트남 하띤 직영 농장의 생산 기록, 침향 효능과 사용법, 정통 침향 지식을 정리해 공개합니다.',
  keywords: [
    '대라천 블로그',
    'ZOEL LIFE 블로그',
    '침향 블로그',
    '침향 이야기',
    '침향 효능',
    '침향 농장',
    '침향 지식',
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: '대라천 블로그 — 침향 이야기, 농장 기록, 효능 자료',
    description: '베트남 하띤 직영 농장 기록 · 침향 효능 · 정통 침향 지식.',
    images: ['/opengraph-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '대라천 블로그',
    description: '침향 이야기, 농장 기록, 효능 자료.',
    images: ['/twitter-image.jpg'],
  },
};

export default async function BlogListPage() {
  const [posts, categories] = await Promise.all([
    readDataSafe<BlogPost>(BLOG_POSTS_FILE),
    readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);

  const published = posts
    .filter((p) => p.status === 'published')
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    );

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    name: '대라천 블로그',
    url: `${SITE_URL}/blog`,
    description: '베트남 하띤 직영 침향 농장 기록 · 침향 효능 · 정통 침향 지식.',
    // 상세 페이지와 동일하게 정규 Organization 노드를 @id 참조(엔티티 표기 일관).
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: published.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.publishedAt ?? p.createdAt,
      dateModified: p.updatedAt,
      author:
        !p.author || /대라천|zoel/i.test(p.author)
          ? { '@id': `${SITE_URL}/#organization` }
          : { '@type': 'Person', name: p.author },
      image: p.coverImage,
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '블로그', item: `${SITE_URL}/blog` },
    ],
  };

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <JsonLd data={breadcrumb} />

      <main className="min-h-screen bg-luxury-black text-luxury-cream">
        <section className="border-b border-luxury-bronze/20 px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.3em] text-luxury-gold">JOURNAL</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">대라천 블로그</h1>
            <p className="mt-3 max-w-2xl text-sm text-luxury-cream/70 md:text-base">
              베트남 하띤 직영 농장에서 길어 올린 기록, 침향의 역사와 효능, 그리고 정통 침향이 무엇인지를
              꾸준히 글로 정리합니다.
            </p>
          </div>
        </section>

        {/* Categories */}
        {sortedCategories.length > 0 && (
          <nav className="border-b border-luxury-bronze/20 px-4 py-4">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
              <Link
                href="/blog"
                className="rounded-full border border-luxury-gold/60 bg-luxury-gold/10 px-3 py-1 text-xs text-luxury-gold"
              >
                전체
              </Link>
              {sortedCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/blog/category/${c.id}`}
                  className="rounded-full border border-luxury-bronze/40 px-3 py-1 text-xs text-luxury-cream/70 transition hover:border-luxury-gold/60 hover:text-luxury-gold"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            {published.length === 0 ? (
              <div className="rounded-lg border border-luxury-bronze/30 bg-luxury-ink/40 p-12 text-center text-luxury-cream/60">
                아직 발행된 글이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {published.map((p) => (
                  <BlogCard key={p.id} post={p} category={categoryMap.get(p.categoryId)} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
