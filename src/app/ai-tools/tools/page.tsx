'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../ai-tools.module.css';
import { StatusBadge, DataStateBadge } from '../ui';
import { formatAmount } from '@/lib/ai-tools/currency';
import {
  TOOL_STATUSES,
  DATA_STATES,
  TOOL_STATUS_LABEL,
  DATA_STATE_LABEL,
  type AiTool,
  type Team,
} from '@/lib/ai-tools/types';

export default function ToolListPage() {
  const router = useRouter();
  const [tools, setTools] = useState<AiTool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [team, setTeam] = useState('');
  const [dataState, setDataState] = useState('');

  useEffect(() => {
    fetch('/api/ai-tools/teams')
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (team) p.set('team', team);
    if (dataState) p.set('data_state', dataState);
    fetch(`/api/ai-tools/tools?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => setTools(d.tools ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, status, team, dataState]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const teamName = (id?: string) => teams.find((t) => t.id === id)?.name ?? '미지정';

  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.h1}>툴 목록</div>
          <p className={styles.sub}>월비용 내림차순 · 미확정 건은 뮤트 표시</p>
        </div>
        <Link href="/ai-tools/tools/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          + 신규 등록
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          className={`${styles.field} ${styles.grow}`}
          placeholder="툴명·벤더·플랜 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={styles.field} value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">전체 팀</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select className={styles.field} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {TOOL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TOOL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          className={styles.field}
          value={dataState}
          onChange={(e) => setDataState(e.target.value)}
        >
          <option value="">전체 데이터</option>
          {DATA_STATES.map((s) => (
            <option key={s} value={s}>
              {DATA_STATE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>불러오는 중…</div>
      ) : tools.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.empty}>조건에 맞는 툴이 없습니다.</div>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>툴명 / 벤더</th>
              <th>팀</th>
              <th>플랜</th>
              <th className={styles.num}>월비용</th>
              <th>상태</th>
              <th>데이터</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t) => (
              <tr
                key={t.id}
                className={`${styles.rowLink} ${t.dataState === 'todo' ? styles.rowMuted : ''}`}
                onClick={() => router.push(`/ai-tools/tools/${t.id}`)}
              >
                <td>
                  <b>{t.name}</b>
                  {t.vendor && <div className={styles.kpiHint}>{t.vendor}</div>}
                </td>
                <td>{teamName(t.teamId)}</td>
                <td>{t.plan ?? '—'}</td>
                <td className={styles.num}>{formatAmount(t.monthlyCost, t.currency)}</td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>
                  <DataStateBadge state={t.dataState} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
