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
  createdAt: string;
  updatedAt: string;
}

function genSplitId(): string {
  return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 한 레코드에 홈쇼핑 정보(가격/제품)와 협찬방송 정보(showInfo)가 함께
 * 들어있는 과도기 데이터를 두 건으로 분리한다. 멱등.
 *
 *   원본: { channel:'NS홈쇼핑', specialPrice:.., showInfo:{title:'퍼펙트 라이프', ...} }
 *     ↓
 *   1) home-shopping 만 남긴 사본 (showInfo 제거)
 *   2) sponsored 사본 (가격/판매 메타 제거, broadcastType='sponsored')
 */
export function autoSplitMixed(items: Broadcast[]): { migrated: boolean; list: Broadcast[] } {
  let migrated = false;
  const out: Broadcast[] = [];
  for (const b of items) {
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
    const isMixed = hasShow && hasHomeShoppingSide && b.broadcastType !== 'sponsored';
    if (!isMixed) {
      out.push(b);
      continue;
    }

    const homeShopping: Broadcast = { ...b, broadcastType: 'home-shopping' };
    delete homeShopping.showInfo;

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
