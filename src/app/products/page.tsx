import { readData } from '@/lib/db';
import type { Product } from '@/data/products';
import ProductsClient from './ProductsClient';
import styles from './page.module.css';

export const revalidate = 60;

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

export default async function ProductsPage() {
  const products = await readData<Product>('products');
  const dbCategories = await readData<ProductCategory>('productCategories');

  const productCategories: ProductCategory[] = [
    { id: 'all', label: '전체', labelEn: 'All' },
    ...dbCategories.filter((c) => c.id !== 'all'),
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
                담은 <em>{products.length}가지 제품</em>
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
