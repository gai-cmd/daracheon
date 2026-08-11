import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { listTools, updateTool, addPayment, listPayments } from '@/lib/ai-tools/store';
import { collectible, fetchMonthCost, adapterStatus } from '@/lib/ai-tools/cost-sources';
import { notifyChange } from '@/lib/ai-tools/slack';
import { formatAmount } from '@/lib/ai-tools/currency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 벤더 비용 API 수집 잡 (Vercel Cron 전용, CRON_SECRET 검증).
 *
 * costSource 가 붙은 툴에 대해 지정 월의 실제 청구액을 벤더 API 에서 읽어
 *   1) 결제 이력(addPayment)에 기록 — 같은 달 기록이 있으면 건너뛴다(멱등)
 *   2) monthlyCost 갱신 + dataState='confirmed' + evidenceUrl(콘솔 링크) 보강
 * 한다. 매월 3일에 전월분을 받는 것이 기본이고, ?month=YYYY-MM 으로 소급 수집한다.
 *
 * 진단: ?dry=1 은 조회만 하고 쓰지 않는다. ?status=1 은 어댑터 설정 여부만 본다.
 * 수집 대상이 없거나 키가 없으면 조용히 skip — 잡 자체는 실패시키지 않는다.
 */
export async function GET(request: NextRequest) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  if (params.get('status') === '1') {
    return NextResponse.json({ success: true, adapters: adapterStatus() });
  }

  const dry = params.get('dry') === '1';
  const monthArg = params.get('month'); // YYYY-MM
  const now = new Date();
  let year: number, month1: number;
  if (monthArg && /^\d{4}-\d{2}$/.test(monthArg)) {
    year = Number(monthArg.slice(0, 4));
    month1 = Number(monthArg.slice(5, 7));
  } else {
    // 기본: 전월분 (당월은 아직 확정 전)
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    year = prev.getUTCFullYear();
    month1 = prev.getUTCMonth() + 1;
  }
  const ym = `${year}-${String(month1).padStart(2, '0')}`;

  const tools = await listTools();
  const targets = tools.filter((t) => collectible(t) !== null);
  const results: Record<string, unknown>[] = [];

  for (const tool of targets) {
    const source = collectible(tool)!;
    try {
      const cost = await fetchMonthCost(source, year, month1);

      // 멱등성: 같은 달 결제 기록이 이미 있으면 중복 적재하지 않는다.
      const existing = (await listPayments(tool.id)).find((p) => p.paidOn.startsWith(ym));
      if (dry) {
        results.push({ tool: tool.name, source, month: ym, amount: cost.amount, would_skip: Boolean(existing) });
        continue;
      }
      if (!existing) {
        await addPayment(tool.id, {
          paidOn: cost.paidOn,
          amount: cost.amount,
          currency: cost.currency,
          receiptUrl: cost.evidenceUrl,
        });
      }
      await updateTool(tool.id, {
        monthlyCost: cost.amount,
        currency: cost.currency,
        dataState: 'confirmed',
        evidenceUrl: tool.evidenceUrl || cost.evidenceUrl,
      });
      notifyChange({
        action: existing ? '금액 확정 (API 수집)' : '결제 기록 (API 수집)',
        toolName: tool.name,
        by: source,
        detail: `${ym} ${formatAmount(cost.amount, cost.currency)}`,
      }).catch(() => {});
      results.push({ tool: tool.name, source, month: ym, amount: cost.amount, payment_added: !existing });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ai-tools] sync-costs ${tool.name}`, message);
      results.push({ tool: tool.name, source, month: ym, error: message });
    }
  }

  return NextResponse.json({
    success: true,
    month: ym,
    dry,
    collected: results.length,
    targets: targets.length,
    results,
  });
}
