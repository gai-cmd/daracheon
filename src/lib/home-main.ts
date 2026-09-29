import { SNS_SAMPLE } from '@/data/sns-sample';
import type { SnsInstagramAccount, SnsPost, SnsVideo, SnsYoutubeChannel } from '@/lib/sns';

/**
 * 메인 홈(/) 편집 데이터 — pages.homeMain.
 *
 * 서버 페이지(src/app/page.tsx)와 어드민 화면(/admin/pages/home-main)이 함께 쓰므로
 * 서버 전용 import 를 두지 않는다.
 *
 * - 저장값(HomeMainStored)은 섹션·필드 단위로 전부 선택이다. 저장된 게 없으면
 *   HOME_MAIN_DEFAULTS(= 벤토 메인을 처음 올릴 때의 하드코딩 문구)가 그대로 나온다.
 * - resolveHomeMain 은 필드마다 방어한다. 잘못된 값은 그 칸만 기본값으로 돌린다.
 * - 외부 CDN 금지 원칙: 영상·이미지는 우리 Blob 또는 "/" 로 시작하는 번들 자산만 통과.
 *
 * 여러 줄 제목 표기: 줄바꿈(엔터) = 줄바꿈, *텍스트* = 강조. parseEmphasis 가 토큰으로 나눈다.
 */

export const HOME_MAIN_BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

/* ───────────── 렌더용(해석 완료) 모양 ───────────── */

export interface HomeMainLink {
  label: string;
  href: string;
}

export interface HomeMainIntro {
  badgeChip: string;
  badgeText: string;
  /** 줄바꿈·*강조* 표기 */
  headline: string;
  /** 줄바꿈(데스크톱에서만)·*줄바꿈 안 할 구절* 표기 */
  subline: string;
  primary: HomeMainLink;
  secondary: HomeMainLink;
}

export interface HomeMainNews {
  chip: string;
  label: string;
  /** *강조* 표기 */
  title: string;
}

export interface HomeMainStat {
  value: number;
  unit: string;
  label: string;
}

export interface HomeMainTiles {
  hero: { chip: string; kicker: string; title: string; sub: string; href: string; video: string; poster: string };
  onair: { kicker: string; title: string; sub: string; href: string; video: string };
  stats: { kicker: string };
  ring: { kicker: string; title: string; latin: string; note: string; href: string; image: string };
  brand: { kicker: string; title: string; sub: string; href: string; image: string; video: string };
  showroom: { kicker: string; title: string; href: string; video: string; poster: string };
}

export interface HomeMainClosing {
  /** *강조* 표기 */
  line: string;
  primary: HomeMainLink;
  secondary: HomeMainLink;
}

export interface HomeMain {
  intro: HomeMainIntro;
  news: HomeMainNews;
  stats: HomeMainStat[];
  marquee: string[];
  tiles: HomeMainTiles;
  closing: HomeMainClosing;
  youtube: SnsYoutubeChannel;
  instagram: SnsInstagramAccount;
}

/* ───────────── 저장 모양 (전부 선택) ───────────── */

type Loose<T> = { [K in keyof T]?: T[K] extends object ? Loose<T[K]> : T[K] | string };

export interface HomeMainStored {
  intro?: Loose<HomeMainIntro>;
  news?: Loose<HomeMainNews>;
  stats?: { value?: number | string; unit?: string; label?: string }[];
  marquee?: string[];
  tiles?: Loose<HomeMainTiles>;
  closing?: Loose<HomeMainClosing>;
  youtube?: {
    name?: string;
    handle?: string;
    url?: string;
    videos?: { id?: string; title?: string; publishedAt?: string; thumbnail?: string }[];
  };
  instagram?: {
    handle?: string;
    url?: string;
    posts?: { id?: string; permalink?: string; image?: string; caption?: string }[];
  };
}

/** 어드민 섹션 = 저장 객체의 최상위 키. 섹션별로 따로 저장·되돌리기 한다. */
export type HomeMainSectionKey = keyof HomeMainStored;

/* ───────────── 기본값 = 현재 메인 문구 ───────────── */

// 영상은 원본(16~44MB)이 아니라 5MB 이하(H.264·faststart·무음)로 다시 인코딩한 6~9초 루프를 쓴다.
// 원본은 다른 페이지가 그대로 쓰므로 건드리지 않고, 새 경로 uploads/home-main/ 에 따로 올렸다.
const B = HOME_MAIN_BLOB;

