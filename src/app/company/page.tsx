import Link from 'next/link';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회사소개 - ZOEL LIFE(조엘라이프) | ZOEL LIFE',
  description:
    'ZOEL LIFE(조엘라이프) 회사 소개. 베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축하는 프리미엄 침향 브랜드.',
  alternates: { canonical: 'https://www.daracheon.com/company' },
};

const businessAreas = [
  {
    title: '글로벌 유통 네트워크 구축',
    description: '한국을 비롯한 글로벌 시장에서 침향 제품의 유통 채널을 확보하고 관리합니다.',
    icon: '🌏',
  },
  {
    title: '브랜드 전략 및 마케팅',
    description: '프리미엄 침향 브랜드로서의 포지셔닝과 마케팅 전략을 수립합니다.',
    icon: '📈',
  },
  {
    title: '온·오프라인 유통 채널 관리',
    description: '자사몰, 홈쇼핑, 오프라인 매장 등 다양한 판매 채널을 운영합니다.',
    icon: '🏬',
  },
  {
    title: '고객 서비스 및 CS 운영',
    description: '고객 상담, 주문 관리, 배송 추적 등 소비자 접점의 모든 서비스를 제공합니다.',
    icon: '🤝',
  },
  {
    title: '품질 보증 및 사후 관리',
    description: '제품의 품질 검증과 사후 관리를 통해 고객 만족을 보장합니다.',
    icon: '🛡️',
  },
];

const infoCards = [
  { label: 'LOCATION', value: '서울특별시 금천구 벚꽃로36길 30, 1511호' },
  { label: 'ESTABLISHED', value: '사업자등록번호 749-86-03668' },
  { label: 'EMAIL', value: 'bj0202@gmail.com' },
  { label: 'CONTACT', value: '070-4140-4086' },
  { label: 'CEO', value: '대표 박병주' },
];

export default function CompanyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/6ac650af-e832-4e80-a058-999e73ba5a81.jpg)',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">OUR STORY</p>
          <h1 className="section-title-kr text-white mb-5">ZOEL LIFE(조엘라이프)</h1>
          <p className="text-white/60 text-[0.95rem] leading-8 max-w-2xl mx-auto">
            베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축합니다
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-4">
              <p className="section-tag mb-5">프리미엄 침향 브랜드 운영 및 글로벌 유통</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="bg-white p-8 lg:p-12 border border-neutral-200">
              <h2 className="font-serif text-2xl mb-6">
                ZOEL LIFE 주식회사{' '}
                <span className="text-base text-neutral-400 font-normal">(영문: ZOEL LIFE Co., Ltd)</span>
              </h2>
              <p className="text-sm text-neutral-500 leading-8">
                ZOEL LIFE(조엘라이프)는 베트남 직영 농장에서 생산된 최상급 침향의 한국 및 글로벌 시장 유통을 담당합니다.
                브랜드 전략 수립, 마케팅, 온·오프라인 유통 채널 관리부터 고객 서비스까지 소비자 접점의 모든 과정을
                책임지는 프리미엄 라이프스타일 기업입니다.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Business Areas */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll><p className="section-tag">Business Areas</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">사업 영역</h2>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessAreas.map((area, i) => (
              <RevealOnScroll key={area.title} delay={i * 80}>
                <div className="p-8 border border-neutral-200 hover:border-gold-500/40 transition-colors h-full">
                  <div className="text-3xl mb-4 text-gold-500">{area.icon}</div>
                  <h3 className="font-serif text-lg mb-3">{area.title}</h3>
                  <p className="text-sm text-neutral-500 leading-7">{area.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">Company Info</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">기업 정보</h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="bg-white p-8 lg:p-12 border border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoCards.map(({ label, value }) => (
                  <div key={label} className="flex gap-4 py-3 border-b border-neutral-100">
                    <span className="text-[0.65rem] tracking-wider font-medium text-gold-600 w-28 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-sm text-neutral-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Vision */}
      <section className="py-28 px-6 bg-[#0a0b10] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <p className="section-tag mb-5">Vision</p>
            <h2 className="section-title-en text-white mb-8">Our Vision</h2>
            <blockquote className="font-serif text-2xl font-light leading-relaxed text-gold-300 mb-8">
              &ldquo;자연의 진실된 가치를 전 세계에 전하는 것&rdquo;
            </blockquote>
            <p className="text-white/50 text-sm leading-8 max-w-xl mx-auto">
              ZOEL LIFE는 베트남 직영 농장에서 생산된 최상급 침향을 전 세계에 전하며,
              투명한 유통과 과학적 품질 인증을 통해 프리미엄 침향의 글로벌 기준을 만들어갑니다.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="mt-12">
              <Link href="/support#contact" className="btn btn-gold">문의하기</Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
