import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readData } from '@/lib/db';
import styles from '@/styles/zoel/story-page.module.css';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '미디어 갤러리 - ZOEL LIFE 침향 농장 이야기 | ZOEL LIFE',
  description:
    '영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장. 베트남 직영 농장의 이야기를 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/media' },
};

interface MediaItem {
  id: string;
  type: 'article' | 'press' | 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image?: string;
  excerpt?: string;
  url?: string;
}

export default async function MediaPage() {
  const allMedia = await readData<MediaItem>('media');
  const videos = allMedia.filter((m) => m.type === 'video');
  const photos = allMedia.filter((m) => m.type === 'photo');
  const articles = allMedia.filter((m) => m.type === 'article' || m.type === 'press');

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>Gallery · 미디어</div>
          <h1>
            침향 농장
            <br />
            <em>이야기</em>
          </h1>
          <p className={styles.lede}>영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장.</p>
        </div>
      </section>

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
              {videos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24,
                    marginTop: 30,
                  }}
                >
                  {videos.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url ?? '#'}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
                          <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(10,11,16,0.4)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              border: '2px solid rgba(255,255,255,0.7)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              fontSize: 18,
                            }}
                          >
                            ▶
                          </div>
                        </div>
                      </div>
                      <p style={{ marginTop: 14, color: '#fff', fontSize: '0.95rem', fontWeight: 400 }}>{item.title}</p>
                      <p
                        style={{
                          marginTop: 4,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: '0.6rem',
                          letterSpacing: '0.18em',
                          color: 'rgba(255,255,255,0.45)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.source} · {item.date}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>등록된 영상이 없습니다. 곧 업데이트됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRESS */}
      {articles.length > 0 && (
        <section className={styles.chapter} data-alt="1">
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>02</div>
                <div className={styles.chapterTag}>Press</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>미디어 &amp; 뉴스</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 24,
                    marginTop: 30,
                  }}
                >
                  {articles.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url ?? '#'}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <article style={{ border: '1px solid rgba(212,168,67,0.18)', overflow: 'hidden' }}>
                        {item.image && (
                          <div style={{ aspectRatio: '16/9', position: 'relative', background: '#1a1d29' }}>
                            <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ padding: 20 }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.6rem',
                              letterSpacing: '0.24em',
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                              marginBottom: 8,
                              display: 'inline-block',
                            }}
                          >
                            {item.type === 'press' ? 'Press' : 'Article'}
                          </span>
                          <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1rem', color: '#fff', marginBottom: 8 }}>
                            {item.title}
                          </h4>
                          {item.excerpt && (
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 300 }}>
                              {item.excerpt}
                            </p>
                          )}
                          <p
                            style={{
                              marginTop: 12,
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.6rem',
                              letterSpacing: '0.18em',
                              color: 'rgba(255,255,255,0.45)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.source} · {item.date}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHOTOS */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>03</div>
              <div className={styles.chapterTag}>Photos</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>사진 갤러리</h3>
              {photos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                    marginTop: 30,
                  }}
                >
                  {photos.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        aspectRatio: '1/1',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#1a1d29',
                        border: '1px solid rgba(212,168,67,0.18)',
                      }}
                    >
                      {item.image && (
                        <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>등록된 사진이 없습니다. 곧 업데이트됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
