'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './page.module.css';

/** 사용자가 OS 에서 '동작 줄이기'를 켰는지 */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 페이지 루트 — [data-reveal] 요소가 화면에 들어오면 data-in 을 붙여 나타나게 한다.
 * 서버 렌더 시점에는 data-motion 이 없어서 모든 요소가 그대로 보인다(JS 실패 시에도 안전).
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.setAttribute('data-in', ''));
      return;
    }
    root.setAttribute('data-motion', 'on');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.page}>
      {children}
    </div>
  );
}

/**
 * 화면에 보일 때만 재생하고 벗어나면 멈추는 배경 영상.
 * 동작 줄이기 설정이면 재생하지 않고 포스터만 보여 준다.
 *
 * ⚠ 운영 전환 시: 지금 쓰는 Blob 원본은 16~41MB 라 무겁다.
 *   배경용으로는 5MB 이하로 압축한 짧은 루프(무음·720p 이하)를 따로 만들어 교체해야 한다.
 */
export function InViewVideo({
  src,
  poster,
  className,
  eager = false,
}: {
  src: string;
  poster: string;
  className?: string;
  /** 첫 화면(히어로) 영상만 true — 가장 작은 파일에만 쓴다 */
  eager?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* 자동재생이 막히면 포스터가 남는다 — 무시 */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload={eager ? 'auto' : 'none'}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

/**
 * 스크롤에 따라 단어가 회색에서 흰색으로 차례로 켜지는 선언문.
 * 섹션이 화면 높이보다 길고 안쪽 글은 sticky 로 고정 — 스크롤 진행률을 컨테이너의
 * --lit 한 값으로만 넘기고, 단어별 밝기는 CSS 가 계산한다(단어마다 style 을 건드리지 않음).
 * 문장 안의 *단어* 는 강조색으로 켜진다.
 */
export function Manifesto({ text, label }: { text: string; label: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;

  useEffect(() => {
    const section = sectionRef.current;
    const body = bodyRef.current;
    if (!section || !body) return;
    if (prefersReducedMotion()) {
      body.style.setProperty('--lit', String(n + 1));
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = Math.max(rect.height - vh, 1);
      // 섹션 윗변이 화면 60% 지점에 올 때부터 켜지기 시작해, 고정 구간 85% 지점에서 모두 켜진다.
      const p = (vh * 0.6 - rect.top) / (travel * 0.85 + vh * 0.6);
      const clamped = Math.min(Math.max(p, 0), 1);
      body.style.setProperty('--lit', (clamped * (n + 1)).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [n]);

  return (
    <section ref={sectionRef} className={styles.manifesto} aria-label={label}>
      <div className={styles.manifestoSticky}>
        <div className={styles.wrap}>
          <span className={styles.pillLabel}>{label}</span>
          <p ref={bodyRef} className={styles.manifestoText}>
            {words.map((w, i) => {
              const accent = w.startsWith('*') && w.endsWith('*') && w.length > 2;
              const word = accent ? w.slice(1, -1) : w;
              return (
                <span
                  key={i}
                  className={accent ? `${styles.mWord} ${styles.mAccent}` : styles.mWord}
                  style={{ ['--i' as string]: i }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