export const HOME_MAIN_DEFAULTS: HomeMain = {
  intro: {
    badgeChip: '25년 이상',
    badgeText: '베트남 직영 농장에서 기른 침향',
    headline: '묘목부터 증류까지,\n직접 키운 *진짜 침향*',
    subline: '식약처 고시 학명 *Aquilaria Agallocha Roxburgh*.\n원산지부터 직접 책임지는 대라천 ‘참’침향입니다.',
    primary: { label: '제품 보기', href: '/products' },
    secondary: { label: '진짜 침향 구별법', href: '/about-agarwood' },
  },
  news: { chip: 'NEW', label: '소식', title: '새로 올라온 *대라천 소식*' },
  stats: [
    { value: 25, unit: '년 이상', label: '연구 및 생산재배' },
    { value: 200, unit: 'ha', label: '직영 농장 합계' },
    { value: 5, unit: '개 지역', label: '베트남 직영' },
    { value: 12, unit: '건 이상', label: '인증·특허' },
  ],
  marquee: [
    '식약처 고시 학명 Aquilaria Agallocha Roxburgh',
    '베트남 직영 농장 25년 이상',
    '베트남 5개 지역 직영 농장 약 200ha',
    '원산지부터 직접 책임',
    '묘목부터 채취·증류까지',
    '인증·특허 12건 이상',
  ],
  tiles: {
    hero: {
      chip: '농장 영상',
      kicker: '침향 농장 이야기',
      title: '베트남 직영 농장,\n침향 분류 작업 현장',
      sub: '묘목부터 채취·증류까지, 영상과 사진으로 전합니다',
      href: '/media',
      video: `${B}/uploads/home-main/farm-loop.mp4`,
      poster: `${B}/uploads/home-main/farm-poster.jpg`,
    },
    onair: {
      kicker: '홈쇼핑 방송',
      title: 'On-Air 특별관',
      sub: '방송 다시보기',
      href: '/home-shopping',
      video: `${B}/uploads/home-main/onair-loop.mp4`,
    },
    stats: { kicker: '숫자로 보는 대라천' },
    ring: {
      kicker: '진짜 침향 구별법',
      title: '진짜 침향은 학명부터 확인합니다',
      latin: 'Aquilaria Agallocha Roxburgh',
      note: '식약처 고시 학명 · 인증 · 산지로 가려내는 법',
      href: '/about-agarwood',
      image: `${B}/uploads/pages/species-card-roxburgh.jpg`,
    },
    brand: {
      kicker: '브랜드 이야기',
      title: '25년 이상, 원산지부터 직접 잇습니다',
      sub: '베트남 직영 생산부터 한국 직판까지',
      href: '/brand-story',
      image: `${B}/pages/hero/company-hero-default.jpg`,
      video: `${B}/uploads/home-main/brand-loop.mp4`,
    },
    showroom: {
      kicker: '전시장',
      title: '원목부터 완제품까지, 직접 보고 맡아 보세요',
      href: '/showroom',
      video: `${B}/uploads/home-main/showroom-loop.mp4`,
      poster: `${B}/uploads/home-main/showroom-poster.jpg`,
    },
  },
  closing: {
    line: '진짜 침향, *직접 확인해 보세요*',
    primary: { label: '문의하기', href: '/company#contact' },
    secondary: { label: '전시장 둘러보기', href: '/showroom' },
  },
  // 공식 채널 기본 목록은 정적 스냅샷(src/data/sns-sample.ts)을 그대로 쓴다.
  youtube: SNS_SAMPLE.youtube,
  instagram: SNS_SAMPLE.instagram,
};

export const HOME_MAIN_LIMITS = { stats: 4, marquee: 12, videos: 6, posts: 12 } as const;

/* ───────────── 검사 도우미 ───────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** "/" 로 시작하되 "//"·"/\" 가 아닌 사이트 내부 경로. (브라우저는 "/\" 도 다른 호스트로 해석한다) */
function isInternalPath(v: string): boolean {
  return /^\/(?![/\\])/.test(v) && !/[\s\\]/.test(v);
}

/** 외부 CDN 금지 원칙 — 우리 Blob 또는 번들 자산("/…")만 통과시킨다. */
export function isOwnAsset(url?: string): url is string {
  if (typeof url !== 'string') return false;
  return url.startsWith(`${HOME_MAIN_BLOB}/`) || isInternalPath(url);
}

/** 어드민이 입력한 링크 — 사이트 내부 경로와 http(s) 만 통과시킨다. */
export function safeHref(raw?: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (isInternalPath(v)) return v;
  return /^https?:\/\/[^\s/\\]+[^\s]*$/i.test(v) ? v : null;
}

