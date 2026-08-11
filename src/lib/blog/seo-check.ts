/**
 * Blog SEO / AEO quality analyzer — pure functions, safe on client and server.
 *
 * Criteria sources:
 * - Yoast SEO content analysis (title/description length, keyphrase usage,
 *   slug quality, text length, headings, links, image alt).
 * - Google Search Essentials + SEO Starter Guide (descriptive titles, unique
 *   meta descriptions, crawlable text, alt text, internal linking).
 * - AEO/GEO baseline (awesome-geo): verifiable primary-source citations,
 *   clear heading hierarchy, tables/FAQ-style structure, up-to-date info.
 *
 * Scoring: pass = full weight, warn = half, fail = 0 → 0-100 score.
 *   good ≥ 80 (green) / ok ≥ 55 (orange) / poor < 55 (red)
 */

export type SeoStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheckItem {
  id: string;
  label: string;
  status: SeoStatus;
  /** Actionable fix suggestion — shown when status is warn/fail. */
  advice: string;
  weight: number;
}

export interface SeoReport {
  score: number; // 0-100
  grade: 'good' | 'ok' | 'poor';
  checks: SeoCheckItem[];
}

export interface SeoInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  coverImage?: string;
  ogImage?: string;
}

/** Lightweight HTML → text (no DOM dependency; runs identically on server/client). */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTags(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(stripHtml(m[2]));
  return out;
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) ?? []).length;
}

