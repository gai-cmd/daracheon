'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export interface FeatureVideo {
  id: string;
  /** cleanVideoTitle 을 거친 제목 */
  title: string;
  date: string;
  /** 가로(16:9) 썸네일 */
  thumbnail: string;
}

/** 가로 영상 모달 — ESC·바깥 클릭으로 닫고, 열려 있는 동안 본문 스크롤을 잠근다. */
function VideoModal({ video, onClose }: { video: FeatureVideo; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={video.title} className={styles.modal} onClick={onClose}>
      <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
        <iframe
          className={styles.modalFrame}
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
        <div className={styles.modalBar}>
          <span className={styles.modalTitle}>{video.title}</span>
          <button ref={closeRef} type="button" onClick={onClose} className={styles.modalClose} aria-label="닫기">
            닫기 ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 공식 유튜브 채널 영상 — 최신 영상 하나를 크게, 나머지는 옆(모바일은 아래)에 작게.
 * 채널에 쇼츠가 없고 가로 영상만 있어 16:9 카드로 구성한다(2026-09-26).
 */
export default function VideoFeature({ videos }: { videos: FeatureVideo[] }) {
  const [playing, setPlaying] = useState<FeatureVideo | null>(null);
  const close = useCallback(() => setPlaying(null), []);
  const [featured, ...rest] = videos;
  if (!featured) return null;

  return (
    <>
      <div className={rest.length > 0 ? styles.vGrid : `${styles.vGrid} ${styles.vGridSolo}`}>
        <button
          type="button"
          className={`${styles.vCard} ${styles.vFeatured}`}
          onClick={() => setPlaying(featured)}
          aria-label={`${featured.title} 재생`}
          data-reveal=""
        >
          <span className={styles.vThumb}>
            <Image src={featured.thumbnail} alt="" fill sizes="(max-width: 900px) 100vw, 62vw" className={styles.vImg} />
            <span className={styles.vShade} aria-hidden="true" />
            <span className={`${styles.vPlay} ${styles.vPlayLg}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          {/* 넓은 화면에서는 썸네일 위에 겹치고, 좁은 화면에서는 썸네일 아래로 내려온다 */}
          <span className={styles.vOverlay}>
            <span className={styles.vDate}>Latest · {featured.date}</span>
            <span className={`${styles.vTitle} ${styles.vTitleLg}`}>{featured.title}</span>
          </span>
        </button>

        {rest.length > 0 && (
          <div className={styles.vSide}>
            {rest.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className={styles.vCard}
                onClick={() => setPlaying(v)}
                aria-label={`${v.title} 재생`}
                data-reveal=""
                style={{ ['--d' as string]: `${(i + 1) * 120}ms` }}
              >
                <span className={styles.vThumb}>
                  <Image src={v.thumbnail} alt="" fill sizes="(max-width: 900px) 100vw, 34vw" className={styles.vImg} />
                  <span className={styles.vShade} aria-hidden="true" />
                  <span className={styles.vPlay} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <span className={styles.vMeta}>
                  <span className={styles.vDate}>{v.date}</span>
                  <span className={styles.vTitle}>{v.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {playing && <VideoModal video={playing} onClose={close} />}
    </>
  );
}
