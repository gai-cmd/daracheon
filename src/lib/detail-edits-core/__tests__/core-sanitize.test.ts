import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALLOWED_TAGS as SERVER_TAGS, sanitizeDetailHtml } from '../../detail-edits/sanitize';
import { loadCore } from './load-core';

// 클라이언트 코어(public/detail-edit/apply.js)의 sanitize 영역 검증.
//  1) 공유 벡터(sanitize-vectors.json) 전부 — 서버 sanitize.test.ts 가 같은 파일을 같은 기대값으로 돌린다.
//  2) 서버 정제기와의 차분(differential) 점검 — 시드가 고정된 무작위 입력으로 두 구현의 출력이 같은지 본다.
//  3) 출력 구조 불변식 — 어떤 입력이든 결과는 허용 태그·허용 속성만 가진다.

interface Vector {
  name: string;
  in: string;
  out: string;
}

const VECTORS_PATH = path.resolve(__dirname, 'sanitize-vectors.json');
const vectors = JSON.parse(fs.readFileSync(VECTORS_PATH, 'utf-8')) as Vector[];

const win = loadCore();
const core = win.DetailEditCore;
const sanitize = (html: unknown): string => core.sanitize(html);

const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'small', 'mark', 'sup', 'sub', 'br', 'span', 'a', 'code', 'abbr', 'q']);
const ALLOWED_ATTRS = new Set(['class', 'style', 'href', 'target', 'rel']);

/** 결과 문자열이 허용 목록 밖의 태그·속성을 하나도 갖지 않는지 검사하고, 위반 목록을 돌려준다. */
function violations(html: string): string[] {
  const doc = new win.DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html');
  const out: string[] = [];
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    const tag = el.localName;
    if (!ALLOWED_TAGS.has(tag)) out.push(`tag <${tag}>`);
    for (const attr of Array.from(el.attributes)) {
      if (!ALLOWED_ATTRS.has(attr.name)) out.push(`attr ${tag}[${attr.name}]`);
      else if (tag !== 'a' && ['href', 'target', 'rel'].includes(attr.name)) out.push(`attr ${tag}[${attr.name}]`);
    }
    if (tag === 'a') {
      if (el.getAttribute('rel') !== 'noopener noreferrer') out.push('anchor without forced rel');
      const href = el.getAttribute('href');
      if (href !== null && !/^(?:https?:|mailto:|tel:)/i.test(href)) out.push(`href ${href}`);
    }
    const style = el.getAttribute('style');
    if (style !== null && /url\s*\(|expression|javascript:|@import|\\/i.test(style)) out.push(`style ${style}`);
  }
  return out;
}

describe('window.DetailEditCore (sanitize 영역)', () => {
  it('apply.js 를 두 번 실행해도 먼저 만든 코어를 덮어쓰지 않는다', () => {
    const before = win.DetailEditCore;
    win.eval(fs.readFileSync(path.resolve(__dirname, '../../../../public/detail-edit/apply.js'), 'utf8'));
    expect(win.DetailEditCore).toBe(before);
    expect(core.version).toBe('1');
    expect(typeof core.sanitize).toBe('function');
  });

  it('문자열이 아니거나 빈 입력은 빈 문자열', () => {
    for (const bad of [undefined, null, 0, {}, [], false]) expect(sanitize(bad)).toBe('');
    expect(sanitize('')).toBe('');
  });
});

describe('공유 벡터 (sanitize-vectors.json)', () => {
  it('40개 이상이고 형식이 맞으며 이름이 겹치지 않는다', () => {
    expect(vectors.length).toBeGreaterThanOrEqual(40);
    const names = new Set<string>();
    for (const v of vectors) {
      expect(typeof v.name).toBe('string');
      expect(typeof v.in).toBe('string');
      expect(typeof v.out).toBe('string');
      expect(names.has(v.name), v.name).toBe(false);
      names.add(v.name);
    }
  });

  it.each(vectors.map((v, i) => ({ ...v, idx: i })))('[$idx] $name', ({ in: input, out }) => {
    expect(sanitize(input)).toBe(out);
  });

  it('모든 벡터의 기대값은 고정점이고 허용 목록 밖의 것을 갖지 않는다', () => {
    for (const v of vectors) {
      expect(sanitize(v.out), `fixed point: ${v.name}`).toBe(v.out);
      expect(violations(v.out), `violations: ${v.name}`).toEqual([]);
    }
  });
});

