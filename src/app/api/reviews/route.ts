import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readData, writeData } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import type { Review } from '@/data/reviews';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const product = searchParams.get('product');
    const sort = searchParams.get('sort') || 'date';

    // 공개 API: 인증된(verified) 리뷰만 반환
    let filtered = (await readData<Review>('reviews')).filter((r) => r.verified === true);

    if (product) {
      filtered = filtered.filter((r) => r.product.includes(product));
    }

    if (sort === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    const avgRating =
      filtered.length > 0
        ? filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length
        : 0;

    return NextResponse.json({
      reviews: filtered,
      total: filtered.length,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error('[Reviews API] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ── POST: 공개 리뷰 작성 ─────────────────────────────────────────────────────

interface RateLimitEntry {
  ip: string;
  ts: number;
}

const ReviewSchema = z.object({
  author: z.string().min(1, '이름을 입력해주세요.').max(20, '이름은 최대 20자까지 입력 가능합니다.'),
  age: z.string().optional(),
  product: z.string().min(1, '제품을 선택해주세요.'),
  rating: z.number().int().min(1, '별점은 1점 이상이어야 합니다.').max(5, '별점은 5점 이하여야 합니다.'),
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 최대 100자까지 입력 가능합니다.'),
  content: z.string().min(10, '내용은 최소 10자 이상 입력해주세요.').max(2000, '내용은 최대 2000자까지 입력 가능합니다.'),
});

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const MAX_ENTRIES = 10;

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const entries = await readData<RateLimitEntry>('rate-limit');
    const now = Date.now();
    const recent = entries.find(
      (e) => e.ip === ip && now - e.ts < RATE_LIMIT_WINDOW_MS
    );
    return !recent; // true = 허용
  } catch {
    return true; // 파일 읽기 실패 시 허용
  }
}

async function recordRateLimitEntry(ip: string): Promise<void> {
  try {
    const entries = await readData<RateLimitEntry>('rate-limit');
    const now = Date.now();
    // 오래된 항목 정리 + 새 항목 추가
    const cleaned = entries
      .filter((e) => now - e.ts < RATE_LIMIT_WINDOW_MS * 60) // 1시간 이내만 유지
      .slice(-(MAX_ENTRIES - 1));
    cleaned.push({ ip, ts: now });
    await writeData('rate-limit', cleaned);
  } catch {
    // 저장 실패 무시
  }
}

export async function POST(request: Request) {
  try {
    // IP 추출
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    // 스팸 방지: IP가 있을 때만 체크
    if (ip) {
      const allowed = await checkRateLimit(ip);
      if (!allowed) {
        return NextResponse.json(
          { error: '너무 빠른 요청입니다. 1분 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
    }

    // body 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    // Zod 검증
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? '입력값을 확인해주세요.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // ID 생성 & 저장
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 7);
    const newReview: Review = {
      id: `r-${timestamp}-${random}`,
      author: data.author,
      age: data.age ?? '',
      product: data.product,
      rating: data.rating,
      title: data.title,
      content: data.content,
      date: new Date().toISOString().split('T')[0],
      verified: false,
    };

    const reviews = await readData('reviews');
    reviews.push(newReview);
    await writeData('reviews', reviews);

    // 레이트 리밋 기록
    if (ip) {
      await recordRateLimitEntry(ip);
    }

    // 관리자 이메일 알림 (dry-run 가능)
    const adminEmail = process.env.ADMIN_EMAIL ?? 'dev@try-n.com';
    await sendEmail({
      to: adminEmail,
      subject: `[ZOEL LIFE] 새 리뷰 작성 — ${data.author}님`,
      html: `
        <h2>새 리뷰가 작성되었습니다</h2>
        <p><strong>작성자:</strong> ${data.author}${data.age ? ` (${data.age})` : ''}</p>
        <p><strong>제품:</strong> ${data.product}</p>
        <p><strong>별점:</strong> ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</p>
        <p><strong>제목:</strong> ${data.title}</p>
        <p><strong>내용:</strong><br/>${data.content.replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p>관리자 페이지에서 승인 후 게시됩니다.</p>
      `,
      text: `새 리뷰: ${data.author} | ${data.product} | ${data.rating}점\n${data.title}\n${data.content}`,
    });

    return NextResponse.json({ success: true, id: newReview.id }, { status: 201 });
  } catch (error) {
    console.error('[Reviews POST] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
