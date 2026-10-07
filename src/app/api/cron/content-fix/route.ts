import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeCron } from '@/lib/cron-auth';
import { readSingleForWrite, writeSingle, readDataForWrite, writeDataMerged, writeData } from '@/lib/db';
import { readPostsForWrite, writePosts } from '@/lib/blog/store';
import { fixDataFile, fixPost, type Counts } from '@/lib/content-fix/apply-2026-10-07';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron 전용 — 운영 데이터 일회성 정정 (2026-10-07 표기·맞춤법 2차 점검).
 * 표: src/lib/content-fix/replacements-2026-10-07.json
 * 대상: Blob pages·products·faq·product-guides·company + 블로그 글.
 *
 * 운영 데이터는 Blob/Neon 에만 있고 작업 환경에선 쓸 수 없어, 쓰기 권한이 있는 운영 서버가
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

  const counts: Record<string, Counts> = {};
  const changed = (file: string, c: Counts) => {
    if (!Object.keys(c).length) return false;
    counts[file] = c;
    return true;
  };

  try {
    const pages = await readSingleForWrite<Record<string, unknown>>('pages');
    if (pages) {
      const f = fixDataFile(pages);
      if (changed('pages', f.counts)) {
        await writeSingle('pages', f.data);
        for (const p of ['/', '/about-agarwood', '/brand-story', '/showroom', '/process', '/media', '/company', '/home-shopping', '/reviews']) {
          revalidatePath(p);
        }
      }
    }

    const products = await readDataForWrite<Record<string, unknown>>('products');
    const fp = fixDataFile(products);
    if (changed('products', fp.counts)) {
      await writeDataMerged('products', fp.data);
      revalidatePath('/products', 'layout');
      revalidatePath('/', 'layout');
    }

    const faq = await readDataForWrite<Record<string, unknown>>('faq');
    const ff = fixDataFile(faq);
    if (changed('faq', ff.counts)) {
      await writeDataMerged('faq', ff.data);
      revalidatePath('/company');
    }

    // 회사 정보(사이트 기본 메타 설명·키워드 등) — 어드민 저장과 같은 싱글턴 쓰기 경로.
    const company = await readSingleForWrite<Record<string, unknown>>('company');
    if (company) {
      const fc = fixDataFile(company);
      if (changed('company', fc.counts)) {
        await writeSingle('company', fc.data);
        revalidatePath('/', 'layout');
      }
    }

    const guides = await readDataForWrite<Record<string, unknown>>('product-guides');
    const fg = fixDataFile(guides);
    if (changed('product-guides', fg.counts)) {
      await writeData('product-guides', fg.data);
      revalidatePath('/guide');
      revalidatePath('/products', 'layout');
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
    if (changed('blog', blogCounts)) {
      await writePosts(nextPosts, { upsertIds: changedIds });
      revalidatePath('/blog', 'layout');
      counts.blogPosts = { changed: changedIds.length };
    }
  } catch (err) {
    console.error('[cron:content-fix] failed', err);
    return NextResponse.json({ success: false, counts, message: '실행 실패 — 다음 크론에서 재시도' }, { status: 500 });
  }

  console.log('[cron:content-fix]', JSON.stringify(counts));
  return NextResponse.json({ success: true, counts, at: new Date().toISOString() });
}
