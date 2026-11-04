import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DETAIL_PAGES } from '../pages';

// 시안 표 — 제목(h3)·부제(설명 p 의 첫 문장)가 표지 카드의 문구와 정확히 같은가.
// 표지(index.html)의 읽기 전용 백업이 있으면 그것과 대조하고, 없으면 건너뛰며 그 사실을 출력한다.

const COVER = '/Users/gai/personal/works/daeracheon-detail-concepts-deploy.bak-20261104/index.html';

interface Card {
  slug: string;
  no: number;
  title: string;
  description: string;
}

const decode = (v: string) =>
  v
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/** 표지의 `.c` 카드에서 번호·제목·설명·슬러그를 읽는다. */
function readCards(html: string): Card[] {
  const cards: Card[] = [];
  const re =
    /<p class="k">시안 (\d+)[^<]*<\/p><h3>([^<]*)<\/h3><p>([^<]*)<\/p>[\s\S]*?<a href="([a-z0-9_]+)\.html">/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    cards.push({ no: Number(m[1]), title: decode(m[2]), description: decode(m[3]), slug: m[4] });
  }
  return cards;
}

/** 첫 문장: 처음 나오는 `. ! ?` 중 뒤에 공백이나 끝이 오는 것까지. */
function firstSentence(text: string): string {
  const m = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return m ? m[0] : text;
}

describe('시안 표 (pages.ts)', () => {
  it('번호는 1..11 이 한 번씩, 제목과 부제는 비어 있지 않고 겹치지 않는다', () => {
    expect(DETAIL_PAGES.map((p) => p.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(new Set(DETAIL_PAGES.map((p) => p.title)).size).toBe(11);
    expect(new Set(DETAIL_PAGES.map((p) => p.subtitle)).size).toBe(11);
    for (const p of DETAIL_PAGES) {
      expect(p.title.trim()).toBe(p.title);
      expect(p.subtitle.trim()).toBe(p.subtitle);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('부제는 한 문장이다 (끝에만 마침표가 있고 그 뒤에 이어지는 문장이 없다)', () => {
    for (const p of DETAIL_PAGES) {
      expect(firstSentence(p.subtitle), p.slug).toBe(p.subtitle);
    }
  });

  if (!fs.existsSync(COVER)) {
    it('표지 백업이 없어 제목·부제 대조는 건너뜀', () => {
      console.info(`[pages.test] 표지 백업이 없어 대조를 건너뜁니다: ${path.basename(COVER)}`);
      expect(fs.existsSync(COVER)).toBe(false);
    });
    return;
  }

  const cards = readCards(fs.readFileSync(COVER, 'utf-8'));

  it('표지 카드 11장을 모두 읽었다', () => {
    expect(cards).toHaveLength(11);
    expect(cards.map((c) => c.slug)).toEqual(DETAIL_PAGES.map((p) => p.slug));
  });

  it.each(DETAIL_PAGES.map((p) => ({ slug: p.slug })))('$slug: 번호·제목·부제가 표지 카드와 같다', ({ slug }) => {
    const page = DETAIL_PAGES.find((p) => p.slug === slug)!;
    const card = cards.find((c) => c.slug === slug)!;
    expect(page.no).toBe(card.no);
    expect(page.title).toBe(card.title);
    expect(page.subtitle).toBe(firstSentence(card.description));
  });
});
