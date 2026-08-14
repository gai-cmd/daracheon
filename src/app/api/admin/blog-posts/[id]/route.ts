import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readData } from '@/lib/db';
import type { AdminUser } from '@/lib/admin-users';
import { readPosts, readPostsForWrite, writePosts } from '@/lib/blog/store';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import { type BlogPost, type BlogPostStatus } from '@/types/blog';
import { slugify, uniqueSlug } from '@/lib/blog/slug';
import { estimateReadingTime, extractPlainText, sanitizeBlogHtml } from '@/lib/blog/sanitize';

export const dynamic = 'force-dynamic';

function revalidateBlog(slug?: string, prevSlug?: string, categoryId?: string) {
  // 발행·수정·삭제 즉시 sitemap 재생성 (Google sitemap ping 폐기 대응).
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog', 'layout');
  if (slug) revalidatePath(`/blog/${slug}`, 'layout');
  if (prevSlug && prevSlug !== slug) revalidatePath(`/blog/${prevSlug}`, 'layout');
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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const posts = await readPosts();
    const post = posts.find((p) => p.id === id || p.slug === id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: '해당 글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('[Admin BlogPosts] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const posts = await readPostsForWrite();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: '해당 글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const prev = posts[idx];
    const now = new Date().toISOString();

    // 작성자 귀속 규칙: 글은 여러 사람이 쓰므로 저장자(검수자)를 자동 귀속하지
    // 않는다. body.authorEmail 로 명시 지정된 등록 관리자에게만 귀속을 바꾼다.
    //  - 미전송(undefined): 기존 귀속 유지
    //  - 빈 문자열: 브랜드(대라천)로 되돌림
    //  - 등록 관리자 이메일: 그 관리자에게 귀속 (미등록 이메일은 무시)
    let nextAuthor = prev.author;
    let nextAuthorEmail = prev.authorEmail;
    if (typeof body?.authorEmail === 'string') {
      const requested = body.authorEmail.trim().toLowerCase();
      if (!requested) {
        nextAuthor = '대라천';
        nextAuthorEmail = undefined;
      } else if (requested !== prev.authorEmail) {
        const admins = await readData<AdminUser>('admin-users');
        const match = admins.find((u) => u.email === requested);
        if (match) {
          nextAuthor = match.displayName?.trim() || match.email.split('@')[0];
          nextAuthorEmail = match.email;
        }
      }
    }

    // Slug 처리 — 사용자가 명시적으로 바꿨거나, 제목이 바뀌어 자동 갱신 요청한 경우만 변경.
    let nextSlug = prev.slug;
    if (typeof body?.slug === 'string' && body.slug.trim()) {
      const candidate = slugify(body.slug.trim());
      if (candidate !== prev.slug) {
        nextSlug = uniqueSlug(
          candidate,
          posts.filter((p) => p.id !== id).map((p) => p.slug)
        );
      }
    }

    const status = normalizeStatus(body?.status ?? prev.status);
    const rawContent = typeof body?.content === 'string' ? body.content : prev.content;
    const sanitizedContent = sanitizeBlogHtml(rawContent);
    const autoExcerpt = extractPlainText(sanitizedContent, 240);
    const excerpt =
      typeof body?.excerpt === 'string' && body.excerpt.trim()
        ? body.excerpt.trim().slice(0, 240)
        : autoExcerpt;

    const next: BlogPost = {
      ...prev,
      slug: nextSlug,
      title: typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : prev.title,
      excerpt,
      content: sanitizedContent,
      contentJson: body?.contentJson ?? prev.contentJson,
      coverImage: typeof body?.coverImage === 'string' ? body.coverImage : prev.coverImage,
      categoryId: typeof body?.categoryId === 'string' && body.categoryId ? body.categoryId : prev.categoryId,
      tags: body?.tags === undefined ? prev.tags : normalizeTags(body.tags),
      author: nextAuthor,
      authorEmail: nextAuthorEmail,
      status,
      publishedAt:
        status === 'published' ? prev.publishedAt ?? now : prev.publishedAt,
      updatedAt: now,
      readingTime: estimateReadingTime(sanitizedContent),
      seoTitle: typeof body?.seoTitle === 'string' ? body.seoTitle.trim() || undefined : prev.seoTitle,
      seoDescription:
        typeof body?.seoDescription === 'string'
          ? body.seoDescription.trim() || undefined
          : prev.seoDescription,
      seoKeywords: Array.isArray(body?.seoKeywords)
        ? body.seoKeywords.filter((k: unknown): k is string => typeof k === 'string')
        : prev.seoKeywords,
      ogImage: typeof body?.ogImage === 'string' ? body.ogImage : prev.ogImage,
      reviewed:
        typeof body?.reviewed === 'boolean' ? body.reviewed : prev.reviewed,
    };
    posts[idx] = next;
    await writePosts(posts, { upsertIds: [next.id] });
    revalidateBlog(next.slug, prev.slug, next.categoryId);
    // 상태 전환을 summary 에 명시 — 발행 글이 초안으로 내려간 시점을 audit 만으로
    // 추적 가능하게 (2026-08-14 무경고 발행취소 사고의 포렌식 공백 해소).
    const statusNote =
      prev.status !== next.status
        ? ` (${prev.status === 'published' ? '발행→초안' : '초안→발행'})`
        : '';
    await logAdmin('blog', 'update', {
      targetId: next.id,
      summary: `블로그 글 수정: ${next.title}${statusNote}`,
    });

    return NextResponse.json({ success: true, post: next });
  } catch (error) {
    console.error('[Admin BlogPosts] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const posts = await readPostsForWrite();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: '해당 글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    const snapId = await snapshotBeforeDestructive(undefined, `blog-posts delete ${id}`);
    const removed = posts.splice(idx, 1)[0];
    // 삭제 id 는 removedIds 로 명시 — merge/DELETE 대상 지정.
    await writePosts(posts, { removedIds: [id] });
    revalidateBlog(removed.slug, undefined, removed.categoryId);
    await logAdmin('blog', 'delete', {
      targetId: id,
      summary: `블로그 글 삭제: ${removed.title}`,
      meta: snapId ? { preSnapshot: snapId } : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin BlogPosts] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
