'use client';

import styles from './ai-tools.module.css';
import {
  TOOL_STATUS_LABEL,
  DATA_STATE_LABEL,
  type ToolStatus,
  type DataState,
} from '@/lib/ai-tools/types';

const STATUS_CLASS: Record<ToolStatus, string> = {
  active: styles.badgeActive,
  trial: styles.badgeTrial,
  review: styles.badgeReview,
  cancelled: styles.badgeCancelled,
};

const DATA_CLASS: Record<DataState, string> = {
  confirmed: styles.badgeConfirmed,
  estimated: styles.badgeEstimated,
  todo: styles.badgeTodo,
};

export function StatusBadge({ status }: { status: ToolStatus }) {
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{TOOL_STATUS_LABEL[status]}</span>;
}

export function DataStateBadge({ state }: { state: DataState }) {
  // 색상 단독 표현 금지(설계서 ④-2) — 확인필요는 "!" 아이콘 병기.
  const icon = state === 'confirmed' ? '✓' : state === 'todo' ? '!' : '≈';
  return (
    <span className={`${styles.badge} ${DATA_CLASS[state]}`}>
      {icon} {DATA_STATE_LABEL[state]}
    </span>
  );
}
