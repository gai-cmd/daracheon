// 공식 유튜브 두 채널의 공개 피드(RSS, 채널당 최신 15편)를 하루 한 번 읽어 영상 목록을 Blob 에 쌓는다.
// 썸네일은 외부 CDN 직링크 금지 원칙에 따라 Vercel Blob 으로 복사한 주소만 저장한다.
// 한 번 쌓인 영상은 피드에서 밀려나도 남는다 — 시간이 갈수록 목록이 채널 전체에 가까워진다. 서버 전용.

import { put } from '@vercel/blob';
import { readSingleForWrite, writeSingle } from '@/lib/db';
import { fetchAllowed } from '@/lib/console/feed-fetch';
import { parseFeed } from '@/lib/console/feed-parse';
import { cleanVideoTitle } from '@/lib/sns';
import type { SnsVideo } from '@/lib/sns';

export const YOUTUBE_STORE = 'youtube-videos';

export const OFFICIAL_CHANNELS = [
  { channelId: 'UCptfyHCF_LfMmIRF_qSSLOQ', handle: '@ZoelLife_official_00' },
  { channelId: 'UCGy1eR9TDWeUXkfU6U2hdWA', handle: '@ZoelLife.official' },
] as const;

export interface StoredVideo extends SnsVideo {
  handle: string;
}

export interface YoutubeStore {
  videos: StoredVideo[];
  syncedAt: string;
}

export interface SyncDeps {
  fetchFeed: (channelId: string) => Promise<string | null>;
  copyThumb: (videoId: string) => Promise<string | null>;
  read: () => Promise<YoutubeStore | null>;
  write: (store: YoutubeStore) => Promise<void>;
  now: () => string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const hasHangul = (title: string) => /[가-힣]/.test(cleanVideoTitle(title));

/** 피드 항목 주소(watch?v=… / shorts/…)에서 영상 ID 를 뽑는다. */
export function videoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop() ?? '';
    return VIDEO_ID.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** 기존 목록에 새 영상을 더한다. 같은 ID 는 제목·날짜만 최신값으로 바꾸고 썸네일은 유지. 최신순 정렬. */
export function mergeVideos(existing: StoredVideo[], incoming: StoredVideo[]): StoredVideo[] {
  const byId = new Map(existing.map((v) => [v.id, v]));
  for (const v of incoming) {
    const old = byId.get(v.id);
    byId.set(v.id, old ? { ...old, title: v.title, publishedAt: v.publishedAt || old.publishedAt } : v);
  }
  return [...byId.values()].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

export interface SyncResult {
  ok: boolean;
  added: number;
  total: number;
  failedChannels: string[];
  skippedThumbs: number;
}

export async function syncYoutube(deps: SyncDeps): Promise<SyncResult> {
  const prev = (await deps.read())?.videos ?? [];
  const known = new Set(prev.map((v) => v.id));
  const incoming: StoredVideo[] = [];
  const failedChannels: string[] = [];
  let skippedThumbs = 0;

  for (const ch of OFFICIAL_CHANNELS) {
    const xml = await deps.fetchFeed(ch.channelId);
    const items = xml ? parseFeed(xml) : null;
    if (!items) {
      failedChannels.push(ch.handle);
      continue;
    }
    for (const it of items) {
      const id = videoIdFromUrl(it.url);
      if (!id || !hasHangul(it.title)) continue;
      const base = { id, title: it.title, publishedAt: it.publishedAt ?? '', handle: ch.handle };
      if (known.has(id)) {
        incoming.push({ ...base, thumbnail: '' });
        continue;
      }
      const thumbnail = await deps.copyThumb(id);
      if (!thumbnail) {
        skippedThumbs++;
        continue; // 썸네일을 우리 자산으로 못 옮기면 싣지 않는다(다음 동기화 때 다시 시도)
      }
      incoming.push({ ...base, thumbnail });
      known.add(id);
    }
  }

  // 이미 있던 영상은 thumbnail '' 로 들어왔지만 mergeVideos 가 기존 썸네일을 유지한다.
  const videos = mergeVideos(prev, incoming);
  const added = videos.length - prev.length;
  if (added > 0 || failedChannels.length < OFFICIAL_CHANNELS.length) {
    await deps.write({ videos, syncedAt: deps.now() });
  }
  return { ok: failedChannels.length === 0, added, total: videos.length, failedChannels, skippedThumbs };
}

const ytimgHost = (h: string) => h === 'i.ytimg.com';
const feedHost = (h: string) => h === 'www.youtube.com';

/** 실제 운영용 의존성 — 공개 피드 읽기, 썸네일을 Blob 으로 복사, Blob JSON 읽기·쓰기. */
export function liveSyncDeps(): SyncDeps {
  return {
    fetchFeed: async (channelId) => {
      const r = await fetchAllowed(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        allow: feedHost,
        maxBytes: 1024 * 1024,
        timeoutMs: 8000,
      });
      return r.ok ? new TextDecoder().decode(r.bytes) : null;
    },
    copyThumb: async (videoId) => {
      const r = await fetchAllowed(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, {
        allow: ytimgHost,
        maxBytes: 2 * 1024 * 1024,
        timeoutMs: 8000,
        accept: 'image/*',
      });
      if (!r.ok || !r.contentType.startsWith('image/')) return null;
      const res = await put(`uploads/youtube/yt-${videoId}.jpg`, Buffer.from(r.bytes), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/jpeg',
      });
      return res.url;
    },
    // 쓰기 기준 목록은 캐시·예비본 없이 읽고, 읽기 실패면 throw — 빈 목록으로 덮어써 쌓인 영상을 잃지 않게.
    read: () => readSingleForWrite<YoutubeStore>(YOUTUBE_STORE),
    write: (store) => writeSingle(YOUTUBE_STORE, store),
    now: () => new Date().toISOString(),
  };
}
