import { NextResponse } from 'next/server';
import { z } from 'zod';
import { del } from '@vercel/blob';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin, resolveActor } from '@/lib/audit';
import {
  SUBMISSIONS_FILE,
  type MediaSubmission,
} from '@/lib/media-submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const submissions = await readDataUncached<MediaSubmission>(SUBMISSIONS_FILE);
    const sorted = [...submissions].sort((a, b) =>
      (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')
    );
    return NextResponse.json({
      submissions: sorted,
      pendingCount: sorted.filter((s) => s.status === 'pending').length,
    });
  } catch (error) {
    console.error('[Media Submissions] GET Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

const reviewSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['approve', 'reject', 'edit']),
  /** 승인 시 제목 덮어쓰기, 또는 edit 시 제목 수정 (미지정 시 제출값 유지) */
  title: z.string().max(120).optional(),
  /** edit 시 메모 수정 (빈 문자열이면 메모 삭제) */
  note: z.string().max(2000).optional(),
  /** 거절 사유 */
  reason: z.string().max(500).optional(),
});

export async function PUT(request: Request) {
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { id, action, reason } = parsed.data;

    const submissions = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '제출을 찾을 수 없습니다.' }, { status: 404 });
    }
    const submission = submissions[idx];
    const { email: actor } = await resolveActor();
    const now = new Date().toISOString();

    // ── 수정: 제목·메모만 (상태 그대로 유지). 게시된(approved) 글도 현장 소식
    //    게시판에서 관리자가 수정할 수 있다. ──
    if (action === 'edit') {
      const t = parsed.data.title?.trim();
      if (t) submission.title = t;
      if (typeof parsed.data.note === 'string') {
        const trimmed = parsed.data.note.trim();
        if (trimmed) submission.note = trimmed;
        else delete submission.note;
      }
      submissions[idx] = submission;
      await writeDataMerged(SUBMISSIONS_FILE, submissions);

      await logAdmin('media', 'update', {
        targetId: id,
        summary: `현장 제출 수정: ${submission.title} (${submission.partnerName})`,
      });
      return NextResponse.json({ success: true, submission });
    }

    if (action === 'reject') {
      if (submission.status === 'approved') {
        return NextResponse.json(
          { success: false, message: '게시된 항목은 반려할 수 없습니다. 게시판에서 삭제하세요.' },
          { status: 409 }
        );
      }
      submission.status = 'rejected';
      submission.reviewedAt = now;
      submission.reviewedBy = actor;
      if (reason?.trim()) submission.rejectReason = reason.trim();
      submissions[idx] = submission;
      await writeDataMerged(SUBMISSIONS_FILE, submissions);

      await logAdmin('media', 'status_change', {
        targetId: id,
        summary: `현장 제출 거절: ${submission.title} (${submission.partnerName})`,
        meta: reason ? { reason } : undefined,
      });
      return NextResponse.json({ success: true, submission });
    }

    // ── 승인 = 현장 소식 게시: 제출 1건이 곧 게시글이므로 낱장 미디어로
    //    쪼개 media.json 으로 복사하지 않는다. 상태만 approved 로 전환하면
    //    /media '현장 소식' 탭이 승인 제출을 직접 읽어 노출한다.
    //    (승인 시 제목 덮어쓰기 옵션은 유지) ──
    if (submission.status === 'approved') {
      return NextResponse.json(
        { success: false, message: '이미 게시된 항목입니다.' },
        { status: 409 }
      );
    }
    if (parsed.data.title?.trim()) submission.title = parsed.data.title.trim();
    submission.status = 'approved';
    submission.reviewedAt = now;
    submission.reviewedBy = actor;
    submissions[idx] = submission;
    await writeDataMerged(SUBMISSIONS_FILE, submissions);

    await logAdmin('media', 'status_change', {
      targetId: id,
      summary: `현장 제출 승인(현장 소식 게시): ${submission.title} (${submission.partnerName})`,
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('[Media Submissions] PUT Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

/* ── 삭제: 현장 소식 게시판에서 게시글(제출)을 완전 삭제. 상태 무관(관리자 권한).
      Blob 파일도 함께 정리 (best-effort — 실패해도 레코드는 삭제). ── */
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'id는 필수입니다.' }, { status: 400 });
    }

    const submissions = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    const idx = submissions.findIndex((s) => s.id === body.id);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '제출을 찾을 수 없습니다.' }, { status: 404 });
    }

    const removed = submissions.splice(idx, 1)[0];
    await writeDataMerged(SUBMISSIONS_FILE, submissions, { removedIds: [body.id] });

    // 업로드 파일 정리 — blob URL 만 대상, 실패 무시.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      for (const f of removed.files) {
        if (f.url.startsWith('https://')) {
          del(f.url).catch((err) =>
            console.warn('[Media Submissions] blob 파일 정리 실패:', f.url, err)
          );
        }
      }
    }

    await logAdmin('media', 'delete', {
      targetId: body.id,
      summary: `현장 소식 삭제: ${removed.title} (${removed.partnerName})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Media Submissions] DELETE Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
