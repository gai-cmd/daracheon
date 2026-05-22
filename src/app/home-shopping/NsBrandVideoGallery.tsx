'use client';

import { useState } from 'react';
import VideoModal, { type VideoModalItem } from '@/components/VideoModal';
import styles from './page.module.css';

export interface NsBrandVideo {
  id: string;
  kicker: string;
  title: string;
  /** Vercel Blob 에 업로드된 mp4 URL. 외부 CDN 의존 금지 원칙에 따라 우리 인프라 안에서만. */
  url: string;
}

/** NS홈쇼핑 제작 브랜드 영상 갤러리. 썸네일(비디오 첫 프레임) 클릭 시 모달 재생.
 *  media 페이지의 MediaGallery 와 동일한 UX 패턴 — VideoModal 컴포넌트 공유. */
export default function NsBrandVideoGallery({ videos }: { videos: NsBrandVideo[] }) {
  const [openItem, setOpenItem] = useState<VideoModalItem | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <>
      <div className={styles.nsGrid}>
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            className={styles.nsCardBtn}
            onClick={() =>
              setOpenItem({
                id: v.id,
                title: v.title,
                source: `NS Shop+ · ${v.kicker}`,
                url: v.url,
              })
            }
            aria-label={`${v.title} 재생`}
          >
            <div className={styles.nsCard}>
              <div className={styles.nsVideo}>
                <video
                  src={v.url}
                  preload="metadata"
                  muted
                  playsInline
                  aria-hidden
                />
                <span className={styles.nsPlayBadge} aria-hidden>▶</span>
                <span className={styles.nsThumbScrim} aria-hidden />
              </div>
              <div className={styles.nsCardMeta}>
                <span className={styles.nsCardKicker}>{v.kicker}</span>
                <span className={styles.nsCardTitle}>{v.title}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {openItem && <VideoModal item={openItem} onClose={() => setOpenItem(null)} />}
    </>
  );
}
