import type { Metadata } from 'next';
import { readDataUncached, readSingleSafe } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import { autoSplitMixed, formatBroadcastDateTime, isInlineExpired, toWatchUrl } from '@/lib/broadcasts';
import BroadcastCountdown from '@/components/BroadcastCountdown';
import JsonLd from '@/components/ui/JsonLd';
import NsBrandVideoGallery, { type NsBrandVideo } from './NsBrandVideoGallery';
import BroadcastCalendar, { type CalBroadcast } from './BroadcastCalendar';
import styles from './page.module.css';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

interface HomeShoppingHero {
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

interface NsHead {
  kicker: string;
  titleLead: string;
  titleEmphasis: string;
  lede: string;
}

interface NsSoldOut {
  imageUrl: string;
  imageAlt: string;
  stampLabel: string;
  kicker: string;
  titleHtml: string;
  body: string;
  factChannel: string;
  factComposition: string;
  factResult: string;
}

interface NsHeroFallback {
  tag: string;
  titleHtml: string;
  body: string;
  metaChannel: string;
  metaShow: string;
  metaResult: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaPhone: string;
}

const DEFAULT_HOME_SHOPPING_HERO: HomeShoppingHero = {
  titleLine1: 'TV 홈쇼핑',
  titleEmphasis: '편성표 · 다시보기',
  lede: '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간 방송은 각 홈쇼핑 앱과 ZOEL LIFE 웹에서 동시 송출됩니다.',
};

const DEFAULT_NS_HEAD: NsHead = {
  kicker: 'NS Shop+ · 방송 제작 영상',
  titleLead: 'NS홈쇼핑이 담은 ',
  titleEmphasis: '대라천 침향',
  lede: 'NS홈쇼핑이 직접 제작한 브랜드 영상 4편을 다시 보실 수 있습니다. 베트남 현지 채취 현장부터 문경수 대표 인터뷰, 쇼룸 투어까지 — 방송에서 미처 다 담지 못한 ‘진짜 침향’의 디테일을 확인하세요.',
};

const DEFAULT_NS_SOLD_OUT: NsSoldOut = {
  imageUrl: '/images/ns-broadcast-soldout.jpg',
  imageAlt: 'NS홈쇼핑 창립 25주년 대고객 감사 프로젝트 — 대라천 참 침향오일 방송 매진 화면',
  stampLabel: 'SOLD OUT',
  kicker: '완판 · SOLD OUT',
  titleHtml: 'NS홈쇼핑 창립 25주년 <em>대고객 감사 프로젝트</em><br />대라천 ‘참’침향오일 — <em>방송 중 매진</em>',
  body: 'NS Shop+ 단독 편성으로 진행된 ‘대라천 참 침향오일’ 방송이 편성 시간 안에 완판되었습니다. 지원해 주신 모든 고객님께 감사드리며, 다음 편성은 확정되는 대로 본 페이지에 안내드립니다.',
  factChannel: 'NS Shop+',
  factComposition: '대라천 ‘참’침향오일 · 특별가 300,000원',
  factResult: '방송 중 완판',
};

const DEFAULT_NS_HERO_FALLBACK: NsHeroFallback = {
  tag: 'REPLAY · NS 홈쇼핑 방송 다시보기',
  titleHtml: 'NS홈쇼핑 — <em>대라천 ‘참’침향오일</em><br />방송 중 <em>완판</em>되었습니다',
  body: 'NS Shop+ 창립 25주년 대고객 감사 프로젝트 단독 편성이 편성 시간 안에 매진으로 마감되었습니다. 다음 편성은 확정되는 대로 본 페이지에 안내드리며, 그 전까지는 NS홈쇼핑이 직접 제작한 방송 영상으로 대라천 ‘참’침향의 디테일을 확인하실 수 있습니다.',
  metaChannel: 'NS Shop+',
  metaShow: '창립 25주년 대고객 감사 프로젝트',
  metaResult: '방송 중 완판',
  ctaPrimaryLabel: '제작 영상 전체 보기 →',
  ctaPrimaryHref: '#ns-videos',
  ctaPhone: '070-4140-4086',
};

export const metadata: Metadata = {
  title: 'On-Air 특별관 — TV 홈쇼핑 편성표·다시보기',
  description:
    '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 대라천 ZOEL LIFE 침향 라이브 방송 시간표, 다시보기, Lot 인증서를 실시간으로 확인하세요.',
  keywords: [
    '침향 홈쇼핑', '침향 TV 홈쇼핑', '대라천 홈쇼핑', 'ZOEL LIFE 홈쇼핑', '조엘라이프 홈쇼핑',
    '롯데홈쇼핑 침향', '현대홈쇼핑 침향', 'CJ온스타일 침향', 'GS홈쇼핑 침향',
    '홈쇼핑 편성표', '침향 방송 편성표', '침향 다시보기',
    '침향 라이브 방송', '침향 생방송',
  ],
  alternates: { canonical: 'https://zoellife.com/home-shopping' },
  openGraph: {
    type: 'website',
    url: 'https://zoellife.com/home-shopping',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: 'On-Air 특별관 — TV 홈쇼핑 편성표·다시보기',
    description: '롯데·현대·CJ·GS 정규 편성. 침향 라이브 방송 시간표·다시보기·Lot 인증서 실시간 확인.',
    images: ['/opengraph-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'On-Air 특별관 — TV 홈쇼핑 편성표',
    description: '롯데·현대·CJ·GS 침향 편성표·다시보기.',
    images: ['/twitter-image.jpg'],
  },
};

/** 방송 일정을 BroadcastEvent + ItemList 로 직렬화.
 *  AI 검색이 "오늘 침향 홈쇼핑 편성" 류 질의에 즉답 가능하게 한다. */
function buildBroadcastJsonLd(broadcasts: Broadcast[]) {
  const items = broadcasts.slice(0, 30).map((b, i) => {
    const start = b.scheduledAt;
    const end = new Date(
      new Date(b.scheduledAt).getTime() + (b.durationMinutes ?? 60) * 60_000
    ).toISOString();
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'BroadcastEvent',
        name: `${b.channel} — ${b.description ?? '침향 방송'}`,
        startDate: start,
        endDate: end,
        eventStatus:
          b.status === 'canceled'
            ? 'https://schema.org/EventCancelled'
            : b.status === 'ended'
              ? 'https://schema.org/EventCompleted'
              : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        publishedOn: { '@type': 'BroadcastService', name: b.channel },
        ...(b.host ? { actor: { '@type': 'Person', name: b.host } } : {}),
        url: `${SITE_URL}/home-shopping`,
        ...(b.specialPrice
          ? {
              offers: {
                '@type': 'Offer',
                price: b.specialPrice,
                priceCurrency: 'KRW',
                availability: b.soldOut
                  ? 'https://schema.org/SoldOut'
                  : b.status === 'live' || b.status === 'scheduled'
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/Discontinued',
                url: `${SITE_URL}/home-shopping`,
              },
            }
          : {}),
      },
    };
  });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/home-shopping#page`,
      name: 'On-Air 특별관 — TV 홈쇼핑 편성표·다시보기',
      url: `${SITE_URL}/home-shopping`,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#brand` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${SITE_URL}/home-shopping#schedule`,
      name: '대라천 침향 홈쇼핑 편성표',
      itemListElement: items,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'On-Air 특별관', item: `${SITE_URL}/home-shopping` },
      ],
    },
  ];
}

