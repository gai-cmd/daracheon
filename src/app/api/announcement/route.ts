import { NextResponse } from 'next/server';
import { readSingle } from '@/lib/db';

export const revalidate = 60;

interface Announcement {
  enabled: boolean;
  text: string;
  link: string;
  linkLabel: string;
  variant: 'gold' | 'dark' | 'red';
  updatedAt: string;
}

export async function GET() {
  const data = await readSingle('announcement');

  if (!data || !data.enabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json(data);
}
