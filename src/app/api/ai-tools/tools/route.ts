import { NextRequest, NextResponse } from 'next/server';
import { listTools, createTool, type ToolFilter } from '@/lib/ai-tools/store';
import { currentActor } from '@/lib/ai-tools/actor';
import { notifyChange } from '@/lib/ai-tools/slack';
import { formatAmount } from '@/lib/ai-tools/currency';
import type { ToolStatus, DataState } from '@/lib/ai-tools/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const filter: ToolFilter = {
      teamId: sp.get('team') || undefined,
      status: (sp.get('status') as ToolStatus) || undefined,
      dataState: (sp.get('data_state') as DataState) || undefined,
      q: sp.get('q') || undefined,
    };
    const tools = await listTools(filter);
    return NextResponse.json({ tools });
  } catch (err) {
    console.error('[ai-tools] GET tools', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: '툴명(name)은 필수입니다.' }, { status: 400 });
    }
    const tool = await createTool(body);
    const actor = await currentActor();
    // 변경 통지 (감사 로그) — 실패해도 등록은 성공 처리.
    notifyChange({
      action: '등록',
      toolName: tool.name,
      by: actor,
      detail: `${tool.plan ?? ''} ${formatAmount(tool.monthlyCost, tool.currency)}`.trim(),
    }).catch(() => {});
    return NextResponse.json({ tool }, { status: 201 });
  } catch (err) {
    console.error('[ai-tools] POST tools', err);
    const msg = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
