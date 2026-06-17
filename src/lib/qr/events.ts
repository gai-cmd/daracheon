import { put, list } from '@vercel/blob';
import { readData, readDataForWrite, writeDataMerged } from '@/lib/db';
import type { QrEvent } from './types';

/**
 * QR 이벤트 저장 — 이벤트별 불변(create-only) blob.
 *
 * 설계 근거(적대적 검증 채택): 배열 버킷 `qr-events-YYYY-MM` 은 매 스캔마다
 * 전체 배열을 다시 쓰므로 Vercel Blob 의 ~60초 eventual consistency 창에서
 * 동시 스캔(부스/홈쇼핑 스파이크)이 서로를 덮어써 유실된다. 이벤트를 각자
 * 고유 pathname 의 불변 blob 으로 쓰면(allowOverwrite:false = storage.ts 의
 * 원자적 CAS 와 동일 프리미티브) 충돌이 구조적으로 불가능하고 RMW 도 없다.
 *
 *   {PREFIX}qr-events/<YYYY-MM>/<type>/<id>.json
 *
 * 분석은 대상 기간이 걸치는 월 prefix 만 list→fetch 해 집계(analytics.ts).
 * launch 볼륨에선 온리드 집계로 충분하고, 커지면 일/월 롤업으로 이관(P1).
 *
 * dev(블롭 토큰 없음): 단일 로컬 배열 파일로 폴백해 개발이 가능하게 한다.
 */

// db.ts 와 동일한 prefix 파생 (PII 노출 방지용 비밀 prefix). 이벤트는 동일 prefix 하위.
const BLOB_PREFIX = `${(process.env.BLOB_DATA_PREFIX ?? 'db').replace(/[^a-zA-Z0-9_-]/g, '')}/`;
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const DEV_FILE = 'qr-events-local';
const LIST_PAGE = 1000;
const FETCH_CONCURRENCY = 24;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}
function eventPath(ev: QrEvent): string {
  return `${BLOB_PREFIX}qr-events/${monthKey(new Date(ev.at))}/${ev.type}/${ev.id}.json`;
}

/** 월 prefix 목록 — KST 변환으로 경계일이 인접 월로 새는 것을 막기 위해 양옆 1개월씩 더 포함. */
function monthPrefixes(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 1));
  while (cur <= end) {
    out.push(`${BLOB_PREFIX}qr-events/${monthKey(cur)}/`);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

/** 이벤트 1건 기록. 핫패스(스캔)는 라우트에서 next/after 로 비차단 호출한다. */
export async function recordEvent(ev: QrEvent): Promise<void> {
  if (!hasBlob) {
    const list = await readDataForWrite<QrEvent>(DEV_FILE);
    if (!list.some((e) => e.id === ev.id)) {
      list.push(ev);
      await writeDataMerged(DEV_FILE, list);
    }
    return;
  }
  try {
    await put(eventPath(ev), JSON.stringify(ev), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false, // 원자적 create — 충돌(동일 id)은 곧 멱등이므로 무시
      contentType: 'application/json',
      cacheControlMaxAge: 31536000, // 불변
    });
  } catch (err) {
    // 동일 id 재시도(이미 존재)면 무시, 그 외는 로깅만 — 분석 비핵심.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/exist|conflict|409/i.test(msg)) {
      console.warn(`[qr:events] put 실패 (${ev.type}/${ev.id})`, msg);
    }
  }
}

async function fetchJson(url: string): Promise<QrEvent | null> {
  try {
    const res = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as QrEvent;
  } catch {
    return null;
  }
}

/** 기간 내 이벤트 전량을 모아 반환 (월 prefix list → 병렬 fetch → ts 필터). */
export async function queryEvents(from: Date, to: Date): Promise<QrEvent[]> {
  if (!hasBlob) {
    const all = await readData<QrEvent>(DEV_FILE);
    const f = from.getTime();
    const t = to.getTime();
    return all.filter((e) => {
      const ts = Date.parse(e.at);
      return !Number.isNaN(ts) && ts >= f && ts <= t;
    });
  }

  // 1) 대상 월 prefix 들에서 blob URL 전량 수집 (커서 페이지네이션)
  const urls: string[] = [];
  for (const prefix of monthPrefixes(from, to)) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, limit: LIST_PAGE, cursor });
      for (const b of page.blobs) {
        if (b.pathname.endsWith('.json')) urls.push(b.url);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }

  // 2) 병렬 fetch (동시성 제한)
  const events: QrEvent[] = [];
  for (let i = 0; i < urls.length; i += FETCH_CONCURRENCY) {
    const chunk = urls.slice(i, i + FETCH_CONCURRENCY);
    const got = await Promise.all(chunk.map(fetchJson));
    for (const e of got) if (e) events.push(e);
  }

  // 3) 기간 필터
  const f = from.getTime();
  const t = to.getTime();
  return events.filter((e) => {
    const ts = Date.parse(e.at);
    return !Number.isNaN(ts) && ts >= f && ts <= t;
  });
}
