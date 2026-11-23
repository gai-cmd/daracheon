// 네이버 쇼핑라이브 정규 방송 편성 (NS홈쇼핑 broadcasts 와 별개 채널).
// 회차별 테마가 정해지면 각 항목에 topic 을 채운다.
export const NAVER_LIVE_URL = 'https://shoppinglive.naver.com/livebridge/2100572';

export interface NaverLiveSession {
  round: number;
  /** 방송 시작 (KST ISO) */
  startAt: string;
  /** 방송 종료 (KST ISO) */
  endAt: string;
  topic?: string;
}

export const NAVER_LIVE_SESSIONS: NaverLiveSession[] = [
  { round: 1, startAt: '2026-11-26T19:00:00+09:00', endAt: '2026-11-26T20:00:00+09:00' },
  { round: 2, startAt: '2026-12-03T19:00:00+09:00', endAt: '2026-12-03T20:00:00+09:00' },
  { round: 3, startAt: '2026-12-10T19:00:00+09:00', endAt: '2026-12-10T20:00:00+09:00' },
  { round: 4, startAt: '2026-12-23T19:00:00+09:00', endAt: '2026-12-23T20:00:00+09:00' },
  { round: 5, startAt: '2026-12-30T19:00:00+09:00', endAt: '2026-12-30T20:00:00+09:00' },
];

export type SessionState = 'upcoming' | 'live' | 'ended';

export function sessionState(s: NaverLiveSession, now: number): SessionState {
  const start = Date.parse(s.startAt);
  const end = Date.parse(s.endAt);
  if (now >= end) return 'ended';
  if (now >= start) return 'live';
  return 'upcoming';
}

/** 진행 중이거나 다음으로 예정된 회차. 모두 끝났으면 null. */
export function currentOrNextSession(now: number): NaverLiveSession | null {
  return NAVER_LIVE_SESSIONS.find((s) => sessionState(s, now) !== 'ended') ?? null;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "11월 26일(목) 19:00–20:00" — KST 기준 */
export function formatSessionKst(s: NaverLiveSession): string {
  const toKst = (iso: string) => new Date(Date.parse(iso) + 9 * 3600_000);
  const a = toKst(s.startAt);
  const b = toKst(s.endAt);
  const hm = (d: Date) =>
    `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return `${a.getUTCMonth() + 1}월 ${a.getUTCDate()}일(${WEEKDAYS[a.getUTCDay()]}) ${hm(a)}–${hm(b)}`;
}
