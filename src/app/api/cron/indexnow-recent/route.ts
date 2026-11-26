import { NextRequest, NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';
import { authorizeCron } from '@/lib/cron-auth';
import { buildIndexNowUrls, notifyIndexNow, recentlyModifiedUrls } from '@/lib/seo/indexnow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — sitemap 에서 최근 하루 사이 lastmod 가 바뀐 URL 을 네이버 IndexNow 로 알린다.
 * 블로그·제품은 저장 때 이미 알리지만, 코드 배포로 바뀐 페이지(/naver-live 등)는 이 경로로만 알려진다.
 * 구글은 IndexNow 를 받지 않으므로 sitemap lastmod 로 다시 수집한다(sitemap ping 은 폐지됨).
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }
  const entries = await sitemap();
  const urls = buildIndexNowUrls(recentlyModifiedUrls(entries, Date.now()));
  if (urls.length > 0) await notifyIndexNow(urls);
  return NextResponse.json({ success: true, submitted: urls.length, at: new Date().toISOString() });
}
