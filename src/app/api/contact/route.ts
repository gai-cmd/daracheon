import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readDataForWrite, appendData, readSingleSafe } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { appendToGoogleSheet, notifyTelegram, sendTelegramMessage, type InquiryPayload } from '@/lib/integrations';

interface MailSettingsLite { adminEmail?: string }

// IP 기반 rate limit. process-local 이라 분산/서버리스에선 불완전하지만
// 단일 인스턴스 기준 자동 봇 투입은 차단. 더 강한 보호는 Vercel KV 나
// Cloudflare Turnstile 연동 필요.
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1시간 윈도우
const RATE_MAX = 20;                    // IP 당 최대 20건/시간 (실수 재제출/QA 여유)
const EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 동일 이메일은 5분 안에 재접수 불가
const rateBucket = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function checkRate(ip: string): boolean {
  const now = Date.now();
  const history = (rateBucket.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (history.length >= RATE_MAX) {
    rateBucket.set(ip, history);
    return false;
  }
  history.push(now);
  rateBucket.set(ip, history);
  return true;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;     // 회사명 (선택)
  category: string;
  subject: string;
  message: string;
  date: string;
  status: string;
  createdAt?: string;
}

const contactSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  email: z.string().email('올바른 이메일 주소를 입력해 주세요.'),
  phone: z.string().max(20).optional().default(''),
  company: z.string().max(100).optional().default(''),
  category: z.enum(['product', 'order', 'wholesale', 'media', 'other']).optional().default('product'),
  subject: z.string().max(200).optional().default(''),
  message: z.string().min(10, '문의 내용을 10자 이상 입력해 주세요.').max(2000),
});

const categoryLabel: Record<string, string> = {
  product: '제품',
  order: '주문',
  wholesale: '도매',
  media: '미디어',
  other: '기타',
};

