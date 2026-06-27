'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

/** 달력/카드에 필요한 직렬화된 방송 1건. KST 파생값은 서버에서 계산해 넘긴다
 *  (클라이언트 타임존이 KST 가 아니어도 편성일이 흔들리지 않게). */
export interface CalBroadcast {
  id: string;
  channel: string;
  channelLogo: string;
  /** KST 기준 연/월(1-12)/일 — 달력 셀 배치 및 정렬용 */
  year: number;
  month: number;
  day: number;
  /** 'PM 9:40' 형태(KST) */
  timeLabel: string;
  /** 통일 표기 — '2026. 6. 19. (금) PM 9:40' */
  dateTimeLabel: string;
  title: string;
  specialPrice?: number;
  discountRate?: number;
  host?: string;
  /** effectiveStatus — scheduled 인데 시각이 지났으면 ended 로 보정된 값 */
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  isPast: boolean;
  soldOut: boolean;
  hasReplay: boolean;
}

type Tab = 'upcoming' | 'past';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`;
}

/** badge 종류 결정 — live > 매진 > 완료 > 예정(취소는 별도) */
function badgeOf(b: CalBroadcast): { label: string; variant: string } {
  if (b.status === 'canceled') return { label: '취소', variant: 'canceled' };
  if (b.status === 'live') return { label: 'ON AIR', variant: 'live' };
  if (b.isPast) {
    if (b.soldOut) return { label: '매진', variant: 'soldout' };
    return { label: '완료', variant: 'done' };
  }
  return { label: '예정', variant: 'upcoming' };
}

/** 달력 셀 점(dot) 색 종류 */
function dotVariant(b: CalBroadcast): string {
  if (b.status === 'live') return 'live';
  if (b.isPast) return b.soldOut ? 'soldout' : 'done';
  return 'upcoming';
}

/** 단일 월 그리드 — 6월·7월을 나란히 보여주기 위해 한 달치 달력을 분리한 컴포넌트.
 *  monthIdx 는 year*12 + (month-1). 클릭 가능한 셀은 해당 일자의 첫 방송으로 포커스. */
function MonthGrid({
  monthIdx,
  byKey,
  todayY,
  todayM,
  todayD,
  onPick,
}: {
  monthIdx: number;
  byKey: Map<string, CalBroadcast[]>;
  todayY: number;
  todayM: number;
  todayD: number;
  onPick: (b: CalBroadcast) => void;
}) {
  const viewYear = Math.floor(monthIdx / 12);
  const viewMon = (monthIdx % 12) + 1;

  const cells = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(viewYear, viewMon - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMon, 0)).getUTCDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewYear, viewMon]);

  return (
    <div className={styles.calMonth}>
      <div className={styles.calMonthName}>
        {viewYear}<span className={styles.calMonthDot}>·</span>{viewMon}월
      </div>
      <div className={styles.calGrid}>
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`${styles.calWeekday} ${i === 0 ? styles.calWeekdaySun : ''} ${
              i === 6 ? styles.calWeekdaySat : ''
            }`}
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`pad-${i}`} className={styles.calCellEmpty} />;
          const events = byKey.get(dayKey(viewYear, viewMon, d)) ?? [];
          const isToday = viewYear === todayY && viewMon === todayM && d === todayD;
          const hasEvent = events.length > 0;
          return (
            <button
              type="button"
              key={`d-${d}`}
              className={`${styles.calCell} ${isToday ? styles.calCellToday : ''} ${
                hasEvent ? styles.calCellEvent : ''
              }`}
              onClick={hasEvent ? () => onPick(events[0]) : undefined}
              disabled={!hasEvent}
              aria-label={
                hasEvent
                  ? `${viewMon}월 ${d}일 ${events.map((e) => `${e.channel} ${badgeOf(e).label}`).join(', ')}`
                  : `${viewMon}월 ${d}일`
              }
            >
              <span className={styles.calDayNum}>{d}</span>
              {hasEvent && (
                <span className={styles.calDots}>
                  {events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`${styles.calDot} ${
                        styles[`calDot_${dotVariant(e)}` as keyof typeof styles] ?? ''
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BroadcastCalendar({
  broadcasts,
  todayKey,
}: {
  broadcasts: CalBroadcast[];
  todayKey: string;
}) {
  const upcoming = useMemo(
    () => broadcasts.filter((b) => !b.isPast && b.status !== 'canceled'),
    [broadcasts]
  );
  const past = useMemo(
    () => broadcasts.filter((b) => b.isPast || b.status === 'canceled'),
    [broadcasts]
  );

  const byKey = useMemo(() => {
    const m = new Map<string, CalBroadcast[]>();
    for (const b of broadcasts) {
      const k = dayKey(b.year, b.month, b.day);
      (m.get(k) ?? m.set(k, []).get(k)!).push(b);
    }
    return m;
  }, [broadcasts]);

  /** 탭별 기본 표시 월 — 예정: 가장 가까운 예정 방송 월, 지난: 가장 최근 방송 월 */
  function tabDefaultMonth(tab: Tab): number {
    const arr = tab === 'upcoming' ? upcoming : past;
    if (arr.length > 0) {
      const sorted = [...arr].sort(
        (a, b) =>
          a.year * 10000 + a.month * 100 + a.day - (b.year * 10000 + b.month * 100 + b.day)
      );
      const pick = tab === 'upcoming' ? sorted[0] : sorted[sorted.length - 1];
      return monthIndex(pick.year, pick.month);
    }
    const [ty, tm] = todayKey.split('-').map(Number);
    return monthIndex(ty, tm);
  }

  const initialTab: Tab = upcoming.length > 0 ? 'upcoming' : 'past';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [viewMonth, setViewMonth] = useState<number>(() => tabDefaultMonth(initialTab));
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // 네비게이션 가능 범위 — 이벤트가 있는 월 ± 오늘
  const monthBounds = useMemo(() => {
    const idxs = broadcasts.map((b) => monthIndex(b.year, b.month));
    const [ty, tm] = todayKey.split('-').map(Number);
    idxs.push(monthIndex(ty, tm));
    return { min: Math.min(...idxs), max: Math.max(...idxs) };
  }, [broadcasts, todayKey]);

  // 지난 방송 탭만 연속 2개월(예: 6월·7월)을 한눈에 — 첫 달(viewMonth)과 다음 달(viewMonth+1).
  // 예정 탭은 단일 월.
  const twoMonth = tab === 'past';
  const monthA = viewMonth;
  const monthB = viewMonth + 1;
  const monthBarLabel = twoMonth
    ? `${Math.floor(monthA / 12)}. ${(monthA % 12) + 1}월 – ${(monthB % 12) + 1}월`
    : `${Math.floor(monthA / 12)}. ${(monthA % 12) + 1}월`;

  const list = useMemo(() => {
    const arr = tab === 'upcoming' ? [...upcoming] : [...past];
    arr.sort(
      (a, b) =>
        a.year * 10000 + a.month * 100 + a.day - (b.year * 10000 + b.month * 100 + b.day)
    );
    return tab === 'past' ? arr.reverse() : arr;
  }, [tab, upcoming, past]);

  function selectTab(next: Tab) {
    setTab(next);
    setViewMonth(tabDefaultMonth(next));
  }

  function focusEvent(b: CalBroadcast) {
    // 다른 탭의 날짜를 클릭하면 해당 탭으로 전환(월은 유지)
    const targetTab: Tab = b.isPast || b.status === 'canceled' ? 'past' : 'upcoming';
    if (targetTab !== tab) setTab(targetTab);
    setHighlightId(b.id);
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById(`cal-card-${b.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
    window.setTimeout(() => setHighlightId((cur) => (cur === b.id ? null : cur)), 1600);
  }

  const [todayY, todayM, todayD] = todayKey.split('-').map(Number);

  return (
    <div className={styles.cal}>
      {/* 탭 */}
      <div className={styles.calTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={`${styles.calTab} ${tab === 'upcoming' ? styles.calTabActive : ''}`}
          onClick={() => selectTab('upcoming')}
        >
          예정<span className={styles.calTabCount}>{upcoming.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'past'}
          className={`${styles.calTab} ${tab === 'past' ? styles.calTabActive : ''}`}
          onClick={() => selectTab('past')}
        >
          지난 방송<span className={styles.calTabCount}>{past.length}</span>
        </button>
      </div>

      <div className={styles.calLayout}>
        {/* 달력 패널 — 연속 2개월(예: 6월·7월)을 한 화면에 */}
        <div className={styles.calPanel}>
          <div className={styles.calMonthBar}>
            <button
              type="button"
              className={styles.calNavBtn}
              onClick={() => setViewMonth((v) => Math.max(monthBounds.min, v - 1))}
              disabled={viewMonth <= monthBounds.min}
              aria-label="이전 달"
            >
              ‹
            </button>
            <div className={styles.calMonthLabel}>{monthBarLabel}</div>
            <button
              type="button"
              className={styles.calNavBtn}
              onClick={() => setViewMonth((v) => Math.min(monthBounds.max, v + 1))}
              disabled={viewMonth >= monthBounds.max}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>

          <div className={styles.calMonths}>
            <MonthGrid
              monthIdx={monthA}
              byKey={byKey}
              todayY={todayY}
              todayM={todayM}
              todayD={todayD}
              onPick={focusEvent}
            />
            {twoMonth && (
              <MonthGrid
                monthIdx={monthB}
                byKey={byKey}
                todayY={todayY}
                todayM={todayM}
                todayD={todayD}
                onPick={focusEvent}
              />
            )}
          </div>

          <div className={styles.calLegend}>
            <span className={styles.calLegendItem}>
              <span className={`${styles.calDot} ${styles.calDot_upcoming}`} />예정
            </span>
            <span className={styles.calLegendItem}>
              <span className={`${styles.calDot} ${styles.calDot_soldout}`} />매진
            </span>
            <span className={styles.calLegendItem}>
              <span className={`${styles.calDot} ${styles.calDot_done}`} />완료
            </span>
          </div>
        </div>

        {/* 카드 리스트 (탭 필터) */}
        <div className={styles.calList}>
          {list.length === 0 ? (
            <div className={styles.calEmpty}>
              {tab === 'upcoming' ? '예정된 방송이 없습니다.' : '지난 방송이 없습니다.'}
            </div>
          ) : (
            list.map((b) => {
              const badge = badgeOf(b);
              return (
                <div
                  key={b.id}
                  id={`cal-card-${b.id}`}
                  className={`${styles.calRow} ${highlightId === b.id ? styles.calRowHighlight : ''}`}
                >
                  <div className={styles.calRowDate}>
                    <span className={styles.calRowDay}>{String(b.day).padStart(2, '0')}</span>
                    <span className={styles.calRowMon}>{b.month}월</span>
                  </div>
                  <div className={styles.calRowMain}>
                    <div className={styles.calRowCh}>
                      <span className={styles.calRowChLogo}>{b.channelLogo}</span>
                      {b.channel}
                      <span className={styles.calRowTime}>{b.timeLabel}</span>
                    </div>
                    <div className={styles.calRowTitle}>{b.title}</div>
                    <div className={styles.calRowOffer}>
                      {b.specialPrice ? (
                        <>
                          특별가 <b>₩{b.specialPrice.toLocaleString()}</b>
                          {b.discountRate ? ` · −${b.discountRate}%` : ''}
                        </>
                      ) : (
                        '방송 중 특별가 공개'
                      )}
                      {b.host ? <span className={styles.calRowHost}> · {b.host}</span> : null}
                    </div>
                  </div>
                  <div className={styles.calRowSide}>
                    <span
                      className={`${styles.calBadge} ${
                        styles[`calBadge_${badge.variant}` as keyof typeof styles] ?? ''
                      }`}
                    >
                      {badge.label}
                    </span>
                    {b.hasReplay && (
                      <a href="#live" className={styles.calReplay}>
                        다시보기 →
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
