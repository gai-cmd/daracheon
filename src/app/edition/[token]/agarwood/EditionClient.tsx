'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { EditionContent } from '@/content/edition/types';

interface Props {
  content: EditionContent;
  reader: { name: string; company?: string };
}

const GOLD = '#b88c2d';
const GOLD_SOFT = '#d4a843';
const INK = '#050608';

export default function EditionClient({ content, reader }: Props) {
  const { cover, foreword, chapters, gallery, lineup, closing } = content;

  // 스크롤 진행 도트 네비게이션
  const sectionIds = [
    'cover',
    'foreword',
    ...chapters.map((c) => `ch-${c.num}`),
    ...(gallery ? ['gallery'] : []),
    ...(lineup ? ['lineup'] : []),
    'closing',
  ];
  const [active, setActive] = useState<string>('cover');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.4, rootMargin: '-20% 0px -20% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds]);

  return (
    <main
      style={{
        background: INK,
        color: '#fff',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* Reader strip */}
      <ReaderStrip reader={reader} />

      {/* Side dot nav */}
      <SideDots sectionIds={sectionIds} active={active} chapters={chapters} hasGallery={!!gallery} hasLineup={!!lineup} />

      {/* COVER */}
      <Cover cover={cover} reader={reader} />

      {/* FOREWORD */}
      <Foreword foreword={foreword} />

      {/* CHAPTERS */}
      {chapters.map((ch, i) => (
        <ChapterDivider key={`d-${ch.num}`} chapter={ch}>
          <Chapter chapter={ch} alt={i % 2 === 1} />
        </ChapterDivider>
      ))}

      {/* GALLERY */}
      {gallery && <GallerySection gallery={gallery} />}

      {/* LINEUP */}
      {lineup && <LineupSection lineup={lineup} />}

      {/* CLOSING */}
      <Closing closing={closing} reader={reader} />
    </main>
  );
}

/* ───────────── Reader strip ───────────── */
function ReaderStrip({ reader }: { reader: Props['reader'] }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '12px 24px',
        background: 'rgba(5,6,8,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212,168,67,0.15)',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: '0.62rem',
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.55)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <span style={{ color: GOLD_SOFT }}>Daracheon · Limited Edition</span>
      <span style={{ textAlign: 'right' }}>
        Curated for <strong style={{ color: '#fff' }}>{reader.name}</strong>
        {reader.company ? <span style={{ marginLeft: 8, opacity: 0.6 }}> · {reader.company}</span> : null}
      </span>
    </div>
  );
}

/* ───────────── Side dot nav ───────────── */
function SideDots({
  sectionIds,
  active,
  chapters,
  hasGallery,
  hasLineup,
}: {
  sectionIds: string[];
  active: string;
  chapters: EditionContent['chapters'];
  hasGallery: boolean;
  hasLineup: boolean;
}) {
  const labels: Record<string, string> = {
    cover: 'Cover',
    foreword: 'Foreword',
    gallery: 'Documents',
    lineup: 'Lineup',
    closing: 'Contact',
  };
  chapters.forEach((c) => {
    labels[`ch-${c.num}`] = `Ch ${c.num}`;
  });
  // appease lint
  void hasGallery;
  void hasLineup;

  return (
    <nav
      aria-label="섹션 네비게이션"
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {sectionIds.map((id) => {
        const isActive = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-label={labels[id]}
            title={labels[id]}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: isActive ? GOLD : 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              transition: 'color 200ms',
            }}
          >
            <span
              style={{
                width: isActive ? 18 : 6,
                height: 1,
                background: isActive ? GOLD : 'rgba(255,255,255,0.4)',
                transition: 'all 200ms',
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.58rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 200ms',
              }}
            >
              {labels[id]}
            </span>
          </a>
        );
      })}
      <style>{`
        @media (max-width: 900px) {
          nav[aria-label="섹션 네비게이션"] { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

/* ───────────── Cover ───────────── */
function Cover({ cover, reader }: { cover: EditionContent['cover']; reader: Props['reader'] }) {
  return (
    <section
      id="cover"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(80px, 12vw, 160px) clamp(20px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      {cover.backgroundImage && (
        <Image
          src={cover.backgroundImage}
          alt=""
          fill
          priority
          unoptimized
          aria-hidden
          sizes="100vw"
          style={{ objectFit: 'cover', opacity: 0.35 }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at top, rgba(184,140,45,0.18), transparent 60%), linear-gradient(180deg, rgba(5,6,8,0.4) 0%, rgba(5,6,8,0.95) 100%)',
        }}
        aria-hidden
      />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 880 }}>
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 36,
            }}
          >
            {cover.kicker}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={150}>
          <h1
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(2.4rem, 7vw, 5rem)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              margin: 0,
              marginBottom: 14,
              color: '#fff',
            }}
          >
            {cover.title}
          </h1>
        </RevealOnScroll>
        {cover.titleHighlight && (
          <RevealOnScroll delay={250}>
            <div
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 400,
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: GOLD,
                marginBottom: 40,
                fontStyle: 'italic',
              }}
            >
              {cover.titleHighlight}
            </div>
          </RevealOnScroll>
        )}
        <RevealOnScroll delay={350}>
          <div
            style={{
              width: 80,
              height: 1,
              background: GOLD,
              margin: '0 auto 32px',
            }}
            aria-hidden
          />
        </RevealOnScroll>
        <RevealOnScroll delay={400}>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.12rem)',
              lineHeight: 1.95,
              color: 'rgba(255,255,255,0.78)',
              margin: 0,
              marginBottom: 56,
              fontWeight: 300,
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {cover.subtitle}
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={500}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.66rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {cover.edition} · For {reader.name}
          </div>
        </RevealOnScroll>
      </div>
      <ScrollHint />
    </section>
  );
}

function ScrollHint() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
      }}
      aria-hidden
    >
      Scroll
      <span
        style={{
          width: 1,
          height: 40,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
          animation: 'edition-scroll-hint 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes edition-scroll-hint {
          0%, 100% { transform: scaleY(1); transform-origin: top; }
          50% { transform: scaleY(0.3); transform-origin: top; }
        }
      `}</style>
    </div>
  );
}

