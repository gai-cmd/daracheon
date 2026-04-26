'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

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
  kicker?: string;
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
  durations?: string[];
}

interface VerificationRow { num: string; label: string; meta: string }
interface VerifiedCard { step: string; title: string; en: string; body: string }
interface CertChip { mark: string; name: string; sub: string }

interface HomeData {
  hero: HomeHero;
  stats: HomeStat[];
  notice?: HomeNotice;
  agarwood?: HomeAgarwood;
  benefits?: HomeBenefits;
  process?: HomeProcess;
  verification?: VerificationRow[];
  verifiedCards?: VerifiedCard[];
  certs?: CertChip[];
}

const DEFAULT_HERO: HomeHero = {
  sectionTag: 'Verified Agarwood · 참침향',
  titleKr: '확인되는 침향, 대라천 참침향',
  subtitle:
    '베트남 직영 농장에서 25년. 원산지·원료·제조·시험까지 4단계로 검증된 침향을 프리미엄이 아니라 근거로 증명합니다.',
  heroBg:
    'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg',
  ctaPrimaryLabel: '검증 과정 보기 →',
  ctaPrimaryHref: '/brand-story',
  ctaSecondaryLabel: '제품 보기',
  ctaSecondaryHref: '/products',
};

const DEFAULT_STATS: HomeStat[] = [
  { value: '25년+', label: '연구 및 재배' },
  { value: '200ha', label: '400만 그루' },
  { value: '12건+', label: '특허 및 인증' },
  { value: '5개 지역', label: '직영 농장' },
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

const DEFAULT_AGARWOOD: HomeAgarwood = {
  tag: 'Agarwood · 신들의 나무',
  title: '수천 년을 지나온 가장 귀한 약재이자 향',
  cards: [
    {
      title: '동서양의 역사적 가치',
      description:
        '수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다.',
    },
    {
      title: '20년 이상의 긴 생육 시간',
      description:
        '20년 이상 생육된 침향나무에서 채취한 수지는 함량이 높아 약재로서 효능과 가치를 인정받습니다.',
    },
    {
      title: '논문에서 발표하는 침향',
      description:
        '침향 연구는 전 세계에서 활발히 이뤄지고 있으며, SCI급 논문도 실제 효과를 속속 보고합니다.',
    },
  ],
};

const DEFAULT_BENEFITS: HomeBenefits = {
  tag: 'Benefits · 연구 기반 효능',
  title: '침향의 가치, 여섯 가지 효능',
  items: [
    { kicker: 'Qi Circulation', title: '기 뚫고 원기 회복 · 자양강장', description: '몸속 기혈 순환으로 막힌 기를 뚫고 찬 기운을 몰아내 따뜻한 성질로 몸의 기운을 보강, 피로 해소와 활력 증진을 돕습니다.' },
    { kicker: 'Menstruation & Stamina', title: '냉감 · 정력 감퇴 · 복통에 탁월', description: '하복부 냉감, 월경불순, 남성 정력 감퇴, 잦은 소변 증상에 탁월하고, 이런 증상에 수반해 하복통 심한 사람에게 많이 활용됩니다.' },
    { title: '신경 안정 · 숙면', description: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할. 예민해진 신경을 이완시키고 심리적 안정과 불면증 개선에 효과적입니다." },
    { title: '항염 · 혈관 건강', description: '항염 작용으로 사이토카인을 억제하고 혈전을 막아, 만성 염증을 가라앉히고 혈관을 튼튼하게 합니다.' },
    { title: '뇌 질환 예방', description: '뇌혈류를 개선하고 뇌세포를 보호해, 뇌졸중·퇴행성 뇌 질환 예방 가능성을 높입니다.' },
    { title: '소화 · 복통 완화', description: '기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추게 합니다.' },
  ],
};

const DEFAULT_PROCESS: HomeProcess = {
  tag: 'Craftsmanship · 6단계 공정',
  title: '씨앗에서 완제품까지 20년이 넘는 시간',
  steps: [
    '씨앗 발아 및 묘목 육성',
    '베트남 직영 농장 식재',
    '20년 이상 오르가닉 육성',
    '특허 수지유도제 주입',
    '벌목 및 원물 정밀 채취',
    '최고급 제품 가공 및 검수',
  ],
  durations: ['6 — 12 Months', 'Ha Tinh 200ha', '20+ Years', '3 — 5 Years', 'Controlled Harvest', 'HACCP · GMP'],
};

const DEFAULT_VERIFICATION: VerificationRow[] = [
  { num: '01', label: '원산지 — 베트남 하띤 직영 200ha', meta: 'CITES' },
  { num: '02', label: '원료 — Aquilaria Agallocha Roxburgh', meta: '식약처' },
  { num: '03', label: '제조 — HACCP · GMP 시설', meta: '인증' },
  { num: '04', label: '시험 — 중금속·유해물질 0건', meta: 'LOT별' },
];

const DEFAULT_VERIFIED_CARDS: VerifiedCard[] = [
  {
    step: '01 · Origin',
    title: '학명 확인된 AAR',
    en: 'Aquilaria Agallocha Roxburgh',
    body:
      "식약처 '대한민국약전외한약(생약)규격집'에 등록된 공식 학명. 유전자(DNA) 검증으로 종 일치 확인 후에만 가공 단계로 진입합니다.",
  },
  {
    step: '02 · Process',
    title: 'HACCP·GMP 생산',
    en: 'Controlled Manufacturing',
    body:
      '원료 수령·분쇄·배합·충전·포장의 5단계 공정을 HACCP 및 GMP 시설에서 관리. 공정별 기록이 Lot 단위로 유지됩니다.',
  },
  {
    step: '03 · Evidence',
    title: 'Lot별 시험성적서',
    en: 'Per-Batch Lab Reports',
    body:
      '중금속(납·카드뮴·비소·수은)·잔류농약·유해물질 검사를 제조 Lot 단위로 실시. 결과는 제품 패키지 QR로 언제든 열람 가능합니다.',
  },
];

const DEFAULT_CERTS: CertChip[] = [
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전' },
  { mark: 'G', name: 'GMP', sub: '우수 제조' },
  { mark: 'O', name: 'ORGANIC', sub: '유기농' },
  { mark: 'V', name: '원산지', sub: '베트남 증명' },
  { mark: 'D', name: 'DNA', sub: '유전자 검증' },
  { mark: 'F', name: '식약처', sub: '고시 학명' },
  { mark: 'S', name: 'SGS', sub: '국제 검사' },
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
  const [notice, setNotice] = useState<HomeNotice>(DEFAULT_NOTICE);
  const [agarwood, setAgarwood] = useState<HomeAgarwood>(DEFAULT_AGARWOOD);
  const [benefits, setBenefits] = useState<HomeBenefits>(DEFAULT_BENEFITS);
  const [processSection, setProcessSection] = useState<HomeProcess>(DEFAULT_PROCESS);
  const [verification, setVerification] = useState<VerificationRow[]>(DEFAULT_VERIFICATION);
  const [verifiedCards, setVerifiedCards] = useState<VerifiedCard[]>(DEFAULT_VERIFIED_CARDS);
  const [certs, setCerts] = useState<CertChip[]>(DEFAULT_CERTS);

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
        if (d?.process) setProcessSection({ ...DEFAULT_PROCESS, ...d.process, steps: d.process.steps ?? [], durations: d.process.durations ?? [] });
        if (Array.isArray(d?.verification)) setVerification(d.verification);
        if (Array.isArray(d?.verifiedCards)) setVerifiedCards(d.verifiedCards);
        if (Array.isArray(d?.certs)) setCerts(d.certs);
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

      const result = await saveAdminPage('home', merged);
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">홈 편집</h1>
        <p className="mb-8 text-gray-500">/ (홈) 공개 페이지의 히어로·통계 영역을 관리합니다.</p>

        <div className="space-y-8">
          {/* Hero */}
          <SectionCard title="Hero · 메인 히어로 (확인되는 침향, 대라천 참침향)" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
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
          <SectionCard title="Trust Strip · 4 통계 (25년·400만+·200ha·8건)" onSave={() => saveSection('stats', { stats })} saving={saving === 'stats'}>
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
          <SectionCard title="Notice · 식약처 고시 기준 (4 단계 검증)" onSave={() => saveSection('notice', { notice })} saving={saving === 'notice'}>
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
          <SectionCard title="Agarwood · 신들의 나무" onSave={() => saveSection('agarwood', { agarwood })} saving={saving === 'agarwood'}>
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
          <SectionCard title="Benefits · 연구 기반 효능 (6개)" onSave={() => saveSection('benefits', { benefits })} saving={saving === 'benefits'}>
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
          <SectionCard title="Craftsmanship · 6단계 공정" onSave={() => saveSection('process', { process: processSection })} saving={saving === 'process'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="태그" value={processSection.tag} onChange={(v) => setProcessSection({ ...processSection, tag: v })} />
                <LabeledInput label="제목" value={processSection.title} onChange={(v) => setProcessSection({ ...processSection, title: v })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">공정 단계 + 소요기간 ({processSection.steps.length})</label>
                <p className="mb-2 text-xs text-gray-500">각 단계의 이름과 오른쪽에 표시될 기간·라벨을 짝으로 입력합니다.</p>
                <div className="space-y-2">
                  {processSection.steps.map((s, i) => (
                    <div key={i} className="grid grid-cols-[32px_1fr_1fr_auto] items-center gap-2">
                      <span className="text-center text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                      <input value={s} onChange={(e) => { const n = [...processSection.steps]; n[i] = e.target.value; setProcessSection({ ...processSection, steps: n }); }} placeholder="공정 단계명 (예: 씨앗 발아)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <input value={processSection.durations?.[i] ?? ''} onChange={(e) => { const n = [...(processSection.durations ?? [])]; while (n.length < processSection.steps.length) n.push(''); n[i] = e.target.value; setProcessSection({ ...processSection, durations: n }); }} placeholder="기간 라벨 (예: 6 — 12 Months)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => {
                          const ns = moveItem(processSection.steps, i, i - 1);
                          const nd = moveItem(processSection.durations ?? [], i, i - 1);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                        <button type="button" onClick={() => {
                          const ns = moveItem(processSection.steps, i, i + 1);
                          const nd = moveItem(processSection.durations ?? [], i, i + 1);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                        <button type="button" onClick={() => {
                          const ns = removeIndex(processSection.steps, i);
                          const nd = removeIndex(processSection.durations ?? [], i);
                          setProcessSection({ ...processSection, steps: ns, durations: nd });
                        }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProcessSection({ ...processSection, steps: [...processSection.steps, ''], durations: [...(processSection.durations ?? []), ''] })} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 단계 추가</button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Verification (hero 3-point card) */}
          <SectionCard title="3-Point Verification · Hero 우측 카드 (01-03)" onSave={() => saveSection('verification', { verification })} saving={saving === 'verification'}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">히어로 오른쪽 "3-Point Verification" 카드의 3줄. 번호 / 본문 / 오른쪽 메타(태그).</p>
              {verification.map((r, i) => (
                <div key={i} className="grid grid-cols-[72px_1fr_140px_auto] items-center gap-2">
                  <input value={r.num} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], num: e.target.value }; setVerification(n); }} placeholder="01" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <input value={r.label} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], label: e.target.value }; setVerification(n); }} placeholder="라벨 (예: 원산지 — 베트남 하띤 직영 200ha)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <input value={r.meta} onChange={(e) => { const n = [...verification]; n[i] = { ...n[i], meta: e.target.value }; setVerification(n); }} placeholder="메타 (예: CITES)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setVerification(moveItem(verification, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                    <button type="button" onClick={() => setVerification(moveItem(verification, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                    <button type="button" onClick={() => setVerification(removeIndex(verification, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setVerification([...verification, { num: '', label: '', meta: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 행 추가</button>
            </div>
          </SectionCard>

          {/* Verified Cards (3-step Notice section) */}
          <SectionCard title="Verified · 검증 3카드 (Origin/Process/Evidence)" onSave={() => saveSection('verifiedCards', { verifiedCards })} saving={saving === 'verifiedCards'}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">히어로 아래 "진짜 침향..." 섹션의 3단 카드. 보통 Origin / Process / Evidence 3개.</p>
              {verifiedCards.map((c, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <input value={c.step} onChange={(e) => { const n = [...verifiedCards]; n[i] = { ...n[i], step: e.target.value }; setVerifiedCards(n); }} placeholder="스텝 태그 (예: 01 · Origin)" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                    <div className="ml-2 flex gap-1">
                      <button type="button" onClick={() => setVerifiedCards(moveItem(verifiedCards, i, i - 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▲</button>
                      <button type="button" onClick={() => setVerifiedCards(moveItem(verifiedCards, i, i + 1))} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">▼</button>
                      <button type="button" onClick={() => setVerifiedCards(removeIndex(verifiedCards, i))} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                  <input value={c.title} onChange={(e) => { const n = [...verifiedCards]; n[i] = { ...n[i], title: e.target.value }; setVerifiedCards(n); }} placeholder="한글 제목 (예: 학명 확인된 AAR)" className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <input value={c.en} onChange={(e) => { const n = [...verifiedCards]; n[i] = { ...n[i], en: e.target.value }; setVerifiedCards(n); }} placeholder="영문 부제 (예: Aquilaria Agallocha Roxburgh)" className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <textarea rows={3} value={c.body} onChange={(e) => { const n = [...verifiedCards]; n[i] = { ...n[i], body: e.target.value }; setVerifiedCards(n); }} placeholder="본문 설명" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                </div>
              ))}
              <button type="button" onClick={() => setVerifiedCards([...verifiedCards, { step: '', title: '', en: '', body: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 카드 추가</button>
            </div>
          </SectionCard>

          {/* Certification Chips */}
          <SectionCard title="Certifications · 8개 인증 칩 (CITES/HACCP/...)" onSave={() => saveSection('certs', { certs })} saving={saving === 'certs'}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Verified 섹션 하단의 인증 그리드. 마크(한 글자 이니셜) · 이름 · 부제.</p>
              {certs.map((c, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_2fr_auto] items-center gap-2">
                  <input value={c.mark} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], mark: e.target.value }; setCerts(n); }} placeholder="C" maxLength={3} className="rounded-lg border border-gray-300 px-3 py-2 text-center font-serif text-sm focus:border-gold-500 focus:outline-none" />
                  <input value={c.name} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], name: e.target.value }; setCerts(n); }} placeholder="이름 (예: CITES)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <input value={c.sub} onChange={(e) => { const n = [...certs]; n[i] = { ...n[i], sub: e.target.value }; setCerts(n); }} placeholder="부제 (예: 국제 보호 수종)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none" />
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setCerts(moveItem(certs, i, i - 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▲</button>
                    <button type="button" onClick={() => setCerts(moveItem(certs, i, i + 1))} className="rounded border border-gray-200 px-2 py-1 text-xs">▼</button>
                    <button type="button" onClick={() => setCerts(removeIndex(certs, i))} className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setCerts([...certs, { mark: '', name: '', sub: '' }])} className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600">+ 인증 추가</button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
