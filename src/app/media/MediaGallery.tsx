'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '@/styles/zoel/story-page.module.css';

export interface MediaItem {
  id: string;
  type: 'article' | 'press' | 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image?: string;
  excerpt?: string;
  url?: string;
}

/** YouTube watch URL → 영상 ID 추출. shorts/embed 도 지원. */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Google Drive view URL → 파일 ID. */
function extractDriveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

interface VideoEmbedSpec {
  src: string;
  provider: 'youtube' | 'drive' | 'native';
}

function buildEmbed(item: MediaItem): VideoEmbedSpec | null {
  const url = item.url ?? '';
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      src: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`,
      provider: 'youtube',
    };
  }
  const driveId = extractDriveId(url);
  if (driveId) {
    return {
      src: `https://drive.google.com/file/d/${driveId}/preview`,
      provider: 'drive',
    };
  }
  // mp4 직접 링크 등
  if (/\.(mp4|webm|mov)$/i.test(url)) {
    return { src: url, provider: 'native' };
  }
  return null;
}

interface VideoModalProps {
  item: MediaItem;
  onClose: () => void;
}

function VideoModal({ item, onClose }: VideoModalProps) {
  const embed = buildEmbed(item);

  // Esc 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(12px, 4vw, 40px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1280,
          background: '#000',
          border: '1px solid rgba(212,168,67,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(10,11,16,0.95)',
            borderBottom: '1px solid rgba(212,168,67,0.2)',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 4,
              }}
            >
              {item.source} · {item.date}
            </div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 500,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              {item.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                원본 →
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                width: 36,
                height: 36,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ aspectRatio: '16 / 9', width: '100%', background: '#000' }}>
          {embed?.provider === 'native' ? (
            <video
              src={embed.src}
              controls
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          ) : embed ? (
            <iframe
              src={embed.src}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0 }}
              title={item.title}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '100%',
                height: '100%',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.92rem',
                padding: 40,
                textAlign: 'center',
              }}
            >
              임베드할 수 있는 영상이 아닙니다.
              {item.url && (
                <>
                  <br />
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                    원본 사이트에서 보기 →
                  </a>
                </>
              )}
            </div>
          )}
        </div>
        {item.excerpt && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(10,11,16,0.95)',
              borderTop: '1px solid rgba(212,168,67,0.15)',
              color: 'rgba(255,255,255,0.78)',
              fontSize: '0.92rem',
              lineHeight: 1.85,
              fontWeight: 300,
            }}
          >
            {item.excerpt}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaGallery({
  videos,
  photos,
  articles,
}: {
  videos: MediaItem[];
  photos: MediaItem[];
  articles: MediaItem[];
}) {
  const [openVideo, setOpenVideo] = useState<MediaItem | null>(null);

  return (
    <>
      {/* VIDEOS */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>01</div>
              <div className={styles.chapterTag}>Videos</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>영상 갤러리</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', marginTop: 8 }}>
                썸네일을 클릭하면 페이지를 떠나지 않고 바로 재생됩니다.
              </p>
              {videos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24,
                    marginTop: 30,
                  }}
                >
                  {videos.map((item, vIdx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOpenVideo(item)}
                      style={{
                        textAlign: 'left',
                        background: 'transparent',
                        padding: 0,
                        border: 0,
                        cursor: 'pointer',
                        color: 'inherit',
                        display: 'block',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: '16/9',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#1a1d29',
                          border: '1px solid rgba(212,168,67,0.18)',
                        }}
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                            priority={vIdx === 0}
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              background: 'rgba(212,168,67,0.92)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#0a0b10',
                              fontSize: '1.6rem',
                              paddingLeft: 4,
                              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                            }}
                          >
                            ▶
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '14px 4px 0', color: 'rgba(255,255,255,0.78)' }}>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '0.66rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            marginBottom: 6,
                          }}
                        >
                          {item.source} · {item.date}
                        </div>
                        <div style={{ fontSize: '0.96rem', lineHeight: 1.55, color: '#fff' }}>{item.title}</div>
                        {item.excerpt && (
                          <p style={{ marginTop: 8, fontSize: '0.86rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>등록된 영상이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PHOTOS */}
      <section className={`${styles.chapter} ${styles.chapterAlt}`}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>02</div>
              <div className={styles.chapterTag}>Photos</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>사진 갤러리</h3>
              {photos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginTop: 24,
                  }}
                >
                  {photos.map((item, pIdx) => (
                    <Link key={item.id} href={`/media/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div
                        style={{
                          aspectRatio: '4/3',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#1a1d29',
                          border: '1px solid rgba(212,168,67,0.18)',
                        }}
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 700px) 100vw, 33vw"
                            priority={pIdx < 2}
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{ padding: '10px 2px 0', color: 'rgba(255,255,255,0.78)' }}>
                        <div style={{ fontSize: '0.92rem', color: '#fff' }}>{item.title}</div>
                        <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                          {item.source} · {item.date}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>등록된 사진이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>03</div>
              <div className={styles.chapterTag}>Articles</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>기사·보도</h3>
              {articles.length > 0 ? (
                <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
                  {articles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/media/${item.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr',
                        gap: 20,
                        padding: 16,
                        border: '1px solid rgba(212,168,67,0.18)',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'border-color 200ms',
                      }}
                    >
                      <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: '#1a1d29' }}>
                        {item.image && (
                          <Image src={item.image} alt={item.title} fill sizes="160px" style={{ objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '0.66rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            marginBottom: 6,
                          }}
                        >
                          {item.source} · {item.date}
                        </div>
                        <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: 8, fontWeight: 500 }}>{item.title}</h4>
                        {item.excerpt && (
                          <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontWeight: 300 }}>
                            {item.excerpt}
                          </p>
                        )}
                        <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--accent)' }}>자세히 보기 →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>등록된 기사가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {openVideo && <VideoModal item={openVideo} onClose={() => setOpenVideo(null)} />}
    </>
  );
}
