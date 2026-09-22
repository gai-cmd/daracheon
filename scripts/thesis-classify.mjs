// 침향 논문 480편 2축 자동분류기 (연구분야) — 재현 가능·순수 규칙 기반.
// 축 A(연구분야): 아래 DOMAINS. 축 B(효능): 기존 efficacy_types 그대로 사용.
// import 모듈: { DOMAINS, LABELS, classify } 제공.
// CLI: node scripts/thesis-classify.mjs → 분포 출력 (dry-run, 파일 미변경)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const strip = (s) => (s || '').replace(/<[^>]+>/g, ' ').toLowerCase();

// 연구분야 규칙: [키, 라벨, 영문/라틴 정규식, 한글 정규식, 가중치].
// 점수 최고 분야를 primary. 영문+한글(keywords_ko/title_ko)+인도네시아어 동시 매칭.
export const DOMAINS = [
  ['pharm', '약리·효능',
    /anti[- ]?(inflammat|oxidant|cancer|microb|bacter|fung|viral|diabet|allerg|obesity)|inflammat|oxidative stress|cytotox|apoptosis|pharmacolog|bioactiv|biological activit|antinocicept|analgesic|neuroprotect|sedative|anxiolytic|hepatoprotect|α-glucosidase|alpha-glucosidase|immunomodul|wound heal|melanin|tyrosinase|therapeutic|in vitro|in vivo|lps[- ]?induced|efficacy/,
    /항염|항산화|항암|세포독성|항균|항진균|항바이러스|항당뇨|약리|생리활성|진정|수면|항불안|신경보호|면역|진통|미백|상처|치료 효과|효능/, 3],
  ['chem', '화학·성분',
    /chemical constituent|sesquiterpen|chromone|phenylethyl|isolation|structure elucidat|new compound|essential oil|\bvolatile|gc[- ]?ms|metabolit|terpenoid|flavonoid|phytochem|constituents from|agarospir|eudesman|guaian|odor|odour|odorant|aroma|fragran|scent|resin compound|compounds from/,
    /화학 성분|성분|세스퀴테르펜|크로몬|페네틸|정유|침향유|휘발성|테르펜|정성|정량|향기|향료|방향/, 3],
  ['biosyn', '생합성·유전체',
    /biosynthes|transcriptom|genom|\bgene\b|\bgenes\b|\bexpression\b|enzyme|sequenc|molecular clon|proteom|\bwox|\brboh\b|cytochrome p450|methyltransferase|sesquiterpene synthase|\bqtl\b|\bsnp\b|phylogenom|microsatellite|\bssr\b|marker.*(genetic|molecular)|chloroplast genome/,
    /생합성|유전자|게놈|유전체|전사체|효소|염기서열|분자|단백질체|발현|계통|미소부수체/, 3],
  ['format', '형성·유도',
    /agarwood formation|resin (formation|deposition)|\binduction\b|inducing|wounding|inoculat|artificial(ly)? induc|whole[- ]?tree|fungal infection|stress.*resin|agar(wood)? induc|pembentukan|induksi/,
    /침향 형성|형성|유도|접종|상처|손상|유기/, 3],
  ['cultiv', '재배·자원',
    /cultivat|plantation|conservation|biodiversit|distribution|agroforest|propagat|nursery|germinat|endophyt|silvicultur|habitat|\bresource|domesticat|planting|field trial|soil|growth|budidaya|konservasi|pemanfaatan|tegakan/,
    /재배|재배지|보존|생물다양성|분포|자원|내생|묘목|번식|토양|생장|서식/, 2],
  ['auth', '진위·품질·감별',
    /authenticat|quality (evaluat|assess|control|grading|analysis)|identificat|discriminat|adulterat|dna barcod|grading|geographic origin|quality marker|chemical marker|standardiz|\bnir\b|e-nose|electronic nose|characteristic quality/,
    /진위|품질 평가|품질|감별|판별|위조|기원|등급|표준화|전자코/, 3],
  ['app', '전통의학·응용',
    /traditional (chinese )?medicin|ethnopharmacol|ethnobotan|incense|aromatherap|clinical|formulation|\bmarket|\btrade\b|economic|product develop|\bfood\b|cosmetic|supplement|beverage|nanoemulsion|nanoparticle/,
    /전통의학|민족약리|향|훈향|아로마|임상|제형|시장|무역|경제|제품|화장품|식품|나노/, 2],
];

export const LABELS = Object.fromEntries([...DOMAINS.map(([k, l]) => [k, l]), ['etc', '기타']]);
const REVIEW_RE = /\breview\b|systematic review|meta-analysis|종설|리뷰|\ba review\b/;

// ── 연구 재료 판별(효능 귀속 범위를 정하기 위함) ──
// composite: 침향이 여러 약재 중 하나인 복합 처방 → 침향 단독 효능으로 귀속 불가
// endophyte: Aquilaria 내생균 유래 화합물 → 침향 자체의 효능 아님
// leaf/oil/compound/agarwood: 침향(수지목)·잎·정유·분리 성분 (효능 귀속 가능, 재료 명시)
export const MATERIALS = {
  composite: '복합제(침향 포함 처방)', endophyte: '내생균 유래', leaf: '잎 추출물',
  oil: '정유', compound: '분리 성분', agarwood: '침향(수지목)', plant: '식물체(비수지)', unknown: '미상',
};
const MAT_RULES = [
  ['composite', /herbal (formula|formulation|prescription)|formula composed|decoction|composed of .{0,80}(and|,) .{0,80}(radix|lignum|rhizoma)|traditional chinese medicine formula|compound prescription|polyherbal|multi-?herb/],
  ['endophyte', /endophyt(ic|e)s? (fung|bacter)|fungus .{0,60}(isolated|derived) from|derived fungus|aquilaria-derived fung/],
  ['leaf', /\bleaf|\bleaves\b|daun gaharu|leaf[- ]tea/],
  ['oil', /essential oil|agarwood oil|volatile oil|minyak gaharu|\bhydrosol/],
  ['compound', /isolated (from|compounds)|new (sesquiterpen|chromone|compound)|structure elucidat|compounds? \d+[-–]\d+ were/],
  ['agarwood', /agarwood|gaharu|chen ?xiang|eaglewood|aloeswood|resin/],
  ['plant', /aquilaria|gyrinops/],
];
export function materialOf(p) {
  const en = `${strip(p.title)} ${strip(p.abstract)}`;
  for (const [k, re] of MAT_RULES) if (re.test(en)) return k;
  return 'unknown';
}

