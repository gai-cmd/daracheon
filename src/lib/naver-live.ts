// 네이버 쇼핑라이브 정규 방송 편성 (NS홈쇼핑 broadcasts 와 별개 채널).
// 회차별 방송 타이틀/테마는 각 항목의 topic 에 둔다 (미정이면 비워 두면 "주제 추후 공개" 표시).
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
  {
    round: 1,
    startAt: '2026-11-26T19:00:00+09:00',
    endAt: '2026-11-26T20:00:00+09:00',
    topic: '[론칭] 황제의 보물, 베트남 대라천 참 침향오일 첫 공개 단독 혜택',
  },
  {
    round: 2,
    startAt: '2026-12-03T19:00:00+09:00',
    endAt: '2026-12-03T20:00:00+09:00',
    topic: "환(丸)과 비교 불가! 체내 흡수 빠른 '100% 참 침향오일' 캡슐의 진가",
  },
  {
    round: 3,
    startAt: '2026-12-10T19:00:00+09:00',
    endAt: '2026-12-10T20:00:00+09:00',
    topic: '추워진 날씨, 무너진 활력엔 명품 베트남 대라천 침향',
  },
  {
    round: 4,
    startAt: '2026-12-23T19:00:00+09:00',
    endAt: '2026-12-23T20:00:00+09:00',
    topic: '[기획전] 나를 위한 가장 귀한 투자, 대라천 침향오일 세트',
  },
  {
    round: 5,
    startAt: '2026-12-30T19:00:00+09:00',
    endAt: '2026-12-30T20:00:00+09:00',
    topic: '[총결산] 한 해 감사한 분께 드리는 최고의 명품 효도 선물',
  },
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
