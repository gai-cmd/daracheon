import Link from 'next/link';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import StorySection from '@/components/about-agarwood/StorySection';

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
      {/* ── HERO — dark-first, kicker + serif em ── */}
      <section className="relative pt-nav pb-32 bg-lx-black text-lx-ivory overflow-hidden border-b border-gold-500/15">
        <div className="absolute inset-0 bg-hero-gold pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-hero-dark opacity-60 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16 pt-32">
          <RevealOnScroll>
            <p className="font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 mb-7">
              — 회사소개 —
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-extralight leading-[1.15] tracking-kr-tight mb-8 max-w-[18ch]">
              진짜를 증명하는 일에
              <br />
              <em className="not-italic font-serif font-normal text-gold-500">
                25년을 쓰다
              </em>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-[1.05rem] leading-[1.9] font-light text-white/72 max-w-[720px]">
              ZOEL LIFE 주식회사 — 베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축하는
              프리미엄 침향 브랜드. 브랜드 전략 수립, 마케팅, 유통 채널 관리부터 고객 서비스까지
              소비자 접점의 모든 과정을 책임지는 라이프스타일 기업입니다.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── CH 01 · About — 회사 개요 ── */}
      <StorySection num="01" tag="About" title="회사 개요">
        <p>
          <span className="font-serif text-lx-ivory">ZOEL LIFE 주식회사</span>{' '}
          <span className="text-white/50 text-[0.88em]">(영문: ZOEL LIFE Co., Ltd)</span>는
          베트남 직영 농장에서 생산된 최상급 침향의 한국 및 글로벌 시장 유통을 담당하는 프리미엄 침향 브랜드입니다.
        </p>
        <p>
          브랜드 전략 수립, 마케팅, 온·오프라인 유통 채널 관리부터 고객 서비스까지 소비자 접점의 모든 과정을
          책임지는 프리미엄 라이프스타일 기업으로, 프리미엄 침향 브랜드 운영 및 글로벌 유통을 핵심 사업으로 합니다.
        </p>
      </StorySection>

      {/* ── CH 02 · Leadership — 창립자 박병주 대표 ── */}
      <StorySection num="02" tag="Leadership" title="창립자 · 박병주 대표" alt>
        <p>
          대표 박병주 — 베트남 현지 농장부터 한국 본사까지 가치사슬 전 과정을 직접 설계하고 운영해온 창립자.
          원산지·원료·제조·유통 4단계를 한 그루의 침향에 꿰어내며, &ldquo;진짜를 증명한다&rdquo;는 단 하나의 원칙으로
          ZOEL LIFE를 이끌고 있습니다.
        </p>
        {/* TODO: 확인 필요 — 창립자 박병주 대표의 저서·경력 (예: 전 식품영양학과 교수, 베트남 농업부 자문,
            저서 《침향, 수지가 말하는 25년》 등) 실제 프로필 확보 후 기입 */}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-gold-500/15 border border-gold-500/15">
          {businessAreas.slice(0, 3).map((area) => (
            <div key={area.title} className="bg-[#0c0d13] p-7">
              <div className="font-serif text-2xl text-gold-500 mb-4">{area.icon}</div>
              <h4 className="font-serif text-[1.05rem] text-lx-ivory mb-3 leading-snug">
                {area.title}
              </h4>
              <p className="text-[0.88rem] text-white/60 leading-7 font-light">
                {area.description}
              </p>
            </div>
          ))}
          {businessAreas.slice(3).map((area) => (
            <div key={area.title} className="bg-[#0c0d13] p-7">
              <div className="font-serif text-2xl text-gold-500 mb-4">{area.icon}</div>
              <h4 className="font-serif text-[1.05rem] text-lx-ivory mb-3 leading-snug">
                {area.title}
              </h4>
              <p className="text-[0.88rem] text-white/60 leading-7 font-light">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* ── CH 03 · Certifications — 공식 인증·등록 ── */}
      <StorySection num="03" tag="Certifications" title="공식 인증 · 등록">
        <p>
          원산지부터 제품까지 전 과정이 국내·국제 공식 인증 체계에 등록되어 있습니다.
          모든 인증서 원본은 본사 또는 문의 채널을 통해 확인하실 수 있습니다.
        </p>

        {/* TODO: 확인 필요 — CITES 등록번호, 베트남 수출허가번호, ISO 22000 / HACCP 인증번호 실제값.
            아래는 레퍼런스 HTML의 placeholder 값으로, 실제 인증번호로 교체 필요. */}
        <dl className="mt-10 divide-y divide-gold-500/10 border-y border-gold-500/15">
          {[
            { label: 'CITES', value: 'VN-2008-AAR-003 (placeholder — 실제값 확인 필요)' },
            { label: '수출허가', value: 'EXP-VN-2024-112 (placeholder — 실제값 확인 필요)' },
            { label: '식약처', value: '건강기능식품 전문제조업 허가' },
            { label: 'ISO 22000', value: '식품안전경영시스템 인증 (번호 확인 필요)' },
            { label: 'HACCP', value: '제조시설 인증 (번호 확인 필요)' },
          ].map(({ label, value }) => (
            <div key={label} className="py-5 grid grid-cols-[120px_1fr] gap-6 items-baseline">
              <dt className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500">
                {label}
              </dt>
              <dd className="text-[0.95rem] text-white/75 font-light leading-7">{value}</dd>
            </div>
          ))}
        </dl>
      </StorySection>

      {/* ── CH 04 · Contact — 본사·찾아오시는 길 ── */}
      <StorySection num="04" tag="Contact" title="본사 · 찾아오시는 길" alt>
        <p>
          서울 본사에서는 평일 09:00~18:00 동안 브랜드 문의·유통 상담을 받습니다.
          베트남 직영 농장 견학은 사전 예약제로 운영됩니다.
        </p>

        <dl className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 border-y border-gold-500/15 py-8">
          {infoCards.map(({ label, value }) => (
            <div key={label} className="flex gap-5 items-baseline">
              <dt className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500 w-24 flex-shrink-0">
                {label}
              </dt>
              <dd className="text-[0.95rem] text-white/80 font-light leading-7">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <Link
            href="/support#contact"
            className="inline-flex items-center gap-3 px-7 py-4 border border-gold-500/50 text-gold-400 font-mono text-[0.72rem] tracking-en-tag uppercase transition-colors duration-400 hover:bg-gold-500 hover:text-lx-black hover:border-gold-500"
          >
            문의하기 →
          </Link>
        </div>
      </StorySection>

      {/* ── VISION — final serif blockquote on lx-black ── */}
      <section className="bg-lx-black text-lx-ivory py-32 px-7 lg:px-16 text-center border-t border-gold-500/15">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <p className="font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 mb-8">
              — Vision —
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <blockquote className="font-serif text-2xl md:text-3xl font-light leading-[1.6] text-gold-400 mb-10">
              &ldquo;자연의 진실된 가치를 전 세계에 전하는 것&rdquo;
            </blockquote>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-white/60 text-[0.95rem] leading-8 max-w-xl mx-auto font-light">
              ZOEL LIFE는 베트남 직영 농장에서 생산된 최상급 침향을 전 세계에 전하며,
              투명한 유통과 과학적 품질 인증을 통해 프리미엄 침향의 글로벌 기준을 만들어갑니다.
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
