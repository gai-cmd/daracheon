import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readDataUncached, readDataForWrite, writeDataMerged, stripRecordMeta } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import type { Product, ProductVariant } from '@/data/products';

function revalidateProducts() {
  revalidatePath('/products', 'layout');
  revalidatePath('/products/[slug]', 'layout');
  revalidatePath('/', 'layout');
}

// 가격(숫자) 으로부터 표시용 문자열을 산출. price > 0 이면 항상 재산출하여
// 어드민에서 숫자만 바꿨을 때 이전 priceDisplay 가 stale 로 남는 사고를 막는다.
// price === 0 일 때만 사용자가 입력한 override 문자열("가격 문의" 등) 을 보존.
function derivePriceDisplay(price: number, override?: unknown): string | undefined {
  if (price > 0) return `${price.toLocaleString('ko-KR')}원`;
  if (typeof override === 'string' && override.trim()) return override.trim();
  return undefined;
}

function normalizePriceTriad(originalRaw: unknown, priceRaw: unknown, discountRateRaw: unknown):
  { price: number; originalPrice?: number; discountRate?: number } {
  const price = typeof priceRaw === 'number' && priceRaw > 0 ? priceRaw : 0;
  const originalPrice =
    typeof originalRaw === 'number' && originalRaw > 0 ? originalRaw : undefined;
  let discountRate =
    typeof discountRateRaw === 'number' && discountRateRaw > 0 ? Math.round(discountRateRaw) : undefined;

  // 일관성: 원가가 판매가보다 클 때만 할인 표기로 유효.
  // discountRate 가 없거나 부정확하면 원가/판매가에서 재계산.
  if (originalPrice !== undefined && originalPrice > price && price > 0) {
    const computed = Math.round(((originalPrice - price) / originalPrice) * 100);
    if (discountRate === undefined || discountRate === 0) discountRate = computed;
  } else if (originalPrice === undefined || originalPrice <= price) {
    // 할인 무의미 → discountRate 폐기.
    discountRate = undefined;
  }

  return {
    price,
    ...(originalPrice !== undefined ? { originalPrice } : {}),
    ...(discountRate !== undefined ? { discountRate } : {}),
  };
}

function validateAndNormalizeVariants(raw: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  if (raw.length === 0) return [];
  return raw.map((v: unknown) => {
    const item = v as Record<string, unknown>;
    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const triad = normalizePriceTriad(item.originalPrice, item.price, item.discountRate);
    const inStock = item.inStock !== false;
    const result: ProductVariant = { id, label, price: triad.price, inStock };
    if (triad.originalPrice !== undefined) result.originalPrice = triad.originalPrice;
    if (triad.discountRate !== undefined) result.discountRate = triad.discountRate;
    const display = derivePriceDisplay(triad.price, item.priceDisplay);
    if (display) result.priceDisplay = display;
    if (typeof item.sku === 'string' && item.sku.trim()) {
      result.sku = item.sku.trim();
    }
    return result;
  });
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await readDataUncached('products');
    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('[Admin Products] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const errors: string[] = [];
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('상품명은 필수입니다.');
    }
    const hasVariants = Array.isArray(body.variants) && body.variants.length > 0;
    if (!hasVariants && (body.price === undefined || typeof body.price !== 'number' || body.price < 0)) {
      errors.push('가격은 0 이상이어야 합니다.');
    }
    if (!body.category || typeof body.category !== 'string') {
      errors.push('카테고리는 필수입니다.');
    }
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const products = await readDataForWrite('products');
    const normalizedVariants = validateAndNormalizeVariants(body.variants);
    const triad = normalizePriceTriad(body.originalPrice, body.price, body.discountRate);

    const newProduct: Product = {
      id: body.id || `product-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-'),
      name: body.name.trim(),
      nameEn: body.nameEn?.trim() || '',
      category: body.category.trim(),
      categoryEn: body.categoryEn?.trim() || '',
      badge: body.badge?.trim() || '',
      price: triad.price,
      priceDisplay:
        derivePriceDisplay(triad.price, body.priceDisplay) ?? '가격 문의',
      ...(triad.originalPrice !== undefined && { originalPrice: triad.originalPrice }),
      ...(triad.discountRate !== undefined && { discountRate: triad.discountRate }),
      image: body.image?.trim() || '',
      description: body.description?.trim() || '',
      shortDescription: body.shortDescription?.trim() || '',
      features: Array.isArray(body.features) ? body.features : [],
      specs: typeof body.specs === 'object' && body.specs !== null ? body.specs : {},
      inStock: body.inStock !== false,
      published: body.published !== false,
      ...(normalizedVariants !== undefined && { variants: normalizedVariants }),
    };

    products.push(newProduct);
    await writeDataMerged('products', products);
    revalidateProducts();

    await logAdmin('products', 'create', {
      targetId: newProduct.id,
      summary: `제품 등록: ${newProduct.name}`,
    });

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Products] POST Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: '상품 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const products = await readDataForWrite('products');
    const index = products.findIndex((p) => p.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const normalizedVariants = validateAndNormalizeVariants(body.variants);
    // price 가 변경되면 priceDisplay 도 항상 재산출. 어드민 UI 가
    // priceDisplay 를 갱신하지 않은 채 price 만 바꿔 저장해도
    // 표시 문자열이 stale 로 남지 않도록 백엔드에서 강제 동기화한다.
    const merged: Product = {
      ...products[index],
      // 클라이언트가 되돌린 _rev/_mt 가 서버(fresh) 메타를 덮으면 이 편집이
      // stale 로 오판돼 버려진다 (db.ts 레코드 버저닝) — 반드시 걸러서 병합.
      ...stripRecordMeta(body),
      ...(normalizedVariants !== undefined
        ? { variants: normalizedVariants }
        : { variants: products[index].variants }),
    };
    const triad = normalizePriceTriad(
      body.originalPrice ?? products[index].originalPrice,
      typeof merged.price === 'number' ? merged.price : 0,
      body.discountRate ?? products[index].discountRate,
    );
    merged.price = triad.price;
    merged.priceDisplay =
      derivePriceDisplay(triad.price, body.priceDisplay ?? products[index].priceDisplay) ??
      '가격 문의';
    if (triad.originalPrice !== undefined) merged.originalPrice = triad.originalPrice;
    else delete merged.originalPrice;
    if (triad.discountRate !== undefined) merged.discountRate = triad.discountRate;
    else delete merged.discountRate;
    products[index] = merged;
    await writeDataMerged('products', products);
    revalidateProducts();

    await logAdmin('products', 'update', {
      targetId: body.id,
      summary: `제품 수정: ${products[index].name}`,
    });

    return NextResponse.json({
      success: true,
      product: products[index],
    });
  } catch (error) {
    console.error('[Admin Products] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: '상품 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const products = await readDataForWrite('products');
    const index = products.findIndex((p) => p.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const snapId = await snapshotBeforeDestructive(undefined, `products delete ${body.id}`);

    const removed = products.splice(index, 1)[0];
    // 삭제 id 는 removedIds 로 명시 — merge 가 부활시키지 않도록.
    await writeDataMerged('products', products, { removedIds: [body.id] });
    revalidateProducts();

    await logAdmin('products', 'delete', {
      targetId: body.id,
      summary: `제품 삭제: ${removed?.name ?? body.id}`,
      meta: snapId ? { preDeleteSnapshot: snapId } : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `상품 ${body.id}가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[Admin Products] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
