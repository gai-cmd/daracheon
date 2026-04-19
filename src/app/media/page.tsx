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
    <div className="bg-lx-black text-lx-ivory">
      {/* Hero */}
      <section className="relative pt-nav pb-28 md:pb-36 bg-hero-dark bg-hero-gold">
        <div className="relative z-10 max-w-page mx-auto text-center px-7 lg:px-16 pt-24 md:pt-32">
          <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-6">GALLERY</p>
          <h1 className="text-[clamp(2.2rem,5vw,4.6rem)] font-extralight tracking-kr-tight leading-[1.1] text-lx-ivory mb-6">
            침향 농장 <em className="font-serif not-italic text-gold-400">이야기</em>
          </h1>
          <span className="block w-12 h-px bg-gold-700 mx-auto mb-6" />
          <p className="text-white/70 text-[0.95rem] md:text-base leading-[1.9] font-light max-w-2xl mx-auto">
            영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장
          </p>
        </div>
      </section>

      {/* Videos Section */}
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black border-t border-gold-500/15">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">— Videos —</p>
            <RevealOnScroll>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ivory mb-6 leading-[1.2]">
                영상
                <em className="not-italic font-serif font-normal text-gold-400"> 갤러리</em>
              </h2>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-700 mt-4" aria-hidden />
          </div>

          <RevealOnScroll>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {videos.map((item) => (
                  <Link key={item.id} href={item.url ?? '#'} className="group block">
                    <div className="aspect-video relative overflow-hidden border border-gold-500/20 hover:border-gold-400/60 transition-colors bg-lx-slate">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gold-500/90 backdrop-blur flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-400">
                          <span className="text-lx-black text-xl pl-1">&#9654;</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-[0.9rem] font-light text-lx-ivory line-clamp-2 group-hover:text-gold-400 transition-colors leading-[1.55]">{item.title}</p>
                      <p className="font-mono text-[0.64rem] tracking-en-nav uppercase text-white/45 mt-2">{item.source} · {item.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-video border border-dashed border-gold-500/25 flex items-center justify-center bg-lx-ink"
                    >
                      <div className="text-center px-6">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-gold-500/40 flex items-center justify-center">
                          <span className="text-gold-500 text-xl">&#9654;</span>
                        </div>
                        <p className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500/80">Coming Soon</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center font-mono text-[0.72rem] tracking-en-nav uppercase text-white/40 mt-10">
                  등록된 영상이 없습니다 · 곧 업데이트됩니다
                </p>
              </>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* Articles / Press Section */}
      {articles.length > 0 && (
        <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink border-t border-gold-500/15">
          <div className="max-w-page mx-auto">
            <div className="max-w-3xl mb-14">
              <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">— Press —</p>
              <RevealOnScroll>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ink mb-6 leading-[1.2]">
                  미디어 &amp;
                  <em className="not-italic font-serif font-normal text-gold-700"> 뉴스</em>
                </h2>
              </RevealOnScroll>
              <span className="block w-12 h-px bg-gold-500 mt-4" aria-hidden />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {articles.map((item, i) => (
                <RevealOnScroll key={item.id} delay={i * 80}>
                  <Link href={item.url ?? '#'} className="group block h-full">
                    <article className="border border-gold-500/25 hover:border-gold-500/60 transition-colors overflow-hidden h-full flex flex-col bg-white">
                      {item.image && (
                        <div className="relative h-[200px] overflow-hidden bg-lx-slate">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                          />
                        </div>
                      )}
                      <div className="p-6 md:p-7 flex flex-col flex-1">
                        <span className="font-mono text-[0.64rem] tracking-en-tag uppercase text-gold-700 mb-3">
                          {item.type === 'press' ? 'Press' : 'Article'}
                        </span>
                        <h3 className="font-serif text-[1.02rem] md:text-[1.08rem] font-normal mb-3 group-hover:text-gold-700 transition-colors line-clamp-2 leading-[1.45] tracking-kr-tight text-lx-ink">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-[0.82rem] text-neutral-600 leading-[1.75] line-clamp-3 flex-1 font-light">
                            {item.excerpt}
                          </p>
                        )}
                        <p className="font-mono text-[0.62rem] tracking-en-nav uppercase text-neutral-400 mt-4">
                          {item.source} · {item.date}
                        </p>
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
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black border-t border-gold-500/15">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">— Photos —</p>
            <RevealOnScroll>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ivory mb-6 leading-[1.2]">
                사진
                <em className="not-italic font-serif font-normal text-gold-400"> 갤러리</em>
              </h2>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-700 mt-4" aria-hidden />
          </div>

          <RevealOnScroll>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {photos.map((item) => (
                  <div key={item.id} className="aspect-square relative overflow-hidden border border-gold-500/20 hover:border-gold-400/60 transition-colors bg-lx-slate group">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-900 group-hover:scale-[1.06]"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square border border-dashed border-gold-500/25 flex items-center justify-center bg-lx-ink"
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto rounded-full border border-gold-500/30 flex items-center justify-center">
                          <span className="text-gold-500/50 text-lg">&#10010;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center font-mono text-[0.72rem] tracking-en-nav uppercase text-white/40 mt-10">
                  등록된 사진이 없습니다 · 곧 업데이트됩니다
                </p>
              </>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* Coming Soon CTA */}
      <section className="relative py-24 md:py-28 px-7 lg:px-16 bg-lx-ink text-center overflow-hidden border-t border-gold-500/15">
        <div className="absolute inset-0 bg-hero-gold pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-2xl mx-auto">
          <RevealOnScroll>
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-6">— Stay Tuned —</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-light tracking-kr-tight text-lx-ivory mb-6 leading-[1.25]">
              더 많은 이야기가
              <em className="not-italic font-serif font-normal text-gold-400"> 준비되고 있습니다</em>
            </h2>
            <p className="text-white/60 text-[0.92rem] leading-[1.9] font-light max-w-xl mx-auto">
              ZOEL LIFE 베트남 직영 농장의 생생한 현장과 침향 제품의 생산 과정을
              영상과 사진으로 곧 만나보실 수 있습니다.
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