const STATUS_LABEL: Record<Broadcast['status'], string> = {
  scheduled: '예정',
  live: 'ON AIR',
  ended: '완료',
  canceled: '취소',
};

/** scheduled 상태인데 방송 시각이 이미 지난 경우 표시상 ended 로 간주.
 *  어드민이 status 를 갱신하지 않더라도 편성표에 '예정' 으로 박혀 보이는 사고 방지. */
function effectiveStatus(b: Broadcast): Broadcast['status'] {
  if (b.status === 'scheduled' && new Date(b.scheduledAt).getTime() < Date.now()) {
    return 'ended';
  }
  return b.status;
}

// Fallback broadcasts sourced from data/db/broadcasts.json
// plus additional synthetic entries to cover a realistic schedule spread.
const DEFAULT_BROADCASTS: Broadcast[] = [
  {
    id: 'bc-default-past-1',
    channel: 'CJ온스타일',
    scheduledAt: '2026-04-05T11:00:00.000Z',
    durationMinutes: 60,
    host: '유난희',
    productIds: ['cham-oil-capsule'],
    specialPrice: 218000,
    regularPrice: 248000,
    discountRate: 12,
    description: "대라천 '참'침향 오일 캡슐 런칭 방송 — 지난 방송 다시보기.",
    status: 'ended',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-04-05T12:00:00.000Z',
  },
  {
    id: 'bc-default-past-2',
    channel: 'GS샵',
    scheduledAt: '2026-04-15T21:00:00.000Z',
    durationMinutes: 60,
    host: '김나연',
    productIds: ['cham-pill-gibo'],
    specialPrice: 398000,
    regularPrice: 480000,
    discountRate: 17,
    description: '기보단(氣寶丹) — 25년산 침향·동충하초·제비집 최고급 환.',
    status: 'ended',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-15T22:00:00.000Z',
  },
  {
    id: 'bc-default-1',
    channel: '롯데홈쇼핑',
    scheduledAt: '2026-04-28T14:00:00.000Z',
    durationMinutes: 60,
    host: '박미선',
    productIds: ['cham-oil-capsule'],
    specialPrice: 198000,
    regularPrice: 248000,
    discountRate: 20,
    description: "대라천 '참'침향 오일 캡슐 30캡슐 기프트박스 — 첫 방송 기념 20% 할인.",
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:42:25.782Z',
  },
  {
    id: 'bc-default-2',
    channel: '현대홈쇼핑 +Shop',
    scheduledAt: '2026-05-02T20:00:00.000Z',
    durationMinutes: 60,
    host: '정지영',
    productIds: ['cham-oil-capsule', 'cham-pill-chimhyang'],
    specialPrice: 398000,
    regularPrice: 498000,
    discountRate: 20,
    description: "대라천 '참'침향 오일 캡슐 + 침향단(沈香丹) 더블 세트 한정 구성.",
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:45:00.000Z',
  },
  {
    id: 'bc-default-3',
    channel: 'CJ온스타일',
    scheduledAt: '2026-05-08T11:00:00.000Z',
    durationMinutes: 45,
    host: '유난희',
    productIds: ['cham-water', 'cham-tea-paramignya'],
    specialPrice: 168000,
    regularPrice: 215000,
    discountRate: 22,
    description: '25년산 침향수 500ml + 베트남 전통 파라미냐차 30포 데일리 웰니스 세트.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:46:00.000Z',
  },
  {
    id: 'bc-default-4',
    channel: 'GS샵',
    scheduledAt: '2026-05-15T21:00:00.000Z',
    durationMinutes: 60,
    host: '김나연',
    productIds: ['cham-oil-raw'],
    specialPrice: 588000,
    regularPrice: 650000,
    discountRate: 10,
    description: '25년산 침향 에센셜 오일 1ml — 72시간 고온증류 추출 프리미엄 라인.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:47:00.000Z',
  },
  {
    id: 'bc-default-5',
    channel: '롯데홈쇼핑',
    scheduledAt: '2026-05-22T15:00:00.000Z',
    durationMinutes: 60,
    host: '박미선',
    productIds: ['cham-pill-gibo'],
    specialPrice: 438000,
    regularPrice: 480000,
    discountRate: 9,
    description: '기보단(氣寶丹) — 25년산 침향·동충하초·제비집 복합 환 한정 방송.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:48:00.000Z',
  },
  {
    id: 'bc-default-6',
    channel: '현대홈쇼핑',
    scheduledAt: '2026-05-30T20:00:00.000Z',
    durationMinutes: 60,
    host: '정지영',
    productIds: ['cham-tea-paramignya', 'cham-water'],
    specialPrice: 188000,
    regularPrice: 215000,
    discountRate: 13,
    description: '파라미냐차 + 침향수 데일리 웰니스 세트 — 선물용 프리미엄 구성.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:49:00.000Z',
  },
];

