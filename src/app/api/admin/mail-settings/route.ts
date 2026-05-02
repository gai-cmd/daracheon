import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export interface MailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;       // 평문 저장 (Vercel Blob private prefix 의존). UI 에는 마스킹.
  mailFrom?: string;
  adminEmail?: string;
  resendApiKey?: string;   // 대안 경로
  updatedAt?: string;
}

const PASSWORD_MASK = '••••••••';

function maskSecrets(s: MailSettings): MailSettings {
  return {
    ...s,
    smtpPass: s.smtpPass ? PASSWORD_MASK : '',
    resendApiKey: s.resendApiKey ? PASSWORD_MASK : '',
  };
}

export async function GET() {
  try {
    const stored = (await readSingle<MailSettings>('mail-settings')) ?? {};
    return NextResponse.json(maskSecrets(stored));
  } catch (error) {
    console.error('[Admin MailSettings] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '설정을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as MailSettings;
    const existing = (await readSingle<MailSettings>('mail-settings')) ?? {};

    // 비밀 필드: 클라이언트가 마스킹된 값 그대로 보내면 기존값 보존,
    // 빈 문자열이면 명시적 삭제, 새 값이면 교체.
    const nextPass =
      body.smtpPass === PASSWORD_MASK ? existing.smtpPass : body.smtpPass;
    const nextResendKey =
      body.resendApiKey === PASSWORD_MASK
        ? existing.resendApiKey
        : body.resendApiKey;

    const updated: MailSettings = {
      smtpHost: (body.smtpHost ?? '').trim(),
      smtpPort: Number(body.smtpPort) || undefined,
      smtpUser: (body.smtpUser ?? '').trim(),
      smtpPass: nextPass ?? '',
      mailFrom: (body.mailFrom ?? '').trim(),
      adminEmail: (body.adminEmail ?? '').trim(),
      resendApiKey: nextResendKey ?? '',
      updatedAt: new Date().toISOString(),
    };

    await writeSingle('mail-settings', updated);

    await logAdmin('mail-settings', 'update', {
      summary: '메일 발송 설정 업데이트',
      meta: {
        host: updated.smtpHost,
        user: updated.smtpUser,
        from: updated.mailFrom,
        admin: updated.adminEmail,
        resend: !!updated.resendApiKey,
      },
    });

    return NextResponse.json({ success: true, settings: maskSecrets(updated) });
  } catch (error) {
    console.error('[Admin MailSettings] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '저장 실패' },
      { status: 500 },
    );
  }
}

// 테스트 발송: 저장된 설정으로 ADMIN_EMAIL (또는 body.to) 에 한 통 보냄
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { to?: string };
    const settings = (await readSingle<MailSettings>('mail-settings')) ?? {};
    const to = (body.to || settings.adminEmail || '').trim();
    if (!to) {
      return NextResponse.json(
        { success: false, message: '수신자 이메일이 없습니다. 관리자 이메일을 먼저 저장하세요.' },
        { status: 400 },
      );
    }

    const result = await sendEmail({
      to,
      subject: '[대라천] 메일 발송 테스트',
      text: `메일 발송 설정이 정상 동작합니다.\n\n${new Date().toLocaleString('ko-KR')}`,
      html: `<p>메일 발송 설정이 정상 동작합니다.</p><p style="color:#888;font-size:12px;">${new Date().toLocaleString('ko-KR')}</p>`,
    });

    await logAdmin('mail-settings', 'test', {
      summary: '메일 테스트 발송',
      meta: { to, ok: result.ok, error: result.error },
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.error ?? '발송 실패' },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, message: `테스트 메일을 ${to} 로 발송했습니다.` });
  } catch (error) {
    console.error('[Admin MailSettings] POST Error:', error);
    const msg = error instanceof Error ? error.message : '서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
