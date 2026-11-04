// 코어 훑기(키·글 블록·이미지·CSS 배경·섹션·orphan) 단위 테스트 — jsdom 으로 DOM 논리만 본다(화면 배치 의존은 Playwright 스크립트 몫).
// 실제 11개 시안 측정과 IDENTITY 는 .moai/cache/detail-edit/e2e/core/scan-layout.mjs 가 크롬에서 한다.
import { describe, expect, it } from 'vitest';
import { loadCore } from './load-core';

interface Block { el: Element; tag: string; run: number | null; nodes: Node[] | null; origText: string; origHtml: string; origStyleAttr: string | null }
interface Img { el: Element; origSrc: string; hadSrc: boolean; origAlt: string | null; origSrcset: string | null; origSizes: string | null }
interface Bg { el: Element; origUrl: string; origPath: string; layer: number; layers: number; origInline: string; origStyleAttr: string | null }
interface Sec { el: Element; kind: string; index: number; label: string; origDisplay: string; origStyleAttr: string | null }
interface Orphan { kind: string; k: string; o: string }
interface Registry { blocks: Map<string, Block>; images: Map<string, Img>; bgs: Map<string, Bg>; sections: Map<string, Sec>; orphans: Orphan[] }
interface CoreApi { init(o?: Record<string, unknown>): Registry; registry(): Registry | null; sanitize(h: string): string }

function boot(body: string, o: { head?: string; url?: string; init?: Record<string, unknown> } = {}) {
  const win = loadCore(`<!doctype html><html><head>${o.head ?? ''}</head><body>${body}</body></html>`, o.url);
  const core = win.DetailEditCore as unknown as CoreApi;
  const reg = core.init(o.init ?? { doc: {}, mode: 'view' });
  return { win, core, reg, document: win.document };
}

