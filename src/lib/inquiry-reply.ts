import { readDataUncached, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';
import { notifyTelegramReply, updateGoogleSheetReply } from '@/lib/integrations';

/**
 * 문의 답변 파이프라인 — 어드민 시스템(PATCH)과 텔레그램 리플라이가 공유.
 *
 * buildReplyEmail: 고객에게 가는 답변 메일(브랜드 템플릿). 단일 소스라
 *   두 경로가 항상 같은 디자인을 쓴다.
 * replyToInquiryById: 외부 채널(텔레그램)에서 답변을 적용할 때 쓰는
 *   self-contained 파이프라인 — 저장 + 고객 메일 + 시트(G/E) + 텔레그램 통지 + 감사로그.
 */

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  category: string;
  subject?: string;
  message: string;
  date: string;
  status: string;
  reply?: string;
  replyAt?: string;
  replyBy?: string;
  assignee?: string;
  dueDate?: string;
  resolvedAt?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  product: '제품 문의',
  order: '주문 문의',
  wholesale: '도매 문의',
  media: '미디어 문의',
  other: '기타 문의',
};

// 고객에게 노출되는 지원 이메일(회신 안내용 표기). 실제 회신은 Gmail SMTP
// 발신자(zoellife.one@gmail.com)로 자연 회신되므로 동일 주소를 표기한다.
const SUPPORT_EMAIL = 'zoellife.one@gmail.com';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildReplyEmail(inq: {
  id: string;
  name: string;
  category: string;
  subject?: string;
  message: string;
  reply: string;
}): { subject: string; html: string; text: string } {
  const catDisplay = CATEGORY_LABEL[inq.category] ?? inq.category;
  const subjectDisplay = inq.subject ?? inq.message.slice(0, 40);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /></head>
<body style="font-family: 'Apple SD Gothic Neo', '맑은 고딕', sans-serif; background:#f9f9f9; margin:0; padding:0;">
  <div style="max-width:600px; margin:32px auto; background:#fff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
    <div style="background:#1a1a0e; padding:28px 32px;">
      <p style="color:#c9a84c; font-size:13px; letter-spacing:0.12em; margin:0 0 6px;">ZOEL LIFE · 대라천</p>
      <h1 style="color:#fff; font-size:20px; margin:0;">문의 답변이 도착했습니다</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#444; font-size:14px; line-height:1.8; margin:0 0 24px;">
        안녕하세요, <strong>${esc(inq.name)}</strong>님.<br />
        대라천을 찾아주셔서 감사합니다.<br />
        문의하신 내용에 대한 답변을 아래와 같이 안내드립니다.
      </p>

      <div style="background:#f5f3ee; border-left:3px solid #c9a84c; padding:16px 20px; border-radius:4px; margin-bottom:20px;">
        <p style="font-size:12px; color:#888; margin:0 0 6px;">문의 유형: ${esc(catDisplay)}</p>
        <p style="font-size:14px; color:#333; font-weight:600; margin:0;">${esc(subjectDisplay)}</p>
      </div>

      <div style="background:#fff; border:1px solid #e5e5e5; border-radius:6px; padding:20px; margin-bottom:28px;">
        <p style="font-size:12px; color:#888; margin:0 0 10px; text-transform:uppercase; letter-spacing:0.08em;">답변 내용</p>
        <p style="font-size:14px; color:#333; line-height:1.9; margin:0; white-space:pre-wrap;">${esc(inq.reply)}</p>
      </div>

      <p style="font-size:13px; color:#666; line-height:1.8; margin:0 0 24px;">
        추가로 궁금하신 사항이 있으시면 이 메일에 그대로 회신해 주세요.
      </p>

      <div style="border-top:1px solid #eee; padding-top:20px; font-size:12px; color:#999; line-height:1.8;">
        <strong style="color:#555;">ZOEL LIFE · 대라천</strong><br />
        이메일: ${SUPPORT_EMAIL}<br />
        전화: 070-4140-4086<br />
        <span style="font-size:11px;">평일 09:00 - 18:00 (점심 12:00 - 13:00 / 주말·공휴일 휴무)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `안녕하세요, ${inq.name}님.\n\n문의하신 내용에 대한 답변입니다.\n\n[답변 내용]\n${inq.reply}\n\n감사합니다.\nZOEL LIFE · 대라천\n전화: 070-4140-4086`;

  // 제목 끝 [#inq-...] 토큰 — 고객 답장을 인박스 폴링이 이 문의로 매칭하는 키. 유지.
  const subject = `[대라천] 문의하신 내용에 답변이 도착했습니다 [#${inq.id}]`;

  return { subject, html, text };
}

