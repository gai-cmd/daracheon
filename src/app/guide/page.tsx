import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/zoel/story-page.module.css';
import { readDataSafe } from '@/lib/db';
import { productGuides as defaultGuides, type ProductGuide } from '@/data/productGuides';

export const metadata: Metadata = {
  title: '제품상세 · 복용 가이드',
  description: '대라천 침향 제품의 복용 방법·원재료·보관법·주의사항을 큰 글씨로 한곳에 모았습니다.',
};

export const dynamic = 'force-dynamic';

// 침향 이야기(/about-agarwood)와 동일한 story-page 레이아웃·타이포(Noto Serif KR)로 통일.
// 콘텐츠는 어드민 편집(blob), 미설정 시 코드 기본값.
export default async function GuidePage() {
  const stored = await readDataSafe<ProductGuide>('product-guides');
  const productGuides = stored.length > 0 ? stored : defaultGuides;

  return (
    <>
      {/* HERO — about-agarwood 와 동일 구조 */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>제품상세 · Product Guide</div>
          <div className={styles.heroMainWide}>
            <h1>
              제품 <em>상세</em>
            </h1>
            <p className={styles.lede} style={{ lineHeight: 2, maxWidth: 900 }}>
              대라천 <span style={{ color: 'var(--accent)' }}>‘참’</span> 침향오일은{' '}
              <i>Aquilaria Agallocha</i> (Roxb) 품종에서 생산된 침향오일만을 사용했으며,
              위생적인 시설에서 소비자의 건강관리를 위해 엄격한 품질관리를 거쳐 생산된 제품으로,{' '}
              <strong style={{ color: 'var(--accent)', fontWeight: 400 }}>그 품질을 보증합니다.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* 제품별 챕터 — 번호/태그 없이 중앙 정렬된 단일 칼럼 */}
      {productGuides.map((g) => (
        <section key={g.slug} id={g.slug} className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterBody} style={{ maxWidth: 860, margin: '0 auto' }}>
              <div style={{ textAlign: 'center' }}>
                {g.image && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 460,
                      margin: '0 auto 28px',
                      aspectRatio: '1 / 1',
                      border: '1px solid rgba(212,168,67,0.2)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={g.image}
                      alt={g.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 460px"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}

                <h3>{g.name}</h3>
                {g.tagline && (
                  <p className={styles.chapterSubtitle} style={{ textAlign: 'center' }}>
                    {g.tagline}
                  </p>
                )}
              </div>

              <div style={{ marginTop: 30, display: 'grid', gap: 18 }}>
                {g.sections.map((s) => (
                  <div
                    key={s.title}
                    style={{
                      border: '1px solid rgba(212,168,67,0.22)',
                      background: 'rgba(212,168,67,0.04)',
                      borderRadius: 4,
                      padding: '22px 24px',
                    }}
                  >
                    <h4
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        fontSize: '1.16rem',
                        color: 'var(--accent-soft)',
                        fontWeight: 500,
                        marginBottom: 16,
                        lineHeight: 1.4,
                      }}
                    >
                      {s.title}
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {s.body.map((line, i) => (
                        <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'baseline' }}>
                          <span style={{ color: 'var(--accent)', fontSize: '0.5rem', lineHeight: 2.4 }} aria-hidden>
                            ●
                          </span>
                          <span style={{ fontSize: 'clamp(0.92rem, 2.5vw, 1.04rem)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.95, fontWeight: 300 }}>
                            {line}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* 문의 CTA */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.02rem)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.95, fontWeight: 300, marginBottom: 24 }}>
              더 궁금하신 점이 있으시면 언제든 문의해 주세요. 친절히 안내해 드리겠습니다.
            </p>
            <Link href="/company#contact" className="btn btn-gold">
              문의하기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
