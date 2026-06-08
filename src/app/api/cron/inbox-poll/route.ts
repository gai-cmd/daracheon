import { NextRequest, NextResponse } from 'next/server';
import { pollInbox } from '@/lib/inbound';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — zoellife.one@gmail.com 인박스를 주기 폴링해
 * 고객 답신을 수집하고 ① 관리자 히스토리 ② 텔레그램 ③ 구글시트에 반영한다.
 *
 * 인증: Vercel Cron 서명 헤더(x-vercel-cron) 또는 CRON_SECRET.
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

  const result = await pollInbox();
  const status = result.ok ? 200 : 500;
  return NextResponse.json({ ...result, at: new Date().toISOString() }, { status });
}
