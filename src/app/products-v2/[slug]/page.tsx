import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { commonContent, getDraftProduct, getDraftSlugs } from './data';
import PriceOptions from './PriceOptions';
import styles from './page.module.css';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getDraftSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = getDraftProduct(slug);
  if (!product) return { title: '상품 상세 (초안) | ZOEL LIFE' };
  return {
    title: `${product.name} | ZOEL LIFE 대라천 ‘참’침향`,
    description: product.tagline,
    robots: { index: false, follow: false }, // 초안 — 검색 노출 방지
  };
}

export default async function ProductDetailV2Page(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = getDraftProduct(slug);
  if (!product) notFound();

  const { vietnam, agalocha, aganwood, aganwoodOil, needs, trust } = commonContent;

  return (
    <main className={styles.page}>
      <div className={styles.draftBanner}>
        DRAFT · 상품 상세 v2 — 통이미지 흐름을 사이트 화면으로 재구성한 점검용 페이지
      </div>

      {/* ── 01 · BRAND (hero) ── */}
      <section
        className={styles.brand}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(10,11,16,0.45) 0%, rgba(10,11,16,0.78) 55%, rgba(10,11,16,0.97) 100%), url(${product.heroImage})` }}
      >
        <div className={styles.brandInner}>
          <span className={styles.brandTag}>Brand</span>
          <h1 className={styles.brandHanja}>{product.nameHanja}</h1>
          <p className={styles.brandKo}>{product.name}</p>
          <span className={styles.gline} />
          <p className={styles.brandTagline}>{product.tagline}</p>
        </div>
        <div className={styles.scrollHint}>SCROLL</div>
      </section>

      {/* ── 02 · PRODUCT ── */}
      <section className={`${styles.section} ${styles.product}`}>
        <div className={styles.productGrid}>
          <div className={styles.productMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.productImage} alt={`${product.name} 제품 컷`} />
          </div>
          <div className={styles.productInfo}>
            <span className={styles.tag}>Product</span>
            <p className={styles.productLead}>{product.productLead}</p>
            <h2 className={styles.h2}>{product.name}</h2>
            <p className={styles.bodyText}>{product.tagline}</p>
            <span className={styles.badgeLine}>大羅天 沈香 · 정식 수입 완제품</span>
          </div>
        </div>
      </section>

      {/* ── 03 · FROM VIETNAM ── */}
      <section className={`${styles.section} ${styles.elev} ${styles.center}`}>
        <SectionHead tag={vietnam.tag} title={vietnam.title} />
        <p className={styles.headline}>{vietnam.headline}</p>
        <p className={styles.bodyTextCenter}>{vietnam.body}</p>
        <div className={styles.mediaBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vietnam.image} alt={vietnam.imageAlt} loading="lazy" />
        </div>
        <div className={styles.certCard}>
          <div className={styles.certBadge}>{vietnam.cites.label}</div>
          <div className={styles.certBody}>
            <h3>{vietnam.cites.title}</h3>
            <p>{vietnam.cites.note}</p>
          </div>
        </div>
      </section>

      {/* ── 04 · AGALOCHA ── */}
      <section className={`${styles.section} ${styles.center}`}>
        <SectionHead tag={agalocha.tag} title={agalocha.title} />
        <p className={styles.sciName}><em className="nowrap">{agalocha.scientificName}</em></p>
        <p className={styles.bodyTextCenter}>{agalocha.body}</p>

        <p className={styles.gradeNote}>{agalocha.gradeNote}</p>
        <div className={styles.gradePyramid}>
          {agalocha.grades.map((g, i) => (
            <div
              key={i}
              className={`${styles.gradeRow} ${styles[`gr${i}`]} ${g.tier === 'top' ? styles.gradeTop : ''}`}
            >
              <span className={styles.gradeLabel}>{g.label}</span>
              <span className={styles.gradeDensity}>{g.density}</span>
            </div>
          ))}
          <div className={styles.gradeAxis}>
            <span>수지 밀도 높음</span>
            <span>낮음</span>
          </div>
        </div>
      </section>

      {/* ── 05 · AGANWOOD ── */}
      <section className={`${styles.section} ${styles.elev}`}>
        <div className={styles.split}>
          <div>
            <SectionHead tag={aganwood.tag} title={aganwood.title} />
            <p className={styles.bodyText}>{aganwood.body}</p>
          </div>
          <div className={styles.aganStats}>
            {aganwood.stats.map((s, i) => (
              <div key={i} className={styles.aganStat}>
                <span className={styles.aganNum}>{s.num}<small>{s.unit}</small></span>
                <span className={styles.aganLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.mediaBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aganwood.image} alt={aganwood.imageAlt} loading="lazy" />
        </div>
      </section>

      {/* ── 06 · AGANWOOD OIL ── */}
      <section
        className={`${styles.section} ${styles.oil} ${styles.center}`}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(10,11,16,0.74), rgba(10,11,16,0.92)), url(${aganwoodOil.bgImage})` }}
      >
        <SectionHead tag={aganwoodOil.tag} title={aganwoodOil.title} light />
        <p className={styles.bodyTextCenter}>{aganwoodOil.body}</p>
        <div className={styles.yieldPyramid}>
          {aganwoodOil.yield.map((y, i) => (
            <div key={i} className={`${styles.yieldRow} ${styles[`y_${y.tier}`]}`}>
              <span className={styles.yieldLabel}>{y.label}</span>
              <b className={styles.yieldVal}>{y.value}<small>{y.unit}</small></b>
            </div>
          ))}
          <div className={styles.yieldPercent}>{aganwoodOil.percent}</div>
        </div>
      </section>

      {/* ── 07 · NEEDS ── */}
      <section className={`${styles.section} ${styles.elev}`}>
        <SectionHead tag={needs.tag} title={needs.title} lede={needs.lede} />
        <div className={styles.personaGrid}>
          {product.personas.map((p, i) => (
            <figure key={i} className={styles.persona}>
              <div className={styles.personaImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.caption} loading="lazy" />
              </div>
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── 08 · 제품 정보 + 보증 ── */}
      <section className={styles.section}>
        <div className={styles.infoGrid}>
          <div className={styles.infoMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.detailImage} alt={`${product.name} 캡슐`} loading="lazy" />
          </div>
          <div>
            <SectionHead tag="Specs" title="제품 정보" />
            <dl className={styles.specs}>
              {product.specs.map((row, i) => (
                <div key={i} className={styles.specRow}>
                  <dt>{row.key}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.usageHead}>복용법</div>
            <ul className={styles.usageList}>
              {product.usage.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
            <div className={styles.usageHead}>보관 및 주의사항</div>
            <ul className={`${styles.usageList} ${styles.warn}`}>
              {product.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 09 · 보증 + 구매 CTA ── */}
      <section className={`${styles.section} ${styles.elev} ${styles.center}`}>
        <SectionHead tag={trust.tag} title={trust.title} />
        <p className={styles.bodyTextCenter}>{trust.body}</p>
        <div className={styles.badges}>
          {trust.badges.map((b) => <span key={b} className={styles.badge}>{b}</span>)}
        </div>

        <div className={styles.purchase}>
          <PriceOptions options={product.options} />
          <div className={styles.ctas}>
            <Link href={product.ctaPrimary.href} className={styles.btnGold}>
              {product.ctaPrimary.label} →
            </Link>
            {product.ctaSecondary && (
              <Link href={product.ctaSecondary.href} className={styles.btnOutline}>
                {product.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHead({
  tag,
  title,
  lede,
  light,
}: {
  tag: string;
  title: string;
  lede?: string;
  light?: boolean;
}) {
  return (
    <header className={`${styles.sectionHead} ${light ? styles.headLight : ''}`}>
      <span className={styles.sectionTag}>{tag}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {lede && <p className={styles.sectionLede}>{lede}</p>}
    </header>
  );
}
