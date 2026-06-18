import crypto from 'crypto';
import { put, list } from '@vercel/blob';
import { readData, readDataForWrite, writeDataMerged } from '@/lib/db';

/**
 * 정품인증(일련번호 위조방지) — 제품 단위 고유 시리얼.
 *
 * 정직한 전제(설계 검증 채택): 시리얼은 포장에 인쇄된 bearer 토큰이라 "정품 보장"이
 * 아니라 "위조 의심 탐지" 도구다. 신호는 (a) 추측 불가, (b) 스캔 분포 이상,
 * (c) 어드민 대조. 고객 문구는 절대 과대약속하지 않는다("등록된 정품 코드"이지
 * "내용물이 진품"이 아님). 읽기 실패는 "정품 아님"이 아니라 "확인 불가"로.
 *
 * 저장(이벤트/쿠폰과 동일 내구 패턴):
 *  - 배치:     qr-serial-batches/<batchId>.json        (불변)
 *  - 배치인덱스: qr-serial-index/<batchId>.json         (불변, batch→codes — 전량 스캔 회피)
 *  - 시리얼:   qr-serials/<serial>.json                (불변, 코드 O(1) 조회)
 *  - 활성마커: qr-serial-activation/<key>.json         (불변 CAS — 최초 1회 = 최초인증)
 *  - 스캔:     qr-serial-scans/<key>/<id>.json          (불변, key=HMAC(serial) — 시리얼만으로 위치이력 열람 불가)
 *  - 무효:     qr-serial-void/<serial>.json            (가변 마커 — 어드민 무효처리)
 * 활성/재스캔 상태는 스캔 blob 집계로 파생.
 */

const BLOB_PREFIX = `${(process.env.BLOB_DATA_PREFIX ?? 'db').replace(/[^a-zA-Z0-9_-]/g, '')}/`;
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const SERIAL_DIR = `${BLOB_PREFIX}qr-serials/`;
const BATCH_DIR = `${BLOB_PREFIX}qr-serial-batches/`;
const INDEX_DIR = `${BLOB_PREFIX}qr-serial-index/`;
const ACT_DIR = `${BLOB_PREFIX}qr-serial-activation/`;
const VOID_DIR = `${BLOB_PREFIX}qr-serial-void/`;
const scanDir = (key: string) => `${BLOB_PREFIX}qr-serial-scans/${key}/`;
const DEV_SERIALS = 'qr-serials-local';
const DEV_BATCHES = 'qr-serial-batches-local';
const DEV_SCANS = 'qr-serial-scans-local';

// 32자 base32 (2의 거듭제곱 → 5비트 마스킹으로 modulo 편향 제거). I·L·O·U 제외.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SERIAL_BODY = 10;

