// 코어 레이아웃 영역(core-5-layout) 단위 테스트 — 순서 병합 규칙, 이동, 간격, 배경색, 수집·내보내기, 실제 11개 시안 왕복.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCore } from './load-core';

interface Api {
  init(o?: Record<string, unknown>): { sections: Map<string, { el: Element }>; orphans: { kind: string; k: string }[] };
  collect(): Record<string, unknown[] | undefined> & { layout?: { sequence?: { k: string }[]; gaps?: Record<string, unknown>[]; secbg?: Record<string, unknown>[] } };
  layout: { groups(): { id: string; keys: string[] }[]; sequence(): string[]; risk(): { order: number[]; bgNoEffect: number[] } };
  moveSection(i: string, d: string): boolean;
  setGap(i: string, g: Record<string, number | null>): boolean;
  setSectionBg(i: string, c: string | null): boolean;
  computedGap(i: string): { top: number; bottom: number } | null;
  isChanged(kind: string, key?: string): boolean;
  revert(kind: string, key?: string): boolean;
  setHidden(k: string, b: boolean): boolean;
  setBlockHtml(k: string, h: string): boolean;
  exportHtml(o: { base: string }): string;
}
const PAGE = `<div class="page"><section id="a" style="padding:1px"><h2>Alpha</h2><p>one</p></section>
<section id="b"><h2>Beta</h2><p>two</p></section><hr><section id="c"><h2>Gamma</h2></section><section id="d" style=""><h2>Delta</h2></section></div>
<aside><section id="e"><h2>Eps</h2></section><section id="f"><h2>Zeta</h2></section></aside>`;
function boot(doc: Record<string, unknown> = {}, slug = 'x') {
  const win = loadCore(`<!doctype html><html><head><style>#a{margin:10px 0}</style></head><body>${PAGE}</body></html>`);
  const core = win.DetailEditCore as unknown as Api;
  const reg = core.init({ doc, mode: 'edit', slug, sectionSelector: 'section' });
  const keys = Array.from(reg.sections.keys());
  const ids = () => Array.from(win.document.querySelectorAll('section')).map((s) => s.id).join('');
  return { win, core, reg, keys, ids, html: () => win.document.documentElement.outerHTML };
}
const seq = (...ks: string[]) => ({ layout: { sequence: ks.map((k) => ({ k })) } });

describe('groups / 이동', () => {
  it('부모별 묶음, 가장자리에서 false, 비섹션 노드는 제자리', () => {
    const { core, keys, ids, win } = boot();
    expect(core.layout.groups().map((g) => g.keys)).toEqual([keys.slice(0, 4), keys.slice(4)]);
    expect(core.layout.sequence()).toEqual(keys);
    expect(core.moveSection(keys[0], 'up')).toBe(false);
    expect(core.moveSection(keys[3], 'bottom')).toBe(false);
    expect(core.moveSection(keys[0], 'bottom')).toBe(true);
    expect(ids()).toBe('bcdaef');
    expect(win.document.querySelector('hr')!.previousElementSibling!.id).toBe('c'); // b c 사이가 아니라 원래 슬롯 위치
    expect(core.moveSection(keys[3], 'top')).toBe(true);
    expect(core.moveSection(keys[3], 'down')).toBe(true);
    expect(core.moveSection('nope', 'up')).toBe(false);
    expect(core.moveSection(keys[0], 'sideways')).toBe(false);
  });
  it('이동 후 원래 노드가 그대로(재생성 없음)', () => {
    const { core, keys, reg } = boot();
    const el = reg.sections.get(keys[1])!.el;
    core.moveSection(keys[1], 'top');
    expect(reg.sections.get(keys[1])!.el).toBe(el);
    expect(el.parentNode!.firstElementChild).toBe(el);
  });
  it('묶음이 다른 곳으로는 못 옮긴다', () => {
    const { core, keys, ids } = boot();
    core.moveSection(keys[4], 'down');
    expect(ids()).toBe('abcdfe');
  });
});

