import { NextRequest, NextResponse } from 'next/server';
import { getTool, updateTool, listPayments, listReviews } from '@/lib/ai-tools/store';
import { currentActor } from '@/lib/ai-tools/actor';
import { notifyChange } from '@/lib/ai-tools/slack';
import { TOOL_STATUS_LABEL } from '@/lib/ai-tools/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const tool = await getTool(id);
    if (!tool) return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });
    const [payments, reviews] = await Promise.all([listPayments(id), listReviews(id)]);
    return NextResponse.json({ tool, payments, reviews });
  } catch (err) {
    console.error('[ai-tools] GET tool', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const before = await getTool(id);
    if (!before) return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });

    const body = await request.json();
    const tool = await updateTool(id, body);
    if (!tool) return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });

    const actor = await currentActor();
    // 상태·플랜 변경은 "변경 통지" 로 강조 (설계서 ⑧).
    const changedStatus = before.status !== tool.status;
    const changedPlan = before.plan !== tool.plan;
    const action = tool.status === 'cancelled' ? '해지' : '수정';
    const details: string[] = [];
    if (changedStatus) {
      details.push(`상태 ${TOOL_STATUS_LABEL[before.status]} → ${TOOL_STATUS_LABEL[tool.status]}`);
    }
    if (changedPlan) details.push(`플랜 ${before.plan ?? '-'} → ${tool.plan ?? '-'}`);
    notifyChange({
      action,
      toolName: tool.name,
      by: actor,
      detail: details.join(' · ') || undefined,
    }).catch(() => {});

    return NextResponse.json({ tool });
  } catch (err) {
    console.error('[ai-tools] PATCH tool', err);
    const msg = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
