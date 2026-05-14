/**
 * Blog domain types.
 *
 * Storage: Vercel Blob (`blogPosts.json`, `blogCategories.json`) with
 * `data/db/*.json` mirrors. Read via readDataSafe / readSingleUncached
 * depending on call site (admin write vs. public RSC).
 *
 * Content format: `content` is sanitized HTML produced by the TipTap
 * editor. `contentJson` is the editor's JSON document for lossless
 * re-opening. Public render uses `content` via sanitize → dangerouslySetInnerHTML.
 */

export interface BlogCategory {
  id: string;          // URL slug (e.g. "agarwood-knowledge")
  name: string;        // Display label (KR)
  description?: string;
  order: number;       // Ascending for ordered display
  thumbnail?: string;  // Vercel Blob URL — optional cover
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;                  // nanoid — stable across slug renames
  slug: string;                // Unique within published posts
  title: string;
  excerpt: string;             // ≤ 240 chars; auto-derived from body when empty
  content: string;             // Sanitized HTML (TipTap getHTML)
  contentJson?: unknown;       // TipTap getJSON — for re-edit fidelity
  coverImage?: string;         // Vercel Blob URL
  categoryId: string;          // FK -> BlogCategory.id
  tags: string[];
  author: string;              // Display name
  status: BlogPostStatus;
  publishedAt?: string;        // ISO 8601, set when status becomes 'published'
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  readingTime?: number;        // Minutes — derived from character count
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  // Stats
  viewCount?: number;
}

export const BLOG_POSTS_FILE = 'blogPosts' as const;
export const BLOG_CATEGORIES_FILE = 'blogCategories' as const;

export const BLOG_UNCATEGORIZED_ID = 'uncategorized';
