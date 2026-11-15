import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import postcss, { type AcceptedPlugin, type Rule } from 'postcss';

// Next 가 CSS 모듈에 쓰는 것과 같은 플러그인(번들본, 타입 없음). 순수성 검사(mode: 'pure')를 그대로 돌린다.
const localByDefault = createRequire(import.meta.url)('next/dist/compiled/postcss-modules-local-by-default') as (o: { mode: string }) => AcceptedPlugin;

// SPEC-CONSOLE-002 AC-CS2-007 / AC-CS2-008: 콘솔 스크롤바 규칙은 콘솔 루트가 있을 때만 걸리고
// (전역 ::-webkit-scrollbar·html 규칙을 새로 만들지 않음), 고정 hex 만 쓰며, CSS 모듈 순수성 검사를 통과한다.
// console-screen-style.test.ts 와 같은 이유로 src/app/console 밖에 둔다.
const CSS_FILE = path.resolve(__dirname, '../../app/console/console.module.css');
const GLOBALS = path.resolve(__dirname, '../../styles/globals.css');
const css = readFileSync(CSS_FILE, 'utf8');
const root = postcss.parse(css);

const ALLOWED = new Set(['#f2efe8', '#d6d0c4', '#bdb5a6', 'transparent']);

function scrollbarRules(): Rule[] {
  const out: Rule[] = [];
  root.walkRules((r) => {
    const sel = r.selector;
    let hasDecl = false;
    r.walkDecls((d) => {
      if (/^scrollbar-/.test(d.prop)) hasDecl = true;
    });
    if (/scrollbar/.test(sel) || hasDecl) out.push(r);
  });
  return out;
}

describe('console scrollbar (scoped)', () => {
  it('has scrollbar rules', () => {
    expect(scrollbarRules().length).toBeGreaterThanOrEqual(5);
  });

  it('every scrollbar selector is scoped by the console root class (no new global rule)', () => {
    for (const r of scrollbarRules()) {
      for (const sel of r.selectors) {
        expect(sel, sel).toMatch(/\.root\b/);
        // 전역만 있는 ::-webkit-scrollbar 나 html 규칙 금지
        expect(sel.trim(), sel).not.toMatch(/^::-webkit-scrollbar|^:global\(html\)\s*\{|^:global\([^)]*\)$/);
      }
    }
  });

  it('uses only the fixed light palette and no var(--)', () => {
    for (const r of scrollbarRules()) {
      r.walkDecls((d) => {
        expect(d.value, `${r.selector} ${d.prop}`).not.toMatch(/var\(--/);
        if (/color|background/.test(d.prop)) {
          for (const tok of d.value.toLowerCase().match(/#[0-9a-f]{3,8}|transparent/g) ?? []) {
            expect(ALLOWED.has(tok), `${r.selector} ${d.prop}: ${tok}`).toBe(true);
          }
        }
      });
    }
  });

  it('page scrollbar: html while the console root is mounted is thin, thumb #d6d0c4 on #f2efe8', () => {
    const page = scrollbarRules().find((r) => r.selectors.some((x) => x.trim() === ':global(html):has(.root)'));
    expect(page).toBeTruthy();
    const decls: Record<string, string> = {};
    page!.walkDecls((d) => {
      decls[d.prop] = d.value.toLowerCase();
    });
    expect(decls['scrollbar-width']).toBe('thin');
    expect(decls['scrollbar-color']).toBe('#d6d0c4 #f2efe8');
  });

  it('inner scroll areas get scrollbar-width directly (not inherited)', () => {
    const inner = scrollbarRules().find((r) => r.selectors.some((x) => x.trim() === '.root *'));
    expect(inner).toBeTruthy();
    let width = '';
    inner!.walkDecls('scrollbar-width', (d) => {
      width = d.value;
    });
    expect(width).toBe('thin');
  });

  it('defines a hover thumb color #bdb5a6 for ::-webkit-scrollbar browsers', () => {
    const hover = scrollbarRules().filter((r) => /::-webkit-scrollbar-thumb:hover/.test(r.selector));
    expect(hover.length).toBeGreaterThanOrEqual(1);
    for (const r of hover) expect(r.toString().toLowerCase()).toContain('#bdb5a6');
  });

  it('passes the Next CSS-module purity check (mode: pure)', async () => {
    const res = await postcss([localByDefault({ mode: 'pure' })]).process(css, { from: CSS_FILE });
    expect(res.css.length).toBeGreaterThan(0);
  });

  it('leaves the site-wide scrollbar in globals.css unchanged', () => {
    const g = readFileSync(GLOBALS, 'utf8');
    expect(g).toMatch(/scrollbar-color:\s*#d4a843 #14161d/);
  });
});
