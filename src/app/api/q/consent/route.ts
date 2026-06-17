import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordEvent } from '@/lib/qr/events';
import { getClientEnv, genEventId } from '@/lib/qr/collect';
import { verifyQrSession } from '@/lib/qr/token';
import { getQrBySlug } from '@/lib/qr/store';
import { genCouponCode, issueCoupon } from '@/lib/qr/coupons';
import type { QrEvent, AgeBand, Gender } from '@/lib/qr/types';

/**
 * QR 스캔 동의 수집 (연령·성별·연락처) + 동의 시 할인 쿠폰 자동 발급.
 * 진입은 막지 않으며(동의는 혜택 인센티브), '동의 없이 계속'도 기록(consented:false).
 * 위조 방지: POST · Origin 동일 · 서명된 zql_qsid 검증 · zod. 결과로 재프롬프트
 * 방지 쿠키 설정(동의=180일, 거부=7일). 쿠폰 발급 시 코드를 응답으로 반환.
 */

export const dynamic = 'force-dynamic';
const isProd = process.env.NODE_ENV === 'production';
const MAX_BODY = 2048;

// age/gender 는 lenient string — 동의 자체(쿠키·기록)가 인구통계 값 파싱 실패로
// 무음 실패하지 않게 한다(실제 클라이언트는 고정 enum 값을 보냄).
const bodySchema = z.object({
  consented: z.boolean(),
  age: z.string().max(16).optional(),
  gender: z.string().max(16).optional(),
  contact: z.string().max(120).optional(),
  name: z.string().max(60).optional(),
});

interface CouponOut {
  code: string;
  discount: string;
  validUntil: string;
}

export async function POST(req: NextRequest) {
  const respond = (coupon?: CouponOut) => NextResponse.json({ success: true, coupon: coupon ?? null });
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return respond();

    const session = await verifyQrSession(req.cookies.get('zql_qsid')?.value);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return respond();
    let json: unknown;
    try {
      json = JSON.parse(raw || '{}');
    } catch {
      return respond();
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return respond();
    const body = parsed.data;

    // 쿠폰 발급 (동의 + 세션 + couponEnabled QR)
    let coupon: CouponOut | undefined;
    let couponCode: string | undefined;
    if (body.consented && session) {
      const qr = await getQrBySlug(session.slug);
      if (qr?.couponEnabled) {
        const discount = qr.couponDiscount?.trim() || '할인 혜택';
        const validDays = qr.couponValidDays && qr.couponValidDays > 0 ? qr.couponValidDays : 30;
        const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
        for (let i = 0; i < 6; i++) {
          const code = genCouponCode();
          const issued = await issueCoupon({
            code,
            slug: qr.slug,
            qrName: qr.name,
            discount,
            ...(body.contact?.trim() ? { contact: body.contact.trim() } : {}),
            ...(body.name?.trim() ? { name: body.name.trim() } : {}),
            ...(body.age ? { age: body.age as AgeBand } : {}),
            ...(body.gender ? { gender: body.gender as Gender } : {}),
            issuedAt: new Date().toISOString(),
            validUntil,
          }).catch(() => false);
          if (issued) {
            couponCode = code;
            coupon = { code, discount, validUntil };
            break;
          }
        }
      }
    }

    const res = respond(coupon);
    const base = { secure: isProd, sameSite: 'lax' as const, path: '/' };
    if (body.consented) {
      res.cookies.set('zql_consent', '1', { ...base, httpOnly: false, maxAge: 180 * 24 * 60 * 60 });
      res.cookies.delete('zql_decline');
    } else {
      res.cookies.set('zql_decline', '1', { ...base, httpOnly: false, maxAge: 7 * 24 * 60 * 60 });
    }

    if (session) {
      const env = getClientEnv(req.headers);
      const vid = req.cookies.get('zql_vid')?.value ?? '';
      const ev: QrEvent = {
        id: genEventId(),
        type: 'consent',
        at: new Date().toISOString(),
        slug: session.slug,
        qsid: session.qsid,
        vid,
        consented: body.consented,
        country: env.country,
        region: env.region,
        city: env.city,
        ...(body.consented
          ? {
              ...(body.age ? { age: body.age as AgeBand } : {}),
              ...(body.gender ? { gender: body.gender as Gender } : {}),
              ...(body.contact?.trim() ? { contact: body.contact.trim() } : {}),
              ...(body.name?.trim() ? { name: body.name.trim() } : {}),
              ...(couponCode ? { couponCode } : {}),
            }
          : {}),
      };
      try {
        await recordEvent(ev);
      } catch {
        /* 기록 실패해도 진행 */
      }
    }
    return res;
  } catch {
    return respond();
  }
}
