import { NextRequest, NextResponse } from 'next/server';
import { getTool, addReview } from '@/lib/ai-tools/store';
import { currentActor } from '@/lib/ai-tools/actor';
import { notifyChange } from '@/lib/ai-tools/slack';
import { REVIEW_DECISION_LABEL } from '@/lib/ai-tools/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const tool = await getTool(id);
    if (!tool) return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });

    const body = await request.json();
    const review = await addReview(id, {
      reviewedOn: body.reviewedOn,
      usageLevel: body.usageLevel,
      overlapWith: body.overlapWith,
      decision: body.decision,
      reason: body.reason,
    });

    const actor = await currentActor();
    notifyChange({
      action: '효율화 판단',
      toolName: tool.name,
      by: actor,
      detail: review.decision ? REVIEW_DECISION_LABEL[review.decision] : undefined,
    }).catch(() => {});

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error('[ai-tools] POST review', err);
    const msg = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
