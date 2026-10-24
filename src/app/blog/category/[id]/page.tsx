import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import JsonLd from '@/components/ui/JsonLd';
import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import { type BlogCategory, type BlogPost } from '@/types/blog';
import { categoryMetaDescription, categoryOgImage } from '@/lib/blog/post-seo';
import BlogCard from '../../BlogCard';
import BlogPagination, { parseBlogPage } from '../../BlogPagination';

const SITE_URL = 'https://zoellife.com';
const POSTS_PER_PAGE = 12;

export const dynamic = 'force-dynamic';

// generateMetadata 와 페이지가 같은 요청에서 글·카테고리를 한 번만 읽도록 요청 단위로 묶는다.
const getPosts = cache(readPostsSafe);
const getCategories = cache(readCategoriesSafe);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = parseBlogPage((await searchParams).page);
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const category = categories.find((c) => c.id === id);
  if (!category) {
    return { title: '카테고리를 찾을 수 없습니다 — 대라천 블로그' };
  }
  // 발행 글이 0편인 카테고리는 '글이 없습니다' 안내뿐인 얇은 페이지 — 색인하지 않는다.
  // 링크는 따라가도록 follow 유지. sitemap 에서도 빠진다 (lib/blog/sitemap-dates).
  // 글 읽기가 실패하면 readPostsSafe 가 [] 를 돌려주므로, 글을 읽었을 때만 판정한다 —
  // 일시 장애로 모든 카테고리에 noindex 가 붙는 것을 막는다.
  const isEmpty =
    posts.length > 0 && !posts.some((p) => p.status === 'published' && p.categoryId === id);
  const pageSuffix = page > 1 ? ` — ${page}페이지` : '';
  const base = `${SITE_URL}/blog/category/${category.id}`;
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  const title = `${category.name} — 대라천 블로그${pageSuffix}`;
  // 어드민 설명이 비었거나 짧으면 최신 글 제목 몇 개로 메타 설명을 조합한다(화면 문구는 그대로).
  const recentTitles = posts
    .filter((p) => p.status === 'published' && p.categoryId === id)
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    )
    .slice(0, 5)
    .map((p) => p.title);
  const description = categoryMetaDescription(category, recentTitles);
  return {
    title,
    description,
    alternates: { canonical },
    ...(isEmpty ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: '대라천 ZOEL LIFE',
      locale: 'ko_KR',
      title,
      description,
      // 최신 글 커버(Blob·/public 만) — 없으면 사이트 기본 OG 이미지.
      images: [categoryOgImage(posts, id)],
    },
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const page = parseBlogPage((await searchParams).page);
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const filtered = posts
    .filter((p) => p.status === 'published' && p.categoryId === id)
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    );

  // /blog 목록과 동일한 12편/페이지 숫자 페이지네이션.
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  if (page > totalPages) notFound();
  const pagePosts = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  // 발행 글이 없는 카테고리는 탐색 줄에서 숨긴다(현재 카테고리는 활성 표시를 위해 유지).
  // 글 읽기 실패(readPostsSafe → [])면 숨기지 않는다 — 일시 장애 시 목록 소실 방지.
  const usedCategoryIds = new Set(
    posts.filter((p) => p.status === 'published').map((p) => p.categoryId)
  );
  const sortedCategories = [...categories]
    .filter((c) => usedCategoryIds.size === 0 || c.id === category.id || usedCategoryIds.has(c.id))
    .sort((a, b) => a.order - b.order);
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
        <section className="border-b border-luxury-bronze/20 px-7 py-16 lg:px-16 md:py-20">
          <div className="mx-auto max-w-[1312px]">
            <Link href="/blog" className="text-xs uppercase tracking-[0.3em] text-luxury-gold">
              ← 블로그
            </Link>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-sm text-luxury-cream/70">{category.description}</p>
            )}
          </div>
        </section>

        <nav className="border-b border-luxury-bronze/20 px-7 py-4 lg:px-16">
          <div className="mx-auto flex max-w-[1312px] flex-wrap items-center gap-2">
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

        <section className="px-7 py-12 lg:px-16">
          <div className="mx-auto max-w-[1312px]">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-luxury-bronze/30 bg-luxury-ink/40 p-12 text-center text-luxury-cream/60">
                이 카테고리에 아직 글이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pagePosts.map((p) => (
                  <BlogCard key={p.id} post={p} category={categoryMap.get(p.categoryId)} />
                ))}
              </div>
            )}
            <BlogPagination
              current={page}
              totalPages={totalPages}
              basePath={`/blog/category/${category.id}`}
            />
          </div>
        </section>
      </main>
    </>
  );
}
