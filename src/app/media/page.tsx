import type { Metadata } from 'next';
import { readSingleUncached, readDataSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import MediaPageClient, { type FarmStoryData, type SceneSection } from './MediaPageClient';
import type { MediaItem } from './MediaGallery';
import type { Farm } from '@/app/brand-story/page';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '침향 영상·사진 미디어 — 베트남 하띤 농장 현장',
  description:
    '베트남 하띤 200ha 대라천 직영 침향 농장의 영상·사진 갤러리. 25년의 시간, 묘목부터 채취·증류까지 전 공정을 미디어로 공개. 침향 영상, 침향 농장 다큐, 침향 인증 자료.',
  keywords: [
    '침향 영상', '침향 다큐멘터리', '침향 농장 영상', '침향 사진',
    '대라천 영상', 'ZOEL LIFE 영상', '조엘라이프 영상',
    '베트남 침향 농장 영상', '하띤 침향 영상',
    '침향 미디어', '침향 갤러리', '침향 보도자료',
  ],
  alternates: { canonical: 'https://zoellife.com/media' },
  openGraph: {
    type: 'website',
    url: 'https://zoellife.com/media',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: '침향 영상·사진 미디어 — 베트남 하띤 농장 현장',
    description: '베트남 하띤 200ha 직영 침향 농장의 영상·사진 갤러리. 25년의 시간, 묘목부터 채취·증류까지 전 공정 미디어 공개.',
    images: [{
      url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/agarwood-farm-hatinh.jpg',
      alt: '대라천 침향 미디어 — 베트남 하띤 농장 영상·사진 갤러리',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '침향 영상·사진 미디어 — 하띤 농장 현장',
    description: '대라천 직영 침향 농장의 영상·사진 갤러리.',
    images: ['https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/hero/agarwood-farm-hatinh.jpg'],
  },
};

function ytIdFromUrl(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url);
  return m ? m[1] : null;
}

/** /media 페이지의 영상·사진·기사를 JSON-LD 로 직렬화.
 *  AI 검색·Google AI Overview·Naver 검색이 "침향 농장 영상" 류 질의에 직접
 *  인용 가능하도록 ImageGallery + ItemList(VideoObject) + BreadcrumbList 구성. */
function buildMediaJsonLd(media: MediaItem[]) {
  const videos = media.filter((m) => m.type === 'video');
  const photos = media.filter((m) => m.type === 'photo');

  const videoItems = videos.map((v, i) => {
    const id = v.url ? ytIdFromUrl(v.url) : null;
    const watchUrl = v.url ?? (id ? `https://www.youtube.com/watch?v=${id}` : `${SITE_URL}/media`);
    const item: Record<string, unknown> = {
      '@type': 'VideoObject',
      position: i + 1,
      name: v.title,
      description: v.excerpt ?? v.title,
      thumbnailUrl: v.image,
      uploadDate: v.date,
      contentUrl: watchUrl,
      ...(id ? { embedUrl: `https://www.youtube.com/embed/${id}` } : {}),
      publisher: { '@type': 'Organization', name: '대라천 ZOEL LIFE' },
    };
    return item;
  });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/media#page`,
      name: '침향 영상·사진 미디어',
      url: `${SITE_URL}/media`,
      description: '베트남 하띤 200ha 직영 농장 영상·사진 갤러리.',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#brand` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${SITE_URL}/media#videos`,
      name: '침향 농장 영상',
      itemListElement: videoItems,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      '@id': `${SITE_URL}/media#photos`,
      name: '침향 농장 사진',
      image: photos.map((p) => ({
        '@type': 'ImageObject',
        contentUrl: p.image,
        name: p.title,
        creditText: p.source ?? '대라천 ZOEL LIFE',
        datePublished: p.date,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: '미디어', item: `${SITE_URL}/media` },
      ],
    },
  ];
}

// ── process 기본값 (pages.json 없을 때 fallback) ──

const DEFAULT_HERO: FarmStoryData['hero'] = {
  kicker: '침향 농장 이야기 · Farm Story',
  titleLine1: '베트남 하띤의',
  titleEmphasis: '200헥타르, 25년의 시간',
  latLabel: 'Lat 18° N · Ha Tinh, Vietnam',
  lede: '호치민에서 북쪽으로 500km, 베트남 중부의 하띤(Ha Tinh) — 연평균 습도 84%, 해발 300~600m의 아열대 산림. 침향나무가 가장 깊은 수지를 만드는 유일한 기후. 대라천은 이곳에서 25년째 직영 농장을 운영합니다.',
  heroImage:
    'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/vn/site-showroom-1778043495627.jpg',
};

