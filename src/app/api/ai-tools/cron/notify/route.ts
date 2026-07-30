import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import {
  notifyMonthlyReport,
  notifyBillingReminders,
  notifyReconciliation,
  type NotifyResult,
} from '@/lib/ai-tools/slack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI툴 슬랙 통지 잡 (Vercel Cron 전용, CRON_SECRET 검증).
 *
 * 매일 09:00 JST(= UTC 00:00) 1회 호출로 날짜에 따라 분기(설계서 ⑧):
 *   - 매일       결제 리마인드 (billing_day − 3일)
 *   - 매월 1일   월간 리포트
 *   - 매월 5일   정합성 점검
 *
 * 수동 테스트: ?type=monthly | reminder | reconcile 로 개별 트리거.
 * (수동 호출도 CRON_SECRET Bearer 필요.)
 */
export async function GET(request: NextRequest) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const now = new Date();
  const type = request.nextUrl.searchParams.get('type');
  const ran: Record<string, NotifyResult> = {};

  try {
    if (type === 'monthly') {
      ran.monthly = await notifyMonthlyReport(now);
    } else if (type === 'reminder') {
      ran.reminder = await notifyBillingReminders(3, now);
    } else if (type === 'reconcile') {
      ran.reconcile = await notifyReconciliation(now);
    } else {
      // auto (cron 기본): 날짜 기준 분기. JST 기준 일자로 판정.
      const jst = new Date(now.getTime() + 9 * 3600 * 1000);
      const day = jst.getUTCDate();
      ran.reminder = await notifyBillingReminders(3, now);
      if (day === 1) ran.monthly = await notifyMonthlyReport(now);
      if (day === 5) ran.reconcile = await notifyReconciliation(now);
    }
    return NextResponse.json({ success: true, ran, at: now.toISOString() });
  } catch (err) {
    console.error('[ai-tools] cron notify', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '실패' },
      { status: 500 },
    );
  }
}
