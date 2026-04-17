import { NextResponse } from 'next/server';
import { readAuditLog, type AuditEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') ?? '';
    const action = searchParams.get('action') ?? '';
    const actor = (searchParams.get('actor') ?? '').trim().toLowerCase();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();

    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSizeParam = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(pageSizeParam) ? pageSizeParam : DEFAULT_PAGE_SIZE));

    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    const all: AuditEntry[] = await readAuditLog(Number.MAX_SAFE_INTEGER);

    const filtered = all.filter((e) => {
      if (module && e.module !== module) return false;
      if (action && e.action !== action) return false;
      if (actor && !e.actor.toLowerCase().includes(actor)) return false;
      if (q) {
        const haystack = `${e.summary ?? ''} ${e.targetId ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (fromTs !== null || toTs !== null) {
        const at = new Date(e.at).getTime();
        if (fromTs !== null && at < fromTs) return false;
        if (toTs !== null && at > toTs + 24 * 60 * 60 * 1000 - 1) return false;
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const entries = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      entries,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('[Admin Audit Log] GET error:', error);
    return NextResponse.json({ success: false, message: '조회 실패' }, { status: 500 });
  }
}
