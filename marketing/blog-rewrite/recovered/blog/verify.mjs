// 재편 산출물 독립 검증기 — 에이전트 자체보고를 신뢰하지 않고 out/ 파일을 직접 계측한다.
import fs from 'node:fs';
import path from 'node:path';

const BASE = new URL('.', import.meta.url).pathname;
const IN = path.join(BASE, 'in');
const OUT = path.join(BASE, 'out');

const decode = (s) => String(s || '')
  .replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = (s) => decode(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const hangul = (s) => (s.match(/[가-힣]/g) || []).length;

// SPEC §A 검증된 출처만 허용
const ALLOWED = [
  'doi.org/10.3390/molecules23020342', 'doi.org/10.1039/D0NP00042F',
  'doi.org/10.1055/s-2006-957784', 'doi.org/10.1080/10412905.2024.2447706',
  'doi.org/10.1021/acs.jnatprod.8b00635', 'doi.org/10.1007/s11101-025-10117-6',
  'doi.org/10.3390/molecules26247708', 'doi.org/10.1007/s11418-007-0177-0',
  'encykorea.aks.ac.kr/Article/E0058589', 'encykorea.aks.ac.kr/Article/E0062961',
  'kci.go.kr', 'cites.org', 'koreascience.kr',
  'db.history.go.kr/ancient/level.do?levelId=sg_033r_0030_0010',
  'db.history.go.kr/ancient/level.do?levelId=sg_033r_0050_0010',
  'hkplus.dongguk.edu/hkplus/column.php?mode=view&bbs_idx=1368',
];
const HEDGE = /알려져 있습니다|전해집니다|여겨집니다|보고되고 있습니다|한다고 합니다|것으로 보입니다|평가받습니다|이야기됩니다/g;
// "문제가", "숙제가" 등 오탐 방지 — 앞이 한글이면 제외
const FORBIDDEN_VOICE = /저희|(?<![가-힣])제가\s|우리 대라천/g;
const BANNED = ['완치', '부작용 없', '즉시 효과', '치료됩니다', '치료할 수 있'];

const results = [];
for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.json'))) {
  const slug = f.replace(/\.json$/, '');
  const fail = [];
  const warn = [];
  let o, src;
  try { o = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); }
  catch (e) { results.push({ slug, fail: ['JSON 파싱 실패: ' + e.message], warn: [] }); continue; }
  try { src = JSON.parse(fs.readFileSync(path.join(IN, f), 'utf8')); } catch { src = null; }

  const html = String(o.content || '');
  const text = strip(html);
  const body = html.split(/<hr\s*\/?>/)[0];
  const bodyText = strip(body);
  const chars = hangul(text);

  // 1. 분량
  if (chars < 3000) fail.push(`분량 ${chars}자 (3,000 미달)`);
  // 2. slug 불변
  if (o.slug !== slug) fail.push(`slug 변경됨: ${o.slug}`);
  // 3. excerpt
  const ex = (o.excerpt || '').length;
  if (ex < 120 || ex > 156) fail.push(`excerpt ${ex}자 (120~156 벗어남)`);
  // 4. title
  if ((o.title || '').length > 60) fail.push(`title ${(o.title || '').length}자 (60 초과)`);
  // 5. 결론 우선 리드
  if (!/class=["']lead["']/.test(html) && !/결론부터|결론적으로 먼저|한 줄로 정리하면/.test(text.slice(0, 400)))
    fail.push('결론 우선 리드 없음');
  // 6. 근거·출처 + 실제 링크
  // href 는 &amp; 로 인코딩돼 있을 수 있으므로 비교 전에 디코드한다
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/g)).map((m) => decode(m[1]));
  const ext = hrefs.filter((u) => /^https?:\/\//.test(u) && !/zoellife\.com/.test(u));
  const internal = hrefs.filter((u) => /^\/(blog|products|about-agarwood|brand-story|media|company|guide|process|showroom|reviews|home-shopping)/.test(u));
  if (!/근거·출처|근거 출처/.test(text)) fail.push('근거·출처 섹션 없음');
  if (ext.length < 1) fail.push('외부 1차 출처 링크 0개');
  if (internal.length < 2) fail.push(`내부링크 ${internal.length}개 (2 미만)`);
  // 7. 미허가 출처
  const bad = ext.filter((u) => !ALLOWED.some((a) => u.includes(a)));
  if (bad.length) fail.push('미검증 외부 출처: ' + bad.slice(0, 3).join(', '));
  // 8. 화자
  const ownerSubj = (bodyText.match(/조엘라이프|대라천은|대라천이|대라천도/g) || []).length;
  if (ownerSubj < 3) fail.push(`브랜드 주어 ${ownerSubj}회 (3 미만)`);
  const badVoice = bodyText.match(FORBIDDEN_VOICE) || [];
  if (badVoice.length) fail.push(`금지 인칭 ${badVoice.length}회 (${[...new Set(badVoice)].join(',')})`);
  const hedges = bodyText.match(HEDGE) || [];
  if (hedges.length) warn.push(`회피 화법 ${hedges.length}회: ${[...new Set(hedges)].join(',')}`);
  // 9. 컴플라이언스
  const banned = BANNED.filter((w) => bodyText.includes(w));
  if (banned.length) fail.push('금지 표현: ' + banned.join(','));
  // 10. disclaimer
  if (!/본 콘텐츠는[\s\S]{0,40}정보 제공/.test(text)) fail.push('disclaimer 소실');
  // 11. 시각자료
  const svg = (html.match(/<svg/g) || []).length;
  const tokens = Array.from(html.matchAll(/\{\{IMG:([^}]+)\}\}/g)).map((m) => m[1]);
  if (svg < 1) fail.push('인포그래픽 SVG 없음');
  if (tokens.includes('cover')) fail.push('{{IMG:cover}} 사용 금지 위반');
  const imgs = Array.isArray(o.images) ? o.images : [];
  if (tokens.length < 2) fail.push(`{{IMG:}} 토큰 ${tokens.length}개 (2 미만)`);
  const missing = tokens.filter((t) => !imgs.some((i) => i.key === t));
  if (missing.length) fail.push('토큰에 대응하는 images[] 없음: ' + missing.join(','));
  const noAlt = imgs.filter((i) => !i.alt || i.alt.length < 5);
  if (noAlt.length) fail.push(`images[] alt 누락 ${noAlt.length}건`);
  if (!/<table/.test(html)) warn.push('표 없음');
  // 12. H2 분량
  const h2parts = html.split(/<h2[^>]*>/).slice(1);
  const over = h2parts.filter((p) => hangul(strip(p.split(/<h2/)[0])) > 800).length;
  const under = h2parts.filter((p) => hangul(strip(p.split(/<h2/)[0])) < 150).length;
  if (over) warn.push(`H2 800자 초과 ${over}개`);
  if (h2parts.length < 6) warn.push(`H2 ${h2parts.length}개 (6 미만)`);
  // 13. 원문 수치 보존
  if (src) {
    const nums = (s) => new Set((strip(s).match(/\d[\d,.]*/g) || []).filter((n) => n.replace(/\D/g, '').length >= 3));
    const before = nums(src.content), after = nums(o.content);
    const lost = [...before].filter((n) => !after.has(n));
    if (lost.length) warn.push(`원문 수치 소실 ${lost.length}건: ${lost.slice(0, 6).join(', ')}`);
    const sciBefore = (strip(src.content).match(/Aquilaria\s+\w+/g) || []);
    const sciAfter = new Set(strip(o.content).match(/Aquilaria\s+\w+/g) || []);
    const lostSci = [...new Set(sciBefore)].filter((s) => !sciAfter.has(s));
    if (lostSci.length) fail.push('학명 소실: ' + lostSci.join(','));
    const codes = (strip(src.content).match(/DA-\d{6}-\d/g) || []);
    const lostCode = [...new Set(codes)].filter((c) => !strip(o.content).includes(c));
    if (lostCode.length) fail.push('검사번호 소실: ' + lostCode.join(','));
  }

  results.push({ slug, chars, charsBefore: src ? hangul(strip(src.content)) : 0, ext: ext.length, internal: internal.length, ownerSubj, svg, tokens: tokens.length, fail, warn });
}

