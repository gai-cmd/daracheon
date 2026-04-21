import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import type { Product } from '@/data/products';
import ProductsClient from './ProductsClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '제품 소개 — 수십 년 숙성의 고귀한 침향 제품 | 대라천 ZOEL LIFE',
  description:
    "대라천 '참'침향 오일·환·수·차·스틱·향·염주 전 라인업. 25년 이상 숙성된 Aquilaria Agallocha Roxburgh 정품, Lot 번호로 농장·가공·검사 이력 조회.",
  keywords: [
    '대라천 제품', '침향 오일', '침향환', '침향수', '침향차',
    '침향 스틱', '침향 염주', 'ZOEL LIFE 제품', '25년산 침향',
  ],
  alternates: { canonical: 'https://www.daracheon.com/products' },
  openGraph: {
    type: 'website',
    title: '제품 소개 — 대라천 침향 제품 라인업',
    description: '오일·환·수·차·스틱·향·염주 — 25년 숙성 침향 제품 전 라인업.',
    url: 'https://www.daracheon.com/products',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '제품 소개 — 대라천 침향 제품',
    description: '25년 숙성 Aquilaria Agallocha Roxburgh 정품 라인업.',
  },
};

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

const CERTS = [
  { mark: 'C', k: 'CITES', v: '국제협약 인증' },
  { mark: 'H', k: 'HACCP', v: '식품안전' },
  { mark: 'V', k: 'VCO', v: '베트남 유기농' },
  { mark: 'K', k: '식약처', v: '식품공전 등재' },
];

// Fallback categories mirroring data/db/productCategories.json
const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'all', label: '전체', labelEn: 'All' },
  { id: '오일', label: '오일', labelEn: 'Essential Oil' },
  { id: '환', label: '환', labelEn: 'Pill' },
  { id: '수', label: '침향수', labelEn: 'Water' },
  { id: '차', label: '건강차', labelEn: 'Tea' },
  { id: '스틱', label: '스틱', labelEn: 'Stick' },
  { id: '향', label: '향', labelEn: 'Incense' },
  { id: '염주', label: '염주', labelEn: 'Prayer Beads' },
];