// ── 효능 재태깅 규칙 ──
// 기존 efficacy_types(수집 시 LLM 부여)는 형성·재배·유전체 연구에도 붙는 오태그가 있어 그대로 쓰지 않는다.
// 유지 조건(모두 충족): (1) 초록에 해당 효능의 활성 시험 용어가 실제로 등장, (2) primary 분야가 약리·효능 또는
// 전통의학·응용 또는 화학·성분(분리 성분의 활성 평가), (3) 재료가 복합제·내생균이 아님.
export const EFF_RULES = {
  '항염': /anti[- ]?inflammat|inflammation|\bno production|nitric oxide|il-6|tnf-?α|cox-2/,
  '항산화': /antioxid|dpph|abts|frap|radical scaveng|oxidative stress/,
  '항암·세포독성': /anti[- ]?cancer|antitumou?r|cytotoxic|apoptosis of .{0,40}cancer|cancer cell|tumou?r cell|hela|hepg2|mcf-7|a549/,
  '항균·항진균·항바이러스': /anti[- ]?(bacteri|microb|fung|viral|virus)|antimicrob|\bmic\b|inhibition zone|staphylococcus|escherichia|candida/,
  '항당뇨·혈당': /anti[- ]?diabet|α-glucosidase|alpha-glucosidase|hypoglyc|blood glucose|insulin/,
  '진정·수면·항불안': /sedativ|hypnotic|anxiolytic|anti-?anxiety|\bsleep|insomnia|pentobarbital|anti-?depress/,
  '신경보호·신경계': /neuroprotect|neuroinflamm|neuronal|cognitive|memory|alzheimer|parkinson|microglia/,
  '진통': /analgesic|antinocicept|\bpain\b|writhing|hot plate/,
  '위장·소화': /gastro|gastric|intestin|digest|colitis|laxative|constipation|anti-?ulcer/,
  '항알레르기·항천식': /anti-?allerg|asthma|histamine|mast cell|ige\b/,
  '면역조절': /immunomodul|immune response|macrophage activ|immunostimul/,
  '미백·피부·상처': /tyrosinase|melanin|whitening|wound heal|skin|dermal|collagen/,
  '살충·방충': /insecticid|larvicid|repellen|mosquito|pesticid/,
  '항비만·대사': /anti-?obes|adipo|lipid accumulation|hyperlipid|cholesterol/,
  '장기보호(간·위·심장)': /hepatoprotect|cardioprotect|nephroprotect|liver injury|myocardial/,
};
export function retagEfficacy(p, primary, material) {
  const en = `${strip(p.title)} ${strip(p.abstract)}`;
  if (!['pharm', 'app', 'chem'].includes(primary)) return [];
  if (material === 'composite' || material === 'endophyte') return [];
  return Object.entries(EFF_RULES).filter(([, re]) => re.test(en)).map(([k]) => k);
}

export function classify(p) {
  const en = `${strip(p.title)} ${strip(p.journal)} ${strip(p.abstract)}`;
  const ko = `${(p.keywords_ko || []).join(' ')} ${p.title_ko || ''} ${p.abstract_ko || ''}`;
  const scores = {};
  for (const [key, , enRe, koRe, w] of DOMAINS) {
    const em = en.match(new RegExp(enRe, 'g'));
    const km = ko.match(new RegExp(koRe, 'g'));
    const n = (em ? em.length : 0) + (km ? km.length : 0);
    if (n) scores[key] = (scores[key] || 0) + n * w;
  }
  if (p.efficacy === true) scores.pharm = (scores.pharm || 0) + 3;
  let best = null, bestScore = -1;
  for (const [k, v] of Object.entries(scores)) if (v > bestScore) { best = k; bestScore = v; }
  const isReview = REVIEW_RE.test(en) || REVIEW_RE.test(ko) || p.__docType === 'review';
  // domains: 매칭된 모든 분야 키(점수순) — 백과사전 다중 분류 태그용.
  const domains = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { primary: best || 'etc', score: bestScore, isReview, domains, all: scores };
}

// ── CLI (직접 실행 시에만 분포 출력) ──
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const HTML = readFileSync(new URL('../public/thesis/index.html', import.meta.url), 'utf8');
  const PAPERS = JSON.parse(HTML.match(/<script id="PAPERS" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const dist = {};
  const multi = { '0': 0, '1': 0, '2': 0, '3+': 0 };
  let reviewCount = 0;
  for (const p of PAPERS) {
    const c = classify(p);
    dist[c.primary] = (dist[c.primary] || 0) + 1;
    const n = c.domains.length;
    multi[n === 0 ? '0' : n === 1 ? '1' : n === 2 ? '2' : '3+']++;
    if (c.isReview) reviewCount++;
  }
  console.log('=== 연구분야(primary) 분포 ===');
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1]))
    console.log(`  ${LABELS[k].padEnd(14)} ${v}`);
  console.log('총:', PAPERS.length, '| 매칭 분야 수:', multi, '| review:', reviewCount);
}
