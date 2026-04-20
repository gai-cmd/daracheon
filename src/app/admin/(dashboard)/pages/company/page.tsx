'use client';

import { useEffect, useState } from 'react';
import { saveAdminPage } from '@/lib/adminSave';

interface CompanyChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
}

interface CompanyHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

interface CompanyData {
  hero?: CompanyHero;
  chapters?: CompanyChapter[];
}

const DEFAULT_HERO: CompanyHero = {
  kicker: '회사소개',
  titleLine1: '진짜를 증명하는 일에',
  titleEmphasis: '25년을 쓰다',
  lede:
    '대라천 ZOEL LIFE Co., Ltd. — 베트남 직영 농장 기반의 침향 전문 기업. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시 규격집에 등재된 공식 침향만을 다룹니다.',
};

const DEFAULT_CHAPTERS: CompanyChapter[] = [
  {
    num: '01',
    tag: 'About',
    title: '회사 개요',
    body: '대라천 ZOEL LIFE Co., Ltd.는 1999년 베트남 하띤 직영 농장에서 시작해, 2003년 한국에 본사를 설립한 침향 전문 기업입니다. "진짜를 증명한다"는 단 하나의 원칙으로 25년간 원산지·원료·제조·시험의 4단계 검증 체계를 구축해왔습니다.',
  },
  {
    num: '02',
    tag: 'Leadership',
    title: '창립자 · 박병주 대표',
    body: '전 식품영양학과 교수, 베트남 농업부 자문위원. 1999년 하띤에서 첫 침향나무를 만난 뒤 25년간 한 그루 한 그루의 수확까지 직접 관리해 왔습니다. 저서 《침향, 수지가 말하는 25년》(2022) — "한국 시장에 진짜 침향을 돌려놓겠다"는 약속으로 일해온 증거.',
  },
  {
    num: '03',
    tag: 'Certifications',
    title: '공식 인증 · 등록',
    body: 'CITES 등록 VN-2008-AAR-003 · 베트남 농업부 수출허가 EXP-VN-2024-112 · 식약처 건강기능식품 전문제조업 허가 · ISO 22000 식품안전경영시스템 · HACCP 인증 제조시설. 모든 인증서는 본사 또는 홈페이지 〈검증〉 메뉴에서 원본 확인이 가능합니다.',
  },
  {
    num: '04',
    tag: 'Contact',
    title: '본사 · 찾아오시는 길',
    body: '서울특별시 강남구 테헤란로 521, 파르나스타워 5층 · 지하철 2호선 삼성역 5번 출구 도보 3분. 평일 09:00~18:00 · 전화 070-4140-4086. 베트남 농장 견학은 사전 예약제로 운영되며, 문의하기 페이지에서 신청하실 수 있습니다.',
  },
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

export default function AdminCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<CompanyHero>(DEFAULT_HERO);
  const [chapters, setChapters] = useState<CompanyChapter[]>(DEFAULT_CHAPTERS);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        if (res.status === 404) return;
        const data = (await res.json()) as { pages?: { company?: CompanyData } };
        const d = data.pages?.company;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (Array.isArray(d?.chapters) && d.chapters.length > 0) setChapters(d.chapters);
      } catch (err) {
        console.error('Failed to fetch company:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<CompanyData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const body = res.ok ? ((await res.json()) as { pages?: { company?: CompanyData } }) : { pages: {} };
      const current = body.pages?.company ?? {};
      const merged: CompanyData = { ...current, ...payload };

      const result = await saveAdminPage('company', merged);
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">회사소개 편집</h1>
        <p className="mb-8 text-gray-500">/company 공개 페이지의 헤더와 4개 챕터를 관리합니다.</p>

        <div className="space-y-8">
          {/* HERO */}
          <SectionCard
            title="HERO · 회사소개 헤더"
            onSave={() => saveSection('hero', { hero })}
            saving={saving === 'hero'}
          >
            <div className="space-y-5">
              <LabeledInput label="키커 (상단 작은 태그, 예: 회사소개)" value={hero.kicker} onChange={(v) => setHero({ ...hero, kicker: v })} />
              <LabeledInput label="제목 1행" value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} />
              <LabeledInput label="제목 강조 (이탤릭 em 태그로 렌더)" value={hero.titleEmphasis} onChange={(v) => setHero({ ...hero, titleEmphasis: v })} />
              <LabeledTextarea label="lede (헤더 아래 소개 문장)" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={3} />
            </div>
          </SectionCard>

          {/* CHAPTERS */}
          <SectionCard
            title="Chapters · 회사 소개 4 챕터"
            onSave={() => saveSection('chapters', { chapters })}
            saving={saving === 'chapters'}
          >
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                각 챕터: 번호(01/02...) · 태그(About/Leadership/Certifications/Contact 등) · 제목 · 본문.
              </p>
              {chapters.map((ch, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">챕터 {i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setChapters(moveItem(chapters, i, i - 1))}
                        className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setChapters(moveItem(chapters, i, i + 1))}
                        className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => setChapters(removeIndex(chapters, i))}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr_2fr]">
                    <input
                      value={ch.num}
                      onChange={(e) => {
                        const n = [...chapters];
                        n[i] = { ...n[i], num: e.target.value };
                        setChapters(n);
                      }}
                      placeholder="번호 (예: 01)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      value={ch.tag}
                      onChange={(e) => {
                        const n = [...chapters];
                        n[i] = { ...n[i], tag: e.target.value };
                        setChapters(n);
                      }}
                      placeholder="태그 (예: About)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      value={ch.title}
                      onChange={(e) => {
                        const n = [...chapters];
                        n[i] = { ...n[i], title: e.target.value };
                        setChapters(n);
                      }}
                      placeholder="제목 (예: 회사 개요)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={ch.body}
                    onChange={(e) => {
                      const n = [...chapters];
                      n[i] = { ...n[i], body: e.target.value };
                      setChapters(n);
                    }}
                    placeholder="본문"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setChapters([
                    ...chapters,
                    { num: String(chapters.length + 1).padStart(2, '0'), tag: '', title: '', body: '' },
                  ])
                }
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
              >
                + 챕터 추가
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
