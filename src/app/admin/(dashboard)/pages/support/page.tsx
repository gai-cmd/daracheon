'use client';

import { useEffect, useState } from 'react';

interface SupportHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

interface SupportChannel {
  num: string;
  label: string;
  title: string;
  sub: string;
  value: string;
  hint: string;
  ctaLabel: string;
  ctaHref: string;
}

interface SupportCompanyInfoRow {
  dt: string;
  dd: string;
  bold?: string;
}

interface SupportCompanyInfo {
  rows: SupportCompanyInfoRow[];
}

interface SupportMapLabel {
  title: string;
  address: string;
}

interface SupportData {
  hero: SupportHero;
  channels: SupportChannel[];
  sampleLots: string[];
  productOptions: string[];
  companyInfo: SupportCompanyInfo;
  mapLabel: SupportMapLabel;
}

const DEFAULT_HERO: SupportHero = {
  kicker: '문의하기',
  titleLine1: '무엇을',
  titleEmphasis: '도와드릴까요',
  lede:
    '제품에 대한 질문, Lot 번호 조회, 대량 주문, 베트남 직영 농장 견학 신청까지. 평일 09:00 – 18:00, 전담 담당자가 24시간 내 답변드립니다.',
};

const DEFAULT_CHANNELS: SupportChannel[] = [
  {
    num: '01 · Phone',
    label: 'Phone',
    title: '전화 문의',
    sub: '평일 09:00 – 18:00 (점심 12:00 – 13:00)\n주말 및 공휴일 휴무',
    value: '070 · 4140 · 4086',
    hint: 'Customer · 대표번호',
    ctaLabel: '지금 전화하기 →',
    ctaHref: 'tel:070-4140-4086',
  },
  {
    num: '02 · Email',
    label: 'Email',
    title: '이메일 문의',
    sub: '24시간 접수 · 평일 24시간 내 회신\n첨부파일은 10MB 이하로 부탁드립니다',
    value: 'zoel@zoellife.co.kr',
    hint: 'Business · 사업 제휴 · 대량 주문',
    ctaLabel: '메일 작성하기 →',
    ctaHref: 'mailto:zoel@zoellife.co.kr',
  },
  {
    num: '03 · KakaoTalk',
    label: 'KakaoTalk',
    title: '카카오톡 상담',
    sub: '실시간 1:1 상담 · 평일 09:00 – 18:00\n이미지·영상 첨부 가능',
    value: '@대라천ZOELLIFE',
    hint: 'Live Chat · 가장 빠른 응답',
    ctaLabel: '채팅 시작 →',
    ctaHref: '#',
  },
];

const DEFAULT_SAMPLE_LOTS = ['DRT-2024-0847', 'DRT-2024-0312', 'DRT-2023-1104'];

const DEFAULT_PRODUCT_OPTIONS = [
  '선택 안 함',
  "'참'침향 오일 캡슐",
  '대라천 침향 진액',
  '침향묵주 108염주 — 합장주',
  '침향묵주 108염주 — 평주 (라이트)',
  '침향묵주 108염주 — 대주 (더블랩)',
  '대라천 침향차 티백',
  '원니핀 데일리 캡슐',
];

const DEFAULT_COMPANY_INFO: SupportCompanyInfo = {
  rows: [
    { dt: '상호', dd: '(주)조엘라이프', bold: 'ZOEL LIFE Co., Ltd.' },
    { dt: '브랜드', dd: '대라천', bold: '大羅天 · DAERACHEON' },
    { dt: '대표자', dd: '박병주' },
    { dt: '설립일', dd: '2019년 · 연구 개시 1999년' },
    { dt: '사업자번호', dd: '749-86-03668' },
    { dt: '주소', dd: '서울특별시 금천구 벚꽃로36길 30, 1511호' },
    { dt: '전화', dd: '070 - 4140 - 4086' },
    { dt: '이메일', dd: 'bj0202@gmail.com' },
  ],
};

