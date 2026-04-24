import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';
import type { Product } from '@/data/products';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const q = searchParams.get('q')?.toLowerCase();

    const products = await readData('products');
    const categories = await readData('productCategories');

    // 공개 API 는 published === false 인 제품을 제외 (관리자 비공개 처리).
    // undefined/true 는 후방 호환 차원에서 공개로 간주.
    let filtered = products.filter((p) => p.published !== false);

    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      products: filtered,
      categories,
      total: filtered.length,
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
