'use client';

import { useState } from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { AboutAgarwoodData } from './page';

interface Props {
  data: AboutAgarwoodData | null;
}

const tabs = ['침향이란?', '문헌에 실린 침향', '논문에 실린 침향'] as const;

const registryRows = [
  { label: '정식명', value: '침수향(沈水香), AQUILARIAE LIGNUM' },
  { label: '학명', value: 'Aquilaria Agallocha Roxburgh' },
  { label: '과명', value: '팥꽃나무과 Thymeleaceae' },
  { label: '정의', value: '이 약은 침향나무의 수지가 침착된 수간목이다' },
  { label: '성상', value: '흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있다' },
  { label: '기준', value: '건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상' },
  { label: '특징', value: '흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다' },
];

export default function AboutAgarwoodClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<number>(0);

  const hero = data?.hero;
  const definitionSection = data?.definitionSection;
  const formationSteps = data?.formationSteps ?? [];
  const specialReasons = data?.specialReasons ?? [];
  const benefits = data?.benefits ?? [];
  const literatures = data?.literatures ?? [];
  const papers = data?.papers ?? [];
  const cta = data?.cta;

  return (
    <div className="bg-lx-black text-lx-ivory">
      {/* Hero */}
      <section className="relative pt-[calc(theme(spacing.nav)+80px)] pb-28 md:pb-36 overflow-hidden bg-hero-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url('${hero?.heroImage ?? 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png'}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-hero-gold pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16 text-center">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-8">
            — {hero?.sectionTag ?? 'Agarwood Story'} —
          </p>
          <h1 className="text-[clamp(2.2rem,5vw,4.4rem)] font-extralight leading-[1.12] tracking-kr-tight text-lx-ivory mb-6">
            {hero?.titleKr ?? '이젠 진짜 침향 이야기'}
          </h1>
          <p className="font-serif text-xl md:text-2xl font-light italic text-gold-400 mb-8">
            {hero?.titleEn ?? 'Agarwood Story'}
          </p>
          <span className="block w-12 h-px bg-gold-700 mx-auto mb-8" aria-hidden />
          <p className="text-white/70 text-[0.95rem] md:text-base leading-[1.9] font-light max-w-2xl mx-auto">
            {hero?.subtitle ?? "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'에 공식 등록돼 있는 바로 그 침향입니다."}
          </p>
        </div>
      </section>

      {/* Tab Bar */}
      <section className="sticky top-nav z-40 bg-lx-black/92 backdrop-blur-xl border-b border-gold-500/14">
        <div className="max-w-page mx-auto px-7 lg:px-16 py-4 flex justify-center gap-2 md:gap-4 flex-wrap">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              aria-current={activeTab === i ? 'page' : undefined}
              className={`px-5 md:px-6 py-2.5 text-[0.78rem] tracking-en-nav uppercase transition-all duration-400 ease-out-soft border ${
                activeTab === i
                  ? 'bg-gold-500 text-lx-black border-gold-500'
                  : 'bg-transparent text-white/70 border-white/15 hover:border-gold-500/60 hover:text-gold-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ═════ Tab 0: 침향이란? ═════ */}
      {activeTab === 0 && (
        <>
          {/* Chapter 01 — Definition */}
          <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black border-b border-gold-500/10">
            <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
              <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-3">
                  Chapter 01 — Definition
                </p>
                <div className="font-serif text-gold-500 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">01</div>
              </div>
              <div>
                <RevealOnScroll>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.25] tracking-kr-tight text-lx-ivory mb-6">
                    {definitionSection?.title ?? '침향(沈香)이란 무엇인가?'}
                  </h2>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className="font-serif italic text-gold-400 text-lg md:text-xl mb-6 leading-[1.7]">
                    {definitionSection?.subtitle ?? '자연이 수십 년에 걸쳐 빚어낸 신비의 향, 물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)'}
                  </p>
                </RevealOnScroll>
                <RevealOnScroll delay={200}>
                  <p className="text-white/72 text-[0.95rem] md:text-base leading-[1.95] font-light max-w-[62ch] mb-10">
                    {definitionSection?.body ?? '침향(沈香, Agarwood)은 팥꽃나무과(Thymeleaceae)에 속하는 Aquilaria 속 나무가 외부 상처나 곰팡이 감염에 대응하여 분비한 수지(樹脂)가 수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목(香木)입니다.'}
                  </p>
                </RevealOnScroll>
                <RevealOnScroll delay={300}>
                  <div className="border-l-2 border-gold-500 pl-6 py-1 max-w-[62ch]">
                    <p className="font-serif text-lx-ivory text-lg md:text-xl font-light mb-2">
                      진짜 침향, 이제는 학명을 반드시 확인하세요.
                    </p>
                    <p className="text-white/68 text-[0.92rem] leading-[1.85]">
                      공식 침향은{' '}
                      <span className="text-gold-400 font-medium">
                        {definitionSection?.officialNameCallout ?? '아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)'}
                      </span>
                      입니다.
                    </p>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          {/* Chapter 02 — Official Registry (light) */}
          <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
            <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
              <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-3">
                  Chapter 02 — Registry
                </p>
                <div className="font-serif text-gold-600 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">02</div>
              </div>
              <div>
                <RevealOnScroll>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.25] tracking-kr-tight text-lx-ink mb-3">
                    대한민국약전외한약(생약)규격집
                  </h2>
                  <p className="font-serif text-gold-700 text-lg md:text-xl mb-8">공식 등재</p>
                </RevealOnScroll>
                <RevealOnScroll delay={150}>
                  <div className="bg-white border border-gold-500/25 p-8 md:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                      {registryRows.map((row) => (
                        <div key={row.label} className="flex gap-5 py-3 border-b border-neutral-200 last:border-0">
                          <span className="flex-shrink-0 w-16 font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-600 pt-0.5">{row.label}</span>
                          <span className="text-[0.9rem] text-neutral-700 leading-[1.75]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          {/* Chapter 03 — Formation */}
          <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black border-y border-gold-500/10">
            <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
              <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-3">
                  Chapter 03 — Formation
                </p>
                <div className="font-serif text-gold-500 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">03</div>
              </div>
              <div>
                <RevealOnScroll>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.25] tracking-kr-tight text-lx-ivory mb-3">
                    침향은 어떻게 만들어지나요?
                  </h2>
                  <p className="font-serif italic text-gold-400 text-lg md:text-xl mb-10">자연의 치유 본능이 만든 기적의 향</p>
                </RevealOnScroll>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {formationSteps.map((item, i) => (
                    <RevealOnScroll key={item.step + i} delay={i * 90}>
                      <div className="border border-gold-500/20 bg-white/[0.02] p-6 md:p-7 h-full transition-all duration-600 ease-out-soft hover:border-gold-400/50 hover:-translate-y-0.5">
                        <div className="w-14 h-14 mb-5 rounded-full border border-gold-500/60 flex items-center justify-center font-serif text-xl font-light text-gold-500">
                          {item.step}
                        </div>
                        <h4 className="font-serif text-lg font-normal text-gold-400 mb-3">{item.title}</h4>
                        <p className="text-[0.88rem] text-white/60 leading-[1.85] font-light">{item.description}</p>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 04 — Why Special */}
          <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
            <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
              <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-3">
                  Chapter 04 — Why Special
                </p>
                <div className="font-serif text-gold-600 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">04</div>
              </div>
              <div>
                <RevealOnScroll>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.25] tracking-kr-tight text-lx-ink mb-10">
                    침향이 특별한 4가지 이유
                  </h2>
                </RevealOnScroll>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {specialReasons.map((card, i) => (
                    <RevealOnScroll key={card.title + i} delay={i * 90}>
                      <div className="p-7 md:p-8 bg-white border border-gold-500/20 hover:border-gold-500/50 transition-all duration-400 h-full">
                        <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-600 mb-4">
                          {String(i + 1).padStart(2, '0')} — REASON
                        </div>
                        <h3 className="font-serif text-xl font-normal text-lx-ink mb-4 tracking-kr-tight">{card.title}</h3>
                        <p className="text-[0.92rem] text-neutral-600 leading-[1.85] font-light">{card.description}</p>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 05 — Benefits */}
          <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
            <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
              <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-3">
                  Chapter 05 — Benefits
                </p>
                <div className="font-serif text-gold-500 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">05</div>
              </div>
              <div>
                <RevealOnScroll>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.25] tracking-kr-tight text-lx-ivory mb-10">
                    침향의 효능에 주목!
                  </h2>
                </RevealOnScroll>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {benefits.map((b, i) => (
                    <RevealOnScroll key={b.title + i} delay={(i % 6) * 70}>
                      <div className="p-7 border border-gold-500/20 bg-white/[0.02] hover:border-gold-400/50 hover:-translate-y-0.5 transition-all duration-600 ease-out-soft h-full">
                        <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-4">
                          {String(i + 1).padStart(2, '0')} — BENEFIT
                        </div>
                        <h3 className="font-serif text-lg font-normal text-gold-400 mb-3">{b.title}</h3>
                        <p className="text-[0.88rem] text-white/62 leading-[1.85] font-light">{b.description}</p>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═════ Tab 1: 문헌에 실린 침향 ═════ */}
      {activeTab === 1 && (
        <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
          <div className="max-w-page mx-auto">
            <div className="max-w-3xl mb-14">
              <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">Chapter — Literature</p>
              <RevealOnScroll>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-5">
                  문헌에 실린 침향
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="text-white/65 text-[0.95rem] leading-[1.9] font-light">
                  침향(沈香)은 수천 년간 동서양의 의학 문헌에서 그 가치를 인정받아 온 귀중한 약재입니다.
                </p>
              </RevealOnScroll>
              <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {literatures.map((lit, i) => (
                <RevealOnScroll key={lit.title + i} delay={(i % 6) * 60}>
                  <div className="p-7 bg-white/[0.02] border border-gold-500/20 hover:border-gold-400/50 hover:-translate-y-0.5 transition-all duration-600 ease-out-soft h-full group">
                    <div className="flex items-center justify-between mb-5">
                      <span className="px-3 py-1 border border-gold-500/40 text-gold-400 font-mono text-[0.64rem] tracking-en-tag uppercase">
                        {lit.year}
                      </span>
                      <span className="font-mono text-[0.65rem] tracking-en-nav uppercase text-white/40">{lit.author}</span>
                    </div>
                    <h3 className="font-serif text-lg font-normal text-lx-ivory mb-2 tracking-kr-tight leading-[1.45] group-hover:text-gold-400 transition-colors">
                      {lit.title}
                    </h3>
                    <p className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500 mb-4">{lit.topic}</p>
                    <p className="text-[0.85rem] text-white/62 leading-[1.85] font-light">{lit.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ Tab 2: 논문에 실린 침향 ═════ */}
      {activeTab === 2 && (
        <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
          <div className="max-w-page mx-auto">
            <div className="max-w-3xl mb-14">
              <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">Chapter — Research</p>
              <RevealOnScroll>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-5">
                  논문에 실린 침향
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="text-white/65 text-[0.95rem] leading-[1.9] font-light">
                  현대 과학 논문에서 그 가치를 인정받아 온 귀중한 약재입니다.
                </p>
              </RevealOnScroll>
              <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {papers.map((paper, i) => {
                const CardInner = (
                  <div className="p-7 bg-white/[0.02] border border-gold-500/20 hover:border-gold-400/50 hover:-translate-y-0.5 transition-all duration-600 ease-out-soft h-full group">
                    <div className="flex items-center justify-between mb-5">
                      <span className="px-3 py-1 border border-gold-500/40 text-gold-400 font-mono text-[0.64rem] tracking-en-tag uppercase">
                        {paper.year}
                      </span>
                      {paper.citations && paper.citations !== '-' && (
                        <span className="font-mono text-[0.65rem] tracking-en-nav uppercase text-white/40">cited {paper.citations}</span>
                      )}
                    </div>
                    <h3 className="font-serif text-base md:text-[1.05rem] font-normal text-lx-ivory mb-3 tracking-kr-tight leading-[1.55] group-hover:text-gold-400 transition-colors">
                      {paper.title}
                    </h3>
                    {paper.authors && (
                      <p className="text-[0.78rem] text-white/55 mb-2 leading-6 font-light">{paper.authors}</p>
                    )}
                    <p className="font-serif italic text-[0.82rem] text-gold-500">{paper.journal}</p>
                    {paper.link && (
                      <p className="mt-5 font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-400 group-hover:underline">
                        원문 보기 →
                      </p>
                    )}
                  </div>
                );
                return (
                  <RevealOnScroll key={paper.title + i} delay={(i % 6) * 60}>
                    {paper.link ? (
                      <a href={paper.link} target="_blank" rel="noopener noreferrer" className="block h-full no-underline">
                        {CardInner}
                      </a>
                    ) : (
                      CardInner
                    )}
                  </RevealOnScroll>
                );
              })}
            </div>

            <RevealOnScroll>
              <p className="text-center mt-16 text-[0.85rem] text-white/45 leading-[1.9] font-light">
                위 논문은 침향의 전통적·과학적 가치를 뒷받침하는 대표적인 자료입니다.
              </p>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-20 md:py-28 px-7 lg:px-16 bg-lx-ink text-center border-t border-gold-500/12">
        <RevealOnScroll>
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">— Explore —</p>
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-light text-lx-ivory mb-8 tracking-kr-tight">
            {cta?.title ?? '침향의 세계가 궁금하시다면'}
          </h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={cta?.buttonProductsHref ?? '/products'}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gold-500 text-lx-black border border-gold-500 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:bg-gold-700 hover:border-gold-700 hover:-translate-y-0.5"
            >
              {cta?.buttonProducts ?? '제품 보기'}
            </Link>
            <Link
              href={cta?.buttonBrandHref ?? '/brand-story'}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-transparent text-white border border-white/35 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:border-gold-500 hover:text-gold-400 hover:-translate-y-0.5"
            >
              {cta?.buttonBrand ?? '브랜드 스토리'}
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