/* ───────────── Foreword ───────────── */
function Foreword({ foreword }: { foreword: EditionContent['foreword'] }) {
  return (
    <section
      id="foreword"
      style={{
        padding: 'clamp(80px, 14vw, 180px) clamp(24px, 8vw, 120px)',
        background: '#0a0b10',
        borderTop: '1px solid rgba(212,168,67,0.12)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 32,
            }}
          >
            Foreword
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <p
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              lineHeight: 1.5,
              color: '#fff',
              marginBottom: 40,
            }}
          >
            {foreword.greeting}
          </p>
        </RevealOnScroll>
        {foreword.body.map((p, i) => (
          <RevealOnScroll key={i} delay={200 + i * 80}>
            <p
              style={{
                fontSize: '1.04rem',
                lineHeight: 2.1,
                color: 'rgba(255,255,255,0.78)',
                marginBottom: 22,
                fontWeight: 300,
              }}
            >
              {p}
            </p>
          </RevealOnScroll>
        ))}
        <RevealOnScroll delay={500}>
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: '1px solid rgba(212,168,67,0.18)',
            }}
          >
            <div
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: '1rem',
                color: GOLD_SOFT,
                marginBottom: 4,
              }}
            >
              {foreword.signature}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {foreword.signatureRole}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

/* ───────────── Chapter divider + Chapter ───────────── */
function ChapterDivider({
  chapter,
  children,
}: {
  chapter: EditionContent['chapters'][number];
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        style={{
          background: '#020203',
          padding: 'clamp(60px, 10vw, 120px) 24px',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          borderTop: '1px solid rgba(212,168,67,0.1)',
          borderBottom: '1px solid rgba(212,168,67,0.1)',
        }}
      >
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 200,
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              color: GOLD,
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {chapter.num}
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.66rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {chapter.tag}
          </div>
        </RevealOnScroll>
      </div>
      {children}
    </>
  );
}

