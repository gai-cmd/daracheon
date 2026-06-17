import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { appendData } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { recordEvent } from '@/lib/qr/events';
import { getQrBySlug } from '@/lib/qr/store';
import { genCouponCode, issueCoupon } from '@/lib/qr/coupons';
import { verifyQrSession } from '@/lib/qr/token';
import { getClientEnv, genEventId } from '@/lib/qr/collect';
import type { Review } from '@/data/reviews';
import type { QrEvent } from '@/lib/qr/types';

/**
 * QR 후기 유도 — 후기 작성 제출.
 * 기존 reviews 인프라(appendData·승인대기 verified:false·관리자 알림)를 재사용하고
 * 출처 QR slug 로 어트리뷰션 + 후기 이벤트 기록 + (couponEnabled 시) 쿠폰 자동 발급.
 */

export const dynamic = 'force-dynamic';

const schema = z.object({
  slug: z.string().min(1).max(40),
  author: z.string().min(1, '이름을 입력해주세요.').max(20),
  age: z.string().max(20).optional(),
  product: z.string().min(1, '제품을 선택해주세요.').max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, '제목을 입력해주세요.').max(100),
  content: z.string().min(10, '내용은 최소 10자 이상 입력해주세요.').max(2000),
});

// 인메모리 레이트리밋 (IP-ish). 콜드스타트 리셋 — 남용 완화 목적.
const hits = new Map<string, number>();
function allow(key: string, windowMs = 60_000): boolean {
  const now = Date.now();
  const last = hits.get(key) ?? 0;
  if (now - last < windowMs) return false;
  hits.set(key, now);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v > windowMs) hits.delete(k);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'na';
    if (!allow(ip)) {
      return NextResponse.json({ error: '너무 빠른 요청입니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.' }, { status: 400 });
    }
    const d = parsed.data;

    const qr = await getQrBySlug(d.slug);

    // 후기 생성 (승인 대기) — 기존 reviews 스토어/내구 append 재사용
    const review: Review = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: d.author,
      age: d.age ?? '',
      product: d.product,
      rating: d.rating,
      title: d.title,
      content: d.content,
      date: new Date().toISOString().split('T')[0],
      verified: false,
      qrSlug: d.slug,
    };
    await appendData('reviews', review);

    // 후기 이벤트 기록 (QR 분석용)
    const session = await verifyQrSession(req.cookies.get('zql_qsid')?.value);
    const env = getClientEnv(req.headers);
    const reviewEvent: QrEvent = {
      id: genEventId(),
      type: 'review',
      at: new Date().toISOString(),
      slug: d.slug,
      qsid: session?.qsid ?? 'na',
      vid: req.cookies.get('zql_vid')?.value ?? '',
      rating: d.rating,
      product: d.product,
      country: env.country,
      region: env.region,
      city: env.city,
    };
    recordEvent(reviewEvent).catch(() => {});

    // 후기 작성 인센티브 쿠폰 (couponEnabled QR)
    let coupon: { code: string; discount: string; validUntil: string } | undefined;
    if (qr?.couponEnabled) {
      const discount = qr.couponDiscount?.trim() || '할인 혜택';
      const validDays = qr.couponValidDays && qr.couponValidDays > 0 ? qr.couponValidDays : 30;
      const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      for (let i = 0; i < 6; i++) {
        const code = genCouponCode();
        const ok = await issueCoupon({
          code, slug: d.slug, qrName: qr.name, discount,
          name: d.author, issuedAt: new Date().toISOString(), validUntil,
        }).catch(() => false);
        if (ok) { coupon = { code, discount, validUntil }; break; }
      }
    }

    // 관리자 알림 (dry-run 가능)
    const adminEmail = process.env.ADMIN_EMAIL ?? 'dev@try-n.com';
    sendEmail({
      to: adminEmail,
      subject: `[ZOEL LIFE] QR 후기 작성 — ${d.author}님 (${d.rating}점)`,
      html: `<h2>QR 후기 유도로 새 후기가 작성되었습니다</h2><p><b>출처 QR:</b> /q/${d.slug}</p><p><b>작성자:</b> ${d.author}${d.age ? ` (${d.age})` : ''}</p><p><b>제품:</b> ${d.product}</p><p><b>별점:</b> ${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p><p><b>제목:</b> ${d.title}</p><p><b>내용:</b><br/>${d.content.replace(/\n/g, '<br/>')}</p><hr/><p>관리자 페이지에서 승인 후 게시됩니다.</p>`,
      text: `QR 후기(/q/${d.slug}): ${d.author} | ${d.product} | ${d.rating}점\n${d.title}\n${d.content}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, coupon: coupon ?? null }, { status: 201 });
  } catch (error) {
    console.error('[QR Review] Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
