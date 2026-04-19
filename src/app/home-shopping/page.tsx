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
    <>
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-gold-600 to-gold-500 text-white py-4 text-center">
        <p className="text-sm font-medium tracking-wide">
          TV홈쇼핑 특별 방송 기념 - 한정 수량 특별가 공개
        </p>
      </section>

      {/* Hero */}
      <section className="relative pt-36 pb-28 bg-[#0a0b10] text-white">
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">HOME SHOPPING SPECIAL</p>
          <h1 className="section-title-kr text-white mb-5">홈쇼핑 특별관</h1>
          <p className="text-white/60 text-[0.95rem] leading-8 max-w-2xl mx-auto">
            ZOEL LIFE 프리미엄 침향을 특별한 가격에 만나보세요
          </p>
        </div>
      </section>

      {/* Consumer Alert */}
      <section className="py-28 px-6 bg-[#14161f] text-white">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10">
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-6">
                가짜 침향, 당신의 건강을 위협합니다
              </h2>
              <p className="text-white/60 text-sm leading-8 max-w-2xl mx-auto">
                최근 뉴스에서 가짜 침향 유통 문제가 보도되고 있습니다.
                식약처가 인정한 침향은 단 2종뿐이며, 오직 이 종들만이 식용 가능합니다.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-5 py-3 border border-gold-500/30 bg-gold-500/5"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-[0.75rem] tracking-wider text-gold-400">{badge.label}</span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* News Section */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">News</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h3 className="section-title-kr mb-4">뉴스에서도 주목한 침향의 진실</h3>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="bg-white p-8 lg:p-10 border border-neutral-200">
              <div className="flex items-start gap-4 mb-6">
                <span className="px-3 py-1 text-[0.65rem] tracking-wider border border-gold-500 text-gold-600 flex-shrink-0">
                  NEWS
                </span>
                <div>
                  <h4 className="font-serif text-lg mb-1">가짜 침향 가려낸다...한약재도 유전자 검사</h4>
                  <p className="text-xs text-neutral-400">연합뉴스TV 2026.03.28 보도</p>
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-6">
                <p className="text-sm text-neutral-500 leading-8">
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
      <section className="py-28 px-6 bg-[#0a0b10] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <p className="section-tag mb-5">On Air</p>
            <h2 className="font-serif text-2xl md:text-3xl text-white mb-6">
              방송 일정
            </h2>
          </RevealOnScroll>

          {upcomingBroadcasts.length > 0 ? (
            <div className="mt-8 space-y-4">
              {upcomingBroadcasts.map((bc, i) => (
                <RevealOnScroll key={bc.id} delay={i * 80}>
                  <div className="border border-gold-500/30 bg-gold-500/5 p-6 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <BroadcastCountdown
                          scheduledAt={bc.scheduledAt}
                          channel={bc.channel}
                          status={bc.status}
                        />
                        {bc.status !== 'live' && (
                          <span className="px-3 py-1 text-[0.65rem] tracking-wider font-semibold border border-gold-500/50 text-gold-400">
                            {statusLabel[bc.status]}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/50">{formatBroadcastDate(bc.scheduledAt)}</span>
                    </div>
                    <h3 className="font-serif text-lg text-white mb-1">{bc.channel}</h3>
                    {bc.description && (
                      <p className="text-white/60 text-sm mt-2">{bc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      {bc.host && (
                        <span className="text-gold-400/80 text-xs">쇼호스트: {bc.host}</span>
                      )}
                      {bc.specialPrice && (
                        <span className="text-gold-400 text-xs font-semibold">
                          특별가: {bc.specialPrice.toLocaleString()}원
                          {bc.discountRate ? ` (${bc.discountRate}% 할인)` : ''}
                        </span>
                      )}
                    </div>
                    {bc.livestreamUrl && (
                      <a
                        href={bc.livestreamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 px-4 py-2 text-[0.7rem] tracking-wider border border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-colors"
                      >
                        라이브 시청하기
                      </a>
                    )}
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <RevealOnScroll>
              <p className="text-white/60 text-sm leading-8 max-w-xl mx-auto mt-4">
                현재 예정된 방송이 없습니다. 곧 방송 일정이 업데이트됩니다.
              </p>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* Product Lineup */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">Products</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">대표 제품 라인업</h2>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product, i) => (
              <RevealOnScroll key={product.name} delay={i * 100}>
                <div className="border border-neutral-200 hover:border-gold-500/40 transition-colors overflow-hidden">
                  <div className="bg-[#0a0b10] p-8 text-center">
                    <h3 className="font-serif text-xl text-white mb-2">{product.name}</h3>
                    <p className="text-white/50 text-sm">{product.description}</p>
                  </div>
                  <div className="p-8 text-center">
                    <span className="inline-block px-4 py-2 text-[0.75rem] tracking-wider border border-gold-500 text-gold-600">
                      방송 중 특별가 공개
                    </span>
                    <Link href="tel:070-4140-4086" className="block mt-6 btn btn-gold text-center w-full">
                      전화 주문하기
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0a0b10] to-[#1a1d29] text-white text-center">
        <RevealOnScroll>
          <div className="max-w-2xl mx-auto">
            <p className="section-tag mb-5">Order Now</p>
            <h2 className="font-serif text-2xl md:text-3xl text-white mb-6">
              지금 바로 전화주문
            </h2>
            <a
              href="tel:070-4140-4086"
              className="inline-block font-display text-4xl md:text-5xl text-gold-500 hover:text-gold-400 transition-colors mb-8"
            >
              070-4140-4086
            </a>
            <p className="text-white/40 text-sm">
              평일 09:00 - 18:00 (점심시간 12:00 - 13:00 / 주말 및 공휴일 휴무)
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* Certification Logos */}
      <section className="py-16 px-6 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="flex flex-wrap justify-center gap-8">
              {certifications.map((cert) => (
                <div key={cert.name} className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-gold-500/30 flex items-center justify-center bg-white">
                    <span className="font-display text-sm text-gold-600 tracking-wider">{cert.name}</span>
                  </div>
                  <p className="text-xs text-neutral-400">{cert.description}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
