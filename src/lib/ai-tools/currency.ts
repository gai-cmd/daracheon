import type { Currency } from './types';

/**
 * 통화 → JPY 환산.
 *
 * 설계 원칙(설계서 ③): 비용은 계약 통화 그대로 저장하고, JPY 환산은 표시·집계
 * 시점에만 적용한다. 환율 API 미사용 시 "고정 환율 테이블" 을 쓴다.
 *
 * 고정 환율은 근사치이며 운영 중 조정한다. Vercel 환경변수 `AI_TOOLS_FX_JSON`
 * 으로 오버라이드 가능 — 예: {"USD":152,"KRW":0.11,"BDT":1.35}. (JPY=1 고정)
 */

// 1 <통화> = N JPY (2026 상반기 근사 기준값)
const DEFAULT_FX: Record<Currency, number> = {
  JPY: 1,
  USD: 155,
  KRW: 0.11,
  BDT: 1.4,
};

let cachedFx: Record<Currency, number> | null = null;

export function fxTable(): Record<Currency, number> {
  if (cachedFx) return cachedFx;
  const table = { ...DEFAULT_FX };
  const raw = process.env.AI_TOOLS_FX_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Record<Currency, number>>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'number' && Number.isFinite(v) && v > 0 && k in table) {
          table[k as Currency] = v;
        }
      }
    } catch {
      console.warn('[ai-tools:fx] AI_TOOLS_FX_JSON 파싱 실패 — 기본 환율 사용');
    }
  }
  cachedFx = table;
  return table;
}

/** 계약 통화 금액을 JPY 로 환산. amount 가 null/undefined 면 null 반환(미확정). */
export function toJpy(amount: number | null | undefined, currency: Currency): number | null {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null;
  const rate = fxTable()[currency] ?? 1;
  return Math.round(amount * rate);
}

/** ¥39,194 형태 표시 */
export function formatJpy(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  JPY: '¥',
  KRW: '₩',
  BDT: '৳',
};

/** 계약 통화 그대로 표시: $220 · ₩30,000 */
export function formatAmount(amount: number | null | undefined, currency: Currency): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  const sym = CURRENCY_SYMBOL[currency] ?? '';
  return `${sym}${amount.toLocaleString('en-US')}`;
}
