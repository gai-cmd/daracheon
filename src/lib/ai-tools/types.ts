/**
 * 전사 AI툴·비용 통합관리 CRM — 도메인 타입.
 *
 * 설계서 v2(2026-07-30) ③ 데이터 모델의 PostgreSQL DDL 을 이 저장소의
 * JSON Blob 스토어(src/lib/db.ts)에 맞춰 옮긴 것. Supabase 대신 기존 인프라를
 * 재사용하므로 uuid/타임스탬프는 애플리케이션에서 생성한다.
 *
 * 저장 파일(각각 배열):
 *   ai-teams          teams
 *   ai-tools          ai_tools (핵심)
 *   ai-tool-payments  tool_payments
 *   ai-tool-reviews   tool_reviews
 */

export type Region = 'JP' | 'KR' | 'BD';
export type Currency = 'USD' | 'JPY' | 'KRW' | 'BDT';

/** 툴 라이프사이클 상태 */
export type ToolStatus = 'active' | 'trial' | 'review' | 'cancelled';

/** 데이터 신뢰도 — 미확정 금액/정보를 집계에서 "+α" 로 분리 표시하는 근거 */
export type DataState = 'confirmed' | 'estimated' | 'todo';

/** 효율화 판단 이력의 사용 수준·결정 */
export type UsageLevel = 'high' | 'mid' | 'low' | 'none';
export type ReviewDecision = 'keep' | 'downgrade' | 'merge' | 'cancel';

export interface Team {
  id: string;
  name: string; // '개발부' · '영업부' · '한국팀' · '방글팀'
  region: Region;
}

export interface AiTool {
  id: string;
  name: string; // 'Claude Max 20x'
  vendor?: string; // 'Anthropic'
  category?: string; // 'LLM' | '코딩' | '슬라이드' | '이미지' | '기타'
  teamId?: string; // teams.id
  accountEmail?: string;
  plan?: string; // 'Max 20x' · 'Pro' · 'Plus'
  url?: string; // 서비스·콘솔 URL (Account info 시트 URL 컬럼. 비밀값 금지 — 링크만)
  currency: Currency; // 계약 통화. 기본 USD
  monthlyCost?: number | null; // 계약 통화 기준. null = 미확정
  billingDay?: number | null; // 결제일 1~31
  paymentMethod?: string; // '법인카드 -4301' · 'Stripe'
  status: ToolStatus;
  dataState: DataState;
  startedOn?: string | null; // ISO date
  owner?: string; // 담당자
  evidenceUrl?: string; // 영수증·슬랙 링크 (비밀값 금지 — 링크만)
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolPayment {
  id: string;
  toolId: string; // ai_tools.id
  paidOn: string; // ISO date
  amount: number;
  currency: Currency;
  amountJpy?: number | null; // 환산액 (통지·집계 캐시)
  receiptUrl?: string;
  createdAt: string;
}

export interface ToolReview {
  id: string;
  toolId: string; // ai_tools.id
  reviewedOn: string; // ISO date
  usageLevel?: UsageLevel;
  overlapWith?: string | null; // 중복 기능 툴 id
  decision?: ReviewDecision;
  reason?: string;
  createdAt: string;
}

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  active: '사용중',
  trial: '트라이얼',
  review: '검토중',
  cancelled: '해지',
};

export const DATA_STATE_LABEL: Record<DataState, string> = {
  confirmed: '확정',
  estimated: '추정',
  todo: '확인필요',
};

export const USAGE_LEVEL_LABEL: Record<UsageLevel, string> = {
  high: '높음',
  mid: '보통',
  low: '낮음',
  none: '미사용',
};

export const REVIEW_DECISION_LABEL: Record<ReviewDecision, string> = {
  keep: '유지',
  downgrade: '다운그레이드',
  merge: '통합',
  cancel: '해지',
};

export const CURRENCIES: Currency[] = ['USD', 'JPY', 'KRW', 'BDT'];
export const TOOL_STATUSES: ToolStatus[] = ['active', 'trial', 'review', 'cancelled'];
export const DATA_STATES: DataState[] = ['confirmed', 'estimated', 'todo'];
