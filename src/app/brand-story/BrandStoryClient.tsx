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
  '매체',
  '고객 후기',
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

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${hero?.heroBg ?? DEFAULT_HERO_BG}')` }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">{hero?.sectionTag ?? 'Brand Story'}</p>
          <h1 className="section-title-kr text-white mb-5">
            {hero?.titleKr ?? "대라천 '참'침향"}
          </h1>
          <p className="text-white/65 text-[0.95rem] leading-9 max-w-2xl mx-auto mb-6">
            {hero?.subtitle ?? "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다."}
          </p>
          <div className="gold-line mx-auto" />
        </div>
      </section>

      {/* Tab Bar */}
      <section className="bg-[#0a0b10] border-b border-gold-500/20 sticky top-[60px] z-50">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TAB_LIST.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`
                  px-6 py-4 text-xs tracking-[0.15em] uppercase whitespace-nowrap
                  border-b-2 transition-all duration-300
                  ${
                    activeTab === i
                      ? 'border-gold-500 text-gold-500'
                      : 'border-transparent text-white/50 hover:text-white/80'
                  }
                `}
              >
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
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   Tab 1: Brand Story
   ═══════════════════════════════════════ */
function TabBrandStory({
  data,
  farms,
}: {
  data: BrandStoryData['brandStoryTab'] | undefined;
  farms: BrandStoryData['farms'];
}) {
  return (
    <section className="py-28 px-6 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-20">
          <RevealOnScroll>
            <h3 className="section-title-kr mb-4">
              {data?.headlineTitle ?? '100% 베트남산, 아갈로차 침향나무만!'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <p className="text-gold-500 text-lg font-serif">
              {data?.headlineSubtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="gold-line mx-auto mt-8" />
          </RevealOnScroll>
        </div>

        {/* THE SOURCE */}
        <div className="max-w-4xl mx-auto mb-20">
          <RevealOnScroll>
            <p className="section-tag">{data?.sourceTag ?? 'THE SOURCE'}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h3 className="font-serif text-2xl md:text-3xl font-light mb-6">
              {data?.sourceTitle ?? '25년의 기다림이 시작되는 곳'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-[0.95rem] text-neutral-500 leading-9 whitespace-pre-line">
              {data?.sourceBody ?? '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며, 원료 재배부터 가공·유통까지 전 과정을 수직계열화하여 품질을 보증합니다.'}
            </p>
          </RevealOnScroll>
        </div>

        {/* Farm Locations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {farms.map((farm, i) => (
            <RevealOnScroll key={farm.nameVi + i} delay={i * 80}>
              <div className="group border border-gold-500/20 hover:border-gold-500 transition-colors bg-white overflow-hidden flex flex-col h-full">
                {farm.image && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <Image
                      src={farm.image}
                      alt={`${farm.name} (${farm.nameVi}) 농장`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gold-500 text-[#0a0b10] flex items-center justify-center font-display text-sm font-semibold shadow">
                      {i + 1}
                    </div>
                  </div>
                )}
                <div className="p-6 text-center flex-1 flex flex-col">
                  {!farm.image && (
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-gold-500 flex items-center justify-center font-display text-lg text-gold-500">
                      {i + 1}
                    </div>
                  )}
                  <h4 className="font-serif text-lg text-neutral-800 mb-1">
                    {farm.name}
                  </h4>
                  <p className="text-xs text-gold-500 tracking-wider mb-3">
                    {farm.nameVi}
                  </p>
                  <p className="text-sm text-neutral-500">{farm.desc}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   Tab 2: Scene (현장)
   ═══════════════════════════════════════ */
function TabScene({
  data,
  farms,
}: {
  data: BrandStoryData['sceneTab'] | undefined;
  farms: BrandStoryData['farms'];
}) {
  const images = data?.images ?? [];
  return (
    <section className="py-28 px-6 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-20">
          <RevealOnScroll>
            <p className="section-tag">{data?.tag ?? 'THE FIELD'}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h3 className="section-title-kr mb-4">{data?.title ?? '대라천 침향 현장'}</h3>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-gold-500 text-lg font-serif">
              {data?.subtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="gold-line mx-auto mt-8" />
          </RevealOnScroll>
        </div>

        {/* Scene images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative h-[350px] overflow-hidden group">
                  <Image
                    src={src}
                    alt={`대라천 침향 현장 ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Farm details */}
        <div className="max-w-4xl mx-auto mb-16">
          <RevealOnScroll>
            <p className="text-[0.95rem] text-neutral-500 leading-9 whitespace-pre-line">
              {data?.body ?? '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리합니다.'}
            </p>
          </RevealOnScroll>
        </div>

        {/* Farm grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {farms.map((farm, i) => (
            <RevealOnScroll key={farm.nameVi + i} delay={i * 80}>
              <div className="p-6 border border-gold-500/20 hover:border-gold-500 transition-colors bg-white text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-gold-500 flex items-center justify-center font-display text-lg text-gold-500">
                  {i + 1}
                </div>
                <h4 className="font-serif text-lg text-neutral-800 mb-1">
                  {farm.name}
                </h4>
                <p className="text-xs text-gold-500 tracking-wider mb-3">
                  {farm.nameVi}
                </p>
                <p className="text-sm text-neutral-500">{farm.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   Tab 3: History
   ═══════════════════════════════════════ */
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
    <section className="py-28 px-6 bg-[#0a0b10] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <RevealOnScroll>
            <p className="section-tag">{data?.tag ?? 'HISTORY'}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h3 className="section-title-kr text-white mb-4">
              {data?.title ?? '대라천 침향 역사'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="gold-line mx-auto" />
          </RevealOnScroll>
        </div>

        {/* Images row */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {previewImages.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative h-[280px] overflow-hidden">
                  <Image
                    src={src}
                    alt={`대라천 역사 ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gold-500/30" />
          <div className="space-y-16">
            {eras.map((era, eraIdx) => (
              <RevealOnScroll key={era.era + eraIdx} delay={eraIdx * 120}>
                <div className="flex gap-8 items-start">
                  <div className="relative flex-shrink-0 w-16 text-right">
                    <span className="font-display text-sm text-gold-500">
                      {era.era}
                    </span>
                    <div className="absolute right-[-20px] top-1.5 w-3 h-3 rounded-full bg-gold-500 border-2 border-[#0a0b10]" />
                  </div>
                  <div className="pl-4">
                    <ul className="space-y-3">
                      {era.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-3 text-sm text-white/65 leading-7"
                        >
                          <span className="text-gold-500 mt-1 flex-shrink-0">--</span>
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

/* ═══════════════════════════════════════
   Tab 4: Certifications
   ═══════════════════════════════════════ */
function TabCertifications({ data }: { data: BrandStoryData['certificationsTab'] | undefined }) {
  const images = data?.images ?? [];
  const sections = data?.sections ?? [];
  return (
    <section className="py-28 px-6 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <RevealOnScroll>
            <p className="section-tag">{data?.tag ?? 'CERTIFICATIONS'}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h3 className="section-title-kr mb-4">
              {data?.title ?? '신뢰의 지표'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-gold-500 text-lg font-serif">
              {data?.subtitle ?? '국제가 인정하는 대라천의 품질'}
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="gold-line mx-auto mt-8" />
          </RevealOnScroll>
        </div>

        {/* Cert images — documents are tall portrait, must show in full */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative aspect-[3/4] overflow-hidden bg-white border border-gold-500/20 p-3">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section, sIdx) => (
            <RevealOnScroll key={section.title + sIdx} delay={sIdx * 100}>
              <div className="p-8 border border-gold-500/20 hover:border-gold-500 transition-colors bg-white h-full">
                <div className="w-10 h-10 mb-5 rounded-full border border-gold-500 flex items-center justify-center font-display text-sm text-gold-500">
                  {sIdx + 1}
                </div>
                <h4 className="font-serif text-lg mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-2 text-sm text-neutral-600"
                    >
                      <span className="text-gold-500 mt-0.5 flex-shrink-0">--</span>
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

/* ═══════════════════════════════════════
   Tab 5: Quality
   ═══════════════════════════════════════ */
function TabQuality({ data }: { data: BrandStoryData['qualityTab'] | undefined }) {
  const images = data?.images ?? [];
  const heavyMetals = data?.heavyMetals ?? [];
  return (
    <section className="py-28 px-6 bg-[#0a0b10] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <RevealOnScroll>
            <p className="section-tag">{data?.tag ?? 'VERIFIED QUALITY'}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h3 className="section-title-kr text-white mb-4">
              {data?.title ?? '과학으로 입증된 안전'}
            </h3>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-gold-300 text-lg font-serif">
              {data?.subtitle ?? '최소 26년의 시간이 만드는 한 방울의 가치'}
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="gold-line mx-auto mt-8" />
          </RevealOnScroll>
        </div>

        {/* Quality images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {images.map((src, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="relative h-[300px] overflow-hidden">
                  <Image
                    src={src}
                    alt={`품질 검증 ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Specs grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <RevealOnScroll>
            <div className="p-8 border border-gold-500/20 h-full">
              <h4 className="font-serif text-lg text-gold-300 mb-4">원료</h4>
              <p className="text-sm text-white/60 leading-7 mb-2">
                침수향(AQUILARIAE LIGNUM)
              </p>
              <p className="text-xs text-white/40 italic">
                Aquilaria agallocha Roxburgh
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="p-8 border border-gold-500/20 h-full">
              <h4 className="font-serif text-lg text-gold-300 mb-4">
                약전 규격
              </h4>
              <ul className="space-y-2 text-sm text-white/60 leading-7">
                <li>건조감량 8.0% 이하</li>
                <li>회분 2.0% 이하</li>
                <li>묽은에탄올엑스 18.0% 이상</li>
              </ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="p-8 border border-gold-500/20 h-full">
              <h4 className="font-serif text-lg text-gold-300 mb-4">
                TSL 안전성
              </h4>
              <p className="text-sm text-white/60 leading-7 mb-3">
                중금속 8종 전부 불검출
              </p>
              <div className="flex flex-wrap gap-2">
                {heavyMetals.map((metal) => (
                  <span
                    key={metal}
                    className="px-2 py-1 text-[0.65rem] border border-gold-500/30 text-gold-300 tracking-wider"
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

/* ═══════════════════════════════════════
   Tab 6: Process — Video-led production journey
   ═══════════════════════════════════════ */
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
    <div className="group bg-white border border-neutral-200 hover:border-gold-500 transition-colors overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-[#0a0b10]">
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
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
              unoptimized
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gold-500/90 backdrop-blur flex items-center justify-center shadow-xl translate-y-0 group-hover:scale-110 transition-transform">
                <span className="text-[#0a0b10] text-xl pl-1">&#9654;</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 px-2 py-1 bg-[#0a0b10]/80 backdrop-blur text-gold-400 text-[0.65rem] tracking-[0.2em] font-display">
              {String(index).padStart(2, '0')}
            </div>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-neutral-800 font-medium leading-6 line-clamp-2">{title}</p>
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
      <section className="py-28 px-6 bg-[#0a0b10] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="section-tag">{data?.tag ?? 'PRODUCTION PROCESS'}</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h3 className="section-title-kr text-white mb-4">
                {data?.title ?? '생산 공정'}
              </h3>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="text-gold-300 text-lg font-serif">
                {data?.subtitle ?? '총 소요 시간: 최소 26년'}
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div className="gold-line mx-auto mt-8" />
            </RevealOnScroll>
          </div>

          {heroVideo && (
            <RevealOnScroll>
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-10 items-center">
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
                  <p className="text-[0.65rem] tracking-[0.3em] text-gold-400 mb-3">FEATURED FILM</p>
                  <h4 className="font-serif text-2xl text-white mb-5 leading-relaxed">
                    {heroVideo.title}
                  </h4>
                  <p className="text-white/60 text-sm leading-8">{heroVideo.body}</p>
                </div>
              </div>
            </RevealOnScroll>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((s, i) => (
                <RevealOnScroll key={s.label} delay={i * 80}>
                  <div className="p-6 border border-gold-500/20 bg-white/5 backdrop-blur text-center">
                    <p className="font-display text-3xl md:text-4xl text-gold-400 mb-2">{s.value}</p>
                    <p className="text-[0.7rem] tracking-[0.15em] text-white/60 uppercase">{s.label}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 14-step timeline */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="section-tag">THE 14 STEPS</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h3 className="section-title-kr mb-4">식목부터 출고까지 — 14단계 공정</h3>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {steps.map((step, i) => (
              <RevealOnScroll key={i} delay={(i % 7) * 60}>
                <div className="relative flex flex-col items-center text-center p-5 bg-white border border-gold-500/20 hover:border-gold-500 transition-colors h-full">
                  <div className="w-11 h-11 mb-3 rounded-full bg-gold-500 text-[#0a0b10] flex items-center justify-center font-display text-sm font-semibold">
                    {i + 1}
                  </div>
                  <p className="text-xs text-neutral-700 leading-5">{step}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Total time callout */}
          <RevealOnScroll>
            <div className="text-center mt-16 p-10 border border-gold-500/30 bg-white">
              <p className="text-xs tracking-[0.2em] text-neutral-500 mb-3">
                {data?.totalTimeLabel ?? 'TOTAL PROCESS TIME'}
              </p>
              <p className="font-display text-5xl md:text-6xl text-gold-500 mb-3">
                {data?.totalTimeValue ?? '26+ Years'}
              </p>
              <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-7">
                {data?.totalTimeDesc ?? '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치'}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Video chapters */}
      {chapters.length > 0 && (
        <section className="py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <RevealOnScroll>
                <p className="section-tag">ON-SITE FOOTAGE</p>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <h3 className="section-title-kr mb-4">생산 현장 영상 아카이브</h3>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="text-gold-500 text-base font-serif">
                  베트남 직영 농장·공장에서 촬영한 28편의 실측 영상
                </p>
              </RevealOnScroll>
            </div>

            <div className="space-y-20">
              {chapters.map((chapter) => (
                <div key={chapter.titleEn}>
                  <RevealOnScroll>
                    <div className="mb-8 pb-5 border-b border-gold-500/20 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] tracking-[0.25em] text-gold-500 mb-2">{chapter.titleEn}</p>
                        <h4 className="font-serif text-2xl text-neutral-800">{chapter.title}</h4>
                      </div>
                      <p className="text-sm text-neutral-500 max-w-xl leading-7">
                        {chapter.description}
                      </p>
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
        <section className="py-20 px-6 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {images.map((src, i) => (
                <RevealOnScroll key={i} delay={i * 100}>
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={src}
                      alt={`생산 공정 ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
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