export function genSerialCode(): string {
  const bytes = new Uint8Array(SERIAL_BODY);
  crypto.getRandomValues(bytes);
  let body = '';
  for (let i = 0; i < SERIAL_BODY; i++) body += B32[bytes[i] & 31];
  return `ZA-${body}${checkChar(body)}`;
}
function checkChar(body: string): string {
  let sum = 0;
  for (const ch of body) sum += B32.indexOf(ch);
  return B32[sum % 32];
}
/** 형식 + 체크문자 검증 (blob 조회 전에 잘못된 코드를 걸러 타이밍/부하 차단). */
export function isValidSerial(code: string): boolean {
  const m = /^ZA-([0-9A-HJKMNP-TV-Z]{11})$/.exec(code);
  if (!m) return false;
  const body = m[1].slice(0, 10);
  for (const ch of body) if (B32.indexOf(ch) < 0) return false;
  return checkChar(body) === m[1][10];
}
export function normalizeSerial(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
function serialKey(serial: string): string {
  const secret = process.env.SERIAL_SCAN_SECRET || process.env.ADMIN_SESSION_SECRET || 'serial-dev-secret';
  return crypto.createHmac('sha256', secret).update(serial).digest('hex').slice(0, 32);
}

export interface SerialBatch {
  id: string;
  product: string;
  lot?: string;
  quantity: number;
  createdAt: string;
}
export interface Serial {
  code: string;
  batchId: string;
  product: string;
  lot?: string;
  createdAt: string;
}
export interface SerialScan {
  id: string;
  at: string;
  country?: string;
  region?: string;
  city?: string;
  device?: string;
  vid?: string;
}
export type AuthVerdict = 'genuine-first' | 'genuine-rescan' | 'suspicious' | 'voided' | 'not-registered' | 'invalid' | 'unavailable';
export interface SerialAuth {
  code: string;
  verdict: AuthVerdict;
  product?: string;
  lot?: string;
  firstScanAt?: string;
  firstScanRegion?: string;
  scanCount: number;
  distinctRegions: number;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const r = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) {
    if (r.status === 404) return null;
    throw new Error(`HTTP ${r.status}`);
  }
  return (await r.json()) as T;
}
async function listAll(prefix: string) {
  const out: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    for (const b of page.blobs) out.push({ pathname: b.pathname, url: b.url });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

/* ───────── 배치 생성 ───────── */
export async function createBatch(input: { product: string; lot?: string; quantity: number }): Promise<{ batch: SerialBatch; codes: string[] }> {
  const qty = Math.max(1, Math.min(5000, Math.floor(input.quantity)));
  const now = new Date().toISOString();
  const batch: SerialBatch = {
    id: `b-${Date.now().toString(36)}-${genSerialCode().slice(3, 8)}`,
    product: input.product.trim(),
    ...(input.lot?.trim() ? { lot: input.lot.trim() } : {}),
    quantity: qty,
    createdAt: now,
  };
  const seen = new Set<string>();
  const codes: string[] = [];
  while (codes.length < qty) {
    const c = genSerialCode();
    if (!seen.has(c)) { seen.add(c); codes.push(c); }
  }

  if (!hasBlob) {
    const batches = await readDataForWrite<SerialBatch>(DEV_BATCHES);
    batches.push(batch);
    await writeDataMerged(DEV_BATCHES, batches);
    const serials = await readDataForWrite<Serial>(DEV_SERIALS);
    for (const code of codes) serials.push({ code, batchId: batch.id, product: batch.product, lot: batch.lot, createdAt: now });
    await writeDataMerged(DEV_SERIALS, serials);
    return { batch, codes };
  }

  await put(`${BATCH_DIR}${batch.id}.json`, JSON.stringify(batch), blobOpts(false));
  await put(`${INDEX_DIR}${batch.id}.json`, JSON.stringify({ codes }), blobOpts(false));
  for (let i = 0; i < codes.length; i += 24) {
    await Promise.all(
      codes.slice(i, i + 24).map((code) =>
        put(`${SERIAL_DIR}${code}.json`, JSON.stringify({ code, batchId: batch.id, product: batch.product, lot: batch.lot, createdAt: now } as Serial), blobOpts(false)).catch(() => {}),
      ),
    );
  }
  return { batch, codes };
}
function blobOpts(overwrite: boolean) {
  return { access: 'public' as const, addRandomSuffix: false, allowOverwrite: overwrite, contentType: 'application/json', cacheControlMaxAge: overwrite ? 0 : 31536000 };
}

/** 시리얼 레코드 조회. 없음=null, 일시 장애=throw (호출자가 '확인불가'로 구분). */
async function getSerialRecord(code: string): Promise<Serial | null> {
  if (!hasBlob) {
    const arr = await readData<Serial>(DEV_SERIALS);
    return arr.find((s) => s.code === code) ?? null;
  }
  const { blobs } = await list({ prefix: `${SERIAL_DIR}${code}.json`, limit: 1 });
  const match = blobs.find((b) => b.pathname === `${SERIAL_DIR}${code}.json`);
  return match ? await fetchJson<Serial>(match.url) : null;
}
async function isVoided(code: string): Promise<boolean> {
  if (!hasBlob) return false;
  try {
    const { blobs } = await list({ prefix: `${VOID_DIR}${code}.json`, limit: 1 });
    return blobs.some((b) => b.pathname === `${VOID_DIR}${code}.json`);
  } catch {
    return false;
  }
}
async function getScans(key: string): Promise<SerialScan[]> {
  if (!hasBlob) {
    const arr = await readData<SerialScan & { key: string }>(DEV_SCANS);
    return arr.filter((s) => s.key === key);
  }
  const blobs = await listAll(scanDir(key));
  const got = await Promise.all(blobs.map((b) => fetchJson<SerialScan>(b.url).catch(() => null)));
  return got.filter((s): s is SerialScan => !!s);
}
async function recordScan(key: string, scan: Omit<SerialScan, 'id'>): Promise<void> {
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  if (!hasBlob) {
    const arr = await readDataForWrite<SerialScan & { key: string }>(DEV_SCANS);
    arr.push({ id, key, ...scan });
    await writeDataMerged(DEV_SCANS, arr);
    return;
  }
  await put(`${scanDir(key)}${id}.json`, JSON.stringify({ id, ...scan }), blobOpts(false)).catch(() => {});
}
/** 활성(최초인증) 마커 원자 생성. 최초 1회만 성공(true) — 그게 canonical 최초인증. */
async function activate(key: string, at: string, region?: string): Promise<boolean> {
  if (!hasBlob) return false;
  try {
    await put(`${ACT_DIR}${key}.json`, JSON.stringify({ at, region }), blobOpts(false));
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist|conflict|409/i.test(msg)) return false; // 이미 활성
    return false;
  }
}