describe('서버 정제기와의 차분 점검', () => {
  it('공유 벡터 입력에서 클라이언트와 서버 결과가 같다', () => {
    // allow-ext-<태그> 벡터는 실제 시안 측정으로 넓힌 허용 목록이다. 서버가 그 태그를 아직 허용하지 않으면 서버 쪽 sanitize.test.ts 가
    // 같은 벡터로 실패해 알려 주므로, 여기서는 건너뛰고 건수만 남긴다(서버가 따라오면 자동으로 비교 대상이 된다).
    const pending = (name: string) => { const m = /^allow-ext-([a-z0-9]+)/.exec(name); return m !== null && !SERVER_TAGS.includes(m[1]); };
    const skipped = vectors.filter((v) => pending(v.name));
    if (skipped.length > 0) console.warn(`서버 허용 목록에 아직 없는 확장 벡터 ${skipped.length}건은 차분에서 제외했습니다.`);
    for (const v of vectors) if (!pending(v.name)) expect(sanitize(v.in), v.name).toBe(sanitizeDetailHtml(v.in));
  });

  // 시드 고정 무작위 입력: 두 구현이 한 글자라도 다르면 실패하고, 처음 몇 건을 보여 준다.
  it('무작위 조각 입력 3000건의 출력이 서버와 같고, 항상 구조 불변식을 지킨다', () => {
    let seed = 0x9e3779b9;
    const rnd = (): number => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
    const tags = ['b', 'i', 'u', 's', 'em', 'strong', 'small', 'mark', 'sup', 'sub', 'span', 'a', 'code', 'abbr', 'div', 'p', 'font', 'table', 'tr', 'td', 'ul', 'li', 'form', 'input', 'button', 'textarea', 'select', 'option', 'svg', 'math', 'mi', 'mtext', 'style', 'script', 'noscript', 'template', 'title', 'iframe', 'xmp', 'img', 'video', 'audio', 'object', 'details', 'plaintext', 'noembed', 'p', 'br', 'foreignObject', 'annotation-xml', 'mglyph'];
    const attrs = [
      'class="hl"', 'class="a b-c_d"', 'class="x&quot;y"', 'style="color:red"', 'style="color:red;position:fixed"', 'style="background:#85858C"',
      'style="background:url(x)"', 'style="font-size:20px; color:#aa3322"', 'style=" color : red "', 'href="https://e.test/a"', 'href=" https://e.test "',
      'href="javascript:alert(1)"', 'href="java&#9;script:alert(1)"', 'href="mailto:a@b.co"', 'href="//e.test"', 'target="_blank"', 'target="_top"',
      'rel="opener"', 'onclick="alert(1)"', 'onerror=alert(1)', 'id="a"', 'name="nodeName"', 'name="attributes"', 'title="</style>"', 'title="--&gt;"',
      'data-x="1"', 'src=x', 'xlink:href="javascript:alert(1)"', 'style="color:red/**/"', 'style="width:expression(1)"',
    ];
    const texts = ['x', ' ', '\n', '침향', 'a &amp; b', '&lt;b&gt;', '&nbsp;', '<', '<<', '>', '"', "'", '&#106;', '&colon;', '--!>', ']]>', '</', '<!', '<?'];
    const frags = ['<!--c-->', '<!-->', '<![CDATA[x]]>', '<!DOCTYPE html>', '<?php ?>', '</br>', '</p>', '<br/>', '<scr<script>ipt>', '</scr</script>', '\u0000', ' '];
    const make = (depth: number): string => {
      let s = '';
      const n = 1 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) {
        const r = rnd();
        if (r < 0.28) s += pick(texts);
        else if (r < 0.34) s += pick(frags);
        else if (r < 0.46) s += `<${pick(tags)}${rnd() < 0.5 ? ' ' + pick(attrs) : ''}${rnd() < 0.2 ? ' ' + pick(attrs) : ''}>`;
        else if (r < 0.58) s += `</${pick(tags)}>`;
        else if (depth < 3) {
          const t = pick(tags);
          const open = `<${t}${rnd() < 0.5 ? ' ' + pick(attrs) : ''}${rnd() < 0.25 ? ' ' + pick(attrs) : ''}>`;
          s += open + make(depth + 1) + (rnd() < 0.85 ? `</${t}>` : '');
        } else s += pick(texts);
      }
      return s;
    };

    const diffs: string[] = [];
    const bad: string[] = [];
    let serverThrew = 0;
    for (let i = 0; i < 3000; i++) {
      const input = make(0);
      const client = sanitize(input);
      const v = violations(client);
      if (v.length) bad.push(`${JSON.stringify(input)} -> ${JSON.stringify(client)} ${v.join(',')}`);
      let server: string;
      try {
        server = sanitizeDetailHtml(input);
      } catch {
        serverThrew++;
        continue;
      }
      if (client !== server) diffs.push(`${JSON.stringify(input)}\n  client ${JSON.stringify(client)}\n  server ${JSON.stringify(server)}`);
    }
    expect(bad.slice(0, 5), `구조 불변식 위반 ${bad.length}건`).toEqual([]);
    expect(diffs.slice(0, 5), `차분 ${diffs.length}건 (서버 예외 ${serverThrew}건 제외)`).toEqual([]);
    expect(serverThrew).toBeLessThan(30);
  }, 180_000);
});

describe('견고성', () => {
  it('아주 깊은 중첩에서도 예외를 밖으로 내지 않는다', () => {
    const deep = '<b>'.repeat(20000) + 'x' + '</b>'.repeat(20000);
    const out = sanitize(deep);
    expect(typeof out).toBe('string');
    expect(violations(out)).toEqual([]);
  }, 120_000);

  it('frameset 처럼 body 가 사라지는 입력은 빈 문자열', () => {
    expect(sanitize('<frameset><frame src="javascript:alert(1)"></frameset>')).toBe('');
  });

  it('정제는 입력 문자열이나 창의 상태를 바꾸지 않는다', () => {
    const before = win.document.body.innerHTML;
    sanitize('<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>');
    expect(win.document.body.innerHTML).toBe(before);
    expect((win as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});
