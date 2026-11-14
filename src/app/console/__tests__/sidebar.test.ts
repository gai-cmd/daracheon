import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WIKI_CATEGORY } from '@/lib/console/categories';
import type { ConsoleCategory } from '@/lib/console/types';
import { buildNav } from '@/lib/console/ui-model';
import Sidebar from '../Sidebar';
import { UiProvider } from '../ui-context';

// SPEC-CONSOLE-001 AC-CON-020 / AC-CON-026: the rendered menu order, the single Wiki link and its
// divider with role="separator", and the English label.
const REGULAR: ConsoleCategory[] = ['globe', 'pen', 'video', 'folder', 'chart', 'cart', 'sparkles', 'book'].map((icon, i) => ({
  id: `cat-${i + 1}`,
  kind: 'resource',
  icon,
  name: `분류 ${i + 1}`,
  name_en: `Category ${i + 1}`,
  short: `분류${i + 1}`,
  short_en: `Cat${i + 1}`,
  description: '',
  description_en: '',
}));
const ME = { email: 'me@try-n.com', name: '나', team: '공통' as const, isAdmin: false };

function render(lang: 'ko' | 'en', current = 'home') {
  const nav = buildNav({ categories: [{ ...WIKI_CATEGORY }, ...REGULAR], items: [], me: ME });
  return renderToStaticMarkup(
    createElement(UiProvider, { lang }, createElement(Sidebar, { nav, current, onClose: () => {}, onLang: () => {} }))
  );
}

describe('<Sidebar>', () => {
  it('renders the menu in the specified order', () => {
    const html = render('ko');
    const tokens = [...html.matchAll(/href="(#[^"]*)"|role="separator"|data-nav-heading="true"/g)].map((m) =>
      m[1] ?? (m[0].startsWith('role') ? 'sep' : 'heading')
    );
    expect(tokens).toEqual([
      '#/',
      '#/all',
      'sep',
      '#/cat/wiki',
      'sep',
      'heading',
      ...REGULAR.map((c) => `#/cat/${c.id}`),
      'sep',
      '#/shared',
      '#/mine',
    ]);
  });

  it('has exactly one wiki link labelled 위키 with count 0 and the library icon', () => {
    const html = render('ko');
    expect(html.match(/href="#\/cat\/wiki"/g)).toHaveLength(1);
    const wiki = html.slice(html.indexOf('href="#/cat/wiki"'), html.indexOf('</a>', html.indexOf('href="#/cat/wiki"')));
    expect(wiki).toContain('>위키<');
    expect(wiki).toContain('>0<');
    expect(wiki).toContain('data-icon="library"');
  });

  it('switches the wiki label to Wiki in English', () => {
    const html = render('en');
    const wiki = html.slice(html.indexOf('href="#/cat/wiki"'), html.indexOf('</a>', html.indexOf('href="#/cat/wiki"')));
    expect(wiki).toContain('>Wiki<');
  });

  it('marks the current entry with aria-current="page"', () => {
    const html = render('ko', 'cat:wiki');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*href="#\/cat\/wiki"|href="#\/cat\/wiki"[^>]*aria-current="page"/);
  });
});
