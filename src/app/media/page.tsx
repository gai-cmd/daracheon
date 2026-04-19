import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { readData } from '@/lib/db';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '미디어 갤러리 - ZOEL LIFE 침향 농장 이야기 | ZOEL LIFE',
  description:
    '영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장. 베트남 직영 농장의 이야기를 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/media' },
};

interface MediaItem {
  id: string;
  type: 'article' | 'press' | 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image?: string;
  excerpt?: string;
  url?: string;
}

export default async function MediaPage() {
  const allMedia = await readData<MediaItem>('media');

  const videos = allMedia.filter((m) => m.type === 'video');
  const photos = allMedia.filter((m) => m.type === 'photo');
  const articles = allMedia.filter((m) => m.type === 'article' || m.type === 'press');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white">
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">GALLERY</p>
          <h1 className="section-title-kr text-white mb-5">침향 농장 이야기</h1>
          <p className="text-white/60 text-[0.95rem] leading-8 max-w-2xl mx-auto">
            영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장
          </p>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">Videos</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">영상 갤러리</h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((item) => (
                  <Link key={item.id} href={item.url ?? '#'} className="group block">
                    <div className="aspect-video relative overflow-hidden border border-neutral-200 hover:border-gold-500/40 transition-colors bg-white">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
                          <span className="text-white text-2xl">&#9654;</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-neutral-800 line-clamp-2 group-hover:text-gold-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-neutral-400 mt-1">{item.source} · {item.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-video border-2 border-dashed border-gold-500/30 flex items-center justify-center bg-white/50"
                    >
                      <div className="text-center px-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gold-500/30 flex items-center justify-center">
                          <span className="text-gold-500 text-2xl">&#9654;</span>
                        </div>
                        <p className="text-sm text-neutral-400">Coming Soon</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-neutral-400 mt-8">
                  등록된 영상이 없습니다. 곧 업데이트됩니다.
                </p>
              </>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* Articles / Press Section */}
      {articles.length > 0 && (
        <section className="py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <RevealOnScroll><p className="section-tag">Press</p></RevealOnScroll>
              <RevealOnScroll delay={100}>
                <h2 className="section-title-kr mb-4">미디어 &amp; 뉴스</h2>
              </RevealOnScroll>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((item, i) => (
                <RevealOnScroll key={item.id} delay={i * 80}>
                  <Link href={item.url ?? '#'} className="group block h-full">
                    <article className="border border-neutral-200 hover:border-gold-500/40 transition-colors overflow-hidden h-full flex flex-col">
                      {item.image && (
                        <div className="relative h-[200px] overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1">
                        <span className="text-[0.6rem] tracking-[0.2em] uppercase text-gold-500 mb-2">
                          {item.type === 'press' ? 'Press' : 'Article'}
                        </span>
                        <h3 className="font-serif text-base mb-2 group-hover:text-gold-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-xs text-neutral-500 leading-6 line-clamp-3 flex-1">
                            {item.excerpt}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-3">{item.source} · {item.date}</p>
                      </div>
                    </article>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Photos Section */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">Photos</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">사진 갤러리</h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((item) => (
                  <div key={item.id} className="aspect-square relative overflow-hidden border border-neutral-200 hover:border-gold-500/40 transition-colors">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square border-2 border-dashed border-gold-500/30 flex items-center justify-center bg-[#fdfbf7]"
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-gold-500/20 flex items-center justify-center">
                          <span className="text-gold-500/40 text-lg">&#10010;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-neutral-400 mt-8">
                  등록된 사진이 없습니다. 곧 업데이트됩니다.
                </p>
              </>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* Coming Soon CTA */}
      <section className="py-20 px-6 bg-[#0a0b10] text-white text-center">
        <RevealOnScroll>
          <div className="max-w-2xl mx-auto">
            <p className="section-tag mb-5">Stay Tuned</p>
            <h2 className="font-serif text-2xl text-white mb-4">
              더 많은 이야기가 준비되고 있습니다
            </h2>
            <p className="text-white/50 text-sm leading-8">
              ZOEL LIFE 베트남 직영 농장의 생생한 현장과 침향 제품의 생산 과정을
              영상과 사진으로 곧 만나보실 수 있습니다.
            </p>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}