results.sort((a, b) => a.fail.length - b.fail.length);
let pass = 0;
for (const r of results) {
  const ok = r.fail.length === 0;
  if (ok) pass++;
  console.log(`\n${ok ? '✅ PASS' : '❌ FAIL'}  ${r.slug}`);
  console.log(`   ${r.charsBefore}자 → ${r.chars}자 | 외부출처 ${r.ext} | 내부링크 ${r.internal} | 브랜드주어 ${r.ownerSubj} | SVG ${r.svg} | IMG토큰 ${r.tokens}`);
  for (const x of r.fail) console.log(`   ❌ ${x}`);
  for (const x of r.warn) console.log(`   ⚠️  ${x}`);
}
console.log(`\n────────  PASS ${pass} / ${results.length}  ────────`);

  console.log(`\n${ok ? '✅ PASS' : '❌ FAIL'}  ${r.slug}`);
  console.log(`   ${r.charsBefore}자 → ${r.chars}자 | 외부출처 ${r.ext} | 내부링크 ${r.internal} | 브랜드주어 ${r.ownerSubj} | SVG ${r.svg} | IMG토큰 ${r.tokens}`);
  for (const x of r.fail) console.log(`   ❌ ${x}`);
  for (const x of r.warn) console.log(`   ⚠️  ${x}`);
}
console.log(`\n────────  PASS ${pass} / ${results.length}  ────────`);

