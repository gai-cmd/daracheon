import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { SUBMISSIONS_FILE, type MediaSubmission } from '@/lib/media-submissions';
import { refreshSubmissionCard } from '@/lib/slack-notify';

/**
 * 현장 업로드 승인/반려 — 어드민 화면과 Slack 버튼이 공유하는 단일 진입점.
 *
 * 두 경로가 각자 로직을 갖고 있으면 한쪽만 고쳐져 상태가 갈라진다. 여기서
 * 저장·감사로그·Slack 카드 갱신을 한 번에 처리하므로, 어디서 눌러도
 * 관리자 화면과 Slack 카드가 항상 같은 결과를 보여준다.
 *
 * 반환의 `status` 는 어드민 라우트가 그대로 HTTP 상태로 쓰는 값이다.
 */

export interface ReviewOutcome {
  ok: boolean;
  status: number;
  message?: string;
  submission?: MediaSubmission;
}

export interface ReviewOptions {
  /** 감사로그·카드에 남길 처리자 표기 (어드민 이메일 또는 Slack 표시이름) */
  actor: string;
  /** 처리 경로 — 감사로그 meta 에 기록 */
  via: 'admin' | 'slack';
  /** 반려 사유 */
  reason?: string;
  /** 승인 시 제목 덮어쓰기 */
  title?: string;
}

export async function reviewSubmission(
  id: string,
  action: 'approve' | 'reject',
  opts: ReviewOptions,
): Promise<ReviewOutcome> {
  const submissions = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
  const idx = submissions.findIndex((s) => s.id === id);
  if (idx < 0) {
    return { ok: false, status: 404, message: '제출을 찾을 수 없습니다.' };
  }

  const submission = submissions[idx];
  const now = new Date().toISOString();

  if (action === 'reject') {
    if (submission.status === 'approved') {
      return {
        ok: false,
        status: 409,
        message: '게시된 항목은 반려할 수 없습니다. 게시판에서 삭제하세요.',
        submission,
      };
    }
    submission.status = 'rejected';
    submission.reviewedAt = now;
    submission.reviewedBy = opts.actor;
    if (opts.reason?.trim()) submission.rejectReason = opts.reason.trim();
    else delete submission.rejectReason;
  } else {
    if (submission.status === 'approved') {
      return { ok: false, status: 409, message: '이미 게시된 항목입니다.', submission };
    }
    // 승인 = 현장 소식 게시. 제출 1건이 곧 게시글이라 media.json 으로 쪼개
    // 복사하지 않는다 — /media '현장 소식' 탭이 승인 제출을 직접 읽는다.
    if (opts.title?.trim()) submission.title = opts.title.trim();
    submission.status = 'approved';
    submission.reviewedAt = now;
    submission.reviewedBy = opts.actor;
    delete submission.rejectReason;
  }

  submissions[idx] = submission;
  await writeDataMerged(SUBMISSIONS_FILE, submissions);

  const verb = action === 'approve' ? '승인(현장 소식 게시)' : '거절';
  await logAdmin('media', 'status_change', {
    targetId: id,
    summary: `현장 제출 ${verb}: ${submission.title} (${submission.partnerName})`,
    meta: {
      via: opts.via,
      actor: opts.actor,
      ...(opts.reason?.trim() ? { reason: opts.reason.trim() } : {}),
    },
  });

  // Slack 카드 갱신 — 실패해도 처리 결과에는 영향 없음 (통지는 부가 기능).
  await refreshSubmissionCard(submission, opts.actor).catch((err: unknown) =>
    console.warn('[submission-review] slack card refresh failed:', err),
  );

  return { ok: true, status: 200, submission };
}
