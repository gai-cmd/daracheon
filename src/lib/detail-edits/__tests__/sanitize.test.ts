import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { __setPurifyLoaderForTests, filterStyle, sanitizeDetailHtml, SanitizerUnavailableError } from '../sanitize';

// 서버 정제기 — 허용 목록 동작, XSS 벡터 무력화, 고정점(재정제해도 불변) 성질을 검증한다.
// 클라이언트 코어와 공유하는 벡터 파일(CORE 트랙 산출물)이 있으면 그 전부를 같은 기대값으로 돌린다.

interface Vector {
  name: string;
  in: string;
  out: string;
}

const SHARED_VECTORS_PATH = path.resolve(__dirname, '../../detail-edits-core/__tests__/sanitize-vectors.json');

/** 공유 벡터 파일: 있으면 읽고, 없으면 null (그때는 내장 최소 벡터만 돌리고 아래에서 안내를 출력). */
function loadSharedVectors(): Vector[] | null {
  if (!fs.existsSync(SHARED_VECTORS_PATH)) return null;
  const parsed = JSON.parse(fs.readFileSync(SHARED_VECTORS_PATH, 'utf-8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('sanitize-vectors.json 은 배열이어야 합니다.');
  return parsed as Vector[];
}

// 내장 최소 벡터 — 정확한 기대 출력이 명확한 것만 둔다.
const BUILTIN_VECTORS: Vector[] = [
  { name: 'plain text', in: 'hello 안녕', out: 'hello 안녕' },
  { name: 'allowed inline tags kept', in: '<b>a</b><i>b</i><u>c</u><s>d</s><em>e</em><strong>f</strong>', out: '<b>a</b><i>b</i><u>c</u><s>d</s><em>e</em><strong>f</strong>' },
  { name: 'br kept', in: 'a<br>b', out: 'a<br>b' },
  { name: 'script removed with content', in: '<script>alert(1)</script>ok', out: 'ok' },
  { name: 'uppercase script removed', in: '<B>x</B><SCRIPT SRC=//evil.test></SCRIPT>', out: '<b>x</b>' },
  { name: 'img onerror removed', in: '<img src=x onerror=alert(1)>t', out: 't' },
  { name: 'svg onload removed with content', in: '<svg onload=alert(1)><circle/></svg>t', out: 't' },
  { name: 'event handler attribute dropped', in: '<span onclick="alert(1)">x</span>', out: '<span>x</span>' },
  { name: 'javascript href dropped, rel forced', in: '<a href="javascript:alert(1)">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'mixed-case javascript href dropped', in: '<a href="JaVaScRiPt:alert(1)">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'entity-encoded javascript href dropped', in: '<a href="&#106;avascript:alert(1)">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'tab-split javascript href dropped', in: '<a href="java&#9;script:alert(1)">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'data href dropped', in: '<a href="data:text/html,<script>alert(1)</script>">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'https href kept', in: '<a href="https://example.com/a?b=1">x</a>', out: '<a href="https://example.com/a?b=1" rel="noopener noreferrer">x</a>' },
  { name: 'mailto and tel kept', in: '<a href="mailto:a@b.co">m</a><a href="tel:+8210">t</a>', out: '<a href="mailto:a@b.co" rel="noopener noreferrer">m</a><a href="tel:+8210" rel="noopener noreferrer">t</a>' },
  { name: 'protocol-relative href dropped', in: '<a href="//evil.test/x">x</a>', out: '<a rel="noopener noreferrer">x</a>' },
  { name: 'target _blank kept, other target dropped', in: '<a href="https://e.test" target="_blank">a</a><a href="https://e.test" target="_top">b</a>', out: '<a href="https://e.test" target="_blank" rel="noopener noreferrer">a</a><a href="https://e.test" rel="noopener noreferrer">b</a>' },
  { name: 'foreign rel replaced', in: '<a href="https://e.test" rel="opener">a</a>', out: '<a href="https://e.test" rel="noopener noreferrer">a</a>' },
  { name: 'href on non-anchor dropped', in: '<span href="https://e.test">x</span>', out: '<span>x</span>' },
  { name: 'style url() declaration dropped', in: '<span style="background:url(javascript:alert(1))">x</span>', out: '<span>x</span>' },
  { name: 'style expression dropped', in: '<span style="width:expression(alert(1))">x</span>', out: '<span>x</span>' },
  { name: 'style keeps allowed, drops the rest', in: '<span style="color:red;background-image:url(x);font-size:20px">x</span>', out: '<span style="color:red; font-size:20px">x</span>' },
  // 실제 시안(s2_check 표)의 서식: 색 하나짜리 background 단축 속성은 그대로 통과해야 동일성이 지켜진다.
  { name: 'background shorthand with a plain color kept', in: '<span class="yes" style="background:#85858C">O</span>', out: '<span class="yes" style="background:#85858C">O</span>' },
  { name: 'background shorthand with rgb() kept', in: '<span style="background:rgb(10, 20, 30)">x</span>', out: '<span style="background:rgb(10, 20, 30)">x</span>' },
  { name: 'background shorthand with image-set dropped', in: '<span style="background:image-set(&quot;//evil.test/x.png&quot; 1x)">x</span>', out: '<span>x</span>' },
  { name: 'background shorthand with url dropped', in: '<span style="background:#fff url(//evil.test/x.png)">x</span>', out: '<span>x</span>' },
  { name: 'background shorthand with more than a single color dropped', in: '<span style="background:red no-repeat">x</span>', out: '<span>x</span>' },
  { name: 'style value with escape dropped', in: '<span style="color:\\72 ed">x</span>', out: '<span>x</span>' },
  { name: 'style allowed properties kept verbatim', in: '<span style="color:#aa3322;font-size:28px;font-weight:700">x</span>', out: '<span style="color:#aa3322;font-size:28px;font-weight:700">x</span>' },
  { name: 'class kept when safe', in: '<span class="hl a-b_c 1">x</span>', out: '<span class="hl a-b_c 1">x</span>' },
  { name: 'class dropped when unsafe', in: '<span class="a&quot;b&lt;c">x</span>', out: '<span>x</span>' },
  { name: 'unknown attributes dropped', in: '<span id="a" data-x="1" title="t" aria-label="l">x</span>', out: '<span>x</span>' },
  { name: 'abbr title dropped', in: '<abbr title="t">x</abbr>', out: '<abbr>x</abbr>' },
  { name: 'block tags unwrapped to text', in: '<div><p>a</p></div>', out: 'a' },
  { name: 'iframe removed with content', in: '<iframe src="https://e.test">inner</iframe>t', out: 't' },
  { name: 'form controls unwrapped', in: '<form action="x"><input name="a">t</form>', out: 't' },
  { name: 'comment removed', in: 'a<!--<script>alert(1)</script>-->b', out: 'ab' },
  // HTML 에서 CDATA 는 가짜 주석(첫 '>' 까지)이다 — 스크립트로 실행되지 않고 글자만 남는다.
  { name: 'cdata-like is a bogus comment, no script survives', in: 'a<![CDATA[<script>alert(1)</script>]]>b', out: 'aalert(1)]]&gt;b' },
  { name: 'unterminated tag closed', in: '<b onmouseover=alert(1)>x', out: '<b>x</b>' },
  { name: 'unterminated script dropped', in: 'a<script>alert(1)', out: 'a' },
  { name: 'text entities stay escaped', in: 'a &amp; b &lt;script&gt;alert(1)&lt;/script&gt;', out: 'a &amp; b &lt;script&gt;alert(1)&lt;/script&gt;' },
  { name: 'nbsp serialized', in: 'a&nbsp;b', out: 'a&nbsp;b' },
  { name: 'nested split script tags', in: '<scr<script>ipt>alert(1)</scr</script>ipt>', out: 'ipt&gt;alert(1)ipt&gt;' },
  { name: 'mXSS svg/p/style', in: '<svg><p><style><a title="</style><img src onerror=alert(1)>">', out: '"&gt;' },
  { name: 'math mi xlink', in: '<math><mi//xlink:href="data:x,<script>alert(4)</script>">', out: '' },
  { name: 'noscript breakout', in: '<noscript><p title="</noscript><img src=x onerror=alert(1)>">t', out: 't' },
];

describe('sanitizeDetailHtml — 내장 벡터', () => {
  it.each(BUILTIN_VECTORS)('$name', ({ in: input, out }) => {
    expect(sanitizeDetailHtml(input)).toBe(out);
  });

  it('고정점: 어떤 벡터든 재정제해도 같은 결과', () => {
    for (const v of BUILTIN_VECTORS) {
      const once = sanitizeDetailHtml(v.in);
      expect(sanitizeDetailHtml(once), v.name).toBe(once);
    }
  });

  it('결과에 위험 문자열이 남지 않는다', () => {
    const danger = /<script|<img|<svg|<math|<iframe|onerror|onload|onclick|javascript:|expression\(|url\(/i;
    for (const v of BUILTIN_VECTORS) {
      expect(sanitizeDetailHtml(v.in), v.name).not.toMatch(danger);
    }
  });

  it('문자열이 아니거나 빈 입력은 빈 문자열', () => {
    expect(sanitizeDetailHtml('')).toBe('');
    expect(sanitizeDetailHtml(undefined as unknown as string)).toBe('');
    expect(sanitizeDetailHtml(null as unknown as string)).toBe('');
    expect(sanitizeDetailHtml(42 as unknown as string)).toBe('');
  });

  it('원본 시안 스타일의 인라인 서식은 그대로 보존된다 (동일성)', () => {
    const original =
      '<b class="hl">굵게</b> 본문<br>다음 줄 <span style="color:#aa3322;font-size:28px">강조</span> ' +
      '<a href="https://example.com/x" target="_blank" rel="noopener noreferrer">링크</a>&nbsp;끝';
    expect(sanitizeDetailHtml(original)).toBe(original);
  });
});

describe('filterStyle', () => {
  it('전부 허용이면 원문 그대로', () => {
    expect(filterStyle('color: #fff; line-height: 1.6')).toBe('color: #fff; line-height: 1.6');
  });
  it('허용되지 않는 속성만 걸러 낸다', () => {
    expect(filterStyle('color: red; position: fixed; opacity: .5')).toBe('color: red; opacity: .5');
  });
  it('괄호 안의 세미콜론은 구분자가 아니다', () => {
    expect(filterStyle('color: rgb(1, 2, 3); font-size: 20px')).toBe('color: rgb(1, 2, 3); font-size: 20px');
  });
  it('전부 걸러지면 빈 문자열', () => {
    expect(filterStyle('position: fixed; top: 0')).toBe('');
  });
  it('!important·@import·주석은 값 검사에서 탈락', () => {
    expect(filterStyle('color: red !important')).toBe('');
    expect(filterStyle('color: red /* x */')).toBe('');
  });
});

describe('공유 벡터 (detail-edits-core/__tests__/sanitize-vectors.json)', () => {
  const shared = loadSharedVectors();

  if (shared === null) {
    it('공유 벡터 파일 없음 — 내장 최소 벡터만 실행됨 (통합 단계에서 공유 파일 실행 여부를 확인할 것)', () => {
      console.info(
        '[detail-edits sanitize.test] 공유 벡터 파일이 아직 없습니다: ' +
          SHARED_VECTORS_PATH +
          ' — CORE 트랙 산출물이 생기면 이 테스트가 자동으로 전부 실행합니다.',
      );
      expect(shared).toBeNull();
    });
  } else {
    it('공유 벡터가 비어 있지 않다', () => {
      expect(shared.length).toBeGreaterThan(0);
      for (const v of shared) {
        expect(typeof v.name).toBe('string');
        expect(typeof v.in).toBe('string');
        expect(typeof v.out).toBe('string');
      }
    });

    it.each(shared.map((v, i) => ({ ...v, idx: i })))('[$idx] $name', ({ in: input, out }) => {
      expect(sanitizeDetailHtml(input)).toBe(out);
    });

    it('공유 벡터의 정제 결과도 고정점', () => {
      for (const v of shared) {
        const once = sanitizeDetailHtml(v.in);
        expect(sanitizeDetailHtml(once), v.name).toBe(once);
      }
    });
  }
});

describe('fail-closed', () => {
  it('정제 라이브러리를 못 불러오면 원문을 통과시키지 않고 예외', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    __setPurifyLoaderForTests(() => {
      throw new Error('boom');
    });
    try {
      expect(() => sanitizeDetailHtml('<script>alert(1)</script>x')).toThrow(SanitizerUnavailableError);
      expect(() => sanitizeDetailHtml('x')).toThrow(/정제기/);
    } finally {
      __setPurifyLoaderForTests(null);
      spy.mockRestore();
    }
    expect(sanitizeDetailHtml('<b>x</b>')).toBe('<b>x</b>'); // 복원 후 정상
  });

  it('sanitize 함수가 없는 모듈이어도 통과시키지 않는다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    __setPurifyLoaderForTests(() => ({}));
    try {
      expect(() => sanitizeDetailHtml('x')).toThrow(SanitizerUnavailableError);
    } finally {
      __setPurifyLoaderForTests(null);
      spy.mockRestore();
    }
  });

  it('SanitizerUnavailableError 는 Error 하위 클래스', () => {
    expect(new SanitizerUnavailableError()).toBeInstanceOf(Error);
  });
});
