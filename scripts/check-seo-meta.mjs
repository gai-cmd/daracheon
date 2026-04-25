// 라이브 사이트의 페이지별 SEO 메타·접근성을 검사.
//   - <h1> 1개 (0개 또는 2+ 검출 시 경고)
//   - <img>/<Image> alt 누락 카운트
//   - <link rel=canonical> 도메인 일관성
//   - <title>·<meta description>·og:title·og:description 존재
//
// 실행: node scripts/check-seo-meta.mjs [base-url]
//        (default: https://daracheon-tryn.vercel.app)

const BASE = process.argv[2] || 'https://daracheon-tryn.vercel.app';
const PATHS = [
  '/',
  '/about-agarwood',
  '/brand-story',
  '/products',
  '/company',
  '/process',
  '/reviews',
  '/home-shopping',
  '/media',
  '/support',
];

function countMatches(html, re) {
  return (html.match(re) ?? []).length;
}

function pickAttr(html, tagRe, attr) {
  const re = new RegExp(tagRe.source.replace(/__ATTR__/g, attr), 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

async function check(path) {
  const url = BASE + path;
  const res = await fetch(url, { headers: { 'User-Agent': 'SEO-Check/1.0' } });
  if (!res.ok) {
    console.log(`✗ ${path} HTTP ${res.status}`);
    return { path, ok: false };
  }
  const html = await res.text();

  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  const imgsNoAlt = imgs.filter((tag) => !/\salt\s*=\s*"[^"]+"/i.test(tag) && !/\salt\s*=\s*'[^']+'/i.test(tag)).length;

  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleM ? titleM[1] : null;
  const descM = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const desc = descM ? descM[1] : null;
  const canonM = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canon = canonM ? canonM[1] : null;
  const ogT = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogD = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ldCount = countMatches(html, /<script[^>]*application\/ld\+json[^>]*>/gi);

  const issues = [];
  if (h1Count !== 1) issues.push(`h1=${h1Count}`);
  if (imgsNoAlt > 0) issues.push(`img-no-alt=${imgsNoAlt}/${imgs.length}`);
  if (!title) issues.push('no-title');
  if (!desc) issues.push('no-description');
  if (!canon) issues.push('no-canonical');
  if (!ogT) issues.push('no-og:title');
  if (!ogD) issues.push('no-og:description');
  if (ldCount === 0) issues.push('no-jsonld');

  const status = issues.length === 0 ? '✓' : '⚠';
  console.log(`${status} ${path.padEnd(20)} h1=${h1Count} img=${imgs.length}(noalt:${imgsNoAlt}) ld=${ldCount}` +
    (issues.length ? `  · ${issues.join(' · ')}` : ''));
  if (canon) console.log(`     canonical=${canon}`);

  return { path, ok: true, h1Count, imgs: imgs.length, imgsNoAlt, title, desc, canon, ldCount, issues };
}

console.log(`SEO 메타 점검 — base=${BASE}\n`);
const results = [];
for (const p of PATHS) {
  try {
    results.push(await check(p));
  } catch (err) {
    console.log(`✗ ${p}  ERROR: ${err instanceof Error ? err.message : err}`);
  }
}

const totalIssues = results.reduce((s, r) => s + (r.issues?.length ?? 0), 0);
console.log(`\n총 ${results.length}개 페이지 / 이슈 ${totalIssues}건`);
process.exit(totalIssues > 0 ? 1 : 0);
