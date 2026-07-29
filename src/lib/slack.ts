import crypto from 'crypto';
import { readSingleUncached } from '@/lib/db';

/**
 * Slack Bot 연동 (양방향).
 *
 * 기존 `sendSlackMessage`(integrations.ts)는 Incoming Webhook 단방향 — 일일
 * 리포트·운영 알림 전용으로 그대로 둔다. 이 모듈은 버튼·스레드 댓글처럼
 * Slack → 우리 서버 인바운드가 필요한 흐름을 담당하므로 Bot Token 을 쓴다.
 *
 * 필요 ENV:
 *   SLACK_BOT_TOKEN       xoxb-... (scopes: chat:write, channels:history,
 *                         channels:read, groups:history, groups:read)
 *   SLACK_SIGNING_SECRET  요청 서명 검증용
 *   SLACK_CHANNEL_ID      통지 대상 (C0xxxx 또는 "08_zoellife-vietnam")
 *
 * 미설정 시 모든 전송이 skipped 로 무해하게 빠진다 — 텔레그램/어드민 경로에
 * 영향 없음. 설정 가이드: docs/slack-setup.md
 */

export interface SlackConfig {
  botToken?: string;
  signingSecret?: string;
  channel?: string;
}

interface StoredSlackSettings {
  slackBotToken?: string;
  slackSigningSecret?: string;
  slackChannelId?: string;
}

export async function resolveSlackConfig(): Promise<SlackConfig> {
  // Uncached — 어드민이 토큰/채널을 바꾼 직후 캐시 만료를 기다리지 않도록.
  const stored = (await readSingleUncached<StoredSlackSettings>('integration-settings')) ?? {};
  return {
    botToken: stored.slackBotToken?.trim() || process.env.SLACK_BOT_TOKEN?.trim(),
    signingSecret: stored.slackSigningSecret?.trim() || process.env.SLACK_SIGNING_SECRET?.trim(),
    channel: stored.slackChannelId?.trim() || process.env.SLACK_CHANNEL_ID?.trim(),
  };
}

export interface SlackResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
  /** chat.postMessage 성공 시 메시지 타임스탬프 (스레드 부모 키) */
  ts?: string;
  /** 실제 전송된 채널 ID */
  channel?: string;
}

/* ───────── 저수준 Web API ───────── */

interface SlackApiResponse {
  ok?: boolean;
  error?: string;
  ts?: string;
  channel?: string | { id?: string };
  messages?: Array<{ ts?: string; text?: string; blocks?: unknown; user?: string }>;
  channels?: Array<{ id?: string; name?: string }>;
  response_metadata?: { next_cursor?: string };
}

async function slackApi(
  method: string,
  body: Record<string, unknown>,
  token: string,
): Promise<SlackApiResponse> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return (await res.json().catch(() => ({}))) as SlackApiResponse;
}

/**
 * 읽기 계열 Web API (conversations.replies / conversations.list 등).
 * 이 메서드들은 JSON body 를 받지 않는다 — application/json 으로 보내면
 * 인자가 무시되어 channel_not_found 류 오류가 난다. GET + 쿼리스트링으로 호출.
 */
