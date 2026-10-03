// llms-full.txt — AI 크롤러용 단일 텍스트 풀 콘텐츠 페이로드.
// /llms.txt 가 인덱스/요약이라면, 본 파일은 본문(브랜드 사실·정의·FAQ·
// 제품 라인업·검증 절차)을 한 번에 펼친 long-form 텍스트.
// AI 답변 엔진(ChatGPT Search / Perplexity / Claude Web 등) 이 사이트
// 전체를 traverse 하지 않고도 "정답 인용"을 추출할 수 있게 한다.
//
// 정책: DB 등록값 + 본문 페이지의 사실만 직렬화. 새로운 평가어·인증번호·
// 특허번호·연혁 사실을 자동 추가하지 않는다 (SEO-AEO-PLAN.md §6).

import { readSingleSafe, readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 1일

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\\[nrt]/g, '')
  .replace(/\s+/g, '')
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\/+$/, '');

interface AnyRecord { [k: string]: unknown }
function s(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function GET() {
  const products = await readDataSafe<Product>('products');
  const visible = products.filter((p) => p.published !== false);
  const company = (await readSingleSafe<AnyRecord>('company')) ?? {};

  const out: string[] = [];

  out.push('# 대라천 ZOEL LIFE — 풀 콘텐츠 페이로드 (AI 검색·요약용)');
  out.push('');
  out.push('> 본 파일은 AI 검색 엔진이 한 번의 요청으로 사이트 핵심 사실을 수집할 수 있도록 제공되는 long-form 텍스트입니다.');
  out.push(`> 정규 사이트: ${SITE_URL}`);
  out.push('> 인용 권장 표기: "대라천 ZOEL LIFE — zoellife.com"');
  out.push(`> 마지막 갱신: ${new Date().toISOString()}`);
  out.push('');
  out.push('---');
  out.push('');

  /* ── 1. 한 줄 정의 ── */
  out.push('## 1. 한 줄 정의 (One-liner)');
  out.push('대라천 ZOEL LIFE 는 베트남 5개 지역 직영 농장에서 25년 이상 재배한 식약처 고시 학명 침향(Aquilaria Agallocha Roxburgh) 을 한국에 직판하는 침향 전문 브랜드.');
  out.push('');

  /* ── 2. 핵심 사실 표 ── */
  out.push('## 2. 핵심 사실');
  out.push('| 항목 | 값 |');
  out.push('| --- | --- |');
  out.push('| 브랜드 | 대라천 ZOEL LIFE (大羅天 / Đại La Thiên) |');
  out.push('| 별칭 | 대라천, 조엘라이프, Daeracheon, ZOEL LIFE |');
  out.push('| 학명 | Aquilaria Agallocha Roxburgh (AAR) |');
  out.push('| 원산지 | 베트남 5개 지역(하띤·동나이·냐짱·푸꾸옥·람동) 직영 농장 합계 200ha · 400만 그루 (람동 158ha) |');
  out.push('| 운영 기간 | 25년 이상 (1998 침향 사업·연구 시작) |');
  out.push('| 서비스 지역 | 한국, 일본, 베트남 |');
  out.push('| 제품 | 오일·캡슐·환·선향·침향수·침향차 외 |');
  out.push('| 인증 | 원산지 · CITES · 유전자 검사 · ORGANIC · 수지 유도제 특허 · HACCP · GMP · OCOP · ISO · 미국 FDA 등록 등 12건 이상 |');
  out.push('| 검증 | TSL(ISO/IEC 17025:2017) 중금속 8종 불검출 (2023-08-24) |');
  out.push('');

  /* ── 3. 회사 정보 (DB 값만) ── */
  const cName = s((company as AnyRecord).name);
  const cDesc = s((company as AnyRecord).description);
  const cAddr = s((company as AnyRecord).address);
  const cPhone = s((company as AnyRecord).phone);
  const cEmail = s((company as AnyRecord).email);
  const cCEO = s((company as AnyRecord).ceo);
  const cReg = s((company as AnyRecord).businessReg);
  const cFounded = s((company as AnyRecord).foundingDate);
  if (cName || cDesc || cAddr || cPhone || cEmail || cCEO || cReg || cFounded) {
    out.push('## 3. 회사 정보');
    if (cName) out.push(`- 법인명: ${cName}`);
    if (cCEO) out.push(`- 대표자: ${cCEO}`);
    if (cReg) out.push(`- 사업자등록: ${cReg}`);
    if (cFounded) out.push(`- 설립: ${cFounded}`);
    if (cAddr) out.push(`- 주소: ${cAddr}`);
    if (cPhone) out.push(`- 전화: ${cPhone}`);
    if (cEmail) out.push(`- 이메일: ${cEmail}`);
    if (cDesc) out.push(`- 소개: ${cDesc}`);
    out.push('');
  }

  /* ── 4. 정답형 FAQ (단답 — AI 가 직접 인용 가능) ── */
  out.push('## 4. 정답형 FAQ');
  out.push('');
  out.push('Q. 식약처 고시 침향의 학명은?');
  out.push('A. Aquilaria Agallocha Roxburgh (아퀼라리아 아갈로차 록스버그). 대한민국약전외한약(생약)규격집에 등록된 침향 학명(식품공전에는 A. Malaccensis Lam.도 식용 원료로 등록).');
  out.push('');
  out.push('Q. 침향이란?');
  out.push('A. 팥꽃나무과 Aquilaria 나무가 외부 상처·곰팡이 감염에 반응해 분비한 수지가 수십 년간 응축되어 굳은 향목. 한약재·천연 향료로 동서양에서 수천 년간 사용.');
  out.push('');
  out.push('Q. 정품 침향 4단계 검증?');
  out.push('A. (1) 학명 표기 — Aquilaria Agallocha Roxburgh. (2) 원산지 증명. (3) CITES 인증. (4) 유전자 검사·정식 수출입 확인. 진짜 침향일수록 증빙문서와 이력을 공개.');
  out.push('');
  out.push('Q. 침향의 6대 효능?');
  out.push('A. 동의보감 등 한의학 문헌은 침향을 기를 내리고 속을 따뜻하게 하며 마음을 안정시키는 약재로 기록합니다. 현대 연구는 침향의 향 성분(아가로스피롤 등)과 생리활성을 실험실·동물 단계에서 다루고 있으며, 사람 대상 임상 근거는 아직 제한적입니다.');
  out.push('');
  out.push('Q. 침향의 6단계 제조 공정?');
  out.push('A. (1) 씨앗 발아·묘목 육성, (2) 베트남 직영 농장 식재, (3) 20년 이상 오르가닉 육성, (4) 특허 수지유도제 주입, (5) 벌목·원물 정밀 채취, (6) 전통 증기 증류·최종 검수.');
  out.push('');
  out.push('Q. 보유 인증은?');
  out.push('A. 원산지 증명 · CITES · 유전자 검사 · ORGANIC · 수지 유도제 특허(#12835) · HACCP · GMP · OCOP · ISO · 미국 FDA 등록 등 12건 이상. TSL 중금속 8종 불검출.');
  out.push('');
  out.push('Q. 대라천 ZOEL LIFE 와 일반 침향 제품의 차이?');
  out.push('A. 베트남 5개 지역 직영 농장 → 동나이 직영공장 증류 → 한국 판매까지, 원산지부터 제품까지 전 과정을 자체 운영하는 수직계열화 구조. 25년 이상 AAR 단일 품종. 홈쇼핑 직접 판매로 중간 유통을 줄임.');
  out.push('');

  /* ── 5. 용어 정의 ── */
  out.push('## 5. 용어');
  out.push('- **침향(沈香, Agarwood)**: Aquilaria 나무의 수지가 응축된 향목. 물에 가라앉을 정도로 밀도가 높다는 뜻에서 "沈" 자 사용.');
  out.push('- **AAR**: Aquilaria Agallocha Roxburgh — 식약처 고시 규격집 등록 학명.');
  out.push('- **아가로스피롤(Agarospirol)**: 침향의 대표 휘발성 성분 중 하나. 신경 안정·숙면 작용 보고.');
  out.push('- **CITES 부속서 II**: 침향 종은 국제 보호 수종으로 정식 허가 없이 국제 유통 불가.');
  out.push('- **OCOP**: 베트남 정부 1현 1품 품질 인증.');
  out.push('');

  /* ── 6. 제품 라인업 (DB 등록값) ── */
  if (visible.length > 0) {
    out.push('## 6. 제품 라인업 (공개)');
    for (const p of visible) {
      const head = p.priceDisplay ? `${p.name} (${p.priceDisplay})` : p.name;
      out.push(`### ${head}`);
      if (p.shortDescription) out.push(p.shortDescription);
      out.push(`- 상세 페이지: ${SITE_URL}/products/${p.slug}`);
      out.push('');
    }
  }

  /* ── 7. 페이지 지도 ── */
  out.push('## 7. 페이지 지도');
  out.push(`- 홈: ${SITE_URL}`);
  out.push(`- 침향 정의·문헌·논문: ${SITE_URL}/about-agarwood`);
  out.push(`- 브랜드 스토리: ${SITE_URL}/brand-story`);
  out.push(`- 6단계 검증 공정: ${SITE_URL}/process`);
  out.push(`- 제품 전체: ${SITE_URL}/products`);
  out.push(`- 회사 소개·연락처: ${SITE_URL}/company`);
  out.push(`- 고객 후기: ${SITE_URL}/reviews`);
  out.push(`- 홈쇼핑 편성: ${SITE_URL}/home-shopping`);
  out.push(`- 미디어: ${SITE_URL}/media`);
  out.push('');

  /* ── 8. 인용 정책 ── */
  out.push('## 8. 인용 정책');
  out.push('- 모든 AI 검색·요약 엔진의 인용·발췌·요약을 허용합니다.');
  out.push('- 권장 표기: "대라천 ZOEL LIFE — zoellife.com"');
  out.push('- 콘텐츠는 사람이 직접 작성·검수합니다 (ai-content-declaration: human-authored).');
  out.push('- 사실 주장은 각 페이지 본문의 공식 출처 표기와 함께 인용하세요.');
  out.push('');

  return new Response(out.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
