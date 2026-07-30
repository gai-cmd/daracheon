import { randomUUID } from 'node:crypto';
import {
  readDataUncached,
  readDataForWrite,
  writeDataMerged,
} from '@/lib/db';
import type {
  AiTool,
  Team,
  ToolPayment,
  ToolReview,
  ToolStatus,
  DataState,
  Currency,
} from './types';

/**
 * AI툴 CRM 데이터 접근 계층 — src/lib/db.ts(JSON Blob 스토어) 위에 얹은 CRUD.
 *
 * 읽기: readDataUncached (즉시 반영 + outbox 정합)
 * 쓰기: readDataForWrite → writeDataMerged (lost-update 방지, id 기준 병합)
 * append(결제·판단 이력): appendData 는 outbox 내구성 파일에만 유효하므로
 *   여기서는 read-modify-write 로 통일한다(해당 파일은 outbox 미등록).
 */

const F_TEAMS = 'ai-teams';
const F_TOOLS = 'ai-tools';
const F_PAYMENTS = 'ai-tool-payments';
const F_REVIEWS = 'ai-tool-reviews';

function nowIso() {
  return new Date().toISOString();
}

/* ───────── Teams ───────── */

export async function listTeams(): Promise<Team[]> {
  return readDataUncached<Team>(F_TEAMS);
}

/* ───────── Tools ───────── */

export interface ToolFilter {
  teamId?: string;
  status?: ToolStatus;
  dataState?: DataState;
  q?: string;
}

export async function listTools(filter: ToolFilter = {}): Promise<AiTool[]> {
  let tools = await readDataUncached<AiTool>(F_TOOLS);
  if (filter.teamId) tools = tools.filter((t) => t.teamId === filter.teamId);
  if (filter.status) tools = tools.filter((t) => t.status === filter.status);
  if (filter.dataState) tools = tools.filter((t) => t.dataState === filter.dataState);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    tools = tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.vendor ?? '').toLowerCase().includes(q) ||
        (t.plan ?? '').toLowerCase().includes(q),
    );
  }
  // 월비용(계약통화 기준 원값) 내림차순 — 미확정(null)은 뒤로.
  return tools.sort((a, b) => (b.monthlyCost ?? -1) - (a.monthlyCost ?? -1));
}

export async function getTool(id: string): Promise<AiTool | null> {
  const tools = await readDataUncached<AiTool>(F_TOOLS);
  return tools.find((t) => t.id === id) ?? null;
}

/** 신규 등록에 허용되는 입력 필드 */
export type ToolCreateInput = Partial<
  Omit<AiTool, 'id' | 'createdAt' | 'updatedAt'>
> & { name: string };

export async function createTool(input: ToolCreateInput): Promise<AiTool> {
  const name = input.name?.trim();
  if (!name) throw new Error('툴명(name)은 필수입니다.');

  const ts = nowIso();
  // 금액 미입력 시 자동으로 data_state='todo' (설계서 ④-3)
  const hasCost = input.monthlyCost !== null && input.monthlyCost !== undefined;
  const tool: AiTool = {
    id: randomUUID(),
    name,
    vendor: input.vendor?.trim() || undefined,
    category: input.category?.trim() || undefined,
    teamId: input.teamId || undefined,
    accountEmail: input.accountEmail?.trim() || undefined,
    plan: input.plan?.trim() || undefined,
    currency: (input.currency as Currency) || 'USD',
    monthlyCost: hasCost ? Number(input.monthlyCost) : null,
    billingDay: normalizeBillingDay(input.billingDay),
    paymentMethod: input.paymentMethod?.trim() || undefined,
    status: input.status || 'active',
    dataState: input.dataState || (hasCost ? 'confirmed' : 'todo'),
    startedOn: input.startedOn || null,
    owner: input.owner?.trim() || undefined,
    evidenceUrl: input.evidenceUrl?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdAt: ts,
    updatedAt: ts,
  };

  const base = await readDataForWrite<AiTool>(F_TOOLS);
  base.push(tool);
  await writeDataMerged(F_TOOLS, base);
  return tool;
}

export type ToolUpdateInput = Partial<Omit<AiTool, 'id' | 'createdAt'>>;

export async function updateTool(id: string, patch: ToolUpdateInput): Promise<AiTool | null> {
  const base = await readDataForWrite<AiTool>(F_TOOLS);
  const idx = base.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const prev = base[idx];
  const next: AiTool = {
    ...prev,
    ...sanitizeToolPatch(patch),
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: nowIso(),
  };
  base[idx] = next;
  await writeDataMerged(F_TOOLS, base);
  return next;
}

function sanitizeToolPatch(patch: ToolUpdateInput): ToolUpdateInput {
  const out: ToolUpdateInput = { ...patch };
  if ('billingDay' in out) out.billingDay = normalizeBillingDay(out.billingDay);
  if ('monthlyCost' in out) {
    const c: unknown = out.monthlyCost;
    out.monthlyCost = c === null || c === undefined || c === '' ? null : Number(c);
  }
  return out;
}

function normalizeBillingDay(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(31, Math.max(1, Math.round(n)));
}

/* ───────── Payments ───────── */

export async function listPayments(toolId?: string): Promise<ToolPayment[]> {
  const all = await readDataUncached<ToolPayment>(F_PAYMENTS);
  const rows = toolId ? all.filter((p) => p.toolId === toolId) : all;
  return rows.sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1));
}

export interface PaymentInput {
  paidOn: string;
  amount: number;
  currency: Currency;
  receiptUrl?: string;
}

export async function addPayment(toolId: string, input: PaymentInput): Promise<ToolPayment> {
  if (!input.paidOn) throw new Error('결제일(paidOn)은 필수입니다.');
  if (!Number.isFinite(Number(input.amount))) throw new Error('금액(amount)이 올바르지 않습니다.');

  const { toJpy } = await import('./currency');
  const payment: ToolPayment = {
    id: randomUUID(),
    toolId,
    paidOn: input.paidOn,
    amount: Number(input.amount),
    currency: input.currency,
    amountJpy: toJpy(Number(input.amount), input.currency),
    receiptUrl: input.receiptUrl?.trim() || undefined,
    createdAt: nowIso(),
  };
  const base = await readDataForWrite<ToolPayment>(F_PAYMENTS);
  base.push(payment);
  await writeDataMerged(F_PAYMENTS, base);
  return payment;
}

/* ───────── Reviews (효율화 판단 이력) ───────── */

export async function listReviews(toolId?: string): Promise<ToolReview[]> {
  const all = await readDataUncached<ToolReview>(F_REVIEWS);
  const rows = toolId ? all.filter((r) => r.toolId === toolId) : all;
  return rows.sort((a, b) => (a.reviewedOn < b.reviewedOn ? 1 : -1));
}

export interface ReviewInput {
  reviewedOn: string;
  usageLevel?: ToolReview['usageLevel'];
  overlapWith?: string | null;
  decision?: ToolReview['decision'];
  reason?: string;
}

export async function addReview(toolId: string, input: ReviewInput): Promise<ToolReview> {
  if (!input.reviewedOn) throw new Error('판단일(reviewedOn)은 필수입니다.');
  const review: ToolReview = {
    id: randomUUID(),
    toolId,
    reviewedOn: input.reviewedOn,
    usageLevel: input.usageLevel,
    overlapWith: input.overlapWith || null,
    decision: input.decision,
    reason: input.reason?.trim() || undefined,
    createdAt: nowIso(),
  };
  const base = await readDataForWrite<ToolReview>(F_REVIEWS);
  base.push(review);
  await writeDataMerged(F_REVIEWS, base);
  return review;
}
