'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import styles from '../../ai-tools.module.css';
import { StatusBadge, DataStateBadge } from '../../ui';
import ToolForm from '../ToolForm';
import { formatAmount, formatJpy } from '@/lib/ai-tools/currency';
import {
  USAGE_LEVEL_LABEL,
  REVIEW_DECISION_LABEL,
  CURRENCIES,
  type AiTool,
  type Team,
  type ToolPayment,
  type ToolReview,
} from '@/lib/ai-tools/types';

interface Detail {
  tool: AiTool;
  payments: ToolPayment[];
  reviews: ToolReview[];
}

export default function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/ai-tools/tools/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('툴을 찾을 수 없습니다.'))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
    fetch('/api/ai-tools/teams')
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => {});
  }, [load]);

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/ai-tools/tools/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? '저장 실패');
    setEditing(false);
    load();
  };

  const cancelTool = async () => {
    if (!confirm('이 툴을 해지 처리할까요? (상태가 "해지"로 변경됩니다)')) return;
    await patch({ status: 'cancelled' });
  };

  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.loading}>불러오는 중…</div>;

  const { tool, payments, reviews } = data;
  const teamName = teams.find((t) => t.id === tool.teamId)?.name ?? '미지정';

  return (
    <>
      <Link href="/ai-tools/tools" className={styles.backLink}>
        ← 툴 목록
      </Link>

      <div className={styles.headerRow}>
        <div>
          <div className={styles.h1}>{tool.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <StatusBadge status={tool.status} />
            <DataStateBadge state={tool.dataState} />
          </div>
        </div>
        {!editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.btn} onClick={() => setEditing(true)}>
              수정
            </button>
            {tool.status !== 'cancelled' && (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={cancelTool}>
                해지 처리
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className={styles.card}>
          <ToolForm
            tool={tool}
            teams={teams}
            submitLabel="저장"
            onSubmit={patch}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.infoGrid}>
            <Info k="벤더" v={tool.vendor} />
            <Info k="카테고리" v={tool.category} />
            <Info k="팀" v={teamName} />
            <Info k="계약 계정" v={tool.accountEmail} />
            <Info k="플랜" v={tool.plan} />
            <Info k="월 비용" v={`${formatAmount(tool.monthlyCost, tool.currency)}${tool.monthlyCost != null ? ` (${formatJpy(toJpyClient(tool.monthlyCost, tool.currency))})` : ''}`} />
            <Info k="결제일" v={tool.billingDay ? `매월 ${tool.billingDay}일` : undefined} />
            <Info k="결제수단" v={tool.paymentMethod} />
            <Info k="담당자" v={tool.owner} />
            <Info k="시작일" v={tool.startedOn ?? undefined} />
            <InfoLink k="근거 링크" href={tool.evidenceUrl} />
          </div>
          {tool.note && <div className={styles.metaNote}>📝 {tool.note}</div>}
        </div>
      )}

      {/* 결제 이력 */}
      <div className={styles.headerRow} style={{ marginTop: 24 }}>
        <div className={styles.h2} style={{ margin: 0 }}>
          결제 이력
        </div>
        <button className={styles.btn} onClick={() => setShowPayment((s) => !s)}>
          {showPayment ? '닫기' : '+ 결제 기록'}
        </button>
      </div>
      {showPayment && (
        <PaymentForm
          toolId={id}
          defaultCurrency={tool.currency}
          onDone={() => {
            setShowPayment(false);
            load();
          }}
        />
      )}
      <div className={styles.card}>
        {payments.length === 0 ? (
          <div className={styles.empty}>결제 기록이 없습니다.</div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className={styles.listItem}>
              <span>{p.paidOn}</span>
              <span>
                {formatAmount(p.amount, p.currency)}{' '}
                <span style={{ color: '#6b7280' }}>({formatJpy(p.amountJpy)})</span>
                {p.receiptUrl && (
                  <>
                    {' '}
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                      영수증
                    </a>
                  </>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 효율화 판단 이력 */}
      <div className={styles.headerRow} style={{ marginTop: 24 }}>
        <div className={styles.h2} style={{ margin: 0 }}>
          효율화 판단 이력
        </div>
        <button className={styles.btn} onClick={() => setShowReview((s) => !s)}>
          {showReview ? '닫기' : '+ 판단 기록'}
        </button>
      </div>
      {showReview && (
        <ReviewForm
          toolId={id}
          onDone={() => {
            setShowReview(false);
            load();
          }}
        />
      )}
      <div className={styles.card}>
        {reviews.length === 0 ? (
          <div className={styles.empty}>판단 기록이 없습니다.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={styles.listItem}>
              <span>{r.reviewedOn}</span>
              <span style={{ textAlign: 'right' }}>
                {r.decision && <b>{REVIEW_DECISION_LABEL[r.decision]}</b>}
                {r.usageLevel && <> · 사용률 {USAGE_LEVEL_LABEL[r.usageLevel]}</>}
                {r.reason && <div className={styles.kpiHint}>{r.reason}</div>}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Info({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className={styles.infoItem}>
      <div className={styles.infoKey}>{k}</div>
      <div className={styles.infoVal}>{v || '—'}</div>
    </div>
  );
}

function InfoLink({ k, href }: { k: string; href?: string | null }) {
  return (
    <div className={styles.infoItem}>
      <div className={styles.infoKey}>{k}</div>
      <div className={styles.infoVal}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            열기 ↗
          </a>
        ) : (
          '—'
        )}
      </div>
    </div>
  );
}

// 클라이언트 표시용 간이 환산 (서버 summary 와 동일 기본 환율)
function toJpyClient(amount: number, currency: string): number {
  const fx: Record<string, number> = { JPY: 1, USD: 155, KRW: 0.11, BDT: 1.4 };
  return Math.round(amount * (fx[currency] ?? 1));
}

function PaymentForm({
  toolId,
  defaultCurrency,
  onDone,
}: {
  toolId: string;
  defaultCurrency: string;
  onDone: () => void;
}) {
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!amount) {
      setError('금액을 입력하세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-tools/tools/${toolId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidOn, amount: Number(amount), currency, receiptUrl }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? '저장 실패');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
      setBusy(false);
    }
  };

  return (
    <div className={styles.card} style={{ marginBottom: 12 }}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formGrid}>
        <div>
          <label className={styles.label}>결제일 *</label>
          <input className={styles.field} style={{ width: '100%' }} type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
        <div>
          <label className={styles.label}>금액 *</label>
          <input className={styles.field} style={{ width: '100%' }} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={styles.label}>통화</label>
          <select className={styles.field} style={{ width: '100%' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label}>영수증 링크</label>
          <input className={styles.field} style={{ width: '100%' }} value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={busy}>
          {busy ? '저장 중…' : '결제 기록'}
        </button>
      </div>
    </div>
  );
}

function ReviewForm({ toolId, onDone }: { toolId: string; onDone: () => void }) {
  const [reviewedOn, setReviewedOn] = useState(new Date().toISOString().slice(0, 10));
  const [usageLevel, setUsageLevel] = useState('');
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-tools/tools/${toolId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedOn,
          usageLevel: usageLevel || undefined,
          decision: decision || undefined,
          reason,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? '저장 실패');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
      setBusy(false);
    }
  };

  return (
    <div className={styles.card} style={{ marginBottom: 12 }}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formGrid}>
        <div>
          <label className={styles.label}>판단일 *</label>
          <input className={styles.field} style={{ width: '100%' }} type="date" value={reviewedOn} onChange={(e) => setReviewedOn(e.target.value)} />
        </div>
        <div>
          <label className={styles.label}>사용 수준</label>
          <select className={styles.field} style={{ width: '100%' }} value={usageLevel} onChange={(e) => setUsageLevel(e.target.value)}>
            <option value="">선택</option>
            {Object.entries(USAGE_LEVEL_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label}>결정</label>
          <select className={styles.field} style={{ width: '100%' }} value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="">선택</option>
            {Object.entries(REVIEW_DECISION_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.formRow} style={{ marginTop: 16 }}>
        <label className={styles.label}>사유</label>
        <textarea className={styles.field} style={{ width: '100%', minHeight: 60 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 사용률 high / 중복 없음 → 유지" />
      </div>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={busy}>
          {busy ? '저장 중…' : '판단 기록'}
        </button>
      </div>
    </div>
  );
}