// Fallback products sourced from data/db/products.json (first 6 items).
// TODO: Cloudinary migration — local /uploads/products/* paths 404 on Vercel.
// Replace with Cloudinary URLs when production assets are uploaded.
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'cham-oil-capsule',
    slug: 'daerachoen-cham-agarwood-oil-capsule',
    name: "대라천 '참'침향 오일 캡슐",
    nameEn: 'Daeracheon Cham Agarwood Oil Capsule',
    category: '오일',
    categoryEn: 'Essential Oil',
    badge: 'Signature',
    price: 248000,
    priceDisplay: '248,000원',
    image: 'https://lh3.googleusercontent.com/d/1QOBVQuJizCRU0K_YT2dtW6p32GIMQWe-=w1280',
    gallery: [
      'https://lh3.googleusercontent.com/d/1QOBVQuJizCRU0K_YT2dtW6p32GIMQWe-=w1280',
      'https://lh3.googleusercontent.com/d/1iXb1OObZFxGH4xtejLDP1VXHHSyexq61=w1280',
      'https://lh3.googleusercontent.com/d/12L68teBwD-GcDTEcHemlnKmkmFQKFJhZ=w1280',
    ],
    description:
      "25년 이상 숙성된 Aquilaria Agallocha Roxburgh 침향나무 수지의 오일 0.59%를 담은 대라천의 시그니처 연질캡슐.",
    shortDescription: '25년산 정품 침향오일 연질캡슐 — 30캡슐 기프트박스.',
    features: [
      'Aquilaria Agallocha Roxburgh (정품 학명 인증)',
      '침향나무 수지 오일 0.59% 함유',
      '507.5mg × 30캡슐 = 총 15.225g',
    ],
    specs: {
      원산지: '베트남 (하띤, 동나이, 냐짱, 푸꿕, 람동)',
      수종: 'Aquilaria Agallocha Roxburgh',
      중량: '507.5mg × 30캡슐 (15.225g)',
      인증: 'Organic, HACCP, OCOP',
    },
    inStock: true,
    variants: [
      { id: 'v-cap-30', label: '30캡슐 (1박스)', price: 248000, priceDisplay: '248,000원', inStock: true, sku: 'CHAM-OIL-30' },
      { id: 'v-cap-90', label: '90캡슐 (3박스 세트)', price: 680000, priceDisplay: '680,000원', inStock: true, sku: 'CHAM-OIL-90' },
    ],
  },
  {
    id: 'cham-oil-raw',
    slug: 'agarwood-essential-oil-1ml',
    name: '대라천 침향 에센셜 오일 (침향油)',
    nameEn: 'Agarwood Essential Oil (1ml)',
    category: '오일',
    categoryEn: 'Essential Oil',
    badge: 'Premium',
    price: 650000,
    priceDisplay: '650,000원',
    image: 'https://lh3.googleusercontent.com/d/1YSbJhJZTJ2I5Lq69rdgZDY2y2yPTZDH9=w1280',
    description:
      '25년산 Aquilaria Agallocha Roxburgh 원목을 72시간 고온증류하여 얻은 순수 침향 에센셜 오일 100%.',
    shortDescription: '25년산 침향 100% 에센셜 오일, 72시간 고온증류 추출.',
    features: ['침향 에센셜 오일 100% (25년산)', '72시간 고온증류 추출', '취향·복용·마사지 다용도 사용'],
    specs: {
      원산지: '베트남',
      성분: '침향 에센셜 오일 100% (25년산)',
      부피: '1ml',
      인증: 'Organic, HACCP, OCOP',
    },
    inStock: true,
  },
  {
    id: 'cham-pill-chimhyang',
    slug: 'agarwood-chimhyangdan',
    name: '침향단 (沈香丹)',
    nameEn: 'Agarwood Traditional Pill',
    category: '환',
    categoryEn: 'Pill',
    badge: 'Traditional',
    price: 180000,
    priceDisplay: '180,000원',
    image: 'https://lh3.googleusercontent.com/d/15ZJSNlrS-2swxfEMXFpz1xORocX-Q1qb=w1280',
    description:
      '노니엑기스·북방감초·인삼·칵깐(녹용)·콜라겐·표고에 25년산 침향분말 10%를 더한 전통 방식의 환제(丸劑).',
    shortDescription: '25년산 침향분말 10% 배합 전통 환 — 1일 1단 식후 복용.',
    features: ['25년산 침향분말 10% 배합', '1일 1회 1단 식후 복용', 'Organic / HACCP / OCOP 인증'],
    specs: { 중량: '1단 5g × 15단 (총 75g)', 유통기한: '3년', 인증: 'Organic, HACCP, OCOP' },
    inStock: true,
  },
  {
    id: 'cham-pill-gibo',
    slug: 'agarwood-gibodan',
    name: '기보단 (氣寶丹)',
    nameEn: 'Gibodan Supreme',
    category: '환',
    categoryEn: 'Pill',
    badge: 'Luxury',
    price: 480000,
    priceDisplay: '480,000원',
    image: 'https://lh3.googleusercontent.com/d/1NwBmD4_XMpsZdY0Q_bFseBgln3a2HZO5=w1280',
    description: '25년산 침향에 동충하초·제비집을 더해 완성한 대라천의 최고급 복합 환.',
    shortDescription: '25년산 침향·동충하초·제비집 복합 프리미엄 환.',
    features: ['25년산 침향 + 동충하초 + 제비집', '1박스 3병 × 20포 = 60포 구성'],
    specs: { 포장: '1박스 3병 × 60포', 유통기한: '3년', 인증: 'Organic, HACCP, OCOP' },
    inStock: true,
  },
  {
    id: 'cham-water',
    slug: 'agarwood-water-500ml',
    name: '침향수 (沈香水)',
    nameEn: 'Agarwood Distilled Water',
    category: '수',
    categoryEn: 'Water',
    badge: 'Daily',
    price: 120000,
    priceDisplay: '120,000원',
    image: 'https://lh3.googleusercontent.com/d/1sTxSzflAyLjB8Y2NiFViuLZ8qF54kZhW=w1280',
    description: '25년산 침향 증류 추출물 100%로 만든 대라천 침향수. 분무·가습기로 확산시켜 취향하거나, 음용할 수 있는 일상형 제품.',
    shortDescription: '25년산 침향 증류 추출물 100% — 분무·음용 다용도.',
    features: ['침향 증류 추출물 100% (25년산)', '1일 음용 권장량 20ml'],
    specs: { 부피: '1병 500ml', 유통기한: '2년', 인증: 'Organic, HACCP, OCOP' },
    inStock: true,
  },
  {
    id: 'cham-tea-paramignya',
    slug: 'agarwood-paramignya-tea',
    name: '침향 파라미냐차 (沈香茶)',
    nameEn: 'Agarwood Paramignya Herbal Tea',
    category: '차',
    categoryEn: 'Tea',
    badge: 'Wellness',
    price: 95000,
    priceDisplay: '95,000원',
    image: 'https://lh3.googleusercontent.com/d/1BHqj8esblrca2p8kxG7c1Jawaql7H3AP=w1280',
    description: '25년산 침향과 베트남 전통 항암차 파라미냐(Paramignya)를 블렌딩한 허브티.',
    shortDescription: '25년산 침향 + 베트남 전통 파라미냐 블렌드 — 3탕 가능.',
    features: ['25년산 침향 + 파라미냐 블렌드', '30포 / 1박스 (총 75g)'],
    specs: { 중량: '1포 2.5g × 30포 (75g)', 유통기한: '4년', 인증: 'Organic, HACCP, OCOP' },
    inStock: true,
  },
];

