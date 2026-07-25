import { NextRequest, NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/daily-report';
import { authorizeCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron 호출 전용. 매일 KST 09:00 (UTC 00:00) 실행되어
 * 어제(KST) GA4 데일리 리포트를 텔레그램으로 발송한다.
 *
 * 인증: @/lib/cron-auth 의 authorizeCron — CRON_SECRET 설정 시 Bearer 시크릿만 통과.
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const result = await sendDailyReport();
  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.error ?? '실패', skipped: result.skipped, at: new Date().toISOString() },
      { status: result.skipped ? 200 : 500 },
    );
  }
  return NextResponse.json({
    success: true,
    dateLabel: result.dateLabel,
    at: new Date().toISOString(),
  });
}
