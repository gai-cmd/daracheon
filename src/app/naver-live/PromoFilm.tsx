'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { COUPANG_LIVE_URL, NAVER_LIVE_URL } from '@/lib/naver-live';
import { PROMO_CHAPTERS, PROMO_VIDEO, type PromoScene } from '@/lib/naver-live-promo';
import styles from './PromoFilm.module.css';

// WebKit 은 word-break: keep-all 에서 닫는 괄호 앞도 줄바꿈 자리로 본다 ("Roxb." / ")").
// 괄호로 끝나는 단어를 통째로 줄바꿈 금지로 묶는다.
function keepClosingParen(text: string) {
  return text.split(/(\S+\))/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ whiteSpace: 'nowrap' }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function PromoFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<string | null>(null);

  const seek = (scene: PromoScene) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = scene.at;
    setActive(scene.src);
    v.scrollIntoView({ behavior: 'smooth', block: 'center' });
    void v.play().catch(() => {
      /* autoplay 차단 시 위치만 옮겨 둔다 */
    });
  };

  return (
    <section className={styles.film} aria-labelledby="film-title">
      <p className={styles.kicker}>PROMOTION FILM</p>
      <h2 id="film-title" className={styles.title}>
        한 알에 담기까지
      </h2>
      <p className={styles.lede}>
        라이브에서 소개할 대라천 참 침향오일, 농장에서 캡슐이 되기까지를 90초 영상에 담았습니다.
      </p>

      <div className={styles.player}>
        <video
          ref={videoRef}
          className={styles.video}
          src={PROMO_VIDEO.src}
          poster={PROMO_VIDEO.poster}
          controls
          playsInline
          preload="metadata"
        />
      </div>

      <ol className={styles.chapters}>
        {PROMO_CHAPTERS.map((c, i) => (
          <li key={c.title} className={styles.chapter}>
            <div className={styles.chapterHead}>
              <span className={styles.chapterNo}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className={styles.chapterTitle}>{c.title}</h3>
                <p className={styles.chapterDesc}>{keepClosingParen(c.desc)}</p>
              </div>
            </div>
            <div className={styles.scenes} data-count={c.scenes.length}>
              {c.scenes.map((s, j) => (
                <button
                  key={s.src}
                  type="button"
                  className={`${styles.scene} ${active === s.src ? styles.sceneActive : ''}`}
                  onClick={() => seek(s)}
                  aria-label={`${s.caption} 장면부터 영상 재생 (${mmss(s.at)})`}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={s.src}
                      alt={s.caption}
                      fill
                      sizes={`(max-width: 720px) ${c.scenes.length === 3 && j === 0 ? 100 : 50}vw, (max-width: 900px) 33vw, 400px`}
                      className={styles.img}
                    />
                    <span className={styles.time}>▶ {mmss(s.at)}</span>
                  </span>
                  <span className={styles.caption}>{s.caption}</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.closing}>
        <p className={styles.closingText}>영상 속 이야기, 라이브에서 직접 묻고 들어 보세요.</p>
        <a className={styles.cta} href={NAVER_LIVE_URL} target="_blank" rel="noopener noreferrer">
          네이버에서 알림받기
        </a>
        <a className={styles.ctaCoupang} href={COUPANG_LIVE_URL} target="_blank" rel="noopener noreferrer">
          쿠팡에서 알림받기
        </a>
      </div>
    </section>
  );
}
