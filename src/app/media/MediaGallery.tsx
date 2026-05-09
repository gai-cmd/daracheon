'use client';

import Image from 'next/image';
import styles from '@/styles/zoel/story-page.module.css';

export interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image?: string;
  excerpt?: string;
  url?: string;
}

// 영상 갤러리는 /brand-story 04 섹션으로 이동됨 — 영상 모달은 BrandStoryClient.tsx PromoVideoModal 참조.

export default function MediaGallery({
  photos,
}: {
  photos: MediaItem[];
}) {
  return (
    <>
      {/* PHOTOS — 영상 갤러리는 /brand-story 04 섹션으로 이동됨 */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>01</div>
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
                    <div key={item.id} style={{ color: 'inherit' }}>
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
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>등록된 사진이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
