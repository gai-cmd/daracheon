import { NextRequest, NextResponse } from 'next/server';
import {
  resolveSlackConfig,
  verifySlackSignature,
  updateSlack,
  postEphemeral,
  openSlackModal,
  fetchThreadMessage,
} from '@/lib/slack';
import {
  ACTION,
  REJECT_MODAL_CALLBACK,
  REJECT_REASON_BLOCK,
  REJECT_REASON_ACTION,
  buildReplySentBlocks,
  buildReplyCancelledBlocks,
} from '@/lib/slack-notify';
import { reviewSubmission } from '@/lib/submission-review';
import { replyToInquiryById } from '@/lib/inquiry-reply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Slack 인터랙션 수신 — 버튼 클릭 + 모달 제출.
 *   Slack App → Interactivity & Shortcuts → Request URL
 *   https://zoellife.com/api/slack/interactive
 *
 * 처리 대상:
 *   - 현장 업로드 [✅ 승인] / [⛔ 반려](→ 사유 입력 모달)
 *   - 문의 답변 [✅ 발송] / [✖ 취소]
 *
 * 권한: 채널 참여자면 누구나 (채널 초대 자체가 접근 통제). 누가 눌렀는지는
 * 감사로그와 카드에 Slack 표시이름으로 남는다.
 */

interface SlackUser {
  id?: string;
  name?: string;
  username?: string;
}

interface InteractivePayload {
  type?: string;
  user?: SlackUser;
  trigger_id?: string;
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
  view?: {
    callback_id?: string;
    private_metadata?: string;
    state?: {
      values?: Record<string, Record<string, { value?: string | null }>>;
    };
  };
}

function actorOf(user?: SlackUser): string {
  return user?.name || user?.username || user?.id || 'Slack';
}

export async function POST(req: NextRequest) {
  const cfg = await resolveSlackConfig();
  if (!cfg.signingSecret) {
    console.error('[slack/interactive] SLACK_SIGNING_SECRET 미설정 — 요청 거부');
    return new NextResponse('not configured', { status: 503 });
  }

  // 서명 검증은 raw body 로만 가능 — 파싱 전에 문자열을 확보한다.
  const raw = await req.text();
  const valid = verifySlackSignature(
    raw,
    req.headers.get('x-slack-request-timestamp'),
    req.headers.get('x-slack-signature'),
    cfg.signingSecret,
  );
  if (!valid) return new NextResponse('invalid signature', { status: 401 });

  let payload: InteractivePayload;
  try {
    const encoded = new URLSearchParams(raw).get('payload');
    if (!encoded) return NextResponse.json({ ok: true });
    payload = JSON.parse(encoded) as InteractivePayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (payload.type === 'block_actions') return await handleBlockActions(payload);
    if (payload.type === 'view_submission') return await handleViewSubmission(payload);
  } catch (err) {
    console.error('[slack/interactive] handler error:', err);
  }
  return NextResponse.json({ ok: true });
}

/* ───────── 버튼 클릭 ───────── */

