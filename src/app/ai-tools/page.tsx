'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './ai-tools.module.css';
import { formatJpy } from '@/lib/ai-tools/currency';
import type { Summary } from '@/lib/ai-tools/summary';

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai-tools/summary')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('불러오기 실패'))))
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!summary) return <div className={styles.loading}>불러오는 중…</div>;

  const maxTeam = Math.max(1, ...summary.byTeam.map((t) => t.monthlyJpy));
  const maxMonth = Math.max(1, ...summary.monthlySeries.map((m) => m.jpy));
  const nextBilling = summary.upcoming[0];

  return (
    <>
      <div className={styles.h1}>AI툴 관리 대시보드</div>
      <p className={styles.sub}>전사 AI툴·비용 통합관리 · JPY 환산 기준</p>

      {/* KPI 카드 */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <div className={styles.kpiLabel}>월 비용 합계</div>
          <div className={styles.kpiValue}>
            {formatJpy(summary.totalMonthlyJpy)}
            {summary.unconfirmedCount > 0 && <span className={styles.kpiAlpha}> +α</span>}
          </div>
          <div className={styles.kpiHint}>확정 금액 합산 · 미확정은 +α</div>
        </div>
        <div className={styles.card}>
          <div className={styles.kpiLabel}>유료 툴 수</div>
          <div className={styles.kpiValue}>{summary.paidToolCount}</div>
          <div className={styles.kpiHint}>사용중 · 월비용 &gt; 0</div>
        </div>
        <div className={styles.card}>
          <div className={styles.kpiLabel}>확인 필요</div>
          <div className={styles.kpiValue}>{summary.unconfirmedCount}건</div>
          <div className={styles.kpiHint}>금액·플랜 미확정</div>
        </div>
        <div className={styles.card}>
          <div className={styles.kpiLabel}>다가오는 결제</div>
          <div className={styles.kpiValue} style={{ fontSize: 18 }}>
            {nextBilling ? `${nextBilling.toolName}` : '없음'}
          </div>
          <div className={styles.kpiHint}>
            {nextBilling
              ? `${nextBilling.nextDate} (${nextBilling.daysUntil}일 후) ${nextBilling.amountLabel}`
              : '30일 이내 예정 없음'}
          </div>
        </div>
      </div>

      {/* 팀별 월 비용 */}
      <div className={styles.h2}>팀별 월 비용</div>
      <div className={styles.card}>
        {summary.byTeam.length === 0 && <div className={styles.empty}>데이터가 없습니다.</div>}
        {summary.byTeam.map((t) => (
          <div key={t.teamId ?? 'none'} className={styles.barRow}>
            <span className={styles.barLabel}>{t.teamName}</span>
            <span className={styles.barTrack}>
              <span
                className={styles.barFill}
                style={{ width: `${Math.round((t.monthlyJpy / maxTeam) * 100)}%` }}
              />
            </span>
            <span className={styles.barValue}>
              {formatJpy(t.monthlyJpy)}
              {t.unconfirmedCount > 0 ? ` +α${t.unconfirmedCount}` : ''}
            </span>
          </div>
        ))}
      </div>

      {/* 월별 추이 */}
      <div className={styles.h2}>월별 결제 추이 (최근 6개월)</div>
      <div className={styles.card}>
        <div className={styles.sparkRow}>
          {summary.monthlySeries.map((m) => (
            <div key={m.month} className={styles.sparkCol}>
              <span className={styles.sparkVal}>{m.jpy > 0 ? formatJpy(m.jpy) : ''}</span>
              <span
                className={styles.sparkBar}
                style={{ height: `${Math.round((m.jpy / maxMonth) * 100)}%` }}
              />
              <span className={styles.sparkMonth}>{m.month.slice(5)}월</span>
            </div>
          ))}
        </div>
        {summary.monthlySeries.every((m) => m.jpy === 0) && (
          <div className={styles.metaNote}>
            아직 결제 기록이 없습니다. 툴 상세에서 결제를 기록하면 추이가 표시됩니다.
          </div>
        )}
      </div>

      {/* 결제 예정 목록 */}
      {summary.upcoming.length > 0 && (
        <>
          <div className={styles.h2}>결제 예정 (30일 이내)</div>
          <div className={styles.card}>
            {summary.upcoming.map((u) => (
              <div key={u.toolId} className={styles.listItem}>
                <Link href={`/ai-tools/tools/${u.toolId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                  {u.toolName}
                </Link>
                <span>
                  {u.nextDate} · {u.amountLabel} · <b>{u.daysUntil}일 후</b>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
