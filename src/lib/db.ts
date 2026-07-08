import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { put, list, del } from '@vercel/blob';
import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * Persistent JSON store — 3-tier resilient read pipeline.
 *
 * Write path (prod):
 *   blob put(allowOverwrite) → revalidateTag('db:<file>') → post-write verify.
 *   ⚠️ put 전에 del 금지 — del→put 은 list() 인덱스에서 파일이 사라져 보이는
 *   구간을 만들고(인덱스는 eventually consistent), 그 NOT_FOUND 가 시드
 *   폴백을 타면 빌드 시점 스냅샷으로 덮어써 누적 데이터가 유실된다
 *   (2026-06-07 inquiries 사고). `revalidateTag` flushes Next's shared
 *   data cache globally, so every serverless instance picks up the new
 *   value on its next read. Admin PUT also calls revalidatePath.
 *
 * Read path (prod, *Safe variants used by RSC pages):
 *   T1. blob fetch with up to 3 retries (250/500ms backoff) — absorbs
 *       transient network/CDN hiccups that used to make content flicker
 *       "on/off" between requests.
 *   T2. process-local LKG (last-known-good) cache — every successful
 *       blob read populates this map, so a subsequent failure within
 *       the same warm instance still serves the most recent real data.
 *   T3. bundled fs seed at /data/db/*.json (.vercelignore whitelisted)
 *       — last resort when both blob and LKG are unavailable (e.g.
 *       cold start during a blob outage). Seed is stale by definition,
 *       but "stale content" >> "missing content".
 *
 * Admin write path uses readSingle (non-Safe): it *must* throw on blob
 * failure so the merged payload isn't polluted by stale seed/LKG. A
 * user's save should fail loudly, not silently overwrite with old data.
 *
 * Dev (no BLOB_READ_WRITE_TOKEN): both reads and writes go to the local
 * filesystem — the fs seed path doubles as the dev store.
 */

const DB_DIR = path.join(process.cwd(), 'data', 'db');
// BLOB_DATA_PREFIX: Vercel Blob 은 public access 만 지원하므로 경로가 예측
// 가능하면 PII JSON (inquiries, admin-users, password-reset-tokens)이
// 공개 URL 로 유출됨. 운영에서는 반드시 추측 불가한 긴 랜덤 값으로 설정:
//   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
const BLOB_DATA_PREFIX_RAW = process.env.BLOB_DATA_PREFIX ?? 'db';
const BLOB_PREFIX = `${BLOB_DATA_PREFIX_RAW.replace(/[^a-zA-Z0-9_-]/g, '')}/`;

if (process.env.VERCEL && BLOB_DATA_PREFIX_RAW === 'db') {
  console.warn(
    '[db] WARNING: BLOB_DATA_PREFIX 가 설정되지 않아 db/*.json 파일이 ' +
      '예측 가능한 공개 URL 로 노출됩니다. PII 유출 위험이 있으므로 ' +
      'Vercel 환경변수에 랜덤 값을 지정하세요.'
  );
}

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// Retry tuning for blob reads. Transient Vercel Blob / CDN failures
// typically resolve in <1s; 3 attempts @ 250ms/500ms covers the common
// case without adding meaningful latency to the happy path (first
// attempt usually succeeds in <100ms).
const BLOB_READ_MAX_ATTEMPTS = 3;
const BLOB_READ_BACKOFF_MS = [0, 250, 500];

// Process-local last-known-good cache. Populated on every successful
// blob read; consulted only by the *Safe variants on failure. Does NOT
// persist across cold starts or serverless instance boundaries — that's
// what Next's shared data cache (via unstable_cache) is for. This map
// is the "belt" to unstable_cache's "suspenders".
const lastKnownGood = new Map<string, unknown>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function dbTag(filename: string) {
  return `db:${filename}`;
}

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function fsReadRaw(filename: string): unknown | null {
  const filePath = path.join(DB_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`[db] failed to parse ${filename}.json`, err);
    return null;
  }
}

