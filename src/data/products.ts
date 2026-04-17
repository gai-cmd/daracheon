export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  priceDisplay?: string;
  inStock: boolean;
  sku?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  badge: string;
  price: number;
  priceDisplay: string;
  image: string;
  gallery?: string[];
  description: string;
  shortDescription: string;
  features: string[];
  specs: Record<string, string>;
  inStock: boolean;
  variants?: ProductVariant[];
}

export const products: Product[] = [
  {
    id: 'soft-capsule',
    slug: 'agarwood-soft-capsule',
    name: '침향 연질캡슐',
    nameEn: 'Agarwood Soft Capsule',
    category: '캡슐',
    categoryEn: 'Capsule',
    badge: 'Best',
    price: 0,
    priceDisplay: '가격 문의',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    description:
      '베트남 직영 농장에서 25년간 연구한 최고급 침향 연질캡슐입니다. CITES 국제인증, HACCP 인증을 받은 정품 침향만을 사용합니다.',
    shortDescription:
      '25년 연구의 결정체. CITES·HACCP 인증 프리미엄 침향 캡슐.',
    features: [
      'Aquilaria agallocha Roxburgh 정품',
      'CITES 국제인증',
      'HACCP 식품안전관리 인증',
      '유기농 재배 원료',
      'DNA 유전자 검증 완료',
    ],
    specs: {
      원산지: '베트남',
      원료: 'Aquilaria agallocha Roxburgh',
      인증: 'CITES, HACCP, Organic',
      보관방법: '직사광선을 피해 서늘한 곳 보관',
    },
    inStock: true,
  },
  {
    id: 'oil',
    slug: 'agarwood-oil',
    name: '침향 오일',
    nameEn: 'Agarwood Oil',
    category: '오일',
    categoryEn: 'Oil',
    badge: 'Premium',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png',
    description:
      '전통 고온증류 방식으로 72시간 이상 추출한 순수 침향 에센셜 오일입니다.',
    shortDescription:
      '72시간 고온증류 추출. 순수 침향 에센셜 오일.',
    features: [
      '72시간 고온 증류 추출',
      '순수 침향 오일',
      '아로마테라피 최적',
      '특허 추출 기술 적용',
    ],
    specs: {
      원산지: '베트남',
      추출방식: '고온 증류 (72시간)',
    },
    inStock: false,
  },
  {
    id: 'water',
    slug: 'agarwood-water',
    name: '침향수',
    nameEn: 'Agarwood Water',
    category: '침향수',
    categoryEn: 'Water',
    badge: 'Wellness',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    description:
      '침향 증류 과정에서 얻어지는 프리미엄 침향수입니다.',
    shortDescription:
      '증류 과정의 프리미엄 침향수. 매일 아침 공복 음용.',
    features: [
      '침향 증류 부산물',
      '매일 공복 음용 가능',
      '소화 기능 개선',
    ],
    specs: {
      원산지: '베트남',
    },
    inStock: false,
  },
  {
    id: 'pill',
    slug: 'agarwood-pill',
    name: '침향환',
    nameEn: 'Agarwood Pill',
    category: '환',
    categoryEn: 'Pill',
    badge: 'Traditional',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png',
    description:
      '전통 방식으로 제조한 침향환입니다. 선물용으로도 최적입니다.',
    shortDescription:
      '전통 제조 침향환. 깊고 진한 향의 정수.',
    features: [
      '전통 제조 방식',
      '선물용 최적',
      '깊고 진한 향',
    ],
    specs: {
      원산지: '베트남',
    },
    inStock: false,
  },
  {
    id: 'soap',
    slug: 'agarwood-soap',
    name: '침향 비누',
    nameEn: 'Agarwood Soap',
    category: '비누',
    categoryEn: 'Soap',
    badge: 'Natural',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    description:
      '침향 추출물을 함유한 프리미엄 천연 비누입니다.',
    shortDescription:
      '침향 추출물 함유 프리미엄 천연 비누.',
    features: [
      '침향 추출물 함유',
      '천연 성분',
      '보습 효과',
    ],
    specs: {
      원산지: '베트남',
    },
    inStock: false,
  },
  {
    id: 'stick',
    slug: 'agarwood-stick',
    name: '침향 스틱',
    nameEn: 'Agarwood Stick',
    category: '스틱',
    categoryEn: 'Stick',
    badge: 'Popular',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png',
    description:
      '간편하게 즐기는 침향 스틱입니다.',
    shortDescription:
      '간편 섭취형 침향 스틱.',
    features: [
      '간편 섭취',
      '휴대 편리',
    ],
    specs: {
      원산지: '베트남',
    },
    inStock: false,
  },
  {
    id: 'gift-set',
    slug: 'agarwood-gift-set',
    name: '침향 선물세트',
    nameEn: 'Agarwood Gift Set',
    category: '선물세트',
    categoryEn: 'Gift Set',
    badge: 'Gift',
    price: 0,
    priceDisplay: '준비 중',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    description:
      '소중한 분을 위한 프리미엄 침향 선물세트입니다.',
    shortDescription:
      '소중한 분을 위한 프리미엄 선물세트.',
    features: [
      '프리미엄 패키지',
      '선물용 최적',
      '다양한 구성',
    ],
    specs: {
      원산지: '베트남',
    },
    inStock: false,
  },
];

export const productCategories = [
  { id: 'all', label: '전체', labelEn: 'All' },
  { id: '캡슐', label: '캡슐', labelEn: 'Capsule' },
  { id: '오일', label: '오일', labelEn: 'Oil' },
  { id: '침향수', label: '침향수', labelEn: 'Water' },
  { id: '환', label: '환', labelEn: 'Pill' },
  { id: '비누', label: '비누', labelEn: 'Soap' },
  { id: '스틱', label: '스틱', labelEn: 'Stick' },
  { id: '선물세트', label: '선물세트', labelEn: 'Gift Set' },
];

export type ProductCategory = (typeof productCategories)[number];
