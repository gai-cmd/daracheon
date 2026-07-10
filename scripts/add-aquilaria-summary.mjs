// aboutAgarwood.papers 의 "Aquilaria Species: Distribution, Phytochemicals,
// Pharmacological Uses" (titleKr: "Aquilaria 속의 분포·식물화학 성분·약리학적 활용")
// 논문 항목에 summaryKr(요약카드) 를 추가해 seed + Vercel Blob 에 반영한다.
// 멱등(idempotent): 이미 summaryKr 가 있으면 덮어쓴다.
//
// 실행: node scripts/add-aquilaria-summary.mjs
// 필요: .env.local → BLOB_READ_WRITE_TOKEN, BLOB_DATA_PREFIX
//   (BLOB 자격증명이 없으면 seed 파일만 갱신되고 blob 쓰기는 건너뛴다)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'db');

const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
const PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'MISSING_BLOB_DATA_PREFIX').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const TITLE = 'Aquilaria Species: Distribution, Phytochemicals, Pharmacological Uses';
const SUMMARY_KR =
  'Aquilaria 속(팥꽃나무과)은 아시아 열대·아열대 지역에 널리 분포하며 침향을 생성하는 대표적 수종이다. 본 종설은 Aquilaria 속의 지리적 분포와 종 다양성, 식물화학 성분, 약리학적 활용, 품질 등급 체계를 종합적으로 정리한다. 침향의 주요 성분은 세스퀴테르펜과 2-(2-페닐에틸)크로몬 계열이며, 이 밖에 플라보노이드·벤조페논·리그난 등 다양한 이차대사산물이 확인된다. 약리학적으로는 항염·항산화·항균·진정·진통·항당뇨 등 폭넓은 생물활성이 보고되었다. 또한 침향의 형성 기전과 등급 분류, 진위 감별 및 품질 관리 방법을 다루며, 지속가능한 이용과 표준화를 위한 향후 연구 방향을 제시한다.';

async function writeDb(filename, data) {
  const body = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(DB, `${filename}.json`), body, 'utf-8');
  if (!HAS_BLOB) {
    console.log(`  BLOB_READ_WRITE_TOKEN 없음 — seed(${filename}.json) 만 갱신, blob 쓰기 건너뜀`);
    return;
  }
  const pathname = `${PREFIX}/${filename}.json`;
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const existing = blobs.find((b) => b.pathname === pathname);
    if (existing) await del(existing.url);
  } catch {}
  await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`  wrote ${filename}.json to blob (${body.length}B)`);
}

const pages = JSON.parse(fs.readFileSync(path.join(DB, 'pages.json'), 'utf-8'));

const papers = pages?.aboutAgarwood?.papers;
if (!Array.isArray(papers)) {
  throw new Error('aboutAgarwood.papers 배열을 찾을 수 없습니다.');
}
const paper = papers.find((p) => p.title === TITLE);
if (!paper) {
  throw new Error(`대상 논문을 찾을 수 없습니다: ${TITLE}`);
}
paper.summaryKr = SUMMARY_KR;
console.log(`summaryKr 설정 완료: "${paper.titleKr ?? paper.title}"`);

await writeDb('pages', pages);
console.log('\n완료');
