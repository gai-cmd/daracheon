import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listCoupons, findCoupon, markCouponUsed } from '@/lib/qr/coupons';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET — 전체 발급 쿠폰 목록, 또는 ?code= 단건 조회(현장 사용처리 검색)
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();
    if (code) {
      const coupon = await findCoupon(code);
      return NextResponse.json({ success: true, coupon });
    }
    const coupons = await listCoupons();
    return NextResponse.json({ success: true, coupons, total: coupons.length });
  } catch (error) {
    console.error('[Admin QR coupons] GET Error:', error);
    return NextResponse.json({ success: false, message: '쿠폰을 불러오지 못했습니다.' }, { status: 500 });
  }
}

const useSchema = z.object({ code: z.string().min(1).max(40) });

// POST — 쿠폰 사용 처리
export async function POST(req: Request) {
  try {
    const parsed = useSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: '코드가 올바르지 않습니다.' }, { status: 400 });
    }
    const code = parsed.data.code.trim().toUpperCase();
    const coupon = await findCoupon(code);
    if (!coupon) {
      return NextResponse.json({ success: false, message: '존재하지 않는 쿠폰입니다.' }, { status: 404 });
    }
    if (coupon.used) {
      return NextResponse.json({ success: false, message: '이미 사용된 쿠폰입니다.', coupon }, { status: 409 });
    }
    await markCouponUsed(code);
    await logAdmin('qr-codes', 'update', { targetId: code, summary: `쿠폰 사용 처리: ${code}` });
    const updated = await findCoupon(code);
    return NextResponse.json({ success: true, coupon: updated });
  } catch (error) {
    console.error('[Admin QR coupons] POST Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
