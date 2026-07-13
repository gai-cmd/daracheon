import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/ui/JsonLd';
import { readDataSafe } from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import BlogCard from '../BlogCard';
import styles from './BlogArticle.module.css';

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

async function loadPost(slug: string, allowDraft = false) {
  const posts = await readDataSafe<BlogPost>(BLOG_POSTS_FILE);
  return (
    posts.find((p) => p.slug === slug && (allowDraft || p.status === 'published')) ?? null
  );
}

/** 관리자 세션이 유효할 때만 true — 초안 미리보기 게이트. */
async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await verifySessionToken(token)) !== null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const allowDraft = Boolean(preview) && (await isAdmin());
  const post = await loadPost(slug, allowDraft);
  if (!post) return { title: '글을 찾을 수 없습니다 — 대라천 블로그' };

  const title = post.seoTitle ?? `${post.title} — 대라천 블로그`;
  const description = post.seoDescription ?? post.excerpt;
  const image = post.ogImage ?? post.coverImage ?? '/opengraph-image.jpg';

  return {
    title,
    description,
    keywords: post.seoKeywords ?? post.tags,
    ...(allowDraft ? { robots: { index: false, follow: false } } : {}),
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

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const allowDraft = Boolean(preview) && (await isAdmin());
  const [post, posts, categories] = await Promise.all([
    loadPost(slug, allowDraft),
    readDataSafe<BlogPost>(BLOG_POSTS_FILE),
    readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);
  if (!post) notFound();
  const isDraftPreview = post.status !== 'published';

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

  // 본문에 인라인으로 박힌 1차 출처(논문·사전) 링크를 BlogPosting.citation 으로 승격.
  // 화이트리스트 호스트 + 실제 본문에 존재하는 URL 만 — 없는 인용은 만들지 않는다.
  const CITATION_HOSTS = [
    'doi.org',
    'koreascience.kr',
    'koreascience.or.kr',
    'kci.go.kr',
    'encykorea.aks.ac.kr',
    'cites.org',
  ];
  const citationUrls = Array.from(
    new Set(Array.from(cleanHtml.matchAll(/href=["']([^"']+)["']/g)).map((m) => m[1]))
  ).filter((u) => CITATION_HOSTS.some((h) => u.includes(h)));

  // 작성자가 브랜드명(대라천/ZOEL)이면 검증 가능한 Organization 엔티티로 귀속 —
  // YMYL(건강) 주제에서 실명 없는 Person 방출보다 신뢰신호가 강하다. 개인명이면 Person.
  const isBrandAuthor = !post.author || /대라천|zoel/i.test(post.author);
  const authorEntity = isBrandAuthor
    ? { '@id': `${SITE_URL}/#organization` }
    : { '@type': 'Person', name: post.author };

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ?? post.ogImage ?? `${SITE_URL}/opengraph-image.jpg`,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    author: authorEntity,
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    keywords: (post.seoKeywords ?? post.tags).join(', '),
    articleSection: category?.name,
    ...(citationUrls.length
      ? { citation: citationUrls.map((url) => ({ '@type': 'CreativeWork', url })) }
      : {}),
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

      {isDraftPreview && (
        <div
          style={{
            background: '#b88c2d',
            color: '#fff',
            textAlign: 'center',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          초안 미리보기 — 아직 발행되지 않은 글입니다. 관리자에게만 보이며 검색엔진에 노출되지 않습니다.
        </div>
      )}

      <article className={styles.page}>
        {/* Hero — Legal/Brand-Story 페이지와 동일 톤·여백 */}
        <header className={styles.header}>
          <div className={styles.inner}>
            <div className={styles.crumbs}>
              <Link href="/blog">BLOG</Link>
              {category && (
                <>
                  <span className={styles.sep}>›</span>
                  <Link href={`/blog/category/${category.id}`}>{category.name}</Link>
                </>
              )}
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
            <div className={styles.meta}>
              <span>{post.author}</span>
              <span className={styles.dot}>·</span>
              <time dateTime={post.publishedAt ?? post.createdAt}>
                {formatKoreanDate(post.publishedAt ?? post.createdAt)}
              </time>
              {/* 갱신일이 발행일과 다른 날이면 "수정" 표기 — 독자·크롤러가 최신성을 화면에서 확인. */}
              {post.updatedAt &&
                formatKoreanDate(post.updatedAt) !==
                  formatKoreanDate(post.publishedAt ?? post.createdAt) && (
                  <>
                    <span className={styles.dot}>·</span>
                    <span>
                      수정{' '}
                      <time dateTime={post.updatedAt}>{formatKoreanDate(post.updatedAt)}</time>
                    </span>
                  </>
                )}
              {post.readingTime && (
                <>
                  <span className={styles.dot}>·</span>
                  <span>{post.readingTime}분 읽기</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Cover */}
        {post.coverImage && (
          <div className={styles.cover}>
            <div className={styles.inner}>
              {/* 커버는 글의 LCP 요소 — 우선 로드 힌트를 준다. (CLS 는 .cover img 의
                  aspect-ratio 16/9 로 이미 예약됨) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt={post.title} fetchPriority="high" decoding="async" />
            </div>
          </div>
        )}

        {/* Body */}
        <section className={styles.body}>
          <div className={styles.inner}>
            {/* data-reading-surface: dark-theme.css 의 전역 !important 규칙
                (table/th/td 아이보리 글자 강제 등)이 밝은 리딩 카드 내부로
                새어 들어오지 않도록 제외 마커를 단다. */}
            <div
              className={styles.article}
              data-reading-surface
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />

            {post.tags.length > 0 && (
              <div className={styles.tags}>
                {post.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className={styles.related}>
            <div className={styles.inner}>
              <h2 className={styles.relatedHeading}>관련 글</h2>
              <div className={styles.relatedGrid}>
                {related.map((p) => (
                  <BlogCard key={p.id} post={p} category={categoryMap.get(p.categoryId)} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
