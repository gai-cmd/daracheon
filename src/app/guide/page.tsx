import type { Metadata } from 'next';
import Link from 'next/link';
import { readDataSafe } from '@/lib/db';
import { productGuides as defaultGuides, type ProductGuide } from '@/data/productGuides';

export const metadata: Metadata = {
  title: '제품상세 · 복용 가이드',
  description: '대라천 침향 제품의 복용 방법·원재료·보관법·주의사항을 큰 글씨로 한곳에 모았습니다.',
};

export const dynamic = 'force-dynamic';

// 어르신도 보기 쉽게 — 큰 글씨·고대비·넉넉한 간격. 콘텐츠는 어드민 편집(blob), 미설정 시 코드 기본값.
export default async function GuidePage() {
  const stored = await readDataSafe<ProductGuide>('product-guides');
  const productGuides = stored.length > 0 ? stored : defaultGuides;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 text-[#fdfbf7]">
      <header className="mb-12 text-center">
        <p className="section-tag">ZOEL LIFE · 대라천</p>
        <h1 className="section-title-kr">제품상세</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-white/70">
          포장의 작은 글씨 대신, <b className="font-medium text-gold-400">복용 방법과 제품 정보</b>를 큰 글씨로 정리했습니다.
        </p>
      </header>

      {/* 제품이 여러 개면 목차 */}
      {productGuides.length > 1 && (
        <nav className="mb-10 flex flex-wrap justify-center gap-2">
          {productGuides.map((g) => (
            <a key={g.slug} href={`#${g.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-base text-white/85 hover:border-gold-400 hover:text-gold-300">
              {g.name}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-16">
        {productGuides.map((g) => (
          <section key={g.slug} id={g.slug} className="scroll-mt-28">
            <div className="mb-6 flex flex-col items-center text-center">
              {g.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image} alt={g.name} className="mb-4 h-44 w-44 rounded-2xl object-cover shadow-lg" />
              )}
              <h2 className="font-serif text-2xl sm:text-3xl">{g.name}</h2>
              {g.tagline && <p className="mt-2 text-base text-gold-400">{g.tagline}</p>}
            </div>

            <div className="space-y-5">
              {g.sections.map((s) => (
                <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-serif text-xl text-gold-400 sm:text-2xl">
                    <span className="inline-block h-5 w-1.5 rounded bg-gold-400" />
                    {s.title}
                  </h3>
                  <ul className="space-y-3">
                    {s.body.map((line, i) => (
                      <li key={i} className="flex gap-3 text-base leading-relaxed text-white/90 sm:text-lg">
                        <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-gold-400/70" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 안내 + 문의 */}
      <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-base leading-relaxed text-white/60">
          더 궁금하신 점이 있으시면 언제든 문의해 주세요. 친절히 안내해 드리겠습니다.
        </p>
        <Link href="/company#contact" className="btn btn-gold mt-6">
          문의하기
        </Link>
      </div>
    </main>
  );
}
