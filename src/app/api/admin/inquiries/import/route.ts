import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { parseCSV, buildHeaderMap, cellGetter } from '@/lib/csv-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject?: string;
  message: string;
  date: string;
  status: string;
  reply?: string;
  replyAt?: string;
  replyBy?: string;
}

const VALID_STATUSES = new Set(['new', 'replied', 'resolved', 'pending', 'in-progress', 'closed']);

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
    if (headerMap['name'] === undefined || headerMap['email'] === undefined || headerMap['message'] === undefined) {
      return NextResponse.json(
        { success: false, message: '헤더에 name, email, message 컬럼이 필요합니다.' },
        { status: 400 }
      );
    }

    const inquiries = await readData('inquiries');
    let created = 0;
    let updated = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 1; i < rows.length; i++) {
      const get = cellGetter(rows[i], headerMap);
      const name = get('name');
      const email = get('email');
      const message = get('message');

      if (!name) { errors.push({ row: i + 1, message: 'name 비어 있음' }); continue; }
      if (!email) { errors.push({ row: i + 1, message: 'email 비어 있음' }); continue; }
      if (!message) { errors.push({ row: i + 1, message: 'message 비어 있음' }); continue; }

      const id = get('id') || `inq-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const date = get('date') || new Date().toISOString();
      const statusRaw = get('status') || 'new';
      const status = VALID_STATUSES.has(statusRaw) ? statusRaw : 'new';

      const base: Inquiry = {
        id,
        name,
        email,
        phone: get('phone') || undefined,
        category: get('category') || '기타',
        subject: get('subject') || undefined,
        message,
        date,
        status,
      };

      const existingIdx = inquiries.findIndex((q) => q.id === id);
      if (existingIdx >= 0) {
        inquiries[existingIdx] = { ...inquiries[existingIdx], ...base };
        updated++;
      } else {
        inquiries.push(base);
        created++;
      }
    }

    await writeData('inquiries', inquiries);

    await logAdmin('inquiries', 'bulk_update', {
      summary: `문의 CSV import: 신규 ${created}, 수정 ${updated}, 오류 ${errors.length}`,
      meta: { created, updated, errorsCount: errors.length, filename: file.name },
    });

    return NextResponse.json({ success: true, created, updated, skipped: errors.length, errors });
  } catch (error) {
    console.error('[Admin Inquiries Import] error:', error);
    return NextResponse.json({ success: false, message: 'CSV 처리 오류' }, { status: 500 });
  }
}