function classify(scans: SerialScan[], voided: boolean): { verdict: AuthVerdict; firstScanAt?: string; firstScanRegion?: string; scanCount: number; distinctRegions: number } {
  const all = [...scans].sort((a, b) => a.at.localeCompare(b.at));
  // vid+지역 de-dup 으로 단순 새로고침/봇 반복을 합산하지 않음
  const distinctVisitors = new Set(all.map((s) => s.vid || `${s.at}`)).size;
  const regions = new Set(all.map((s) => s.region || s.country).filter(Boolean) as string[]);
  const first = all[0];
  let verdict: AuthVerdict;
  if (voided) verdict = 'voided';
  else if (all.length <= 1) verdict = 'genuine-first';
  // 고객 노출 의심은 의도적으로 높은 임계값 (오탐 방지) — 다지역 3+ 또는 방문자 8+
  else if (regions.size >= 3 || distinctVisitors >= 8) verdict = 'suspicious';
  else verdict = 'genuine-rescan';
  return { verdict, firstScanAt: first?.at, firstScanRegion: first?.city || first?.region || first?.country, scanCount: all.length, distinctRegions: regions.size };
}

const NOT_REGISTERED = (code: string): SerialAuth => ({ code, verdict: 'not-registered', scanCount: 0, distinctRegions: 0 });
const INVALID = (code: string): SerialAuth => ({ code, verdict: 'invalid', scanCount: 0, distinctRegions: 0 });
const UNAVAILABLE = (code: string): SerialAuth => ({ code, verdict: 'unavailable', scanCount: 0, distinctRegions: 0 });

/** 읽기 전용 인증 조회 (스캔 기록 안 함 — 봇/프리페치). */
export async function lookupSerial(code: string): Promise<SerialAuth> {
  if (!isValidSerial(code)) return INVALID(code);
  try {
    const serial = await getSerialRecord(code);
    if (!serial) return NOT_REGISTERED(code);
    const key = serialKey(code);
    const [scans, voided] = await Promise.all([getScans(key), isVoided(code)]);
    const c = classify(scans, voided);
    return { code, product: serial.product, lot: serial.lot, ...c };
  } catch {
    return UNAVAILABLE(code);
  }
}

/** 인증 + 스캔 기록 (실제 고객 스캔). 검증→조회→기록→활성(CAS)→판정. */
export async function authenticate(code: string, scan: Omit<SerialScan, 'id'>): Promise<SerialAuth> {
  if (!isValidSerial(code)) return INVALID(code);
  let serial: Serial | null;
  try {
    serial = await getSerialRecord(code);
  } catch {
    return UNAVAILABLE(code); // 일시 장애 → 확인불가 (절대 '정품 아님' 아님)
  }
  if (!serial) return NOT_REGISTERED(code);
  const key = serialKey(code);
  try {
    await recordScan(key, scan);
    await activate(key, scan.at, scan.region || scan.country);
  } catch {
    /* 기록 실패해도 판정은 진행 */
  }
  let scans: SerialScan[] = [];
  let voided = false;
  try {
    [scans, voided] = await Promise.all([getScans(key), isVoided(code)]);
  } catch {
    /* 집계 실패 → 최소 1회로 처리 */
  }
  if (scans.length === 0) scans = [{ id: 'now', ...scan }];
  const c = classify(scans, voided);
  return { code, product: serial.product, lot: serial.lot, ...c };
}

/* ───────── 어드민 ───────── */
export async function listBatches(): Promise<SerialBatch[]> {
  if (!hasBlob) return (await readData<SerialBatch>(DEV_BATCHES)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const blobs = await listAll(BATCH_DIR);
  const got = await Promise.all(blobs.map((b) => fetchJson<SerialBatch>(b.url).catch(() => null)));
  return got.filter((b): b is SerialBatch => !!b).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getBatchCodes(batchId: string): Promise<string[]> {
  if (!hasBlob) return (await readData<Serial>(DEV_SERIALS)).filter((s) => s.batchId === batchId).map((s) => s.code);
  const { blobs } = await list({ prefix: `${INDEX_DIR}${batchId}.json`, limit: 1 });
  const match = blobs.find((b) => b.pathname === `${INDEX_DIR}${batchId}.json`);
  if (!match) return [];
  const idx = await fetchJson<{ codes: string[] }>(match.url).catch(() => null);
  return idx?.codes ?? [];
}
export async function batchStats(batchId: string): Promise<{ total: number; activated: number; suspicious: number }> {
  const codes = await getBatchCodes(batchId);
  let activated = 0;
  let suspicious = 0;
  for (let i = 0; i < codes.length; i += 16) {
    await Promise.all(
      codes.slice(i, i + 16).map(async (code) => {
        const scans = await getScans(serialKey(code)).catch(() => []);
        if (scans.length > 0) activated++;
        const regions = new Set(scans.map((s) => s.region || s.country).filter(Boolean) as string[]);
        const visitors = new Set(scans.map((s) => s.vid || s.at)).size;
        if (regions.size >= 3 || visitors >= 8) suspicious++;
      }),
    );
  }
  return { total: codes.length, activated, suspicious };
}
export async function voidSerial(code: string): Promise<void> {
  if (!hasBlob) return;
  await put(`${VOID_DIR}${code}.json`, JSON.stringify({ at: new Date().toISOString() }), blobOpts(true)).catch(() => {});
}
