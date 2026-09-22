// pending-ko.json(한글 제목·쉬운 요약·키워드 채운 것)을 papers.json에 반영한다.
// 실행: node scripts/thesis-apply-ko.mjs  → 반영된 항목은 pending에서 제거, 비어 있는 항목은 남긴다.
import { readFileSync, writeFileSync } from 'node:fs';

const D = new URL('./thesis-data/', import.meta.url);
const papers = JSON.parse(readFileSync(new URL('papers.json', D), 'utf8'));
const pending = JSON.parse(readFileSync(new URL('pending-ko.json', D), 'utf8'));
const byDoi = new Map(papers.map((p) => [p.doi.toLowerCase(), p]));

let applied = 0;
const left = [];
for (const e of pending) {
  const p = byDoi.get(e.doi.toLowerCase());
  if (!p || !(e.title_ko || '').trim() || !(e.summary_easy || '').trim()) { left.push(e); continue; }
  p.title_ko = e.title_ko.trim();
  p.summary_easy = e.summary_easy.trim();
  if (Array.isArray(e.keywords_ko) && e.keywords_ko.length) p.keywords_ko = e.keywords_ko;
  if ((e.abstract_ko || '').trim()) p.abstract_ko = e.abstract_ko.trim();
  applied++;
}
writeFileSync(new URL('papers.json', D), JSON.stringify(papers, null, 1));
writeFileSync(new URL('pending-ko.json', D), JSON.stringify(left, null, 1));
console.log(`반영 ${applied}건, 미완 ${left.length}건`);
