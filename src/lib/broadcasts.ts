// Broadcast 타입 + 데이터 유틸. route.ts 는 핸들러만 export 가능하므로
// 다른 페이지에서 공유할 로직은 이 파일에 둔다.

export type BroadcastType = 'home-shopping' | 'sponsored';

export interface BroadcastShowInfo {
  title?: string;
  episode?: string;
  logo?: string;
  hosts?: string[];
  panels?: string[];
  guests?: string[];
  experts?: string[];
  recordingAt?: string;
  vcrAt?: string;
  synopsis?: string;
}

/** 방송 미리보기/다시보기 요약 1개 챕터.
 *  YouTube 챕터 스타일 — 타임라인 + 제목 + 부설명. */
export interface BroadcastPreviewHighlight {
  /** "00:00" 또는 "00:03:20" — 비워둘 수 있음(방영 전 초안) */
  timestamp?: string;
  title: string;
  description?: string;
}

/** 방송 콘텐츠 미리보기/요약. 방송 전엔 어드민에서 작성·비공개,
 *  방송 후 isPublic 토글로 공개. 시청자에게 ‘유튜브 영상 요약’처럼 보여진다. */
export interface BroadcastPreview {
  /** 미리보기 콘텐츠 사용 여부. false면 어드민에서도 미작성 상태로 취급. */
  enabled?: boolean;
  /** 공개 페이지 노출 토글. 방송 후 어드민이 직접 켠다. */
  isPublic?: boolean;
  /** 한 줄 강조 카피 — 침향 효능 관점의 헤드라인. */
  headline?: string;
  /** 본문 요약(1~2 문단). */
  summary?: string;
  /** 챕터(타임라인) — YouTube 챕터식. */
  highlights?: BroadcastPreviewHighlight[];
  /** 침향 효능 핵심 포인트 — 5~7개 불릿. */
  keyPoints?: string[];
  /** 마지막 편집 시각(ISO). */
  updatedAt?: string;
}

export interface Broadcast {
  id: string;
  broadcastType?: BroadcastType;
  published?: boolean;
  channel: string;
  scheduledAt: string;
  durationMinutes: number;
  host?: string;
  productIds: string[];
  specialPrice?: number;
  regularPrice?: number;
  discountRate?: number;
  vodUrl?: string;
  /** 인라인(임베드) 영상 유효기간(ISO). 이 시각이 지나면 공개 페이지에서
   *  인라인 재생 대신 외부 유튜브 아웃링크로 전환한다. 미설정 시 영구 인라인. */
  inlineUntil?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  /** 매진(완판) 여부. 어드민이 직접 토글한다. true 면 공개 편성표/달력에서
   *  '완료' 대신 '매진' 뱃지(빨강)로 노출. status 와 독립적인 별도 플래그. */
  soldOut?: boolean;
  salesCount?: number;
  feedback?: string;
  showInfo?: BroadcastShowInfo;
  preview?: BroadcastPreview;
  createdAt: string;
  updatedAt: string;
}

/**
 * 방송 일시 통일 표기. 사이트 전 영역에서 동일 포맷을 강제한다.
 *   예: `2026. 5. 20. (수) PM 8:00`
 * - KST 기준
 * - 연·월·일 숫자 + 한글 요일(괄호)
 * - 오전/오후 대신 영문 AM/PM 사용 (디자인 합의)
 */
export function formatBroadcastDateTime(iso: string): string {
  const d = new Date(iso);
  const KST = 'Asia/Seoul';

  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d);
  const year = dateParts.find((p) => p.type === 'year')?.value ?? '';
  const month = dateParts.find((p) => p.type === 'month')?.value ?? '';
  const day = dateParts.find((p) => p.type === 'day')?.value ?? '';

  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    weekday: 'short',
  }).format(d);

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const hour = timeParts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = timeParts.find((p) => p.type === 'minute')?.value ?? '';
  const dayPeriod = (timeParts.find((p) => p.type === 'dayPeriod')?.value ?? '').toUpperCase();

  return `${year}. ${month}. ${day}. (${weekday}) ${dayPeriod} ${hour}:${minute}`;
}