function Chapter({ chapter, alt }: { chapter: EditionContent['chapters'][number]; alt: boolean }) {
  return (
    <section
      id={`ch-${chapter.num}`}
      style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px)',
        background: alt ? '#0a0b10' : '#070809',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <RevealOnScroll>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              lineHeight: 1.3,
              margin: 0,
              marginBottom: 14,
              color: '#fff',
            }}
          >
            {chapter.title}
          </h2>
        </RevealOnScroll>
        {chapter.subtitle && (
          <RevealOnScroll delay={100}>
            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontStyle: 'italic',
                color: GOLD_SOFT,
                fontSize: 'clamp(1rem, 1.8vw, 1.18rem)',
                marginBottom: 40,
                fontWeight: 300,
              }}
            >
              {chapter.subtitle}
            </p>
          </RevealOnScroll>
        )}
        {chapter.body?.map((p, i) => (
          <RevealOnScroll key={i} delay={200 + i * 80}>
            <p
              style={{
                fontSize: '1.04rem',
                lineHeight: 2.05,
                color: 'rgba(255,255,255,0.78)',
                marginBottom: 22,
                fontWeight: 300,
              }}
            >
              {p}
            </p>
          </RevealOnScroll>
        ))}

        {chapter.pull && (
          <RevealOnScroll delay={300}>
            <div
              style={{
                margin: '60px auto',
                maxWidth: 720,
                textAlign: 'center',
                padding: '40px 24px',
                borderTop: `1px solid ${GOLD}`,
                borderBottom: `1px solid ${GOLD}`,
              }}
            >
              <p
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 400,
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.4rem, 3.4vw, 2.2rem)',
                  lineHeight: 1.5,
                  color: GOLD,
                  margin: 0,
                  marginBottom: 18,
                }}
              >
                "{chapter.pull.quote}"
              </p>
              {chapter.pull.source && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: '0.66rem',
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  — {chapter.pull.source}
                </div>
              )}
            </div>
          </RevealOnScroll>
        )}

        {chapter.highlights && chapter.highlights.length > 0 && (
          <RevealOnScroll delay={400}>
            <div
              style={{
                marginTop: 50,
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(chapter.highlights.length, 4)}, minmax(0,1fr))`,
                gap: 24,
                borderTop: '1px solid rgba(212,168,67,0.18)',
                paddingTop: 36,
              }}
            >
              {chapter.highlights.map((h) => (
                <div key={h.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontWeight: 300,
                      fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
                      color: GOLD,
                      lineHeight: 1.1,
                      marginBottom: 8,
                    }}
                  >
                    {h.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: '0.6rem',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        )}

        {chapter.images && chapter.images.length > 0 && (
          <div
            style={{
              marginTop: 50,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {chapter.images.map((img, i) => (
              <RevealOnScroll key={img.src + i} delay={i * 80}>
                <figure style={{ margin: 0 }}>
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      background: '#1a1d29',
                      border: '1px solid rgba(212,168,67,0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 800px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  {img.caption && (
                    <figcaption
                      style={{
                        marginTop: 10,
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.55)',
                        lineHeight: 1.6,
                      }}
                    >
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {chapter.video && (
          <RevealOnScroll delay={400}>
            <div
              style={{
                marginTop: 50,
                position: 'relative',
                aspectRatio: '16/9',
                background: '#000',
                border: '1px solid rgba(212,168,67,0.2)',
              }}
            >
              <video
                src={chapter.video.src}
                poster={chapter.video.poster}
                controls
                playsInline
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
              />
            </div>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}

/* ───────────── Gallery ───────────── */
function GallerySection({ gallery }: { gallery: NonNullable<EditionContent['gallery']> }) {
  return (
    <section
      id="gallery"
      style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px)',
        background: '#050608',
        borderTop: '1px solid rgba(212,168,67,0.12)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 18,
            }}
          >
            {gallery.tag}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              margin: 0,
              marginBottom: 14,
              color: '#fff',
            }}
          >
            {gallery.title}
          </h2>
        </RevealOnScroll>
        {gallery.subtitle && (
          <RevealOnScroll delay={150}>
            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontStyle: 'italic',
                color: GOLD_SOFT,
                fontSize: '1.08rem',
                marginBottom: 50,
                fontWeight: 300,
              }}
            >
              {gallery.subtitle}
            </p>
          </RevealOnScroll>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 18,
          }}
        >
          {gallery.items.map((item, i) => (
            <RevealOnScroll key={item.src + i} delay={(i % 6) * 80}>
              <div
                style={{
                  border: '1px solid rgba(212,168,67,0.2)',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    background: '#fff',
                  }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 800px) 50vw, 25vw"
                    style={{ objectFit: 'contain', padding: 8 }}
                  />
                </div>
                {(item.label || item.sub) && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderTop: '1px solid rgba(212,168,67,0.15)',
                    }}
                  >
                    {item.label && (
                      <div
                        style={{
                          fontSize: '0.86rem',
                          color: '#fff',
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                    {item.sub && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'rgba(255,255,255,0.5)',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.sub}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Lineup ───────────── */
function LineupSection({ lineup }: { lineup: NonNullable<EditionContent['lineup']> }) {
  return (
    <section
      id="lineup"
      style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px)',
        background: '#0a0b10',
        borderTop: '1px solid rgba(212,168,67,0.12)',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 18,
            }}
          >
            {lineup.tag}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              margin: 0,
              marginBottom: 14,
              color: '#fff',
            }}
          >
            {lineup.title}
          </h2>
        </RevealOnScroll>
        {lineup.subtitle && (
          <RevealOnScroll delay={150}>
            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontStyle: 'italic',
                color: GOLD_SOFT,
                fontSize: '1.08rem',
                marginBottom: 50,
                fontWeight: 300,
              }}
            >
              {lineup.subtitle}
            </p>
          </RevealOnScroll>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 0,
            borderTop: '1px solid rgba(212,168,67,0.18)',
          }}
        >
          {lineup.items.map((p, i) => (
            <RevealOnScroll key={p.name + i} delay={(i % 6) * 80}>
              <div
                style={{
                  padding: '32px 28px',
                  borderBottom: '1px solid rgba(212,168,67,0.12)',
                  borderRight:
                    (i + 1) % 3 === 0 ? 'none' : '1px solid rgba(212,168,67,0.08)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: GOLD,
                    marginBottom: 14,
                  }}
                >
                  {p.category}
                </div>
                <h3
                  style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontWeight: 400,
                    fontSize: '1.2rem',
                    color: '#fff',
                    margin: 0,
                    marginBottom: 12,
                  }}
                >
                  {p.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.85,
                    color: 'rgba(255,255,255,0.65)',
                    fontWeight: 300,
                    margin: 0,
                  }}
                >
                  {p.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Closing ───────────── */
function Closing({ closing, reader }: { closing: EditionContent['closing']; reader: Props['reader'] }) {
  const ctaPrimary: CSSProperties = {
    padding: '18px 36px',
    background: GOLD,
    color: INK,
    border: 'none',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: '0.74rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
  };
  const ctaSecondary: CSSProperties = {
    ...ctaPrimary,
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(212,168,67,0.4)',
    fontWeight: 500,
  };
  return (
    <section
      id="closing"
      style={{
        padding: 'clamp(100px, 14vw, 200px) clamp(24px, 8vw, 120px)',
        background: 'radial-gradient(900px 500px at 50% 0%, rgba(184,140,45,0.18), transparent 60%), #050608',
        textAlign: 'center',
        borderTop: '1px solid rgba(212,168,67,0.18)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <RevealOnScroll>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 24,
            }}
          >
            {closing.kicker}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 300,
              fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              lineHeight: 1.3,
              margin: 0,
              marginBottom: 28,
              color: '#fff',
            }}
          >
            {closing.title}
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={200}>
          <p
            style={{
              fontSize: '1.04rem',
              lineHeight: 2,
              color: 'rgba(255,255,255,0.78)',
              marginBottom: 56,
              fontWeight: 300,
            }}
          >
            {reader.name} 님, {closing.body}
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={300}>
          <div
            style={{
              display: 'inline-flex',
              gap: 14,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: 64,
            }}
          >
            {closing.cta.map((c, i) => (
              <a key={c.label} href={c.href} style={i === 0 ? ctaPrimary : ctaSecondary}>
                {c.label}
              </a>
            ))}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={400}>
          <div
            style={{
              paddingTop: 40,
              borderTop: '1px solid rgba(212,168,67,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {closing.contact.map((c) => (
              <div key={c.email}>
                <div
                  style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontSize: '1rem',
                    color: '#fff',
                    fontWeight: 400,
                    marginBottom: 4,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 8,
                  }}
                >
                  {c.role}
                </div>
                <a
                  href={`mailto:${c.email}`}
                  style={{ color: GOLD_SOFT, fontSize: '0.92rem', textDecoration: 'none' }}
                >
                  {c.email}
                </a>
                {c.phone && (
                  <span
                    style={{
                      marginLeft: 14,
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: '0.86rem',
                    }}
                  >
                    · {c.phone}
                  </span>
                )}
              </div>
            ))}
          </div>
        </RevealOnScroll>
        <div
          style={{
            marginTop: 80,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          End of Edition · Daracheon · ZOEL LIFE
        </div>
      </div>
    </section>
  );
}
