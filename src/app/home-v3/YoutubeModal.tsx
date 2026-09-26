'use client';

import { useEffect, useRef } from 'react';
import styles from './page.module.css';

/** 유튜브 가로(16:9) 재생 모달 — ESC·바깥 클릭으로 닫고, 열려 있는 동안 본문 스크롤을 막는다. */
export default function YoutubeModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
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
    <div role="dialog" aria-modal="true" aria-label={title} className={styles.modal} onClick={onClose}>
      <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
        <iframe
          className={styles.modalFrame}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
        <div className={styles.modalBar}>
          <span className={styles.modalTitle}>{title}</span>
          <button ref={closeRef} type="button" onClick={onClose} className={styles.modalClose} aria-label="닫기">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
