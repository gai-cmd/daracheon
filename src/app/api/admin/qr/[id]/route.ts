import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getQrCode, updateQrCode, sanitizeInternalPath } from '@/lib/qr/store';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const targetSchema = z.object({
  path: z.string().min(1).max(512),
  label: z.string().max(120).optional(),
  weight: z.number().positive().max(1000).optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  placement: z.string().max(120).optional(),
  routingMode: z.enum(['single', 'rotate']).optional(),
  targets: z.array(targetSchema).min(1).max(50).optional(),
  utmContent: z.string().max(120).optional(),
  collectInfo: z.boolean().optional(),
  collectBenefitText: z.string().max(200).optional(),
  couponEnabled: z.boolean().optional(),
  couponDiscount: z.string().max(60).optional(),
  couponValidDays: z.number().int().min(1).max(3650).optional(),
  defaultStyle: z.enum(['white-black', 'transparent-white', 'transparent-gold']).optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const qr = await getQrCode(id);
  if (!qr) return NextResponse.json({ success: false, message: '찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ success: true, code: qr });
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }
    if (parsed.data.targets) {
      for (const t of parsed.data.targets) {
        if (sanitizeInternalPath(t.path) === null) {
          return NextResponse.json(
            { success: false, message: `목적지는 '/'로 시작하는 사이트 내부 경로여야 합니다: ${t.path}` },
            { status: 400 },
          );
        }
      }
    }
    const updated = await updateQrCode(id, parsed.data);
    if (!updated) return NextResponse.json({ success: false, message: '찾을 수 없습니다.' }, { status: 404 });

    await logAdmin('qr-codes', 'update', {
      targetId: id,
      summary: `QR 수정: ${updated.name} (/q/${updated.slug})`,
    });
    return NextResponse.json({ success: true, code: updated });
  } catch (error) {
    console.error('[Admin QR] PUT Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// QR 삭제는 의도적으로 막는다 — 인쇄·배포된 스티커가 가리키는 /q/<slug> 는
// 영구 공개 계약이라, 레코드를 지우면 추적 단절 + 슬러그 재사용 위험이 생긴다.
// "삭제" 대신 비활성(active:false)으로 전환한다(스캔 시 안전 폴백, 추적 보존).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(
    {
      success: false,
      message:
        'QR은 삭제할 수 없습니다(인쇄물 보호). 더 이상 쓰지 않으려면 비활성으로 전환하세요. ' +
        '비활성 QR을 스캔하면 홈으로 안전하게 이동합니다.',
      id,
    },
    { status: 405 },
  );
}
