import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBatch, listBatches, getBatchCodes, batchStats, voidSerial, normalizeSerial, isValidSerial } from '@/lib/qr/serials';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET — 배치 목록(빠름) 또는 ?batchId= 단건(코드 + 통계, 다운로드/상세용)
export async function GET(req: NextRequest) {
  try {
    const batchId = req.nextUrl.searchParams.get('batchId');
    if (batchId) {
      const [codes, stats] = await Promise.all([getBatchCodes(batchId), batchStats(batchId)]);
      return NextResponse.json({ success: true, codes, stats });
    }
    const batches = await listBatches();
    return NextResponse.json({ success: true, batches, total: batches.length });
  } catch (error) {
    console.error('[Admin serials] GET Error:', error);
    return NextResponse.json({ success: false, message: '불러오지 못했습니다.' }, { status: 500 });
  }
}

const createSchema = z.object({ action: z.literal('create'), product: z.string().min(1).max(120), lot: z.string().max(60).optional(), quantity: z.number().int().min(1).max(5000) });
const voidSchema = z.object({ action: z.literal('void'), code: z.string().min(1).max(40) });
const bodySchema = z.discriminatedUnion('action', [createSchema, voidSchema]);

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' }, { status: 400 });
    }
    if (parsed.data.action === 'create') {
      const { batch, codes } = await createBatch({ product: parsed.data.product, lot: parsed.data.lot, quantity: parsed.data.quantity });
      await logAdmin('qr-codes', 'create', { targetId: batch.id, summary: `정품인증 배치: ${batch.product} ${codes.length}개` });
      return NextResponse.json({ success: true, batch, codes }, { status: 201 });
    }
    // void
    const code = normalizeSerial(parsed.data.code);
    if (!isValidSerial(code)) return NextResponse.json({ success: false, message: '코드 형식이 올바르지 않습니다.' }, { status: 400 });
    await voidSerial(code);
    await logAdmin('qr-codes', 'update', { targetId: code, summary: `정품 코드 무효처리: ${code}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin serials] POST Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
