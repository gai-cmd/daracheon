import { NextRequest, NextResponse } from 'next/server';
import { pollInbox } from '@/lib/inbound';
import { authorizeCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — zoellife.one@gmail.com 인박스를 주기 폴링해
 * 고객 답신을 수집하고 ① 관리자 히스토리 ② 텔레그램 ③ 구글시트에 반영한다.
 *
 * 인증: @/lib/cron-auth 의 authorizeCron — CRON_SECRET 설정 시 Bearer 시크릿만 통과.
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const result = await pollInbox();
  const status = result.ok ? 200 : 500;
  return NextResponse.json({ ...result, at: new Date().toISOString() }, { status });
}
