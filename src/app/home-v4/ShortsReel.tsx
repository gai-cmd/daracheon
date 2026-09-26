'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export interface ReelVideo {
  id: string;
  /** cleanVideoTitle 을 거친 제목 */
  title: string;
  date: string;
  thumbnail: string;
}

/** 세로 영상 모달 — ESC·바깥 클릭으로 닫고, 열려 있는 동안 본문 스크롤을 잠근다. */
function ReelModal({ video, onClose }: { video: ReelVideo; onClose: () => void }) {
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
 * 가로로 넘기는 쇼츠 릴. 가운데 카드만 정면·원래 크기, 좌우 카드는 살짝 돌아가 작아진다.
 * 가운데 판정은 스크롤 때마다 rAF 한 번으로 계산한다.
 */
export default function ShortsReel({ videos }: { videos: ReelVideo[] }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<ReelVideo | null>(null);
  const close = useCallback(() => setPlaying(null), []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const center = row.scrollLeft + row.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(row.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // 처음에는 두 번째 카드를 가운데로 — 양옆 카드가 보여야 '넘길 수 있다'는 게 읽힌다.
    const second = row.children[1] as HTMLElement | undefined;
    if (second) row.scrollLeft = second.offsetLeft + second.offsetWidth / 2 - row.clientWidth / 2;
    measure();
    row.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      row.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const row = rowRef.current;
    const target = row?.children[Math.min(Math.max(active + dir, 0), videos.length - 1)] as HTMLElement | undefined;
    if (!row || !target) return;
    row.scrollTo({ left: target.offsetLeft + target.offsetWidth / 2 - row.clientWidth / 2, behavior: 'smooth' });
  };

  return (
    <div className={styles.reel}>
      <ul ref={rowRef} className={styles.reelRow}>
        {videos.map((v, i) => (
          <li key={v.id} className={styles.reelItem}>
            <button
              type="button"
              className={styles.reelCard}
              data-pos={i === active ? 'center' : i < active ? 'left' : 'right'}
              onClick={() => setPlaying(v)}
              aria-label={`${v.title} 재생`}
            >
              <Image src={v.thumbnail} alt="" fill sizes="(max-width: 700px) 62vw, 280px" className={styles.reelImg} />
              <span className={styles.reelShade} aria-hidden="true" />
              <span className={styles.reelPlay} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className={styles.reelText}>
                <span className={styles.reelTitle}>{v.title}</span>
                <span className={styles.reelDate}>{v.date}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.reelNav}>
        <button type="button" className={styles.arrow} onClick={() => go(-1)} disabled={active === 0} aria-label="이전 영상">
          ←
        </button>
        <span className={styles.reelCount} aria-live="polite">
          {String(active + 1).padStart(2, '0')} <span>/ {String(videos.length).padStart(2, '0')}</span>
        </span>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => go(1)}
          disabled={active === videos.length - 1}
          aria-label="다음 영상"
        >
          →
        </button>
      </div>
      {playing && <ReelModal video={playing} onClose={close} />}
    </div>
  );
}
