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
 * 단일 요청으로 처리하며, **변경분이 제품 데이터에 자동 반영된다**.
 *
 * 자동 반영 규칙:
 *   1) **이름 변경(rename)**: 행이 originalId 와 다른 id 로 들어오면
 *      products[i].category 가 originalId 인 모든 항목을 새 id 로 갱신.
 *      categoryEn 도 새 labelEn 으로 동기화.
 *   2) **labelEn 동기화**: id 는 그대로지만 labelEn 이 바뀐 경우에도
 *      해당 제품들의 categoryEn 을 갱신.
 *   3) **삭제(reassign)**: body.reassign[oldId] = targetId 가 주어지면
 *      해당 oldId 사용 제품들을 targetId 로 이동시킨다.
 *
 * 그래도 남는 orphan(목록에 없고 reassign 도 없는 카테고리)이 있으면
 * 409 로 응답하되, 프런트가 모달로 매핑을 받을 수 있도록 inUse 와
 * targets(현재 유효한 카테고리 목록)를 함께 돌려준다.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.categories) ? body.categories : null;
    const reassign: Record<string, string> =
      body?.reassign && typeof body.reassign === 'object'
        ? (body.reassign as Record<string, string>)
        : {};

    if (!incoming) {
      return NextResponse.json(
        { success: false, message: 'categories 배열은 필수입니다.' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const seen = new Set<string>();
    const cleaned: Array<ProductCategory & { originalId?: string }> = [];

    for (let i = 0; i < incoming.length; i++) {
      const raw = incoming[i] as Record<string, unknown>;
      const id = typeof raw.id === 'string' ? raw.id.trim() : '';
      const label = typeof raw.label === 'string' ? raw.label.trim() : '';
      const labelEn = typeof raw.labelEn === 'string' ? raw.labelEn.trim() : '';
      const originalId =
        typeof raw.originalId === 'string' && raw.originalId.trim()
          ? raw.originalId.trim()
          : undefined;

      if (!id) errors.push(`${i + 1}번 항목: id 가 비어있습니다.`);
      if (!label) errors.push(`${i + 1}번 항목: 한글 라벨이 비어있습니다.`);
      if (seen.has(id)) errors.push(`${i + 1}번 항목: id "${id}" 가 중복됩니다.`);
      seen.add(id);

      cleaned.push({ id, label, labelEn, originalId });
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
    const finalList: ProductCategory[] = [allEntry, ...withoutAll].map((c) => ({
      id: c.id,
      label: c.label,
      labelEn: c.labelEn,
    }));
    const finalIds = new Set(finalList.map((c) => c.id));
    const labelEnById = new Map(finalList.map((c) => [c.id, c.labelEn]));

    // 기존 카테고리 + 제품 로드.
    const prevCategories = await readData<ProductCategory>('productCategories');
    const prevIds = new Set(prevCategories.map((c) => c.id));
    const products = await readData<Product>('products');

    // rename 맵: originalId(기존 DB 에 존재) → 새 id (서로 다를 때만).
    const renameMap = new Map<string, string>();
    for (const c of withoutAll) {
      if (!c.originalId) continue;
      if (c.originalId === c.id) continue;
      if (!prevIds.has(c.originalId)) continue;
      renameMap.set(c.originalId, c.id);
    }

    // 제품에 rename / categoryEn 동기화 / reassign 적용.
    let mutated = false;
    const updatedProducts = products.map((p) => {
      if (!p.category) return p;

      let nextCategory = p.category;

      // 1) rename 적용.
      const renamed = renameMap.get(p.category);
      if (renamed) nextCategory = renamed;

      // 2) reassign 적용 (rename 후에도 finalIds 에 없는 경우).
      if (!finalIds.has(nextCategory) && reassign[nextCategory]) {
        const target = reassign[nextCategory];
        if (finalIds.has(target) && target !== 'all') {
          nextCategory = target;
        }
      }

      // 3) categoryEn 동기화: 카테고리가 유효하면 labelEn 으로 맞춘다.
      const nextCategoryEn = finalIds.has(nextCategory)
        ? labelEnById.get(nextCategory) ?? p.categoryEn
        : p.categoryEn;

      if (nextCategory === p.category && nextCategoryEn === p.categoryEn) return p;
      mutated = true;
      return { ...p, category: nextCategory, categoryEn: nextCategoryEn };
    });

    // 남은 orphan 검사.
    const inUseProducts = new Map<string, Array<{ id: string; name: string; slug?: string }>>();
    for (const p of updatedProducts) {
      if (!p.category) continue;
      if (finalIds.has(p.category)) continue;
      const list = inUseProducts.get(p.category) ?? [];
      list.push({ id: p.id, name: p.name ?? p.id, slug: p.slug });
      inUseProducts.set(p.category, list);
    }
    if (inUseProducts.size > 0) {
      const targets = finalList
        .filter((c) => c.id !== 'all')
        .map((c) => ({ id: c.id, label: c.label }));
      return NextResponse.json(
        {
          success: false,
          message: '아래 카테고리에 속한 제품을 어디로 옮길지 선택해 주세요.',
          inUse: Object.fromEntries(
            Array.from(inUseProducts.entries()).map(([id, list]) => [id, list])
          ),
          targets,
        },
        { status: 409 }
      );
    }

    const snapId = await snapshotBeforeDestructive(undefined, 'product-categories replace');

    // 제품 변경분이 있으면 먼저 저장 (실패 시 카테고리는 그대로).
    if (mutated) {
      await writeData('products', updatedProducts);
    }
    await writeData('productCategories', finalList);
    revalidateAll();

    const summaryParts: string[] = [`카테고리 ${finalList.length}개`];
    if (renameMap.size > 0) {
      summaryParts.push(
        `이름변경 ${renameMap.size}건 (${Array.from(renameMap.entries())
          .map(([o, n]) => `${o}→${n}`)
          .join(', ')})`
      );
    }
    const reassignedCount = Object.keys(reassign).length;
    if (reassignedCount > 0) {
      summaryParts.push(`재배치 ${reassignedCount}건`);
    }

    await logAdmin('products', 'update', {
      targetId: 'productCategories',
      summary: `제품 카테고리 갱신 (${summaryParts.join(' · ')})`,
      meta: snapId ? { preSnapshot: snapId } : undefined,
    });

    return NextResponse.json({
      success: true,
      categories: finalList,
      renamed: Object.fromEntries(renameMap),
      productsUpdated: mutated,
    });
  } catch (error) {
    console.error('[Admin ProductCategories] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
