import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { readData, readDataUncached, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import type { Product } from '@/data/products';

export interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

function revalidateAll() {
  revalidatePath('/products', 'layout');
  revalidatePath('/products/[slug]', 'layout');
  revalidatePath('/', 'layout');
  revalidateTag('db:productCategories');
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await readDataUncached<ProductCategory>('productCategories');
    return NextResponse.json({ categories, total: categories.length });
  } catch (error) {
    console.error('[Admin ProductCategories] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 전체 카테고리 목록을 한 번에 교체. 순서 변경·라벨 수정·추가·삭제를
 * 단일 요청으로 처리한다. 'all' 항목은 항상 첫 번째 위치에 강제 삽입.
 *
 * 삭제 가드: 현재 제품에 사용 중인 카테고리 id 가 새 목록에 없으면
 * 409 Conflict 로 실패시킨다. 사용처를 먼저 정리하도록 강제해
 * 공개 /products 필터에서 빈 카테고리가 사라지는 사고를 막는다.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.categories) ? body.categories : null;

    if (!incoming) {
      return NextResponse.json(
        { success: false, message: 'categories 배열은 필수입니다.' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const seen = new Set<string>();
    const cleaned: ProductCategory[] = [];

    for (let i = 0; i < incoming.length; i++) {
      const raw = incoming[i] as Record<string, unknown>;
      const id = typeof raw.id === 'string' ? raw.id.trim() : '';
      const label = typeof raw.label === 'string' ? raw.label.trim() : '';
      const labelEn = typeof raw.labelEn === 'string' ? raw.labelEn.trim() : '';

      if (!id) errors.push(`${i + 1}번 항목: id 가 비어있습니다.`);
      if (!label) errors.push(`${i + 1}번 항목: 한글 라벨이 비어있습니다.`);
      if (seen.has(id)) errors.push(`${i + 1}번 항목: id "${id}" 가 중복됩니다.`);
      seen.add(id);

      cleaned.push({ id, label, labelEn });
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // 'all' 보장 + 첫 위치 고정.
    const withoutAll = cleaned.filter((c) => c.id !== 'all');
    const allEntry = cleaned.find((c) => c.id === 'all') ?? {
      id: 'all',
      label: '전체',
      labelEn: 'All',
    };
    const finalList: ProductCategory[] = [allEntry, ...withoutAll];

    // 사용 중 카테고리 삭제 차단.
    const products = await readData<Product>('products');
    const finalIds = new Set(finalList.map((c) => c.id));
    const inUseProducts = new Map<string, Array<{ id: string; name: string; slug?: string }>>();
    for (const p of products) {
      if (!p.category) continue;
      if (finalIds.has(p.category)) continue;
      const list = inUseProducts.get(p.category) ?? [];
      list.push({ id: p.id, name: p.name ?? p.id, slug: p.slug });
      inUseProducts.set(p.category, list);
    }
    if (inUseProducts.size > 0) {
      const detail = Array.from(inUseProducts.entries())
        .map(([id, list]) => `${id} (${list.length}개: ${list.map((x) => x.name).join(', ')})`)
        .join(' / ');
      return NextResponse.json(
        {
          success: false,
          message: `사용 중인 카테고리는 삭제할 수 없습니다 — ${detail}. 먼저 해당 제품의 카테고리를 변경해 주세요.`,
          inUse: Object.fromEntries(
            Array.from(inUseProducts.entries()).map(([id, list]) => [id, list])
          ),
        },
        { status: 409 }
      );
    }

    const snapId = await snapshotBeforeDestructive(undefined, 'product-categories replace');

    await writeData('productCategories', finalList);
    revalidateAll();

    await logAdmin('products', 'update', {
      targetId: 'productCategories',
      summary: `제품 카테고리 갱신 (${finalList.length}개)`,
      meta: snapId ? { preSnapshot: snapId } : undefined,
    });

    return NextResponse.json({ success: true, categories: finalList });
  } catch (error) {
    console.error('[Admin ProductCategories] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
