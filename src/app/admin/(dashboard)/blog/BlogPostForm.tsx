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

type ThumbTab = 'upload' | 'ai' | 'url';

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
  };
}

const AUTOSAVE_KEY_PREFIX = 'blog:draft:';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

export default function BlogPostForm({ initial, categories, mode }: BlogPostFormProps) {
  const router = useRouter();
  const fallbackCategory = categories[0]?.id ?? 'uncategorized';
  const [state, setState] = useState<FormState>(() => buildInitialState(initial, fallbackCategory));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [restored, setRestored] = useState(false);
  const [thumbTab, setThumbTab] = useState<ThumbTab>('upload');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
                초안
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 제목 + 요약 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>제목 · 요약</h3>
        <div className={styles.formItem} style={{ marginBottom: 16 }}>
          <label className={styles.label} htmlFor="bf-title">
            제목 <span className={styles.required}>*</span>
          </label>
          <input
            id="bf-title"
            className={styles.input}
            type="text"
            value={state.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="글 제목"
          />
        </div>
        <div className={styles.formItem}>
          <label className={styles.label} htmlFor="bf-excerpt">요약</label>
          <textarea
            id="bf-excerpt"
            className={styles.textarea}
            value={state.excerpt}
            onChange={(e) => update('excerpt', e.target.value.slice(0, 240))}
            rows={3}
            placeholder="비워두면 본문 첫 240자에서 자동 생성"
          />
          <p className={styles.help}>{state.excerpt.length}/240</p>
        </div>
      </section>

      {/* 3. 본문 — TinyMCE */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>본문</h3>
        <TinyMCEEditor
          value={state.content}
          onChange={(html) => update('content', html)}
        />
      </section>

      {/* 4. 썸네일 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>썸네일 (커버 이미지)</h3>
        <div className={styles.tabs}>
          {([
            ['upload', '업로드'],
            ['ai', 'AI 생성'],
            ['url', 'URL'],
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
                Vercel Blob (xpklzng0qyaecv6i.public.blob.vercel-storage.com) 또는 사이트 내부 경로(/uploads/...)만 허용됩니다.
              </p>
            </div>
          )}

          {state.coverImage && (
            <div className={styles.thumbnailPreview}>
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
        </div>
      </section>

      {/* 5. SEO & 메타 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>SEO · 메타</h3>
        <div className={styles.basicInfoGrid}>
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
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-seoTitle">SEO 제목</label>
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
            <label className={styles.label} htmlFor="bf-seoDesc">SEO 설명 (권장 120~160자)</label>
            <textarea
              id="bf-seoDesc"
              className={styles.textarea}
              value={state.seoDescription}
              onChange={(e) => update('seoDescription', e.target.value.slice(0, 320))}
              rows={3}
            />
            <p className={styles.help}>{state.seoDescription.length}/320</p>
          </div>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-seoKw">SEO 키워드 (쉼표 구분)</label>
            <input
              id="bf-seoKw"
              className={styles.input}
              type="text"
              value={state.seoKeywords}
              onChange={(e) => update('seoKeywords', e.target.value)}
              placeholder="침향, 침향 효능, 베트남 침향"
            />
          </div>
          <div className={styles.formItem}>
            <label className={styles.label} htmlFor="bf-og">OG 이미지 URL (소셜 미리보기)</label>
            <input
              id="bf-og"
              className={styles.input}
              type="url"
              value={state.ogImage}
              onChange={(e) => update('ogImage', e.target.value)}
              placeholder="비워두면 썸네일 사용"
            />
          </div>
        </div>
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
