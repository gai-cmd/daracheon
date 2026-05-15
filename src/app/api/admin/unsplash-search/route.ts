/**
 * Unsplash 검색 프록시.
 *
 *   - 키는 서버에서만 사용 (UNSPLASH_ACCESS_KEY) — 브라우저로 절대 노출 금지.
 *   - Demo (free) tier 한도: 50 req/hour. Production approval 후 5,000/hour.
 *
 * 두 가지 액션을 지원:
 *
 *   1) GET ?q=keyword&page=1&size=12&orientation=landscape|portrait|squarish
 *      → 검색 결과 목록을 우리 UI 가 쓰는 최소 필드로 슬림화해서 반환.
 *
 *   2) POST { id }
 *      → /photos/:id/download 엔드포인트를 호출해 Unsplash 측 통계에
 *        다운로드 1건을 기록 (가이드라인 의무사항). 우리는 응답 url 을
 *        다시 쓰지는 않고 트리거만 함. 실패는 무시 — 통계 누락이지
 *        기능 차단 사유는 아님.
 *
 * 어트리뷰션 (가이드라인):
 *   - 사진작가 이름 표기 + 프로필 링크 + Unsplash 링크
 *   - 두 링크에 ?utm_source=daerachoen&utm_medium=referral 부착 의무
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UNSPLASH_API = 'https://api.unsplash.com';
const UTM = 'utm_source=daerachoen&utm_medium=referral';

interface UnsplashUser {
  name?: string;
  username?: string;
  links?: { html?: string };
}
interface UnsplashPhoto {
  id: string;
  description?: string | null;
  alt_description?: string | null;
  width: number;
  height: number;
  color?: string;
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
  links: { html: string; download_location: string };
  user: UnsplashUser;
}
interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

function getKey(): string | null {
  return process.env.UNSPLASH_ACCESS_KEY ?? null;
}

function withUtm(url: string | undefined): string {
  if (!url) return '';
  return url.includes('?') ? `${url}&${UTM}` : `${url}?${UTM}`;
}

export async function GET(request: Request) {
  const key = getKey();
  if (!key) {
    return NextResponse.json(
      { success: false, message: 'UNSPLASH_ACCESS_KEY 가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    if (!q) {
      return NextResponse.json(
        { success: false, message: '검색어(q)가 필요합니다.' },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const size = Math.min(30, Math.max(1, parseInt(url.searchParams.get('size') ?? '12', 10) || 12));
    const orientation = url.searchParams.get('orientation'); // landscape | portrait | squarish

    const params = new URLSearchParams({
      query: q,
      page: String(page),
      per_page: String(size),
      content_filter: 'high', // 안전 컨텐츠
    });
    if (orientation === 'landscape' || orientation === 'portrait' || orientation === 'squarish') {
      params.set('orientation', orientation);
    }

    const upstream = await fetch(`${UNSPLASH_API}/search/photos?${params.toString()}`, {
      headers: {
        'Accept-Version': 'v1',
        Authorization: `Client-ID ${key}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (upstream.status === 403) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unsplash 시간당 한도(50req/h Demo tier)에 도달했습니다. Production 승인 후 5,000/h.',
        },
        { status: 429 }
      );
    }
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[Unsplash] non-OK', upstream.status, text.slice(0, 300));
      return NextResponse.json(
        { success: false, message: `Unsplash 응답 오류 (${upstream.status})` },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as UnsplashSearchResponse;
    const results = (data.results ?? []).map((p) => ({
      id: p.id,
      title: p.description ?? p.alt_description ?? '',
      // 본문 썸네일용 — regular (1080w) 면 1200x630 OG 까지 충분
      url: p.urls.regular,
      thumb: p.urls.small,
      w: p.width,
      h: p.height,
      color: p.color ?? '',
      creator: p.user.name ?? '',
      creator_username: p.user.username ?? '',
      creator_url: withUtm(p.user.links?.html),
      photo_url: withUtm(p.links.html),
      download_location: p.links.download_location, // POST 시 사용
    }));

    return NextResponse.json({
      success: true,
      results,
      total: data.total,
      total_pages: data.total_pages,
      page,
    });
  } catch (error) {
    console.error('[Unsplash] proxy error:', error);
    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Unsplash 응답 시간 초과 — 다시 시도하세요.'
        : 'Unsplash 검색 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * 사진 선택 시 다운로드 트래킹 — Unsplash 가이드라인 의무.
 * body: { download_location: string }   (GET 응답에서 받은 그대로 전달)
 */
export async function POST(request: Request) {
  const key = getKey();
  if (!key) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
  try {
    const body = (await request.json()) as { download_location?: string };
    if (!body?.download_location || !body.download_location.startsWith('https://api.unsplash.com/')) {
      return NextResponse.json({ success: false, message: 'invalid download_location' }, { status: 400 });
    }
    // 응답은 무시 — 통계 핑만 보냄
    await fetch(body.download_location, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(5000),
    }).catch((e) => console.warn('[Unsplash] download ping failed:', e));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Unsplash] POST error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
