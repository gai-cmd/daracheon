import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export interface Broadcast {
  id: string;
  channel: string;
  scheduledAt: string;
  durationMinutes: number;
  host?: string;
  productIds: string[];
  specialPrice?: number;
  regularPrice?: number;
  discountRate?: number;
  livestreamUrl?: string;
  vodUrl?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  salesCount?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

const statusValues = ['scheduled', 'live', 'ended', 'canceled'] as const;

const baseSchema = z.object({
  channel: z.string().min(1, '방송사는 필수입니다.').max(60),
  scheduledAt: z.string().min(1, '방송 일시는 필수입니다.'),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(60),
  host: z.string().max(80).optional().nullable(),
  productIds: z.array(z.string()).default([]),
  specialPrice: z.coerce.number().int().min(0).optional().nullable(),
  regularPrice: z.coerce.number().int().min(0).optional().nullable(),
  discountRate: z.coerce.number().int().min(0).max(100).optional().nullable(),
  livestreamUrl: z.string().url('올바른 URL을 입력하세요.').or(z.literal('')).optional().nullable(),
  vodUrl: z.string().url('올바른 URL을 입력하세요.').or(z.literal('')).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(statusValues).default('scheduled'),
  salesCount: z.coerce.number().int().min(0).optional().nullable(),
  feedback: z.string().max(4000).optional().nullable(),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.partial().extend({ id: z.string().min(1) });

function genId() {
  return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalize(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

export async function GET() {
  try {
    const broadcasts = await readData('broadcasts');
    broadcasts.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return NextResponse.json({ broadcasts, total: broadcasts.length });
  } catch (error) {
    console.error('[Admin Broadcasts] GET error:', error);
    return NextResponse.json(
      { success: false, message: '방송 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const data = normalize(parsed.data) as Partial<Broadcast>;
    const now = new Date().toISOString();
    const item: Broadcast = {
      id: genId(),
      channel: data.channel as string,
      scheduledAt: data.scheduledAt as string,
      durationMinutes: (data.durationMinutes as number) ?? 60,
      productIds: (data.productIds as string[]) ?? [],
      status: (data.status as Broadcast['status']) ?? 'scheduled',
      ...(data.host ? { host: data.host as string } : {}),
      ...(data.specialPrice !== undefined ? { specialPrice: data.specialPrice as number } : {}),
      ...(data.regularPrice !== undefined ? { regularPrice: data.regularPrice as number } : {}),
      ...(data.discountRate !== undefined ? { discountRate: data.discountRate as number } : {}),
      ...(data.livestreamUrl ? { livestreamUrl: data.livestreamUrl as string } : {}),
      ...(data.vodUrl ? { vodUrl: data.vodUrl as string } : {}),
      ...(data.description ? { description: data.description as string } : {}),
      ...(data.salesCount !== undefined ? { salesCount: data.salesCount as number } : {}),
      ...(data.feedback ? { feedback: data.feedback as string } : {}),
      createdAt: now,
      updatedAt: now,
    };

    const broadcasts = await readData('broadcasts');
    broadcasts.push(item);
    await writeData('broadcasts', broadcasts);

    await logAdmin('broadcasts', 'create', {
      targetId: item.id,
      summary: `방송 등록: ${item.channel} (${item.scheduledAt})`,
    });

    return NextResponse.json({ success: true, broadcast: item, message: '방송이 등록되었습니다.' });
  } catch (error) {
    console.error('[Admin Broadcasts] POST error:', error);
    return NextResponse.json(
      { success: false, message: '방송 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { id, ...rest } = parsed.data;
    const broadcasts = await readData('broadcasts');
    const index = broadcasts.findIndex((b) => b.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 방송을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Merge semantics for PUT:
    //   - undefined → field not sent by client; keep existing value.
    //   - null or '' → explicit clear signal for optional fields; drop the key.
    //   - other → overwrite existing value.
    // Required fields (channel/scheduledAt…) are guarded by zod `.min(1)` so
    // an empty-string clear never reaches this loop.
    const merged: Record<string, unknown> = { ...broadcasts[index] };
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined) continue;
      if (v === null || v === '') {
        delete merged[k];
      } else {
        merged[k] = v;
      }
    }
    merged.updatedAt = new Date().toISOString();
    broadcasts[index] = merged as unknown as Broadcast;
    await writeData('broadcasts', broadcasts);

    await logAdmin('broadcasts', 'update', {
      targetId: id,
      summary: `방송 수정: ${broadcasts[index].channel}`,
    });

    return NextResponse.json({ success: true, broadcast: broadcasts[index], message: '방송이 수정되었습니다.' });
  } catch (error) {
    console.error('[Admin Broadcasts] PUT error:', error);
    return NextResponse.json(
      { success: false, message: '방송 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '방송 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    const broadcasts = await readData('broadcasts');
    const index = broadcasts.findIndex((b) => b.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 방송을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    const removed = broadcasts.splice(index, 1)[0];
    await writeData('broadcasts', broadcasts);
    await logAdmin('broadcasts', 'delete', {
      targetId: body.id,
      summary: `방송 삭제: ${removed?.channel ?? body.id}`,
    });
    return NextResponse.json({ success: true, message: '방송이 삭제되었습니다.' });
  } catch (error) {
    console.error('[Admin Broadcasts] DELETE error:', error);
    return NextResponse.json(
      { success: false, message: '방송 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
