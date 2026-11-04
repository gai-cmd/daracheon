// 코어 적용·되돌리기·수집·내보내기(core-3-apply) 단위 테스트 — jsdom 으로 DOM 논리만 본다.
// 실제 11개 시안 NO-OP·왕복(적용 후 되돌리면 바이트 동일)은 C/site 가 있을 때만 돈다(없으면 건너뜀).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCore } from './load-core';

interface Block { el: Element; run: number | null; origHtml: string }
interface Registry { blocks: Map<string, Block>; images: Map<string, unknown>; bgs: Map<string, unknown>; sections: Map<string, unknown>; orphans: { kind: string; k: string; o: string }[] }
interface Collected { texts: Record<string, unknown>[]; images: Record<string, unknown>[]; bgs: Record<string, unknown>[]; hidden: Record<string, unknown>[] }
interface Api {
  init(o?: Record<string, unknown>): Registry;
  registry(): Registry;
  setBlockHtml(k: string, h: string | null): boolean;
  setBlockStyle(k: string, s: { fs?: number | null; color?: string | null }): boolean;
  setImage(k: string, v: { src?: string | null; alt?: string | null } | null): boolean;
  setBg(k: string, u: string | null): boolean;
  setHidden(k: string, b: boolean): boolean;
  revert(kind: string, k: string): boolean;
  isChanged(kind: string, k: string): boolean;
  collect(): Collected;
  exportHtml(o: { base: string }): string;
}

const PAGE = `
<style>.hero{background-image:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.2)),url("/a/bg1.jpg")}.plain{background-image:url(/a/bg2.jpg)}</style>
<div class="page">
<section id="s1"><h1 style="color:#123456">Hello <b>world</b></h1><p class="x">Second paragraph here</p><img class="i" src="/a/p1.jpg" srcset="/a/p1.jpg 1x, /a/p1@2.jpg 2x" sizes="100vw" alt="old alt"></section>
<section id="s2" class="hero"><h2>Hero title</h2><div class="mood" style="background:url(/a/inl.jpg) center/cover;color:red">mood</div></section>
<section id="s3" class="plain"><p>Mixed <b>run</b> one<br><span>x</span></p><div>block <i>a</i><div>inner text</div>tail run</div><img src="/a/p2.jpg"></section>
</div>`;

function boot(doc: Record<string, unknown> = {}, mode = 'edit') {
  const win = loadCore(`<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body>${PAGE}</body></html>`);
  const core = win.DetailEditCore as unknown as Api;
  const reg = core.init({ doc, mode, slug: 'x', sectionSelector: '.page > section' });
  return { win, core, reg, html: () => win.document.documentElement.outerHTML };
}
const keyOf = (reg: Registry, text: string) => Array.from(reg.blocks.entries()).find(([, b]) => b.el.textContent?.includes(text))![0];
const keyByRun = (reg: Registry, text: string, run: number) =>
  Array.from(reg.blocks.entries()).find(([, b]) => b.run === run && b.el.textContent?.includes(text))![0];

