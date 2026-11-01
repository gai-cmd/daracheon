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

/**
 * 썸네일 주소를 VideoObject.thumbnailUrl 로 쓸 수 있는 절대 URL 로. 쓸 수 없으면 undefined.
 * - Vercel Blob https URL → 그대로
 * - /public 정적 자산('/…') → `${siteUrl}/…`
 * - 그 외(lh3.googleusercontent.com 등 외부 CDN, 빈 값) → undefined
 */
export function toOwnedThumbnailUrl(raw: unknown, siteUrl: string): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const thumb = raw.trim();
  if (!thumb) return undefined;
  if (isBlobUrl(thumb)) return thumb;
  if (isPublicPath(thumb)) return `${siteUrl}${thumb}`;
  return undefined;
}

/** 달력에 실제로 있는 'YYYY-MM-DD' 인지 — 2024-02-30 은 Date 가 3월로 넘기므로 되돌려 비교해 거른다. */
function isCalendarDate(ymd: string): boolean {
  const d = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
}

/**
 * 저장된 날짜를 VideoObject.uploadDate 용 ISO 8601 DateTime(시간대 포함)으로. 쓸 수 없으면 undefined.
 * Google 은 uploadDate 를 DateTime 으로 받고 시간대를 넣으라고 한다 — 날짜만 내보내면 Search Console 이
 * 'datetime 속성에 시간대가 누락됨'·'datetime 값이 잘못됨' 을 낸다(2026-11 알림).
 *  - 'YYYY-MM-DD' → 그날 한국 시간 자정 'YYYY-MM-DDT00:00:00+09:00'
 *  - 시간대가 붙은 DateTime('…Z', '…+09:00') → 그대로
 *  - 시간대 없는 시각·다른 형식·달력에 없는 날짜 → undefined (시간대를 추측해 붙이지 않는다)
 */
export function toUploadDateTime(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!isCalendarDate(s.slice(0, 10))) return undefined;
  if (s.length === 10) return `${s}T00:00:00+09:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(s) && !Number.isNaN(Date.parse(s))) {
    return s;
  }
  return undefined;
}

function youtubeId(url: string): string | null {
  const m = /^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url);
  return m ? m[1] : null;
}

/** 조건을 모두 갖춘 영상만 VideoObject 로 변환한다. siteUrl 은 끝 슬래시 없는 정규 도메인. */
export function buildVideoObjects(videos: VideoCandidate[], siteUrl: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const v of videos) {
    if (!v.title || !v.url || !v.thumbnail) continue;
    const uploadDate = toUploadDateTime(v.date);
    if (!uploadDate) continue;

    const thumbnailUrl = toOwnedThumbnailUrl(v.thumbnail, siteUrl);
    if (!thumbnailUrl) continue;

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
      uploadDate,
      ...media,
      publisher: { '@id': `${siteUrl}/#organization` },
    });
  }
  return out;
}
