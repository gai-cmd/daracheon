'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * QR 유입 세션 비콘 — 사이트 내 이동(pageview) + CTA 클릭 추적.
 *
 * 오직 QR 스캔으로 시작된 세션에서만 동작한다(비-QR 일반 방문자는 추적하지 않음):
 *   게이트 = `zql_track` 쿠키 존재  AND  GPC(Global Privacy Control) 미설정.
 * 서버는 HttpOnly `zql_qsid`(서명)·`zql_vid` 로 귀속하므로 클라이언트는 식별값을
 * 보내지 않는다. 전송은 navigator.sendBeacon(text/plain) → /api/q/track.
 */

const ENDPOINT = '/api/q/track';

function hasTrackCookie(): boolean {
  return typeof document !== 'undefined' && /(?:^|;\s*)zql_track=1/.test(document.cookie);
}

function gpcOptedOut(): boolean {
  return typeof navigator !== 'undefined' && (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function send(payload: unknown): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, body);
    } else {
      fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* 추적 실패는 무시 */
  }
}

function ctaInfoFor(el: Element): { ctaType: string; ctaLabel?: string; ctaHref?: string } | null {
  const node = el.closest<HTMLElement>('[data-cta],a[href^="tel:"],a[href^="mailto:"],a[href*="#contact"]');
  if (!node) return null;
  const explicit = node.getAttribute('data-cta');
  const href = node.getAttribute('href') ?? undefined;
  let ctaType = explicit || 'link';
  if (!explicit && href) {
    if (href.startsWith('tel:')) ctaType = 'call';
    else if (href.startsWith('mailto:')) ctaType = 'message';
    else if (href.includes('#contact')) ctaType = 'contact';
  }
  const label = (node.getAttribute('aria-label') || node.textContent || '').trim().slice(0, 120) || undefined;
  return { ctaType, ctaLabel: label, ctaHref: href };
}

export default function QrBeacon() {
  const pathname = usePathname();

  // pageview — QR 세션 + 비-admin 경로일 때만.
  useEffect(() => {
    if (!hasTrackCookie() || gpcOptedOut()) return;
    if (pathname.startsWith('/admin')) return;
    send({
      events: [{ kind: 'pageview', path: pathname, referrer: document.referrer || undefined }],
    });
  }, [pathname]);

  // CTA 클릭 — 위임 리스너 (캡처 단계).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!hasTrackCookie() || gpcOptedOut()) return;
      const target = e.target as Element | null;
      if (!target) return;
      const info = ctaInfoFor(target);
      if (!info) return;
      send({ events: [{ kind: 'cta', path: window.location.pathname, ...info }] });
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
