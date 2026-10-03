import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/ui/JsonLd';
import { SITE_URL, imageObject } from '@/lib/seo/image';
import { faqPageNode, type FaqEntry } from '@/lib/seo/home-faq';
import story from '@/styles/zoel/story-page.module.css';
import styles from './TopicHub.module.css';
import FaqSection from './FaqSection';
import TopicLinks from './TopicLinks';

/**
 * 검색어 주제 허브 페이지(침향 오일·베트남 침향 등)의 공용 렌더러.
 *
 * 목적: 특정 검색어에 대한 "한 페이지 정답"을 서버 HTML 로 제공한다.
 * - 본문 전체가 SSR (탭·클릭 뒤에 숨기지 않음) — 네이버 Yeti·AI 크롤러가 그대로 읽는다.
 * - H1 → 섹션 H2 → 소항목 H3 의 개요 구조, 섹션 앵커(#id) 목차.
 * - FAQ 는 화면에 보이는 문답과 FAQPage 구조화 데이터가 같은 원천.
 * - 관련 제품·관련 페이지로 앵커 텍스트가 검색어인 내부 링크.
 *
 * 문구는 src/content/topics/* 에 있으며 사이트에 이미 게시된 사실만 옮긴다.
 */

export interface TopicBlock {
  /** 소제목(H3). 없으면 문단만. */
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface TopicSection {
  id: string;
  num: string;
  tag: string;
  title: string;
  lead?: string;
  paragraphs?: string[];
  blocks?: TopicBlock[];
  /** 순서가 있는 단계(공정·연대표). */
  steps?: { label: string; title: string; desc: string }[];
  /** 2열 비교표. */
  table?: { caption: string; head: string[]; rows: string[][] };
  image?: { src: string; alt: string; caption?: string };
  links?: { href: string; label: string }[];
}

export interface TopicProduct {
  slug: string;
  name: string;
  image?: string;
  shortDescription?: string;
  category?: string;
}

export interface TopicHubContent {
  path: string;
  breadcrumbName: string;
  kicker: string;
  h1: string;
  h1Em: string;
  lede: string;
  heroImage?: { src: string; alt: string };
  /** Article 구조화 데이터 headline/description. */
  headline: string;
  description: string;
  /** schema.org about — 페이지 주제 엔티티. */
  about: { name: string; alternateName?: string[]; sameAs?: string[] };
  datePublished: string;
  dateModified: string;
  sections: TopicSection[];
  productsTitle: string;
  productsLead: string;
  faqTitle: string;
  faq: FaqEntry[];
  related: { href: string; label: string; desc: string }[];
}

export default function TopicHub({ content, products }: { content: TopicHubContent; products: TopicProduct[] }) {
  const url = `${SITE_URL}${content.path}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: content.headline,
        description: content.description,
        inLanguage: 'ko-KR',
        url,
        mainEntityOfPage: url,
        datePublished: content.datePublished,
        dateModified: content.dateModified,
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@type': 'Thing', ...content.about },
        ...(content.heroImage
          ? { image: imageObject({ url: content.heroImage.src, caption: content.heroImage.alt }) }
          : {}),
        articleSection: content.sections.map((s) => s.title),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: content.breadcrumbName, item: url },
        ],
      },
      faqPageNode(`${url}#faq`, content.faq, { isPartOf: { '@id': `${SITE_URL}/#website` } }),
      ...(products.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${url}#products`,
              name: content.productsTitle,
              itemListElement: products.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: p.name,
                url: `${SITE_URL}/products/${p.slug}`,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* HERO */}
      <section className={story.hero}>
        {content.heroImage && (
          <Image
            src={content.heroImage.src}
            alt={content.heroImage.alt}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: 'cover', opacity: 0.32 }}
          />
        )}
        <div className={story.wrap}>
          <nav className={styles.crumbs} aria-label="현재 위치">
            <Link href="/">홈</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{content.breadcrumbName}</span>
          </nav>
          <div className={story.kicker}>{content.kicker}</div>
          <div className={story.heroMainWide}>
            <h1>
              {content.h1}
              <br />
              <em>{content.h1Em}</em>
            </h1>
            <p className={story.lede}>{content.lede}</p>
          </div>
        </div>
      </section>

      {/* 목차 — 섹션 앵커. 검색 결과 '바로가기' 링크 후보. */}
      <nav className={styles.toc} aria-label="이 페이지의 목차">
        <div className={story.wrap}>
          <ol className={styles.tocList}>
            {content.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span className={styles.tocNum}>{s.num}</span>
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#products">
                <span className={styles.tocNum}>{String(content.sections.length + 1).padStart(2, '0')}</span>
                {content.productsTitle}
              </a>
            </li>
            <li>
              <a href="#faq">
                <span className={styles.tocNum}>{String(content.sections.length + 2).padStart(2, '0')}</span>
                {content.faqTitle}
              </a>
            </li>
          </ol>
        </div>
      </nav>

      {content.sections.map((s, idx) => (
        <section
          key={s.id}
          id={s.id}
          className={`${story.chapter} ${idx % 2 === 1 ? story.chapterAlt : ''} ${styles.anchor}`}
          aria-labelledby={`${s.id}-title`}
        >
          <div className={story.wrap}>
            <div className={story.chapterGrid}>
              <div>
                <div className={story.chapterNum}>{s.num}</div>
                <div className={story.chapterTag}>{s.tag}</div>
              </div>
              <div className={story.chapterBody}>
                <h2 id={`${s.id}-title`}>{s.title}</h2>
                {s.lead && <p className={story.chapterSubtitle}>{s.lead}</p>}
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className={styles.para}>
                    {p}
                  </p>
                ))}

                {s.image && (
                  <figure className={styles.figure}>
                    <div className={styles.figureImg}>
                      <Image src={s.image.src} alt={s.image.alt} fill sizes="(max-width: 900px) 100vw, 760px" style={{ objectFit: 'cover' }} />
                    </div>
                    {s.image.caption && <figcaption>{s.image.caption}</figcaption>}
                  </figure>
                )}

                {s.steps && (
                  <ol className={styles.steps}>
                    {s.steps.map((st) => (
                      <li key={st.label + st.title} className={styles.step}>
                        <span className={styles.stepLabel}>{st.label}</span>
                        <div>
                          <h3 className={styles.stepTitle}>{st.title}</h3>
                          <p className={styles.stepDesc}>{st.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {s.table && (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <caption>{s.table.caption}</caption>
                      <thead>
                        <tr>
                          {s.table.head.map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((r) => (
                          <tr key={r[0]}>
                            <th scope="row">{r[0]}</th>
                            {r.slice(1).map((c, j) => (
                              <td key={j}>{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.blocks?.map((b, i) => (
                  <div key={i} className={styles.block}>
                    {b.title && <h3 className={styles.blockTitle}>{b.title}</h3>}
                    {b.paragraphs?.map((p, j) => (
                      <p key={j} className={styles.para}>
                        {p}
                      </p>
                    ))}
                    {b.bullets && (
                      <ul className={styles.bullets}>
                        {b.bullets.map((li) => (
                          <li key={li}>{li}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {s.links && (
                  <p className={styles.inlineLinks}>
                    {s.links.map((l) => (
                      <Link key={l.href} href={l.href}>
                        {l.label} <span aria-hidden="true">→</span>
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* 관련 제품 */}
      <section id="products" className={`${story.chapter} ${styles.anchor}`} aria-labelledby="products-title">
        <div className={story.wrap}>
          <h2 id="products-title" className={styles.centerTitle}>
            {content.productsTitle}
          </h2>
          <p className={styles.centerLead}>{content.productsLead}</p>
          {products.length > 0 ? (
            <ul className={styles.products}>
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className={styles.product}>
                    <span className={styles.productImg}>
                      {p.image && (
                        <Image src={p.image} alt={`${p.name} — 대라천 '참'침향`} fill sizes="(max-width: 640px) 50vw, 260px" style={{ objectFit: 'cover' }} />
                      )}
                    </span>
                    {p.category && <span className={styles.productCat}>{p.category}</span>}
                    <h3 className={styles.productName}>{p.name}</h3>
                    {p.shortDescription && <p className={styles.productDesc}>{p.shortDescription}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.centerLead}>
              <Link href="/products">전체 제품 보기 →</Link>
            </p>
          )}
        </div>
      </section>

      {/* FAQ — 화면 문답 = FAQPage 구조화 데이터 */}
      <FaqSection title={content.faqTitle} entries={content.faq} />

      <TopicLinks title="함께 읽으면 좋은 침향 이야기" links={content.related} />
    </>
  );
}