function formatChannelLogo(channel: string): string {
  const c = channel.toUpperCase();
  if (c.includes('롯데') || c.includes('LOTTE')) return 'L';
  if (c.includes('현대') || c.includes('HYUNDAI')) return 'H';
  if (c.includes('CJ')) return 'C';
  if (c.includes('GS')) return 'G';
  if (c.includes('NS')) return 'N';
  return c.slice(0, 1);
}

const KST = 'Asia/Seoul';

/** ISO → KST 연/월/일 + 'PM 9:40' 형태 시간 라벨. 달력 셀 배치는 KST 기준이라
 *  클라이언트 타임존과 무관하게 서버에서 파생값을 계산해 내려보낸다. */
function kstParts(iso: string): { year: number; month: number; day: number; timeLabel: string } {
  const d = new Date(iso);
  const dp = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d);
  const num = (t: string) => Number(dp.find((p) => p.type === t)?.value ?? '0');
  const tp = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const hour = tp.find((p) => p.type === 'hour')?.value ?? '';
  const minute = tp.find((p) => p.type === 'minute')?.value ?? '';
  const ap = (tp.find((p) => p.type === 'dayPeriod')?.value ?? '').toUpperCase();
  return { year: num('year'), month: num('month'), day: num('day'), timeLabel: `${ap} ${hour}:${minute}` };
}

/** 오늘(KST)을 'Y-M-D'(zero-pad 없음) 로 — 달력 셀 키와 동일 포맷. */
function kstTodayKey(): string {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value ?? '0');
  return `${v('year')}-${v('month')}-${v('day')}`;
}

