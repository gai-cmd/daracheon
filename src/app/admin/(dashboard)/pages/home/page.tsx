'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

interface HomeHero {
  sectionTag: string;
  titleKr: string;
  subtitle: string;
  heroBg: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

interface HomeStat {
  value: string;
  label: string;
}

interface HomeData {
  hero: HomeHero;
  stats: HomeStat[];
}

const DEFAULT_HERO: HomeHero = {
  sectionTag: '자연이 빚은 최고의 향',
  titleKr: "대라천 '참'침향",
  subtitle: '베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향',
  heroBg:
    'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg',
  ctaPrimaryLabel: '제품 보기',
  ctaPrimaryHref: '/products',
  ctaSecondaryLabel: '브랜드 이야기',
  ctaSecondaryHref: '/brand-story',
};

const DEFAULT_STATS: HomeStat[] = [
  { value: '400만+', label: '침향 나무' },
  { value: '25yr+', label: '연구 기간' },
  { value: '5', label: '베트남 산지' },
  { value: '200ha', label: '하띤성 직영 농장' },
];

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
          className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function removeIndex<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<HomeHero>(DEFAULT_HERO);
  const [stats, setStats] = useState<HomeStat[]>(DEFAULT_STATS);

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
          // No pages doc yet — keep defaults
          return;
        }
        const data = (await res.json()) as { pages?: { home?: HomeData } };
        const d = data.pages?.home;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (Array.isArray(d?.stats) && d.stats.length > 0) setStats(d.stats);
      } catch (err) {
        console.error('Failed to fetch home:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<HomeData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const body = res.ok ? ((await res.json()) as { pages?: { home?: HomeData } }) : { pages: {} };
      const currentHome = body.pages?.home ?? { hero: DEFAULT_HERO, stats: DEFAULT_STATS };
      const merged = { ...currentHome, ...payload };

      const saveRes = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'home', data: merged }),
      });
      if (!saveRes.ok) throw new Error('Save failed');
      setToast({ msg: '저장 완료', type: 'success' });
    } catch (err) {
      console.error(`Save ${sectionKey} error:`, err);
      setToast({ msg: '저장 실패', type: 'error' });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 w-full rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
          ))}
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">홈 편집</h1>
        <p className="mb-8 text-gray-500">/ (홈) 공개 페이지의 히어로·통계 영역을 관리합니다.</p>

        <div className="space-y-8">
          {/* Hero */}
          <SectionCard title="히어로 섹션" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="space-y-5">
              <LabeledInput label="상단 태그라인" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
              <LabeledInput label="메인 제목" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
              <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">배경 이미지</label>
                <ImageUploadField value={hero.heroBg} onChange={(url) => setHero({ ...hero, heroBg: url })} subdir="pages" />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="CTA 1 라벨" value={hero.ctaPrimaryLabel} onChange={(v) => setHero({ ...hero, ctaPrimaryLabel: v })} />
                <LabeledInput label="CTA 1 링크" value={hero.ctaPrimaryHref} onChange={(v) => setHero({ ...hero, ctaPrimaryHref: v })} />
                <LabeledInput label="CTA 2 라벨" value={hero.ctaSecondaryLabel} onChange={(v) => setHero({ ...hero, ctaSecondaryLabel: v })} />
                <LabeledInput label="CTA 2 링크" value={hero.ctaSecondaryHref} onChange={(v) => setHero({ ...hero, ctaSecondaryHref: v })} />
              </div>
            </div>
          </SectionCard>

          {/* Stats */}
          <SectionCard title="통계 섹션 (4개 권장)" onSave={() => saveSection('stats', { stats })} saving={saving === 'stats'}>
            <div className="space-y-3">
              {stats.map((stat, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setStats(moveItem(stats, i, i - 1))}
                      disabled={i === 0}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => setStats(moveItem(stats, i, i + 1))}
                      disabled={i === stats.length - 1}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    value={stat.value}
                    onChange={(e) => {
                      const n = [...stats];
                      n[i] = { ...n[i], value: e.target.value };
                      setStats(n);
                    }}
                    placeholder="값 (예: 400만+)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <input
                    value={stat.label}
                    onChange={(e) => {
                      const n = [...stats];
                      n[i] = { ...n[i], label: e.target.value };
                      setStats(n);
                    }}
                    placeholder="레이블 (예: 침향 나무)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setStats(removeIndex(stats, i))}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStats([...stats, { value: '', label: '' }])}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
              >
                + 통계 추가
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
