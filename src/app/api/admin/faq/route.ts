import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

function revalidateFaq() {
  revalidatePath('/support', 'layout');
}

export type FaqCategory = '제품' | '배송/결제' | '성분' | '기타';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: FaqCategory;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const faq = await readData('faq');
    return NextResponse.json({
      faq,
      total: faq.length,
    });
  } catch (error) {
    console.error('[Admin FAQ] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json(
        { success: false, message: '질문은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.answer || typeof body.answer !== 'string' || !body.answer.trim()) {
      return NextResponse.json(
        { success: false, message: '답변은 필수입니다.' },
        { status: 400 }
      );
    }

    const faq = await readData('faq');

    const newItem: FaqItem = {
      id: body.id || `faq-${Date.now()}`,
      question: body.question.trim(),
      answer: body.answer.trim(),
      ...(body.category ? { category: body.category as FaqCategory } : {}),
    };

    faq.push(newItem);
    await writeData('faq', faq);
    revalidateFaq();

    await logAdmin('faq', 'create', {
      targetId: newItem.id,
      summary: `FAQ 등록: ${newItem.question.slice(0, 40)}`,
    });

    return NextResponse.json(
      { success: true, item: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin FAQ] POST Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'FAQ ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const faq = await readData('faq');
    const index = faq.findIndex((f) => f.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updated: FaqItem = {
      ...faq[index],
      ...(body.question ? { question: String(body.question).trim() } : {}),
      ...(body.answer ? { answer: String(body.answer).trim() } : {}),
      ...(body.category !== undefined ? { category: body.category as FaqCategory | undefined } : {}),
    };

    faq[index] = updated;
    await writeData('faq', faq);
    revalidateFaq();

    await logAdmin('faq', 'update', {
      targetId: body.id,
      summary: `FAQ 수정: ${updated.question.slice(0, 40)}`,
    });

    return NextResponse.json({
      success: true,
      item: faq[index],
    });
  } catch (error) {
    console.error('[Admin FAQ] PUT Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'FAQ ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const faq = await readData('faq');
    const index = faq.findIndex((f) => f.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const removed = faq.splice(index, 1)[0];
    await writeData('faq', faq);
    revalidateFaq();

    await logAdmin('faq', 'delete', {
      targetId: body.id,
      summary: `FAQ 삭제: ${removed?.question.slice(0, 40) ?? body.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `FAQ ${body.id}가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[Admin FAQ] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
