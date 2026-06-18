import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readDataUncached, writeData } from '@/lib/db';
import { productGuides, type ProductGuide } from '@/data/productGuides';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const FILE = 'product-guides';

const sectionSchema = z.object({ title: z.string().min(1).max(60), body: z.array(z.string().max(500)).max(30) });
const guideSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  image: z.string().max(600).optional(),
  tagline: z.string().max(200).optional(),
  sections: z.array(sectionSchema).max(20),
});
const bodySchema = z.object({ guides: z.array(guideSchema).max(100) });

export async function GET() {
  try {
    const stored = await readDataUncached<ProductGuide>(FILE);
    // 아직 저장된 적 없으면 코드 기본값(캡슐)으로 시작.
    const guides = stored.length > 0 ? stored : productGuides;
    return NextResponse.json({ success: true, guides });
  } catch (error) {
    console.error('[Admin guide] GET Error:', error);
    return NextResponse.json({ success: false, message: '불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' }, { status: 400 });
    }
    // 빈 body 줄 제거 + 정리
    const guides: ProductGuide[] = parsed.data.guides.map((g) => ({
      slug: g.slug.trim(),
      name: g.name.trim(),
      ...(g.image?.trim() ? { image: g.image.trim() } : {}),
      ...(g.tagline?.trim() ? { tagline: g.tagline.trim() } : {}),
      sections: g.sections
        .map((s) => ({ title: s.title.trim(), body: s.body.map((b) => b.trim()).filter(Boolean) }))
        .filter((s) => s.title && s.body.length > 0),
    }));
    await writeData(FILE, guides);
    revalidatePath('/guide');
    await logAdmin('product-guides', 'update', { summary: `제품 사용설명서 저장 (${guides.length}개 제품)` });
    return NextResponse.json({ success: true, guides });
  } catch (error) {
    console.error('[Admin guide] PUT Error:', error);
    return NextResponse.json({ success: false, message: '저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
