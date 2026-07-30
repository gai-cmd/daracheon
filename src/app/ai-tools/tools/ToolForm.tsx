'use client';

import { useState } from 'react';
import styles from '../ai-tools.module.css';
import {
  CURRENCIES,
  TOOL_STATUSES,
  DATA_STATES,
  TOOL_STATUS_LABEL,
  DATA_STATE_LABEL,
  type AiTool,
  type Team,
} from '@/lib/ai-tools/types';

export interface ToolFormValues {
  name: string;
  vendor: string;
  category: string;
  teamId: string;
  accountEmail: string;
  plan: string;
  currency: string;
  monthlyCost: string;
  billingDay: string;
  paymentMethod: string;
  status: string;
  dataState: string;
  owner: string;
  evidenceUrl: string;
  note: string;
}

function fromTool(t?: AiTool | null): ToolFormValues {
  return {
    name: t?.name ?? '',
    vendor: t?.vendor ?? '',
    category: t?.category ?? '',
    teamId: t?.teamId ?? '',
    accountEmail: t?.accountEmail ?? '',
    plan: t?.plan ?? '',
    currency: t?.currency ?? 'USD',
    monthlyCost: t?.monthlyCost != null ? String(t.monthlyCost) : '',
    billingDay: t?.billingDay != null ? String(t.billingDay) : '',
    paymentMethod: t?.paymentMethod ?? '',
    status: t?.status ?? 'active',
    dataState: t?.dataState ?? '',
    owner: t?.owner ?? '',
    evidenceUrl: t?.evidenceUrl ?? '',
    note: t?.note ?? '',
  };
}

/** 폼 값 → API payload (빈 문자열은 생략, 숫자는 변환) */
export function toPayload(v: ToolFormValues): Record<string, unknown> {
  const p: Record<string, unknown> = {
    name: v.name.trim(),
    currency: v.currency,
    status: v.status,
  };
  const setStr = (k: string, val: string) => {
    if (val.trim()) p[k] = val.trim();
  };
  setStr('vendor', v.vendor);
  setStr('category', v.category);
  setStr('accountEmail', v.accountEmail);
  setStr('plan', v.plan);
  setStr('paymentMethod', v.paymentMethod);
  setStr('owner', v.owner);
  setStr('evidenceUrl', v.evidenceUrl);
  setStr('note', v.note);
  p.teamId = v.teamId || undefined;
  p.monthlyCost = v.monthlyCost.trim() === '' ? null : Number(v.monthlyCost);
  p.billingDay = v.billingDay.trim() === '' ? null : Number(v.billingDay);
  if (v.dataState) p.dataState = v.dataState;
  return p;
}

export default function ToolForm({
  tool,
  teams,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  tool?: AiTool | null;
  teams: Team[];
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
}) {
  const [v, setV] = useState<ToolFormValues>(fromTool(tool));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof ToolFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    if (!v.name.trim()) {
      setError('툴명은 필수입니다.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(toPayload(v));
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
      setBusy(false);
    }
  };

  const field = (
    label: string,
    key: keyof ToolFormValues,
    opts: { type?: string; placeholder?: string; required?: boolean } = {},
  ) => (
    <div>
      <label className={styles.label}>
        {label}
        {opts.required ? ' *' : ''}
      </label>
      <input
        className={styles.field}
        style={{ width: '100%' }}
        type={opts.type ?? 'text'}
        placeholder={opts.placeholder}
        value={v[key]}
        onChange={set(key)}
      />
    </div>
  );

  return (
    <div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formGrid}>
        {field('툴명', 'name', { required: true, placeholder: 'Claude Max 20x' })}
        {field('벤더', 'vendor', { placeholder: 'Anthropic' })}
        {field('카테고리', 'category', { placeholder: 'LLM · 코딩 · 슬라이드 · 이미지 · 기타' })}
        <div>
          <label className={styles.label}>팀</label>
          <select className={styles.field} style={{ width: '100%' }} value={v.teamId} onChange={set('teamId')}>
            <option value="">미지정</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {field('계약 계정', 'accountEmail', { placeholder: 'gai@try-n.com' })}
        {field('플랜', 'plan', { placeholder: 'Max 20x · Pro · Plus' })}
        <div>
          <label className={styles.label}>통화</label>
          <select className={styles.field} style={{ width: '100%' }} value={v.currency} onChange={set('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {field('월 비용 (계약 통화)', 'monthlyCost', { type: 'number', placeholder: '미입력 시 확인필요' })}
        {field('결제일 (1~31)', 'billingDay', { type: 'number', placeholder: '22' })}
        {field('결제수단', 'paymentMethod', { placeholder: '법인카드 -4301 · Stripe' })}
        <div>
          <label className={styles.label}>상태</label>
          <select className={styles.field} style={{ width: '100%' }} value={v.status} onChange={set('status')}>
            {TOOL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TOOL_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label}>데이터 상태 (미선택 시 자동)</label>
          <select className={styles.field} style={{ width: '100%' }} value={v.dataState} onChange={set('dataState')}>
            <option value="">자동 (금액 있으면 확정)</option>
            {DATA_STATES.map((s) => (
              <option key={s} value={s}>
                {DATA_STATE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {field('담당자', 'owner', { placeholder: 'GAI' })}
        {field('근거 링크 (영수증·슬랙)', 'evidenceUrl', { placeholder: 'https://…' })}
      </div>
      <div className={styles.formRow} style={{ marginTop: 16 }}>
        <label className={styles.label}>메모</label>
        <textarea
          className={styles.field}
          style={{ width: '100%', minHeight: 72 }}
          value={v.note}
          onChange={set('note')}
        />
      </div>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={busy}>
          {busy ? '저장 중…' : submitLabel}
        </button>
        {onCancel && (
          <button className={styles.btn} onClick={onCancel} disabled={busy}>
            취소
          </button>
        )}
      </div>
    </div>
  );
}
