import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isStoredImageUrl, listBodyImages, setBodyImageAlt, TINYMCE_NAMED_ENTITIES } from '../blog/image-alt';

describe('TINYMCE_NAMED_ENTITIES', () => {
  it('matches the named-entity table of the installed tinymce exactly', () => {
    const src = readFileSync(path.join(process.cwd(), 'node_modules', 'tinymce', 'tinymce.js'), 'utf8');
    const head = 'const namedEntities = buildEntitiesLookup(';
    const start = src.indexOf(head) + head.length;
    const expr = src.slice(start, src.indexOf(', 32);', start));
    const installed = expr.split(/'\s*\+\s*'/).join('').replace(/^'|'$/g, '');
    expect(TINYMCE_NAMED_ENTITIES).toBe(installed);
  });
});

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/a.png';
const HTML =
  `<p>앞 문단</p><figure class="image"><img src="${BLOB}" alt="농장 전경" width="800"><figcaption>캡션</figcaption></figure>` +
  `<p>중간 &amp; 문단</p><img src="https://postfiles.pstatic.net/x.png?type=w966" loading="lazy">` +
  `<p>끝</p><img alt='' src="/uploads/b.jpg">`;

describe('listBodyImages', () => {
  it('lists every <img> in order with decoded src and alt (null when absent)', () => {
    expect(listBodyImages(HTML)).toEqual([
      { index: 0, src: BLOB, alt: '농장 전경' },
      { index: 1, src: 'https://postfiles.pstatic.net/x.png?type=w966', alt: null },
      { index: 2, src: '/uploads/b.jpg', alt: '' },
    ]);
  });

  it('returns an empty list for html without images', () => {
    expect(listBodyImages('<p>no images</p>')).toEqual([]);
  });
});

describe('setBodyImageAlt', () => {
  it('replaces an existing alt and leaves every other byte untouched', () => {
    const out = setBodyImageAlt(HTML, 0, '베트남 농장의 침향나무');
    expect(out).toBe(HTML.replace('alt="농장 전경"', 'alt="베트남 농장의 침향나무"'));
  });

  it('adds alt to an image that has none', () => {
    const out = setBodyImageAlt(HTML, 1, '나노에멀젼 실험 결과 그래프');
    expect(out).toBe(HTML.replace('<img src="https://postfiles', '<img alt="나노에멀젼 실험 결과 그래프" src="https://postfiles'));
  });

  it('rewrites a single-quoted empty alt', () => {
    const out = setBodyImageAlt(HTML, 2, '현미경 사진');
    expect(out).toBe(HTML.replace(`alt=''`, 'alt="현미경 사진"'));
  });

  it('escapes quotes and markup so the attribute cannot break out', () => {
    const out = setBodyImageAlt(HTML, 1, '"<b>" & $1 $& 값');
    expect(listBodyImages(out)[1].alt).toBe('"<b>" & $1 $& 값');
    expect(out).toContain('alt="&quot;&lt;b&gt;&quot; &amp; $1 $&amp; 값"');
  });

  it('round-trips through listBodyImages for every index', () => {
    let html = HTML;
    ['가', '나', '다'].forEach((alt, i) => { html = setBodyImageAlt(html, i, alt); });
    expect(listBodyImages(html).map((i) => i.alt)).toEqual(['가', '나', '다']);
  });

  it('handles unquoted and valueless alt attributes without duplicating them', () => {
    expect(setBodyImageAlt('<img alt=old src="/uploads/a.png">', 0, '새')).toBe('<img alt="새" src="/uploads/a.png">');
    expect(setBodyImageAlt('<img alt src="/uploads/a.png">', 0, '새')).toBe('<img alt="새" src="/uploads/a.png">');
  });

  it('returns the html unchanged when the index does not exist', () => {
    expect(setBodyImageAlt(HTML, 9, 'x')).toBe(HTML);
  });
});

describe('TinyMCE-serialized HTML (named entities, tricky attributes)', () => {
  it('decodes named and numeric entities TinyMCE writes into alt', () => {
    const html = `<img src="${BLOB}" alt="공&middot;막대 &hellip; &ldquo;침향&rdquo; &nbsp;A&#96;B&#183;C&#x00B7;D">`;
    expect(listBodyImages(html)[0].alt).toBe('공·막대 … “침향”  A`B·C·D');
  });

  it('keeps a middot written back through the panel as the real character, not "&middot;"', () => {
    const html = `<img src="${BLOB}" alt="공&middot;막대">`;
    const next = setBodyImageAlt(html, 0, listBodyImages(html)[0].alt + ' 모형');
    expect(listBodyImages(next)[0].alt).toBe('공·막대 모형');
    expect(next).not.toContain('&amp;middot;');
  });

  it('does not treat the word "alt" inside another attribute as the alt attribute', () => {
    const html = `<img title="사진 alt 설명" src="${BLOB}">`;
    expect(listBodyImages(html)[0].alt).toBeNull();
    expect(setBodyImageAlt(html, 0, '새')).toBe(`<img alt="새" title="사진 alt 설명" src="${BLOB}">`);
  });

  it('reads src correctly even when an alt value contains " src="', () => {
    const html = `<img alt="a src=&quot;x&quot;" src="${BLOB}">`;
    expect(listBodyImages(html)[0].src).toBe(BLOB);
  });

  it('keeps a raw ">" inside a quoted attribute within the same tag', () => {
    const html = `<p>a</p><img src="${BLOB}" alt="A > B"><p>b</p>`;
    expect(listBodyImages(html)).toEqual([{ index: 0, src: BLOB, alt: 'A > B' }]);
    expect(setBodyImageAlt(html, 0, 'C')).toBe(`<p>a</p><img src="${BLOB}" alt="C"><p>b</p>`);
  });
});

describe('isStoredImageUrl', () => {
  it('accepts our Blob store and local uploads, rejects external hosts', () => {
    expect(isStoredImageUrl(BLOB)).toBe(true);
    expect(isStoredImageUrl('/uploads/b.jpg')).toBe(true);
    expect(isStoredImageUrl('https://postfiles.pstatic.net/x.png')).toBe(false);
    expect(isStoredImageUrl('https://evil.blob.vercel-storage.com.example.com/a.png')).toBe(false);
    expect(isStoredImageUrl('not a url')).toBe(false);
  });
});
