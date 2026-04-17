import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

const AnnouncementSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
  link: z.string(),
  linkLabel: z.string(),
  variant: z.enum(['gold', 'dark', 'red']),
});

export interface Announcement {
  enabled: boolean;
  text: string;
  link: string;
  linkLabel: string;
  variant: 'gold' | 'dark' | 'red';
  updatedAt: string;
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: false,
  text: '',
  link: '',
  linkLabel: '',
  variant: 'gold',
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  const data = await readSingle('announcement') ?? DEFAULT_ANNOUNCEMENT;
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = AnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await readSingle('announcement') ?? DEFAULT_ANNOUNCEMENT;
  const updated: Announcement = {
    ...current,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  await writeSingle('announcement', updated);
  await logAdmin('announcement', 'update', {
    summary: `공지 배너 ${updated.enabled ? '활성화' : '비활성화'}: ${updated.text.slice(0, 30)}`,
  });

  return NextResponse.json(updated);
}
