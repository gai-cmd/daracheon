import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';
import { toCSV, type CsvColumn } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type SupportedModule = 'inquiries' | 'reviews' | 'products';

const COLUMN_MAP: Record<SupportedModule, CsvColumn<Record<string, unknown>>[]> = {
  inquiries: [
    { key: 'id', label: 'ID' },
    { key: 'date', label: '접수일' },
    { key: 'name', label: '이름' },
    { key: 'email', label: '이메일' },
    { key: 'phone', label: '연락처' },
    { key: 'category', label: '카테고리' },
    { key: 'subject', label: '제목' },
    { key: 'message', label: '문의 내용' },
    { key: 'status', label: '상태' },
    { key: 'reply', label: '답변 내용' },
    { key: 'replyAt', label: '답변일시' },
    { key: 'replyBy', label: '답변자' },
  ],
  reviews: [
    { key: 'id', label: 'ID' },
    { key: 'date', label: '작성일' },
    { key: 'author', label: '작성자' },
    { key: 'age', label: '나이대' },
    { key: 'product', label: '제품' },
    { key: 'rating', label: '평점', format: (v) => String(v) },
    { key: 'title', label: '제목' },
    { key: 'content', label: '내용' },
    { key: 'verified', label: '인증여부', format: (v) => (v ? 'Y' : 'N') },
  ],
  products: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '제품명' },
    { key: 'nameEn', label: '제품명(영문)' },
    { key: 'category', label: '카테고리' },
    { key: 'categoryEn', label: '카테고리(영문)' },
    { key: 'badge', label: '배지' },
    { key: 'price', label: '가격', format: (v) => String(v ?? '') },
    { key: 'priceDisplay', label: '가격표시' },
    { key: 'inStock', label: '재고여부', format: (v) => (v ? 'Y' : 'N') },
    { key: 'shortDescription', label: '짧은 설명' },
    { key: 'description', label: '상세 설명' },
  ],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ module: string }> }
) {
  const { module } = await params;

  if (!['inquiries', 'reviews', 'products'].includes(module)) {
    return NextResponse.json(
      { success: false, message: '지원하지 않는 모듈입니다.' },
      { status: 400 }
    );
  }

  const mod = module as SupportedModule;
  const rows = await readData<Record<string, unknown>>(mod);
  const columns = COLUMN_MAP[mod];
  const csv = toCSV(rows, columns);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `daracheon-${mod}-${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
