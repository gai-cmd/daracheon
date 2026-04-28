import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readData, readDataUncached, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import type { Product, ProductVariant } from '@/data/products';

function revalidateProducts() {
  revalidatePath('/products', 'layout');
  revalidatePath('/products/[slug]', 'layout');
  revalidatePath('/', 'layout');
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
    const price = typeof item.price === 'number' ? item.price : 0;
    const inStock = item.inStock !== false;
    const result: ProductVariant = { id, label, price, inStock };
    if (typeof item.priceDisplay === 'string' && item.priceDisplay.trim()) {
      result.priceDisplay = item.priceDisplay.trim();
    }
    if (typeof item.sku === 'string' && item.sku.trim()) {
      result.sku = item.sku.trim();
    }
    return result;
  });
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await readData('products');
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

    const products = await readData('products');
    const normalizedVariants = validateAndNormalizeVariants(body.variants);

    const newProduct: Product = {
      id: body.id || `product-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-'),
      name: body.name.trim(),
      nameEn: body.nameEn?.trim() || '',
      category: body.category.trim(),
      categoryEn: body.categoryEn?.trim() || '',
      badge: body.badge?.trim() || '',
      price: body.price ?? 0,
      priceDisplay: body.priceDisplay || (body.price ? `${body.price.toLocaleString()}원` : '가격 문의'),
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
    await writeData('products', products);
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

    const products = await readDataUncached('products');
    const index = products.findIndex((p) => p.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const normalizedVariants = validateAndNormalizeVariants(body.variants);
    const updatedProduct: Product = {
      ...products[index],
      ...body,
      ...(normalizedVariants !== undefined
        ? { variants: normalizedVariants }
        : { variants: products[index].variants }),
    };
    products[index] = updatedProduct;
    await writeData('products', products);
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

    const products = await readDataUncached('products');
    const index = products.findIndex((p) => p.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const snapId = await snapshotBeforeDestructive(undefined, `products delete ${body.id}`);

    const removed = products.splice(index, 1)[0];
    await writeData('products', products);
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
