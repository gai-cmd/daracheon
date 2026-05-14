import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/ui/JsonLd';
import { readDataSafe } from '@/lib/db';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import BlogCard from '../../BlogCard';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const categories = await readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE);
  const category = categories.find((c) => c.id === id);
  if (!category) {
    return { title: '카테고리를 찾을 수 없습니다 — 대라천 블로그' };
  }
  const title = `${category.name} — 대라천 블로그`;
  const description =
    category.description ?? `대라천 블로그 ${category.name} 카테고리의 글 모음.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/category/${category.id}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/blog/category/${category.id}`,
      siteName: '대라천 ZOEL LIFE',
      locale: 'ko_KR',
      title,
      description,
    },
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [posts, categories] = await Promise.all([
    readDataSafe<BlogPost>(BLOG_POSTS_FILE),
    readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const filtered = posts
    .filter((p) => p.status === 'published' && p.categoryId === id)
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    );

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '블로그', item: `${SITE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${SITE_URL}/blog/category/${category.id}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <main className="min-h-screen bg-luxury-black text-luxury-cream">
        <section className="border-b border-luxury-bronze/20 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <Link href="/blog" className="text-xs uppercase tracking-[0.3em] text-luxury-gold">
              ← 블로그
            </Link>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-sm text-luxury-cream/70">{category.description}</p>
            )}
          </div>
        </section>

        <nav className="border-b border-luxury-bronze/20 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-luxury-bronze/40 px-3 py-1 text-xs text-luxury-cream/70 transition hover:border-luxury-gold/60 hover:text-luxury-gold"
            >
              전체
            </Link>
            {sortedCategories.map((c) => (
              <Link
                key={c.id}
                href={`/blog/category/${c.id}`}
                className={[
                  'rounded-full border px-3 py-1 text-xs transition',
                  c.id === category.id
                    ? 'border-luxury-gold/60 bg-luxury-gold/10 text-luxury-gold'
                    : 'border-luxury-bronze/40 text-luxury-cream/70 hover:border-luxury-gold/60 hover:text-luxury-gold',
                ].join(' ')}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>

        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-luxury-bronze/30 bg-luxury-ink/40 p-12 text-center text-luxury-cream/60">
                이 카테고리에 아직 글이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
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
