import { NextRequest, NextResponse } from 'next/server';
import { readDataUncached } from '@/lib/db';
import {
  resolveSlackConfig,
  verifySlackSignature,
  postSlack,
  fetchThreadRootText,
} from '@/lib/slack';
import { buildReplyConfirmBlocks } from '@/lib/slack-notify';
import { buildReplyEmail, type InquiryRecord } from '@/lib/inquiry-reply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Slack Events 수신 — 문의 카드 스레드의 답글 감지.
 *   Slack App → Event Subscriptions → Request URL
 *   https://zoellife.com/api/slack/events
 *   구독 이벤트: message.channels (비공개 채널이면 message.groups 추가)
 *
 * 흐름: 운영자가 "📨 새 문의 접수" 카드에 스레드 답글
 *   → 이 라우트가 그 스레드가 어느 문의인지 확인
 *   → 같은 스레드에 "발송 확인" 카드를 올린다 (아직 메일 발송 안 함)
 *   → [✅ 발송] 을 눌러야 api/slack/interactive 가 실제로 발송
 *
 * 텔레그램 경로(api/telegram/webhook)와 동일한 규약: 카드 본문의 `id: inq-...`
 * 가 문의를 되짚는 유일한 키다. 카드 답글이 아니면 무시 → 채널의 일반 대화를
 * 답변으로 오인하지 않는다.
 */

interface SlackEvent {
  type?: string;
  subtype?: string;
  text?: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  channel?: string;
  ts?: string;
  thread_ts?: string;
  channel_type?: string;
}

interface EventEnvelope {
  type?: string;
  challenge?: string;
  event?: SlackEvent;
}

function extractInquiryId(text: string): string | null {
  const m = text.match(/inq-\d+/i);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest) {
  const ack = () => NextResponse.json({ ok: true });

  const cfg = await resolveSlackConfig();
  if (!cfg.signingSecret) {
    console.error('[slack/events] SLACK_SIGNING_SECRET 미설정 — 요청 거부');
    return new NextResponse('not configured', { status: 503 });
  }

  const raw = await req.text();
  const valid = verifySlackSignature(
    raw,
    req.headers.get('x-slack-request-timestamp'),
    req.headers.get('x-slack-signature'),
    cfg.signingSecret,
  );
  if (!valid) return new NextResponse('invalid signature', { status: 401 });

  let body: EventEnvelope;
  try {
    body = JSON.parse(raw) as EventEnvelope;
  } catch {
    return ack();
  }

  // Request URL 최초 등록 시의 소유권 확인 핸드셰이크.
  if (body.type === 'url_verification' && body.challenge) {
    return new NextResponse(body.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Slack 재전송(3초 내 미응답 등)은 무시 — 확인 카드가 중복 생성되는 것을 막는다.
  if (req.headers.get('x-slack-retry-num')) return ack();

  const ev = body.event;
  if (!ev || ev.type !== 'message') return ack();
  // 봇 메시지·편집/삭제 등 subtype 은 답변으로 보지 않는다 (무한 루프 차단).
  if (ev.bot_id || ev.app_id || ev.subtype) return ack();
  if (!ev.text?.trim() || !ev.channel || !ev.ts) return ack();
  // 스레드 답글만 대상. 채널 최상위 대화는 무시.
  if (!ev.thread_ts || ev.thread_ts === ev.ts) return ack();

  try {
    // 스레드 부모가 우리 문의 카드인지 확인.
    const rootText = await fetchThreadRootText(ev.channel, ev.thread_ts);
    if (!rootText) return ack();
    const inquiryId = extractInquiryId(rootText);
    if (!inquiryId) return ack();

    const replyText = ev.text.trim();
    // 봇 명령·슬래시는 답변이 아니다.
    if (replyText.startsWith('/')) return ack();

    const inquiries = await readDataUncached<InquiryRecord>('inquiries');
    const inq = inquiries.find((q) => q.id === inquiryId);
    if (!inq) {
      await postSlack({
        channel: ev.channel,
        threadTs: ev.thread_ts,
        text: `⚠️ 문의(${inquiryId})를 찾을 수 없습니다. 관리자 화면에서 확인해 주세요.`,
      }).catch(() => {});
      return ack();
    }

    const subject = buildReplyEmail({
      id: inq.id,
      name: inq.name,
      category: inq.category,
      subject: inq.subject,
      message: inq.message,
      reply: replyText,
    }).subject;

    // 확인 카드만 올린다 — 이 시점에는 메일이 나가지 않는다.
    await postSlack({
      channel: ev.channel,
      threadTs: ev.thread_ts,
      text: `발송 확인 — ${inq.name} 님에게 답변 메일을 보낼까요?`,
      blocks: buildReplyConfirmBlocks({
        inquiryId,
        to: inq.email,
        customerName: inq.name,
        subject,
        reply: replyText,
        threadTs: ev.thread_ts,
        commentTs: ev.ts,
      }),
    });
  } catch (err) {
    console.error('[slack/events] handler error:', err);
  }

  return ack();
}
