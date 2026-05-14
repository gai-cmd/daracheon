'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { JSONContent } from '@tiptap/react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import type { BlogCategory, BlogPost } from '@/types/blog';

// TipTap pulls ProseMirror — keep it out of the SSR bundle.
const TipTapEditor = dynamic(() => import('@/components/admin/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] rounded border border-warm-300 bg-white p-4 text-sm text-warm-600">
      에디터 로딩 중…
    </div>
  ),
});

type Tab = 'content' | 'meta' | 'seo';

interface BlogPostFormProps {
  initial?: BlogPost;
  categories: BlogCategory[];
  mode: 'create' | 'edit';
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentJson?: JSONContent;
  coverImage: string;
  categoryId: string;
  tags: string;          // comma-separated in the form, normalized on submit
  author: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
}

function buildInitialState(initial: BlogPost | undefined, fallbackCategory: string): FormState {
  return {
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    contentJson: (initial?.contentJson as JSONContent | undefined) ?? undefined,
    coverImage: initial?.coverImage ?? '',
    categoryId: initial?.categoryId ?? fallbackCategory,
    tags: (initial?.tags ?? []).join(', '),
    author: initial?.author ?? '대라천',
    status: initial?.status ?? 'draft',
    seoTitle: initial?.seoTitle ?? '',
    seoDescription: initial?.seoDescription ?? '',
    seoKeywords: (initial?.seoKeywords ?? []).join(', '),
    ogImage: initial?.ogImage ?? '',
  };
}

const AUTOSAVE_KEY_PREFIX = 'blog:draft:';

