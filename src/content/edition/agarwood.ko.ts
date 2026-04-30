import type { EditionContent } from './types';

/**
 * 1차 placeholder 콘텐츠. Drive 폴더 내용 수령 후 텍스트·이미지 교체 예정.
 * 현재는 zoellife.com 기존 데이터(브랜드 스토리·about-agarwood)의 핵심을
 * 응축해서 실제 동작하는 카탈로그 모양을 만듦.
 */
export const agarwoodEditionKo: EditionContent = {
  cover: {
    kicker: 'Daracheon · Limited Digital Edition',
    title: '진짜 침향,',
    titleHighlight: '219,000시간의 기다림',
    subtitle:
      "베트남 5개 성, 200ha의 직영 농장, 25년의 시간. 학명 Aquilaria Agallocha Roxburgh의 진짜 이야기.",
    edition: 'Edition 01 · 2026 Spring',
    backgroundImage: '/images/floot-hero-image.jpg',
  },
  foreword: {
    greeting: '귀한 시간을 내어 이 에디션을 펼쳐 주셔서 감사합니다.',
    body: [
      '대라천은 1998년 캄보디아의 한 침향나무에서 시작되었습니다. 2000년 베트남 5개 성으로 자리를 옮긴 이후, 우리는 단 하나의 종 — Aquilaria Agallocha Roxburgh — 에만 25년을 바쳤습니다.',
      "이 디지털 에디션은 그 25년의 기록을 한 권에 압축한 한정 자료입니다. 학명·산지·증빙. 이 세 가지로 진짜 침향을 가리는 방법을 페이지 너머로 전합니다.",
    ],
    signature: '대라천 · ZOEL LIFE',
    signatureRole: 'Brand Office',
  },
  chapters: [
    {
      num: '01',
      tag: 'Chapter I · Origin',
      title: '25년의 여정',
      subtitle: '캄보디아의 한 그루에서 베트남 5개 성으로',
      body: [
        '1998년, 대라천은 캄보디아의 한 침향나무에서 시작되었습니다. 그리고 2000년, 베트남 하띤(Hà Tĩnh) · 동나이(Đồng Nai) · 냐짱(Nha Trang) · 푸국(Phú Quốc) · 람동(Lâm Đồng) 5개 성으로 직영 농장을 확장했습니다.',
        '오늘날 대라천은 200ha 부지에 400만 그루 이상의 침향나무를 직접 관리하고 있습니다. 25년 동안 함께 일해온 62가구의 베트남 현지 파트너 가족이 농장을 지키고 있으며, 그들에게는 베트남 현지 최고 수준의 의료·교육 복지가 제공됩니다.',
      ],
      highlights: [
        { label: 'Started', value: '1998' },
        { label: 'Farms', value: '5 Provinces' },
        { label: 'Land', value: '200ha' },
        { label: 'Trees', value: '4M+' },
      ],
    },
    {
      num: '02',
      tag: 'Chapter II · The Tree',
      title: '단 하나의 학명',
      subtitle: '식약처 4대 공식문서가 인정한 침향',
      body: [
        '대한민국 정부의 공식문서 4곳 — 대한민국약전외한약(생약)규격집, 식약처 식품공전, 식약처 한약재 관능검사 해설서, 한국한의학연구원 — 모두에서 공통으로 정의하는 침향은 단 하나입니다.',
      ],
      pull: {
        quote: 'Aquilaria Agallocha Roxburgh',
        source: '아퀼라리아 아갈로차 록스버그 · 대한민국 식약처 공식 등재 학명',
      },
    },
    {
      num: '03',
      tag: 'Chapter III · The Farms',
      title: '베트남 5개 성',
      subtitle: '하띤·동나이·냐짱·푸국·람동',
      body: [
        '하띤성은 대규모 재배의 본거지입니다. 동나이성은 전략 거점, 냐짱은 고품질 원료 산지, 푸국은 해양성 기후, 람동은 고산지대 특화 농장입니다. 5개 기후대에 분산해 자연재해 리스크를 최소화하고 품질의 다양성을 확보합니다.',
      ],
    },
    {
      num: '04',
      tag: 'Chapter IV · The Process',
      title: '자연이 빚는 4단계',
      subtitle: '외부 자극 → 수지 분비 → 침착 → 형성',
      body: [
        '침향은 외부 상처나 곰팡이 감염에 대응해 나무 스스로 분비한 방어 수지(樹脂)가 수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목입니다. 인위적으로 빠르게 만들 수 없습니다.',
      ],
      highlights: [
        { label: '01', value: '외부 자극' },
        { label: '02', value: '수지 분비' },
        { label: '03', value: '침착' },
        { label: '04', value: '형성' },
      ],
    },
    {
      num: '05',
      tag: 'Chapter V · Authenticity',
      title: '진짜를 가리는 3가지',
      subtitle: '학명 · 산지 · 증빙문서',
      body: [
        '학명: 식약처 4대 공식문서 모두 Aquilaria Agallocha Roxburgh로 정의.',
        '산지: 명대 1611년 향승(香乘) 등 고문헌이 최상품으로 기록한 베트남 중부 지역.',
        '증빙: 원산지 증명서, 정식 수입 증빙, 유기농 인증서, CITES 인증서, 성분검사서, 유해물질성적서. CITES 인증서는 합법 원료 100% 보증 — 가짜 침향은 통과 불가능.',
      ],
    },
  ],
  gallery: {
    num: '06',
    tag: 'Chapter VI · Documents',
    title: '보유 인증서 원본',
    subtitle: 'ISO · GMP · CITES · OCOP · Asia Excellent Brand',
    items: [
      { src: '/uploads/misc/cert-iso22000.jpg', alt: 'ISO 22000:2018', label: 'ISO 22000:2018', sub: '식품안전 경영시스템 인증' },
      { src: '/uploads/misc/cert-gmp.jpg', alt: 'GMP 인증', label: 'GMP 인증', sub: '베트남 식품안전청 · 식품 안전기준 준수시설' },
      { src: '/uploads/misc/cert-iso13485.jpg', alt: 'ISO 13485:2016', label: 'ISO 13485:2016', sub: '품질 경영시스템 인증' },
      { src: '/uploads/misc/cert-ocop.jpg', alt: 'OCOP 4성급', label: 'OCOP 4성급', sub: '베트남 동나이 인민위원회 · 2025' },
      { src: '/uploads/misc/cert-gold-brand.jpg', alt: '황금브랜드 인증', label: '황금브랜드 인증', sub: '베트남 농업총국 · 2025' },
      { src: '/uploads/misc/cert-asia-brand.jpg', alt: 'Asia Excellent Brand', label: 'Asia Excellent Brand', sub: 'Top 10 아시아 우수 브랜드 · 2025' },
    ],
  },
  lineup: {
    num: '07',
    tag: 'Chapter VII · Product Lineup',
    title: "대라천 '참'침향 7종",
    subtitle: '캡슐 · 오일 · 침향수 · 스틱 · 차 · 침향단 · 선향',
    items: [
      { category: 'CAPSULE', name: '침향캡슐', description: '1일 1회 아침식사 후 1캡슐(침향오일 3mg). 기혈 순환·자양강장에 도움.' },
      { category: 'OIL', name: '침향오일(수지)', description: '1일 1~2회 손목·인중·목 뒷부분에 도포 또는 소량 복용.' },
      { category: 'WATER', name: '침향수', description: '1일 1회 20ml 음용 또는 가습기로 취향. 깨끗한 베이스.' },
      { category: 'STICK', name: '침향스틱', description: "조각을 온열판에 올려 취향. '차'처럼 다시 사용 가능." },
      { category: 'TEA', name: '침향차', description: '1일 1회 25~30개 조각을 뜨거운 물에 우려 마심. 재탕·삼탕 가능.' },
      { category: 'PILL', name: '침향단', description: '하루 1회 저녁식사 후 천천히 씹어 복용.' },
      { category: 'INCENSE', name: '침향선향', description: '취향실에서 충분히 발향 후 30분 뒤 입실해 명상하며 취향.' },
    ],
  },
  closing: {
    kicker: 'Final Page · Get in Touch',
    title: '이제, 진짜를 만나보세요.',
    body: '본 디지털 에디션은 시작입니다. 실제 시향, 농장 영상의 풀버전, 도매·OEM·B2B 협업 제안은 1:1 상담을 통해 안내드립니다.',
    cta: [
      { label: '1:1 상담 예약', href: 'mailto:hello@daerachoen.com?subject=대라천%20디지털%20에디션%20문의' },
      { label: 'zoellife.com 둘러보기', href: '/' },
    ],
    contact: [
      { name: '대라천 브랜드 오피스', role: 'Business · Wholesale · OEM', email: 'hello@daerachoen.com' },
    ],
  },
};
