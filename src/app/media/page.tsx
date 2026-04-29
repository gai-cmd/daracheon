import type { Metadata } from 'next';
import { readSingleSafe, readDataSafe } from '@/lib/db';
import MediaPageClient, { type FarmStoryData } from './MediaPageClient';
import type { MediaItem } from './MediaGallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '침향 농장 이야기 | ZOEL LIFE',
  description:
    '베트남 하띤 200ha 직영 농장 이야기와 영상·사진 갤러리. 25년의 시간이 담긴 대라천 침향 현장을 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/media' },
};

// ── process 기본값 (pages.json 없을 때 fallback) ──

const DEFAULT_HERO: FarmStoryData['hero'] = {
  kicker: '침향 농장 이야기 · Farm Story',
  titleLine1: '베트남 하띤의',
  titleEmphasis: '200헥타르, 25년의 시간',
  latLabel: 'Lat 18° N · Ha Tinh, Vietnam',
  lede: '호치민에서 북쪽으로 500km, 베트남 중부의 하띤(Ha Tinh) — 연평균 습도 84%, 해발 300~600m의 아열대 산림. 침향나무가 가장 깊은 수지를 만드는 유일한 기후. 대라천은 이곳에서 25년째 직영 농장을 운영합니다.',
};

const DEFAULT_CHAPTERS: FarmStoryData['chapters'] = [
  {
    num: '01',
    tag: 'Location',
    title: '북위 18° — 침향의 마지막 기후대',
    body: '아퀼라리아 아갈로차(Aquilaria Agallocha Roxburgh)는 북위 10°~22° 사이 아열대 산림에서만 자연 수지를 만듭니다. 베트남 하띤은 그 중에서도 연평균 강수량 2,400mm, 안개일 수 180일 — 수지가 가장 깊게 침착되는 미기후를 갖춘, 세계에서 가장 북쪽 끝 침향 산지입니다.',
    imageSrc: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280',
    imageAlt: '베트남 하띤(Ha Tinh) 직영 농장',
    imageCaption: '하띤 · Ha Tinh · 메인 대규모 농장 (200ha)',
  },
  {
    num: '02',
    tag: 'Scale',
    title: '직영 200ha · 약 400만 그루',
    body: '농장은 CITES(멸종위기종 국제거래협약) 번호 VN-2008-AAR-003으로 등록된 공식 조림지. 평균 수령 18년 이상의 성숙목 400만 그루가 자연 침착 환경에서 자라고 있으며, 매년 평균 180그루만 수확합니다.',
    stats: [
      { value: '200', label: 'ha' },
      { value: '4M', label: 'trees' },
    ],
    imageSrc: 'https://lh3.googleusercontent.com/d/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA=w1280',
    imageAlt: '동나이(Dong Nai) 전략 재배 거점',
    imageCaption: '동나이 · Dong Nai · 전략 재배 거점',
  },
  {
    num: '03',
    tag: 'Partnership',
    title: '현지 공동체와의 25년',
    body: '농장의 관리는 하띤 지역 62가구의 현지 파트너 가족이 맡고 있습니다. 25년간 함께 일해온 이들에게는 한국 본사와 동일한 의료·교육 복지를 제공합니다. "진짜 침향은 사람과 자연 모두가 건강할 때만 만들어집니다" — 박병주 대표의 원칙.',
    stats: [{ value: '62', label: 'families' }],
    imageSrc: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280',
    imageAlt: '냐짱(Nha Trang) 고품질 원료 산지',
    imageCaption: '냐짱 · Nha Trang · 고품질 원료 산지',
  },
  {
    num: '04',
    tag: 'Verification',
    title: '4단계 원산지 검증',
    body: 'GPS 좌표로 나무마다 위치를 기록하고, 수확할 때 나무 ID·수지 함량을 DB에 입력합니다. 베트남 농업부 검사증을 받은 뒤 한국 식약처 수입 통관 시 한 번 더 검증합니다. 제품 Lot 번호로 이 모든 이력을 누구나 조회할 수 있습니다.',
    stats: [{ value: '4', label: 'steps' }],
    imageSrc: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    imageAlt: '람동(Lam Dong) 고산지대 특화 농장',
    imageCaption: '람동 · Lam Dong · 고산지대 특화 농장',
  },
];

const DEFAULT_PROCESS_VIDEOS: FarmStoryData['processVideos'] = {
  num: '05',
  tag: 'Videos',
  title: '생산 영상 — 농장 현장',
  body: '베트남 5개 성 직영 농장에서 식목부터 25년 자연 숙성까지, Aquilaria Agallocha Roxburgh의 하루를 영상으로 공개합니다.',
  items: [
    { id: '1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g', title: '하띤성 대규모 재배지 드론 촬영' },
    { id: '1oKXg0SyCbFy63C8hzQrPBs7THV4xIROE', title: '침향나무 식목·관수 루틴' },
    { id: '1p8OQBwzt57lH6mF8zZFsDMuAGttqNATze', title: '동나이성 전략 재배 거점' },
    { id: '1IuUk2qrtyhE831wIZhFZkGngDx_hfON7', title: '냐짱 고품질 원료 산지' },
    { id: '1dBm27G-X2cLWy5ISGCMcpRXRzsFlLlwg', title: '푸국 해양성 기후 재배지' },
    { id: '13zJY7WQ6rVNQVAROdcgle4M5FQhvQ1fJ', title: '람동 고산지대 특화 농장' },
  ],
};