export default function BlogPostForm({ initial, categories, mode }: BlogPostFormProps) {
  const router = useRouter();
  const fallbackCategory = categories[0]?.id ?? 'uncategorized';
  const [state, setState] = useState<FormState>(() => buildInitialState(initial, fallbackCategory));
  const [tab, setTab] = useState<Tab>('content');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [restored, setRestored] = useState(false);
  const autosaveKey = useMemo(() => AUTOSAVE_KEY_PREFIX + (initial?.id ?? 'new'), [initial?.id]);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore localStorage draft if newer than initial.updatedAt (or always for new posts)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(autosaveKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as { state: FormState; savedAt: string };
      const baseline = initial?.updatedAt ?? '';
      if (!baseline || draft.savedAt > baseline) {
        setState(draft.state);
        setRestored(true);
      }
    } catch {
      /* ignore corrupt draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave every 5s when state changes
  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedRef.current) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          autosaveKey,
          JSON.stringify({ state, savedAt: new Date().toISOString() })
        );
        lastSavedRef.current = serialized;
      } catch {
        /* localStorage full / disabled */
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [state, autosaveKey]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function clearAutosave() {
    try {
      window.localStorage.removeItem(autosaveKey);
    } catch {
      /* ignore */
    }
  }

  async function submit(publishOverride?: 'published' | 'draft') {
    if (!state.title.trim()) {
      setToast({ msg: '제목을 입력하세요.', ok: false });
      setTab('content');
      return;
    }
    setSaving(true);
    const payload = {
      title: state.title.trim(),
      slug: state.slug.trim() || undefined,
      excerpt: state.excerpt.trim() || undefined,
      content: state.content,
      contentJson: state.contentJson,
      coverImage: state.coverImage || undefined,
      categoryId: state.categoryId,
      tags: state.tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: state.author.trim() || undefined,
      status: publishOverride ?? state.status,
      seoTitle: state.seoTitle.trim() || undefined,
      seoDescription: state.seoDescription.trim() || undefined,
      seoKeywords: state.seoKeywords.split(',').map((t) => t.trim()).filter(Boolean),
      ogImage: state.ogImage || undefined,
    };

    try {
      const url = mode === 'create' ? '/api/admin/blog-posts' : `/api/admin/blog-posts/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { success?: boolean; post?: BlogPost; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || '저장에 실패했습니다.');
      }
      clearAutosave();
      setToast({ msg: '저장되었습니다.', ok: true });
      if (mode === 'create' && data.post) {
        router.push(`/admin/blog/${data.post.id}`);
      } else {
        // Sync state from server response (slug may have been normalized)
        if (data.post) {
          setState((s) => ({
            ...s,
            slug: data.post!.slug,
            status: data.post!.status,
          }));
        }
        router.refresh();
      }
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.',
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {restored && (
        <div className="flex items-start justify-between gap-3 rounded border border-gold-300 bg-gold-50 px-3 py-2 text-sm text-gold-800">
          <span>임시저장된 초안을 불러왔습니다. 원본으로 되돌리려면 새로고침하세요.</span>
          <button
            type="button"
            onClick={() => {
              clearAutosave();
              setRestored(false);
              setState(buildInitialState(initial, fallbackCategory));
            }}
            className="shrink-0 rounded border border-gold-400 px-2 py-0.5 text-xs hover:bg-gold-100"
          >
            원본으로
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-warm-900">
          {mode === 'create' ? '블로그 글 작성' : '블로그 글 수정'}
        </h1>
        <div className="flex items-center gap-2">
          {initial?.slug && state.status === 'published' && (
            <a
              href={`/blog/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-warm-300 px-3 py-1.5 text-sm text-warm-700 hover:bg-warm-100"
            >
              공개 페이지 보기
            </a>
          )}
          <button
            type="button"
            onClick={() => submit('draft')}
            disabled={saving}
            className="rounded border border-warm-300 px-3 py-1.5 text-sm text-warm-800 hover:bg-warm-100 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '초안 저장'}
          </button>
          <button
            type="button"
            onClick={() => submit('published')}
            disabled={saving}
            className="rounded bg-warm-900 px-3 py-1.5 text-sm font-semibold text-warm-50 hover:bg-warm-800 disabled:opacity-50"
          >
            {saving ? '저장 중…' : state.status === 'published' ? '발행 업데이트' : '발행'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-200">
        {(['content', 'meta', 'seo'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t
                ? 'border-warm-900 text-warm-900'
                : 'border-transparent text-warm-600 hover:text-warm-800',
            ].join(' ')}
          >
            {t === 'content' && '본문'}
            {t === 'meta' && '메타 / 분류'}
            {t === 'seo' && 'SEO'}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">제목</label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="글 제목"
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>
          <TipTapEditor
            value={state.content}
            jsonValue={state.contentJson}
            onChange={({ html, json }) => {
              setState((s) => ({ ...s, content: html, contentJson: json }));
            }}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">
              요약 <span className="text-xs text-warm-600">(비워두면 본문 첫 240자에서 자동 생성)</span>
            </label>
            <textarea
              value={state.excerpt}
              onChange={(e) => update('excerpt', e.target.value.slice(0, 240))}
              rows={3}
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
            <p className="mt-1 text-right text-xs text-warm-600">{state.excerpt.length}/240</p>
          </div>
        </div>
      )}

      {tab === 'meta' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">슬러그</label>
            <input
              type="text"
              value={state.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder="비워두면 제목에서 자동 생성"
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm font-mono focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
            <p className="mt-1 text-xs text-warm-600">URL: /blog/{state.slug || '(자동)'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">카테고리</label>
            <select
              value={state.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            >
              {categories.length === 0 && <option value="uncategorized">미분류</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">작성자</label>
            <input
              type="text"
              value={state.author}
              onChange={(e) => update('author', e.target.value)}
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">태그 (쉼표 구분)</label>
            <input
              type="text"
              value={state.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="침향, 농장, 베트남"
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>
          <div className="md:col-span-2">
            <ImageUploadField
              label="커버 이미지"
              value={state.coverImage}
              onChange={(url) => update('coverImage', url)}
              subdir="blog"
            />
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">
              SEO 제목 <span className="text-xs text-warm-600">(비워두면 본문 제목 사용)</span>
            </label>
            <input
              type="text"
              value={state.seoTitle}
              onChange={(e) => update('seoTitle', e.target.value)}
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">
              SEO 설명 <span className="text-xs text-warm-600">(권장 120~160자)</span>
            </label>
            <textarea
              value={state.seoDescription}
              onChange={(e) => update('seoDescription', e.target.value.slice(0, 320))}
              rows={3}
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
            <p className="mt-1 text-right text-xs text-warm-600">{state.seoDescription.length}/320</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-800">SEO 키워드 (쉼표 구분)</label>
            <input
              type="text"
              value={state.seoKeywords}
              onChange={(e) => update('seoKeywords', e.target.value)}
              placeholder="침향, 침향 효능, 베트남 침향"
              className="w-full rounded border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>
          <ImageUploadField
            label="OG 이미지 (소셜 미리보기)"
            value={state.ogImage}
            onChange={(url) => update('ogImage', url)}
            subdir="blog"
          />
        </div>
      )}

      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-sm shadow-lg',
            toast.ok ? 'bg-sage-600 text-white' : 'bg-terracotta-solid text-white',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
