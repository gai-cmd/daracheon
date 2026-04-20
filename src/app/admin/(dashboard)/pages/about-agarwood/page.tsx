'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface FormationStep {
  step: string;
  title: string;
  description: string;
}

interface SpecialReason {
  title: string;
  description: string;
}

interface Benefit {
  title: string;
  description: string;
}

interface Literature {
  title: string;
  author: string;
  year: string;
  topic: string;
  description: string;
}

interface Paper {
  title: string;
  journal: string;
  year: string;
  citations: string;
}

interface MediaItem {
  outlet: string;
  date?: string;
  title: string;
  summary?: string;
  image?: string;
  link?: string;
}

interface TestimonialItem {
  name: string;
  role?: string;
  rating?: number;
  body: string;
  product?: string;
  image?: string;
}

interface AboutAgarwoodData {
  hero: {
    sectionTag: string;
    titleKr: string;
    titleEn: string;
    subtitle: string;
    heroImage: string;
  };
  definitionSection: {
    title: string;
    subtitle: string;
    body: string;
    officialNameCallout: string;
  };
  formationSteps: FormationStep[];
  specialReasons: SpecialReason[];
  benefits: Benefit[];
  literatures: Literature[];
  papers: Paper[];
  cta: {
    title: string;
    buttonProducts: string;
    buttonProductsHref: string;
    buttonBrand: string;
    buttonBrandHref: string;
  };
  mediaTab?: {
    tag: string;
    title: string;
    subtitle?: string;
    items: MediaItem[];
  };
  testimonialsTab?: {
    tag: string;
    title: string;
    subtitle?: string;
    items: TestimonialItem[];
  };
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
      />
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
      />
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="bg-gold-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
    >
      {loading ? '저장 중...' : '저장'}
    </button>
  );
}