export function analyzeSeo(post: SeoInput): SeoReport {
  const checks: SeoCheckItem[] = [];
  const push = (
    id: string,
    label: string,
    status: SeoStatus,
    advice: string,
    weight = 1
  ) => checks.push({ id, label, status, advice, weight });

  const title = (post.seoTitle || post.title || '').trim();
  const desc = (post.seoDescription || post.excerpt || '').trim();
  const html = post.content || '';
  const text = stripHtml(html);
  const textLen = text.length; // Korean: char count is the meaningful unit
  const firstChunk = text.slice(0, 300);
  // Focus keyphrase: first SEO keyword, falling back to first tag.
  const keyphrase = (post.seoKeywords?.[0] || post.tags?.[0] || '').trim();

  // ── 1. Title (Google: descriptive, unique; Yoast: width limit) ──
  if (!title) {
    push('title', '제목', 'fail', '제목을 입력하세요.', 2);
  } else if (title.length < 10) {
    push('title', '제목 길이', 'warn', `제목이 너무 짧습니다(${title.length}자). 15~35자 사이의 구체적인 제목을 권장합니다.`, 2);
  } else if (title.length > 40) {
    push('title', '제목 길이', 'warn', `제목이 깁니다(${title.length}자). 검색 결과에서 잘릴 수 있으니 35자 이내를 권장합니다.`, 2);
  } else {
    push('title', '제목 길이', 'pass', '', 2);
  }

  // ── 2. Meta description (Google: unique per page; Yoast: 120-156) ──
  if (!desc) {
    push('desc', '메타 디스크립션', 'fail', '요약(메타 디스크립션)을 입력하세요. 「자동 생성」 버튼을 사용할 수 있습니다.', 2);
  } else if (desc.length < 40) {
    push('desc', '메타 디스크립션 길이', 'warn', `요약이 짧습니다(${desc.length}자). 60~100자로 핵심 키워드를 자연스럽게 포함하세요.`, 2);
  } else {
    push('desc', '메타 디스크립션', 'pass', '', 2);
  }

  // ── 3. Slug (English, short, hyphenated) ──
  const slug = post.slug ?? '';
  if (!slug || /[^a-z0-9-]/.test(slug)) {
    push('slug', '영어 슬러그', 'fail', '슬러그를 영어 소문자·숫자·하이픈으로 설정하세요. 「자동 생성」 버튼을 사용할 수 있습니다.', 2);
  } else if (slug.length > 60 || /^post(-\d+)?$/.test(slug)) {
    push('slug', '슬러그 품질', 'warn', '슬러그가 너무 길거나 의미가 없습니다. 핵심 키워드 3~6단어의 영어 슬러그를 권장합니다.', 2);
  } else {
    push('slug', '영어 슬러그', 'pass', '', 2);
  }

  // ── 4. Content length (Yoast: ≥300 words; Korean ≈ chars) ──
  if (textLen < 500) {
    push('length', '본문 분량', 'fail', `본문이 짧습니다(${textLen}자). 최소 1,000자 이상의 충실한 본문을 권장합니다.`, 2);
  } else if (textLen < 1000) {
    push('length', '본문 분량', 'warn', `본문 분량이 다소 짧습니다(${textLen}자). 1,500자 이상이면 검색·AI 답변 인용에 유리합니다.`, 2);
  } else {
    push('length', '본문 분량', 'pass', '', 2);
  }

  // ── 5. Heading structure (Google/Bing: clear hierarchy helps) ──
  const h2s = extractTags(html, 'h2');
  const h3s = extractTags(html, 'h3');
  if (h2s.length === 0 && h3s.length === 0) {
    push('headings', '소제목 구조', 'fail', 'H2/H3 소제목으로 본문을 구획하세요. AI 검색·리치 결과 모두 명확한 제목 계층을 선호합니다.', 2);
  } else if (h2s.length === 0) {
    push('headings', '소제목 구조', 'warn', 'H3만 있습니다. 큰 단락은 H2로 구획하는 것을 권장합니다.', 2);
  } else {
    push('headings', '소제목 구조', 'pass', '', 2);
  }

  // ── 6. Focus keyphrase usage (Yoast) ──
  if (!keyphrase) {
    push('keyphrase', '핵심 키워드', 'warn', '메타 키워드(또는 태그)의 첫 항목이 핵심 키워드로 사용됩니다. 키워드를 입력하세요.', 1);
  } else {
    const inTitle = title.includes(keyphrase);
    const inIntro = firstChunk.includes(keyphrase);
    const bodyCount = text.split(keyphrase).length - 1;
    if (inTitle && inIntro && bodyCount >= 2) {
      push('keyphrase', `핵심 키워드 「${keyphrase}」`, 'pass', '', 1);
    } else {
      const missing: string[] = [];
      if (!inTitle) missing.push('제목');
      if (!inIntro) missing.push('도입부(첫 300자)');
      if (bodyCount < 2) missing.push('본문(2회 이상)');
      push('keyphrase', `핵심 키워드 「${keyphrase}」`, 'warn', `핵심 키워드가 ${missing.join('·')}에 없습니다. 자연스럽게 포함하세요.`, 1);
    }
  }

  // ── 7. Images + alt text (Google: alt for accessibility & image search) ──
  const imgCount = countMatches(html, /<img\b[^>]*>/gi);
  const imgNoAlt = countMatches(html, /<img\b(?![^>]*\balt=["'][^"']+["'])[^>]*>/gi);
  if (!post.coverImage && !post.ogImage) {
    push('cover', '대표 이미지', 'fail', '커버 이미지를 설정하세요. SNS 공유·검색 썸네일에 사용됩니다.', 1);
  } else {
    push('cover', '대표 이미지', 'pass', '', 1);
  }
  if (imgCount === 0) {
    push('images', '본문 이미지', 'warn', '본문에 이미지가 없습니다. 내용을 보여주는 이미지 1장 이상을 권장합니다.', 1);
  } else if (imgNoAlt > 0) {
    push('images', '이미지 대체텍스트', 'warn', `alt 텍스트가 없는 이미지가 ${imgNoAlt}장 있습니다. 이미지 내용을 설명하는 alt를 넣으세요.`, 1);
  } else {
    push('images', '본문 이미지', 'pass', '', 1);
  }

  // ── 8. Internal links (Google SEO starter guide) ──
  const internalLinks = countMatches(html, /<a\b[^>]*href=["'](\/(?!\/)|https?:\/\/(www\.)?zoellife\.com)[^"']*["']/gi);
  if (internalLinks === 0) {
    push('internal', '내부 링크', 'warn', '사이트 내 관련 글·제품 페이지로 가는 내부 링크를 1개 이상 넣으세요.', 1);
  } else {
    push('internal', '내부 링크', 'pass', '', 1);
  }

  // ── 9. External primary-source citation (AEO: verifiable sources) ──
  const externalLinks = countMatches(html, /<a\b[^>]*href=["']https?:\/\/(?!(www\.)?zoellife\.com)[^"']+["']/gi);
  if (externalLinks === 0) {
    push('citation', '외부 출처 인용', 'warn', '주장·수치에는 논문·공식 문서 등 1차 출처 링크를 붙이세요. AI 검색 엔진은 검증 가능한 출처가 있는 글을 우선 인용합니다.', 1);
  } else {
    push('citation', '외부 출처 인용', 'pass', '', 1);
  }

  // ── 10. Readability: overly long paragraphs (Yoast readability) ──
  const paragraphs = extractTags(html, 'p');
  const longParas = paragraphs.filter((p) => p.length > 600).length;
  if (longParas > 0) {
    push('paragraphs', '문단 길이', 'warn', `600자를 넘는 긴 문단이 ${longParas}개 있습니다. 문단을 나누거나 목록·표로 정리하세요.`, 1);
  } else {
    push('paragraphs', '문단 길이', 'pass', '', 1);
  }

  // ── 11. AEO structure: Q&A heading / list / table ──
  const hasQuestionHeading = [...h2s, ...h3s].some((h) => /\?|까요|인가|어떻게|왜 |무엇/.test(h));
  const hasListOrTable = /<(ul|ol|table)\b/i.test(html);
  if (hasQuestionHeading || hasListOrTable) {
    push('aeo', 'AI 답변 친화 구조', 'pass', '', 1);
  } else {
    push('aeo', 'AI 답변 친화 구조', 'warn', '질문형 소제목(예: "침향이 왜 비싼가요?")이나 목록·표를 넣으면 AI 검색 답변에 인용되기 유리합니다.', 1);
  }

  // ── 12. Tags ──
  if ((post.tags?.length ?? 0) === 0) {
    push('tags', '태그', 'warn', '관련 태그를 2개 이상 입력하세요.', 1);
  } else {
    push('tags', '태그', 'pass', '', 1);
  }

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce(
    (s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight / 2 : 0),
    0
  );
  const score = Math.round((earned / totalWeight) * 100);
  const grade = score >= 80 ? 'good' : score >= 55 ? 'ok' : 'poor';
  return { score, grade, checks };
}

export const SEO_GRADE_COLOR: Record<SeoReport['grade'], string> = {
  good: '#2e9e5b',
  ok: '#e08a1e',
  poor: '#c0392b',
};

export const SEO_GRADE_LABEL: Record<SeoReport['grade'], string> = {
  good: '좋음',
  ok: '보통',
  poor: '개선 필요',
};
