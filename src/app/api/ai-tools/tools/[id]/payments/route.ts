import { NextRequest, NextResponse } from 'next/server';
import { getTool, addPayment } from '@/lib/ai-tools/store';
import { currentActor } from '@/lib/ai-tools/actor';
import { notifyChange } from '@/lib/ai-tools/slack';
import { formatAmount } from '@/lib/ai-tools/currency';
import type { Currency } from '@/lib/ai-tools/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const tool = await getTool(id);
    if (!tool) return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });

    const body = await request.json();
    const payment = await addPayment(id, {
      paidOn: body.paidOn,
      amount: Number(body.amount),
      currency: (body.currency as Currency) || tool.currency,
      receiptUrl: body.receiptUrl,
    });

    const actor = await currentActor();
    notifyChange({
      action: '결제 기록',
      toolName: tool.name,
      by: actor,
      detail: `${payment.paidOn} ${formatAmount(payment.amount, payment.currency)}`,
    }).catch(() => {});

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    console.error('[ai-tools] POST payment', err);
    const msg = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
