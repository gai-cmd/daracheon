import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { snapshotBeforeDestructive } from '@/lib/backup';
import { autoSplitMixed, type Broadcast as SharedBroadcast } from '@/lib/broadcasts';

function revalidateBroadcasts() {
  revalidatePath('/', 'layout');
}

export const dynamic = 'force-dynamic';

export interface BroadcastShowInfo {
  title?: string;       // 예: "퍼펙트 라이프"
  episode?: string;     // 예: "287회 구성안"
  logo?: string;        // 프로그램 로고 이미지 URL — 영상 미입력 시 포스터 자리에 노출
  hosts?: string[];     // 진행
  panels?: string[];    // 패널
  guests?: string[];    // 게스트
  experts?: string[];   // 전문가
  recordingAt?: string; // 녹화일시 (자유 텍스트)
  vcrAt?: string;       // VCR 촬영일시
  synopsis?: string;    // 방송 개요 요약문
}

export interface BroadcastPreviewHighlight {
  timestamp?: string;
  title: string;
  description?: string;
}

export interface BroadcastPreview {
  enabled?: boolean;
  isPublic?: boolean;
  headline?: string;
  summary?: string;
  highlights?: BroadcastPreviewHighlight[];
  keyPoints?: string[];
  updatedAt?: string;
}

export type BroadcastType = 'home-shopping' | 'sponsored';

export interface Broadcast {
  id: string;
  /** 'home-shopping' = TV 홈쇼핑(가격 강조) / 'sponsored' = 협찬방송(프로그램·출연진 강조).
   *  미지정 시 'home-shopping' 으로 처리(기존 데이터 호환). */
  broadcastType?: BroadcastType;
  /** 공개 여부. undefined/true → 공개, false → 비공개. 비공개는 어드민에서만 보임. */
  published?: boolean;
  channel: string;
  scheduledAt: string;
  durationMinutes: number;
  host?: string;
  productIds: string[];
  specialPrice?: number;
  regularPrice?: number;
  discountRate?: number;
  vodUrl?: string;
  /** 인라인 영상 유효기간(ISO). 지나면 공개 페이지가 외부 유튜브 아웃링크로 전환. */
  inlineUntil?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  salesCount?: number;
  feedback?: string;
  showInfo?: BroadcastShowInfo;
  /** 방송 미리보기/다시보기 요약. 방송 후 isPublic=true 시 공개. */
  preview?: BroadcastPreview;
  createdAt: string;
  updatedAt: string;
}

const statusValues = ['scheduled', 'live', 'ended', 'canceled'] as const;
const broadcastTypeValues = ['home-shopping', 'sponsored'] as const;

