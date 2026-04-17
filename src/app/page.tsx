import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import JsonLd from '@/components/ui/JsonLd';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ZOEL LIFE - 25년 전통 프리미엄 침향 전문 브랜드 | 대라천 \'참\'침향',
  description:
    '베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향. Aquilaria Agallocha Roxburgh 정품 침향, HACCP·GMP·CITES 인증. 대라천 참침향.',
  alternates: { canonical: 'https://www.daracheon.com' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ZOEL LIFE - 대라천 참침향',
  url: 'https://www.daracheon.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.daracheon.com/products?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const certificationBadges = [
  'CITES 보호 수종',
  '식약처 인정 정품 침향 사용',
  'HACCP 인증',
  'GMP 인증',
  '베트남 원산지 증명서',
  '침향 학명 인증서(아갈로차)',
  '유기농 인증서',
  '유해물질성적서',
];

const agarwoodCards = [
  {
    title: '동서양의 역사적 가치',
    description:
      '수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다.',
  },
  {
    title: '20년 이상의 긴 시간',
    description:
      '20년 이상 오랜 기간 생육된 침향나무에서 채취한 침향은 수지 함량이 높아 약재로서의 효능과 가치가 매우 높게 평가되고 있습니다.',
  },
  {
    title: '논문에서 발표하는 침향',
    description:
      '침향에 대한 연구가 전 세계적으로 활발하게 진행되고 있습니다. SCI급 논문에서도 침향에 대한 실제적인 효과에 대해 발표하고 있습니다.',
  },
];

const benefits = [
  {
    title: '기를 뚫어 순환 효과',
    description:
      '침향은 아래로 떨어지는 기운을 통해 몸속 전체의 기혈 순환을 원활하게 하여, 막힌 기를 뚫어주고 오장육부의 기능을 정상화하는 데 도움을 줍니다.',
  },
  {
    title: '강력한 원기 회복 및 자양강장',
    description:
      '동의보감에 기록된 바와 같이, 침향은 찬 기운을 몰아내고 따뜻한 성질로 몸의 기운을 보강하여 피로 해소와 활력 증진에 도움을 줍니다.',
  },
  {
    title: '신경 안정 및 숙면 유도',
    description:
      "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할을 합니다. 예민해진 신경을 이완시켜 스트레스를 완화하고 심리적 안정과 불면증 개선에 효과적입니다.",
  },
  {
    title: '항염 및 혈관 건강 개선',
    description:
      '침향은 항염 작용을 통해 염증 물질(사이토카인)을 억제하고, 혈전 형성을 방지하여 만성 염증 치료와 혈관 건강 증진에 도움을 줍니다.',
  },
  {
    title: '뇌 질환 예방',
    description:
      '침향은 뇌혈류 개선 및 뇌세포 보호에 도움을 주어, 뇌졸중과 같은 혈관 질환 예방 및 퇴행성 뇌 질환 예방에 긍정적인 영향을 미칠 수 있습니다.',
  },
  {
    title: '소화 기능 향상 및 복통 완화',
    description:
      '침향은 기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추는 데 도움을 줍니다.',
  },
];

