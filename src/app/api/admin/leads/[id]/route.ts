import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/leads';
import { writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leads = await listLeads();
    const target = leads.find((l) => l.id === id);
    if (!target) {
      return NextResponse.json({ success: false, message: '해당 리드를 찾을 수 없습니다.' }, { status: 404 });
    }
    const next = leads.filter((l) => l.id !== id);
    await writeData('leads', next);
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
