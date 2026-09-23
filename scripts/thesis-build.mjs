// 침향 논문 아카이브(/thesis) 재현 가능 빌더.
// 입력: scripts/thesis-data/{papers,meta,verification}.json + scripts/thesis-template.html
// 처리: 진위검증 결과 + 2축 분류를 각 논문에 병합 → META 재계산 → 템플릿 주입
// 출력: public/thesis/index.html
// 실행: node scripts/thesis-build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { classify, LABELS, MATERIALS, materialOf, retagEfficacy } from './thesis-classify.mjs';

const D = new URL('./thesis-data/', import.meta.url);
const rawPapers = JSON.parse(readFileSync(new URL('papers.json', D), 'utf8'));
const meta = JSON.parse(readFileSync(new URL('meta.json', D), 'utf8'));
const verification = JSON.parse(readFileSync(new URL('verification.json', D), 'utf8'));
// 검증 결과는 DOI 기준으로 매칭(인덱스 기반은 제외 처리 후 어긋남).
const verByDoi = new Map(verification.map((v) => [(v.doi || '').toLowerCase(), v]));
// 제외 목록(exclusions.json: doi → 사유): 무관 문헌·중복·안내 레코드. 사유는 파일에 남긴다.
const exclUrl = new URL('exclusions.json', D);
const exclusions = existsSync(exclUrl) ? JSON.parse(readFileSync(exclUrl, 'utf8')) : {};
const exclSet = new Set(Object.keys(exclusions).map((d) => d.toLowerCase()));
// SCIE 등재 여부: scie-issn.json(수기 대조표)에 있는 ISSN만 true/false, 나머지 null(미확인). SJR·Scopus로 SCIE를 추정하지 않는다.
const scieUrl = new URL('scie-issn.json', D);
const scieMap = existsSync(scieUrl) ? JSON.parse(readFileSync(scieUrl, 'utf8')) : {};
const papers = rawPapers.filter((p) => !exclSet.has((p.doi || '').toLowerCase()));
console.log('제외:', rawPapers.length - papers.length, '편 (exclusions.json)');

const normType = (t) => {
  if (!t) return 'unknown';
  if (t === 'journal-article' || t === 'article') return 'article';
  if (t === 'review' || t === 'review-article') return 'review';
  if (t === 'preprint' || t === 'posted-content') return 'preprint';
  return 'other';
};

// ── 논문별 보강 ──
const domainCounts = {};
const effTypeCounts = {};
let verifiedCount = 0, preprintCount = 0, reviewCount = 0;

papers.forEach((p, i) => {
  const v = verByDoi.get((p.doi || '').toLowerCase()) || {};
  p.__docType = normType(v.type);
  const c = classify(p);
  delete p.__docType;
  const scieHit = (p.issn || []).map((i) => scieMap[i]).find((v) => v === true || v === false);
  p.scie = scieHit === undefined ? null : scieHit;
  // WoS 색인 종류(SCIE/SSCI/AHCI/ESCI) — MJL _products 기록에서 첫 ISSN 기준
  const prods = (scieMap._products || {})[(p.issn || [])[0]] || [];
  p.wos_index = prods.map((d) => ({ 'Science Citation Index Expanded': 'SCIE', 'Social Sciences Citation Index': 'SSCI', 'Arts & Humanities Citation Index': 'AHCI', 'Emerging Sources Citation Index': 'ESCI' })[d]).filter(Boolean);
  p.material = materialOf(p);
  p.material_label = MATERIALS[p.material];
  p.efficacy_types_raw = p.efficacy_types || [];
  p.efficacy_types = retagEfficacy(p, c.primary, p.material);
  p.efficacy = p.efficacy_types.length > 0;

  const docType = normType(v.type);
  p.domain = c.primary;
  p.domain_label = LABELS[c.primary];
  p.domains = c.domains.length ? c.domains : [c.primary];
  p.is_review = c.isReview || docType === 'review';
  p.verified = !!v.resolved;
  p.verify_source = v.source || null;
  p.doc_type = docType;
  p.is_preprint = docType === 'preprint';
  p.title_match = v.sim ?? null;
  p.retracted = !!v.retracted;

  domainCounts[c.primary] = (domainCounts[c.primary] || 0) + 1;
  for (const t of (p.efficacy_types || [])) effTypeCounts[t] = (effTypeCounts[t] || 0) + 1;
  if (p.verified) verifiedCount++;
  if (p.is_preprint) preprintCount++;
  if (p.is_review) reviewCount++;
});

