import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getQrCode, updateQrCode, deleteQrCode, sanitizeInternalPath } from '@/lib/qr/store';
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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getQrCode(id);
    const ok = await deleteQrCode(id);
    if (!ok) return NextResponse.json({ success: false, message: '찾을 수 없습니다.' }, { status: 404 });

    await logAdmin('qr-codes', 'delete', {
      targetId: id,
      summary: `QR 삭제: ${existing?.name ?? id} (/q/${existing?.slug ?? '?'})`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin QR] DELETE Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
