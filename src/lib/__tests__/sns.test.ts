import { describe, expect, it } from 'vitest';
import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '../sns';

describe('cleanVideoTitle', () => {
  it('drops trailing MD glued to Korean text', () => {
    expect(cleanVideoTitle('왜 침향나무는 20년을 기다려야 할까MD')).toBe('왜 침향나무는 20년을 기다려야 할까');
    expect(cleanVideoTitle('가짜 침향에 속지 마세요! 검다고 다 진짜가 아닙니다MD')).toBe(
      '가짜 침향에 속지 마세요! 검다고 다 진짜가 아닙니다',
    );
  });

  it('keeps MD when it is a real word', () => {
    expect(cleanVideoTitle('Meet our MD')).toBe('Meet our MD');
  });

  it('strips hashtags and collapses whitespace', () => {
    expect(
      cleanVideoTitle('How Does a Normal Tree Become Resin-Rich Agarwood?   #대라천 #아갈로차 #침향'),
    ).toBe('How Does a Normal Tree Become Resin-Rich Agarwood?');
  });

  it('leaves normal titles alone', () => {
    expect(cleanVideoTitle('이 작은 씨앗이 향이 되기까지 | 조엘라이프 대라천 참침향')).toBe(
      '이 작은 씨앗이 향이 되기까지 | 조엘라이프 대라천 참침향',
    );
  });
});

describe('formatSnsDate', () => {
  it('formats ISO dates with dots', () => {
    expect(formatSnsDate('2026-09-09T12:00:00+00:00')).toBe('2026.09.09');
    expect(formatSnsDate('')).toBe('');
  });
});

describe('koreanVideosOnly', () => {
  it('drops videos whose title has no Hangul outside hashtags', () => {
    const v = (id: string, title: string) => ({ id, title, publishedAt: '2026-09-09', thumbnail: '' });
    const out = koreanVideosOnly({
      youtube: {
        name: 'Z', handle: '@z', url: '',
        videos: [v('a', 'How Does a Tree Become Agarwood? #대라천 #침향'), v('b', '왜 침향나무는 20년을 기다려야 할까MD')],
      },
      instagram: { name: 'I', handle: '@i', url: '', posts: [] },
    });
    expect(out.youtube.videos.map((x) => x.id)).toEqual(['b']);
  });
});
