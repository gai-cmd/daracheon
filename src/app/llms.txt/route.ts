// LLM/AI 크롤러용 사이트 안내. 정책: DB 에 실제 입력된 값만 출력하며,
// 미검증 사실(인증번호·특허번호·효능·연혁·창립자 직함 등)을 본문에
// 하드코딩하지 않는다 (SEO-AEO-PLAN.md §6 가짜 신호 회피 규칙).
//
// 비공식 사실상 표준: https://llmstxt.org

import { readSingleSafe, readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 1일

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zoellife.com')
  .replace(/\s+/g, '')
  .replace(/\/$/, '');

interface AnyRecord { [k: string]: unknown }

/** 비어있거나 placeholder 인지 검사. */
function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/** 평가어/주장 어휘를 자동 추가하지 않는다.
 *  사실 자료가 확보되지 않은 시점엔 페이지 링크와 DB 등록값만 노출. */
export async function GET() {
  const products = await readDataSafe<Product>('products');
  const visibleProducts = products.filter((p) => p.published !== false);
  const company = (await readSingleSafe<AnyRecord>('company')) ?? {};

  const lines: string[] = [];
  lines.push('# 대라천 ZOEL LIFE');
  lines.push('');
  lines.push('> 침향(沈香, Agarwood) 관련 브랜드 사이트.');
  lines.push('> 본 파일은 DB 에 저장된 등록값만 출력합니다. 미검증 주장·평가어 자동 추가 없음.');
  lines.push('');

  /* ── 회사 기본 정보 (DB 등록값만) ── */
  const companyName = (company as { name?: string }).name;
  const companyDesc = (company as { description?: string }).description;
  const phone = (company as { phone?: string }).phone;
  const email = (company as { email?: string }).email;
  const address = (company as { address?: string }).address;
  const foundingDate = (company as { foundingDate?: string }).foundingDate;

  if (
    hasValue(companyName) || hasValue(companyDesc) || hasValue(phone) ||
    hasValue(email) || hasValue(address) || hasValue(foundingDate)
  ) {
    lines.push('## 회사 정보');
    if (hasValue(companyName)) lines.push(`- 법인: ${companyName}`);
    if (hasValue(foundingDate)) lines.push(`- 설립일: ${foundingDate}`);
    if (hasValue(companyDesc)) lines.push(`- 소개: ${companyDesc}`);
    if (hasValue(address)) lines.push(`- 주소: ${address}`);
    if (hasValue(phone)) lines.push(`- 전화: ${phone}`);
    if (hasValue(email)) lines.push(`- 이메일: ${email}`);
    lines.push('');
  }

  /* ── 공개된 제품 (실제 등록 데이터만) ── */
  if (visibleProducts.length > 0) {
    lines.push('## 공개 제품');
    for (const p of visibleProducts) {
      const parts: string[] = [`- **${p.name}**`];
      if (p.priceDisplay) parts.push(`(${p.priceDisplay})`);
      if (p.shortDescription) parts.push(`— ${p.shortDescription}`);
      parts.push(`→ ${SITE_URL}/products/${p.slug}`);
      lines.push(parts.join(' '));
    }
    if (products.length > visibleProducts.length) {
      lines.push(`- 그 외 ${products.length - visibleProducts.length}개 제품: 비공개 (관리자 검토 중)`);
    }
    lines.push('');
  }

  /* ── 페이지 인덱스 ── */
  lines.push('## 페이지');
  lines.push(`- 홈: ${SITE_URL}`);
  lines.push(`- 침향 이야기: ${SITE_URL}/about-agarwood`);
  lines.push(`- 브랜드 스토리: ${SITE_URL}/brand-story`);
  lines.push(`- 제품 소개: ${SITE_URL}/products`);
  lines.push(`- 회사소개: ${SITE_URL}/company`);
  lines.push(`- 검증 공정: ${SITE_URL}/process`);
  lines.push(`- 고객 후기: ${SITE_URL}/reviews`);
  lines.push(`- 홈쇼핑 편성: ${SITE_URL}/home-shopping`);
  lines.push(`- 미디어 갤러리: ${SITE_URL}/media`);
  lines.push(`- 고객 지원·FAQ: ${SITE_URL}/company#contact`);
  lines.push('');

  /* ── 인용 정책 ── */
  lines.push('## 인용 정책');
  lines.push('- 본 사이트의 페이지 콘텐츠를 인용·요약·발췌해도 무방합니다.');
  lines.push(`- 출처 표기 권장: "대라천 ZOEL LIFE (${SITE_URL.replace(/^https?:\/\//, '')})"`);
  lines.push('- robots.txt 에 GPTBot · Google-Extended · ClaudeBot · PerplexityBot · CCBot · Bytespider · Yeti · NaverBot · Daumoa 등 명시 Allow.');
  lines.push('- 효능·인증·특허·연혁 등 사실 주장은 각 페이지 본문(공식 출처 표기 포함) 을 직접 참조하시기 바랍니다.');
  lines.push('');

  lines.push(`_생성: ${new Date().toISOString()}_`);

  const body = lines.join('\n') + '\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