const DEFAULT_CERTIFICATIONS: FarmStoryData['certifications'] = {
  num: '06',
  tag: 'Certifications',
  title: '신뢰의 지표 — 국제가 인정하는 품질',
  body: 'CITES 국제거래 인증부터 TSL ISO/IEC 17025:2017 안전성 시험, 중금속 8종 전부 불검출까지. 대라천의 모든 제품은 Lot 번호로 이력을 조회할 수 있습니다.',
  sections: [
    { title: '국제 거래 및 기술 특허', items: ['CITES IIA-DNI-007', '수지유도 특허 #12835'] },
    { title: '품질 보증', items: ['Organic', 'HACCP', 'OCOP', '2025 아시아 10대 브랜드'] },
    { title: '안전성 시험', items: ['TSL ISO/IEC 17025:2017', '중금속 8종 전부 불검출'] },
  ],
  images: [
    '/uploads/misc/kfda-doc-1.jpg',
    '/uploads/misc/kfda-doc-2.jpg',
    '/uploads/misc/kfda-doc-3.jpg',
    '/uploads/misc/kfda-doc-4.jpg',
  ],
};

const DEFAULT_MEDIA: MediaItem[] = [
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
  {
    id: 'a-default-1',
    type: 'article',
    title: '침향이란? 3,000년 역사를 가진 동양 최고의 향약',
    source: 'Agarwood Library',
    date: '2026-01-07',
    image: 'https://lh3.googleusercontent.com/d/1Cb_a1JSUJe5RHgSPs6vjyn1Mr3G_rlQ0=w1280',
    excerpt: '침향(沈香, Agarwood)은 Aquilaria 나무에서 생성되는 귀한 향약입니다. 동의보감부터 현대 임상연구까지, 침향의 정의·역사·효능·종류를 완벽 정리합니다.',
    url: '/about-agarwood',
  },
  {
    id: 'a-default-2',
    type: 'press',
    title: '대라천, Asia 10 Leading Pioneering Brand 선정',
    source: '굿모닝경제',
    date: '2025-11-15',
    image: 'https://lh3.googleusercontent.com/d/1jF9DcPGhLe1-lsMDYX8ntkwyrTioAeCH=w1280',
    excerpt: '베트남 침향 전문기업 대라천이 아시아 10대 선도 브랜드로 선정되었다. 하띤성 200ha 부지에 400만 그루 이상의 Aquilaria Agallocha 침향나무를 직접 관리하며 수직계열화를 완성했다.',
    url: '#',
  },
  {
    id: 'a-default-3',
    type: 'press',
    title: '가짜 침향 가려낸다 — 한약재도 유전자 검사',
    source: '연합뉴스TV',
    date: '2026-03-28',
    image: 'https://lh3.googleusercontent.com/d/13Rz2KejfZg2bt19UhNklV-Fb0n6-zN7x=w1280',
    excerpt: '대라천은 DNA 유전자 분석으로 검증된 Aquilaria Agallocha Roxburgh 정품만을 사용. 식약처 공정서 기준에 적합한 침향입니다.',
    url: '/home-shopping',
  },
];

// DB에서 읽는 process 데이터의 타입 (내부 사용)
interface RawProcessData {
  hero?: FarmStoryData['hero'];
  chapters?: FarmStoryData['chapters'];
  productionVideos?: FarmStoryData['processVideos'];
  certifications?: FarmStoryData['certifications'];
}

export default async function MediaPage() {
  const [pagesData, dbMedia] = await Promise.all([
    readSingleSafe<{ process?: RawProcessData }>('pages'),
    readDataSafe<MediaItem>('media'),
  ]);

  const process = pagesData?.process;
  const farmStory: FarmStoryData = {
    hero: process?.hero ?? DEFAULT_HERO,
    chapters: process?.chapters?.length ? process.chapters : DEFAULT_CHAPTERS,
    processVideos: process?.productionVideos ?? DEFAULT_PROCESS_VIDEOS,
    certifications: process?.certifications ?? DEFAULT_CERTIFICATIONS,
  };

  const allMedia = dbMedia.length > 0 ? dbMedia : DEFAULT_MEDIA;
  const gallery = {
    videos: allMedia.filter((m) => m.type === 'video'),
    photos: allMedia.filter((m) => m.type === 'photo'),
    articles: allMedia.filter((m) => m.type === 'article' || m.type === 'press'),
  };

  return <MediaPageClient farmStory={farmStory} gallery={gallery} />;
}
