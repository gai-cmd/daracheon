import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import {
  type IntegrationSettings,
  testGoogleSheet,
  testTelegram,
  getServiceAccountEmail,
  listTelegramChats,
} from '@/lib/integrations';
import { sendDailyReport } from '@/lib/daily-report';
import { getGa4Config } from '@/lib/ga4';

export const dynamic = 'force-dynamic';

// 비밀 필드 UX 정책:
//   - GET 응답에는 토큰 본문을 절대 포함하지 않는다 (마스크 문자열도 X).
//     password 타입 input 에 마스크가 들어가 있으면 사용자가 그 위에 타이핑해
//     "•••••...newvalue" 같은 더러운 값이 저장되는 사고가 났음. 이를 차단.
//   - 저장 여부는 boolean 플래그(hasTelegramToken)로 알린다.
//   - PUT 시 빈 문자열 → 기존값 유지. 명시 삭제는 별도 UX 가 필요할 때 추가.

export async function GET() {
  try {
    const stored = (await readSingle<IntegrationSettings>('integration-settings')) ?? {};
    const ga4 = getGa4Config();
    return NextResponse.json({
      googleSheetsUrl: stored.googleSheetsUrl ?? '',
      googleSheetsTab: stored.googleSheetsTab ?? '',
      telegramChatId: stored.telegramChatId ?? '',
      hasTelegramToken: !!stored.telegramBotToken,
      updatedAt: stored.updatedAt ?? '',
      serviceAccountEmail: getServiceAccountEmail() ?? '',
      serviceAccountReady: !!getServiceAccountEmail() && !!process.env.GOOGLE_PRIVATE_KEY,
      ga4Ready: ga4.ready,
      ga4PropertyId: ga4.propertyId ?? '',
      ga4ServiceAccountEmail: ga4.serviceAccountEmail ?? '',
      ga4ImpersonateSubject: ga4.impersonateSubject ?? '',
    });
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

    // 빈 입력 → 기존 토큰 유지. 비-빈 입력 → 그대로 교체.
    const incomingToken = (body.telegramBotToken ?? '').trim();
    const nextToken = incomingToken === '' ? (existing.telegramBotToken ?? '') : incomingToken;

    const updated: IntegrationSettings = {
      googleSheetsUrl: (body.googleSheetsUrl ?? '').trim(),
      googleSheetsTab: (body.googleSheetsTab ?? '').trim(),
      telegramBotToken: nextToken,
      telegramChatId: (body.telegramChatId ?? '').trim(),
      updatedAt: new Date().toISOString(),
    };

    await writeSingle('integration-settings', updated);

    await logAdmin('integration-settings', 'update', {
      summary: '외부 연동 설정 업데이트',
      meta: {
        sheets: !!updated.googleSheetsUrl,
        telegram: !!(updated.telegramBotToken && updated.telegramChatId),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        googleSheetsUrl: updated.googleSheetsUrl ?? '',
        googleSheetsTab: updated.googleSheetsTab ?? '',
        telegramChatId: updated.telegramChatId ?? '',
        hasTelegramToken: !!updated.telegramBotToken,
        updatedAt: updated.updatedAt ?? '',
      },
    });
  } catch (error) {
    console.error('[Admin IntegrationSettings] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '저장 실패' },
      { status: 500 },
    );
  }
}

// target: 'sheets' | 'telegram' | 'telegram-chats' | 'ga4-report'
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      target?: 'sheets' | 'telegram' | 'telegram-chats' | 'ga4-report';
    };
    const target = body.target;

    if (target === 'telegram-chats') {
      const result = await listTelegramChats();
      await logAdmin('integration-settings', 'test', {
        summary: '텔레그램 채팅 목록 조회',
        meta: { ok: result.ok, count: result.chats?.length, error: result.error },
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.error ?? '실패' }, { status: 500 });
      }
      return NextResponse.json({ success: true, chats: result.chats ?? [], hint: result.hint });
    }

    if (target === 'ga4-report') {
      const result = await sendDailyReport();
      await logAdmin('integration-settings', 'test', {
        summary: 'GA4 데일리 리포트 테스트 발송',
        meta: { ok: result.ok, error: result.error, dateLabel: result.dateLabel },
      });
      if (result.skipped) {
        return NextResponse.json(
          { success: false, message: result.error ?? 'GA4 또는 텔레그램 설정이 없습니다.' },
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
        message: `GA4 데일리 리포트 발송 완료 (${result.dateLabel ?? '-'})`,
      });
    }

    if (target !== 'sheets' && target !== 'telegram') {
      return NextResponse.json(
        { success: false, message: 'target 은 sheets · telegram · telegram-chats · ga4-report' },
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
