'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/zoel/story-page.module.css';

/* ── 현장 소식(블로그형) — 승인된 현장 제출 1건 = 게시글 1편.
      제목 + 본문(메모) + 사진/영상 믹스 + 날짜·위치·날씨를 한 세트로.
      썸네일 리스트 → 카드 클릭 → 모달 오버레이 뷰. ── */

export interface FieldPost {
  id: string;
  title: string;
  note?: string;
  files: { url: string; type: 'photo' | 'video' }[];
  /** 표시용 날짜 (촬영일 우선, 없으면 게시일) — "YYYY-MM-DD" */
  date: string;
  // 정확 GPS 좌표는 공개 노출하지 않는다(농장 위치 보호) — 서버 매핑에서 제외.
  weather?: { tempC: number; text?: string; humidity?: number };
}

function fmtDate(s: string): string {
  return (s ?? '').replace('T', ' ').slice(0, 16);
}

function MetaChips({ post }: { post: FieldPost }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.74rem' }}>
      {post.date && (
        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
          📅 {fmtDate(post.date)}
        </span>
      )}
      {post.weather && (
        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(120,170,210,0.14)', color: '#9cc3e0' }}>
          {post.weather.text ?? '날씨'} {Math.round(post.weather.tempC)}°C
          {typeof post.weather.humidity === 'number' ? ` · 습도 ${post.weather.humidity}%` : ''}
        </span>
      )}
    </div>
  );
}

function PostModal({ post, onClose }: { post: FieldPost; onClose: () => void }) {
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
      aria-label={post.title}
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
          width: '100%', maxWidth: 900, maxHeight: '90dvh',
          background: '#0e1017',
          border: '1px solid rgba(212,168,67,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '18px 22px', background: 'rgba(10,11,16,0.95)',
            borderBottom: '1px solid rgba(212,168,67,0.2)', gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 500, color: '#fff', margin: '0 0 10px' }}>
              {post.title}
            </h3>
            <MetaChips post={post} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              flexShrink: 0, width: 36, height: 36, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
              fontSize: '1.1rem', cursor: 'pointer', borderRadius: 4,
            }}
          >✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 22px 28px' }}>
          {post.note && (
            <p style={{
              whiteSpace: 'pre-line', margin: '0 0 20px',
              fontSize: '0.98rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.85)', fontWeight: 300,
            }}>
              {post.note}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {post.files.map((f, i) => (
              <div
                key={`${post.id}-${i}`}
                style={{
                  position: 'relative', borderRadius: 6, overflow: 'hidden',
                  background: '#1a1d29', border: '1px solid rgba(212,168,67,0.18)',
                }}
              >
                {f.type === 'photo' ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt="" loading="lazy" style={{ width: '100%', display: 'block' }} />
                  </a>
                ) : (
                  <video src={f.url} controls playsInline preload="metadata" style={{ width: '100%', display: 'block', background: '#000' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onOpen }: { post: FieldPost; onOpen: () => void }) {
  const cover = post.files[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: 'left', background: 'transparent', padding: 0, border: 0,
        cursor: 'pointer', color: 'inherit', display: 'block', width: '100%',
      }}
    >
      <div
        style={{
          aspectRatio: '4/3', position: 'relative', overflow: 'hidden',
          background: '#1a1d29', border: '1px solid rgba(212,168,67,0.18)',
        }}
      >
        {cover?.type === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt={post.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : cover ? (
          <>
            <video src={cover.url} muted playsInline preload="metadata" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,168,67,0.92)', display: 'grid', placeItems: 'center', color: '#0a0b10', fontSize: '1.3rem', paddingLeft: 3 }}>▶</span>
            </div>
          </>
        ) : null}
        {post.files.length > 1 && (
          <span style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>
            +{post.files.length}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 4px 0' }}>
        {post.date && (
          <div style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: '0.64rem', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 6 }}>
            {fmtDate(post.date)}
          </div>
        )}
        <div style={{ fontSize: '0.98rem', lineHeight: 1.5, color: '#fff', fontWeight: 500 }}>{post.title}</div>
        {post.note && (
          <p style={{
            marginTop: 6, fontSize: '0.84rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', fontWeight: 300,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {post.note}
          </p>
        )}
      </div>
    </button>
  );
}

export default function FieldJournal({ posts }: { posts: FieldPost[] }) {
  const [openPost, setOpenPost] = useState<FieldPost | null>(null);

  return (
    <section className={styles.chapter}>
      <div className={styles.wrap}>
        <div className={styles.chapterGrid}>
          <div>
            <div className={styles.chapterNum}>01</div>
            <div className={styles.chapterTag}>Field</div>
          </div>
          <div className={styles.chapterBody}>
            <h3>현장 소식</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', marginTop: 8 }}>
              베트남 하띤 직영 농장에서 전하는 생생한 현장 기록. 카드를 누르면 전체 내용이 열립니다.
            </p>
            {posts.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 24,
                  marginTop: 30,
                }}
              >
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} onOpen={() => setOpenPost(p)} />
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>아직 등록된 현장 소식이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {openPost && <PostModal post={openPost} onClose={() => setOpenPost(null)} />}
    </section>
  );
}