async function slackApiGet(
  method: string,
  params: Record<string, string | number | boolean>,
  token: string,
): Promise<SlackApiResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  ).toString();
  const res = await fetch(`https://slack.com/api/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  return (await res.json().catch(() => ({}))) as SlackApiResponse;
}

/**
 * 채널 이름("08_zoellife-vietnam", "#08_...")을 ID(C0xxxx)로 해석.
 * 이미 ID 형태면 그대로 반환. 결과는 프로세스 수명 동안 캐시 —
 * 채널 ID 는 변하지 않으므로 재조회할 이유가 없다.
 */
const channelIdCache = new Map<string, string>();

async function resolveChannelId(nameOrId: string, token: string): Promise<string | null> {
  const raw = nameOrId.replace(/^#/, '').trim();
  if (!raw) return null;
  // Slack 채널 ID 는 C/G/D + 영숫자 대문자. 이름에는 대문자를 못 쓰므로 구분 가능.
  if (/^[CGD][A-Z0-9]{6,}$/.test(raw)) return raw;

  const cached = channelIdCache.get(raw);
  if (cached) return cached;

  let cursor: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const params: Record<string, string | number | boolean> = {
      limit: 200,
      exclude_archived: true,
      types: 'public_channel,private_channel',
    };
    if (cursor) params.cursor = cursor;
    const resp = await slackApiGet('conversations.list', params, token);
    if (!resp.ok) return null;
    const hit = resp.channels?.find((c) => c.name === raw);
    if (hit?.id) {
      channelIdCache.set(raw, hit.id);
      return hit.id;
    }
    cursor = resp.response_metadata?.next_cursor || undefined;
    if (!cursor) break;
  }
  return null;
}

/* ───────── 서명 검증 ───────── */

/**
 * Slack 요청 서명 검증 (v0 HMAC-SHA256).
 * 반드시 raw body 문자열로 검증해야 한다 — JSON.parse 후 재직렬화하면
 * 바이트가 달라져 서명이 깨진다.
 *
 * 재전송 공격 차단: 타임스탬프가 5분을 벗어나면 거부.
 */
export function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string,
): boolean {
  if (!timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expected =
    'v0=' +
    crypto
      .createHmac('sha256', signingSecret)
      .update(`v0:${timestamp}:${rawBody}`)
      .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ───────── 메시지 전송 ───────── */

export type SlackBlock = Record<string, unknown>;

export interface PostOptions {
  /** 미지정 시 설정된 기본 채널 */
  channel?: string;
  /** 알림 미리보기·접근성용 대체 텍스트 */
  text: string;
  blocks?: SlackBlock[];
  /** 지정 시 해당 메시지의 스레드로 전송 */
  threadTs?: string;
}

export async function postSlack(opts: PostOptions): Promise<SlackResult> {
  const cfg = await resolveSlackConfig();
  const target = opts.channel || cfg.channel;
  if (!cfg.botToken || !target) {
    return { ok: false, skipped: true, error: 'slack bot not configured' };
  }
  try {
    const channelId = await resolveChannelId(target, cfg.botToken);
    if (!channelId) {
      return { ok: false, error: `채널을 찾을 수 없습니다: ${target} (봇이 채널에 초대됐는지 확인)` };
    }
    const resp = await slackApi(
      'chat.postMessage',
      {
        channel: channelId,
        text: opts.text,
        ...(opts.blocks ? { blocks: opts.blocks } : {}),
        ...(opts.threadTs ? { thread_ts: opts.threadTs } : {}),
        unfurl_links: false,
        unfurl_media: false,
      },
      cfg.botToken,
    );
    if (!resp.ok) return { ok: false, error: resp.error ?? 'unknown slack error' };
    return { ok: true, ts: resp.ts, channel: channelId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** 기존 메시지 갱신 (승인 후 버튼을 결과 표시로 교체할 때). */
export async function updateSlack(opts: {
  channel: string;
  ts: string;
  text: string;
  blocks?: SlackBlock[];
}): Promise<SlackResult> {
  const cfg = await resolveSlackConfig();
  if (!cfg.botToken) return { ok: false, skipped: true, error: 'slack bot not configured' };
  try {
    const resp = await slackApi(
      'chat.update',
      {
        channel: opts.channel,
        ts: opts.ts,
        text: opts.text,
        ...(opts.blocks ? { blocks: opts.blocks } : {}),
      },
      cfg.botToken,
    );
    if (!resp.ok) return { ok: false, error: resp.error ?? 'unknown slack error' };
    return { ok: true, ts: resp.ts };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** 본인에게만 보이는 임시 메시지 (권한 안내·오류 회신용). */
export async function postEphemeral(opts: {
  channel: string;
  user: string;
  text: string;
  threadTs?: string;
}): Promise<SlackResult> {
  const cfg = await resolveSlackConfig();
  if (!cfg.botToken) return { ok: false, skipped: true, error: 'slack bot not configured' };
  try {
    const resp = await slackApi(
      'chat.postEphemeral',
      {
        channel: opts.channel,
        user: opts.user,
        text: opts.text,
        ...(opts.threadTs ? { thread_ts: opts.threadTs } : {}),
      },
      cfg.botToken,
    );
    if (!resp.ok) return { ok: false, error: resp.error ?? 'unknown slack error' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function openSlackModal(
  triggerId: string,
  view: Record<string, unknown>,
): Promise<SlackResult> {
  const cfg = await resolveSlackConfig();
  if (!cfg.botToken) return { ok: false, skipped: true, error: 'slack bot not configured' };
  try {
    const resp = await slackApi('views.open', { trigger_id: triggerId, view }, cfg.botToken);
    if (!resp.ok) return { ok: false, error: resp.error ?? 'unknown slack error' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * 스레드에서 특정 ts 메시지의 원문을 가져온다.
 *
 * 답변 본문을 버튼 value 에 실어 나르지 않는 이유: Slack button value 는
 * 2000자 제한이라 긴 답변이 잘린다. 확인 시점에 원문을 다시 읽으면
 * 잘림 없이 "운영자가 실제로 쓴 그대로" 를 보장할 수 있다.
 */
export async function fetchThreadMessage(
  channel: string,
  threadTs: string,
  ts: string,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const cfg = await resolveSlackConfig();
  if (!cfg.botToken) return { ok: false, error: 'slack bot not configured' };
  try {
    const resp = await slackApiGet(
      'conversations.replies',
      { channel, ts: threadTs, limit: 200 },
      cfg.botToken,
    );
    if (!resp.ok) return { ok: false, error: resp.error ?? 'unknown slack error' };
    const hit = resp.messages?.find((m) => m.ts === ts);
    if (!hit) return { ok: false, error: '원본 댓글을 찾지 못했습니다.' };
    return { ok: true, text: hit.text ?? '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** 스레드 부모 메시지의 텍스트 (문의 카드 식별용). */
export async function fetchThreadRootText(
  channel: string,
  threadTs: string,
): Promise<string | null> {
  const cfg = await resolveSlackConfig();
  if (!cfg.botToken) return null;
  try {
    const resp = await slackApiGet(
      'conversations.replies',
      { channel, ts: threadTs, limit: 1 },
      cfg.botToken,
    );
    if (!resp.ok) {
      console.error('[slack] conversations.replies error:', resp.error);
      return null;
    }
    const root = resp.messages?.[0];
    if (!root) return null;
    // 카드 본문은 blocks 안에 있으므로 text 와 blocks 를 함께 훑는다.
    return `${root.text ?? ''}\n${JSON.stringify(root.blocks ?? '')}`;
  } catch {
    return null;
  }
}

/* ───────── Slack mrkdwn 이스케이프 ───────── */

/**
 * Slack mrkdwn 특수문자 이스케이프. &, <, > 만 처리한다 (Slack 공식 규칙).
 * 고객이 보낸 "<script>" 나 "a & b" 가 링크·엔티티로 오해석되는 것을 막는다.
 */
export function escapeSlack(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Slack section 텍스트는 3000자 제한 — 넘으면 잘라서 표시. */
export function clampSlack(s: string, max = 2800): string {
  return s.length > max ? `${s.slice(0, max)}\n… (이하 생략)` : s;
}
