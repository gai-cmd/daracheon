import { NextResponse } from 'next/server';
import { readDataUncached } from '@/lib/db';
import type { Lead } from '@/lib/leads';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // union-aware read — outbox 에만 있는(배열 쓰기 전) 신규 리드도 대시보드에
    // 노출 (listLeads 의 readData 캐시 경로는 outbox 를 못 봄).
    const leads = await readDataUncached<Lead>('leads');
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error('[api:admin:leads] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '리드 로드 실패' },
      { status: 500 }
    );
  }
}
