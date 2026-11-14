import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// SPEC-CONSOLE-001 AC-CON-021 / REQ-CON-024 — the team console stays out of search engines:
// robots disallow, no sitemap entry, X-Robots-Tag on every console path, noindex meta in the HTML.

vi.mock('@/lib/db', () => ({
  readDataSafe: vi.fn(async () => []),
  readSingleSafe: vi.fn(async () => null),
}));
vi.mock('@/lib/blog/store', () => ({
  isNeonEnabled: () => false,
  readPostsSafe: vi.fn(async () => []),
  readCategoriesSafe: vi.fn(async () => []),
}));

import robots from '../robots';
import sitemap from '../sitemap';
import { metadata as consoleLayoutMetadata } from '../console/layout';

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

const asList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function rules(): Rule[] {
  const r = robots().rules;
  return Array.isArray(r) ? (r as Rule[]) : [r as Rule];
}

describe('robots — console disallow (AC-CON-021)', () => {
  it('disallows /console for the * group', () => {
    const star = rules().find((r) => r.userAgent === '*');
    expect(star).toBeDefined();
    expect(asList(star!.disallow)).toContain('/console');
  });

  it('disallows /console for every user-agent group that has an allow rule', () => {
    const withAllow = rules().filter((r) => asList(r.allow).length > 0);
    // '*' plus every named AI crawler group.
    expect(withAllow.length).toBeGreaterThan(1);
    const missing = withAllow.filter((r) => !asList(r.disallow).includes('/console')).map((r) => r.userAgent);
    expect(missing).toEqual([]);
  });

  it('keeps the existing disallow entries and the training-crawler full blocks', () => {
    const star = rules().find((r) => r.userAgent === '*')!;
    expect(asList(star.disallow)).toEqual(
      expect.arrayContaining(['/api/', '/admin/', '/edition/', '/agarwood-edition', '/thesis']),
    );
    const gptbot = rules().find((r) => r.userAgent === 'GPTBot');
    expect(asList(gptbot?.disallow)).toEqual(['/']);
  });
});

describe('sitemap — no console URL (AC-CON-021)', () => {
  it('lists no URL containing /console', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.filter((e) => e.url.includes('/console'))).toEqual([]);
  });
});

describe('vercel.json — X-Robots-Tag on console paths (AC-CON-021)', () => {
  const config = JSON.parse(readFileSync(path.resolve(__dirname, '../../../vercel.json'), 'utf8')) as {
    headers?: { source: string; headers: { key: string; value: string }[] }[];
  };
  const tagFor = (source: string) =>
    config.headers?.find((h) => h.source === source)?.headers.find((x) => x.key === 'X-Robots-Tag')?.value;

  it.each(['/console', '/console/:path*', '/api/console/:path*'])('%s carries noindex, nofollow', (source) => {
    expect(tagFor(source)).toBe('noindex, nofollow');
  });

  it('keeps the existing /admin rule', () => {
    expect(tagFor('/admin/:path*')).toBe('noindex, nofollow');
  });
});

describe('console layout metadata — noindex meta (AC-CON-021)', () => {
  it('renders robots index:false, follow:false (Next emits <meta name="robots" content="noindex, nofollow">)', () => {
    expect(consoleLayoutMetadata.robots).toEqual({ index: false, follow: false });
  });
});
