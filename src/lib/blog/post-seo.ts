import type { BlogPost } from '@/types/blog';
import { isOptimizableBlobImage } from './image-optimize';
import type { BlogPostListItem } from './store';

/**
 * 블로그 템플릿 SEO 순수 로직 — 글 제목/OG 제목, 관련 글 선택, 카테고리 메타 설명.
 * 페이지 컴포넌트에서 분리해 단위 테스트로 고정한다.
 */

// 네이버 검색엔진 가이드라인: OG 제목 ≤40자 (루트 layout 의 OG_TITLE_MAX 와 같은 값).
export const BLOG_OG_TITLE_MAX = 40;

/**
 * 글 <title> 본문. 루트 layout 의 title.template("%s | 대라천 '참'침향")이 브랜드를
 * 덧붙이므로 여기서는 브랜드 접미사를 붙이지 않는다 — 브랜드가 두 번 나오지 않게.
 */
export function blogPostTitle(post: Pick<BlogPost, 'title' | 'seoTitle'>): string {
  return post.seoTitle?.trim() || post.title;
}

/**
 * generateMetadata 의 title 값. 제목에 이미 '대라천' 이 있으면 absolute 로 내보내
 * 루트 template 의 브랜드 접미사가 다시 붙지 않게 한다.
 */
export function blogPostMetaTitle(
  post: Pick<BlogPost, 'title' | 'seoTitle'>,
): string | { absolute: string } {
  const title = blogPostTitle(post);
  return title.includes('대라천') ? { absolute: title } : title;
}

/** og:title / twitter:title — 템플릿이 적용되지 않으므로 40자 이내로 자른다. */
export function blogOgTitle(title: string, max = BLOG_OG_TITLE_MAX): string {
  const chars = Array.from(title.trim());
  if (chars.length <= max) return chars.join('');
  return `${chars.slice(0, max - 1).join('').trimEnd()}…`;
}

function postTime(p: Pick<BlogPost, 'publishedAt' | 'createdAt'>): string {
  return p.publishedAt ?? p.createdAt;
}

/**
 * 관련 글 선택: 태그를 많이 공유할수록 앞 → 같은 카테고리 → 최신순. 현재 글은 제외.
 * 최신순만 쓰면 새 글만 반복 노출되므로, 태그 기준으로 오래된 글에도 내부 링크가 간다.
 */