function text(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function href(v: unknown, fallback: string): string {
  return safeHref(v) ?? fallback;
}

function asset(v: unknown, fallback: string): string {
  const s = typeof v === 'string' ? v.trim() : '';
  return isOwnAsset(s) ? s : fallback;
}

function link(v: unknown, d: HomeMainLink): HomeMainLink {
  const o = isRecord(v) ? v : {};
  return { label: text(o.label, d.label), href: href(o.href, d.href) };
}

function statValue(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.trim()) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const IG_PREFIX = 'https://www.instagram.com/';

/** 유튜브 영상 ID — 11자 (영문·숫자·_·-). */
export function isYoutubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

/** 인스타그램 게시물·릴스 원문 링크 — https://www.instagram.com/ 로 시작하고 공백이 없어야 한다. */
export function isInstagramPermalink(url: string): boolean {
  return url.startsWith(IG_PREFIX) && !/\s/.test(url);
}

/** 릴스·게시물 링크의 마지막 경로 조각(코드)을 React key 용 id 로 쓴다. */
function instagramCode(permalink: string): string {
  const parts = permalink.slice(IG_PREFIX.length).split(/[?#]/)[0].split('/').filter(Boolean);
  return parts[parts.length - 1] ?? permalink;
}

/* ───────────── 섹션별 해석 ───────────── */

function resolveIntro(v: unknown): HomeMainIntro {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.intro;
  return {
    badgeChip: text(o.badgeChip, d.badgeChip),
    badgeText: text(o.badgeText, d.badgeText),
    headline: text(o.headline, d.headline),
    subline: text(o.subline, d.subline),
    primary: link(o.primary, d.primary),
    secondary: link(o.secondary, d.secondary),
  };
}

function resolveNews(v: unknown): HomeMainNews {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.news;
  return { chip: text(o.chip, d.chip), label: text(o.label, d.label), title: text(o.title, d.title) };
}

function resolveStats(v: unknown): HomeMainStat[] {
  const out: HomeMainStat[] = [];
  for (const item of Array.isArray(v) ? v : []) {
    if (!isRecord(item)) continue;
    const value = statValue(item.value);
    const label = text(item.label, '');
    if (value === null || !label) continue;
    out.push({ value, unit: typeof item.unit === 'string' ? item.unit.trim() : '', label });
    if (out.length >= HOME_MAIN_LIMITS.stats) break;
  }
  return out.length ? out : HOME_MAIN_DEFAULTS.stats.map((s) => ({ ...s }));
}

function resolveMarquee(v: unknown): string[] {
  const out = (Array.isArray(v) ? v : [])
    .filter((m): m is string => typeof m === 'string' && !!m.trim())
    .map((m) => m.trim())
    .slice(0, HOME_MAIN_LIMITS.marquee);
  return out.length ? out : [...HOME_MAIN_DEFAULTS.marquee];
}

function resolveTiles(v: unknown): HomeMainTiles {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.tiles;
  const t = (k: keyof HomeMainTiles) => (isRecord(o[k]) ? (o[k] as Record<string, unknown>) : {});
  const hero = t('hero');
  const onair = t('onair');
  const ring = t('ring');
  const brand = t('brand');
  const showroom = t('showroom');
  return {
    hero: {
      chip: text(hero.chip, d.hero.chip),
      kicker: text(hero.kicker, d.hero.kicker),
      title: text(hero.title, d.hero.title),
      sub: text(hero.sub, d.hero.sub),
      href: href(hero.href, d.hero.href),
      video: asset(hero.video, d.hero.video),
      poster: asset(hero.poster, d.hero.poster),
    },
    onair: {
      kicker: text(onair.kicker, d.onair.kicker),
      title: text(onair.title, d.onair.title),
      sub: text(onair.sub, d.onair.sub),
      href: href(onair.href, d.onair.href),
      video: asset(onair.video, d.onair.video),
    },
    stats: { kicker: text(t('stats').kicker, d.stats.kicker) },
    ring: {
      kicker: text(ring.kicker, d.ring.kicker),
      title: text(ring.title, d.ring.title),
      latin: text(ring.latin, d.ring.latin),
      note: text(ring.note, d.ring.note),
      href: href(ring.href, d.ring.href),
      image: asset(ring.image, d.ring.image),
    },
    brand: {
      kicker: text(brand.kicker, d.brand.kicker),
      title: text(brand.title, d.brand.title),
      sub: text(brand.sub, d.brand.sub),
      href: href(brand.href, d.brand.href),
      image: asset(brand.image, d.brand.image),
      video: asset(brand.video, d.brand.video),
    },
    showroom: {
      kicker: text(showroom.kicker, d.showroom.kicker),
      title: text(showroom.title, d.showroom.title),
      href: href(showroom.href, d.showroom.href),
      video: asset(showroom.video, d.showroom.video),
      poster: asset(showroom.poster, d.showroom.poster),
    },
  };
}

function resolveClosing(v: unknown): HomeMainClosing {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.closing;
  return { line: text(o.line, d.line), primary: link(o.primary, d.primary), secondary: link(o.secondary, d.secondary) };
}

function resolveYoutube(v: unknown): SnsYoutubeChannel {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.youtube;
  const videos: SnsVideo[] = [];
  for (const item of Array.isArray(o.videos) ? o.videos : []) {
    if (!isRecord(item)) continue;
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const thumbnail = typeof item.thumbnail === 'string' ? item.thumbnail.trim() : '';
    // 썸네일이 외부 CDN(i.ytimg.com 등)이면 그 영상은 싣지 않는다.
    if (!isYoutubeId(id) || !isOwnAsset(thumbnail)) continue;
    videos.push({
      id,
      title: text(item.title, ''),
      publishedAt: text(item.publishedAt, ''),
      thumbnail,
    });
    if (videos.length >= HOME_MAIN_LIMITS.videos) break;
  }
  return {
    name: text(o.name, d.name),
    handle: text(o.handle, d.handle),
    url: href(o.url, d.url),
    videos: videos.length ? videos : d.videos.map((x) => ({ ...x })),
  };
}

function resolveInstagram(v: unknown): SnsInstagramAccount {
  const o = isRecord(v) ? v : {};
  const d = HOME_MAIN_DEFAULTS.instagram;
  const posts: SnsPost[] = [];
  for (const item of Array.isArray(o.posts) ? o.posts : []) {
    if (!isRecord(item)) continue;
    const permalink = typeof item.permalink === 'string' ? item.permalink.trim() : '';
    const image = typeof item.image === 'string' ? item.image.trim() : '';
    if (!isInstagramPermalink(permalink) || !isOwnAsset(image)) continue;
    posts.push({
      id: text(item.id, instagramCode(permalink)),
      permalink,
      image,
      caption: text(item.caption, ''),
    });
    if (posts.length >= HOME_MAIN_LIMITS.posts) break;
  }
  return {
    name: d.name,
    handle: text(o.handle, d.handle),
    url: href(o.url, d.url),
    posts: posts.length ? posts : d.posts.map((x) => ({ ...x })),
  };
}

/** 저장값(pages.homeMain) → 렌더용 값. 어떤 입력이 와도 던지지 않는다. */
export function resolveHomeMain(raw: unknown): HomeMain {
  const o = isRecord(raw) ? raw : {};
  return {
    intro: resolveIntro(o.intro),
    news: resolveNews(o.news),
    stats: resolveStats(o.stats),
    marquee: resolveMarquee(o.marquee),
    tiles: resolveTiles(o.tiles),
    closing: resolveClosing(o.closing),
    youtube: resolveYoutube(o.youtube),
    instagram: resolveInstagram(o.instagram),
  };
}

/* ───────────── 여러 줄 제목 표기 파서 ───────────── */

export type EmphasisToken = { type: 'text'; value: string } | { type: 'em'; value: string } | { type: 'br' };

/**
 * "\n" = 줄바꿈, "*텍스트*" = 강조. 강조는 한 줄 안에서만 닫히며,
 * 짝이 없거나 비어 있는 별표("**")는 글자 그대로 둔다. 이웃한 글자 토큰은 하나로 합친다.
 */
export function parseEmphasis(input: string): EmphasisToken[] {
  const tokens: EmphasisToken[] = [];
  const pushText = (value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === 'text') last.value += value;
    else tokens.push({ type: 'text', value });
  };

  input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((line, li) => {
      if (li > 0) tokens.push({ type: 'br' });
      let i = 0;
      while (i < line.length) {
        const open = line.indexOf('*', i);
        if (open === -1) {
          pushText(line.slice(i));
          break;
        }
        const close = line.indexOf('*', open + 1);
        if (close === -1 || close === open + 1) {
          // 짝 없는 별표, 또는 빈 "**" — 글자 그대로
          const end = close === -1 ? line.length : close + 1;
          pushText(line.slice(i, end));
          i = end;
          continue;
        }
        pushText(line.slice(i, open));
        tokens.push({ type: 'em', value: line.slice(open + 1, close) });
        i = close + 1;
      }
    });
  return tokens;
}
