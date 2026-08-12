import postgres from 'postgres';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import { readDataUncached, readDataForWrite, readDataSafe, writeDataMerged } from '@/lib/db';

/**
 * Blog storage layer — Neon Postgres primary, Vercel Blob fallback.
 *
 * 2026-08-10 결정: 블로그는 "계속 쌓이는" 유일한 컬렉션이라 Neon((Gai) org,
 * zoellife 프로젝트, 싱가포르)으로 이전한다. 나머지 컬렉션은 Blob 유지.
 *
 * 계약:
 *  - DATABASE_URL 이 설정되면 Neon 이 단일 진실 원천.
 *  - 미설정이면 기존 Blob JSON(blogPosts/blogCategories)으로 폴백 — 배포 순서가
 *    꼬여도 사이트가 죽지 않는다. 폴백 상태는 /admin/diagnosis 의 DATABASE_URL
 *    항목으로 관측 가능.
 *  - 함수 시그니처는 기존 배열 기반 라우트 로직에 맞춘다. 쓰기는 upsertIds /
 *    removedIds 힌트를 받아 바뀐 행만 만진다(전량 재작성 금지 — 이전의 이유).
 *
 * ⚠️ 비밀값 하드코딩 금지: 연결 문자열은 process.env.DATABASE_URL 로만 주입.
 *    폴백 리터럴을 절대 넣지 말 것 (2026-07-10 prefix 노출 사고 교훈).
 */

declare global {
  // eslint-disable-next-line no-var
  var __blog_sql: ReturnType<typeof postgres> | undefined;
}

export function isNeonEnabled(): boolean {
  return !!process.env.DATABASE_URL;
}

function sql() {
  if (!globalThis.__blog_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    globalThis.__blog_sql = postgres(url, {
      ssl: local ? false : 'require',
      prepare: false,
      max: 3,
      // Neon scale-to-zero 는 커넥션이 아니라 쿼리 활동으로 판단하므로
      // idle_timeout 은 비용에 영향 없음 — 서버리스 커넥션 회수용으로만 짧게.
      idle_timeout: 20,
    });
  }
  return globalThis.__blog_sql;
}

/* ──────────────────────────── row mapping ──────────────────────────── */

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  content_json: unknown;
  cover_image: string | null;
  category_id: string;
  tags: string[];
  author: string;
  status: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  reading_time: number | null;
  seo: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    ogImage?: string;
    /** 바이라인 이메일 — 별도 컬럼 대신 seo jsonb 에 동승 (ALTER 마이그레이션 회피). */
    authorEmail?: string;
  } | null;
  reviewed: boolean;
  view_count: number;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  order: number;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);

function rowToPost(r: PostRow): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    contentJson: r.content_json ?? undefined,
    coverImage: r.cover_image ?? undefined,
    categoryId: r.category_id,
    tags: r.tags ?? [],
    author: r.author,
    authorEmail: r.seo?.authorEmail,
    status: r.status === 'published' ? 'published' : 'draft',
    publishedAt: iso(r.published_at),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    readingTime: r.reading_time ?? undefined,
    seoTitle: r.seo?.seoTitle,
    seoDescription: r.seo?.seoDescription,
    seoKeywords: r.seo?.seoKeywords,
    ogImage: r.seo?.ogImage,
    reviewed: r.reviewed,
    viewCount: r.view_count,
  };
}

