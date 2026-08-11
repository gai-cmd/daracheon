import type { AiTool } from './types';

/**
 * 벤더 비용 API 어댑터 — "영수증·금액을 사람이 옮겨 적지 않게" 하는 수집 계층.
 *
 * 툴 레코드의 costSource 값이 아래 어댑터 키와 맞으면, 지정한 달의 실제 청구액을
 * 벤더 API 에서 읽어온다. 읽은 값은 store 의 결제 이력(addPayment)과
 * monthlyCost/dataState 갱신에 그대로 쓰인다.
 *
 * 적용 범위 주의 — 여기서 얻는 금액은 **API 사용료**다.
 * Claude Max·ChatGPT Plus 같은 구독 좌석 요금은 두 벤더 모두 공개 API 로
 * 조회할 수 없다(콘솔·청구 메일에만 존재). 그런 항목은 costSource 를 비워 두고
 * 청구 메일 경로로 처리한다.
 *
 * 출처(2026-08 확인):
 *   Anthropic  https://platform.claude.com/docs/en/manage-claude/usage-cost-api
 *              GET /v1/organizations/cost_report — Admin API key(sk-ant-admin…),
 *              USD, 일 단위 버킷. 개인 계정은 Admin API 사용 불가.
 *   OpenAI     https://developers.openai.com/api/reference/resources/admin/
 *              subresources/organization/subresources/usage/methods/costs
 *              GET /v1/organization/costs — Admin key, bucket_width=1d,
 *              start_time/end_time 은 Unix seconds, limit 최대 180.
 */

export type CostSourceKey = 'anthropic-api' | 'openai-api';

export interface MonthCost {
  /** 계약 통화 기준 금액 (두 어댑터 모두 USD) */
  amount: number;
  currency: 'USD';
  /** 집계 대상 월의 마지막 날 (YYYY-MM-DD) — 결제 이력의 paidOn */
  paidOn: string;
  /** 사람이 확인할 콘솔 주소 (영수증 대용 근거 링크) */
  evidenceUrl: string;
  source: CostSourceKey;
}

interface Adapter {
  label: string;
  /** 이 어댑터가 요구하는 환경변수 이름 */
  envKey: string;
  fetchMonth(key: string, year: number, month1: number): Promise<MonthCost>;
}

/** 해당 월의 [시작, 다음달 시작) UTC 경계 */
function monthRange(year: number, month1: number) {
  const start = new Date(Date.UTC(year, month1 - 1, 1));
  const end = new Date(Date.UTC(year, month1, 1));
  const lastDay = new Date(Date.UTC(year, month1, 0)).toISOString().slice(0, 10);
  return { start, end, lastDay };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers, cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`JSON 파싱 실패: ${text.slice(0, 200)}`);
  }
}

/** 중첩 응답에서 금액 필드만 재귀로 합산 — 스키마 변화에 덜 부서지도록. */
function sumNumeric(node: unknown, pick: (obj: Record<string, unknown>) => unknown): number {
  if (Array.isArray(node)) return node.reduce<number>((acc, v) => acc + sumNumeric(v, pick), 0);
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const v = pick(obj);
    if (v !== undefined && v !== null) {
      const n = typeof v === 'string' ? Number(v) : (v as number);
      if (Number.isFinite(n)) return n;
    }
    return Object.values(obj).reduce<number>((acc, v2) => acc + sumNumeric(v2, pick), 0);
  }
  return 0;
}

const ADAPTERS: Record<CostSourceKey, Adapter> = {
  'anthropic-api': {
    label: 'Anthropic API (Cost Report)',
    envKey: 'ANTHROPIC_ADMIN_API_KEY',
    async fetchMonth(key, year, month1) {
      const { start, end, lastDay } = monthRange(year, month1);
      const url =
        'https://api.anthropic.com/v1/organizations/cost_report' +
        `?starting_at=${start.toISOString()}&ending_at=${end.toISOString()}`;
      const json = await getJson(url, {
        'anthropic-version': '2023-06-01',
        'x-api-key': key,
        'user-agent': 'zoellife-ai-tools-crm/1.0 (https://zoellife.com)',
      });
      // 금액은 USD 최소단위(센트) 문자열로 내려온다 — 달러로 환산.
      const cents = sumNumeric(json, (o) =>
        'amount' in o && typeof o.amount !== 'object' ? o.amount : undefined,
      );
      return {
        amount: round2(cents / 100),
        currency: 'USD',
        paidOn: lastDay,
        evidenceUrl: 'https://console.anthropic.com/settings/cost',
        source: 'anthropic-api',
      };
    },
  },
  'openai-api': {
    label: 'OpenAI API (Costs)',
    envKey: 'OPENAI_ADMIN_API_KEY',
    async fetchMonth(key, year, month1) {
      const { start, end, lastDay } = monthRange(year, month1);
      const url =
        'https://api.openai.com/v1/organization/costs' +
        `?start_time=${Math.floor(start.getTime() / 1000)}` +
        `&end_time=${Math.floor(end.getTime() / 1000)}` +
        '&bucket_width=1d&limit=180';
      const json = await getJson(url, { authorization: `Bearer ${key}` });
      // { data: [ { results: [ { amount: { value, currency } } ] } ] }
      const total = sumNumeric(json, (o) =>
        'value' in o && 'currency' in o ? o.value : undefined,
      );
      return {
        amount: round2(total),
        currency: 'USD',
        paidOn: lastDay,
        evidenceUrl: 'https://platform.openai.com/settings/organization/billing/history',
        source: 'openai-api',
      };
    },
  },
};

export const COST_SOURCE_KEYS = Object.keys(ADAPTERS) as CostSourceKey[];

export function isCostSourceKey(v: unknown): v is CostSourceKey {
  return typeof v === 'string' && (COST_SOURCE_KEYS as string[]).includes(v);
}

/** 어댑터 키가 붙어 있고 해당 환경변수가 설정된 툴만 수집 대상. */
export function collectible(tool: AiTool): CostSourceKey | null {
  const src = tool.costSource;
  if (!isCostSourceKey(src)) return null;
  return process.env[ADAPTERS[src].envKey]?.trim() ? src : null;
}

export async function fetchMonthCost(
  source: CostSourceKey,
  year: number,
  month1: number,
): Promise<MonthCost> {
  const adapter = ADAPTERS[source];
  const key = process.env[adapter.envKey]?.trim();
  if (!key) throw new Error(`${adapter.envKey} 미설정 — ${adapter.label} 수집 불가`);
  return adapter.fetchMonth(key, year, month1);
}

/** 설정 진단용 — 어떤 어댑터가 준비됐는지 (키 값 자체는 절대 노출하지 않는다). */
export function adapterStatus() {
  return COST_SOURCE_KEYS.map((k) => ({
    source: k,
    label: ADAPTERS[k].label,
    env_key: ADAPTERS[k].envKey,
    configured: Boolean(process.env[ADAPTERS[k].envKey]?.trim()),
  }));
}
