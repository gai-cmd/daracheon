import { readSingleSafe } from '@/lib/db';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  ok: boolean;
  error?: string;
}

interface MailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  mailFrom?: string;
  resendApiKey?: string;
}

// DB(어드민 UI 저장값) → ENV 순으로 fallback. 어드민에서 비워두면 ENV 사용.
async function resolveMailConfig(): Promise<MailConfig> {
  const stored = (await readSingleSafe<MailConfig>('mail-settings')) ?? {};
  return {
    smtpHost: stored.smtpHost?.trim() || process.env.SMTP_HOST,
    smtpPort: stored.smtpPort || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined),
    smtpUser: stored.smtpUser?.trim() || process.env.SMTP_USER,
    smtpPass: stored.smtpPass?.trim() || process.env.SMTP_PASS,
    mailFrom: stored.mailFrom?.trim() || process.env.MAIL_FROM,
    resendApiKey: stored.resendApiKey?.trim() || process.env.RESEND_API_KEY,
  };
}

// 우선순위:
// 1) SMTP_HOST 가 있으면 → nodemailer (Gmail/Workspace/Naver/Daum 등 SMTP)
// 2) RESEND_API_KEY 가 있으면 → Resend HTTP API
// 3) 둘 다 없으면 → dry-run (콘솔 로그만)
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const cfg = await resolveMailConfig();
  const fromAddr = cfg.mailFrom || cfg.smtpUser || 'noreply@daracheon.com';

  if (cfg.smtpHost) {
    return sendViaSmtp(options, cfg, fromAddr);
  }

  if (cfg.resendApiKey) {
    return sendViaResend(options, cfg.resendApiKey, fromAddr);
  }

  // 프로덕션에서 메일 설정이 비어있는 건 사고. dry-run 으로 ok:true 반환하면
  // 고객 UI 에는 "정상 접수" 로 보이고 운영자도 메일 발송 실패를 모르는 silent
  // failure 가 된다. ok:false 로 명시적으로 실패 표시 → contact API 응답의
  // mailSent.customer/admin 에 false 로 전달되고 어드민이 즉시 인지.
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (isProd) {
    const errMsg = 'mail not configured (SMTP_HOST or RESEND_API_KEY missing in production)';
    console.error('[mail:NOT-CONFIGURED]', errMsg, '— to:', options.to, '| subject:', options.subject);
    return { ok: false, error: errMsg };
  }

  // 개발 환경: dry-run 으로 콘솔 로그만.
  console.log('[mail:dry-run] sendEmail called (no SMTP_HOST or RESEND_API_KEY)');
  console.log(`  to:      ${options.to}`);
  console.log(`  subject: ${options.subject}`);
  if (options.text) {
    console.log(`  text:    ${options.text.slice(0, 200)}`);
  }
  return { ok: true };
}

async function sendViaSmtp(
  options: SendEmailOptions,
  cfg: MailConfig,
  fromAddr: string,
): Promise<SendEmailResult> {
  try {
    const { default: nodemailer } = await import('nodemailer');
    const port = cfg.smtpPort ?? 465;
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost,
      port,
      secure,
      auth: {
        user: cfg.smtpUser ?? '',
        pass: cfg.smtpPass ?? '',
      },
    });
    await transporter.sendMail({
      from: fromAddr,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
    });
    console.log('[mail:smtp] Email sent to:', options.to, '|', options.subject);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mail:smtp] sendEmail failed:', message);
    return { ok: false, error: message };
  }
}

async function sendViaResend(
  options: SendEmailOptions,
  apiKey: string,
  fromAddr: string,
): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[mail:resend] Resend API error:', res.status, body);
      return { ok: false, error: `Resend API error ${res.status}: ${body}` };
    }

    console.log('[mail:resend] Email sent to:', options.to, '|', options.subject);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mail:resend] sendEmail failed:', message);
    return { ok: false, error: message };
  }
}
