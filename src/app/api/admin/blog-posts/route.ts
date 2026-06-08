import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  BLOG_UNCATEGORIZED_ID,
  type BlogCategory,
  type BlogPost,
  type BlogPostStatus,
} from '@/types/blog';
import { generateBlogId, slugify, uniqueSlug } from '@/lib/blog/slug';
import { estimateReadingTime, extractPlainText, sanitizeBlogHtml } from '@/lib/blog/sanitize';

export const dynamic = 'force-dynamic';

function revalidateBlog(slug?: string, categoryId?: string) {
  revalidatePath('/blog', 'layout');
  if (slug) revalidatePath(`/blog/${slug}`, 'layout');
  if (categoryId) revalidatePath(`/blog/category/${categoryId}`, 'layout');
  revalidatePath('/', 'layout');
}

function normalizeStatus(raw: unknown): BlogPostStatus {
  return raw === 'published' ? 'published' : 'draft';
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const q = url.searchParams.get('q')?.toLowerCase();

    let posts = await readDataUncached<BlogPost>(BLOG_POSTS_FILE);
    if (status === 'draft' || status === 'published') {
      posts = posts.filter((p) => p.status === status);
    }
    if (categoryId) {
      posts = posts.filter((p) => p.categoryId === categoryId);
    }
    if (q) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    posts.sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));

    const stats = {
      total: posts.length,
      published: posts.filter((p) => p.status === 'published').length,
      drafts: posts.filter((p) => p.status === 'draft').length,
    };
    return NextResponse.json({ posts, stats });
  } catch (error) {
    console.error('[Admin BlogPosts] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json(
        { success: false, message: '제목은 필수입니다.' },
        { status: 400 }
      );
    }

    const categories = await readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
    const posts = await readDataForWrite<BlogPost>(BLOG_POSTS_FILE);
    const categoryIdRaw = typeof body?.categoryId === 'string' ? body.categoryId : '';
    const categoryId =
      categoryIdRaw && categories.some((c) => c.id === categoryIdRaw)
        ? categoryIdRaw
        : categories[0]?.id ?? BLOG_UNCATEGORIZED_ID;

    // categories 가 비어 있고 fallback 으로 uncategorized 가 선택됐다면
    // FK 무결성을 위해 카테고리 객체도 함께 생성한다. 안 그러면 카테고리
    // 페이지와 카테고리 표시 부분이 깨진다.
    if (categoryId === BLOG_UNCATEGORIZED_ID && !categories.some((c) => c.id === BLOG_UNCATEGORIZED_ID)) {
      const seedNow = new Date().toISOString();
      categories.push({
        id: BLOG_UNCATEGORIZED_ID,
        name: '미분류',
        order: categories.length,
        createdAt: seedNow,
        updatedAt: seedNow,
      });
      await writeDataMerged(BLOG_CATEGORIES_FILE, categories);
    }

    const slugBase =
      typeof body?.slug === 'string' && body.slug.trim() ? slugify(body.slug.trim()) : slugify(title);
    const slug = uniqueSlug(slugBase, posts.map((p) => p.slug));

    const status = normalizeStatus(body?.status);
    const now = new Date().toISOString();
    const sanitizedContent = sanitizeBlogHtml(typeof body?.content === 'string' ? body.content : '');
    const autoExcerpt = extractPlainText(sanitizedContent, 240);
    const excerpt =
      typeof body?.excerpt === 'string' && body.excerpt.trim()
        ? body.excerpt.trim().slice(0, 240)
        : autoExcerpt;

    const post: BlogPost = {
      id: generateBlogId(),
      slug,
      title,
      excerpt,
      content: sanitizedContent,
      contentJson: body?.contentJson ?? undefined,
      coverImage: typeof body?.coverImage === 'string' ? body.coverImage : undefined,
      categoryId,
      tags: normalizeTags(body?.tags),
      author: typeof body?.author === 'string' && body.author.trim() ? body.author.trim() : '대라천',
      status,
      publishedAt: status === 'published' ? now : undefined,
      createdAt: now,
      updatedAt: now,
      readingTime: estimateReadingTime(sanitizedContent),
      seoTitle: typeof body?.seoTitle === 'string' ? body.seoTitle.trim() || undefined : undefined,
      seoDescription:
        typeof body?.seoDescription === 'string' ? body.seoDescription.trim() || undefined : undefined,
      seoKeywords: Array.isArray(body?.seoKeywords)
        ? body.seoKeywords.filter((k: unknown): k is string => typeof k === 'string')
        : undefined,
      ogImage: typeof body?.ogImage === 'string' ? body.ogImage : undefined,
      reviewed: typeof body?.reviewed === 'boolean' ? body.reviewed : false,
      viewCount: 0,
    };

    posts.push(post);
    await writeDataMerged(BLOG_POSTS_FILE, posts);
    revalidateBlog(post.slug, post.categoryId);
    await logAdmin('blog', 'create', {
      targetId: post.id,
      summary: `블로그 글 작성: ${post.title} (${post.status})`,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('[Admin BlogPosts] POST Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/** Bulk status change: PATCH { ids: string[], status: 'draft'|'published' } */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ids 배열은 필수입니다.' },
        { status: 400 }
      );
    }
    const status = normalizeStatus(body?.status);
    const idSet = new Set<string>(body.ids as string[]);
    const posts = await readDataForWrite<BlogPost>(BLOG_POSTS_FILE);
    const now = new Date().toISOString();
    let updated = 0;
    for (const p of posts) {
      if (idSet.has(p.id) && p.status !== status) {
        p.status = status;
        p.updatedAt = now;
        if (status === 'published' && !p.publishedAt) p.publishedAt = now;
        updated++;
      }
    }
    if (updated > 0) {
      await writeDataMerged(BLOG_POSTS_FILE, posts);
      revalidateBlog();
      await logAdmin('blog', 'bulk_update', {
        summary: `블로그 일괄 ${status === 'published' ? '발행' : '비공개'}: ${updated}건`,
        meta: { count: updated, status, ids: body.ids },
      });
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('[Admin BlogPosts] PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
