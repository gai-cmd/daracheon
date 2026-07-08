import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readSingleUncached, readSingleForWrite, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const company = await readSingleUncached<Record<string, unknown>>('company');
    if (!company) {
      return NextResponse.json(
        { success: false, message: '회사 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    return NextResponse.json(company, { headers: { 'Cache-Control': 'no-store, must-revalidate' } });
  } catch (error) {
    console.error('[Admin Settings] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 쓰기 베이스: readSingleForWrite (Blob 장애 시 throw, stale 덮어쓰기 방지)
    const existing = (await readSingleForWrite<Record<string, unknown>>('company')) ?? {};
    const updated = { ...existing, ...body };
    await writeSingle('company', updated);
    revalidatePath('/company', 'layout');
    revalidatePath('/', 'layout');

    await logAdmin('settings', 'update', {
      summary: '회사 정보 업데이트',
      meta: { changedKeys: Object.keys(body).slice(0, 20) },
    });

    return NextResponse.json({
      success: true,
      company: updated,
    });
  } catch (error) {
    console.error('[Admin Settings] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
