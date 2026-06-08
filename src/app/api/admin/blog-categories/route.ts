import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  BLOG_UNCATEGORIZED_ID,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import { slugify } from '@/lib/blog/slug';

export const dynamic = 'force-dynamic';

function revalidateBlogPaths() {
  revalidatePath('/blog', 'layout');
  revalidatePath('/blog/category/[id]', 'layout');
}

export async function GET() {
  try {
    const categories = await readDataUncached<BlogCategory>(BLOG_CATEGORIES_FILE);
    const posts = await readDataUncached<BlogPost>(BLOG_POSTS_FILE);
    const counts = new Map<string, number>();
    for (const p of posts) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    return NextResponse.json({
      categories: sorted.map((c) => ({ ...c, postCount: counts.get(c.id) ?? 0 })),
      total: sorted.length,
    });
  } catch (error) {
    console.error('[Admin BlogCategories] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { success: false, message: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const categories = await readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
    const baseId = typeof body?.id === 'string' && body.id ? slugify(body.id) : slugify(name);
    let id = baseId || 'category';
    let n = 2;
    while (categories.some((c) => c.id === id)) {
      id = `${baseId}-${n}`;
      n++;
    }

    const now = new Date().toISOString();
    const next: BlogCategory = {
      id,
      name,
      description: typeof body?.description === 'string' ? body.description.trim() : undefined,
      order: categories.length,
      thumbnail: typeof body?.thumbnail === 'string' ? body.thumbnail : undefined,
      createdAt: now,
      updatedAt: now,
    };

    categories.push(next);
    await writeDataMerged(BLOG_CATEGORIES_FILE, categories);
    revalidateBlogPaths();
    await logAdmin('blog-categories', 'create', {
      targetId: id,
      summary: `블로그 카테고리 추가: ${name}`,
    });

    return NextResponse.json({ success: true, category: next });
  } catch (error) {
    console.error('[Admin BlogCategories] POST Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.id !== 'string' || !body.id) {
      return NextResponse.json(
        { success: false, message: '카테고리 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const categories = await readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
    const idx = categories.findIndex((c) => c.id === body.id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: '해당 카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const prev = categories[idx];
    const next: BlogCategory = {
      ...prev,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : prev.name,
      description: typeof body.description === 'string' ? body.description.trim() : prev.description,
      order: typeof body.order === 'number' ? body.order : prev.order,
      thumbnail: typeof body.thumbnail === 'string' ? body.thumbnail : prev.thumbnail,
      updatedAt: new Date().toISOString(),
    };
    categories[idx] = next;
    await writeDataMerged(BLOG_CATEGORIES_FILE, categories);
    revalidateBlogPaths();
    await logAdmin('blog-categories', 'update', {
      targetId: next.id,
      summary: `블로그 카테고리 수정: ${next.name}`,
    });

    return NextResponse.json({ success: true, category: next });
  } catch (error) {
    console.error('[Admin BlogCategories] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.id !== 'string' || !body.id) {
      return NextResponse.json(
        { success: false, message: '카테고리 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    const reassignTo = typeof body?.reassignTo === 'string' ? body.reassignTo : undefined;

    const categories = await readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
    const target = categories.find((c) => c.id === body.id);
    if (!target) {
      return NextResponse.json(
        { success: false, message: '해당 카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const posts = await readDataForWrite<BlogPost>(BLOG_POSTS_FILE);
    const inUse = posts.filter((p) => p.categoryId === body.id);

    if (inUse.length > 0) {
      // 글이 있는 카테고리 — 재배치 대상 필수
      const fallback = reassignTo ?? BLOG_UNCATEGORIZED_ID;
      const fallbackExists =
        fallback === BLOG_UNCATEGORIZED_ID || categories.some((c) => c.id === fallback);
      if (!fallbackExists) {
        return NextResponse.json(
          {
            success: false,
            message: '이 카테고리에 글이 있습니다. 재배치할 대상 카테고리를 선택하세요.',
            inUseCount: inUse.length,
            targets: categories.filter((c) => c.id !== body.id),
          },
          { status: 409 }
        );
      }

      // "uncategorized" 가 없으면 자동 생성
      if (fallback === BLOG_UNCATEGORIZED_ID && !categories.some((c) => c.id === BLOG_UNCATEGORIZED_ID)) {
        const now = new Date().toISOString();
        categories.push({
          id: BLOG_UNCATEGORIZED_ID,
          name: '미분류',
          order: categories.length,
          createdAt: now,
          updatedAt: now,
        });
      }

      const snapId = await snapshotBeforeDestructive(undefined, `blog-categories delete ${body.id}`);
      const now = new Date().toISOString();
      for (const p of posts) {
        if (p.categoryId === body.id) {
          p.categoryId = fallback;
          p.updatedAt = now;
        }
      }
      await writeDataMerged(BLOG_POSTS_FILE, posts);

      const next = categories.filter((c) => c.id !== body.id);
      // 삭제 id 는 removedIds 로 명시 — merge 가 부활시키지 않도록.
      await writeDataMerged(BLOG_CATEGORIES_FILE, next, { removedIds: [body.id] });
      revalidateBlogPaths();
      await logAdmin('blog-categories', 'delete', {
        targetId: body.id,
        summary: `블로그 카테고리 삭제: ${target.name} (글 ${inUse.length}개 → ${fallback})`,
        meta: snapId ? { preSnapshot: snapId, reassignedCount: inUse.length, reassignTo: fallback } : undefined,
      });

      return NextResponse.json({
        success: true,
        reassignedCount: inUse.length,
        reassignTo: fallback,
      });
    }

    // 빈 카테고리 — 단순 삭제 (삭제 id 는 removedIds 로 명시해 merge 부활 방지)
    const next = categories.filter((c) => c.id !== body.id);
    await writeDataMerged(BLOG_CATEGORIES_FILE, next, { removedIds: [body.id] });
    revalidateBlogPaths();
    await logAdmin('blog-categories', 'delete', {
      targetId: body.id,
      summary: `블로그 카테고리 삭제: ${target.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin BlogCategories] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/** PATCH — 전체 순서 재배치 ({ orders: [{id, order}, ...] }) */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.orders)) {
      return NextResponse.json(
        { success: false, message: 'orders 배열은 필수입니다.' },
        { status: 400 }
      );
    }
    const map = new Map<string, number>(
      body.orders
        .filter((o: unknown): o is { id: string; order: number } =>
          typeof (o as { id?: unknown })?.id === 'string' && typeof (o as { order?: unknown })?.order === 'number'
        )
        .map((o: { id: string; order: number }) => [o.id, o.order])
    );

    const categories = await readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
    const now = new Date().toISOString();
    let mutated = false;
    for (const c of categories) {
      const next = map.get(c.id);
      if (typeof next === 'number' && next !== c.order) {
        c.order = next;
        c.updatedAt = now;
        mutated = true;
      }
    }
    if (mutated) {
      await writeDataMerged(BLOG_CATEGORIES_FILE, categories);
      revalidateBlogPaths();
      await logAdmin('blog-categories', 'update', {
        summary: `블로그 카테고리 순서 변경 (${map.size}개)`,
      });
    }
    return NextResponse.json({ success: true, mutated });
  } catch (error) {
    console.error('[Admin BlogCategories] PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
