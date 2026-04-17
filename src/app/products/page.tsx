import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { readData } from '@/lib/db';
import type { Product } from '@/data/products';
import ProductsClient from './ProductsClient';

export const revalidate = 60;

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

export default async function ProductsPage() {
  const products = await readData<Product>('products');
  const dbCategories = await readData<ProductCategory>('productCategories');

  // 'all' 카테고리를 맨 앞에 추가
  const productCategories: ProductCategory[] = [
    { id: 'all', label: '전체', labelEn: 'All' },
    ...dbCategories.filter((c) => c.id !== 'all'),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png')",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">COLLECTION</p>
          <h1 className="section-title-kr text-white mb-5">
            ZOEL LIFE 침향 제품
          </h1>
          <p className="text-white/60 text-[0.95rem] leading-8 max-w-2xl mx-auto">
            자연의 진실된 가치를 담은 프리미엄 라인업
          </p>
          <div className="gold-line mx-auto mt-6" />
        </div>
      </section>

      {/* Client component handles category filter + product grid */}
      <ProductsClient products={products} productCategories={productCategories} />

      {/* CTA */}
      <section className="py-20 px-6 bg-[#0a0b10] text-center">
        <RevealOnScroll>
          <p className="section-tag mb-4">INQUIRY</p>
          <h2 className="font-serif text-2xl text-white mb-5">
            제품에 대해 궁금하신 점이 있으시면
          </h2>
          <Link href="/support#contact" className="btn btn-gold">
            문의하기
          </Link>
        </RevealOnScroll>
      </section>
    </>
  );
}
