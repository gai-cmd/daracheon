'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import styles from './page.module.css';

/**
 * 메인 시안 C(벤토형) 클라이언트 조각 모음.
 *
 * - BentoRoot: 스크롤 등장(reveal)·타일 스포트라이트·유튜브 모달을 한곳에서 관리한다.
 * - 움직임은 전부 `prefers-reduced-motion: reduce` 에서 멈춘다 — 자동 재생·카운트업 없이 최종 상태만 보여 준다.
 */

export interface VideoItem {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
}

interface VideoCtx {
  videos: VideoItem[];
  open: (index: number) => void;
}

const VideoContext = createContext<VideoCtx>({ videos: [], open: () => {} });

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ───────────── 루트: reveal + 스포트라이트 + 모달 ───────────── */

export function BentoRoot({
  videos,
  className,
  children,
}: {
  videos: VideoItem[];
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const open = useCallback((i: number) => setPlaying(i), []);
  const close = useCallback(() => setPlaying(null), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (prefersReducedMotion()) {
      tiles.forEach((t) => t.setAttribute('data-in', ''));
      return;
    }

    // 첫 화면 안의 타일은 곧바로, 나머지는 스크롤로 들어올 때 차례로 등장시킨다.
    const vh = window.innerHeight;
    let batch = 0;
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) {
        t.style.setProperty('--d', `${batch++ * 70}ms`);
        t.setAttribute('data-in', '');
      }
    });
    root.setAttribute('data-fx', 'on');

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          el.style.setProperty('--d', `${n++ * 70}ms`);
          el.setAttribute('data-in', '');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    tiles.forEach((t) => {
      if (!t.hasAttribute('data-in')) io.observe(t);
    });

    // 커서를 따라가는 스포트라이트 — 좌표를 CSS 변수로만 넘기고 그리기는 CSS 가 한다.
    let raf = 0;
    let last: PointerEvent | null = null;
    const onMove = (e: PointerEvent) => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!last) return;
        const tile = (last.target as HTMLElement | null)?.closest<HTMLElement>('[data-tile]');
        if (!tile) return;
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--x', `${last.clientX - r.left}px`);
        tile.style.setProperty('--y', `${last.clientY - r.top}px`);
      });
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <VideoContext.Provider value={{ videos, open }}>
      <div ref={rootRef} className={className}>
        {children}
      </div>
      {playing !== null && videos[playing] && <VideoModal video={videos[playing]} onClose={close} />}
    </VideoContext.Provider>
  );
}

/* ───────────── 유튜브 모달 (가로 16:9) ───────────── */

function VideoModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
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
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── 최신 유튜브 영상 타일 ───────────── */

