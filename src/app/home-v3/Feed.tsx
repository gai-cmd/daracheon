'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FeedFilter, FeedItem, VideoItem, YoutubeItem } from './types';
import YoutubeModal from './YoutubeModal';
import { BagIcon, DocIcon, InstagramIcon, NewsIcon, PlayIcon } from './icons';
import styles from './page.module.css';

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'youtube', label: '유튜브' },
  { id: 'insta', label: '인스타그램' },
  { id: 'video', label: '농장 영상' },
  { id: 'product', label: '제품' },
  { id: 'blog', label: '블로그' },
  { id: 'press', label: '언론 보도' },
];

/** 필터별 '더 보기' 목적지 — 전체 보기에서는 띄우지 않는다. */
const MORE: Partial<Record<FeedFilter, { href: string; label: string; external?: boolean }>> = {
  insta: { href: 'https://www.instagram.com/zoellife_official/', label: '인스타그램에서 더 보기', external: true },
  video: { href: '/media', label: '농장 이야기 전체 보기' },
  product: { href: '/products', label: '전체 제품 보기' },
  blog: { href: '/blog', label: '블로그 전체 보기' },
  press: { href: '/about-agarwood#tab-5', label: '언론 보도 전체 보기' },
};

const GAP = 16;
const MIN_COL = 250;

/** 컨테이너 폭 → 열 수. 휴대폰은 2열, 아주 좁으면 1열. */
function colsFor(width: number): number {
  if (width < 340) return 1;
  return Math.max(2, Math.min(5, Math.floor((width + GAP) / (MIN_COL + GAP))));
}