function SectionCard({
  title,
  children,
  onSave,
  saving,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      {children}
      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} loading={saving} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AdminAboutAgarwoodPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* state */
  const [hero, setHero] = useState<AboutAgarwoodData['hero']>({
    sectionTag: '',
    titleKr: '',
    titleEn: '',
    subtitle: '',
    heroImage: '',
  });
  const [definitionSection, setDefinitionSection] = useState<AboutAgarwoodData['definitionSection']>({
    title: '',
    subtitle: '',
    body: '',
    officialNameCallout: '',
  });
  const [formationSteps, setFormationSteps] = useState<FormationStep[]>([]);
  const [specialReasons, setSpecialReasons] = useState<SpecialReason[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [literatures, setLiteratures] = useState<Literature[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [cta, setCta] = useState<AboutAgarwoodData['cta']>({
    title: '',
    buttonProducts: '',
    buttonProductsHref: '',
    buttonBrand: '',
    buttonBrandHref: '',
  });
  const [mediaTab, setMediaTab] = useState<NonNullable<AboutAgarwoodData['mediaTab']>>({
    tag: 'In the Media',
    title: '매체에 실린 침향',
    subtitle: '주요 매체와 기관에서 조명한 대라천 침향의 이야기.',
    items: [],
  });
  const [testimonialsTab, setTestimonialsTab] = useState<NonNullable<AboutAgarwoodData['testimonialsTab']>>({
    tag: 'Testimonials',
    title: '고객이 남긴 침향',
    subtitle: '대라천 침향을 경험한 고객들의 진솔한 이야기.',
    items: [],
  });

  /* toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* fetch */
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        const data = await res.json() as { pages: { aboutAgarwood: AboutAgarwoodData } };
        const d = data.pages.aboutAgarwood;
        setHero(d.hero ?? hero);
        setDefinitionSection(d.definitionSection ?? definitionSection);
        setFormationSteps(d.formationSteps ?? []);
        setSpecialReasons(d.specialReasons ?? []);
        setBenefits(d.benefits ?? []);
        setLiteratures(d.literatures ?? []);
        setPapers(d.papers ?? []);
        setCta(d.cta ?? cta);
        if (d.mediaTab) setMediaTab(d.mediaTab);
        if (d.testimonialsTab) setTestimonialsTab(d.testimonialsTab);
      } catch (err) {
        console.error('Failed to fetch pages:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* save helper */
  async function saveSection(sectionKey: string, payload: Partial<AboutAgarwoodData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const existing = await res.json() as { pages: { aboutAgarwood: AboutAgarwoodData } };
      const merged = { ...existing.pages.aboutAgarwood, ...payload };

      const saveRes = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'aboutAgarwood', data: merged }),
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

  /* array helpers */
  function moveItem<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function removeItem<T>(arr: T[], index: number): T[] {
    return arr.filter((_, i) => i !== index);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 w-32 rounded bg-gray-200 mb-6" />
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 text-white text-sm font-medium rounded-xl shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">침향 이야기 편집</h1>
        <p className="text-gray-500 mb-8">/about-agarwood 공개 페이지의 콘텐츠를 관리합니다.</p>

        <div className="space-y-8">
          {/* Hero */}
          <SectionCard title="히어로 섹션" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabeledInput label="섹션 태그" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
              <LabeledInput label="제목 (영문)" value={hero.titleEn} onChange={(v) => setHero({ ...hero, titleEn: v })} />
              <div className="md:col-span-2">
                <LabeledInput label="제목 (한글)" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
              </div>
              <div className="md:col-span-2">
                <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="히어로 배경 이미지"
                  value={hero.heroImage}
                  onChange={(url) => setHero({ ...hero, heroImage: url })}
                  subdir="pages"
                />
              </div>
            </div>
          </SectionCard>

          {/* Definition Section */}
          <SectionCard title="침향 정의 섹션" onSave={() => saveSection('definition', { definitionSection })} saving={saving === 'definition'}>
            <div className="space-y-5">
              <LabeledInput label="섹션 제목" value={definitionSection.title} onChange={(v) => setDefinitionSection({ ...definitionSection, title: v })} />
              <LabeledInput label="부제목 (이탤릭)" value={definitionSection.subtitle} onChange={(v) => setDefinitionSection({ ...definitionSection, subtitle: v })} />
              <LabeledTextarea label="본문" value={definitionSection.body} onChange={(v) => setDefinitionSection({ ...definitionSection, body: v })} rows={4} />
              <LabeledTextarea label="공식명 콜아웃 텍스트" value={definitionSection.officialNameCallout} onChange={(v) => setDefinitionSection({ ...definitionSection, officialNameCallout: v })} rows={2} />
            </div>
          </SectionCard>

          {/* Formation Steps */}
          <SectionCard title="침향 형성 과정" onSave={() => saveSection('formationSteps', { formationSteps })} saving={saving === 'formationSteps'}>
            <div className="space-y-4">
              {formationSteps.map((step, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">단계 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setFormationSteps(moveItem(formationSteps, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setFormationSteps(moveItem(formationSteps, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setFormationSteps(removeItem(formationSteps, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="번호 (예: 01)"
                      value={step.step}
                      onChange={(e) => { const n = [...formationSteps]; n[i] = { ...n[i], step: e.target.value }; setFormationSteps(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <input
                      placeholder="제목"
                      value={step.title}
                      onChange={(e) => { const n = [...formationSteps]; n[i] = { ...n[i], title: e.target.value }; setFormationSteps(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <textarea
                      placeholder="설명"
                      rows={2}
                      value={step.description}
                      onChange={(e) => { const n = [...formationSteps]; n[i] = { ...n[i], description: e.target.value }; setFormationSteps(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormationSteps([...formationSteps, { step: String(formationSteps.length + 1).padStart(2, '0'), title: '', description: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                + 단계 추가
              </button>
            </div>
          </SectionCard>

          {/* Special Reasons */}
          <SectionCard title="침향이 특별한 이유" onSave={() => saveSection('specialReasons', { specialReasons })} saving={saving === 'specialReasons'}>
            <div className="space-y-4">
              {specialReasons.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">항목 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setSpecialReasons(moveItem(specialReasons, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setSpecialReasons(moveItem(specialReasons, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setSpecialReasons(removeItem(specialReasons, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      placeholder="제목"
                      value={item.title}
                      onChange={(e) => { const n = [...specialReasons]; n[i] = { ...n[i], title: e.target.value }; setSpecialReasons(n); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <textarea
                      placeholder="설명"
                      rows={3}
                      value={item.description}
                      onChange={(e) => { const n = [...specialReasons]; n[i] = { ...n[i], description: e.target.value }; setSpecialReasons(n); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSpecialReasons([...specialReasons, { title: '', description: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                + 항목 추가
              </button>
            </div>
          </SectionCard>

          {/* Benefits */}
          <SectionCard title="침향 효능" onSave={() => saveSection('benefits', { benefits })} saving={saving === 'benefits'}>
            <div className="space-y-4">
              {benefits.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">효능 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setBenefits(moveItem(benefits, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setBenefits(moveItem(benefits, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setBenefits(removeItem(benefits, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      placeholder="효능 제목"
                      value={item.title}
                      onChange={(e) => { const n = [...benefits]; n[i] = { ...n[i], title: e.target.value }; setBenefits(n); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <textarea
                      placeholder="설명"
                      rows={3}
                      value={item.description}
                      onChange={(e) => { const n = [...benefits]; n[i] = { ...n[i], description: e.target.value }; setBenefits(n); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBenefits([...benefits, { title: '', description: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                + 효능 추가
              </button>
            </div>
          </SectionCard>

          {/* Literatures */}
          <SectionCard title="문헌 목록" onSave={() => saveSection('literatures', { literatures })} saving={saving === 'literatures'}>
            <div className="space-y-4">
              {literatures.map((lit, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">문헌 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setLiteratures(moveItem(literatures, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setLiteratures(moveItem(literatures, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setLiteratures(removeItem(literatures, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input placeholder="제목" value={lit.title} onChange={(e) => { const n = [...literatures]; n[i] = { ...n[i], title: e.target.value }; setLiteratures(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="저자" value={lit.author} onChange={(e) => { const n = [...literatures]; n[i] = { ...n[i], author: e.target.value }; setLiteratures(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="연도" value={lit.year} onChange={(e) => { const n = [...literatures]; n[i] = { ...n[i], year: e.target.value }; setLiteratures(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="주제" value={lit.topic} onChange={(e) => { const n = [...literatures]; n[i] = { ...n[i], topic: e.target.value }; setLiteratures(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  </div>
                  <textarea placeholder="설명" rows={2} value={lit.description} onChange={(e) => { const n = [...literatures]; n[i] = { ...n[i], description: e.target.value }; setLiteratures(n); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                </div>
              ))}
              <button type="button" onClick={() => setLiteratures([...literatures, { title: '', author: '', year: '', topic: '', description: '' }])} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                + 문헌 추가
              </button>
            </div>
          </SectionCard>

          {/* Papers */}
          <SectionCard title="논문 목록" onSave={() => saveSection('papers', { papers })} saving={saving === 'papers'}>
            <div className="space-y-4">
              {papers.map((paper, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">논문 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setPapers(moveItem(papers, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setPapers(moveItem(papers, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setPapers(removeItem(papers, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input placeholder="저널명" value={paper.journal} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], journal: e.target.value }; setPapers(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="연도" value={paper.year} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], year: e.target.value }; setPapers(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="인용수 (미정시 -)" value={paper.citations} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], citations: e.target.value }; setPapers(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  </div>
                  <input placeholder="논문 제목" value={paper.title} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], title: e.target.value }; setPapers(n); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                </div>
              ))}
              <button type="button" onClick={() => setPapers([...papers, { title: '', journal: '', year: '', citations: '-' }])} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                + 논문 추가
              </button>
            </div>
          </SectionCard>

          {/* Media Tab */}
          <SectionCard title="매체 탭 (매체에 실린 침향)" onSave={() => saveSection('mediaTab', { mediaTab })} saving={saving === 'mediaTab'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={mediaTab.tag} onChange={(v) => setMediaTab({ ...mediaTab, tag: v })} />
                <LabeledInput label="제목" value={mediaTab.title} onChange={(v) => setMediaTab({ ...mediaTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledTextarea label="부제목 (선택)" value={mediaTab.subtitle ?? ''} onChange={(v) => setMediaTab({ ...mediaTab, subtitle: v })} rows={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">매체 보도 항목 ({mediaTab.items.length})</label>
                <div className="space-y-4">
                  {mediaTab.items.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setMediaTab({ ...mediaTab, items: moveItem(mediaTab.items, i, i - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setMediaTab({ ...mediaTab, items: moveItem(mediaTab.items, i, i + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setMediaTab({ ...mediaTab, items: removeItem(mediaTab.items, i) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input placeholder="매체명 (예: 한국경제)" value={item.outlet} onChange={(e) => { const n = [...mediaTab.items]; n[i] = { ...n[i], outlet: e.target.value }; setMediaTab({ ...mediaTab, items: n }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                        <input placeholder="날짜 (예: 2026.01.15)" value={item.date ?? ''} onChange={(e) => { const n = [...mediaTab.items]; n[i] = { ...n[i], date: e.target.value }; setMediaTab({ ...mediaTab, items: n }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      </div>
                      <input placeholder="기사 제목" value={item.title} onChange={(e) => { const n = [...mediaTab.items]; n[i] = { ...n[i], title: e.target.value }; setMediaTab({ ...mediaTab, items: n }); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <textarea placeholder="요약 (선택)" rows={2} value={item.summary ?? ''} onChange={(e) => { const n = [...mediaTab.items]; n[i] = { ...n[i], summary: e.target.value }; setMediaTab({ ...mediaTab, items: n }); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <input placeholder="원문 링크 (선택, https://...)" value={item.link ?? ''} onChange={(e) => { const n = [...mediaTab.items]; n[i] = { ...n[i], link: e.target.value }; setMediaTab({ ...mediaTab, items: n }); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">썸네일 이미지 (선택)</label>
                        <ImageUploadField value={item.image ?? ''} onChange={(url) => { const n = [...mediaTab.items]; n[i] = { ...n[i], image: url }; setMediaTab({ ...mediaTab, items: n }); }} subdir="pages" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setMediaTab({ ...mediaTab, items: [...mediaTab.items, { outlet: '', title: '' }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 매체 보도 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Testimonials Tab */}
          <SectionCard title="고객 후기 탭 (고객이 남긴 침향)" onSave={() => saveSection('testimonialsTab', { testimonialsTab })} saving={saving === 'testimonialsTab'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={testimonialsTab.tag} onChange={(v) => setTestimonialsTab({ ...testimonialsTab, tag: v })} />
                <LabeledInput label="제목" value={testimonialsTab.title} onChange={(v) => setTestimonialsTab({ ...testimonialsTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledTextarea label="부제목 (선택)" value={testimonialsTab.subtitle ?? ''} onChange={(v) => setTestimonialsTab({ ...testimonialsTab, subtitle: v })} rows={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">고객 후기 ({testimonialsTab.items.length})</label>
                <div className="space-y-4">
                  {testimonialsTab.items.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setTestimonialsTab({ ...testimonialsTab, items: moveItem(testimonialsTab.items, i, i - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setTestimonialsTab({ ...testimonialsTab, items: moveItem(testimonialsTab.items, i, i + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setTestimonialsTab({ ...testimonialsTab, items: removeItem(testimonialsTab.items, i) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input placeholder="이름" value={item.name} onChange={(e) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], name: e.target.value }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                        <input placeholder="역할/소속 (선택)" value={item.role ?? ''} onChange={(e) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], role: e.target.value }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                        <select value={item.rating ?? 0} onChange={(e) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], rating: Number(e.target.value) }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none bg-white">
                          <option value={0}>별점 없음</option>
                          <option value={1}>★☆☆☆☆ (1점)</option>
                          <option value={2}>★★☆☆☆ (2점)</option>
                          <option value={3}>★★★☆☆ (3점)</option>
                          <option value={4}>★★★★☆ (4점)</option>
                          <option value={5}>★★★★★ (5점)</option>
                        </select>
                      </div>
                      <textarea placeholder="후기 본문" rows={3} value={item.body} onChange={(e) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], body: e.target.value }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <input placeholder="사용 제품명 (선택)" value={item.product ?? ''} onChange={(e) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], product: e.target.value }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">프로필 이미지 (선택)</label>
                        <ImageUploadField value={item.image ?? ''} onChange={(url) => { const n = [...testimonialsTab.items]; n[i] = { ...n[i], image: url }; setTestimonialsTab({ ...testimonialsTab, items: n }); }} subdir="pages" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTestimonialsTab({ ...testimonialsTab, items: [...testimonialsTab.items, { name: '', body: '' }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 고객 후기 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* CTA */}
          <SectionCard title="하단 CTA" onSave={() => saveSection('cta', { cta })} saving={saving === 'cta'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <LabeledInput label="CTA 제목" value={cta.title} onChange={(v) => setCta({ ...cta, title: v })} />
              </div>
              <LabeledInput label="제품 버튼 텍스트" value={cta.buttonProducts} onChange={(v) => setCta({ ...cta, buttonProducts: v })} />
              <LabeledInput label="제품 버튼 링크" value={cta.buttonProductsHref} onChange={(v) => setCta({ ...cta, buttonProductsHref: v })} />
              <LabeledInput label="브랜드 버튼 텍스트" value={cta.buttonBrand} onChange={(v) => setCta({ ...cta, buttonBrand: v })} />
              <LabeledInput label="브랜드 버튼 링크" value={cta.buttonBrandHref} onChange={(v) => setCta({ ...cta, buttonBrandHref: v })} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
