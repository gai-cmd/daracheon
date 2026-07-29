import { NextResponse } from 'next/server';
import { z } from 'zod';
import { del } from '@vercel/blob';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin, resolveActor } from '@/lib/audit';
import {
  SUBMISSIONS_FILE,
  type MediaSubmission,
} from '@/lib/media-submissions';
import { reviewSubmission } from '@/lib/submission-review';

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

    // ── 승인/반려는 Slack 버튼 경로와 완전히 동일한 로직을 쓴다
    //    (저장 + 감사로그 + Slack 카드 갱신). 어느 쪽에서 처리하든 관리자
    //    화면과 Slack 카드가 같은 결과를 보이도록 단일 진입점으로 위임. ──
    const outcome = await reviewSubmission(id, action, {
      actor,
      via: 'admin',
      reason,
      title: parsed.data.title,
    });
    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, message: outcome.message ?? '처리하지 못했습니다.' },
        { status: outcome.status }
      );
    }
    return NextResponse.json({ success: true, submission: outcome.submission });
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
