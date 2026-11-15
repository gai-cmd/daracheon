import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ConsoleChannel, FeedResponse } from '@/lib/console/types';
import { AccountMenuBody } from '../AccountMenu';
import { ChannelsDialog } from '../AdminDialogs';
import HomeView from '../HomeView';
import { ADMIN, MEMBER, makeApp, makeFeed, makeItem, renderWith } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-038(홈 채널 새 소식), AC-CS2-036(링크 타일), AC-CS2-031(채널 편집기 렌더),
// AC-CS2-039(접근 가능한 이름). 정적 렌더만 — 네트워크 요청 없음. 지어낸 값만 쓴다.

const THUMB = '/api/console/feed/thumb?u=';

const home = (opts: { lang?: 'ko' | 'en'; feed?: FeedResponse | 'loading' | 'error'; admin?: boolean; recentOpen?: boolean } = {}) => {
  const me = opts.admin ? ADMIN : MEMBER;
  const items = Array.from({ length: 8 }, (_, i) => makeItem({ id: `r${i}`, title: `카드 ${i}`, updatedAt: new Date(Date.UTC(2026, 10, i + 1)).toISOString() }));
  return renderWith(createElement(HomeView, { feed: opts.feed ?? makeFeed(), recentOpen: opts.recentOpen, onManageChannels: () => {} }), {
    app: makeApp(me, items),
    lang: opts.lang ?? 'ko',
  });
};

