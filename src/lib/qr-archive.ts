import { put, list } from '@vercel/blob';

/**
 * QR per-record blob 아카이버 (Tier 1 서버측 보강 — 진단 P3).
 *
 * createSnapshot 은 "컬렉션 → 단일 JSON" 설계라 per-record blob
 * (qr-events/<월>/<type>/<id>.json, qr-coupons/<code>.json, qr-serials/…)
 * 을 원천적으로 담지 못한다. 이 모듈이 그 공백을 메운다: 레코드들을
 * 월 단위 롤업 JSON 으로 합쳐 `_qr-archive/` 아래 저장한다.
 *
 * 위치가 `_snapshots/` 가 아닌 이유(중요): pruneSnapshots 가 `_snapshots/`
 * 아래를 label 별 최근 N 개만 남기고 삭제한다 — 월 아카이브를 거기 두면
 * 보존 정책에 걸려 지워지는 유실 벡터가 된다. `_qr-archive/` 는 prune 대상이
 * 아니고, 로컬 Tier 4 백업(`_snapshots/` 만 제외)에는 자동 포함된다.
 *
 * poison 방지(진단 DATA-4 원칙): 레코드 fetch 가 하나라도 실패한 월은
 * 아카이브를 덮어쓰지 않는다 — 불완전본으로 직전 완전본을 대체하면
 * 복구 시 실데이터가 사라지는 poison 이 되기 때문. 해당 월은 degraded 로
 * 보고하고 다음 실행에서 재시도된다.
 */

const BLOB_PREFIX = `${(process.env.BLOB_DATA_PREFIX ?? 'db').replace(/[^a-zA-Z0-9_-]/g, '')}/`;
const ARCHIVE_PREFIX = `${BLOB_PREFIX}_qr-archive/`;
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LIST_PAGE = 1000;
const FETCH_CONCURRENCY = 8;

interface ArchiveFile {
  version: 1;
  archivedAt: string;
  source: string;
  count: number;
  /** 원본 상대 경로(prefix 제외) → 파싱된 레코드 본문 */
  records: Record<string, unknown>;
}

export interface QrArchiveResult {
  ok: boolean;
  /** 아카이브 파일별 레코드 수 (예: 'events-2026-07': 24) */
  archived: Record<string, number>;
  /** fetch 실패로 이번 회차에 덮어쓰지 않은 대상 (다음 실행에서 재시도) */
  degraded: string[];
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** prefix 아래 전체 blob 나열 (cursor 페이지네이션). */
async function listAll(prefix: string): Promise<{ pathname: string; url: string }[]> {
  const out: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: LIST_PAGE });
    for (const b of page.blobs) out.push({ pathname: b.pathname, url: b.url });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

/** blob 들을 병렬 fetch 해 records 맵으로. 하나라도 실패하면 null (poison 방지). */
async function fetchRecords(
  blobs: { pathname: string; url: string }[]
): Promise<Record<string, unknown> | null> {
  const records: Record<string, unknown> = {};
  let failed = false;
  for (let i = 0; i < blobs.length; i += FETCH_CONCURRENCY) {
    const batch = blobs.slice(i, i + FETCH_CONCURRENCY);
    await Promise.all(
      batch.map(async (b) => {
        try {
          const res = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          records[b.pathname.slice(BLOB_PREFIX.length)] = await res.json();
        } catch (err) {
          console.error(`[qr-archive] fetch 실패: ${b.pathname}`, err);
          failed = true;
        }
      })
    );
    if (failed) return null;
  }
  return records;
}

async function writeArchive(name: string, source: string, records: Record<string, unknown>): Promise<void> {
  const body: ArchiveFile = {
    version: 1,
    archivedAt: new Date().toISOString(),
    source,
    count: Object.keys(records).length,
    records,
  };
  await put(`${ARCHIVE_PREFIX}${name}.json`, JSON.stringify(body), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

/**
 * QR per-record 레코드를 월 롤업으로 아카이브.
 *
 * 대상: qr-events 는 현재 월 + 직전 월(경계일 지각 이벤트 커버 — events.ts 의
 * monthPrefixes 와 같은 이유), qr-coupons / qr-serials 는 전량(작고 create-only).
 * 과거 월 events 아카이브는 이미 확정본이 있으므로 다시 만들지 않는다.
 */
export async function archiveQrRecords(now: Date = new Date()): Promise<QrArchiveResult | null> {
  if (!hasBlob) {
    console.warn('[qr-archive] blob disabled — skipped');
    return null;
  }

  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const targets: { name: string; source: string }[] = [
    { name: `events-${monthKey(prev)}`, source: `qr-events/${monthKey(prev)}/` },
    { name: `events-${monthKey(now)}`, source: `qr-events/${monthKey(now)}/` },
    { name: 'coupons', source: 'qr-coupons/' },
    { name: 'serials', source: 'qr-serials/' },
  ];

  const archived: Record<string, number> = {};
  const degraded: string[] = [];

  for (const t of targets) {
    const blobs = await listAll(`${BLOB_PREFIX}${t.source}`);
    // 레코드 0개인 대상(예: 아직 발급 전인 serials)은 빈 아카이브를 쓰지 않는다 —
    // "빈 값을 정상처럼 기록" 하지 않는 DATA-4 원칙. 기존 아카이브가 있다면 보존된다.
    if (blobs.length === 0) continue;
    const records = await fetchRecords(blobs);
    if (records === null) {
      degraded.push(t.name);
      continue;
    }
    await writeArchive(t.name, t.source, records);
    archived[t.name] = blobs.length;
  }

  if (degraded.length) {
    console.error(`[qr-archive] DEGRADED — 덮어쓰지 않은 대상: ${degraded.join(', ')}`);
  }
  return { ok: degraded.length === 0, archived, degraded };
}
