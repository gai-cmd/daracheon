'use client';

import { useCallback, useEffect, useState } from 'react';

interface EditSection {
  title: string;
  body: string; // textarea — 한 줄 = 한 항목
}
interface EditGuide {
  slug: string;
  name: string;
  image: string;
  tagline: string;
  sections: EditSection[];
}

export default function GuideAdminPage() {
  const [guides, setGuides] = useState<EditGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/guide', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success) {
        setGuides(
          (j.guides ?? []).map((g: { slug: string; name: string; image?: string; tagline?: string; sections: { title: string; body: string[] }[] }) => ({
            slug: g.slug,
            name: g.name,
            image: g.image ?? '',
            tagline: g.tagline ?? '',
            sections: (g.sections ?? []).map((s) => ({ title: s.title, body: s.body.join('\n') })),
          })),
        );
      }
    } catch {
      setToast('불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const updGuide = (i: number, p: Partial<EditGuide>) => setGuides((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...p } : g)));
  const updSection = (gi: number, si: number, p: Partial<EditSection>) =>
    setGuides((prev) => prev.map((g, idx) => (idx === gi ? { ...g, sections: g.sections.map((s, j) => (j === si ? { ...s, ...p } : s)) } : g)));
  const addSection = (gi: number) => setGuides((prev) => prev.map((g, idx) => (idx === gi ? { ...g, sections: [...g.sections, { title: '', body: '' }] } : g)));
  const removeSection = (gi: number, si: number) => setGuides((prev) => prev.map((g, idx) => (idx === gi ? { ...g, sections: g.sections.filter((_, j) => j !== si) } : g)));
  const addGuide = () => setGuides((prev) => [...prev, { slug: '', name: '', image: '', tagline: '', sections: [{ title: '섭취 방법', body: '' }] }]);
  const removeGuide = (i: number) => {
    if (!confirm('이 제품 안내를 삭제하시겠습니까?')) return;
    setGuides((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    for (const g of guides) {
      if (!g.slug.trim() || !g.name.trim()) {
        setToast('각 제품의 slug와 이름은 필수입니다.');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        guides: guides.map((g) => ({
          slug: g.slug.trim(),
          name: g.name.trim(),
          image: g.image.trim() || undefined,
          tagline: g.tagline.trim() || undefined,
          sections: g.sections.map((s) => ({ title: s.title.trim(), body: s.body.split('\n').map((b) => b.trim()).filter(Boolean) })),
        })),
      };
      const r = await fetch('/api/admin/guide', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      setToast(j?.success ? '저장되었습니다. (사이트에 즉시 반영)' : j?.message ?? '저장 실패');
    } catch {
      setToast('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제품 사용설명서</h1>
          <p className="mt-1 text-sm text-gray-600">
            복용법·원재료·보관·주의사항을 큰 글씨로 보여주는 <code className="rounded bg-gray-100 px-1">/guide</code> 페이지 내용을 편집합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/guide" target="_blank" rel="noopener noreferrer" className="adm-btn-secondary">미리보기 ↗</a>
          <button type="button" className="adm-btn-primary" disabled={saving} onClick={save}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </header>

      <p className="rounded-lg border border-gold-200 bg-gold-50/40 p-3 text-xs text-gray-600">
        ⚠️ 효능·기능성 표현은 식약처 광고 규제 대상입니다. 승인된 표현만 사용하시고, 복용법·원재료·보관·주의사항 등 사실 정보 위주로 작성하세요. 각 칸은 <b>한 줄에 한 항목</b>씩 입력합니다.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중…</p>
      ) : (
        <div className="space-y-6">
          {guides.map((g, gi) => (
            <div key={gi} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{g.name || '(제품명 없음)'}</h2>
                <button type="button" className="text-xs text-terracotta hover:underline" onClick={() => removeGuide(gi)}>제품 삭제</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">제품명</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={g.name} onChange={(e) => updGuide(gi, { name: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">slug (제품 상세 연결용 · 영문)</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" value={g.slug} onChange={(e) => updGuide(gi, { slug: e.target.value })} placeholder="daerachoen-..." />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">대표 이미지 URL (선택)</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={g.image} onChange={(e) => updGuide(gi, { image: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">한 줄 소개 (선택)</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={g.tagline} onChange={(e) => updGuide(gi, { tagline: e.target.value })} />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                {g.sections.map((s, si) => (
                  <div key={si} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium" value={s.title} onChange={(e) => updSection(gi, si, { title: e.target.value })} placeholder="섹션 제목 (예: 섭취 방법)" />
                      <button type="button" className="text-terracotta" onClick={() => removeSection(gi, si)} title="섹션 삭제">✕</button>
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} value={s.body} onChange={(e) => updSection(gi, si, { body: e.target.value })} placeholder="한 줄에 한 항목씩 입력" />
                  </div>
                ))}
                <button type="button" className="text-xs font-medium text-gold-700 hover:underline" onClick={() => addSection(gi)}>+ 섹션 추가</button>
              </div>
            </div>
          ))}
          <button type="button" className="adm-btn-secondary" onClick={addGuide}>+ 제품 안내 추가</button>
        </div>
      )}

      {toast && <div className="animate-fade-in fixed bottom-6 right-6 z-[100] rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}
