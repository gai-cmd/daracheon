'use client';

import Image from 'next/image';
import { useState } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { BrandStoryData } from './page';

interface Props {
  data: BrandStoryData | null;
}

const TAB_LIST = [
  '브랜드 스토리',
  '대라천 침향 현장',
  '대라천 침향 역사',
  '다양한 인증',
  '검증된 품질',
  '생산 공정',
  '매체에 실린 침향',
  '고객이 말한 침향',
] as const;

const DEFAULT_HERO_BG =
  'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg';

export default function BrandStoryClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const hero = data?.hero;
  const brandStoryTab = data?.brandStoryTab;
  const farms = data?.farms ?? [];
  const sceneTab = data?.sceneTab;
  const historyTab = data?.historyTab;
  const certificationsTab = data?.certificationsTab;
  const qualityTab = data?.qualityTab;
  const processTab = data?.processTab;
  const mediaTab = data?.mediaTab;
  const testimonialsTab = data?.testimonialsTab;

  return (
    <div className="bg-lx-black text-lx-ivory">
      {/* Hero */}
      <section className="relative pt-[calc(theme(spacing.nav)+80px)] pb-28 md:pb-36 overflow-hidden bg-hero-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${hero?.heroBg ?? DEFAULT_HERO_BG}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-hero-gold pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16 text-center">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-7">
            — {hero?.sectionTag ?? 'Brand Story'} —
          </p>
          <h1 className="text-[clamp(2.2rem,5vw,4.6rem)] font-extralight leading-[1.12] tracking-kr-tight text-lx-ivory mb-8">
            <span className="font-serif not-italic text-gold-400">{hero?.titleKr ?? "대라천 '참'침향"}</span>
          </h1>
          <p className="text-white/70 text-[0.95rem] md:text-base leading-[1.9] font-light max-w-2xl mx-auto mb-8">
            {hero?.subtitle ?? "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다."}
          </p>
          <span className="block w-12 h-px bg-gold-700 mx-auto" aria-hidden />
        </div>
      </section>

      {/* Tab Bar */}
      <section className="sticky top-nav z-40 bg-lx-black/92 backdrop-blur-xl border-b border-gold-500/14">
        <div className="max-w-page mx-auto px-4 lg:px-16 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TAB_LIST.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                aria-current={activeTab === i ? 'page' : undefined}
                className={`px-5 md:px-6 py-4 font-mono text-[0.7rem] tracking-en-nav uppercase whitespace-nowrap border-b-2 transition-all duration-400 ease-out-soft ${
                  activeTab === i
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-white/55 hover:text-gold-400'
                }`}
              >
                <span className="mr-2 opacity-60">{String(i + 1).padStart(2, '0')}</span>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <div className="min-h-[80vh]">
        {activeTab === 0 && <TabBrandStory data={brandStoryTab} farms={farms} />}
        {activeTab === 1 && <TabScene data={sceneTab} farms={farms} />}
        {activeTab === 2 && <TabHistory data={historyTab} sceneImages={sceneTab?.images ?? []} />}
        {activeTab === 3 && <TabCertifications data={certificationsTab} />}
        {activeTab === 4 && <TabQuality data={qualityTab} />}
        {activeTab === 5 && <TabProcess data={processTab} />}
        {activeTab === 6 && <TabMedia data={mediaTab} />}
        {activeTab === 7 && <TabTestimonials data={testimonialsTab} />}
      </div>
    </div>
  );
}

