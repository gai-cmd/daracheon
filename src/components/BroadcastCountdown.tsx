'use client';

import { useEffect, useState } from 'react';

interface Props {
  scheduledAt: string;
  channel: string;
  status: string;
}

function computeCountdown(target: Date): string | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `D-${String(days).padStart(2, '0')} · ${pad(hours)}:${pad(minutes)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function BroadcastCountdown({ scheduledAt, channel, status }: Props) {
  const isLive = status === 'live';
  const targetDate = new Date(scheduledAt);

  const [countdown, setCountdown] = useState<string | null>(() =>
    isLive ? null : computeCountdown(targetDate)
  );
  const [pulseDot, setPulseDot] = useState(true);

  useEffect(() => {
    if (isLive) return;

    const interval = setInterval(() => {
      const next = computeCountdown(targetDate);
      setCountdown(next);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledAt, isLive]);

  // Blink effect for live dot
  useEffect(() => {
    if (!isLive) return;
    const blink = setInterval(() => setPulseDot((v) => !v), 600);
    return () => clearInterval(blink);
  }, [isLive]);

  if (isLive) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[0.65rem] tracking-wider font-semibold rounded-sm"
        aria-label="현재 방송 중"
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-white"
          style={{ opacity: pulseDot ? 1 : 0.2, transition: 'opacity 0.3s' }}
        />
        LIVE
      </span>
    );
  }

  if (!countdown) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gold-500/50 text-gold-400 text-[0.7rem] tracking-wider font-mono"
      aria-label={`${channel} 방송까지 ${countdown}`}
    >
      <svg
        className="w-3 h-3 shrink-0 opacity-70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {countdown}
    </span>
  );
}
