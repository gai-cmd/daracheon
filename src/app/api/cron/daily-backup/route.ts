import { NextRequest, NextResponse } from 'next/server';
import { createSnapshot, pruneSnapshots, mirrorSnapshot } from '@/lib/backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron 호출 전용 엔드포인트. 매일 1회 실행되어:
 *   Tier 1  전체 DB 스냅샷 생성 (Vercel Blob, label='daily')
 *   Tier 2  GitHub backups 브랜치에 암호화 커밋 미러링
 *   Tier 3  일요일엔 관리자 이메일로 암호화 첨부 발송
 *   + 보존 정책에 따라 오래된 Blob 스냅샷 정리
 *
 * 인증: Vercel Cron 자체 서명 헤더 또는 CRON_SECRET.
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
    // Tier 1 — Blob snapshot
    const snap = await createSnapshot('daily', { trigger: isVercelCron ? 'vercel-cron' : 'external' });

    // Tier 2/3 — 외부 미러링 (암호화). 일요일(UTC getDay()===0)엔 이메일도.
    // createSnapshot 의 body 는 새로 추가된 필드. null 방어.
    const isWeekly = new Date().getUTCDay() === 0;
    const mirror = snap?.body
      ? await mirrorSnapshot('daily', snap.body, {
          sendEmail: isWeekly,
          meta: { snapshotId: snap.id, trigger: isVercelCron ? 'vercel-cron' : 'external' },
        })
      : null;

    // 오래된 blob 스냅샷 정리
    const prune = await pruneSnapshots();

    return NextResponse.json({
      success: true,
      tier1: snap ? { id: snap.id, size: snap.size, url: snap.url } : null,
      tier2_github: mirror?.tier2Github,
      tier3_email: mirror?.tier3Email,
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
