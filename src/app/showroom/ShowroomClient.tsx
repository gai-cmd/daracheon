'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import type { ShowroomData } from './page';
import styles from './ShowroomClient.module.css';

interface Props {
  data: ShowroomData | null;
}

export default function ShowroomClient({ data }: Props) {
  const hero = data?.hero;
  const intro = data?.intro;
  const visit = data?.visit;
  const gallery = data?.gallery ?? [];

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const close = useCallback(() => setActiveIdx(null), []);
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + gallery.length - 1) % gallery.length)),
    [gallery.length],
  );
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % gallery.length)),
    [gallery.length],
  );

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [activeIdx, close, prev, next]);

  const active = activeIdx !== null ? gallery[activeIdx] : null;

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        {hero?.heroBg && (
          <div className={styles.heroBg}>
            <Image
              src={hero.heroBg}
              alt=""
              fill
              sizes="100vw"
              priority
              aria-hidden
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        )}
        <div className={styles.wrap}>
          <div className={styles.heroInner}>
            <div className={styles.kicker}>{hero?.sectionTag ?? '대라천 침향 전시장 · Showroom'}</div>
            <h1 className={styles.heroTitle}>
              {hero?.titleEn ? (
                <>
                  {hero.titleKr ?? "대라천 '참'침향 전시장"}<br />
                  <em>{hero.titleEn}</em>
                </>
              ) : (
                hero?.titleKr ?? "대라천 '참'침향 전시장"
              )}
            </h1>
            {hero?.subtitle && <p className={styles.lede}>{hero.subtitle}</p>}
          </div>
        </div>
      </section>

      {/* 01 — INTRO + VISIT */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>01</div>
              <div className={styles.chapterTag}>{intro?.tag ?? 'THE SHOWROOM'}</div>
            </div>
            <div>
              <h2 className={styles.chapterTitle}>{intro?.title ?? '천년의 향기를 직접 체험하는 공간'}</h2>
              <div className={styles.line} />
              {intro?.body && <p className={styles.body}>{intro.body}</p>}

              <div className={styles.visitGrid}>
                <div className={styles.visitCard}>
                  <div className={styles.visitLabel}>위치 · Location</div>
                  <div className={styles.visitValue}>
                    {visit?.address ?? '베트남 동나이성 직영 본관'}
                    <br />
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontFamily: "var(--font-mono), monospace" }}>
                      {visit?.addressEn ?? 'Dong Nai, Vietnam'}
                    </span>
                  </div>
                </div>
                <div className={styles.visitCard}>
                  <div className={styles.visitLabel}>운영시간 · Hours</div>
                  <div className={styles.visitValue}>{visit?.hours ?? '연중무휴 10:00 – 18:00'}</div>
                </div>
                <div className={styles.visitCard}>
                  <div className={styles.visitLabel}>방문 안내 · Visit</div>
                  <div className={styles.visitValue}>한국어 통역 도슨트<br />사전 예약 권장</div>
                </div>
              </div>
              {visit?.note && <p className={styles.visitNote}>{visit.note}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* 02 — GALLERY */}
      <section className={styles.gallerySection}>
        <div className={styles.wrap}>
          <div className={styles.galleryHead}>
            <div className={styles.galleryTag}>Gallery · 전시장 둘러보기</div>
            <h2 className={styles.galleryTitle}>
              총 <em style={{ color: 'var(--accent)', fontStyle: 'normal', fontFamily: "var(--font-serif), serif", fontWeight: 400 }}>
                {gallery.length}
              </em> 컷의 현장 기록
            </h2>
          </div>

          {gallery.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 0' }}>
              곧 전시장 사진이 공개됩니다.
            </p>
          ) : (
            <div className={styles.grid}>
              {gallery.map((g, i) => (
                <button
                  key={g.src + i}
                  type="button"
                  className={styles.tile}
                  onClick={() => setActiveIdx(i)}
                  aria-label={g.caption ?? g.alt ?? `Showroom ${i + 1}`}
                >
                  <Image
                    src={g.src}
                    alt={g.alt ?? `대라천 침향 전시장 — Scene ${i + 1}`}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 980px) 50vw, (max-width: 1380px) 33vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={styles.tileIdx}>SCENE {String(i + 1).padStart(2, '0')}</div>
                  {g.caption && <div className={styles.tileCaption}>{g.caption}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {active && activeIdx !== null && (
        <div className={styles.lightbox} onClick={close} role="dialog" aria-modal="true">
          <div className={styles.lightboxStage} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.lightboxClose} onClick={close} aria-label="닫기">
              ✕
            </button>
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={prev}
              aria-label="이전"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={next}
              aria-label="다음"
            >
              ›
            </button>
            <div className={styles.lightboxImg}>
              <Image
                src={active.src}
                alt={active.alt ?? `대라천 침향 전시장 — Scene ${activeIdx + 1}`}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className={styles.lightboxIdx}>
              SCENE {String(activeIdx + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
            </div>
            {active.caption && <p className={styles.lightboxCaption}>{active.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
