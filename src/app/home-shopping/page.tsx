import Link from 'next/link';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { readData } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import BroadcastCountdown from '@/components/BroadcastCountdown';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '홈쇼핑 특별관 - ZOEL LIFE 침향 특별 할인 | ZOEL LIFE',
  description:
    'TV홈쇼핑 특별 방송 기념 한정 수량 특별가. ZOEL LIFE 프리미엄 침향 제품을 특별한 가격에 만나보세요.',
  alternates: { canonical: 'https://www.daracheon.com/home-shopping' },
};

const badges = [
  { label: 'DNA 유전자 검증 완료', icon: '🧬' },
  { label: 'CITES 국제인증', icon: '🛡️' },
  { label: '식약처 인정 정품 침향 사용', icon: '✅' },
  { label: 'HACCP 인증', icon: '📋' },
  { label: '25년 직영 농장 운영', icon: '🌿' },
];

const featuredProducts = [
  { name: '침향환', description: '전통 방식으로 만든 프리미엄 침향환' },
  { name: '침향단', description: '귀한 침향 성분을 담은 건강 환' },
  { name: '침향 비누', description: '침향 추출물로 만든 프리미엄 비누' },
];

const certifications = [
  { name: 'CITES', description: '국제 멸종위기종 거래 인증' },
  { name: 'HACCP', description: '식품안전관리 인증' },
  { name: 'DNA 검증', description: '유전자 분석 정품 인증' },
];

