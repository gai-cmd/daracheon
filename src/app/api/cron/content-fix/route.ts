import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeCron } from '@/lib/cron-auth';
import { readSingleForWrite, writeSingle, readDataForWrite, writeDataMerged } from '@/lib/db';
import { fixShowroomCopy, fixCapsuleCopy, type FixReport } from '@/lib/content-fix/copy-2026-10';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — 2026-10-03 운영 Blob 문구 일회성 정정 (src/lib/content-fix/copy-2026-10.ts).
 *
 * 운영 데이터는 Blob 에만 있고 이 작업 환경에선 Blob 에 쓸 수 없어, 쓰기 권한이 있는
 * 운영 서버가 크론으로 직접 고친다. 어드민 저장과 같은 쓰기 경로(readSingleForWrite·
 * writeSingle / readDataForWrite·writeDataMerged)를 쓴다. 기대한 원래 문구일 때만 바꾸므로
 * 첫 실행 이후에는 no-op. 응답에는 필드 이름과 상태만 싣는다(비밀값·URL 없음).
 *
 * 인증: @/lib/cron-auth — CRON_SECRET 설정 시 Bearer 시크릿만 통과.
 * 반영 확인 후 이 라우트·lib·vercel.json 크론 항목을 함께 제거한다.
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const report: FixReport[] = [];
  try {
    const pages = await readSingleForWrite<Record<string, unknown>>('pages');
    if (pages) {
      const r = fixShowroomCopy(pages);
      report.push(...r.report);
      if (r.changed) {
        await writeSingle('pages', pages);
        for (const p of ['/showroom', '/brand-story']) revalidatePath(p);
      }
    }

    const products = await readDataForWrite<Record<string, unknown>>('products');
    const c = fixCapsuleCopy(products);
    report.push(...c.report);
    if (c.changed) {
      await writeDataMerged('products', products);
      revalidatePath('/products', 'layout');
      revalidatePath('/products/[slug]', 'layout');
    }
  } catch (err) {
    console.error('[cron:content-fix] failed', err);
    return NextResponse.json({ success: false, report, message: '실행 실패 — 다음 크론에서 재시도' }, { status: 500 });
  }

  console.log('[cron:content-fix]', JSON.stringify(report));
  return NextResponse.json({ success: true, report, at: new Date().toISOString() });
}
