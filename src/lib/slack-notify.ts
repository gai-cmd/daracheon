import {
  postSlack,
  updateSlack,
  escapeSlack,
  clampSlack,
  type SlackBlock,
  type SlackResult,
} from '@/lib/slack';
import type { MediaSubmission } from '@/lib/media-submissions';

/**
 * Slack 카드(Block Kit) 조립 + 전송.
 *
 * slack.ts 는 전송 계층(토큰·서명·API), 이 파일은 표현 계층(카드 모양)이다.
 * 카드 하단 context 에 항상 `id: <레코드ID>` 를 남긴다 — 텔레그램 카드와 동일한
 * 규약이며, 스레드 댓글이 어느 문의에 대한 것인지 되짚는 유일한 키다.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://zoellife.com';

/* 액션 ID — 인터랙션 라우터(api/slack/interactive)와 공유하는 상수. */
export const ACTION = {
  submissionApprove: 'submission_approve',
  submissionReject: 'submission_reject',
  inquirySend: 'inquiry_reply_send',
  inquiryCancel: 'inquiry_reply_cancel',
} as const;

export const REJECT_MODAL_CALLBACK = 'submission_reject_modal';
export const REJECT_REASON_BLOCK = 'reject_reason_block';
export const REJECT_REASON_ACTION = 'reject_reason_input';

function ctx(text: string): SlackBlock {
  return { type: 'context', elements: [{ type: 'mrkdwn', text }] };
}

function section(text: string): SlackBlock {
  return { type: 'section', text: { type: 'mrkdwn', text: clampSlack(text) } };
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
}

/* ───────── 베트남 현장 업로드 승인 카드 ───────── */

function submissionDetailBlocks(s: MediaSubmission): SlackBlock[] {
  const photos = s.files.filter((f) => f.type === 'photo');
  const videos = s.files.filter((f) => f.type === 'video');

  const meta: string[] = [
    `*업체/담당* ${escapeSlack(s.partnerName)}`,
    `*제출* ${fmtDateTime(s.submittedAt)}`,
  ];
  if (s.capturedAt) meta.push(`*촬영* ${fmtDateTime(s.capturedAt)}`);
  if (s.location) {
    const { lat, lng } = s.location;
    meta.push(
      `*위치* <https://www.google.com/maps?q=${lat},${lng}|${lat.toFixed(4)}, ${lng.toFixed(4)}>`,
    );
  }
  if (s.weather) {
    const w = s.weather;
    meta.push(`*날씨* ${escapeSlack(w.text ?? '')} ${w.tempC}°C`.trim());
  }
  meta.push(`*파일* 사진 ${photos.length} · 영상 ${videos.length}`);

  const blocks: SlackBlock[] = [
    section(`*${escapeSlack(s.title)}*`),
    section(meta.join('\n')),
  ];

  if (s.note) blocks.push(section(`> ${escapeSlack(s.note).replace(/\n/g, '\n> ')}`));

  // 대표 사진 1장 미리보기 — Slack 이 blob URL 을 직접 렌더한다.
  // (외부 CDN 금지 원칙과 무관: Vercel Blob 은 우리 인프라)
  if (photos[0]) {
    blocks.push({
      type: 'image',
      image_url: photos[0].url,
      alt_text: s.title.slice(0, 100) || '현장 사진',
    });
  }

  // 나머지 파일은 링크 목록으로 (Slack 이미지 블록 남발 방지)
  const rest = s.files.filter((f) => f.url !== photos[0]?.url);
  if (rest.length > 0) {
    const links = rest
      .slice(0, 15)
      .map((f, i) => `<${f.url}|${f.type === 'video' ? '🎬' : '🖼'} ${i + 2}번>`)
      .join('  ');
    blocks.push(ctx(links));
  }

  return blocks;
}

