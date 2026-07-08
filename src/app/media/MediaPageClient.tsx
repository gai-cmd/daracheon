'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/zoel/story-page.module.css';
import ChapterCarousel from '@/components/ui/ChapterCarousel';
import MediaGallery, { type MediaItem } from './MediaGallery';
import StickyTabBar from '@/components/layout/StickyTabBar';
import { useHashTab, setTabHash } from '@/lib/use-hash-tab';
import type { Farm } from '@/app/brand-story/page';

interface ProcessChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  stats?: { value: string; label: string }[];
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
  images?: string[];
}

interface ProcessVideo {
  src: string;
  title: string;
  date?: string;
  thumbnail?: string;
}

interface CertSection {
  title: string;
  items: string[];
}

export interface SceneExtra {
  image: string;
  body: string;
  alt?: string;
}

export interface SceneSection {
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  images: string[];
  extras?: SceneExtra[];
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
    extraSection?: {
      images: string[];
    };
  };
}

export interface GalleryData {
  videos: MediaItem[];
  photos: MediaItem[];
}

const TABS = [
  { key: 'story' as const, label: '침향 농장 이야기' },
  { key: 'gallery' as const, label: '영상・사진 갤러리' },
];

export default function MediaPageClient({
  farmStory,
  gallery,
  farms = [],
}: {
  farmStory: FarmStoryData;
  gallery: GalleryData;
  farms?: Farm[];
}) {
  const [activeTab, setActiveTab] = useState<'story' | 'gallery'>('story');
  const { hero, sceneSection, chapters, certifications } = farmStory;

  useHashTab(
    (k) => setActiveTab(k as 'story' | 'gallery'),
    (k) => k === 'story' || k === 'gallery'
  );

  return (
    <>
      {/* HERO — brand-story / about-agarwood 와 완전 동일 구조 */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero.heroImage && (
          <Image
            src={hero.heroImage}
            alt=""
            fill
            sizes="100vw"
            priority
            aria-hidden
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
          />
        )}
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero.kicker}</div>
          <div className={styles.heroMainNarrow}>
            <h1>
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
            </h1>
            <p className={styles.lede} style={{ maxWidth: 'none' }}>
              {hero.lede}
            </p>
          </div>
        </div>
      </section>

      <StickyTabBar
        tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeKey={activeTab}
        onChange={(k) => {
          setActiveTab(k as typeof activeTab);
          setTabHash(k);
        }}
      />

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
                      <p className={styles.chapterSubtitle}>
                        {sceneSection.subtitle}
                      </p>
                    )}
                    {farms.length > 0 && (
                      <div
                        className="farms-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${farms.length}, minmax(0, 1fr))`,
                          gap: 16,
                          margin: '24px 0 28px',
                        }}
                      >
                        {farms.map((farm, i) => (
                          <div
                            key={farm.nameVi + i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                              padding: 14,
                              border: '1px solid rgba(212,168,67,0.18)',
                              background: 'rgba(255,255,255,0.015)',
                            }}
                          >
                            {farm.image && (
                              <div
                                style={{
                                  position: 'relative',
                                  aspectRatio: '4/3',
                                  overflow: 'hidden',
                                  background: '#1a1d29',
                                  border: '1px solid rgba(212,168,67,0.18)',
                                }}
                              >
                                <Image
                                  src={farm.image}
                                  alt={`${farm.name} (${farm.nameVi}) 농장`}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 20vw"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.6rem',
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                color: 'var(--accent)',
                              }}
                            >
                              농장 · {String(i + 1).padStart(2, '0')}
                            </div>
                            <div
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.02rem',
                                color: '#fff',
                                fontWeight: 400,
                                lineHeight: 1.4,
                              }}
                            >
                              {farm.name}
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontFamily: 'inherit',
                                  fontSize: '0.85rem',
                                  color: 'rgba(255,255,255,0.55)',
                                  fontWeight: 300,
                                }}
                              >
                                ({farm.nameVi})
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: 'rgba(255,255,255,0.7)',
                                lineHeight: 1.65,
                                fontWeight: 300,
                              }}
                            >
                              {farm.desc}
                            </div>
                          </div>
                        ))}
                      </div>
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
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {sceneSection.body && (
                      <p style={{ whiteSpace: 'pre-line' }}>{sceneSection.body}</p>
                    )}
                    {sceneSection.extras && sceneSection.extras.length > 0 && (
                      <div
                        style={{
                          marginTop: 36,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: 20,
                          alignItems: 'stretch',
                        }}
                      >
                        {sceneSection.extras.map((ex, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 16,
                              padding: 18,
                              border: '1px solid rgba(212,168,67,0.12)',
                              background: 'rgba(255,255,255,0.015)',
                            }}
                          >
                            <div
                              style={{
                                position: 'relative',
                                aspectRatio: '4/3',
                                overflow: 'hidden',
                                background: '#1a1d29',
                                border: '1px solid rgba(212,168,67,0.18)',
                              }}
                            >
                              <Image
                                src={ex.image}
                                alt={ex.alt ?? `현장 추가 ${i + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <p
                              style={{
                                whiteSpace: 'pre-line',
                                margin: 0,
                                fontSize: '0.96rem',
                                lineHeight: 1.85,
                                color: 'rgba(255,255,255,0.82)',
                              }}
                            >
                              {ex.body}
                            </p>
                          </div>
                        ))}
                      </div>
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
                    {(() => {
                      const list = (ch.images?.filter(Boolean) ?? []);
                      const fallback = ch.imageSrc ? [ch.imageSrc] : [];
                      const imgs = list.length > 0 ? list : fallback;
                      if (imgs.length === 0) return null;
                      return (
                        <ChapterCarousel
                          images={imgs}
                          alt={ch.imageAlt}
                          caption={ch.imageCaption}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* 07 Certifications 섹션은 삭제됨. extraSection.images 는 갤러리 탭의 사진 갤러리로 이동. */}
        </>
      ) : (
        <MediaGallery
          videos={gallery.videos}
          photos={(certifications.extraSection?.images ?? []).map((src, idx) => ({
            id: `cert-extra-${idx}`,
            type: 'photo' as const,
            title: `대라천 침향 추가 인증 문서 ${idx + 1}`,
            source: '대라천 공식',
            date: '',
            image: src,
          }))}
        />
      )}
    </>
  );
}
