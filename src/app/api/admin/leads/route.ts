import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/leads';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await listLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error('[api:admin:leads] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '리드 로드 실패' },
      { status: 500 }
    );
  }
}
