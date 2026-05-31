import { NextRequest, NextResponse } from 'next/server';
import { readSingleUncached } from '@/lib/db';
import { replyToInquiryById } from '@/lib/inquiry-reply';
import { sendTelegramMessage } from '@/lib/integrations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * 텔레그램 리플라이 수신 웹훅.
 *
 * 운영자가 봇이 올린 "📨 새 문의" 알림에 **답장(Reply)** 으로, 맨 앞에
 * "답변)" 을 붙여 메시지를 보내면 → 그 내용이 고객에게 메일로 발송되고
 * 관리자 저장·구글시트·텔레그램 통지(replyToInquiryById)까지 한 번에 처리된다.
 *
 * "답변)" 접두어를 강제하는 이유: 같은 채널에서 오가는 내부 대화(그냥 친 답장)가
 * 실수로 고객에게 발송되는 것을 막기 위함.
 *
 * 인증: setWebhook 시 등록한 secret_token 을 Telegram 이 매 호출마다
 *   X-Telegram-Bot-Api-Secret-Token 헤더로 보낸다. telegram-bot-state.webhookSecret 과 대조.
 */

interface BotState {
  webhookSecret?: string;
}
interface IntegrationLite {
  telegramChatId?: string;
}

const REPLY_PREFIX = '답변)';

// 알림 메시지 본문의 "id: inq-123" 또는 "[#inq-123]" 에서 문의 ID 추출.
function extractInquiryId(text: string): string | null {
  const m = text.match(/inq-\d+/i);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest) {
  // Telegram 재시도 폭주 방지를 위해, 인증만 통과하면 처리 결과와 무관하게 200.
  const ack = () => NextResponse.json({ ok: true });

  // 1) secret_token 검증
  const state = (await readSingleUncached<BotState>('telegram-bot-state')) ?? {};
  const provided = req.headers.get('x-telegram-bot-api-secret-token');
  if (!state.webhookSecret || provided !== state.webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return ack();
  }

  const u = update as {
    message?: TelegramMessage;
    channel_post?: TelegramMessage;
    edited_message?: TelegramMessage;
  };
  const msg = u.message ?? u.channel_post ?? u.edited_message;
  if (!msg || typeof msg.text !== 'string') return ack();

  // 2) 설정된 운영 채팅에서 온 것만 처리
  const integ = (await readSingleUncached<IntegrationLite>('integration-settings')) ?? {};
  if (integ.telegramChatId && String(msg.chat?.id) !== String(integ.telegramChatId)) {
    return ack();
  }

  // 3) 트리거: "답변)" 접두어
  const text = msg.text;
  if (!text.startsWith(REPLY_PREFIX)) return ack();

  // 4) 봇 알림에 대한 답장에서 문의 ID 추출
  const sourceText = msg.reply_to_message?.text ?? '';
  const inquiryId = extractInquiryId(sourceText);
  if (!inquiryId) {
    await sendTelegramMessage(
      '⚠️ 답변을 보낼 원 문의를 찾지 못했습니다. 봇이 올린 "📨 새 문의" 알림에 <b>답장(Reply)</b>으로 보내주세요.',
    ).catch(() => {});
    return ack();
  }

  const replyText = text.slice(REPLY_PREFIX.length).trim();
  if (!replyText) {
    await sendTelegramMessage(`⚠️ 보낼 답변 내용이 비어 있습니다. (${inquiryId})`).catch(() => {});
    return ack();
  }

  const repliedBy = msg.from?.first_name || msg.from?.username || '텔레그램';

  // 5) 답변 적용 (저장 + 고객 메일 + 시트 + "✅ 답변 발송" 텔레그램 통지)
  const result = await replyToInquiryById(inquiryId, replyText, repliedBy);
  if (!result.ok) {
    await sendTelegramMessage(
      `⚠️ 답변 전송 실패 (${inquiryId}): ${result.error ?? '알 수 없는 오류'}`,
    ).catch(() => {});
  } else if (!result.emailOk) {
    await sendTelegramMessage(
      `⚠️ ${inquiryId}: 저장은 됐지만 고객 메일 발송에 실패했습니다. 메일 설정을 확인하세요.`,
    ).catch(() => {});
  }
  // 성공 시: replyToInquiryById 가 "✅ 답변 발송" 카드를 채널에 이미 올린다.
  return ack();
}

interface TelegramMessage {
  text?: string;
  chat?: { id?: number | string };
  from?: { first_name?: string; username?: string };
  reply_to_message?: { text?: string };
}
