import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import {
  type IntegrationSettings,
  testGoogleSheet,
  testTelegram,
} from '@/lib/integrations';

export const dynamic = 'force-dynamic';

const PASSWORD_MASK = '••••••••';

function maskSecrets(s: IntegrationSettings): IntegrationSettings {
  return {
    ...s,
    googleSheetsSecret: s.googleSheetsSecret ? PASSWORD_MASK : '',
    telegramBotToken: s.telegramBotToken ? PASSWORD_MASK : '',
  };
}

export async function GET() {
  try {
    const stored = (await readSingle<IntegrationSettings>('integration-settings')) ?? {};
    return NextResponse.json(maskSecrets(stored));
  } catch (error) {
    console.error('[Admin IntegrationSettings] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '설정을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as IntegrationSettings;
    const existing = (await readSingle<IntegrationSettings>('integration-settings')) ?? {};

    const nextSecret =
      body.googleSheetsSecret === PASSWORD_MASK
        ? existing.googleSheetsSecret
        : body.googleSheetsSecret;
    const nextToken =
      body.telegramBotToken === PASSWORD_MASK
        ? existing.telegramBotToken
        : body.telegramBotToken;

    const updated: IntegrationSettings = {
      googleSheetsWebhookUrl: (body.googleSheetsWebhookUrl ?? '').trim(),
      googleSheetsSecret: (nextSecret ?? '').trim(),
      telegramBotToken: (nextToken ?? '').trim(),
      telegramChatId: (body.telegramChatId ?? '').trim(),
      updatedAt: new Date().toISOString(),
    };

    await writeSingle('integration-settings', updated);

    await logAdmin('integration-settings', 'update', {
      summary: '외부 연동 설정 업데이트',
      meta: {
        sheets: !!updated.googleSheetsWebhookUrl,
        telegram: !!(updated.telegramBotToken && updated.telegramChatId),
      },
    });

    return NextResponse.json({ success: true, settings: maskSecrets(updated) });
  } catch (error) {
    console.error('[Admin IntegrationSettings] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '저장 실패' },
      { status: 500 },
    );
  }
}

// 테스트: body.target = 'sheets' | 'telegram'
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { target?: 'sheets' | 'telegram' };
    const target = body.target;

    if (target !== 'sheets' && target !== 'telegram') {
      return NextResponse.json(
        { success: false, message: 'target 은 sheets 또는 telegram' },
        { status: 400 },
      );
    }

    const result = target === 'sheets' ? await testGoogleSheet() : await testTelegram();

    await logAdmin('integration-settings', 'test', {
      summary: `외부 연동 테스트 (${target})`,
      meta: { ok: result.ok, error: result.error, skipped: result.skipped },
    });

    if (result.skipped) {
      return NextResponse.json(
        { success: false, message: `${target === 'sheets' ? '구글 시트' : '텔레그램'} 설정이 없습니다.` },
        { status: 400 },
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.error ?? '실패' },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      message: target === 'sheets' ? '구글 시트에 테스트 행을 추가했습니다.' : '텔레그램으로 테스트 메시지를 발송했습니다.',
    });
  } catch (error) {
    console.error('[Admin IntegrationSettings] POST Error:', error);
    const msg = error instanceof Error ? error.message : '서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
