import Link from 'next/link';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import JsonLd from '@/components/ui/JsonLd';
import { readData } from '@/lib/db';
import type { Review } from '@/data/reviews';
import { formatDate } from '@/lib/utils';
import ReviewFormModal from './ReviewFormModal';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '고객 리뷰 - ZOEL LIFE 침향 후기 | ZOEL LIFE',
  description:
    'ZOEL LIFE 프리미엄 침향 제품을 실제 구매하신 고객님들의 생생한 후기. 침향 오일 캡슐, 침향단, 침향 선향, 침향수, 침향차 리뷰.',
  alternates: { canonical: 'https://www.daracheon.com/reviews' },
};

export default async function ReviewsPage() {
  // 공개 페이지: 인증된(verified) 리뷰만 표시
  const reviews = (await readData<Review>('reviews')).filter((r) => r.verified === true);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const reviewJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ZOEL LIFE 프리미엄 침향',
    brand: { '@type': 'Brand', name: 'ZOEL LIFE' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: String(reviews.length),
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.date,
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5' },
      name: r.title,
      reviewBody: r.content,
    })),
  };

  return (
    <>
      <JsonLd data={reviewJsonLd} />

      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white">
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">TESTIMONIALS</p>
          <h1 className="section-title-kr text-white mb-5">고객 후기</h1>
          <p className="text-white/60 text-[0.95rem] leading-8 max-w-2xl mx-auto">
            ZOEL LIFE 침향을 경험하신 고객님들의 소중한 이야기
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex gap-1 text-gold-500 text-xl">
              {[...Array(5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <span className="font-display text-3xl text-gold-500">{avgRating}</span>
          </div>
          <p className="text-white/50 text-sm mt-3">인증된 구매 고객 {reviews.length}명의 후기</p>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, i) => (
              <RevealOnScroll key={review.id} delay={i * 80}>
                <article className="bg-white p-8 border border-neutral-200 hover:border-gold-500/30 transition-colors h-full flex flex-col">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex gap-1 text-gold-500">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className={j < review.rating ? '' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400">{formatDate(review.date)}</p>
                  </div>

                  <h2 className="font-serif text-lg mb-3">{review.title}</h2>
                  <p className="text-sm text-neutral-500 leading-8 mb-5 flex-1">{review.content}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-[0.65rem] tracking-wider border border-gold-500/30 text-gold-600">
                        {review.product}
                      </span>
                      {review.verified && (
                        <span className="text-[0.65rem] text-green-600 tracking-wider">✓ 인증 구매</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">{review.author}</p>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          {/* Load More Button */}
          <RevealOnScroll>
            <div className="text-center mt-14">
              <button className="btn btn-outline-dark">
                더 많은 후기 보기
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white text-center">
        <RevealOnScroll>
          <h2 className="font-serif text-2xl mb-5">당신의 침향 경험을 들려주세요</h2>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
            ZOEL LIFE 제품을 구매하신 후 경험을 공유해 주시면, 다른 고객분들의 선택에 큰 도움이 됩니다.
          </p>
          <Link href="/support#contact" className="btn btn-gold">후기 작성하기</Link>
        </RevealOnScroll>
      </section>

      {/* 공개 리뷰 작성 모달 (클라이언트 컴포넌트) */}
      <ReviewFormModal />
    </>
  );
}
