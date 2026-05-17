'use client';

import { useEffect, useState } from 'react';
import { formatBroadcastDateTime } from '@/lib/broadcasts';

interface Props {
  scheduledAt: string;
  channel: string;
  status: string;
  vodUrl?: string;
  showTitle?: string;
  showEpisode?: string;
  showLogo?: string;
}

/** YouTube watch/youtu.be/embed URL → 11자 video id 추출. 실패 시 null. */
function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

/** Vimeo URL → 숫자 id. 실패 시 null. */
function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/** mp4/webm/mov 등 native <video> 재생 가능한 URL 인지 판정.
 *  Vercel Blob 의 video MIME 호스트(uploads/videos/...)도 확장자 기반으로 인식. */
function isDirectVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(u.pathname);
  } catch {
    return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url);
  }
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function BroadcastCountdown({
  scheduledAt,
  channel,
  status,
  vodUrl,
  showTitle,
  showEpisode,
  showLogo,
}: Props) {
  const isLive = status === 'live';
  const isEnded = status === 'ended';
  const targetDate = new Date(scheduledAt);

  const [now, setNow] = useState<number | null>(null);
  const [pulseDot, setPulseDot] = useState(true);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  useEffect(() => {
    if (!isLive) return;
    const blink = setInterval(() => setPulseDot((v) => !v), 600);
    return () => clearInterval(blink);
  }, [isLive]);

  const parts: Parts | null =
    !isLive && now !== null
      ? (() => {
          const diff = targetDate.getTime() - now;
          if (diff <= 0) return null;
          const total = Math.floor(diff / 1000);
          return {
            days: Math.floor(total / 86400),
            hours: Math.floor((total % 86400) / 3600),
            minutes: Math.floor((total % 3600) / 60),
            seconds: total % 60,
          };
        })()
      : null;

  const dateTimeLabel = formatBroadcastDateTime(scheduledAt);

  /* ─── 통합 — 모든 상태가 동일한 4단 구조: 캡션 → 미디어 → 카운트다운 → 메타 ─── */
  const ytId = vodUrl ? extractYouTubeId(vodUrl) : null;
  const vmId = !ytId && vodUrl ? extractVimeoId(vodUrl) : null;
  const embedSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`
    : vmId
      ? `https://player.vimeo.com/video/${vmId}?title=0&byline=0`
      : null;
  // 직접 업로드된 mp4/webm 등은 <video> 로 재생. 외부 카드 fallback 보다 우선.
  const directVideo = !embedSrc && vodUrl && isDirectVideoUrl(vodUrl) ? vodUrl : null;
  const externalVod = !embedSrc && !directVideo && vodUrl ? vodUrl : null;

  // 상태별 톤
  const tone: 'live' | 'ended' | 'upcoming' = isLive ? 'live' : isEnded ? 'ended' : 'upcoming';
  const captionText = isLive
    ? 'ON AIR · 지금 방송 중'
    : isEnded
      ? 'REPLAY · 지난 방송 다시보기'
      : '다음 방송까지';

  // 카운트다운 라벨링 — ended 는 "방영 후 경과", live 는 "00:00 SINCE", upcoming 은 정상
  const elapsedMs = now !== null ? now - targetDate.getTime() : 0;
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86400000));
  const elapsedHours = Math.max(0, Math.floor((elapsedMs % 86400000) / 3600000));
  const elapsedMin = Math.max(0, Math.floor((elapsedMs % 3600000) / 60000));
  const elapsedSec = Math.max(0, Math.floor((elapsedMs % 60000) / 1000));

  const showCountdown = !!parts || isLive || isEnded;
  const cdValues = isEnded
    ? { d: elapsedDays, h: elapsedHours, m: elapsedMin, s: elapsedSec }
    : isLive
      ? { d: 0, h: elapsedHours, m: elapsedMin, s: elapsedSec }
      : parts
        ? { d: parts.days, h: parts.hours, m: parts.minutes, s: parts.seconds }
        : { d: 0, h: 0, m: 0, s: 0 };
  const cdDayLabel = isEnded ? 'Days Ago' : isLive ? 'Live' : 'Days';

  return (
    <div className={`cd-shell cd-shell--${tone}`} aria-label={`${channel} ${captionText}`}>
      {/* 1. 캡션 */}
      <div className="cd-caption">
        {isLive ? (
          <span className="cd-live-dot" style={{ opacity: pulseDot ? 1 : 0.2 }} />
        ) : isEnded ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="cd-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="cd-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {captionText}
      </div>

      {/* 2. 미디어 프레임 (16:9) — 실제 비디오 / 외부 링크 카드 / 상태 포스터 */}
      <div className="cd-video">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={`${channel} ${isEnded ? '다시보기' : '라이브'}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
            }}
          />
        ) : directVideo ? (
          <video
            src={directVideo}
            controls
            preload="metadata"
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000',
              display: 'block',
            }}
          />
        ) : externalVod ? (
          <a className="cd-poster cd-poster--link" href={externalVod} target="_blank" rel="noopener noreferrer">
            <div className="cd-poster-bg" aria-hidden />
            <div className="cd-poster-content">
              <div className="cd-poster-play">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5l5 3.5-5 3.5v-7z" />
                </svg>
              </div>
              <div className="cd-poster-channel">{channel}</div>
              <div className="cd-poster-cta">외부 링크에서 시청 →</div>
            </div>
          </a>
        ) : (
          <div className="cd-poster">
            <div className="cd-poster-bg" aria-hidden />
            <div className="cd-poster-content">
              {showLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={showLogo} alt={showTitle ?? channel} className="cd-poster-logo" />
              ) : showTitle ? (
                <div className="cd-poster-show-title">{showTitle}</div>
              ) : (
                <div className="cd-poster-icon">
                  {isEnded ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                      <rect x="3" y="6" width="18" height="12" rx="1.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 10l5 2-5 2v-4z" />
                    </svg>
                  ) : isLive ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                      <rect x="3" y="5" width="18" height="16" rx="1.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M8 3v4M16 3v4" />
                    </svg>
                  )}
                </div>
              )}
              {showEpisode && <div className="cd-poster-episode">— {showEpisode} —</div>}
              <div className="cd-poster-channel">{channel}</div>
              <div className="cd-poster-status">
                {isEnded ? '다시보기가 곧 업로드됩니다' : isLive ? '라이브 스트림 연결 대기 중' : '방송 예정'}
              </div>
              <div className="cd-poster-time">{dateTimeLabel}</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 카운트다운 박스 — 모든 상태에서 동일한 골격 */}
      {showCountdown && (
        <div className="cd-grid">
          <div className="cd-box">
            <div className="cd-num">{pad(cdValues.d)}</div>
            <div className="cd-label">{cdDayLabel}</div>
          </div>
          <div className="cd-sep">:</div>
          <div className="cd-box">
            <div className="cd-num">{pad(cdValues.h)}</div>
            <div className="cd-label">Hours</div>
          </div>
          <div className="cd-sep">:</div>
          <div className="cd-box">
            <div className="cd-num">{pad(cdValues.m)}</div>
            <div className="cd-label">Min</div>
          </div>
          <div className="cd-sep cd-sep--dim">:</div>
          <div className="cd-box cd-box--sm">
            <div className="cd-num cd-num--sm">{pad(cdValues.s)}</div>
            <div className="cd-label">Sec</div>
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .cd-shell {
    position: relative;
    padding: 28px 26px 24px;
    border: 1px solid rgba(212, 168, 67, 0.28);
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%, rgba(212, 168, 67, 0.10), transparent 60%),
      linear-gradient(180deg, rgba(10, 11, 16, 0.85), rgba(10, 11, 16, 0.6));
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow: hidden;
  }
  .cd-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent 0, rgba(212, 168, 67, 0.4) 50%, transparent 100%) top / 100% 1px no-repeat,
      linear-gradient(90deg, transparent 0, rgba(212, 168, 67, 0.4) 50%, transparent 100%) bottom / 100% 1px no-repeat;
  }
  .cd-shell--upcoming { /* 기본 골드 톤 (cd-shell 기본값 사용) */ }
  .cd-shell--live {
    border-color: rgba(255, 60, 60, 0.45);
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255, 60, 60, 0.12), transparent 60%),
      linear-gradient(180deg, rgba(20, 8, 8, 0.9), rgba(10, 11, 16, 0.65));
  }
  .cd-shell--live::before {
    background:
      linear-gradient(90deg, transparent 0, rgba(255, 60, 60, 0.5) 50%, transparent 100%) top / 100% 1px no-repeat,
      linear-gradient(90deg, transparent 0, rgba(255, 60, 60, 0.5) 50%, transparent 100%) bottom / 100% 1px no-repeat;
  }
  .cd-shell--live .cd-caption { color: #ff5252; }

  .cd-caption {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.66rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 18px;
  }
  .cd-icon { opacity: 0.85; }
  .cd-live-dot {
    width: 8px;
    height: 8px;
    background: #ff3838;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(255, 60, 60, 0.8);
    transition: opacity 0.3s;
  }

  .cd-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr auto 0.85fr;
    gap: 6px;
    align-items: stretch;
    margin-bottom: 22px;
  }
  .cd-box {
    text-align: center;
    padding: 14px 6px 10px;
    border: 1px solid rgba(212, 168, 67, 0.18);
    background: rgba(10, 11, 16, 0.55);
    border-radius: 2px;
  }
  .cd-shell--live .cd-box { border-color: rgba(255, 60, 60, 0.22); }
  .cd-num {
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(1.6rem, 3.2vw, 2.4rem);
    font-weight: 400;
    color: var(--accent);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .cd-num--sm {
    font-size: clamp(1.2rem, 2.4vw, 1.7rem);
    color: rgba(212, 168, 67, 0.7);
  }
  .cd-label {
    margin-top: 8px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.56rem;
    letter-spacing: 0.24em;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
  }
  .cd-sep {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif KR', serif;
    font-size: 1.6rem;
    font-weight: 300;
    color: rgba(212, 168, 67, 0.45);
    padding-bottom: 18px;
  }
  .cd-sep--dim { color: rgba(212, 168, 67, 0.22); }

  .cd-shell--ended .cd-caption { color: rgba(212, 168, 67, 0.85); }

  .cd-video {
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px solid rgba(212, 168, 67, 0.22);
    background: #000;
    margin-bottom: 22px;
    box-sizing: border-box;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4) inset, 0 12px 30px rgba(0, 0, 0, 0.45);
  }
  .cd-shell--live .cd-video { border-color: rgba(255, 60, 60, 0.32); }

  /* 미디어 프레임 안 — 비디오 없을 때 대체 포스터 */
  .cd-poster {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
    padding: 24px 22px;
    color: rgba(255, 255, 255, 0.78);
    text-decoration: none;
    overflow: hidden;
  }
  .cd-poster-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 50% 0%, rgba(212, 168, 67, 0.18), transparent 60%),
      radial-gradient(ellipse 40% 50% at 50% 100%, rgba(212, 168, 67, 0.08), transparent 60%),
      repeating-linear-gradient(
        135deg,
        rgba(212, 168, 67, 0.04) 0px,
        rgba(212, 168, 67, 0.04) 1px,
        transparent 1px,
        transparent 8px
      ),
      linear-gradient(180deg, #0d0e15, #06070b);
    pointer-events: none;
  }
  .cd-poster-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .cd-poster-icon,
  .cd-poster-play {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 1px solid rgba(212, 168, 67, 0.4);
    color: var(--accent);
    display: grid;
    place-items: center;
    margin-bottom: 4px;
    background: radial-gradient(circle at 35% 35%, rgba(212, 168, 67, 0.18), transparent 70%);
  }
  .cd-poster-icon svg,
  .cd-poster-play svg { width: 24px; height: 24px; }
  .cd-poster-play {
    width: 60px;
    height: 60px;
    border-color: rgba(212, 168, 67, 0.6);
  }
  .cd-poster-play svg { width: 28px; height: 28px; }
  .cd-poster-channel {
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(1.05rem, 2vw, 1.4rem);
    font-weight: 400;
    color: #fff;
    letter-spacing: -0.005em;
  }
  .cd-poster-status {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: rgba(212, 168, 67, 0.75);
  }
  .cd-poster-time {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    margin-top: 2px;
  }
  .cd-poster-logo {
    max-width: 60%;
    max-height: 42%;
    width: auto;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
    margin-bottom: 6px;
  }
  .cd-poster-show-title {
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(1.6rem, 3.6vw, 2.6rem);
    font-weight: 500;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1;
    background: linear-gradient(135deg, #b6cdf2 0%, #4f84d9 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cd-poster-episode {
    font-family: 'Noto Serif KR', serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.02em;
    margin-top: -2px;
  }
  .cd-poster-cta {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.66rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--accent);
    transition: gap 300ms;
  }
  .cd-poster--link { transition: background 300ms; }
  .cd-poster--link:hover .cd-poster-bg {
    background:
      radial-gradient(ellipse 60% 80% at 50% 0%, rgba(212, 168, 67, 0.28), transparent 60%),
      linear-gradient(180deg, #11121b, #08090d);
  }
  .cd-shell--live .cd-poster-icon { color: #ff5252; border-color: rgba(255, 60, 60, 0.4); }
`;
