import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeCron } from '@/lib/cron-auth';
import { liveSyncDeps, syncYoutube } from '@/lib/youtube-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Vercel Cron 전용 — 공식 유튜브 두 채널의 새 영상을 /videos·홈 목록에 쌓는다. 인증은 authorizeCron. */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }
  const result = await syncYoutube(liveSyncDeps());
  if (result.added > 0) {
    revalidatePath('/');
    revalidatePath('/videos');
  }
  return NextResponse.json({ ...result, at: new Date().toISOString() }, { status: result.ok ? 200 : 500 });
}
