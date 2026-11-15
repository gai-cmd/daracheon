// 홈 "채널 새 소식" 모으기 (SPEC-CONSOLE-002 REQ-CS2-031·032·035·036, design.md §2.11, CS2-D21·D24·D27).
// 켜진 채널마다 최신 6건, 출처 하나가 실패해도 그 채널만 ok:false. 바깥 피드 결과는 서버 메모리에
// `${kind}:${source}` 키로 성공 30분·실패 5분 캐시한다(인스턴스마다 따로). 서버 전용.

import { readLatestPublishedPostsSafe, type BlogPostSummary } from '@/lib/blog/store';
import { publicBlobHost } from '@/lib/db';
import { channelHome } from './channels';
import { fetchAllowed, type FetchAllowedOptions } from './feed-fetch';
import { parseFeed, type ParsedFeedItem } from './feed-parse';
import type { ConsoleChannel, FeedChannelInfo, FeedErrorCode, FeedItemInfo, FeedResponse } from './types';

export const THUMB_PATH = '/api/console/feed/thumb';
export const PER_CHANNEL = 6;
export const FEED_MAX_BYTES = 1024 * 1024;
export const FEED_TTL_OK_MS = 30 * 60_000;
export const FEED_TTL_FAIL_MS = 5 * 60_000;

export interface FeedDeps {
  fetchImpl?: FetchAllowedOptions['fetchImpl'];
  now?: () => number;
  timeoutMs?: number;
  readBlog?: (limit: number) => Promise<Pick<BlogPostSummary, 'slug' | 'title' | 'publishedAt' | 'createdAt' | 'coverImage'>[]>;
  blobHost?: () => string | null;
}

type CacheEntry = { at: number; ok: true; items: ParsedFeedItem[] } | { at: number; ok: false; error: FeedErrorCode };
const cache = new Map<string, CacheEntry>();

/** 테스트용: 모듈 캐시를 비운다. */
export function clearFeedCache(): void {
  cache.clear();
}

/** 바깥 피드를 가져오는 종류의 요청 주소와 허용 호스트. 자사 블로그·인스타그램은 null(요청 없음). */
function feedTarget(c: ConsoleChannel): { url: string; host: string } | null {
  switch (c.kind) {
    case 'youtube':
      return { url: `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(c.source)}`, host: 'www.youtube.com' };
    case 'naver':
      return { url: `https://rss.blog.naver.com/${encodeURIComponent(c.source)}.xml`, host: 'rss.blog.naver.com' };
    case 'rss': {
      let host = '';
      try {
        host = new URL(c.source).hostname.toLowerCase();
      } catch {
        // 아래 fetchAllowed 가 not_allowed 로 끝낸다
      }
      return { url: c.source, host };
    }
    default:
      return null;
  }
}

const YTIMG = /^i[0-9]?\.ytimg\.com$/;

/**
 * 썸네일 허용 목록 (REQ-CS2-036): i.ytimg.com·i1~i9.ytimg.com, img.youtube.com, pstatic.net 과 그 하위,
 * 공개 Blob 호스트, 켜진 rss 채널 주소의 호스트. 부분 문자열 비교를 쓰지 않는다(정확히 같거나 '.'+접미사).
 */
export function thumbAllowed(hostname: string, channels: readonly ConsoleChannel[], blobHost: string | null): boolean {
  const h = hostname.toLowerCase();
  if (YTIMG.test(h) || h === 'img.youtube.com') return true;
  if (h === 'pstatic.net' || h.endsWith('.pstatic.net')) return true;
  if (blobHost && h === blobHost.toLowerCase()) return true;
  return channels.some((c) => {
    if (!c.enabled || c.kind !== 'rss') return false;
    try {
      return new URL(c.source).hostname.toLowerCase() === h;
    } catch {
      return false;
    }
  });
}

/** 원본 그림 주소 → 썸네일 경로. https 이고 허용 목록에 있을 때만, 아니면 null. */
export function thumbUrl(src: string | null | undefined, channels: readonly ConsoleChannel[], blobHost: string | null): string | null {
  if (!src) return null;
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || src.length > 2048 || !thumbAllowed(u.hostname, channels, blobHost)) return null;
  return `${THUMB_PATH}?u=${encodeURIComponent(src)}`;
}

