/**
 * 영상 구조화 데이터(VideoObject) 생성기 — /media 페이지용.
 *
 * Google 동영상 리치 결과 필수 항목은 name · thumbnailUrl · uploadDate 다.
 * 외부 CDN 의존 금지 원칙에 따라, 아래 조건을 모두 갖춘 영상만 VideoObject 로 내보낸다.
 *  - 영상: Vercel Blob 파일(contentUrl) 또는 YouTube(embedUrl)
 *  - 썸네일: Vercel Blob 또는 /public 정적 자산
 *  - 업로드일: 데이터에 실제로 저장된 날짜 (코드 폴백 날짜는 쓰지 않는다)
 * 하나라도 없으면 그 영상은 건너뛴다 — 값을 지어내지 않는다.
 */

const BLOB_HOST = 'xpklzng0qyaecv6i.public.blob.vercel-storage.com';

export interface VideoCandidate {
  title: string;
  /** 영상 주소 (Blob mp4 또는 YouTube 시청 URL) */
  url?: string;
  /** 썸네일 주소 */
  thumbnail?: string;
  /** 데이터에 저장된 업로드(촬영)일 — 없으면 undefined */
  date?: string;
  description?: string;
}

function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === BLOB_HOST;
  } catch {
    return false;
  }
}

/** /public 정적 자산 경로 (프로토콜 상대 '//' 는 외부 호스트라 제외). */
function isPublicPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function youtubeId(url: string): string | null {
  const m = /^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url);
  return m ? m[1] : null;
}

/** 조건을 모두 갖춘 영상만 VideoObject 로 변환한다. siteUrl 은 끝 슬래시 없는 정규 도메인. */
export function buildVideoObjects(videos: VideoCandidate[], siteUrl: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const v of videos) {
    if (!v.title || !v.url || !v.thumbnail || !v.date) continue;
    if (!/^\d{4}-\d{2}-\d{2}/.test(v.date)) continue;

    const thumb = v.thumbnail.trim();
    let thumbnailUrl: string;
    if (isBlobUrl(thumb)) thumbnailUrl = thumb;
    else if (isPublicPath(thumb)) thumbnailUrl = `${siteUrl}${thumb}`;
    else continue;

    const src = v.url.trim();
    const ytId = youtubeId(src);
    let media: Record<string, string>;
    if (isBlobUrl(src)) media = { contentUrl: src };
    else if (ytId) media = { embedUrl: `https://www.youtube.com/embed/${ytId}` };
    else continue;

    out.push({
      '@type': 'VideoObject',
      name: v.title,
      description: v.description || v.title,
      thumbnailUrl,
      uploadDate: v.date,
      ...media,
      publisher: { '@id': `${siteUrl}/#organization` },
    });
  }
  return out;
}
