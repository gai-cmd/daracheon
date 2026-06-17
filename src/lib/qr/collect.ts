import { parseUserAgent } from './device';

/**
 * 요청 → 이벤트 환경정보 추출 (geo/device/locale).
 * 원본 IP·전체 UA 는 저장하지 않는다. geo 는 Vercel 엣지 헤더의 코어스 값만,
 * device 는 UA 파싱 결과만 보존(프라이버시 헌법 + PIPA 가명처리).
 */

function safeDecode(v: string | null): string | undefined {
  if (!v) return undefined;
  try {
    const d = decodeURIComponent(v).trim();
    return d || undefined;
  } catch {
    return v.trim() || undefined;
  }
}

export interface GeoInfo {
  country?: string;
  region?: string;
  city?: string;
  /** Vercel 엣지가 추정한 접속 위치 위/경도 (대략값 — 도시 단위, 개인 식별 불가) */
  lat?: number;
  lng?: number;
}

function num(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function getGeo(h: Headers): GeoInfo {
  return {
    country: h.get('x-vercel-ip-country')?.trim() || undefined,
    region: safeDecode(h.get('x-vercel-ip-country-region')),
    city: safeDecode(h.get('x-vercel-ip-city')),
    lat: num(h.get('x-vercel-ip-latitude')),
    lng: num(h.get('x-vercel-ip-longitude')),
  };
}

export interface ClientEnv extends GeoInfo {
  device: ReturnType<typeof parseUserAgent>['device'];
  os: string;
  browser: string;
  isBot: boolean;
  lang?: string;
}

export function getClientEnv(h: Headers): ClientEnv {
  const ua = parseUserAgent(h.get('user-agent'));
  const lang = h.get('accept-language')?.split(',')[0]?.trim() || undefined;
  return { ...getGeo(h), device: ua.device, os: ua.os, browser: ua.browser, isBot: ua.isBot, lang };
}

/** 프리페치/언퍼롤러 — 스캔으로 세지 않기 위한 신호. */
export function isPrefetch(h: Headers): boolean {
  const sp = h.get('sec-purpose') || '';
  const pp = h.get('purpose') || h.get('x-purpose') || '';
  return /prefetch|preview/i.test(sp) || /prefetch|preview/i.test(pp);
}

/** GPC / DNT — 거부 시 vid(재방문 식별)를 설정/기록하지 않는다. */
export function isPrivacyOptOut(h: Headers): boolean {
  return h.get('sec-gpc') === '1' || h.get('dnt') === '1';
}

/** 정렬 가능한 이벤트 id (앞부분이 시간순 → blob pathname 정렬에 유리). */
export function genEventId(): string {
  return `${Date.now().toString(36)}-${randomHex(8)}`;
}

export function randomHex(len: number): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}
