'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Farm {
  name: string;
  nameVi: string;
  desc: string;
}

interface HistoryEra {
  era: string;
  items: string[];
}

interface CertSection {
  title: string;
  items: string[];
}

interface BrandStoryData {
  hero: {
    sectionTag: string;
    titleKr: string;
    subtitle: string;
    heroBg: string;
  };
  brandStoryTab: {
    headlineTitle: string;
    headlineSubtitle: string;
    sourceTag: string;
    sourceTitle: string;
    sourceBody: string;
  };
  farms: Farm[];
  sceneTab: {
    tag: string;
    title: string;
    subtitle: string;
    body: string;
    images: string[];
  };
  historyTab: {
    tag: string;
    title: string;
    eras: HistoryEra[];
  };
  certificationsTab: {
    tag: string;
    title: string;
    subtitle: string;
    images: string[];
    sections: CertSection[];
  };
  qualityTab: {
    tag: string;
    title: string;
    subtitle: string;
    images: string[];
    heavyMetals: string[];
  };
  processTab: {
    tag: string;
    title: string;
    subtitle: string;
    images: string[];
    steps: string[];
    totalTimeLabel: string;
    totalTimeValue: string;
    totalTimeDesc: string;
  };
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
      />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
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
    <button type="button" onClick={onClick} disabled={loading} className="bg-gold-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50">
      {loading ? '저장 중...' : '저장'}
    </button>
  );
}