/** 승인 대기 카드 — 버튼 2개 + 관리자 링크. */
export function buildSubmissionPendingBlocks(s: MediaSubmission): SlackBlock[] {
  return [
    section('📸 *베트남 현장 업로드 — 승인 대기*'),
    ...submissionDetailBlocks(s),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: ACTION.submissionApprove,
          text: { type: 'plain_text', text: '✅ 승인 (게시)', emoji: true },
          style: 'primary',
          value: s.id,
          confirm: {
            title: { type: 'plain_text', text: '현장 소식 게시' },
            text: {
              type: 'mrkdwn',
              text: '승인하면 zoellife.com /media 현장 소식에 즉시 공개됩니다. 진행할까요?',
            },
            confirm: { type: 'plain_text', text: '승인' },
            deny: { type: 'plain_text', text: '취소' },
          },
        },
        {
          type: 'button',
          action_id: ACTION.submissionReject,
          text: { type: 'plain_text', text: '⛔ 반려', emoji: true },
          style: 'danger',
          value: s.id,
        },
        {
          type: 'button',
          action_id: 'open_admin',
          text: { type: 'plain_text', text: '관리자에서 보기', emoji: true },
          url: `${SITE}/admin/media`,
        },
      ],
    },
    ctx(`id: ${s.id}`),
  ];
}

/** 처리 완료 카드 — 버튼을 결과 표시로 교체 (재클릭 불가). */
export function buildSubmissionResolvedBlocks(
  s: MediaSubmission,
  by: string,
): SlackBlock[] {
  const head =
    s.status === 'approved'
      ? '✅ *베트남 현장 업로드 — 승인됨 (게시 완료)*'
      : '⛔ *베트남 현장 업로드 — 반려됨*';
  const foot: string[] = [`처리: ${escapeSlack(by)} · ${fmtDateTime(s.reviewedAt)}`];
  if (s.status === 'rejected' && s.rejectReason) {
    foot.push(`사유: ${escapeSlack(s.rejectReason)}`);
  }
  if (s.status === 'approved') {
    foot.push(`<${SITE}/media|현장 소식에서 보기>`);
  }
  return [
    section(head),
    ...submissionDetailBlocks(s),
    ctx(`${foot.join(' · ')}\nid: ${s.id}`),
  ];
}

/** 현장 업로드 제출 시 승인 카드를 채널에 게시. */
export async function notifySlackSubmission(s: MediaSubmission): Promise<SlackResult> {
  return postSlack({
    text: `📸 베트남 현장 업로드 승인 대기 — ${s.title} (${s.partnerName})`,
    blocks: buildSubmissionPendingBlocks(s),
  });
}

/**
 * 승인/반려 처리 후 원본 카드를 결과 카드로 갱신.
 * Slack 에서 눌렀든 관리자 화면에서 처리했든 동일하게 호출 — 어느 쪽에서
 * 처리해도 채널의 버튼이 살아남아 이중 처리되는 일이 없다.
 */
export async function refreshSubmissionCard(
  s: MediaSubmission,
  by: string,
): Promise<SlackResult> {
  if (!s.slackChannel || !s.slackTs) {
    return { ok: false, skipped: true, error: 'no slack card' };
  }
  const label = s.status === 'approved' ? '승인됨' : '반려됨';
  return updateSlack({
    channel: s.slackChannel,
    ts: s.slackTs,
    text: `베트남 현장 업로드 ${label} — ${s.title}`,
    blocks: buildSubmissionResolvedBlocks(s, by),
  });
}

/* ───────── 문의 접수 카드 ───────── */

export interface InquiryCardPayload {
  id: string;
  createdAt: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  categoryLabel: string;
  subject?: string;
  message: string;
}

