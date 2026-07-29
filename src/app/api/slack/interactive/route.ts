import { NextRequest, NextResponse, after } from 'next/server';
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

  // ── Slack 은 인터랙션에도 3초 안에 200 을 요구한다. 이메일 발송·blob
  //    쓰기를 응답 전에 하면 초과 → 사용자에게 "⚠️ 문제 발생" 이 뜨고
  //    재시도 클릭으로 이중 처리 위험이 생긴다. 모달 열기(trigger_id 3초
  //    만료)와 무거운 처리 모두 after() 로 미루고 즉시 ack 한다.
  //    (view_submission 도 동일 — 모달은 빈 200 으로 즉시 닫고 결과는
  //    카드 갱신/에페메랄로 알린다.) ──
  if (payload.type === 'block_actions' || payload.type === 'view_submission') {
    const p = payload;
    after(async () => {
      try {
        if (p.type === 'block_actions') await handleBlockActions(p);
        else await handleViewSubmission(p);
      } catch (err) {
        console.error('[slack/interactive] handler error:', err);
        // 실패를 본인에게 자가 보고 — Vercel 로그 없이도 원인 확인 가능.
        const channel = p.channel?.id;
        if (channel && p.user?.id) {
          const reason = err instanceof Error ? err.message : String(err);
          await postEphemeral({
            channel,
            user: p.user.id,
            text: `⚠️ 처리 중 오류가 발생했습니다: ${reason.slice(0, 300)}`,
          }).catch(() => {});
        }
      }
    });
  }
  return NextResponse.json({ ok: true });
}

/* ───────── 버튼 클릭 ───────── */

async function handleBlockActions(p: InteractivePayload): Promise<void> {
  const action = p.actions?.[0];
  const actionId = action?.action_id;
  const channel = p.channel?.id;
  const actor = actorOf(p.user);
  if (!actionId || !channel) return;

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
    return;
  }

  /* 현장 업로드 반려 → 사유 입력 모달 */
  if (actionId === ACTION.submissionReject) {
    const id = action?.value ?? '';
    if (!p.trigger_id) return;

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
    return;
  }

  /* 문의 답변 발송 확인 */
  if (actionId === ACTION.inquirySend) {
    const [inquiryId, threadTs, commentTs] = (action?.value ?? '').split('|');
    if (!inquiryId || !threadTs || !commentTs) return;

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
      return;
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
      return;
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
    return;
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
    return;
  }

  // 'open_admin' 등 URL 버튼은 Slack 이 자체 처리 — 할 일 없음.
}

/* ───────── 모달 제출 (반려 사유) ───────── */

async function handleViewSubmission(p: InteractivePayload): Promise<void> {
  if (p.view?.callback_id !== REJECT_MODAL_CALLBACK) return;

  let meta: { id?: string; channel?: string; ts?: string } = {};
  try {
    meta = JSON.parse(p.view.private_metadata ?? '{}');
  } catch {
    /* 빈 메타로 진행 → 아래 가드에서 걸림 */
  }
  if (!meta.id) return;

  const reason =
    p.view.state?.values?.[REJECT_REASON_BLOCK]?.[REJECT_REASON_ACTION]?.value ?? '';
  const actor = actorOf(p.user);

  const result = await reviewSubmission(meta.id, 'reject', {
    actor,
    via: 'slack',
    reason,
  });

  // 모달은 즉시 ack 로 이미 닫혔다 — 실패는 본인에게만 보이는 메시지로 회신.
  // (3초 ack 제약 때문에 모달 인라인 오류 대신 이 방식을 쓴다)
  if (!result.ok && meta.channel && p.user?.id) {
    await postEphemeral({
      channel: meta.channel,
      user: p.user.id,
      text: `⚠️ 반려하지 못했습니다: ${result.message ?? '알 수 없는 오류'}`,
    }).catch(() => {});
  }
  // 성공 시 reviewSubmission 이 원본 카드를 '반려됨' 으로 갱신한다.
}
