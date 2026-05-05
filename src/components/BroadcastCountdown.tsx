'use client';

import { useEffect, useState } from 'react';

interface Props {
  scheduledAt: string;
  channel: string;
  status: string;
  vodUrl?: string;
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

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeParts(target: Date): Parts | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function BroadcastCountdown({ scheduledAt, channel, status, vodUrl }: Props) {
  const isLive = status === 'live';
  const isEnded = status === 'ended';
  const targetDate = new Date(scheduledAt);

  const [parts, setParts] = useState<Parts | null>(() =>
    isLive ? null : computeParts(targetDate)
  );
  const [pulseDot, setPulseDot] = useState(true);

  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(() => setParts(computeParts(targetDate)), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledAt, isLive]);

  useEffect(() => {
    if (!isLive) return;
    const blink = setInterval(() => setPulseDot((v) => !v), 600);
    return () => clearInterval(blink);
  }, [isLive]);

  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(targetDate);
  const timeLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  }).format(targetDate);

  /* ─── ENDED state — VOD 플레이어 또는 외부 링크 카드 ─── */
  if (isEnded) {
    const ytId = vodUrl ? extractYouTubeId(vodUrl) : null;
    const vmId = !ytId && vodUrl ? extractVimeoId(vodUrl) : null;
    const embedSrc = ytId
      ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`
      : vmId
        ? `https://player.vimeo.com/video/${vmId}?title=0&byline=0`
        : null;

    return (
      <div className="cd-shell cd-shell--ended" aria-label={`${channel} 다시보기`}>
        <div className="cd-caption cd-caption--ended">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="cd-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
          </svg>
          REPLAY · 지난 방송 다시보기
        </div>

        {embedSrc ? (
          <div className="cd-video">
            <iframe
              src={embedSrc}
              title={`${channel} 다시보기`}
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
          </div>
        ) : vodUrl ? (
          <a className="cd-vod-link" href={vodUrl} target="_blank" rel="noopener noreferrer">
            <div className="cd-vod-thumb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5l5 3.5-5 3.5v-7z" />
              </svg>
            </div>
            <div className="cd-vod-cta">
              <span className="cd-vod-cta-label">외부 링크에서 시청</span>
              <span className="cd-vod-cta-arrow">→</span>
            </div>
          </a>
        ) : (
          <div className="cd-vod-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <rect x="3" y="6" width="18" height="12" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 10l5 2-5 2v-4z" />
            </svg>
            <p>다시보기가 곧 업로드됩니다</p>
            <span>VOD 준비 중 · 잠시만 기다려 주세요</span>
          </div>
        )}

        <div className="cd-meta">
          <span className="cd-meta-channel">{channel}</span>
          <span className="cd-meta-sep" />
          <span>{dateLabel} · {timeLabel} 방영</span>
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  /* ─── LIVE state ─── */
  if (isLive) {
    return (
      <div className="cd-shell cd-shell--live" aria-label="현재 방송 중">
        <div className="cd-caption">
          <span className="cd-live-dot" style={{ opacity: pulseDot ? 1 : 0.2 }} />
          ON AIR
        </div>
        <div className="cd-live-title">{channel}</div>
        <div className="cd-meta">{dateLabel} · {timeLabel}</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!parts) return null;

  /* ─── Countdown state ─── */
  return (
    <div className="cd-shell" aria-label={`${channel} 방송까지 D-${parts.days} ${parts.hours}시간 ${parts.minutes}분`}>
      <div className="cd-caption">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="cd-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        다음 방송까지
      </div>

      <div className="cd-grid">
        <div className="cd-box">
          <div className="cd-num">{pad(parts.days)}</div>
          <div className="cd-label">Days</div>
        </div>
        <div className="cd-sep">:</div>
        <div className="cd-box">
          <div className="cd-num">{pad(parts.hours)}</div>
          <div className="cd-label">Hours</div>
        </div>
        <div className="cd-sep">:</div>
        <div className="cd-box">
          <div className="cd-num">{pad(parts.minutes)}</div>
          <div className="cd-label">Min</div>
        </div>
        <div className="cd-sep cd-sep--dim">:</div>
        <div className="cd-box cd-box--sm">
          <div className="cd-num cd-num--sm">{pad(parts.seconds)}</div>
          <div className="cd-label">Sec</div>
        </div>
      </div>

      <div className="cd-meta">
        <span className="cd-meta-channel">{channel}</span>
        <span className="cd-meta-sep" />
        <span>{dateLabel} · {timeLabel}</span>
      </div>

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

  .cd-caption {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.66rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 22px;
  }
  .cd-shell--live .cd-caption { color: #ff5252; }
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

  .cd-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    padding-top: 14px;
    border-top: 1px dashed rgba(212, 168, 67, 0.18);
  }
  .cd-meta-channel { color: var(--accent-soft); font-weight: 500; }
  .cd-meta-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(212, 168, 67, 0.5);
  }

  .cd-live-title {
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 400;
    color: #fff;
    margin-bottom: 14px;
    line-height: 1.2;
  }

  /* ─── ENDED · VOD ─── */
  .cd-shell--ended {
    border-color: rgba(180, 200, 220, 0.18);
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%, rgba(180, 200, 220, 0.06), transparent 60%),
      linear-gradient(180deg, rgba(8, 9, 13, 0.92), rgba(10, 11, 16, 0.7));
  }
  .cd-shell--ended::before {
    background:
      linear-gradient(90deg, transparent 0, rgba(180, 200, 220, 0.32) 50%, transparent 100%) top / 100% 1px no-repeat,
      linear-gradient(90deg, transparent 0, rgba(180, 200, 220, 0.32) 50%, transparent 100%) bottom / 100% 1px no-repeat;
  }
  .cd-caption--ended { color: rgba(212, 168, 67, 0.78); }

  .cd-video {
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px solid rgba(212, 168, 67, 0.22);
    background: #000;
    margin-bottom: 18px;
    box-sizing: border-box;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4) inset, 0 12px 30px rgba(0, 0, 0, 0.45);
  }

  .cd-vod-link {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 22px 22px;
    margin-bottom: 18px;
    border: 1px solid rgba(212, 168, 67, 0.22);
    background: rgba(10, 11, 16, 0.55);
    text-decoration: none;
    color: inherit;
    transition: border-color 300ms, background 300ms, transform 300ms;
  }
  .cd-vod-link:hover {
    border-color: var(--accent);
    background: rgba(212, 168, 67, 0.06);
  }
  .cd-vod-link:hover .cd-vod-cta-arrow { transform: translateX(6px); }
  .cd-vod-thumb {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 1px solid rgba(212, 168, 67, 0.45);
    color: var(--accent);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    background: radial-gradient(circle at 35% 35%, rgba(212, 168, 67, 0.18), transparent 70%);
  }
  .cd-vod-thumb svg { width: 30px; height: 30px; }
  .cd-vod-cta { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .cd-vod-cta-label {
    font-family: 'Noto Serif KR', serif;
    font-size: 1.15rem;
    color: #fff;
    font-weight: 400;
    letter-spacing: -0.005em;
  }
  .cd-vod-cta-arrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.66rem;
    letter-spacing: 0.28em;
    color: var(--accent);
    text-transform: uppercase;
    transition: transform 300ms;
  }

  .cd-vod-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 38px 22px;
    margin-bottom: 18px;
    border: 1px dashed rgba(212, 168, 67, 0.22);
    color: rgba(255, 255, 255, 0.65);
  }
  .cd-vod-empty svg {
    width: 38px;
    height: 38px;
    color: rgba(212, 168, 67, 0.55);
    margin-bottom: 4px;
  }
  .cd-vod-empty p {
    font-family: 'Noto Serif KR', serif;
    font-size: 1.05rem;
    color: #fff;
    margin: 0;
  }
  .cd-vod-empty span {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }
`;