describe('setBlockHtml / setBlockStyle', () => {
  it('html 을 정제해 넣고 되돌리면 바이트 동일', () => {
    const { core, reg, html } = boot();
    const before = html(), k = keyOf(reg, 'Second paragraph');
    expect(core.setBlockHtml(k, 'New <script>alert(1)</script><b onclick="x">bold</b>')).toBe(true);
    expect(html()).toContain('New <b>bold</b>');
    expect(html()).not.toContain('script>alert');
    expect(core.isChanged('text', k)).toBe(true);
    core.revert('text', k);
    expect(html()).toBe(before);
    expect(core.isChanged('text', k)).toBe(false);
  });
  it('원본과 같은 html 은 변경이 아니다', () => {
    const { core, reg } = boot();
    const k = keyOf(reg, 'Second paragraph');
    core.setBlockHtml(k, reg.blocks.get(k)!.origHtml);
    expect(core.isChanged('text', k)).toBe(false);
    expect(core.collect().texts).toEqual([]);
  });
  it('fs/color: 원래 style 속성 문자열(없음 포함)을 정확히 복원', () => {
    const { core, reg, html } = boot();
    const before = html(), kp = keyOf(reg, 'Second paragraph'), kh = keyOf(reg, 'Hello');
    expect(core.setBlockStyle(kp, { fs: 28, color: '#aa3322' })).toBe(true);
    expect(html()).toContain('font-size: 28px');
    expect(core.setBlockStyle(kh, { fs: 40 })).toBe(true);
    expect(html()).toContain('color: rgb(18, 52, 86)'); // 원래 인라인 색을 지키며 크기를 더한다
    core.setBlockStyle(kp, { fs: null });
    expect(core.collect().texts.find((t) => t.k === kp)).toMatchObject({ color: '#aa3322' });
    core.revert('text', kp); core.revert('text', kh);
    expect(html()).toBe(before);
    expect(html()).toContain('<h1 style="color:#123456">');
  });
  it('잘못된 fs/color 는 거부하고 아무것도 바꾸지 않는다', () => {
    const { core, reg, html } = boot();
    const before = html(), k = keyOf(reg, 'Second paragraph');
    expect(core.setBlockStyle(k, { fs: 9 })).toBe(false);
    expect(core.setBlockStyle(k, { fs: 201 })).toBe(false);
    expect(core.setBlockStyle(k, { fs: 12.5 })).toBe(false);
    expect(core.setBlockStyle(k, { color: 'red' })).toBe(false);
    expect(core.setBlockStyle(k, { color: '#12345' })).toBe(false);
    expect(html()).toBe(before);
  });
  it('혼합 루트 run: 글 마디만 바꾸고 스타일은 span 으로 감싸 얻으며 되돌리면 동일', () => {
    const { core, reg, html } = boot();
    const before = html(), k = keyByRun(reg, 'tail run', 1);
    core.setBlockHtml(k, 'changed <em>tail</em>');
    expect(html()).toContain('<div>inner text</div>changed <em>tail</em>');
    core.setBlockStyle(k, { fs: 20, color: '#000000' });
    expect(html()).toContain('data-de-run');
    core.setBlockHtml(k, '');
    expect(core.collect().texts[0]).toMatchObject({ k, html: '', run: 1 });
    core.revert('text', k);
    expect(html()).toBe(before);
  });
});

describe('setImage', () => {
  it('src 는 srcset/sizes 를 지우고 alt 는 따로, 되돌리면 속성 순서까지 동일', () => {
    const { core, reg, html } = boot();
    const before = html(), k = Array.from(reg.images.keys())[0];
    core.setImage(k, { src: 'https://x.test/n.jpg', alt: 'new' });
    expect(html()).toContain('src="https://x.test/n.jpg"');
    expect(html()).not.toContain('srcset="/a/p1.jpg');
    expect(html()).toContain('alt="new"');
    core.setImage(k, { src: null });
    expect(html()).toContain('srcset="/a/p1.jpg 1x');
    expect(html()).toContain('alt="new"');
    core.revert('image', k);
    expect(html()).toBe(before);
  });
  it('alt 속성이 없던 이미지에 alt 를 주고 되돌리면 속성이 다시 없다', () => {
    const { core, reg, html } = boot();
    const before = html(), k = Array.from(reg.images.keys())[1];
    core.setImage(k, { alt: 'a' });
    expect(html()).toContain('<img src="/a/p2.jpg" alt="a">');
    core.setImage(k, null);
    expect(html()).toBe(before);
  });
  it('javascript:/data: 주소는 거부', () => {
    const { core, reg, html } = boot();
    const before = html(), k = Array.from(reg.images.keys())[0];
    expect(core.setImage(k, { src: 'javascript:alert(1)' })).toBe(false);
    expect(core.setImage(k, { src: 'data:text/html,x' })).toBe(false);
    expect(html()).toBe(before);
  });
});

