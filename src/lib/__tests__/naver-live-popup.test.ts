import { describe, expect, it } from 'vitest';
import { NAVER_LIVE_SESSIONS, NAVER_LIVE_URL, popupNotice } from '@/lib/naver-live';

const at = (iso: string) => Date.parse(iso);

describe('popupNotice', () => {
  it('1회차 방송 전에는 첫 방송 안내', () => {
    const n = popupNotice(at('2026-11-26T14:00:00+09:00'));
    expect(n?.session.round).toBe(1);
    expect(n?.state).toBe('upcoming');
    expect(n?.eyebrow).toBe('NAVER SHOPPING LIVE · 첫 방송');
    expect(n?.titleLines).toEqual(['대라천 네이버 쇼핑라이브', '첫 방송을 시작합니다']);
    expect(n?.cta).toEqual({ label: '방송 일정 보기', href: '/naver-live', external: false });
  });

  it('방송 시간 중에는 라이브 중 안내와 네이버 라이브 바로가기', () => {
    const n = popupNotice(at('2026-11-26T19:30:00+09:00'));
    expect(n?.session.round).toBe(1);
    expect(n?.state).toBe('live');
    expect(n?.eyebrow).toBe('NAVER SHOPPING LIVE · 지금 방송 중');
    expect(n?.titleLines).toEqual(['대라천 네이버 쇼핑라이브', '지금 방송 중입니다']);
    expect(n?.lead.startsWith('지금 들어오시면')).toBe(true);
    expect(n?.cta).toEqual({ label: '라이브 보러 가기', href: NAVER_LIVE_URL, external: true });
  });

  it('1회차가 끝나면 다음 회차 안내로 넘어간다', () => {
    const n = popupNotice(at('2026-11-26T20:00:00+09:00'));
    expect(n?.session.round).toBe(2);
    expect(n?.state).toBe('upcoming');
    expect(n?.eyebrow).toBe('NAVER SHOPPING LIVE · 2회차');
    expect(n?.titleLines).toEqual(['대라천 네이버 쇼핑라이브', '2회차 방송 안내']);
  });

  it('마지막 회차가 끝나면 노출하지 않는다', () => {
    const last = NAVER_LIVE_SESSIONS[NAVER_LIVE_SESSIONS.length - 1];
    expect(popupNotice(Date.parse(last.endAt))).toBeNull();
  });
});