function SectionCard({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
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
export default function AdminBrandStoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<BrandStoryData['hero']>({ sectionTag: '', titleKr: '', subtitle: '', heroBg: '' });
  const [brandStoryTab, setBrandStoryTab] = useState<BrandStoryData['brandStoryTab']>({ headlineTitle: '', headlineSubtitle: '', sourceTag: '', sourceTitle: '', sourceBody: '' });
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sceneTab, setSceneTab] = useState<BrandStoryData['sceneTab']>({ tag: '', title: '', subtitle: '', body: '', images: [] });
  const [historyTab, setHistoryTab] = useState<BrandStoryData['historyTab']>({ tag: '', title: '', eras: [] });
  const [certificationsTab, setCertificationsTab] = useState<BrandStoryData['certificationsTab']>({ tag: '', title: '', subtitle: '', images: [], sections: [] });
  const [qualityTab, setQualityTab] = useState<BrandStoryData['qualityTab']>({ tag: '', title: '', subtitle: '', images: [], heavyMetals: [] });
  const [processTab, setProcessTab] = useState<BrandStoryData['processTab']>({ tag: '', title: '', subtitle: '', images: [], steps: [], totalTimeLabel: '', totalTimeValue: '', totalTimeDesc: '' });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        const data = await res.json() as { pages: { brandStory: BrandStoryData } };
        const d = data.pages.brandStory;
        setHero(d.hero ?? hero);
        setBrandStoryTab(d.brandStoryTab ?? brandStoryTab);
        setFarms(d.farms ?? []);
        setSceneTab(d.sceneTab ?? sceneTab);
        setHistoryTab(d.historyTab ?? historyTab);
        setCertificationsTab(d.certificationsTab ?? certificationsTab);
        setQualityTab(d.qualityTab ?? qualityTab);
        setProcessTab(d.processTab ?? processTab);
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

  async function saveSection(sectionKey: string, payload: Partial<BrandStoryData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const existing = await res.json() as { pages: { brandStory: BrandStoryData } };
      const merged = { ...existing.pages.brandStory, ...payload };

      const saveRes = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'brandStory', data: merged }),
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
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 text-white text-sm font-medium rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">브랜드 이야기 편집</h1>
        <p className="text-gray-500 mb-8">/brand-story 공개 페이지의 콘텐츠를 관리합니다.</p>

        <div className="space-y-8">
          {/* Hero */}
          <SectionCard title="히어로 섹션" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="space-y-5">
              <LabeledInput label="섹션 태그" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
              <LabeledInput label="제목 (한글)" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
              <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
              <ImageUploadField label="배경 이미지" value={hero.heroBg} onChange={(url) => setHero({ ...hero, heroBg: url })} subdir="pages" />
            </div>
          </SectionCard>

          {/* Brand Story Tab */}
          <SectionCard title="브랜드 스토리 탭" onSave={() => saveSection('brandStoryTab', { brandStoryTab })} saving={saving === 'brandStoryTab'}>
            <div className="space-y-5">
              <LabeledInput label="헤드라인 제목" value={brandStoryTab.headlineTitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, headlineTitle: v })} />
              <LabeledInput label="헤드라인 부제목" value={brandStoryTab.headlineSubtitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, headlineSubtitle: v })} />
              <LabeledInput label="소스 태그" value={brandStoryTab.sourceTag} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceTag: v })} />
              <LabeledInput label="소스 제목" value={brandStoryTab.sourceTitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceTitle: v })} />
              <LabeledTextarea label="소스 본문" value={brandStoryTab.sourceBody} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceBody: v })} rows={5} />
            </div>
          </SectionCard>

          {/* Farms */}
          <SectionCard title="농장 목록 (브랜드/현장 탭 공통)" onSave={() => saveSection('farms', { farms })} saving={saving === 'farms'}>
            <div className="space-y-4">
              {farms.map((farm, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">농장 {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setFarms(moveItem(farms, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setFarms(moveItem(farms, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setFarms(removeItem(farms, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input placeholder="농장명 (한글)" value={farm.name} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], name: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="농장명 (베트남어)" value={farm.nameVi} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], nameVi: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="설명" value={farm.desc} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], desc: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setFarms([...farms, { name: '', nameVi: '', desc: '' }])} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                + 농장 추가
              </button>
            </div>
          </SectionCard>

          {/* Scene Tab */}
          <SectionCard title="현장 탭" onSave={() => saveSection('sceneTab', { sceneTab })} saving={saving === 'sceneTab'}>
            <div className="space-y-5">
              <LabeledInput label="태그" value={sceneTab.tag} onChange={(v) => setSceneTab({ ...sceneTab, tag: v })} />
              <LabeledInput label="제목" value={sceneTab.title} onChange={(v) => setSceneTab({ ...sceneTab, title: v })} />
              <LabeledInput label="부제목" value={sceneTab.subtitle} onChange={(v) => setSceneTab({ ...sceneTab, subtitle: v })} />
              <LabeledTextarea label="본문" value={sceneTab.body} onChange={(v) => setSceneTab({ ...sceneTab, body: v })} rows={4} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현장 이미지 (최대 3개)</label>
                <div className="space-y-3">
                  {sceneTab.images.map((img, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ImageUploadField value={img} onChange={(url) => { const n = [...sceneTab.images]; n[i] = url; setSceneTab({ ...sceneTab, images: n }); }} subdir="pages" />
                      </div>
                      <button type="button" onClick={() => setSceneTab({ ...sceneTab, images: removeItem(sceneTab.images, i) })} className="mt-2 text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5">삭제</button>
                    </div>
                  ))}
                  {sceneTab.images.length < 3 && (
                    <button type="button" onClick={() => setSceneTab({ ...sceneTab, images: [...sceneTab.images, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                      + 이미지 추가
                    </button>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* History Tab */}
          <SectionCard title="역사 탭" onSave={() => saveSection('historyTab', { historyTab })} saving={saving === 'historyTab'}>
            <div className="space-y-5">
              <LabeledInput label="태그" value={historyTab.tag} onChange={(v) => setHistoryTab({ ...historyTab, tag: v })} />
              <LabeledInput label="제목" value={historyTab.title} onChange={(v) => setHistoryTab({ ...historyTab, title: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">타임라인 시대별 항목</label>
                <div className="space-y-4">
                  {historyTab.eras.map((era, eraIdx) => (
                    <div key={eraIdx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">시대 {eraIdx + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setHistoryTab({ ...historyTab, eras: moveItem(historyTab.eras, eraIdx, eraIdx - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setHistoryTab({ ...historyTab, eras: moveItem(historyTab.eras, eraIdx, eraIdx + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setHistoryTab({ ...historyTab, eras: removeItem(historyTab.eras, eraIdx) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <input
                        placeholder="기간 (예: 1998-2001)"
                        value={era.era}
                        onChange={(e) => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], era: e.target.value }; setHistoryTab({ ...historyTab, eras: n }); }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none mb-3"
                      />
                      <div className="space-y-2">
                        {era.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-2">
                            <input
                              value={item}
                              onChange={(e) => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], items: n[eraIdx].items.map((it, ii) => ii === itemIdx ? e.target.value : it) }; setHistoryTab({ ...historyTab, eras: n }); }}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                            />
                            <button type="button" onClick={() => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], items: n[eraIdx].items.filter((_, ii) => ii !== itemIdx) }; setHistoryTab({ ...historyTab, eras: n }); }} className="text-red-400 hover:text-red-600 px-1.5 text-xs border border-red-200 rounded">삭제</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], items: [...n[eraIdx].items, ''] }; setHistoryTab({ ...historyTab, eras: n }); }} className="text-gold-600 hover:text-gold-700 text-xs font-medium">
                          + 항목 추가
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setHistoryTab({ ...historyTab, eras: [...historyTab.eras, { era: '', items: [''] }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 시대 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Certifications Tab */}
          <SectionCard title="인증 탭" onSave={() => saveSection('certificationsTab', { certificationsTab })} saving={saving === 'certificationsTab'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={certificationsTab.tag} onChange={(v) => setCertificationsTab({ ...certificationsTab, tag: v })} />
                <LabeledInput label="제목" value={certificationsTab.title} onChange={(v) => setCertificationsTab({ ...certificationsTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledInput label="부제목" value={certificationsTab.subtitle} onChange={(v) => setCertificationsTab({ ...certificationsTab, subtitle: v })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">인증 이미지 (최대 2개)</label>
                <div className="space-y-3">
                  {certificationsTab.images.map((img, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ImageUploadField value={img} onChange={(url) => { const n = [...certificationsTab.images]; n[i] = url; setCertificationsTab({ ...certificationsTab, images: n }); }} subdir="pages" />
                      </div>
                      <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, images: removeItem(certificationsTab.images, i) })} className="mt-2 text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5">삭제</button>
                    </div>
                  ))}
                  {certificationsTab.images.length < 2 && (
                    <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, images: [...certificationsTab.images, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                      + 이미지 추가
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">인증 그룹</label>
                <div className="space-y-4">
                  {certificationsTab.sections.map((section, sIdx) => (
                    <div key={sIdx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">그룹 {sIdx + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, sections: moveItem(certificationsTab.sections, sIdx, sIdx - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, sections: moveItem(certificationsTab.sections, sIdx, sIdx + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, sections: removeItem(certificationsTab.sections, sIdx) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <input placeholder="그룹 제목" value={section.title} onChange={(e) => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], title: e.target.value }; setCertificationsTab({ ...certificationsTab, sections: n }); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none mb-3" />
                      <div className="space-y-2">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-2">
                            <input value={item} onChange={(e) => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], items: n[sIdx].items.map((it, ii) => ii === itemIdx ? e.target.value : it) }; setCertificationsTab({ ...certificationsTab, sections: n }); }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                            <button type="button" onClick={() => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], items: n[sIdx].items.filter((_, ii) => ii !== itemIdx) }; setCertificationsTab({ ...certificationsTab, sections: n }); }} className="text-red-400 hover:text-red-600 px-1.5 text-xs border border-red-200 rounded">삭제</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], items: [...n[sIdx].items, ''] }; setCertificationsTab({ ...certificationsTab, sections: n }); }} className="text-gold-600 hover:text-gold-700 text-xs font-medium">
                          + 항목 추가
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, sections: [...certificationsTab.sections, { title: '', items: [''] }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 그룹 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Quality Tab */}
          <SectionCard title="품질 탭" onSave={() => saveSection('qualityTab', { qualityTab })} saving={saving === 'qualityTab'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={qualityTab.tag} onChange={(v) => setQualityTab({ ...qualityTab, tag: v })} />
                <LabeledInput label="제목" value={qualityTab.title} onChange={(v) => setQualityTab({ ...qualityTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledInput label="부제목" value={qualityTab.subtitle} onChange={(v) => setQualityTab({ ...qualityTab, subtitle: v })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">품질 이미지 (최대 2개)</label>
                <div className="space-y-3">
                  {qualityTab.images.map((img, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ImageUploadField value={img} onChange={(url) => { const n = [...qualityTab.images]; n[i] = url; setQualityTab({ ...qualityTab, images: n }); }} subdir="pages" />
                      </div>
                      <button type="button" onClick={() => setQualityTab({ ...qualityTab, images: removeItem(qualityTab.images, i) })} className="mt-2 text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5">삭제</button>
                    </div>
                  ))}
                  {qualityTab.images.length < 2 && (
                    <button type="button" onClick={() => setQualityTab({ ...qualityTab, images: [...qualityTab.images, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                      + 이미지 추가
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">중금속 항목</label>
                <div className="space-y-2">
                  {qualityTab.heavyMetals.map((metal, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={metal} onChange={(e) => { const n = [...qualityTab.heavyMetals]; n[i] = e.target.value; setQualityTab({ ...qualityTab, heavyMetals: n }); }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <button type="button" onClick={() => setQualityTab({ ...qualityTab, heavyMetals: removeItem(qualityTab.heavyMetals, i) })} className="text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5">삭제</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setQualityTab({ ...qualityTab, heavyMetals: [...qualityTab.heavyMetals, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 항목 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Process Tab */}
          <SectionCard title="생산 공정 탭" onSave={() => saveSection('processTab', { processTab })} saving={saving === 'processTab'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={processTab.tag} onChange={(v) => setProcessTab({ ...processTab, tag: v })} />
                <LabeledInput label="제목" value={processTab.title} onChange={(v) => setProcessTab({ ...processTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledInput label="부제목" value={processTab.subtitle} onChange={(v) => setProcessTab({ ...processTab, subtitle: v })} />
                </div>
                <LabeledInput label="총 시간 레이블" value={processTab.totalTimeLabel} onChange={(v) => setProcessTab({ ...processTab, totalTimeLabel: v })} />
                <LabeledInput label="총 시간 값" value={processTab.totalTimeValue} onChange={(v) => setProcessTab({ ...processTab, totalTimeValue: v })} />
                <div className="md:col-span-2">
                  <LabeledInput label="총 시간 설명" value={processTab.totalTimeDesc} onChange={(v) => setProcessTab({ ...processTab, totalTimeDesc: v })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">공정 이미지 (최대 2개)</label>
                <div className="space-y-3">
                  {processTab.images.map((img, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ImageUploadField value={img} onChange={(url) => { const n = [...processTab.images]; n[i] = url; setProcessTab({ ...processTab, images: n }); }} subdir="pages" />
                      </div>
                      <button type="button" onClick={() => setProcessTab({ ...processTab, images: removeItem(processTab.images, i) })} className="mt-2 text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5">삭제</button>
                    </div>
                  ))}
                  {processTab.images.length < 2 && (
                    <button type="button" onClick={() => setProcessTab({ ...processTab, images: [...processTab.images, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                      + 이미지 추가
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">생산 공정 단계</label>
                <div className="space-y-2">
                  {processTab.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-8 text-center text-xs text-gray-400 shrink-0">{i + 1}</span>
                      <input value={step} onChange={(e) => { const n = [...processTab.steps]; n[i] = e.target.value; setProcessTab({ ...processTab, steps: n }); }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                      <button type="button" onClick={() => setProcessTab({ ...processTab, steps: moveItem(processTab.steps, i, i - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setProcessTab({ ...processTab, steps: moveItem(processTab.steps, i, i + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setProcessTab({ ...processTab, steps: removeItem(processTab.steps, i) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProcessTab({ ...processTab, steps: [...processTab.steps, ''] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 단계 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