/* ═════ Tab 1: Brand Story ═════ */
function TabBrandStory({
  data,
  farms,
}: {
  data: BrandStoryData['brandStoryTab'] | undefined;
  farms: BrandStoryData['farms'];
}) {
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
      <div className="max-w-page mx-auto">
        {/* Headline */}
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">Chapter 01 — Philosophy</p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
              {data?.headlineTitle ?? '100% 베트남산, 아갈로차 침향나무만!'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <p className="font-serif italic text-gold-400 text-lg md:text-xl leading-[1.7]">
              {data?.headlineSubtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
            </p>
          </RevealOnScroll>
          <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
        </div>

        {/* THE SOURCE */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20 mb-24">
          <div className="md:sticky md:top-[calc(theme(spacing.nav)+80px)] md:self-start">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-3">
              {data?.sourceTag ?? 'THE SOURCE'}
            </p>
            <div className="font-serif text-gold-500 text-[clamp(3rem,5vw,4.2rem)] leading-none font-light">01</div>
          </div>
          <div className="max-w-[62ch]">
            <RevealOnScroll>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-lx-ivory mb-7 tracking-kr-tight leading-[1.35]">
                {data?.sourceTitle ?? '25년의 기다림이 시작되는 곳'}
              </h3>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <p className="text-white/72 text-[0.95rem] md:text-base leading-[1.95] font-light whitespace-pre-line">
                {data?.sourceBody ?? '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며, 원료 재배부터 가공·유통까지 전 과정을 수직계열화하여 품질을 보증합니다.'}
              </p>
            </RevealOnScroll>
          </div>
        </div>

        {/* Farm Locations Grid */}
        <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-7">— Farm Network —</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6">
          {farms.map((farm, i) => (
            <RevealOnScroll key={farm.nameVi + i} delay={i * 80}>
              <div className="group border border-gold-500/20 hover:border-gold-400/60 transition-all duration-600 ease-out-soft bg-white/[0.02] overflow-hidden flex flex-col h-full">
                {farm.image && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-lx-slate">
                    <Image
                      src={farm.image}
                      alt={`${farm.name} (${farm.nameVi}) 농장`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                    />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gold-500 text-lx-black flex items-center justify-center font-serif text-sm font-medium shadow">
                      {i + 1}
                    </div>
                  </div>
                )}
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  {!farm.image && (
                    <div className="w-11 h-11 mb-4 rounded-full border border-gold-500 flex items-center justify-center font-serif text-lg text-gold-500">
                      {i + 1}
                    </div>
                  )}
                  <h4 className="font-serif text-lg text-lx-ivory mb-1">{farm.name}</h4>
                  <p className="font-mono text-[0.62rem] tracking-en-tag uppercase text-gold-500 mb-3">{farm.nameVi}</p>
                  <p className="text-[0.85rem] text-white/60 leading-[1.7] font-light">{farm.desc}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════ Tab 2: Scene ═════ */
function TabScene({
  data,
  farms,
}: {
  data: BrandStoryData['sceneTab'] | undefined;
  farms: BrandStoryData['farms'];
}) {
  const images = data?.images ?? [];
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
      <div className="max-w-page mx-auto">
        {/* Headline */}
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">
            Chapter 02 — {data?.tag ?? 'THE FIELD'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ink mb-6">
              {data?.title ?? '대라천 침향 현장'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <p className="font-serif italic text-gold-700 text-lg md:text-xl leading-[1.7]">
              {data?.subtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
            </p>
          </RevealOnScroll>
          <span className="block w-12 h-px bg-gold-500 mt-8" aria-hidden />
        </div>

        {/* Scene images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-20">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 90}>
                <div className="relative h-[380px] overflow-hidden bg-lx-slate group">
                  <Image
                    src={src}
                    alt={`대라천 침향 현장 ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="max-w-[62ch] mb-20">
          <RevealOnScroll>
            <p className="text-neutral-700 text-[0.95rem] md:text-base leading-[1.95] font-light whitespace-pre-line">
              {data?.body ?? '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리합니다.'}
            </p>
          </RevealOnScroll>
        </div>

        {/* Farm grid */}
        <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-7">— Farm Network —</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6">
          {farms.map((farm, i) => (
            <RevealOnScroll key={farm.nameVi + i} delay={i * 80}>
              <div className="p-6 border border-gold-500/25 hover:border-gold-500/70 transition-colors bg-white text-center">
                <div className="w-11 h-11 mx-auto mb-4 rounded-full border border-gold-500 flex items-center justify-center font-serif text-lg text-gold-600">
                  {i + 1}
                </div>
                <h4 className="font-serif text-lg text-lx-ink mb-1">{farm.name}</h4>
                <p className="font-mono text-[0.62rem] tracking-en-tag uppercase text-gold-600 mb-3">{farm.nameVi}</p>
                <p className="text-[0.85rem] text-neutral-600 leading-[1.7] font-light">{farm.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════ Tab 3: History ═════ */
function TabHistory({
  data,
  sceneImages,
}: {
  data: BrandStoryData['historyTab'] | undefined;
  sceneImages: string[];
}) {
  const eras = data?.eras ?? [];
  const previewImages = sceneImages.slice(0, 2);
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">
            Chapter 03 — {data?.tag ?? 'HISTORY'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
              {data?.title ?? '대라천 침향 역사'}
            </h3>
          </RevealOnScroll>
          <span className="block w-12 h-px bg-gold-700 mt-4" aria-hidden />
        </div>

        {/* Images row */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {previewImages.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative h-[320px] overflow-hidden bg-lx-slate">
                  <Image src={src} alt={`대라천 역사 ${i + 1}`} fill className="object-cover" />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="relative max-w-4xl">
          <div className="absolute left-[88px] md:left-[104px] top-0 bottom-0 w-px bg-gold-500/25" aria-hidden />
          <div className="space-y-14">
            {eras.map((era, eraIdx) => (
              <RevealOnScroll key={era.era + eraIdx} delay={eraIdx * 100}>
                <div className="flex gap-6 md:gap-10 items-start">
                  <div className="relative flex-shrink-0 w-[80px] md:w-[88px] text-right pt-1">
                    <span className="font-serif text-gold-500 text-xl md:text-2xl font-light">{era.era}</span>
                    <div className="absolute right-[-20px] md:right-[-21px] top-3 w-3.5 h-3.5 rounded-full bg-gold-500 border-2 border-lx-black" aria-hidden />
                  </div>
                  <div className="pl-4 md:pl-6 flex-1">
                    <ul className="space-y-3">
                      {era.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3 text-[0.9rem] md:text-[0.95rem] text-white/72 leading-[1.85] font-light">
                          <span className="font-mono text-gold-500 mt-1 flex-shrink-0 text-[0.7rem]">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════ Tab 4: Certifications ═════ */
function TabCertifications({ data }: { data: BrandStoryData['certificationsTab'] | undefined }) {
  const images = data?.images ?? [];
  const sections = data?.sections ?? [];
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">
            Chapter 04 — {data?.tag ?? 'CERTIFICATIONS'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ink mb-6">
              {data?.title ?? '신뢰의 지표'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <p className="font-serif italic text-gold-700 text-lg md:text-xl leading-[1.7]">
              {data?.subtitle ?? '국제가 인정하는 대라천의 품질'}
            </p>
          </RevealOnScroll>
          <span className="block w-12 h-px bg-gold-500 mt-8" aria-hidden />
        </div>

        {/* Cert images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-20">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 90}>
                <div className="relative aspect-[3/4] overflow-hidden bg-white border border-gold-500/25 p-3 hover:border-gold-500/60 transition-colors">
                  <Image
                    src={src}
                    alt={`인증서 ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain"
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Cert sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sections.map((section, sIdx) => (
            <RevealOnScroll key={section.title + sIdx} delay={sIdx * 100}>
              <div className="p-8 border border-gold-500/25 hover:border-gold-500/60 transition-all duration-400 bg-white h-full">
                <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-600 mb-4">
                  {String(sIdx + 1).padStart(2, '0')} — Certificate
                </div>
                <h4 className="font-serif text-xl text-lx-ink mb-5 tracking-kr-tight font-normal leading-[1.35]">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-[0.88rem] text-neutral-700 leading-[1.75] font-light">
                      <span className="font-mono text-gold-600 mt-0.5 flex-shrink-0 text-[0.7rem]">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════ Tab 5: Quality ═════ */
function TabQuality({ data }: { data: BrandStoryData['qualityTab'] | undefined }) {
  const images = data?.images ?? [];
  const heavyMetals = data?.heavyMetals ?? [];
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">
            Chapter 05 — {data?.tag ?? 'VERIFIED QUALITY'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
              {data?.title ?? '과학으로 입증된 안전'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <p className="font-serif italic text-gold-400 text-lg md:text-xl leading-[1.7]">
              {data?.subtitle ?? '최소 26년의 시간이 만드는 한 방울의 가치'}
            </p>
          </RevealOnScroll>
          <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
        </div>

        {/* Quality images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative h-[320px] overflow-hidden bg-lx-slate">
                  <Image src={src} alt={`품질 검증 ${i + 1}`} fill className="object-cover" />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Specs grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <RevealOnScroll>
            <div className="p-8 border border-gold-500/20 bg-white/[0.02] hover:border-gold-400/50 transition-all duration-600 ease-out-soft h-full">
              <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">01 — Raw Material</div>
              <h4 className="font-serif text-lg text-gold-400 mb-4">원료</h4>
              <p className="text-[0.9rem] text-white/68 leading-[1.85] mb-2 font-light">침수향(AQUILARIAE LIGNUM)</p>
              <p className="font-serif italic text-[0.82rem] text-white/50">Aquilaria agallocha Roxburgh</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="p-8 border border-gold-500/20 bg-white/[0.02] hover:border-gold-400/50 transition-all duration-600 ease-out-soft h-full">
              <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">02 — Standards</div>
              <h4 className="font-serif text-lg text-gold-400 mb-4">약전 규격</h4>
              <ul className="space-y-2 text-[0.9rem] text-white/68 leading-[1.85] font-light">
                <li>건조감량 8.0% 이하</li>
                <li>회분 2.0% 이하</li>
                <li>묽은에탄올엑스 18.0% 이상</li>
              </ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="p-8 border border-gold-500/20 bg-white/[0.02] hover:border-gold-400/50 transition-all duration-600 ease-out-soft h-full">
              <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">03 — TSL Safety</div>
              <h4 className="font-serif text-lg text-gold-400 mb-4">TSL 안전성</h4>
              <p className="text-[0.9rem] text-white/68 leading-[1.85] mb-4 font-light">중금속 8종 전부 불검출</p>
              <div className="flex flex-wrap gap-2">
                {heavyMetals.map((metal) => (
                  <span
                    key={metal}
                    className="px-2 py-1 font-mono text-[0.62rem] tracking-en-tag uppercase border border-gold-500/35 text-gold-400"
                  >
                    {metal}
                  </span>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

/* ═════ Tab 6: Process ═════ */
function driveThumb(id: string, w = 1280) {
  return `https://lh3.googleusercontent.com/d/${id}=w${w}`;
}
function driveEmbed(id: string) {
  return `https://drive.google.com/file/d/${id}/preview`;
}

function VideoCard({
  id,
  title,
  index,
  priority = false,
}: {
  id: string;
  title: string;
  index: number;
  priority?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="group bg-lx-ink border border-gold-500/20 hover:border-gold-400/60 transition-all duration-600 ease-out-soft overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-lx-black">
        {playing ? (
          <iframe
            src={`${driveEmbed(id)}?autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={title}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${title} 재생`}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={driveThumb(id, 960)}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
              priority={priority}
              unoptimized
            />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gold-500 backdrop-blur flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-400">
                <span className="text-lx-black text-xl pl-1">&#9654;</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-lx-black/80 backdrop-blur font-mono text-gold-400 text-[0.6rem] tracking-en-tag uppercase">
              {String(index).padStart(2, '0')}
            </div>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-[0.88rem] text-lx-ivory font-light leading-[1.55] line-clamp-2">{title}</p>
      </div>
    </div>
  );
}

function TabProcess({ data }: { data: BrandStoryData['processTab'] | undefined }) {
  const steps = data?.steps ?? [];
  const heroVideo = data?.heroVideo;
  const stats = data?.stats ?? [];
  const chapters = data?.videoChapters ?? [];
  const images = data?.images ?? [];
  let globalIndex = 0;

  return (
    <>
      {/* Header + Hero video */}
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-16">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">
              Chapter 06 — {data?.tag ?? 'PRODUCTION PROCESS'}
            </p>
            <RevealOnScroll>
              <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
                {data?.title ?? '생산 공정'}
              </h3>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <p className="font-serif italic text-gold-400 text-lg md:text-xl leading-[1.7]">
                {data?.subtitle ?? '총 소요 시간: 최소 26년'}
              </p>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
          </div>

          {heroVideo && (
            <RevealOnScroll>
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-center">
                <div className="relative aspect-video overflow-hidden border border-gold-500/30 bg-black shadow-2xl">
                  <iframe
                    src={driveEmbed(heroVideo.id)}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    title={heroVideo.title}
                  />
                </div>
                <div>
                  <p className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-400 mb-4">Featured Film</p>
                  <h4 className="font-serif text-2xl md:text-3xl text-lx-ivory mb-6 font-light leading-[1.35] tracking-kr-tight">
                    {heroVideo.title}
                  </h4>
                  <p className="text-white/62 text-[0.92rem] leading-[1.9] font-light">{heroVideo.body}</p>
                </div>
              </div>
            </RevealOnScroll>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((s, i) => (
                <RevealOnScroll key={s.label} delay={i * 80}>
                  <div className="p-7 border border-gold-500/20 bg-white/[0.02] text-center">
                    <p className="font-serif text-3xl md:text-4xl text-gold-400 mb-3 font-light">{s.value}</p>
                    <p className="font-mono text-[0.66rem] tracking-en-tag uppercase text-white/55">{s.label}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 14-step timeline */}
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-16">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">The 14 Steps</p>
            <RevealOnScroll>
              <h3 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ink mb-6">
                식목부터 출고까지 — 14단계 공정
              </h3>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-500 mt-4" aria-hidden />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {steps.map((step, i) => (
              <RevealOnScroll key={i} delay={(i % 7) * 60}>
                <div className="flex flex-col items-center text-center p-5 bg-white border border-gold-500/25 hover:border-gold-500/60 transition-colors h-full">
                  <div className="w-11 h-11 mb-4 rounded-full bg-gold-500 text-lx-black flex items-center justify-center font-serif text-sm font-medium">
                    {i + 1}
                  </div>
                  <p className="text-[0.78rem] text-neutral-700 leading-[1.55] font-light">{step}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Total time callout */}
          <RevealOnScroll>
            <div className="text-center mt-16 p-10 md:p-14 border border-gold-500/35 bg-white">
              <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-700 mb-4">
                {data?.totalTimeLabel ?? 'TOTAL PROCESS TIME'}
              </p>
              <p className="font-serif text-[clamp(3rem,6vw,5rem)] text-gold-600 mb-4 font-light leading-none">
                {data?.totalTimeValue ?? '26+ Years'}
              </p>
              <p className="text-[0.92rem] text-neutral-600 max-w-xl mx-auto leading-[1.85] font-light">
                {data?.totalTimeDesc ?? '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치'}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Video chapters */}
      {chapters.length > 0 && (
        <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
          <div className="max-w-page mx-auto">
            <div className="max-w-3xl mb-14">
              <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">On-Site Footage</p>
              <RevealOnScroll>
                <h3 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
                  생산 현장 영상 아카이브
                </h3>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <p className="font-serif italic text-gold-400 text-lg md:text-xl leading-[1.7]">
                  베트남 직영 농장·공장에서 촬영한 28편의 실측 영상
                </p>
              </RevealOnScroll>
              <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
            </div>

            <div className="space-y-20">
              {chapters.map((chapter) => (
                <div key={chapter.titleEn}>
                  <RevealOnScroll>
                    <div className="mb-8 pb-5 border-b border-gold-500/20 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                      <div>
                        <p className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500 mb-3">{chapter.titleEn}</p>
                        <h4 className="font-serif text-2xl md:text-[1.6rem] text-lx-ivory font-light tracking-kr-tight">{chapter.title}</h4>
                      </div>
                      <p className="text-[0.88rem] text-white/60 max-w-xl leading-[1.85] font-light">{chapter.description}</p>
                    </div>
                  </RevealOnScroll>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {chapter.videos.map((v) => {
                      globalIndex += 1;
                      return (
                        <RevealOnScroll key={v.id} delay={(globalIndex % 4) * 60}>
                          <VideoCard id={v.id} title={v.title} index={globalIndex} />
                        </RevealOnScroll>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing still images */}
      {images.length > 0 && (
        <section className="relative py-20 md:py-24 px-7 lg:px-16 bg-lx-ivory">
          <div className="max-w-page mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {images.map((src, i) => (
                <RevealOnScroll key={i} delay={i * 100}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-lx-slate">
                    <Image src={src} alt={`생산 공정 ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized />
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ═════ Tab 7: Media (매체에 실린 침향) ═════ */
function TabMedia({ data }: { data: BrandStoryData['mediaTab'] | undefined }) {
  const items = data?.items ?? [];
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink">
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">
            Chapter 07 — {data?.tag ?? 'IN THE MEDIA'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ink mb-6">
              {data?.title ?? '매체에 실린 침향'}
            </h3>
          </RevealOnScroll>
          {data?.subtitle && (
            <RevealOnScroll delay={100}>
              <p className="font-serif italic text-gold-700 text-lg md:text-xl leading-[1.7]">
                {data.subtitle}
              </p>
            </RevealOnScroll>
          )}
          <span className="block w-12 h-px bg-gold-500 mt-8" aria-hidden />
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((item, i) => {
              const CardInner = (
                <article className="border border-gold-500/25 hover:border-gold-500/60 transition-all duration-600 ease-out-soft overflow-hidden h-full flex flex-col bg-white group">
                  {item.image && (
                    <div className="relative h-[200px] overflow-hidden bg-lx-slate">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                      />
                    </div>
                  )}
                  <div className="p-6 md:p-7 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="font-mono text-[0.64rem] tracking-en-tag uppercase text-gold-700">
                        {item.outlet}
                      </span>
                      {item.date && (
                        <span className="font-mono text-[0.62rem] tracking-en-nav uppercase text-neutral-400">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-[1.02rem] md:text-[1.08rem] font-normal mb-3 tracking-kr-tight leading-[1.45] text-lx-ink group-hover:text-gold-700 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    {item.summary && (
                      <p className="text-[0.85rem] text-neutral-600 leading-[1.8] font-light line-clamp-3 flex-1">
                        {item.summary}
                      </p>
                    )}
                    {item.link && (
                      <p className="mt-5 font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-700 group-hover:underline">
                        원문 보기 →
                      </p>
                    )}
                  </div>
                </article>
              );
              return (
                <RevealOnScroll key={item.title + i} delay={(i % 6) * 60}>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full no-underline">
                      {CardInner}
                    </a>
                  ) : (
                    CardInner
                  )}
                </RevealOnScroll>
              );
            })}
          </div>
        ) : (
          <RevealOnScroll>
            <div className="border border-gold-500/25 bg-white p-10 text-center">
              <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-700 mb-3">Coming Soon</p>
              <p className="text-[0.92rem] text-neutral-600 leading-[1.85] font-light">
                등록된 매체 기사가 없습니다. 곧 업데이트됩니다.
              </p>
            </div>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}

/* ═════ Tab 8: Testimonials (고객이 말한 침향) ═════ */
function TabTestimonials({ data }: { data: BrandStoryData['testimonialsTab'] | undefined }) {
  const items = data?.items ?? [];
  return (
    <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black">
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">
            Chapter 08 — {data?.tag ?? 'TESTIMONIALS'}
          </p>
          <RevealOnScroll>
            <h3 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.2] tracking-kr-tight text-lx-ivory mb-6">
              {data?.title ?? '고객이 말한 침향'}
            </h3>
          </RevealOnScroll>
          {data?.subtitle && (
            <RevealOnScroll delay={100}>
              <p className="font-serif italic text-gold-400 text-lg md:text-xl leading-[1.7]">
                {data.subtitle}
              </p>
            </RevealOnScroll>
          )}
          <span className="block w-12 h-px bg-gold-700 mt-8" aria-hidden />
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((item, i) => (
              <RevealOnScroll key={item.name + i} delay={(i % 6) * 60}>
                <article className="relative p-7 md:p-8 border border-gold-500/20 bg-white/[0.02] hover:border-gold-400/50 transition-all duration-600 ease-out-soft h-full flex flex-col">
                  <span
                    aria-hidden
                    className="absolute top-4 right-5 font-serif text-gold-500/35 text-5xl leading-none select-none"
                  >
                    &ldquo;
                  </span>
                  {typeof item.rating === 'number' && (
                    <div className="flex gap-0.5 text-gold-400 mb-4 text-sm" aria-label={`평점 ${item.rating}/5`}>
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className={j < item.rating! ? '' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                  )}
                  <p className="font-serif text-lx-ivory text-[1.02rem] md:text-[1.05rem] leading-[1.8] font-light mb-6 flex-1">
                    {item.body}
                  </p>
                  <div className="flex items-center gap-4 pt-5 border-t border-gold-500/15">
                    {item.image ? (
                      <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-lx-slate">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full border border-gold-500/40 flex-shrink-0 flex items-center justify-center font-serif text-gold-400 text-base">
                        {item.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.92rem] text-lx-ivory font-light tracking-kr-tight">
                        {item.name}
                      </p>
                      {item.role && (
                        <p className="font-mono text-[0.62rem] tracking-en-nav uppercase text-white/45 mt-0.5 truncate">
                          {item.role}
                        </p>
                      )}
                    </div>
                    {item.product && (
                      <span className="font-mono text-[0.6rem] tracking-en-tag uppercase text-gold-500 border border-gold-500/40 px-2.5 py-1 whitespace-nowrap">
                        {item.product}
                      </span>
                    )}
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        ) : (
          <RevealOnScroll>
            <div className="border border-gold-500/25 bg-white/[0.02] p-10 text-center">
              <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-3">Coming Soon</p>
              <p className="text-white/65 text-[0.95rem] leading-[1.85] font-light">
                등록된 고객 후기가 없습니다. 곧 업데이트됩니다.
              </p>
            </div>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
