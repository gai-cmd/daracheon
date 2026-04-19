import type { Metadata } from 'next';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import StorySection from '@/components/about-agarwood/StorySection';

export const metadata: Metadata = {
  title: '생산 공정 - 완벽을 향한 장인 정신 | ZOEL LIFE',
  description:
    '대라천 침향의 14단계 생산 공정. 식목부터 최종 출하까지 최소 26년의 시간과 장인 정신이 담긴 프리미엄 침향 제조 과정을 소개합니다.',
  alternates: { canonical: 'https://www.daracheon.com/process' },
};

const HERO_BG =
  'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png';

const processSteps = [
  {
    num: 1,
    title: '원목 선별',
    desc: '베트남 직영 농장에서 최상급 침향나무 원목을 엄선합니다.',
  },
  {
    num: 2,
    title: '자연 숙성',
    desc: '25년간 축적된 노하우로 자연 환경에서 침향을 숙성시킵니다.',
  },
  {
    num: 3,
    title: '수확 및 분류',
    desc: '숙성된 침향을 수확하고 등급별로 정밀 분류합니다.',
  },
  {
    num: 4,
    title: '세척 및 건조',
    desc: '불순물을 제거하고 전통 방식으로 자연 건조합니다.',
  },
  {
    num: 5,
    title: '특허 추출',
    desc: '특허받은 독자적 기술로 침향의 유효성분을 추출합니다.',
  },
  {
    num: 6,
    title: '품질 검사',
    desc: 'HACCP, Organic 인증 기준에 따라 엄격한 품질 검사를 실시합니다.',
  },
  {
    num: 7,
    title: '제품화',
    desc: '최종 가공 후 프리미엄 패키지로 제품을 완성합니다.',
  },
  {
    num: 8,
    title: '출하',
    desc: 'CITES 국제인증을 받고 전 세계로 출하합니다.',
  },
];

const certifications = [
  {
    title: 'CITES',
    desc: '멸종위기 야생동식물 국제거래 협약 인증',
  },
  {
    title: 'HACCP',
    desc: '식품안전관리인증기준 준수',
  },
  {
    title: 'Organic',
    desc: '친환경 유기농 재배 방식 채택',
  },
  {
    title: 'Patent',
    desc: '독자적인 침향 추출 및 가공 특허 기술',
  },
];

const STEP_TAGS = [
  'Selection',
  'Maturation',
  'Harvest',
  'Drying',
  'Extraction',
  'Quality',
  'Packaging',
  'Shipment',
];

export default function ProcessPage() {
  return (
    <>
      {/* Hero — dark luxury with ambient gold glow */}
      <section className="relative pt-nav bg-lx-black text-lx-ivory overflow-hidden border-b border-gold-500/15">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${HERO_BG}')` }}
        />
        <div className="absolute inset-0 bg-hero-gold" />
        <div className="absolute inset-0 bg-gradient-to-b from-lx-black/40 via-lx-black/60 to-lx-ink" />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16 pt-[140px] pb-[120px]">
          <p className="font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 mb-[30px]">
            Craftsmanship &amp; Process
          </p>
          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-extralight tracking-kr-tight leading-[1.15] mb-8">
            생산 공정<br />
            <em className="not-italic font-serif font-normal text-gold-500 whitespace-nowrap">
              완벽을 향한 장인 정신
            </em>
          </h1>
          <p className="text-[1.05rem] leading-[1.9] text-white/72 font-light max-w-[720px]">
            자연이 허락한 시간, 정직한 땀방울의 결실. 식목부터 최종 출하까지
            최소 26년의 시간이 한 병의 대라천 침향에 담깁니다.
          </p>
        </div>
      </section>

      {/* 8 Production Steps — rendered as story chapters */}
      {processSteps.map((step, i) => (
        <RevealOnScroll key={step.num}>
          <StorySection
            num={String(step.num).padStart(2, '0')}
            tag={`Step ${String(step.num).padStart(2, '0')} — ${STEP_TAGS[i]}`}
            title={step.title}
            alt={i % 2 === 1}
          >
            <p>{step.desc}</p>
          </StorySection>
        </RevealOnScroll>
      ))}

      {/* Visual Break — 26+ Years */}
      <section className="relative h-[420px] overflow-hidden">
        <Image
          src={HERO_BG}
          alt="침향 생산 공정"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-lx-black/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <RevealOnScroll>
            <div className="text-center px-6">
              <p className="font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 mb-5">
                From Planting to Final Product
              </p>
              <p className="font-serif text-[clamp(3rem,6vw,5.5rem)] font-light text-gold-500 leading-none tracking-kr-tight">
                26<span className="text-white/80">+</span>{' '}
                <span className="text-white/90 text-[0.6em] align-middle font-sans font-extralight">
                  Years
                </span>
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Certifications — dark chapter */}
      <section className="bg-[#0c0d13] text-lx-ivory border-b border-gold-500/10">
        <div className="max-w-page mx-auto px-7 lg:px-16 py-[90px]">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20 mb-16">
            <div>
              <div className="font-serif text-[3.2rem] font-light leading-none tracking-kr-tight text-gold-500">
                05
              </div>
              <div className="mt-4 font-mono text-[0.66rem] tracking-en-tag uppercase text-white/50">
                Certifications
              </div>
            </div>
            <div className="max-w-[62ch]">
              <RevealOnScroll>
                <h3 className="text-[clamp(1.5rem,2.6vw,2rem)] font-light tracking-[-0.01em] leading-[1.3] mb-6 text-white">
                  국제 인증 기준
                </h3>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="text-[1.02rem] leading-[1.95] font-light text-white/72">
                  모든 공정은 네 가지 국제·국내 기준 하에 검증됩니다.
                </p>
              </RevealOnScroll>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gold-500/10">
            {certifications.map((cert, i) => (
              <RevealOnScroll key={cert.title} delay={i * 100}>
                <div className="h-full bg-lx-black p-8 transition-colors duration-400 ease-reveal hover:bg-[#12141c] group">
                  <div className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500 mb-4">
                    0{i + 1}
                  </div>
                  <h4 className="font-serif text-2xl font-light text-gold-500 mb-4 tracking-kr-tight">
                    {cert.title}
                  </h4>
                  <p className="text-sm text-white/65 leading-[1.85] font-light">
                    {cert.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Quote — dark, serif pull-quote */}
      <section className="bg-lx-black text-lx-ivory">
        <div className="max-w-page mx-auto px-7 lg:px-16 py-[120px] text-center">
          <RevealOnScroll>
            <p className="font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 mb-10">
              Principle
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <blockquote className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] font-light leading-[1.5] tracking-kr-tight text-white/90 max-w-3xl mx-auto">
              자연의 시간을 기다리는 정직함이
              <br />
              <em className="not-italic text-gold-500">
                ZOEL LIFE의 품질을 만듭니다.
              </em>
            </blockquote>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <span className="mt-12 block w-12 h-px bg-gold-700 mx-auto" />
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
