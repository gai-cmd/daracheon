import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import {
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_MAIN_NAV,
  type NavigationData,
} from '@/data/navigation';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

const NavItemSchema = z.object({
  label: z.string().min(1, 'label 필수').max(40, 'label은 40자 이내'),
  href: z.string().min(1, 'href 필수').max(200),
});

const FooterColumnSchema = z.object({
  title: z.string().min(1, 'title 필수').max(30),
  links: z.array(NavItemSchema).min(1).max(20),
});

const NavigationSchema = z.object({
  main: z.array(NavItemSchema).min(1, '주메뉴는 최소 1개').max(15, '주메뉴는 최대 15개'),
  footerColumns: z.array(FooterColumnSchema).min(1).max(6, '푸터 컬럼은 최대 6개'),
});

const DEFAULT_NAVIGATION: NavigationData = {
  main: DEFAULT_MAIN_NAV,
  footerColumns: DEFAULT_FOOTER_COLUMNS,
  updatedAt: new Date(0).toISOString(),
};

export async function GET() {
  const data = (await readSingle<NavigationData>('navigation')) ?? DEFAULT_NAVIGATION;
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const parsed = NavigationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력 검증 실패', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated: NavigationData = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  await writeSingle('navigation', updated);
  await logAdmin('settings', 'update', {
    summary: `네비게이션 업데이트 (주메뉴 ${updated.main.length}개 / 푸터 ${updated.footerColumns.length}컬럼)`,
    meta: { mainCount: updated.main.length, footerColumns: updated.footerColumns.length },
  });

  // Navigation shows on every page via the root layout, so revalidate the
  // layout to push the change to all static pages at once.
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* ignore — revalidation is best-effort */
  }

  return NextResponse.json(updated);
}
