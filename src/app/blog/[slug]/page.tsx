import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/ui/JsonLd';
import { imageObject } from '@/lib/seo/image';
import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import { readDataSafe } from '@/lib/db';
import type { AdminUser } from '@/lib/admin-users';
import { normalizeArticleHtmlForDarkTheme } from '@/lib/blog/theme-normalize';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { type BlogCategory, type BlogPost } from '@/types/blog';
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

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Next.js delivers the dynamic segment percent-encoded (Korean slugs arrive
 * as `%EB%A9%B4…`), while stored slugs are native Hangul — decode before
 * matching or every non-ASCII slug 404s. Legacy posts keep Korean slugs;
 * new slugs are ASCII-only (see lib/blog/slug.ts).
 */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function loadPost(slug: string, allowDraft = false) {
  const posts = await readPostsSafe();
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
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
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
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const { preview } = await searchParams;
  const allowDraft = Boolean(preview) && (await isAdmin());
  const [post, posts, categories] = await Promise.all([
    loadPost(slug, allowDraft),
    readPostsSafe(),
    readCategoriesSafe(),
  ]);
  if (!post) notFound();
  const isDraftPreview = post.status !== 'published';

  const category = categories.find((c) => c.id === post.categoryId);
  // 저장 시점(admin POST/PUT)에 이미 sanitizeBlogHtml 을 거쳐 DB 에 들어가므로
  // SSR 에서 재정제 안 함. isomorphic-dompurify 는 Vercel Node 런타임 첫 로드 시
  // jsdom 초기화 중 throw 하는 사례가 있어 모듈 import 자체가 라우트를 죽임 —
  // 정제는 어드민 쓰기 경로에 한 번만 위치시키고 공개 페이지는 신뢰한다.
  // 본문 HTML 은 밝은 표면 전제의 인라인 색(밝은 배경·어두운 글자)을 지참한다.
  // 렌더 직전 명도 규칙으로 일괄 정규화 — 특정 hex 나열이 아니라 임의의 색을
  // 다크 표면 기준으로 판별하므로 새 콘텐츠에서도 재발하지 않는다.
  const cleanHtml = normalizeArticleHtmlForDarkTheme(post.content);

  // ── 사이드바·연결 탐색 데이터 ─────────────────────────────
  const published = posts
    .filter((p) => p.status === 'published')
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    );

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const categoryCounts = new Map<string, number>();
  for (const p of published) {
    categoryCounts.set(p.categoryId, (categoryCounts.get(p.categoryId) ?? 0) + 1);
  }

  // 인기 글: viewCount 우선, 동률(초기값 0)이면 최신순 폴백.
  const popular = published
    .filter((p) => p.id !== post.id)
    .sort(
      (a, b) =>
        (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    )
    .slice(0, 5);

  // 우측 레일 관련 글: 같은 카테고리 최신순.
  const relatedRail = published
    .filter((p) => p.id !== post.id && p.categoryId === post.categoryId)
    .slice(0, 5);

  // 하단 관련 글 카드 그리드 (기존 유지).
  const related = relatedRail.slice(0, 3);

  // 이전/다음 글 — 발행일 내림차순 목록 기준 (다음 = 더 최신, 이전 = 더 과거).
  const currentIdx = published.findIndex((p) => p.id === post.id);
  const newerPost = currentIdx > 0 ? published[currentIdx - 1] : null;
  const olderPost =
    currentIdx >= 0 && currentIdx < published.length - 1
      ? published[currentIdx + 1]
      : null;

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

  // 작성자 표시명: 귀속 이메일이 있으면 admin-users 의 최신 displayName(구글
  // 워크스페이스 한글 이름)을 우선한다 — 본인이 SSO 로 한 번 로그인하면 과거에
  // 귀속해 둔 글의 이름도 재저장 없이 자동 갱신된다.
  const admins = post.authorEmail ? await readDataSafe<AdminUser>('admin-users') : [];
  const authorName =
    admins.find((u) => u.email === post.authorEmail)?.displayName?.trim() || post.author;

  // 작성자가 브랜드명(대라천/ZOEL)이면 검증 가능한 Organization 엔티티로 귀속 —
  // YMYL(건강) 주제에서 실명 없는 Person 방출보다 신뢰신호가 강하다. 개인명이면 Person.
  const isBrandAuthor = !authorName || /대라천|zoel/i.test(authorName);
  const authorEntity = isBrandAuthor
    ? { '@id': `${SITE_URL}/#organization` }
    : {
        '@type': 'Person',
        name: authorName,
        ...(post.authorEmail ? { email: post.authorEmail } : {}),
      };

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    // 문자열 URL 대신 완전한 ImageObject — GSC 「이미지 메타데이터」가 요구하는
    // creator/creditText/copyrightNotice/license/acquireLicensePage 를 함께 방출.
    image: imageObject({
      url: post.coverImage ?? post.ogImage ?? `${SITE_URL}/opengraph-image.jpg`,
      name: post.title,
      caption: post.excerpt || post.title,
      datePublished: post.publishedAt ?? post.createdAt,
    }),
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
        {/* Hero — 사이트 표준 셸(1440px)과 동일 폭·여백 */}
        <header className={styles.header}>
          <div className={styles.shell}>
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
            {/* 바이라인 — 제목 바로 아래 "이름 이메일". 이메일이 없으면 이름만. */}
            <div className={styles.byline}>
              <span className={styles.bylineName}>{authorName}</span>
              {post.authorEmail && (
                <a className={styles.bylineEmail} href={`mailto:${post.authorEmail}`}>
                  {post.authorEmail}
                </a>
              )}
            </div>
            {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
            <div className={styles.meta}>
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

        {/* 2단 레이아웃: 좌 분류(상)·인기/관련(하) / 우 본문 — 본문 폭 최대화 */}
        <div className={styles.shell}>
          <div className={styles.layout}>
            {/* Left rail 상단 — 카테고리 */}
            <aside className={styles.leftRail} aria-label="블로그 카테고리">
              <nav className={styles.railBox}>
                <h2 className={styles.railHeading}>분류</h2>
                <ul className={styles.catList}>
                  <li>
                    <Link href="/blog" className={styles.catLink}>
                      <span>전체</span>
                      <span className={styles.catCount}>{published.length}</span>
                    </Link>
                  </li>
                  {sortedCategories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/blog/category/${c.id}`}
                        className={`${styles.catLink} ${
                          c.id === post.categoryId ? styles.catActive : ''
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className={styles.catCount}>
                          {categoryCounts.get(c.id) ?? 0}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Center — 커버 + 본문 + 태그 + 이전/다음 */}
            <div className={styles.main}>
              {post.coverImage && (
                <div className={styles.cover}>
                  {/* 커버는 글의 LCP 요소 — 우선 로드 힌트를 준다. (CLS 는 .cover img 의
                      aspect-ratio 16/9 로 이미 예약됨) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              )}

              {/* data-reading-surface: dark-theme.css 의 전역 !important 규칙
                  (table/th/td 아이보리 글자 강제 등)을 차단하는 제외 마커.
                  본문 표면은 다크지만, 콘텐츠가 인라인 밝은 배경 박스를 지참하는
                  경우가 있어 표 색상은 모듈 CSS 가 문맥별로 직접 관리한다. */}
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

              {(newerPost || olderPost) && (
                <nav className={styles.pnNav} aria-label="이전 글 / 다음 글">
                  {olderPost ? (
                    <Link href={`/blog/${olderPost.slug}`} className={styles.pnCard}>
                      <span className={styles.pnLabel}>← 이전 글</span>
                      <span className={styles.pnTitle}>{olderPost.title}</span>
                    </Link>
                  ) : (
                    <span className={styles.pnEmpty} />
                  )}
                  {newerPost ? (
                    <Link
                      href={`/blog/${newerPost.slug}`}
                      className={`${styles.pnCard} ${styles.pnNext}`}
                    >
                      <span className={styles.pnLabel}>다음 글 →</span>
                      <span className={styles.pnTitle}>{newerPost.title}</span>
                    </Link>
                  ) : (
                    <span className={styles.pnEmpty} />
                  )}
                </nav>
              )}
            </div>

            {/* Left rail 하단 — 인기 글 · 관련 글 (모바일에서는 본문 아래로 흐른다) */}
            <aside className={styles.sideRail} aria-label="인기 글과 관련 글">
              <div className={styles.railSticky}>
                {popular.length > 0 && (
                  <section className={styles.railBox}>
                    <h2 className={styles.railHeading}>인기 글</h2>
                    <ul className={styles.postList}>
                      {popular.map((p, i) => (
                        <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className={styles.postItem}>
                            <span className={styles.rank}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className={styles.postText}>
                              <span className={styles.postTitle}>{p.title}</span>
                              <span className={styles.postDate}>
                                {formatShortDate(p.publishedAt ?? p.createdAt)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {relatedRail.length > 0 && (
                  <section className={styles.railBox}>
                    <h2 className={styles.railHeading}>
                      관련 글{category ? ` — ${category.name}` : ''}
                    </h2>
                    <ul className={styles.postList}>
                      {relatedRail.map((p) => (
                        <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className={styles.postItem}>
                            {p.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.coverImage}
                                alt=""
                                className={styles.thumb}
                                loading="lazy"
                              />
                            ) : (
                              <span className={styles.thumbFallback} />
                            )}
                            <span className={styles.postText}>
                              <span className={styles.postTitle}>{p.title}</span>
                              <span className={styles.postDate}>
                                {formatShortDate(p.publishedAt ?? p.createdAt)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Related — 하단 카드 그리드 */}
        {related.length > 0 && (
          <section className={styles.related}>
            <div className={styles.shell}>
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