async function handleBlockActions(p: InteractivePayload): Promise<NextResponse> {
  const action = p.actions?.[0];
  const actionId = action?.action_id;
  const channel = p.channel?.id;
  const actor = actorOf(p.user);
  if (!actionId || !channel) return NextResponse.json({ ok: true });

  /* 현장 업로드 승인 */
  if (actionId === ACTION.submissionApprove) {
    const id = action?.value ?? '';
    const result = await reviewSubmission(id, 'approve', { actor, via: 'slack' });
    if (!result.ok && p.user?.id) {
      await postEphemeral({
        channel,
        user: p.user.id,
        text: `⚠️ 승인하지 못했습니다: ${result.message ?? '알 수 없는 오류'}`,
      }).catch(() => {});
    }
    // 성공 시 reviewSubmission 이 원본 카드를 '승인됨' 으로 갱신한다.
    return NextResponse.json({ ok: true });
  }

  /* 현장 업로드 반려 → 사유 입력 모달 */
  if (actionId === ACTION.submissionReject) {
    const id = action?.value ?? '';
    if (!p.trigger_id) return NextResponse.json({ ok: true });

    // trigger_id 는 3초 후 만료된다. 모달을 여는 경로에서는 Blob 조회 같은
    // 느린 I/O 를 하지 않는다 — 대상 정보는 바로 뒤에 보이는 카드로 충분하다.
    await openSlackModal(p.trigger_id, {
      type: 'modal',
      callback_id: REJECT_MODAL_CALLBACK,
      // 모달은 원본 메시지 컨텍스트를 잃으므로 여기 실어 보낸다.
      private_metadata: JSON.stringify({ id, channel, ts: p.message?.ts }),
      title: { type: 'plain_text', text: '현장 업로드 반려' },
      submit: { type: 'plain_text', text: '반려' },
      close: { type: 'plain_text', text: '취소' },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '이 현장 업로드를 반려합니다. 사유를 적어주세요.',
          },
        },
        {
          type: 'input',
          block_id: REJECT_REASON_BLOCK,
          label: { type: 'plain_text', text: '반려 사유' },
          hint: {
            type: 'plain_text',
            text: '파트너의 업로드 화면에 그대로 표시됩니다. 무엇을 고쳐야 하는지 적어주세요.',
          },
          element: {
            type: 'plain_text_input',
            action_id: REJECT_REASON_ACTION,
            multiline: true,
            max_length: 500,
            placeholder: { type: 'plain_text', text: '예) 사진이 흐립니다. 농장 전경이 보이게 다시 촬영해 주세요.' },
          },
        },
      ],
    });
    return NextResponse.json({ ok: true });
  }

  /* 문의 답변 발송 확인 */
  if (actionId === ACTION.inquirySend) {
    const [inquiryId, threadTs, commentTs] = (action?.value ?? '').split('|');
    if (!inquiryId || !threadTs || !commentTs) return NextResponse.json({ ok: true });

    // 답변 원문을 이 시점에 다시 읽는다 — 버튼 value 2000자 제한을 우회하고,
    // 운영자가 확인 카드 뒤에 댓글을 수정했다면 최신 내용이 반영된다.
    const src = await fetchThreadMessage(channel, threadTs, commentTs);
    if (!src.ok || !src.text?.trim()) {
      await updateSlack({
        channel,
        ts: p.message?.ts ?? '',
        text: '답변 원문을 읽지 못했습니다.',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⚠️ *발송 실패* — 답변 원문을 읽지 못했습니다: ${src.error ?? '알 수 없는 오류'}`,
            },
          },
        ],
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    const result = await replyToInquiryById(inquiryId, src.text.trim(), actor, 'slack');

    if (!result.ok) {
      await updateSlack({
        channel,
        ts: p.message?.ts ?? '',
        text: '발송 실패',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⚠️ *발송 실패* (${inquiryId}): ${result.error ?? '알 수 없는 오류'}\n메일은 발송되지 않았습니다.`,
            },
          },
        ],
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    await updateSlack({
      channel,
      ts: p.message?.ts ?? '',
      text: result.emailOk ? '답변 메일 발송 완료' : '답변 저장됨 (메일 실패)',
      blocks: buildReplySentBlocks({
        inquiryId,
        to: result.inquiry?.email ?? '',
        reply: src.text.trim(),
        by: actor,
        emailOk: Boolean(result.emailOk),
      }),
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  /* 문의 답변 발송 취소 */
  if (actionId === ACTION.inquiryCancel) {
    const [inquiryId] = (action?.value ?? '').split('|');
    await updateSlack({
      channel,
      ts: p.message?.ts ?? '',
      text: '발송이 취소되었습니다.',
      blocks: buildReplyCancelledBlocks(inquiryId ?? '', actor),
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // 'open_admin' 등 URL 버튼은 Slack 이 자체 처리 — ack 만.
  return NextResponse.json({ ok: true });
}

/* ───────── 모달 제출 (반려 사유) ───────── */

async function handleViewSubmission(p: InteractivePayload): Promise<NextResponse> {
  if (p.view?.callback_id !== REJECT_MODAL_CALLBACK) return NextResponse.json({ ok: true });

  let meta: { id?: string; channel?: string; ts?: string } = {};
  try {
    meta = JSON.parse(p.view.private_metadata ?? '{}');
  } catch {
    /* 빈 메타로 진행 → 아래 가드에서 걸림 */
  }
  if (!meta.id) return NextResponse.json({ ok: true });

  const reason =
    p.view.state?.values?.[REJECT_REASON_BLOCK]?.[REJECT_REASON_ACTION]?.value ?? '';
  const actor = actorOf(p.user);

  const result = await reviewSubmission(meta.id, 'reject', {
    actor,
    via: 'slack',
    reason,
  });

  if (!result.ok) {
    // 모달 응답으로 오류를 그 자리에서 보여준다.
    return NextResponse.json({
      response_action: 'errors',
      errors: {
        [REJECT_REASON_BLOCK]: result.message ?? '반려하지 못했습니다.',
      },
    });
  }

  // 성공 시 reviewSubmission 이 원본 카드를 '반려됨' 으로 갱신한다.
  // 모달은 빈 200 응답으로 닫힌다.
  return new NextResponse(null, { status: 200 });
}
