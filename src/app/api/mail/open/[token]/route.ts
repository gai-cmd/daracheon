import { NextRequest, NextResponse } from 'next/server';
import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { verifyTrackToken, TRANSPARENT_GIF } from '@/lib/mail-tracking';
import { postSlack } from '@/lib/slack';
import type { InquiryRecord } from '@/lib/inquiry-reply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 답변 메일 열람 추적 픽셀.
 *   GET /api/mail/open/<inquiryId>.<sig>.gif
 *
 * 어떤 경우에도 1x1 GIF 를 200 으로 돌려준다 — 토큰이 위조됐든 문의가
 * 지워졌든 고객 메일에 깨진 이미지가 뜨면 안 된다. 기록 실패는 조용히 무시.
 */

/** Gmail 등 이미지 프록시의 배달 직후 프리페치를 열람으로 오인하지 않기 위한 유예. */
const PREFETCH_GRACE_MS = 15_000;

function gif() {
  return new NextResponse(new Uint8Array(TRANSPARENT_GIF), {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.length),
      // 프록시·클라이언트 캐시를 막아야 재열람도 집계된다.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token: rawToken } = await params;
    const token = rawToken.replace(/\.gif$/i, '');
    const inquiryId = verifyTrackToken(token);
    if (!inquiryId) return gif();

    const inquiries = await readDataForWrite<InquiryRecord>('inquiries');
    const idx = inquiries.findIndex((q) => q.id === inquiryId);
    if (idx === -1) return gif();

    const inq = inquiries[idx];
    const now = Date.now();

    // 발송 직후 프리페치 구간은 집계하지 않는다 (거짓 '열람' 방지).
    if (inq.replyAt) {
      const sent = new Date(inq.replyAt).getTime();
      if (Number.isFinite(sent) && now - sent < PREFETCH_GRACE_MS) return gif();
    }

    const nowIso = new Date(now).toISOString();
    const isFirst = !inq.openedAt;
    inquiries[idx] = {
      ...inq,
      openedAt: inq.openedAt ?? nowIso,
      lastOpenAt: nowIso,
      openCount: (inq.openCount ?? 0) + 1,
    };
    await writeDataMerged('inquiries', inquiries);

    // 첫 열람만 Slack 스레드에 통지 — 재열람마다 알리면 채널이 시끄러워진다.
    if (isFirst && inq.slackChannel && inq.slackTs) {
      postSlack({
        channel: inq.slackChannel,
        threadTs: inq.slackTs,
        text: `👀 고객이 답변 메일을 열람했습니다 — ${inq.name}`,
      }).catch(() => {});
    }

    return gif();
  } catch (err) {
    console.error('[mail-open] tracking failed:', err);
    return gif();
  }
}
