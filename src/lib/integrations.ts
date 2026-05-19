import crypto from 'crypto';
import { readSingleUncached } from '@/lib/db';

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
  // 진단용 — sheet API 가 실제로 어디로 append/update 했는지 (예: "Sheet1!A2:I2").
  // 응답에 노출되어 디버그 가능. 운영상 무해.
  info?: string;
}

async function resolveIntegrationSettings(): Promise<IntegrationSettings> {
  // Uncached 읽기 — 어드민이 chat_id 갱신 직후 5분 캐시 만료를 기다리지 않고
  // 즉시 새 값으로 통지가 가도록. 데이터 라이브사이클이 짧고 호출 빈도도
  // 폼/답변 단위라 캐시 우회 비용은 무시할 수 있음.
  const stored = (await readSingleUncached<IntegrationSettings>('integration-settings')) ?? {};
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
  company?: string;
  category: string;
  categoryLabel: string;
  subject: string;
  message: string;
}

function shortDate(iso: string): string {
  // YYYY-MM-DD 부분만. 사용자가 보는 시트는 date-only 가 더 깔끔하다.
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : iso;
}

function companyOrName(p: { company?: string; name: string }): string {
  return p.company && p.company.trim() ? p.company.trim() : p.name;
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

// 사용자 정의 시트 레이아웃.
// A-H 가 운영자 시야에 보이는 8개 컬럼. I 는 ID — 답변/메타 갱신 시
// 행을 찾기 위한 운영 키. 사용자는 I 를 숨겨 두고 봐도 됨.
const HEADER_ROW = [
  '접수일',      // A
  '회사명/이름', // B
  '문의내용',    // C
  '담당자',      // D
  '상태',        // E
  '답변기한',    // F
  '답변내용',    // G
  '완료일',      // H
  'ID',          // I (운영 — 행 lookup 용)
];

const STATUS_LABEL_KO: Record<string, string> = {
  new: '신규',
  'in-progress': '진행중',
  replied: '답변완료',
  resolved: '처리완료',
  pending: '대기',
  closed: '종료',
};

function statusToLabel(s?: string): string {
  if (!s) return '';
  return STATUS_LABEL_KO[s] ?? s;
}

function inquiryToRow(inq: InquiryPayload): string[] {
  // 신규 접수 — 담당자/답변기한/답변/완료일은 비어 있음.
  return [
    shortDate(inq.createdAt),         // A 접수일
    companyOrName(inq),               // B 회사명/이름
    inq.message,                      // C 문의내용
    '',                               // D 담당자
    statusToLabel('new'),             // E 상태
    '',                               // F 답변기한
    '',                               // G 답변내용
    '',                               // H 완료일
    inq.id,                           // I ID (운영)
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

// 헤더 행(A1:I1) 멱등 보장. A1 셀이 새 헤더("접수일") 와 정확히 일치하지 않으면
// 9컬럼 헤더를 PUT 으로 덮어쓴다. 옛 레이아웃(일시/ID/유형…) 에서 마이그레이션 시
// 헤더만 갱신 — 기존 행 자체는 건드리지 않는다 (사용자가 직접 정리하는 영역).
async function ensureHeader(
  spreadsheetId: string,
  tabName: string,
  token: string,
): Promise<void> {
  const range = encodeURIComponent(`${tabName}!A1:I1`);
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!getRes.ok) {
    const text = await getRes.text().catch(() => '');
    throw new Error(`헤더 조회 실패: HTTP ${getRes.status} ${text.slice(0, 300)}`);
  }
  const body = (await getRes.json()) as { values?: string[][] };
  const existing = body.values?.[0] ?? [];
  if (existing[0] === HEADER_ROW[0] && existing[8] === HEADER_ROW[8]) return;

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

    const range = encodeURIComponent(`${tabName}!A:I`);
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
    const respBody = (await res.json().catch(() => ({}))) as {
      updates?: { updatedRange?: string };
    };
    const updatedRange = respBody.updates?.updatedRange ?? `${tabName}!?`;
    console.log('[Google Sheets] append → %s', updatedRange);
    return { ok: true, info: updatedRange };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface SheetReplyPayload {
  inquiryId: string;
  replyAt: string;     // ISO. 답변 본문(G) 와 함께. resolved 면 완료일(H) 로도 사용.
  replyBy?: string;
  reply: string;
  status?: string;     // 답변 시점의 처리 상태. E 컬럼 라벨로 변환.
  assignee?: string;   // D 컬럼.
  dueDate?: string;    // F 컬럼 (답변기한).
  resolvedAt?: string; // H 컬럼 (완료일). status=resolved 일 때 admin 라우트에서 세팅.
}

export interface SheetMetaPayload {
  inquiryId: string;
  status?: string;
  assignee?: string;
  dueDate?: string;
  resolvedAt?: string;
}

// I 컬럼(ID) 에서 inquiryId 행 인덱스 탐색. 신규 레이아웃 lookup 키.
async function findRowByInquiryId(
  spreadsheetId: string,
  tabName: string,
  token: string,
  inquiryId: string,
): Promise<{ ok: true; sheetRow: number } | { ok: false; error: string }> {
  const idRange = encodeURIComponent(`${tabName}!I:I`);
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${idRange}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!getRes.ok) {
    const text = await getRes.text().catch(() => '');
    return { ok: false, error: `ID 컬럼 조회 실패: HTTP ${getRes.status} ${text.slice(0, 300)}` };
  }
  const idBody = (await getRes.json()) as { values?: string[][] };
  const rows = idBody.values ?? [];
  const rowIndex = rows.findIndex((r) => (r[0] ?? '') === inquiryId);
  if (rowIndex === -1) {
    return { ok: false, error: `시트에서 문의 ID(${inquiryId}) 행을 찾지 못했습니다.` };
  }
  return { ok: true, sheetRow: rowIndex + 1 };
}

/**
 * 동일 ID 행의 답변 영역(G=답변내용) 과 함께 상태(E)·담당자(D)·답변기한(F)·완료일(H) 동기화.
 * 행을 찾지 못하면 ok=false. 신규 인입 → append, 후속 갱신 → updateGoogleSheetReply.
 */
export async function updateGoogleSheetReply(
  payload: SheetReplyPayload,
): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.googleSheetsUrl) return { ok: false, skipped: true, error: 'sheet url not configured' };

  const spreadsheetId = extractSpreadsheetId(cfg.googleSheetsUrl);
  if (!spreadsheetId) return { ok: false, error: '시트 URL에서 ID 를 찾지 못했습니다.' };

  try {
    const token = await getAccessToken();
    const tabName = cfg.googleSheetsTab || (await resolveDefaultTabName(spreadsheetId, token));
    await ensureHeader(spreadsheetId, tabName, token);

    const found = await findRowByInquiryId(spreadsheetId, tabName, token, payload.inquiryId);
    if (!found.ok) return { ok: false, error: found.error };
    const sheetRow = found.sheetRow;

    const effectiveStatus = payload.status ?? 'replied';
    const data: Array<{ range: string; values: string[][] }> = [];
    if (payload.assignee !== undefined) {
      data.push({ range: `${tabName}!D${sheetRow}`, values: [[payload.assignee]] });
    }
    data.push({ range: `${tabName}!E${sheetRow}`, values: [[statusToLabel(effectiveStatus)]] });
    if (payload.dueDate !== undefined) {
      data.push({ range: `${tabName}!F${sheetRow}`, values: [[payload.dueDate]] });
    }
    data.push({ range: `${tabName}!G${sheetRow}`, values: [[payload.reply]] });
    if (payload.resolvedAt !== undefined) {
      data.push({ range: `${tabName}!H${sheetRow}`, values: [[shortDate(payload.resolvedAt)]] });
    }

    const putUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const putRes = await fetch(putUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      return { ok: false, error: `답변 기록 실패: HTTP ${putRes.status} ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * 담당자(D)·상태(E)·답변기한(F)·완료일(H) 만 갱신 (답변 본문 G 는 건드리지 않음).
 * 어드민이 담당자 배정·기한 설정·상태 변경만 했을 때 호출.
 */
export async function updateGoogleSheetMeta(
  payload: SheetMetaPayload,
): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.googleSheetsUrl) return { ok: false, skipped: true, error: 'sheet url not configured' };

  const spreadsheetId = extractSpreadsheetId(cfg.googleSheetsUrl);
  if (!spreadsheetId) return { ok: false, error: '시트 URL에서 ID 를 찾지 못했습니다.' };

  if (
    payload.status === undefined &&
    payload.assignee === undefined &&
    payload.dueDate === undefined &&
    payload.resolvedAt === undefined
  ) {
    return { ok: true, skipped: true };
  }

  try {
    const token = await getAccessToken();
    const tabName = cfg.googleSheetsTab || (await resolveDefaultTabName(spreadsheetId, token));
    await ensureHeader(spreadsheetId, tabName, token);

    const found = await findRowByInquiryId(spreadsheetId, tabName, token, payload.inquiryId);
    if (!found.ok) return { ok: false, error: found.error };
    const sheetRow = found.sheetRow;

    const data: Array<{ range: string; values: string[][] }> = [];
    if (payload.assignee !== undefined) {
      data.push({ range: `${tabName}!D${sheetRow}`, values: [[payload.assignee]] });
    }
    if (payload.status !== undefined) {
      data.push({ range: `${tabName}!E${sheetRow}`, values: [[statusToLabel(payload.status)]] });
    }
    if (payload.dueDate !== undefined) {
      data.push({ range: `${tabName}!F${sheetRow}`, values: [[payload.dueDate]] });
    }
    if (payload.resolvedAt !== undefined) {
      data.push({
        range: `${tabName}!H${sheetRow}`,
        values: [[payload.resolvedAt ? shortDate(payload.resolvedAt) : '']],
      });
    }

    const putUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const putRes = await fetch(putUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      return { ok: false, error: `메타 갱신 실패: HTTP ${putRes.status} ${text.slice(0, 300)}` };
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

/** 일반 텔레그램 메시지 전송. 봇 토큰·chat_id 는 통합 설정/ENV 에서 자동 해결. */
export async function sendTelegramMessage(text: string): Promise<IntegrationResult> {
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

export async function notifyTelegram(inquiry: InquiryPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    return { ok: false, skipped: true, error: 'telegram not configured' };
  }

  const lines = [
    `<b>📨 새 문의 접수</b>`,
    `<b>접수일:</b> ${escapeHtml(shortDate(inquiry.createdAt))}`,
    `<b>회사명/이름:</b> ${escapeHtml(companyOrName(inquiry))}`,
    `<b>유형:</b> ${escapeHtml(inquiry.categoryLabel)}${inquiry.subject ? ` · ${escapeHtml(inquiry.subject)}` : ''}`,
    `<b>이메일:</b> ${escapeHtml(inquiry.email)}`,
    `<b>연락처:</b> ${escapeHtml(inquiry.phone || '없음')}`,
    `<b>담당자:</b> 미배정`,
    `<b>상태:</b> ${escapeHtml(statusToLabel('new'))}`,
    `<b>답변기한:</b> 미정`,
    `<b>완료일:</b> -`,
    ``,
    `<b>문의내용</b>`,
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

export interface ReplyPayload {
  inquiryId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail: string;
  categoryLabel: string;
  subject: string;
  question: string;
  reply: string;
  repliedBy?: string;
  assignee?: string;
  dueDate?: string;
  status?: string;
  resolvedAt?: string;
}

export async function notifyTelegramReply(p: ReplyPayload): Promise<IntegrationResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    return { ok: false, skipped: true, error: 'telegram not configured' };
  }

  const effectiveStatus = p.status ?? 'replied';
  const customerLabel = p.customerCompany && p.customerCompany.trim() ? p.customerCompany : p.customerName;
  const lines = [
    `<b>✅ 답변 발송</b>`,
    `<b>회사명/이름:</b> ${escapeHtml(customerLabel)} (${escapeHtml(p.customerEmail)})`,
    `<b>유형:</b> ${escapeHtml(p.categoryLabel)}${p.subject ? ` · ${escapeHtml(p.subject)}` : ''}`,
    `<b>담당자:</b> ${escapeHtml(p.assignee || '미배정')}`,
    `<b>상태:</b> ${escapeHtml(statusToLabel(effectiveStatus))}`,
    `<b>답변기한:</b> ${escapeHtml(p.dueDate || '미정')}`,
    `<b>완료일:</b> ${escapeHtml(p.resolvedAt ? shortDate(p.resolvedAt) : '-')}`,
    p.repliedBy ? `<b>작성자:</b> ${escapeHtml(p.repliedBy)}` : '',
    ``,
    `<b>원 문의</b>`,
    escapeHtml(p.question).slice(0, 600),
    ``,
    `<b>답변내용</b>`,
    escapeHtml(p.reply).slice(0, 1500),
    ``,
    `<i>id: ${escapeHtml(p.inquiryId)}</i>`,
  ].filter(Boolean);
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
      // 디버깅: 실제 사용된 chat_id 를 에러에 포함. "supergroup upgraded" 류
      // 에러는 보통 chat_id 갱신 누락이 원인이라 어떤 ID 가 쓰였는지 알아야 한다.
      return { ok: false, error: `${body.description ?? `HTTP ${res.status}`} [chat_id=${cfg.telegramChatId}]` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ───────── 텔레그램 진단: 봇이 본 채팅 목록 ───────── */

export interface TelegramChatHint {
  chatId: string;
  title: string;
  type: string;
}

export interface TelegramChatsResult {
  ok: boolean;
  chats?: TelegramChatHint[];
  error?: string;
  hint?: string;
}

export async function listTelegramChats(): Promise<TelegramChatsResult> {
  const cfg = await resolveIntegrationSettings();
  if (!cfg.telegramBotToken) {
    return { ok: false, error: '봇 토큰이 저장되지 않았습니다.' };
  }
  try {
    const url = `https://api.telegram.org/bot${cfg.telegramBotToken}/getUpdates`;
    const res = await fetch(url);
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: Array<{
        message?: { chat?: { id?: number; title?: string; type?: string; username?: string; first_name?: string } };
        channel_post?: { chat?: { id?: number; title?: string; type?: string; username?: string } };
        my_chat_member?: { chat?: { id?: number; title?: string; type?: string; username?: string } };
      }>;
    };
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    }

    const seen = new Map<string, TelegramChatHint>();
    // 업그레이드된 옛 그룹 ID 수집 (텔레그램 업데이트가 명시적으로 알려주는 케이스).
    const migrated = new Set<string>();
    for (const update of body.result ?? []) {
      const chat = (update.message?.chat ?? update.channel_post?.chat ?? update.my_chat_member?.chat) as
        | { id?: number; title?: string; type?: string; username?: string; first_name?: string }
        | undefined;
      if (!chat || chat.id === undefined) continue;
      const id = String(chat.id);

      // message.migrate_from_chat_id: 이 새 슈퍼그룹이 어느 옛 ID 에서 왔는지.
      const fromId = (update.message as { migrate_from_chat_id?: number } | undefined)?.migrate_from_chat_id;
      if (typeof fromId === 'number') migrated.add(String(fromId));
      // message.migrate_to_chat_id: 이 옛 그룹이 어느 새 ID 로 갔는지 — 옛 ID 자체를 무효로 표시.
      const toId = (update.message as { migrate_to_chat_id?: number } | undefined)?.migrate_to_chat_id;
      if (typeof toId === 'number') migrated.add(id);

      if (seen.has(id)) continue;
      const title =
        chat.title || (chat.username ? `@${chat.username}` : '') || chat.first_name || '(이름 없음)';
      seen.set(id, { chatId: id, title, type: chat.type ?? '' });
    }

    // 휴리스틱: 같은 자릿수(magnitude) 의 일반 그룹 ↔ 슈퍼그룹(-100 prefix) 쌍이
    // 보이면 일반 그룹은 업그레이드된 죽은 ID 로 간주하고 숨긴다.
    // (텔레그램이 그룹을 슈퍼그룹으로 자동 승격할 때 같은 magnitude 를 유지)
    const supergroupMagnitudes = new Set<string>();
    for (const c of seen.values()) {
      const m = c.chatId.match(/^-100(\d+)$/);
      if (m) supergroupMagnitudes.add(m[1]);
    }
    for (const c of Array.from(seen.values())) {
      const m = c.chatId.match(/^-(\d+)$/);
      if (c.type === 'group' && m && supergroupMagnitudes.has(m[1])) {
        seen.delete(c.chatId);
      }
    }
    // 명시적 migrate 신호로 무효화된 옛 ID 도 제거.
    for (const id of migrated) seen.delete(id);

    const chats = Array.from(seen.values());
    if (chats.length === 0) {
      return {
        ok: true,
        chats: [],
        hint:
          '봇이 본 최근 채팅이 없습니다. 그룹에서 봇을 향해 아무 메시지나 한 번 보낸 뒤 다시 시도하세요. (Privacy Mode 가 켜져 있으면 봇은 자기에게 직접 보낸 메시지만 봅니다 — @BotFather 의 /setprivacy 로 끌 수 있습니다.)',
      };
    }
    return { ok: true, chats };
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
    if (!res.ok || !body.ok) {
      return {
        ok: false,
        error: `${body.description ?? `HTTP ${res.status}`} [chat_id=${cfg.telegramChatId}]`,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