// 독립 구현(키 검증용): 정규화 + 공개 cyrb53
const refNorm = (s: string) => s.normalize('NFC').replace(/[ ⁠​]/g, '').replace(/\s+/g, ' ').trim();
function refCyrb53(str: string): number {
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
const h36 = (s: string) => refCyrb53(s).toString(36).padStart(4, '0');
const hashOf = (key: string) => key.split(':')[1];
const blocks = (reg: Registry) => Array.from(reg.blocks.values());
const summary = (reg: Registry) => blocks(reg).map((b) => `${b.tag}${b.run === null ? '' : '#' + b.run}:${b.origText}`);

describe('키: 정규화와 해시', () => {
  it('cyrb53 알려진 값이 키에 그대로 반영된다', () => {
    const { reg } = boot('<p>a</p><p>b</p>');
    expect(Array.from(reg.blocks.keys())).toEqual([`t:${(7929297801672961).toString(36)}:0`, `t:${(8684336938537663).toString(36)}:0`]);
  });

  it('키 모양은 계약 정규식을 지킨다(해시는 4자리까지 0 으로 채운다)', () => {
    const { reg } = boot('<h1>가나다</h1><img src="x.jpg"><div class="wrap"><section>본문</section></div>');
    const all = [...reg.blocks.keys(), ...reg.images.keys(), ...reg.sections.keys()];
    expect(all.length).toBeGreaterThan(2);
    all.forEach((k) => expect(k).toMatch(/^(t|i|b|s):[0-9a-z]{4,16}:[0-9]{1,4}$/));
  });

  it('공백·NBSP·ZWSP·WJ·NFC 차이는 같은 해시, 글이 다르면 다른 해시', () => {
    const { reg } = boot('<p>  가   나\n다 </p><p>가 나 다</p><p>가​나⁠ 다</p><p>가 나 다</p><p>가 나 다</p><p>가 나 라</p>');
    const hs = Array.from(reg.blocks.keys()).map(hashOf);
    expect(hs[0]).toBe(hs[1]);
    expect(hs[0]).toBe(h36('가 나 다'));
    expect(hs[2]).toBe(h36('가나 다')); // 제거는 삭제다(공백으로 바꾸지 않는다)
    expect(hs[3]).toBe(h36('가나 다'));
    expect(hs[4]).toBe(hs[0]); // 분해형 '가' 는 NFC 로 합쳐진다
    expect(hs[5]).not.toBe(hs[0]);
    expect(blocks(reg)[0].origText).toBe(refNorm('  가   나\n다 '));
  });

  it('같은 글이 반복되면 문서 순서대로 등장 번호 0,1,2 가 붙는다', () => {
    const { reg } = boot('<p>같은 글</p><p>다른 글</p><div><p>같은 글</p></div><section><h2>같은 글</h2></section>');
    const keys = Array.from(reg.blocks.keys());
    const h = h36('같은 글');
    expect(keys).toEqual([`t:${h}:0`, `t:${h36('다른 글')}:0`, `t:${h}:1`, `t:${h}:2`]);
    expect(reg.blocks.get(`t:${h}:2`)!.tag).toBe('H2');
  });

  it('다시 훑어도(새 창) 키가 같고, 두 번째 init 은 DOM 이 바뀐 뒤에도 같은 레지스트리를 준다', () => {
    const html = '<h1>제목</h1><p>본문 <b>굵게</b></p><p>본문 <b>굵게</b></p><img src="a.jpg"><img src="a.jpg">';
    const a = boot(html), b = boot(html);
    expect(Array.from(a.reg.blocks.keys())).toEqual(Array.from(b.reg.blocks.keys()));
    expect(Array.from(a.reg.images.keys())).toEqual(Array.from(b.reg.images.keys()));
    a.document.querySelector('h1')!.textContent = '완전히 다른 글';
    const again = a.core.init({ doc: {}, mode: 'edit' });
    expect(again).toBe(a.reg);
    expect(a.core.registry()).toBe(a.reg);
    expect(Array.from(again.blocks.keys())).toEqual(Array.from(b.reg.blocks.keys()));
  });

  it('훑기는 DOM 을 바꾸지 않는다(편집 모드의 배경·섹션 훑기 포함)', () => {
    const win = loadCore('<!doctype html><html><head><style>.l{background-image:url(a.jpg)}</style></head><body><div class="wrap"><section><p class="l">글 <b>x</b></p><img src="a.jpg"><div>둘<svg><text>t</text></svg>셋</div></section></div></body></html>');
    const before = win.document.documentElement.outerHTML;
    const reg = (win.DetailEditCore as unknown as CoreApi).init({ doc: {}, mode: 'edit' });
    expect(reg.blocks.size).toBeGreaterThan(1);
    expect(reg.bgs.size).toBe(1);
    expect(reg.sections.size).toBe(1);
    expect(win.document.documentElement.outerHTML).toBe(before);
  });
});

describe('글 블록: 판정 규칙(계약 3.2)', () => {
  const cases: Array<[string, string, string[]]> = [
    ['phrasing 은 글을 품은 부모까지 올라간다', '<li><b>제목</b> 설명</li>', ['LI:제목 설명']],
    ['깊은 phrasing 중첩도 한 블록', '<p>앞 <b>굵게 <i>기울임</i></b> 뒤</p>', ['P:앞 굵게 기울임 뒤']],
    ['요소 자식이 전부 phrasing 이면 부모가 루트(빈 장식 요소 포함)', '<div class="rule"><i></i><b>◆</b><i></i></div>', ['DIV:◆']],
    ['br 은 글자가 아니다', '<h2>가<br>나</h2>', ['H2:가나']],
    ['글을 품지 않은 부모에서는 phrasing 에서 멈춘다', '<div><span>a</span><div>b</div></div>', ['SPAN:a', 'DIV:b']],
    ['공백·NBSP·ZWSP 뿐인 글자 노드는 블록이 아니다', '<p>&nbsp; \n</p><p>​</p><p> </p>', []],
    ['a 안의 span 도 같은 규칙', '<div><a href="x"><span>링크</span></a></div>', ['DIV:링크']],
    ['body 바로 아래 phrasing 은 body 까지 올라가지 않는다', '<span>떠 있는 글</span>', ['SPAN:떠 있는 글']],
    ['표 셀', '<table><tbody><tr><th>머리</th><td>값 <small>단위</small></td></tr></tbody></table>', ['TH:머리', 'TD:값 단위']],
    ['details/summary', '<details open><summary>질문 <em>?</em></summary><p>답</p></details>', ['SUMMARY:질문 ?', 'P:답']],
  ];
  cases.forEach(([name, html, want]) => {
    it(name, () => { expect(summary(boot(html).reg)).toEqual(want); });
  });

  it('블록 항목에 원본 html·텍스트·style 속성·태그가 담긴다', () => {
    const { reg } = boot('<p class="k" style="color:red">앞 <b>굵게</b> &amp; 뒤</p>');
    const b = blocks(reg)[0];
    expect(b.tag).toBe('P');
    expect(b.origHtml).toBe('앞 <b>굵게</b> &amp; 뒤');
    expect(b.origText).toBe('앞 굵게 & 뒤');
    expect(b.origStyleAttr).toBe('color:red');
    expect(b.run).toBeNull();
    expect(b.nodes).toBeNull();
  });
});

describe('혼합 루트(run)와 건너뛰기', () => {
  it('비-phrasing 자식이 있으면 직계 글·phrasing 구간마다 블록이 되고 run 번호가 붙는다', () => {
    const { reg } = boot('<div class="ex">앞 글 <b>굵게</b><img src="a.jpg"><span>뒤 글</span><p>문단</p>끝</div>');
    expect(summary(reg)).toEqual(['DIV#0:앞 글 굵게', 'DIV#1:뒤 글', 'P:문단', 'DIV#2:끝']);
    const [r0, r1, p, r2] = blocks(reg);
    expect(r0.el).toBe(r1.el);
    expect(r0.el.className).toBe('ex');
    expect(r0.origHtml).toBe('앞 글 <b>굵게</b>');
    expect(r1.origHtml).toBe('<span>뒤 글</span>');
    expect(r2.origHtml).toBe('끝');
    expect(r0.nodes).toHaveLength(2);
    expect(r0.origStyleAttr).toBeNull();
    expect(p.run).toBeNull();
    expect(p.el.tagName).toBe('P');
  });

  it('글 없는 구간은 버리고 run 번호는 남은 구간끼리 센다', () => {
    const { reg } = boot('<div>  <img src="a.jpg"> <img src="b.jpg">첫 글<img src="c.jpg"> </div><div><p>a</p> <p>b</p></div>');
    expect(summary(reg)).toEqual(['DIV#0:첫 글', 'P:a', 'P:b']);
  });

  it('주석은 구간을 끊는다(주석이 블록 html 에 들어가지 않는다)', () => {
    const { reg } = boot('<div>앞<!-- c -->뒤<p>문단</p></div>');
    expect(summary(reg)).toEqual(['DIV#0:앞', 'DIV#1:뒤', 'P:문단']);
    blocks(reg).forEach((b) => expect(b.origHtml).not.toContain('<!--'));
  });

  it('블록은 문서 순서: 혼합 루트의 뒤쪽 run 은 안쪽 블록 뒤에 온다', () => {
    expect(summary(boot('<div><div>안</div>밖</div>').reg)).toEqual(['DIV:안', 'DIV#0:밖']);
    expect(summary(boot('<div>밖<div>안</div></div>').reg)).toEqual(['DIV#0:밖', 'DIV:안']);
  });

  it('svg·script·style·noscript·template·iframe·canvas·object·embed·math 와 [data-de-skip] 아래는 훑지 않는다', () => {
    const { reg } = boot(
      '<svg><text>t</text><image href="x"/></svg><script>var a="s"</script><style>.a{}</style><noscript>n</noscript>' +
      '<template><p>tp</p><img src="t.jpg"></template><iframe>f</iframe><canvas>c</canvas><object>o</object><embed><math><mi>m</mi></math>' +
      '<div data-de-skip><p>건너뜀</p><img src="s.jpg"></div><p>남는 글</p><img src="k.jpg">',
    );
    expect(summary(reg)).toEqual(['P:남는 글']);
    expect(Array.from(reg.images.values()).map((i) => i.origSrc)).toEqual(['k.jpg']);
  });

  it('건너뛸 요소가 낀 블록은 그 요소를 뺀 글만 센다', () => {
    expect(summary(boot('<p>A<span data-de-skip>X</span>B</p>').reg)).toEqual(['P#0:A', 'P#1:B']);
    expect(summary(boot('<p>가<svg><text>zz</text></svg></p>').reg)).toEqual(['P#0:가']);
    expect(summary(boot('<p>가<code>x</code></p>').reg)).toEqual(['P:가x']);
  });

  it('블록 html 은 허용 목록 안의 서식이면 IDENTITY 가 성립하고, 허용 밖 속성이면 깨진다(측정이 잡아내는 형태)', () => {
    const ok = boot('<p>따옴표 <q>\'</q>참<q>\'</q></p><h2 class="t">제목<br><span style="color:#aa3322">색</span></h2>');
    blocks(ok.reg).forEach((b) => expect(ok.core.sanitize(b.origHtml)).toBe(b.origHtml));
    const bad = boot('<p>글 <span data-x="1">속성</span></p>');
    const b = blocks(bad.reg)[0];
    expect(bad.core.sanitize(b.origHtml)).not.toBe(b.origHtml);
  });
});

describe('이미지', () => {
  it('키는 작성된 src 속성 문자열 기준이고 같은 src 는 등장 번호가 붙는다', () => {
    const { reg } = boot('<img src="assets/a.jpg"><img src="assets/a.jpg" alt="설명"><img src="./b.jpg" srcset="b.jpg 1x" sizes="50vw"><img>');
    const keys = Array.from(reg.images.keys());
    expect(keys).toEqual([`i:${h36('assets/a.jpg')}:0`, `i:${h36('assets/a.jpg')}:1`, `i:${h36('./b.jpg')}:0`, `i:${h36('')}:0`]);
    const [a0, a1, b, none] = Array.from(reg.images.values());
    expect(a0.origSrc).toBe('assets/a.jpg'); // 풀린 주소(https://…)가 아니라 작성된 값
    expect((a0.el as HTMLImageElement).src).toMatch(/^https:\/\//);
    expect(a0.origAlt).toBeNull();
    expect(a1.origAlt).toBe('설명');
    expect(b.origSrcset).toBe('b.jpg 1x');
    expect(b.origSizes).toBe('50vw');
    expect(none.hadSrc).toBe(false);
    expect(none.origSrc).toBe('');
  });
});

describe('CSS 배경 이미지', () => {
  const head =
    '<style>.lens{background-image:url(assets/04_dna.jpg)} .g{background-image:linear-gradient(red,blue)}' +
    ' .q{background-image:linear-gradient(red,blue),url("gen/c1.jpg")} .abs{background-image:url(https://cdn.example.test/assets/04_dna.jpg)}</style>';
  const body = '<div class="lens"></div><div class="g"></div><div class="q"></div><div style="background-image:url(gen/b2.jpg)"></div>';

  it('편집 모드는 url 이 있는 요소만 잡고(그라데이션만이면 제외), 겹겹이 목록에서 url 층 위치를 기록한다', () => {
    const { reg } = boot(body, { head, init: { doc: {}, mode: 'edit' } });
    const list = Array.from(reg.bgs.values());
    expect(list.map((b) => b.el.className || 'inline')).toEqual(['lens', 'q', 'inline']);
    expect(list[0]).toMatchObject({ origUrl: 'https://concepts.example.test/assets/04_dna.jpg', origPath: '/assets/04_dna.jpg', layer: 0, layers: 1, origInline: '' });
    expect(list[1]).toMatchObject({ origPath: '/gen/c1.jpg', layer: 1, layers: 2 });
    expect(list[2]).toMatchObject({ origPath: '/gen/b2.jpg', origStyleAttr: 'background-image:url(gen/b2.jpg)' });
    expect(list[2].origInline).toContain('gen/b2.jpg');
    expect(Array.from(reg.bgs.keys())[0]).toBe(`b:${h36('/assets/04_dna.jpg')}:0`);
  });

  it('키는 출처를 뗀 pathname+search 로 만든다: 상대·절대·다른 출처가 같은 키', () => {
    const rel = boot('<div class="lens"></div>', { head, init: { doc: {}, mode: 'edit' } });
    const abs = boot('<div class="abs"></div>', { head, init: { doc: {}, mode: 'edit' }, url: 'http://127.0.0.1:4301/s7_black' });
    expect(Array.from(abs.reg.bgs.keys())).toEqual(Array.from(rel.reg.bgs.keys()));
    const q = boot('<div style="background-image:url(https://a.example.test/x.jpg?v=2#top)"></div>', { init: { doc: {}, mode: 'edit' } });
    expect(Array.from(q.reg.bgs.values())[0].origPath).toBe('/x.jpg?v=2');
  });

  it('같은 배경 url 이 반복되면 등장 번호가 붙는다', () => {
    const { reg } = boot('<div class="lens"></div><p>사이</p><div class="lens"></div>', { head, init: { doc: {}, mode: 'edit' } });
    const h = h36('/assets/04_dna.jpg');
    expect(Array.from(reg.bgs.keys())).toEqual([`b:${h}:0`, `b:${h}:1`]);
  });

  it('보기 모드는 문서에 bgs 가 있을 때만 훑는다', () => {
    const none = boot(body, { head, init: { doc: { bgs: [] }, mode: 'view' } });
    expect(none.reg.bgs.size).toBe(0);
    const some = boot(body, { head, init: { doc: { bgs: [{ k: 'b:zzzz:0', src: 'x' }] }, mode: 'view' } });
    expect(some.reg.bgs.size).toBe(3);
    expect(some.reg.orphans).toEqual([{ kind: 'bg', k: 'b:zzzz:0', o: '' }]);
  });
});

describe('섹션', () => {
  const wrap =
    '<div class="wrap"><section id="s01"><h2>제목<br>하나</h2><p>본문</p></section>' +
    '<section id="s01" style="margin:4px"><h3>둘째 섹션</h3></section>' +
    '<section id="s01"><h2>제목<br>하나</h2><p>본문</p></section></div><section>밖의 섹션</section>';

  it('페이지 주소의 slug 로 선택자를 고르고(id 는 쓰지 않는다) 문서 순서·라벨·원본 값을 담는다', () => {
    const { reg } = boot(wrap);
    const list = Array.from(reg.sections.values());
    expect(list).toHaveLength(3); // .wrap > section 만
    expect(list.map((s) => s.index)).toEqual([0, 1, 2]);
    expect(list.map((s) => s.label)).toEqual(['제목 하나', '둘째 섹션', '제목 하나']);
    expect(list.every((s) => s.kind === 'section')).toBe(true);
    expect(list[1].origStyleAttr).toBe('margin:4px');
    expect(list[0].origStyleAttr).toBeNull();
    expect(list[0].origDisplay).toBe('');
  });

  it('섹션 키는 섹션 글(정규화)의 해시이고 글이 같은 섹션은 등장 번호가 붙는다(중복 id 와 무관)', () => {
    const { reg } = boot(wrap);
    const h = h36(refNorm('제목하나본문'));
    expect(Array.from(reg.sections.keys())).toEqual([`s:${h}:0`, `s:${h36('둘째 섹션')}:0`, `s:${h}:1`]);
  });

  it('선택자는 slug 별이고, 지도에 없는 페이지는 섹션이 없다', () => {
    const s1 = boot('<div class="page"><section><h1>하나</h1></section><footer>끝</footer></div><section>밖</section>', { url: 'https://c.test/s1_gift' });
    expect(Array.from(s1.reg.sections.values()).map((s) => s.label)).toEqual(['하나', '끝']);
    const s8 = boot('<div class="page"><section><h2>a</h2></section><div class="band">띠</div><div class="flow">흐름</div><div class="end">마감</div><div class="other">x</div></div>', { url: 'https://c.test/admin/detail-concepts/edit/s8_copy' });
    expect(Array.from(s8.reg.sections.values()).map((s) => s.label)).toEqual(['a', '띠', '흐름', '마감']);
    const unknown = boot(wrap, { url: 'https://c.test/unknown.html' });
    expect(unknown.reg.sections.size).toBe(0);
    const forced = boot(wrap, { url: 'https://c.test/unknown.html', init: { doc: {}, mode: 'view', sectionSelector: 'section' } });
    expect(forced.reg.sections.size).toBe(4);
  });

  it('라벨: 첫 제목(br 은 공백), 제목이 없으면 글, 40자로 자른다', () => {
    const long = '가'.repeat(60);
    const { reg } = boot(`<div class="wrap"><section><p>앞 문단</p><h3>${long}</h3></section><section><p>제목 없는 <b>섹션</b> 글</p></section><section><h2> </h2><p>빈 제목</p></section></div>`);
    const labels = Array.from(reg.sections.values()).map((s) => s.label);
    expect(labels[0]).toBe('가'.repeat(40));
    expect(labels[1]).toBe('제목 없는 섹션 글');
    expect(labels[2]).toBe('빈 제목');
  });
});

describe('orphan', () => {
  it('문서에 있고 레지스트리에 없는 키만 고아가 된다(종류·키·발췌 보존, 클론 접두어 키와 잘못된 항목은 제외)', () => {
    const base = boot('<div class="wrap"><section><h2>제목</h2><p>본문</p></section></div><img src="a.jpg">');
    const t = Array.from(base.reg.blocks.keys())[0];
    const i = Array.from(base.reg.images.keys())[0];
    const s = Array.from(base.reg.sections.keys())[0];
    const doc = {
      texts: [{ k: t, o: '제목' }, { k: 't:zzzz:0', o: '사라진 글' }, null, { o: '키 없음' }, { k: 'c1!t:zzzz:0', o: '클론' }],
      images: [{ k: i }, { k: 'i:zzzz:3' }],
      bgs: [{ k: 'b:zzzz:0', o: 'old.jpg' }],
      hidden: [{ k: s, o: '제목' }, { k: 's:zzzz:0', o: '사라진 섹션' }],
    };
    const { reg } = boot('<div class="wrap"><section><h2>제목</h2><p>본문</p></section></div><img src="a.jpg">', { init: { doc, mode: 'view' } });
    expect(reg.orphans).toEqual([
      { kind: 'text', k: 't:zzzz:0', o: '사라진 글' },
      { kind: 'image', k: 'i:zzzz:3', o: '' },
      { kind: 'bg', k: 'b:zzzz:0', o: 'old.jpg' },
      { kind: 'hidden', k: 's:zzzz:0', o: '사라진 섹션' },
    ]);
  });

  it('문서가 비어 있으면 고아도 없다', () => {
    expect(boot('<p>글</p>', { init: { doc: {}, mode: 'view' } }).reg.orphans).toEqual([]);
    expect(boot('<p>글</p>', { init: { mode: 'view' } }).reg.orphans).toEqual([]);
  });
});
