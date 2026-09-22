// 침향 논문 아카이브(/thesis) 신규 문헌 수집기 — OpenAlex(무료, 키 불필요) 기반.
// 실행: node scripts/thesis-collect.mjs [--since YYYY-MM-DD] [--dry]
//  1) 직전 수집일(meta.generated_at) 90일 전부터 오늘까지 agarwood/Aquilaria/Gyrinops 검색
//  2) 관련성 필터: 제목에 키워드 또는 초록에 키워드 2회 이상
//  3) 기존 DOI·제외 목록(exclusions.json)과 겹치면 건너뜀
//  4) 저널 등급(SJR 분위·Scopus)은 아카이브에 이미 있는 저널(ISSN) 정보만 재사용 — 없으면 "미확인"
//  5) papers.json·verification.json에 추가, meta.generated_at/latest_batch 갱신,
//     한글 제목·쉬운 요약이 비어 있는 신규 건은 thesis-data/pending-ko.json에 남김(사람/LLM 번역 후 thesis-apply-ko.mjs로 반영)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = new URL('./thesis-data/', import.meta.url);
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const sinceArg = args.includes('--since') ? args[args.indexOf('--since') + 1] : null;
// --doi a,b,c : 검색 기간과 무관하게 특정 DOI를 직접 추가(검토자가 지목한 누락 문헌용)
const doiArg = args.includes('--doi') ? args[args.indexOf('--doi') + 1] : '';
const PREPRINT_SRC = /zenodo|researchgate|ssrn|biorxiv|medrxiv|preprints\.org|research square|authorea/i;
const MAILTO = 'gai@try-n.com';

const papers = JSON.parse(readFileSync(new URL('papers.json', D), 'utf8'));
const meta = JSON.parse(readFileSync(new URL('meta.json', D), 'utf8'));
const verification = JSON.parse(readFileSync(new URL('verification.json', D), 'utf8'));
const exclUrl = new URL('exclusions.json', D);
const exclusions = existsSync(exclUrl) ? JSON.parse(readFileSync(exclUrl, 'utf8')) : {};

const have = new Set(papers.map((p) => (p.doi || '').toLowerCase()));
for (const d of Object.keys(exclusions)) have.add(d.toLowerCase());

const KW = /agarwood|aquilaria|gyrinops|eaglewood|gaharu|chen ?xiang|\boud\b|aloeswood|沉香|침향|kynam|qi-?nan|agar wood/gi;
const today = new Date().toISOString().slice(0, 10);
const since = sinceArg || (() => {
  const d = new Date((meta.generated_at || '2020-01-01').slice(0, 10));
  d.setDate(d.getDate() - 90); // 지연 색인 회수용 90일 겹침
  return d.toISOString().slice(0, 10);
})();

// 아카이브에 이미 있는 저널의 등급 정보(ISSN 키) 재사용
const journalByIssn = new Map();
for (const p of papers) for (const i of (p.issn || [])) if (!journalByIssn.has(i)) journalByIssn.set(i, p);

const invToText = (inv) => {
  if (!inv) return '';
  const arr = [];
  for (const [w, pos] of Object.entries(inv)) for (const i of pos) arr[i] = w;
  return arr.join(' ').trim();
};
const fetchJson = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': `daerachoen-thesis-collect/1.0 (mailto:${MAILTO})` } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
};