function rowToCategory(r: CategoryRow): BlogCategory {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    order: r.order,
    thumbnail: r.thumbnail ?? undefined,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

function postSeo(p: BlogPost) {
  const seo: Record<string, unknown> = {};
  if (p.seoTitle) seo.seoTitle = p.seoTitle;
  if (p.seoDescription) seo.seoDescription = p.seoDescription;
  if (p.seoKeywords?.length) seo.seoKeywords = p.seoKeywords;
  if (p.ogImage) seo.ogImage = p.ogImage;
  // authorEmail 은 프로덕션 Neon 테이블에 ALTER 실행 창구가 없어 컬럼 대신 jsonb 동승.
  if (p.authorEmail) seo.authorEmail = p.authorEmail;
  return Object.keys(seo).length ? seo : null;
}

async function upsertPostRows(posts: BlogPost[]) {
  const s = sql();
  for (const p of posts) {
    await s`
      INSERT INTO blog_posts (
        id, slug, title, excerpt, content, content_json, cover_image, category_id,
        tags, author, status, published_at, created_at, updated_at, reading_time,
        seo, reviewed, view_count
      ) VALUES (
        ${p.id}, ${p.slug}, ${p.title}, ${p.excerpt}, ${p.content},
        ${p.contentJson === undefined ? null : s.json(p.contentJson as never)},
        ${p.coverImage ?? null}, ${p.categoryId}, ${p.tags}, ${p.author}, ${p.status},
        ${p.publishedAt ?? null}, ${p.createdAt}, ${p.updatedAt}, ${p.readingTime ?? null},
        ${s.json(postSeo(p) as never)}, ${p.reviewed ?? false}, ${p.viewCount ?? 0}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, title = EXCLUDED.title, excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content, content_json = EXCLUDED.content_json,
        cover_image = EXCLUDED.cover_image, category_id = EXCLUDED.category_id,
        tags = EXCLUDED.tags, author = EXCLUDED.author, status = EXCLUDED.status,
        published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at,
        reading_time = EXCLUDED.reading_time, seo = EXCLUDED.seo,
        reviewed = EXCLUDED.reviewed, view_count = EXCLUDED.view_count
    `;
  }
}

async function upsertCategoryRows(cats: BlogCategory[]) {
  const s = sql();
  for (const c of cats) {
    await s`
      INSERT INTO blog_categories (id, name, description, "order", thumbnail, created_at, updated_at)
      VALUES (${c.id}, ${c.name}, ${c.description ?? null}, ${c.order}, ${c.thumbnail ?? null},
              ${c.createdAt}, ${c.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, "order" = EXCLUDED."order",
        thumbnail = EXCLUDED.thumbnail, updated_at = EXCLUDED.updated_at
    `;
  }
}

/* ──────────────────────────── public API ──────────────────────────── */

export interface BlogWriteHints {
  /** 새로 추가되거나 내용이 바뀐 항목의 id — Neon 은 이 행들만 upsert 한다. */
  upsertIds?: string[];
  /** 삭제된 항목의 id — Neon 은 DELETE, Blob 은 removedIds 로 전달. */
  removedIds?: string[];
}

/** 어드민용 전체 목록 (draft 포함, 캐시 없음). */
export async function readPosts(): Promise<BlogPost[]> {
  if (!isNeonEnabled()) return readDataUncached<BlogPost>(BLOG_POSTS_FILE);
  const rows = await sql()<PostRow[]>`SELECT * FROM blog_posts ORDER BY updated_at DESC`;
  return rows.map(rowToPost);
}

/** 어드민 쓰기 직전 읽기 — Blob 폴백에선 시드 오염 방지용 ForWrite 경로. */
export async function readPostsForWrite(): Promise<BlogPost[]> {
  if (!isNeonEnabled()) return readDataForWrite<BlogPost>(BLOG_POSTS_FILE);
  return readPosts();
}

/** 공개 페이지용 — Blob 폴백에선 3단계 안전망(readDataSafe)을 태운다. */
export async function readPostsSafe(): Promise<BlogPost[]> {
  if (!isNeonEnabled()) return readDataSafe<BlogPost>(BLOG_POSTS_FILE);
  try {
    return await readPosts();
  } catch (err) {
    console.error('[blog:store] Neon read failed on public path', err);
    return [];
  }
}

export async function writePosts(posts: BlogPost[], hints: BlogWriteHints = {}): Promise<void> {
  if (!isNeonEnabled()) {
    await writeDataMerged(BLOG_POSTS_FILE, posts, { removedIds: hints.removedIds });
    return;
  }
  const s = sql();
  if (hints.removedIds?.length) {
    await s`DELETE FROM blog_posts WHERE id IN ${s(hints.removedIds)}`;
  }
  const targets = hints.upsertIds
    ? posts.filter((p) => hints.upsertIds!.includes(p.id))
    : posts; // 힌트 없으면 전량 upsert (마이그레이션·복원 경로)
  await upsertPostRows(targets);
}

export async function readCategories(): Promise<BlogCategory[]> {
  if (!isNeonEnabled()) return readDataUncached<BlogCategory>(BLOG_CATEGORIES_FILE);
  const rows = await sql()<CategoryRow[]>`SELECT * FROM blog_categories ORDER BY "order" ASC`;
  return rows.map(rowToCategory);
}

export async function readCategoriesForWrite(): Promise<BlogCategory[]> {
  if (!isNeonEnabled()) return readDataForWrite<BlogCategory>(BLOG_CATEGORIES_FILE);
  return readCategories();
}

export async function readCategoriesSafe(): Promise<BlogCategory[]> {
  if (!isNeonEnabled()) return readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE);
  try {
    return await readCategories();
  } catch (err) {
    console.error('[blog:store] Neon read failed on public path', err);
    return [];
  }
}