const baseSchema = z.object({
  // default 를 두면 partial PUT 에서 부분 업데이트가 다른 필드를 덮어쓴다.
  // → optional 로 두고 POST 핸들러에서 명시적으로 기본값을 보강.
  broadcastType: z.enum(broadcastTypeValues).optional(),
  published: z.coerce.boolean().optional(),
  channel: z.string().min(1, '방송사는 필수입니다.').max(60),
  scheduledAt: z.string().min(1, '방송 일시는 필수입니다.'),
  // default 제거 — partial PUT 에서 미전송 필드가 덮어써지는 사고 방지.
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, '방송 시간(분)은 5~480 사이로 입력하세요.')
    .max(480, '방송 시간(분)은 5~480 사이로 입력하세요.')
    .optional(),
  host: z.string().max(80).optional().nullable(),
  productIds: z.array(z.string()).optional(),
  specialPrice: z.coerce.number().int().min(0).optional().nullable(),
  regularPrice: z.coerce.number().int().min(0).optional().nullable(),
  discountRate: z.coerce.number().min(0).max(100).optional().nullable(),
  vodUrl: z.string().url('올바른 URL을 입력하세요.').or(z.literal('')).optional().nullable(),
  inlineUntil: z.string().datetime().or(z.literal('')).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(statusValues).optional(),
  salesCount: z.coerce.number().int().min(0).optional().nullable(),
  feedback: z.string().max(4000).optional().nullable(),
  showInfo: z
    .object({
      title: z.string().max(80).optional().nullable(),
      episode: z.string().max(80).optional().nullable(),
      logo: z.string().optional().nullable(),
      hosts: z.array(z.string()).optional().nullable(),
      panels: z.array(z.string()).optional().nullable(),
      guests: z.array(z.string()).optional().nullable(),
      experts: z.array(z.string()).optional().nullable(),
      recordingAt: z.string().max(120).optional().nullable(),
      vcrAt: z.string().max(120).optional().nullable(),
      synopsis: z.string().max(4000).optional().nullable(),
    })
    .optional()
    .nullable(),
  preview: z
    .object({
      enabled: z.coerce.boolean().optional(),
      isPublic: z.coerce.boolean().optional(),
      headline: z.string().max(200).optional().nullable(),
      summary: z.string().max(4000).optional().nullable(),
      highlights: z
        .array(
          z.object({
            timestamp: z.string().max(20).optional().nullable(),
            title: z.string().max(200),
            description: z.string().max(800).optional().nullable(),
          })
        )
        .max(40)
        .optional()
        .nullable(),
      keyPoints: z.array(z.string().max(300)).max(20).optional().nullable(),
      updatedAt: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
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
    // 마이그레이션 시 같은 파일에 write-back 하므로 쓰기 베이스용 read 사용
    // (시드 폴백 베이스로 덮어쓰면 누적 레코드 유실 — 2026-06-07 사고 메커니즘).
    const raw = (await readDataForWrite<Broadcast>('broadcasts')) as SharedBroadcast[];
    const { migrated, list } = autoSplitMixed(raw);
    if (migrated) {
      // 전체 목록 교체 쓰기 — 베이스에 있었지만 최종 목록에 없는 id 만 의도적 제거로 명시.
      // (현재 autoSplitMixed 는 레코드를 제거하지 않아 보통 빈 배열이지만, 레시피를 방어적으로 적용)
      const keptIds = new Set(list.map((b) => b.id));
      const removedIds = raw.map((b) => b.id).filter((bid) => !keptIds.has(bid));
      await writeDataMerged('broadcasts', list, { removedIds });
      revalidateBroadcasts();
      await logAdmin('broadcasts', 'update', {
        targetId: 'auto-split',
        summary: `mixed 레코드 자동 분리 — ${raw.length}건 → ${list.length}건`,
      });
    }
    list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return NextResponse.json({ broadcasts: list, total: list.length, migrated });
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
      broadcastType: (data.broadcastType as BroadcastType) ?? 'home-shopping',
      published: data.published === undefined ? true : Boolean(data.published),
      channel: data.channel as string,
      scheduledAt: data.scheduledAt as string,
      durationMinutes: (data.durationMinutes as number) ?? 60,
      productIds: (data.productIds as string[]) ?? [],
      status: (data.status as Broadcast['status']) ?? 'scheduled',
      ...(data.host ? { host: data.host as string } : {}),
      ...(data.specialPrice !== undefined ? { specialPrice: data.specialPrice as number } : {}),
      ...(data.regularPrice !== undefined ? { regularPrice: data.regularPrice as number } : {}),
      ...(data.discountRate !== undefined ? { discountRate: data.discountRate as number } : {}),
      ...(data.vodUrl ? { vodUrl: data.vodUrl as string } : {}),
      ...(data.inlineUntil ? { inlineUntil: data.inlineUntil as string } : {}),
      ...(data.description ? { description: data.description as string } : {}),
      ...(data.salesCount !== undefined ? { salesCount: data.salesCount as number } : {}),
      ...(data.feedback ? { feedback: data.feedback as string } : {}),
      ...(data.showInfo ? { showInfo: data.showInfo as BroadcastShowInfo } : {}),
      ...(data.preview ? { preview: { ...(data.preview as BroadcastPreview), updatedAt: now } } : {}),
      createdAt: now,
      updatedAt: now,
    };

    const broadcasts = await readDataForWrite('broadcasts');
    broadcasts.push(item);
    await writeDataMerged('broadcasts', broadcasts);
    revalidateBroadcasts();

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
    const broadcasts = await readDataForWrite('broadcasts');
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
    const nowIso = new Date().toISOString();
    const merged: Record<string, unknown> = { ...broadcasts[index] };
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined) continue;
      if (v === null || v === '') {
        delete merged[k];
      } else if (k === 'preview' && typeof v === 'object') {
        // preview 부분 업데이트 — 어드민에서 일부 필드만 보낼 수도 있으므로
        // 기존 preview 와 머지하고, updatedAt 갱신.
        const prev = (merged.preview as BroadcastPreview | undefined) ?? {};
        merged.preview = { ...prev, ...(v as BroadcastPreview), updatedAt: nowIso };
      } else {
        merged[k] = v;
      }
    }
    merged.updatedAt = nowIso;
    broadcasts[index] = merged as unknown as Broadcast;
    await writeDataMerged('broadcasts', broadcasts);
    revalidateBroadcasts();

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
    const broadcasts = await readDataForWrite('broadcasts');
    const index = broadcasts.findIndex((b) => b.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 방송을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    const snapId = await snapshotBeforeDestructive(undefined, `broadcasts delete ${body.id}`);

    const removed = broadcasts.splice(index, 1)[0];
    // 삭제 의도를 removedIds 로 명시 — merge 가 동시 추가분만 보존하고 삭제는 부활시키지 않게.
    await writeDataMerged('broadcasts', broadcasts, { removedIds: [body.id] });
    revalidateBroadcasts();
    await logAdmin('broadcasts', 'delete', {
      targetId: body.id,
      summary: `방송 삭제: ${removed?.channel ?? body.id}`,
      meta: snapId ? { preDeleteSnapshot: snapId } : undefined,
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
