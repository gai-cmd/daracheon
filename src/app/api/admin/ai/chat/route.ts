import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { logAdmin } from '@/lib/audit';
import { TOOLS, executeTool } from '@/lib/ai/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Agent loop runs several turns (탐색 → 읽기 → 편집) and Opus 4.7 generating
// a 30–40KB edit_source_file payload alone takes ~60s. 60s was guaranteeing
// mid-stream cutoffs where tool_use fired but tool_result never returned,
// freezing the UI on "실행 중…". Vercel Pro allows up to 300s on Node.
export const maxDuration = 300;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
// Beta flag that opts into server-side compaction: when the conversation
// approaches the context window limit (default ~150K tokens), Anthropic
// summarizes earlier turns into a `compaction` block and returns it as
// part of the response content. Must be appended back verbatim on the
// next turn so the API can replace the compacted history.
const ANTHROPIC_BETA_COMPACT = 'compact-2026-01-12';

// Compaction is supported on Opus 4.6+, Sonnet 4.6+. Haiku 4.5 does not
// support it; for those models we omit both the beta header and the
// context_management block (the request would 400 otherwise).
const COMPACTION_SUPPORTED = new Set([
  'claude-opus-4-7',
  'claude-opus-4-6',
  'claude-sonnet-4-6',
]);

// 실존·검증된 모델 ID 만 허용. 가상/구형 ID (claude-opus-4-6,
// claude-sonnet-4-5 등) 를 허용하면 fallback 체인이 404 를 치고
// rate-limit 아니므로 즉시 chain 중단 → 사용자는 '쓸모없음' 경험.
const ALLOWED_MODELS = new Set([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
]);
// Haiku 4.5 is the default because source-file edits are bottlenecked on
// output token generation speed. Opus 4.7 emits at ~75 tok/s, Sonnet 4.6
// at ~250 tok/s, Haiku 4.5 at ~500–700 tok/s. On mechanical code edits
// (str_replace, tab insertion, copy tweaks) the quality difference is
// negligible but wall-clock time is 6–8× better vs Opus, 2–3× better
// vs Sonnet. Users can pick Sonnet/Opus explicitly for tasks that
// benefit from deeper reasoning.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const ALLOWED_DOC_TYPES = new Set(['application/pdf']);
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_MESSAGES = 50;
const MAX_TEXT_CHARS = 20_000;
// Haiku 4.5 is the default and tends to decompose tasks into many small
// atomic tool calls (read → edit → re-read → edit …). A BrandStory-style
// multi-tab edit routinely needs 10–15 turns. 6 was terminating tasks
// mid-flight with "도구 호출 반복 한도 초과". 25 covers realistic edit
// sequences while still bounding runaway loops.
const MAX_TOOL_TURNS = 25;

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
관리자가 요청하면 제공된 tool을 **직접 호출**하여 실제로 변경을 반영해야 합니다. 설명만 하고 끝내지 마세요.

## 두 가지 수정 영역

### A. DB 콘텐츠 (즉시 반영, 권장)
- 페이지(aboutAgarwood, brandStory): list_pages, get_page, update_page
- 제품: list_products, get_product, create_product, update_product, delete_product
- FAQ: list_faqs, create_faq, update_faq, delete_faq
- 공지 배너: get_announcement, update_announcement
- **네비게이션(헤더·푸터 메뉴)**: get_navigation, update_navigation ← 메뉴 라벨·순서·링크는 반드시 이 도구로. 소스 코드 편집 아님.
- 리뷰: list_reviews, update_review_verified, delete_review

### B. 소스 코드 (Git 커밋 → Vercel 재빌드, 2~3분 후 반영)
- 검색: search_source_code (예: "10ha")
- 탐색: list_source_files (경로 브라우징)
- 읽기: read_source_file (파일 원문 + sha 획득)
- **부분 수정(권장)**: str_replace_source_file (단일) / multi_str_replace_source_file (원자적 다중)
- 전체 덮어쓰기·신규 파일: edit_source_file (sha 있으면 수정, 없으면 생성)
- 삭제: delete_source_file

