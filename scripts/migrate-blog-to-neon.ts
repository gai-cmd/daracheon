/**
 * Blob(blogPosts/blogCategories JSON) → Neon Postgres 일회성 마이그레이션.
 *
 * 실행 (로컬, .env.local 에 BLOB_READ_WRITE_TOKEN·BLOB_DATA_PREFIX·DATABASE_URL 필요):
 *   npx tsx --env-file=.env.local scripts/migrate-blog-to-neon.ts          # dry-run
 *   npx tsx --env-file=.env.local scripts/migrate-blog-to-neon.ts --apply  # 실제 적용
 *
 * 안전장치:
 *   - 기본은 dry-run — 읽기만 하고 건수·표본을 출력.
 *   - --apply 시 먼저 pre-migration Blob 스냅샷 생성(기존 백업 유틸 재사용).
 *   - INSERT 는 ON CONFLICT DO UPDATE 라 재실행해도 안전(멱등).
 *   - 비밀값은 env 로만 주입 — 리터럴 폴백 금지 (2026-07-10 사고 교훈).
 */
import { readDataForWrite } from '../src/lib/db';
import { ensureBlogSchema, writePosts, writeCategories, isNeonEnabled } from '../src/lib/blog/store';
import { createSnapshot } from '../src/lib/backup';
import {
  BLOG_POSTS_FILE,
  BLOG_CATEGORIES_FILE,
  BLOG_UNCATEGORIZED_ID,
  type BlogPost,
  type BlogCategory,
} from '../src/types/blog';

async function main() {
  const apply = process.argv.includes('--apply');

  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN not set — Blob 원본을 읽을 수 없습니다.');
  if (!isNeonEnabled()) throw new Error('DATABASE_URL not set — Neon 대상이 없습니다.');

  // 1. Blob 에서 원본 읽기 (ForWrite 경로 — 시드/LKG 폴백 없이 실패는 실패로)
  const [posts, categories] = await Promise.all([
    readDataForWrite<BlogPost>(BLOG_POSTS_FILE),
    readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);
  console.log(`[migrate] Blob 원본: posts=${posts.length}, categories=${categories.length}`);
  for (const p of posts.slice(0, 3)) console.log(`  · ${p.id} ${p.status} ${p.title}`);

  // FK 보전: 글이 참조하는 categoryId 가 카테고리 목록에 없으면 uncategorized 로 흡수
  const catIds = new Set(categories.map((c) => c.id));
  const orphans = posts.filter((p) => !catIds.has(p.categoryId));
  if (orphans.length > 0 && !catIds.has(BLOG_UNCATEGORIZED_ID)) {
    const now = new Date().toISOString();
    categories.push({ id: BLOG_UNCATEGORIZED_ID, name: '미분류', order: categories.length, createdAt: now, updatedAt: now });
  }
  for (const p of orphans) p.categoryId = BLOG_UNCATEGORIZED_ID;
  if (orphans.length) console.log(`[migrate] 고아 categoryId ${orphans.length}건 → ${BLOG_UNCATEGORIZED_ID}`);

  if (!apply) {
    console.log('[migrate] dry-run 완료. 적용하려면 --apply 를 붙이세요.');
    return;
  }

  // 2. 사전 스냅샷 (Blob 원본 보전)
  const snap = await createSnapshot('manual', { trigger: 'migrate-blog-to-neon', purpose: 'pre-migration' });
  console.log(`[migrate] pre-migration snapshot: ${snap?.id ?? 'skip(blob disabled?)'}`);

  // 3. 스키마 보장 후 categories → posts 순서로 적재 (FK)
  await ensureBlogSchema();
  await writeCategories(categories); // 힌트 없음 = 전량 upsert
  await writePosts(posts);
  console.log(`[migrate] 완료: categories=${categories.length}, posts=${posts.length} → Neon`);
  console.log('[migrate] 검증: /admin/blog 목록·공개 /blog 페이지 확인 후, Vercel env 에 DATABASE_URL 이 켜져 있는지 확인하세요.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[migrate] 실패:', err);
  process.exit(1);
});
