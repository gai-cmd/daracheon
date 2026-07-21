import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin, resolveActor } from '@/lib/audit';
import {
  SUBMISSIONS_FILE,
  type MediaSubmission,
} from '@/lib/media-submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image: string;
  excerpt: string;
  url: string;
}

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
  /** 승인 시 제목/출처 덮어쓰기, 또는 edit 시 제목 수정 (미지정 시 제출값 유지) */
  title: z.string().max(120).optional(),
  source: z.string().max(60).optional(),
  /** edit 시 메모 수정 (빈 문자열이면 메모 삭제) */
  note: z.string().max(2000).optional(),
  /** 거절 사유 */
  reason: z.string().max(500).optional(),
  /** 촬영 메타(위치·날씨·시간)를 설명에 덧붙일지 (기본 true) */
  includeMeta: z.boolean().optional(),
});

function metaLine(s: MediaSubmission): string {
  const parts: string[] = [];
  if (s.capturedAt) parts.push(`촬영 ${s.capturedAt.replace('T', ' ').slice(0, 16)}`);
  if (s.location) parts.push(`GPS ${s.location.lat.toFixed(5)}, ${s.location.lng.toFixed(5)}`);
  if (s.weather) {
    const w = s.weather;
    parts.push(`${w.text ?? '날씨'} ${Math.round(w.tempC)}°C${typeof w.humidity === 'number' ? ` · 습도 ${w.humidity}%` : ''}`);
  }
  return parts.join(' · ');
}

export async function PUT(request: Request) {
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { id, action, reason, includeMeta } = parsed.data;

    const submissions = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '제출을 찾을 수 없습니다.' }, { status: 404 });
    }
    const submission = submissions[idx];
    // 게시된(approved) 항목은 이미 /media 로 복사됨 — 재승인·수정 불가.
    // pending/rejected 는 관리자가 재검토(승인·반려·수정)할 수 있다.
    if (submission.status === 'approved') {
      return NextResponse.json(
        { success: false, message: '이미 게시된 항목입니다. 미디어 관리에서 처리하세요.' },
        { status: 409 }
      );
    }

    const { email: actor } = await resolveActor();
    const now = new Date().toISOString();

    // ── 수정: 제목·메모만 (상태는 그대로 유지) ──
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

    // ── 승인: media.json 에 항목 생성 → /media 프론트에 노출 ──
    const title = parsed.data.title?.trim() || submission.title;
    const source = parsed.data.source?.trim() || `베트남 현장 · ${submission.partnerName}`;
    const date = (submission.capturedAt ?? submission.submittedAt).slice(0, 10);
    const meta = includeMeta === false ? '' : metaLine(submission);
    const excerpt = [submission.note ?? '', meta].filter(Boolean).join('\n');

    const media = await readDataForWrite<MediaItem>('media');
    const createdIds: string[] = [];
    const stamp = Date.now();
    submission.files.forEach((f, i) => {
      const itemId = `m-${stamp}-${i}`;
      const suffix = submission.files.length > 1 ? ` (${i + 1}/${submission.files.length})` : '';
      media.push({
        id: itemId,
        type: f.type,
        title: `${title}${suffix}`,
        source,
        date,
        // 사진: image 가 갤러리 표시 원본. 영상: url 재생 + 첫 프레임 썸네일 폴백.
        image: f.type === 'photo' ? f.url : '',
        excerpt,
        url: f.url,
      });
      createdIds.push(itemId);
    });
    await writeDataMerged('media', media);

    submission.status = 'approved';
    submission.reviewedAt = now;
    submission.reviewedBy = actor;
    submission.mediaIds = createdIds;
    submissions[idx] = submission;
    await writeDataMerged(SUBMISSIONS_FILE, submissions);

    await logAdmin('media', 'status_change', {
      targetId: id,
      summary: `현장 제출 승인: ${title} (${submission.partnerName}) → 미디어 ${createdIds.length}건 게시`,
      meta: { mediaIds: createdIds },
    });

    return NextResponse.json({ success: true, submission, mediaIds: createdIds });
  } catch (error) {
    console.error('[Media Submissions] PUT Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