describe('sequence 병합 규칙', () => {
  it('전부 나열', () => {
    const { keys, ids } = boot(seq(...[3, 2, 1, 0].map((i) => bootKeys()[i])));
    expect(ids()).toBe('dcbaef');
    void keys;
  });
  it('일부만 나열: 나열 안 된 건 원래 앞쪽 나열 섹션 뒤에', () => {
    const k = bootKeys();
    // 나열: d, a  (b,c 는 a 뒤에 붙는다)
    const { ids } = boot(seq(k[3], k[0]));
    expect(ids()).toBe('dabcef');
    // 나열: b, a  → 원래 앞에 나열된 게 없는 건 맨 앞(없음), c,d 는 b 뒤
    expect(boot(seq(k[1], k[0])).ids()).toBe('bcdaef');
  });
  it('맨 앞의 나열 안 된 섹션은 맨 앞에', () => {
    const k = bootKeys();
    expect(boot(seq(k[3], k[2])).ids()).toBe('abdcef');
  });
  it('없는 키는 고아, 중복은 한 번만, 묶음 간 섞이지 않음', () => {
    const k = bootKeys();
    const { ids, reg, core } = boot(seq('s:zzzz:0', k[2], k[2], k[1], k[5], k[4]));
    expect(ids()).toBe('acdbfe');
    expect(reg.orphans.some((o) => o.kind === 'order' && o.k === 's:zzzz:0')).toBe(true);
    expect(core.collect().layout!.sequence!.map((x) => x.k)).toEqual([k[0], k[2], k[3], k[1], k[5], k[4], 's:zzzz:0']);
  });
  it('c(복제) 항목은 무시', () => {
    const k = bootKeys();
    const { ids } = boot({ layout: { sequence: [{ c: 'c1' }, { k: k[1] }, { k: k[0] }] } });
    expect(ids()).toBe('bcdaef');
  });
});
function bootKeys() { return boot().keys; }

describe('간격 / 배경색', () => {
  it('margin !important 를 주고 null 로 지우면 style 원문 복원(있던 것·없던 것·빈 것)', () => {
    const { core, keys, win } = boot();
    const el = (i: number) => win.document.querySelectorAll('section')[i] as HTMLElement;
    const orig = [0, 1, 3].map((i) => el(i).getAttribute('style'));
    expect(orig).toEqual(['padding:1px', null, '']);
    [0, 1, 3].forEach((i) => expect(core.setGap(keys[i], { top: 24, bottom: 9 })).toBe(true));
    expect(el(0).style.getPropertyPriority('margin-top')).toBe('important');
    expect(el(1).style.marginBottom).toBe('9px');
    expect(core.computedGap(keys[1])).toEqual({ top: 24, bottom: 9 });
    [0, 1, 3].forEach((i) => core.setGap(keys[i], { top: null, bottom: null }));
    expect([0, 1, 3].map((i) => el(i).getAttribute('style'))).toEqual(orig);
  });
  it('한쪽만, 범위 밖 값은 고정, 숫자 아님은 무시', () => {
    const { core, keys, win } = boot();
    core.setGap(keys[1], { top: 999 });
    core.setGap(keys[1], { bottom: -5 });
    core.setGap(keys[1], { bottom: Number.NaN });
    const s = (win.document.querySelectorAll('section')[1] as HTMLElement).style;
    expect([s.marginTop, s.marginBottom]).toEqual(['400px', '0px']);
    core.setGap(keys[1], { top: null });
    expect(core.collect().layout!.gaps).toEqual([{ k: keys[1], top: null, bottom: 0 }]);
    expect(core.setGap('nope', { top: 1 })).toBe(false);
  });
  it('배경색 !important, 잘못된 색은 거부, 간격과 함께 써도 각각 지우면 복원', () => {
    const { core, keys, win } = boot();
    const a = win.document.querySelector('#a') as HTMLElement;
    expect(core.setSectionBg(keys[0], 'red')).toBe(false);
    expect(core.setSectionBg(keys[0], '#AABBCC')).toBe(true);
    core.setGap(keys[0], { top: 5 });
    expect(a.style.getPropertyPriority('background-color')).toBe('important');
    expect(a.style.backgroundColor).toBe('rgb(170, 187, 204)');
    core.setSectionBg(keys[0], null);
    expect(a.style.backgroundColor).toBe('');
    expect(a.style.marginTop).toBe('5px');
    core.setGap(keys[0], { top: null });
    expect(a.getAttribute('style')).toBe('padding:1px');
  });
  it('computedGap 은 CSS 규칙의 margin 을 읽는다', () => {
    const { core, keys } = boot();
    expect(core.computedGap(keys[0])).toEqual({ top: 10, bottom: 10 });
    expect(core.computedGap('nope')).toBeNull();
  });
});

