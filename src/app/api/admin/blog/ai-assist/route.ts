/**
 * 블로그 작성 보조 — Gemini 기반.
 *
 *   POST /api/admin/blog/ai-assist
 *   body: { mode: 'summarize' | 'keywords', title?: string, content?: string }
 *
 *   응답:
 *     summarize: { success: true, summary: string }     // 한국어 ≤ 100자
 *     keywords:  { success: true, keywords: string[] }  // 5~8개
 *
 * 환경변수: GOOGLE_GENAI_API_KEY 또는 GEMINI_API_KEY
 * 모델: gemini-2.0-flash (저비용·빠름). 필요 시 body.model 로 override.
 */
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { extractPlainText } from '@/lib/blog/sanitize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_CONTEXT_CHARS = 4000;
const SUMMARY_MAX = 100;
const KEYWORDS_MIN = 5;
const KEYWORDS_MAX = 8;

interface AssistBody {
  mode?: 'summarize' | 'keywords';
  title?: string;
  content?: string;
  model?: string;
}

function buildSummarizePrompt(title: string, body: string): string {
  return [
    '다음 블로그 글의 한국어 메타 디스크립션을 작성해주세요.',
    '',
    '요구사항:',
    `- 정확히 ${SUMMARY_MAX}자 이내 (한국어 기준, 공백 포함)`,
    '- 한 문장 또는 두 문장의 자연스러운 한국어',
    '- 검색엔진 결과(SERP)에 노출되는 문구이므로 키워드를 자연스럽게 포함',
    '- 따옴표·이모지·마크다운 금지',
    '- 결과만 출력 (설명·서두 없이 본문 그대로)',
    '',
    `[제목]\n${title || '(없음)'}`,
    '',
    `[본문]\n${body || '(없음)'}`,
  ].join('\n');
}

function buildKeywordsPrompt(title: string, body: string): string {
  return [
    '다음 블로그 글에서 SEO 메타 키워드를 추출해주세요.',
    '',
    '요구사항:',
    `- ${KEYWORDS_MIN}~${KEYWORDS_MAX}개`,
    '- 한국어 위주, 본문에서 실제로 사용된 표현 우선',
    '- 일반적인 단어보다 검색 의도가 분명한 키워드',
    '- 쉼표로만 구분된 한 줄 텍스트로 출력 (예: "침향, 침향 효능, 베트남 침향")',
    '- 따옴표·번호·설명·마크다운 금지',
    '',
    `[제목]\n${title || '(없음)'}`,
    '',
    `[본문]\n${body || '(없음)'}`,
  ].join('\n');
}

function extractText(response: unknown): string {
  // @google/genai 응답 구조: { text } 또는 { candidates[0].content.parts[*].text }
  if (typeof response === 'object' && response !== null) {
    const r = response as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    if (typeof r.text === 'string' && r.text.trim()) return r.text;
    const parts = r.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? '').join('').trim();
  }
  return '';
}

function cleanSummary(raw: string): string {
  return raw
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SUMMARY_MAX);
}

function parseKeywords(raw: string): string[] {
  // 첫 줄(또는 첫 비어있지 않은 줄)을 키워드 라인으로 간주
  const line = raw
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.length > 0) ?? '';
  return line
    .split(/[,，、]/)
    .map((t) => t.replace(/^[#\-*\d.()\s"']+|["'\s]+$/g, '').trim())
    .filter((t) => t.length > 0 && t.length <= 40)
    .slice(0, KEYWORDS_MAX);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GOOGLE_GENAI_API_KEY (또는 GEMINI_API_KEY) 환경변수가 설정되어 있지 않습니다.' },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as AssistBody;
    const mode = body.mode;
    if (mode !== 'summarize' && mode !== 'keywords') {
      return NextResponse.json(
        { success: false, message: 'mode 는 "summarize" 또는 "keywords" 여야 합니다.' },
        { status: 400 }
      );
    }

    const title = (body.title ?? '').trim().slice(0, 200);
    // content 는 HTML 이 들어올 수 있어 plain text 로 변환 후 컨텍스트 윈도우만큼만 사용
    const plain = extractPlainText(body.content ?? '', MAX_CONTEXT_CHARS);
    if (!title && !plain) {
      return NextResponse.json(
        { success: false, message: '제목 또는 본문 중 최소 하나는 필요합니다.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = body.model && body.model.length > 0 ? body.model : DEFAULT_MODEL;
    const prompt =
      mode === 'summarize' ? buildSummarizePrompt(title, plain) : buildKeywordsPrompt(title, plain);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: mode === 'summarize' ? 200 : 150,
      },
    });

    const raw = extractText(response);
    if (!raw) {
      return NextResponse.json(
        { success: false, message: 'AI 응답이 비어 있습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    if (mode === 'summarize') {
      return NextResponse.json({ success: true, summary: cleanSummary(raw) });
    }
    const keywords = parseKeywords(raw);
    if (keywords.length < KEYWORDS_MIN) {
      return NextResponse.json(
        { success: false, message: '추출된 키워드가 너무 적습니다. 본문을 보강해주세요.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ success: true, keywords });
  } catch (error) {
    console.error('[blog/ai-assist] error:', error);
    const message = error instanceof Error ? error.message : 'AI 호출 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