export default async function ProductsPage() {
  const dbProducts = await readDataSafe<Product>('products');
  const dbCategories = await readDataSafe<ProductCategory>('productCategories');

  const products = dbProducts.length > 0 ? dbProducts : DEFAULT_PRODUCTS;
  const sourceCategories = dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES;

  const productCategories: ProductCategory[] = [
    { id: 'all', label: '전체', labelEn: 'All' },
    ...sourceCategories.filter((c) => c.id !== 'all'),
  ];

  return (
    <>
      {/* PAGE HERO */}
      <section className={styles.pageHero}>
        <div className={styles.wrap}>
          <div className={styles.crumb}>
            <a href="/">Home</a>
            <span className={styles.crumbSep}>/</span>
            <b>Products</b>
          </div>
          <div className={styles.pageHeroMain}>
            <div>
              <h1>
                수십 년 숙성의 시간을
                <br />
                담은 <em>고귀한 제품</em>
              </h1>
            </div>
            <p className={styles.lede}>
              베트남 Ha Tinh 직영 농장에서 25년간 연구한 침향을, 전통 제법과 현대 과학으로 완성한 라인업.
              모든 제품은 Lot 번호로 농장·가공·검사 이력을 조회할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Client: filter + sort + grid */}
      <ProductsClient products={products} productCategories={productCategories} />

      {/* CERTIFICATIONS */}
      <section className={styles.certs}>
        <div className={styles.wrap}>
          <div className={styles.certsInner}>
            <div>
              <div className={styles.certsKicker}>Certified</div>
              <h3 className={styles.certsHeadline}>
                모든 제품은 <em>국제 인증</em>으로<br />증명된 진품입니다
              </h3>
            </div>
            <div className={styles.certsRow}>
              {CERTS.map((c) => (
                <div key={c.k} className={styles.cert}>
                  <div className={styles.certMark}>{c.mark}</div>
                  <div className={styles.certK}>{c.k}</div>
                  <div className={styles.certV}>{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
