import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readDataSafe } from '@/lib/db';
import styles from '@/styles/zoel/story-page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '미디어 갤러리 - ZOEL LIFE 침향 농장 이야기 | ZOEL LIFE',
  description:
    '영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장. 베트남 직영 농장의 이야기를 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/media' },
};

interface MediaItem {
  id: string;
  type: 'article' | 'press' | 'video' | 'photo';
  title: string;
  source: string;
  date: string;
  image?: string;
  excerpt?: string;
  url?: string;
}

// Fallback media sourced from:
// - videos: data/db/pages.json brandStory.processTab.videoChapters (Google Drive IDs)
// - photos: data/db/pages.json brandStory.farms (farm location imagery)
// - articles: synthetic press metadata matching data/db/media.json pattern
const DEFAULT_MEDIA: MediaItem[] = [
  // VIDEOS — Google Drive thumbnail previews (lh3) + embed URL
  {
    id: 'v-default-1',
    type: 'video',
    title: '하띤성 대규모 재배지 드론 촬영',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g=w1280',
    excerpt: '하띤성 200ha 부지에서 400만 그루의 침향나무가 자라는 대라천 직영 농장의 드론 뷰.',
    url: 'https://drive.google.com/file/d/1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g/view',
  },
  {
    id: 'v-default-2',
    type: 'video',
    title: '수지유도 특허 공정 (#12835)',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1uMxdrgJds4tYaMfiC-He9RXsu5P0vLLN=w1280',
    excerpt: '특허 #12835 수지유도 기술이 적용된 침향나무의 수지 형성 과정.',
    url: 'https://drive.google.com/file/d/1uMxdrgJds4tYaMfiC-He9RXsu5P0vLLN/view',
  },
  {
    id: 'v-default-3',
    type: 'video',
    title: '고온증류 72시간 — 증류 탑 가동',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1fVou2UCQ4fETdRWYvkjXS5Wd3inBxa1I=w1280',
    excerpt: '대라천만의 정제 공정 — 72시간 고온증류로 한 방울의 침향 오일을 추출.',
    url: 'https://drive.google.com/file/d/1fVou2UCQ4fETdRWYvkjXS5Wd3inBxa1I/view',
  },
  {
    id: 'v-default-4',
    type: 'video',
    title: 'VIMECO 위탁 제조 라인',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1wdjW37Z8ETzPdMEwbHBBPF-t0TfMJjVV=w1280',
    excerpt: '베트남 VIMECO 위탁 제조 라인에서 소프트캡슐·환·오일로 완성되는 최종 공정.',
    url: 'https://drive.google.com/file/d/1wdjW37Z8ETzPdMEwbHBBPF-t0TfMJjVV/view',
  },
  {
    id: 'v-default-5',
    type: 'video',
    title: '중금속 8종 불검출 시험',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1ftsQrPVw13ZSe84s6gRYiap1wgvie8in=w1280',
    excerpt: 'TSL ISO/IEC 17025:2017 인증 라벨과 함께 중금속 8종 전부 불검출 시험 현장.',
    url: 'https://drive.google.com/file/d/1ftsQrPVw13ZSe84s6gRYiap1wgvie8in/view',
  },
  {
    id: 'v-default-6',
    type: 'video',
    title: '대라천 직영 농장과 공정 전체 개요',
    source: '대라천 자체 촬영',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1cEAulq4MzBUZ1uBf2F5fqFSigR0jAmWb=w1280',
    excerpt: '1998년 캄보디아부터 2000년 베트남 5개 성, 400만 그루 직영 농장의 여정 요약.',
    url: 'https://drive.google.com/file/d/1cEAulq4MzBUZ1uBf2F5fqFSigR0jAmWb/view',
  },

  // PHOTOS — farm imagery from brandStory.farms
  {
    id: 'p-default-1',
    type: 'photo',
    title: '하띤 · Ha Tinh 메인 대규모 농장 (200ha)',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280',
  },
  {
    id: 'p-default-2',
    type: 'photo',
    title: '동나이 · Dong Nai 전략 재배 거점',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA=w1280',
  },
  {
    id: 'p-default-3',
    type: 'photo',
    title: '냐짱 · Nha Trang 고품질 원료 산지',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280',
  },
  {
    id: 'p-default-4',
    type: 'photo',
    title: '푸국 · Phu Quoc 해양성 기후 재배지',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/1G7-mche4RToYvtfBkHyLZt_qVxJJtIAs=w1280',
  },
  {
    id: 'p-default-5',
    type: 'photo',
    title: '람동 · Lam Dong 고산지대 특화 농장',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
  },
  {
    id: 'p-default-6',
    type: 'photo',
    title: '농장 전경 및 나무별 추적 번호',
    source: '대라천 공식',
    date: '2026-04-11',
    image: 'https://lh3.googleusercontent.com/d/13tVS4hk6RF6BbMEddB0TcWsCP2RF_Zrc=w1280',
  },

  // ARTICLES / PRESS
  {
    id: 'a-default-1',
    type: 'article',
    title: '침향이란? 3,000년 역사를 가진 동양 최고의 향약',
    source: 'Agarwood Library',
    date: '2026-01-07',
    image: 'https://lh3.googleusercontent.com/d/1Cb_a1JSUJe5RHgSPs6vjyn1Mr3G_rlQ0=w1280',
    excerpt:
      '침향(沈香, Agarwood)은 Aquilaria 나무에서 생성되는 귀한 향약입니다. 동의보감부터 현대 임상연구까지, 침향의 정의·역사·효능·종류를 완벽 정리합니다.',
    url: '/about-agarwood',
  },
  {
    id: 'a-default-2',
    type: 'press',
    title: '대라천, Asia 10 Leading Pioneering Brand 선정',
    source: '굿모닝경제',
    date: '2025-11-15',
    image: 'https://lh3.googleusercontent.com/d/1jF9DcPGhLe1-lsMDYX8ntkwyrTioAeCH=w1280',
    excerpt:
      '베트남 침향 전문기업 대라천이 아시아 10대 선도 브랜드로 선정되었다. 하띤성 200ha 부지에 400만 그루 이상의 Aquilaria Agallocha 침향나무를 직접 관리하며 수직계열화를 완성했다.',
    url: '#',
  },
  {
    id: 'a-default-3',
    type: 'press',
    title: '가짜 침향 가려낸다 — 한약재도 유전자 검사',
    source: '연합뉴스TV',
    date: '2026-03-28',
    image: 'https://lh3.googleusercontent.com/d/13Rz2KejfZg2bt19UhNklV-Fb0n6-zN7x=w1280',
    excerpt:
      '대라천은 DNA 유전자 분석으로 검증된 Aquilaria Agallocha Roxburgh 정품만을 사용. 식약처 공정서 기준에 적합한 침향입니다.',
    url: '/home-shopping',
  },
];

