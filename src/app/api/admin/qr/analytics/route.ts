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

function computeAnalytics(slug: string | undefined, days: number) {
  return unstable_cache(
    async () => {
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      const events = await queryEvents(from, to);
      return aggregate(events, { slug, from, to });
    },
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

    const analytics = await computeAnalytics(slug, days);
    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error('[Admin QR] analytics Error:', error);
    return NextResponse.json({ success: false, message: '분석 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}