describe('isChanged / revert / collect / init 왕복', () => {
  it('종류별 변경 여부와 되돌리기, 전체 되돌리면 바이트 동일', () => {
    const { core, keys, html } = boot();
    const before = html();
    core.moveSection(keys[0], 'bottom'); core.setGap(keys[2], { top: 3 }); core.setSectionBg(keys[3], '#102030');
    expect(core.isChanged('order', keys[0])).toBe(true);
    expect(core.isChanged('order', keys[4])).toBe(false);
    expect(core.isChanged('gap', keys[2])).toBe(true);
    expect(core.isChanged('secbg', keys[3])).toBe(true);
    expect(core.isChanged('layout')).toBe(true);
    expect(core.revert('order', keys[1])).toBe(true); // 묶음 전체
    expect(core.isChanged('order')).toBe(false);
    expect(core.revert('gap', keys[2])).toBe(true);
    expect(core.revert('secbg', keys[3])).toBe(true);
    expect(core.isChanged('layout')).toBe(false);
    expect(html()).toBe(before);
    core.moveSection(keys[0], 'down'); core.setGap(keys[1], { bottom: 4 });
    core.revert('layout');
    expect(html()).toBe(before);
  });
  it('collect 한 문서를 새 페이지에 init 하면 같은 결과', () => {
    const a = boot();
    a.core.moveSection(a.keys[3], 'top'); a.core.moveSection(a.keys[5], 'up'); a.core.setGap(a.keys[0], { top: 12, bottom: null }); a.core.setSectionBg(a.keys[2], '#0a0b0c');
    const doc = { ...a.core.collect() };
    const b = boot(doc as unknown as Record<string, unknown>);
    expect(b.ids()).toBe(a.ids());
    expect(b.core.collect()).toEqual(a.core.collect());
    expect(a.core.collect().layout!.sequence!.length).toBe(6);
    expect(b.reg.orphans).toEqual([]);
  });
  it('wave-2 문서(layout 없음)는 collect 에 layout 이 없고 동작 그대로', () => {
    const { core, keys, win, ids } = boot({ hidden: [{ k: bootKeys()[1], o: 'x' }] });
    expect(ids()).toBe('abcdef');
    expect(core.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [{ k: keys[1], o: 'Betatwo' }] });
    expect(win.document.querySelectorAll('[data-de-hidden]').length).toBe(1);
    void core.setHidden;
  });
  it('텍스트 편집과 이동이 함께 가고, 숨김 섹션도 옮길 수 있다', () => {
    const { core, keys, ids, win } = boot();
    core.setHidden(keys[1], true);
    core.moveSection(keys[1], 'bottom');
    expect(ids()).toBe('acdbef');
    expect(win.document.querySelector('#b')!.hasAttribute('data-de-hidden')).toBe(true);
  });
  it('exportHtml 은 순서·간격·색을 굽고 흔적을 남기지 않는다', () => {
    const { core, keys } = boot();
    core.moveSection(keys[0], 'bottom'); core.setGap(keys[1], { top: 20 }); core.setSectionBg(keys[1], '#112233');
    const out = core.exportHtml({ base: '' });
    expect(out).not.toMatch(/data-de-|de-slot|<script/);
    expect(out.indexOf('id="b"')).toBeLessThan(out.indexOf('id="a"'));
    expect(out).toMatch(/margin-top:\s*20px\s*!important/);
    expect(out).toMatch(/background-color:\s*(?:#112233|rgb\(17, 34, 51\))\s*!important/);
  });
  it('risk 는 슬러그의 상수를 돌려준다', () => {
    expect(boot({}, 's7_black').core.layout.risk()).toEqual({ order: [0, 1, 3, 4, 6, 7], bgNoEffect: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] });
    expect(boot({}, 's1_gift').core.layout.risk()).toEqual({ order: [], bgNoEffect: [] });
    expect(boot({}, 'zzz').core.layout.risk()).toEqual({ order: [], bgNoEffect: [] });
  });
  it('init 은 빈 doc 에서 DOM 을 바꾸지 않는다', () => {
    const win = loadCore(`<!doctype html><html><head></head><body>${PAGE}</body></html>`);
    const before = win.document.documentElement.outerHTML;
    (win.DetailEditCore as unknown as Api).init({ doc: {}, mode: 'edit', slug: 'x', sectionSelector: 'section' });
    expect(win.document.documentElement.outerHTML).toBe(before);
  });
});