async function loadSource(c: ConsoleChannel, deps: FeedDeps): Promise<CacheEntry> {
  const now = deps.now ?? Date.now;
  const target = feedTarget(c)!;
  const res = await fetchAllowed(target.url, {
    allow: (h) => !!target.host && h === target.host,
    maxBytes: FEED_MAX_BYTES,
    timeoutMs: deps.timeoutMs,
    accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1',
    fetchImpl: deps.fetchImpl,
  });
  if (!res.ok) return { at: now(), ok: false, error: res.error };
  const items = parseFeed(new TextDecoder().decode(res.bytes));
  return items ? { at: now(), ok: true, items } : { at: now(), ok: false, error: 'parse_error' };
}

const cacheKey = (c: ConsoleChannel) => `${c.kind}:${c.source}`;

/** 켜진 채널을 설정 순서대로 모아 피드 응답을 만든다. */
export async function buildFeed(all: readonly ConsoleChannel[], deps: FeedDeps = {}): Promise<FeedResponse> {
  const now = deps.now ?? Date.now;
  const blobHost = (deps.blobHost ?? publicBlobHost)();
  const channels = all.filter((c) => c.enabled).sort((a, b) => a.order - b.order);

  // 설정에 없는 출처의 캐시는 지워 무한히 늘지 않게 한다.
  const liveKeys = new Set(channels.filter((c) => feedTarget(c)).map(cacheKey));
  for (const k of [...cache.keys()]) if (!liveKeys.has(k)) cache.delete(k);

  // 같은 출처는 한 번만 가져온다.
  const pending = new Map<string, Promise<CacheEntry>>();
  for (const c of channels) {
    if (!feedTarget(c)) continue;
    const key = cacheKey(c);
    if (pending.has(key)) continue;
    const hit = cache.get(key);
    const ttl = hit?.ok ? FEED_TTL_OK_MS : FEED_TTL_FAIL_MS;
    if (hit && now() - hit.at < ttl) {
      pending.set(key, Promise.resolve(hit));
      continue;
    }
    pending.set(
      key,
      loadSource(c, deps)
        .catch((err): CacheEntry => {
          console.error('[console feed] source failed:', err instanceof Error ? err.message : 'unknown');
          return { at: now(), ok: false, error: 'network' };
        })
        .then((entry) => {
          cache.set(key, entry);
          return entry;
        })
    );
  }

  const blogPosts = channels.some((c) => c.kind === 'zoellife-blog') ? await (deps.readBlog ?? readLatestPublishedPostsSafe)(PER_CHANNEL) : [];

  const outChannels: FeedChannelInfo[] = [];
  const items: FeedItemInfo[] = [];
  for (const c of channels) {
    const info: FeedChannelInfo = { id: c.id, label: c.label, label_en: c.label_en, color: c.color, kind: c.kind, home: channelHome(c), ok: true };
    if (c.kind === 'zoellife-blog') {
      for (const p of blogPosts.slice(0, PER_CHANNEL)) {
        const at = p.publishedAt ?? p.createdAt;
        items.push({
          channelId: c.id,
          title: (p.title ?? '').slice(0, 200),
          url: `/blog/${encodeURIComponent(p.slug)}`,
          publishedAt: at && Number.isFinite(Date.parse(at)) ? new Date(at).toISOString() : null,
          thumb: thumbUrl(p.coverImage, all, blobHost),
        });
      }
    } else if (feedTarget(c)) {
      const entry = await pending.get(cacheKey(c))!;
      if (entry.ok) {
        for (const it of entry.items.slice(0, PER_CHANNEL)) {
          items.push({ channelId: c.id, title: it.title, url: it.url, publishedAt: it.publishedAt, thumb: thumbUrl(it.thumbSrc, all, blobHost) });
        }
      } else {
        info.ok = false;
        info.error = entry.error;
      }
    }
    outChannels.push(info);
  }

  // 최신순, 날짜 없는 항목은 뒤 (같으면 원래 순서 — sort 는 안정 정렬).
  const time = (i: FeedItemInfo) => (i.publishedAt ? Date.parse(i.publishedAt) : Number.NEGATIVE_INFINITY);
  items.sort((a, b) => (time(a) === time(b) ? 0 : time(b) > time(a) ? 1 : -1));
  return { channels: outChannels, items };
}
