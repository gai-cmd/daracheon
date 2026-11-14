import { describe, it, expect } from 'vitest';
import { CONSOLE_LIMITS, isSafeConsoleUrl, validateItemFields, validatePersonFields } from '../validate';

// SPEC-CONSOLE-001 REQ-CON-013 / AC-CON-015 (unit part). All names and addresses are made up.

const CATS = new Set(['wiki', 'sites']);

function item(overrides: Record<string, unknown> = {}) {
  return {
    category: 'sites',
    type: 'link',
    status: 'ok',
    access_method: 'invite',
    visibility: '전체',
    team: '공통',
    owners: [{ name: '테스트 담당', email: 'Owner@Try-N.com' }],
    url: 'https://example.com/a',
    title: '  예시 항목  ',
    title_en: 'Example item',
    description: '',
    description_en: '',
    tags: ['a', 'b'],
    links: [{ label: '문서', label_en: 'Doc', url: 'https://example.com/doc' }],
    note: '확인할 일',
    note_en: '',
    ...overrides,
  };
}

describe('isSafeConsoleUrl', () => {
  it.each([
    ['https://example.com', true],
    ['http://example.com/x?y=1', true],
    ['mailto:someone@example.com', true],
    ['javascript:alert(1)', false],
    ['JavaScript:alert(1)', false],
    ['data:text/html,x', false],
    ['ftp://x', false],
    ['//example.com', false],
    ['/relative', false],
    ['not a url', false],
    ['', false],
  ])('%s -> %s', (u, ok) => {
    expect(isSafeConsoleUrl(u)).toBe(ok);
  });
});

describe('validateItemFields', () => {
  it('accepts a valid item and normalises it', () => {
    const r = validateItemFields(item(), { categoryIds: CATS });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe('예시 항목');
    expect(r.value.owners).toEqual([{ name: '테스트 담당', email: 'owner@try-n.com' }]);
  });

  it('allows an empty url and a mailto url', () => {
    expect(validateItemFields(item({ url: '' }), { categoryIds: CATS }).ok).toBe(true);
    expect(validateItemFields(item({ url: 'mailto:team@example.com' }), { categoryIds: CATS }).ok).toBe(true);
  });

  it('accepts the wiki category', () => {
    expect(validateItemFields(item({ category: 'wiki' }), { categoryIds: CATS }).ok).toBe(true);
  });

  it('drops unknown keys (whitelist) including credential fields', () => {
    const r = validateItemFields(item({ password: 'canary-Pw-7f3e', login_id: 'canary-id-91ab', version: 99 }), {
      categoryIds: CATS,
    });
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toContain('canary');
    expect(r.ok && 'version' in r.value).toBe(false);
  });

  it.each([
    ['javascript url', { url: 'javascript:alert(1)' }, 'url'],
    ['data url', { url: 'data:text/html,x' }, 'url'],
    ['ftp url', { url: 'ftp://x' }, 'url'],
    ['unknown category', { category: 'nope' }, 'category'],
    ['201-character title', { title: 't'.repeat(201) }, 'title'],
    ['empty title', { title: '   ' }, 'title'],
    ['21 links', { links: Array.from({ length: 21 }, (_, i) => ({ label: `l${i}`, label_en: '', url: 'https://e.com' })) }, 'links'],
    ['link with javascript url', { links: [{ label: 'x', label_en: '', url: 'javascript:alert(1)' }] }, 'links'],
    ['21 tags', { tags: Array.from({ length: 21 }, (_, i) => `t${i}`) }, 'tags'],
    ['41-character tag', { tags: ['x'.repeat(41)] }, 'tags'],
    ['501-character description', { description: 'd'.repeat(501) }, 'description'],
    ['unknown type', { type: 'weird' }, 'type'],
    ['unknown status', { status: 'weird' }, 'status'],
    ['unknown access method', { access_method: 'magic' }, 'access_method'],
    ['unknown visibility', { visibility: 'public' }, 'visibility'],
    ['unknown team', { team: 'mars' }, 'team'],
    ['owner email on a lookalike domain', { owners: [{ name: 'x', email: 'x@try-n.com.evil.io' }] }, 'owners'],
    ['owner without a name', { owners: [{ name: '', email: 'x@try-n.com' }] }, 'owners'],
    ['11 owners', { owners: Array.from({ length: 11 }, (_, i) => ({ name: `p${i}` })) }, 'owners'],
    ['non-string title', { title: 42 }, 'title'],
  ])('rejects %s', (_label, overrides, field) => {
    const r = validateItemFields(item(overrides), { categoryIds: CATS });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field)).toContain(field);
  });

  it('rejects a non-object body', () => {
    expect(validateItemFields(null, { categoryIds: CATS }).ok).toBe(false);
    expect(validateItemFields([], { categoryIds: CATS }).ok).toBe(false);
  });

  it('exposes the documented caps', () => {
    expect(CONSOLE_LIMITS).toMatchObject({ title: 200, description: 500, tags: 20, tagLength: 40, links: 20, owners: 10, items: 3000 });
  });
});

describe('validatePersonFields', () => {
  it('accepts an exact try-n.com address and lower-cases it', () => {
    expect(validatePersonFields({ email: ' Ga@Try-N.com ', name: '가 나다', name_en: 'Ga Nada', team: '한국팀' })).toEqual({
      ok: true,
      value: { email: 'ga@try-n.com', name: '가 나다', name_en: 'Ga Nada', team: '한국팀' },
    });
  });

  it('ignores an admin flag (admins come only from CONSOLE_ADMIN_EMAILS)', () => {
    const r = validatePersonFields({ email: 'ga@try-n.com', name: '가', name_en: '', team: '공통', admin: true });
    expect(r.ok && 'admin' in r.value).toBe(false);
  });

  it.each([
    ['missing email', { name: '가', team: '공통' }, 'email'],
    ['lookalike domain', { email: 'x@try-n.com.evil.io', name: '가', team: '공통' }, 'email'],
    ['unknown team', { email: 'x@try-n.com', name: '가', team: 'mars' }, 'team'],
    ['missing name', { email: 'x@try-n.com', team: '공통' }, 'name'],
  ])('rejects %s', (_label, raw, field) => {
    const r = validatePersonFields(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.field)).toContain(field);
  });
});
