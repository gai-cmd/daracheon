import { readSingleSafe } from '@/lib/db';

/**
 * 외부 연동 (Google Sheets / Telegram).
 *
 * 설계 기준:
 *   - 어드민 UI 저장값(`integration-settings`) 우선, 없으면 ENV fallback.
 *   - 메일과 동일하게 send 결과를 `{ ok, error }` 로 반환 → silent fail 금지.
 *   - 둘 다 외부 호출이라 contact 라우트가 await 시 실패해도 인입 로그/메일에
 *     영향을 주지 않도록 호출자가 Promise.all + .catch 로 격리.
 */

export interface IntegrationSettings {
  googleSheetsWebhookUrl?: string; // Google Apps Script Web App doPost URL
  googleSheetsSecret?: string;     // 선택. Apps Script 가 검증하는 공유 비밀.
  telegramBotToken?: string;
  telegramChatId?: string;         // 채널은 "@channelname" 또는 숫자 chat_id
  updatedAt?: string;
}

interface IntegrationResult {
  ok: boolean;
  error?: string;
  skipped?: boolean; // 설정 없음 → skip (실패 아님)
}

async function resolveIntegrationSettings(): Promise<IntegrationSettings> {
  const stored = (await readSingleSafe<IntegrationSettings>('integration-settings')) ?? {};
  return {
    googleSheetsWebhookUrl: stored.googleSheetsWebhookUrl?.trim() || process.env.GOOGLE_SHEETS_WEBHOOK_URL,
    googleSheetsSecret: stored.googleSheetsSecret?.trim() || process.env.GOOGLE_SHEETS_SECRET,
    telegramBotToken: stored.telegramBotToken?.trim() || process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: stored.telegramChatId?.trim() || process.env.TELEGRAM_CHAT_ID,
  };
}

export interface InquiryPayload {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  categoryLabel: string;
  subject: string;
  message: string;
}

/* ───────── Google Sheets (Apps Script Web App) ───────── */

export async function appendToGoogleSheet(inquiry: InquiryPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.googleSheetsWebhookUrl) return { ok: false, skipped: true, error: 'webhook url not configured' };

  try {
    const res = await fetch(cfg.googleSheetsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: cfg.googleSheetsSecret ?? '',
        type: 'inquiry',
        inquiry,
      }),
      // Apps Script 의 cold start 가 길 수 있어 Vercel 의 short timeout 회피용
      // 호출자가 Promise.allSettled + 시간 캡으로 보호한다.
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status} ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ───────── Telegram ───────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function notifyTelegram(inquiry: InquiryPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    return { ok: false, skipped: true, error: 'telegram not configured' };
  }

  // HTML parse_mode 사용 — 공식 문서가 권장하는 단순 화이트리스트 태그 집합.
  const lines = [
    `<b>📨 새 문의 접수</b>`,
    `<b>유형:</b> ${escapeHtml(inquiry.categoryLabel)}${inquiry.subject ? ` · ${escapeHtml(inquiry.subject)}` : ''}`,
    `<b>이름:</b> ${escapeHtml(inquiry.name)}`,
    `<b>이메일:</b> ${escapeHtml(inquiry.email)}`,
    `<b>연락처:</b> ${escapeHtml(inquiry.phone || '없음')}`,
    ``,
    `<b>내용</b>`,
    escapeHtml(inquiry.message).slice(0, 1500),
    ``,
    `<i>id: ${escapeHtml(inquiry.id)}</i>`,
  ];
  const text = lines.join('\n');

  try {
    const url = `https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ───────── 테스트용 단순 ping (어드민 테스트 버튼) ───────── */

export async function testGoogleSheet(): Promise<IntegrationResult> {
  return appendToGoogleSheet({
    id: `test-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: '테스트',
    email: 'test@example.com',
    phone: '',
    category: 'other',
    categoryLabel: '기타',
    subject: '연동 테스트',
    message: '관리자 설정에서 발송한 테스트 행입니다.',
  });
}

export async function testTelegram(): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    return { ok: false, skipped: true, error: 'telegram not configured' };
  }
  try {
    const url = `https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.telegramChatId,
        text: `✅ 대라천 텔레그램 연동 테스트 — ${new Date().toLocaleString('ko-KR')}`,
        disable_web_page_preview: true,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !body.ok) return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
