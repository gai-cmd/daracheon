import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

interface MediaItem {
  id: string;
  type: 'article' | 'press' | 'video';
  title: string;
  source: string;
  date: string;
  image: string;
  excerpt: string;
  url: string;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const media = await readData('media');
    return NextResponse.json({
      media,
      total: media.length,
    });
  } catch (error) {
    console.error('[Admin Media] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { success: false, message: '제목은 필수입니다.' },
        { status: 400 }
      );
    }

    const media = await readData('media');

    const newItem: MediaItem = {
      id: body.id || `m-${Date.now()}`,
      type: body.type || 'article',
      title: body.title.trim(),
      source: body.source?.trim() || '',
      date: body.date || new Date().toISOString().split('T')[0],
      image: body.image?.trim() || '',
      excerpt: body.excerpt?.trim() || '',
      url: body.url?.trim() || '#',
    };

    media.push(newItem);
    await writeData('media', media);

    await logAdmin('media', 'create', {
      targetId: newItem.id,
      summary: `미디어 등록: ${newItem.title}`,
    });

    return NextResponse.json(
      { success: true, item: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Media] POST Error:', error);
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
        { success: false, message: '미디어 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const media = await readData('media');
    const index = media.findIndex((m) => m.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 미디어를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    media[index] = { ...media[index], ...body };
    await writeData('media', media);

    await logAdmin('media', 'update', {
      targetId: body.id,
      summary: `미디어 수정: ${media[index].title}`,
    });

    return NextResponse.json({
      success: true,
      item: media[index],
    });
  } catch (error) {
    console.error('[Admin Media] PUT Error:', error);
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
        { success: false, message: '미디어 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const media = await readData('media');
    const index = media.findIndex((m) => m.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 미디어를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const removed = media.splice(index, 1)[0];
    await writeData('media', media);

    await logAdmin('media', 'delete', {
      targetId: body.id,
      summary: `미디어 삭제: ${removed?.title ?? body.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `미디어 ${body.id}가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[Admin Media] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
