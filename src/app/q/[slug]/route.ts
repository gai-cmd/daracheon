import { after, NextRequest, NextResponse } from 'next/server';
import { getQrBySlug, resolveDestination, buildRedirectUrl } from '@/lib/qr/store';
import { recordEvent } from '@/lib/qr/events';
import { getClientEnv, isPrefetch, isPrivacyOptOut, genEventId, randomHex } from '@/lib/qr/collect';
import { signQrSession } from '@/lib/qr/token';
import type { QrEvent } from '@/lib/qr/types';

/**
 * 영구 QR 리다이렉트 — /q/<slug>.
 *
 * 인쇄된 QR 이 인코딩하는 불변 URL. 핫패스 원칙:
 *   목적지 해석(캐시된 readData) → 쿠키 발급 → 302.  ← blob 쓰기 없음.
 * 스캔 로깅은 next/after 로 응답 후 비차단 수행 → 리다이렉트 지연 0,
 * Blob 장애 시에도 인쇄된 코드는 정상 리다이렉트(가용성 우선).
 *
 * 없는/비활성 slug 는 절대 404 내지 않고 홈으로 안전 폴백(인쇄물 영구 보존).
 */

export const dynamic = 'force-dynamic';

const SAFE_FALLBACK = '/';
const isProd = process.env.NODE_ENV === 'production';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const origin = req.nextUrl.origin;

  const qr = await getQrBySlug(slug);
  if (!qr || !qr.active) {
    return NextResponse.redirect(new URL(SAFE_FALLBACK, origin), 302);
  }

  const destPath = resolveDestination(qr);
  const redirectUrl = buildRedirectUrl(origin, qr, destPath);

  const h = req.headers;
  const optOut = isPrivacyOptOut(h);
  const existingVid = req.cookies.get('zql_vid')?.value;
  const isRevisit = !!existingVid;
  const vid = optOut ? null : existingVid || randomHex(24);
  const qsid = randomHex(24);
  const token = await signQrSession({ slug, qsid });

  // 동의 수집 QR: 아직 동의/거부를 결정 안 했으면 동의 화면으로 (진입 차단 아님 —
  // 화면에서 '동의 없이 계속' 가능. 동의는 혜택 인센티브로만 유도).
  const decided = !!req.cookies.get('zql_consent')?.value || !!req.cookies.get('zql_decline')?.value;
  const needConsent = !!qr.collectInfo && !decided;
  // 후기 유도 QR 은 후기 작성 화면으로 (최우선). 그 외 동의 수집 → 동의 화면. 기본 → 목적지.
  const finalUrl = qr.reviewMode
    ? new URL(`/review/${encodeURIComponent(slug)}`, origin).toString()
    : needConsent
      ? new URL(`/scan/${encodeURIComponent(slug)}?to=${encodeURIComponent(destPath)}`, origin).toString()
      : redirectUrl;

  const res = NextResponse.redirect(finalUrl, 302);
  const base = { secure: isProd, sameSite: 'lax' as const, path: '/' };
  // 서명된 세션 — 비콘 이벤트(pageview/cta) 귀속 + 위조 방지. HttpOnly.
  res.cookies.set('zql_qsid', token, { ...base, httpOnly: true, maxAge: 30 * 60 });
  // 비콘 게이트 플래그 — 클라이언트가 "QR 세션인가" 판정용으로 읽음(민감정보 없음).
  res.cookies.set('zql_track', '1', { ...base, httpOnly: false, maxAge: 30 * 60 });
  // 방문자 식별(재방문 측정) — 랜덤 불투명값, 원본 IP/UA 미저장. opt-out 이면 미설정.
  if (vid) {
    res.cookies.set('zql_vid', vid, { ...base, httpOnly: true, maxAge: 180 * 24 * 60 * 60 });
  }

  // 스캔 로깅 — 봇/프리페치 제외, 응답 후 비차단.
  const env = getClientEnv(h);
  if (!env.isBot && !isPrefetch(h)) {
    const ev: QrEvent = {
      id: genEventId(),
      type: 'scan',
      at: new Date().toISOString(),
      slug,
      qsid,
      vid: vid ?? '',
      dest: destPath,
      isRevisit,
      country: env.country,
      region: env.region,
      city: env.city,
      lat: env.lat,
      lng: env.lng,
      device: env.device,
      os: env.os,
      browser: env.browser,
      lang: env.lang,
      referrer: h.get('referer') ?? undefined,
    };
    after(async () => {
      try {
        await recordEvent(ev);
      } catch (err) {
        console.warn('[qr:/q] scan 로깅 실패', err);
      }
    });
  }

  return res;
}
