import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { logAdmin } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;        // 5 MB per file (raw, after base64 decode)
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MB total per request
const MAX_MESSAGES = 50;
const MAX_TEXT_CHARS = 20_000;

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

const SYSTEM_PROMPT = `당신은 ZOEL LIFE(대라천) 웹사이트 관리자를 돕는 AI 어시스턴트입니다.

역할:
- 관리자가 프론트엔드 화면을 수정하고 개선할 수 있도록 조언합니다.
- 사이트 콘텐츠(제품, 브랜드 스토리, 침향 이야기 등)의 기획·카피라이팅을 돕습니다.
- 첨부된 화면 캡쳐 또는 이미지를 분석하여 구체적인 개선점을 제안합니다.
- 디자인/UX 개선 아이디어를 제시하고, 구현에 필요한 구체적인 코드 스니펫(React/Next.js/Tailwind)을 제공합니다.
- 베트남산 프리미엄 침향(Aquilaria agallocha) 전문 브랜드의 톤앤매너를 이해하고, 고급스럽고 신뢰감 있는 표현을 선호합니다.

답변 스타일:
- 한국어로 간결하고 명확하게 답합니다.
- 코드 예시는 마크다운 코드 블록으로 제시합니다.
- 관리자가 바로 적용할 수 있도록 실행 가능한 지시를 우선합니다.`;

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
  const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  return Math.floor((b64.length * 3) / 4) - padding;
}

function stripDataUrlPrefix(s: string): string {
  const idx = s.indexOf(',');
  return s.startsWith('data:') && idx !== -1 ? s.slice(idx + 1) : s;
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

function buildContent(msg: InboundMessage): string | ContentBlock[] {
  const attachments = msg.attachments ?? [];
  if (attachments.length === 0) return msg.content;

  const blocks: ContentBlock[] = [];
  for (const a of attachments) {
    const data = stripDataUrlPrefix(a.data);
    if (a.type === 'image' && ALLOWED_IMAGE_TYPES.has(a.mediaType)) {
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: a.mediaType, data },
      });
    } else if (a.type === 'pdf' && ALLOWED_DOC_TYPES.has(a.mediaType)) {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: a.mediaType, data },
      });
    }
  }
  if (msg.content.trim()) blocks.push({ type: 'text', text: msg.content });
  return blocks.length > 0 ? blocks : msg.content;
}

export async function POST(request: NextRequest) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json(
      { success: false, message: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          'ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수에 추가하세요.',
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
    return NextResponse.json(
      { success: false, message: '잘못된 요청 본문입니다.' },
      { status: 400 }
    );
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return NextResponse.json(
      { success: false, message: '메시지가 비어있습니다.' },
      { status: 400 }
    );
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
    return NextResponse.json(
      { success: false, message: '유효한 메시지가 없습니다.' },
      { status: 400 }
    );
  }

  const model =
    body.model && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

  const payloadMessages = sanitized.map((m) => ({
    role: m.role,
    content: buildContent(m),
  }));

  const upstream = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: payloadMessages,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.error('[AI Chat] upstream error', upstream.status, errText.slice(0, 300));
    await logAdmin('ai', 'update', {
      summary: `AI 호출 실패 (${upstream.status})`,
      meta: { model, status: upstream.status },
    }).catch(() => {});
    return NextResponse.json(
      {
        success: false,
        message: `Anthropic API 오류 (${upstream.status})`,
      },
      { status: 502 }
    );
  }

  void logAdmin('ai', 'update', {
    summary: 'AI 채팅 요청',
    meta: {
      model,
      messages: sanitized.length,
      attachments: totalAttachments,
      bytes: totalAttachmentBytes,
    },
  }).catch(() => {});

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const evt of events) {
            const dataLine = evt.split('\n').find((l) => l.startsWith('data: '));
            if (!dataLine) continue;
            const dataStr = dataLine.slice(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr) as {
                type?: string;
                delta?: { type?: string; text?: string };
              };
              if (
                parsed.type === 'content_block_delta' &&
                parsed.delta?.type === 'text_delta' &&
                typeof parsed.delta.text === 'string'
              ) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // ignore unparseable SSE payloads
            }
          }
        }
      } catch (err) {
        console.error('[AI Chat] stream error', err);
        controller.error(err);
        return;
      }
      controller.close();
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-ai-model': model,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