describe('setBg', () => {
  it('겹겹이 배경에서 url 층만 바꾸고 그라데이션은 지킨다, 되돌리면 style 속성 동일', () => {
    const { core, reg, html } = boot();
    const before = html(), entries = Array.from(reg.bgs.entries()) as [string, { origUrl: string }][];
    const hero = entries.find(([, e]) => e.origUrl.endsWith('/a/bg1.jpg'))!;
    expect(core.setBg(hero[0], 'https://x.test/new.jpg')).toBe(true);
    const s = html();
    expect(s).toContain('url(&quot;https://x.test/new.jpg&quot;)');
    expect(s).toMatch(/background-image: linear-gradient\(/);
    expect(core.isChanged('bg', hero[0])).toBe(true);
    core.revert('bg', hero[0]);
    expect(html()).toBe(before);
  });
  it('인라인 배경(div.mood)은 원래 style 문자열을 정확히 복원', () => {
    const { core, reg, html } = boot();
    const before = html(), entries = Array.from(reg.bgs.entries()) as [string, { origUrl: string }][];
    const mood = entries.find(([, e]) => e.origUrl.endsWith('/a/inl.jpg'))!;
    core.setBg(mood[0], 'https://x.test/m.jpg');
    expect(html()).toContain('color:red');
    core.setBg(mood[0], null);
    expect(html()).toBe(before);
    expect(html()).toContain('style="background:url(/a/inl.jpg) center/cover;color:red"');
  });
});

describe('setHidden', () => {
  it('data-de-hidden + 하나의 de-style, 모두 풀면 style 도 사라져 동일', () => {
    const { core, reg, win, html } = boot();
    const before = html(), keys = Array.from(reg.sections.keys());
    core.setHidden(keys[0], true); core.setHidden(keys[1], true);
    expect(win.document.querySelectorAll('style#de-style').length).toBe(1);
    expect(win.document.getElementById('de-style')!.textContent).toBe('[data-de-hidden]{display:none !important}');
    expect(win.document.querySelectorAll('[data-de-hidden]').length).toBe(2);
    core.revert('hidden', keys[0]);
    expect(win.document.getElementById('de-style')).not.toBeNull();
    core.setHidden(keys[1], false);
    expect(html()).toBe(before);
  });
});

describe('collect / orphans / init 적용', () => {
  it('바뀐 항목만 모으고 고아는 그대로 싣는다', () => {
    const first = boot();
    const doc = {
      texts: [{ k: 't:zzzz:0', o: 'gone', html: 'orphan <b>x</b>', fs: 30 }],
      images: [{ k: 'i:zzzz:0', o: '/old.jpg', src: 'https://x.test/o.jpg' }],
      bgs: [], hidden: [{ k: 's:zzzz:0', o: 'old section' }],
    };
    const { core, reg } = boot(doc);
    expect(reg.orphans.map((o) => o.k).sort()).toEqual(['i:zzzz:0', 's:zzzz:0', 't:zzzz:0']);
    expect(core.collect()).toEqual({ texts: doc.texts, images: doc.images, bgs: [], hidden: doc.hidden });
    const kt = keyOf(reg, 'Second paragraph'), ks = Array.from(reg.sections.keys())[2];
    core.setBlockHtml(kt, 'x'); core.setHidden(ks, true);
    const c = core.collect();
    expect(c.texts.map((t) => t.k)).toEqual([kt, 't:zzzz:0']);
    expect(c.hidden.map((t) => t.k)).toEqual([ks, 's:zzzz:0']);
    expect(first.core.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [] });
  });
  it('doc 를 init 에서 적용하고, 다시 collect 하면 같은 항목이 나온다(왕복)', () => {
    const a = boot();
    const kt = keyOf(a.reg, 'Second paragraph'), ki = Array.from(a.reg.images.keys())[0];
    const kb = (Array.from(a.reg.bgs.entries()) as [string, { origUrl: string }][]).find(([, e]) => e.origUrl.endsWith('bg1.jpg'))![0];
    const ks = Array.from(a.reg.sections.keys())[1];
    a.core.setBlockHtml(kt, 'hi <b>there</b>'); a.core.setBlockStyle(kt, { fs: 22, color: '#112233' });
    a.core.setImage(ki, { src: 'https://x.test/1.jpg', alt: 'A' }); a.core.setBg(kb, 'https://x.test/b.jpg'); a.core.setHidden(ks, true);
    const doc = a.core.collect();
    const b = boot(doc as unknown as Record<string, unknown>);
    expect(b.core.collect()).toEqual(doc);
    expect(b.html()).toBe(a.html());
  });
  it('init 은 한 번만 적용(두 번째 호출은 같은 레지스트리)', () => {
    const { core, reg } = boot();
    expect(core.init({ doc: { hidden: [{ k: Array.from(reg.sections.keys())[0] }] } })).toBe(reg);
    expect(core.collect().hidden).toEqual([]);
  });
});

