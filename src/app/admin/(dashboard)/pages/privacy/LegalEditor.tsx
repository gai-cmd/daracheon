'use client';

import { useEffect, useState } from 'react';
import LegalMarkdown from '@/components/ui/LegalMarkdown';
import { saveAdminPage } from '@/lib/adminSave';
import type { LegalDoc } from '@/data/legal';

interface Props {
  pageKey: 'privacy' | 'terms';
  pageTitle: string;
  publicPath: string;
  defaultDoc: LegalDoc;
}

export default function LegalEditor({ pageKey, pageTitle, publicPath, defaultDoc }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [effectiveDate, setEffectiveDate] = useState(defaultDoc.effectiveDate);
  const [content, setContent] = useState(defaultDoc.content);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        const raw = (await res.json().catch(() => ({}))) as {
          pages?: Record<string, Partial<LegalDoc>>;
        };
        const d = raw?.pages?.[pageKey];
        if (d?.effectiveDate) setEffectiveDate(d.effectiveDate);
        if (d?.content) setContent(d.content);
      } catch (err) {
        console.error('Failed to fetch legal doc:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [pageKey]);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveAdminPage(pageKey, { effectiveDate, content });
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({
        msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`,
        type: 'success',
      });
    } catch (err) {
      setToast({
        msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleResetToDefault() {
    if (!confirm('현재 편집 중인 내용을 기본값으로 되돌립니다. 계속하시겠습니까? (저장 전까지는 적용되지 않습니다)')) {
      return;
    }
    setEffectiveDate(defaultDoc.effectiveDate);
    setContent(defaultDoc.content);
    setToast({ msg: '기본값으로 되돌렸습니다. 저장하면 반영됩니다.', type: 'success' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-96 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle} 편집</h1>
            <p className="mt-1 text-gray-500">
              마크다운 형식으로 작성합니다. 저장 시{' '}
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-600 underline hover:text-gold-700"
              >
                {publicPath}
              </a>{' '}
              페이지에 반영됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showPreview ? '편집 모드' : '미리보기'}
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              기본값 복원
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="adm-btn-primary px-6 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">시행일</label>
            <input
              type="text"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              placeholder="예: 2026년 5월 6일"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">본문 (Markdown)</label>
              <span className="text-xs text-gray-400">
                {content.length.toLocaleString()}자
              </span>
            </div>
            {showPreview ? (
              <div className="min-h-[480px] rounded-lg border border-gray-200 bg-[#0a0b10] p-8">
                <LegalMarkdown content={content} />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={28}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-[13px] leading-relaxed focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                spellCheck={false}
              />
            )}
            <p className="mt-2 text-xs text-gray-500">
              지원 문법: <code className="rounded bg-gray-100 px-1">#</code> 제목,{' '}
              <code className="rounded bg-gray-100 px-1">##</code> 절,{' '}
              <code className="rounded bg-gray-100 px-1">**굵게**</code>,{' '}
              <code className="rounded bg-gray-100 px-1">- 항목</code>,{' '}
              <code className="rounded bg-gray-100 px-1">1. 항목</code>,{' '}
              <code className="rounded bg-gray-100 px-1">| 표 |</code>,{' '}
              <code className="rounded bg-gray-100 px-1">---</code> 가로줄,{' '}
              <code className="rounded bg-gray-100 px-1">[링크](url)</code>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
