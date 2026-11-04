/*
 * 상세페이지 시안 편집 코어 + 뷰어 부트스트랩 (계약 §3). 의존성·빌드 없음, ES2019 IIFE.
 * - window.DetailEditCore 를 노출한다. 편집 모드는 editor.js 가, 뷰어 모드는 이 파일의 viewer 영역이 쓴다.
 * - 뷰어 모드는 실패해도 원래 페이지를 그대로 보여 준다(fail-open): 어떤 예외도 페이지로 새지 않는다.
 * - 원본 DOM 을 먼저 훑어 키를 만들고(원본 기준), 그 다음에 문서(doc)의 수정을 적용한다.
 * - 서버(src/lib/detail-edits/sanitize.ts)와 같은 허용 목록을 쓴다. 공유 벡터: src/lib/detail-edits-core/__tests__/sanitize-vectors.json
 *
 * 영역(region) 표지: 단계별로 영역을 이어 붙인다. 순서: header, sanitize, keys, scan, apply, layout, viewer, export, expose.
 * 새 영역은 expose 바로 앞에 끼우고, 결과는 Core 객체에 붙인다(동결은 마지막 단계에서 expose 가 한다).
 */
(function () {
  'use strict';
  if (window.DetailEditCore) return;

  /* ==== region: header ==== */
  const XHTML = 'http://www.w3.org/1999/xhtml';
  const set = (s) => { const o = Object.create(null); s.split(' ').forEach((k) => { o[k] = 1; }); return o; };
  const Core = { version: '1' };
  /* ==== end region: header ==== */

  /* ==== region: sanitize ==== */
  /*
   * HTML 정제기 — 서버 sanitize.ts(DOMPurify) 와 같은 허용 목록·같은 결과를 낸다. 공유 벡터로 두 구현을 함께 검증한다.
   * 태그: b strong i em u s small mark sup sub br span a code abbr q  (q: 실제 시안 s8_copy 의 제목 IDENTITY 측정으로 추가, 계약 §1)
   * 속성: class(^[\w\- ]{1,80}$), style(허용 속성·값 제한), a 의 href(http/https/mailto/tel)·target(_blank/_self)·rel(강제)
   * 허용 밖 태그는 풀어서 글자만 남기고, DROP 태그(DOMPurify FORBID_CONTENTS)는 내용째 지운다.
   * DOMPurify 와 같게 맞춘 점: 문서 전체 파싱(<body> 접두를 붙이지 않는다), 속성값 trim, 속성값 XML 위험 패턴 제거,
   * 선두 공백 복원, 폼 요소 DOM 클로버링 검사, 고정점이 될 때까지 반복.
   */
  const ALLOW = set('b strong i em u s small mark sup sub br span a code abbr q');
  const DROP = set('annotation-xml audio colgroup desc foreignobject head iframe math mi mn mo ms mtext noembed noframes noscript plaintext script style svg template thead title video xmp');
  const CLASS_RE = /^[\w\- ]{1,80}$/;
  const HREF_RE = /^(?:https?:|mailto:|tel:)/i;
  // DOMPurify 의 ATTR_WHITESPACE 와 같은 범위: 제어문자·공백류
  const WS_RE = new RegExp('[\\x00-\\x20' + String.fromCharCode(0xa0, 0x1680, 0x180e, 0x2000) + '-' + String.fromCharCode(0x2029, 0x205f, 0x3000) + ']', 'g');
  const BAD_ATTR_RE = /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i;
  const TAGISH_RE = /<[/\w!]/;
  const STYLE_PROPS = set('color font-size font-weight font-style letter-spacing line-height text-decoration background-color background opacity white-space word-break');
  const STYLE_VALUE_RE = /^[\w\s#%.,()\-'"/]+$/;
  const STYLE_DANGER_RE = /url\s*\(|expression|javascript:|@import|\\/i;
  // background 단축 속성은 색 하나일 때만 허용한다(#hex · 색 이름 · rgb()/hsl()). 이미지 함수는 통과하지 못한다.
  const BG_COLOR_RE = /^(?:#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,24}|(?:rgb|hsl)a?\(\s*[\d.%\s,/-]+\))$/;

  // 파싱된 DOM 은 이름 충돌(DOM clobbering)로 속성·메서드가 가려질 수 있으므로 프로토타입의 접근자를 직접 쓴다.
  const getter = (C, k) => Object.getOwnPropertyDescriptor(C.prototype, k).get;
  const nFirst = getter(Node, 'firstChild'), nNext = getter(Node, 'nextSibling'), nType = getter(Node, 'nodeType'), nText = getter(Node, 'textContent');
  const eName = getter(Element, 'localName'), eNs = getter(Element, 'namespaceURI'), eAttrs = getter(Element, 'attributes');
  const eHtml = getter(Element, 'innerHTML'), eFirstEl = getter(Element, 'firstElementChild');
  const mInsert = Node.prototype.insertBefore, mRemove = Node.prototype.removeChild;
  const mGet = Element.prototype.getAttribute, mSet = Element.prototype.setAttribute, mDel = Element.prototype.removeAttribute;
  const dByTag = Document.prototype.getElementsByTagName, dText = Document.prototype.createTextNode;

  // ';' 로 선언을 나눈다(괄호·따옴표 안의 ';' 는 구분자가 아니다)
  function splitDecls(style) {
    const out = [];
    let depth = 0, quote = null, start = 0;
    for (let i = 0; i < style.length; i++) {
      const ch = style[i];
      if (quote) { if (ch === quote) quote = null; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ';' && depth === 0) { out.push(style.slice(start, i)); start = i + 1; }
    }
    out.push(style.slice(start));
    return out;
  }
  function declOk(decl) {
    const i = decl.indexOf(':');
    if (i < 0) return false;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const val = decl.slice(i + 1).trim();
    if (!STYLE_PROPS[prop] || !val || !STYLE_VALUE_RE.test(val) || STYLE_DANGER_RE.test(val)) return false;
    return prop !== 'background' || BG_COLOR_RE.test(val);
  }
  // 전부 허용이면 원문 그대로(원본 인라인 서식 보존), 아니면 허용된 선언만 '; ' 로 이어 붙인다
  function filterStyle(value) {
    const decls = splitDecls(value).filter((d) => d.trim() !== '');
    if (decls.every(declOk)) return value;
    return decls.filter(declOk).map((d) => d.trim()).join('; ');
  }

  // 속성: 값을 trim 한 뒤(DOMPurify 와 동일) 허용 속성만 남긴다. a 의 rel 은 항상 noopener noreferrer 로 강제한다.
  function fixAttrs(n, isA) {
    Array.prototype.slice.call(eAttrs.call(n)).forEach((a) => {
      const name = a.name, raw = a.value, v = raw.trim();
      let keep = false, out = v;
      if (!BAD_ATTR_RE.test(v)) {
        if (name === 'class') keep = CLASS_RE.test(v);
        else if (name === 'style') { out = filterStyle(v); keep = out !== ''; }
        else if (isA && name === 'href') keep = HREF_RE.test(v) && HREF_RE.test(v.replace(WS_RE, ''));
        else if (isA && name === 'target') keep = v === '_blank' || v === '_self';
        else if (isA && name === 'rel') keep = true; // 값은 아래에서 강제로 덮어쓴다
      }
      if (!keep) mDel.call(n, name);
      else if (out !== raw) mSet.call(n, name, out);
    });
    if (isA && mGet.call(n, 'rel') !== 'noopener noreferrer') mSet.call(n, 'rel', 'noopener noreferrer');
  }

  const isClobbered = (n) => n instanceof HTMLFormElement && (typeof n.nodeName !== 'string' || typeof n.textContent !== 'string' || typeof n.removeChild !== 'function' || !(n.attributes instanceof NamedNodeMap) || typeof n.removeAttribute !== 'function' || typeof n.setAttribute !== 'function' || typeof n.namespaceURI !== 'string' || typeof n.insertBefore !== 'function' || typeof n.hasChildNodes !== 'function');

  // 요소 판정: 0 = 유지, 1 = 내용째 삭제, 2 = 풀어서 자식만 남김
  function judge(n) {
    if (isClobbered(n) || eNs.call(n) !== XHTML) return 1; // 클로버링된 폼, svg·math 안의 요소
    // 자식 요소 없이 글자 안에 날것의 태그 모양이 든 요소(네임스페이스 혼동 mXSS 의 흔적)는 내용째 지운다
    if (nFirst.call(n) !== null && eFirstEl.call(n) === null && TAGISH_RE.test(eHtml.call(n)) && TAGISH_RE.test(nText.call(n))) return 1;
    const name = eName.call(n);
    if (ALLOW[name]) return 0;
    return DROP[name] ? 1 : 2;
  }

  // parent 의 자손을 제자리에서 정제한다(앞에서 뒤로, 부모 먼저). 글자 노드만 남기고 주석·CDATA·처리 명령은 지운다.
  function clean(parent) {
    let n = nFirst.call(parent);
    while (n) {
      const t = nType.call(n);
      if (t === 3) { n = nNext.call(n); continue; }
      if (t !== 1) { const x = nNext.call(n); mRemove.call(parent, n); n = x; continue; }
      const v = judge(n);
      if (v === 0) {
        fixAttrs(n, eName.call(n) === 'a');
        clean(n);
        n = nNext.call(n);
      } else if (v === 1) {
        const x = nNext.call(n); mRemove.call(parent, n); n = x;
      } else {
        const first = nFirst.call(n);
        let c;
        while ((c = nFirst.call(n))) mInsert.call(parent, c, n); // 자식을 이 자리로 옮긴 뒤 다시 훑는다
        const x = nNext.call(n);
        mRemove.call(parent, n);
        n = first || x;
      }
    }
  }

  // 한 번 정제한 결과 문자열. 파싱 결과에 body 가 없으면(frameset 등) null.
  function sanitizeOnce(html) {
    const lead = /^[\r\n\t ]+/.exec(html);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = dByTag.call(doc, 'body')[0];
    if (!body) return null;
    if (lead) mInsert.call(body, dText.call(doc, lead[0]), nFirst.call(body)); // 파서가 버린 선두 공백을 되돌린다
    clean(body);
    return eHtml.call(body);
  }

  // 정제 결과가 수렴하지 않으면 글자만 남긴다(fail-closed)
  function textOnly(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const s = doc.createElement('span');
    s.textContent = doc.body ? nText.call(doc.body) : '';
    return eHtml.call(s);
  }

  function sanitize(html) {
    if (typeof html !== 'string' || html === '') return '';
    try {
      let cur = sanitizeOnce(html);
      if (cur === null) return '';
      for (let i = 0; i < 4; i++) {
        const next = sanitizeOnce(cur);
        if (next === null) return '';
        if (next === cur) return cur;
        cur = next;
      }
      return textOnly(cur);
    } catch {
      return ''; // 예외(과도한 중첩 등)로 정제하지 못하면 아무것도 내보내지 않는다
    }
  }
  Core.sanitize = sanitize;
  /* ==== end region: sanitize ==== */

  /* ==== region: keys ==== */
  /*
   * 키·정규화 (계약 §1). 키 = 종류 글자(t i b s) : 정규화한 원본 내용의 cyrb53(36진수) : 같은 해시의 문서 순서 등장 번호.
   * 클론 안의 키는 'cN!' 접두어를 앞에 붙인다. 접두어는 레이아웃 단계가 채우므로 여기서는 자리만 열어 둔다(mkKey 의 prefix).
   */
  const INVISIBLE_RE = /[ ⁠​]/g;
  // NFC → U+00A0·U+2060·U+200B 제거 → 공백류 하나로 접기 → 앞뒤 공백 제거
  function norm(s) { return String(s).normalize('NFC').replace(INVISIBLE_RE, '').replace(/\s+/g, ' ').trim(); }

  // cyrb53 (공개 구현 그대로, seed 0): 53비트 정수를 돌려준다. 'a' -> 7929297801672961
  function cyrb53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  // 키 정규식(^[0-9a-z]{4,16}$)을 지키려고 4자리까지 0 으로 채운다
  const hash36 = (s) => cyrb53(s).toString(36).padStart(4, '0');

  // counters: 해시별 등장 횟수 장부(문서 순서로 부르는 쪽이 한 장부를 끝까지 쓴다)
  function mkKey(kind, text, counters, prefix) {
    const h = hash36(text), ck = kind + ':' + h, n = counters[ck] || 0;
    counters[ck] = n + 1;
    return (prefix || '') + kind + ':' + h + ':' + n;
  }

  // 건너뛰는 부분 트리(계약 §3.2)와 phrasing 목록. [data-de-skip] 붙은 요소는 phrasing 이 아니라 건너뛸 요소로 본다.
  const SKIP = set('script style noscript template svg math iframe canvas object embed');
  const PHRASING = set('b strong i em u s small mark sup sub code abbr cite q time del ins font a span label br wbr');
  const isSkip = (el) => SKIP[el.localName] === 1 || el.hasAttribute('data-de-skip');
  const isPhr = (el) => PHRASING[el.localName] === 1 && !el.hasAttribute('data-de-skip');

  // 건너뛸 부분 트리를 통째로 가지치기하며 root 아래 요소·글자 노드를 문서 순서로 돌린다(root 자신은 검사하지 않는다)
  function walk(root, fn) {
    const w = root.ownerDocument.createTreeWalker(root, 5, { acceptNode: (n) => (n.nodeType === 1 && isSkip(n) ? 2 : 1) });
    for (let n = w.nextNode(); n; n = w.nextNode()) fn(n);
  }
  // 건너뛰는 부분을 뺀 글자(정규화 전). brSpace 면 <br> 을 공백으로 읽는다(라벨용)
  function rawText(root, brSpace) {
    if (root.nodeType === 3) return root.nodeValue;
    let out = '';
    walk(root, (n) => { if (n.nodeType === 3) out += n.nodeValue; else if (brSpace && n.localName === 'br') out += ' '; });
    return out;
  }
  // 글자 수 기준 자르기(서로게이트 쌍을 가르지 않는다)
  function clip(s, n) {
    if (s.length <= n) return s;
    const c = s.charCodeAt(n - 1);
    return s.slice(0, c >= 0xd800 && c <= 0xdbff ? n - 1 : n);
  }
  /* ==== end region: keys ==== */

  /* ==== region: scan ==== */
  /*
   * 원본 DOM 훑기 (계약 §3.2~3.4). DOM 을 바꾸지 않는다. 화면 배치(getComputedStyle)는 CSS 배경 이미지를 찾을 때만 쓰고,
   * 글 블록 판정은 마크업만 본다(뷰포트와 무관). 결과 키는 원본 DOM 기준이라 수정이 끝난 뒤에도 같다.
   */
  // 글 블록 -----------------------------------------------------------------
  // q 가 글을 품은 요소인가: 직계 비어 있지 않은 글자 노드가 있거나, 요소 자식이 전부 phrasing
  function textBearing(q) {
    let allPhr = true;
    for (let c = q.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { if (norm(c.nodeValue) !== '') return true; }
      else if (c.nodeType === 1 && !isPhr(c)) allPhr = false;
    }
    return allPhr;
  }
  // 글자 노드 t 의 블록 루트. phrasing 부모를, 그 부모가 글을 품은 동안 위로 올린다(body·html 까지는 올리지 않는다).
  function blockRootOf(t, bearing, doc) {
    let p = t.parentNode;
    while (isPhr(p)) {
      const q = p.parentNode;
      if (!q || q.nodeType !== 1 || q === doc.body || q === doc.documentElement || !bearing(q)) break;
      p = q;
    }
    return p;
  }
  // 혼합 루트(비-phrasing 요소 자식이 있는 루트)의 run: 직계 글자·phrasing 자식이 이어지는 구간. 글이 없는 구간은 버린다.
  // 비-phrasing 요소·건너뛸 요소·주석은 구간을 끊는다.
  function runsOf(r) {
    const runs = [];
    let cur = [];
    const flush = () => {
      if (cur.length && norm(cur.map((n) => rawText(n)).join('')) !== '') runs.push(cur);
      cur = [];
    };
    for (let c = r.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3 || (c.nodeType === 1 && isPhr(c))) cur.push(c);
      else flush();
    }
    flush();
    return runs;
  }
  const hasNonPhr = (r) => Array.prototype.some.call(r.children, (c) => !isPhr(c));
  function htmlOfNodes(nodes) {
    const d = nodes[0].ownerDocument.createElement('div');
    nodes.forEach((n) => { d.appendChild(n.cloneNode(true)); });
    return d.innerHTML;
  }
  // root 아래의 글 블록 후보를 문서 순서로: {el(루트), run(null | 번호), nodes(run 일 때), first(순서 기준 노드)}
  function collectBlocks(root) {
    const doc = root.ownerDocument, memo = new Map(), seen = new Set(), roots = [], items = [];
    const bearing = (q) => { let v = memo.get(q); if (v === undefined) { v = textBearing(q); memo.set(q, v); } return v; };
    walk(root, (n) => {
      if (n.nodeType !== 3 || norm(n.nodeValue) === '') return;
      const r = blockRootOf(n, bearing, doc);
      if (!seen.has(r)) { seen.add(r); roots.push(r); }
    });
    roots.forEach((r) => {
      if (!hasNonPhr(r)) items.push({ el: r, run: null, nodes: null, first: r });
      else runsOf(r).forEach((nodes, i) => { items.push({ el: r, run: i, nodes, first: nodes[0] }); });
    });
    // 안정 정렬(ES2019): 루트 요소는 자기 글자보다, run 은 첫 노드 위치로 줄 세운다
    items.sort((a, b) => (a.first === b.first ? 0 : (a.first.compareDocumentPosition(b.first) & 4) ? -1 : 1));
    return items;
  }
  function blockEntry(it) {
    const nodes = it.nodes, el = it.el;
    const text = norm(nodes ? nodes.map((n) => rawText(n)).join('') : rawText(el));
    return {
      el, tag: el.nodeName, run: it.run, nodes, origText: text,
      origHtml: nodes ? htmlOfNodes(nodes) : el.innerHTML,
      origStyleAttr: nodes ? null : el.getAttribute('style'), // run 은 자기 요소가 없다
    };
  }
  // 이미지 ------------------------------------------------------------------
  function collectImages(root) {
    const out = [];
    walk(root, (n) => { if (n.nodeType === 1 && n.localName === 'img') out.push(n); });
    return out;
  }
  function imageEntry(el) {
    const src = el.getAttribute('src');
    return {
      el, attrs: Array.prototype.map.call(el.attributes, (a) => [a.name, a.value]), // 속성 순서까지 정확히 되돌리기 위한 원본 목록
      origSrc: src === null ? '' : src, hadSrc: src !== null, // 키는 작성된 src 속성 문자열 기준(풀린 주소가 아니다)
      origAlt: el.getAttribute('alt'), origSrcset: el.getAttribute('srcset'), origSizes: el.getAttribute('sizes'),
    };
  }

  // CSS 배경 이미지 -----------------------------------------------------------
  // 최상위 쉼표로 나눈다(괄호·따옴표 안의 쉼표는 구분자가 아니다): background-image 겹겹이 목록용
  function splitTop(s, sep) {
    const out = [];
    let depth = 0, quote = null, start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = null; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === sep && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
    }
    out.push(s.slice(start));
    return out;
  }
  const BG_URL_RE = /^url\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^)\s'"]*))\s*\)$/;
  // 첫 단순 url() 층: {layer, layers, url} 또는 null. 그라데이션·image-set 등 다른 층은 건너뛴다(계약 §3.3: 그라데이션이 아닌 url)
  function bgUrlOf(value) {
    if (!value || value === 'none' || value.indexOf('url(') < 0) return null;
    const layers = splitTop(value, ',').map((l) => l.trim());
    for (let i = 0; i < layers.length; i++) {
      const m = BG_URL_RE.exec(layers[i]);
      if (m) return { layer: i, layers: layers.length, url: m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3] };
    }
    return null;
  }
  // 키용 경로: 풀린 주소에서 출처(origin)와 해시를 떼고 pathname+search 만 쓴다(로컬 E2E 와 운영의 출처가 달라도 키가 같도록)
  function bgPathOf(url, doc) {
    try { const a = new URL(url, doc.baseURI); return a.pathname + a.search; } catch { return url; }
  }
  function collectBgs(root, doc) {
    const win = doc.defaultView, out = [];
    const test = (el) => {
      const hit = bgUrlOf(win.getComputedStyle(el).backgroundImage);
      if (!hit) return;
      let abs = hit.url;
      try { abs = new URL(hit.url, doc.baseURI).href; } catch { /* 풀 수 없으면 그대로 */ }
      out.push({
        el, origUrl: abs, origPath: bgPathOf(hit.url, doc), layer: hit.layer, layers: hit.layers, computed: win.getComputedStyle(el).backgroundImage,
        origInline: el.style.backgroundImage, origStyleAttr: el.getAttribute('style'),
      });
    };
    if (root === doc.body) test(root);
    walk(root, (n) => { if (n.nodeType === 1) test(n); });
    return out;
  }

  // 섹션 --------------------------------------------------------------------
  // 선택자 지도: C/analysis/sections.json (ANALYZE 트랙이 11페이지에서 재 본 값). id 는 쓰지 않는다(s7_black 에 중복 id 가 있다).
  // 직계 자식만 고르므로 서로 겹치지 않고, 페이지 높이의 99.8% 이상을 덮는다.
  const SECTION_SELECTORS = {
    s1_gift: '.page > section, .page > footer',
    s2_check: '.page > section, .page > footer',
    c_field: '.page > section, .page > footer',
    s4_plum: '.page > section, .page > footer',
    s5_field: '.page > section',
    s6_plum: '.page > section',
    s7_black: '.wrap > section',
    s8_copy: '.page > section, .page > .band, .page > .flow, .page > .end',
    s9_clean: '.wrap > section',
    s10_gift: '.wrap > section',
    s11_astra: '.wrap > section',
  };
  function slugOf() {
    const segs = location.pathname.split('/').filter(Boolean);
    let s = segs.length ? segs[segs.length - 1] : '';
    try { s = decodeURIComponent(s); } catch { /* 그대로 */ }
    return s.replace(/\.html?$/i, '');
  }
  function collectSections(doc, selector) {
    if (!selector) return [];
    try { return Array.prototype.slice.call(doc.querySelectorAll(selector)); } catch { return []; }
  }
  function sectionEntry(el, index) {
    const h = el.querySelector('h1,h2,h3,h4,h5,h6');
    const head = h ? norm(rawText(h, true)) : '';
    return {
      el, kind: 'section', index, label: clip(head !== '' ? head : norm(rawText(el, true)), 40), origExcerpt: clip(norm(rawText(el)), 80),
      origDisplay: el.style.display, origStyleAttr: el.getAttribute('style'),
    };
  }

  // 레지스트리 ----------------------------------------------------------------
  // 전체 훑기: 키는 종류별 장부 하나로 문서 순서대로 매긴다. 부수효과 없음(DOM 불변).
  function scanAll(doc, opts) {
    const counters = Object.create(null);
    const reg = { blocks: new Map(), images: new Map(), bgs: new Map(), sections: new Map(), orphans: [] };
    collectBlocks(doc.body).forEach((it) => {
      const e = blockEntry(it);
      reg.blocks.set(mkKey('t', e.origText, counters), e);
    });
    collectImages(doc.body).forEach((el) => {
      const e = imageEntry(el);
      reg.images.set(mkKey('i', e.origSrc, counters), e);
    });
    if (opts.needBgs) {
      collectBgs(doc.body, doc).forEach((e) => { reg.bgs.set(mkKey('b', e.origPath, counters), e); });
    }
    collectSections(doc, opts.selector).forEach((el, i) => {
      reg.sections.set(mkKey('s', norm(rawText(el)), counters), sectionEntry(el, i));
    });
    return reg;
  }
  // 문서(doc)에 있는데 레지스트리에 없는 키 = 고아. 클론 접두어(cN!)가 붙은 키는 클론을 만든 뒤 레이아웃 단계가 가른다.
  function findOrphans(reg, d) {
    const out = [], PRE = /^c[0-9]{1,3}!/;
    [['texts', 'text', 'blocks'], ['images', 'image', 'images'], ['bgs', 'bg', 'bgs'], ['hidden', 'hidden', 'sections']].forEach((x) => {
      const arr = d && d[x[0]];
      if (!Array.isArray(arr)) return;
      arr.forEach((e) => {
        if (!e || typeof e.k !== 'string' || PRE.test(e.k) || reg[x[2]].has(e.k)) return;
        out.push({ kind: x[1], k: e.k, o: typeof e.o === 'string' ? e.o : '' });
      });
    });
    return out;
  }

  let state = null;
  // init: 원래 DOM 을 훑어 레지스트리를 만든다. 두 번째 호출은 다시 훑지 않고 같은 레지스트리를 돌려준다(수정된 DOM 에서 키가 흔들리지 않게).
  // 문서(doc) 적용은 apply 영역이 이어 붙인다. opts.slug / opts.sectionSelector 는 테스트용 재정의.
  Core.init = function (opts) {
    if (state) return state.reg;
    const o = opts || {}, d = o.doc || {}, mode = o.mode === 'edit' ? 'edit' : 'view';
    const slug = typeof o.slug === 'string' ? o.slug : slugOf();
    const selector = typeof o.sectionSelector === 'string' ? o.sectionSelector : SECTION_SELECTORS[slug] || '';
    const needBgs = mode === 'edit' || (Array.isArray(d.bgs) && d.bgs.length > 0);
    const reg = scanAll(document, { needBgs, selector });
    reg.orphans = findOrphans(reg, d);
    state = { reg, mode, slug, doc: d };
    return reg;
  };
  Core.registry = function () { return state ? state.reg : null; };
  /* ==== end region: scan ==== */

  /* ==== region: apply ==== */
  /*
   * 수정 적용·되돌리기·수집 (계약 §3.1). 항목마다 "지금 값"(html/fs/color, curSrc/curAlt, cur, hidden)을 들고 있고,
   * 원본과 같아지면 null 로 돌아가 "바뀌지 않음"이 된다. 되돌리기는 원본 마크업·속성 순서까지 그대로 복원한다.
   */
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const UNSAFE_URL_RE = /^[\s\u0000-\u001f]*(?:javascript|data|vbscript):/i;
  const styleParts = []; // de-style 에 들어갈 규칙 조각 함수들(숨김 규칙 외에 레이아웃 영역이 더할 수 있다)
  const curReg = () => (state ? state.reg : null);
  const textNode = (el, s) => el.ownerDocument.createTextNode(s);

  function parseNodes(el, html) {
    const d = el.ownerDocument.createElement('div');
    d.innerHTML = html;
    return Array.prototype.slice.call(d.childNodes);
  }
  function swapNodes(old, fresh) {
    const first = old[0], parent = first.parentNode;
    fresh.forEach((n) => { parent.insertBefore(n, first); });
    old.forEach((n) => { parent.removeChild(n); });
  }
  // 새로 만든 항목(레지스트리)의 "지금 값"을 비운 상태로 맞춘다
  function prepEntries(r) {
    r.blocks.forEach((e) => { e.html = null; e.fs = null; e.color = null; e.wrap = null; e.cur = e.nodes ? e.nodes.slice() : null; });
    r.images.forEach((e) => { e.curSrc = null; e.curAlt = null; });
    r.bgs.forEach((e) => { e.cur = null; });
    r.sections.forEach((e) => { e.hidden = false; });
  }

  // 글 블록 -------------------------------------------------------------------
  function writeHtml(e, s) {
    if (!e.nodes) { e.el.innerHTML = s; return; }
    if (e.wrap) { e.wrap.innerHTML = s; return; }
    const fresh = parseNodes(e.el, s);
    if (!fresh.length) fresh.push(textNode(e.el, '')); // 되돌릴 자리 표시(직렬화에 나오지 않는다)
    swapNodes(e.cur, fresh);
    e.cur = fresh;
  }
  function applyStyle(e) {
    const fs = e.fs, color = e.color;
    if (!e.nodes) {
      const el = e.el;
      if (e.origStyleAttr === null) el.removeAttribute('style'); else el.setAttribute('style', e.origStyleAttr);
      if (fs !== null) el.style.setProperty('font-size', fs + 'px');
      if (color !== null) el.style.setProperty('color', color);
      return;
    }
    // 혼합 루트 run: 자기 요소가 없으므로 글 마디를 span[data-de-run] 으로 감싸 스타일을 얻는다(내보낼 때 속성만 떼고 span 은 남긴다)
    if (fs === null && color === null) {
      if (!e.wrap) return;
      const w = e.wrap, kids = Array.prototype.slice.call(w.childNodes);
      if (!kids.length) kids.push(textNode(w, ''));
      kids.forEach((n) => { w.parentNode.insertBefore(n, w); });
      w.parentNode.removeChild(w);
      e.wrap = null; e.cur = kids;
      return;
    }
    if (!e.wrap) {
      const w = e.el.ownerDocument.createElement('span'), nodes = e.cur;
      w.setAttribute('data-de-run', '');
      nodes[0].parentNode.insertBefore(w, nodes[0]);
      nodes.forEach((n) => { w.appendChild(n); });
      e.wrap = w; e.cur = [w];
    }
    e.wrap.removeAttribute('style');
    if (fs !== null) e.wrap.style.setProperty('font-size', fs + 'px');
    if (color !== null) e.wrap.style.setProperty('color', color);
  }
  const blockChanged = (e) => e.html !== null || e.fs !== null || e.color !== null;

  Core.setBlockHtml = function (key, html) {
    const r = curReg(), e = r && r.blocks.get(key);
    if (!e) return false;
    if (html === null || html === undefined) { if (e.html !== null) { writeHtml(e, e.origHtml); e.html = null; } return true; }
    const s = sanitize(String(html));
    if (s === (e.html === null ? e.origHtml : e.html)) return true;
    writeHtml(e, s);
    e.html = s === e.origHtml ? null : s;
    return true;
  };
  Core.setBlockStyle = function (key, st) {
    const r = curReg(), e = r && r.blocks.get(key), v = st || {};
    if (!e) return false;
    const okFs = !('fs' in v) || v.fs === null || v.fs === undefined || (typeof v.fs === 'number' && Number.isInteger(v.fs) && v.fs >= 10 && v.fs <= 200);
    const okCo = !('color' in v) || v.color === null || v.color === undefined || (typeof v.color === 'string' && COLOR_RE.test(v.color));
    if (!okFs || !okCo) return false;
    if ('fs' in v) e.fs = v.fs === undefined ? null : v.fs;
    if ('color' in v) e.color = v.color === undefined ? null : v.color;
    applyStyle(e);
    return true;
  };
  // 이미지 ---------------------------------------------------------------------
  // 속성 목록을 원본 순서대로 다시 쓴다: 지운 속성을 되살려도 순서가 같다(outerHTML 이 바이트 단위로 같아야 한다)
  function renderImg(e) {
    const el = e.el, want = [];
    e.attrs.forEach((a) => {
      if (e.curSrc !== null && (a[0] === 'srcset' || a[0] === 'sizes')) return;
      want.push([a[0], a[0] === 'src' && e.curSrc !== null ? e.curSrc : a[0] === 'alt' && e.curAlt !== null ? e.curAlt : a[1]]);
    });
    if (e.curSrc !== null && !e.attrs.some((a) => a[0] === 'src')) want.push(['src', e.curSrc]);
    if (e.curAlt !== null && !e.attrs.some((a) => a[0] === 'alt')) want.push(['alt', e.curAlt]);
    Array.prototype.slice.call(el.attributes).forEach((a) => { el.removeAttribute(a.name); });
    want.forEach((a) => { el.setAttribute(a[0], a[1]); });
  }
  const urlOk = (u) => typeof u === 'string' && u !== '' && !UNSAFE_URL_RE.test(u);
  Core.setImage = function (key, v) {
    const r = curReg(), e = r && r.images.get(key);
    if (!e) return false;
    if (v === null) { e.curSrc = null; e.curAlt = null; renderImg(e); return true; }
    const o = v || {};
    if ('src' in o && o.src !== null && o.src !== undefined && !urlOk(o.src)) return false;
    if ('alt' in o && o.alt !== null && o.alt !== undefined && typeof o.alt !== 'string') return false;
    if ('src' in o) e.curSrc = o.src === null || o.src === undefined || (e.hadSrc && o.src === e.origSrc) ? null : o.src;
    if ('alt' in o) e.curAlt = o.alt === null || o.alt === undefined || o.alt === e.origAlt ? null : o.alt;
    renderImg(e);
    return true;
  };

  // CSS 배경 ---------------------------------------------------------------------
  // 겹겹이 목록에서 url 층 하나만 바꾼다(그라데이션 층은 계산값 그대로). 인라인 style 속성 문자열 전체를 복원 대상으로 삼는다.
  function writeBg(e, url) {
    const layers = splitTop(e.computed, ',').map((l) => l.trim());
    layers[e.layer] = 'url("' + url.replace(/["\\]/g, (c) => '\\' + c).replace(/[\r\n]/g, '') + '")';
    const base = e.origStyleAttr;
    e.el.setAttribute('style', (base && base.trim() !== '' ? base.replace(/;?\s*$/, ';') + ' ' : '') + 'background-image: ' + layers.join(', ') + ';');
  }
  function revertBg(e) {
    if (e.origStyleAttr === null) e.el.removeAttribute('style'); else e.el.setAttribute('style', e.origStyleAttr);
    e.cur = null;
  }
  Core.setBg = function (key, url) {
    const r = curReg(), e = r && r.bgs.get(key);
    if (!e) return false;
    if (url === null || url === undefined) { revertBg(e); return true; }
    if (!urlOk(url)) return false;
    if (url === e.origUrl) { revertBg(e); return true; }
    writeBg(e, url);
    e.cur = url;
    return true;
  };

  // 섹션 숨김 ----------------------------------------------------------------------
  styleParts.push(() => (document.querySelector('[data-de-hidden]') ? '[data-de-hidden]{display:none !important}' : ''));
  function syncStyle() {
    const css = styleParts.map((f) => f()).filter(Boolean).join('\n');
    let s = document.getElementById('de-style');
    if (css === '') { if (s) s.parentNode.removeChild(s); return; }
    if (!s) {
      s = document.createElement('style');
      s.id = 'de-style';
      (document.head || document.documentElement).appendChild(s);
    }
    if (s.textContent !== css) s.textContent = css;
  }
  Core.setHidden = function (key, on) {
    const r = curReg(), e = r && r.sections.get(key);
    if (!e) return false;
    if (on) e.el.setAttribute('data-de-hidden', ''); else e.el.removeAttribute('data-de-hidden');
    e.hidden = !!on;
    syncStyle();
    return true;
  };

  // 되돌리기·변경 여부 ----------------------------------------------------------------
  const KIND_MAP = { text: 'blocks', image: 'images', bg: 'bgs', hidden: 'sections' };
  Core.isChanged = function (kind, key) {
    const r = curReg(), m = KIND_MAP[kind], e = r && m && r[m].get(key);
    if (!e) return false;
    if (kind === 'text') return blockChanged(e);
    if (kind === 'image') return e.curSrc !== null || e.curAlt !== null;
    if (kind === 'bg') return e.cur !== null;
    return e.hidden === true;
  };
  Core.revert = function (kind, key) {
    if (kind === 'text') {
      const r = curReg(), e = r && r.blocks.get(key);
      if (!e) return false;
      if (e.html !== null) { writeHtml(e, e.origHtml); e.html = null; }
      e.fs = null; e.color = null;
      applyStyle(e);
      return true;
    }
    if (kind === 'image') return Core.setImage(key, null);
    if (kind === 'bg') return Core.setBg(key, null);
    if (kind === 'hidden') return Core.setHidden(key, false);
    return false;
  };

  // 수집: 원본과 달라진 항목만. 레지스트리에 없는 문서 항목(고아)은 손대지 않고 그대로 싣는다 ------------------------------
  Core.collect = function () {
    const r = curReg(), out = { texts: [], images: [], bgs: [], hidden: [] };
    if (!r) return out;
    r.blocks.forEach((e, k) => {
      if (!blockChanged(e)) return;
      const o = { k, o: clip(e.origText, 80) };
      if (e.html !== null) o.html = e.html;
      if (e.fs !== null) o.fs = e.fs;
      if (e.color !== null) o.color = e.color;
      if (e.run !== null) o.run = e.run;
      out.texts.push(o);
    });
    r.images.forEach((e, k) => {
      if (e.curSrc === null && e.curAlt === null) return;
      const o = { k, o: e.origSrc };
      if (e.curSrc !== null) o.src = e.curSrc;
      if (e.curAlt !== null) o.alt = e.curAlt;
      out.images.push(o);
    });
    r.bgs.forEach((e, k) => { if (e.cur !== null) out.bgs.push({ k, o: e.origUrl, src: e.cur }); });
    r.sections.forEach((e, k) => { if (e.hidden) out.hidden.push({ k, o: e.origExcerpt }); });
    const d = state.doc;
    [['texts', 'blocks'], ['images', 'images'], ['bgs', 'bgs'], ['hidden', 'sections']].forEach((x) => {
      if (!Array.isArray(d[x[0]])) return;
      const have = new Set(out[x[0]].map((o) => o.k));
      d[x[0]].forEach((e) => {
        if (e && typeof e.k === 'string' && !r[x[1]].has(e.k) && !have.has(e.k)) { out[x[0]].push(JSON.parse(JSON.stringify(e))); have.add(e.k); }
      });
    });
    return out;
  };

  // init: 훑기(scan 영역) 뒤에 문서를 적용한다. 항목 하나의 실패가 나머지를 막지 않는다.
  const scanInit = Core.init;
  Core.init = function (opts) {
    const first = !state, reg = scanInit(opts);
    if (!first) return reg;
    try { state.doc = JSON.parse(JSON.stringify(state.doc)); } catch { state.doc = {}; }
    prepEntries(reg);
    const d = state.doc, each = (a, f) => { if (Array.isArray(a)) a.forEach((e) => { try { if (e && typeof e.k === 'string') f(e); } catch { /* 그 항목만 건너뛴다 */ } }); };
    each(d.texts, (e) => {
      if (typeof e.html === 'string') Core.setBlockHtml(e.k, e.html);
      if (e.fs !== undefined || e.color !== undefined) Core.setBlockStyle(e.k, { fs: e.fs, color: e.color });
    });
    each(d.images, (e) => { Core.setImage(e.k, { src: e.src, alt: e.alt }); });
    each(d.bgs, (e) => { if (typeof e.src === 'string') Core.setBg(e.k, e.src); });
    each(d.hidden, (e) => { Core.setHidden(e.k, true); });
    return reg;
  };
  /* ==== end region: apply ==== */

  /* ==== region: export ==== */
  // 내보내기: 지금 DOM 을 편집 흔적 없는 독립 HTML 로. 숨긴 섹션은 지우고, 스크립트·편집용 스타일·data-de-* 를 걷어 낸다.
  Core.exportHtml = function (opts) {
    const base = opts && typeof opts.base === 'string' ? opts.base : '';
    const root = document.documentElement.cloneNode(true), rm = (n) => { if (n.parentNode) n.parentNode.removeChild(n); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-de-hidden]'), rm);
    Array.prototype.forEach.call(root.querySelectorAll('script, #de-style, #de-hide, #de-root, base'), rm);
    const marks = [], w = document.createTreeWalker(root, 128);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/^de:(begin|end)$/.test(n.nodeValue)) marks.push(n);
    marks.forEach(rm);
    [root].concat(Array.prototype.slice.call(root.querySelectorAll('*'))).forEach((el) => {
      Array.prototype.slice.call(el.attributes).forEach((a) => { if (a.name.indexOf('data-de-') === 0) el.removeAttribute(a.name); });
    });
    if (base !== '' && urlOk(base)) {
      let head = root.querySelector('head');
      if (!head) { head = document.createElement('head'); root.insertBefore(head, root.firstChild); }
      const b = document.createElement('base');
      b.setAttribute('href', base);
      head.insertBefore(b, head.firstChild);
    }
    const dt = document.doctype;
    const pre = dt ? '<!DOCTYPE ' + dt.name + (dt.publicId ? ' PUBLIC "' + dt.publicId + '"' + (dt.systemId ? ' "' + dt.systemId + '"' : '') : dt.systemId ? ' SYSTEM "' + dt.systemId + '"' : '') + '>\n' : '';
    return pre + root.outerHTML;
  };
  /* ==== end region: export ==== */

  /* ==== region: layout ==== */
  /*
   * 레이아웃(부록 A1·A2): 같은 부모를 가진 섹션끼리만 순서를 바꾸고(DOM 이동, 재생성 없음), 섹션 위·아래 간격(margin !important)과
   * 배경색(background-color !important)을 준다. 복제는 오너 결정으로 범위에서 뺐다. 되돌리면 style 속성 원문까지 그대로 복원한다.
   */
  // C/analysis/reorder-risk.json 에서 만든 상수: 옮기면 모양이 달라진 섹션 / 배경색을 줘도 눈에 안 띄는 섹션(페이지 슬러그 -> 섹션 인덱스)
  const ORDER_RISK = { s7_black: [0, 1, 3, 4, 6, 7] };
  const SECBG_NOEFFECT = {
    c_field: [0], s5_field: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], s6_plum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    s7_black: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], s8_copy: [12], s9_clean: [0, 1, 3, 5, 11], s10_gift: [9],
  };
  let lay = null; // { groups: [{id, orig:[key], cur:[key]}] }

  function buildGroups(r) {
    const gs = [], byParent = new Map();
    r.sections.forEach((e, k) => {
      let g = byParent.get(e.el.parentNode);
      if (!g) { g = { id: 'g' + gs.length, orig: [], cur: [] }; byParent.set(e.el.parentNode, g); gs.push(g); }
      g.orig.push(k); g.cur.push(k);
      e.group = g; e.gap = null; e.bgc = null;
    });
    return gs;
  }
  // 섹션이 차지한 자리(슬롯)는 그대로 두고 그 안에서 섹션만 바꿔 넣는다. 사이의 다른 노드는 제자리.
  function place(g, keys) {
    const r = curReg(), slots = g.cur.map((k) => r.sections.get(k).el), els = keys.map((k) => r.sections.get(k).el);
    g.cur = keys.slice();
    if (els.every((el, i) => el === slots[i])) return;
    const marks = slots.map((el) => { const m = el.ownerDocument.createComment('de-slot'); el.parentNode.insertBefore(m, el); return m; });
    els.forEach((el, i) => { marks[i].parentNode.insertBefore(el, marks[i]); });
    marks.forEach((m) => { m.parentNode.removeChild(m); });
  }
  // 목록에 없는 섹션은 원래 순서에서 바로 앞에 있는 "목록에 있는" 섹션 뒤에(없으면 맨 앞에) 둔다.
  function mergeSeq(orig, listed) {
    const L = new Set(listed), attach = new Map(), out = [];
    let last = null;
    orig.forEach((k) => {
      if (L.has(k)) { last = k; return; }
      if (last === null) out.push(k); else { if (!attach.has(last)) attach.set(last, []); attach.get(last).push(k); }
    });
    listed.forEach((k) => { out.push(k); (attach.get(k) || []).forEach((u) => { out.push(u); }); });
    return out;
  }
  function paint(e) {
    const el = e.el;
    // Chrome: el.style 을 거친 뒤 속성만 지우면 outerHTML 에 style="" 가 되살아난다. 빈 값으로 한 번 덮어써 선언을 비운 뒤 지운다
    // CSSOM(el.style.setProperty)을 쓰면 background:var(--x) 같은 var() 단축 속성이 직렬화 때 망가진다(s4_plum).
    // 원문 속성 문자열 뒤에 선언을 덧붙여 원 선언을 그대로 지킨다. 값은 gapVal(정수)·COLOR_RE 로 이미 검증됐다.
    const add = [];
    if (e.gap && e.gap.top !== null) add.push('margin-top: ' + e.gap.top + 'px !important;');
    if (e.gap && e.gap.bottom !== null) add.push('margin-bottom: ' + e.gap.bottom + 'px !important;');
    if (e.bgc) add.push('background-color: ' + e.bgc + ' !important;');
    const base = e.origStyleAttr;
    if (!add.length) {
      if (base === null) { el.setAttribute('style', ''); el.removeAttribute('style'); } else el.setAttribute('style', base);
      return;
    }
    el.setAttribute('style', (base && base.trim() !== '' ? base.replace(/;?\s*$/, ';') + ' ' : '') + add.join(' '));
  }
  const secOf = (item) => { const r = curReg(); return r && typeof item === 'string' ? r.sections.get(item) : undefined; };

  Core.layout = {
    groups() { return lay ? lay.groups.map((g) => ({ id: g.id, keys: g.cur.slice() })) : []; },
    sequence() { const out = []; if (lay) lay.groups.forEach((g) => { g.cur.forEach((k) => { out.push(k); }); }); return out; },
    risk() {
      const s = state ? state.slug : '', cp = (m) => (Object.prototype.hasOwnProperty.call(m, s) ? m[s].slice() : []);
      return { order: cp(ORDER_RISK), bgNoEffect: cp(SECBG_NOEFFECT) };
    },
  };
  Core.moveSection = function (item, dir) {
    const e = secOf(item);
    if (!e || !e.group) return false;
    const g = e.group, i = g.cur.indexOf(item), n = g.cur.length;
    const to = dir === 'up' ? i - 1 : dir === 'down' ? i + 1 : dir === 'top' ? 0 : dir === 'bottom' ? n - 1 : -1;
    if (to < 0 || to >= n || to === i) return false;
    const keys = g.cur.slice();
    keys.splice(i, 1);
    keys.splice(to, 0, item);
    place(g, keys);
    return true;
  };
  const gapVal = (v) => {
    if (v === null) return null;
    const n = Math.round(Number(v));
    return v === undefined || v === '' || !Number.isFinite(n) ? undefined : Math.min(400, Math.max(0, n));
  };
  Core.setGap = function (item, g) {
    const e = secOf(item);
    if (!e || !g || typeof g !== 'object') return false;
    const nx = { top: e.gap ? e.gap.top : null, bottom: e.gap ? e.gap.bottom : null };
    ['top', 'bottom'].forEach((s) => { if (s in g) { const v = gapVal(g[s]); if (v !== undefined) nx[s] = v; } });
    e.gap = nx.top === null && nx.bottom === null ? null : nx;
    paint(e);
    return true;
  };
  Core.setSectionBg = function (item, color) {
    const e = secOf(item);
    if (!e) return false;
    if (color !== null && !(typeof color === 'string' && COLOR_RE.test(color))) return false;
    e.bgc = color === null ? null : color.toLowerCase();
    paint(e);
    return true;
  };
  Core.computedGap = function (item) {
    const e = secOf(item);
    if (!e) return null;
    const cs = (e.el.ownerDocument.defaultView || window).getComputedStyle(e.el), px = (v) => { const n = Math.round(parseFloat(v)); return Number.isFinite(n) ? n : 0; };
    return { top: px(cs.marginTop), bottom: px(cs.marginBottom) };
  };

  const orderChanged = (g) => g.cur.some((k, i) => k !== g.orig[i]);
  const baseInit = Core.init, baseIsChanged = Core.isChanged, baseRevert = Core.revert, baseCollect = Core.collect;
  Core.init = function (opts) {
    const first = !state, reg = baseInit(opts);
    if (!first) return reg;
    lay = { groups: buildGroups(reg) };
    const L = state.doc && typeof state.doc.layout === 'object' && state.doc.layout ? state.doc.layout : {};
    const arr = (a) => (Array.isArray(a) ? a.filter((x) => x && typeof x.k === 'string') : []);
    try {
      const listed = new Map();
      arr(L.sequence).forEach((x) => {
        const e = reg.sections.get(x.k);
        if (!e) { reg.orphans.push({ kind: 'order', k: x.k, o: '' }); return; }
        const a = listed.get(e.group) || [];
        if (a.indexOf(x.k) < 0) a.push(x.k);
        listed.set(e.group, a);
      });
      listed.forEach((a, g) => { place(g, mergeSeq(g.orig, a)); });
    } catch { /* 순서 적용 실패는 원래 순서 유지 */ }
    arr(L.gaps).forEach((x) => { try { if (!Core.setGap(x.k, x)) reg.orphans.push({ kind: 'gap', k: x.k, o: '' }); } catch { /* 건너뜀 */ } });
    arr(L.secbg).forEach((x) => { try { if (!Core.setSectionBg(x.k, x.color)) reg.orphans.push({ kind: 'secbg', k: x.k, o: '' }); } catch { /* 건너뜀 */ } });
    return reg;
  };
  Core.isChanged = function (kind, key) {
    if (kind === 'layout') return Core.isChanged('order') || (curReg() ? Array.from(curReg().sections.keys()).some((k) => Core.isChanged('gap', k) || Core.isChanged('secbg', k)) : false);
    if (kind === 'order' && key === undefined) return !!lay && lay.groups.some(orderChanged);
    if (kind === 'order' || kind === 'gap' || kind === 'secbg') {
      const e = secOf(key);
      if (!e) return false;
      return kind === 'order' ? e.group.cur.indexOf(key) !== e.group.orig.indexOf(key) : kind === 'gap' ? !!e.gap : !!e.bgc;
    }
    return baseIsChanged(kind, key);
  };
  Core.revert = function (kind, key) {
    if (kind === 'gap') return Core.setGap(key, { top: null, bottom: null });
    if (kind === 'secbg') return Core.setSectionBg(key, null);
    if (kind === 'order') { // key = 섹션 키 또는 묶음 id: 그 묶음 전체를 원래 순서로
      const e = secOf(key), g = e ? e.group : lay && lay.groups.find((x) => x.id === key);
      if (!g) return false;
      place(g, g.orig);
      return true;
    }
    if (kind === 'layout') {
      if (!lay) return false;
      lay.groups.forEach((g) => { place(g, g.orig); });
      curReg().sections.forEach((e, k) => { Core.setGap(k, { top: null, bottom: null }); Core.setSectionBg(k, null); });
      return true;
    }
    return baseRevert(kind, key);
  };
  Core.collect = function () {
    const out = baseCollect(), r = curReg();
    if (!r || !lay) return out;
    const L = state.doc && state.doc.layout && typeof state.doc.layout === 'object' ? state.doc.layout : {};
    const orph = (a) => (Array.isArray(a) ? a.filter((x) => x && typeof x.k === 'string' && !r.sections.has(x.k)).map((x) => JSON.parse(JSON.stringify(x))) : []);
    const seq = [], gaps = [], bgs = [];
    lay.groups.forEach((g) => { if (orderChanged(g)) g.cur.forEach((k) => { seq.push({ k }); }); });
    r.sections.forEach((e, k) => {
      if (e.gap) gaps.push({ k, top: e.gap.top, bottom: e.gap.bottom });
      if (e.bgc) bgs.push({ k, color: e.bgc });
    });
    const lo = {};
    const s2 = seq.concat(orph(L.sequence)), g2 = gaps.concat(orph(L.gaps)), b2 = bgs.concat(orph(L.secbg));
    if (s2.length) lo.sequence = s2;
    if (g2.length) lo.gaps = g2;
    if (b2.length) lo.secbg = b2;
    if (Object.keys(lo).length) out.layout = lo;
    return out;
  };
  /* ==== end region: layout ==== */

  /* ==== region: viewer ==== */
  // 뷰어 부트스트랩: 공개 수정 문서를 받아 적용한다. 어떤 결과(성공·오류·시간 초과)에서도 안티플래시 스타일을 걷고, 페이지로 예외를 던지지 않는다.
  function unhide() {
    try { const h = document.getElementById('de-hide'); if (h && h.parentNode) h.parentNode.removeChild(h); } catch { /* 무시 */ }
  }
  function bootViewer() {
    let done = false, timer = 0, ctl = null;
    const finish = (why) => {
      if (done) return; done = true;
      if (timer) clearTimeout(timer);
      if (ctl) { try { ctl.abort(); } catch { /* 무시 */ } }
      unhide();
      if (why) { try { console.debug('[detail-edit] ' + why); } catch { /* 무시 */ } }
    };
    try {
      const cs = document.currentScript;
      const attr = (n) => (cs && cs.getAttribute ? cs.getAttribute(n) : null);
      if (attr('data-mode') === 'edit') return; // 편집기가 init 을 직접 부른다
      const slug = slugOf();
      if (!Object.prototype.hasOwnProperty.call(SECTION_SELECTORS, slug)) { finish(); return; }
      let base = attr('data-api') || location.origin;
      base = String(base).replace(/\/+$/, '');
      if (typeof fetch !== 'function') { finish('fetch 없음'); return; }
      ctl = typeof AbortController === 'function' ? new AbortController() : null;
      timer = setTimeout(() => finish('시간 초과'), 4000);
      fetch(base + '/api/detail-edits/' + slug, { credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((doc) => {
          if (done) return; // 시간 초과 뒤에 온 응답은 적용하지 않는다
          if (!doc || typeof doc !== 'object') throw new Error('문서 형식');
          Core.init({ doc, mode: 'view' });
          finish();
        })
        .catch((e) => finish('적용 안 함: ' + (e && e.message ? e.message : e)));
    } catch { finish('부트스트랩 실패'); }
  }
  /* ==== end region: viewer ==== */

  /* ==== region: expose ==== */
  window.DetailEditCore = Core;
  bootViewer();
  Object.freeze(Core);
  /* ==== end region: expose ==== */
})();