export async function writeCategories(
  cats: BlogCategory[],
  hints: BlogWriteHints = {}
): Promise<void> {
  if (!isNeonEnabled()) {
    await writeDataMerged(BLOG_CATEGORIES_FILE, cats, { removedIds: hints.removedIds });
    return;
  }
  const s = sql();
  if (hints.removedIds?.length) {
    await s`DELETE FROM blog_categories WHERE id IN ${s(hints.removedIds)}`;
  }
  const targets = hints.upsertIds
    ? cats.filter((c) => hints.upsertIds!.includes(c.id))
    : cats;
  await upsertCategoryRows(targets);
}

/** 백업 스냅샷용 덤프 — daily-backup 이 Neon 데이터도 Tier1~3 에 싣기 위해 사용. */
export async function dumpBlogForBackup(): Promise<{
  blogPosts: BlogPost[];
  blogCategories: BlogCategory[];
} | null> {
  if (!isNeonEnabled()) return null; // Blob 폴백 시엔 기존 스냅샷 경로가 이미 커버
  const [blogPosts, blogCategories] = await Promise.all([readPosts(), readCategories()]);
  return { blogPosts, blogCategories };
}

/** 스키마 보장 — 마이그레이션 스크립트와 어드민 프로브가 호출. 멱등. */
export async function ensureBlogSchema(): Promise<void> {
  const s = sql();
  await s`
    CREATE TABLE IF NOT EXISTS blog_categories (
      id          text PRIMARY KEY,
      name        text NOT NULL,
      description text,
      "order"     int  NOT NULL DEFAULT 0,
      thumbnail   text,
      created_at  timestamptz NOT NULL,
      updated_at  timestamptz NOT NULL
    )
  `;
  await s`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id           text PRIMARY KEY,
      slug         text NOT NULL UNIQUE,
      title        text NOT NULL,
      excerpt      text NOT NULL DEFAULT '',
      content      text NOT NULL,
      content_json jsonb,
      cover_image  text,
      category_id  text NOT NULL REFERENCES blog_categories(id),
      tags         text[] NOT NULL DEFAULT '{}',
      author       text NOT NULL DEFAULT '',
      status       text NOT NULL CHECK (status IN ('draft','published')),
      published_at timestamptz,
      created_at   timestamptz NOT NULL,
      updated_at   timestamptz NOT NULL,
      reading_time int,
      seo          jsonb,
      reviewed     boolean NOT NULL DEFAULT false,
      view_count   int NOT NULL DEFAULT 0
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS blog_posts_pub_idx ON blog_posts (status, published_at DESC)`;
  await s`CREATE INDEX IF NOT EXISTS blog_posts_cat_idx ON blog_posts (category_id)`;
}