/** 카드 높이 추정치(px) — 가장 짧은 열에 차례로 넣어 메이슨리 균형을 맞춘다. */
function estimateHeight(it: FeedItem, colW: number): number {
  const caption = 64;
  switch (it.kind) {
    case 'youtube':
      return colW * (9 / 16) + caption;
    case 'video':
      return colW * (it.ratio === 'tall' ? 5 / 4 : 9 / 16) + caption;
    case 'insta':
      return colW * (4 / 3) + caption;
    case 'product':
      return colW * (5 / 4) + caption;
    case 'blog':
      return it.image ? colW * (10 / 16) + caption + 40 : 260;
    case 'press':
      return 210;
    case 'promo':
      return 240;
  }
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function Feed({ items, youtubeUrl }: { items: FeedItem[]; youtubeUrl: string }) {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [cols, setCols] = useState(4);
  const [colW, setColW] = useState(260);
  const [playing, setPlaying] = useState<YoutubeItem | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // 컨테이너 폭을 재서 열 수를 정한다.
  useIsoLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const c = colsFor(w);
      setCols(c);
      setColW((w - GAP * (c - 1)) / c);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.kind === filter)),
    [items, filter],
  );

  // 가장 짧은 열에 차례로 배치 — 읽는 순서가 대략 '왼쪽 위 → 오른쪽 아래'로 유지된다.
  const columns = useMemo(() => {
    const out: Array<Array<{ item: FeedItem; order: number }>> = Array.from({ length: cols }, () => []);
    const heights = new Array<number>(cols).fill(0);
    visible.forEach((item, order) => {
      let min = 0;
      for (let c = 1; c < cols; c++) if (heights[c] < heights[min] - 1) min = c;
      out[min].push({ item, order });
      heights[min] += estimateHeight(item, colW) + GAP;
    });
    return out;
  }, [visible, cols, colW]);

  const openVideo = useCallback((v: YoutubeItem) => setPlaying(v), []);
  const closeVideo = useCallback(() => setPlaying(null), []);
  // 유튜브 '더 보기'는 데이터의 채널 주소를 따른다.
  const more =
    filter === 'youtube' ? { href: youtubeUrl, label: '유튜브 채널에서 더 보기', external: true } : MORE[filter];

  return (
    <section id="feed" className={styles.feed} aria-label="대라천 새 소식">
      <div className={styles.chipBar}>
        <div className={styles.chipRow} role="toolbar" aria-label="소식 종류 고르기">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={f.id === filter ? `${styles.chip} ${styles.chipOn}` : styles.chip}
              aria-pressed={f.id === filter}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 필터가 바뀌면 key 로 다시 그려 카드가 순서대로 다시 들어오게 한다. */}
      <div ref={gridRef} className={styles.gridWrap}>
        <div key={filter} className={styles.grid}>
          {columns.map((col, ci) => (
            <div key={ci} className={styles.col}>
              {col.map(({ item, order }) => (
                <Reveal key={item.key} delay={Math.min(order, 10) * 45}>
                  <Card item={item} onOpenVideo={openVideo} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>

      {more && (
        <div className={styles.moreRow}>
          {more.external ? (
            <a href={more.href} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>
              {more.label} ↗
            </a>
          ) : (
            <Link href={more.href} className={styles.btnGhost}>
              {more.label} →
            </Link>
          )}
        </div>
      )}

      {playing && <YoutubeModal videoId={playing.videoId} title={playing.title} onClose={closeVideo} />}
    </section>
  );
}

/** 화면에 들어오면 한 번 떠오르며 나타난다. */
function Reveal({ children, delay }: { children: ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={shown ? `${styles.reveal} ${styles.revealIn}` : styles.reveal}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

function Card({ item, onOpenVideo }: { item: FeedItem; onOpenVideo: (v: YoutubeItem) => void }) {
  switch (item.kind) {
    case 'youtube':
      return (
        <button type="button" className={styles.card} onClick={() => onOpenVideo(item)} aria-label={`유튜브 영상 재생: ${item.title}`}>
          <span className={`${styles.media} ${styles.ratioWide}`}>
            <Image src={item.thumb} alt="" fill sizes="(max-width: 700px) 50vw, 20vw" className={styles.mediaImg} />
            <span className={styles.playBadge} aria-hidden="true">
              <PlayIcon />
            </span>
          </span>
          <Meta title={item.title} sub={`유튜브 · ${item.date}`} icon={<PlayIcon />} />
        </button>
      );
    case 'video':
      return <VideoCard item={item} />;
    case 'insta':
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.card}>
          {/* 릴스 표지는 9:16 이고 글자가 위·가운데에 있어 3:4 로 자르되 기준점을 위쪽(35%)에 둔다 */}
          <span className={`${styles.media} ${styles.ratioReel}`}>
            <Image src={item.image} alt="" fill sizes="(max-width: 700px) 50vw, 20vw" className={`${styles.mediaImg} ${styles.reelImg}`} />
            {item.mediaType === 'VIDEO' && (
              <span className={`${styles.cornerTag} ${styles.reelTag}`} aria-hidden="true">
                <PlayIcon />
                릴스
              </span>
            )}
          </span>
          <Meta
            title={item.caption}
            sub={item.mediaType === 'VIDEO' ? '인스타그램 · 릴스' : `인스타그램 · ${item.handle}`}
            icon={<InstagramIcon />}
          />
        </a>
      );
    case 'product':
      return (
        <Link href={item.href} className={styles.card}>
          <span className={`${styles.media} ${styles.ratioProduct}`}>
            <Image src={item.image} alt={item.name} fill sizes="(max-width: 700px) 50vw, 20vw" className={styles.mediaImg} />
          </span>
          <Meta title={item.name} sub={`제품 · ${item.category}`} icon={<BagIcon />} />
        </Link>
      );
    case 'blog':
      return item.image ? (
        <Link href={item.href} className={styles.card}>
          <span className={`${styles.media} ${styles.ratioBlog}`}>
            <Image src={item.image} alt="" fill sizes="(max-width: 700px) 50vw, 20vw" className={styles.mediaImg} />
          </span>
          <Meta title={item.title} sub={`블로그 · ${item.category}`} icon={<DocIcon />} />
        </Link>
      ) : (
        <Link href={item.href} className={styles.card}>
          <span className={`${styles.textCard} ${styles.textCardBlog}`}>
            <span className={styles.textKicker}>블로그 · {item.category}</span>
            <span className={styles.textTitle}>{item.title}</span>
            {item.excerpt && <span className={styles.textBody}>{item.excerpt}</span>}
            <span className={styles.textFoot}>
              <span>{item.date}</span>
              <span className={styles.metaIcon} aria-hidden="true"><DocIcon /></span>
            </span>
          </span>
        </Link>
      );
    case 'press':
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.card}>
          <span className={styles.textCard}>
            <span className={styles.textKicker}>언론 보도 · {item.outlet}</span>
            <span className={styles.textTitle}>{item.title}</span>
            <span className={styles.textFoot}>
              <span>{item.date}</span>
              <span className={styles.metaIcon} aria-hidden="true"><NewsIcon /></span>
            </span>
          </span>
        </a>
      );
    case 'promo':
      return (
        <Link href={item.href} className={styles.card}>
          <span className={styles.promo}>
            <span className={styles.promoKicker}>{item.kicker}</span>
            <span className={styles.promoLine}>{item.line}</span>
            <span className={styles.promoBody}>{item.body}</span>
            <span className={styles.promoBtn}>{item.cta} →</span>
          </span>
        </Link>
      );
  }
}

function Meta({ title, sub, icon }: { title: string; sub: string; icon: ReactNode }) {
  return (
    <span className={styles.meta}>
      <span className={styles.metaText}>
        <span className={styles.metaTitle}>{title}</span>
        <span className={styles.metaSub}>{sub}</span>
      </span>
      <span className={styles.metaIcon} aria-hidden="true">{icon}</span>
    </span>
  );
}

/**
 * 농장 영상 카드 — 데스크톱은 마우스를 올리면, 터치 기기는 60% 이상 보이면 재생.
 * 움직임 줄이기 설정이면 화면 진입 자동재생은 하지 않는다.
 */
function VideoCard({ item }: { item: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [hoverMode, setHoverMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setIsPlaying(true)).catch(() => undefined);
  }, []);
  const pause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setHoverMode(canHover);
    if (canHover || reduced) return;
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.6) play();
          else pause();
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, pause]);

  return (
    <Link
      ref={cardRef}
      href={item.href}
      className={styles.card}
      onMouseEnter={hoverMode ? play : undefined}
      onMouseLeave={hoverMode ? pause : undefined}
      onFocus={hoverMode ? play : undefined}
      onBlur={hoverMode ? pause : undefined}
    >
      <span className={`${styles.media} ${item.ratio === 'tall' ? styles.ratioTall : styles.ratioWide}`}>
        <video
          ref={videoRef}
          className={styles.mediaVideo}
          src={item.src}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
        <span className={isPlaying ? `${styles.liveTag} ${styles.liveTagOn}` : styles.liveTag} aria-hidden="true">
          <span className={styles.liveDot} />
          {isPlaying ? '재생 중' : '영상'}
        </span>
      </span>
      <Meta title={item.title} sub={item.sub} icon={<PlayIcon />} />
    </Link>
  );
}
