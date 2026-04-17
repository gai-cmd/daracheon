import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';

interface FaqDbItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const revalidate = 60;

export async function GET() {
  try {
    const faqItems = await readData('faq');
    return NextResponse.json({ faqItems, total: faqItems.length });
  } catch (error) {
    console.error('[FAQ API] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
