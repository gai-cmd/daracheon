import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordEvent } from '@/lib/qr/events';
import { getClientEnv, isPrefetch, genEventId } from '@/lib/qr/collect';
import { verifyQrSession } from '@/lib/qr/token';
import type { QrEvent } from '@/lib/qr/types';

/**
 * QR 세션 비콘 수집 — 사이트 내 이동(pageview)·CTA 클릭(cta).
 * 위조 방지: POST 전용 · Origin 동일 · 서명된 zql_qsid 검증 · zod · 레이트리밋 ·
 * 항상 204(타이밍/존재 노출 차단) · 봇/프리페치 제외. sendBeacon 은 text/plain 이라
 * content-type 가정 없이 req.text() 후 JSON 파싱.
 */

export const dynamic = 'force-dynamic';

const MAX_BODY = 4096;

const eventSchema = z.object({
  kind: z.enum(['pageview', 'cta']),
  path: z.string().max(512).optional(),
  referrer: z.string().max(512).optional(),
  ctaType: z.string().max(64).optional(),
  ctaLabel: z.string().max(160).optional(),
  ctaHref: z.string().max(512).optional(),
});
const bodySchema = z.object({ events: z.array(eventSchema).min(1).max(20) });

// 인메모리 레이트리밋 (세션당). 콜드스타트 리셋 — 남용 완화 목적이라 충분.
const counts = new Map<string, { n: number; exp: number }>();
function allow(qsid: string, max = 80, windowMs = 30 * 60 * 1000): boolean {
  const now = Date.now();
  const e = counts.get(qsid);
  if (!e || e.exp < now) {
    counts.set(qsid, { n: 1, exp: now + windowMs });
    return true;
  }
  if (e.n >= max) return false;
  e.n++;
  return true;
}
function sweep() {
  if (counts.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of counts) if (v.exp < now) counts.delete(k);
}

export async function POST(req: NextRequest) {
  const NO_CONTENT = new NextResponse(null, { status: 204 });
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return NO_CONTENT;

    const session = await verifyQrSession(req.cookies.get('zql_qsid')?.value);
    if (!session) return NO_CONTENT;
    if (!allow(session.qsid)) return NO_CONTENT;
    sweep();

    const raw = await req.text();
    if (!raw || raw.length > MAX_BODY) return NO_CONTENT;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NO_CONTENT;
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return NO_CONTENT;

    const env = getClientEnv(req.headers);
    if (env.isBot || isPrefetch(req.headers)) return NO_CONTENT;
    const vid = req.cookies.get('zql_vid')?.value ?? '';

    for (const e of parsed.data.events) {
      const common = {
        id: genEventId(),
        at: new Date().toISOString(),
        slug: session.slug,
        qsid: session.qsid,
        vid,
        country: env.country,
        region: env.region,
        city: env.city,
        device: env.device,
        os: env.os,
        browser: env.browser,
        lang: env.lang,
      };
      const ev: QrEvent =
        e.kind === 'pageview'
          ? { ...common, type: 'pageview', path: e.path, referrer: e.referrer }
          : {
              ...common,
              type: 'cta',
              path: e.path,
              ctaType: e.ctaType,
              ctaLabel: e.ctaLabel,
              ctaHref: e.ctaHref,
            };
      await recordEvent(ev);
    }
    return NO_CONTENT;
  } catch {
    return NO_CONTENT;
  }
}