export function selectRelatedPosts<T extends BlogPostListItem>(
  current: BlogPostListItem,
  candidates: T[],
  limit: number,
): T[] {
  const tags = new Set(current.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
  const shared = (p: T) =>
    new Set(p.tags.map((t) => t.trim().toLowerCase()).filter((t) => tags.has(t))).size;
  return candidates
    .filter((p) => p.id !== current.id)
    .map((p) => ({ p, s: shared(p), c: p.categoryId === current.categoryId ? 1 : 0 }))
    .sort((a, b) => b.s - a.s || b.c - a.c || postTime(b.p).localeCompare(postTime(a.p)))
    .slice(0, limit)
    .map((x) => x.p);
}

/** 우측 레일 관련 글이 같은 카테고리만으로 이 수에 못 미치면 다른 카테고리 글로 채운다. */
export const RELATED_RAIL_MIN_SAME_CATEGORY = 3;

/**
 * 우측 레일 관련 글. 같은 카테고리 글(태그 공유 → 최신순)을 먼저 쓰고, 그것이
 * RELATED_RAIL_MIN_SAME_CATEGORY 개 미만이면 나머지 발행 글에서 태그 공유가 많은 순
 * (공유 태그가 없으면 최신순)으로 limit 까지 채운다 — 글이 적은 카테고리의 레일이
 * 비거나 한두 개로 끝나 내부 링크가 끊기는 것을 막는다.
 * crossCategory 는 다른 카테고리 글이 섞였는지 — 레일 제목에서 카테고리명을 뗄지 판단용.
 */
export function selectRelatedRail<T extends BlogPostListItem>(
  current: BlogPostListItem,
  published: T[],
  limit: number,
  minSameCategory = RELATED_RAIL_MIN_SAME_CATEGORY,
): { posts: T[]; crossCategory: boolean } {
  const same = selectRelatedPosts(
    current,
    published.filter((p) => p.categoryId === current.categoryId),
    limit,
  );
  if (same.length >= Math.min(minSameCategory, limit)) return { posts: same, crossCategory: false };
  const picked = new Set(same.map((p) => p.id));
  const topUp = selectRelatedPosts(
    current,
    published.filter((p) => p.categoryId !== current.categoryId && !picked.has(p.id)),
    limit - same.length,
  );
  return { posts: [...same, ...topUp], crossCategory: topUp.length > 0 };
}

/** 32비트 FNV-1a — 슬러그별로 고정된(요청마다 바뀌지 않는) 회전 값을 얻는 용도. */
export function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 인기 글: viewCount 내림차순. 조회수가 같은 글 묶음(대부분 초기값 0)은 최신순으로 늘어놓은 뒤
 * 현재 글 슬러그의 해시만큼 회전한다 — 같은 글에서는 항상 같은 목록(결정적)이지만 글마다
 * 다른 오래된 글이 노출돼 최신 글 5개만 반복 링크되지 않는다. 조회수 자체는 건드리지 않는다.
 */
export function selectPopularPosts<T extends BlogPostListItem>(
  current: Pick<BlogPost, 'id' | 'slug'>,
  published: T[],
  limit: number,
): T[] {
  const views = (p: T) => p.viewCount ?? 0;
  const ordered = published
    .filter((p) => p.id !== current.id)
    .sort((a, b) => views(b) - views(a) || postTime(b).localeCompare(postTime(a)));
  const shift = stableHash(current.slug);
  const out: T[] = [];
  for (let i = 0; i < ordered.length && out.length < limit; ) {
    let j = i;
    while (j < ordered.length && views(ordered[j]) === views(ordered[i])) j++;
    const group = ordered.slice(i, j);
    const k = shift % group.length;
    out.push(...group.slice(k), ...group.slice(0, k));
    i = j;
  }
  return out.slice(0, limit);
}

/**
 * 절대 URL 의 호스트가 목록의 도메인과 같거나 그 하위 도메인인지. 문자열 포함 비교는
 * 'nature.com' 이 'signature.com' 이나 쿼리스트링에도 걸리므로 호스트 단위로 본다.
 * 상대 경로·잘못된 URL 은 false.
 */
export function urlMatchesHost(url: string, hosts: readonly string[]): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

export interface TopicHubLink {
  href: string;
  label: string;
}

// 라벨 = 각 허브 페이지 metadata 의 og:title (src/app/{about-agarwood,vietnam-agarwood,agarwood-benefits}/page.tsx).
const HUB_ABOUT: TopicHubLink = { href: '/about-agarwood', label: '침향이란? 효능·학명·산지 총정리' };
const HUB_VIETNAM: TopicHubLink = { href: '/vietnam-agarwood', label: '베트남 침향 — 역사 속 산지·학명·직영 농장' };
const HUB_BENEFITS: TopicHubLink = { href: '/agarwood-benefits', label: '침향 효능 총정리 — 연구와 전통 문헌' };

const CATEGORY_HUBS: Record<string, TopicHubLink[]> = {
  'agarwood-science': [HUB_BENEFITS],
  'agarwood-life': [HUB_BENEFITS],
  'agarwood-basics': [HUB_ABOUT, HUB_VIETNAM],
  'real-agarwood': [HUB_ABOUT, HUB_VIETNAM],
  'daeracheon-farm': [HUB_VIETNAM],
  'agarwood-history': [HUB_ABOUT],
};

/** 글 카테고리 → 본문 밖 '관련 주제' 허브 링크. 매핑에 없는 카테고리(브랜드 소식 등)는 침향이란? 허브. */
export function topicHubsForCategory(categoryId: string): TopicHubLink[] {
  return CATEGORY_HUBS[categoryId] ?? [HUB_ABOUT];
}

// 카테고리 설명이 이보다 짧으면 메타 설명을 글 제목으로 조합한다.
const CATEGORY_DESC_MIN = 40;
const CATEGORY_DESC_MAX = 100;

/**
 * 카테고리 메타 설명. 어드민 설명이 충분하면 그대로, 비었거나 짧으면
 * 최신 글 제목 몇 개로 100자 이내 설명을 만든다 (글 수 같은 숫자는 쓰지 않는다).
 * 발행 글이 없으면 기존 기본 문구.
 */
export function categoryMetaDescription(
  category: { name: string; description?: string },
  recentTitles: string[],
): string {
  const own = category.description?.trim();
  if (own && own.length >= CATEGORY_DESC_MIN) return own;
  const fallback = own || `대라천 블로그 ${category.name} 카테고리의 글 모음.`;
  const titles = recentTitles.map((t) => t.trim()).filter(Boolean);
  if (titles.length === 0) return fallback;

  const head = `대라천 블로그 ${category.name}: `;
  const tail = ' 등을 다룹니다.';
  const picked: string[] = [];
  for (const t of titles) {
    const next = `${head}${[...picked, t].join(', ')}${tail}`;
    if (Array.from(next).length > CATEGORY_DESC_MAX) break;
    picked.push(t);
  }
  if (picked.length === 0) {
    // 첫 제목만으로도 넘치면 잘라서 한 편만 싣는다.
    const room = CATEGORY_DESC_MAX - Array.from(head + tail).length - 1;
    picked.push(`${Array.from(titles[0]).slice(0, Math.max(0, room)).join('').trimEnd()}…`);
  }
  return `${head}${picked.join(', ')}${tail}`;
}

/**
 * 고정 슬러그 목록으로 "더 읽어보기" 링크를 고른다 — 지정 순서 유지, 발행 글만.
 * 제목은 저장된 글 제목을 그대로 쓰고, 없는(삭제·비공개) 슬러그는 건너뛴다.
 */
export function pickPostsBySlug(
  posts: Pick<BlogPost, 'slug' | 'title' | 'status'>[],
  slugs: readonly string[],
): { slug: string; title: string }[] {
  return slugs.flatMap((slug) => {
    const p = posts.find((x) => x.slug === slug && x.status === 'published');
    return p && p.title.trim() ? [{ slug: p.slug, title: p.title.trim() }] : [];
  });
}

/** 사이트 기본 OG 이미지 — public/opengraph-image.jpg (app/layout.tsx 와 같은 파일). */
export const DEFAULT_OG_IMAGE = '/opengraph-image.jpg';

/** OG 로 내보낼 수 있는 커버인지 — 우리 Blob 래스터 이미지 또는 /public 상대 경로만 (외부 CDN·SVG 제외). */
function isOwnOgImage(url: string | undefined): url is string {
  if (!url) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return !/\.svg(\?|$)/i.test(url);
  return isOptimizableBlobImage(url);
}

/**
 * 카테고리 OG 이미지 — 그 카테고리 발행 글 중 가장 최신 글의 커버(우리 인프라 이미지만).
 * 최신 글에 쓸 수 있는 커버가 없으면 그다음 최신 글로 내려가고, 하나도 없으면 사이트 기본 이미지.
 */
export function categoryOgImage(
  posts: Pick<BlogPost, 'status' | 'categoryId' | 'coverImage' | 'publishedAt' | 'createdAt'>[],
  categoryId: string,
): string {
  const newest = posts
    .filter((p) => p.status === 'published' && p.categoryId === categoryId && isOwnOgImage(p.coverImage))
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))[0];
  return newest?.coverImage ?? DEFAULT_OG_IMAGE;
}
