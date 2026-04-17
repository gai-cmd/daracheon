import type { Metadata } from 'next';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

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

export default function ProcessPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${HERO_BG}')` }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">CRAFTSMANSHIP & PROCESS</p>
          <h1 className="section-title-kr text-white mb-5">생산 공정</h1>
          <p className="text-white/65 text-[0.95rem] leading-9 max-w-2xl mx-auto mb-6">
            자연이 허락한 시간, 정직한 땀방울의 결실
          </p>
          <div className="gold-line mx-auto" />
        </div>
      </section>

      {/* 8 Process Steps */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <RevealOnScroll>
              <p className="section-tag">PROCESS</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">8단계 정밀 공정</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="gold-line mx-auto" />
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <RevealOnScroll key={step.num} delay={(i % 4) * 100}>
                <div className="relative p-8 bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl h-full">
                  {/* Gold numbered circle */}
                  <div className="w-14 h-14 mb-6 rounded-full bg-gold-500 text-[#0a0b10] flex items-center justify-center font-display text-xl font-semibold">
                    {step.num}
                  </div>
                  <h3 className="font-serif text-lg mb-3">{step.title}</h3>
                  <p className="text-sm text-neutral-500 leading-7">
                    {step.desc}
                  </p>

                  {/* Connector arrow (hidden on last in row) */}
                  {step.num < 8 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-gold-500/40 text-2xl z-10">
                      &rarr;
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Break - Full width image */}
      <section className="relative h-[400px] overflow-hidden">
        <Image
          src={HERO_BG}
          alt="침향 생산 공정"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <RevealOnScroll>
            <div className="text-center px-6">
              <p className="font-display text-5xl md:text-6xl text-gold-500 mb-4">
                26+ Years
              </p>
              <p className="text-white/70 text-sm tracking-[0.2em] uppercase">
                From Planting to Final Product
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Certification Cards */}
      <section className="py-28 px-6 bg-[#0a0b10] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll>
              <p className="section-tag">CERTIFICATIONS</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr text-white mb-4">
                국제 인증 기준
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="gold-line mx-auto" />
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, i) => (
              <RevealOnScroll key={cert.title} delay={i * 100}>
                <div className="p-8 border border-gold-500/20 hover:border-gold-500 transition-colors h-full text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full border-2 border-gold-500 flex items-center justify-center">
                    <span className="font-display text-lg text-gold-500 italic">
                      {cert.title}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-7">{cert.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 bg-[#fdfbf7] text-center">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <div className="font-display text-4xl text-gold-500 mb-6">
              &ldquo;
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <blockquote className="font-serif text-xl md:text-2xl font-light leading-relaxed tracking-wide text-neutral-700 mb-6">
              자연의 시간을 기다리는 정직함이
              <br />
              ZOEL LIFE의 품질을 만듭니다.
            </blockquote>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="gold-line mx-auto" />
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
