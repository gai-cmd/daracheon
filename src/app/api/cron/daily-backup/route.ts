import { NextRequest, NextResponse } from 'next/server';
import { createSnapshot, pruneSnapshots } from '@/lib/backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron 호출 전용 엔드포인트. 매일 1회 실행되어:
 *   1. 전체 DB 스냅샷 생성 (label='daily')
 *   2. 보존 정책에 따라 오래된 스냅샷 정리
 *
 * 인증: Vercel Cron 은 자체 서명된 헤더를 붙임. 그 외 요청은 CRON_SECRET
 * 헤더로 보호. 둘 중 하나만 맞으면 통과.
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

  try {
    const snap = await createSnapshot('daily', { trigger: isVercelCron ? 'vercel-cron' : 'external' });
    const prune = await pruneSnapshots();

    return NextResponse.json({
      success: true,
      snapshot: snap,
      prune,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron:daily-backup] error', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
