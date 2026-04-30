'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Farm {
  name: string;
  nameVi: string;
  desc: string;
  image?: string;
}

interface HistoryEra {
  era: string;
  items: string[];
}

interface CertItem {
  thumb: string;
  name: string;
  nameEn: string;
  category: string;
  viewUrl: string;
}

interface CertSection {
  title: string;
  items: string[];
  body?: string;
}

interface ProcessStep {
  step: string;
  name: string;
  duration?: string;
  desc: string;
  image?: string;
}

interface ProcessGroup {
  title: string;
  titleEn: string;
  description: string;
  image?: string;
  steps: ProcessStep[];
}

interface BrandStoryData {
  hero: {
    sectionTag: string;
    titleKr: string;
    titleEn: string;
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
  historyTab: {
    tag: string;
    title: string;
    eras: HistoryEra[];
  };
  certificationsTab: {
    tag: string;
    title: string;
    subtitle: string;
    images?: string[];
    imageLabels?: string[];
    certs: CertItem[];
    sections: CertSection[];
  };
  processTab: {
    tag: string;
    title: string;
    subtitle: string;
    images: string[];
    stats: { value: string; label: string }[];
    steps: string[];
    processGroups: ProcessGroup[];
    totalTimeLabel: string;
    totalTimeValue: string;
    totalTimeDesc: string;
    paragraphs: { title: string; body: string }[];
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

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AdminBrandStoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Frontend fallback 값과 동일 — CMS 데이터가 없을 때 현재 사이트에 노출되는 내용
  const DEFAULT_HERO_BG =
    'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg';

  const [hero, setHero] = useState<BrandStoryData['hero']>({
    sectionTag: 'Agarwood Story',
    titleKr: "대라천 '참'침향",
    titleEn: '',
    subtitle: "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다.",
    heroBg: DEFAULT_HERO_BG,
  });
  const [brandStoryTab, setBrandStoryTab] = useState<BrandStoryData['brandStoryTab']>({
    headlineTitle: '100% 베트남산, 아갈로차 침향나무만!',
    headlineSubtitle: '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전',
    sourceTag: 'THE SOURCE',
    sourceTitle: '',
    sourceBody:
      '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며, 원료 재배부터 가공·유통까지 전 과정을 수직계열화하여 품질을 보증합니다.',
  });
  const [farms, setFarms] = useState<Farm[]>([
    { name: '하띤', nameVi: 'Ha Tinh', desc: '메인 대규모 농장 (200ha)' },
    { name: '동나이', nameVi: 'Dong Nai', desc: '전략 재배 거점' },
    { name: '냐짱', nameVi: 'Nha Trang', desc: '고품질 원료 산지' },
    { name: '푸국', nameVi: 'Phu Quoc', desc: '해양성 기후 재배지' },
    { name: '람동', nameVi: 'Lam Dong', desc: '고산지대 특화 농장' },
  ]);
  const [historyTab, setHistoryTab] = useState<BrandStoryData['historyTab']>({
    tag: 'HISTORY',
    title: '대라천 침향 역사',
    eras: [
      {
        era: '1998-2001',
        items: [
          '1998 캄보디아 침향사업 시작',
          '2000 베트남 5개 성 농장 조성',
          '2001 동나이성 대규모 식재',
        ],
      },
      {
        era: '2014-2019',
        items: [
          '2014 노니발효 시스템 개발',
          '2018 NTV Vietnam 통합법인 + Organic/HACCP 인증 + 식용가능 수지유도제 재개발',
          '2019 OCOP 품질보증',
        ],
      },
      {
        era: '2023-2025',
        items: [
          '2023 침향캡슐 건강기능성 재인증(18품목)',
          '2024 조엘라이프 한국 시장 진출',
          '2025 아시아 10대 선도 브랜드 선정 + 특허 출원',
        ],
      },
    ],
  });
  const [certificationsTab, setCertificationsTab] = useState<BrandStoryData['certificationsTab']>({
    tag: 'CERTIFICATIONS',
    title: '신뢰의 지표',
    subtitle: '국제가 인정하는 대라천의 품질',
    certs: [
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-cites.jpg', name: 'CITES 국제거래 인증서', nameEn: 'CITES', category: '국제인증', viewUrl: '' },
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-mfds.jpg', name: '식약처 건강기능식품 규격 적합', nameEn: 'MFDS Compliance', category: '품질인증', viewUrl: '' },
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-ocop.jpg', name: '베트남 OCOP 품질 인증', nameEn: 'OCOP', category: '품질인증', viewUrl: '' },
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-haccp.jpg', name: 'HACCP 식품안전 인증', nameEn: 'HACCP', category: '품질인증', viewUrl: '' },
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-patent-12835.jpg', name: '수지유도 특허증 #12835', nameEn: 'Patent #12835', category: '특허', viewUrl: '' },
      { thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/certs/cert-iso17025.jpg', name: 'TSL ISO/IEC 17025:2017 시험성적서', nameEn: 'ISO/IEC 17025:2017', category: 'ISO인증', viewUrl: '' },
    ],
    sections: [
      { title: '국제 거래 및 기술 특허', items: ['CITES IIA-DNI-007', '수지유도 특허 #12835'] },
      { title: '품질 보증', items: ['Organic', 'HACCP', 'OCOP', '2025 아시아 10대 브랜드'] },
      { title: '안전성 시험', items: ['TSL ISO/IEC 17025:2017', '중금속 8종 전부 불검출'] },
    ],
  });
  const [processTab, setProcessTab] = useState<BrandStoryData['processTab']>({
    tag: 'PRODUCTION PROCESS',
    title: '생산 공정',
    subtitle: '베트남 직영 농장에서 완제품까지 — 최소 26년의 기록',
    images: [],
    stats: [
      { value: '400만+', label: '하띤 직영 농장 침향나무' },
      { value: '#12835', label: '수지유도 특허' },
      { value: '72h', label: '고온 증류 공정' },
      { value: '26+', label: '식목부터 출고까지' },
    ],
    steps: [
      '식목',
      '수지앉힘(특허#12835)',
      '침향검사',
      '침향수확',
      '원목입고',
      '세척(표피제거)',
      '절단(10-20cm)',
      '수지목분리',
      '이물질제거',
      '세척(3회)',
      '건조(자연광)',
      '분쇄(1-2mm)',
      '고온증류(72시간)',
      '수지채취후숙성검사출고',
    ],
    totalTimeLabel: 'TOTAL PROCESS TIME',
    totalTimeValue: '26+ Years',
    totalTimeDesc: '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치',
    paragraphs: [
      { title: '14단계 공정의 흐름', body: '침향오일은 14단계의 엄격한 생산공정을 거쳐 탄생합니다. 1. 식목, 2. 수지앉힘(특허#12835 식용가능수도제), 3. 침향검사, 4. 침향수확, 5. 원목입고, 6. 세척(표피제거), 7. 절단(10-20cm), 8. 수지목분리, 9. 이물질제거, 10. 세척(3회), 11. 건조(자연광), 12. 분쇄(1-2mm), 13. 고온증류(72시간), 14. 수지채취후숙성검사출고.' },
      { title: '시간과 기술', body: "총 소요 시간은 최소 26년입니다. 각 단계는 침향의 순수함과 효능을 유지하기 위해 정교하게 설계되었습니다. 수지앉힘 단계에서 사용하는 특허받은 식용가능 수도제는 대라천 '참'침향만의 핵심 기술입니다." },
      { title: '품질 및 소요', body: "고온증류 과정은 72시간 동안 지속되며, 이 과정에서 침향의 깊은 향과 성분이 추출됩니다. 이후 숙성 및 검사 과정을 거쳐 최종 제품으로 출고됩니다. 이러한 철저한 공정은 대라천 '참'침향이 왜 프리미엄인지를 보여줍니다." },
      { title: '기후와 시간의 조합', body: "우리는 자연의 시간을 존중하며, 그 시간을 제품에 담아냅니다. 26년의 기다림 끝에 얻은 침향오일은 고객에게 최고의 경험을 선사하기 위한 대라천 '참'침향의 결정체입니다." },
    ],
    processGroups: [
      {
        title: '침향 생산과정',
        titleEn: 'AGARWOOD PRODUCTION',
        description: "좋은 침향을 수확하기까지는 최소 26년 이상의 긴 시간이 필요합니다. 대라천 '참'침향은 자체적인 유기농 특허기술을 적용한 독보적인 방법으로 생산되며, 이 모든 과정을 모니터링하여 투명하게 고객분들께 제공합니다. 대라천 '참'침향은 당분간 누구도 흉내내기 어려운 '명품'이 될 것입니다.",
        image: 'https://lh3.googleusercontent.com/d/1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g=w1280',
        steps: [
          { step: '01', name: '식목', duration: '최소 20년', desc: 'Aquilaria Agallocha Roxburgh 묘목을 베트남 5개 사업장에 식재. GPS 개별 번호 부여로 나무 한 그루씩 이력 추적.' },
          { step: '02', name: '유기농 관리', duration: '5~20년 이상', desc: '유기농 인증 기준(TCVN 11041-2:2017)에 따른 지속적인 재배 관리. 화학 농약 사용 금지.' },
          { step: '03', name: '수지 앉힘', duration: '2~10년', desc: '특허 #12835 식용가능 천연 수지유도제 주입. 나무에 천공 후 유도관 삽입으로 침향 수지 형성.' },
          { step: '04', name: '수지 관리', duration: '2~10년', desc: '수지 형성 상태를 정기적으로 모니터링하고 관리. 최적의 수지 품질 유지.' },
          { step: '05', name: '침향(수지) 검사', duration: '수시', desc: '수지 형성 상태 확인 및 등급 판정. 물에 가라앉는 침수(沈水香) 등급 최우선 선별.' },
          { step: '06', name: '침향 수확', duration: '숙성 확인 후', desc: '25년생 이상 원목 벌목 및 수확. GPS 번호 추적 체계로 나무별 이력 최종 확인 후 수확 진행.' },
          { step: '07', name: '선별 가공', duration: '—', desc: '수확된 침향을 등급별로 선별하고 초벌 가공. 고품질 침향만을 엄격히 선별.' },
          { step: '08', name: '완제품', duration: '—', desc: '침향 원목 완제품으로 완성. 최종 품질 검사 후 로트(Lot)별 이력 부착 후 출고.' },
        ],
      },
      {
        title: '침향 오일 생산과정',
        titleEn: 'OIL PRODUCTION',
        description: '',
        image: 'https://lh3.googleusercontent.com/d/1fVou2UCQ4fETdRWYvkjXS5Wd3inBxa1I=w1280',
        steps: [
          { step: '01', name: '원목 입고', duration: '—', desc: '수지가 앉혀진 벌목한 침향목을 동나이 직영 공장으로 입고. 로트(Lot) 번호 부여 시작.' },
          { step: '02', name: '세척', duration: '—', desc: '표피 제거 및 표면 이물질 제거. 흙·먼지·외부 오염물 완전 제거.' },
          { step: '03', name: '절단', duration: '—', desc: '10~20cm 크기로 수지앉힘 작업 시 천공된 부분 주변을 기준으로 절단.' },
          { step: '04', name: '수지목 분리', duration: '—', desc: '목질(비수지) 부분 제거. 순수 수지가 침착된 핵심 부분만 선별.' },
          { step: '05', name: '이물질 제거', duration: '—', desc: '수지앉힘 작업 시 천공한 부분 속 이물질 완전 제거. 정밀 수작업으로 진행.' },
          { step: '06', name: '세척', duration: '물세척 3회', desc: '물세척 3회 반복 정밀 세척. 잔여 이물질 완전 제거 확인.' },
          { step: '07', name: '건조', duration: '—', desc: '수지 손실을 막기 위해 자연광 건조. 인위적 열원 사용 금지.' },
          { step: '08', name: '분쇄', duration: '—', desc: '1~2mm 크기로 균일 분쇄. 고온증류 효율 극대화를 위한 최적 입자 크기 유지.' },
          { step: '09', name: '고온 증류법', duration: '72시간', desc: '전통 증기 증류법으로 72시간 연속 가동. 침향 수지의 유효성분을 순수 오일로 추출.' },
          { step: '10', name: '수지 채취', duration: '—', desc: '순수 수지만 분리·채취. 불순물 완전 제거 후 고순도 수지만 분리.' },
          { step: '11', name: '숙성', duration: '—', desc: '자체 숙성 과정을 통해 침향 오일의 깊은 향과 성분이 안정화.' },
          { step: '12', name: '검사', duration: '—', desc: 'ISO/IEC 17025:2017 기준 중금속 8종 불검출 검사. 전 검사 통과 확인.' },
          { step: '13', name: '출고', duration: '—', desc: '로트(Lot)별 QR코드 부착 후 최종 출고. 이력 추적 가능한 투명한 출고 시스템.' },
        ],
      },
    ],
  });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages');
        // pages / pages.brandStory 둘 다 없을 수 있음 (초기 배포, blob 미존재,
        // AI 도구가 빈 객체로 덮어쓴 경우 등). 낙관적 구조 분해는 TypeError:
        // Cannot read properties of undefined (reading 'brandStory') 를 발생시켜
        // 폼 전체가 빈칸으로 렌더링되던 버그가 있었음. 옵셔널 체이닝 + 기본값
        // fallback 으로 방어.
        const raw = (await res.json().catch(() => ({}))) as {
          pages?: { brandStory?: Partial<BrandStoryData> };
        };
        const d = raw?.pages?.brandStory;
        // CMS 데이터가 있으면 그것 우선, 없거나 빈 필드/배열이면 초기값(fallback) 유지
        if (d?.hero) setHero(d.hero);
        if (d?.brandStoryTab) setBrandStoryTab(d.brandStoryTab);
        if (d?.farms && Array.isArray(d.farms) && d.farms.length > 0) setFarms(d.farms);
        if (d?.historyTab) setHistoryTab({
          ...d.historyTab,
          eras: Array.isArray(d.historyTab.eras) ? d.historyTab.eras : [],
        });
        if (d?.certificationsTab) setCertificationsTab({
          ...d.certificationsTab,
          certs: Array.isArray((d.certificationsTab as any).certs) ? (d.certificationsTab as any).certs : certificationsTab.certs,
          sections: Array.isArray(d.certificationsTab.sections) ? d.certificationsTab.sections : [],
        });
        if (d?.processTab) {
          const pt = d.processTab as any;
          setProcessTab((prev) => ({
            tag: pt.tag || prev.tag,
            title: pt.title || prev.title,
            subtitle: pt.subtitle || prev.subtitle,
            images: Array.isArray(pt.images) ? pt.images : prev.images,
            stats: Array.isArray(pt.stats) && pt.stats.length > 0 ? pt.stats : prev.stats,
            steps: Array.isArray(pt.steps) ? pt.steps : prev.steps,
            processGroups: Array.isArray(pt.processGroups) && pt.processGroups.length > 0
              ? pt.processGroups
              : prev.processGroups,
            totalTimeLabel: pt.totalTimeLabel || prev.totalTimeLabel,
            totalTimeValue: pt.totalTimeValue || prev.totalTimeValue,
            totalTimeDesc: pt.totalTimeDesc || prev.totalTimeDesc,
            paragraphs: Array.isArray(pt.paragraphs) ? pt.paragraphs : prev.paragraphs,
          }));
        }
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
      // 기존 brandStory 가 전부 비어있을 수 있음 (AI 가 전체 덮어쓰기 실수
      // 했거나 초기 상태). 빈 객체로 fallback 하면 현재 폼 state 기반으로
      // 모든 탭 payload 를 덮어써 다음 저장부터 정상화됨.
      const existing = (await res.json().catch(() => ({}))) as {
        pages?: { brandStory?: Partial<BrandStoryData> };
      };
      const prev = existing?.pages?.brandStory ?? {};
      const merged = { ...prev, ...payload };

      const result = await saveAdminPage('brandStory', merged);
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

  function removeItem<T>(arr: T[], index: number): T[] {
    return arr.filter((_, i) => i !== index);
  }

  const ADMIN_TABS = ['브랜드 스토리', '대라천 침향 역사', '다양한 인증', '생산 공정'];

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
            <div className="space-y-5">
              <LabeledInput label="섹션 태그" value={hero.sectionTag} onChange={(v) => setHero({ ...hero, sectionTag: v })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="제목 (한글)" value={hero.titleKr} onChange={(v) => setHero({ ...hero, titleKr: v })} />
                <LabeledInput label="제목 (영문)" value={hero.titleEn} onChange={(v) => setHero({ ...hero, titleEn: v })} />
              </div>
              <LabeledTextarea label="부제목" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
              <ImageUploadField label="배경 이미지" value={hero.heroBg} onChange={(url) => setHero({ ...hero, heroBg: url })} subdir="pages" />
            </div>
          </SectionCard>

          {/* Brand Story Tab */}
          <SectionCard title="탭 1 · 브랜드 스토리" onSave={() => saveSection('brandStoryTab', { brandStoryTab })} saving={saving === 'brandStoryTab'}>
            <div className="space-y-5">
              <LabeledInput label="헤드라인 제목" value={brandStoryTab.headlineTitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, headlineTitle: v })} />
              <LabeledInput label="헤드라인 부제목" value={brandStoryTab.headlineSubtitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, headlineSubtitle: v })} />
              <LabeledInput label="소스 태그" value={brandStoryTab.sourceTag} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceTag: v })} />
              <LabeledInput label="소스 제목" value={brandStoryTab.sourceTitle} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceTitle: v })} />
              <LabeledTextarea label="소스 본문" value={brandStoryTab.sourceBody} onChange={(v) => setBrandStoryTab({ ...brandStoryTab, sourceBody: v })} rows={5} />
            </div>
          </SectionCard>

          {/* Farms */}
          <SectionCard title="탭 1 · 브랜드 스토리 — 농장 네트워크" onSave={() => saveSection('farms', { farms })} saving={saving === 'farms'}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input placeholder="농장명 (한글)" value={farm.name} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], name: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="농장명 (베트남어)" value={farm.nameVi} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], nameVi: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                    <input placeholder="설명" value={farm.desc} onChange={(e) => { const n = [...farms]; n[i] = { ...n[i], desc: e.target.value }; setFarms(n); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">농장 사진 (선택)</label>
                    <ImageUploadField
                      value={farm.image ?? ''}
                      onChange={(url) => { const n = [...farms]; n[i] = { ...n[i], image: url }; setFarms(n); }}
                      subdir="pages"
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setFarms([...farms, { name: '', nameVi: '', desc: '', image: '' }])} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                + 농장 추가
              </button>
            </div>
          </SectionCard>

          </>)}
          {activeAdminTab === 1 && (<>

          {/* History Tab */}
          <SectionCard title="탭 2 · 대라천 침향 역사" onSave={() => saveSection('historyTab', { historyTab })} saving={saving === 'historyTab'}>
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

          </>)}
          {activeAdminTab === 2 && (<>

          {/* Certifications Tab */}
          <SectionCard title="탭 3 · 다양한 인증" onSave={() => saveSection('certificationsTab', { certificationsTab })} saving={saving === 'certificationsTab'}>
            <div className="space-y-6">

              {/* 섹션 헤더 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="태그" value={certificationsTab.tag} onChange={(v) => setCertificationsTab({ ...certificationsTab, tag: v })} />
                <LabeledInput label="제목" value={certificationsTab.title} onChange={(v) => setCertificationsTab({ ...certificationsTab, title: v })} />
                <div className="md:col-span-2">
                  <LabeledInput label="부제목" value={certificationsTab.subtitle} onChange={(v) => setCertificationsTab({ ...certificationsTab, subtitle: v })} />
                </div>
              </div>

              {/* 인증서 액자 갤러리 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">인증서 갤러리 ({certificationsTab.certs.length}개)</label>
                  <span className="text-xs text-gray-400">프론트에서 카테고리별 색상 액자로 표시됩니다</span>
                </div>
                <div className="space-y-4 mt-2">
                  {certificationsTab.certs.map((cert, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">인증서 {i + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, certs: moveItem(certificationsTab.certs, i, i - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, certs: moveItem(certificationsTab.certs, i, i + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setCertificationsTab({ ...certificationsTab, certs: removeItem(certificationsTab.certs, i) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="인증명 (한글, 예: CITES 국제거래 인증서)"
                          value={cert.name}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], name: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <input
                          placeholder="인증명 (영문, 예: CITES)"
                          value={cert.nameEn}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], nameEn: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <select
                          value={cert.category}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], category: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        >
                          {['국제인증','품질인증','유기농인증','ISO인증','특허','수상','사업등록'].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <input
                          placeholder="원본 링크 URL (선택)"
                          value={cert.viewUrl}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], viewUrl: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">인증서 이미지 (액자에 표시)</label>
                        <ImageUploadField
                          value={cert.thumb}
                          onChange={(url) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], thumb: url }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          subdir="pages"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCertificationsTab({ ...certificationsTab, certs: [...certificationsTab.certs, { thumb: '', name: '', nameEn: '', category: '품질인증', viewUrl: '' }] })}
                    className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                  >
                    + 인증서 추가
                  </button>
                </div>
              </div>

              {/* 인증 그룹 (하단 카드) */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">인증 그룹 카드 (하단 요약)</label>
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
                      <input
                        placeholder="그룹 제목"
                        value={section.title}
                        onChange={(e) => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], title: e.target.value }; setCertificationsTab({ ...certificationsTab, sections: n }); }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none mb-3"
                      />
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
                      <div className="mt-3">
                        <textarea
                          placeholder="그룹 설명 (선택)"
                          rows={2}
                          value={section.body ?? ''}
                          onChange={(e) => { const n = [...certificationsTab.sections]; n[sIdx] = { ...n[sIdx], body: e.target.value }; setCertificationsTab({ ...certificationsTab, sections: n }); }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
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

          </>)}
          {activeAdminTab === 3 && (<>

          {/* Process Tab */}
          <SectionCard title="탭 4 · 생산 공정" onSave={() => saveSection('processTab', { processTab })} saving={saving === 'processTab'}>
            <div className="space-y-5">
              {/* 헤더 */}
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

              {/* 공정 그룹 (침향 생산과정 / 침향 오일 생산과정) */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">공정 그룹 ({processTab.processGroups.length}개)</label>
                  <span className="text-xs text-gray-400">각 그룹 안에 단계를 추가하세요</span>
                </div>
                <div className="space-y-6">
                  {processTab.processGroups.map((group, gi) => (
                    <div key={gi} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      {/* 그룹 헤더 제어 */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-gray-600">공정 그룹 {gi + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setProcessTab({ ...processTab, processGroups: moveItem(processTab.processGroups, gi, gi - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setProcessTab({ ...processTab, processGroups: moveItem(processTab.processGroups, gi, gi + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setProcessTab({ ...processTab, processGroups: removeItem(processTab.processGroups, gi) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>

                      {/* 그룹 기본 정보 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="그룹 제목 (예: 침향 생산과정)"
                          value={group.title}
                          onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], title: e.target.value }; setProcessTab({ ...processTab, processGroups: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <input
                          placeholder="영문 제목 (예: AGARWOOD PRODUCTION)"
                          value={group.titleEn}
                          onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], titleEn: e.target.value }; setProcessTab({ ...processTab, processGroups: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <div className="sm:col-span-2">
                          <textarea
                            placeholder="공정 소개 설명 (선택)"
                            rows={3}
                            value={group.description}
                            onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], description: e.target.value }; setProcessTab({ ...processTab, processGroups: n }); }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* 그룹 대표 이미지 */}
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">대표 이미지 (우측 세로 이미지, 선택)</label>
                        <ImageUploadField
                          value={group.image ?? ''}
                          onChange={(url) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], image: url }; setProcessTab({ ...processTab, processGroups: n }); }}
                          subdir="pages"
                        />
                      </div>

                      {/* 단계 목록 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">단계 목록 ({group.steps.length}개)</label>
                        <div className="space-y-3">
                          {group.steps.map((step, si) => (
                            <div key={si} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400 font-mono">{String(si + 1).padStart(2, '0')}</span>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: moveItem(n[gi].steps, si, si - 1) }; setProcessTab({ ...processTab, processGroups: n }); }} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                                  <button type="button" onClick={() => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: moveItem(n[gi].steps, si, si + 1) }; setProcessTab({ ...processTab, processGroups: n }); }} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                                  <button type="button" onClick={() => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: removeItem(n[gi].steps, si) }; setProcessTab({ ...processTab, processGroups: n }); }} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                  placeholder="단계명 (예: 식목)"
                                  value={step.name}
                                  onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: n[gi].steps.map((s, ii) => ii === si ? { ...s, name: e.target.value } : s) }; setProcessTab({ ...processTab, processGroups: n }); }}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                                />
                                <input
                                  placeholder="소요 시간 (예: 5~20년 이상)"
                                  value={step.duration ?? ''}
                                  onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: n[gi].steps.map((s, ii) => ii === si ? { ...s, duration: e.target.value } : s) }; setProcessTab({ ...processTab, processGroups: n }); }}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                                />
                              </div>
                              <input
                                placeholder="단계 설명 (선택)"
                                value={step.desc}
                                onChange={(e) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: n[gi].steps.map((s, ii) => ii === si ? { ...s, desc: e.target.value } : s) }; setProcessTab({ ...processTab, processGroups: n }); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: [...n[gi].steps, { step: String(n[gi].steps.length + 1).padStart(2, '0'), name: '', desc: '' }] }; setProcessTab({ ...processTab, processGroups: n }); }}
                            className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                          >
                            + 단계 추가
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProcessTab({ ...processTab, processGroups: [...processTab.processGroups, { title: '', titleEn: '', description: '', image: '', steps: [] }] })}
                    className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
                  >
                    + 공정 그룹 추가
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
