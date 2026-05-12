'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { saveAdminPage } from '@/lib/adminSave';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PromoVideoItem {
  title: string;
  source?: string;
  date?: string;
  thumbnail?: string;
  excerpt?: string;
  url: string;
}

interface PromoVideosData {
  num?: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  items: PromoVideoItem[];
}

interface Farm {
  name: string;
  nameVi: string;
  desc: string;
  image?: string;
}

interface HistoryEra {
  era: string;
  items: string[];
  description?: string;
  image?: string;
  imageCaption?: string;
}

interface CertItem {
  thumb: string;
  name: string;
  nameEn: string;
  category: string;
  viewUrl: string;
  certNumber?: string;
  issuer?: string;
  validity?: string;
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

interface ProcessPhoto {
  src: string;
  caption?: string;
}

interface ProcessGroup {
  title: string;
  titleEn: string;
  description: string;
  image?: string;
  steps: ProcessStep[];
  photos?: ProcessPhoto[];
}

/* Showroom — pages.showroom 과 데이터 공유. 공개 /brand-story 의 03 SHOWROOM
   챕터에도 동일하게 표시되므로 brand-story 편집기 안에서 인라인으로 관리. */
interface ShowroomGalleryItem { src: string; alt?: string; caption?: string }
interface ShowroomData {
  hero: { sectionTag: string; titleKr: string; titleEn?: string; subtitle: string; heroBg: string };
  intro: { tag: string; title: string; body: string };
  visit: { address: string; addressEn: string; hours: string; note: string };
  gallery: ShowroomGalleryItem[];
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
  twentyYearPrinciple?: {
    tag: string;
    headlineLead: string;
    headlineBold: string;
    subtitle: string;
    intro: string;
    heroImage?: string;
    heroCaption?: string;
    sections: Array<{
      label: string;
      titleKr: string;
      titleEn?: string;
      body: string;
      image?: string;
      imageCaption?: string;
    }>;
    closing: string;
    closingImage?: string;
  };
  promoVideos?: PromoVideosData;
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
    /** 탭 상단 대표 이미지 캐러셀 (1장 이상이면 캐러셀로 노출) */
    heroImages: string[];
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
    'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/home-hero-default.jpg';

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
      '베트남 5개 성(하띤·동나이·냐짱·푸국·람동)에 자리한 대라천 직영 농장.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며, 원료 재배부터 가공·유통까지 전 과정을 수직계열화하여 품질을 보증합니다.',
  });
  const [twentyYearPrinciple, setTwentyYearPrinciple] = useState<NonNullable<BrandStoryData['twentyYearPrinciple']>>({
    tag: 'THE 20-YEAR PROOF',
    headlineLead: '침향은 비싼 것이 중요한 게 아닙니다.',
    headlineBold: '확인 가능한 침향인지가 중요합니다.',
    subtitle: '그래서 우리는 — 20년을 기다린 나무에만 수지를 내립니다',
    intro: '조엘라이프가 20년 이상 자란 침향나무만 고집하는 데는 분명한 이유가 있습니다. 향이 깊어지는 시간은, 단축할 수 없기 때문입니다.',
    heroImage: '',
    heroCaption: '20년을 넘긴 침향나무 — 수지를 축적할 준비가 끝납니다',
    sections: [
      { label: 'A', titleEn: 'GROWTH STOPS, RESIN BEGINS', titleKr: '키 성장의 끝, 수지의 시작', body: '침향나무는 약 20년 전후가 되면 키 성장을 담당하는 생장점의 활동이 점차 둔화되거나 멈춥니다. 이 시기 이후 나무는 위로 자라기보다 둘레가 굵어지는 방향으로 성장하며, 비로소 수지를 만들 준비를 갖춥니다.', image: '', imageCaption: '' },
      { label: 'B', titleEn: 'WHY UNDER 20 YEARS FAILS', titleKr: '어린 나무는 상처를 "치유"합니다', body: '20년 이하의 어린 침향나무는 회복력이 강합니다. 초기 1~6개월은 수지 활동이 활발하지만, 시간이 지나며 나무는 그 상처를 "치유된 상태"로 인식해 조직 복구·성장에 에너지를 집중합니다. 결과적으로 형성됐던 수지는 감소하거나 사라집니다.', image: '', imageCaption: '' },
      { label: 'C', titleEn: '20+ YEARS — ACCUMULATION', titleKr: '성숙한 나무는 수지를 "축적"합니다', body: '20년 이상의 성숙한 나무는 분비 이후 약 1~2년에 걸쳐 수지가 농축·응집되며 향과 밀도가 깊어집니다. 빠른 복구가 아닌 장기간의 축적·유지 경향이 강해, 고품질 침향이 형성될 조건을 갖추게 됩니다.', image: '', imageCaption: '' },
    ],
    closing: '최소 20년 — 이것이 대라천이 25년간 지켜온 *원료의 원칙*입니다.\n빠른 길은 있지만, *깊은 향에 이르는 지름길은 없습니다.*',
    closingImage: '',
  });
  const [promoVideos, setPromoVideos] = useState<PromoVideosData>({
    num: '04',
    tag: 'VIDEOS',
    title: "대라천 '참'침향 브랜드 홍보영상",
    subtitle: '',
    body: '',
    items: [],
  });
  const [historyTab, setHistoryTab] = useState<BrandStoryData['historyTab']>({
    tag: 'HISTORY',
    title: '대라천 침향 역사',
    eras: [
      {
        era: '2000-2001',
        items: [
          '2000 베트남 5개 성 농장 조성',
          '2001 동나이성 대규모 식재',
        ],
        description:
          "대라천 '참'침향은 끊임없는 도전과 연구를 이어왔습니다. 2000년 베트남 5개 성에 농장을 조성하며 본격적인 침향 재배를 시작했고, 2001년 동나이성에 대규모 식재를 진행하며 미래를 준비했습니다.",
      },
      {
        era: '2014-2019',
        items: [
          '2014 노니발효 시스템 개발',
          '2018 NTV Vietnam 통합법인 + Organic/HACCP 인증 + 식용가능 수지유도제 재개발',
          '2019 OCOP 품질보증',
        ],
        description:
          '2014년 노니발효 시스템을 개발하며 기술력을 축적했고, 2018년에는 NTV Vietnam 통합법인을 설립하고 Organic/HACCP 인증을 획득하며 식용가능 수지유도제를 재개발했습니다. 2019년에는 OCOP 베트남 정부 품질보증을 받았습니다.',
      },
      {
        era: '2023-2025',
        items: [
          '2023 침향캡슐 건강기능성 재인증(18품목)',
          '2024 조엘라이프 한국 시장 진출',
          '2025 아시아 10대 선도 브랜드 선정 + 특허 출원',
        ],
        description:
          '2023년 침향캡슐 건강기능성 재인증을 통해 18품목을 생산하게 되었고, 2024년에는 조엘라이프를 통해 한국 시장에 본격적으로 진출했습니다. 2025년에는 아시아 10대 선도 브랜드로 선정되었으며, 유기 바나듐·셀레늄·게르마늄 특허를 출원하며 기술 혁신을 이어가고 있습니다.',
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
    heroImages: [],
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

  // Showroom — pages.showroom 과 별개 blob key 로 저장. 공개 /brand-story
  // 의 03 SHOWROOM 챕터와 /showroom 페이지 모두 동일 소스 사용.
  const [showroomHero, setShowroomHero] = useState<ShowroomData['hero']>({
    sectionTag: '대라천 침향 전시장 · ZOEL LIFE Showroom',
    titleKr: "대라천 '참'침향 전시장",
    titleEn: 'Daracheon Agarwood Showroom',
    subtitle: '베트남 직영 본관 — 침향 원목·증류·시향까지 한 공간에.',
    heroBg: '',
  });
  const [showroomIntro, setShowroomIntro] = useState<ShowroomData['intro']>({
    tag: 'THE SHOWROOM',
    title: '천년의 향기를 직접 체험하는 공간',
    body: '',
  });
  const [showroomVisit, setShowroomVisit] = useState<ShowroomData['visit']>({
    address: '베트남 동나이성 직영 본관',
    addressEn: 'Dong Nai Province, Vietnam',
    hours: '연중무휴 10:00 – 18:00 (사전 예약 권장)',
    note: '한국어 통역 도슨트 동행 가능. 사전 예약은 회사소개 페이지의 문의 양식을 이용해 주세요.',
  });
  const [showroomGallery, setShowroomGallery] = useState<ShowroomGalleryItem[]>([]);

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
          pages?: { brandStory?: Partial<BrandStoryData>; showroom?: Partial<ShowroomData> };
        };
        const d = raw?.pages?.brandStory;
        const s = raw?.pages?.showroom;
        if (s?.hero) setShowroomHero((prev) => ({ ...prev, ...s.hero }));
        if (s?.intro) setShowroomIntro((prev) => ({ ...prev, ...s.intro }));
        if (s?.visit) setShowroomVisit((prev) => ({ ...prev, ...s.visit }));
        if (Array.isArray(s?.gallery)) setShowroomGallery(s.gallery);
        // CMS 데이터가 있으면 그것 우선, 없거나 빈 필드/배열이면 초기값(fallback) 유지
        if (d?.hero) setHero(d.hero);
        if (d?.brandStoryTab) setBrandStoryTab(d.brandStoryTab);
        if (d?.twentyYearPrinciple) {
          const t = d.twentyYearPrinciple;
          setTwentyYearPrinciple((prev) => ({
            ...prev,
            ...t,
            sections: Array.isArray(t.sections) && t.sections.length > 0 ? t.sections : prev.sections,
          }));
        }
        if (d?.promoVideos) {
          const pv = d.promoVideos as Partial<PromoVideosData>;
          setPromoVideos((prev) => ({
            ...prev,
            ...pv,
            items: Array.isArray(pv.items) ? pv.items : prev.items,
          }));
        }
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
            heroImages: Array.isArray(pt.heroImages) ? pt.heroImages : prev.heroImages,
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

      // step.image 보존 — 어드민 state 가 옛 상태(image 없음)인 채로 저장될 때
      // 서버 prev 의 step.image 를 자동 머지해 데이터 유실 방지.
      const safePayload: Partial<BrandStoryData> = { ...payload };
      if (safePayload.processTab && prev.processTab) {
        const ptPayload = safePayload.processTab;
        const ptPrev = prev.processTab;
        if (Array.isArray(ptPayload.processGroups) && Array.isArray(ptPrev.processGroups)) {
          safePayload.processTab = {
            ...ptPayload,
            processGroups: ptPayload.processGroups.map((g, gi) => {
              const prevGroup = ptPrev.processGroups?.[gi];
              if (!prevGroup) return g;
              return {
                ...g,
                steps: (g.steps ?? []).map((s, si) => ({
                  ...s,
                  // image 가 비어있으면 서버에 있던 값을 보존.
                  image: s.image || prevGroup.steps?.[si]?.image || '',
                })),
              };
            }),
          };
        }
      }

      const merged = { ...prev, ...safePayload };

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

  // Showroom 은 별도 blob key('showroom') 에 저장. brandStory 와 분리해야
  // /admin/pages/showroom 편집기와도 충돌 없이 양방향으로 작동.
  async function saveShowroomSection(sectionKey: string, payload: Partial<ShowroomData>) {
    setSaving(`showroom-${sectionKey}`);
    try {
      const res = await fetch('/api/admin/pages');
      const existing = (await res.json().catch(() => ({}))) as {
        pages?: { showroom?: Partial<ShowroomData> };
      };
      const prev = existing?.pages?.showroom ?? {};
      const merged = { ...prev, ...payload };
      const result = await saveAdminPage('showroom', merged);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
    } catch (err) {
      console.error(`Save showroom-${sectionKey} error:`, err);
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

  const ADMIN_TABS = ['브랜드 스토리 + 침향 역사', '다양한 인증', '생산 공정'];

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

          {/* 섹션 02 · THE 20-YEAR PROOF */}
          <SectionCard title="섹션 02 · 20년의 약속 (THE 20-YEAR PROOF)" onSave={() => saveSection('twentyYearPrinciple', { twentyYearPrinciple })} saving={saving === 'twentyYearPrinciple'}>
            <div className="space-y-5">
              <LabeledInput label="태그 (영문)" value={twentyYearPrinciple.tag} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, tag: v })} />
              <LabeledInput label="헤드라인 1행 — 회색 (예: '침향은 비싼 것이 중요한 게 아닙니다.')" value={twentyYearPrinciple.headlineLead} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, headlineLead: v })} />
              <LabeledInput label="헤드라인 2행 — 강조 ('확인 가능한 침향' 부분만 골드)" value={twentyYearPrinciple.headlineBold} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, headlineBold: v })} />
              <LabeledInput label="부제 (이탤릭)" value={twentyYearPrinciple.subtitle} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, subtitle: v })} />
              <LabeledTextarea label="리드 문단 (좌측 골드 보더 박스)" value={twentyYearPrinciple.intro} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, intro: v })} rows={3} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">챕터 hero 이미지 (16:9)</label>
                  <ImageUploadField value={twentyYearPrinciple.heroImage ?? ''} onChange={(url) => setTwentyYearPrinciple({ ...twentyYearPrinciple, heroImage: url })} subdir="pages/brand" />
                </div>
                <LabeledInput label="Hero 캡션" value={twentyYearPrinciple.heroCaption ?? ''} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, heroCaption: v })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">A · B · C 섹션</label>
                <div className="space-y-4">
                  {twentyYearPrinciple.sections.map((sec, si) => (
                    <div key={si} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">섹션 {sec.label || ['A','B','C'][si] || String(si + 1)}</span>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: moveItem(twentyYearPrinciple.sections, si, si - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: moveItem(twentyYearPrinciple.sections, si, si + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: removeItem(twentyYearPrinciple.sections, si) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">라벨 (A/B/C)</label>
                          <input
                            type="text"
                            value={sec.label}
                            onChange={(e) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], label: e.target.value }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">영문 타이틀 (카드 상단 mono 텍스트)</label>
                          <input
                            type="text"
                            value={sec.titleEn ?? ''}
                            onChange={(e) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], titleEn: e.target.value }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">한글 제목</label>
                        <input
                          type="text"
                          value={sec.titleKr}
                          onChange={(e) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], titleKr: e.target.value }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">본문</label>
                        <textarea
                          rows={4}
                          value={sec.body}
                          onChange={(e) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], body: e.target.value }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">이미지 (4:3)</label>
                          <ImageUploadField value={sec.image ?? ''} onChange={(url) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], image: url }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }} subdir="pages/brand" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">이미지 캡션 (alt)</label>
                          <input
                            type="text"
                            value={sec.imageCaption ?? ''}
                            onChange={(e) => { const n = [...twentyYearPrinciple.sections]; n[si] = { ...n[si], imageCaption: e.target.value }; setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: n }); }}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTwentyYearPrinciple({ ...twentyYearPrinciple, sections: [...twentyYearPrinciple.sections, { label: '', titleKr: '', titleEn: '', body: '', image: '', imageCaption: '' }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 섹션 추가
                  </button>
                </div>
              </div>

              <LabeledTextarea label='클로징 박스 (강조할 부분은 *별표*로 감쌀 것 — 예: "*원료의 원칙*")' value={twentyYearPrinciple.closing} onChange={(v) => setTwentyYearPrinciple({ ...twentyYearPrinciple, closing: v })} rows={3} />
            </div>
          </SectionCard>

          {/* 농장 카드 편집은 /admin/media → 기본 설정 탭으로 이동됨
              (단일 진입점 — 같은 pages.brandStory.farms 데이터를 공유) */}

          {/* History Tab — 브랜드 스토리 페이지 03 섹션 (20-YEAR PROOF 다음) */}
          <SectionCard title="섹션 03 · 대라천 침향 역사" onSave={() => saveSection('historyTab', { historyTab })} saving={saving === 'historyTab'}>
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
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">시대 설명 문단 (선택) — 항목 아래에 단락으로 표시됩니다</label>
                        <textarea
                          rows={4}
                          placeholder="예: 대라천 '참'침향은 끊임없는 도전과 연구를 이어왔습니다. 2000년 베트남 5개 성에 농장을 조성하며 본격적인 침향 재배를 시작했습니다..."
                          value={era.description ?? ''}
                          onChange={(e) => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], description: e.target.value }; setHistoryTab({ ...historyTab, eras: n }); }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">시대 이미지 (선택) — 설명 단락 아래에 큰 사진으로 표시됩니다</label>
                        <ImageUploadField
                          value={era.image ?? ''}
                          onChange={(url) => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], image: url }; setHistoryTab({ ...historyTab, eras: n }); }}
                          subdir="pages"
                        />
                        <input
                          placeholder="이미지 캡션 (선택, 예: 2018 NTV Vietnam 통합법인 — HACCP 클린룸 라인)"
                          value={era.imageCaption ?? ''}
                          onChange={(e) => { const n = [...historyTab.eras]; n[eraIdx] = { ...n[eraIdx], imageCaption: e.target.value }; setHistoryTab({ ...historyTab, eras: n }); }}
                          className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setHistoryTab({ ...historyTab, eras: [...historyTab.eras, { era: '', items: [''], description: '', image: '', imageCaption: '' }] })} className="text-gold-600 hover:text-gold-700 text-sm font-medium">
                    + 시대 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ─────────────────────────────────────────────
              03 SHOWROOM — pages.showroom 과 데이터 공유.
              공개 /brand-story 의 03 SHOWROOM 챕터, /showroom 페이지에 동시 반영.
          ───────────────────────────────────────────── */}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            ℹ️ 아래 <strong>03 SHOWROOM</strong> 섹션은 <span className="font-mono">/brand-story</span>의 03 챕터와 <span className="font-mono">/showroom</span> 페이지에 동시에 반영됩니다.
          </div>

          {/* Showroom Hero */}
          <SectionCard
            title="03 SHOWROOM · Hero"
            onSave={() => saveShowroomSection('hero', { hero: showroomHero })}
            saving={saving === 'showroom-hero'}
          >
            <div className="space-y-5">
              <LabeledInput label="섹션 태그" value={showroomHero.sectionTag} onChange={(v) => setShowroomHero({ ...showroomHero, sectionTag: v })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="제목 (한글)" value={showroomHero.titleKr} onChange={(v) => setShowroomHero({ ...showroomHero, titleKr: v })} />
                <LabeledInput label="제목 (영문)" value={showroomHero.titleEn ?? ''} onChange={(v) => setShowroomHero({ ...showroomHero, titleEn: v })} />
              </div>
              <LabeledTextarea label="부제목" value={showroomHero.subtitle} onChange={(v) => setShowroomHero({ ...showroomHero, subtitle: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배경 이미지</label>
                <ImageUploadField value={showroomHero.heroBg} onChange={(url) => setShowroomHero({ ...showroomHero, heroBg: url })} subdir="showroom" />
              </div>
            </div>
          </SectionCard>

          {/* Showroom Intro */}
          <SectionCard
            title="03 SHOWROOM · 소개 (THE SHOWROOM)"
            onSave={() => saveShowroomSection('intro', { intro: showroomIntro })}
            saving={saving === 'showroom-intro'}
          >
            <div className="space-y-5">
              <LabeledInput label="태그" value={showroomIntro.tag} onChange={(v) => setShowroomIntro({ ...showroomIntro, tag: v })} />
              <LabeledInput label="제목" value={showroomIntro.title} onChange={(v) => setShowroomIntro({ ...showroomIntro, title: v })} />
              <LabeledTextarea label="본문" value={showroomIntro.body} onChange={(v) => setShowroomIntro({ ...showroomIntro, body: v })} rows={8} />
            </div>
          </SectionCard>

          {/* Showroom Visit */}
          <SectionCard
            title="03 SHOWROOM · 방문 안내"
            onSave={() => saveShowroomSection('visit', { visit: showroomVisit })}
            saving={saving === 'showroom-visit'}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LabeledInput label="주소 (한글)" value={showroomVisit.address} onChange={(v) => setShowroomVisit({ ...showroomVisit, address: v })} />
                <LabeledInput label="주소 (영문)" value={showroomVisit.addressEn} onChange={(v) => setShowroomVisit({ ...showroomVisit, addressEn: v })} />
              </div>
              <LabeledInput label="운영시간" value={showroomVisit.hours} onChange={(v) => setShowroomVisit({ ...showroomVisit, hours: v })} />
              <LabeledTextarea label="방문 안내 메모" value={showroomVisit.note} onChange={(v) => setShowroomVisit({ ...showroomVisit, note: v })} rows={3} />
            </div>
          </SectionCard>

          {/* Showroom Gallery */}
          <SectionCard
            title={`03 SHOWROOM · 갤러리 · ${showroomGallery.length}장`}
            onSave={() => saveShowroomSection('gallery', { gallery: showroomGallery })}
            saving={saving === 'showroom-gallery'}
          >
            <div className="space-y-4">
              {showroomGallery.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">SCENE {String(i + 1).padStart(2, '0')}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setShowroomGallery(moveItem(showroomGallery, i, i - 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                      <button type="button" onClick={() => setShowroomGallery(moveItem(showroomGallery, i, i + 1))} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                      <button type="button" onClick={() => setShowroomGallery(removeItem(showroomGallery, i))} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                    </div>
                  </div>
                  <ImageUploadField
                    value={item.src}
                    onChange={(url) => { const n = [...showroomGallery]; n[i] = { ...n[i], src: url }; setShowroomGallery(n); }}
                    subdir="showroom"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <input
                      placeholder="alt 텍스트 (검색엔진/접근성)"
                      value={item.alt ?? ''}
                      onChange={(e) => { const n = [...showroomGallery]; n[i] = { ...n[i], alt: e.target.value }; setShowroomGallery(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                    <input
                      placeholder="캡션 (선택, 호버/라이트박스에 표시)"
                      value={item.caption ?? ''}
                      onChange={(e) => { const n = [...showroomGallery]; n[i] = { ...n[i], caption: e.target.value }; setShowroomGallery(n); }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowroomGallery([...showroomGallery, { src: '', alt: '', caption: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
              >
                + 사진 추가
              </button>
            </div>
          </SectionCard>

          {/* ─────────────────────────────────────────────
              04 VIDEOS — 브랜드 홍보영상 (promoVideos)
              공개 /brand-story 의 04 VIDEOS 챕터에 노출.
              YouTube URL 만 넣으면 프론트가 자동으로 ID 추출 → 임베드.
          ───────────────────────────────────────────── */}
          <SectionCard
            title={`04 VIDEOS · 브랜드 홍보영상 · ${promoVideos.items.length}개`}
            onSave={() => saveSection('promoVideos', { promoVideos })}
            saving={saving === 'promoVideos'}
          >
            <div className="space-y-5">
              {/* 챕터 헤더 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <LabeledInput label="챕터 번호" value={promoVideos.num ?? ''} onChange={(v) => setPromoVideos({ ...promoVideos, num: v })} />
                <LabeledInput label="태그" value={promoVideos.tag ?? ''} onChange={(v) => setPromoVideos({ ...promoVideos, tag: v })} />
                <LabeledInput label="제목" value={promoVideos.title ?? ''} onChange={(v) => setPromoVideos({ ...promoVideos, title: v })} />
              </div>
              <LabeledInput label="부제목 (선택)" value={promoVideos.subtitle ?? ''} onChange={(v) => setPromoVideos({ ...promoVideos, subtitle: v })} />
              <LabeledTextarea label="본문 (선택)" value={promoVideos.body ?? ''} onChange={(v) => setPromoVideos({ ...promoVideos, body: v })} rows={3} />

              {/* 영상 목록 */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">영상 목록 ({promoVideos.items.length}개)</label>
                  <span className="text-xs text-gray-400">YouTube URL 만 넣으면 자동 임베드됩니다</span>
                </div>
                <div className="space-y-4">
                  {promoVideos.items.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">영상 {i + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setPromoVideos({ ...promoVideos, items: moveItem(promoVideos.items, i, i - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setPromoVideos({ ...promoVideos, items: moveItem(promoVideos.items, i, i + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setPromoVideos({ ...promoVideos, items: removeItem(promoVideos.items, i) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input
                          placeholder="제목 (예: 대라천 침향 — 유기농 재배 · 베트남 정부 인증 현장 | 문경수 대표)"
                          value={item.title}
                          onChange={(e) => { const n = [...promoVideos.items]; n[i] = { ...n[i], title: e.target.value }; setPromoVideos({ ...promoVideos, items: n }); }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <input
                          placeholder="YouTube URL (예: https://www.youtube.com/watch?v=XXXXXXXXXXX)"
                          value={item.url}
                          onChange={(e) => { const n = [...promoVideos.items]; n[i] = { ...n[i], url: e.target.value }; setPromoVideos({ ...promoVideos, items: n }); }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            placeholder="출처 (예: 대라천 공식, NTV Việt Nam, 약초방송)"
                            value={item.source ?? ''}
                            onChange={(e) => { const n = [...promoVideos.items]; n[i] = { ...n[i], source: e.target.value }; setPromoVideos({ ...promoVideos, items: n }); }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                          <input
                            placeholder="날짜 (예: 2024-10-01)"
                            value={item.date ?? ''}
                            onChange={(e) => { const n = [...promoVideos.items]; n[i] = { ...n[i], date: e.target.value }; setPromoVideos({ ...promoVideos, items: n }); }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="요약 (선택, 카드 하단에 표시)"
                          value={item.excerpt ?? ''}
                          onChange={(e) => { const n = [...promoVideos.items]; n[i] = { ...n[i], excerpt: e.target.value }; setPromoVideos({ ...promoVideos, items: n }); }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">썸네일 (선택, 비워두면 YouTube 자동 썸네일 사용)</label>
                          <ImageUploadField
                            value={item.thumbnail ?? ''}
                            onChange={(url) => { const n = [...promoVideos.items]; n[i] = { ...n[i], thumbnail: url }; setPromoVideos({ ...promoVideos, items: n }); }}
                            subdir="pages"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPromoVideos({ ...promoVideos, items: [...promoVideos.items, { title: '', url: '', source: '', date: '', excerpt: '', thumbnail: '' }] })}
                    className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
                  >
                    + 영상 추가
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          </>)}
          {activeAdminTab === 1 && (<>

          {/* Certifications Tab */}
          <SectionCard title="탭 2 · 다양한 인증" onSave={() => saveSection('certificationsTab', { certificationsTab })} saving={saving === 'certificationsTab'}>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="인증번호 (예: TQC.19.1082-B, #12835)"
                          value={cert.certNumber ?? ''}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], certNumber: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <input
                          placeholder="발급기관 (예: TQC GLOBAL, 베트남 지식재산권청)"
                          value={cert.issuer ?? ''}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], issuer: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none sm:col-span-2"
                        />
                        <input
                          placeholder="유효기간 (예: 2024.08.27 ~ 2026.12.19)"
                          value={cert.validity ?? ''}
                          onChange={(e) => { const n = [...certificationsTab.certs]; n[i] = { ...n[i], validity: e.target.value }; setCertificationsTab({ ...certificationsTab, certs: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none sm:col-span-2"
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
          {activeAdminTab === 2 && (<>

          {/* 생산 공정 — 대표 이미지 캐러셀 */}
          <SectionCard
            title={`탭 3 · 대표 이미지 캐러셀 · ${processTab.heroImages.length}장`}
            onSave={() => saveSection('processTab', { processTab })}
            saving={saving === 'processTab'}
          >
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                생산 공정 탭 상단(부제목 아래)에 노출되는 대표 이미지입니다. 1장 이상 등록 시 자동으로 캐러셀로 전환됩니다(자동 5초 슬라이드).
              </p>
              {processTab.heroImages.map((src, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">SLIDE {String(i + 1).padStart(2, '0')}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setProcessTab({ ...processTab, heroImages: moveItem(processTab.heroImages, i, i - 1) })}
                        className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded"
                      >▲</button>
                      <button
                        type="button"
                        onClick={() => setProcessTab({ ...processTab, heroImages: moveItem(processTab.heroImages, i, i + 1) })}
                        className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded"
                      >▼</button>
                      <button
                        type="button"
                        onClick={() => setProcessTab({ ...processTab, heroImages: removeItem(processTab.heroImages, i) })}
                        className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded"
                      >삭제</button>
                    </div>
                  </div>
                  <ImageUploadField
                    value={src}
                    onChange={(url) => {
                      const n = [...processTab.heroImages];
                      n[i] = url;
                      setProcessTab({ ...processTab, heroImages: n });
                    }}
                    subdir="process/hero"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setProcessTab({ ...processTab, heroImages: [...processTab.heroImages, ''] })}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
              >
                + 이미지 추가
              </button>
            </div>
          </SectionCard>

          {/* Process Tab */}
          <SectionCard title="탭 3 · 생산 공정" onSave={() => saveSection('processTab', { processTab })} saving={saving === 'processTab'}>
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

              {/* 통계 카드 (stats[]) — 페이지 상단의 4개 골드 강조 카드.
                  예: "400만+ 하띤 직영 농장 침향나무" / "#12835 수지유도 특허" / "72h 고온 증류 공정" / "26+ 식목부터 출고까지" */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">통계 카드 ({processTab.stats.length}개)</label>
                  <span className="text-xs text-gray-400">큰 숫자(value) + 라벨(label) 한 줄</span>
                </div>
                <div className="space-y-2">
                  {processTab.stats.map((stat, si) => (
                    <div key={si} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-mono">STAT {String(si + 1).padStart(2, '0')}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setProcessTab({ ...processTab, stats: moveItem(processTab.stats, si, si - 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▲</button>
                          <button type="button" onClick={() => setProcessTab({ ...processTab, stats: moveItem(processTab.stats, si, si + 1) })} className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 text-xs border rounded">▼</button>
                          <button type="button" onClick={() => setProcessTab({ ...processTab, stats: removeItem(processTab.stats, si) })} className="text-red-400 hover:text-red-600 px-1.5 py-0.5 text-xs border border-red-200 rounded">삭제</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          placeholder="값 (예: 400만+, #12835, 72h, 26+)"
                          value={stat.value}
                          onChange={(e) => { const n = [...processTab.stats]; n[si] = { ...n[si], value: e.target.value }; setProcessTab({ ...processTab, stats: n }); }}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                        <input
                          placeholder="라벨 (예: 하띤 직영 농장 침향나무)"
                          value={stat.label}
                          onChange={(e) => { const n = [...processTab.stats]; n[si] = { ...n[si], label: e.target.value }; setProcessTab({ ...processTab, stats: n }); }}
                          className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProcessTab({ ...processTab, stats: [...processTab.stats, { value: '', label: '' }] })}
                    className="text-gold-600 hover:text-gold-700 text-sm font-medium border border-dashed border-gold-300 px-4 py-2 rounded-lg w-full"
                  >
                    + 통계 카드 추가
                  </button>
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

                      {/* 그룹 대표 이미지 — 사용 중단(우측 사이드 이미지 제거됨).
                          데이터에 남아있어도 공개 페이지에 노출되지 않으며, 단계별 이미지가 카드에 직접 노출됨. */}
                      {group.image && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <div className="flex-1">
                            <p className="font-medium">우측 대표 이미지가 더 이상 노출되지 않습니다.</p>
                            <p className="mt-0.5 text-amber-700">단계별 이미지가 각 카드에 직접 표시됩니다. 아래에서 비워 두는 것을 권장합니다.</p>
                            <button
                              type="button"
                              onClick={() => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], image: '' }; setProcessTab({ ...processTab, processGroups: n }); }}
                              className="mt-2 px-2.5 py-1 text-xs font-medium text-amber-800 bg-white border border-amber-300 rounded hover:bg-amber-100"
                            >
                              대표 이미지 비우기
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 공정 사진 갤러리(photos[]) 편집은 제거 — 단계별 카드 이미지로 대체됨.
                          데이터에 남아있어도 자동으로 비워서 저장. */}

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
                              {/* 단계별 이미지 — AI 생성 가능 (Imagen). 카드 상단에 4:3 으로 노출. */}
                              <div className="mt-2">
                                <label className="block text-[11px] text-gray-500 mb-1">단계 이미지 (4:3 권장 — 카드 상단에 표시)</label>
                                <ImageUploadField
                                  value={step.image ?? ''}
                                  onChange={(url) => { const n = [...processTab.processGroups]; n[gi] = { ...n[gi], steps: n[gi].steps.map((s, ii) => ii === si ? { ...s, image: url } : s) }; setProcessTab({ ...processTab, processGroups: n }); }}
                                  subdir="pages"
                                  aiAspectRatio="4:3"
                                  aiPromptSeed={`Cinematic photo of "${step.name}" step in agarwood (Aquilaria) ${gi === 0 ? 'plantation farming' : 'oil distillation factory'}. ${step.desc} Realistic documentary style, soft natural lighting, no text overlay, no people unless essential.`}
                                />
                              </div>
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