const DEFAULT_MAP_LABEL: SupportMapLabel = {
  title: '대라천 · ZOEL LIFE 본사',
  address: '서울 금천구 벚꽃로36길 30, 1511호',
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

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<SupportHero>(DEFAULT_HERO);
  const [channels, setChannels] = useState<SupportChannel[]>(DEFAULT_CHANNELS);
  const [sampleLots, setSampleLots] = useState<string[]>(DEFAULT_SAMPLE_LOTS);
  const [productOptions, setProductOptions] = useState<string[]>(DEFAULT_PRODUCT_OPTIONS);
  const [companyInfo, setCompanyInfo] = useState<SupportCompanyInfo>(DEFAULT_COMPANY_INFO);
  const [mapLabel, setMapLabel] = useState<SupportMapLabel>(DEFAULT_MAP_LABEL);

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
        const data = (await res.json()) as { pages?: { support?: Partial<SupportData> } };
        const d = data.pages?.support;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (Array.isArray(d?.channels) && d.channels.length > 0) setChannels(d.channels);
        if (Array.isArray(d?.sampleLots)) setSampleLots(d.sampleLots);
        if (Array.isArray(d?.productOptions)) setProductOptions(d.productOptions);
        if (d?.companyInfo?.rows) setCompanyInfo({ rows: d.companyInfo.rows });
        if (d?.mapLabel) setMapLabel({ ...DEFAULT_MAP_LABEL, ...d.mapLabel });
      } catch (err) {
        console.error('Failed to fetch support:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSection(sectionKey: string, payload: Partial<SupportData>) {
    setSaving(sectionKey);
    try {
      const res = await fetch('/api/admin/pages');
      const body = res.ok ? ((await res.json()) as { pages?: { support?: SupportData } }) : { pages: {} };
      const currentSupport = body.pages?.support ?? {
        hero: DEFAULT_HERO,
        channels: DEFAULT_CHANNELS,
        sampleLots: DEFAULT_SAMPLE_LOTS,
        productOptions: DEFAULT_PRODUCT_OPTIONS,
        companyInfo: DEFAULT_COMPANY_INFO,
        mapLabel: DEFAULT_MAP_LABEL,
      };
      const merged = { ...currentSupport, ...payload };

      const saveRes = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'support', data: merged }),
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">문의하기 편집</h1>
        <p className="mb-8 text-gray-500">/support 공개 페이지의 히어로·연락 채널·회사 정보·샘플 Lot 등을 관리합니다.</p>

        <div className="space-y-8">
          {/* HERO */}
          <SectionCard title="HERO · 문의 헤더" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
            <div className="space-y-5">
              <LabeledInput label="상단 키커 (예: 문의하기)" value={hero.kicker} onChange={(v) => setHero({ ...hero, kicker: v })} />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="제목 앞 문구 (예: 무엇을)" value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} />
                <LabeledInput label="제목 강조 문구 (예: 도와드릴까요)" value={hero.titleEmphasis} onChange={(v) => setHero({ ...hero, titleEmphasis: v })} />
              </div>
              <LabeledTextarea label="Lede 설명문" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={3} />
            </div>
          </SectionCard>

          {/* Channels */}
          <SectionCard title="Channels · 3가지 연락 채널 (Phone / Email / KakaoTalk)" onSave={() => saveSection('channels', { channels })} saving={saving === 'channels'}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">채널 3개를 권장합니다. 2줄 서브 텍스트는 줄바꿈(Enter)으로 구분하세요.</p>
              {channels.map((c, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">채널 #{i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setChannels(moveItem(channels, i, i - 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                      <button type="button" onClick={() => setChannels(moveItem(channels, i, i + 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                      <button type="button" onClick={() => setChannels(removeIndex(channels, i))} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <LabeledInput label="넘버 (예: 01 · Phone)" value={c.num} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], num: v }; setChannels(n); }} />
                      <LabeledInput label="라벨 (예: Phone)" value={c.label} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], label: v }; setChannels(n); }} />
                    </div>
                    <LabeledInput label="타이틀 (예: 전화 문의)" value={c.title} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], title: v }; setChannels(n); }} />
                    <LabeledTextarea label="서브 (2줄, 줄바꿈 적용)" value={c.sub} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], sub: v }; setChannels(n); }} rows={2} />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <LabeledInput label="값 (예: 070 · 4140 · 4086)" value={c.value} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], value: v }; setChannels(n); }} />
                      <LabeledInput label="힌트 (예: Customer · 대표번호)" value={c.hint} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], hint: v }; setChannels(n); }} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <LabeledInput label="CTA 라벨 (예: 지금 전화하기 →)" value={c.ctaLabel} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], ctaLabel: v }; setChannels(n); }} />
                      <LabeledInput label="CTA 링크 (예: tel:070-4140-4086)" value={c.ctaHref} onChange={(v) => { const n = [...channels]; n[i] = { ...n[i], ctaHref: v }; setChannels(n); }} />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setChannels([...channels, { num: '', label: '', title: '', sub: '', value: '', hint: '', ctaLabel: '', ctaHref: '' }])}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
              >
                + 채널 추가
              </button>
            </div>
          </SectionCard>

          {/* Sample Lots */}
          <SectionCard title="Sample Lots · Lot 조회 샘플 번호" onSave={() => saveSection('sampleLots', { sampleLots })} saving={saving === 'sampleLots'}>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Lot 조회 UI 아래에 버튼으로 노출되는 샘플 번호 목록.</p>
              {sampleLots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={s}
                    onChange={(e) => { const n = [...sampleLots]; n[i] = e.target.value; setSampleLots(n); }}
                    placeholder="예: DRT-2024-0847"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setSampleLots(moveItem(sampleLots, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                  <button type="button" onClick={() => setSampleLots(moveItem(sampleLots, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                  <button type="button" onClick={() => setSampleLots(removeIndex(sampleLots, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                </div>
              ))}
              <button type="button" onClick={() => setSampleLots([...sampleLots, ''])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ Lot 추가</button>
            </div>
          </SectionCard>

          {/* Product Options */}
          <SectionCard title="Product Options · 관심 제품 선택 옵션" onSave={() => saveSection('productOptions', { productOptions })} saving={saving === 'productOptions'}>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">문의 폼의 "관심 제품 / 제목" 드롭다운 옵션.</p>
              {productOptions.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p}
                    onChange={(e) => { const n = [...productOptions]; n[i] = e.target.value; setProductOptions(n); }}
                    placeholder="예: ' 참 '침향 오일 캡슐"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setProductOptions(moveItem(productOptions, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                  <button type="button" onClick={() => setProductOptions(moveItem(productOptions, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                  <button type="button" onClick={() => setProductOptions(removeIndex(productOptions, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                </div>
              ))}
              <button type="button" onClick={() => setProductOptions([...productOptions, ''])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 옵션 추가</button>
            </div>
          </SectionCard>

          {/* Company Info */}
          <SectionCard title="Company Info · 회사 정보 행" onSave={() => saveSection('companyInfo', { companyInfo })} saving={saving === 'companyInfo'}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">dt: 레이블(왼쪽), dd: 값(오른쪽), bold: 뒤에 붙는 굵은 글씨(선택).</p>
              {companyInfo.rows.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">행 #{i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setCompanyInfo({ rows: moveItem(companyInfo.rows, i, i - 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                      <button type="button" onClick={() => setCompanyInfo({ rows: moveItem(companyInfo.rows, i, i + 1) })} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                      <button type="button" onClick={() => setCompanyInfo({ rows: removeIndex(companyInfo.rows, i) })} className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      value={r.dt}
                      onChange={(e) => { const n = [...companyInfo.rows]; n[i] = { ...n[i], dt: e.target.value }; setCompanyInfo({ rows: n }); }}
                      placeholder="레이블 (예: 상호)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      value={r.dd}
                      onChange={(e) => { const n = [...companyInfo.rows]; n[i] = { ...n[i], dd: e.target.value }; setCompanyInfo({ rows: n }); }}
                      placeholder="값 (예: (주)조엘라이프)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      value={r.bold ?? ''}
                      onChange={(e) => { const n = [...companyInfo.rows]; n[i] = { ...n[i], bold: e.target.value }; setCompanyInfo({ rows: n }); }}
                      placeholder="굵은 글씨 (선택, 예: ZOEL LIFE Co., Ltd.)"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCompanyInfo({ rows: [...companyInfo.rows, { dt: '', dd: '', bold: '' }] })}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
              >
                + 행 추가
              </button>
            </div>
          </SectionCard>

          {/* Map Label */}
          <SectionCard title="Map Label · 오시는 길 표시" onSave={() => saveSection('mapLabel', { mapLabel })} saving={saving === 'mapLabel'}>
            <div className="space-y-5">
              <LabeledInput label="본사 명칭 (예: 대라천 · ZOEL LIFE 본사)" value={mapLabel.title} onChange={(v) => setMapLabel({ ...mapLabel, title: v })} />
              <LabeledInput label="주소 (예: 서울 금천구 벚꽃로36길 30, 1511호)" value={mapLabel.address} onChange={(v) => setMapLabel({ ...mapLabel, address: v })} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
