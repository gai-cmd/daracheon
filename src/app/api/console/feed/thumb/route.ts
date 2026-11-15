import { NextResponse } from 'next/server';
import { publicBlobHost, readSingle } from '@/lib/db';
import { normalizeStoredChannels } from '@/lib/console/channels';
import { isConsoleConfigured } from '@/lib/console/config';
import { thumbAllowed } from '@/lib/console/feed';
import { fetchAllowed } from '@/lib/console/feed-fetch';
import { readConsoleSession } from '@/lib/console/session';
import { CONSOLE_DOCS, type ConsoleSettings } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 채널 새 소식 썸네일 중계 (SPEC-CONSOLE-002 REQ-CS2-036, design.md §2.14, CS2-D24). 브라우저가 바깥 이미지
// 호스트에 직접 붙지 않게 허용 목록의 그림만 서버가 쿠키·Referer 없이 받아 넘긴다. 콘솔 세션이 있어야 하므로
// 인터넷 전체에 열린 중계기가 아니다. 어떤 검사든 실패하면 코드에 묶어 둔 중립색 그림을 200 으로 돌려준다
// (그림 태그가 깨진 아이콘을 보이지 않게), X-Thumb-Fallback 머리글로 구별한다.

const THUMB_MAX_BYTES = 2 * 1024 * 1024;
const U_MAX = 2048;

// 16×9 단색(#ece8de) PNG, 77바이트. 바깥 자산이 아니다.
const PLACEHOLDER = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAFElEQVR42mN48+IeSYhhVMOg0AAAaruEMH3WGsEAAAAASUVORK5CYII=', 'base64');

function placeholder(): Response {
  return new Response(new Uint8Array(PLACEHOLDER), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Thumb-Fallback': '1',
    },
  });
}

function imageType(contentType: string): string | null {
  const t = contentType.split(';', 1)[0].trim().toLowerCase();
  return t.startsWith('image/') && t !== 'image/svg+xml' ? t : null;
}

export async function GET(request: Request) {
  // 썸네일마다 사람 목록을 읽지 않도록 세션만 본다(관리자 권한은 필요 없다).
  if (!isConsoleConfigured()) return NextResponse.json({ error: 'console_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!(await readConsoleSession(request))) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const u = new URL(request.url).searchParams.get('u');
  if (!u || u.length > U_MAX) return placeholder();
  try {
    const settings = await readSingle<Partial<ConsoleSettings>>(CONSOLE_DOCS.settings);
    const channels = normalizeStoredChannels(settings?.channels);
    const blobHost = publicBlobHost();
    const res = await fetchAllowed(u, {
      allow: (h) => thumbAllowed(h, channels, blobHost),
      maxBytes: THUMB_MAX_BYTES,
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.1',
    });
    const type = res.ok ? imageType(res.contentType) : null;
    if (!res.ok || !type) return placeholder();
    return new Response(new Uint8Array(res.bytes), {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (err) {
    console.error('[console thumb] failed:', err instanceof Error ? err.message : 'unknown');
    return placeholder();
  }
}
