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
 * 운영자가 봇의 "📨 새 문의" 알림 카드에 답장(Reply)하면 그 본문이 곧 고객
 * 답변 → replyToInquiryById 로 고객 메일 + 관리자 저장 + 구글시트 + 텔레그램
 * 통지를 한 번에 처리. 접두어 불필요(습관적 "답변)" 만 떼고 사용).
 * 카드 답장이 아닌 메시지(내부 대화 등)는 무시.
 *
 * 인증: setWebhook 의 secret_token 을 Telegram 이 매 호출마다
 *   X-Telegram-Bot-Api-Secret-Token 헤더로 보냄 → telegram-bot-state.webhookSecret 와 대조.
 */

interface BotState {
  webhookSecret?: string;
}
interface IntegrationLite {
  telegramChatId?: string;
}
interface TelegramMessage {
  text?: string;
  chat?: { id?: number | string };
  from?: { first_name?: string; username?: string };
  reply_to_message?: { text?: string };
}

// 알림 카드 본문의 "id: inq-123" 또는 "[#inq-123]" 에서 문의 ID 추출.
function extractInquiryId(text: string): string | null {
  const m = text.match(/inq-\d+/i);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest) {
  // Telegram 재시도 폭주 방지: 인증만 통과하면 처리 결과와 무관하게 200.
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

  // 3) 봇 알림 카드(원 문의 ID 포함)에 대한 답장이 아니면 무시.
  const inquiryId = extractInquiryId(msg.reply_to_message?.text ?? '');
  if (!inquiryId) return ack();

  // 4) 카드 답장이면 본문이 곧 고객 답변. 습관적 "답변)"/"답변:" 접두어만 제거.
  let replyText = msg.text.trim();
  const legacyPrefix = replyText.match(/^답변\s*[)\]:：>.]\s*/);
  if (legacyPrefix) replyText = replyText.slice(legacyPrefix[0].length).trim();
  // 빈 내용·봇 명령(/...)은 무시.
  if (!replyText || replyText.startsWith('/')) return ack();

  // 5) 답변 적용 (저장 + 고객 메일 + 시트 + "✅ 답변 발송" 텔레그램 통지)
  const repliedBy = msg.from?.first_name || msg.from?.username || '텔레그램';
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