## 🔴 편집 도구 선택 규칙 (반드시 지킬 것)

**기존 파일의 부분 수정은 무조건 str_replace 계열 사용.** edit_source_file로 전체 재출력하면:
- 30KB 파일 기준 출력 토큰 10,000+ → 모델 3~4분 소요 → 함수 타임아웃 리스크 큼
- API 비용 20배 더 비쌈
- Git diff 지저분

**선택 규칙:**
1. 파일 한 곳 수정 → \`str_replace_source_file\` (old_string + new_string, 파일 내 **정확히 1회** 등장해야 함)
2. 파일 여러 곳을 한 번에 수정 (예: import 추가 + state 추가 + JSX 삽입) → \`multi_str_replace_source_file\` (replacements 배열, 원자적)
3. 신규 파일 생성 → \`edit_source_file\` (sha 생략)
4. 파일 완전 재작성 (90% 이상 변경) → \`edit_source_file\` (sha 포함)

**str_replace 사용 팁:**
- old_string은 유일해야 하므로 앞뒤 3~5줄 포함해서 보내세요. 단 한 글자/탭이라도 원문과 다르면 매칭 실패.
- "0곳 매칭" 에러 → read_source_file로 현재 내용 재확인, 공백/탭/줄바꿈 맞추기
- "여러 곳 매칭" 에러 → 더 긴 컨텍스트 포함하거나 multi_str_replace로 분리
- "SHA 불일치" 에러 → 다른 커밋이 끼어든 것, read_source_file로 새 sha 받아 재시도

## 어느 도구를 써야 하는가
1. 사용자가 "X를 Y로 바꿔줘"라고 했을 때, 먼저 **DB 영역에 있는지** 확인:
   - list_pages, list_products, list_faqs, get_announcement, list_reviews 로 후보 조회
   - get_page로 페이지 JSON 안에도 검색
2. DB 어디에도 없으면 **소스 코드 영역**:
   - search_source_code("X")로 파일 위치 찾기
   - read_source_file로 전문 읽기 (sha 확보)
   - edit_source_file로 수정 커밋 (sha 포함)
   - 사용자에게 "Vercel 재빌드 중 (~2~3분). 완료 후 사이트에 반영됩니다" 안내
3. 레이아웃/헤더/푸터/스타일/새 페이지 추가 요청은 무조건 소스 코드 영역.

## 절대 규칙 (최우선)
**A. 예고 금지 — 즉시 호출.**
- "~하겠습니다", "~시작합니다", "지금 검색합니다", "동시에 읽겠습니다" 같은 **예고 문장만 출력하고 턴을 종료하는 것은 금지**입니다. 이는 시스템에서 '그냥 설명만 한 답변'으로 처리되어 아무 도구도 실행되지 않습니다.
- 수정·검색·조회 요청이 들어오면, 이번 응답의 **같은 블록 안에** tool_use를 반드시 첨부하세요. 예고 문장은 짧게 "검색합니다" 한 줄이면 충분하고, 그 직후 같은 턴에 tool_use 블록이 붙어 있어야 합니다.
- 병렬 호출 계획이 있으면 **이번 응답에서 실제로** 여러 tool_use 블록을 한 번에 내보내세요. "다음 턴에 호출하겠습니다"는 안 됩니다.

**B. 검색 인덱싱 지연 대응.**
- search_source_code는 GitHub Code Search 기반이라 최근 변경이 인덱싱 안 돼 0건이 나올 수 있습니다. **0건이면 즉시 포기하지 말고**: list_source_files → read_source_file 순으로 직접 파일을 열어 찾으세요.
- 한국어 텍스트 수정은 흔히 아래 경로에 있습니다. 후보지를 한 번에 list_source_files/read_source_file로 뒤지세요:
  - src/app/page.tsx (홈 히어로/스탯)
  - src/app/layout.tsx (메타데이터)
  - src/app/brand-story/BrandStoryClient.tsx 및 layout.tsx
  - src/app/about-agarwood/
  - src/data/company.ts (회사 정보, 통계, FAQ, 미디어)
  - data/db/pages.json (DB 시드 — 여기도 반드시 고치거나 update_page로 덮어쓰기)
- DB 저장된 콘텐츠와 소스 fallback 둘 다 있는 경우가 많습니다(예: data?.x ?? '하드코딩'). 둘 중 서빙되는 쪽만 고치면 안 되고, 가능하면 **둘 다** 수정하세요.

**C. 도구 입력 규칙.**
- update_page: **부분 병합(deep merge)**. 변경하려는 필드만 담아 보내도 기존 형제 필드는 보존됩니다.
  - 예: hero.title 만 바꾸려면 \`{ hero: { title: "새 제목" } }\` 만 전송 (sectionTag/subtitle/heroBg 는 기존 값 유지).
  - **배열은 교체**입니다 (farms/eras/items 등). 리스트 1개만 바꾸려 해도 배열 **전체**를 재전송하세요 — 누락된 요소는 삭제됩니다.
  - get_page 로 현재 형태를 먼저 확인해야 정확한 경로로 패치할 수 있습니다.
- update_product: 부분 병합 — 변경 필드만 전달.
- str_replace_source_file: sha 필수, old_string은 파일 내 **정확히 1회** 등장, new_string ≠ old_string.
- multi_str_replace_source_file: sha 필수, 각 replacement 순서대로 적용. 이전 교체의 new_string을 다음 old_string 매칭에 고려해야 함.
- edit_source_file: **신규 파일 또는 완전 재작성 전용**. 부분 수정은 str_replace 사용.
- 파괴적 작업(delete_*)은 사용자 명시적 요청 시만.

**D. 턴 종료 전 자기 점검.**
응답을 보내기 직전 속으로 확인: "이번 턴에 tool_use 블록을 실제로 붙였는가?" 안 붙였는데 사용자 요청이 수정/검색이면 **절대 턴을 끝내지 말고** tool_use를 붙이세요.

**E. 완료 후 보고.**
도구 실행이 끝나면 한국어로 1~3줄 요약 + 확인 경로(예: /brand-story)와 필요 시 "Vercel 재빌드 중 (2~3분 후 반영)" 안내.

## 브랜드 톤
- 베트남산 프리미엄 침향(Aquilaria agallocha) 전문 브랜드. 고급스럽고 신뢰감 있는 표현.
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

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | string;
  model: string;
  usage?: AnthropicUsage;
}

// 모든 모델은 다른 두 모델로 자유롭게 fallback. Anthropic 은 model 별
// 로 ITPM 쿼터를 따로 계량하므로 한 모델 429 여도 다른 모델은 서비스
// 가능. Haiku(기본)도 429 되면 Sonnet/Opus 로 넘어가야 '쓸모없음' 이
// 안 남.
const FALLBACK_CHAIN: Record<string, string[]> = {
  'claude-opus-4-7': ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  'claude-sonnet-4-6': ['claude-haiku-4-5-20251001', 'claude-opus-4-7'],
  'claude-haiku-4-5-20251001': ['claude-sonnet-4-6', 'claude-opus-4-7'],
};

class AnthropicHttpError extends Error {
  status: number;
  retryAfterSeconds: number | null;
  constructor(status: number, message: string, retryAfterSeconds: number | null) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callAnthropicOnce(params: {
  apiKey: string;
  model: string;
  messages: AnthropicMessage[];
  signal?: AbortSignal;
}): Promise<AnthropicResponse> {
  const withCompaction = COMPACTION_SUPPORTED.has(params.model);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': params.apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
  };
  if (withCompaction) {
    headers['anthropic-beta'] = ANTHROPIC_BETA_COMPACT;
  }

  const body: Record<string, unknown> = {
    model: params.model,
    // 4096 was truncating large multi_str_replace tool_use payloads — a
    // BrandStoryClient-style multi-tab edit can need ~3K tokens of tool
    // parameters, and the model would stall near the ceiling. 8192 gives
    // headroom without real cost increase (output tokens are billed as
    // used, not as capped). Still well below Haiku's 8192 native max.
    max_tokens: 8192,
    // Array form with cache_control caches the entire prefix (tools + system)
    // together. Tools render before system in the prompt, so the breakpoint on
    // the last system block covers both. This drops per-turn input tokens to
    // ~10% of the original on cache hits — critical for the agentic loop
    // where every turn re-sends the full tools + system + growing history.
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: TOOLS,
    messages: params.messages,
  };
  if (withCompaction) {
    // Auto-compaction triggers when the prompt approaches the model's
    // context window. The API summarizes older turns into a compaction
    // block; we round-trip the full `response.content` (tool_use blocks
    // and all) so the next request can replace them cleanly.
    body.context_management = { edits: [{ type: 'compact_20260112' }] };
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: params.signal,
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
    const retryAfterRaw = res.headers.get('retry-after');
    const retryAfterSeconds = retryAfterRaw
      ? Math.max(0, Math.min(30, Number.parseInt(retryAfterRaw, 10) || 0))
      : null;
    throw new AnthropicHttpError(
      res.status,
      detail
        ? `Anthropic API 오류 (${res.status}): ${detail}`
        : `Anthropic API 오류 (${res.status})`,
      retryAfterSeconds
    );
  }
  return (await res.json()) as AnthropicResponse;
}

/**
 * Compress the oldest tool_result blocks — their `content` JSON payloads
 * are by far the largest consumers when a read_source_file return or a
 * list/get_* data dump gets round-tripped back. We replace the full JSON
 * with a one-line placeholder so the tool_use_id linkage and is_error
 * flag survive, but the body shrinks dramatically.
 *
 * Only touches tool_result blocks from the oldest `victimCount` user
 * messages — recent turns stay intact so the agent can still reason
 * about the active work.
 */
function trimOldestToolResults(
  messages: AnthropicMessage[],
  victimCount: number
): { trimmed: AnthropicMessage[]; trimmedCount: number } {
  let remaining = victimCount;
  let trimmedCount = 0;
  const trimmed = messages.map((msg) => {
    if (remaining <= 0) return msg;
    if (msg.role !== 'user' || typeof msg.content === 'string') return msg;
    let touchedHere = false;
    const newBlocks = msg.content.map((block) => {
      if (block.type !== 'tool_result') return block;
      const prev = typeof block.content === 'string' ? block.content : '';
      if (prev.length < 500) return block;
      touchedHere = true;
      trimmedCount += 1;
      return {
        ...block,
        content: JSON.stringify({
          ok: !block.is_error,
          summary: `(이전 도구 결과 — 컨텍스트 절약을 위해 ${prev.length}B → 축약됨)`,
          elided: true,
        }),
      };
    });
    if (touchedHere) remaining -= 1;
    return { ...msg, content: newBlocks };
  });
  return { trimmed, trimmedCount };
}

/**
 * Resilient wrapper around `callAnthropicOnce`:
 *
 *  1. On 429 / 529 for the requested model: wait `retry-after` (capped at
 *     30 s) and retry once. Many rate-limit windows recover within ~10 s.
 *  2. If that still fails and a fallback exists, transparently retry
 *     against the next model in the chain. Emits a notice so the UI can
 *     show "Opus rate limit → Sonnet으로 자동 전환" to the admin.
 *  3. On 413 (prompt_too_large): progressively compress the oldest
 *     tool_result payloads and retry. Anthropic's server-side compaction
 *     handles the usual growth curve, but if a single turn produces a
 *     massive tool result (large file read), we may still blow past the
 *     window — this is the belt to compaction's suspenders.
 *
 * Non-rate-limit errors (4xx other than 429/413, 5xx other than 529) are
 * not retried — those indicate a real request problem and we want the
 * stream to surface them as-is.
 */
async function callAnthropic(params: {
  apiKey: string;
  model: string;
  messages: AnthropicMessage[];
  signal?: AbortSignal;
  onFallback?: (from: string, to: string, reason: string) => void;
  onCompress?: (trimmedCount: number) => void;
}): Promise<{ resp: AnthropicResponse; modelUsed: string; messages: AnthropicMessage[] }> {
  const isRateLimit = (status: number) => status === 429 || status === 529;
  let workingMessages = params.messages;

  // Try a single model with: 413 prompt-too-large compression retries,
  // then one rate-limit retry honoring retry-after. Returns on success,
  // throws AnthropicHttpError on terminal failure for this model.
  const tryModel = async (model: string): Promise<AnthropicResponse> => {
    let rateLimitRetried = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        return await callAnthropicOnce({
          apiKey: params.apiKey,
          model,
          messages: workingMessages,
          signal: params.signal,
        });
      } catch (err) {
        if (!(err instanceof AnthropicHttpError)) throw err;

        if (err.status === 413) {
          // Prompt too large — shrink oldest tool_result payloads and try
          // again. Victim count grows 2 → 4 → 8 to reach convergence fast.
          const victims = 2 * Math.pow(2, attempt);
          const { trimmed, trimmedCount } = trimOldestToolResults(workingMessages, victims);
          if (trimmedCount === 0) throw err;
          workingMessages = trimmed;
          params.onCompress?.(trimmedCount);
          continue;
        }

        if (isRateLimit(err.status) && !rateLimitRetried) {
          rateLimitRetried = true;
          const waitMs = (err.retryAfterSeconds ?? 8) * 1000;
          await sleep(waitMs);
          continue;
        }

        throw err;
      }
    }
    throw new AnthropicHttpError(
      413,
      '컨텍스트를 더 줄일 수 없습니다. 대화 초기화를 권장합니다.',
      null
    );
  };

  // fallback 조건:
  //  - 429 / 529 (rate limit / overloaded): 확실히 다른 모델로 재시도
  //  - 404 / 400 (model not found / invalid): 구형/오타 model ID 가능성
  //    → 다른 모델로 재시도
  //  - 401 / 402 (key/credit): 계정 전체 문제 — 재시도 무의미, 즉시 throw
  //  - 기타 4xx, 5xx (network/server): 재시도 가치 있음
  const shouldFallback = (status: number) =>
    status !== 401 && status !== 402 && status !== 403 && status !== 413;

  try {
    const resp = await tryModel(params.model);
    return { resp, modelUsed: params.model, messages: workingMessages };
  } catch (err) {
    if (!(err instanceof AnthropicHttpError) || !shouldFallback(err.status)) throw err;

    const chain = FALLBACK_CHAIN[params.model] ?? [];
    let lastErr: AnthropicHttpError = err;
    for (const next of chain) {
      try {
        params.onFallback?.(params.model, next, lastErr.message);
        const resp = await tryModel(next);
        return { resp, modelUsed: next, messages: workingMessages };
      } catch (inner) {
        if (inner instanceof AnthropicHttpError && shouldFallback(inner.status)) {
          lastErr = inner;
          continue;
        }
        throw inner;
      }
    }
    // 전 chain 실패 — 구체적 안내 메시지로 재포장
    throw new AnthropicHttpError(
      lastErr.status,
      `전 모델 실패 (마지막: ${lastErr.message}). ${
        lastErr.status === 429 || lastErr.status === 529
          ? '계정 전체 rate limit — 1~2분 후 재시도 또는 Anthropic 콘솔에서 한도 상향 요청.'
          : ''
      }`,
      lastErr.retryAfterSeconds
    );
  }
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
  let droppedMessages = 0;
  let droppedAttachments = 0;
  const sanitized: InboundMessage[] = [];

  for (const m of incoming) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      droppedMessages += 1;
      console.warn('[ai-chat] drop message: invalid role', { role: m?.role });
      continue;
    }
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
      if (!a || (a.type !== 'image' && a.type !== 'pdf')) {
        droppedAttachments += 1;
        console.warn('[ai-chat] drop attachment: invalid type', { type: a?.type });
        continue;
      }
      if (typeof a.mediaType !== 'string' || typeof a.data !== 'string') {
        droppedAttachments += 1;
        console.warn('[ai-chat] drop attachment: missing mediaType/data');
        continue;
      }
      if (a.data.length === 0) {
        droppedAttachments += 1;
        console.warn('[ai-chat] drop attachment: empty data', { name: a.name });
        continue;
      }
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

    if (!text.trim() && atts.length === 0) {
      droppedMessages += 1;
      console.warn('[ai-chat] drop message: empty after sanitize', { role: m.role });
      continue;
    }
    sanitized.push({ role: m.role, content: text, attachments: atts });
  }

  if (droppedMessages > 0 || droppedAttachments > 0) {
    console.warn('[ai-chat] sanitize summary', {
      actor: session.email,
      incoming: incoming.length,
      kept: sanitized.length,
      droppedMessages,
      droppedAttachments,
    });
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
  // Propagate client disconnect (abort) to the upstream Anthropic call so we
  // stop burning tokens the moment the user hits "stop" in the panel.
  const upstreamAbort = new AbortController();
  request.signal.addEventListener('abort', () => upstreamAbort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          /* ignore — controller may be closed */
        }
      };

      // Detect if the user's latest message wants an edit/search — used to
      // decide whether a text-only assistant reply is a bug (promise without
      // action) and needs a forced retry with a system-reminder nudge.
      const lastUser = [...sanitized].reverse().find((m) => m.role === 'user');
      const lastUserText = (lastUser?.content ?? '').toLowerCase();
      const ACTION_PATTERNS = [
        // 수정/편집 계열
        '수정', '변경', '바꿔', '바꾸', '교체', '고쳐', '고치', '리라이트', '재작성',
        '반영', '올려', '올려줘', '붙여', '넣어', '넣어줘', '채워', '덮어',
        // 생성 계열
        '업데이트', '추가', '등록', '만들어', '생성', '신규', '새로',
        // 삭제 계열
        '삭제', '제거', '빼', '없애', '지워',
        // 조회/검색 계열
        '조회', '찾아', '검색', '보여', '읽어', '알려', '확인', '열어',
      ];
      const userWantsAction = ACTION_PATTERNS.some((p) => lastUserText.includes(p));
      if (userWantsAction) {
        console.log('[ai-chat] userWantsAction=true', {
          actor: session.email,
          preview: lastUserText.slice(0, 80),
        });
      }

      try {
        let toolTurns = 0;
        let toolRuns = 0;
        let nudgesUsed = 0;
        const MAX_NUDGES = 2;
        const cumUsage = {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        };

        let activeModel = model;
        while (true) {
          const { resp, modelUsed, messages: nextMessages } = await callAnthropic({
            apiKey,
            model: activeModel,
            messages: conversation,
            signal: upstreamAbort.signal,
            onFallback: (from, to) => {
              emit({
                type: 'tool_result',
                id: `fallback-${Date.now()}`,
                name: 'model_fallback',
                ok: true,
                summary: `${from} rate limit — ${to} 으로 자동 전환`,
              });
            },
            onCompress: (count) => {
              emit({
                type: 'tool_result',
                id: `compress-${Date.now()}`,
                name: 'context_compress',
                ok: true,
                summary: `컨텍스트 과대 — 오래된 도구 결과 ${count}개 자동 축약 후 재시도`,
              });
            },
          });
          if (modelUsed !== activeModel) {
            activeModel = modelUsed;
          }
          // If the request was compressed (413 recovery), reuse the trimmed
          // version as the live conversation so subsequent turns don't
          // repeat the overflow.
          if (nextMessages !== conversation) {
            conversation.length = 0;
            conversation.push(...nextMessages);
          }

          if (resp.usage) {
            cumUsage.input_tokens += resp.usage.input_tokens ?? 0;
            cumUsage.output_tokens += resp.usage.output_tokens ?? 0;
            cumUsage.cache_creation_input_tokens += resp.usage.cache_creation_input_tokens ?? 0;
            cumUsage.cache_read_input_tokens += resp.usage.cache_read_input_tokens ?? 0;
          }

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

          const toolUses = resp.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
          console.log('[ai-chat] turn', {
            turn: toolTurns,
            model: modelUsed,
            stop_reason: resp.stop_reason,
            toolUses: toolUses.length,
            textBlocks: resp.content.filter((b) => b.type === 'text').length,
          });

          // max_tokens: 모델이 출력 한도(8192)에 걸려 잘렸는데, tool_use 블록이
          // 완성되지 못한 경우가 흔함. 이때 tool_use 배열에 포함시켜 다음 턴에
          // 넘기면 Anthropic 이 400 을 돌려준다. 사용자에게 명시적으로 알리고
          // 중단한다 — 중간 상태로 돌면 조용히 실패해서 "반영 안 됨" 버그.
          if (resp.stop_reason === 'max_tokens' && toolUses.length === 0) {
            emit({
              type: 'error',
              message:
                '모델 출력 한도(8192 tokens)에 도달. 요청을 더 작은 단위로 쪼개거나 str_replace 계열 도구 사용을 권합니다.',
            });
            console.warn('[ai-chat] max_tokens with no tool_use — aborting');
            break;
          }

          // NUDGE: model produced only text but the user asked for an action
          // (edit/search/update). This is the classic "promise without action"
          // failure. Inject a system-reminder pushing the model to attach
          // tool_use blocks now, instead of ending the turn.
          if (
            resp.stop_reason !== 'tool_use' &&
            toolUses.length === 0 &&
            userWantsAction &&
            nudgesUsed < MAX_NUDGES
          ) {
            nudgesUsed += 1;
            console.log('[ai-chat] nudge injected', { nudge: nudgesUsed, stop_reason: resp.stop_reason });
            emit({
              type: 'tool_result',
              id: `nudge-${nudgesUsed}`,
              name: 'system_nudge',
              ok: true,
              summary: `도구 호출 누락 감지 — 모델에게 즉시 실행 재요청 (${nudgesUsed}/${MAX_NUDGES})`,
            });
            conversation.push({
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `<system-reminder>\n이번 응답에 tool_use 블록이 하나도 포함되지 않았습니다. 하지만 사용자는 수정·검색·조회를 요청했습니다. 예고 문장(${'"'}~하겠습니다${'"'}, ${'"'}지금 시작합니다${'"'})만 출력하고 턴을 종료하는 것은 금지입니다 (시스템 프롬프트 규칙 A).\n\n지금 이 턴에서 **즉시** 필요한 tool_use 블록들을 **한 번에 병렬로** 첨부하세요. 병렬 호출이 가능하면 여러 tool_use를 동시에 내보내세요. 설명 없이 tool만 호출해도 됩니다.\n</system-reminder>`,
                },
              ],
            });
            continue;
          }

          if (resp.stop_reason !== 'tool_use') break;

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
            const result = await executeTool(tu.name, tu.input ?? {}, {
              actorEmail: session.email,
              actorName: session.email.split('@')[0],
            });
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

        emit({ type: 'done', usage: cumUsage });

        void logAdmin('ai', 'update', {
          summary: `AI 채팅 + 도구 호출 (turns=${toolTurns}, runs=${toolRuns}, cache_hit=${cumUsage.cache_read_input_tokens})`,
          meta: {
            model,
            messages: sanitized.length,
            attachments: totalAttachments,
            bytes: totalAttachmentBytes,
            usage: cumUsage,
            toolTurns,
            toolRuns,
          },
        }).catch(() => {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        // Full stack + error object to Vercel logs so we can retro-diagnose
        // any stream failure. The client only sees `msg` (above) for safety.
        console.error('[AI Chat] fatal', {
          error: err,
          message: msg,
          model,
          actor: session.email,
          stack: err instanceof Error ? err.stack : undefined,
        });
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
      'x-ai-tools-sent': String(TOOLS.length),
      'x-ai-prompt-cache': 'on',
      'x-ai-build': (process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7),
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
