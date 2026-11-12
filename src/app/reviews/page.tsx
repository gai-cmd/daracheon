import Link from 'next/link';
import type { Metadata } from 'next';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import JsonLd from '@/components/ui/JsonLd';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import type { Review } from '@/data/reviews';
import { publicReviews } from '@/lib/reviews-public';
import ReviewFormModal from './ReviewFormModal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '고객 리뷰·후기 — 대라천 침향 실사용기',
  description:
    "블로그에 올라온 대라천 '참'침향 오일 캡슐 후기 모음. 후기마다 원문 링크를 함께 실었습니다.",
  keywords: [
    '침향 후기', '침향 리뷰', '침향 효능 후기', '침향 복용 후기',
    '대라천 후기', '대라천 리뷰', 'ZOEL LIFE 후기', '조엘라이프 후기',
    '침향 오일 후기', '침향 캡슐 후기', '침향환 후기',
    '침향단 후기', '침향 선향 후기', '침향수 후기', '침향차 후기',
    '침향 추천 후기',
  ],
  alternates: { canonical: 'https://zoellife.com/reviews' },
  openGraph: {
    type: 'website',
    url: 'https://zoellife.com/reviews',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: '고객 리뷰·후기 — 대라천 침향 실사용기',
    description: "블로그에 올라온 대라천 '참'침향 오일 캡슐 후기와 원문 링크.",
    images: ['/opengraph-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '고객 리뷰·후기 — 대라천 침향 실사용기',
    description: "블로그에 올라온 대라천 '참'침향 오일 캡슐 후기와 원문 링크.",
    images: ['/twitter-image.jpg'],
  },
};

const SITE_URL = 'https://zoellife.com';

interface ReviewsHero {
  kicker: string;
  titleKr: string;
  lede: string;
}

const DEFAULT_REVIEWS_HERO: ReviewsHero = {
  kicker: 'TESTIMONIALS',
  titleKr: '고객 후기',
  lede: 'ZOEL LIFE 침향을 경험하신 고객님들의 소중한 이야기.',
};

export default async function ReviewsPage() {
  // 공개 페이지: 원문 주소가 있는 후기만, 원문 링크와 함께 보여 준다(2026-11-12 소유자 결정).
  // 구매 인증·별점(개별·평균)·후기 수는 확인된 사실이 아니라 화면·메타·구조화 데이터 어디에도 싣지 않는다.
  // 저장된 date 는 원문 게시일이 아니라 다시 매긴 날짜라 보여 주지 않는다. 원문 게시일 자료가 없다.
  const reviews = publicReviews(await readDataSafe<Review>('reviews'));
  const pagesData = await readSingleSafe<{ reviews?: { hero?: ReviewsHero } }>('pages');
  const hero: ReviewsHero = { ...DEFAULT_REVIEWS_HERO, ...pagesData?.reviews?.hero };

  // 페이지 단위 schema 는 CollectionPage + BreadcrumbList 만 출력한다.
  // 자사 사이트가 자기 브랜드에 대한 후기를 Review/AggregateRating 으로 마크업하면
  // Google 의 "자기 홍보성 리뷰(self-serving reviews)" 정책 위반 → 수동 조치 위험이라
  // Review·AggregateRating 마크업은 두지 않는다.
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/reviews#page`,
    url: `${SITE_URL}/reviews`,
    name: '고객 리뷰·후기 — 대라천 침향',
    description: "블로그에 올라온 대라천 '참'침향 오일 캡슐 후기 모음(원문 링크 포함).",
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#brand` },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '고객 후기', item: `${SITE_URL}/reviews` },
    ],
  };

  return (
    <>
      <JsonLd data={collectionPageJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Hero — /products 와 동일한 좌우 분할 레이아웃 */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white">
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16">
          <p className="section-tag mb-6">{hero.kicker}</p>
          <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-8 md:gap-20 items-end">
            <div>
              <h1 className="section-title-kr text-white mb-5">{hero.titleKr}</h1>
            </div>
            <div>
              <p className="text-white/70 text-[0.95rem] leading-8 max-w-[780px]">
                {hero.lede}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, i) => (
              <RevealOnScroll key={review.id} delay={i * 80}>
                <article className="bg-white p-8 border border-neutral-200 hover:border-gold-500/30 transition-colors h-full flex flex-col">
                  {/* 별점은 원문 후기에 없는 값(사이트가 매긴 값)이라 보여 주지 않는다(2026-11-12 소유자 결정). */}
                  <div className="flex items-center justify-end gap-3 mb-4">
                    <a
                      href={review.source}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-xs text-neutral-400 hover:text-gold-600"
                    >
                      원문 보기 ↗
                    </a>
                  </div>

                  <h2 className="font-serif text-lg mb-3">{review.title}</h2>
                  <p className="text-sm text-neutral-500 leading-8 mb-5 flex-1">{review.content}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-[0.65rem] tracking-wider border border-gold-500/30 text-gold-600">
                        {review.product}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {review.author}
                      {review.age && (
                        <span className="ml-2 text-xs text-neutral-400">· {review.age}</span>
                      )}
                    </p>
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
          <Link href="/company#contact" className="btn btn-gold">후기 작성하기</Link>
        </RevealOnScroll>
      </section>

      {/* 공개 리뷰 작성 모달 (클라이언트 컴포넌트) */}
      <ReviewFormModal />
    </>
  );
}
