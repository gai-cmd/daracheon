import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import JsonLd from '@/components/ui/JsonLd';
import Hero from '@/components/home/Hero';
import TrustStrip from '@/components/home/TrustStrip';
import VerificationGrid from '@/components/home/VerificationGrid';

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

// TODO: 콘텐츠 확인 필요 — Benefits 영문 카테고리 라벨 디자인 추가, CMS 확인 필요
const benefitCategories = [
  'Qi Circulation',
  'Vitality',
  'Relaxation',
  'Anti-inflammatory',
  'Brain Health',
  'Digestion',
];

const processSteps = [
  '씨앗 발아 및 묘목 육성',
  '베트남 직영 농장 식재',
  '20년 이상 오르가닉 침향목 육성',
  '3~5년간 특허 수지유도제 3~5회 주입',
  '벌목 및 원물 정밀 채취',
  '최고급 제품 가공 및 검수',
];

// TODO: 콘텐츠 확인 필요 — 6단계 공정 duration 라벨 디자인 추가, CMS 확인 필요
const processMeta = [
  '6 — 12 Months',
  'Ha Tinh 200ha',
  '20+ Years',
  '3 — 5 Years',
  'Controlled Harvest',
  'HACCP · GMP',
];

const marqueeItems = [
  'CITES 국제인증',
  'Aquilaria Agallocha Roxburgh',
  'HACCP 식품안전 인증',
  'Organic 유기농 인증',
  '하띤성 200ha 직영 농장',
  '400만+ Trees',
  'DNA 유전자 검증',
];

// TODO: 콘텐츠 확인 필요 — Heritage 타임라인 label/meta 디자인 추가, CMS 확인 필요
const heritageTimeline = [
  {
    year: '1999',
    label: 'RESEARCH BEGINS',
    body: '베트남 침향 연구 시작. 하띤·동나이·푸꾸옥 세 지역의 침향목 생태 조사 착수.',
    meta: ['Ha Tinh', 'Dong Nai', 'Phu Quoc'],
  },
  {
    year: '2010',
    label: 'TECHNOLOGY PATENTED',
    body: '독자적 수지유도 기술 특허 획득. 3~5년간 3~5회 주입식 공법으로 안정적인 수지 수율 확보.',
    meta: ['KR Patent', 'Resin Induction'],
  },
  {
    year: '2024',
    label: 'BRAND LAUNCH',
    body: "프리미엄 침향 브랜드 '대라천 참침향' 정식 론칭. 학명·제조·시험 공개 정책 도입.",
    meta: ['Premium', 'Transparency'],
  },
];

