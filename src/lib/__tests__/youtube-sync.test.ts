import { describe, expect, it, vi } from 'vitest';
import { mergeVideos, syncYoutube, videoIdFromUrl, type StoredVideo, type SyncDeps, type YoutubeStore } from '../youtube-sync';

const entry = (id: string, title: string, date: string) =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/><published>${date}</published></entry>`;
const feed = (...entries: string[]) => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;

function deps(over: Partial<SyncDeps> & { store?: YoutubeStore | null } = {}) {
  let saved: YoutubeStore | null = over.store ?? null;
  const d: SyncDeps = {
    fetchFeed: async () => feed(entry('aaaaaaaaaaa', '침향 영상', '2026-11-19T01:00:00+00:00'), entry('bbbbbbbbbbb', 'English only', '2026-11-18T01:00:00+00:00')),
    copyThumb: async (id) => `https://blob.example/uploads/youtube/yt-${id}.jpg`,
    read: async () => saved,
    write: async (s) => {
      saved = s;
    },
    now: () => '2026-11-19T00:00:00.000Z',
    ...over,
  };
  return { d, saved: () => saved };
}

describe('videoIdFromUrl', () => {
  it('watch·shorts 주소에서 ID 를 뽑고 잘못된 값은 null', () => {
    expect(videoIdFromUrl('https://www.youtube.com/watch?v=7ZOtzYmMvcM')).toBe('7ZOtzYmMvcM');
    expect(videoIdFromUrl('https://www.youtube.com/shorts/-nmj_zZwIS0')).toBe('-nmj_zZwIS0');
    expect(videoIdFromUrl('not a url')).toBeNull();
  });
});

describe('mergeVideos', () => {
  it('기존 썸네일을 유지하고 최신순으로 정렬한다', () => {
    const old: StoredVideo = { id: 'a', title: '옛 제목', publishedAt: '2026-01-01', thumbnail: 'T', handle: 'h' };
    const out = mergeVideos([old], [
      { ...old, title: '새 제목', thumbnail: '' },
      { id: 'b', title: '새 영상', publishedAt: '2026-02-01', thumbnail: 'U', handle: 'h' },
    ]);
    expect(out.map((v) => v.id)).toEqual(['b', 'a']);
    expect(out[1]).toMatchObject({ title: '새 제목', thumbnail: 'T' });
  });
});

describe('syncYoutube', () => {
  it('한글 제목 새 영상만 썸네일을 복사해 쌓는다 (두 채널 같은 영상은 한 번)', async () => {
    const copyThumb = vi.fn(async (id: string) => `https://blob.example/yt-${id}.jpg`);
    const { d, saved } = deps({ copyThumb });
    const r = await syncYoutube(d);
    expect(r).toMatchObject({ ok: true, added: 1, total: 1 });
    expect(copyThumb).toHaveBeenCalledTimes(1);
    expect(saved()?.videos[0]).toMatchObject({ id: 'aaaaaaaaaaa', handle: '@ZoelLife_official_00' });
  });

  it('이미 있는 영상은 썸네일을 다시 받지 않는다', async () => {
    const copyThumb = vi.fn(async () => 'x');
    const store = { syncedAt: '', videos: [{ id: 'aaaaaaaaaaa', title: '침향 영상', publishedAt: '', thumbnail: 'T', handle: 'h' }] };
    const { d, saved } = deps({ copyThumb, store });
    const r = await syncYoutube(d);
    expect(copyThumb).not.toHaveBeenCalled();
    expect(r.added).toBe(0);
    expect(saved()?.videos[0].thumbnail).toBe('T');
  });

  it('썸네일 복사 실패 영상은 싣지 않고, 피드가 모두 실패하면 쓰지 않는다', async () => {
    const write = vi.fn(async () => {});
    const r1 = await syncYoutube(deps({ copyThumb: async () => null, write }).d);
    expect(r1).toMatchObject({ added: 0, skippedThumbs: 2 });
    write.mockClear();
    const r2 = await syncYoutube(deps({ fetchFeed: async () => null, write }).d);
    expect(r2.ok).toBe(false);
    expect(r2.failedChannels).toHaveLength(2);
    expect(write).not.toHaveBeenCalled();
  });
});
