'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

export interface PageHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
  heroImage?: string;
}

interface PageHeroEditorProps {
  /** pages.{pageKey}.hero 경로에 저장. 예: 'products', 'support'. */
  pageKey: string;
  /** 사이트 어디 페이지의 히어로인지 안내 (예: '/products', '/support'). */
  publicPath: string;
  /** DB 비어있을 때 보여줄 기본값. */
  defaultHero: PageHero;
  /** 카드 제목. 기본 'Hero · 히어로'. */
  title?: string;
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
    </div>
  );
}

/**
 * 공개 페이지(/{publicPath}) 의 히어로 영역(섹션 태그 / 제목 한글 / 제목 영문 / 부제목 / 배경 이미지)
 * 을 한 카드 안에서 편집·저장한다. 동일한 hero 스키마를 쓰는 어드민 화면 어디에서나 import 해서 사용 가능.
 */
export default function PageHeroEditor({
  pageKey,
  publicPath,
  defaultHero,
  title = 'Hero · 히어로',
}: PageHeroEditorProps) {
  const [hero, setHero] = useState<PageHero>(defaultHero);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const stored = data?.pages?.[pageKey]?.hero as PageHero | undefined;
        if (stored) setHero({ ...defaultHero, ...stored });
      } catch (err) {
        console.error(`[PageHeroEditor:${pageKey}] load error:`, err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pageKey, defaultHero]);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      const body = res.ok ? await res.json() : { pages: {} };
      const current = body?.pages?.[pageKey] ?? {};
      const merged = { ...current, hero };
      const result = await saveAdminPage(pageKey, merged);
      if (!result.ok) {
        setToast({ kind: 'err', msg: `저장 실패: ${result.msg}` });
        return;
      }
      setToast({ kind: 'ok', msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}` });
    } catch (err) {
      setToast({ kind: 'err', msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="mr-2 text-gold-500">{collapsed ? '▶' : '▼'}</span>
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            공개 페이지 <code className="font-mono">{publicPath}</code> 상단 히어로 영역의 섹션 태그·제목·부제목·배경 이미지.
          </p>
        </div>
        {toast && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              toast.kind === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {toast.msg}
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="space-y-5 border-t border-gray-100 px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <>
              <LabeledInput label="섹션 태그" value={hero.kicker} onChange={(v) => setHero({ ...hero, kicker: v })} />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="제목 (한글)" value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} />
                <LabeledInput label="제목 (영문)" value={hero.titleEmphasis} onChange={(v) => setHero({ ...hero, titleEmphasis: v })} />
              </div>
              <LabeledTextarea label="부제목" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={3} />
              <ImageUploadField
                label="배경 이미지"
                value={hero.heroImage ?? ''}
                onChange={(url) => setHero({ ...hero, heroImage: url })}
                subdir="pages"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="adm-btn-primary px-6 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
