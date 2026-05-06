import crypto from 'crypto';

/**
 * GA4 Data API 클라이언트.
 *
 * 필요 ENV:
 *   GA4_PROPERTY_ID            — GA4 속성 ID (숫자 9자리)
 *   GA4_SERVICE_ACCOUNT_EMAIL  — 서비스 계정 client_email
 *   GA4_PRIVATE_KEY            — 서비스 계정 private_key (\n 그대로 또는 실제 줄바꿈)
 *
 * 사전 작업: 위 SA 를 GA4 속성에 "뷰어" 권한으로 추가, GCP 프로젝트에 Analytics Data API 활성화.
 */

function getEnv(name: string): string | undefined {
  return process.env[name]?.trim();
}

function getPrivateKey(): string | undefined {
  const raw = getEnv('GA4_PRIVATE_KEY');
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n');
}

export function getGa4Config(): {
  propertyId?: string;
  serviceAccountEmail?: string;
  ready: boolean;
} {
  const propertyId = getEnv('GA4_PROPERTY_ID');
  const serviceAccountEmail = getEnv('GA4_SERVICE_ACCOUNT_EMAIL');
  const privateKey = getPrivateKey();
  return {
    propertyId,
    serviceAccountEmail,
    ready: !!(propertyId && serviceAccountEmail && privateKey),
  };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const email = getEnv('GA4_SERVICE_ACCOUNT_EMAIL');
  const key = getPrivateKey();
  if (!email || !key) {
    throw new Error('GA4_SERVICE_ACCOUNT_EMAIL / GA4_PRIVATE_KEY 가 설정되지 않았습니다.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GA4 OAuth 토큰 발급 실패: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error('GA4 OAuth 응답에 access_token 이 없습니다.');
  return body.access_token;
}

/* ───────── runReport ───────── */

interface DateRange {
  startDate: string; // YYYY-MM-DD or "yesterday", "Ndaysago"
  endDate: string;
}

interface RunReportRequest {
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dateRanges: DateRange[];
  orderBys?: Array<{ metric?: { metricName: string }; desc?: boolean }>;
  limit?: number;
}

interface ReportRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

interface ReportResponse {
  rows?: ReportRow[];
  rowCount?: number;
}

async function runReport(req: RunReportRequest): Promise<ReportResponse> {
  const cfg = getGa4Config();
  if (!cfg.propertyId) throw new Error('GA4_PROPERTY_ID 가 설정되지 않았습니다.');

  const token = await getAccessToken();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${cfg.propertyId}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GA4 runReport 실패: HTTP ${res.status} ${text.slice(0, 500)}`);
  }
  return (await res.json()) as ReportResponse;
}

/* ───────── 일일 리포트 데이터 ───────── */

export interface Ga4DailyTotals {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  averageSessionDuration: number; // seconds
  bounceRate: number; // 0..1
}

export interface Ga4PageRow {
  pagePath: string;
  pageTitle: string;
  views: number;
}

export interface Ga4SourceRow {
  source: string;
  medium: string;
  sessions: number;
}

export interface Ga4DeviceRow {
  category: string;
  sessions: number;
}

export interface Ga4DailyReport {
  yesterday: Ga4DailyTotals;
  dayBefore: Ga4DailyTotals;
  topPages: Ga4PageRow[];
  topSources: Ga4SourceRow[];
  devices: Ga4DeviceRow[];
  dateLabel: string; // 어제 날짜 (KST 기준)
}

const TOTAL_METRICS = [
  'activeUsers',
  'newUsers',
  'sessions',
  'screenPageViews',
  'averageSessionDuration',
  'bounceRate',
] as const;

function parseTotals(rows?: ReportRow[]): Ga4DailyTotals {
  const v = rows?.[0]?.metricValues?.map((m) => Number(m.value) || 0) ?? [];
  const [activeUsers = 0, newUsers = 0, sessions = 0, screenPageViews = 0, averageSessionDuration = 0, bounceRate = 0] = v;
  return { activeUsers, newUsers, sessions, screenPageViews, averageSessionDuration, bounceRate };
}

/** 어제(KST) + 그 전날 totals + topN 리스트들을 한 번에 가져옴. */
export async function fetchDailyReport(): Promise<Ga4DailyReport> {
  // GA4 기본 시간대는 속성 설정에 따름. KST 속성이라면 "yesterday" 가 KST 어제.
  // 안전을 위해 고정 날짜 계산: KST 기준 어제/그저께.
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const ymd = (offsetDays: number) => {
    const d = new Date(nowKst);
    d.setUTCDate(d.getUTCDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };
  const yesterday = ymd(1);
  const dayBefore = ymd(2);

  const [totalsRes, topPagesRes, topSourcesRes, devicesRes] = await Promise.all([
    runReport({
      metrics: TOTAL_METRICS.map((name) => ({ name })),
      dateRanges: [
        { startDate: yesterday, endDate: yesterday },
        { startDate: dayBefore, endDate: dayBefore },
      ],
    }),
    runReport({
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      dateRanges: [{ startDate: yesterday, endDate: yesterday }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 5,
    }),
    runReport({
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      dateRanges: [{ startDate: yesterday, endDate: yesterday }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    }),
    runReport({
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
      dateRanges: [{ startDate: yesterday, endDate: yesterday }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
  ]);

  // dateRanges 가 2개일 때 GA4 는 row 마다 dateRange 차원이 자동 추가되지 않고
  // 행 자체가 분리되어 반환됨. 그래서 각 dateRange 별로 한 번씩 호출하는 게 안전하지만,
  // dateRanges 배열을 쓰면 응답이 [range0_row, range1_row] 순서로 옴.
  const rows = totalsRes.rows ?? [];
  return {
    yesterday: parseTotals([rows[0]]),
    dayBefore: parseTotals([rows[1]]),
    topPages: (topPagesRes.rows ?? []).map((r) => ({
      pagePath: r.dimensionValues?.[0]?.value ?? '',
      pageTitle: r.dimensionValues?.[1]?.value ?? '',
      views: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    topSources: (topSourcesRes.rows ?? []).map((r) => ({
      source: r.dimensionValues?.[0]?.value ?? '',
      medium: r.dimensionValues?.[1]?.value ?? '',
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    devices: (devicesRes.rows ?? []).map((r) => ({
      category: r.dimensionValues?.[0]?.value ?? '',
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    dateLabel: yesterday,
  };
}
