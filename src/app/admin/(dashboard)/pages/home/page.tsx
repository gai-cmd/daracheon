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

interface NoticeItem {
  num: string;
  text: string;
}

interface HomeNotice {
  tag: string;
  title: string;
  body: string;
  items: NoticeItem[];
  badges: string[];
  ctaLabel: string;
  ctaHref: string;
}

interface AgarwoodCard {
  title: string;
  description: string;
}

interface HomeAgarwood {
  tag: string;
  title: string;
  cards: AgarwoodCard[];
}

interface BenefitItem {
  title: string;
  description: string;
}

interface HomeBenefits {
  tag: string;
  title: string;
  items: BenefitItem[];
}

interface HomeProcess {
  tag: string;
  title: string;
  steps: string[];
}

interface HomeData {
  hero: HomeHero;
  stats: HomeStat[];
  notice?: HomeNotice;
  agarwood?: HomeAgarwood;
  benefits?: HomeBenefits;
  process?: HomeProcess;
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

const DEFAULT_NOTICE: HomeNotice = {
  tag: 'NOTICE',
  title: '진짜 침향, 이젠\n학명부터 확인하세요!',
  body: "대한민국 국가법령정보센터의 식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전' 두 곳에서 동일하게 등록된 공식 침향은 Aquilaria Agallocha Roxburgh(AAR)입니다.",
  items: [],
  badges: [],
  ctaLabel: "대라천 '참'침향 인증 확인하기 →",
  ctaHref: '/brand-story',
};

const DEFAULT_AGARWOOD: HomeAgarwood = { tag: 'AGARWOOD', title: '신들의 나무, 침향', cards: [] };
const DEFAULT_BENEFITS: HomeBenefits = { tag: 'BENEFITS', title: '침향의 효능에 주목!', items: [] };
const DEFAULT_PROCESS: HomeProcess = { tag: 'CRAFTSMANSHIP', title: '완벽을 향한 6단계 공정', steps: [] };

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
  const [notice, setNotice] = useState<HomeNotice>(DEFAULT_NOTICE);
  const [agarwood, setAgarwood] = useState<HomeAgarwood>(DEFAULT_AGARWOOD);
  const [benefits, setBenefits] = useState<HomeBenefits>(DEFAULT_BENEFITS);
  const [processSection, setProcessSection] = useState<HomeProcess>(DEFAULT_PROCESS);

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
        if (d?.notice) setNotice({ ...DEFAULT_NOTICE, ...d.notice, items: d.notice.items ?? [], badges: d.notice.badges ?? [] });
        if (d?.agarwood) setAgarwood({ ...DEFAULT_AGARWOOD, ...d.agarwood, cards: d.agarwood.cards ?? [] });
        if (d?.benefits) setBenefits({ ...DEFAULT_BENEFITS, ...d.benefits, items: d.benefits.items ?? [] });
        if (d?.process) setProcessSection({ ...DEFAULT_PROCESS, ...d.process, steps: d.process.steps ?? [] });
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

