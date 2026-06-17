import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listQrCodes, createQrCode, sanitizeInternalPath } from '@/lib/qr/store';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const targetSchema = z.object({
  path: z.string().min(1).max(512),
  label: z.string().max(120).optional(),
  weight: z.number().positive().max(1000).optional(),
});

const createSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다.').max(120),
  description: z.string().max(2000).optional(),
  placement: z.string().max(120).optional(),
  routingMode: z.enum(['single', 'rotate']),
  targets: z.array(targetSchema).min(1, '목적지를 최소 1개 입력하세요.').max(50),
  utmContent: z.string().max(120).optional(),
  collectInfo: z.boolean().optional(),
  collectBenefitText: z.string().max(200).optional(),
  couponEnabled: z.boolean().optional(),
  couponDiscount: z.string().max(60).optional(),
  couponValidDays: z.number().int().min(1).max(3650).optional(),
  defaultStyle: z.enum(['white-black', 'transparent-white', 'transparent-gold']),
  active: z.boolean().optional(),
  customSlug: z.string().max(40).optional(),
});

export async function GET() {
  try {
    const codes = await listQrCodes();
    return NextResponse.json({ success: true, codes, total: codes.length });
  } catch (error) {
    console.error('[Admin QR] GET Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }
    const input = parsed.data;

    // 목적지는 같은 도메인 내부 경로만 (open-redirect/외부유출 차단). 잘못된 경로는 어떤 것인지 알려줌.
    for (const t of input.targets) {
      if (sanitizeInternalPath(t.path) === null) {
        return NextResponse.json(
          { success: false, message: `목적지는 '/'로 시작하는 사이트 내부 경로여야 합니다: ${t.path}` },
          { status: 400 },
        );
      }
    }

    const qr = await createQrCode(input);
    await logAdmin('qr-codes', 'create', {
      targetId: qr.id,
      summary: `QR 생성: ${qr.name} (/q/${qr.slug})`,
    });
    return NextResponse.json({ success: true, code: qr }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    console.error('[Admin QR] POST Error:', error);
    // 커스텀 slug 중복 등 사용자 메시지는 그대로 전달.
    const isUserMsg = /코드|slug|목적지/.test(msg);
    return NextResponse.json({ success: false, message: isUserMsg ? msg : '서버 오류가 발생했습니다.' }, { status: isUserMsg ? 400 : 500 });
  }
}
