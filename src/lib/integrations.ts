import crypto from 'crypto';
import { readSingleSafe } from '@/lib/db';

/**
 * 외부 연동 (Google Sheets / Telegram).
 *
 * Google Sheets:
 *   어드민은 시트 URL 만 입력 → 서버가 Service Account 로 직접 append.
 *   필요 ENV: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
 *   사전 작업(시트마다 1회): 시트 공유 → Service Account 이메일을 편집자로.
 *
 * Telegram:
 *   봇 토큰 + Chat ID. @BotFather 로 봇 생성 후 채널 관리자로 추가.
 */

export interface IntegrationSettings {
  googleSheetsUrl?: string;     // 일반 시트 URL — /d/{ID} 부분만 사용
  googleSheetsTab?: string;     // 선택. 비우면 첫 번째 탭 사용
  telegramBotToken?: string;
  telegramChatId?: string;      // "@channelname" 또는 숫자 chat_id
  updatedAt?: string;
}

interface IntegrationResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

async function resolveIntegrationSettings(): Promise<IntegrationSettings> {
  const stored = (await readSingleSafe<IntegrationSettings>('integration-settings')) ?? {};
  return {
    googleSheetsUrl: stored.googleSheetsUrl?.trim() || process.env.GOOGLE_SHEETS_URL,
    googleSheetsTab: stored.googleSheetsTab?.trim() || process.env.GOOGLE_SHEETS_TAB,
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

/* ───────── Google Sheets (Service Account, 직접 append) ───────── */

export function extractSpreadsheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function getServiceAccountEmail(): string | undefined {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
}

function getPrivateKey(): string | undefined {
  // Vercel 의 환경변수에 PEM 키를 넣을 때 줄바꿈이 \n 문자열로 들어오는 경우가 잦다.
  const raw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n');
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const email = getServiceAccountEmail();
  const key = getPrivateKey();
  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY 가 설정되지 않았습니다.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OAuth 토큰 발급 실패: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error('OAuth 응답에 access_token 이 없습니다.');
  return body.access_token;
}

const HEADER_ROW = ['일시', 'ID', '유형', '제목', '이름', '이메일', '연락처', '내용'];

function inquiryToRow(inq: InquiryPayload): (string | number)[] {
  return [
    inq.createdAt,
    inq.id,
    inq.categoryLabel,
    inq.subject,
    inq.name,
    inq.email,
    inq.phone || '',
    inq.message,
  ];
}

// 첫 번째 탭 이름이 필요할 때만 메타데이터 호출 (탭 미지정 케이스).
async function resolveDefaultTabName(spreadsheetId: string, token: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`시트 메타 조회 실패: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
  const title = body.sheets?.[0]?.properties?.title;
  if (!title) throw new Error('시트에 탭이 없습니다.');
  return title;
}

// 헤더 행이 비어있으면 한 번 채운다 (idempotent: A1 이 비어있을 때만).
async function ensureHeader(
  spreadsheetId: string,
  tabName: string,
  token: string,
): Promise<void> {
  const range = encodeURIComponent(`${tabName}!A1:H1`);
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!getRes.ok) {
    const text = await getRes.text().catch(() => '');
    throw new Error(`헤더 조회 실패: HTTP ${getRes.status} ${text.slice(0, 300)}`);
  }
  const body = (await getRes.json()) as { values?: string[][] };
  if (body.values && body.values.length > 0 && body.values[0].length > 0) return;

  const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [HEADER_ROW] }),
  });
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    throw new Error(`헤더 쓰기 실패: HTTP ${putRes.status} ${text.slice(0, 300)}`);
  }
}

export async function appendToGoogleSheet(inquiry: InquiryPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.googleSheetsUrl) return { ok: false, skipped: true, error: 'sheet url not configured' };

  const spreadsheetId = extractSpreadsheetId(cfg.googleSheetsUrl);
  if (!spreadsheetId) return { ok: false, error: '시트 URL에서 ID 를 찾지 못했습니다.' };

  try {
    const token = await getAccessToken();
    const tabName = cfg.googleSheetsTab || (await resolveDefaultTabName(spreadsheetId, token));
    await ensureHeader(spreadsheetId, tabName, token);

    const range = encodeURIComponent(`${tabName}!A:H`);
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append` +
      `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [inquiryToRow(inquiry)] }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status} ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ───────── Telegram ───────── */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function notifyTelegram(inquiry: InquiryPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    return { ok: false, skipped: true, error: 'telegram not configured' };
  }

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
    if (!res.ok || !body.ok) return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ───────── 어드민 테스트 핸들러 ───────── */

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
