'use client';

import { useEffect } from 'react';

export interface VideoModalItem {
  id: string;
  title: string;
  source?: string;
  excerpt?: string;
  /** 재생할 영상 URL — mp4/webm/mov 또는 youtube/drive/vimeo. 외부 임베드는 iframe 으로. */
  url: string;
  /** 다른 컨텍스트에서 함께 보여줄 외부 원본 링크 (옵셔널). */
  externalUrl?: string;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractDriveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

interface EmbedSpec {
  src: string;
  provider: 'youtube' | 'drive' | 'native';
}

function buildEmbed(url: string): EmbedSpec | null {
  if (!url) return null;
  const ytId = extractYouTubeId(url);
  if (ytId) return { src: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`, provider: 'youtube' };
  const driveId = extractDriveId(url);
  if (driveId) return { src: `https://drive.google.com/file/d/${driveId}/preview`, provider: 'drive' };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith('/')) return { src: url, provider: 'native' };
  return null;
}

/** 영상 갤러리·홈쇼핑 공용 모달. 키보드 ESC + 배경 클릭으로 닫힘.
 *  body overflow 잠궈 모달 뒤 스크롤 차단. */
export default function VideoModal({
  item,
  onClose,
}: {
  item: VideoModalItem;
  onClose: () => void;
}) {
  const embed = buildEmbed(item.url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'grid', placeItems: 'center',
        padding: 'clamp(12px, 4vw, 40px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1280, maxHeight: '90dvh',
          background: '#000',
          border: '1px solid rgba(212,168,67,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', background: 'rgba(10,11,16,0.95)',
            borderBottom: '1px solid rgba(212,168,67,0.2)', gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {item.source && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.7rem', letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
                }}
              >
                {item.source}
              </div>
            )}
            <h3
              style={{
                fontSize: '1.05rem', fontWeight: 500, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
              }}
            >
              {item.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                원본 →
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                width: 36, height: 36, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
                fontSize: '1.1rem', cursor: 'pointer', borderRadius: 4,
              }}
            >✕</button>
          </div>
        </div>
        <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%', background: '#000', overflow: 'hidden' }}>
          {embed?.provider === 'native' ? (
            <video
              src={embed.src}
              controls
              autoPlay
              playsInline
              preload="metadata"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : embed ? (
            <iframe
              src={embed.src}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              title={item.title}
            />
          ) : (
            <div
              style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', padding: 40, textAlign: 'center',
              }}
            >
              임베드할 수 있는 영상이 아닙니다.
            </div>
          )}
        </div>
        {item.excerpt && (
          <div
            style={{
              padding: '16px 20px', background: 'rgba(10,11,16,0.95)',
              borderTop: '1px solid rgba(212,168,67,0.15)',
              color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem',
              lineHeight: 1.85, fontWeight: 300,
            }}
          >
            {item.excerpt}
          </div>
        )}
      </div>
    </div>
  );
}
