import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readDataUncached, readDataForWrite, writeDataMerged, stripRecordMeta } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import type { Review } from '@/data/reviews';

function revalidateReviews() {
  revalidatePath('/reviews', 'layout');
  revalidatePath('/', 'layout');
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // union-aware read — outbox 에만 있는(배열 쓰기 전) 신규 리뷰도 관리자 목록에
    // 즉시 노출해 승인 가능하게 (readData 캐시 경로는 outbox 를 못 봄).
    const reviews = await readDataUncached('reviews');
    const total = reviews.length;
    const avgRating =
      total > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10
          ) / 10
        : 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = reviews.filter((r) => new Date(r.date) >= sevenDaysAgo).length;
    const pendingCount = reviews.filter((r) => !r.verified).length;

    return NextResponse.json({
      reviews,
      stats: {
        total,
        avgRating,
        recentCount,
        pendingCount,
      },
    });
  } catch (error) {
    console.error('[Admin Reviews] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Bulk action: PATCH { ids: string[], verified: boolean }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ids 배열은 필수입니다.' },
        { status: 400 }
      );
    }

    if (typeof body.verified !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'verified(boolean) 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    const reviews = await readDataForWrite('reviews');
    const idSet = new Set<string>(body.ids as string[]);
    let updatedCount = 0;

    for (const review of reviews) {
      if (idSet.has(review.id)) {
        review.verified = body.verified;
        updatedCount++;
      }
    }

    await writeDataMerged('reviews', reviews);
    revalidateReviews();

    await logAdmin('reviews', 'bulk_update', {
      summary: `리뷰 일괄 ${body.verified ? '승인' : '미승인'}: ${updatedCount}건`,
      meta: { count: updatedCount, verified: body.verified, ids: body.ids },
    });

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error('[Admin Reviews] PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: '리뷰 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const reviews = await readDataForWrite('reviews');
    const index = reviews.findIndex((r) => r.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    reviews[index] = { ...reviews[index], ...stripRecordMeta(body) }; // 낡은 클라이언트 _rev/_mt 오염 차단 (db.ts 레코드 버저닝)
    await writeDataMerged('reviews', reviews);
    revalidateReviews();

    await logAdmin('reviews', 'update', {
      targetId: body.id,
      summary: `리뷰 수정: ${reviews[index].author ?? body.id}`,
    });

    return NextResponse.json({
      success: true,
      review: reviews[index],
    });
  } catch (error) {
    console.error('[Admin Reviews] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '리뷰 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const reviews = await readDataForWrite('reviews');
    const index = reviews.findIndex((r) => r.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const snapId = await snapshotBeforeDestructive(undefined, `reviews delete ${body.id}`);

    const removed = reviews.splice(index, 1)[0];
    // 삭제 id 는 removedIds 로 명시 — merge 가 부활시키지 않도록.
    await writeDataMerged('reviews', reviews, { removedIds: [body.id] });
    revalidateReviews();

    await logAdmin('reviews', 'delete', {
      targetId: body.id,
      summary: `리뷰 삭제: ${removed?.author ?? body.id}`,
      meta: snapId ? { preDeleteSnapshot: snapId } : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `리뷰 ${body.id}가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[Admin Reviews] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
