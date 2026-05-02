'use client';

import { useEffect, useState } from 'react';
import { saveAdminPage } from '@/lib/adminSave';

interface ReviewsHero {
  kicker: string;
  titleKr: string;
  lede: string;
}

interface ReviewsPageData {
  hero: ReviewsHero;
}

const DEFAULT_HERO: ReviewsHero = {
  kicker: 'TESTIMONIALS',
  titleKr: '고객 후기',
  lede: 'ZOEL LIFE 침향을 경험하신 고객님들의 소중한 이야기. 인증된 구매 고객의 후기를 모두 공개합니다.',
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

export default function AdminReviewsHeroPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [hero, setHero] = useState<ReviewsHero>(DEFAULT_HERO);

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
        const data = (await res.json()) as { pages?: { reviews?: Partial<ReviewsPageData> } };
        const d = data.pages?.reviews;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
      } catch (err) {
        console.error('Failed to fetch reviews hero:', err);
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
      const body = res.ok ? ((await res.json()) as { pages?: { reviews?: ReviewsPageData } }) : { pages: {} };
      const current = body.pages?.reviews ?? {};
      const merged: ReviewsPageData = { ...current, hero };

      const result = await saveAdminPage('reviews', merged);
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
              {Array.from({ length: 3 }).map((_, i) => (
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">고객 후기 편집</h1>
        <p className="mb-8 text-gray-500">/reviews 공개 페이지의 히어로(키커·제목·부제목)를 관리합니다.</p>

        <div className="space-y-8">
          <SectionCard title="HERO · 고객 후기 헤더" onSave={saveHero} saving={saving}>
            <div className="space-y-5">
              <LabeledInput label="키커 (상단 태그, 예: TESTIMONIALS)" value={hero.kicker} onChange={(v) => setHero({ ...hero, kicker: v })} />
              <LabeledInput label="제목 (예: 고객 후기)" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
              <LabeledTextarea label="부제목 (lede)" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={3} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
