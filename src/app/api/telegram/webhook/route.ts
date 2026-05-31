import { NextRequest, NextResponse } from 'next/server';
import { readSingleUncached, writeSingle, readDataUncached } from '@/lib/db';
import { replyToInquiryById } from '@/lib/inquiry-reply';
import { sendTelegramMessage } from '@/lib/integrations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * 텔레그램 리플라이 수신 웹훅. (DEBUG 로깅 임시 포함 — telegram-webhook-debug blob)
 *
 * 운영자가 봇의 "📨 새 문의" 알림에 답장(Reply)으로 "답변)" 접두어를 붙여
 * 보내면 → 고객 답변 메일 + 관리자 저장 + 시트 + 텔레그램 통지(replyToInquiryById).
 */

interface BotState { webhookSecret?: string }
interface IntegrationLite { telegramChatId?: string }
interface DebugRecord { at: string; outcome: string; [k: string]: unknown }

// 알림 메시지 본문의 "id: inq-123" 또는 "[#inq-123]" 에서 문의 ID 추출.
function extractInquiryId(text: string): string | null {
  const m = text.match(/inq-\d+/i);
  return m ? m[0] : null;
}

async function logDebug(rec: DebugRecord) {
  try {
    const prev = (await readSingleUncached<{ records?: DebugRecord[] }>('telegram-webhook-debug')) ?? {};
    const records = Array.isArray(prev.records) ? prev.records : [];
    records.push(rec);
    await writeSingle('telegram-webhook-debug', { records: records.slice(-25) });
  } catch { /* 디버그 실패는 무시 */ }
}

interface TelegramMessage {
  text?: string;
  chat?: { id?: number | string; type?: string };
  from?: { first_name?: string; username?: string };
  reply_to_message?: { text?: string; from?: { username?: string; is_bot?: boolean } };
}

export async function POST(req: NextRequest) {
  const ack = () => NextResponse.json({ ok: true });

  // 1) secret 검증
  const state = (await readSingleUncached<BotState>('telegram-bot-state')) ?? {};
  const provided = req.headers.get('x-telegram-bot-api-secret-token');
  const secretOk = !!state.webhookSecret && provided === state.webhookSecret;
  if (!secretOk) {
    await logDebug({ at: new Date().toISOString(), outcome: 'auth-fail', hasStoredSecret: !!state.webhookSecret, providedPresent: !!provided });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: unknown;
  try { update = await req.json(); } catch {
    await logDebug({ at: new Date().toISOString(), outcome: 'bad-json' });
    return ack();
  }

  const u = update as { message?: TelegramMessage; channel_post?: TelegramMessage; edited_message?: TelegramMessage };
  const updateKeys = Object.keys(u as Record<string, unknown>);
  const msg = u.message ?? u.channel_post ?? u.edited_message;

  if (!msg || typeof msg.text !== 'string') {
    await logDebug({ at: new Date().toISOString(), outcome: 'no-text-msg', updateKeys });
    return ack();
  }

  const integ = (await readSingleUncached<IntegrationLite>('integration-settings')) ?? {};
  const text = msg.text;
  const sourceText = msg.reply_to_message?.text ?? '';
  const inquiryId = extractInquiryId(sourceText);
  const base = {
    at: new Date().toISOString(),
    chatId: String(msg.chat?.id ?? ''),
    chatType: msg.chat?.type,
    cfgChatId: String(integ.telegramChatId ?? ''),
    text: text.slice(0, 80),
    isReply: !!msg.reply_to_message,
    replyToFromBot: msg.reply_to_message?.from?.is_bot ?? null,
    replyToText: sourceText.slice(0, 80),
    inquiryId,
  };

  // 2) 운영 채팅 확인
  if (integ.telegramChatId && String(msg.chat?.id) !== String(integ.telegramChatId)) {
    await logDebug({ ...base, outcome: 'chat-mismatch' });
    return ack();
  }

  // 3) 카드 답장(원 문의 ID 포함)인지
  if (!inquiryId) {
    await logDebug({ ...base, outcome: 'not-card-reply' });
    return ack();
  }

  // 4) 트리거 접두어
  const trimmed = text.replace(/^\s+/, '');
  const trigger = trimmed.match(/^답변\s*[)\]:：>.]\s*/);
  if (!trigger) {
    await sendTelegramMessage(
      `ℹ️ 이 문의(${inquiryId})를 고객에게 답변하시려면 메시지를 <b>답변)</b> 으로 시작해 주세요.\n예) <code>답변) 안녕하세요, 문의 주셔서 감사합니다...</code>`,
    ).catch(() => {});
    await logDebug({ ...base, outcome: 'no-trigger-hint-sent' });
    return ack();
  }

  const replyText = trimmed.slice(trigger[0].length).trim();
  if (!replyText) {
    await sendTelegramMessage(`⚠️ 보낼 답변 내용이 비어 있습니다. (${inquiryId})`).catch(() => {});
    await logDebug({ ...base, outcome: 'empty-reply' });
    return ack();
  }

  // 5) 적용 전, 문의 존재 여부 진단 (stale read 등으로 못 찾는 케이스 식별)
  let foundInBlob = false;
  try {
    const all = (await readDataUncached('inquiries')) as Array<{ id?: string }>;
    foundInBlob = all.some((q) => q.id === inquiryId);
  } catch { /* ignore */ }

  const repliedBy = msg.from?.first_name || msg.from?.username || '텔레그램';
  const result = await replyToInquiryById(inquiryId, replyText, repliedBy);

  if (!result.ok) {
    await sendTelegramMessage(`⚠️ 답변 전송 실패 (${inquiryId}): ${result.error ?? '알 수 없는 오류'}`).catch(() => {});
    await logDebug({ ...base, outcome: 'apply-failed', foundInBlob, error: result.error });
  } else if (!result.emailOk) {
    await sendTelegramMessage(`⚠️ ${inquiryId}: 저장은 됐지만 고객 메일 발송에 실패했습니다.`).catch(() => {});
    await logDebug({ ...base, outcome: 'applied-email-failed', foundInBlob });
  } else {
    await logDebug({ ...base, outcome: 'applied-ok', foundInBlob });
  }
  return ack();
}
