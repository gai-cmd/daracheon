import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import type { Product } from '@/data/products';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ImportError = { row: number; message: string };

function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const EXPECTED_COLUMNS = [
  'id',
  'name',
  'nameEn',
  'slug',
  'category',
  'categoryEn',
  'price',
  'priceDisplay',
  'badge',
  'image',
  'shortDescription',
  'description',
  'inStock',
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'CSV 파일이 필요합니다.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, message: '빈 파일입니다.' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: '최대 5MB까지 지원합니다.' }, { status: 413 });
    }

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: '헤더와 최소 1개 행이 필요합니다.' },
        { status: 400 }
      );
    }

    const header = rows[0].map((h) => h.trim());
    const headerIndex: Record<string, number> = {};
    EXPECTED_COLUMNS.forEach((col) => {
      const idx = header.findIndex((h) => h.toLowerCase() === col.toLowerCase());
      if (idx >= 0) headerIndex[col] = idx;
    });

    if (headerIndex.name === undefined || headerIndex.category === undefined || headerIndex.price === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: '헤더에 최소 name, category, price 컬럼이 포함되어야 합니다.',
          detectedHeaders: header,
        },
        { status: 400 }
      );
    }

    const products = await readData('products');
    const byId = new Map(products.map((p) => [p.id, p]));
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    let created = 0;
    let updated = 0;
    const errors: ImportError[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const get = (key: string) => {
        const idx = headerIndex[key];
        if (idx === undefined) return '';
        return (row[idx] ?? '').trim();
      };

      const name = get('name');
      const category = get('category');
      const priceRaw = get('price');
      const price = Number(priceRaw);

      if (!name) {
        errors.push({ row: i + 1, message: 'name이 비어 있습니다.' });
        continue;
      }
      if (!category) {
        errors.push({ row: i + 1, message: 'category가 비어 있습니다.' });
        continue;
      }
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ row: i + 1, message: `price 가 올바르지 않습니다: ${priceRaw}` });
        continue;
      }

      const id = get('id') || `product-${Date.now()}-${i}`;
      const slug = get('slug') || slugify(name) || id;
      const inStockRaw = get('inStock').toLowerCase();
      const inStock = inStockRaw === '' ? true : !['false', '0', 'no', 'n'].includes(inStockRaw);

      const base: Partial<Product> = {
        id,
        slug,
        name,
        nameEn: get('nameEn'),
        category,
        categoryEn: get('categoryEn'),
        badge: get('badge'),
        price,
        priceDisplay: get('priceDisplay') || (price > 0 ? `${price.toLocaleString('ko-KR')}원` : '가격 문의'),
        image: get('image'),
        shortDescription: get('shortDescription'),
        description: get('description') || get('shortDescription'),
        inStock,
      };

      const existingById = byId.get(id);
      const existingBySlug = bySlug.get(slug);
      const existing = existingById ?? existingBySlug;

      if (existing) {
        const merged: Product = {
          ...existing,
          ...base,
          features: existing.features ?? [],
          specs: existing.specs ?? {},
        };
        const idx = products.findIndex((p) => p.id === existing.id);
        products[idx] = merged;
        byId.set(merged.id, merged);
        bySlug.set(merged.slug, merged);
        updated++;
      } else {
        const created_item: Product = {
          id: base.id!,
          slug: base.slug!,
          name: base.name!,
          nameEn: base.nameEn ?? '',
          category: base.category!,
          categoryEn: base.categoryEn ?? '',
          badge: base.badge ?? '',
          price: base.price!,
          priceDisplay: base.priceDisplay!,
          image: base.image ?? '',
          description: base.description ?? '',
          shortDescription: base.shortDescription ?? '',
          features: [],
          specs: {},
          inStock: base.inStock ?? true,
        };
        products.push(created_item);
        byId.set(created_item.id, created_item);
        bySlug.set(created_item.slug, created_item);
        created++;
      }
    }

    await writeData('products', products);

    await logAdmin('products', 'bulk_update', {
      summary: `CSV 일괄 import: 신규 ${created}건, 수정 ${updated}건, 오류 ${errors.length}건`,
      meta: { created, updated, errorsCount: errors.length, filename: file.name },
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error('[Admin Products Import] error:', error);
    return NextResponse.json(
      { success: false, message: 'CSV 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
