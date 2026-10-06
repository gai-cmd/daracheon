import { describe, expect, it } from 'vitest';
import { resolveNsVideos } from '../ns-videos';

const FALLBACK = [{ id: 'fb', url: 'https://blob.example/fallback.mp4' }];
const SAVED = [
  { id: 'a', url: 'https://blob.example/a.mp4' },
  { id: 'b', url: 'https://blob.example/b.mp4' },
];

describe('resolveNsVideos — 숨김 스위치', () => {
  it('returns nothing when hidden, even if saved videos have URLs', () => {
    expect(resolveNsVideos(SAVED, true, FALLBACK)).toEqual([]);
  });

  it('returns nothing when hidden and nothing was ever saved (no fallback leak)', () => {
    expect(resolveNsVideos(undefined, true, FALLBACK)).toEqual([]);
    expect(resolveNsVideos([], true, FALLBACK)).toEqual([]);
  });

  it('shows saved videos when hidden is false or unset', () => {
    expect(resolveNsVideos(SAVED, false, FALLBACK)).toEqual(SAVED);
    expect(resolveNsVideos(SAVED, undefined, FALLBACK)).toEqual(SAVED);
  });
});

describe('resolveNsVideos — 저장 목록이 없을 때', () => {
  it('falls back to the code list for undefined, empty and non-array input', () => {
    expect(resolveNsVideos(undefined, undefined, FALLBACK)).toEqual(FALLBACK);
    expect(resolveNsVideos([], false, FALLBACK)).toEqual(FALLBACK);
    expect(resolveNsVideos('x' as unknown as typeof SAVED, false, FALLBACK)).toEqual(FALLBACK);
  });
});

describe('resolveNsVideos — URL 을 비워 저장한 카드', () => {
  it('drops cards whose URL is empty or whitespace (no blank cards)', () => {
    const saved = [
      { id: 'a', url: 'https://blob.example/a.mp4' },
      { id: 'b', url: '' },
      { id: 'c', url: '   ' },
    ];
    expect(resolveNsVideos(saved, false, FALLBACK)).toEqual([saved[0]]);
  });

  it('returns nothing — not the fallback — when every saved URL is empty', () => {
    const saved = [
      { id: 'a', url: '' },
      { id: 'b', url: '' },
    ];
    expect(resolveNsVideos(saved, false, FALLBACK)).toEqual([]);
  });

  it('ignores a card with a missing url field', () => {
    const saved = [{ id: 'a' }, { id: 'b', url: 'https://blob.example/b.mp4' }] as { id: string; url: string }[];
    expect(resolveNsVideos(saved, false, FALLBACK)).toEqual([saved[1]]);
  });
});
