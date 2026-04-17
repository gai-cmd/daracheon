import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { parseCSV, buildHeaderMap, cellGetter } from '@/lib/csv-parser';
import type { Review } from '@/data/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'CSV 파일이 필요합니다.' }, { status: 400 });
    }
    if (file.size === 0) return NextResponse.json({ success: false, message: '빈 파일' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: '최대 5MB' }, { status: 413 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({ success: false, message: '헤더와 최소 1개 행이 필요합니다.' }, { status: 400 });
    }

    const headerMap = buildHeaderMap(rows[0]);
    if (headerMap['author'] === undefined || headerMap['content'] === undefined || headerMap['rating'] === undefined) {
      return NextResponse.json(
        { success: false, message: '헤더에 author, content, rating 컬럼이 필요합니다.' },
        { status: 400 }
      );
    }

    const reviews = await readData('reviews');
    let created = 0;
    let updated = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 1; i < rows.length; i++) {
      const get = cellGetter(rows[i], headerMap);
      const author = get('author');
      const content = get('content');
      const ratingRaw = get('rating');
      const rating = Number(ratingRaw);

      if (!author) { errors.push({ row: i + 1, message: 'author 비어 있음' }); continue; }
      if (!content || content.length < 10) { errors.push({ row: i + 1, message: 'content 10자 이상 필요' }); continue; }
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) { errors.push({ row: i + 1, message: `rating 1~5: ${ratingRaw}` }); continue; }

      const id = get('id') || `r-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const date = get('date') || new Date().toISOString();
      const verifiedRaw = get('verified').toLowerCase();
      const verified = verifiedRaw === '' ? false : !['false', '0', 'no', 'n'].includes(verifiedRaw);

      const base: Review = {
        id,
        author,
        age: get('age'),
        product: get('product'),
        rating,
        title: get('title'),
        content,
        date,
        verified,
      };

      const existingIdx = reviews.findIndex((r) => r.id === id);
      if (existingIdx >= 0) {
        reviews[existingIdx] = { ...reviews[existingIdx], ...base };
        updated++;
      } else {
        reviews.push(base);
        created++;
      }
    }

    await writeData('reviews', reviews);

    await logAdmin('reviews', 'bulk_update', {
      summary: `리뷰 CSV import: 신규 ${created}, 수정 ${updated}, 오류 ${errors.length}`,
      meta: { created, updated, errorsCount: errors.length, filename: file.name },
    });

    return NextResponse.json({ success: true, created, updated, skipped: errors.length, errors });
  } catch (error) {
    console.error('[Admin Reviews Import] error:', error);
    return NextResponse.json({ success: false, message: 'CSV 처리 오류' }, { status: 500 });
  }
}
