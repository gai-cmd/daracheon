// 채널 피드·썸네일을 가져오는 바깥 요청 (SPEC-CONSOLE-002 REQ-CS2-033, design.md §2.12, CS2-D22).
// https 만, 요청마다 허용 목록, IP 문자열·localhost 거부, DNS 결과의 사설·루프백·링크로컬·메타데이터 대역 거부
// (src/lib/ssrf.ts 의 assertPublicHttpUrl), 리다이렉트는 같은 검사를 통과한 곳으로 한 번만, 5초 제한, 크기 상한,
// 쿠키·Referer 없음. 서버 전용.

import { assertPublicHttpUrl } from '@/lib/ssrf';
import type { FeedErrorCode } from './types';

export type FetchErrorCode = Exclude<FeedErrorCode, 'parse_error'>;
export type FetchResult = { ok: true; url: string; contentType: string; bytes: Uint8Array } | { ok: false; error: FetchErrorCode };

export interface FetchAllowedOptions {
  /** 이 요청의 허용 호스트 판정 (정확한 이름 또는 점으로 시작하는 접미사만 — 부분 문자열 비교 금지). */
  allow: (hostname: string) => boolean;
  maxBytes: number;
  timeoutMs?: number;
  accept?: string;
  fetchImpl?: (input: string, init: RequestInit) => Promise<Response>;
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** IP 문자열 호스트 (IPv4 점 표기, 대괄호 IPv6, 숫자만인 이상한 표기) 여부. */
export function isIpLiteral(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return IPV4.test(h) || h.startsWith('[') || h.includes(':') || /^[0-9.x]+$/.test(h);
}

/** 1~5단계: 주소 형식·https·IP 문자열·localhost·허용 목록·공개 대역. 통과하면 URL. */
async function checkUrl(raw: string, allow: (h: string) => boolean): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host || isIpLiteral(host) || host === 'localhost' || host.endsWith('.localhost')) return null;
  if (!allow(host)) return null;
  try {
    await assertPublicHttpUrl(u.toString());
  } catch {
    return null;
  }
  return u;
}

// @MX:WARN: [AUTO] Outbound request path reachable from staff sessions (feed + thumbnail proxy).
// @MX:REASON: SSRF boundary — every hop must re-run checkUrl; never switch to redirect: 'follow',
// never send credentials or a Referer, and keep the byte cap enforced while streaming.
export async function fetchAllowed(url: string, opts: FetchAllowedOptions): Promise<FetchResult> {
  const fetchImpl = opts.fetchImpl ?? ((input: string, init: RequestInit) => fetch(input, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  const failOf = (): FetchResult => ({ ok: false, error: controller.signal.aborted ? 'timeout' : 'network' });
  try {
    let current = await checkUrl(url, opts.allow);
    if (!current) return { ok: false, error: 'not_allowed' };
    for (let hop = 0; ; hop++) {
      let res: Response;
      try {
        res = await fetchImpl(current.toString(), {
          method: 'GET',
          redirect: 'manual',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
          headers: { Accept: opts.accept ?? '*/*' },
          signal: controller.signal,
        });
      } catch {
        return failOf();
      }
      if (res.status >= 300 && res.status < 400) {
        void res.body?.cancel().catch(() => {});
        const location = res.headers.get('location');
        if (hop >= 1 || !location) return { ok: false, error: 'redirect_rejected' };
        let next: string;
        try {
          next = new URL(location, current).toString();
        } catch {
          return { ok: false, error: 'redirect_rejected' };
        }
        const checked = await checkUrl(next, opts.allow);
        if (!checked) return { ok: false, error: 'redirect_rejected' };
        current = checked;
        continue;
      }
      if (res.status < 200 || res.status >= 300) {
        void res.body?.cancel().catch(() => {});
        return { ok: false, error: 'http_status' };
      }
      const declared = Number(res.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > opts.maxBytes) {
        void res.body?.cancel().catch(() => {});
        return { ok: false, error: 'too_large' };
      }
      const contentType = (res.headers.get('content-type') ?? '').trim();
      if (!res.body) return { ok: true, url: current.toString(), contentType, bytes: new Uint8Array(0) };
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > opts.maxBytes) {
            await reader.cancel().catch(() => {});
            return { ok: false, error: 'too_large' };
          }
          chunks.push(value);
        }
      } catch {
        return failOf();
      }
      const bytes = new Uint8Array(total);
      let at = 0;
      for (const c of chunks) {
        bytes.set(c, at);
        at += c.byteLength;
      }
      return { ok: true, url: current.toString(), contentType, bytes };
    }
  } finally {
    clearTimeout(timer);
  }
}