const q = encodeURIComponent('agarwood OR Aquilaria OR Gyrinops');
const base = `https://api.openalex.org/works?search=${q}&filter=from_publication_date:${since},type:article|review&per-page=200&sort=publication_date:desc&mailto=${MAILTO}`;
const found = [];
for (let page = 1; page <= 10; page++) {
  const r = await fetchJson(`${base}&page=${page}`);
  found.push(...r.results);
  if (r.results.length < 200) break;
}
console.log(`검색: ${since} 이후 ${found.length}건 (OpenAlex)`);
for (const d of doiArg.split(',').map((x) => x.trim()).filter(Boolean)) {
  try { found.push(await fetchJson(`https://api.openalex.org/works/https://doi.org/${d}?mailto=${MAILTO}`)); console.log(' 직접 지정:', d); }
  catch (e) { console.log(' 직접 지정 실패:', d, e.message); }
}

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
const added = [];
for (const w of found) {
  const doi = (w.doi || '').replace('https://doi.org/', '').toLowerCase();
  if (!doi || have.has(doi)) continue;
  const title = w.title || w.display_name || '';
  const abstract = invToText(w.abstract_inverted_index);
  const tHit = (title.match(KW) || []).length, aHit = (abstract.match(KW) || []).length;
  if (!(tHit >= 1 || aHit >= 2)) continue;
  const src = w.primary_location?.source || {};
  const preprint = PREPRINT_SRC.test(src.display_name || '') || w.type === 'preprint';
  const issn = src.issn || (src.issn_l ? [src.issn_l] : []);
  const known = issn.map((i) => journalByIssn.get(i)).find(Boolean);
  const countries = [...new Set((w.authorships || []).flatMap((a) => a.countries || []))];
  const rec = {
    title, title_ko: '',
    authors: (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean),
    affiliations: [...new Set((w.authorships || []).flatMap((a) => (a.institutions || []).map((i) => i.display_name)))],
    country: countries,
    journal: src.display_name || '', publisher: src.host_organization_name || '', issn,
    indexing: known ? known.indexing : '미확인', scopus: known ? !!known.scopus : false,
    quartile: known ? known.quartile : '', sjr: known ? known.sjr : null,
    doi, url: `https://doi.org/${doi}`,
    published_date: w.publication_date || '',
    abstract, abstract_ko: '', keywords_ko: [], summary_easy: '',
    citation_count: w.cited_by_count ?? null,
    doc_type: preprint ? 'preprint' : (w.type === 'review' ? 'review' : 'article'),
    is_review: w.type === 'review' || /\breview\b/i.test(title),
    is_preprint: preprint, retracted: !!w.is_retracted,
    is_korea: countries.includes('KR'),
    efficacy: false, efficacy_types: [], domain: '', domain_label: '', domains: [],
    source_api: 'OpenAlex', first_seen: now, last_updated: now,
    verified: true, verify_source: 'OpenAlex', title_match: 1,
    added_batch: today,
  };
  added.push(rec);
  have.add(doi);
}
console.log(`관련성 통과·신규: ${added.length}건`);
for (const a of added.slice(0, 15)) console.log(' +', a.doi, '|', a.title.slice(0, 70), '|', a.journal, a.quartile || '미확인');

if (dry) { console.log('(dry-run: 파일 미변경)'); process.exit(0); }

papers.push(...added);
for (const a of added) verification.push({ doi: a.doi, resolved: true, source: 'OpenAlex', type: a.doc_type, sim: 1, retracted: a.retracted, api_year: (a.published_date || '').slice(0, 4) });
meta.generated_at = now;
meta.latest_batch = today;
meta.new_count = added.length;
meta.collection_log = [...(meta.collection_log || []), { source: 'OpenAlex', level: 'ok', message: `${today}: ${since} 이후 검색 ${found.length}건 → 신규 ${added.length}건 추가` }];
writeFileSync(new URL('papers.json', D), JSON.stringify(papers, null, 1));
writeFileSync(new URL('verification.json', D), JSON.stringify(verification, null, 1));
writeFileSync(new URL('meta.json', D), JSON.stringify(meta, null, 1));
const pending = added.map((a) => ({ doi: a.doi, title: a.title, abstract: a.abstract.slice(0, 1500), title_ko: '', summary_easy: '', keywords_ko: [] }));
writeFileSync(new URL('pending-ko.json', D), JSON.stringify(pending, null, 1));
console.log(`저장 완료. 한글 번역 대기: thesis-data/pending-ko.json (${pending.length}건) → 채운 뒤 node scripts/thesis-apply-ko.mjs`);
