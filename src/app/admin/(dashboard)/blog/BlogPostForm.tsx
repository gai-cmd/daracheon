'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { BlogCategory, BlogPost } from '@/types/blog';
import styles from './BlogPostForm.module.css';

// TinyMCE 는 client-only — SSR 비활성.
const TinyMCEEditor = dynamic(() => import('@/components/admin/editor/TinyMCEEditor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: 1000,
        background: '#fafaf7',
        border: '1px solid #e8e3d8',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#7a7368',
        fontSize: '0.9rem',
      }}
    >
      에디터 로딩 중…
    </div>
  ),
});

type Lang = 'ko' | 'ja' | 'en';
type ThumbTab = 'upload' | 'unsplash' | 'ai' | 'url';
type PreviewView = 'desktop' | 'mobile';
type UnsplashOrientation = 'any' | 'landscape' | 'portrait' | 'squarish';

interface UnsplashHit {
  id: string;
  title: string;
  url: string;
  thumb: string;
  w: number;
  h: number;
  color: string;
  creator: string;
  creator_username: string;
  creator_url: string;
  photo_url: string;
  download_location: string;
}

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
  coverImage: string;
  categoryId: string;
  tags: string;
  author: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  /** 어드민 검수 완료 여부. BlogPost.reviewed 로 영속화. */
  reviewed: boolean;
}

function buildInitialState(initial: BlogPost | undefined, fallbackCategory: string): FormState {
  return {
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    coverImage: initial?.coverImage ?? '',
    categoryId: initial?.categoryId ?? fallbackCategory,
    tags: (initial?.tags ?? []).join(', '),
    author: initial?.author ?? '대라천',
    status: initial?.status ?? 'draft',
    seoTitle: initial?.seoTitle ?? '',
    seoDescription: initial?.seoDescription ?? '',
    seoKeywords: (initial?.seoKeywords ?? []).join(', '),
    ogImage: initial?.ogImage ?? '',
    reviewed: initial?.reviewed ?? false,
  };
}

const AUTOSAVE_KEY_PREFIX = 'blog:draft:';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SITE_NAME = 'Daerachoen';

async function uploadFile(file: File, subdir = 'blog'): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  form.append('subdir', subdir);
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !data.success || !data.url) {
      console.error('[BlogPostForm] upload failed:', data?.message);
      return null;
    }
    return data.url;
  } catch (err) {
    console.error('[BlogPostForm] upload threw:', err);
    return null;
  }
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

