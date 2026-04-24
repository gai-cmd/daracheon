import type { Metadata } from 'next';
import { readDataSafe } from '@/lib/db';
import styles from '@/styles/zoel/story-page.module.css';
import MediaGallery, { type MediaItem } from './MediaGallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '미디어 갤러리 - ZOEL LIFE 침향 농장 이야기 | ZOEL LIFE',
  description:
    '영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장. 베트남 직영 농장의 이야기를 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/media' },
};

// MediaItem 타입은 MediaGallery 클라이언트 컴포넌트에서 export.

// Fallback media sourced from:
// - videos: data/db/pages.json brandStory.processTab.videoChapters (Google Drive IDs)
// - photos: data/db/pages.json brandStory.farms (farm location imagery)
// - articles: synthetic press metadata matching data/db/media.json pattern
const DEFAULT_MEDIA: MediaItem[] = [
  // VIDEOS — YouTube 썸네일(img.youtube.com)과 실제 영상 URL 매칭
  {
    id: 'v-default-1',
    type: 'video',
    title: '대라천 침향 — 유기농 재배 · 베트남 정부 인증 현장 | 문경수 대표',
    source: '대라천 공식',
    date: '2024-10-01',
    image: 'https://img.youtube.com/vi/LwKK8t6AyQA/hqdefault.jpg',
    excerpt: '말도 많고 가짜도 많은 베트남 침향, 유기농 재배로 베트남 정부 HACCP·유기농·OCOP 인증품을 생산. 하띤성 직영 농장 23년 기록.',
    url: 'https://www.youtube.com/watch?v=LwKK8t6AyQA',
  },
  {
    id: 'v-default-2',
    type: 'video',
    title: '대라천 침향 · 침향단 — 베트남 현지 가공 전 공정 (NTV 방송)',
    source: 'NTV Việt Nam',
    date: '2024-10-08',
    image: 'https://img.youtube.com/vi/Wj9X0XYlbrw/hqdefault.jpg',
    excerpt: '베트남 현지 방송 NTV와 함께한 대라천 침향단 제조 공정 완전 공개. 원목 수확부터 최종 제품까지.',
    url: 'https://www.youtube.com/watch?v=Wj9X0XYlbrw',
  },
  {
    id: 'v-default-3',
    type: 'video',
    title: '베트남 현지 침향 가공 현장 — 원목에서 제품까지 전 공정',
    source: '약초방송',
    date: '2023-09-19',
    image: 'https://img.youtube.com/vi/U_UTerP2C84/hqdefault.jpg',
    excerpt: '귀하디귀한 베트남 침향 가공 현장 영상. 원목 수확·분쇄·추출까지 현장 그대로 담았습니다.',
    url: 'https://www.youtube.com/watch?v=U_UTerP2C84',
  },
  {
    id: 'v-default-4',
    type: 'video',
    title: '하띤성 · 침향 생산 나무 현장 확인 — Aquilaria Agallocha',
    source: 'Vietnam Agarwood',
    date: '2023-06-01',
    image: 'https://img.youtube.com/vi/kpj5UIW9wTc/hqdefault.jpg',
    excerpt: '베트남 하띤성에서 Aquilaria Agallocha 침향 생산 나무를 직접 확인하는 현장 영상.',
    url: 'https://www.youtube.com/watch?v=kpj5UIW9wTc',
  },
  {
    id: 'v-default-5',
    type: 'video',
    title: '베트남 침향 채취 현장 — 신기한 침향나무 직접 촬영',
    source: '약초방송',
    date: '2023-09-19',
    image: 'https://img.youtube.com/vi/D13PLn15lH0/hqdefault.jpg',
    excerpt: '베트남 현지 침향 채취 현장에서 신기한 침향나무를 가까이 확인. 막힌 것을 뻥 뚫어주는 침향의 원산지 풍경.',
    url: 'https://www.youtube.com/watch?v=D13PLn15lH0',
  },
  {
    id: 'v-default-6',
    type: 'video',
    title: '동나이 · 유기농 침향 농장과 오일 증류 공정',
    source: 'Organic Agarwood Vietnam',
    date: '2016-06-05',
    image: 'https://img.youtube.com/vi/j3gi0iTAjGY/hqdefault.jpg',
    excerpt: '베트남 동나이 유기농 침향 농장 탐방과 오일 증류 공정 전체를 담은 영상.',
    url: 'https://www.youtube.com/watch?v=j3gi0iTAjGY',
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

      <MediaGallery videos={videos} photos={photos} articles={articles} />
    </>
  );
}
