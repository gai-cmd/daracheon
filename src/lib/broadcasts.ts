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
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  salesCount?: number;
  feedback?: string;
  showInfo?: BroadcastShowInfo;
  preview?: BroadcastPreview;
  createdAt: string;
  updatedAt: string;
}

function genSplitId(): string {
  return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Legacy 1회성 마이그레이션 — `broadcastType` 이 한 번도 지정된 적 없는
 * 레거시 레코드만 대상으로 한다. 한 번 마이그레이션된(또는 이후 어드민에서
 * 작성된) 레코드는 `broadcastType` 이 박혀있으므로 다시 분리되지 않는다.
 *
 * 분리 조건(과거 mixed 데이터 한정):
 *   - broadcastType 이 undefined
 *   - showInfo 와 가격(또는 productIds) 양쪽이 모두 의미있게 채워져 있음
 *
 * NOTE: 어드민에서 home-shopping 레코드에 showInfo 를 의도적으로 추가하는
 * 케이스(예: NS홈쇼핑 ‘퍼펙트 라이프’ 회차)는 분리 대상이 아니다.
 * 이전 구현은 `broadcastType !== 'sponsored'` 만 검사해서, 사용자가
 * 저장한 showInfo 를 매 GET 마다 다시 탈취했다.
 */
export function autoSplitMixed(items: Broadcast[]): { migrated: boolean; list: Broadcast[] } {
  let migrated = false;
  const out: Broadcast[] = [];
  for (const b of items) {
    // 핵심 가드: 명시적 broadcastType 이 있으면 어떤 경우에도 손대지 않는다.
    if (b.broadcastType) {
      out.push(b);
      continue;
    }

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
    const isMixed = hasShow && hasHomeShoppingSide;
    if (!isMixed) {
      // 분리할 필요 없는 untyped 레코드 — broadcastType 만 추정해 박아둔다.
      // 다음 GET 에서 위의 early return 으로 빠지므로 멱등.
      const inferred: Broadcast = {
        ...b,
        broadcastType: hasShow && !hasHomeShoppingSide ? 'sponsored' : 'home-shopping',
      };
      if (inferred.broadcastType !== b.broadcastType) migrated = true;
      out.push(inferred);
      continue;
    }

    // 진짜 legacy mixed → 두 레코드로 분리. 단, showInfo / preview 는
    // home-shopping 사본에 그대로 남겨둔다(공개 페이지 시놉시스 노출용).
    // sponsored 사본은 별도의 협찬방송 카드용 복제본.
    const homeShopping: Broadcast = { ...b, broadcastType: 'home-shopping' };

    const sponsored: Broadcast = {
      ...b,
      id: genSplitId(),
      broadcastType: 'sponsored',
      productIds: [],
    };
    delete sponsored.specialPrice;
    delete sponsored.regularPrice;
    delete sponsored.discountRate;
    delete sponsored.salesCount;

    out.push(homeShopping, sponsored);
    migrated = true;
  }
  return { migrated, list: out };
}
