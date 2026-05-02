'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

interface ProductsHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
  heroImage?: string;
}

interface ProductsPageData {
  hero: ProductsHero;
}

const DEFAULT_HERO: ProductsHero = {
  kicker: '제품 소개 · Products',
  titleLine1: '수십 년 숙성의 시간을',
  titleEmphasis: '담은 고귀한 제품',
  lede: '베트남 Ha Tinh 직영 농장에서 25년간 연구한 침향을, 전통 제법과 현대 과학으로 완성한 라인업. 모든 제품은 Lot 번호로 농장·가공·검사 이력을 조회할 수 있습니다.',
};

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

function SectionCard({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{title}</h2>
      {children}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="adm-btn-primary px-6 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}

export default function AdminProductsHeroPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [hero, setHero] = useState<ProductsHero>(DEFAULT_HERO);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        if (res.status === 404) return;
        const data = (await res.json()) as { pages?: { products?: Partial<ProductsPageData> } };
        const d = data.pages?.products;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
      } catch (err) {
        console.error('Failed to fetch products hero:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveHero() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      const body = res.ok ? ((await res.json()) as { pages?: { products?: ProductsPageData } }) : { pages: {} };
      const current = body.pages?.products ?? {};
      const merged: ProductsPageData = { ...current, hero };

      const result = await saveAdminPage('products', merged);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
    } catch (err) {
      console.error('Save hero error:', err);
      setToast({ msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
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

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">제품 소개 편집</h1>
        <p className="mb-8 text-gray-500">/products 공개 페이지의 히어로를 관리합니다.</p>

        <div className="space-y-8">
          <SectionCard title="Hero · 히어로" onSave={saveHero} saving={saving}>
            <div className="space-y-5">
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
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
