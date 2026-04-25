'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

interface ProcessHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  latLabel: string;
  lede: string;
}

interface ChapterStat {
  value: string;
  label: string;
}

interface ProcessChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  stats?: ChapterStat[];
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
}

interface ProductionVideo {
  id: string;
  title: string;
}

interface ProductionVideos {
  num: string;
  tag: string;
  title: string;
  body: string;
  items: ProductionVideo[];
}

interface CertSection {
  title: string;
  items: string[];
}

interface Certifications {
  num: string;
  tag: string;
  title: string;
  body: string;
  sections: CertSection[];
  images: string[];
}

interface ProcessData {
  hero: ProcessHero;
  chapters: ProcessChapter[];
  productionVideos: ProductionVideos;
  certifications: Certifications;
}

const DEFAULT_HERO: ProcessHero = {
  kicker: '침향 농장 이야기',
  titleLine1: '베트남 하띤의',
  titleEmphasis: '200헥타르, 25년의 시간',
  latLabel: 'Lat 18° N · Ha Tinh, Vietnam',
  lede:
    '호치민에서 북쪽으로 500km, 베트남 중부의 하띤(Ha Tinh) — 연평균 습도 84%, 해발 300~600m의 아열대 산림. 침향나무가 가장 깊은 수지를 만드는 유일한 기후. 대라천은 이곳에서 25년째 직영 농장을 운영합니다.',
};

const DEFAULT_CHAPTERS: ProcessChapter[] = [
  {
    num: '01',
    tag: 'Location',
    title: '북위 18° — 침향의 마지막 기후대',
    body: '아퀼라리아 아갈로차(Aquilaria Agallocha Roxburgh)는 북위 10°~22° 사이 아열대 산림에서만 자연 수지를 만듭니다. 베트남 하띤은 그 중에서도 연평균 강수량 2,400mm, 안개일 수 180일 — 수지가 가장 깊게 침착되는 미기후를 갖춘, 세계에서 가장 북쪽 끝 침향 산지입니다.',
    stats: [],
    imageSrc: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280',
    imageAlt: '베트남 하띤(Ha Tinh) 직영 농장',
    imageCaption: '하띤 · Ha Tinh · 메인 대규모 농장 (200ha)',
  },
  {
    num: '02',
    tag: 'Scale',
    title: '직영 200ha · 약 400만 그루',
    body: '농장은 CITES(멸종위기종 국제거래협약) 번호 VN-2008-AAR-003으로 등록된 공식 조림지. 평균 수령 18년 이상의 성숙목 400만 그루가 자연 침착 환경에서 자라고 있으며, 매년 평균 180그루만 수확합니다.',
    stats: [
      { value: '200', label: 'ha' },
      { value: '4M', label: 'trees' },
    ],
    imageSrc: 'https://lh3.googleusercontent.com/d/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA=w1280',
    imageAlt: '동나이(Dong Nai) 전략 재배 거점',
    imageCaption: '동나이 · Dong Nai · 전략 재배 거점',
  },
  {
    num: '03',
    tag: 'Partnership',
    title: '현지 공동체와의 25년',
    body: '농장의 관리는 하띤 지역 62가구의 현지 파트너 가족이 맡고 있습니다. 25년간 함께 일해온 이들에게는 한국 본사와 동일한 의료·교육 복지를 제공합니다. "진짜 침향은 사람과 자연 모두가 건강할 때만 만들어집니다" — 박병주 대표의 원칙.',
    stats: [{ value: '62', label: 'families' }],
    imageSrc: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280',
    imageAlt: '냐짱(Nha Trang) 고품질 원료 산지',
    imageCaption: '냐짱 · Nha Trang · 고품질 원료 산지',
  },
  {
    num: '04',
    tag: 'Verification',
    title: '4단계 원산지 검증',
    body: 'GPS 좌표로 나무마다 위치를 기록하고, 수확할 때 나무 ID·수지 함량을 DB에 입력합니다. 베트남 농업부 검사증을 받은 뒤 한국 식약처 수입 통관 시 한 번 더 검증합니다. 제품 Lot 번호로 이 모든 이력을 누구나 조회할 수 있습니다.',
    stats: [{ value: '4', label: 'steps' }],
    imageSrc: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    imageAlt: '람동(Lam Dong) 고산지대 특화 농장',
    imageCaption: '람동 · Lam Dong · 고산지대 특화 농장',
  },
];

