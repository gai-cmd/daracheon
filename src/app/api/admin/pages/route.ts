import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type PagesData = Record<string, unknown>;

// Which public routes each editable page key renders on. After a PUT
// we revalidate the matching routes so admin saves land on the live
// site immediately instead of after the ISR window (revalidate=60).
const PAGE_PUBLIC_PATHS: Record<string, string[]> = {
  aboutAgarwood: ['/about-agarwood'],
  brandStory: ['/brand-story'],
};

export async function GET() {
  try {
    const pages = await readSingle('pages');
    if (!pages) {
      return NextResponse.json(
        { success: false, message: '페이지 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('[Admin Pages] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { key: string; data: unknown };

    const validKeys = ['aboutAgarwood', 'brandStory'];
    if (!body.key || !validKeys.includes(body.key)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 페이지 키입니다.' },
        { status: 400 }
      );
    }

    const existing = await readSingle('pages') ?? {};
    const updated: PagesData = { ...existing, [body.key]: body.data };
    await writeSingle('pages', updated);

    await logAdmin('settings', 'update', {
      summary: `페이지 수정: ${body.key}`,
      targetId: body.key,
    });

    // Push the fresh content to the public route so admins don't wait
    // out the 60s ISR window. Best-effort — failures don't block the save.
    for (const p of PAGE_PUBLIC_PATHS[body.key] ?? []) {
      try {
        revalidatePath(p);
      } catch (err) {
        console.warn('[Admin Pages] revalidate failed', p, err);
      }
    }

    return NextResponse.json({ success: true, pages: updated });
  } catch (error) {
    console.error('[Admin Pages] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
