import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UPSTREAM_MAX_BYTES,
  buildEditCsp,
  fetchConceptHtml,
  transformConceptHtml,
} from '../edit-page';
import { DETAIL_SLUGS } from '../pages';

const CONCEPT = 'https://daeracheon-detail-concepts.vercel.app';
const SCRIPTS = 'https://zoellife.com';
const opts = { slug: 's7_black', conceptOrigin: CONCEPT, scriptOrigin: SCRIPTS };

const HEAD_INJECTION =
  `<base href="${CONCEPT}/"><meta name="robots" content="noindex,nofollow"><meta name="de-page" content="s7_black">`;
const BODY_INJECTION =
  `<script src="${SCRIPTS}/detail-edit/apply.js" data-mode="edit" data-api="${SCRIPTS}"></script>` +
  `<script src="${SCRIPTS}/detail-edit/editor.js"></script>`;

const t = (html: string) => transformConceptHtml(html, opts);
const scriptTags = (html: string) => html.match(/<script\b/gi) ?? [];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('CSP', () => {
  it('운영(https 시안 오리진): 계약 §4 문자열 + img-src·media-src 의 시안 오리진(분석 트랙 보정)', () => {
    expect(buildEditCsp(CONCEPT)).toBe(
      "default-src 'none'; script-src 'self'; " +
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net ${CONCEPT}; ` +
        `font-src ${CONCEPT} https://fonts.gstatic.com https://cdn.jsdelivr.net data:; ` +
        `img-src https: data: blob: ${CONCEPT}; media-src https: ${CONCEPT}; ` +
        `connect-src 'self'; base-uri ${CONCEPT}; form-action 'none'; object-src 'none'; frame-ancestors 'self'`,
    );
  });
  it('http 시안 오리진(로컬 E2E)에서도 img-src·media-src·base-uri 가 그 오리진을 가리킨다', () => {
    const csp = buildEditCsp('http://127.0.0.1:4101');
    expect(csp).toContain('img-src https: data: blob: http://127.0.0.1:4101;');
    expect(csp).toContain('media-src https: http://127.0.0.1:4101;');
    expect(csp).toContain('base-uri http://127.0.0.1:4101;');
    expect(csp).toContain('font-src http://127.0.0.1:4101 ');
  });
  it('스크립트는 같은 오리진만, 연결은 같은 오리진만, 폼·객체·프레임 조상은 닫혀 있다', () => {
    const directives = new Map(
      buildEditCsp(CONCEPT)
        .split('; ')
        .map((d) => [d.split(' ')[0], d.slice(d.indexOf(' ') + 1)] as const),
    );
    expect(directives.get('default-src')).toBe("'none'");
    expect(directives.get('script-src')).toBe("'self'"); // 'unsafe-inline' 없음 — 인라인 스크립트는 실행되지 않는다
    expect(directives.get('connect-src')).toBe("'self'");
    expect(directives.get('form-action')).toBe("'none'");
    expect(directives.get('object-src')).toBe("'none'");
    expect(directives.get('frame-ancestors')).toBe("'self'");
  });
});