const DEFAULT_SCENE_SECTION: SceneSection = {
  num: '01',
  tag: 'THE FIELD',
  title: '대라천 침향 현장',
  subtitle: '하띤, 냐짱, 람동, 동나이, 푸꾸옥의 200ha 부지에 400만 그루',
  body: "베트남 5대 핵심 산지에 조성된 약 200헥타르 규모의 대라천 침향 직영 농장은 '진정한 침향'이 태어나는 심장부입니다. 약 400만 그루의 침향나무가 자라는 이곳은, 단순한 재배지를 넘어 생명과 시간이 빚어내는 가치의 원천입니다.\n\n하띤, 냐짱, 람동, 동나이, 푸꾸옥 등 베트남을 대표하는 침향 산지에 구축된 대라천의 대규모 농장은 철저한 관리와 체계적인 시스템을 기반으로 운영됩니다.\n\n이곳에서 생산되고 모든 아갈로차(Agallocha) 침향나무에는 개별 고유번호가 부여되어 전 생육 이력이 정밀하게 관리되며, 특허 받은 수지 유도 기술을 통해 최상의 품질을 구현합니다.\n\n또한 생산부터 가공, 출시까지 전 과정을 투명하게 공개하며, CITES 국제 인증, 유기농(Organic), HACCP 품질 인증, 베트남 정부 OCOP 품질 보증 등 다양한 국제 및 공인 인증, 특허들을 통해 대라천 '참'침향의 가치를 객관적으로 증명하고 있습니다.",
  images: [
    'https://lh3.googleusercontent.com/d/13tVS4hk6RF6BbMEddB0TcWsCP2RF_Zrc=w1280',
    'https://lh3.googleusercontent.com/d/1Cb_a1JSUJe5RHgSPs6vjyn1Mr3G_rlQ0=w1280',
    'https://lh3.googleusercontent.com/d/1jF9DcPGhLe1-lsMDYX8ntkwyrTioAeCH=w1280',
    'https://lh3.googleusercontent.com/d/17EiU_mn7SNlRR6h1GPfdJygQNCQc2DQj=w1280',
    'https://lh3.googleusercontent.com/d/1rCIMO6zfTHjLokXBU6-bOCm4C7k1ODlL=w1280',
    'https://lh3.googleusercontent.com/d/1OPsfkpIen9VDFUBgnsyfMYA-EM-yHb-Z=w1280',
    'https://lh3.googleusercontent.com/d/1CKYOtnu0fETBnp9nUQnsBSxqE8QxKh4u=w1280',
    'https://lh3.googleusercontent.com/d/1W8szQeZMqdeeaLXhw0P51RrFQ5Ks4bjh=w1280',
  ],
  extras: [
    {
      image:
        'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/farms/scene-extras/01-phuquoc-old-growth.jpg',
      alt: '푸꾸옥 농장의 100년 이상 된 고수령 침향목',
      body: '푸꾸옥 농장의 100년 이상 된 고수령 침향목은 오랜 세월 자연 환경 속에서 천천히 수지가 축적되며 형성된 귀한 자원입니다. 세월의 흔적이 깊게 배어 있는 만큼 침향의 밀도와 향의 깊이가 뛰어나며, 희소성 또한 높아 높은 가치를 지닌 침향목으로 평가받고 있습니다.',
    },
    {
      image:
        'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/farms/scene-extras/02-hatinh-resin-ant.jpg',
      alt: '하띤 농장 5년차 수지 작업 침향나무 — 개미집 형성',
      body: '하띤 농장에서 5년간 수지 작업을 진행해 온 침향나무로, 작업 부위에는 현재 개미집이 형성되어 있습니다. 사용된 수지 유도제는 천연 성분 기반으로 개미도 서식할 수 있는 환경이며, 침향나무는 개미 활동으로 인해 지속적인 자연 스트레스를 받고 있는 상태입니다. 이러한 조건은 수지 생성과 축적을 더욱 촉진하는 환경으로 평가되며, 향후 수지 함량이 높은 우수한 품질의 침향으로 성장할 가능성이 기대되는 침향나무입니다.',
    },
  ],
};