          {/* Notice */}
          <SectionCard title="Consumer Notice (진짜 침향 알림)" onSave={() => saveSection('notice', { notice })} saving={saving === 'notice'}>
            <div className="space-y-5">
              <LabeledInput label="태그 (예: NOTICE)" value={notice.tag} onChange={(v) => setNotice({ ...notice, tag: v })} />
              <LabeledTextarea label="제목 (줄바꿈 = 실제 줄바꿈으로 표시)" value={notice.title} onChange={(v) => setNotice({ ...notice, title: v })} rows={2} />
              <LabeledTextarea label="본문" value={notice.body} onChange={(v) => setNotice({ ...notice, body: v })} rows={3} />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Notice 항목 ({notice.items.length}, 3개 권장)</label>
                <div className="space-y-3">
                  {notice.items.map((it, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={it.num} onChange={(e) => { const n = [...notice.items]; n[i] = { ...n[i], num: e.target.value }; setNotice({ ...notice, items: n }); }} placeholder="번호 (예: 01)" className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setNotice({ ...notice, items: moveItem(notice.items, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
                          <button type="button" onClick={() => setNotice({ ...notice, items: moveItem(notice.items, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
                          <button type="button" onClick={() => setNotice({ ...notice, items: removeIndex(notice.items, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={2} value={it.text} onChange={(e) => { const n = [...notice.items]; n[i] = { ...n[i], text: e.target.value }; setNotice({ ...notice, items: n }); }} placeholder="본문" className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setNotice({ ...notice, items: [...notice.items, { num: '', text: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 항목 추가</button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">인증 뱃지 ({notice.badges.length})</label>
                <div className="space-y-2">
                  {notice.badges.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={b} onChange={(e) => { const n = [...notice.badges]; n[i] = e.target.value; setNotice({ ...notice, badges: n }); }} placeholder="예: CITES 보호 수종" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <button type="button" onClick={() => setNotice({ ...notice, badges: moveItem(notice.badges, i, i - 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                      <button type="button" onClick={() => setNotice({ ...notice, badges: moveItem(notice.badges, i, i + 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                      <button type="button" onClick={() => setNotice({ ...notice, badges: removeIndex(notice.badges, i) })} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setNotice({ ...notice, badges: [...notice.badges, ''] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 뱃지 추가</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="하단 CTA 라벨" value={notice.ctaLabel} onChange={(v) => setNotice({ ...notice, ctaLabel: v })} />
                <LabeledInput label="하단 CTA 링크" value={notice.ctaHref} onChange={(v) => setNotice({ ...notice, ctaHref: v })} />
              </div>
            </div>
          </SectionCard>

          {/* Agarwood */}
          <SectionCard title="침향 소개 카드 (AGARWOOD)" onSave={() => saveSection('agarwood', { agarwood })} saving={saving === 'agarwood'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={agarwood.tag} onChange={(v) => setAgarwood({ ...agarwood, tag: v })} />
                <LabeledInput label="제목" value={agarwood.title} onChange={(v) => setAgarwood({ ...agarwood, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">카드 ({agarwood.cards.length})</label>
                <div className="space-y-3">
                  {agarwood.cards.map((c, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={c.title} onChange={(e) => { const n = [...agarwood.cards]; n[i] = { ...n[i], title: e.target.value }; setAgarwood({ ...agarwood, cards: n }); }} placeholder="카드 제목" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="ml-2 flex gap-1">
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: moveItem(agarwood.cards, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: moveItem(agarwood.cards, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: removeIndex(agarwood.cards, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={3} value={c.description} onChange={(e) => { const n = [...agarwood.cards]; n[i] = { ...n[i], description: e.target.value }; setAgarwood({ ...agarwood, cards: n }); }} placeholder="설명" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setAgarwood({ ...agarwood, cards: [...agarwood.cards, { title: '', description: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 카드 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Benefits */}
          <SectionCard title="침향의 효능 (BENEFITS)" onSave={() => saveSection('benefits', { benefits })} saving={saving === 'benefits'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={benefits.tag} onChange={(v) => setBenefits({ ...benefits, tag: v })} />
                <LabeledInput label="제목" value={benefits.title} onChange={(v) => setBenefits({ ...benefits, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">효능 항목 ({benefits.items.length})</label>
                <div className="space-y-3">
                  {benefits.items.map((it, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={it.title} onChange={(e) => { const n = [...benefits.items]; n[i] = { ...n[i], title: e.target.value }; setBenefits({ ...benefits, items: n }); }} placeholder="제목" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="ml-2 flex gap-1">
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: moveItem(benefits.items, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: moveItem(benefits.items, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setBenefits({ ...benefits, items: removeIndex(benefits.items, i) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <textarea rows={3} value={it.description} onChange={(e) => { const n = [...benefits.items]; n[i] = { ...n[i], description: e.target.value }; setBenefits({ ...benefits, items: n }); }} placeholder="설명" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setBenefits({ ...benefits, items: [...benefits.items, { title: '', description: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 효능 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Process */}
          <SectionCard title="생산 공정 (CRAFTSMANSHIP)" onSave={() => saveSection('process', { process: processSection })} saving={saving === 'process'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={processSection.tag} onChange={(v) => setProcessSection({ ...processSection, tag: v })} />
                <LabeledInput label="제목" value={processSection.title} onChange={(v) => setProcessSection({ ...processSection, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">공정 단계 ({processSection.steps.length})</label>
                <div className="space-y-2">
                  {processSection.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-8 text-center text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                      <input value={s} onChange={(e) => { const n = [...processSection.steps]; n[i] = e.target.value; setProcessSection({ ...processSection, steps: n }); }} placeholder="공정 단계명" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <button type="button" onClick={() => setProcessSection({ ...processSection, steps: moveItem(processSection.steps, i, i - 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                      <button type="button" onClick={() => setProcessSection({ ...processSection, steps: moveItem(processSection.steps, i, i + 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                      <button type="button" onClick={() => setProcessSection({ ...processSection, steps: removeIndex(processSection.steps, i) })} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProcessSection({ ...processSection, steps: [...processSection.steps, ''] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 단계 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