const section = (html: string) => {
  const i = html.indexOf('aria-labelledby="h-feed"');
  return html.slice(html.lastIndexOf('<section', i), html.indexOf('</section>', i));
};
const tiles = (html: string) => [...section(html).matchAll(/<a[^>]*data-tile="(post|link)"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);

describe('홈 채널 새 소식 (AC-CS2-038)', () => {
  it('제목이 채널 새 소식 / Channel updates 이고 예전 "최근 수정된 항목" 구역 제목은 없다', () => {
    expect(section(home())).toMatch(/<h2 id="h-feed">채널 새 소식<\/h2>/);
    expect(section(home({ lang: 'en' }))).toMatch(/<h2 id="h-feed">Channel updates<\/h2>/);
    expect(home()).not.toContain('최근 수정된 항목');
    expect(home({ lang: 'en' })).not.toContain('Recently updated<');
  });

  it('칩은 radiogroup 하나에 전체 + 채널 3개, 전체에서 타일 12개가 최신순', () => {
    const html = section(home());
    const groups = [...html.matchAll(/role="radiogroup"[^>]*aria-label="채널"/g)];
    expect(groups).toHaveLength(1);
    const radios = [...html.matchAll(/role="radio"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    expect(radios).toEqual(['전체', '지어낸 영상', '지어낸 블로그', '자사 블로그']);
    const t = tiles(html);
    expect(t).toHaveLength(12);
    expect(t.map((x) => x.match(/글 (\d\d)/)![1])).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
    expect(section(home({ lang: 'en' }))).toMatch(/role="radiogroup"[^>]*aria-label="Channels"/);
  });

  it('타일: 썸네일 경로 그림 또는 기본 상자, 채널 색 배지, 제목, 날짜, 새 탭 링크', () => {
    for (const t of tiles(home())) {
      expect(t).toContain('target="_blank"');
      expect(t).toContain('rel="noopener noreferrer"');
      const imgs = [...t.matchAll(/<img[^>]*src="([^"]*)"/g)].map((m) => m[1]);
      for (const src of imgs) expect(src.replace(/&amp;/g, '&').startsWith(THUMB)).toBe(true);
      if (!imgs.length) expect(t).toMatch(/data-thumb="none"/);
      expect(t).toMatch(/<span[^>]*style="background:#[0-9a-f]{6};color:#[0-9a-f]{6}"[^>]*>[^<]+<\/span>/);
      expect(t).toMatch(/<time[^>]*datetime="2026-11-1/i);
    }
    const first = tiles(home())[0];
    expect(first).toContain('background:#c4302b');
    expect(first).toContain('지어낸 영상');
    expect(first).toContain('href="https://example.com/p/0"');
    expect(tiles(home())[2]).toContain('href="/blog/fake-2"');
  });

  it('영어 화면은 영문 채널 이름, 비면 한국어 이름', () => {
    const html = section(home({ lang: 'en' }));
    expect(html).toContain('Made-up videos');
    expect(html).toContain('자사 블로그');
  });

  it('CSS: 그림 16:9, 제목 두 줄 자르기, 좁은 폭 두 열, 칩 줄만 가로 스크롤', () => {
    const css = readFileSync(path.resolve(__dirname, '../console.module.css'), 'utf8');
    const rule = (sel: string) => css.match(new RegExp(`\\${sel}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.tileImg')).toMatch(/aspect-ratio:\s*16\s*\/\s*9/);
    expect(rule('.tileT')).toMatch(/-webkit-line-clamp:\s*2/);
    expect(rule('.feedChips')).toMatch(/overflow-x:\s*auto/);
    expect(css).toMatch(/\.tiles\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  it('불러오는 중에는 높이가 정해진 자리 표시, 켜진 채널이 없으면 안내와 (관리자만) 채널 관리', () => {
    const loading = section(home({ feed: 'loading' }));
    expect(loading).toMatch(/class="[^"]*feedSkel[^"]*"[^>]*aria-busy="true"/);
    const css = readFileSync(path.resolve(__dirname, '../console.module.css'), 'utf8');
    expect(css).toMatch(/\.feedSkel\s*\{[^}]*min-height:\s*\d+px/);
    const empty: FeedResponse = { channels: [], items: [] };
    expect(section(home({ feed: empty }))).toContain('아직 연결한 채널이 없어요.');
    expect(section(home({ feed: empty, lang: 'en' }))).toContain('No channels connected yet.');
    expect(section(home({ feed: empty, admin: true }))).toMatch(/<button[^>]*>채널 관리<\/button>/);
    expect(section(home({ feed: empty }))).not.toContain('채널 관리');
    expect(section(home({ feed: 'error' }))).toContain('다시 시도');
  });

  it('"최근 수정한 카드 보기" 는 처음 닫혀 있고 펼치면 보기 전환과 최근 수정 6개', () => {
    expect(section(home())).toMatch(/aria-expanded="false"[^>]*>(?:<[^>]+>)*최근 수정한 카드 보기/);
    const open = section(home({ recentOpen: true }));
    expect(open).toMatch(/aria-expanded="true"/);
    expect(open).toMatch(/role="radiogroup"[^>]*aria-label="보기 방식"/);
    expect(open.match(/data-id="r\d"/g)).toHaveLength(6);
  });
});

describe('링크 타일 (AC-CS2-036)', () => {
  const feed = (): FeedResponse => {
    const f = makeFeed();
    f.channels.push(
      { id: 'ch-ig', label: '인스타', label_en: 'Insta', color: '#d62976', kind: 'instagram', home: 'https://example.org/fakeprofile', ok: true },
      { id: 'ch-x', label: '멈춘 피드', label_en: 'Stuck feed', color: '#335577', kind: 'rss', home: 'https://example.com', ok: false, error: 'timeout' }
    );
    return f;
  };
  it('인스타그램과 실패한 채널마다 링크 타일 하나', () => {
    for (const lang of ['ko', 'en'] as const) {
      const links = tiles(home({ feed: feed(), lang })).filter((t) => t.includes('data-tile="link"'));
      expect(links).toHaveLength(2);
      expect(links[0]).toContain('href="https://example.org/fakeprofile"');
      expect(links[0]).toContain(lang === 'ko' ? '인스타그램에서 보기' : 'View on Instagram');
      expect(links[1]).toContain('href="https://example.com"');
      expect(links[1]).toContain(lang === 'ko' ? '멈춘 피드에서 보기' : 'View on Stuck feed');
      for (const l of links) {
        expect(l).toContain('target="_blank"');
        expect(l).toContain('rel="noopener noreferrer"');
        expect(l).toMatch(/style="background:#[0-9a-f]{6};color:#[0-9a-f]{6}"/);
      }
    }
  });

  it('모든 채널이 실패해도 구역은 남고 링크 타일만 보인다', () => {
    const f = feed();
    const allFail: FeedResponse = { channels: f.channels.map((c) => ({ ...c, ok: false, error: 'network' })), items: [] };
    const t = tiles(home({ feed: allFail }));
    expect(t.length).toBe(5);
    expect(t.every((x) => x.includes('data-tile="link"'))).toBe(true);
  });
});

describe('채널 편집기 (AC-CS2-031, AC-CS2-039)', () => {
  const initial: ConsoleChannel[] = [
    { id: 'ch-1', label: '영상', label_en: 'Videos', kind: 'youtube', source: 'UCfake000000000000000001', color: '#c4302b', enabled: true, order: 0 },
    { id: 'ch-2', label: '블로그', label_en: '', kind: 'zoellife-blog', source: '', color: '#1f6f5c', enabled: false, order: 1 },
  ];
  const dialog = (lang: 'ko' | 'en' = 'ko') =>
    renderWith(createElement(ChannelsDialog, { initial, onClose: () => {}, onSaved: () => {} }), { me: ADMIN, lang });

  it('행마다 종류·이름·영문 이름·출처·색·켜기·위아래·삭제가 있고, 아이콘 버튼에 이름이 있다', () => {
    const html = dialog();
    expect(html.match(/<select[^>]*aria-label="1 · 종류"/g)).toHaveLength(1);
    for (const n of [1, 2]) {
      expect(html).toMatch(new RegExp(`<select[^>]*aria-label="${n} · 종류"`));
      expect(html).toMatch(new RegExp(`<input[^>]*aria-label="${n} · 이름"`));
      expect(html).toMatch(new RegExp(`<input[^>]*aria-label="${n} · 영문 이름"`));
      expect(html).toMatch(new RegExp(`<input[^>]*type="color"[^>]*aria-label="${n} · 색"`));
      expect(html).toMatch(new RegExp(`<input[^>]*type="checkbox"[^>]*aria-label="${n} · 켜기"`));
      for (const b of ['앞으로', '뒤로', '삭제']) expect(html).toMatch(new RegExp(`<button[^>]*aria-label="${b} · ${n}"`));
    }
    // 자사 블로그 행은 출처 칸이 없다
    expect(html).toMatch(/<input[^>]*aria-label="1 · 출처"[^>]*placeholder="UC로 시작하는 채널 ID"/);
    expect(html).not.toMatch(/aria-label="2 · 출처"/);
    expect(dialog('en')).toMatch(/aria-label="1 · Kind"/);
  });

  it('계정 메뉴의 관리자 도구에 채널 관리 / Channels, 멤버에는 없다', () => {
    const body = (me: typeof ADMIN, lang: 'ko' | 'en' = 'ko') =>
      renderWith(createElement(AccountMenuBody, { onLang: () => {}, onAdmin: () => {}, onSignOut: () => {}, close: () => {} }), { me, lang });
    expect(body(ADMIN)).toContain('채널 관리');
    expect(body(ADMIN, 'en')).toContain('>Channels<');
    expect(body(MEMBER)).not.toContain('채널 관리');
  });
});
