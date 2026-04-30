'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/zoel/story-page.module.css';
import MediaGallery, { type MediaItem } from './MediaGallery';

interface ProcessChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  stats?: { value: string; label: string }[];
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
}

interface ProcessVideo {
  src: string;
  title: string;
}

interface CertSection {
  title: string;
  items: string[];
}

export interface SceneSection {
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  images: string[];
}

export interface FarmStoryData {
  hero: {
    kicker: string;
    titleLine1: string;
    titleEmphasis: string;
    latLabel: string;
    lede: string;
    heroImage?: string;
  };
  sceneSection?: SceneSection;
  chapters: ProcessChapter[];
  processVideos: {
    num: string;
    tag: string;
    title: string;
    body: string;
    items: ProcessVideo[];
  };
  certifications: {
    num: string;
    tag: string;
    title: string;
    body: string;
    sections: CertSection[];
    images: string[];
  };
}

export interface GalleryData {
  videos: MediaItem[];
  photos: MediaItem[];
  articles: MediaItem[];
}

const TABS = [
  { key: 'story' as const, label: '침향 농장 이야기' },
  { key: 'gallery' as const, label: '갤러리' },
];

export default function MediaPageClient({
  farmStory,
  gallery,
}: {
  farmStory: FarmStoryData;
  gallery: GalleryData;
}) {
  const [activeTab, setActiveTab] = useState<'story' | 'gallery'>('story');
  const { hero, sceneSection, chapters, processVideos, certifications } = farmStory;

  return (
    <>
      {/* HERO */}
      <section
        className={`${styles.hero} orn-grain orn-grain--faint`}
        style={{
          paddingBottom: '40px',
          ...(hero.heroImage
            ? {
                background: `radial-gradient(1200px 600px at 20% 30%, rgba(212,168,67,.10), transparent 60%), linear-gradient(180deg, rgba(10,11,16,.50) 0%, rgba(20,22,31,.58) 100%), url("${hero.heroImage}") center/cover no-repeat`,
              }
            : {}),
        }}
      >
        <div className="orn-plume" aria-hidden style={{ right: '4%', bottom: '-60px', opacity: 0.45, zIndex: 1 }} />
        <div
          className="orn-plume"
          aria-hidden
          style={{ left: '8%', bottom: '-120px', opacity: 0.22, transform: 'scaleX(-1)', width: 240, height: 320, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero.kicker}</div>
          <div className={styles.heroMain}>
            <div>
              <h1>
                {hero.titleLine1}
                <br />
                <em>{hero.titleEmphasis}</em>
              </h1>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.72rem',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-soft)',
                  marginTop: 18,
                  maxWidth: 420,
                }}
              >
                {hero.latLabel}
              </div>
            </div>
            <p className={styles.lede}>{hero.lede}</p>
          </div>
        </div>
      </section>

      {/* STICKY TAB NAV — 침향이야기와 동일 */}
      <nav
        aria-label="페이지 탭"
        style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 10,
          background: 'rgba(10,11,16,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
        }}
      >
        <div className={styles.wrap} style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className={styles.chapterGrid}>
            <div aria-hidden />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TABS.map(({ key, label }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      padding: '10px 20px',
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: '0.72rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'rgba(212,168,67,0.25)'}`,
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? 'var(--lx-black)' : 'rgba(255,255,255,0.7)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 300ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* TAB CONTENT */}
      {activeTab === 'story' ? (
        <>
          {/* SCENE SECTION (대라천 침향 현장) */}
          {sceneSection && (
            <section className={styles.chapter}>
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>{sceneSection.num}</div>
                    <div className={styles.chapterTag}>{sceneSection.tag}</div>
                  </div>
                  <div className={styles.chapterBody}>
                    <h3>{sceneSection.title}</h3>
                    {sceneSection.subtitle && (
                      <p
                        style={{
                          fontFamily: "'Noto Serif KR', serif",
                          fontStyle: 'italic',
                          color: 'var(--accent)',
                          fontSize: '0.98rem',
                          lineHeight: 1.7,
                          marginBottom: 18,
                        }}
                      >
                        {sceneSection.subtitle}
                      </p>
                    )}
                    {sceneSection.images.length > 0 && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 12,
                          margin: '20px 0 24px',
                        }}
                      >
                        {sceneSection.images.map((src, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'relative',
                              aspectRatio: '4/3',
                              overflow: 'hidden',
                              background: '#1a1d29',
                              border: '1px solid rgba(212,168,67,0.18)',
                            }}
                          >
                            <Image
                              src={src}
                              alt={`현장 ${i + 1}`}
                              fill
                              sizes="(max-width: 900px) 50vw, 33vw"
                              style={{ objectFit: 'cover' }}
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {sceneSection.body && (
                      <p style={{ whiteSpace: 'pre-line' }}>{sceneSection.body}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CHAPTERS */}
          {chapters.map((ch, i) => (
            <section
              key={ch.num}
              className={styles.chapter}
              data-alt={(i + (sceneSection ? 1 : 0)) % 2 === 1 ? '1' : undefined}
            >
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>{ch.num}</div>
                    <div className={styles.chapterTag}>{ch.tag}</div>
                    {ch.stats && ch.stats.length > 0 && (
                      <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
                        {ch.stats.map((s) => (
                          <div
                            key={s.label}
                            style={{
                              border: '1px solid rgba(212,168,67,0.35)',
                              padding: '10px 14px',
                              minWidth: 70,
                              textAlign: 'center',
                            }}
                          >
                            <b
                              style={{
                                display: 'block',
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.6rem',
                                fontWeight: 400,
                                color: 'var(--accent)',
                                lineHeight: 1,
                              }}
                            >
                              {s.value}
                            </b>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.6rem',
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: 4,
                                display: 'inline-block',
                              }}
                            >
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.chapterBody}>
                    <h3>{ch.title}</h3>
                    <p>{ch.body}</p>
                    {ch.imageSrc && (
                      <figure style={{ margin: '32px 0 0' }}>
                        <div
                          style={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            overflow: 'hidden',
                            background: '#1a1d29',
                            border: '1px solid rgba(212,168,67,0.18)',
                          }}
                        >
                          <Image
                            src={ch.imageSrc}
                            alt={ch.imageAlt ?? ''}
                            fill
                            sizes="(max-width: 900px) 100vw, 720px"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        </div>
                        {ch.imageCaption && (
                          <figcaption
                            style={{
                              marginTop: 12,
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.22em',
                              color: 'rgba(255,255,255,0.5)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {ch.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* PRODUCTION VIDEOS */}
          <section className={styles.chapter} data-alt="1">
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>{processVideos.num}</div>
                  <div className={styles.chapterTag}>{processVideos.tag}</div>
                </div>
                <div className={styles.chapterBody}>
                  <h3>{processVideos.title}</h3>
                  <p>{processVideos.body}</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 20,
                      marginTop: 30,
                    }}
                  >
                    {processVideos.items.filter((v) => v.src).map((v, i) => (
                      <figure key={v.src || i} style={{ margin: 0 }}>
                        <div
                          style={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            overflow: 'hidden',
                            background: '#000',
                            border: '1px solid rgba(212,168,67,0.18)',
                          }}
                        >
                          <video
                            src={v.src}
                            controls
                            playsInline
                            preload="metadata"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <figcaption
                          style={{
                            marginTop: 10,
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.72)',
                            lineHeight: 1.6,
                          }}
                        >
                          {v.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CERTIFICATIONS */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>{certifications.num}</div>
                  <div className={styles.chapterTag}>{certifications.tag}</div>
                </div>
                <div className={styles.chapterBody}>
                  <h3>{certifications.title}</h3>
                  <p>{certifications.body}</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 20,
                      marginTop: 30,
                    }}
                  >
                    {certifications.sections.map((section) => (
                      <div
                        key={section.title}
                        style={{
                          border: '1px solid rgba(212,168,67,0.25)',
                          padding: '20px 18px',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '0.6rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            marginBottom: 12,
                          }}
                        >
                          {section.title}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                          {section.items.map((item) => (
                            <li key={item} style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
                              · {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 14,
                      marginTop: 28,
                    }}
                  >
                    {certifications.images.map((src, idx) => (
                      <div
                        key={src}
                        style={{
                          position: 'relative',
                          aspectRatio: '3/4',
                          overflow: 'hidden',
                          background: '#1a1d29',
                          border: '1px solid rgba(212,168,67,0.18)',
                        }}
                      >
                        <Image
                          src={src}
                          alt={`인증서 문서 ${idx + 1}`}
                          fill
                          sizes="(max-width: 900px) 50vw, 240px"
                          style={{ objectFit: 'cover' }}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <MediaGallery videos={gallery.videos} photos={gallery.photos} articles={gallery.articles} />
      )}
    </>
  );
}