export interface ReplyResult {
  ok: boolean;
  error?: string;
  inquiry?: InquiryRecord;
  emailOk?: boolean;
}

/**
 * inquiryId 문의에 답변을 적용한다 (텔레그램 리플라이 경로 등 외부 진입점용).
 * 어드민 PATCH 와 동일한 부수효과를 단일 함수로 보장:
 *   저장(reply/replyAt/replyBy, status→replied) + 고객 메일 + 시트 + 텔레그램 통지 + 감사로그.
 */
export async function replyToInquiryById(
  inquiryId: string,
  replyText: string,
  repliedBy?: string,
): Promise<ReplyResult> {
  const reply = replyText.trim();
  if (!reply) return { ok: false, error: '답변 내용이 비어 있습니다.' };

  const inquiries = (await readDataUncached('inquiries')) as InquiryRecord[];
  const idx = inquiries.findIndex((q) => q.id === inquiryId);
  if (idx === -1) return { ok: false, error: `문의(${inquiryId})를 찾을 수 없습니다.` };

  const prev = inquiries[idx];
  const nowIso = new Date().toISOString();
  const updated: InquiryRecord = {
    ...prev,
    reply,
    replyAt: nowIso,
    // resolved(완료) 였으면 상태 유지, 그 외에는 replied(답변완료) 로.
    status: prev.status === 'resolved' ? prev.status : 'replied',
  };
  if (repliedBy && repliedBy.trim()) updated.replyBy = repliedBy.trim();
  inquiries[idx] = updated;
  await writeData('inquiries', inquiries);

  const catDisplay = CATEGORY_LABEL[updated.category] ?? updated.category;
  const subjectDisplay = updated.subject ?? updated.message.slice(0, 40);

  // 고객 메일 (결과를 받아 webhook 이 성공/실패를 텔레그램에 회신할 수 있게 await).
  const mail = buildReplyEmail({
    id: updated.id,
    name: updated.name,
    category: updated.category,
    subject: updated.subject,
    message: updated.message,
    reply: updated.reply!,
  });
  const emailRes = await sendEmail({
    to: updated.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  }).catch((err: unknown) => ({
    ok: false as const,
    error: err instanceof Error ? err.message : String(err),
  }));

  // 시트(G=답변, E=상태) + 텔레그램 "✅ 답변 발송" 통지 — fire-and-forget.
  updateGoogleSheetReply({
    inquiryId: updated.id,
    replyAt: updated.replyAt!,
    replyBy: updated.replyBy,
    reply: updated.reply!,
    assignee: updated.assignee,
    dueDate: updated.dueDate,
    status: updated.status,
    resolvedAt: updated.resolvedAt,
  }).then((r) => {
    if (!r.ok && !r.skipped) console.error('[inquiry-reply] sheet error:', r.error);
  }).catch((err: unknown) => console.error('[inquiry-reply] sheet threw:', err));

  notifyTelegramReply({
    inquiryId: updated.id,
    customerName: updated.name,
    customerCompany: updated.company,
    customerEmail: updated.email,
    categoryLabel: catDisplay,
    subject: subjectDisplay,
    question: updated.message,
    reply: updated.reply!,
    repliedBy: updated.replyBy,
    assignee: updated.assignee,
    dueDate: updated.dueDate,
    status: updated.status,
    resolvedAt: updated.resolvedAt,
  }).then((r) => {
    if (!r.ok && !r.skipped) console.error('[inquiry-reply] telegram error:', r.error);
  }).catch((err: unknown) => console.error('[inquiry-reply] telegram threw:', err));

  await logAdmin('inquiries', 'reply', {
    targetId: updated.id,
    summary: `문의 답변(텔레그램) (${updated.id})`,
    meta: { repliedBy: updated.replyBy ?? null, via: 'telegram' },
  });

  return { ok: true, inquiry: updated, emailOk: emailRes.ok };
}