// ── META 재계산 ──
meta.domain_labels = LABELS;
meta.domain_counts = domainCounts;
meta.efficacy_type_counts = effTypeCounts;
meta.verified_count = verifiedCount;
meta.preprint_count = preprintCount;
meta.review_count = reviewCount;
meta.abstract_ko_count = papers.filter((p) => (p.abstract_ko || '').trim()).length;
meta.total = papers.length;
// 연도 범위는 실제 문헌의 발행연도로 — 검토자가 옛 문헌을 --doi 로 넣으면 2020 이전으로 내려간다.
const years = papers.map((p) => Number((p.published_date || '').slice(0, 4))).filter((y) => y > 1900);
meta.year_from = Math.min(...years);
meta.year_to = Math.max(...years);
meta.efficacy_count = papers.filter((p) => p.efficacy).length;
meta.excluded_count = rawPapers.length - papers.length;
meta.material_counts = papers.reduce((a, p) => { a[p.material] = (a[p.material] || 0) + 1; return a; }, {});
meta.material_labels = MATERIALS;
meta.scopus_count = papers.filter((p) => p.scopus).length;
meta.scie_count = papers.filter((p) => p.scie === true).length;
meta.esci_only_count = papers.filter((p) => p.scie === false && (p.wos_index || []).includes('ESCI')).length;
meta.scie_checked_at = scieMap._checked_at || '';
meta.korea_count = papers.filter((p) => p.is_korea).length;
meta.verified_at = new Date().toISOString().slice(0, 10);
meta.quartile_counts = papers.reduce((a, p) => { const q = p.quartile || '미확인'; a[q] = (a[q] || 0) + 1; return a; }, {});
meta.year_counts = papers.reduce((a, p) => { const y = (p.published_date || '').slice(0, 4) || '?'; a[y] = (a[y] || 0) + 1; return a; }, {});

console.log('=== 보강 결과 ===');
console.log('총 논문:', papers.length);
console.log('진위 실존확인:', verifiedCount, `/ ${papers.length}`);
console.log('preprint(미피어리뷰):', preprintCount, '| review(종설):', reviewCount);
console.log('한글초록:', meta.abstract_ko_count);
console.log('연구분야:', Object.fromEntries(Object.entries(domainCounts).map(([k, n]) => [LABELS[k], n])));
console.log('분위:', meta.quartile_counts);
console.log('효능(재태깅):', meta.efficacy_count, '| 재료:', meta.material_counts);

// ── 템플릿 주입 → index.html ──
const tplUrl = new URL('./thesis-template.html', import.meta.url);
if (existsSync(tplUrl)) {
  let tpl = readFileSync(tplUrl, 'utf8');
  // application/json 스크립트 태그 안에 안전하게 넣기 위해 </ → <\/ 이스케이프(유효 JSON).
  const safe = (obj) => JSON.stringify(obj).replace(/<\//g, '<\\/');
  tpl = tpl
    .replace('/*{{PAPERS_JSON}}*/', () => safe(papers))
    .replace('/*{{META_JSON}}*/', () => safe(meta));
  const outUrl = new URL('../public/thesis/index.html', import.meta.url);
  writeFileSync(outUrl, tpl);
  console.log('\n✅ index.html 생성:', (tpl.length / 1024 / 1024).toFixed(2), 'MB');
} else {
  writeFileSync(new URL('papers.enriched.json', D), JSON.stringify(papers));
  writeFileSync(new URL('meta.enriched.json', D), JSON.stringify(meta, null, 1));
  console.log('\n⚠ 템플릿 없음 — enriched 데이터만 저장(scripts/thesis-data/*.enriched.json)');
}
