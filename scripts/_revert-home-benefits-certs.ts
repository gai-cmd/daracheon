/**
 * 2026-07-28 홈 정정(_patch-home-benefits-certs.ts)의 역패치 — 2026-08-25 고객 요청.
 * 인증 타일 3건(유전자 검사 / ORGANIC / 특허) 복원 및 12건 문구·효능 헤딩 원복.
 * prefix·토큰은 env 로만 주입 (비밀값 하드코딩 금지).
 *
 * dry-run:  npx tsx scripts/_revert-home-benefits-certs.ts
 * 실제 쓰기: npx tsx scripts/_revert-home-benefits-certs.ts --commit
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { put, list } from '@vercel/blob';

const COMMIT = process.argv.includes('--commit');

const RESTORE_CERTS: Array<[afterName: string, tile: { mark: string; name: string; sub: string }]> = [
  ['CITES', { mark: 'A', name: '유전자 검사', sub: '아갈로차 유전자 확인' }],
  ['유전자 검사', { mark: 'O', name: 'ORGANIC', sub: '유기농 · 식용' }],
  ['ORGANIC', { mark: 'R', name: '특허', sub: '수지 유도제' }],
];

const TEXT_EDITS: Array<[path: string, from: string, to: string]> = [
  ['benefits.tag', 'Benefits · 대표적인 가치', 'Benefits · 연구 기반 효능'],
  ['benefits.title', '침향의 여섯 가지 대표적인 가치', '침향의 가치, 여섯 가지 대표적 효능'],
  ['sectionMeta.certs.topTag', '03 Certifications - 9건의 공식 인증', '03 Certifications - 12건 이상의 공식 인증'],
  [
    'sectionMeta.certs.bodyLead',
    'CITES 인증, HACCP, GMP, FDA, ISO 등 국제기준에 부합하는 인증은 물론,\n정부기관과 전문기관의 품종·원산지 확인까지 갖춰 침향의 정통성과 신뢰를 높였습니다.',
    'CITES 인증, 유전자 검사, HACCP, ORGANIC, FDA, ISO 등 국제기준에 부합하는 인증은 물론,\n정부기관과 전문기관의 품종·원산지 확인 및 특허 기술까지 확보 침향의 정통성과 신뢰를 높였습니다. ',
  ],
  ['stats.2.value', 'CITES, HACCP, FDA 등', '유전자 검사, CITES 등'],
  ['stats.2.label', '9건의 공식 인증', '12건 이상의 인증 & 특허'],
  ['verification.2.label', '원산지 · CITES · 정식 수출입', '원산지 · CITES · 유전자 · 정식 수출입 · 유기농'],
  [
    'problem.cards.2.body',
    '원산지 증명, CITES 인증, 정식 수출입 확인 등 진짜 침향일수록 주요 증빙문서와 이력을 숨기지 않습니다.',
    '원산지 증명, CITES 인증, 유전자 검사, 정식 수출입 확인, 유기능 특허 등 진짜 침향일수록 주요 증빙문서와 이력을 숨기지 않습니다.',
  ],
  ['solutionCta.pillars.1.text', 'CITES · OCOP · HACCP · GMP · FDA 외 - 9건의 공식 인증', 'CITES · OCOP · HACCP · GMP · FDA 외 - 12건 이상 인증· 특허'],
];

function getParent(root: Record<string, unknown>, path: string) {
  const parts = path.split('.');
  const key = parts.pop()!;
  let cur: any = root;
  for (const p of parts) cur = cur?.[p];
  return { parent: cur, key };
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefixRaw = process.env.BLOB_DATA_PREFIX;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN 미설정');
  if (!prefixRaw) throw new Error('BLOB_DATA_PREFIX 미설정');
  const prefix = prefixRaw.replace(/[^a-zA-Z0-9_-]/g, '');
  const blobPath = `${prefix}/pages.json`;
  const { blobs } = await list({ prefix: `${prefix}/pages`, limit: 10, token });
  const existing = blobs.find((b) => b.pathname === blobPath);
  if (!existing) throw new Error(`prod blob 미발견: ${blobPath}`);
  const remote: any = await fetch(`${existing.url}?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json());
  const home = remote.home ?? remote.find?.((p: any) => p.slug === 'home');
  if (!home) throw new Error('home 없음');

  let changed = 0;
  for (const [path, from, to] of TEXT_EDITS) {
    const { parent, key } = getParent(home, path);
    if (!parent) { console.log(`? home.${path} — 경로 없음`); continue; }
    if (parent[key] === to) { console.log(`= home.${path} — 이미 반영됨`); continue; }
    if (parent[key] !== from) { console.log(`! home.${path} — 기대값 불일치, 건너뜀:\n  실제: ${JSON.stringify(parent[key])}`); continue; }
    parent[key] = to; changed++; console.log(`~ home.${path}`);
  }
  const certs: any[] = home.certs ?? [];
  for (const [after, tile] of RESTORE_CERTS) {
    if (certs.some((c) => c.name === tile.name)) { console.log(`= certs.${tile.name} — 이미 있음`); continue; }
    const i = certs.findIndex((c) => c.name === after);
    certs.splice(i + 1, 0, tile); changed++; console.log(`+ certs.${tile.name} (after ${after})`);
  }
  console.log(`\ncerts ${certs.length}: ${certs.map((c) => c.name).join(', ')}`);

  if (!COMMIT) { console.log('\n[dry-run] blob 미변경'); return; }
  if (!changed) { console.log('변경 없음'); return; }
  await put(blobPath, JSON.stringify(remote, null, 2), { access: 'public', token, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  console.log(`✔ blob 갱신: ${blobPath} (${changed}건)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
