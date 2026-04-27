'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

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
  description?: string;
  tag?: string;
  link?: string;
  authors?: string;
}

interface AuthenticitySource { label: string; value: string; }
interface AuthenticityDoc { doc: string; desc: string; highlight?: boolean; }
interface AuthenticityTabData {
  subtitle: string;
  intro: string;
  check01Title: string;
  check01Body: string;
  check01Sources: AuthenticitySource[];
  check02Title: string;
  check02Body: string;
  check02QuoteSource: string;
  check02QuoteBody: string;
  check03Title: string;
  check03Body: string;
  check03Docs: AuthenticityDoc[];
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
  registrySection?: {
    title: string;
    subtitle?: string;
    rows: Array<{ label: string; value: string }>;
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
  authenticityTab?: AuthenticityTabData;
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

/** Divider that mirrors the frontend tab bar on /about-agarwood. */
function TabGroupHeader({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full bg-gold-500 px-3 text-xs font-semibold tracking-wider text-white">
        탭 {index}
      </span>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <div className="flex-1 border-t border-gold-500/30" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AdminAboutAgarwoodPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* state — 초기값은 frontend AboutAgarwoodClient.tsx 의 하드코딩 fallback과 동일.
     CMS 데이터가 있으면 fetchData 에서 덮어씁니다. */
  const [hero, setHero] = useState<AboutAgarwoodData['hero']>({
    sectionTag: 'Agarwood Story · 침향 이야기',
    titleKr: '이젠 진짜 침향,',
    titleEn: '학명부터 확인하세요',
    subtitle:
      "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'. 두 곳에 공식 등재된 바로 그 침향 — Aquilaria Agallocha Roxburgh.",
    heroImage: '',
  });
  const [registrySection, setRegistrySection] = useState<NonNullable<AboutAgarwoodData['registrySection']>>({
    title: '대한민국약전외한약(생약)규격집',
    subtitle: '공식 등재',
    rows: [
      { label: '정식명', value: '침수향(沈水香), AQUILARIAE LIGNUM' },
      { label: '학명', value: 'Aquilaria Agallocha Roxburgh' },
      { label: '과명', value: '팥꽃나무과 Thymeleaceae' },
      { label: '정의', value: '이 약은 침향나무의 수지가 침착된 수간목이다' },
      { label: '성상', value: '흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있다' },
      { label: '기준', value: '건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상' },
      { label: '특징', value: '흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다' },
    ],
  });
  const [definitionSection, setDefinitionSection] = useState<AboutAgarwoodData['definitionSection']>({
    title: '침향(沈香)이란 무엇인가?',
    subtitle: '자연이 수십 년에 걸쳐 빚어낸 신비의 향, 물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)',
    body: '침향(沈香, Agarwood)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지(樹脂)가 수십 년간 나무 속에 쌓여 굳은 향목(香木)입니다.',
    officialNameCallout: '아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)',
  });
  const [formationSteps, setFormationSteps] = useState<FormationStep[]>([
    { step: '01', title: '외부 자극', description: '침향나무가 외부 상처나 곰팡이 감염 등 자극을 받습니다.' },
    { step: '02', title: '수지 분비', description: '상처 치유를 위해 나무 스스로 방어 수지를 분비합니다.' },
    { step: '03', title: '침착', description: '분비된 수지가 수십 년에 걸쳐 나무 내부에 서서히 침착됩니다.' },
    { step: '04', title: '형성', description: '수지가 충분히 침착된 부분이 향목 — 침향이 됩니다.' },
  ]);
  const [specialReasons, setSpecialReasons] = useState<SpecialReason[]>([
    { title: '수십 년의 시간', description: '20년 이상의 긴 시간이 만들어낸 자연의 결정체입니다.' },
    { title: '희귀한 수지', description: '전 세계적으로 생산량이 제한된 귀한 향목입니다.' },
    { title: '학명 기반 품질', description: '식약처 고시 학명 Aquilaria Agallocha Roxburgh.' },
    { title: '동서양 의학서', description: '동의보감·본초강목 등 수천 년간 약재로 기록.' },
  ]);
  const [benefits, setBenefits] = useState<Benefit[]>([
    { title: '기혈 순환', description: '막힌 기를 뚫어 오장육부 기능을 정상화합니다.' },
    { title: '자양강장', description: '찬 기운을 몰아내고 몸을 따뜻하게 보강합니다.' },
    { title: '신경 안정', description: '예민한 신경을 이완시키고 숙면에 도움.' },
    { title: '항염 · 혈관', description: '염증 억제와 혈관 건강 증진.' },
    { title: '뇌 건강', description: '뇌혈류 개선과 뇌세포 보호.' },
    { title: '소화 · 복통', description: '위를 따뜻하게 하여 소화 기능 개선.' },
  ]);
  const [authenticityTab, setAuthenticityTab] = useState<AuthenticityTabData>({
    subtitle: '진짜가 아닌 가짜가 판치는 시장, 이 세 가지로 반드시 확인하세요.',
    intro: '한국에도 많은 침향 제품들이 소개됐지만, 중요한 건 오리지널에 대한 정의입니다. 가짜가 아닌 진짜를 찾아야 하는데 이에 대한 기준이 모호한 것이 현실입니다. 진짜 침향은 크게 세 가지 방법 — 학명, 산지, 증빙문서 — 으로 확인할 수 있습니다.',
    check01Title: '학명을 따져봐야 한다',
    check01Body: '대한민국 정부의 공식문서 4곳에서 동일하게 등록된 침향은 Aquilaria Agallocha Roxburgh (아퀼라리아 아갈로차 록스버그)입니다.',
    check01Sources: [
      { label: '대한민국약전외한약(생약)규격집', value: '침향의 학명을 Aquilaria Agallocha Roxburgh로 명확히 정의.' },
      { label: '식약처 식품공전', value: '식용 가능한 침향의 학명 2종 — Aquilaria Agallocha Roxburgh / Aquilaria Malaccensis Lam.' },
      { label: '식약처 한약재 관능검사 해설서', value: '침향나무를 Aquilaria Agallocha Roxburgh로 정의.' },
      { label: '한국한의학연구원 한약자원연구센터', value: '침향을 상록교목 Aquilaria Agallocha Roxburgh로 설명.' },
    ],
    check02Title: '산지를 따져봐야 한다',
    check02Body: '고문헌들이 기록한 최고 산지는 역사적으로 베트남산이 가장 높은 품질을 인정받고 있으며, 현재도 가장 비싸게 거래됩니다.',
    check02QuoteSource: '향승(香乘) · 명대 1611년',
    check02QuoteBody: '명대의 주가조가 향에 관해 기록한 책. 침향의 품질을 산지별로 상세히 기록하며 최상품은 진랍(眞臘), 상품은 점성(占城)으로 구분했는데 이는 당시 베트남 중부지역을 말합니다. 이 외에도 교지(交趾), 안남(安南) 등 베트남 원산지를 최상품으로 기록합니다.',
    check03Title: '문서를 따져봐야 한다',
    check03Body: '진짜 침향이라면 아래 증빙 서류를 갖추고 있어야 합니다. 특히 CITES 인증서는 합법 원료 100% 보증 — 가짜 침향은 CITES 통과 불가능합니다.',
    check03Docs: [
      { doc: '원산지 증명서', desc: '베트남 정통 산지임을 확인', highlight: false },
      { doc: '정식 수입 증빙 서류', desc: '정상적인 통관·검역·수입 확인', highlight: false },
      { doc: '유기농 인증서', desc: '식용 가능 여부, 농약·화학물질 관리 확인', highlight: false },
      { doc: 'CITES 인증서', desc: '합법 원료 100% 보증. 가짜 침향은 통과 불가능', highlight: true },
      { doc: '성분검사서', desc: '실제 침향 성분 함량 확인', highlight: false },
      { doc: '유해물질성적서', desc: '중금속·잔류 농약·미생물 등 확인', highlight: false },
    ],
  });
  const [literatures, setLiteratures] = useState<Literature[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [cta, setCta] = useState<AboutAgarwoodData['cta']>({
    title: '침향의 세계가 궁금하시다면',
    buttonProducts: '제품 보기',
    buttonProductsHref: '/products',
    buttonBrand: '브랜드 스토리',
    buttonBrandHref: '/brand-story',
  });
  const [mediaTab, setMediaTab] = useState<NonNullable<AboutAgarwoodData['mediaTab']>>({
    tag: 'In the Media · 매체',
    title: '매체에 실린 침향',
    subtitle: '주요 매체와 기관에서 조명한 대라천 침향의 이야기. 25년의 기록과 공식 인증을 확인하세요.',
    items: [
      {
        outlet: '한국경제',
        date: '2025.11',
        title: '25년의 기록 — 대라천, 200ha 침향 숲을 일구다',
        summary: '1998년 캄보디아에서 시작된 침향 여정, 베트남 하띤성 200ha 부지 400만 그루의 직영 농장으로 성장한 대라천의 이야기.',
      },
      {
        outlet: '한국디자인진흥원',
        date: '2026.01',
        title: '라이프스타일 브랜드 인증 — 조엘라이프',
        summary: '침향 원료의 프리미엄 라이프스타일 브랜드로서 정체성과 디자인 완성도를 인정받아 공식 인증 획득.',
      },
      {
        outlet: '식품의약품안전처',
        date: '2026.02',
        title: '건강기능식품 규격 부합 — Aquilaria Agallocha Roxburgh',
        summary: '식약처 고시 공식 학명에 등재된 진짜 침향. 대한민국약전외한약(생약)규격집과 식품공전, 두 곳에 공식 등록된 원료.',
      },
    ],
  });
  const [testimonialsTab, setTestimonialsTab] = useState<NonNullable<AboutAgarwoodData['testimonialsTab']>>({
    tag: 'Testimonials · 후기',
    title: '고객이 남긴 침향',
    subtitle: '대라천 침향을 경험한 고객들의 진솔한 이야기. 세월이 빚어낸 향이 일상에 남긴 흔적입니다.',
    items: [
      {
        name: '김*선',
        role: '60대 · 직장인',
        rating: 5,
        body: '매일 아침 한 알씩 꾸준히 복용했더니 기력이 확연히 좋아졌습니다. 특히 환절기에도 컨디션이 안정적으로 유지되어 놀라웠어요.',
        product: '대라천 참침향환',
      },
      {
        name: '박*호',
        role: '50대 · 자영업',
        rating: 5,
        body: '잠을 제대로 이루지 못해 고민이 많았는데, 침향을 꾸준히 복용하면서 숙면에 도움을 받고 있습니다. 자연의 힘을 느낍니다.',
        product: '대라천 침향 오일',
      },
      {
        name: '이*영',
        role: '70대 · 주부',
        rating: 5,
        body: '손자가 선물해 준 침향환을 어머님께 드렸더니 매우 좋아하셨습니다. 어르신 선물로 이만한 게 없다고 생각합니다.',
        product: '대라천 참침향환 프리미엄',
      },
      {
        name: '정*현',
        role: '40대 · 직장인',
        rating: 4,
        body: '학명(Aquilaria Agallocha Roxburgh)을 직접 확인하고 구매했습니다. 진짜 침향의 그윽한 향과 품질에 만족하고 있어요.',
        product: '대라천 침향 오일',
      },
    ],
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
        // pages / aboutAgarwood 누락 시 TypeError 방지 — brandStory 와 동일 패턴.
        const raw = (await res.json().catch(() => ({}))) as {
          pages?: { aboutAgarwood?: Partial<AboutAgarwoodData> };
        };
        const d = raw?.pages?.aboutAgarwood;
        if (!d) {
          setLoading(false);
          return;
        }
        // CMS 데이터가 있으면 그것 사용, 없으면 초기값(=frontend fallback) 유지
        if (d.hero) setHero(d.hero);
        if (d.definitionSection) setDefinitionSection(d.definitionSection);
        if (d.registrySection) setRegistrySection(d.registrySection);
        if (d.formationSteps && d.formationSteps.length > 0) setFormationSteps(d.formationSteps);
        if (d.specialReasons && d.specialReasons.length > 0) setSpecialReasons(d.specialReasons);
        if (d.benefits && d.benefits.length > 0) setBenefits(d.benefits);
        if (d.authenticityTab) setAuthenticityTab(d.authenticityTab);
        setLiteratures(d.literatures ?? []);
        setPapers(d.papers ?? []);
        if (d.cta) setCta(d.cta);
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
      const existing = (await res.json().catch(() => ({}))) as {
        pages?: { aboutAgarwood?: Partial<AboutAgarwoodData> };
      };
      const prev = existing?.pages?.aboutAgarwood ?? {};
      const merged = { ...prev, ...payload };

      const result = await saveAdminPage('aboutAgarwood', merged);
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

  const ADMIN_TABS = ['침향이란?', '진짜 침향 구별 방법', '문헌에 실린 침향', '논문에 실린 침향', '매체에 실린 침향', '고객이 남긴 침향'];

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

        {/* Admin Tab Bar */}
        <div className="flex gap-0 flex-wrap border-b border-gray-200 mb-8 overflow-x-auto">
          {ADMIN_TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveAdminTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeAdminTab === i
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-8">
          {activeAdminTab === 0 && (<>

          {/* Hero */}
          <SectionCard title="Hero · 히어로" onSave={() => saveSection('hero', { hero })} saving={saving === 'hero'}>
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
          <SectionCard title="Chapter I · Definition · 침향(沈香)이란 무엇인가?" onSave={() => saveSection('definition', { definitionSection })} saving={saving === 'definition'}>
            <div className="space-y-5">
              <LabeledInput label="섹션 제목" value={definitionSection.title} onChange={(v) => setDefinitionSection({ ...definitionSection, title: v })} />
              <LabeledInput label="부제목 (이탤릭)" value={definitionSection.subtitle} onChange={(v) => setDefinitionSection({ ...definitionSection, subtitle: v })} />
              <LabeledTextarea label="본문" value={definitionSection.body} onChange={(v) => setDefinitionSection({ ...definitionSection, body: v })} rows={4} />
              <LabeledTextarea label="공식명 콜아웃 텍스트" value={definitionSection.officialNameCallout} onChange={(v) => setDefinitionSection({ ...definitionSection, officialNameCallout: v })} rows={2} />
            </div>
          </SectionCard>

          {/* Registry Section (Chapter II) */}
          <SectionCard title="Chapter II · Registry · 대한민국약전외한약(생약)규격집 공식 등재" onSave={() => saveSection('registrySection', { registrySection })} saving={saving === 'registrySection'}>
            <div className="space-y-5">
              <LabeledInput label="제목 (굵게)" value={registrySection.title} onChange={(v) => setRegistrySection({ ...registrySection, title: v })} />
              <LabeledInput label="부제목 (이탤릭)" value={registrySection.subtitle ?? ''} onChange={(v) => setRegistrySection({ ...registrySection, subtitle: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">규격 항목 (label + value)</label>
                <div className="space-y-3">
                  {registrySection.rows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
                      <input
                        type="text"
                        placeholder="항목명 (예: 학명)"
                        value={row.label}
                        onChange={(e) => {
                          const n = [...registrySection.rows];
                          n[i] = { ...n[i], label: e.target.value };
                          setRegistrySection({ ...registrySection, rows: n });
                        }}
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none flex-shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="값 (예: Aquilaria Agallocha Roxburgh)"
                        value={row.value}
                        onChange={(e) => {
                          const n = [...registrySection.rows];
                          n[i] = { ...n[i], value: e.target.value };
                          setRegistrySection({ ...registrySection, rows: n });
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRegistrySection({ ...registrySection, rows: registrySection.rows.filter((_, ii) => ii !== i) })}
                        className="text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5 mt-1"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRegistrySection({ ...registrySection, rows: [...registrySection.rows, { label: '', value: '' }] })}
                    className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                  >
                    + 규격 항목 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Formation Steps */}
          <SectionCard title="Chapter III · Formation · 침향은 어떻게 만들어지나요?" onSave={() => saveSection('formationSteps', { formationSteps })} saving={saving === 'formationSteps'}>
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
          <SectionCard title="Chapter IV · Why Special · 침향이 특별한 4가지 이유" onSave={() => saveSection('specialReasons', { specialReasons })} saving={saving === 'specialReasons'}>
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
          <SectionCard title="Chapter V · Benefits · 침향의 효능에 주목!" onSave={() => saveSection('benefits', { benefits })} saving={saving === 'benefits'}>
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

          {/* CTA */}
          <SectionCard title="CTA · 하단 콜아웃" onSave={() => saveSection('cta', { cta })} saving={saving === 'cta'}>
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

          </>)}
          {activeAdminTab === 1 && (<>

          {/* Authenticity Tab */}
          <SectionCard title="진짜 침향 구별 방법 · 감별 3단계" onSave={() => saveSection('authenticityTab', { authenticityTab })} saving={saving === 'authenticityTab'}>
            <div className="space-y-5">
              {/* 섹션 인트로 */}
              <LabeledInput label="소제목 (이탤릭)" value={authenticityTab.subtitle} onChange={(v) => setAuthenticityTab({ ...authenticityTab, subtitle: v })} />
              <LabeledTextarea label="도입 문단" value={authenticityTab.intro} onChange={(v) => setAuthenticityTab({ ...authenticityTab, intro: v })} rows={3} />

              {/* CHECK 01 — 학명 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gold-600 mb-3 uppercase tracking-widest">CHECK · 01 — 학명</p>
                <div className="space-y-3">
                  <LabeledInput label="소제목" value={authenticityTab.check01Title} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check01Title: v })} />
                  <LabeledTextarea label="설명" value={authenticityTab.check01Body} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check01Body: v })} rows={2} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">공식 출처 목록</label>
                    <div className="space-y-2">
                      {authenticityTab.check01Sources.map((row, i) => (
                        <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
                          <input
                            placeholder="출처명"
                            value={row.label}
                            onChange={(e) => {
                              const n = [...authenticityTab.check01Sources];
                              n[i] = { ...n[i], label: e.target.value };
                              setAuthenticityTab({ ...authenticityTab, check01Sources: n });
                            }}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                          <textarea
                            placeholder="설명"
                            rows={2}
                            value={row.value}
                            onChange={(e) => {
                              const n = [...authenticityTab.check01Sources];
                              n[i] = { ...n[i], value: e.target.value };
                              setAuthenticityTab({ ...authenticityTab, check01Sources: n });
                            }}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setAuthenticityTab({ ...authenticityTab, check01Sources: authenticityTab.check01Sources.filter((_, ii) => ii !== i) })}
                            className="text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5 mt-1 flex-shrink-0"
                          >삭제</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAuthenticityTab({ ...authenticityTab, check01Sources: [...authenticityTab.check01Sources, { label: '', value: '' }] })}
                        className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                      >+ 출처 추가</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHECK 02 — 산지 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gold-600 mb-3 uppercase tracking-widest">CHECK · 02 — 산지</p>
                <div className="space-y-3">
                  <LabeledInput label="소제목" value={authenticityTab.check02Title} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check02Title: v })} />
                  <LabeledTextarea label="설명" value={authenticityTab.check02Body} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check02Body: v })} rows={2} />
                  <LabeledInput label="인용 출처 (예: 향승(香乘) · 명대 1611년)" value={authenticityTab.check02QuoteSource} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check02QuoteSource: v })} />
                  <LabeledTextarea label="인용 본문" value={authenticityTab.check02QuoteBody} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check02QuoteBody: v })} rows={4} />
                </div>
              </div>

              {/* CHECK 03 — 증빙문서 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gold-600 mb-3 uppercase tracking-widest">CHECK · 03 — 증빙문서</p>
                <div className="space-y-3">
                  <LabeledInput label="소제목" value={authenticityTab.check03Title} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check03Title: v })} />
                  <LabeledTextarea label="설명" value={authenticityTab.check03Body} onChange={(v) => setAuthenticityTab({ ...authenticityTab, check03Body: v })} rows={2} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">서류 목록</label>
                    <div className="space-y-2">
                      {authenticityTab.check03Docs.map((doc, i) => (
                        <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
                          <input
                            placeholder="서류명"
                            value={doc.doc}
                            onChange={(e) => {
                              const n = [...authenticityTab.check03Docs];
                              n[i] = { ...n[i], doc: e.target.value };
                              setAuthenticityTab({ ...authenticityTab, check03Docs: n });
                            }}
                            className="w-36 flex-shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                          <input
                            placeholder="설명"
                            value={doc.desc}
                            onChange={(e) => {
                              const n = [...authenticityTab.check03Docs];
                              n[i] = { ...n[i], desc: e.target.value };
                              setAuthenticityTab({ ...authenticityTab, check03Docs: n });
                            }}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                          <label className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-600 mt-2">
                            <input
                              type="checkbox"
                              checked={!!doc.highlight}
                              onChange={(e) => {
                                const n = [...authenticityTab.check03Docs];
                                n[i] = { ...n[i], highlight: e.target.checked };
                                setAuthenticityTab({ ...authenticityTab, check03Docs: n });
                              }}
                              className="rounded"
                            />
                            강조
                          </label>
                          <button
                            type="button"
                            onClick={() => setAuthenticityTab({ ...authenticityTab, check03Docs: authenticityTab.check03Docs.filter((_, ii) => ii !== i) })}
                            className="text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-1.5 py-0.5 mt-1 flex-shrink-0"
                          >삭제</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAuthenticityTab({ ...authenticityTab, check03Docs: [...authenticityTab.check03Docs, { doc: '', desc: '', highlight: false }] })}
                        className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                      >+ 서류 추가</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          </>)}
          {activeAdminTab === 2 && (<>

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

          </>)}
          {activeAdminTab === 3 && (<>

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
                  <input placeholder="논문 제목" value={paper.title} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], title: e.target.value }; setPapers(n); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input placeholder="저자 (선택)" value={paper.authors ?? ''} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], authors: e.target.value }; setPapers(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="태그 (예: 학술)" value={paper.tag ?? ''} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], tag: e.target.value }; setPapers(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  </div>
                  <textarea placeholder="요약/설명 (선택)" rows={2} value={paper.description ?? ''} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], description: e.target.value }; setPapers(n); }} className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  <input placeholder="원문 링크 (선택, https://...)" value={paper.link ?? ''} onChange={(e) => { const n = [...papers]; n[i] = { ...n[i], link: e.target.value }; setPapers(n); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                </div>
              ))}
              <button type="button" onClick={() => setPapers([...papers, { title: '', journal: '', year: '', citations: '-' }])} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                + 논문 추가
              </button>
            </div>
          </SectionCard>

          </>)}
          {activeAdminTab === 4 && (<>

          {/* Media Tab */}
          <SectionCard title="매체 보도 목록" onSave={() => saveSection('mediaTab', { mediaTab })} saving={saving === 'mediaTab'}>
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

          </>)}
          {activeAdminTab === 5 && (<>

          {/* Testimonials Tab */}
          <SectionCard title="고객 후기 목록" onSave={() => saveSection('testimonialsTab', { testimonialsTab })} saving={saving === 'testimonialsTab'}>
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

          </>)}
        </div>
      </div>
    </div>
  );
}