const DEFAULT_VIDEOS: ProductionVideos = {
  num: '05',
  tag: 'Videos',
  title: '생산 영상 — 농장 현장',
  body: '베트남 5개 성 직영 농장에서 식목부터 25년 자연 숙성까지, Aquilaria Agallocha Roxburgh의 하루를 영상으로 공개합니다.',
  items: [
    { id: '1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g', title: '하띤성 대규모 재배지 드론 촬영' },
    { id: '1oKXg0SyCbFy63C8hzQrPBs7THV4xIROE', title: '침향나무 식목·관수 루틴' },
    { id: '1p8OQBwzt57lH6mF8zZFDMuAGttqNATze', title: '동나이성 전략 재배 거점' },
    { id: '1IuUk2qrtyhE831wIZhFZkGngDx_hfON7', title: '냐짱 고품질 원료 산지' },
    { id: '1dBm27G-X2cLWy5ISGCMcpRXRzsFlLlwg', title: '푸국 해양성 기후 재배지' },
    { id: '13zJY7WQ6rVNQVAROdcgle4M5FQhvQ1fJ', title: '람동 고산지대 특화 농장' },
  ],
};

const DEFAULT_CERTS: Certifications = {
  num: '06',
  tag: 'Certifications',
  title: '신뢰의 지표 — 국제가 인정하는 품질',
  body: 'CITES 국제거래 인증부터 TSL ISO/IEC 17025:2017 안전성 시험, 중금속 8종 전부 불검출까지. 대라천의 모든 제품은 Lot 번호로 이력을 조회할 수 있습니다.',
  sections: [
    { title: '국제 거래 및 기술 특허', items: ['CITES IIA-DNI-007', '수지유도 특허 #12835'] },
    { title: '품질 보증', items: ['Organic', 'HACCP', 'OCOP', '2025 아시아 10대 브랜드'] },
    { title: '안전성 시험', items: ['TSL ISO/IEC 17025:2017', '중금속 8종 전부 불검출'] },
  ],
  images: [
    '/uploads/misc/kfda-doc-1.jpg',
    '/uploads/misc/kfda-doc-2.jpg',
    '/uploads/misc/kfda-doc-3.jpg',
    '/uploads/misc/kfda-doc-4.jpg',
  ],
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

export default function AdminProcessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<ProcessHero>(DEFAULT_HERO);
  const [chapters, setChapters] = useState<ProcessChapter[]>(DEFAULT_CHAPTERS);
  const [videos, setVideos] = useState<ProductionVideos>(DEFAULT_VIDEOS);
  const [certs, setCerts] = useState<Certifications>(DEFAULT_CERTS);

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
          return;
        }
        const data = (await res.json()) as { pages?: { process?: Partial<ProcessData> } };
        const d = data.pages?.process;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (Array.isArray(d?.chapters) && d.chapters.length > 0) {
          setChapters(
            d.chapters.map((c) => ({
              num: c.num ?? '',
              tag: c.tag ?? '',
              title: c.title ?? '',
              body: c.body ?? '',
              stats: c.stats ?? [],
              imageSrc: c.imageSrc ?? '',
              imageAlt: c.imageAlt ?? '',
              imageCaption: c.imageCaption ?? '',
            })),
          );
        }
        if (d?.productionVideos) {
          setVideos({ ...DEFAULT_VIDEOS, ...d.productionVideos, items: d.productionVideos.items ?? [] });
        }
        if (d?.certifications) {
          setCerts({
            ...DEFAULT_CERTS,
            ...d.certifications,
            sections: d.certifications.sections ?? [],
            images: d.certifications.images ?? [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch process:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<ProcessData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const body = res.ok ? ((await res.json()) as { pages?: { process?: ProcessData } }) : { pages: {} };
      const currentProcess = body.pages?.process ?? { hero: DEFAULT_HERO, chapters: DEFAULT_CHAPTERS, productionVideos: DEFAULT_VIDEOS, certifications: DEFAULT_CERTS };
      const merged = { ...currentProcess, ...payload };

      const result = await saveAdminPage('process', merged);
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">생산 공정 · 농장 편집</h1>
        <p className="mb-8 text-gray-500">/process 공개 페이지의 히어로 · 챕터 · 영상 · 인증서를 관리합니다.</p>

        <div className="space-y-8">
          {/* HERO */}
          <SectionCard title="HERO · 농장 스토리 헤더" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="space-y-5">
              <LabeledInput label="상단 kicker (예: 침향 농장 이야기)" value={hero.kicker} onChange={(v) => setHero({ ...hero, kicker: v })} />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="제목 1행" value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} />
                <LabeledInput label="제목 강조 (em)" value={hero.titleEmphasis} onChange={(v) => setHero({ ...hero, titleEmphasis: v })} />
              </div>
              <LabeledInput label="좌표 라벨 (예: Lat 18° N · Ha Tinh, Vietnam)" value={hero.latLabel} onChange={(v) => setHero({ ...hero, latLabel: v })} />
              <LabeledTextarea label="리드 본문 (lede)" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={4} />
            </div>
          </SectionCard>

          {/* CHAPTERS */}
          <SectionCard title="Chapters · 농장 챕터 (4개 권장)" onSave={() => saveSection('chapters', { chapters })} saving={saving === 'chapters'}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">챕터마다 번호 · 태그 · 제목 · 본문 · 통계 배열 · 이미지(URL/alt/caption).</p>
              {chapters.map((ch, ci) => (
                <div key={ci} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">챕터 {ci + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setChapters(moveItem(chapters, ci, ci - 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                      <button type="button" onClick={() => setChapters(moveItem(chapters, ci, ci + 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                      <button type="button" onClick={() => setChapters(removeIndex(chapters, ci))} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <input value={ch.num} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], num: e.target.value }; setChapters(n); }} placeholder="번호 (예: 01)" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <input value={ch.tag} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], tag: e.target.value }; setChapters(n); }} placeholder="태그 (예: Location)" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <input value={ch.title} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], title: e.target.value }; setChapters(n); }} placeholder="제목" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    </div>
                    <textarea rows={4} value={ch.body} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], body: e.target.value }; setChapters(n); }} placeholder="본문" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />

                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700">통계 ({(ch.stats ?? []).length})</label>
                      <div className="space-y-2">
                        {(ch.stats ?? []).map((s, si) => (
                          <div key={si} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                            <input value={s.value} onChange={(e) => { const n = [...chapters]; const stats = [...(n[ci].stats ?? [])]; stats[si] = { ...stats[si], value: e.target.value }; n[ci] = { ...n[ci], stats }; setChapters(n); }} placeholder="값 (예: 200)" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                            <input value={s.label} onChange={(e) => { const n = [...chapters]; const stats = [...(n[ci].stats ?? [])]; stats[si] = { ...stats[si], label: e.target.value }; n[ci] = { ...n[ci], stats }; setChapters(n); }} placeholder="라벨 (예: ha)" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                            <div className="flex gap-1">
                              <button type="button" onClick={() => { const n = [...chapters]; n[ci] = { ...n[ci], stats: moveItem(n[ci].stats ?? [], si, si - 1) }; setChapters(n); }} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs">▲</button>
                              <button type="button" onClick={() => { const n = [...chapters]; n[ci] = { ...n[ci], stats: moveItem(n[ci].stats ?? [], si, si + 1) }; setChapters(n); }} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs">▼</button>
                              <button type="button" onClick={() => { const n = [...chapters]; n[ci] = { ...n[ci], stats: removeIndex(n[ci].stats ?? [], si) }; setChapters(n); }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => { const n = [...chapters]; n[ci] = { ...n[ci], stats: [...(n[ci].stats ?? []), { value: '', label: '' }] }; setChapters(n); }} className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 통계 추가</button>
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <label className="mb-2 block text-xs font-medium text-gray-700">이미지</label>
                      <ImageUploadField value={ch.imageSrc ?? ''} onChange={(url) => { const n = [...chapters]; n[ci] = { ...n[ci], imageSrc: url }; setChapters(n); }} subdir="pages" />
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input value={ch.imageAlt ?? ''} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], imageAlt: e.target.value }; setChapters(n); }} placeholder="이미지 alt" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <input value={ch.imageCaption ?? ''} onChange={(e) => { const n = [...chapters]; n[ci] = { ...n[ci], imageCaption: e.target.value }; setChapters(n); }} placeholder="이미지 caption" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setChapters([...chapters, { num: '', tag: '', title: '', body: '', stats: [], imageSrc: '', imageAlt: '', imageCaption: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 챕터 추가</button>
            </div>
          </SectionCard>

          {/* PRODUCTION VIDEOS */}
          <SectionCard title="Production Videos · 농장 현장 영상" onSave={() => saveSection('productionVideos', { productionVideos: videos })} saving={saving === 'productionVideos'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="번호 (예: 05)" value={videos.num} onChange={(v) => setVideos({ ...videos, num: v })} />
                <LabeledInput label="태그 (예: Videos)" value={videos.tag} onChange={(v) => setVideos({ ...videos, tag: v })} />
              </div>
              <LabeledInput label="섹션 제목" value={videos.title} onChange={(v) => setVideos({ ...videos, title: v })} />
              <LabeledTextarea label="섹션 본문" value={videos.body} onChange={(v) => setVideos({ ...videos, body: v })} rows={3} />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">영상 항목 ({videos.items.length})</label>
                <p className="mb-2 text-xs text-gray-500">Google Drive file id + 제목. 임베드 URL: drive.google.com/file/d/&lt;id&gt;/preview</p>
                <div className="space-y-2">
                  {videos.items.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                      <input value={v.id} onChange={(e) => { const n = [...videos.items]; n[i] = { ...n[i], id: e.target.value }; setVideos({ ...videos, items: n }); }} placeholder="Drive file id" className="rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:border-gold-500 focus:outline-none" />
                      <input value={v.title} onChange={(e) => { const n = [...videos.items]; n[i] = { ...n[i], title: e.target.value }; setVideos({ ...videos, items: n }); }} placeholder="영상 제목" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setVideos({ ...videos, items: moveItem(videos.items, i, i - 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                        <button type="button" onClick={() => setVideos({ ...videos, items: moveItem(videos.items, i, i + 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                        <button type="button" onClick={() => setVideos({ ...videos, items: removeIndex(videos.items, i) })} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setVideos({ ...videos, items: [...videos.items, { id: '', title: '' }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 영상 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* CERTIFICATIONS */}
          <SectionCard title="Certifications · 신뢰의 지표" onSave={() => saveSection('certifications', { certifications: certs })} saving={saving === 'certifications'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="번호 (예: 06)" value={certs.num} onChange={(v) => setCerts({ ...certs, num: v })} />
                <LabeledInput label="태그 (예: Certifications)" value={certs.tag} onChange={(v) => setCerts({ ...certs, tag: v })} />
              </div>
              <LabeledInput label="섹션 제목" value={certs.title} onChange={(v) => setCerts({ ...certs, title: v })} />
              <LabeledTextarea label="섹션 본문" value={certs.body} onChange={(v) => setCerts({ ...certs, body: v })} rows={3} />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">인증 섹션 ({certs.sections.length})</label>
                <div className="space-y-3">
                  {certs.sections.map((sec, si) => (
                    <div key={si} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <input value={sec.title} onChange={(e) => { const n = [...certs.sections]; n[si] = { ...n[si], title: e.target.value }; setCerts({ ...certs, sections: n }); }} placeholder="섹션 제목 (예: 국제 거래 및 기술 특허)" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                        <div className="ml-2 flex gap-1">
                          <button type="button" onClick={() => setCerts({ ...certs, sections: moveItem(certs.sections, si, si - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                          <button type="button" onClick={() => setCerts({ ...certs, sections: moveItem(certs.sections, si, si + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                          <button type="button" onClick={() => setCerts({ ...certs, sections: removeIndex(certs.sections, si) })} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {sec.items.map((it, ii) => (
                          <div key={ii} className="flex items-center gap-2">
                            <input value={it} onChange={(e) => { const ns = [...certs.sections]; const items = [...ns[si].items]; items[ii] = e.target.value; ns[si] = { ...ns[si], items }; setCerts({ ...certs, sections: ns }); }} placeholder="항목 (예: CITES IIA-DNI-007)" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                            <button type="button" onClick={() => { const ns = [...certs.sections]; ns[si] = { ...ns[si], items: moveItem(ns[si].items, ii, ii - 1) }; setCerts({ ...certs, sections: ns }); }} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                            <button type="button" onClick={() => { const ns = [...certs.sections]; ns[si] = { ...ns[si], items: moveItem(ns[si].items, ii, ii + 1) }; setCerts({ ...certs, sections: ns }); }} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                            <button type="button" onClick={() => { const ns = [...certs.sections]; ns[si] = { ...ns[si], items: removeIndex(ns[si].items, ii) }; setCerts({ ...certs, sections: ns }); }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => { const ns = [...certs.sections]; ns[si] = { ...ns[si], items: [...ns[si].items, ''] }; setCerts({ ...certs, sections: ns }); }} className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 항목 추가</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCerts({ ...certs, sections: [...certs.sections, { title: '', items: [] }] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 섹션 추가</button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">인증서 이미지 ({certs.images.length})</label>
                <p className="mb-2 text-xs text-gray-500">업로드 또는 직접 URL. 공개 페이지에선 3:4 비율 그리드로 표시됩니다.</p>
                <div className="space-y-3">
                  {certs.images.map((img, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-gray-200 bg-white p-3">
                      <div className="flex-1">
                        <ImageUploadField value={img} onChange={(url) => { const n = [...certs.images]; n[i] = url; setCerts({ ...certs, images: n }); }} subdir="pages" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => setCerts({ ...certs, images: moveItem(certs.images, i, i - 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                        <button type="button" onClick={() => setCerts({ ...certs, images: moveItem(certs.images, i, i + 1) })} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                        <button type="button" onClick={() => setCerts({ ...certs, images: removeIndex(certs.images, i) })} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCerts({ ...certs, images: [...certs.images, ''] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 이미지 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
