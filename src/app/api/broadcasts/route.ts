import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';

export const revalidate = 60;

export async function GET() {
  try {
    const now = new Date();
    const broadcasts = await readData('broadcasts');

    const upcoming = broadcasts
      .filter((b) => b.status === 'scheduled' || b.status === 'live')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return NextResponse.json({
      broadcasts: upcoming,
      total: upcoming.length,
    });
  } catch (error) {
    console.error('[Broadcasts API] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
