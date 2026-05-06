import { NextRequest, NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/daily-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron 호출 전용. 매일 KST 09:00 (UTC 00:00) 실행되어
 * 어제(KST) GA4 데일리 리포트를 텔레그램으로 발송한다.
 *
 * 인증: Vercel Cron 자체 서명 헤더 또는 CRON_SECRET 일치.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : request.headers.get('x-cron-secret');
  const secretOk = cronSecret ? providedSecret === cronSecret : false;

  if (!isVercelCron && !secretOk) {
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
