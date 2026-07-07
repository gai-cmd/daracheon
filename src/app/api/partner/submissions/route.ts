import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import crypto from 'crypto';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { PARTNER_COOKIE, verifyPartnerToken } from '@/lib/partner-auth';
import { PARTNER_ACCOUNTS_FILE, type PartnerAccount } from '@/lib/partner-accounts';
import {
  SUBMISSIONS_FILE,
  fetchWeatherAt,
  isAllowedContentUrl,
  type MediaSubmission,
} from '@/lib/media-submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getSession() {
  const store = await cookies();
  return verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
}

/** 비활성화된 계정의 잔여 세션 차단 — 계정 상태를 매 요청 재확인 */
async function isAccountActive(accountId: string): Promise<boolean> {
  try {
    const accounts = await readDataUncached<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    const account = accounts.find((a) => a.id === accountId);
    return !!account?.active;
  } catch {
    // 계정 목록 조회 실패 시 차단(fail-closed) — 업로드는 재시도 가능한 작업.
    return false;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }
  try {
    const all = await readDataUncached<MediaSubmission>(SUBMISSIONS_FILE);
    // 자기 계정 제출분만 노출 (업체 간 상호 비공개)
    const mine = all
      .filter((s) => s.partnerAccountId === session.accountId)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
      .slice(0, 50);
    return NextResponse.json({ submissions: mine });
  } catch (error) {
    console.error('[Partner Submissions] GET Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

const fileSchema = z.object({
  url: z.string().min(1).max(1000),
  type: z.enum(['photo', 'video']),
  contentType: z.string().max(100),
  size: z.number().int().nonnegative(),
  name: z.string().max(200).optional(),
});

const submitSchema = z.object({
  title: z.string().min(1).max(120),
  note: z.string().max(2000).optional(),
  files: z.array(fileSchema).min(1).max(20),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().nonnegative().optional(),
      /** 'exif' = 사진 메타데이터, 'device' = 업로드 기기 GPS */
      source: z.enum(['exif', 'device']).optional(),
    })
    .optional(),
  capturedAt: z.string().max(40).optional(),
  clientTime: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }
  if (!(await isAccountActive(session.accountId))) {
    return NextResponse.json(
      { success: false, message: '계정이 비활성화되었습니다. / Tài khoản đã bị vô hiệu hóa.' },
      { status: 403 }
    );
  }

  try {
    const parsed = submitSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '입력값이 올바르지 않습니다. / Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 외부 CDN 금지 원칙 — Vercel Blob / 번들 정적 경로 외 URL 거부.
    const badFile = data.files.find((f) => !isAllowedContentUrl(f.url));
    if (badFile) {
      return NextResponse.json(
        { success: false, message: '허용되지 않은 파일 URL 입니다.' },
        { status: 400 }
      );
    }

    // 날씨: 위치가 있으면 촬영 시각 기준으로 조회 (실패해도 제출은 진행)
    const weather = data.location
      ? await fetchWeatherAt(data.location.lat, data.location.lng, data.capturedAt)
      : null;

    const submission: MediaSubmission = {
      id: `ms-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`,
      status: 'pending',
      title: data.title.trim(),
      ...(data.note?.trim() ? { note: data.note.trim() } : {}),
      files: data.files,
      partnerName: session.name,
      partnerAccountId: session.accountId,
      ...(data.location ? { location: data.location } : {}),
      ...(weather ? { weather } : {}),
      ...(data.capturedAt ? { capturedAt: data.capturedAt } : {}),
      ...(data.clientTime ? { clientTime: data.clientTime } : {}),
      submittedAt: new Date().toISOString(),
    };

    const all = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    all.push(submission);
    await writeDataMerged(SUBMISSIONS_FILE, all);

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('[Partner Submissions] POST Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