describe('transformConceptHtml — 주입', () => {
  const page =
    '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>시안</title>' +
    '<link rel="stylesheet" href="assets/a.css"></head><body><h1>제목</h1><p>본문</p></body></html>';

  it('<head> 의 첫 자식으로 base·robots·de-page 를, </body> 앞에 절대 URL 스크립트 2개를 넣는다', () => {
    const out = t(page);
    expect(out).toContain(`<head>${HEAD_INJECTION}<meta charset="utf-8">`);
    expect(out).toContain(`<p>본문</p>${BODY_INJECTION}</body>`);
    expect(out.indexOf('<base')).toBeLessThan(out.indexOf('<meta charset'));
    expect(scriptTags(out)).toHaveLength(2);
    // 주입물을 빼면 원본과 같다 (그 밖의 것은 건드리지 않는다)
    expect(out.replace(HEAD_INJECTION, '').replace(BODY_INJECTION, '')).toBe(page);
  });

  it('스크립트 주소는 루트 상대가 아니라 요청 오리진의 절대 URL', () => {
    const out = t(page);
    expect(out).not.toMatch(/src="\/detail-edit/);
    expect(out).toContain(`src="${SCRIPTS}/detail-edit/apply.js" data-mode="edit" data-api="${SCRIPTS}"`);
    expect(out).toContain(`src="${SCRIPTS}/detail-edit/editor.js"`);
  });

  it('<head> 가 없는 문서도 base 가 본문보다 앞에 오고, </body> 가 없으면 끝에 붙는다', () => {
    const out = t('<!doctype html><h1>x</h1>');
    expect(out.indexOf('<base')).toBeLessThan(out.indexOf('<h1>'));
    expect(out.startsWith('<!doctype html><base')).toBe(true);
    expect(out.endsWith(BODY_INJECTION)).toBe(true);
    const out2 = t('<html><body>x');
    expect(out2).toBe(`<html>${HEAD_INJECTION}<body>x${BODY_INJECTION}`);
  });

  it('마지막 </body> 앞에 넣는다', () => {
    const out = t('<body>a</body>\n<body>b</body>');
    expect(out.endsWith(`b${BODY_INJECTION}</body>`)).toBe(true);
  });

  it('속성값은 이스케이프한다', () => {
    const out = transformConceptHtml('<head></head><body></body>', {
      slug: 'a"><script>x</script>',
      conceptOrigin: 'http://h"x',
      scriptOrigin: 'http://s"y',
    });
    expect(out).not.toContain('<script>x');
    expect(out).toContain('&quot;');
  });
});

describe('transformConceptHtml — 제거', () => {
  it('모든 script 요소를 내용째 제거 (대소문자·공백·속성 변형 포함)', () => {
    const variants = [
      '<script>alert(1)</script>',
      '<SCRIPT>alert(1)</SCRIPT>',
      '<script\n>alert(1)</script\n>',
      '<script src="https://evil.test/x.js"></script>',
      "<script type='module'>import('x')</script>",
      '<script/src=//evil.test></script>',
      '<script>var a="</scr"+"ipt>"</script>',
      '<script>/*</script>*/</script>',
      '<ScRiPt >alert(1)</ScRiPt foo=bar>',
    ];
    for (const v of variants) {
      const out = t(`<head></head><body>A${v}B</body>`);
      expect(scriptTags(out), v).toHaveLength(2); // 우리가 넣은 2개뿐
      expect(out, v).not.toContain('alert(1)');
      expect(out, v).not.toContain('evil.test');
      expect(out, v).toContain('A');
    }
  });

  it('끝나지 않은 script 는 문서 끝까지를 버린다 (브라우저와 같은 해석)', () => {
    const out = t('<head></head><body>A<script>alert(1)</body>');
    expect(out).not.toContain('alert(1)');
    expect(scriptTags(out)).toHaveLength(2);
  });

  it('script 안의 </script 변형(이중 이스케이프 사양 차이)에서도 실행 코드가 남지 않는다', () => {
    const out = t('<head></head><body><script><!-- <script> </script> --> alert(1) </script>after</body>');
    // 남는 것은 글자뿐이며 실행 가능한 script 는 우리 것 2개 뿐이다.
    expect(scriptTags(out)).toHaveLength(2);
    expect(out).toContain('alert(1)'); // 글자로만 남는다 (아래에서 문맥 확인)
    expect(out).not.toMatch(/<script>[^<]*alert/);
  });

  it('on* 이벤트 핸들러 속성 제거 — 따옴표·무따옴표·슬래시 구분·대소문자', () => {
    const cases: Array<[string, RegExp]> = [
      ['<img src=a.jpg onerror=alert(1)>', /onerror/i],
      ['<img src="a.jpg" onerror="alert(1)" alt="x">', /onerror/i],
      ["<a href='#' ONCLICK='alert(1)'>x</a>", /onclick/i],
      ['<svg onload=alert(1)><circle/></svg>', /onload/i],
      ['<body onload=alert(1)>', /onload/i],
      ['<div/onmouseover=alert(1)>x</div>', /onmouseover/i],
      ['<img src="a"onerror=alert(1)>', /onerror/i],
      ['<div onclick = "alert(1)">x</div>', /onclick/i],
      ['<input autofocus onfocus=alert(1)>', /onfocus/i],
      ['<iframe srcdoc="<script>alert(1)</script>"></iframe>', /srcdoc/i],
    ];
    for (const [html, bad] of cases) {
      const out = t(`<head></head>${html}`);
      expect(out, html).not.toMatch(bad);
      expect(out, html).not.toContain('alert(1)');
    }
  });

  it('on* 가 아닌 속성은 원문 그대로 유지', () => {
    const out = t('<head></head><img src="a.jpg" alt="on sale" class="one" data-online=1 onclick="x" width=10>');
    expect(out).toContain('<img src="a.jpg" alt="on sale" class="one" data-online=1 width=10>');
  });

  it('속성값 안의 > 는 태그를 끝내지 않는다', () => {
    const out = t('<head></head><a title="a>b" onclick="x" href="y">z</a>');
    expect(out).toContain('<a title="a>b" href="y">z</a>');
  });

  it('<base> 제거 (여러 개·변형)', () => {
    const out = t('<head><base href="https://evil.test/"><BASE target=_top></head>');
    expect(out.match(/<base\b/gi)).toHaveLength(1);
    expect(out).toContain(`<base href="${CONCEPT}/">`);
    expect(out).not.toContain('evil.test');
  });

  it('meta refresh 제거 (대소문자·공백·문자 참조)', () => {
    for (const m of [
      '<meta http-equiv="refresh" content="0;url=https://evil.test">',
      '<META HTTP-EQUIV=Refresh CONTENT="0;url=//evil.test">',
      '<meta http-equiv=" refresh " content="1">',
      '<meta http-equiv="re&#102;resh" content="0;url=//evil.test">',
      '<meta http-equiv="&#x72;efresh" content="0;url=//evil.test">',
    ]) {
      const out = t(`<head>${m}<meta name="viewport" content="width=device-width"></head>`);
      expect(out, m).not.toMatch(/refresh/i);
      expect(out, m).not.toContain('evil.test');
      expect(out, m).toContain('<meta name="viewport" content="width=device-width">');
    }
  });

  it('다른 meta 는 보존', () => {
    const out = t('<head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>');
    expect(out).toContain('<meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge">');
  });

  it('뷰어 스니펫(<!--de:begin-->…<!--de:end-->)과 #de-hide 스타일 제거', () => {
    const snippet =
      '<!--de:begin--><style id="de-hide">html{visibility:hidden}</style>' +
      "<script>setTimeout(function(){var s=document.getElementById('de-hide');if(s)s.remove()},1200)</script><!--de:end-->";
    const tail = '<!--de:begin--><script src="https://zoellife.com/detail-edit/apply.js" defer data-api="https://zoellife.com"></script><!--de:end-->';
    const out = t(`<!doctype html><html><head><meta charset="utf-8">${snippet}<title>x</title></head><body><p>a</p>${tail}</body></html>`);
    expect(out).not.toContain('de:begin');
    expect(out).not.toContain('de:end');
    expect(out).not.toContain('de-hide');
    expect(out).not.toContain('visibility:hidden');
    expect(out).not.toContain('defer');
    expect(out).toContain('<title>x</title>');
    expect(scriptTags(out)).toHaveLength(2);
  });

  it('짝 없는 de:begin 은 표지만 지우고 뒤의 내용을 삼키지 않는다', () => {
    const out = t('<head></head><body><!--de:begin--><p>keep</p></body>');
    expect(out).toContain('<p>keep</p>');
    expect(out).not.toContain('de:begin');
  });

  it('독립된 #de-hide 스타일도 제거', () => {
    const out = t('<head><style id="de-hide">html{visibility:hidden}</style><style>p{color:red}</style></head>');
    expect(out).not.toContain('visibility:hidden');
    expect(out).toContain('<style>p{color:red}</style>');
  });

  it('일반 주석은 보존하되 그 안의 태그는 해석하지 않는다', () => {
    const out = t('<head></head><body><!-- <script>x()</script> <img onerror=y> --><p>a</p></body>');
    expect(out).toContain('<!-- <script>x()</script> <img onerror=y> -->');
    expect(out).toContain('<p>a</p>');
  });
});

describe('transformConceptHtml — 파서 사양과의 일치', () => {
  it('style·textarea·title 의 원시 텍스트는 건드리지 않는다', () => {
    const html = '<head><title>a <b onclick=x> b</title><style>a>b{c:d} /* <script> */</style></head><body><textarea><script>t</script></textarea></body>';
    const out = t(html);
    expect(out).toContain('<title>a <b onclick=x> b</title>');
    expect(out).toContain('<style>a>b{c:d} /* <script> */</style>');
    expect(out).toContain('<textarea><script>t</script></textarea>');
    // 우리 스크립트 2개 + 원시 텍스트(style 주석·textarea) 안의 글자 2개 — 실행되는 요소는 우리 것뿐이다.
    expect(scriptTags(out)).toHaveLength(4);
    expect(out.endsWith(`${BODY_INJECTION}</body>`)).toBe(true);
  });

  it('문서 끝에서 끝나지 않는 태그·주석은 버린다', () => {
    expect(t('<head></head><body>ok<img src="x" onerror="y')).not.toContain('onerror');
    expect(t('<head></head><body>ok<!-- never closed <script>x</script>')).not.toMatch(/never closed/);
  });

  it('빈 주석 형태 <!--> 와 <!---> 를 사양대로 닫는다', () => {
    const out = t('<head></head><body><!--><img onerror=x><!---><b>k</b></body>');
    expect(out).not.toContain('onerror');
    expect(out).toContain('<b>k</b>');
  });

  it('고아 </script> 끝 태그와 </> 는 제거한다', () => {
    const out = t('<head></head><body>a</script>b</>c</body>');
    expect(scriptTags(out)).toHaveLength(2);
    expect(out).toContain('abc');
  });

  it('글자로서의 < 는 보존', () => {
    expect(t('<head></head><body>1 < 2 && 3 <4</body>')).toContain('1 < 2 && 3 <4');
  });

  it('대문자 태그명은 원문 그대로, 속성은 순서·인용 그대로', () => {
    const out = t("<head></head><BODY CLASS='x'><IMG SRC=a.jpg ALT='b'></BODY>");
    expect(out).toContain("<BODY CLASS='x'><IMG SRC=a.jpg ALT='b'>");
  });

  it('자기 닫힘 표기와 속성 제거가 함께 있어도 형태를 유지', () => {
    const out = t('<head></head><body><br onclick=x /><img src="a" onerror="b"/><img src=a onerror=b/></body>');
    expect(out).toContain('<br />');
    expect(out).toContain('<img src="a" />');
    // 따옴표 없는 값은 슬래시까지 값의 일부다 (HTML 사양) — 그래서 자기 닫힘이 아니다.
    expect(out).toContain('<img src=a>');
  });
});

describe('transformConceptHtml — 실제 시안 11개 (읽기 전용 백업)', () => {
  const BACKUP = '/Users/gai/personal/works/daeracheon-detail-concepts-deploy.bak-20261104';
  const available = fs.existsSync(path.join(BACKUP, 's7_black.html'));

  it.skipIf(!available)('각 시안은 주입물만 더해지고 그 밖에는 바이트 단위로 같다', () => {
    let totalBytes = 0;
    for (const slug of DETAIL_SLUGS) {
      const original = fs.readFileSync(path.join(BACKUP, `${slug}.html`), 'utf-8');
      const out = transformConceptHtml(original, { slug, conceptOrigin: CONCEPT, scriptOrigin: SCRIPTS });
      const head =
        `<base href="${CONCEPT}/"><meta name="robots" content="noindex,nofollow"><meta name="de-page" content="${slug}">`;
      expect(out.replace(head, '').replace(BODY_INJECTION, ''), slug).toBe(original);
      expect(scriptTags(out), slug).toHaveLength(2);
      totalBytes += original.length;
    }
    expect(totalBytes).toBeGreaterThan(100_000);
  });

  it.skipIf(!available)('뷰어 스니펫이 주입된 상태의 시안도 원본으로 되돌아온다', () => {
    for (const slug of DETAIL_SLUGS) {
      const original = fs.readFileSync(path.join(BACKUP, `${slug}.html`), 'utf-8');
      const injected = original
        .replace(
          /<meta charset="utf-8">/i,
          (m) =>
            `${m}<!--de:begin--><style id="de-hide">html{visibility:hidden}</style><script>setTimeout(function(){var s=document.getElementById('de-hide');if(s)s.remove()},1200)</script><!--de:end-->`,
        )
        .replace(
          '</body>',
          '<!--de:begin--><script src="https://zoellife.com/detail-edit/apply.js" defer data-api="https://zoellife.com"></script><!--de:end--></body>',
        );
      expect(injected, `${slug}: 스니펫 주입 확인`).toContain('de:begin');
      const out = transformConceptHtml(injected, { slug, conceptOrigin: CONCEPT, scriptOrigin: SCRIPTS });
      const head =
        `<base href="${CONCEPT}/"><meta name="robots" content="noindex,nofollow"><meta name="de-page" content="${slug}">`;
      expect(out.replace(head, '').replace(BODY_INJECTION, ''), slug).toBe(original);
    }
  });

  if (!available) {
    it('백업 폴더가 없어 실제 시안 대조는 건너뜀', () => {
      console.info(`[edit-page.test] 백업 폴더 없음: ${BACKUP}`);
      expect(available).toBe(false);
    });
  }
});

describe('fetchConceptHtml', () => {
  const html = '<!doctype html><title>x</title>';
  const okResponse = (body: BodyInit | null, init: ResponseInit = {}) =>
    new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });

  it('고정 오리진 + 슬러그만 요청하고 리다이렉트를 따라가지 않는다', async () => {
    const fetchMock = vi.fn(async () => okResponse(html));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchConceptHtml('s7_black', CONCEPT);
    expect(result).toEqual({ ok: true, html });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${CONCEPT}/s7_black`);
    expect(init.redirect).toBe('manual');
    expect(init.cache).toBe('no-store');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('200 이 아니면 사용하지 않는다 (404·500·3xx)', async () => {
    for (const status of [301, 302, 308, 403, 404, 500, 503]) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status, headers: { 'content-type': 'text/html' } })));
      expect(await fetchConceptHtml('s7_black', CONCEPT), String(status)).toEqual({ ok: false, reason: 'STATUS', status });
    }
  });

  it('text/html 이 아니면 거절', async () => {
    for (const type of ['application/json', 'text/plain', 'image/png', '']) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 200, headers: type ? { 'content-type': type } : {} })));
      expect(await fetchConceptHtml('s7_black', CONCEPT), type).toEqual({ ok: false, reason: 'CONTENT_TYPE' });
    }
  });

  it('Content-Length 가 2MB 를 넘으면 본문을 읽지 않고 거절', async () => {
    const res = okResponse('x', { headers: { 'content-type': 'text/html', 'content-length': String(UPSTREAM_MAX_BYTES + 1) } });
    vi.stubGlobal('fetch', vi.fn(async () => res));
    expect(await fetchConceptHtml('s7_black', CONCEPT)).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });

  it('길이를 밝히지 않아도 2MB 를 넘으면 읽다가 중단하고 거절', async () => {
    let pulled = 0;
    const chunk = new Uint8Array(256 * 1024).fill(97);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(chunk);
        if (pulled > 200) controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(stream)));
    expect(await fetchConceptHtml('s7_black', CONCEPT)).toEqual({ ok: false, reason: 'TOO_LARGE' });
    expect(pulled).toBeLessThan(20); // 2MB(= 8개 청크) 근처에서 멈췄다
  });

  it('정확히 2MB 는 허용', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(new Uint8Array(UPSTREAM_MAX_BYTES).fill(97))));
    const r = await fetchConceptHtml('s7_black', CONCEPT);
    expect(r.ok).toBe(true);
  });

  it('네트워크 오류·타임아웃은 FAILED', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    expect(await fetchConceptHtml('s7_black', CONCEPT)).toEqual({ ok: false, reason: 'FAILED' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timeout', 'TimeoutError'); }));
    expect(await fetchConceptHtml('s7_black', CONCEPT)).toEqual({ ok: false, reason: 'FAILED' });
  });

  it('UTF-8 한글을 그대로 복원', async () => {
    const korean = '<p>대라천 침향</p>';
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(new TextEncoder().encode(korean))));
    expect(await fetchConceptHtml('s7_black', CONCEPT)).toEqual({ ok: true, html: korean });
  });
});