/** 홈쇼핑 방송 목록 → 달력/카드용 직렬화. effectiveStatus 로 '예정/지난' 을
 *  시각 기준으로 보정하고, soldOut 플래그를 그대로 실어 보낸다. */
function buildCalEvents(list: Broadcast[], nowMs: number): CalBroadcast[] {
  return list.map((b) => {
    const eff = effectiveStatus(b);
    const isPast = eff !== 'live' && new Date(b.scheduledAt).getTime() < nowMs;
    const p = kstParts(b.scheduledAt);
    return {
      id: b.id,
      channel: b.channel,
      channelLogo: formatChannelLogo(b.channel),
      year: p.year,
      month: p.month,
      day: p.day,
      timeLabel: p.timeLabel,
      dateTimeLabel: formatBroadcastDateTime(b.scheduledAt),
      title: b.description || b.preview?.headline || '대라천 침향 특별 방송',
      ...(b.specialPrice ? { specialPrice: b.specialPrice } : {}),
      ...(b.discountRate ? { discountRate: b.discountRate } : {}),
      ...(b.host ? { host: b.host } : {}),
      status: eff,
      isPast,
      soldOut: Boolean(b.soldOut),
      hasReplay: eff === 'ended' && Boolean(b.vodUrl),
    };
  });
}

/** NS 홈쇼핑이 제작한 브랜드 영상 4종 — Drive 에서 다운받아 Vercel Blob 에 업로드된 mp4.
 *  외부 CDN 의존 금지 원칙에 따라 자체 인프라(Blob)에서만 호스팅.
 *  추후 어드민에서 편집 가능하도록 pages.json 의 homeShopping.nsVideos 로 옮길 수 있음. */
const NS_BRAND_VIDEOS_FALLBACK: NsBrandVideo[] = [
  {
    id: 'ns-title',
    kicker: 'OPENING',
    title: '대라천 침향 — 타이틀',
    url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/ns-brand-videos/ns-title-5zHJXMWFYrgkS9w071NjKlJypJLIje.mp4',
  },
  {
    id: 'ns-showroom',
    kicker: 'SHOWROOM',
    title: '대라천 침향 — 쇼룸',
    url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/ns-brand-videos/ns-showroom-uV5DLMRkwrdC8J0scFqDa3qgNszM3C.mp4',
  },
  {
    id: 'ns-vietnam',
    kicker: 'ON-SITE',
    title: '대라천 침향 — 베트남 현지',
    url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/ns-brand-videos/ns-vietnam-bKw2D2xTmDJIyc0MEfj5nloZzcDs5D.mp4',
  },
  {
    id: 'ns-ceo',
    kicker: 'INTERVIEW',
    title: '대라천 침향 — 문경수 대표',
    url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/ns-brand-videos/ns-ceo-jywrU6pqSUDkXkrI0wOKd8UnphiAZK.mp4',
  },
];

