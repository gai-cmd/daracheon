import { NextResponse } from 'next/server';
import type { Lead } from '@/lib/leads';
import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // 쓰기 베이스 전용 read — 시드/캐시 폴백을 베이스로 삭제하면
    // base read 이후 들어온 신규 리드가 통째로 덮어써진다.
    const leads = await readDataForWrite<Lead>('leads');
    const target = leads.find((l) => l.id === id);
    if (!target) {
      return NextResponse.json({ success: false, message: '해당 리드를 찾을 수 없습니다.' }, { status: 404 });
    }
    const next = leads.filter((l) => l.id !== id);
    // 삭제 id 는 removedIds 로 명시 — merge 가 부활시키지 않으면서 동시 추가 리드는 보존.
    await writeDataMerged('leads', next, { removedIds: [id] });
    await logAdmin('leads', 'delete', {
      summary: '에디션 리드 삭제',
      targetId: id,
      meta: { email: target.email, name: target.name },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api:admin:leads:delete] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '삭제 실패' },
      { status: 500 },
    );
  }
}