// 실제 11개 시안
const SITE = path.resolve(__dirname, '../../../../.moai/cache/detail-edit/site');
const SLUGS = ['s1_gift', 's2_check', 'c_field', 's4_plum', 's5_field', 's6_plum', 's7_black', 's8_copy', 's9_clean', 's10_gift', 's11_astra'];
describe.runIf(fs.existsSync(SITE))('실제 11개 시안 레이아웃', () => {
  for (const slug of SLUGS) {
    it(`${slug}: 전부 옮기고 간격·색을 준 뒤 되돌리면 바이트 동일, 수집→적용 왕복 동일`, () => {
      const src = fs.readFileSync(path.join(SITE, slug + '.html'), 'utf8');
      const mk = () => { const w = loadCore(src, `https://concepts.example.test/${slug}.html`); return { w, c: w.DetailEditCore as unknown as Api }; };
      const { w, c } = mk();
      const before = w.document.documentElement.outerHTML;
      const reg = c.init({ doc: {}, mode: 'edit' });
      expect(w.document.documentElement.outerHTML).toBe(before);
      expect(c.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [] });
      const keys = Array.from(reg.sections.keys());
      expect(c.layout.groups().reduce((n, g) => n + g.keys.length, 0)).toBe(keys.length);
      c.layout.groups().forEach((g) => { g.keys.forEach(() => c.moveSection(g.keys[0], 'bottom')); });
      keys.forEach((k, i) => { c.setGap(k, { top: i % 5 * 7, bottom: 3 }); c.setSectionBg(k, '#102030'); });
      const doc = c.collect();
      const { w: w2, c: c2 } = mk();
      c2.init({ doc: doc as unknown as Record<string, unknown>, mode: 'view' });
      expect(c2.layout.sequence()).toEqual(c.layout.sequence());
      expect(w2.document.documentElement.outerHTML).toBe(w.document.documentElement.outerHTML);
      c.revert('layout');
      expect(w.document.documentElement.outerHTML).toBe(before);
      expect(c.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [] });
    });
  }
});

describe('배경색 — var() 단축 속성 보존 (s4_plum 회귀)', () => {
  it('style="background:var(--x)" 원문을 지키고 background-color 만 덧붙이며, 되돌리면 원문 그대로', () => {
    const win = loadCore('<!doctype html><html><head><style>:root{--por2:#334455}</style></head><body><div class="page"><section id="p" style="background:var(--por2)"><h2>品</h2></section><section id="q"><h2>Q</h2></section></div></body></html>');
    const core = win.DetailEditCore as unknown as Api;
    const reg = core.init({ doc: {}, mode: 'edit', slug: 'x', sectionSelector: 'section' });
    const k = Array.from(reg.sections.keys())[0];
    const el = win.document.getElementById('p') as Element;
    expect(core.setSectionBg(k, '#112233')).toBe(true);
    const st = el.getAttribute('style') ?? '';
    expect(st).toContain('background:var(--por2)');
    expect(st).toMatch(/background-color:\s*#112233\s*!important/);
    expect(st).not.toMatch(/background-image:\s*;/);
    core.setGap(k, { top: 8 });
    expect(el.getAttribute('style')).toContain('background:var(--por2)');
    expect(el.getAttribute('style')).toMatch(/margin-top:\s*8px\s*!important/);
    expect(core.exportHtml({ base: 'https://example.test/' })).toContain('background:var(--por2)');
    core.setGap(k, { top: null }); core.setSectionBg(k, null);
    expect(el.getAttribute('style')).toBe('background:var(--por2)');
  });
});
