import { NextResponse } from 'next/server';
import { listTeams } from '@/lib/ai-tools/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await listTeams();
    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[ai-tools] GET teams', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