export function LatestVideo() {
  const { videos, open } = useContext(VideoContext);
  const [idx, setIdx] = useState(0);
  const [hold, setHold] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const count = videos.length;

  // 화면 안에 있고 커서가 올라가 있지 않을 때만 7초마다 다음 영상으로 넘긴다.
  useEffect(() => {
    if (count < 2 || prefersReducedMotion()) return;
    const el = boxRef.current;
    if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);
    const t = window.setInterval(() => {
      if (visible && !hold) setIdx((i) => (i + 1) % count);
    }, 7000);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, [count, hold]);

  if (count === 0) return null;
  const v = videos[idx];
  const step = (d: number) => setIdx((i) => (i + d + count) % count);

  return (
    <div
      ref={boxRef}
      className={styles.ytBox}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
    >
      {/* 배경은 같은 썸네일을 흐리게 깔아 타일 전체를 채운다 */}
      <div className={styles.ytBackdrop} aria-hidden="true">
        {videos.map((s, i) => (
          <Image
            key={s.id}
            src={s.thumbnail}
            alt=""
            fill
            sizes="30vw"
            className={styles.ytBackdropImg}
            data-active={i === idx ? '' : undefined}
          />
        ))}
      </div>

      <div className={styles.ytTop}>
        <span className={styles.chip}>
          <YoutubeMark size={14} /> YouTube
        </span>
        <span className={styles.ytCount}>
          {String(idx + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
      </div>

      <button type="button" className={styles.ytFrame} onClick={() => open(idx)} aria-label={`${v.title} 재생`}>
        {videos.map((s, i) => (
          <Image
            key={s.id}
            src={s.thumbnail}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1099px) 45vw, 420px"
            priority={i === 0}
            className={styles.ytFrameImg}
            data-active={i === idx ? '' : undefined}
          />
        ))}
        <span className={styles.playBtn} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="currentColor" d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </button>

      <div className={styles.ytBottom}>
        <div className={styles.ytMeta}>
          <span className={styles.ytTitle} key={v.id}>
            {v.title}
          </span>
          <span className={styles.ytDate}>{v.date}</span>
        </div>
        {count > 1 && (
          <div className={styles.miniCtl}>
            <button type="button" onClick={() => step(-1)} aria-label="이전 영상">
              ‹
            </button>
            <button type="button" onClick={() => step(1)} aria-label="다음 영상">
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── 공식 채널 영상 한 칸 (16:9) ───────────── */

export function VideoThumb({ index }: { index: number }) {
  const { videos, open } = useContext(VideoContext);
  const v = videos[index];
  if (!v) return null;
  return (
    <button type="button" className={styles.chThumb} onClick={() => open(index)} aria-label={`${v.title} 재생`}>
      <span className={styles.chThumbImg}>
        <Image src={v.thumbnail} alt="" fill sizes="(max-width: 640px) 90vw, 360px" style={{ objectFit: 'cover' }} />
        <span className={styles.chPlay} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>
      <span className={styles.chTitle}>{v.title}</span>
      <span className={styles.chDate}>{v.date}</span>
    </button>
  );
}

/* ───────────── 영상 ───────────── */

/**
 * 히어로 타일 전용 자동 재생 영상.
 * SSR 에 autoPlay 를 박지 않고, 움직임 줄이기 설정을 확인한 뒤에만 재생한다.
 * 화면 밖으로 나가면 멈춰 CPU·데이터를 아낀다.
 */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    v.preload = 'auto';
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={styles.media}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}

/**
 * 커서를 올리면(터치 기기는 화면 중앙에 들어오면) 재생하는 영상.
 * 처음엔 preload="none" + poster 만 받아 첫 로딩에 영상 바이트를 쓰지 않는다.
 */
// TODO(운영 전환): 지금 원본은 16~90MB 다 — 운영에서는 5MB 이하의 짧은 압축 루프 영상으로 교체해야 한다.
export function HoverVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    const tile = v.closest<HTMLElement>('[data-tile]');
    if (!tile) return;
    const play = () => {
      v.play()
        .then(() => setOn(true))
        .catch(() => {});
    };
    const stop = () => {
      v.pause();
      setOn(false);
    };
    if (window.matchMedia('(hover: hover)').matches) {
      tile.addEventListener('pointerenter', play);
      tile.addEventListener('pointerleave', stop);
      tile.addEventListener('focusin', play);
      tile.addEventListener('focusout', stop);
      return () => {
        tile.removeEventListener('pointerenter', play);
        tile.removeEventListener('pointerleave', stop);
        tile.removeEventListener('focusin', play);
        tile.removeEventListener('focusout', stop);
        v.pause();
      };
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.7 });
    io.observe(tile);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={`${styles.media} ${styles.hoverVideo}`}
      data-on={on ? '' : undefined}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}

/* ───────────── 숫자 카운트업 ───────────── */

/** 서버 렌더는 최종 숫자 — JS 가 없거나 움직임 줄이기면 그대로 둔다. */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className={styles.countNum}>
      {n}
    </span>
  );
}

/* ───────────── 아이콘 ───────────── */

export function YoutubeMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"
      />
    </svg>
  );
}
