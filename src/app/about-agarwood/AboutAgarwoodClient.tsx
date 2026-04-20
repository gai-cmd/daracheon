'use client';

import Link from 'next/link';
import styles from '@/styles/zoel/story-page.module.css';
import type { AboutAgarwoodData } from './page';

interface Props {
  data: AboutAgarwoodData | null;
}

export default function AboutAgarwoodClient({ data }: Props) {
  const hero = data?.hero;
  const definition = data?.definitionSection;
  const formationSteps = data?.formationSteps ?? [];
  const specialReasons = data?.specialReasons ?? [];
  const benefits = data?.benefits ?? [];
  const literatures = data?.literatures ?? [];
  const papers = data?.papers ?? [];
  const cta = data?.cta;

  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero?.sectionTag ?? '브랜드 이야기'}</div>
          <h1>
            {hero?.titleKr ?? '자연이 건넨 약속,'}
            <br />
            <em>{hero?.titleEn ?? '사람이 지킨 25년'}</em>
          </h1>
          <p className={styles.lede}>
            {hero?.subtitle ??
              '1999년, 베트남 하띤(Ha Tinh) 깊은 숲 속의 한 그루에서 시작된 대라천 ZOEL LIFE의 이야기.'}
          </p>
        </div>
      </section>

      {/* Chapter 01 — Definition */}
      {definition && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Chapter I · Definition</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>{definition.title ?? '침향이란 무엇인가?'}</h3>
                {definition.subtitle && (
                  <p style={{ color: 'var(--accent-soft)', marginBottom: 16, fontStyle: 'italic' }}>
                    {definition.subtitle}
                  </p>
                )}
                <p>{definition.body ?? ''}</p>
                {definition.officialNameCallout && (
                  <p style={{ marginTop: 16, color: 'var(--accent)' }}>
                    공식 침향: {definition.officialNameCallout}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chapter 02 — Formation */}
      {formationSteps.length > 0 && (
        <section className={styles.chapter} data-alt="1">
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>02</div>
                <div className={styles.chapterTag}>Chapter II · Formation</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>침향은 어떻게 만들어지나요?</h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 24,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    marginTop: 16,
                  }}
                >
                  {formationSteps.map((s, i) => (
                    <li key={s.step + i} style={{ borderLeft: '1px solid rgba(212,168,67,0.35)', paddingLeft: 20 }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.66rem',
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          marginBottom: 10,
                        }}
                      >
                        {s.step}
                      </div>
                      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.1rem', color: '#fff', marginBottom: 8 }}>
                        {s.title}
                      </div>
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: 'none' }}>
                        {s.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chapter 03 — Special Reasons */}
      {specialReasons.length > 0 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>03</div>
                <div className={styles.chapterTag}>Chapter III · Why Special</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>침향이 특별한 이유</h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 24,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    marginTop: 16,
                  }}
                >
                  {specialReasons.map((r, i) => (
                    <li key={r.title + i}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.66rem',
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          marginBottom: 10,
                        }}
                      >
                        {String(i + 1).padStart(2, '0')} — Reason
                      </div>
                      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.1rem', color: '#fff', marginBottom: 8 }}>
                        {r.title}
                      </div>
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: 'none' }}>
                        {r.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chapter 04 — Benefits */}
      {benefits.length > 0 && (
        <section className={styles.chapter} data-alt="1">
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>04</div>
                <div className={styles.chapterTag}>Chapter IV · Benefits</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>침향의 효능</h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 20,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    marginTop: 16,
                  }}
                >
                  {benefits.map((b, i) => (
                    <li key={b.title + i} style={{ borderTop: '1px solid rgba(212,168,67,0.2)', paddingTop: 16 }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.64rem',
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          marginBottom: 8,
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.02rem', color: '#fff', marginBottom: 6 }}>
                        {b.title}
                      </div>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', maxWidth: 'none' }}>
                        {b.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chapter 05 — Literatures */}
      {literatures.length > 0 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>05</div>
                <div className={styles.chapterTag}>Chapter V · Literature</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>문헌에 실린 침향</h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 20,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    marginTop: 16,
                  }}
                >
                  {literatures.map((l, i) => (
                    <li key={l.title + i} style={{ borderLeft: '1px solid rgba(212,168,67,0.35)', paddingLeft: 16 }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.62rem',
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          marginBottom: 6,
                        }}
                      >
                        {l.year} · {l.author}
                      </div>
                      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.02rem', color: '#fff', marginBottom: 4 }}>
                        {l.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-soft)', marginBottom: 8 }}>{l.topic}</div>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', maxWidth: 'none' }}>
                        {l.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chapter 06 — Research */}
      {papers.length > 0 && (
        <section className={styles.chapter} data-alt="1">
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>06</div>
                <div className={styles.chapterTag}>Chapter VI · Research</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>논문에 실린 침향</h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 20,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    marginTop: 16,
                  }}
                >
                  {papers.map((p, i) => {
                    const body = (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.62rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            marginBottom: 8,
                          }}
                        >
                          <span>{p.year}</span>
                          {p.citations && p.citations !== '-' && (
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>cited {p.citations}</span>
                          )}
                        </div>
                        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.98rem', color: '#fff', marginBottom: 6, lineHeight: 1.5 }}>
                          {p.title}
                        </div>
                        {p.authors && (
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                            {p.authors}
                          </p>
                        )}
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-soft)', fontStyle: 'italic' }}>{p.journal}</p>
                        {p.link && (
                          <div
                            style={{
                              marginTop: 12,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.64rem',
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              color: 'var(--accent)',
                            }}
                          >
                            원문 보기 →
                          </div>
                        )}
                      </>
                    );
                    return (
                      <li key={p.title + i} style={{ borderTop: '1px solid rgba(212,168,67,0.2)', paddingTop: 16 }}>
                        {p.link ? (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                            {body}
                          </a>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {cta && (
        <section className={styles.chapter}>
          <div className={styles.wrap} style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)', fontWeight: 300, marginBottom: 24, color: '#fff' }}>
              {cta.title ?? '침향의 세계가 궁금하시다면'}
            </h3>
            <div style={{ display: 'inline-flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                href={cta.buttonProductsHref ?? '/products'}
                style={{
                  padding: '12px 28px',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid var(--accent)',
                }}
              >
                {cta.buttonProducts ?? '제품 보기'}
              </Link>
              <Link
                href={cta.buttonBrandHref ?? '/brand-story'}
                style={{
                  padding: '12px 28px',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {cta.buttonBrand ?? '브랜드 스토리'}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
