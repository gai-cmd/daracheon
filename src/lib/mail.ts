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

// 우선순위:
// 1) SMTP_HOST 가 있으면 → nodemailer (Gmail/Workspace/Naver/Daum 등 SMTP)
// 2) RESEND_API_KEY 가 있으면 → Resend HTTP API
// 3) 둘 다 없으면 → dry-run (콘솔 로그만)
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const smtpHost = process.env.SMTP_HOST;
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddr =
    process.env.MAIL_FROM ?? process.env.SMTP_USER ?? 'noreply@daracheon.com';

  if (smtpHost) {
    return sendViaSmtp(options, smtpHost, fromAddr);
  }

  if (resendKey) {
    return sendViaResend(options, resendKey, fromAddr);
  }

  // Dry-run mode
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
  smtpHost: string,
  fromAddr: string,
): Promise<SendEmailResult> {
  try {
    const { default: nodemailer } = await import('nodemailer');
    const port = Number(process.env.SMTP_PORT ?? 465);
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
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
