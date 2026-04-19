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
      {/* §1. Page Hero (compact, dark) */}
      <section className="relative overflow-hidden bg-lx-black text-lx-ivory pt-[calc(theme(spacing.nav)_+_80px)] pb-[70px] border-b border-gold-500/15">
        {/* Ambient gold glow background */}
        <div
          aria-hidden
          className="absolute inset-0 z-0 bg-hero-dark"
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 50% 60% at 18% 40%, rgba(212,168,67,0.12), transparent 60%), radial-gradient(ellipse 40% 50% at 82% 70%, rgba(70,42,16,0.6), transparent 60%)',
          }}
        />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[0.65rem] tracking-en-tag uppercase text-white/45 mb-8 flex items-center gap-3"
          >
            <Link href="/" className="hover:text-gold-400 transition-colors duration-400">
              Home
            </Link>
            <span className="opacity-40">/</span>
            <b className="text-gold-500 font-medium">Products</b>
          </nav>

          {/* Hero main: 2-column */}
          <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-10 md:gap-20 items-end">
            <RevealOnScroll>
              <h1 className="text-[clamp(2rem,4.2vw,3.6rem)] font-extralight tracking-kr-tight leading-[1.2] text-lx-ivory">
                ZOEL LIFE{' '}
                <em className="not-italic font-serif font-normal text-gold-500">
                  침향 제품
                </em>
                <br />
                자연의 진실된 가치
              </h1>
            </RevealOnScroll>
            <RevealOnScroll delay={150}>
              <p className="text-base leading-[1.85] text-white/70 font-light max-w-[460px] pb-1.5">
                베트남 직영 농장에서 25년간 연구한 침향을, 전통 제법과 현대
                과학으로 완성한 프리미엄 라인업.
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* §2 Filter bar + §3 Product grid (client) */}
      <ProductsClient products={products} productCategories={productCategories} />

      {/* §4. CTA */}
      <section className="bg-lx-black text-lx-ivory py-20 md:py-[90px] border-t border-gold-500/15">
        <div className="max-w-page mx-auto px-7 lg:px-16 text-center">
          <RevealOnScroll>
            <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-4">
              Inquiry
            </p>
            <h2 className="font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-light tracking-kr-tight text-lx-ivory mb-8">
              제품에 대해 <em className="not-italic text-gold-400">궁금하신 점</em>이
              있으시면
            </h2>
            <Link
              href="/support#contact"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gold-500 text-lx-black border border-gold-500 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:bg-gold-700 hover:border-gold-700 hover:-translate-y-0.5"
            >
              문의하기 <span aria-hidden>→</span>
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
