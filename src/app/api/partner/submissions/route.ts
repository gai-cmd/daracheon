import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import crypto from 'crypto';
import { del } from '@vercel/blob';
import { readDataForWrite, readDataUncached, writeDataMerged } from '@/lib/db';
import { PARTNER_COOKIE, verifyPartnerToken, type PartnerSession } from '@/lib/partner-auth';
import { findValidPartnerAccount } from '@/lib/partner-accounts';
import {
  SUBMISSIONS_FILE,
  fetchWeatherAt,
  isAllowedContentUrl,
  type MediaSubmission,
} from '@/lib/media-submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 세션 + 계정 실시간 유효성(비활성화·비번변경 즉시 차단) 동시 검증 */
async function getValidSession(): Promise<PartnerSession | null> {
  const store = await cookies();
  const session = await verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
  if (!session) return null;
  const account = await findValidPartnerAccount(session);
  return account ? session : null;
}

const AUTH_FAIL = NextResponse.json(
  { success: false, message: '인증이 필요합니다.' },
  { status: 401 }
);

export async function GET() {
  const session = await getValidSession();
  if (!session) return AUTH_FAIL;
  try {
    const all = await readDataUncached<MediaSubmission>(SUBMISSIONS_FILE);
    // 자기 계정 제출분만 노출 (업체 간 상호 비공개)
    const mine = all
      .filter((s) => s.partnerAccountId === session.accountId)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
      .slice(0, 100);
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
  /** 사진 EXIF GPS (촬영 지점) — 있을 때만 */
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
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
  const session = await getValidSession();
  if (!session) return AUTH_FAIL;

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

/* ── 편집: 본인 제출 + 승인 전(pending/rejected) 상태만 수정 가능.
      제목·메모뿐 아니라 사진/영상 교체(추가·삭제)도 허용한다. 반려(rejected)
      건을 수정·저장하면 다시 '승인 대기(pending)'로 돌아가 관리자가 재검토한다.
      교체로 빠진 blob 파일은 best-effort 로 정리한다. ── */

const editSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  note: z.string().max(2000).optional(),
  /** 지정 시 파일 목록 전체 교체 (추가·삭제·재정렬). 미지정 시 기존 유지. */
  files: z.array(fileSchema).min(1).max(20).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().nonnegative().optional(),
      source: z.enum(['exif', 'device']).optional(),
    })
    .optional(),
  capturedAt: z.string().max(40).optional(),
});

export async function PUT(request: Request) {
  const session = await getValidSession();
  if (!session) return AUTH_FAIL;

  try {
    const parsed = editSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 파일 교체 시에도 외부 CDN 금지 원칙 강제.
    if (data.files) {
      const badFile = data.files.find((f) => !isAllowedContentUrl(f.url));
      if (badFile) {
        return NextResponse.json(
          { success: false, message: '허용되지 않은 파일 URL 입니다.' },
          { status: 400 }
        );
      }
    }

    const all = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    const idx = all.findIndex(
      (s) => s.id === data.id && s.partnerAccountId === session.accountId
    );
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '제출을 찾을 수 없습니다.' }, { status: 404 });
    }
    const cur = all[idx];
    if (cur.status === 'approved') {
      return NextResponse.json(
        { success: false, message: '게시된 항목은 관리자에게 요청하세요. / Mục đã đăng cần liên hệ quản trị viên.' },
        { status: 409 }
      );
    }

    if (data.title) cur.title = data.title.trim();
    if (data.note !== undefined) {
      const trimmed = data.note.trim();
      if (trimmed) cur.note = trimmed;
      else delete cur.note;
    }

    // 파일 교체 — 빠진(orphaned) blob 은 저장 후 정리한다.
    let orphaned: string[] = [];
    if (data.files) {
      const keepUrls = new Set(data.files.map((f) => f.url));
      orphaned = cur.files.filter((f) => !keepUrls.has(f.url)).map((f) => f.url);
      cur.files = data.files;
    }

    // 위치가 새로 오면 촬영 시각 기준 날씨를 다시 조회한다 (제출 흐름과 동일).
    if (data.location) {
      cur.location = data.location;
      if (data.capturedAt) cur.capturedAt = data.capturedAt;
      const weather = await fetchWeatherAt(data.location.lat, data.location.lng, cur.capturedAt);
      if (weather) cur.weather = weather;
    } else if (data.capturedAt) {
      cur.capturedAt = data.capturedAt;
    }

    // 반려 건을 수정·저장하면 다시 승인 대기로 — 관리자 재검토 대상이 된다.
    if (cur.status === 'rejected') {
      cur.status = 'pending';
      delete cur.rejectReason;
      delete cur.reviewedAt;
      delete cur.reviewedBy;
      cur.submittedAt = new Date().toISOString();
    }

    all[idx] = cur;
    await writeDataMerged(SUBMISSIONS_FILE, all);

    // 교체로 빠진 파일 정리 — blob URL 만 대상, 실패 무시.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      for (const url of orphaned) {
        if (url.startsWith('https://')) {
          del(url).catch((err) =>
            console.warn('[Partner Submissions] 교체 파일 정리 실패:', url, err)
          );
        }
      }
    }

    return NextResponse.json({ success: true, submission: cur });
  } catch (error) {
    console.error('[Partner Submissions] PUT Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

/* ── 삭제: 본인 제출 + pending/rejected 만 가능. 승인(게시)분은 관리자 영역.
      Blob 파일도 함께 정리 (best-effort — 실패해도 레코드는 삭제). ── */

export async function DELETE(request: Request) {
  const session = await getValidSession();
  if (!session) return AUTH_FAIL;

  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'id는 필수입니다.' }, { status: 400 });
    }

    const all = await readDataForWrite<MediaSubmission>(SUBMISSIONS_FILE);
    const idx = all.findIndex(
      (s) => s.id === body.id && s.partnerAccountId === session.accountId
    );
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '제출을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (all[idx].status === 'approved') {
      return NextResponse.json(
        { success: false, message: '게시된 항목은 관리자에게 요청하세요. / Mục đã đăng cần liên hệ quản trị viên.' },
        { status: 409 }
      );
    }

    const removed = all.splice(idx, 1)[0];
    await writeDataMerged(SUBMISSIONS_FILE, all, { removedIds: [body.id] });

    // 업로드 파일 정리 — blob URL 만 대상 (로컬 dev 경로는 스킵), 실패 무시.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      for (const f of removed.files) {
        if (f.url.startsWith('https://')) {
          del(f.url).catch((err) =>
            console.warn('[Partner Submissions] blob 파일 정리 실패:', f.url, err)
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Partner Submissions] DELETE Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
