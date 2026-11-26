// 네이버 쇼핑라이브 정규 방송 편성 (NS홈쇼핑 broadcasts 와 별개 채널).
// 회차별 방송 타이틀/테마는 각 항목의 topic 에 둔다 (미정이면 비워 두면 "주제 추후 공개" 표시).
export const NAVER_LIVE_URL = 'https://shoppinglive.naver.com/livebridge/2100572';
/** 네이버 쇼핑라이브와 같은 시간에 동시 송출되는 쿠팡 라이브 */
export const COUPANG_LIVE_URL = 'https://link.coupang.com/a/iLI9OAXmRo';

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

export interface PopupNotice {
  session: NaverLiveSession;
  state: Exclude<SessionState, 'ended'>;
  eyebrow: string;
  titleLines: [string, string];
  lead: string;
  cta: { label: string; href: string; external: boolean };
  /** 쿠팡 라이브 동시 송출 바로가기 */
  coupang: { label: string; href: string };
}

/**
 * 사이트 전역 팝업 문구 — 진행 중이거나 다음 회차를 안내한다. 모든 회차가 끝나면 null(팝업 없음).
 * 방송 시간에는 네이버 라이브로 바로 보내고, 그 외에는 편성표 페이지로 보낸다.
 */
export function popupNotice(now: number): PopupNotice | null {
  const session = currentOrNextSession(now);
  if (!session) return null;
  const brand = '대라천 네이버 쇼핑라이브';
  if (sessionState(session, now) === 'live') {
    return {
      session,
      state: 'live',
      eyebrow: 'NAVER SHOPPING LIVE · 지금 방송 중',
      titleLines: [brand, '지금 방송 중입니다'],
      lead: '네이버·쿠팡에서 동시에 방송합니다. 지금 들어오시면 실시간으로 묻고 답하며 라이브 혜택을 받으실 수 있습니다.',
      cta: { label: '네이버 라이브 보기', href: NAVER_LIVE_URL, external: true },
      coupang: { label: '쿠팡 라이브 보기', href: COUPANG_LIVE_URL },
    };
  }
  const first = session.round === 1;
  return {
    session,
    state: 'upcoming',
    eyebrow: `NAVER SHOPPING LIVE · ${first ? '첫 방송' : `${session.round}회차`}`,
    titleLines: [brand, first ? '첫 방송을 시작합니다' : `${session.round}회차 방송 안내`],
    lead: '네이버·쿠팡에서 동시에 방송합니다. 방송 시간에 들어오시면 실시간으로 묻고 답하며 라이브 혜택을 받으실 수 있습니다.',
    cta: { label: '방송 일정 보기', href: '/naver-live', external: false },
    coupang: { label: '쿠팡 라이브 알림받기', href: COUPANG_LIVE_URL },
  };
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