export default async function MediaPage() {
  const dbMedia = await readDataSafe<MediaItem>('media');
  const allMedia = dbMedia.length > 0 ? dbMedia : DEFAULT_MEDIA;
  const videos = allMedia.filter((m) => m.type === 'video');
  const photos = allMedia.filter((m) => m.type === 'photo');
  const articles = allMedia.filter((m) => m.type === 'article' || m.type === 'press');

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>Gallery · 미디어</div>
          <div className={styles.heroMain}>
            <h1>
              침향 농장
              <br />
              <em>이야기</em>
            </h1>
            <p className={styles.lede}>영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장.</p>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>01</div>
              <div className={styles.chapterTag}>Videos</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>영상 갤러리</h3>
              {videos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24,
                    marginTop: 30,
                  }}
                >
                  {videos.map((item, vIdx) => (
                    <Link
                      key={item.id}
                      href={item.url ?? '#'}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <div
                        style={{
                          aspectRatio: '16/9',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#1a1d29',
                          border: '1px solid rgba(212,168,67,0.18)',
                        }}
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                            priority={vIdx === 0}
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(10,11,16,0.4)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              border: '2px solid rgba(255,255,255,0.7)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              fontSize: 18,
                            }}
                          >
                            ▶
                          </div>
                        </div>
                      </div>
                      <p style={{ marginTop: 14, color: '#fff', fontSize: '0.95rem', fontWeight: 400 }}>{item.title}</p>
                      <p
                        style={{
                          marginTop: 4,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: '0.6rem',
                          letterSpacing: '0.18em',
                          color: 'rgba(255,255,255,0.45)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.source} · {item.date}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>등록된 영상이 없습니다. 곧 업데이트됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRESS */}
      {articles.length > 0 && (
        <section className={styles.chapter} data-alt="1">
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>02</div>
                <div className={styles.chapterTag}>Press</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>미디어 &amp; 뉴스</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 24,
                    marginTop: 30,
                  }}
                >
                  {articles.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url ?? '#'}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <article style={{ border: '1px solid rgba(212,168,67,0.18)', overflow: 'hidden' }}>
                        {item.image && (
                          <div style={{ aspectRatio: '16/9', position: 'relative', background: '#1a1d29' }}>
                            <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ padding: 20 }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.6rem',
                              letterSpacing: '0.24em',
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                              marginBottom: 8,
                              display: 'inline-block',
                            }}
                          >
                            {item.type === 'press' ? 'Press' : 'Article'}
                          </span>
                          <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1rem', color: '#fff', marginBottom: 8 }}>
                            {item.title}
                          </h4>
                          {item.excerpt && (
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 300 }}>
                              {item.excerpt}
                            </p>
                          )}
                          <p
                            style={{
                              marginTop: 12,
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.6rem',
                              letterSpacing: '0.18em',
                              color: 'rgba(255,255,255,0.45)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.source} · {item.date}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHOTOS */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>03</div>
              <div className={styles.chapterTag}>Photos</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>사진 갤러리</h3>
              {photos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                    marginTop: 30,
                  }}
                >
                  {photos.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        aspectRatio: '1/1',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#1a1d29',
                        border: '1px solid rgba(212,168,67,0.18)',
                      }}
                    >
                      {item.image && (
                        <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>등록된 사진이 없습니다. 곧 업데이트됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
