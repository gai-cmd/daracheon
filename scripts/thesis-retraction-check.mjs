// 아카이브 전편의 철회(retraction) 여부를 OpenAlex로 일괄 재확인한다(주간 실행용).
// 실행: node scripts/thesis-retraction-check.mjs  → verification.json의 retracted 갱신, 변화가 있으면 종료코드 2.
import { readFileSync, writeFileSync } from 'node:fs';

const D = new URL('./thesis-data/', import.meta.url);
const MAILTO = 'gai@try-n.com';
const papers = JSON.parse(readFileSync(new URL('papers.json', D), 'utf8'));
const verification = JSON.parse(readFileSync(new URL('verification.json', D), 'utf8'));
const verByDoi = new Map(verification.map((v) => [(v.doi || '').toLowerCase(), v]));

const dois = papers.map((p) => p.doi.toLowerCase());
const seen = new Map();
for (let i = 0; i < dois.length; i += 50) {
  const chunk = dois.slice(i, i + 50);
  const filter = 'doi:' + chunk.map((d) => `https://doi.org/${d}`).join('|');
  const url = `https://api.openalex.org/works?filter=${encodeURIComponent(filter)}&per-page=50&select=doi,is_retracted&mailto=${MAILTO}`;
  const r = await fetch(url, { headers: { 'User-Agent': `daerachoen-thesis-retraction/1.0 (mailto:${MAILTO})` } });
  if (!r.ok) { console.error('HTTP', r.status, 'chunk', i); continue; }
  for (const w of (await r.json()).results) seen.set((w.doi || '').replace('https://doi.org/', '').toLowerCase(), !!w.is_retracted);
  await new Promise((res) => setTimeout(res, 300));
}
const newly = [];
for (const [d, ret] of seen) {
  const v = verByDoi.get(d);
  if (!v) continue;
  if (ret && !v.retracted) newly.push(d);
  v.retracted = ret;
}
writeFileSync(new URL('verification.json', D), JSON.stringify(verification, null, 1));
console.log(`확인 ${seen.size}/${dois.length}편 · 철회 표시 ${[...seen.values()].filter(Boolean).length}편 · 새로 철회된 것 ${newly.length}편`);
if (newly.length) { console.log('새로 철회:', newly.join(', ')); process.exit(2); }