/**
 * 인라인 임베드 유효기간 만료 여부.
 * - `inlineUntil` 미설정/빈값/파싱불가 → false (영구 인라인).
 * - 설정된 시각을 현재가 지났으면 → true (아웃링크로 전환해야 함).
 * 서버 렌더(now=Date.now())와 클라이언트 카운트다운 양쪽에서 동일하게 검증한다.
 */
export function isInlineExpired(
  b: { inlineUntil?: string | null },
  now: number = Date.now()
): boolean {
  if (!b.inlineUntil) return false;
  const t = new Date(b.inlineUntil).getTime();
  if (Number.isNaN(t)) return false;
  return now > t;
}

/**
 * 임의의 YouTube/Vimeo/일반 URL 을 외부 시청용 링크로 정규화.
 * YouTube embed/`youtu.be` 는 `watch?v=` 형태로, 그 외에는 원본 URL 을 그대로 돌려준다.
 * (아웃링크 전환 시 임베드 URL 이 아니라 일반 시청 페이지로 보내기 위함)
 */
export function toWatchUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('?')[0];
      const t = u.searchParams.get('t');
      return id ? `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}` : ''}` : url;
    }
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      if (u.searchParams.get('v')) return url; // 이미 watch URL
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/);
      if (m) {
        const t = u.searchParams.get('start') ?? u.searchParams.get('t');
        return `https://www.youtube.com/watch?v=${m[1]}${t ? `&t=${t}` : ''}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * 1회성 타입 추정 마이그레이션. `broadcastType` 이 비어있는 레거시 레코드의
 * 타입만 추정해 박아두고, 그 외엔 손대지 않는다.
 *
 * NOTE (이전 구현 회귀 방지):
 *   과거 버전은 `showInfo + 가격` 동거 레코드를 자동으로 두 건으로 분리하고
 *   home-shopping 사본의 showInfo 를 제거했다. 사용자가 어드민에서 의도적으로
 *   showInfo 를 입력한 home-shopping 레코드(예: NS홈쇼핑 ‘퍼펙트 라이프’)도
 *   매 GET 마다 다시 분리·탈취 대상이 되어 시놉시스가 사라지는 버그가 있었다.
 *   현재는 분리하지 않는다. 별도 협찬방송 카드가 필요하면 어드민에서 직접 추가.
 */
export function autoSplitMixed(items: Broadcast[]): { migrated: boolean; list: Broadcast[] } {
  let migrated = false;
  const out: Broadcast[] = [];
  for (const b of items) {
    // 명시적 broadcastType 이 있으면 그대로 통과 — 어드민 저장본 보호.
    if (b.broadcastType) {
      out.push(b);
      continue;
    }

    // untyped 레거시 레코드 → 타입만 추정해 박아둔다(멱등).
    const si = b.showInfo;
    const hasShow = !!(
      si &&
      (si.title ||
        si.synopsis ||
        (si.hosts?.length ?? 0) > 0 ||
        (si.panels?.length ?? 0) > 0 ||
        (si.guests?.length ?? 0) > 0 ||
        (si.experts?.length ?? 0) > 0)
    );
    const hasHomeShoppingSide =
      (b.specialPrice ?? 0) > 0 ||
      (b.regularPrice ?? 0) > 0 ||
      (b.discountRate ?? 0) > 0 ||
      (b.productIds?.length ?? 0) > 0;
    // 가격/제품이 있으면 home-shopping, 그 외엔 showInfo 만 있는 순수 협찬방송.
    const inferred: BroadcastType = hasHomeShoppingSide || !hasShow ? 'home-shopping' : 'sponsored';
    out.push({ ...b, broadcastType: inferred });
    migrated = true;
  }
  return { migrated, list: out };
}
