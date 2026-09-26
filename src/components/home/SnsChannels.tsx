'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { SnsChannels as SnsChannelsData, SnsVideo } from '@/lib/sns';
import { cleanVideoTitle, formatSnsDate } from '@/lib/sns';
import styles from './SnsChannels.module.css';

function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"
      />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"
      />
    </svg>
  );
}

function VideoModal({ video, onClose }: { video: SnsVideo; onClose: () => void }) {
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

  const title = cleanVideoTitle(video.title);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className={styles.modal} onClick={onClose}>
      <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
        <iframe
          className={styles.modalFrame}
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
        <div className={styles.modalBar}>
          <span className={styles.modalTitle}>{title}</span>
          <button type="button" onClick={onClose} className={styles.modalClose} aria-label="닫기">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SnsChannels({ data, className }: { data: SnsChannelsData; className?: string }) {
  const [playing, setPlaying] = useState<SnsVideo | null>(null);
  const { youtube, instagram } = data;

  return (
    <section className={className ? `${styles.section} ${className}` : styles.section} id="channels" aria-label="대라천 공식 채널">
      <div className={styles.wrap}>
        {youtube.videos.length > 0 && (
          <div className={styles.block}>
            <header className={styles.blockHead}>
              <div className={styles.account}>
                <span className={`${styles.mark} ${styles.markYt}`}>
                  <YoutubeMark />
                </span>
                <div>
                  <div className={styles.platform}>YouTube</div>
                  <div className={styles.accountName}>
                    {youtube.name} <span className={styles.handle}>{youtube.handle}</span>
                  </div>
                </div>
              </div>
              <a href={youtube.url} target="_blank" rel="noopener noreferrer" className={styles.followBtn}>
                채널 구독하기 →
              </a>
            </header>

            <ul className={styles.shortsRow}>
              {youtube.videos.map((v) => {
                const title = cleanVideoTitle(v.title);
                return (
                  <li key={v.id} className={styles.shortItem}>
                    <button type="button" className={styles.shortCard} onClick={() => setPlaying(v)}>
                      <span className={styles.shortThumb}>
                        <Image src={v.thumbnail} alt="" fill sizes="(max-width: 700px) 86vw, 50vw" style={{ objectFit: 'cover' }} />
                        <span className={styles.play} aria-hidden="true">▶</span>
                      </span>
                      <span className={styles.shortTitle}>{title}</span>
                      <span className={styles.shortDate}>{formatSnsDate(v.publishedAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={styles.block}>
          <header className={styles.blockHead}>
            <div className={styles.account}>
              <span className={`${styles.mark} ${styles.markIg}`}>
                <InstagramMark />
              </span>
              <div>
                <div className={styles.platform}>Instagram</div>
                <div className={styles.accountName}>
                  {instagram.name} <span className={styles.handle}>{instagram.handle}</span>
                </div>
              </div>
            </div>
            <a href={instagram.url} target="_blank" rel="noopener noreferrer" className={styles.followBtn}>
              팔로우하기 →
            </a>
          </header>

          {instagram.posts.length > 0 ? (
            <ul className={styles.igGrid}>
              {instagram.posts.map((p) => (
                <li key={p.id}>
                  <a href={p.permalink} target="_blank" rel="noopener noreferrer" className={styles.igTile}>
                    <Image src={p.image} alt={p.caption ?? ''} fill sizes="(max-width: 700px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                    {p.mediaType && p.mediaType !== 'IMAGE' && (
                      <span className={styles.igType} aria-hidden="true">
                        {p.mediaType === 'VIDEO' ? '▶' : '❐'}
                      </span>
                    )}
                    {p.caption && <span className={styles.igCaption}>{p.caption}</span>}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              농장과 제품의 일상을 인스타그램에서 먼저 소개합니다.
            </p>
          )}
        </div>
      </div>

      {playing && <VideoModal video={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
