'use client';

import { useState } from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { AboutAgarwoodData } from './page';

interface Props {
  data: AboutAgarwoodData | null;
}

const tabs = ['침향이란?', '문헌에 실린 침향', '논문에 실린 침향'] as const;

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
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${hero?.heroImage ?? 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png'}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">{hero?.sectionTag ?? 'Agarwood Story'}</p>
          <h1 className="section-title-kr text-white mb-3">
            {hero?.titleKr ?? '이젠 진짜 침향 이야기'}
          </h1>
          <p className="font-display text-xl italic text-gold-300 mb-6">{hero?.titleEn ?? 'Agarwood Story'}</p>
          <div className="gold-line mx-auto mb-8" />
          <p className="text-white/65 text-[0.95rem] leading-9 max-w-2xl mx-auto">
            {hero?.subtitle ?? "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'에 공식 등록돼 있는 바로 그 침향입니다."}
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-0 z-40 bg-[#0a0b10] border-b border-gold-500/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-center gap-3 flex-wrap">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-2.5 text-[0.78rem] tracking-[0.1em] rounded-full transition-all duration-400 ${
                activeTab === i
                  ? 'bg-gold-500 text-[#0a0b10] font-medium'
                  : 'border border-gold-500/30 text-gold-300 hover:border-gold-500 hover:text-gold-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ════════════ Tab 1: 침향이란? ════════════ */}
      {activeTab === 0 && (
        <>
          {/* Section A - Definition */}
          <section className="py-28 px-6 bg-[#fdfbf7]">
            <div className="max-w-5xl mx-auto">
              <RevealOnScroll>
                <h2 className="section-title-kr mb-4">{definitionSection?.title ?? '침향(沈香)이란 무엇인가?'}</h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="font-display text-lg italic text-gold-500 mb-6">
                  {definitionSection?.subtitle ?? '자연이 수십 년에 걸쳐 빚어낸 신비의 향, 물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)'}
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={200}><div className="gold-line mb-8" /></RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="text-[0.95rem] text-neutral-500 leading-9 mb-10">
                  {definitionSection?.body ?? '침향(沈香, Agarwood)은 팥꽃나무과(Thymeleaceae)에 속하는 Aquilaria 속 나무가 외부 상처나 곰팡이 감염에 대응하여 분비한 수지(樹脂)가 수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목(香木)입니다.'}
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={300}>
                <div className="bg-gold-500/5 border border-gold-500/30 p-6 rounded">
                  <p className="font-serif text-lg text-neutral-800 mb-2 font-medium">
                    진짜 침향, 이제는 학명을 반드시 확인하세요.
                  </p>
                  <p className="text-[0.92rem] text-neutral-600 leading-8">
                    공식 침향은{' '}
                    <span className="text-gold-600 font-medium">
                      {definitionSection?.officialNameCallout ?? '아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)'}
                    </span>
                    입니다.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          {/* Section B - Official Registration */}
          <section className="py-28 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <RevealOnScroll>
                <h2 className="section-title-kr mb-5">대한민국약전외한약(생약)규격집<br />공식 등재</h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}><div className="gold-line mb-10" /></RevealOnScroll>

              <RevealOnScroll delay={200}>
                <div className="bg-[#fdfbf7] border border-neutral-200 p-8 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: '정식명', value: '침수향(沈水香), AQUILARIAE LIGNUM' },
                      { label: '학명', value: 'Aquilaria Agallocha Roxburgh' },
                      { label: '과명', value: '팥꽃나무과 Thymeleaceae' },
                      { label: '정의', value: '이 약은 침향나무의 수지가 침착된 수간목이다' },
                      { label: '성상', value: '흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있다' },
                      { label: '기준', value: '건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상' },
                      { label: '특징', value: '흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다' },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-4 py-3 border-b border-neutral-100 last:border-0">
                        <span className="flex-shrink-0 w-16 text-[0.78rem] tracking-[0.1em] text-gold-500 font-medium uppercase">{item.label}</span>
                        <span className="text-[0.88rem] text-neutral-600 leading-7">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          {/* Section C - Formation */}
          <section className="py-28 px-6 bg-[#0a0b10] text-white">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <RevealOnScroll>
                  <h2 className="section-title-kr text-white mb-4">침향은 어떻게 만들어지나요?</h2>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className="font-display text-lg italic text-gold-300">자연의 치유 본능이 만든 기적의 향</p>
                </RevealOnScroll>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {formationSteps.map((item, i) => (
                  <RevealOnScroll key={item.step + i} delay={i * 100}>
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full border border-gold-500 flex items-center justify-center font-display text-2xl font-light text-gold-500 hover:bg-gold-500 hover:text-[#0a0b10] transition-all duration-400">
                        {item.step}
                      </div>
                      <h4 className="font-serif text-lg text-gold-300 mb-3">{item.title}</h4>
                      <p className="text-sm text-white/55 leading-7">{item.description}</p>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>

          {/* Section D - Why Special */}
          <section className="py-28 px-6 bg-[#fdfbf7]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <RevealOnScroll>
                  <h2 className="section-title-kr mb-4">침향이 특별한 4가지 이유</h2>
                </RevealOnScroll>
                <RevealOnScroll delay={100}><div className="gold-line mx-auto mb-8" /></RevealOnScroll>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {specialReasons.map((card, i) => (
                  <RevealOnScroll key={card.title + i} delay={i * 100}>
                    <div className="p-8 bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-400 h-full">
                      <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center mb-5">
                        <span className="font-display text-sm text-gold-500 font-medium">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="font-serif text-xl font-normal tracking-wide mb-4">{card.title}</h3>
                      <p className="text-sm text-neutral-500 leading-7">{card.description}</p>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>

          {/* Section E - Benefits */}
          <section className="py-28 px-6 bg-white">
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
                  <RevealOnScroll key={b.title + i} delay={i * 80}>
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
        </>
      )}

      {/* ════════════ Tab 2: 문헌에 실린 침향 ════════════ */}
      {activeTab === 1 && (
        <section className="py-28 px-6 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <RevealOnScroll>
                <h2 className="section-title-kr mb-4">문헌에 실린 침향</h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="max-w-2xl mx-auto text-neutral-500 text-[0.92rem] leading-8">
                  침향(沈香)은 수천 년간 동서양의 의학 문헌에서 그 가치를 인정받아 온 귀중한 약재입니다.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={200}><div className="gold-line mx-auto mt-8 mb-0" /></RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {literatures.map((lit, i) => (
                <RevealOnScroll key={lit.title + i} delay={(i % 6) * 60}>
                  <div className="p-6 bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-400 h-full group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-gold-500/10 text-[0.65rem] tracking-[0.15em] text-gold-600 font-medium uppercase rounded-sm">
                        {lit.year}
                      </span>
                      <span className="text-[0.7rem] text-neutral-400">{lit.author}</span>
                    </div>
                    <h3 className="font-serif text-lg font-normal tracking-wide mb-2 group-hover:text-gold-600 transition-colors">
                      {lit.title}
                    </h3>
                    <p className="text-[0.72rem] tracking-[0.1em] text-gold-500 mb-3">{lit.topic}</p>
                    <p className="text-[0.82rem] text-neutral-500 leading-7">{lit.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ Tab 3: 논문에 실린 침향 ════════════ */}
      {activeTab === 2 && (
        <section className="py-28 px-6 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <RevealOnScroll>
                <h2 className="section-title-kr mb-4">논문에 실린 침향</h2>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="max-w-2xl mx-auto text-neutral-500 text-[0.92rem] leading-8">
                  현대 과학 논문에서 그 가치를 인정받아 온 귀중한 약재입니다.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={200}><div className="gold-line mx-auto mt-8 mb-0" /></RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper, i) => {
                const CardInner = (
                  <div className="p-6 bg-white border border-neutral-200 hover:border-gold-500/40 transition-all duration-400 h-full group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-gold-500/10 text-[0.65rem] tracking-[0.15em] text-gold-600 font-medium uppercase rounded-sm">
                        {paper.year}
                      </span>
                      {paper.citations && paper.citations !== '-' && (
                        <span className="text-[0.7rem] text-neutral-400">
                          cited {paper.citations}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-normal tracking-wide mb-3 group-hover:text-gold-600 transition-colors leading-7">
                      {paper.title}
                    </h3>
                    {paper.authors && (
                      <p className="text-[0.72rem] text-neutral-500 mb-2 leading-6">
                        {paper.authors}
                      </p>
                    )}
                    <p className="text-[0.72rem] tracking-[0.05em] text-gold-500 italic">
                      {paper.journal}
                    </p>
                    {paper.link && (
                      <p className="mt-3 text-[0.68rem] tracking-[0.15em] uppercase text-gold-600 group-hover:underline">
                        원문 보기 →
                      </p>
                    )}
                  </div>
                );
                return (
                  <RevealOnScroll key={paper.title + i} delay={(i % 6) * 60}>
                    {paper.link ? (
                      <a href={paper.link} target="_blank" rel="noopener noreferrer" className="block h-full">
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
              <p className="text-center mt-16 text-[0.88rem] text-neutral-400 leading-8">
                위 논문은 침향의 전통적·과학적 가치를 뒷받침하는 대표적인 자료입니다.
              </p>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-6 bg-white text-center">
        <RevealOnScroll>
          <h2 className="font-serif text-2xl mb-5">{cta?.title ?? '침향의 세계가 궁금하시다면'}</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={cta?.buttonProductsHref ?? '/products'} className="btn btn-gold">
              {cta?.buttonProducts ?? '제품 보기'}
            </Link>
            <Link href={cta?.buttonBrandHref ?? '/brand-story'} className="btn btn-outline-dark">
              {cta?.buttonBrand ?? '브랜드 스토리'}
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}
