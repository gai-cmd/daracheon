import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { logAdmin } from '@/lib/audit';
import { TOOLS, executeTool } from '@/lib/ai/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const ALLOWED_MODELS = new Set([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-6',
  'claude-sonnet-4-5',
]);
const DEFAULT_MODEL = 'claude-opus-4-7';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const ALLOWED_DOC_TYPES = new Set(['application/pdf']);
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_MESSAGES = 50;
const MAX_TEXT_CHARS = 20_000;
const MAX_TOOL_TURNS = 6;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const rateBucket = new Map<string, number[]>();

interface AttachmentInput {
  type: 'image' | 'pdf';
  mediaType: string;
  data: string;
  name?: string;
}

interface InboundMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentInput[];
}

interface ChatRequestBody {
  messages: InboundMessage[];
  model?: string;
}

const SYSTEM_PROMPT = `당신은 ZOEL LIFE(대라천) 관리자 전용 AI 에이전트입니다.
관리자가 요청하면 아래의 tool을 **직접 호출**하여 사이트 콘텐츠(페이지, 제품, FAQ, 공지, 리뷰)를 실제로 수정해야 합니다.

핵심 원칙:
- 수정 요청에는 반드시 실제 tool을 호출하세요. 마크다운 코드나 "~하세요" 같은 지시만으로는 프론트에 반영되지 않습니다.
- update_page는 전체 JSON을 덮어씁니다. 반드시 get_page로 현재 구조를 먼저 읽고, 변경된 부분만 고친 전체 객체를 넘기세요.
- update_product는 부분 병합이므로 변경할 필드만 전달하세요.
- 파괴적 작업(delete_*)은 사용자가 명시적으로 요청했을 때만 실행하고, 직전에 한 번 더 요약 확인을 제공하세요.
- 작업 완료 후, 어떤 도구를 어떻게 실행했는지 한국어로 1~3줄 요약하고 프론트 경로(예: /brand-story)를 안내하세요.

브랜드 톤:
- 베트남산 프리미엄 침향(Aquilaria agallocha) 전문 브랜드. 고급스럽고 신뢰감 있는 표현을 선호합니다.
- 답변은 간결한 한국어.`;

function rateLimitHit(actor: string): boolean {
  const now = Date.now();
  const history = rateBucket.get(actor) ?? [];
  const fresh = history.filter((t) => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rateBucket.set(actor, fresh);
    return true;
  }
  fresh.push(now);
  rateBucket.set(actor, fresh);
  return false;
}

function estimateBase64Bytes(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

function stripDataUrlPrefix(s: string): string {
  const idx = s.indexOf(',');
  return s.startsWith('data:') && idx !== -1 ? s.slice(idx + 1) : s;
}

type TextBlock = { type: 'text'; text: string };
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };
type DocBlock = { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
type ContentBlock = TextBlock | ImageBlock | DocBlock | ToolUseBlock | ToolResultBlock;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

function buildInitialContent(msg: InboundMessage): string | ContentBlock[] {
  const attachments = msg.attachments ?? [];
  if (attachments.length === 0) return msg.content;

  const blocks: ContentBlock[] = [];
  for (const a of attachments) {
    const data = stripDataUrlPrefix(a.data);
    if (a.type === 'image' && ALLOWED_IMAGE_TYPES.has(a.mediaType)) {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: a.mediaType, data } });
    } else if (a.type === 'pdf' && ALLOWED_DOC_TYPES.has(a.mediaType)) {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: a.mediaType, data } });
    }
  }
  if (msg.content.trim()) blocks.push({ type: 'text', text: msg.content });
  return blocks.length > 0 ? blocks : msg.content;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | string;
  model: string;
}

async function callAnthropic(params: {
  apiKey: string;
  model: string;
  messages: AnthropicMessage[];
}): Promise<AnthropicResponse> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: params.messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = '';
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      if (parsed.error?.message) detail = parsed.error.message.slice(0, 300);
    } catch {
      /* ignore */
    }
    const err = new Error(
      detail
        ? `Anthropic API 오류 (${res.status}): ${detail}`
        : `Anthropic API 오류 (${res.status})`
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return (await res.json()) as AnthropicResponse;
}