describe('exportHtml', () => {
  it('독립 HTML: doctype·base 있음, 숨긴 섹션·스크립트·편집 흔적 없음', () => {
    const { core, reg, win } = boot();
    const d = win.document;
    d.head.insertAdjacentHTML('afterbegin', '<!--de:begin--><style id="de-hide">html{visibility:hidden}</style><script>1</script><!--de:end-->');
    d.body.insertAdjacentHTML('beforeend', '<div id="de-root">ui</div><script src="x.js"></script>');
    const keys = Array.from(reg.sections.keys());
    core.setHidden(keys[1], true);
    core.setBlockHtml(keyOf(reg, 'Second paragraph'), 'edited');
    core.setBlockStyle(keyByRun(reg, 'tail run', 1), { fs: 20 });
    const out = core.exportHtml({ base: 'https://concepts.example.test/' });
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<base href="https://concepts.example.test/">');
    expect(out).toContain('edited');
    expect(out).not.toContain('Hero title');
    expect(out).not.toMatch(/data-de-|<script|de-style|de-hide|de-root|de:begin|data-de-run/);
    expect(out).toContain('<span style="font-size: 20px;">');
    // 현재 DOM 은 건드리지 않는다
    expect(d.querySelectorAll('[data-de-hidden]').length).toBe(1);
  });
  it('base 가 없거나 위험하면 base 를 넣지 않는다', () => {
    const { core } = boot();
    expect(core.exportHtml({ base: '' })).not.toContain('<base');
    expect(core.exportHtml({ base: 'javascript:alert(1)' })).not.toContain('<base');
  });
});

// 실제 11개 시안 — C/site 가 있을 때만(캐시는 gitignore)
const SITE = path.resolve(__dirname, '../../../../.moai/cache/detail-edit/site');
const SLUGS = ['s1_gift', 's2_check', 'c_field', 's4_plum', 's5_field', 's6_plum', 's7_black', 's8_copy', 's9_clean', 's10_gift', 's11_astra'];
const STATS = path.resolve(__dirname, '../../../../.moai/cache/detail-edit/analysis/core-stats.json');
const real = fs.existsSync(SITE);
const applyStats: Record<string, unknown> = {};

describe.runIf(real)('실제 11개 시안', () => {
  for (const slug of SLUGS) {
    it(`${slug}: 빈 doc init 은 NO-OP, 전부 적용 후 되돌리면 바이트 동일`, () => {
      const src = fs.readFileSync(path.join(SITE, slug + '.html'), 'utf8');
      const win = loadCore(src, `https://concepts.example.test/${slug}.html`);
      const core = win.DetailEditCore as unknown as Api;
      const before = win.document.documentElement.outerHTML;
      const reg = core.init({ doc: {}, mode: 'edit' });
      expect(win.document.documentElement.outerHTML).toBe(before);
      expect(core.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [] });

      let n = 0;
      reg.blocks.forEach((_b, k) => { core.setBlockHtml(k, 'X<b>y</b>'); core.setBlockStyle(k, { fs: 33, color: '#445566' }); n++; });
      reg.images.forEach((_e, k) => { core.setImage(k, { src: 'https://x.test/i.jpg', alt: 'zz' }); });
      reg.bgs.forEach((_e, k) => { core.setBg(k, 'https://x.test/b.jpg'); });
      reg.sections.forEach((_e, k) => { core.setHidden(k, true); });
      const c = core.collect();
      expect(c.texts.length).toBe(reg.blocks.size);
      expect(c.images.length).toBe(reg.images.size);
      expect(c.hidden.length).toBe(reg.sections.size);
      expect(win.document.documentElement.outerHTML).not.toBe(before);
      const exported = core.exportHtml({ base: 'https://concepts.example.test/' });
      expect(exported).not.toMatch(/data-de-|<script/);

      reg.blocks.forEach((_b, k) => { core.revert('text', k); });
      reg.images.forEach((_e, k) => { core.revert('image', k); });
      reg.bgs.forEach((_e, k) => { core.revert('bg', k); });
      reg.sections.forEach((_e, k) => { core.revert('hidden', k); });
      expect(win.document.documentElement.outerHTML).toBe(before);
      expect(core.collect()).toEqual({ texts: [], images: [], bgs: [], hidden: [] });
      applyStats[slug] = { blocks: n, images: reg.images.size, bgs: reg.bgs.size, sections: reg.sections.size, noop: true, roundTripIdentical: true, exportBytes: exported.length };
    });
  }
  it('통계를 core-stats.json 에 덧붙인다(WRITE_CORE_STATS=1 일 때만)', () => {
    if (process.env.WRITE_CORE_STATS !== '1') return;
    const j = fs.existsSync(STATS) ? JSON.parse(fs.readFileSync(STATS, 'utf8')) : {};
    j.apply = { date: new Date().toISOString(), pages: applyStats };
    fs.writeFileSync(STATS, JSON.stringify(j, null, 2));
  });
});
