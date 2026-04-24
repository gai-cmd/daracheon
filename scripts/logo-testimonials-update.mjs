// 3개 콘텐츠 갱신을 한 번에 처리:
//  1. ZOEL LIFE 로고 SVG → Blob 업로드 + company.companyLogo 설정
//  2. media.json 에서 비어있는 v5 "냐짱 · 칸호아성 침향 농장 현장 탐방" 제거
//  3. pages.aboutAgarwood.testimonialsTab.items 에 네이버 블로그 후기 9건 추가
//
// 실행: node scripts/logo-testimonials-update.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT, 'data', 'db');

// .env.local 로드
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);

async function writeDb(filename, data) {
  const body = JSON.stringify(data, null, 2);
  // fs seed 동기화
  fs.writeFileSync(path.join(DB_DIR, `${filename}.json`), body, 'utf-8');
  // blob 갱신
  const pathname = `${PREFIX}/${filename}.json`;
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const existing = blobs.find((b) => b.pathname === pathname);
    if (existing) await del(existing.url);
  } catch {}
  const res = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`  → wrote ${filename}.json (${body.length} bytes) ${res.url}`);
}

function readDb(filename) {
  return JSON.parse(fs.readFileSync(path.join(DB_DIR, `${filename}.json`), 'utf-8'));
}

// ─────── 1. 로고 업로드 ───────
async function uploadLogo() {
  console.log('\n[1] 로고 업로드');
  const svgPath = path.join(ROOT, 'scripts', 'drive-cache', 'zoel-logo.svg');
  if (!fs.existsSync(svgPath)) throw new Error(`로고 파일 없음: ${svgPath}`);
  const buf = fs.readFileSync(svgPath);
  const pathname = `uploads/settings/zoel-logo-${Date.now()}.svg`;
  const res = await put(pathname, buf, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/svg+xml',
  });
  console.log(`  → 업로드: ${res.url}`);
  return res.url;
}

// ─────── 2. media.json 에서 v5 제거 ───────
async function removeEmptyVideo() {
  console.log('\n[2] 빈 영상(v5 냐짱·칸호아성) 제거');
  const media = readDb('media');
  const before = media.length;
  const filtered = media.filter((m) => m.id !== 'v5');
  if (filtered.length === before) {
    console.log('  이미 없음 — 스킵');
    return;
  }
  console.log(`  ${before} → ${filtered.length}`);
  await writeDb('media', filtered);
}

// ─────── 3. 로고 + 후기 ───────
async function setLogo(logoUrl) {
  console.log('\n[3] company.json 에 companyLogo 설정');
  const company = readDb('company');
  company.companyLogo = logoUrl;
  company.updatedAt = new Date().toISOString();
  await writeDb('company', company);
}

async function addTestimonials() {
  console.log('\n[4] 네이버 블로그 후기 추가');
  const NAVER_POSTS = [
    {
      name: 'foxtory',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 진품 침향 캡슐, 베트남 식약처 인증.',
      product: '대라천 침향 캡슐',
      link: 'https://blog.naver.com/foxtory/223557653133',
    },
    {
      name: 'ejin414',
      role: '네이버 블로그',
      rating: 5,
      body: '베트남 침향수, 침향환, 대라천 침향 — 효능 개인적인 후기.',
      product: '대라천 침향수 · 침향환',
      link: 'https://blog.naver.com/ejin414/223491952476',
    },
    {
      name: 'sunnny82',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 침향캡슐, 진품 침향.',
      product: '대라천 침향 캡슐',
      link: 'https://blog.naver.com/sunnny82/223556415229',
    },
    {
      name: 'vn-hanoi',
      role: '티스토리',
      rating: 5,
      body: '베트남 침향이 비싼 이유.',
      link: 'https://vn-hanoi.tistory.com/9',
    },
    {
      name: 'rhudwlssla70',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 진품 침향 캡슐.',
      product: '대라천 침향 캡슐',
      link: 'https://blog.naver.com/rhudwlssla70/223558682727',
    },
    {
      name: 'roorim',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 침향캡슐 21일차 — 진품 침향 학명 인증 제품.',
      product: '대라천 침향 캡슐',
      link: 'https://blog.naver.com/roorim/223557707822',
    },
    {
      name: 'gowldud2',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 진품 침향 캡슐 — 베트남 유일한 침향 학명 인증.',
      product: '대라천 침향 캡슐',
      link: 'https://blog.naver.com/gowldud2/223547606692',
    },
    {
      name: 'npihpmwckd',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 침향.',
      link: 'https://blog.naver.com/npihpmwckd/223845969069',
    },
    {
      name: 'picolee2',
      role: '네이버 블로그',
      rating: 5,
      body: '대라천 침향, 피로한 몸 관리해요~',
      link: 'https://blog.naver.com/picolee2/223548920577',
    },
  ];

  const pages = readDb('pages');
  pages.aboutAgarwood = pages.aboutAgarwood ?? {};
  pages.aboutAgarwood.testimonialsTab = pages.aboutAgarwood.testimonialsTab ?? {
    tag: 'Testimonials · 후기',
    title: '고객이 남긴 침향',
    subtitle: '대라천 침향을 경험한 고객들의 진솔한 이야기.',
    items: [],
  };
  const existing = pages.aboutAgarwood.testimonialsTab.items ?? [];
  // 기존 link 가 동일한 항목은 스킵해서 중복 방지
  const existingLinks = new Set(existing.filter((x) => x.link).map((x) => x.link));
  const toAdd = NAVER_POSTS.filter((p) => !existingLinks.has(p.link));
  console.log(`  기존 ${existing.length}건, 추가 후보 ${toAdd.length}건`);
  pages.aboutAgarwood.testimonialsTab.items = [...existing, ...toAdd];
  await writeDb('pages', pages);
}

async function main() {
  const logoUrl = await uploadLogo();
  await removeEmptyVideo();
  await setLogo(logoUrl);
  await addTestimonials();
  console.log('\n완료');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
