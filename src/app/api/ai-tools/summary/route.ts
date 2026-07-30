import { NextResponse } from 'next/server';
import { buildSummary } from '@/lib/ai-tools/summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 팀별·월별 비용 집계 (JPY 환산) — 대시보드·슬랙 통지·MCP 공용. */
export async function GET() {
  try {
    const summary = await buildSummary();
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[ai-tools] GET summary', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