export default function HomePage() {
  return (
    <main className="bg-lx-black text-lx-ivory">
      <JsonLd data={websiteJsonLd} />

      {/* ════════════ §1 Hero ════════════ */}
      <Hero />

      {/* ════════════ §1.5 Trust Strip (stats under hero) ════════════ */}
      <TrustStrip />

      {/* ════════════ §2 Verified — 4단계 검증 ════════════ */}
      <VerificationGrid
        notice={
          <p className="text-[0.95rem] text-white/70 leading-[1.9] font-light">
            대한민국 국가법령정보센터의 식약처 고시 &lsquo;대한민국약전외한약(생약)규격집&rsquo;과
            &lsquo;식약처 식품공전&rsquo; 두 곳에서 동일하게 등록된 공식 침향은{' '}
            <em className="font-serif text-gold-400 font-medium not-italic">
              Aquilaria Agallocha Roxburgh(AAR)
            </em>
            입니다.
          </p>
        }
      />

      {/* ════════════ §2b Notice detail + badges ════════════ */}
      <section className="py-20 md:py-28 px-7 lg:px-16 bg-lx-ink text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-14">
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
                <div className="h-full p-8 bg-lx-slate border border-gold-500/15 hover:border-gold-400/40 hover:-translate-y-1 transition-all duration-600">
                  <div className="font-serif text-2xl text-gold-400 font-light mb-4">{item.num}</div>
                  <p className="text-[0.88rem] text-white/65 leading-[1.9] font-light">
                    {item.text}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {certificationBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 border border-gold-500/30 font-mono text-[0.68rem] tracking-[0.12em] uppercase text-gold-400 hover:border-gold-500 hover:bg-gold-500/10 transition-all duration-400"
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
                className="inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-en-nav uppercase text-gold-500 hover:gap-4 hover:text-gold-400 transition-all"
              >
                대라천 &lsquo;참&rsquo;침향 인증 확인하기 →
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════ §3 Agarwood — 신들의 나무 ════════════ */}
      <section className="py-24 md:py-[140px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
        <div className="max-w-page mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-14 md:gap-20 items-end mb-20 md:mb-24">
            <RevealOnScroll>
              <div>
                <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
                  Agarwood · 신들의 나무
                </span>
                <h2 className="mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] font-extralight tracking-kr-tight leading-[1.15]">
                  신들의 나무,
                  <br />
                  침향
                </h2>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <p className="text-[0.96rem] text-neutral-600 leading-[1.95] font-light">
                침향은 침향나무(Aquilaria)가 스스로의 상처를 치유하며 수십 년에 걸쳐 만들어 낸
                수지입니다. 동의보감은 침향을 &lsquo;기를 통하게 하는 상약&rsquo;으로 기록했고,
                오늘날 SCI급 논문이 그 가치를 재확인하고 있습니다.
              </p>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-lx-ink/10">
            {agarwoodCards.map((card, i) => (
              <RevealOnScroll key={card.title} delay={i * 100}>
                <div className="h-full px-9 pt-12 pb-14 border-b border-r last:border-r-0 border-lx-ink/10 hover:bg-white transition-colors duration-500">
                  <div className="flex items-center gap-3 mb-9 font-mono text-[0.72rem] tracking-en-tag uppercase text-gold-500 font-semibold">
                    {String(i + 1).padStart(2, '0')}
                    <span className="flex-1 h-px bg-lx-ink/12" />
                  </div>
                  <h3 className="text-[1.4rem] font-normal tracking-kr-tight mb-3.5 text-lx-ink">
                    {card.title}
                  </h3>
                  <p className="text-[0.88rem] text-neutral-600 leading-[1.9] font-light">
                    {card.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ §4 Benefits — 연구 기반 효능 ════════════ */}
      <section id="benefits" className="py-24 md:py-[140px] px-7 lg:px-16 bg-lx-sand text-lx-ink">
        <div className="max-w-page mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16 md:mb-20">
            <RevealOnScroll>
              <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
                Benefits · 연구 기반 효능
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extralight tracking-kr-tight leading-[1.2]">
                침향의 효능에 주목!
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <span className="block mx-auto my-6 w-12 h-px bg-gold-700" />
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-white border border-lx-ink/8">
            {benefits.map((b, i) => (
              <RevealOnScroll key={b.title} delay={i * 80}>
                <div className="h-full px-9 py-11 border-r border-b border-lx-ink/8">
                  <div className="flex items-baseline gap-3 mb-7 font-serif text-[1.2rem] font-medium text-gold-500 tracking-[0.1em]">
                    {String(i + 1).padStart(2, '0')}
                    <span className="block w-7 h-px bg-gold-500" />
                  </div>
                  {benefitCategories[i] && (
                    <div className="font-mono text-[0.68rem] tracking-[0.12em] uppercase text-gold-700 mb-3.5">
                      {benefitCategories[i]}
                    </div>
                  )}
                  <h4 className="text-[1.05rem] font-medium text-lx-ink mb-2.5">{b.title}</h4>
                  <p className="text-[0.84rem] text-neutral-600 leading-[1.9] font-light">
                    {b.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ §5 Marquee ════════════ */}
      <div className="bg-lx-black py-10 overflow-hidden border-y border-gold-500/15">
        <div className="marquee-track">
          {[...Array(2)].map((_, setIdx) =>
            marqueeItems.map((text) => (
              <span
                key={`${setIdx}-${text}`}
                className="font-serif text-[1.05rem] italic text-gold-500/65 font-light tracking-[0.08em] whitespace-nowrap inline-flex items-center gap-16 after:content-['◆'] after:text-[0.45rem] after:opacity-50 after:not-italic"
              >
                {text}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ════════════ §6 Heritage — 26년의 집념 ════════════ */}
      <section
        id="heritage"
        className="relative py-24 md:py-[140px] px-7 lg:px-16 bg-lx-black text-white overflow-hidden"
      >
        {/* 大羅天 giant hanja watermark */}
        <div
          aria-hidden
          className="absolute right-[-4%] top-1/2 -translate-y-1/2 font-serif font-medium leading-[0.9] tracking-[-0.04em] text-gold-500/[0.03] select-none pointer-events-none [writing-mode:vertical-rl]"
          style={{ fontSize: 'clamp(16rem, 28vw, 32rem)' }}
        >
          大羅天
        </div>

        <div className="relative z-10 max-w-page mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-20 lg:gap-24 items-start">
          <div>
            <RevealOnScroll>
              <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
                Heritage · 26년의 집념
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] font-extralight tracking-kr-tight leading-[1.15]">
                수십 년 이상의 집념,
                <br />
                완벽을 향한 여정
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <span className="block mt-7 w-12 h-px bg-gold-500" />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="mt-7 max-w-[500px] text-[0.94rem] text-white/72 leading-[1.95] font-light">
                조엘라이프는 &lsquo;자연의 진실된 가치&rsquo;를 모토로 한 프리미엄 침향 브랜드
                [대라천 &lsquo;참&rsquo;침향]을 소개합니다. 침향은 수천 년 전부터 귀하게 여겨져 온
                천연의 선물로, 침향나무가 스스로 상처를 치유하며 만들어내는 고귀한 수지입니다.
              </p>
            </RevealOnScroll>
          </div>

          <div className="border-l border-gold-500/30 pl-9">
            {heritageTimeline.map((item, i) => (
              <RevealOnScroll key={item.year} delay={i * 100}>
                <div className="relative pb-12 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[46px] top-2.5 w-2.5 h-2.5 rounded-full bg-gold-500 ring-4 ring-gold-500/12"
                  />
                  <div className="font-serif text-[2rem] font-light text-gold-500 tracking-[0.04em] leading-none">
                    {item.year}
                  </div>
                  <div className="mt-2.5 mb-4 font-mono text-[0.65rem] tracking-[0.28em] uppercase text-white/50">
                    {item.label}
                  </div>
                  <p className="text-[0.88rem] text-white/78 leading-[1.9] font-light">
                    {item.body}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2.5">
                    {item.meta.map((m) => (
                      <span
                        key={m}
                        className="font-mono text-[0.65rem] tracking-[0.14em] uppercase text-gold-400 px-2.5 py-1 border border-gold-500/25"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ §7 Process — 6단계 공정 ════════════ */}
      <section className="py-24 md:py-[140px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
        <div className="max-w-page mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-20 md:mb-24">
            <RevealOnScroll>
              <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
                Craftsmanship · 6단계 공정
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extralight tracking-kr-tight leading-[1.2]">
                완벽을 향한 6단계 공정
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <span className="block mx-auto my-6 w-12 h-px bg-gold-700" />
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-lx-ink/10">
            {processSteps.map((step, i) => (
              <RevealOnScroll key={step} delay={i * 80}>
                <div className="h-full px-8 pt-11 pb-12 border-b border-r border-lx-ink/10 hover:bg-white transition-colors duration-500">
                  <div className="font-serif text-[2.6rem] font-light text-gold-500 leading-none tracking-kr-tight opacity-90">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h4 className="mt-7 text-base font-medium text-lx-ink">{step}</h4>
                  {processMeta[i] && (
                    <div className="mt-2 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-gold-700">
                      {processMeta[i]}
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ §8 Origin — 청정 자연 ════════════ */}
      <section className="py-24 md:py-[140px] px-7 lg:px-16 bg-white text-lx-ink">
        <div className="max-w-page mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          <div>
            <RevealOnScroll>
              <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
                Origin · 베트남 하띤
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extralight tracking-kr-tight leading-[1.2]">
                청정 자연이 품은
                <br />
                생명의 땅
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <span className="block my-7 w-12 h-px bg-gold-700" />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="text-[0.95rem] text-neutral-600 leading-[1.9] font-light">
                동나이, 하띤, 푸꾸옥. 베트남 최고의 청정 지역에 위치한 ZOEL LIFE 직영 농장. 최적의
                기후와 토양, 그리고 장인의 정성이 만나 세계 최고 품질의 침향이 탄생합니다.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <Link
                href="/process"
                className="mt-10 inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-en-nav uppercase text-gold-500 hover:gap-4 hover:text-gold-700 transition-all"
              >
                농장 이야기 자세히 →
              </Link>
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

      {/* ════════════ §9 CTA ════════════ */}
      <section className="py-24 md:py-[140px] px-7 lg:px-16 bg-lx-ivory text-lx-ink text-center">
        <div className="max-w-[700px] mx-auto">
          <RevealOnScroll>
            <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
              Contact · 문의
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h2 className="mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] font-extralight tracking-kr-tight leading-[1.15]">
              대라천 &lsquo;참&rsquo;침향의
              <br />
              세계로 초대합니다
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <span className="block mx-auto my-7 w-12 h-px bg-gold-700" />
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="max-w-[560px] mx-auto mb-10 text-[0.92rem] text-neutral-600 leading-[1.9] font-light">
              ZOEL LIFE의 제품 상담, 대량 구매, 기업 납품 문의를 환영합니다.
              <br />
              전문 컨설턴트가 고객님의 요구에 맞는 최적의 제품을 추천해 드립니다.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="flex gap-3.5 justify-center flex-wrap">
              <Link
                href="/support#contact"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gold-500 text-lx-black border border-gold-500 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:bg-gold-700 hover:border-gold-700 hover:-translate-y-0.5"
              >
                문의하기
              </Link>
              <Link
                href="/home-shopping"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-transparent text-lx-ink border border-lx-ink/40 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:border-gold-700 hover:text-gold-700 hover:-translate-y-0.5"
              >
                홈쇼핑 바로가기
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
