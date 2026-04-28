export const company = {
  name: '조엘라이프',
  nameEn: 'ZOEL LIFE',
  brand: "대라천 '참'침향",
  slogan: '자연의 진실된 가치',
  sloganEn: 'Nature Truth Value',
  description:
    'ZOEL LIFE(조엘라이프)는 베트남 직영 농장에서 25년간 연구한 최고급 침향(Agarwood) 제품을 제공합니다.',
  url: 'https://www.daracheon.com',
  email: 'bj0202@gmail.com',
  phone: '070-4140-4086',
  ceo: '박병주',
  businessReg: '749-86-03668',
  address: '서울특별시 금천구 벚꽃로36길 30, 1511호',
  logo: '/images/logo.png',

  farms: [
    { name: '하띤 농장', nameVi: 'Hà Tĩnh', region: '북부 베트남', trees: 4000000, area: '200ha', description: '메인 대규모 농장' },
    { name: '동나이 농장', nameVi: 'Đồng Nai', region: '남부 베트남', trees: 0, description: '전략 재배 거점' },
    { name: '냐짱 농장', nameVi: 'Nha Trang', region: '중부 베트남', trees: 0, description: '고품질 원료 산지' },
    { name: '푸꾸옥 농장', nameVi: 'Phú Quốc', region: '남부 베트남', trees: 0, description: '해양성 기후 재배지' },
    { name: '람동 농장', nameVi: 'Lâm Đồng', region: '남부 베트남', trees: 0, description: '고산지대 특화 농장' },
  ],

  stats: {
    trees: 4000000,
    avgAge: 25,
    regions: 5,
    species: 'Aquilaria agallocha Roxburgh',
    farmArea: '200ha',
  },

  certifications: [
    {
      name: 'CITES 국제인증',
      nameEn: 'CITES',
      icon: '🛡️',
      description:
        '멸종위기 야생동식물 국제거래 협약 인증 (IIA-DNI-007)',
    },
    {
      name: 'HACCP 인증',
      nameEn: 'HACCP',
      icon: '✅',
      description:
        '식품안전관리인증기준 준수',
    },
    {
      name: '유기농 인증',
      nameEn: 'Organic',
      icon: '🌿',
      description:
        '베트남 유기농 재배 인증 (VCO ORGANIC)',
    },
    {
      name: 'OCOP 품질보증',
      nameEn: 'OCOP',
      icon: '⭐',
      description:
        '베트남 정부 품질보증 프로그램',
    },
    {
      name: 'DNA 유전자 검증',
      nameEn: 'DNA Verification',
      icon: '🧬',
      description:
        'Aquilaria agallocha Roxburgh 학명 유전자 검증 완료',
    },
    {
      name: '수지유도 특허',
      nameEn: 'Patent #12835',
      icon: '📋',
      description:
        '식용 가능 수지유도제 특허 기술 (2011년 출원, 2014년 등록)',
    },
  ],

  process: [
    {
      step: 1,
      title: '씨앗 발아 및 묘목 육성',
      titleEn: 'Seedling',
      description:
        '엄선된 Aquilaria agallocha 종자로 건강한 묘목을 육성합니다.',
    },
    {
      step: 2,
      title: '베트남 직영 농장 식재',
      titleEn: 'Planting',
      description:
        '5개 지역 직영 농장에서 최적의 환경으로 식재합니다.',
    },
    {
      step: 3,
      title: '20년 이상 오르가닉 육성',
      titleEn: 'Growing',
      description:
        '유기농 방식으로 20년 이상 침향목을 육성합니다.',
    },
    {
      step: 4,
      title: '특허 수지유도제 주입',
      titleEn: 'Injection',
      description:
        '3~5년간 특허(#12835) 식용 가능 수지유도제를 3~5회 주입합니다.',
    },
    {
      step: 5,
      title: '벌목 및 원물 정밀 채취',
      titleEn: 'Harvesting',
      description:
        '숙성된 침향나무를 벌목하고 원물을 정밀하게 채취합니다.',
    },
    {
      step: 6,
      title: '최고급 제품 가공 및 검수',
      titleEn: 'Processing',
      description:
        'HACCP/Organic 인증 기준에 따라 제품을 가공하고 검수합니다.',
    },
  ],

  awards: [
    "Asia's 10 Leading Pioneering Brand (2025)",
    'OCOP 베트남 정부 품질보증',
  ],

  socialLinks: [] as Array<{ label: string; url: string }>,

  timeline: [
    { year: '1999', event: '베트남 침향 연구 시작' },
    { year: '2010', event: '독자적 수지유도 기술 특허 획득' },
    { year: '2024', event: "프리미엄 브랜드 '대라천 참침향' 론칭" },
  ],
};