export default function BlogPostForm({ initial, categories, mode }: BlogPostFormProps) {
  const router = useRouter();
  const fallbackCategory = categories[0]?.id ?? 'uncategorized';
  const [state, setState] = useState<FormState>(() => buildInitialState(initial, fallbackCategory));
  const [lang, setLang] = useState<Lang>('ko');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [restored, setRestored] = useState(false);
  const [thumbTab, setThumbTab] = useState<ThumbTab>('upload');
  const [previewView, setPreviewView] = useState<PreviewView>('desktop');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiSummaryBusy, setAiSummaryBusy] = useState(false);
  const [aiKeywordsBusy, setAiKeywordsBusy] = useState(false);

  // Unsplash 검색
  const [usQuery, setUsQuery] = useState('');
  const [usOrientation, setUsOrientation] = useState<UnsplashOrientation>('landscape');
  const [usBusy, setUsBusy] = useState(false);
  const [usResults, setUsResults] = useState<UnsplashHit[]>([]);
  const [usError, setUsError] = useState<string | null>(null);
  const [usApplyingId, setUsApplyingId] = useState<string | null>(null);
  const [usAttribution, setUsAttribution] = useState<UnsplashHit | null>(null);
  const autosaveKey = useMemo(() => AUTOSAVE_KEY_PREFIX + (initial?.id ?? 'new'), [initial?.id]);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore localStorage draft if newer than initial.updatedAt
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

  // Autosave every 5s on change
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
      } catch { /* localStorage full / disabled */ }
    }, 5000);
    return () => clearTimeout(t);
  }, [state, autosaveKey]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function clearAutosave() {
    try {
      window.localStorage.removeItem(autosaveKey);
    } catch { /* ignore */ }
  }

  async function handleThumbFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setToast({ msg: `파일은 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.`, ok: false });
      return;
    }
    const url = await uploadFile(file);
    if (!url) {
      setToast({ msg: '썸네일 업로드 실패', ok: false });
      return;
    }
    update('coverImage', url);
    setToast({ msg: '썸네일이 업로드되었습니다.', ok: true });
  }

  async function generateAiThumbnail() {
    if (!aiPrompt.trim()) {
      setToast({ msg: 'AI 프롬프트를 입력하세요.', ok: false });
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), aspectRatio: '16:9', subdir: 'blog' }),
      });
      const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message || 'AI 이미지 생성 실패');
      }
      update('coverImage', data.url);
      setToast({ msg: 'AI 이미지가 생성되었습니다.', ok: true });
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : 'AI 이미지 생성 중 오류',
        ok: false,
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function autoGenerateSummary() {
    if (!state.content.trim() && !state.title.trim()) {
      setToast({ msg: '본문 또는 제목을 먼저 입력하세요.', ok: false });
      return;
    }
    setAiSummaryBusy(true);
    try {
      const res = await fetch('/api/admin/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summarize',
          title: state.title,
          content: state.content,
        }),
      });
      const data = (await res.json()) as { success?: boolean; summary?: string; message?: string };
      if (!res.ok || !data.success || !data.summary) {
        throw new Error(data.message ?? '요약 생성 실패');
      }
      update('excerpt', data.summary.slice(0, 100));
      setToast({ msg: '요약이 생성되었습니다.', ok: true });
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : '요약 생성 중 오류',
        ok: false,
      });
    } finally {
      setAiSummaryBusy(false);
    }
  }

  async function searchUnsplash() {
    const q = usQuery.trim();
    if (!q) {
      setUsError('검색어를 입력하세요.');
      return;
    }
    setUsBusy(true);
    setUsError(null);
    try {
      const params = new URLSearchParams({ q, size: '12' });
      if (usOrientation !== 'any') params.set('orientation', usOrientation);
      const res = await fetch(`/api/admin/unsplash-search?${params.toString()}`);
      const data = (await res.json()) as { success?: boolean; results?: UnsplashHit[]; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? '검색 실패');
      }
      setUsResults(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        setUsError('검색 결과가 없습니다. 다른 키워드를 시도해보세요 (영문이 결과가 많습니다).');
      }
    } catch (err) {
      setUsError(err instanceof Error ? err.message : '검색 중 오류');
      setUsResults([]);
    } finally {
      setUsBusy(false);
    }
  }

  async function applyUnsplashHit(hit: UnsplashHit) {
    setUsApplyingId(hit.id);
    setUsError(null);
    try {
      // 1) Unsplash API 가이드라인 — 다운로드/사용 시점에 통계 핑 (실패해도 진행)
      fetch('/api/admin/unsplash-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_location: hit.download_location }),
      }).catch(() => { /* 통계 핑 실패는 무시 */ });

      // 2) 이미지를 Vercel Blob 으로 미러링 — Unsplash 호스팅에 영구 의존하지 않도록
      const res = await fetch('/api/admin/mirror-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: hit.url, subdir: 'blog' }),
      });
      const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message ?? '이미지 미러링 실패');
      }
      update('coverImage', data.url);
      setUsAttribution(hit);
      setToast({ msg: '이미지를 가져왔습니다. 작가 크레딧을 본문 하단에 표기해주세요.', ok: true });
    } catch (err) {
      setUsError(err instanceof Error ? err.message : '이미지 미러링 실패');
    } finally {
      setUsApplyingId(null);
    }
  }

  async function autoExtractKeywords() {
    if (!state.content.trim() && !state.title.trim()) {
      setToast({ msg: '본문 또는 제목을 먼저 입력하세요.', ok: false });
      return;
    }
    setAiKeywordsBusy(true);
    try {
      const res = await fetch('/api/admin/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'keywords',
          title: state.title,
          content: state.content,
        }),
      });
      const data = (await res.json()) as { success?: boolean; keywords?: string[]; message?: string };
      if (!res.ok || !data.success || !data.keywords?.length) {
        throw new Error(data.message ?? '키워드 추출 실패');
      }
      update('seoKeywords', data.keywords.join(', '));
      setToast({ msg: `키워드 ${data.keywords.length}개를 추출했습니다.`, ok: true });
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : '키워드 추출 중 오류',
        ok: false,
      });
    } finally {
      setAiKeywordsBusy(false);
    }
  }

  async function submit(publishOverride?: 'published' | 'draft') {
    if (!state.title.trim()) {
      setToast({ msg: '제목을 입력하세요.', ok: false });
      return;
    }
    setSaving(true);
    const payload = {
      title: state.title.trim(),
      slug: state.slug.trim() || undefined,
      excerpt: state.excerpt.trim() || undefined,
      content: state.content,
      coverImage: state.coverImage || undefined,
      categoryId: state.categoryId,
      tags: state.tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: state.author.trim() || undefined,
      status: publishOverride ?? state.status,
      seoTitle: state.seoTitle.trim() || undefined,
      seoDescription: state.seoDescription.trim() || undefined,
      seoKeywords: state.seoKeywords.split(',').map((t) => t.trim()).filter(Boolean),
      ogImage: state.ogImage || undefined,
      reviewed: state.reviewed,
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
        if (data.post) {
          setState((s) => ({ ...s, slug: data.post!.slug, status: data.post!.status }));
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

  const previewDescription =
    state.seoDescription.trim() ||
    state.excerpt.trim() ||
    '본문 요약이 여기에 표시됩니다. 검색 결과 메타 디스크립션으로도 사용됩니다.';
  const previewTitle = state.title.trim() || '(제목을 입력하세요)';
  const previewUrl = `/blog/${state.slug || '(슬러그)'}`;
  const previewThumb = state.ogImage || state.coverImage;

  return (
    <div className={styles.form}>
      {/* Sticky header bar */}
      <div className={styles.headerBar}>
        <h1 className={styles.headerTitle}>
          {mode === 'create' ? '블로그 글 작성' : '블로그 글 수정'}
        </h1>
        <div className={styles.headerActions}>
          {initial?.slug && state.status === 'published' && (
            <a
              href={`/blog/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnGhost}
            >
              공개 페이지 보기
            </a>
          )}
          <button
            type="button"
            onClick={() => submit('draft')}
            disabled={saving}
            className={styles.btnGhost}
          >
            {saving ? '저장 중…' : '초안 저장'}
          </button>
          <button
            type="button"
            onClick={() => submit('published')}
            disabled={saving}
            className={styles.btnPrimary}
          >
            {saving ? '저장 중…' : state.status === 'published' ? '발행 업데이트' : '발행'}
          </button>
        </div>
      </div>

      {/* Restored autosave banner */}
      {restored && (
        <div className={styles.restored}>
          <span>임시저장된 초안을 불러왔습니다.</span>
          <button
            type="button"
            onClick={() => {
              clearAutosave();
              setRestored(false);
              setState(buildInitialState(initial, fallbackCategory));
            }}
            className={styles.restoredBtn}
          >
            원본으로
          </button>
        </div>
      )}

      {/* Language tabs (Phase 1: ko 활성, ja/en 은 추후 다국어 스키마 도입 시 활성화) */}
      <div className={styles.langTabs} role="tablist" aria-label="언어 선택">
        <button
          type="button"
          role="tab"
          aria-selected={lang === 'ko'}
          onClick={() => setLang('ko')}
          className={`${styles.langTab} ${lang === 'ko' ? styles.langTabActive : ''}`}
        >
          한국어
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          disabled
          title="다국어 스키마 도입 후 활성화 (Phase 3)"
          className={styles.langTab}
        >
          日本語<span className={styles.langTabBadge}>Phase 3</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          disabled
          title="다국어 스키마 도입 후 활성화 (Phase 3)"
          className={styles.langTab}
        >
          English<span className={styles.langTabBadge}>Phase 3</span>
        </button>
      </div>

      {/* 1. 기본 정보 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>기본 정보</h3>
        <div className={styles.basicInfoGrid}>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-slug">
              슬러그 (URL) <span className={styles.required}>*</span>
            </label>
            <input
              id="bf-slug"
              className={styles.input}
              type="text"
              value={state.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder="example-post-slug"
            />
            <p className={styles.help}>URL 에 사용될 고유 식별자입니다. 영문·숫자·하이픈만 사용.</p>
          </div>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-cat">
              카테고리 <span className={styles.required}>*</span>
            </label>
            <select
              id="bf-cat"
              className={styles.select}
              value={state.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
            >
              {categories.length === 0 && <option value="uncategorized">미분류</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formItem}>
            <label className={styles.label}>
              상태 <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={state.status === 'published'}
                  onChange={() => update('status', 'published')}
                />
                발행
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={state.status === 'draft'}
                  onChange={() => update('status', 'draft')}
                />
                보류
              </label>
            </div>
          </div>
          <div className={styles.formItem}>
            <label className={styles.label}>검수 상태</label>
            <label className={styles.reviewCheckbox}>
              <input
                type="checkbox"
                checked={state.reviewed}
                onChange={(e) => update('reviewed', e.target.checked)}
              />
              검수 완료
            </label>
          </div>
        </div>
      </section>

      {/* 2. 제목 · 요약 · 키워드 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>제목 · 요약 · 키워드 ({lang.toUpperCase()})</h3>

        <div className={styles.formItem} style={{ marginBottom: 18 }}>
          <label className={styles.label} htmlFor="bf-title">
            제목 ({lang === 'ko' ? '한국어' : lang === 'ja' ? '日本語' : 'English'}) <span className={styles.required}>*</span>
          </label>
          <input
            id="bf-title"
            className={styles.input}
            type="text"
            value={state.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="한국어 제목 입력"
          />
        </div>

        <div className={styles.formItem} style={{ marginBottom: 18 }}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="bf-excerpt">요약 (한국어)</label>
            <button
              type="button"
              className={styles.autoBtn}
              onClick={autoGenerateSummary}
              disabled={aiSummaryBusy}
              title="제목·본문에서 메타 디스크립션 자동 생성 (Gemini)"
            >
              <SparklesIcon />
              {aiSummaryBusy ? '생성 중…' : '자동 생성'}
            </button>
          </div>
          <textarea
            id="bf-excerpt"
            className={styles.textarea}
            value={state.excerpt}
            onChange={(e) => update('excerpt', e.target.value.slice(0, 100))}
            rows={3}
            placeholder="한국어 요약 (100자 이내)"
            maxLength={100}
          />
          <p className={styles.help}>
            {state.excerpt.length}/100. 이 요약은 검색엔진 최적화(SEO)를 위한 메타 디스크립션으로도 사용됩니다.
          </p>
        </div>

        <div className={styles.formItem}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="bf-keywords">메타 키워드 (한국어)</label>
            <button
              type="button"
              className={styles.autoBtn}
              onClick={autoExtractKeywords}
              disabled={aiKeywordsBusy}
              title="제목·본문에서 SEO 키워드 자동 추출 (Gemini)"
            >
              <SparklesIcon />
              {aiKeywordsBusy ? '추출 중…' : '자동 추출'}
            </button>
          </div>
          <input
            id="bf-keywords"
            className={styles.input}
            type="text"
            value={state.seoKeywords}
            onChange={(e) => update('seoKeywords', e.target.value)}
            placeholder="키워드1, 키워드2, 키워드3"
          />
          <p className={styles.help}>검색엔진 최적화(SEO)를 위한 키워드를 쉼표로 구분하여 입력하세요.</p>
        </div>
      </section>

      {/* 3. 본문 — TinyMCE */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>본문 (한국어)</h3>
        <TinyMCEEditor
          value={state.content}
          onChange={(html) => update('content', html)}
        />
      </section>

      {/* 4. SEO 미리보기 + 보조 메타 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>검색엔진 최적화 (SEO)</h3>

        <p className={styles.help} style={{ marginBottom: 16 }}>
          별도의 메타 디스크립션을 설정하지 않으면, 위에서 작성한 요약 내용이 검색 결과에 자동으로 사용됩니다.
        </p>

        <p className={styles.label} style={{ marginBottom: 8 }}>검색 결과 미리보기</p>
        <div className={styles.seoPreviewBox}>
          <div className={styles.seoPreviewHeader}>
            <span>🌐 Search Preview</span>
            <div className={styles.seoPreviewToggle}>
              <button
                type="button"
                onClick={() => setPreviewView('desktop')}
                className={`${styles.seoPreviewToggleBtn} ${previewView === 'desktop' ? styles.seoPreviewToggleActive : ''}`}
                aria-label="Desktop preview"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPreviewView('mobile')}
                className={`${styles.seoPreviewToggleBtn} ${previewView === 'mobile' ? styles.seoPreviewToggleActive : ''}`}
                aria-label="Mobile preview"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" />
                  <path d="M12 18h.01" />
                </svg>
              </button>
            </div>
          </div>
          <div
            className={`${styles.seoPreviewBody} ${previewView === 'mobile' ? styles.seoPreviewMobile : ''}`}
          >
            <div className={styles.seoPreviewMain}>
              <div className={styles.seoPreviewUrlRow}>
                <div className={styles.seoPreviewFavicon} />
                <div>
                  <div className={styles.seoPreviewSiteName}>{SITE_NAME}</div>
                  <div className={styles.seoPreviewUrl}>{previewUrl}</div>
                </div>
              </div>
              <h3 className={styles.seoPreviewTitle}>{previewTitle}</h3>
              <p className={styles.seoPreviewDesc}>{previewDescription}</p>
            </div>
            {previewThumb && (
              <div className={styles.seoPreviewThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewThumb}
                  alt="Preview"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 보조 SEO 메타 — 요약을 override 할 때만 사용 */}
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#7a7368', padding: '6px 0' }}>
            고급 SEO 옵션 (제목·메타 디스크립션 override)
          </summary>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className={styles.formItem}>
              <label className={styles.label} htmlFor="bf-seoTitle">SEO 제목 (override)</label>
              <input
                id="bf-seoTitle"
                className={styles.input}
                type="text"
                value={state.seoTitle}
                onChange={(e) => update('seoTitle', e.target.value)}
                placeholder="비워두면 본문 제목 사용"
              />
            </div>
            <div className={styles.formItem}>
              <label className={styles.label} htmlFor="bf-seoDesc">메타 디스크립션 (override)</label>
              <textarea
                id="bf-seoDesc"
                className={styles.textarea}
                value={state.seoDescription}
                onChange={(e) => update('seoDescription', e.target.value.slice(0, 320))}
                rows={2}
                placeholder="비워두면 위의 요약 사용 (권장 120~160자)"
              />
              <p className={styles.help}>{state.seoDescription.length}/320</p>
            </div>
          </div>
        </details>

        <div className={styles.basicInfoGrid} style={{ marginTop: 18 }}>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-author">작성자</label>
            <input
              id="bf-author"
              className={styles.input}
              type="text"
              value={state.author}
              onChange={(e) => update('author', e.target.value)}
            />
          </div>
          <div className={styles.formItem} style={{ gridColumn: 'span 2' }}>
            <label className={styles.label} htmlFor="bf-tags">태그 (쉼표 구분)</label>
            <input
              id="bf-tags"
              className={styles.input}
              type="text"
              value={state.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="침향, 농장, 베트남"
            />
          </div>
        </div>
      </section>

      {/* 5. 썸네일 (4탭) */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          썸네일 및 소셜 공유 이미지 <span className={styles.required}>*</span>
        </h3>
        <p className={styles.help} style={{ marginBottom: 12 }}>
          블로그 목록과 소셜 미디어 공유 시 표시되는 이미지입니다.
        </p>

        {/* 현재 썸네일 미리보기 + 제거 */}
        {state.coverImage && (
          <div className={styles.thumbnailPreview} style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.coverImage} alt="썸네일 미리보기" />
            <button
              type="button"
              onClick={() => update('coverImage', '')}
              className={styles.thumbnailRemove}
            >
              제거
            </button>
          </div>
        )}

        <div className={styles.tabs}>
          {([
            ['upload', '파일 업로드'],
            ['unsplash', 'Unsplash'],
            ['ai', 'AI 생성'],
            ['url', 'URL 입력'],
          ] as [ThumbTab, string][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setThumbTab(k)}
              className={`${styles.tabTrigger} ${thumbTab === k ? styles.tabActive : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {thumbTab === 'upload' && (
            <label
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleThumbFile(file);
              }}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThumbFile(file);
                }}
              />
              <span className={styles.dropzoneIcon}>↑</span>
              <span className={styles.dropzoneTitle}>이미지를 드래그하거나 클릭하여 업로드</span>
              <span className={styles.dropzoneSubtitle}>JPG · PNG · WebP (최대 5MB)</span>
            </label>
          )}

          {thumbTab === 'unsplash' && (
            <div>
              <div className={styles.openverseBar}>
                <input
                  type="search"
                  placeholder="검색어 (영문 권장: agarwood, incense, traditional medicine...)"
                  value={usQuery}
                  onChange={(e) => setUsQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      searchUnsplash();
                    }
                  }}
                />
                <select
                  value={usOrientation}
                  onChange={(e) => setUsOrientation(e.target.value as UnsplashOrientation)}
                  aria-label="방향"
                >
                  <option value="landscape">가로</option>
                  <option value="portrait">세로</option>
                  <option value="squarish">정사각</option>
                  <option value="any">모든 방향</option>
                </select>
                <button
                  type="button"
                  className={styles.openverseSearchBtn}
                  onClick={searchUnsplash}
                  disabled={usBusy || !usQuery.trim()}
                >
                  {usBusy ? '검색 중…' : '검색'}
                </button>
              </div>

              <p className={styles.help} style={{ marginBottom: 8 }}>
                Unsplash — 무료 고품질 사진. 시간당 50건 한도 (Demo tier).
                선택 시 자동으로 Vercel Blob 으로 미러링됩니다.
              </p>

              {usResults.length > 0 && (
                <div className={styles.openverseGrid}>
                  {usResults.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className={styles.openverseCard}
                      onClick={() => applyUnsplashHit(hit)}
                      disabled={usApplyingId !== null}
                      title={`${hit.title || '(제목 없음)'} — ${hit.creator || '익명'}`}
                      style={hit.color ? { background: hit.color } : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hit.thumb}
                        alt={hit.title || 'preview'}
                        className={styles.openverseCardImg}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                        }}
                      />
                      <div className={styles.openverseCardMeta}>
                        <span className={styles.openverseCardCreator}>
                          {usApplyingId === hit.id ? '가져오는 중…' : hit.creator || '익명'}
                        </span>
                        <span className={styles.openverseCardLicense}>Unsplash</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {usError && (
                <p className={`${styles.openverseStatus} ${styles.openverseStatusErr}`}>
                  {usError}
                </p>
              )}

              {usAttribution && (
                <div className={styles.openverseAttribution}>
                  <strong>크레딧 (Unsplash 가이드라인):</strong>{' '}
                  Photo by{' '}
                  <a href={usAttribution.creator_url} target="_blank" rel="noopener noreferrer">
                    {usAttribution.creator || '익명'}
                  </a>{' '}
                  on{' '}
                  <a
                    href={`https://unsplash.com/?${'utm_source=daerachoen&utm_medium=referral'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unsplash
                  </a>
                  <br />
                  <span style={{ color: '#7a7368', fontSize: '0.7rem' }}>
                    ※ 본문 캡션이나 하단에 위 크레딧을 표기해주세요.
                    HTML 복사:{' '}
                    <code style={{ fontSize: '0.65rem', background: '#fff', padding: '1px 4px', borderRadius: 2 }}>
                      Photo by &lt;a href=&quot;{usAttribution.creator_url}&quot;&gt;{usAttribution.creator}&lt;/a&gt; on &lt;a href=&quot;https://unsplash.com/?utm_source=daerachoen&amp;utm_medium=referral&quot;&gt;Unsplash&lt;/a&gt;
                    </code>
                  </span>
                </div>
              )}
            </div>
          )}

          {thumbTab === 'ai' && (
            <div className={styles.aiPrompt}>
              <textarea
                className={styles.textarea}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="예: 베트남 푸꾸옥 침향나무 농장의 새벽 풍경, 다큐멘터리 사진 스타일, 16:9"
              />
              <p className={styles.help}>
                Imagen 4 로 16:9 이미지를 생성합니다. 영문 프롬프트가 결과가 좋습니다.
              </p>
              <button
                type="button"
                onClick={generateAiThumbnail}
                disabled={aiBusy || !aiPrompt.trim()}
                className={styles.aiBtn}
              >
                {aiBusy ? '생성 중…' : 'AI 이미지 생성'}
              </button>
            </div>
          )}

          {thumbTab === 'url' && (
            <div className={styles.formItem}>
              <label className={styles.label} htmlFor="bf-coverurl">이미지 URL</label>
              <input
                id="bf-coverurl"
                className={styles.input}
                type="url"
                value={state.coverImage}
                onChange={(e) => update('coverImage', e.target.value)}
                placeholder="https://..."
              />
              <p className={styles.help}>
                Vercel Blob 또는 사이트 내부 경로(/uploads/...)를 권장합니다.
              </p>
            </div>
          )}
        </div>

        <p className={styles.help} style={{ marginTop: 12 }}>
          모든 언어 탭에서 동일한 썸네일이 사용됩니다.
        </p>
      </section>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