export default async function HomeShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  // Uncached read — 어드민에서 vodUrl 등을 비웠을 때 즉시 반영. 캐시 태그
  // 전파 지연으로 stale 가 보이는 사고를 막는다. 트래픽 낮으니 OK.
  const dbBroadcasts = await readDataUncached<Broadcast>('broadcasts');
  const pagesData = await readSingleSafe<{
    homeShopping?: {
      hero?: HomeShoppingHero;
      nsHead?: Partial<NsHead>;
      nsSoldOut?: Partial<NsSoldOut>;
      nsSoldOuts?: Partial<NsSoldOut>[];
      nsHeroFallback?: Partial<NsHeroFallback>;
      nsVideos?: NsBrandVideo[];
    };
  }>('pages');
  const hero: HomeShoppingHero = { ...DEFAULT_HOME_SHOPPING_HERO, ...pagesData?.homeShopping?.hero };
  const nsHead: NsHead = { ...DEFAULT_NS_HEAD, ...pagesData?.homeShopping?.nsHead };
  // 매진 배너는 1개 이상 노출 가능(1차·2차 …). nsSoldOuts 배열이 있으면 그대로,
  // 없으면 레거시 단일 nsSoldOut(또는 기본값)을 한 장짜리 배열로 승격.
  const nsSoldOutsRaw = pagesData?.homeShopping?.nsSoldOuts;
  const soldOutList: NsSoldOut[] =
    Array.isArray(nsSoldOutsRaw) && nsSoldOutsRaw.length > 0
      ? nsSoldOutsRaw.map((s) => ({ ...DEFAULT_NS_SOLD_OUT, ...s }))
      : [{ ...DEFAULT_NS_SOLD_OUT, ...pagesData?.homeShopping?.nsSoldOut }];
  const nsHeroFallback: NsHeroFallback = { ...DEFAULT_NS_HERO_FALLBACK, ...pagesData?.homeShopping?.nsHeroFallback };
  const nsVideos: NsBrandVideo[] =
    pagesData?.homeShopping?.nsVideos && pagesData.homeShopping.nsVideos.length > 0
      ? pagesData.homeShopping.nsVideos
      : NS_BRAND_VIDEOS_FALLBACK;
  const allRawBeforeSplit = dbBroadcasts.length > 0 ? dbBroadcasts : DEFAULT_BROADCASTS;
  // mixed 레코드(홈쇼핑+협찬방송 동거)를 in-memory 로 분리. 어드민 GET 에서
  // 영구 저장하므로 첫 어드민 방문 후엔 멱등 no-op.
  const { list: allRaw } = autoSplitMixed(allRawBeforeSplit);
  // 비공개 제외. published 미설정은 공개로 간주(기존 데이터 호환).
  const all = allRaw.filter((b) => b.published !== false);
  // 홈쇼핑(가격 카드) vs 협찬방송(프로그램 카드) 분리. 미지정 → 'home-shopping'.
  const hs = all.filter((b) => (b.broadcastType ?? 'home-shopping') === 'home-shopping');
  const sponsored = all.filter((b) => b.broadcastType === 'sponsored');

  const sorted = [...hs].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const sponsoredSorted = [...sponsored].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  const now = Date.now();
  const upcoming = sorted.filter(
    (b) => b.status === 'scheduled' && new Date(b.scheduledAt).getTime() >= now
  );
  // 우선순위: 라이브 → 다음 예정 → 가장 최근 종료(다시보기 노출용)
  const live = sorted.find((b) => b.status === 'live');
  const recentEnded = [...sorted]
    .reverse()
    .find((b) => b.status === 'ended');
  let featured = live ?? upcoming[0] ?? recentEnded;

  // 디자인 미리보기 — ?preview=ended 쿼리로 다시보기 UI 강제 노출.
  // 임시 데이터 주입(상태만 변경, 더미 URL 은 넣지 않음 — 실제 VOD 가 입력될 때까지 포스터 풀백 사용).
  if (preview === 'ended' && featured) {
    featured = { ...featured, status: 'ended' };
  }

  // featured 방송에 자체 영상이 없을 때 상단 모니터(BroadcastCountdown 미디어 프레임)를
  // 빈 ‘방송 예정’ 포스터로 두지 않고 NS홈쇼핑 제작 브랜드 영상으로 채운다.
  // (영상 없는 ‘예정’ 방송이 featured 로 잡혀 모니터가 비어 보이던 문제 대응)
  const nsMonitorFallbackUrl = (nsVideos.find((v) => v.id === 'ns-showroom') ?? nsVideos[0])?.url;

  // 편성 캘린더 — 홈쇼핑(공개) 회차 전체를 KST 파생값으로 직렬화해 클라이언트에 전달.
  const calEvents = buildCalEvents(sorted, now);
  const todayKey = kstTodayKey();

  const broadcastJsonLd = buildBroadcastJsonLd(all);

  return (
    <>
      {broadcastJsonLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      {/* SCHEDULE · 홈쇼핑 편성 캘린더 — 페이지 최상단. 월 달력 + 예정/지난 방송 탭 + 회차 카드. */}
      <section className={styles.sched} id="sched">
        <div className={styles.wrap}>
          <div className={styles.schedHead}>
            <h2>
              홈쇼핑 <em>편성 캘린더</em>
            </h2>
          </div>

          {calEvents.length === 0 ? (
            <div className={styles.empty}>등록된 방송 일정이 없습니다.</div>
          ) : (
            <BroadcastCalendar broadcasts={calEvents} todayKey={todayKey} />
          )}
        </div>
      </section>

      {/* NS 홈쇼핑 제작 브랜드 영상 — 방송 종료 후 다시보기 갤러리 */}
      <section className={styles.ns} id="ns-videos">
        <div className={styles.wrap}>
          <div className={styles.nsHead}>
            <div className={styles.nsKicker}>{nsHead.kicker}</div>
            <h2>
              {nsHead.titleLead}
              <em>{nsHead.titleEmphasis}</em>
            </h2>
            <p className={styles.nsLede}>{nsHead.lede}</p>
          </div>

          {/* SOLD-OUT 배너 — NS Shop+ 방송에서 매진된 인증 화면. 1차·2차 … 순서대로 스택. */}
          {soldOutList.map((so, i) => (
            <div className={styles.nsSoldOut} key={`${so.imageUrl}-${i}`}>
            <div className={styles.nsSoldOutFrame}>
              <img
                src={so.imageUrl}
                alt={so.imageAlt}
                loading="lazy"
              />
              {so.stampLabel && (
                <span className={styles.nsSoldOutStamp} aria-hidden>
                  {so.stampLabel.replace(/ /g, ' ')}
                </span>
              )}
            </div>
            <div className={styles.nsSoldOutMeta}>
              {so.kicker && <div className={styles.nsSoldOutKicker}>{so.kicker}</div>}
              <h3
                className={styles.nsSoldOutTitle}
                dangerouslySetInnerHTML={{ __html: so.titleHtml }}
              />
              {so.body && <p className={styles.nsSoldOutBody}>{so.body}</p>}
              <dl className={styles.nsSoldOutFacts}>
                {so.factChannel && (
                  <div>
                    <dt>채널</dt>
                    <dd>{so.factChannel}</dd>
                  </div>
                )}
                {so.factComposition && (
                  <div>
                    <dt>구성</dt>
                    <dd>{so.factComposition}</dd>
                  </div>
                )}
                {so.factResult && (
                  <div>
                    <dt>결과</dt>
                    <dd>{so.factResult}</dd>
                  </div>
                )}
              </dl>
            </div>
            </div>
          ))}

          <NsBrandVideoGallery videos={nsVideos} />
        </div>
      </section>

      {/* HERO + LIVE CARD */}
      <section className={styles.hero} id="live">
        <div className={styles.wrap}>
          <div className={styles.heroHead}>
            <h1>
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
            </h1>
            <p className={styles.lede}>
              {hero.lede}
            </p>
          </div>

          {featured ? (
            <div className={styles.live}>
              <div>
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  {featured.status === 'live'
                    ? 'ON AIR · 지금 방송 중'
                    : featured.status === 'ended'
                      ? 'REPLAY · 지난 방송 다시보기'
                      : 'NEXT LIVE · 다음 방송'}
                </div>
                <h2>
                  {featured.channel}
                  {featured.specialPrice ? (
                    <>
                      {' — '}
                      <em>특별가 {featured.specialPrice.toLocaleString()}원</em>
                    </>
                  ) : null}
                </h2>
                {featured.description && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, maxWidth: 720 }}>
                    {featured.description}
                  </p>
                )}
                <div className={styles.liveMeta}>
                  {featured.host && <span><b>MC</b> · {featured.host}</span>}
                  <span>
                    <b>일시</b> · {formatBroadcastDateTime(featured.scheduledAt)}
                  </span>
                </div>
                <div className={styles.ctas}>
                  <a href="tel:070-4140-4086" className={styles.btnLive}>
                    ● 전화 주문 070-4140-4086
                  </a>
                </div>
              </div>
              <div>
                <BroadcastCountdown
                  scheduledAt={featured.scheduledAt}
                  channel={featured.channel}
                  status={featured.status}
                  vodUrl={featured.vodUrl || nsMonitorFallbackUrl}
                  inlineUntil={featured.inlineUntil}
                  showTitle={featured.showInfo?.title}
                  showEpisode={featured.showInfo?.episode}
                  showLogo={featured.showInfo?.logo || undefined}
                />
              </div>
            </div>
          ) : (
            <div className={styles.live}>
              <div>
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  {nsHeroFallback.tag}
                </div>
                <h2 dangerouslySetInnerHTML={{ __html: nsHeroFallback.titleHtml }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, maxWidth: 720 }}>
                  {nsHeroFallback.body}
                </p>
                <div className={styles.liveMeta}>
                  {nsHeroFallback.metaChannel && <span><b>채널</b> · {nsHeroFallback.metaChannel}</span>}
                  {nsHeroFallback.metaShow && <span><b>방송</b> · {nsHeroFallback.metaShow}</span>}
                  {nsHeroFallback.metaResult && <span><b>결과</b> · {nsHeroFallback.metaResult}</span>}
                </div>
                <div className={styles.ctas}>
                  {nsHeroFallback.ctaPrimaryLabel && nsHeroFallback.ctaPrimaryHref && (
                    <a href={nsHeroFallback.ctaPrimaryHref} className={styles.btnNotify}>
                      {nsHeroFallback.ctaPrimaryLabel}
                    </a>
                  )}
                  {nsHeroFallback.ctaPhone && (
                    <a href={`tel:${nsHeroFallback.ctaPhone}`} className={styles.btnLive}>
                      ● 전화 주문 {nsHeroFallback.ctaPhone}
                    </a>
                  )}
                </div>
              </div>
              <div>
                {(() => {
                  const heroVideo = nsVideos.find((v) => v.id === 'ns-showroom') ?? nsVideos[0];
                  if (!heroVideo) return null;
                  return (
                    <div className={styles.heroVod}>
                      <video
                        src={heroVideo.url}
                        title={`NS홈쇼핑 — ${heroVideo.title} (방송 다시보기)`}
                        controls
                        preload="metadata"
                        playsInline
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SHOW SYNOPSIS — 다음 방송의 프로그램 개요 (showInfo 가 있는 경우만) */}
      {featured?.showInfo && (
        (() => {
          const si = featured.showInfo!;
          const hasCast = (si.hosts?.length || 0) + (si.panels?.length || 0) + (si.guests?.length || 0) + (si.experts?.length || 0) > 0;
          if (!si.title && !si.synopsis && !hasCast) return null;
          return (
            <section className={styles.synopsis}>
              <div className={styles.wrap}>
                <div className={styles.synopsisHead}>
                  <div className={styles.synopsisKicker}>Programme · 방송 개요</div>
                  <h2>
                    {si.title ?? '프로그램 안내'}
                    {si.episode && <em> · {si.episode}</em>}
                  </h2>
                </div>

                <div className={styles.synopsisGrid}>
                  {si.synopsis && (
                    <div className={styles.synopsisBody}>
                      <p>{si.synopsis}</p>
                    </div>
                  )}

                  {hasCast && (
                    <dl className={styles.synopsisCast}>
                      {si.hosts && si.hosts.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>진행</dt>
                          <dd>{si.hosts.join(' · ')}</dd>
                        </div>
                      )}
                      {si.panels && si.panels.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>패널</dt>
                          <dd>{si.panels.join(' · ')}</dd>
                        </div>
                      )}
                      {si.guests && si.guests.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>게스트</dt>
                          <dd>{si.guests.join(' · ')}</dd>
                        </div>
                      )}
                      {si.experts && si.experts.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>전문가</dt>
                          <dd>{si.experts.join(' · ')}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </div>
            </section>
          );
        })()
      )}

      {/* SPONSORED · 협찬방송 — 한 행 2열(설명 좌 · 영상 우) 으로 정렬,
          홈쇼핑의 LIVE 카드 골격을 차용하되 보라 액센트로 차별화. */}
      {sponsoredSorted.length > 0 && (
        <section className={styles.sponsored} id="sponsored">
          <div className={styles.wrap}>
            <div className={styles.sponsoredHead}>
              <div className={styles.sponsoredKicker}>SPONSORED · 협찬방송</div>
              <h2>
                조엘라이프가 <em>협찬한 방송</em>
              </h2>
              <p className={styles.sponsoredLede}>
                건강한 중장년의 라이프스타일을 다루는 정보·교양 프로그램 [퍼펙트 라이프]에 등장한 ‘진짜 침향’에 대해 확인해보세요.
              </p>
            </div>

            <div className={styles.spList}>
              {sponsoredSorted.map((b) => {
                const si = b.showInfo ?? {};
                const cast: Array<{ label: string; names: string[] }> = [];
                if (si.hosts?.length) cast.push({ label: '진행', names: si.hosts });
                if (si.panels?.length) cast.push({ label: '패널', names: si.panels });
                if (si.guests?.length) cast.push({ label: '게스트', names: si.guests });
                if (si.experts?.length) cast.push({ label: '전문가', names: si.experts });

                const effectiveVod = b.vodUrl || sponsoredVodFallback(b);
                // 유효기간이 지나면 인라인 임베드를 막고 외부 유튜브 아웃링크로 전환.
                const expired = isInlineExpired(b);
                const yt = !expired && effectiveVod ? extractEmbed(effectiveVod) : null;
                const directVid =
                  !expired && !yt && effectiveVod && isDirectVideoUrl(effectiveVod) ? effectiveVod : null;
                const outlink = expired && effectiveVod ? toWatchUrl(effectiveVod) : null;
                return (
                  <article key={b.id} className={styles.spRow}>
                    <div className={styles.spInfo}>
                      <div className={styles.spChannelTag}>
                        <span className={styles.spChannelDot} />
                        {b.channel}
                      </div>
                      <h3 className={styles.spTitle}>
                        {si.title ?? b.channel}
                        {si.episode && <em> · {si.episode}</em>}
                      </h3>
                      {si.synopsis && <p className={styles.spSynopsis}>{si.synopsis}</p>}
                      {cast.length > 0 && (
                        <dl className={styles.spCast}>
                          {cast.map((c) => (
                            <div key={c.label} className={styles.spCastRow}>
                              <dt>{c.label}</dt>
                              <dd>{c.names.join(' · ')}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <div className={styles.spMeta}>
                        <span>
                          <b>방송</b> · {formatBroadcastDateTime(b.scheduledAt)}
                        </span>
                        {(() => {
                          const eff = effectiveStatus(b);
                          return (
                            <span className={styles.spStatus} data-status={eff}>
                              {STATUS_LABEL[eff]}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className={styles.spVideo}>
                      {yt ? (
                        <iframe
                          src={yt}
                          title={si.title ?? b.channel}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      ) : directVid ? (
                        <video
                          src={directVid}
                          controls
                          preload="metadata"
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }}
                        />
                      ) : outlink ? (
                        <a
                          className={styles.spVideoLink}
                          href={outlink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className={styles.spVideoLinkPlay} aria-hidden>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                              <circle cx="12" cy="12" r="10" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5l5 3.5-5 3.5v-7z" />
                            </svg>
                          </span>
                          <span className={styles.spVideoLinkChannel}>{si.title ?? b.channel}</span>
                          <span className={styles.spVideoLinkCta}>유튜브에서 시청 →</span>
                        </a>
                      ) : (
                        <div className={styles.spVideoEmpty}>
                          <span className={styles.spVideoEmptyDot}>●</span>
                          영상 준비 중
                        </div>
                      )}
                    </div>
                    {b.preview?.enabled && b.preview.isPublic && (
                      <div className={styles.spPreviewWrap}>
                        <BroadcastPreviewBlock preview={b.preview} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** 방송 미리보기/요약 블록 — 헤드라인 + 본문 + YouTube 챕터식 타임라인 + 침향 핵심 포인트.
 *  preview.isPublic 검사는 호출부에서 수행. */
function BroadcastPreviewBlock({ preview }: { preview: NonNullable<Broadcast['preview']> }) {
  const highlights = preview.highlights ?? [];
  const keyPoints = preview.keyPoints ?? [];
  if (!preview.headline && !preview.summary && highlights.length === 0 && keyPoints.length === 0) {
    return null;
  }
  return (
    <div className={styles.preview}>
      <div className={styles.previewKicker}>Recap · 방송 다시보기 요약</div>
      {preview.headline && <h3 className={styles.previewHeadline}>{preview.headline}</h3>}
      {preview.summary && <p className={styles.previewSummary}>{preview.summary}</p>}

      {highlights.length > 0 && (
        <ol className={styles.previewChapters}>
          {highlights.map((h, i) => (
            <li key={i} className={styles.previewChapter}>
              <span className={styles.previewChapterTime}>
                {h.timestamp && h.timestamp.trim() ? h.timestamp : `${String(i + 1).padStart(2, '0')}`}
              </span>
              <div className={styles.previewChapterBody}>
                <span className={styles.previewChapterTitle}>{h.title}</span>
                {h.description && <span className={styles.previewChapterDesc}>{h.description}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {keyPoints.length > 0 && (
        <div className={styles.previewKeys}>
          <div className={styles.previewKeysHead}>침향, 이 방송에서 짚는 핵심</div>
          <ul className={styles.previewKeysList}>
            {keyPoints.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** mp4/webm 등 native <video> 재생 가능한 URL 인지 확인. */
function isDirectVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(u.pathname);
  } catch {
    return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url);
  }
}

/** YouTube `t=90s` / `t=1m30s` / `start=90` 등을 초로 환산. 실패 시 0. */
function parseYouTubeStartSeconds(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  // 1h2m3s / 2m30s / 45s 형태 파싱
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

/** YouTube/Vimeo URL 을 임베드 가능한 src 로 변환. 실패 시 null.
 *  YouTube 의 `t` / `start` 시작 시간 파라미터는 임베드 URL 의 `start` 로 보존. */
function extractEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('?')[0];
      if (!id) return null;
      const start = parseYouTubeStartSeconds(u.searchParams.get('t') ?? u.searchParams.get('start'));
      return `https://www.youtube.com/embed/${id}${start > 0 ? `?start=${start}` : ''}`;
    }
    // youtube.com/watch?v=<id> / shorts/<id> / embed/<id>
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      const start = parseYouTubeStartSeconds(u.searchParams.get('t') ?? u.searchParams.get('start'));
      const suffix = start > 0 ? `?start=${start}` : '';
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}${suffix}`;
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}${suffix}`;
    }
    // vimeo.com/<id>
    if (u.hostname.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** 협찬방송이 어드민에서 vodUrl 미입력 상태일 때 노출할 코드측 fallback.
 *  ‘퍼펙트 라이프 287회’는 4:30 부터 침향 본편이 시작되므로 `t=270` 으로 시작. */
function sponsoredVodFallback(b: Broadcast): string | null {
  const title = b.showInfo?.title?.trim();
  const episode = b.showInfo?.episode?.trim();
  if (title === '퍼펙트 라이프' && episode === '287회') {
    return 'https://www.youtube.com/watch?v=sUSdoAHiNXU&t=270s';
  }
  return null;
}