function formatBroadcastDate(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabel: Record<Broadcast['status'], string> = {
  scheduled: '예정',
  live: 'ON AIR',
  ended: '종료',
  canceled: '취소',
};

export default async function HomeShoppingPage() {
  const allBroadcasts = await readData<Broadcast>('broadcasts');
  const now = new Date();

  // 예정/진행 중 방송을 날짜 오름차순으로
  const upcomingBroadcasts = allBroadcasts
    .filter((b) => b.status === 'scheduled' || b.status === 'live')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="bg-lx-black text-lx-ivory">
      {/* Top Banner */}
      <section className="bg-gold-500 text-lx-black py-3 text-center border-b border-gold-700/40">
        <p className="font-mono text-[0.68rem] tracking-en-tag uppercase font-medium">
          TV홈쇼핑 특별 방송 기념 · 한정 수량 특별가 공개
        </p>
      </section>

      {/* Hero */}
      <section className="relative pt-[calc(theme(spacing.nav)+60px)] pb-20 md:pb-[90px] overflow-hidden bg-hero-dark">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_50%_70%_at_80%_30%,rgba(255,60,60,0.12),transparent_60%),radial-gradient(ellipse_60%_60%_at_20%_70%,rgba(212,168,67,0.10),transparent_60%)]"
        />
        <div className="relative z-10 max-w-page mx-auto px-7 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-end">
            <RevealOnScroll>
              <div>
                <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">
                  Home Shopping · 편성표 · 다시보기
                </p>
                <h1 className="text-[clamp(2.2rem,5vw,4.6rem)] font-extralight tracking-kr-tight leading-[1.1] text-lx-ivory">
                  TV 홈쇼핑
                  <br />
                  <em className="not-italic font-serif font-normal text-gold-400">
                    편성표 · 다시보기
                  </em>
                </h1>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <p className="text-base md:text-[1.05rem] leading-[1.9] text-white/72 font-light max-w-md">
                롯데홈쇼핑을 시작으로 현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간
                방송은 각 홈쇼핑 앱과 대라천 웹에서 동시 송출됩니다.
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Consumer Alert */}
      <section className="py-20 md:py-[90px] bg-lx-ink border-t border-gold-500/15">
        <div className="max-w-page mx-auto px-7 lg:px-16">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">
                Consumer Alert
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-light tracking-kr-tight text-lx-ivory mb-6">
                가짜 침향,
                <em className="not-italic font-serif font-normal text-gold-400"> 당신의 건강을 위협합니다</em>
              </h2>
              <p className="text-white/70 font-light text-[0.95rem] md:text-base leading-[1.85] max-w-2xl mx-auto">
                최근 뉴스에서 가짜 침향 유통 문제가 보도되고 있습니다. 식약처가
                인정한 침향은 단 2종뿐이며, 오직 이 종들만이 식용 가능합니다.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-5 py-3 border border-gold-500/30 bg-gold-500/5 backdrop-blur"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-400">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 md:py-[90px] bg-lx-slate border-t border-gold-500/15">
        <div className="max-w-page mx-auto px-7 lg:px-16">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <RevealOnScroll>
              <p className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 mb-5">
                News
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h3 className="text-[clamp(1.8rem,3.5vw,3rem)] font-light tracking-kr-tight text-lx-ivory">
                뉴스에서도 주목한
                <em className="not-italic font-serif font-normal text-gold-400"> 침향의 진실</em>
              </h3>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="max-w-3xl mx-auto bg-lx-ink p-8 lg:p-12 border border-gold-500/20 backdrop-blur">
              <div className="flex items-start gap-4 mb-6">
                <span className="font-mono text-[0.62rem] tracking-en-tag uppercase px-3 py-1 border border-gold-500 text-gold-400 flex-shrink-0">
                  News
                </span>
                <div>
                  <h4 className="font-serif text-lg md:text-xl text-lx-ivory mb-2 font-normal">
                    가짜 침향 가려낸다...한약재도 유전자 검사
                  </h4>
                  <p className="font-mono text-[0.65rem] tracking-en-tag uppercase text-white/45">
                    연합뉴스TV · 2026.03.28
                  </p>
                </div>
              </div>
              <div className="border-t border-gold-500/15 pt-6">
                <p className="text-[0.95rem] text-white/70 leading-[1.85] font-light">
                  ZOEL LIFE 침향은 이미 DNA 유전자 분석을 통해 검증된 정품 침향만을 사용합니다.
                  Aquilaria agallocha Roxburgh 학명이 확인된 원료만을 엄선하여, 소비자가 안심하고
                  섭취할 수 있는 제품을 제공합니다.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Broadcast Schedule — DB 연동 */}
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-black border-t border-gold-500/15">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-5">— On Air · 편성표 —</p>
            <RevealOnScroll>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ivory mb-6 leading-[1.2]">
                방송 일정
                <em className="not-italic font-serif font-normal text-gold-400"> · 예정·라이브·종료</em>
              </h2>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-700 mt-4" aria-hidden />
          </div>

          {upcomingBroadcasts.length > 0 ? (
            <div className="space-y-5">
              {upcomingBroadcasts.map((bc, i) => (
                <RevealOnScroll key={bc.id} delay={i * 80}>
                  <div className="border border-gold-500/30 bg-lx-ink p-7 md:p-8 hover:border-gold-400/60 transition-all duration-600 ease-out-soft">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <BroadcastCountdown
                          scheduledAt={bc.scheduledAt}
                          channel={bc.channel}
                          status={bc.status}
                        />
                        {bc.status !== 'live' && (
                          <span className="px-3 py-1 font-mono text-[0.62rem] tracking-en-tag uppercase border border-gold-500/50 text-gold-400">
                            {statusLabel[bc.status]}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[0.68rem] tracking-en-nav uppercase text-white/45">
                        {formatBroadcastDate(bc.scheduledAt)}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl text-lx-ivory mb-2 font-normal tracking-kr-tight">{bc.channel}</h3>
                    {bc.description && (
                      <p className="text-white/68 text-[0.92rem] leading-[1.85] font-light mt-3">{bc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                      {bc.host && (
                        <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-400/80">쇼호스트 · {bc.host}</span>
                      )}
                      {bc.specialPrice && (
                        <span className="font-serif text-gold-400 text-[0.95rem]">
                          특별가 {bc.specialPrice.toLocaleString()}원
                          {bc.discountRate ? ` (${bc.discountRate}% 할인)` : ''}
                        </span>
                      )}
                    </div>
                    {bc.livestreamUrl && (
                      <a
                        href={bc.livestreamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 font-mono text-[0.68rem] tracking-en-nav uppercase border border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-lx-black transition-all duration-400 ease-out-soft"
                      >
                        라이브 시청하기 →
                      </a>
                    )}
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <RevealOnScroll>
              <div className="border border-gold-500/20 bg-lx-ink p-10 text-center">
                <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-3">Coming Soon</p>
                <p className="text-white/65 text-[0.95rem] leading-[1.85] font-light">
                  현재 예정된 방송이 없습니다. 곧 방송 일정이 업데이트됩니다.
                </p>
              </div>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* Product Lineup */}
      <section className="relative py-24 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink border-t border-gold-500/15">
        <div className="max-w-page mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 mb-5">— Products —</p>
            <RevealOnScroll>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ink mb-6 leading-[1.2]">
                대표 제품
                <em className="not-italic font-serif font-normal text-gold-700"> 라인업</em>
              </h2>
            </RevealOnScroll>
            <span className="block w-12 h-px bg-gold-500 mt-4" aria-hidden />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {featuredProducts.map((product, i) => (
              <RevealOnScroll key={product.name} delay={i * 100}>
                <div className="border border-gold-500/25 hover:border-gold-500/60 transition-colors overflow-hidden bg-white h-full flex flex-col">
                  <div className="bg-lx-black p-8 text-center flex-1 flex flex-col justify-center border-b border-gold-500/30">
                    <div className="font-mono text-[0.66rem] tracking-en-tag uppercase text-gold-500 mb-4">
                      {String(i + 1).padStart(2, '0')} — Signature
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl text-lx-ivory mb-3 font-normal tracking-kr-tight">{product.name}</h3>
                    <p className="text-white/55 text-[0.85rem] leading-[1.75] font-light">{product.description}</p>
                  </div>
                  <div className="p-7 text-center">
                    <span className="inline-block px-4 py-2 font-mono text-[0.66rem] tracking-en-tag uppercase border border-gold-500 text-gold-700 mb-5">
                      방송 중 특별가 공개
                    </span>
                    <Link
                      href="tel:070-4140-4086"
                      className="flex items-center justify-center gap-2.5 px-5 py-3 bg-gold-500 text-lx-black border border-gold-500 font-mono text-[0.68rem] font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:bg-gold-700 hover:border-gold-700"
                    >
                      전화 주문하기 →
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-28 px-7 lg:px-16 bg-lx-black text-center border-t border-gold-500/15 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gold pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-2xl mx-auto">
          <RevealOnScroll>
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-500 mb-6">— Order Now —</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light tracking-kr-tight text-lx-ivory mb-8 leading-[1.2]">
              지금 바로
              <em className="not-italic font-serif font-normal text-gold-400"> 전화주문</em>
            </h2>
            <a
              href="tel:070-4140-4086"
              className="inline-block font-serif text-[clamp(2.8rem,6vw,4.2rem)] font-light text-gold-400 hover:text-gold-300 transition-colors duration-400 mb-8 tracking-tight"
            >
              070-4140-4086
            </a>
            <p className="font-mono text-[0.68rem] tracking-en-nav uppercase text-white/45">
              평일 09:00 — 18:00 · 점심 12:00 — 13:00 · 주말 휴무
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* Certification Logos */}
      <section className="relative py-20 px-7 lg:px-16 bg-lx-ivory border-t border-gold-500/15">
        <div className="max-w-page mx-auto">
          <RevealOnScroll>
            <p className="font-mono text-[0.7rem] tracking-en-tag uppercase text-gold-700 text-center mb-10">— Certifications —</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
              {certifications.map((cert) => (
                <div key={cert.name} className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border border-gold-500/50 flex items-center justify-center bg-white">
                    <span className="font-mono text-[0.68rem] font-medium tracking-en-tag uppercase text-gold-700">{cert.name}</span>
                  </div>
                  <p className="font-mono text-[0.62rem] tracking-en-nav uppercase text-neutral-500">{cert.description}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