export async function POST(request: NextRequest) {
  // 저장 실패 시 운영자 경보용 — try 안에서 검증 통과한 신원만 담는다.
  let attempted: { name: string; email: string } | null = null;
  try {
    const ip = clientIp(request);
    if (!checkRate(ip)) {
      return NextResponse.json(
        { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot: 폼에 사람 눈에 안 보이게 숨겨둔 `website` 필드. 봇이 자동으로
    // 채우면 값이 들어온다. 200 으로 조용히 응답해 봇이 실패 신호로 학습하지
    // 못하게 하고, 저장/메일/시트/텔레그램 모두 skip.
    if (typeof body?.website === 'string' && body.website.trim().length > 0) {
      console.warn('[Contact Form] honeypot tripped ip=%s', clientIp(request));
      return NextResponse.json({ success: true, message: '문의가 성공적으로 접수되었습니다.' }, { status: 200 });
    }

    const validated = contactSchema.parse(body);
    attempted = { name: validated.name, email: validated.email };

    // 쓰기 베이스 전용 read — 캐시 우회 + NOT_FOUND 시 시드 폴백 거부.
    // (시드를 베이스로 쓰면 빌드 이후 누적 문의가 통째로 덮어써진다)
    const inquiries = await readDataForWrite('inquiries');

    // 동일 이메일 5분 내 중복 투입 차단 (봇이 이메일만 바꿔가며 공격하면
    // 막을 수 없으므로 IP rate limit 과 함께 사용). 너무 길면 QA/실수 재제출이
    // 불가하므로 5분으로 단축.
    const cutoff = Date.now() - EMAIL_COOLDOWN_MS;
    const recentByEmail = inquiries.filter((inq) => {
      if (inq.email !== validated.email) return false;
      const ts = inq.createdAt ? new Date(inq.createdAt).getTime() : NaN;
      return Number.isFinite(ts) && ts > cutoff;
    });
    if (recentByEmail.length > 0) {
      return NextResponse.json(
        { success: false, message: '같은 이메일로는 5분 내 다시 접수할 수 없습니다.' },
        { status: 429 }
      );
    }

    const nowIso = new Date().toISOString();
    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      company: validated.company || undefined,
      category: validated.category,
      subject: validated.subject,
      message: validated.message,
      date: nowIso.split('T')[0],
      status: 'new',
      createdAt: nowIso,
    };

    // 내구성 append — outbox 사본을 먼저 남기고 배열에 merged write.
    // 배열 쓰기가 어떤 경위로 레코드를 잃어도 outbox union 이 자동 복원.
    await appendData('inquiries', newInquiry);

    // ID 만 로그. 이름/이메일/메시지는 감사 로그/모니터링에 남기지 않음.
    console.log('[Contact Form] 새 문의 접수 id=%s', newInquiry.id);

    // 고객 접수 확인 메일 + 관리자 알림 메일을 병렬로 발송.
    // .catch 로 무시하던 기존 fire-and-forget 패턴은 SMTP 오류가 silent 였음 →
    // await 로 결과를 받아 응답에 mailSent 상태를 포함, 어드민 디버깅 가능.
    const subjectLine = validated.subject ? `[${validated.subject}] ` : '';
    const mailSettings = await readSingleSafe<MailSettingsLite>('mail-settings');
    const adminEmail = mailSettings?.adminEmail?.trim() || process.env.ADMIN_EMAIL;

    const catDisplay = categoryLabel[validated.category] ?? validated.category;
    // 고객 메일 본문에 echo 되는 사용자 입력은 HTML escape (렌더 깨짐·주입 방지).
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const customerMailPromise = sendEmail({
      to: validated.email,
      // 제목 끝의 [#inq-...] 토큰 — 고객이 이 메일에 답장하면 인박스 폴링이
      // 어느 문의인지 매칭하는 키. 절대 제거 금지.
      subject: `[대라천] ${subjectLine}문의가 접수되었습니다. [#${newInquiry.id}]`,
      text: `안녕하세요, ${validated.name}님.\n\n대라천에 문의해 주셔서 감사합니다.\n보내주신 내용은 정상적으로 접수되었으며, 영업일 기준 1~2일 이내에 담당자가 답변드리겠습니다.\n\n─────────────────────────\n[문의 유형] ${catDisplay}${validated.subject ? `\n[제목] ${validated.subject}` : ''}\n[접수번호] ${newInquiry.id}\n[문의 내용]\n${validated.message}\n─────────────────────────\n\n추가로 궁금하신 점은 이 메일에 그대로 회신해 주세요.\n\nZOEL LIFE · 대라천 고객지원팀\n전화: 070-4140-4086`,
      html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background:#f5f3ee; font-family:'Apple SD Gothic Neo','맑은 고딕',sans-serif;">
  <div style="max-width:600px; margin:24px auto; background:#fff; border:1px solid #e7e2d6; border-radius:10px; overflow:hidden;">
    <div style="background:#1a1a0e; padding:28px 32px;">
      <p style="color:#c9a84c; font-size:12px; letter-spacing:0.16em; margin:0 0 8px;">ZOEL LIFE · 대라천</p>
      <h1 style="color:#fff; font-size:21px; font-weight:600; margin:0;">문의가 정상적으로 접수되었습니다</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#333; font-size:15px; line-height:1.85; margin:0 0 8px;">
        안녕하세요, <strong>${esc(validated.name)}</strong>님.
      </p>
      <p style="color:#555; font-size:14px; line-height:1.85; margin:0 0 26px;">
        대라천에 문의해 주셔서 진심으로 감사드립니다.<br />
        보내주신 내용은 정상적으로 접수되었으며, <strong style="color:#1a1a0e;">영업일 기준 1~2일 이내</strong>에 담당자가 답변드리겠습니다.
      </p>

      <div style="background:#faf8f3; border:1px solid #ece6d8; border-radius:8px; padding:20px 22px; margin-bottom:26px;">
        <p style="font-size:11px; color:#a59a82; letter-spacing:0.08em; margin:0 0 10px; text-transform:uppercase;">접수 내역</p>
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#444;">
          <tr><td style="padding:5px 0; width:84px; color:#999;">문의 유형</td><td style="padding:5px 0; color:#1a1a0e; font-weight:600;">${esc(catDisplay)}</td></tr>
          ${validated.subject ? `<tr><td style="padding:5px 0; color:#999;">제목</td><td style="padding:5px 0; color:#1a1a0e; font-weight:600;">${esc(validated.subject)}</td></tr>` : ''}
          <tr><td style="padding:5px 0; color:#999;">접수번호</td><td style="padding:5px 0; color:#888; font-size:12px;">${esc(newInquiry.id)}</td></tr>
        </table>
        <div style="border-top:1px solid #ece6d8; margin-top:12px; padding-top:14px;">
          <p style="font-size:11px; color:#999; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.08em;">문의 내용</p>
          <p style="font-size:14px; color:#333; line-height:1.85; margin:0; white-space:pre-wrap;">${esc(validated.message)}</p>
        </div>
      </div>

      <p style="font-size:13px; color:#666; line-height:1.8; margin:0 0 24px;">
        추가로 궁금하신 점이 있으시면 <strong>이 메일에 그대로 회신</strong>해 주세요. 담당자에게 바로 전달됩니다.
      </p>

      <div style="border-top:1px solid #eee; padding-top:20px; font-size:12px; color:#999; line-height:1.9;">
        <strong style="color:#555;">ZOEL LIFE · 대라천 고객지원팀</strong><br />
        전화: 070-4140-4086<br />
        <span style="font-size:11px;">평일 09:00 – 18:00 (점심 12:00 – 13:00 / 주말·공휴일 휴무)</span>
      </div>
    </div>
  </div>
</body></html>`,
    });

    const adminMailPromise = adminEmail && adminEmail.includes('@')
      ? sendEmail({
          to: adminEmail,
          subject: `[대라천 관리자] 새 문의 접수 — ${validated.name} (${categoryLabel[validated.category] ?? validated.category})${validated.subject ? ` / ${validated.subject}` : ''}`,
          text: `새 문의가 접수되었습니다.\n\n이름: ${validated.name}\n이메일: ${validated.email}\n전화: ${validated.phone || '없음'}\n유형: ${categoryLabel[validated.category] ?? validated.category}${validated.subject ? `\n제목: ${validated.subject}` : ''}\n내용:\n${validated.message}`,
          html: `<p><strong>새 문의가 접수되었습니다.</strong></p>
<ul>
  <li><strong>이름:</strong> ${validated.name}</li>
  <li><strong>이메일:</strong> ${validated.email}</li>
  <li><strong>전화:</strong> ${validated.phone || '없음'}</li>
  <li><strong>유형:</strong> ${categoryLabel[validated.category] ?? validated.category}</li>
${validated.subject ? `  <li><strong>제목:</strong> ${validated.subject}</li>\n` : ''}</ul>
<p><strong>내용:</strong><br>${validated.message.replace(/\n/g, '<br>')}</p>`,
        })
      : Promise.resolve({ ok: false, error: 'admin email not configured' } as const);

    // Google Sheets / Telegram 도 메일과 병렬로 발송. 외부 호출이라 실패해도
    // 인입 자체에는 영향을 주지 않도록 .catch 로 격리한다.
    const inquiryPayload: InquiryPayload = {
      id: newInquiry.id,
      createdAt: nowIso,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      company: validated.company || undefined,
      category: validated.category,
      categoryLabel: categoryLabel[validated.category] ?? validated.category,
      subject: validated.subject,
      message: validated.message,
    };

    const sheetsPromise = appendToGoogleSheet(inquiryPayload).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));
    const telegramPromise = notifyTelegram(inquiryPayload).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));

    const [customerResult, adminResult, sheetsResult, telegramResult] = await Promise.all([
      customerMailPromise.catch((err) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) })),
      adminMailPromise.catch((err) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) })),
      sheetsPromise,
      telegramPromise,
    ]);

    if (!customerResult.ok) console.error('[Contact Form] 고객 메일 발송 오류:', customerResult.error);
    if (!adminResult.ok) console.error('[Contact Form] 관리자 메일 발송 오류:', adminResult.error);
    if (!sheetsResult.ok && !('skipped' in sheetsResult && sheetsResult.skipped)) {
      console.error('[Contact Form] 구글 시트 기록 오류:', sheetsResult.error);
    }
    if (!telegramResult.ok && !('skipped' in telegramResult && telegramResult.skipped)) {
      console.error('[Contact Form] 텔레그램 알림 오류:', telegramResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message: '문의가 성공적으로 접수되었습니다.',
        mailSent: {
          customer: customerResult.ok,
          admin: adminResult.ok,
          customerError: customerResult.ok ? undefined : customerResult.error,
          adminError: adminResult.ok ? undefined : adminResult.error,
        },
        integrations: {
          sheets: sheetsResult.ok,
          sheetsSkipped: 'skipped' in sheetsResult ? sheetsResult.skipped : false,
          sheetsError: sheetsResult.ok ? undefined : sheetsResult.error,
          sheetsInfo: 'info' in sheetsResult ? sheetsResult.info : undefined,
          telegram: telegramResult.ok,
          telegramSkipped: 'skipped' in telegramResult ? telegramResult.skipped : false,
          telegramError: telegramResult.ok ? undefined : telegramResult.error,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    console.error('[Contact Form Error]', error);
    // 저장 단계 실패 시 고객은 500 만 보고 재시도하지 않을 수 있다 —
    // 운영자에게 시도 사실을 알려 수동 후속이 가능하게 한다 (best effort).
    if (attempted) {
      const reason = error instanceof Error ? error.message : String(error);
      sendTelegramMessage(
        `⚠️ 문의 접수 실패 — 수동 확인 필요\n이름: ${attempted.name}\n이메일: ${attempted.email}\n사유: ${reason.slice(0, 300)}`,
      ).catch(() => {});
    }
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