export function buildInquiryBlocks(q: InquiryCardPayload): SlackBlock[] {
  const who = q.company?.trim() ? `${q.company} (${q.name})` : q.name;
  const meta = [
    `*접수일* ${fmtDateTime(q.createdAt)}`,
    `*회사명/이름* ${escapeSlack(who)}`,
    `*유형* ${escapeSlack(q.categoryLabel)}${q.subject ? ` · ${escapeSlack(q.subject)}` : ''}`,
    `*이메일* ${escapeSlack(q.email)}`,
    `*연락처* ${escapeSlack(q.phone || '없음')}`,
  ].join('\n');

  return [
    section('📨 *새 문의 접수*'),
    section(meta),
    section(`*문의내용*\n${escapeSlack(q.message)}`),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'open_admin_inquiry',
          text: { type: 'plain_text', text: '관리자에서 보기', emoji: true },
          url: `${SITE}/admin/inquiries`,
        },
      ],
    },
    ctx(
      [
        '💬 이 메시지에 *스레드로 답글*을 달면 그 내용이 고객에게 메일로 나갑니다.',
        '   답글 직후 *발송 확인 카드*가 올라오며, `✅ 발송` 을 눌러야 실제로 전송됩니다.',
        '👀 발송한 메일을 고객이 열어보면 이 스레드에 *열람 알림*이 자동으로 달립니다.',
        '   (수신자가 이미지 자동 로드를 꺼두면 읽어도 표시되지 않을 수 있습니다)',
        `id: ${q.id}`,
      ].join('\n'),
    ),
  ];
}

export async function notifySlackInquiry(q: InquiryCardPayload): Promise<SlackResult> {
  return postSlack({
    text: `📨 새 문의 접수 — ${q.name} (${q.categoryLabel})`,
    blocks: buildInquiryBlocks(q),
  });
}

/* ───────── 답변 발송 확인 카드 (스레드) ───────── */

export function buildReplyConfirmBlocks(p: {
  inquiryId: string;
  to: string;
  customerName: string;
  subject: string;
  reply: string;
  threadTs: string;
  commentTs: string;
}): SlackBlock[] {
  // value 에는 짧은 식별자만 싣는다. 답변 본문은 확인 시점에 원본 댓글에서
  // 다시 읽는다 (button value 2000자 제한 → 긴 답변 잘림 방지).
  const value = `${p.inquiryId}|${p.threadTs}|${p.commentTs}`;
  return [
    section('✉️ *발송 확인* — 아래 내용으로 고객에게 메일을 보낼까요?'),
    section(
      [
        `*받는사람* ${escapeSlack(p.customerName)} <${escapeSlack(p.to)}>`,
        `*제목* ${escapeSlack(p.subject)}`,
      ].join('\n'),
    ),
    section(`*답변 내용*\n>>> ${escapeSlack(p.reply)}`),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: ACTION.inquirySend,
          text: { type: 'plain_text', text: '✅ 발송', emoji: true },
          style: 'primary',
          value,
          confirm: {
            title: { type: 'plain_text', text: '고객에게 메일 발송' },
            text: {
              type: 'mrkdwn',
              text: `*${escapeSlack(p.to)}* 로 답변 메일이 즉시 발송됩니다. 발송 후에는 취소할 수 없습니다.`,
            },
            confirm: { type: 'plain_text', text: '발송' },
            deny: { type: 'plain_text', text: '취소' },
          },
        },
        {
          type: 'button',
          action_id: ACTION.inquiryCancel,
          text: { type: 'plain_text', text: '✖ 취소', emoji: true },
          value,
        },
      ],
    },
    ctx(`id: ${p.inquiryId}`),
  ];
}

export function buildReplySentBlocks(p: {
  inquiryId: string;
  to: string;
  reply: string;
  by: string;
  emailOk: boolean;
}): SlackBlock[] {
  const head = p.emailOk
    ? '✅ *답변 메일 발송 완료*'
    : '⚠️ *답변은 저장됐으나 메일 발송에 실패했습니다* — 메일 설정을 확인하세요.';
  return [
    section(head),
    section(`*받는사람* ${escapeSlack(p.to)}\n*발송자* ${escapeSlack(p.by)}`),
    section(`*답변 내용*\n>>> ${escapeSlack(p.reply)}`),
    ctx(
      p.emailOk
        ? `👀 고객이 메일을 열어보면 이 스레드에 열람 알림이 달립니다.\nid: ${p.inquiryId}`
        : `id: ${p.inquiryId}`,
    ),
  ];
}

export function buildReplyCancelledBlocks(inquiryId: string, by: string): SlackBlock[] {
  return [
    section(`✖ *발송이 취소되었습니다* — ${escapeSlack(by)}`),
    ctx(`메일은 발송되지 않았습니다. 다시 답글을 달면 새 확인 카드가 올라옵니다.\nid: ${inquiryId}`),
  ];
}