export type Company = typeof company;

export const mediaItems = [
  {
    id: 'm1',
    type: 'article' as const,
    title: '침향이란? 3,000년 역사를 가진 동양 최고의 향약',
    source: 'ZOEL LIFE',
    date: '2026-01-07',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80',
    excerpt:
      '침향(沈香, Agarwood)은 Aquilaria 나무에서 생성되는 귀한 향약입니다. 동의보감부터 현대 임상연구까지, 침향의 정의·역사·효능·종류를 완벽 정리합니다.',
    url: '/about-agarwood',
  },
  {
    id: 'm2',
    type: 'press' as const,
    title: "ZOEL LIFE, Asia's 10 Leading Pioneering Brand 선정",
    source: '굿모닝경제',
    date: '2025-11-15',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&q=80',
    excerpt:
      "침향 전문기업 ZOEL LIFE(대라천 '참'침향)가 아시아 10대 선도 브랜드로 선정되었다. 베트남 5개 지역(하띤·동나이·냐짱·푸국·람동) 하띤성 200ha 부지에 400만 그루 이상의 침향나무를 직접 관리하며...",
    url: '#',
  },
  {
    id: 'm3',
    type: 'video' as const,
    title: 'ZOEL LIFE 베트남 직영 농장 방문기',
    source: 'YouTube',
    date: '2026-02-20',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80',
    excerpt:
      '베트남 하띤성에 위치한 ZOEL LIFE 메인 침향 농장을 직접 방문하여 25년 수령의 A. agallocha 나무를 확인합니다.',
    url: '#',
  },
  {
    id: 'm4',
    type: 'article' as const,
    title: '침향의 5가지 놀라운 효능 - 과학적 근거',
    source: 'ZOEL LIFE',
    date: '2026-01-14',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80',
    excerpt:
      '현대 의학 연구로 밝혀진 침향의 수면 개선, 항염, 소화 촉진, 신경 안정, 항산화 효과를 과학적 근거와 함께 소개합니다.',
    url: '/about-agarwood',
  },
];

export const faqItems = [
  {
    question: '침향이란 무엇인가요?',
    answer:
      '침향(沈香)은 Aquilaria 나무가 외부 상처나 곰팡이 감염을 받아 수십 년에 걸쳐 만들어내는 천연 수지입니다. "물에 가라앉는 향"이라는 뜻으로, 동양에서 3,000년 이상 최고의 향약으로 써왔습니다.',
  },
  {
    question: '대라천 침향은 어디서 재배되나요?',
    answer:
      '대라천의 침향은 베트남 5개 지역(하띤·동나이·냐짱·푸국·람동)에서 직접 재배됩니다.\n\n메인 농장은 하띤성 200ha 부지이며, 400만 그루 이상의 Aquilaria agallocha를 직접 관리합니다.\n\n모든 나무에는 개별 추적 번호를 부여해 원목별 이력을 빠짐없이 관리합니다.',
  },
  {
    question: '진품 침향은 어떻게 구별하나요?',
    answer:
      '가장 확실한 방법은 침수 테스트(물에 넣었을 때 가라앉는지 확인)와 GC-MS 성분 분석입니다. 대라천은 모든 제품에 GC-MS 분석 인증서를 제공하며, β-Selinene 함량을 검증합니다.',
  },
  {
    question: '침향의 건강 효능은 과학적으로 입증되었나요?',
    answer:
      '네, 현대 의학 연구는 침향의 수면 개선, 항염, 소화 촉진, 신경 안정, 항산화 효과를 잇따라 확인했습니다. 동의보감도 침향을 "기를 내리고 위를 따뜻하게 하며 구토를 멈추게 한다"고 기록했습니다.',
  },
  {
    question: '어떤 제품부터 시작하면 좋을까요?',
    answer:
      '처음이시라면 침향 건강차나 침향 스틱으로 시작하시길 권합니다. 부담 없는 가격에 간편하게 섭취하며 침향을 처음 경험하기 좋습니다.',
  },
  {
    question: '배송은 얼마나 걸리나요?',
    answer:
      '국내 배송은 주문 후 1~3영업일 이내에 도착합니다. 해외 배송은 지역에 따라 5~14영업일이 소요됩니다. 모든 제품은 품질 유지를 위해 특수 포장됩니다.',
  },
  {
    question: '반품/교환이 가능한가요?',
    answer:
      '제품 수령 후 7일 이내 미개봉 제품에 한해 반품/교환이 가능합니다. 품질 문제가 있는 경우 개봉 후에도 교환해 드립니다. 고객지원 페이지에서 접수하실 수 있습니다.',
  },
];

export type MediaItem = (typeof mediaItems)[number];

export type FaqItem = (typeof faqItems)[number];
