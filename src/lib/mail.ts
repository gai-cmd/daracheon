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

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dry-run mode: log only
    console.log('[mail:dry-run] sendEmail called (no RESEND_API_KEY)');
    console.log(`  to:      ${options.to}`);
    console.log(`  subject: ${options.subject}`);
    if (options.text) {
      console.log(`  text:    ${options.text.slice(0, 200)}`);
    }
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? 'noreply@daerachoen.com',
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[mail] Resend API error:', res.status, body);
      return { ok: false, error: `Resend API error ${res.status}: ${body}` };
    }

    console.log('[mail] Email sent to:', options.to, '|', options.subject);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mail] sendEmail failed:', message);
    return { ok: false, error: message };
  }
}