export async function POST(request: NextRequest) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수에 추가하세요.',
      },
      { status: 500 }
    );
  }

  if (rateLimitHit(session.email)) {
    return NextResponse.json(
      { success: false, message: '잠시 후 다시 시도해 주세요. (분당 20회 제한)' },
      { status: 429 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ success: false, message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return NextResponse.json({ success: false, message: '메시지가 비어있습니다.' }, { status: 400 });
  }
  if (incoming.length > MAX_MESSAGES) {
    return NextResponse.json(
      { success: false, message: `최대 ${MAX_MESSAGES}개 메시지까지 보낼 수 있습니다.` },
      { status: 400 }
    );
  }

  let totalAttachmentBytes = 0;
  let totalAttachments = 0;
  let totalTextChars = 0;
  const sanitized: InboundMessage[] = [];

  for (const m of incoming) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = typeof m.content === 'string' ? m.content : '';
    totalTextChars += text.length;
    if (totalTextChars > MAX_TEXT_CHARS) {
      return NextResponse.json(
        { success: false, message: '대화 전체 텍스트 길이가 너무 큽니다.' },
        { status: 413 }
      );
    }

    const atts: AttachmentInput[] = [];
    const raw = Array.isArray(m.attachments) ? m.attachments : [];
    if (raw.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      return NextResponse.json(
        { success: false, message: `첨부파일은 메시지당 최대 ${MAX_ATTACHMENTS_PER_MESSAGE}개입니다.` },
        { status: 413 }
      );
    }
    for (const a of raw) {
      if (!a || (a.type !== 'image' && a.type !== 'pdf')) continue;
      if (typeof a.mediaType !== 'string' || typeof a.data !== 'string') continue;
      if (a.data.length === 0) continue;
      const allowed =
        a.type === 'image'
          ? ALLOWED_IMAGE_TYPES.has(a.mediaType)
          : ALLOWED_DOC_TYPES.has(a.mediaType);
      if (!allowed) {
        return NextResponse.json(
          { success: false, message: `지원하지 않는 파일 형식: ${a.mediaType}` },
          { status: 415 }
        );
      }
      const cleaned = stripDataUrlPrefix(a.data);
      const bytes = estimateBase64Bytes(cleaned);
      if (bytes > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { success: false, message: '파일 하나당 최대 5MB까지 첨부할 수 있습니다.' },
          { status: 413 }
        );
      }
      totalAttachmentBytes += bytes;
      if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { success: false, message: '첨부 파일 전체 용량이 20MB를 초과했습니다.' },
          { status: 413 }
        );
      }
      totalAttachments += 1;
      atts.push({ type: a.type, mediaType: a.mediaType, data: cleaned, name: a.name });
    }

    if (!text.trim() && atts.length === 0) continue;
    sanitized.push({ role: m.role, content: text, attachments: atts });
  }

  if (sanitized.length === 0) {
    return NextResponse.json({ success: false, message: '유효한 메시지가 없습니다.' }, { status: 400 });
  }

  const model = body.model && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

  // Build initial Anthropic-format conversation
  const conversation: AnthropicMessage[] = sanitized.map((m) => ({
    role: m.role,
    content: buildInitialContent(m),
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          /* ignore — controller may be closed */
        }
      };

      try {
        let toolTurns = 0;
        let toolRuns = 0;

        while (true) {
          const resp = await callAnthropic({ apiKey, model, messages: conversation });

          // Emit any text blocks that came back
          for (const block of resp.content) {
            if (block.type === 'text') {
              emit({ type: 'text', delta: block.text });
            } else if (block.type === 'tool_use') {
              emit({
                type: 'tool_start',
                id: block.id,
                name: block.name,
                input: block.input,
              });
            }
          }

          // Append assistant message (full content array — required for tool_use continuation)
          conversation.push({ role: 'assistant', content: resp.content });

          if (resp.stop_reason !== 'tool_use') break;

          const toolUses = resp.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
          if (toolUses.length === 0) break;

          toolTurns += 1;
          if (toolTurns > MAX_TOOL_TURNS) {
            emit({
              type: 'error',
              message: `도구 호출 반복 한도(${MAX_TOOL_TURNS})를 초과했습니다. 작업을 중단합니다.`,
            });
            break;
          }

          // Execute all tool_uses and build tool_result blocks
          const toolResultBlocks: ToolResultBlock[] = [];
          for (const tu of toolUses) {
            const result = await executeTool(tu.name, tu.input ?? {});
            toolRuns += 1;
            emit({
              type: 'tool_result',
              id: tu.id,
              name: tu.name,
              ok: result.ok,
              summary: result.summary,
              error: result.error,
            });
            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify({
                ok: result.ok,
                summary: result.summary,
                ...(result.data !== undefined ? { data: result.data } : {}),
                ...(result.error !== undefined ? { error: result.error } : {}),
              }),
              is_error: !result.ok,
            });
          }

          conversation.push({ role: 'user', content: toolResultBlocks });
        }

        emit({ type: 'done' });

        void logAdmin('ai', 'update', {
          summary: `AI 채팅 + 도구 호출 (turns=${toolTurns}, runs=${toolRuns})`,
          meta: {
            model,
            messages: sanitized.length,
            attachments: totalAttachments,
            bytes: totalAttachmentBytes,
            toolTurns,
            toolRuns,
          },
        }).catch(() => {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[AI Chat] error', msg);
        emit({ type: 'error', message: msg });
        await logAdmin('ai', 'update', {
          summary: `AI 호출 실패`,
          meta: { model, detail: msg.slice(0, 300) },
        }).catch(() => {});
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-ai-model': model,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