const processSteps = [
  '씨앗 발아 및 묘목 육성',
  '베트남 직영 농장 식재',
  '20년 이상 오르가닉 침향목 육성',
  '3~5년간 특허 수지유도제 3~5회 주입',
  '벌목 및 원물 정밀 채취',
  '최고급 제품 가공 및 검수',
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />

      {/* ════════════ Hero ════════════ */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#0a0b10]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 animate-hero-zoom"
          style={{ backgroundImage: "url('https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/70" />
        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]" />

        <div className="relative z-10 text-center text-white max-w-[900px] px-6">
          {/* Emblem */}
          <div className="w-[60px] h-[60px] mx-auto mb-10 rounded-full border border-gold-500 flex items-center justify-center opacity-0 animate-fade-up [animation-delay:0.3s]">
            <svg className="w-7 h-7 fill-gold-500" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>

          <p className="text-[0.72rem] tracking-[0.4em] uppercase text-gold-500 mb-5 opacity-0 animate-fade-up [animation-delay:0.5s]">
            자연이 빚은 최고의 향
          </p>

          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1.3] tracking-[0.08em] mb-2 opacity-0 animate-fade-up [animation-delay:0.7s]">
            대라천 &lsquo;참&rsquo;침향
          </h1>

          <p className="font-display text-[clamp(1rem,2vw,1.3rem)] font-light italic tracking-[0.1em] text-gold-300 mb-6 opacity-0 animate-fade-up [animation-delay:0.9s]">
            베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향
          </p>

          <div className="flex gap-4 justify-center flex-wrap opacity-0 animate-fade-up [animation-delay:1.3s]">
            <Link href="/products" className="btn btn-gold">제품 보기</Link>
            <Link href="/brand-story" className="btn btn-outline-light">브랜드 이야기</Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0 animate-fade-in [animation-delay:2s] hidden md:flex">
          <span className="text-[0.65rem] tracking-[0.3em] uppercase text-gold-300 [writing-mode:vertical-lr]">
            scroll
          </span>
          <div className="w-px h-12 bg-gold-500" />
        </div>
      </section>

      {/* ════════════ Consumer Notice ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-[#0a0b10] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll><p className="section-tag">NOTICE</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr text-white mb-5">
                진짜 침향, 이젠<br />학명부터 확인하세요!
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="text-[0.95rem] text-white/70 leading-9 max-w-3xl mx-auto mb-12">
                대한민국 국가법령정보센터의 식약처 고시 &lsquo;대한민국약전외한약(생약)규격집&rsquo;과 &lsquo;식약처 식품공전&rsquo; 두 곳에서
                동일하게 등록된 공식 침향은 <span className="text-gold-500 font-medium">Aquilaria Agallocha Roxburgh(AAR)</span>입니다.
              </p>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                num: '01',
                text: "식약처 고시 '대한민국약전외한약(생약)규격집'에서는 침향의 학명을 '아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)'로 정의",
              },
              {
                num: '02',
                text: "'식약처 식품공전'에서는 아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)와 아퀼라리아 말라센시스 람(Aquilaria Malaccensis Lam)이 식용 가능한 침향으로 등록",
              },
              {
                num: '03',
                text: '대한민국 최대 한약재 시장인 경동시장에서는 아갈로차(Agallocha) 위주로 거래',
              },
            ].map((item, i) => (
              <RevealOnScroll key={item.num} delay={i * 100}>
                <div className="p-6 border border-gold-500/20 hover:border-gold-500 transition-all duration-400 h-full">
                  <div className="font-display text-2xl text-gold-500 mb-4">{item.num}</div>
                  <p className="text-[0.88rem] text-white/60 leading-8">{item.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Certification Badges */}
          <RevealOnScroll>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {certificationBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 border border-gold-500/30 text-[0.72rem] tracking-[0.1em] text-gold-300 hover:border-gold-500 hover:bg-gold-500/10 transition-all duration-400"
                >
                  {badge}
                </span>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="text-center">
              <Link
                href="/brand-story"
                className="inline-flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-gold-500 hover:gap-4 transition-all"
              >
                대라천 &lsquo;참&rsquo;침향 인증 확인하기 →
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════ Agarwood ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll><p className="section-tag">AGARWOOD</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">신들의 나무, 침향</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agarwoodCards.map((card, i) => (
              <RevealOnScroll key={card.title} delay={i * 100}>
                <div className="p-8 bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-400 h-full">
                  <div className="w-12 h-12 rounded-full border border-gold-500 flex items-center justify-center mb-6">
                    <span className="font-display text-lg text-gold-500">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-serif text-xl font-normal tracking-wide mb-4">{card.title}</h3>
                  <p className="text-sm text-neutral-500 leading-7">{card.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ Stats ════════════ */}
      <section className="py-20 px-6 bg-[#1a1d29]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: '17,000+', label: '침향 나무' },
            { value: '25yr+', label: '연구 기간' },
            { value: '5', label: '베트남 산지' },
            { value: '10ha', label: '하띤성 직영 농장' },
          ].map((stat, i) => (
            <RevealOnScroll key={stat.label} delay={i * 100}>
              <div className="py-4">
                <div className="font-display text-[clamp(2.5rem,4vw,3.5rem)] font-light text-gold-500 leading-none mb-2">
                  {stat.value}
                </div>
                <div className="w-8 h-px bg-gold-500/50 mx-auto mb-3" />
                <div className="text-[0.75rem] tracking-[0.15em] text-neutral-400 uppercase">
                  {stat.label}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ════════════ Benefits ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-white" id="benefits">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll><p className="section-tag">BENEFITS</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">침향의 효능에 주목!</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <RevealOnScroll key={b.title} delay={i * 80}>
                <div className="p-8 border border-neutral-200 hover:border-gold-500/40 transition-all duration-400 h-full">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center mb-5">
                    <span className="font-display text-sm text-gold-500 font-medium">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-serif text-lg font-normal mb-3">{b.title}</h3>
                  <p className="text-sm text-neutral-500 leading-7">{b.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ Marquee ════════════ */}
      <div className="bg-[#1a1d29] py-8 overflow-hidden">
        <div className="marquee-track">
          {[...Array(2)].map((_, setIdx) => (
            ['CITES 국제인증', 'Aquilaria agallocha Roxburgh', 'HACCP 식품안전 인증', 'Organic 유기농 인증', '하띤성 10ha 직영 농장', '17,000+ Trees', 'DNA 유전자 검증'].map((text) => (
              <span key={`${setIdx}-${text}`} className="font-display text-lg lg:text-xl font-light italic text-gold-500/60 whitespace-nowrap flex items-center gap-16 after:content-['◆'] after:text-[0.5rem] after:opacity-40">
                {text}
              </span>
            ))
          ))}
        </div>
      </div>

      {/* ════════════ Heritage ════════════ */}
      <section className="relative py-28 lg:py-36 px-6 bg-[#0a0b10] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1920&q=80')" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <RevealOnScroll><p className="section-tag">HERITAGE</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr text-white mb-5">
                수십 년 이상의 집념,<br />완벽을 향한 여정
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mb-8" /></RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="text-[0.92rem] text-white/65 leading-9 mb-5">
                조엘라이프는 &lsquo;자연의 진실된 가치&rsquo;를 모토로 한 프리미엄 침향 브랜드
                [대라천 &lsquo;참&rsquo;침향]을 소개합니다. 침향은 수천 년 전부터 귀하게 여겨져 온
                천연의 선물로, 침향나무가 스스로 상처를 치유하며 만들어내는 고귀한 수지입니다.
              </p>
            </RevealOnScroll>
          </div>

          <div className="space-y-8">
            {[
              { year: '1999', event: '베트남 침향 연구 시작' },
              { year: '2010', event: '독자적 수지유도 기술 특허 획득' },
              { year: '2024', event: '프리미엄 브랜드 론칭' },
            ].map((item, i) => (
              <RevealOnScroll key={item.year} delay={i * 100}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-20 h-20 rounded-full border border-gold-500 flex items-center justify-center font-display text-xl font-light text-gold-500 hover:bg-gold-500 hover:text-[#0a0b10] transition-all duration-400">
                    {item.year}
                  </div>
                  <div className="pt-5">
                    <p className="text-white/70 text-[0.95rem] leading-7">{item.event}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ Craftsmanship ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <RevealOnScroll><p className="section-tag">CRAFTSMANSHIP</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">완벽을 향한 6단계 공정</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, i) => (
              <RevealOnScroll key={step} delay={i * 100}>
                <div className="text-center px-4 lg:px-6">
                  <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-full border border-gold-500 flex items-center justify-center font-display text-2xl font-light text-gold-500 bg-[#fdfbf7] hover:bg-gold-500 hover:text-[#0a0b10] transition-all duration-400">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h4 className="font-serif text-lg font-normal tracking-wide mb-3">
                    {step}
                  </h4>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ Origin ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <RevealOnScroll><p className="section-tag">ORIGIN</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-5">
                청정 자연이 품은<br />생명의 땅
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}><div className="gold-line mb-8" /></RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="text-[0.95rem] text-neutral-500 leading-9">
                동나이, 하띤, 푸꾸옥. 베트남 최고의 청정 지역에 위치한 ZOEL LIFE 직영 농장.
                최적의 기후와 토양, 그리고 장인의 정성이 만나 세계 최고 품질의 침향이 탄생합니다.
              </p>
            </RevealOnScroll>
          </div>

          <RevealOnScroll direction="right">
            <div className="relative">
              <Image
                src="https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png"
                alt="ZOEL LIFE 베트남 직영 침향 농장"
                width={600}
                height={750}
                className="w-full h-[500px] lg:h-[600px] object-cover"
              />
              <div className="absolute top-5 left-5 -right-5 -bottom-5 border border-gold-500/40 -z-10" />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════ CTA ════════════ */}
      <section className="py-28 lg:py-36 px-6 bg-[#fdfbf7] text-center">
        <div className="max-w-[700px] mx-auto">
          <RevealOnScroll><p className="section-tag">Contact Us</p></RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h2 className="section-title-kr mb-4">
              대라천 &lsquo;참&rsquo;침향의<br />세계로 초대합니다
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={200}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-[0.92rem] text-neutral-500 leading-8 mb-10">
              ZOEL LIFE의 제품 상담, 대량 구매, 기업 납품 문의를 환영합니다.<br />
              전문 컨설턴트가 고객님의 요구에 맞는 최적의 제품을 추천해 드립니다.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/support#contact" className="btn btn-gold">문의하기</Link>
              <Link href="/home-shopping" className="btn btn-outline-dark">홈쇼핑 바로가기</Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
