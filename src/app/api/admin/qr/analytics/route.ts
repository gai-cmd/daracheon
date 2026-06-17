import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { queryEvents } from '@/lib/qr/events';
import { aggregate } from '@/lib/qr/analytics';

export const dynamic = 'force-dynamic';

/**
 * QR 분석 — ?slug=<slug|all>&days=<n>.
 * 온리드 집계(이벤트 blob list→fetch→aggregate)를 unstable_cache(120s)로 감싸
 * 짧은 시간 내 반복 조회 비용을 줄인다. launch 볼륨엔 충분하며, 커지면 일/월
 * 롤업으로 이관(P1).
 */

const MAX_DAYS = 730;

async function freshAnalytics(slug: string | undefined, days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const events = await queryEvents(from, to);
  return aggregate(events, { slug, from, to });
}

function cachedAnalytics(slug: string | undefined, days: number) {
  // 짧은 기간(실시간 ≤1일) 또는 fresh 요청은 캐시 우회 → 방금 스캔이 빠르게 반영.
  // 긴 기간은 120s 캐시로 list+fetch 비용 절감.
  return unstable_cache(
    () => freshAnalytics(slug, days),
    ['qr-analytics', slug ?? 'all', String(days)],
    { revalidate: 120, tags: ['qr-analytics'] },
  )();
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const slugParam = sp.get('slug');
    const slug = slugParam && slugParam !== 'all' ? slugParam : undefined;
    const days = Math.min(MAX_DAYS, Math.max(1, Number(sp.get('days')) || 30));
    // 실시간: 1일 범위 또는 fresh=1 → 캐시 없이 즉시 집계.
    const realtime = sp.get('fresh') === '1' || days <= 1;

    const analytics = realtime ? await freshAnalytics(slug, days) : await cachedAnalytics(slug, days);
    return NextResponse.json({ success: true, analytics, realtime });
  } catch (error) {
    console.error('[Admin QR] analytics Error:', error);
    return NextResponse.json({ success: false, message: '분석 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}
