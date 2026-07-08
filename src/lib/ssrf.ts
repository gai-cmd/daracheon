import { lookup } from 'node:dns/promises';

// 서버측에서 외부 URL 을 fetch 하는 기능(이미지 미러링 등)의 SSRF 방어.
// 핵심: 호스트명을 실제 IP 로 해석해 사설/루프백/링크로컬/메타데이터 대역이면 거부한다.
// (169.254.169.254 클라우드 메타데이터, 127.0.0.1, 10.x, 192.168.x, ::1 등)
// 리다이렉트는 자동으로 따라가지 않고(redirect: 'manual') 각 홉의 목적지를 다시 검증한다.

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = n * 256 + o;
  }
  return n >>> 0;
}

export function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // 파싱 불가 → 안전측(차단)
  const inRange = (base: string, bits: number) => {
    const b = ipv4ToInt(base)!;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & mask) === (b & mask);
  };
  return (
    inRange('0.0.0.0', 8) ||       // 현재 네트워크
    inRange('10.0.0.0', 8) ||      // 사설
    inRange('100.64.0.0', 10) ||   // CGNAT
    inRange('127.0.0.0', 8) ||     // 루프백
    inRange('169.254.0.0', 16) ||  // 링크로컬(메타데이터 169.254.169.254 포함)
    inRange('172.16.0.0', 12) ||   // 사설
    inRange('192.0.0.0', 24) ||    // IETF 프로토콜 할당
    inRange('192.168.0.0', 16) ||  // 사설
    inRange('198.18.0.0', 15) ||   // 벤치마킹
    inRange('224.0.0.0', 4) ||     // 멀티캐스트
    inRange('240.0.0.0', 4)        // 예약
  );
}

export function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split('%')[0]; // 존 인덱스 제거
  // IPv4-mapped/embedded (::ffff:1.2.3.4, ::1.2.3.4) → IPv4 규칙으로 검사
  const mapped = addr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  if (addr === '::1' || addr === '::') return true; // 루프백/미지정
  if (addr.startsWith('fe80') || addr.startsWith('fe9') || addr.startsWith('fea') || addr.startsWith('feb')) {
    return true; // 링크로컬 fe80::/10
  }
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true; // ULA fc00::/7
  return false;
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('유효하지 않은 URL 입니다.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('HTTP/HTTPS URL 만 허용됩니다.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, ''); // IPv6 대괄호 제거
  // 호스트명을 실제 IP 로 해석해 모든 결과 주소를 검증(DNS rebinding 완화).
  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error('호스트명을 해석할 수 없습니다.');
  }
  if (addresses.length === 0) throw new Error('호스트명을 해석할 수 없습니다.');
  for (const { address, family } of addresses) {
    const isPrivate = family === 6 ? isPrivateIpv6(address) : isPrivateIpv4(address);
    if (isPrivate) {
      throw new Error('내부/사설 대역 주소로의 요청은 차단됩니다.');
    }
  }
  return url;
}

// 리다이렉트를 자동으로 따르지 않고, 각 홉의 목적지를 assertPublicHttpUrl 로 재검증한다.
export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {},
  opts: { maxRedirects?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const maxRedirects = opts.maxRedirects ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  let current = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicHttpUrl(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(current, { ...init, redirect: 'manual', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return res;
      current = new URL(location, current).toString(); // 다음 루프에서 재검증
      continue;
    }
    return res;
  }
  throw new Error('리다이렉트가 너무 많습니다.');
}
