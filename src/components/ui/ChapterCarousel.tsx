'use client';

/**
 * ChapterCarousel — 중앙 정렬 히어로형 캐러셀.
 *
 * UI 특징
 *  · 활성 슬라이드를 가운데 크게, 좌·우 슬라이드는 옆으로 살짝 보이는 "peek" 형태
 *  · 큰 원형 화살표 네비 (PC/모바일 모두 명확히 보임, 키보드/터치/마우스 지원)
 *  · 카운터 배지 + 도트 인디케이터 + 캡션
 *  · 반응형: PC 72% / 태블릿 80% / 모바일 88% 슬라이드 폭
 *
 * 단일 소스: 모든 캐러셀 사용처(/brand-story, /media …)가 이 컴포넌트만 사용하므로
 * 여기를 수정하면 전 사이트에 일괄 반영됨.
 */

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ChapterCarousel.module.css';

interface ChapterCarouselProps {
  images: string[];
  alt?: string;
  caption?: string;
  /** 슬라이드 종횡비 (CSS aspect-ratio 문법). 기본 16/9. */
  aspect?: string;
  /** 자동 재생 ms. 미지정/0 이면 비활성. */
  autoplay?: number;
}

export default function ChapterCarousel({
  images,
  alt,
  caption,
  aspect = '16/9',
  autoplay,
}: ChapterCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [hover, setHover] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      const wrapped = ((next % total) + total) % total;
      setIndex(wrapped);
    },
    [total],
  );

  // Keyboard navigation when viewport focused
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    },
    [go, index],
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Autoplay (paused on hover or touch)
  useEffect(() => {
    if (!autoplay || autoplay <= 0 || total <= 1 || hover) return;
    const t = setInterval(() => go(index + 1), autoplay);
    return () => clearInterval(t);
  }, [autoplay, total, hover, index, go]);

  if (total === 0) return null;

  // Track translateX: center the active slide.
  //   each slide width = `var(--cc-slide-w)` (e.g. 72%)
  //   each step = slide width + gap
  //   active should be centered → offset = (50% - half-slide) - index*step
  const trackTransform = `translateX(calc(50% - (var(--cc-slide-w) / 2) - ${index} * (var(--cc-slide-w) + var(--cc-gap))))`;

  return (
    <figure className={styles.root}>
      <div
        ref={viewportRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt ?? '이미지 캐러셀'}
        className={styles.viewport}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
        style={{ ['--cc-aspect' as string]: aspect }}
      >
        <div
          className={styles.track}
          style={{ transform: trackTransform }}
        >
          {images.map((src, i) => {
            const isActive = i === index;
            return (
              <div
                key={`${src}-${i}`}
                className={styles.slide}
                data-active={isActive}
                aria-hidden={!isActive}
                onClick={() => {
                  if (!isActive) go(i);
                }}
                style={{ cursor: isActive ? 'default' : 'pointer' }}
              >
                <div className={styles.imageBox}>
                  <Image
                    src={src}
                    alt={alt ? `${alt} ${i + 1}/${total}` : `이미지 ${i + 1}/${total}`}
                    fill
                    sizes="(max-width: 640px) 88vw, (max-width: 1023px) 80vw, 72vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    priority={i === 0}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => go(index - 1)}
              className={`${styles.navBtn} ${styles.navLeft}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => go(index + 1)}
              className={`${styles.navBtn} ${styles.navRight}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={styles.counter}>
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div role="tablist" aria-label="이미지 선택" className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번 이미지`}
              data-active={i === index}
              onClick={() => go(i)}
              className={styles.dot}
            />
          ))}
        </div>
      )}

      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
