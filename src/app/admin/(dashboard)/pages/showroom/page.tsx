'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

interface GalleryItem {
  src: string;
  alt?: string;
  caption?: string;
}

interface ShowroomData {
  hero: { sectionTag: string; titleKr: string; titleEn?: string; subtitle: string; heroBg: string };
  intro: { tag: string; title: string; body: string };
  visit: { address: string; addressEn: string; hours: string; note: string };
  gallery: GalleryItem[];
}

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

function LabeledTextarea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
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
    <button type="button" onClick={onClick} disabled={loading} className="adm-btn-primary px-6">
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

const DEFAULT: ShowroomData = {
  hero: {
    sectionTag: '대라천 침향 전시장 · ZOEL LIFE Showroom',
    titleKr: "대라천 '참'침향 전시장",
    titleEn: 'Daracheon Agarwood Showroom',
    subtitle: '베트남 직영 본관 — 침향 원목·증류·시향까지 한 공간에.',
    heroBg: '',
  },
  intro: {
    tag: 'THE SHOWROOM',
    title: '천년의 향기를 직접 체험하는 공간',
    body: '',
  },
  visit: {
    address: '베트남 동나이성 직영 본관',
    addressEn: 'Dong Nai Province, Vietnam',
    hours: '연중무휴 10:00 – 18:00 (사전 예약 권장)',
    note: '한국어 통역 도슨트 동행 가능. 사전 예약은 회사소개 페이지의 문의 양식을 이용해 주세요.',
  },
  gallery: [],
};

export default function AdminShowroomPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<ShowroomData['hero']>(DEFAULT.hero);
  const [intro, setIntro] = useState<ShowroomData['intro']>(DEFAULT.intro);
  const [visit, setVisit] = useState<ShowroomData['visit']>(DEFAULT.visit);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/pages?_=${Date.now()}`, { cache: 'no-store' });
        const raw = (await res.json().catch(() => ({}))) as { pages?: { showroom?: Partial<ShowroomData> } };
        const d = raw?.pages?.showroom;
        if (d?.hero) setHero({ ...DEFAULT.hero, ...d.hero });
        if (d?.intro) setIntro({ ...DEFAULT.intro, ...d.intro });
        if (d?.visit) setVisit({ ...DEFAULT.visit, ...d.visit });
        if (Array.isArray(d?.gallery)) setGallery(d.gallery);
      } catch (err) {
        console.error('Failed to fetch showroom:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<ShowroomData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch(`/api/admin/pages?_=${Date.now()}`, { cache: 'no-store' });
      const existing = (await res.json().catch(() => ({}))) as { pages?: { showroom?: Partial<ShowroomData> } };
      const prev = existing?.pages?.showroom ?? {};
      const merged = { ...prev, ...payload };
      const result = await saveAdminPage('showroom', merged);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
    } catch (err) {
      console.error(`Save ${sectionKey} error:`, err);
      setToast({ msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
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
  function removeItem<T>(arr: T[], i: number): T[] { return arr.filter((_, idx) => idx !== i); }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">전시장(쇼룸) 편집</h1>
        <p className="text-gray-500 mb-2">/showroom 공개 페이지의 콘텐츠를 관리합니다.</p>
        <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          ℹ️ 여기서 편집하는 인트로(소개 본문) · 갤러리는 <span className="font-mono">/brand-story</span>의 <strong>03 SHOWROOM</strong> 챕터에도 동일하게 표시됩니다.
        </div>

        <div className="space-y-8">
          {/* Hero */}
          <SectionCard title="Hero · 히어로" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="space-y-5">
              <LabeledInput label="섹션 태그" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="제목 (한글)" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
                <LabeledInput label="제목 (영문)" value={hero.titleEn ?? ''} onChange={(v) => setHero({ ...hero, titleEn: v })} />
              </div>
              <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
              <ImageUploadField label="배경 이미지" value={hero.heroBg} onChange={(url) => setHero({ ...hero, heroBg: url })} subdir="showroom" />
            </div>
          </SectionCard>

          {/* Intro */}
          <SectionCard title="섹션 01 · THE SHOWROOM 소개" onSave={() => saveSection('intro', { intro })} saving={saving === 'intro'}>
            <div className="space-y-5">
              <LabeledInput label="태그" value={intro.tag} onChange={(v) => setIntro({ ...intro, tag: v })} />
              <LabeledInput label="제목" value={intro.title} onChange={(v) => setIntro({ ...intro, title: v })} />
              <LabeledTextarea label="본문" value={intro.body} onChange={(v) => setIntro({ ...intro, body: v })} rows={8} />
            </div>
          </SectionCard>

          {/* Visit */}
          <SectionCard title="방문 안내 · Visit Info" onSave={() => saveSection('visit', { visit })} saving={saving === 'visit'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="주소 (한글)" value={visit.address} onChange={(v) => setVisit({ ...visit, address: v })} />
                <LabeledInput label="주소 (영문)" value={visit.addressEn} onChange={(v) => setVisit({ ...visit, addressEn: v })} />
              </div>
              <LabeledInput label="운영시간" value={visit.hours} onChange={(v) => setVisit({ ...visit, hours: v })} />
              <LabeledTextarea label="방문 안내 메모" value={visit.note} onChange={(v) => setVisit({ ...visit, note: v })} rows={3} />
            </div>
          </SectionCard>

          {/* Gallery */}
          <SectionCard title={`갤러리 · ${gallery.length}장`} onSave={() => saveSection('gallery', { gallery })} saving={saving === 'gallery'}>
            <div className="space-y-4">
              {gallery.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">SCENE {String(i + 1).padStart(2, '0')}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setGallery(moveItem(gallery, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setGallery(moveItem(gallery, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setGallery(removeItem(gallery, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <ImageUploadField
                    value={item.src}
                    onChange={(url) => { const n = [...gallery]; n[i] = { ...n[i], src: url }; setGallery(n); }}
                    subdir="showroom"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <input
                      placeholder="alt 텍스트 (검색엔진/접근성)"
                      value={item.alt ?? ''}
                      onChange={(e) => { const n = [...gallery]; n[i] = { ...n[i], alt: e.target.value }; setGallery(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <input
                      placeholder="캡션 (선택, 호버/라이트박스에 표시)"
                      value={item.caption ?? ''}
                      onChange={(e) => { const n = [...gallery]; n[i] = { ...n[i], caption: e.target.value }; setGallery(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setGallery([...gallery, { src: '', alt: '', caption: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
              >
                + 사진 추가
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