function fsWriteRaw(filename: string, data: unknown) {
  ensureDir();
  const filePath = path.join(DB_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Sentinel: blob 에 명백히 없음. 일시 장애(fetch 실패 등)는 throw 로 구분.
const NOT_FOUND = Symbol('not_found');

/* ─────────────────────────────────────────────────────────
   Outbox + Tombstone — append 유실 방지 & 삭제 의도 영속
   ─────────────────────────────────────────────────────────
   배열 전체를 덮어쓰는 JSON store 는 어떤 read-modify-write 라도
   (전파 지연·stale 베이스 조합으로) 동시 추가 레코드를 잃거나, stale
   writer 가 이미 삭제된 레코드를 되살릴 수 있다. 두 메커니즘으로 봉인:

   1) Outbox (OUTBOX_FILES): append 레코드를 배열과 별개로 레코드별
      blob `outbox/<file>/<id>.json` 에 사본 저장. union-aware read/write
      가 배열에 없는 사본을 복원하므로 추가 유실이 구조적으로 불가능.

   2) Tombstone (TOMBSTONE_FILES): 삭제(removedIds)된 레코드의 key 를
      `tomb/<file>/<key>.json` 에 영속 기록. union 과 writeDataMerged 가
      tombstone key 를 항상 제외하므로, outbox 사본이 남아 있거나 stale
      writer 가 next 에 삭제분을 담고 있어도 부활하지 않는다.

   설계 핵심:
   - id/key 는 blob pathname 에서 추출 — 콘텐츠 fetch 성공에 청소를
     묶지 않는다 (fetch 한 번 실패로 삭제가 되살아나던 결함 차단).
   - union 은 base 에 없는 레코드만 콘텐츠 fetch (불필요 read 최소화).
   - list 는 커서로 전량 순회 (limit 잘림으로 인한 사각지대 제거). */
const OUTBOX_FILES = new Set(['inquiries', 'leads', 'reviews']);
// 삭제 의도 영속이 필요한 파일: 고객 데이터(부활=PII/스팸 재출현) + 보안
// 토큰(소비된 토큰 재사용 차단) + 관리자 계정(탈퇴/해임된 admin 부활 차단)
// + 파트너 계정(해지된 위탁업체 계정 부활 차단).
const TOMBSTONE_FILES = new Set([
  'inquiries', 'leads', 'reviews', 'password-reset-tokens', 'admin-users',
  'partner-accounts',
]);
const OUTBOX_HEAL_AGE_MS = 10 * 60 * 1000;        // 배열 수렴 확인 후 사본 청소까지 대기
const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 삭제 흔적 보존 기간 (key 만, PII 아님)
const OUTBOX_PAGE_LIMIT = 1000;

function outboxPrefix(filename: string) {
  return `${BLOB_PREFIX}outbox/${filename}/`;
}
function tombPrefix(filename: string) {
  return `${BLOB_PREFIX}tomb/${filename}/`;
}

// 파일별 레코드 식별 키 (중앙 등록 — read/write/outbox/tomb 모든 경로가 동일
// 키를 쓰도록 보장). 기본은 .id. id 가 없는 파일만 여기 등록.
const FILE_KEY: Record<string, (r: unknown) => string | undefined> = {
  'admin-users': (r) => (r as { email?: string }).email,
  'password-reset-tokens': (r) => (r as { token?: string }).token,
};
function keyOf(filename: string, r: unknown): string | null {
  const fn = FILE_KEY[filename];
  if (fn) {
    const k = fn(r);
    return typeof k === 'string' && k.length > 0 ? k : null;
  }
  if (r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string') {
    return (r as { id: string }).id;
  }
  return null;
}

// blob pathname 용 가역 인코딩 (base64url — 문자는 [A-Za-z0-9_-] 라 항상 안전).
// 이메일(@,.)·해시 등 어떤 키든 pathname 으로 쓸 수 있다. 디코드 없이도
// "키 K 가 tombstone 인가" 는 encKey(K) 의 집합 멤버십으로 판정하므로,
// list 결과(인코딩된 pathname segment)와 직접 비교한다.
function encKey(key: string): string | null {
  if (!key) return null;
  const e = Buffer.from(key, 'utf8').toString('base64url');
  if (e.length <= 200) return e;
  // 비현실적으로 긴 키(예: RFC 최대 길이 이메일)도 절대 null 이 되지 않게 —
  // null 은 tombstone 미기록 → 부활 창. 고정 길이 해시로 강등. 충돌 확률은
  // sha256 무작위성으로 무시 가능(~2^-256). ('h_' 접두는 가독 구분일 뿐.)
  return 'h_' + createHash('sha256').update(key, 'utf8').digest('base64url');
}
function encKeyOf(filename: string, r: unknown): string | null {
  const k = keyOf(filename, r);
  return k === null ? null : encKey(k);
}

interface BlobRef {
  enc: string;   // pathname segment = encKey(원본 키)
  url: string;
  uploadedAt: number;
}

// prefix 하위 blob 을 커서로 전량 나열하고 pathname 끝의 인코딩 키만 뽑는다
// (콘텐츠 fetch 없음 — 청소/제외 판정은 이것만으로 충분).
async function listKeyed(prefix: string): Promise<BlobRef[]> {
  const out: BlobRef[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: OUTBOX_PAGE_LIMIT, cursor });
    for (const b of page.blobs) {
      if (!b.pathname.startsWith(prefix)) continue;
      const rest = b.pathname.slice(prefix.length);
      if (!rest.endsWith('.json')) continue;
      const enc = rest.slice(0, -5);
      if (enc) out.push({ enc, url: b.url, uploadedAt: new Date(b.uploadedAt).getTime() });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

// tombstone 목록 — 재시도 포함. 모든 시도 실패 시 throw (fail-closed: 호출자가
// '삭제 여부를 확인 못 함' 을 인지하고 부활 위험 동작을 건너뛸 수 있게).
async function loadTombRefs(filename: string): Promise<BlobRef[]> {
  if (!hasBlob || !TOMBSTONE_FILES.has(filename)) return [];
  let lastErr: unknown;
  for (let a = 0; a < BLOB_READ_MAX_ATTEMPTS; a++) {
    if (a > 0) await sleep(BLOB_READ_BACKOFF_MS[a] ?? 500);
    try {
      return await listKeyed(tombPrefix(filename));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error(`[db:tomb] ${filename}: list 실패`);
}

// tombstone 1건 삭제 (재시도). 재생성(revive) 시 부활 차단 해제의 핵심이라
// best-effort 가 아니라 재시도한다. url 이 있으면 그것으로, 없으면 pathname 으로.
async function delTombstone(filename: string, enc: string, url?: string): Promise<void> {
  const target = url ?? `${tombPrefix(filename)}${enc}.json`;
  for (let a = 0; a < BLOB_READ_MAX_ATTEMPTS; a++) {
    if (a > 0) await sleep(BLOB_READ_BACKOFF_MS[a] ?? 500);
    try {
      await del(target);
      return;
    } catch (err) {
      if (a === BLOB_READ_MAX_ATTEMPTS - 1) {
        console.warn(`[db:tomb] ${filename}: revive del 실패 — 재생성 레코드가 일시적으로 가려질 수 있음`, err);
      }
    }
  }
}

// 삭제 의도 영속 — 인코딩 키별 tombstone blob 생성 (await, 부활 차단의 핵심).
async function putTombstones(filename: string, keys: string[], nowMs: number): Promise<void> {
  if (!hasBlob || !TOMBSTONE_FILES.has(filename)) return;
  const encs = keys.map((k) => encKey(k)).filter((e): e is string => e !== null);
  await Promise.all(
    encs.map((e) =>
      put(`${tombPrefix(filename)}${e}.json`, JSON.stringify({ at: nowMs }), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
      }).catch((err) => console.warn(`[db:tomb] ${filename}: put 실패`, err)),
    ),
  );
}

// 읽기 베이스 정합화: (1) tombstone 키는 base 에서 제거(읽기 자가치유 —
// 어떤 경위로 부활해 배열에 남아도 조회/다음 쓰기에서 사라짐), (2) outbox
// 파일은 배열에 없는 사본을 복원. tombstone list 가 끝내 실패하면 부활
// 위험을 피하기 위해 outbox 복원을 건너뛴다(fail-closed). 누락분만 fetch.
async function reconcile<T>(filename: string, base: T[]): Promise<T[]> {
  if (!hasBlob) return base;
  const isOutbox = OUTBOX_FILES.has(filename);
  const isTomb = TOMBSTONE_FILES.has(filename);
  if (!isOutbox && !isTomb) return base;

  let tomb = new Set<string>();
  let tombOk = true;
  if (isTomb) {
    try {
      tomb = new Set((await loadTombRefs(filename)).map((r) => r.enc));
    } catch (err) {
      tombOk = false;
      console.warn(`[db:tomb] ${filename}: list 실패 — 자가치유/복원 보류`, err);
    }
  }

  let result = base;
  if (tomb.size > 0) {
    const before = result.length;
    result = result.filter((r) => {
      const e = encKeyOf(filename, r);
      return e === null || !tomb.has(e);
    });
    if (result.length !== before) {
      console.warn(`[db:tomb] ${filename}: 조회 자가치유 — 부활분 ${before - result.length}건 제외`);
    }
  }

  // outbox 복원 — tomb 확인이 실패했으면(tombOk=false) 부활 위험을 피해 건너뜀.
  if (isOutbox && tombOk) {
    let refs: BlobRef[] = [];
    try {
      refs = await listKeyed(outboxPrefix(filename));
    } catch (err) {
      console.warn(`[db:outbox] ${filename}: list 실패 — 복원 생략`, err);
      return result;
    }
    const have = new Set(result.map((r) => encKeyOf(filename, r)).filter((e): e is string => e !== null));
    const missing = refs.filter((r) => !have.has(r.enc) && !tomb.has(r.enc));
    if (missing.length > 0) {
      const fetched: T[] = [];
      await Promise.all(
        missing.map(async (r) => {
          try {
            const res = await fetch(`${r.url}?_=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) fetched.push((await res.json()) as T);
          } catch {
            /* 항목 단위 실패는 무시 — 다음 접근에서 재시도 */
          }
        }),
      );
      if (fetched.length > 0) {
        console.warn(`[db:outbox] ${filename}: 배열 누락 ${fetched.length}건 복원`);
        result = [...result, ...fetched];
      }
    }
  }
  return result;
}

// 3상태 반환: 데이터 / 명백히 없음(NOT_FOUND) / 일시 장애(throw)
// fs seed fallback 은 NOT_FOUND 에만 적용되어야 함. 일시 장애를
// NOT_FOUND 로 취급하면 admin PUT 의 '기존 데이터 merge' 가
// seed 로 오염되어 사용자 저장분이 소실될 수 있음.
//
// Retry policy: transient failures (list/fetch throws, HTTP 5xx, HTTP
// 404 on the content URL right after a put — CDN propagation lag) get
// up to 3 attempts with backoff. list() no-match 도 즉시 확정하지 않고
// 재시도한다 — Vercel Blob 의 list 인덱스는 eventually consistent 라
// 실재하는 파일이 일시적으로 안 보일 수 있고, 그걸 NOT_FOUND 로 확정하면
// fs 시드 폴백 → 시드 베이스 덮어쓰기(데이터 유실)로 이어진다.
// 모든 시도가 no-match 일 때만 NOT_FOUND, 일부만 no-match 면 throw (모호).
async function blobReadRawUncached(filename: string): Promise<unknown | typeof NOT_FOUND> {
  const t0 = Date.now();
  let lastErr: unknown = null;
  let noMatchCount = 0;

  for (let attempt = 0; attempt < BLOB_READ_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BLOB_READ_BACKOFF_MS[attempt] ?? 500);
    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
      const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
      if (!match) {
        noMatchCount++;
        const note = attempt < BLOB_READ_MAX_ATTEMPTS - 1 ? ' — retrying' : '';
        console.warn(`[db:read] ${filename}: attempt ${attempt + 1} list() no-match (${blobs.length} entries)${note}`);
        continue;
      }
      // Vercel Blob 은 우리가 cacheControlMaxAge:0 으로 put 해도 응답에
      // public,max-age=60 을 강제로 붙인다. ?v=uploadedAt 만으론 부족 —
      // 직전 write 후 list() 가 stale uploadedAt 을 돌려주면 동일 URL 이라
      // CDN HIT 으로 60초간 옛 데이터가 반환됨. 매 호출마다 unique segment
      // 를 추가해 CDN 을 무조건 우회.
      const uploadedTs = match.uploadedAt ? new Date(match.uploadedAt).getTime() : 0;
      const bust = `?v=${uploadedTs}&_=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(`${match.url}${bust}`, { cache: 'no-store' });
      if (!res.ok) {
        // HTTP error is retryable (CDN propagation, transient 5xx).
        lastErr = new Error(`HTTP ${res.status}`);
        console.warn(`[db:read] ${filename}: attempt ${attempt + 1} HTTP ${res.status}, retrying`);
        continue;
      }
      const body = await res.json();
      const attemptNote = attempt > 0 ? ` after ${attempt} retry` : '';
      console.log(`[db:read] ${filename}: OK (${Date.now() - t0}ms${attemptNote}, uploaded=${match.uploadedAt})`);
      // Refresh the process-local LKG cache on every successful read so
      // the *Safe variants have a recent real snapshot if blob later
      // blips within this instance's lifetime.
      lastKnownGood.set(filename, body);
      return body;
    } catch (err) {
      lastErr = err;
      console.warn(`[db:read] ${filename}: attempt ${attempt + 1} threw, retrying`, err);
    }
  }

  // 전 시도 일관되게 no-match → 진짜 없는 것으로 확정.
  if (noMatchCount === BLOB_READ_MAX_ATTEMPTS) {
    console.log(`[db:read] ${filename}: NOT_FOUND (no-match ${noMatchCount}/${BLOB_READ_MAX_ATTEMPTS} attempts, ${Date.now() - t0}ms)`);
    return NOT_FOUND;
  }

  // All retries exhausted — caller decides whether to fall back (readSingleSafe)
  // or propagate (readSingle / admin PUT).
  throw lastErr ?? new Error(`[db] blob read failed ${filename} after ${BLOB_READ_MAX_ATTEMPTS} attempts`);
}

// Wrap the blob read with Next's data cache, tagged so writes can
// invalidate every serverless instance globally in one call.
// 반환: 데이터 | NOT_FOUND | (장애는 throw 해서 fs seed 오염 방지)
async function blobReadRaw(filename: string): Promise<unknown | typeof NOT_FOUND> {
  const cached = unstable_cache(
    async () => {
      const result = await blobReadRawUncached(filename);
      if (result === NOT_FOUND) throw NOT_FOUND; // 캐시 오염 방지
      return result;
    },
    ['db', filename],
    { tags: [dbTag(filename)], revalidate: 300 }
  );
  try {
    return await cached();
  } catch (err) {
    if (err === NOT_FOUND) return NOT_FOUND;
    throw err; // 일시 장애는 caller 에게 전파
  }
}

async function blobWriteRaw(filename: string, data: unknown) {
  // ⚠️ put 전에 del 하지 않는다 (2026-06-07 inquiries 유실 사고의 원인).
  // del→put 사이/직후에 list() 인덱스에서 파일이 사라진 것처럼 보이는 구간이
  // 생기고(인덱스는 eventually consistent — del 은 반영됐는데 put 이 아직인
  // 리플리카가 수 분간 NOT_FOUND 를 돌려줄 수 있음), 그 NOT_FOUND 가
  // readDataUncached 의 fs 시드 폴백을 타면 빌드 시점 스냅샷이 쓰기 베이스가
  // 되어 그 이후 누적 레코드가 통째로 덮어써진다.
  // allowOverwrite put 은 같은 pathname 의 in-place 갱신이라 인덱스에서
  // 사라지는 구간이 없다. CDN 캐시는 모든 read 가 unique query 로 우회하므로
  // del 에 의한 무효화가 필요 없다.
  const t0 = Date.now();
  const putRes = await put(`${BLOB_PREFIX}${filename}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  // 전체 Blob URL 은 비밀 prefix 를 포함하므로 로그에 남기지 않는다(PII Blob 노출 방지).
  void putRes;
  console.log(`[db:write] ${filename}: OK (${Date.now() - t0}ms)`);
}

async function readRaw(filename: string): Promise<unknown | null> {
  if (hasBlob) {
    const result = await blobReadRaw(filename);
    // fs seed fallback 은 "blob 에 명백히 없음(NOT_FOUND)" 일 때만.
    // 일시 장애(fetch/list 예외)는 blobReadRaw 가 throw 하므로 여기까지
    // 오지 않음 → admin PUT 이 잘못된 seed 로 merge 하지 않음.
    if (result === NOT_FOUND) return fsReadRaw(filename);
    return result;
  }
  return fsReadRaw(filename);
}

async function writeRaw(filename: string, data: unknown): Promise<void> {
  if (hasBlob) {
    await blobWriteRaw(filename, data);
    // Optimistically refresh LKG with what we just wrote — guarantees
    // the current warm instance has the freshest value even if the
    // post-write verify fetch hits a CDN edge that hasn't propagated yet.
    lastKnownGood.set(filename, data);
    try {
      revalidateTag(dbTag(filename));
      console.log(`[db:write] ${filename}: revalidateTag OK`);
    } catch (err) {
      console.warn(`[db:write] ${filename}: revalidateTag failed`, err);
    }
    // Post-write read-back (uncached) — 진단 전용. await 하면 매 write 마다
    // ~500ms 추가 → 어드민 응답이 느려진다. fire-and-forget 으로 백그라운드
    // 검증만 수행. 실패해도 사용자 응답에 영향 없음.
    blobReadRawUncached(filename)
      .then((verify) => {
        if (verify === NOT_FOUND) {
          console.warn(`[db:write] ${filename}: post-write read returned NOT_FOUND (CDN propagation delay?)`);
        } else {
          const ok = JSON.stringify(verify) === JSON.stringify(data);
          console.log(`[db:write] ${filename}: post-write read-back ${ok ? 'MATCH' : 'MISMATCH'}`);
        }
      })
      .catch((err) => {
        console.warn(`[db:write] ${filename}: post-write read-back threw`, err);
      });
    return;
  }
  if (process.env.VERCEL) {
    // Vercel serverless fs is read-only. Refuse the write with a clear signal
    // instead of silently losing data.
    throw new Error(
      'DB write failed: BLOB_READ_WRITE_TOKEN is not set. ' +
        'Create a Vercel Blob store and link it to this project (Dashboard → Storage → Blob).'
    );
  }
  fsWriteRaw(filename, data);
}

/* ─────────────────────────────────────────────────────────
   Public API (all async)
   ───────────────────────────────────────────────────────── */

// Generic defaults to `any` for backwards-compat with call sites that read+mutate
// without an explicit type argument. New code should still specify <T>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readData<T = any>(filename: string): Promise<T[]> {
  const data = await readRaw(filename);
  return Array.isArray(data) ? (data as T[]) : [];
}

// unstable_cache 를 우회해 blob 에서 직접 읽는다.
// ⚠️ display(조회) 용도 전용 — NOT_FOUND/장애 시 시드·LKG 폴백으로
// 가용성을 우선하므로 read-modify-write 의 베이스로 쓰면 유실 위험.
// 쓰기 베이스가 필요하면 readDataForWrite + writeDataMerged 를 사용할 것.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataUncached<T = any>(filename: string): Promise<T[]> {
  if (hasBlob) {
    try {
      const result = await blobReadRawUncached(filename);
      if (result === NOT_FOUND) {
        // Blob에 파일이 명백히 없음(NOT_FOUND) → fs 시드로 fallback.
        const seed = fsReadRaw(filename);
        const base = Array.isArray(seed) ? (seed as T[]) : [];
        return await reconcile(filename, base);
      }
      if (Array.isArray(result)) {
        lastKnownGood.set(filename, result);
        // reconcile — tombstone 자가치유 + outbox 누락 복원.
        return await reconcile(filename, result as T[]);
      }
      return [];
    } catch (err) {
      // display 전용이므로 가용성 우선: 일시 장애는 LKG → seed → [] 로 강등.
      // (쓰기 경로는 readDataForWrite 가 별도로 throw 한다) 강등 베이스에도
      // reconcile 을 적용해 동시-장애 구간에도 정합 뷰를 제공.
      console.warn(`[db:read] ${filename}: uncached read 실패 — LKG/seed 폴백 (display)`, err);
      const lkg = lastKnownGood.get(filename);
      const base = Array.isArray(lkg)
        ? (lkg as T[])
        : (() => { const s = fsReadRaw(filename); return Array.isArray(s) ? (s as T[]) : []; })();
      try {
        return await reconcile(filename, base);
      } catch {
        return base;
      }
    }
  }
  const data = fsReadRaw(filename);
  return Array.isArray(data) ? (data as T[]) : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeData<T = any>(filename: string, data: T[]): Promise<void> {
  await writeRaw(filename, data);
}

// read-modify-write 의 "쓰기 베이스" 전용 read.
// readDataUncached 와 달리 NOT_FOUND 를 번들 시드로 메우지 않는다.
// 빌드 시점 시드를 베이스로 수정 후 통째로 쓰면 빌드 이후 누적된 레코드가
// 전부 덮어써진다 (2026-06-07 inquiries 유실 사고의 메커니즘). 데이터가
// 존재했던 흔적(LKG 또는 비어있지 않은 시드)이 있는데 blob 에서 안 보이면
// list() 전파 지연으로 간주하고 throw — 쓰기 자체를 실패시키는 것이
// 조용한 유실보다 낫다. 시드조차 비어 있는 진짜 첫 부트스트랩만 [] 로 시작.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataForWrite<T = any>(filename: string): Promise<T[]> {
  if (!hasBlob) {
    const data = fsReadRaw(filename);
    return Array.isArray(data) ? (data as T[]) : [];
  }
  const result = await blobReadRawUncached(filename); // 일시 장애는 throw 그대로 전파
  if (result !== NOT_FOUND) {
    if (Array.isArray(result)) {
      lastKnownGood.set(filename, result);
      // reconcile — tombstone 자가치유 + outbox 누락 복원으로 정합 쓰기 베이스.
      return await reconcile(filename, result as T[]);
    }
    // 비배열(단일객체/오염) 을 조용히 [] 로 바꾸면 이어지는 쓰기가 파일을
    // 통째로 교체한다 — 배열 파일이 아니면 명백한 오용이므로 거부.
    throw new Error(`[db] ${filename}: 배열 파일이 아닙니다 (readDataForWrite 오용 또는 내용 오염).`);
  }
  const lkg = lastKnownGood.get(filename);
  const seed = fsReadRaw(filename);
  const hadData = (Array.isArray(lkg) && lkg.length > 0) || (Array.isArray(seed) && seed.length > 0);
  if (hadData) {
    throw new Error(
      `[db] ${filename}: blob 에서 NOT_FOUND 지만 기존 데이터 흔적(LKG/seed)이 있습니다. ` +
        'list() 전파 지연 의심 — 유실 방지를 위해 쓰기 베이스 제공을 거부합니다. 잠시 후 재시도하세요.'
    );
  }
  return await reconcile(filename, [] as T[]);
}

// 단일객체(싱글턴) 파일의 "쓰기 베이스" 전용 read — readDataForWrite 의 싱글턴 버전.
// readSingleUncached 와 달리 blob 일시 장애를 삼키지 않고 throw 하며, 기존 데이터
// 흔적(LKG/seed)이 있는데 blob 에서 NOT_FOUND 면 쓰기 베이스 제공을 거부한다.
// 이것이 없으면 Blob 블립 중 admin 저장 시 stale seed/{} 위에 한 키만 병합해
// 통째로 덮어써, 배포 이후 누적 편집분이 유실될 수 있다(진단 DATA-2).
// 진짜 첫 저장(부트스트랩)만 null 을 돌려주어 호출부의 `?? {}`/`?? DEFAULT` 로 시작.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleForWrite<T = any>(filename: string): Promise<T | null> {
  const isObj = (v: unknown): boolean => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!hasBlob) {
    const data = fsReadRaw(filename);
    return isObj(data) ? (data as T) : null;
  }
  const result = await blobReadRawUncached(filename); // 일시 장애는 throw 그대로 전파
  if (result !== NOT_FOUND) {
    if (isObj(result)) {
      lastKnownGood.set(filename, result);
      return result as T;
    }
    if (Array.isArray(result)) {
      throw new Error(`[db] ${filename}: 배열 파일입니다 (readSingleForWrite 오용).`);
    }
    // result === null 등 → 아래 NOT_FOUND 와 동일하게 hadData 검사로 진행
  }
  const lkg = lastKnownGood.get(filename);
  const seed = fsReadRaw(filename);
  const hadData = isObj(lkg) || isObj(seed);
  if (hadData) {
    throw new Error(
      `[db] ${filename}: blob 에서 값 없음(NOT_FOUND)이지만 기존 데이터 흔적(LKG/seed)이 있습니다. ` +
        'list() 전파 지연 의심 — 유실 방지를 위해 쓰기 베이스 제공을 거부합니다. 잠시 후 재시도하세요.'
    );
  }
  return null; // 진짜 첫 저장(부트스트랩)
}

export interface WriteMergedOptions {
  /** 이번 쓰기에서 의도적으로 삭제/소비하는 레코드 키 — 영구 부활 차단(tombstone) */
  removedIds?: string[];
  /** 의도적 재생성(예: 삭제됐던 이메일로 admin 재발급) — 기존 tombstone 을 무시하고
   *  이 키들은 살린다. removedIds 와 동시에 한 키를 넣지 말 것. */
  revivedIds?: string[];
  /** @deprecated 파일별 키는 FILE_KEY 에 중앙 등록 — 이 옵션은 무시된다. */
  keyFn?: (r: unknown) => string | undefined;
}

// lost-update 방지 + 삭제 의도 영속 쓰기.
//  1) put 직전 fresh 재읽기로 'next 에 없는데 blob 엔 있는' 동시 추가분을 보존.
//  2) outbox 사본에만 있는(배열에서 빠진) 레코드도 복원.
//  3) tombstone(removedIds 영속 기록)에 든 키는 merged 결과에서 항상 제외 —
//     outbox 잔존이나 stale writer 의 next 에 삭제분이 있어도 부활 불가.
//     단 revivedIds(의도적 재생성)는 예외로 살린다.
// fresh read 실패 시 merge 는 생략하되, tombstone 제외와 outbox 복원은 수행.
// 키 추출은 FILE_KEY 중앙 등록(keyOf) — 키 없는 레코드는 merge/tombstone no-op.
export async function writeDataMerged<T>(
  filename: string,
  next: T[],
  options: WriteMergedOptions = {},
): Promise<void> {
  const key = (r: unknown) => keyOf(filename, r);
  const enc = (r: unknown) => encKeyOf(filename, r);
  const removed = new Set(options.removedIds ?? []);
  const revived = new Set(options.revivedIds ?? []);
  // 교집합 가드: 같은 키가 삭제+재생성에 동시에 오면 재생성이 이긴다(고아 tombstone 방지).
  for (const k of revived) removed.delete(k);
  const removedEnc = new Set([...removed].map((k) => encKey(k)).filter((e): e is string => e !== null));
  const revivedEnc = new Set([...revived].map((k) => encKey(k)).filter((e): e is string => e !== null));
  const nowMs = Date.now();

  // tombstone 목록 1회 로드 (재시도 포함). 제외 필터·청소·revive del 이 공유한다.
  // 실패(tombOk=false) 시 부활 위험 동작(outbox 복원)은 보류한다.
  let tombRefs: BlobRef[] = [];
  let tombOk = true;
  if (TOMBSTONE_FILES.has(filename)) {
    try {
      tombRefs = await loadTombRefs(filename);
    } catch (err) {
      tombOk = false;
      console.warn(`[db:tomb] ${filename}: list 실패 — 부활 위험 동작(outbox 복원) 보류`, err);
    }
  }

  // 의도적 재생성: 해당 tombstone 을 list 로 얻은 url 로 삭제(재시도) — 영구 부활
  // 차단 해제의 핵심이므로 best-effort 가 아니라 재시도한다. in-memory 에서도 빼서
  // 이번 쓰기는 무조건 보존(아래 tombEnc 에서 revived 제외).
  if (revivedEnc.size > 0) {
    const urlByEnc = new Map(tombRefs.map((t) => [t.enc, t.url]));
    await Promise.all([...revivedEnc].map((e) => delTombstone(filename, e, urlByEnc.get(e))));
  }
  // 삭제 의도를 영속 — 이후 단계가 모두 이 tombstone 을 신뢰한다.
  if (removed.size > 0) await putTombstones(filename, [...removed], nowMs);

  let merged = next;
  let freshEnc: Set<string> | null = null;
  try {
    const freshRaw = hasBlob ? await blobReadRawUncached(filename) : fsReadRaw(filename);
    if (freshRaw === NOT_FOUND && next.length > 0) {
      console.warn(`[db:write-merged] ${filename}: fresh read NOT_FOUND — merge 생략 (list 전파 지연 의심)`);
    }
    if (Array.isArray(freshRaw)) {
      const fresh = freshRaw as T[];
      freshEnc = new Set(fresh.map(enc).filter((e): e is string => e !== null));
      const nextEnc = new Set(next.map(enc).filter((e): e is string => e !== null));
      const resurrected = fresh.filter((r) => {
        const e = enc(r);
        return e !== null && !nextEnc.has(e) && !removedEnc.has(e);
      });
      if (resurrected.length > 0) {
        console.warn(
          `[db:write-merged] ${filename}: 동시 쓰기 감지 — ${resurrected.length}건 보존`,
          resurrected.map(key),
        );
        merged = [...next, ...resurrected];
      }
    }
  } catch (err) {
    console.warn(`[db:write-merged] ${filename}: merge 용 fresh read 실패 — merge 생략`, err);
  }

  const tombEnc = new Set(tombRefs.map((t) => t.enc));
  for (const e of removedEnc) tombEnc.add(e);
  for (const e of revivedEnc) tombEnc.delete(e); // 재생성 키는 제외 대상에서 뺀다

  // outbox 복원 — 배열에서 빠진 append 사본을 되살린다. tomb 확인 실패 시
  // 부활 위험을 피해 복원 자체를 건너뛴다(fail-closed).
  let outboxRefs: BlobRef[] = [];
  if (hasBlob && OUTBOX_FILES.has(filename) && tombOk) {
    try {
      outboxRefs = await listKeyed(outboxPrefix(filename));
    } catch (err) {
      console.warn(`[db:outbox] ${filename}: list 실패 — 쓰기 복원 생략`, err);
    }
    if (outboxRefs.length > 0) {
      const haveEnc = new Set(merged.map(enc).filter((e): e is string => e !== null));
      const missing = outboxRefs.filter((e) => !haveEnc.has(e.enc) && !tombEnc.has(e.enc));
      if (missing.length > 0) {
        const fetched: T[] = [];
        await Promise.all(
          missing.map(async (e) => {
            try {
              const res = await fetch(`${e.url}?_=${Date.now()}`, { cache: 'no-store' });
              if (res.ok) fetched.push((await res.json()) as T);
            } catch { /* 다음 접근에서 재시도 */ }
          }),
        );
        if (fetched.length > 0) {
          console.warn(`[db:outbox] ${filename}: 배열 누락 ${fetched.length}건을 쓰기에 복원`);
          merged = [...merged, ...fetched];
        }
      }
    }
  }

  // tombstone 제외 — 삭제 의도가 outbox 복원·stale next 어느 쪽으로도 부활 못 하게
  // 최종 결과에서 한 번 더 걸러낸다 (revivedIds 는 위에서 tombEnc 에서 빠졌으므로 보존).
  if (tombEnc.size > 0) {
    const before = merged.length;
    merged = merged.filter((r) => {
      const e = enc(r);
      return e === null || !tombEnc.has(e);
    });
    if (merged.length !== before) {
      console.warn(`[db:tomb] ${filename}: 삭제 의도 적용 — ${before - merged.length}건 제외`);
    }
  }

  await writeRaw(filename, merged);

  // ── 청소 (fire-and-forget; pathname 기반이라 콘텐츠 fetch 실패와 무관) ──
  // outbox: 삭제(tombstone) entry 즉시 제거 + '배열 영속 확인 후 10분 경과' 제거.
  //         방금 복원된 신규 entry 는 freshEnc 에 없어 보존.
  for (const e of outboxRefs) {
    const isTombstoned = tombEnc.has(e.enc);
    const healed = freshEnc?.has(e.enc) === true && nowMs - e.uploadedAt > OUTBOX_HEAL_AGE_MS;
    if (isTombstoned || healed) {
      del(e.url).catch((err) => console.warn(`[db:outbox] ${filename}: entry 청소 실패`, err));
    }
  }
  // tombstone: 대응 outbox entry 가 없고 TTL(90일) 경과한 것만 제거 (위에서 로드한 tombRefs 재사용).
  if (tombRefs.length > 0) {
    const liveOutbox = new Set(outboxRefs.map((e) => e.enc));
    for (const t of tombRefs) {
      if (!liveOutbox.has(t.enc) && nowMs - t.uploadedAt > TOMBSTONE_TTL_MS) {
        del(t.url).catch(() => {});
      }
    }
  }
}

// 고객 유입 레코드의 내구성 있는 append.
// ① 레코드별 outbox blob 을 먼저 생성 (create — 다른 쓰기와 충돌 불가)
// ② 배열에 merged write. ②가 실패해도 ①이 성공했으면 레코드는 이미
//    내구 저장된 상태 — 이후 읽기/쓰기의 outbox union 이 자동 복원하므로
//    접수 자체는 성공으로 처리한다 (merged: false 로 구분만).
export async function appendData<T extends { id: string }>(
  filename: string,
  record: T,
): Promise<{ merged: boolean }> {
  let durable = false;
  if (hasBlob && OUTBOX_FILES.has(filename)) {
    const e = encKey(record.id);
    if (e) {
      try {
        await put(`${outboxPrefix(filename)}${e}.json`, JSON.stringify(record, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 0,
        });
        durable = true;
      } catch (err) {
        console.warn(`[db:append] ${filename}: outbox put 실패 — 배열 쓰기로만 진행`, err);
      }
    } else {
      console.warn(`[db:append] ${filename}: id(${record.id}) 인코딩 실패 — outbox 생략`);
    }
  }
  try {
    const base = await readDataForWrite<T>(filename);
    if (!base.some((r) => r.id === record.id)) base.push(record);
    await writeDataMerged(filename, base);
    return { merged: true };
  } catch (err) {
    if (durable) {
      console.error(
        `[db:append] ${filename}: 배열 쓰기 실패 — outbox 영속분(${record.id})이 다음 접근에서 자동 복원됨`,
        err,
      );
      return { merged: false };
    }
    throw err;
  }
}

// 파일의 모든 tombstone 을 제거 (백업 복원 전용). 복원은 스냅샷을 '권위 있는
// 진실'로 보는 full-replace 이므로, 과거 삭제로 남은 tombstone 이 복원된 레코드를
// 다시 지우지 못하게 먼저 비운다. list·del 모두 재시도(재삭제 필터가 재시도하는
// 만큼 청소도 끈질겨야 비대칭 유실이 없다). 끝내 실패하면 false 반환 →
// restoreData 가 fail-closed 로 복원을 중단(거짓 success 후 재삭제 방지).
export async function purgeTombstones(filename: string): Promise<boolean> {
  if (!hasBlob || !TOMBSTONE_FILES.has(filename)) return true;
  let refs: BlobRef[];
  try {
    refs = await loadTombRefs(filename); // 재시도 포함, 실패 시 throw
  } catch (err) {
    console.warn(`[db:tomb] ${filename}: purge list 실패 — 복원 중단 신호`, err);
    return false;
  }
  if (refs.length === 0) return true;
  const results = await Promise.all(
    refs.map(async (r) => {
      for (let a = 0; a < BLOB_READ_MAX_ATTEMPTS; a++) {
        if (a > 0) await sleep(BLOB_READ_BACKOFF_MS[a] ?? 500);
        try { await del(r.url); return true; } catch { /* 재시도 */ }
      }
      return false;
    }),
  );
  const ok = results.every(Boolean);
  console.log(`[db:tomb] ${filename}: 복원 위해 tombstone ${refs.length}건 제거 (성공=${ok})`);
  return ok;
}

// 백업 복원 전용 쓰기 — 스냅샷 배열로 full-replace 하되, 먼저 tombstone 을
// 비워 복원된(과거 삭제된) 레코드가 reconcile/merge 필터에 다시 지워지지 않게 한다.
// merge 안 함(복원은 의도적 전체 교체). outbox-only 의 post-snapshot append 는
// 다음 read 의 reconcile 이 보존한다. tombstone 청소가 끝내 실패하면 throw —
// 거짓 success 로 복원분이 조용히 재삭제되는 것보다, 명확히 실패시켜 재시도를
// 유도한다(복원 호출자는 pre-restore 스냅샷 롤백 포인트를 이미 갖는다).
// 잔여 한계: del 성공 후에도 Blob list 인덱스 전파 지연(수초) 동안 같은 파일에
// 쓰기가 일어나면 stale tombstone 으로 복원분이 재삭제될 수 있다 — 복원은 드물고
// 의도적인 작업이라 수용 가능한 잔여 창으로 둔다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function restoreData<T = any>(filename: string, data: T[]): Promise<void> {
  const purged = await purgeTombstones(filename); // 먼저 삭제 흔적 제거 → 복원 레코드 생존 보장
  if (!purged) {
    throw new Error(
      `[db] ${filename}: 복원 전 tombstone 정리에 실패했습니다. 복원된 데이터가 ` +
        '재삭제될 위험이 있어 복원을 중단합니다. 잠시 후 다시 시도하세요. (pre-restore 스냅샷으로 롤백 가능)'
    );
  }
  await writeRaw(filename, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingle<T = any>(filename: string): Promise<T | null> {
  const data = await readRaw(filename);
  if (data === null || Array.isArray(data)) return null;
  return data as T;
}

// unstable_cache 를 우회해 blob 에서 직접 읽는다 (단일 객체 버전).
// 배너·알림 등 즉시 반영이 필요한 데이터에 사용.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleUncached<T = any>(filename: string): Promise<T | null> {
  if (hasBlob) {
    try {
      const result = await blobReadRawUncached(filename);
      if (result === NOT_FOUND) return fsReadRaw(filename) as T | null;
      if (result !== null && !Array.isArray(result)) {
        lastKnownGood.set(filename, result);
        return result as T;
      }
      return null;
    } catch {
      const lkg = lastKnownGood.get(filename);
      if (lkg && !Array.isArray(lkg)) return lkg as T;
      return fsReadRaw(filename) as T | null;
    }
  }
  const data = fsReadRaw(filename);
  if (data === null || Array.isArray(data)) return null;
  return data as T;
}

// 프론트엔드 RSC 용: blob 일시 장애 시 LKG → fs seed 순으로 최후 수단 제공.
// Failure ladder:
//   1. blob read (with 3x retry inside blobReadRawUncached)
//   2. process LKG cache (populated on prior successful reads)
//   3. bundled fs seed
//   4. null
// Admin PUT 처럼 '사용자 저장분 보호' 가 필요한 경로는 여전히 readSingle
// (Safe 아님) 을 써서 throw 받도록 유지 — LKG/seed 로 오염될 위험 없음.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleSafe<T = any>(filename: string): Promise<T | null> {
  try {
    return await readSingle<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed after retries, trying LKG/seed`, err);
    const lkg = lastKnownGood.get(filename);
    if (lkg && !Array.isArray(lkg)) {
      console.log(`[db:safe] ${filename}: served from LKG cache`);
      return lkg as T;
    }
    try {
      const seed = fsReadRaw(filename);
      if (seed && !Array.isArray(seed)) {
        console.log(`[db:safe] ${filename}: served from fs seed`);
        return seed as T;
      }
    } catch { /* ignore */ }
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataSafe<T = any>(filename: string): Promise<T[]> {
  try {
    return await readData<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed after retries, trying LKG/seed`, err);
    const lkg = lastKnownGood.get(filename);
    if (Array.isArray(lkg)) {
      console.log(`[db:safe] ${filename}: served from LKG cache`);
      return lkg as T[];
    }
    try {
      const seed = fsReadRaw(filename);
      if (Array.isArray(seed)) {
        console.log(`[db:safe] ${filename}: served from fs seed`);
        return seed as T[];
      }
    } catch { /* ignore */ }
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeSingle<T = any>(filename: string, data: T): Promise<void> {
  await writeRaw(filename, data);
}

/* ─────────────────────────────────────────────────────────
   Low-level escape hatches (rarely needed)
   ───────────────────────────────────────────────────────── */

export async function deleteData(filename: string): Promise<void> {
  if (hasBlob) {
    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
      const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
      if (match) await del(match.url);
      revalidateTag(dbTag(filename));
    } catch (err) {
      console.error(`[db] blob delete failed for ${filename}`, err);
    }
  } else {
    const filePath = path.join(DB_DIR, `${filename}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

export function invalidateCache(filename?: string) {
  // Retained for callers — revalidate the shared tag globally.
  if (filename) {
    try { revalidateTag(dbTag(filename)); } catch { /* outside request scope */ }
  }
}

export function isBlobEnabled(): boolean {
  return hasBlob;
}
