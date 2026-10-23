import type { BlogPost } from '@/types/blog';

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

/** og:title / twitter:title — 템플릿이 적용되지 않으므로 40자 이내로 자른다. */
export function blogOgTitle(title: string, max = BLOG_OG_TITLE_MAX): string {
  const chars = Array.from(title.trim());
  if (chars.length <= max) return chars.join('');
  return `${chars.slice(0, max - 1).join('').trimEnd()}…`;
}

function postTime(p: BlogPost): string {
  return p.publishedAt ?? p.createdAt;
}

/**
 * 관련 글 선택: 태그를 많이 공유할수록 앞 → 같은 카테고리 → 최신순. 현재 글은 제외.
 * 최신순만 쓰면 새 글만 반복 노출되므로, 태그 기준으로 오래된 글에도 내부 링크가 간다.
 */
export function selectRelatedPosts(
  current: BlogPost,
  candidates: BlogPost[],
  limit: number,
): BlogPost[] {
  const tags = new Set(current.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
  const shared = (p: BlogPost) =>
    new Set(p.tags.map((t) => t.trim().toLowerCase()).filter((t) => tags.has(t))).size;
  return candidates
    .filter((p) => p.id !== current.id)
    .map((p) => ({ p, s: shared(p), c: p.categoryId === current.categoryId ? 1 : 0 }))
    .sort((a, b) => b.s - a.s || b.c - a.c || postTime(b.p).localeCompare(postTime(a.p)))
    .slice(0, limit)
    .map((x) => x.p);
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
