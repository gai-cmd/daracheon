import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ImageAltPanel from '@/app/admin/(dashboard)/blog/ImageAltPanel';

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/a.png';
const render = (html: string) => renderToStaticMarkup(createElement(ImageAltPanel, { html, onChange: () => {} }));

describe('ImageAltPanel', () => {
  it('lists every body image with its alt input and counts the missing ones', () => {
    const out = render(`<p>x</p><img src="${BLOB}" alt="농장 전경"><img src="${BLOB}">`);
    expect(out).toContain('본문 이미지 2장');
    expect(out).toContain('1장</strong>');
    expect(out).toContain('value="농장 전경"');
    expect(out.match(/<input/g)).toHaveLength(2);
    expect(out).toContain('대체텍스트 없음');
  });

  it('warns about images the save sanitizer would strip', () => {
    expect(render('<img src="https://postfiles.pstatic.net/x.png" alt="a">')).toContain('외부 이미지');
    expect(render(`<img src="${BLOB}" alt="a">`)).not.toContain('외부 이미지');
  });

  it('shows a short note when the body has no images', () => {
    expect(render('<p>글만 있음</p>')).toContain('본문에 이미지가 없습니다');
  });
});
