import { put, list } from '@vercel/blob';
import { readData, readDataForWrite, writeDataMerged } from '@/lib/db';
import type { Coupon } from './types';

/**
 * 할인 쿠폰 저장 — 발급은 불변(create-only) blob `qr-coupons/<code>.json`,
 * 사용 처리는 별도 마커 `qr-coupon-used/<code>.json`. 발급 내역은 절대 유실/변조
 * 되지 않고, 사용 여부만 마커로 토글한다. (이벤트 저장과 동일 패턴)
 * dev(블롭 토큰 없음): 로컬 배열로 폴백.
 */

const BLOB_PREFIX = `${(process.env.BLOB_DATA_PREFIX ?? 'db').replace(/[^a-zA-Z0-9_-]/g, '')}/`;
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const COUPON_DIR = `${BLOB_PREFIX}qr-coupons/`;
const USED_DIR = `${BLOB_PREFIX}qr-coupon-used/`;
const DEV_COUPONS = 'qr-coupons-local';
const DEV_USED = 'qr-coupon-used-local';

// 혼동 문자(0/O/1/I/L) 제외 base32
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function genCouponCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `ZL-${s}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** 쿠폰 발급 (불변 저장). 코드 충돌 시 false 반환 → 호출자가 재생성. */
export async function issueCoupon(c: Coupon): Promise<boolean> {
  if (!hasBlob) {
    const list = await readDataForWrite<Coupon>(DEV_COUPONS);
    if (list.some((x) => x.code === c.code)) return false;
    list.push(c);
    await writeDataMerged(DEV_COUPONS, list);
    return true;
  }
  try {
    await put(`${COUPON_DIR}${c.code}.json`, JSON.stringify(c), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist|conflict|409/i.test(msg)) return false; // 충돌
    throw err;
  }
}

async function usedCodes(): Promise<Map<string, string>> {
  // code -> usedAt
  const map = new Map<string, string>();
  if (!hasBlob) {
    const arr = await readData<{ code: string; usedAt: string }>(DEV_USED);
    for (const u of arr) map.set(u.code, u.usedAt);
    return map;
  }
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: USED_DIR, limit: 1000, cursor });
    await Promise.all(
      page.blobs.map(async (b) => {
        const code = b.pathname.slice(USED_DIR.length).replace(/\.json$/, '');
        const j = await fetchJson<{ usedAt?: string }>(b.url);
        if (code) map.set(code, j?.usedAt ?? new Date(b.uploadedAt).toISOString());
      }),
    );
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return map;
}

export async function listCoupons(): Promise<Coupon[]> {
  const used = await usedCodes();
  let coupons: Coupon[] = [];
  if (!hasBlob) {
    coupons = await readData<Coupon>(DEV_COUPONS);
  } else {
    const urls: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: COUPON_DIR, limit: 1000, cursor });
      for (const b of page.blobs) if (b.pathname.endsWith('.json')) urls.push(b.url);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    const fetched = await Promise.all(urls.map((u) => fetchJson<Coupon>(u)));
    coupons = fetched.filter((c): c is Coupon => !!c);
  }
  return coupons
    .map((c) => ({ ...c, used: used.has(c.code), usedAt: used.get(c.code) }))
    .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  const used = await usedCodes();
  if (!hasBlob) {
    const arr = await readData<Coupon>(DEV_COUPONS);
    const c = arr.find((x) => x.code === code);
    return c ? { ...c, used: used.has(code), usedAt: used.get(code) } : null;
  }
  const { blobs } = await list({ prefix: `${COUPON_DIR}${code}.json`, limit: 1 });
  const match = blobs.find((b) => b.pathname === `${COUPON_DIR}${code}.json`);
  if (!match) return null;
  const c = await fetchJson<Coupon>(match.url);
  return c ? { ...c, used: used.has(code), usedAt: used.get(code) } : null;
}

export async function markCouponUsed(code: string): Promise<void> {
  const usedAt = new Date().toISOString();
  if (!hasBlob) {
    const arr = await readDataForWrite<{ code: string; usedAt: string }>(DEV_USED);
    if (!arr.some((u) => u.code === code)) arr.push({ code, usedAt });
    await writeDataMerged(DEV_USED, arr);
    return;
  }
  await put(`${USED_DIR}${code}.json`, JSON.stringify({ usedAt }), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}
