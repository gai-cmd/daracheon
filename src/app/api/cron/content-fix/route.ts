import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeCron } from '@/lib/cron-auth';
import { readSingleForWrite, writeSingle, readDataForWrite, writeDataMerged, writeData } from '@/lib/db';
import { readPostsForWrite, writePosts } from '@/lib/blog/store';
import { fixShowroomCopy, fixCapsuleCopy, type FixReport } from '@/lib/content-fix/copy-2026-10';
import { fixDataFile, fixPost, type Counts } from '@/lib/content-fix/apply-2026-10-06';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — 운영 데이터 일회성 정정.
 *  - 2026-10-03: 쇼룸 Daeracheon 표기·캡슐 함량 (src/lib/content-fix/copy-2026-10.ts)
 *  - 2026-10-06: 표기·맞춤법 점검 반영 (src/lib/content-fix/replacements-2026-10-06.json)
 *    대상: Blob pages·products·faq·product-guides·company + 블로그 글(Neon)
 *
 * 운영 데이터는 Blob/Neon 에만 있고 이 작업 환경에선 쓸 수 없어, 쓰기 권한이 있는 운영 서버가
 * 크론으로 직접 고친다. 각 어드민 화면과 같은 쓰기 경로를 쓴다. 모든 규칙이 "틀린 표기 → 바른
 * 표기"라 첫 실행 이후에는 no-op. 응답에는 규칙 id·건수만 싣는다(비밀값·URL·본문 없음).
 *
 * 인증: @/lib/cron-auth — CRON_SECRET 설정 시 Bearer 시크릿만 통과.
 * 반영 확인 후 이 라우트·lib/content-fix·vercel.json 크론 항목을 함께 제거한다.
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request).ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const report: FixReport[] = [];
  const counts: Record<string, Counts> = {};
  const merge = (file: string, c: Counts) => {
    if (Object.keys(c).length) counts[file] = c;
  };

  try {
    // ── 2026-10-03 정정 (멱등) ──
    const pages = await readSingleForWrite<Record<string, unknown>>('pages');
    let pagesChanged = false;
    if (pages) {
      const r = fixShowroomCopy(pages);
      report.push(...r.report);
      pagesChanged = r.changed;
    }
    const products = await readDataForWrite<Record<string, unknown>>('products');
    const c = fixCapsuleCopy(products);
    report.push(...c.report);
    let productsChanged = c.changed;

    // ── 2026-10-06 정정 ──
    let pagesOut = pages;
    if (pages) {
      const f = fixDataFile(pages);
      merge('pages', f.counts);
      if (Object.keys(f.counts).length) { pagesOut = f.data; pagesChanged = true; }
    }
    if (pagesChanged && pagesOut) {
      await writeSingle('pages', pagesOut);
      for (const p of ['/', '/about-agarwood', '/brand-story', '/showroom', '/process', '/media', '/company', '/home-shopping']) {
        revalidatePath(p);
      }
    }

    const fp = fixDataFile(products);
    merge('products', fp.counts);
    if (Object.keys(fp.counts).length) productsChanged = true;
    if (productsChanged) {
      await writeDataMerged('products', fp.data);
      revalidatePath('/products', 'layout');
      revalidatePath('/products/[slug]', 'layout');
      revalidatePath('/', 'layout');
    }

    const faq = await readDataForWrite<Record<string, unknown>>('faq');
    const ff = fixDataFile(faq);
    merge('faq', ff.counts);
    if (Object.keys(ff.counts).length) {
      await writeDataMerged('faq', ff.data);
      revalidatePath('/company');
    }

    // 회사 정보(사이트 기본 메타 설명·키워드 등) — 어드민 저장과 같은 싱글턴 쓰기 경로.
    const company = await readSingleForWrite<Record<string, unknown>>('company');
    if (company) {
      const fc = fixDataFile(company);
      merge('company', fc.counts);
      if (Object.keys(fc.counts).length) {
        await writeSingle('company', fc.data);
        revalidatePath('/', 'layout');
      }
    }

    const guides = await readDataForWrite<Record<string, unknown>>('product-guides');
    const fg = fixDataFile(guides);
    merge('product-guides', fg.counts);
    if (Object.keys(fg.counts).length) {
      await writeData('product-guides', fg.data);
      revalidatePath('/guide');
    }

    // 블로그 — 바뀐 글만 upsert. updatedAt 은 손대지 않는다(표기 정정은 내용 갱신이 아님).
    const posts = await readPostsForWrite();
    const changedIds: string[] = [];
    const blogCounts: Counts = {};
    const nextPosts = posts.map((p) => {
      const r = fixPost(p);
      if (Object.keys(r.counts).length) {
        changedIds.push(p.id);
        for (const [k, n] of Object.entries(r.counts)) blogCounts[k] = (blogCounts[k] ?? 0) + n;
      }
      return r.post;
    });
    merge('blog', blogCounts);
    if (changedIds.length) {
      await writePosts(nextPosts, { upsertIds: changedIds });
      revalidatePath('/blog', 'layout');
    }
    if (changedIds.length) counts.blogPosts = { changed: changedIds.length };
  } catch (err) {
    console.error('[cron:content-fix] failed', err);
    return NextResponse.json({ success: false, report, counts, message: '실행 실패 — 다음 크론에서 재시도' }, { status: 500 });
  }

  console.log('[cron:content-fix]', JSON.stringify({ report, counts }));
  return NextResponse.json({ success: true, report, counts, at: new Date().toISOString() });
}
