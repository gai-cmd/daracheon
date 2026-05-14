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
import BlogCard from '../BlogCard';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

/**
 * Vercel Node 런타임의 small-ICU 빌드는 toLocaleDateString('ko-KR', { month: 'long' })
 * 같은 long-form 옵션을 만나면 RangeError 를 던져 페이지를 500 으로 죽인다.
 * 안전하게 ISO 문자열을 직접 파싱해서 한국어 포맷으로 반환.
 */
function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

async function loadPost(slug: string) {
  const posts = await readDataSafe<BlogPost>(BLOG_POSTS_FILE);
  return posts.find((p) => p.slug === slug && p.status === 'published') ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: '글을 찾을 수 없습니다 — 대라천 블로그' };

  const title = post.seoTitle ?? `${post.title} — 대라천 블로그`;
  const description = post.seoDescription ?? post.excerpt;
  const image = post.ogImage ?? post.coverImage ?? '/opengraph-image.jpg';

  return {
    title,
    description,
    keywords: post.seoKeywords ?? post.tags,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: '대라천 ZOEL LIFE',
      locale: 'ko_KR',
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: image ? [{ url: image, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

// 임시 디버그 래퍼 — SSR 에서 던지는 진짜 에러를 화면에 노출시켜 원인 파악.
// 원인 잡으면 제거.
export default async function BlogPostPageWrapper({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    return await BlogPostPage({ params });
  } catch (err) {
    // Next.js 의 notFound()/redirect() 는 내부적으로 throw 하는데, 그 에러의
    // digest 가 'NEXT_NOT_FOUND' / 'NEXT_REDIRECT' 로 시작한다. 이 둘은 그대로
    // 다시 던져서 Next 가 정상 처리하게 둔다.
    const digest = (err as { digest?: string })?.digest ?? '';
    if (digest.startsWith('NEXT_')) throw err;
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const stack = err instanceof Error ? err.stack ?? '' : '';
    return (
      <main style={{ padding: 24, fontFamily: 'monospace', background: '#fff', color: '#900', whiteSpace: 'pre-wrap' }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>[DEBUG] Blog detail render error</h1>
        <div style={{ marginBottom: 12 }}><strong>{msg}</strong></div>
        <pre style={{ fontSize: 12, color: '#444' }}>{stack}</pre>
      </main>
    );
  }
}

async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, posts, categories] = await Promise.all([
    loadPost(slug),
    readDataSafe<BlogPost>(BLOG_POSTS_FILE),
    readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);
  if (!post) notFound();

  const category = categories.find((c) => c.id === post.categoryId);
  // 저장 시점(admin POST/PUT)에 이미 sanitizeBlogHtml 을 거쳐 DB 에 들어가므로
  // SSR 에서 재정제 안 함. isomorphic-dompurify 는 Vercel Node 런타임 첫 로드 시
  // jsdom 초기화 중 throw 하는 사례가 있어 모듈 import 자체가 라우트를 죽임 —
  // 정제는 어드민 쓰기 경로에 한 번만 위치시키고 공개 페이지는 신뢰한다.
  const cleanHtml = post.content;

  const related = posts
    .filter(
      (p) =>
        p.status === 'published' && p.id !== post.id && p.categoryId === post.categoryId
    )
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    )
    .slice(0, 3);

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ?? post.ogImage,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: '대라천 ZOEL LIFE',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    keywords: (post.seoKeywords ?? post.tags).join(', '),
    articleSection: category?.name,
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '블로그', item: `${SITE_URL}/blog` },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: `${SITE_URL}/blog/category/${category.id}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: post.title,
              item: `${SITE_URL}/blog/${post.slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: post.title,
              item: `${SITE_URL}/blog/${post.slug}`,
            },
          ]),
    ],
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <>
      <JsonLd data={postJsonLd} />
      <JsonLd data={breadcrumb} />

      <main className="min-h-screen bg-luxury-black text-luxury-cream">
        {/* Hero */}
        <header className="border-b border-luxury-bronze/20 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-luxury-gold">
              <Link href="/blog" className="hover:underline">
                블로그
              </Link>
              {category && (
                <>
                  <span className="opacity-40">›</span>
                  <Link href={`/blog/category/${category.id}`} className="hover:underline">
                    {category.name}
                  </Link>
                </>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-base text-luxury-cream/70 md:text-lg">{post.excerpt}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-luxury-cream/60">
              <span>{post.author}</span>
              <span className="opacity-40">·</span>
              <time dateTime={post.publishedAt ?? post.createdAt}>
                {formatKoreanDate(post.publishedAt ?? post.createdAt)}
              </time>
              {post.readingTime && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{post.readingTime}분 읽기</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Cover */}
        {post.coverImage && (
          <div className="border-b border-luxury-bronze/20">
            <div className="mx-auto max-w-4xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <article className="px-4 py-12 md:py-16">
          <div
            className="mx-auto max-w-3xl prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-headings:text-luxury-cream prose-a:text-luxury-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-luxury-cream prose-blockquote:border-l-luxury-gold prose-blockquote:text-luxury-cream/80 prose-code:text-luxury-gold prose-img:rounded-lg prose-img:my-6"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />

          {post.tags.length > 0 && (
            <div className="mx-auto mt-10 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-luxury-bronze/40 px-3 py-1 text-xs text-luxury-cream/70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-luxury-bronze/20 bg-luxury-ink/30 px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-6 text-xl font-semibold text-luxury-cream md:text-2xl">
                관련 글
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {related.map((p) => (
                  <BlogCard key={p.id} post={p} category={categoryMap.get(p.categoryId)} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
