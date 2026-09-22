// Clarivate Master Journal List(공개 검색 API, 세션 쿠키 필요)로 저널별 SCIE/SSCI/ESCI 등재 여부를 대조해
// scripts/thesis-data/scie-issn.json 을 채운다. 헤드리스 브라우저(Playwright)로 페이지를 연 뒤 같은 세션에서 API 호출.
// 실행: node scripts/thesis-scie-check.mjs [--pw <playwright 패키지 경로>]
import { readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const pwPath = args.includes('--pw') ? args[args.indexOf('--pw') + 1] : 'playwright';
const { chromium } = await import(pwPath);
const D = new URL('./thesis-data/', import.meta.url);
const papers = JSON.parse(readFileSync(new URL('papers.json', D), 'utf8'));
const out = JSON.parse(readFileSync(new URL('scie-issn.json', D), 'utf8'));

// 저널(첫 ISSN) 단위로 묶기 — 같은 저널의 모든 ISSN에 결과를 복사한다.
const groups = new Map();
for (const p of papers) { const iss = p.issn || []; if (!iss.length) continue; if (!groups.has(iss[0])) groups.set(iss[0], new Set()); for (const i of iss) groups.get(iss[0]).add(i); }
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const todo = [...groups.keys()].filter((k) => out[k] === undefined).slice(0, limit);
console.log(`저널 ${groups.size}개 중 미대조 ${todo.length}개`);

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36' });
await page.goto('https://mjl.clarivate.com/home', { waitUntil: 'networkidle', timeout: 60000 });
let n = 0, scie = 0, none = 0, err = 0;
for (const key of todo) {
  // 앱과 동일한 본문(WoS 핵심 컬렉션 필터) — filters 를 비우면 400.
  const body = { searchValue: key, pageNum: 1, pageSize: 10, sortOrder: [{ name: 'RELEVANCE', order: 'DESC' }], filters: [
    { filterName: 'COVERED_LATEST_JEDI', matchType: 'BOOLEAN_EXACT', caseSensitive: false, values: [{ type: 'VALUE', value: 'true' }] },
    { filterName: 'PRODUCT_CODE', matchType: 'TEXT_EXACT', caseSensitive: false, values: ['D', 'J', 'SS', 'H', 'EX'].map((v) => ({ type: 'VALUE', value: v })) },
  ] };
  let codes = null;
  try {
    const r = await page.request.post('https://mjl.clarivate.com/api/mjl/jprof/public/rank-search', { data: body, headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*', authorization: 'Bearer', 'x-1p-appid': 'mjl', referer: 'https://mjl.clarivate.com/search-results' } });
    const j = await r.json();
    const hit = (j.journalProfiles || []).map((x) => x.journalProfile).find((jp) => [jp.issn, jp.eissn].includes(key));
    codes = hit ? (hit.products || []).map((p) => p.description) : [];
  } catch (e) { err++; console.log('ERR', key, e.message); continue; }
  const isScie = codes.includes('Science Citation Index Expanded');
  for (const i of groups.get(key)) { out[i] = isScie; }
  out._products = out._products || {}; out._products[key] = codes.filter((c) => /Citation Index|Emerging Sources/.test(c));
  isScie ? scie++ : none++; n++;
  if (n <= 3) console.log(' ', key, codes);
  if (n % 25 === 0) { writeFileSync(new URL('scie-issn.json', D), JSON.stringify(out, null, 1)); console.log(`${n}/${todo.length} (SCIE ${scie})`); }
  await page.waitForTimeout(400);
}
out._checked_at = new Date().toISOString().slice(0, 10);
out._note = 'ISSN → true(SCIE 등재)/false(미등재 또는 MJL에 없음). 출처: Clarivate Master Journal List 공개 검색(rank-search), thesis-scie-check.mjs. _products 에 저널별 WoS 색인(SCIE/SSCI/AHCI/ESCI) 기록.';
writeFileSync(new URL('scie-issn.json', D), JSON.stringify(out, null, 1));
console.log(`완료: 대조 ${n} · SCIE ${scie} · 비SCIE/미수록 ${none} · 오류 ${err}`);
await b.close();
