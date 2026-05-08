'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ChapterCarouselProps {
  images: string[];
  alt?: string;
  caption?: string;
  aspect?: string;
}

export default function ChapterCarousel({
  images,
  alt,
  caption,
  aspect = '16/9',
}: ChapterCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      const wrapped = ((next % total) + total) % total;
      setIndex(wrapped);
    },
    [total],
  );

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    },
    [go, index],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('keydown', onKey);
    return () => track.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (total === 0) return null;

  return (
    <figure style={{ margin: '32px 0 0' }}>
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt ?? '이미지 캐러셀'}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
        style={{
          position: 'relative',
          aspectRatio: aspect,
          overflow: 'hidden',
          background: '#1a1d29',
          border: '1px solid rgba(212,168,67,0.18)',
          outline: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            transform: `translateX(-${index * 100}%)`,
            transition: 'transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                position: 'relative',
                flex: '0 0 100%',
                height: '100%',
              }}
              aria-hidden={i !== index}
            >
              <Image
                src={src}
                alt={alt ? `${alt} ${i + 1}/${total}` : `이미지 ${i + 1}/${total}`}
                fill
                sizes="(max-width: 900px) 100vw, 720px"
                style={{ objectFit: 'cover' }}
                unoptimized
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => go(index - 1)}
              style={navBtnStyle('left')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => go(index + 1)}
              style={navBtnStyle('right')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 14,
                padding: '4px 10px',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.78)',
                background: 'rgba(10,11,16,0.55)',
                border: '1px solid rgba(212,168,67,0.25)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          role="tablist"
          aria-label="이미지 선택"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번 이미지`}
              onClick={() => go(i)}
              style={{
                width: i === index ? 24 : 8,
                height: 4,
                padding: 0,
                border: 0,
                cursor: 'pointer',
                background: i === index ? 'var(--accent)' : 'rgba(212,168,67,0.32)',
                transition: 'all 300ms',
              }}
            />
          ))}
        </div>
      )}

      {caption && (
        <figcaption
          style={{
            marginTop: 12,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(212,168,67,0.35)',
    background: 'rgba(10,11,16,0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    color: 'rgba(255,255,255,0.85)',
    cursor: 'pointer',
    transition: 'all 200ms',
  };
}