const DEFAULT_CHAPTERS: FarmStoryData['chapters'] = [
  {
    num: '02',
    tag: 'Location',
    title: '북위 18° — 침향의 마지막 기후대',
    body: '아퀼라리아 아갈로차(Aquilaria Agallocha Roxburgh)는 북위 10°~22° 사이 아열대 산림에서만 자연 수지를 만듭니다. 베트남 하띤은 그 중에서도 연평균 강수량 2,400mm, 안개일 수 180일 — 수지가 가장 깊게 침착되는 미기후를 갖춘, 세계에서 가장 북쪽 끝 침향 산지입니다.',
    imageSrc: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280',
    imageAlt: '베트남 하띤(Ha Tinh) 직영 농장',
    imageCaption: '하띤 · Ha Tinh · 메인 대규모 농장 (200ha)',
  },
  {
    num: '03',
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
    num: '04',
    tag: 'Partnership',
    title: '현지 공동체와의 25년',
    body: '농장의 관리는 하띤 지역 62가구의 현지 파트너 가족이 맡고 있습니다. 25년간 함께 일해온 이들에게는 베트남 현지 최고의 의료·교육 복지를 제공합니다. "진짜 침향은 사람과 자연 모두가 건강할 때만 만들어집니다"',
    stats: [{ value: '62', label: 'families' }],
    imageSrc: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280',
    imageAlt: '냐짱(Nha Trang) 고품질 원료 산지',
    imageCaption: '냐짱 · Nha Trang · 고품질 원료 산지',
  },
  {
    num: '05',
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
  num: '06',
  tag: 'Videos',
  title: '생산과정 — 농장 현장',
  body: '베트남 5개 지역 직영 농장에서 식목부터 25년 자연 숙성까지, Aquilaria Agallocha Roxburgh의 하루를 영상으로 공개합니다.',
  items: [
    { src: '/uploads/media/farm-video-01.mp4', title: '하띤성 대규모 재배지 드론 촬영' },
    { src: '/uploads/media/farm-video-02.mp4', title: '침향나무 식목·관수 루틴' },
    { src: '/uploads/media/farm-video-03.mp4', title: '동나이성 전략 재배 거점' },
    { src: '/uploads/media/farm-video-04.mp4', title: '냐짱 고품질 원료 산지' },
    { src: '/uploads/media/farm-video-05.mp4', title: '푸국 해양성 기후 재배지' },
  ],
};

const DEFAULT_CERTIFICATIONS: FarmStoryData['certifications'] = {
  num: '07',
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
    image: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1G7-mche4RToYvtfBkHyLZt_qVxJJtIAs.jpg',
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
];

// DB에서 읽는 process 데이터의 타입 (내부 사용)
interface RawProcessData {
  hero?: FarmStoryData['hero'];
  sceneSection?: SceneSection;
  chapters?: FarmStoryData['chapters'];
  productionVideos?: FarmStoryData['processVideos'];
  certifications?: FarmStoryData['certifications'];
}

export default async function MediaPage() {
  const [pagesData, dbMedia] = await Promise.all([
    // unstable_cache 우회 — 외부 시드 스크립트로 blob 갱신 시 즉시 반영.
    readSingleUncached<{ process?: RawProcessData; brandStory?: { farms?: Farm[] } }>('pages'),
    readDataSafe<MediaItem>('media'),
  ]);

  const process = pagesData?.process;
  const farms: Farm[] = pagesData?.brandStory?.farms ?? [];
  const rawVideos = process?.productionVideos;
  const farmStory: FarmStoryData = {
    hero: { ...DEFAULT_HERO, ...(process?.hero ?? {}) },
    sceneSection: process?.sceneSection ?? DEFAULT_SCENE_SECTION,
    chapters: process?.chapters?.length ? process.chapters : DEFAULT_CHAPTERS,
    // DB 항목은 src(URL) 또는 id(Google Drive 파일 ID) 둘 중 하나로 저장될 수 있다.
    // id 만 있으면 Drive preview 임베드 URL 로 변환해 src 를 채운다 — 클라이언트는
    // drive.google.com URL 을 iframe 으로 임베드.
    processVideos: rawVideos
      ? {
          ...rawVideos,
          items: (rawVideos.items ?? []).map((item) => {
            const it = item as { src?: string; id?: string; title?: string; thumbnail?: string; date?: string };
            const src = it.src
              ? it.src
              : it.id
                ? `https://drive.google.com/file/d/${it.id}/preview`
                : '';
            return { src, title: it.title ?? '', thumbnail: it.thumbnail, date: it.date };
          }),
        }
      : DEFAULT_PROCESS_VIDEOS,
    certifications: process?.certifications ?? DEFAULT_CERTIFICATIONS,
  };

  const allMedia = dbMedia.length > 0 ? dbMedia : DEFAULT_MEDIA;

  // 갤러리 영상 = (DB 미디어 영상) + (processVideos: blob pages.json 의 productionVideos.items)
  // 영상은 모두 blob `process.productionVideos.items` 한 곳에서 관리한다 — 어드민
  // (/admin/media → 침향 농장 이야기 탭) 에서 추가/삭제/제목·날짜·썸네일 편집 가능.
  // URL/id 기준 dedup. 영상·썸네일 모두 Vercel Blob 호스팅 (외부 CDN 의존 금지).
  const productionVideoItems: MediaItem[] = farmStory.processVideos.items
    .filter((v) => v.src)
    .map((v, i) => {
      const item = v as { src: string; title: string; thumbnail?: string; date?: string };
      return {
        id: `pv-${i}-${item.src}`,
        type: 'video' as const,
        title: item.title,
        source: '대라천 공식',
        // 영상 메타데이터(ffprobe creation_time)에서 추출한 실제 촬영일을 사용. 없으면 업로드일.
        date: item.date ?? '2026-04-11',
        image: item.thumbnail,
        url: item.src,
      };
    });

  const dbVideos = allMedia.filter((m) => m.type === 'video');
  const seenUrls = new Set<string>();
  const galleryVideos: MediaItem[] = [];
  for (const v of [...dbVideos, ...productionVideoItems]) {
    const key = v.url ?? v.id;
    if (seenUrls.has(key)) continue;
    seenUrls.add(key);
    galleryVideos.push(v);
  }

  const gallery = {
    videos: galleryVideos,
    photos: allMedia.filter((m) => m.type === 'photo'),
  };

  const mediaJsonLd = buildMediaJsonLd(allMedia);

  return (
    <>
      {mediaJsonLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <MediaPageClient farmStory={farmStory} gallery={gallery} farms={farms} />
    </>
  );
}
