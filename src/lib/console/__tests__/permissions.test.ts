import { describe, it, expect } from 'vitest';
import {
  canEdit,
  credAccess,
  isOwner,
  ownerChangeAllowed,
  resolveConsoleUser,
  toListItem,
  toListItems,
} from '../permissions';
import type { ConsoleItem, ConsoleUser } from '../types';

// SPEC-CONSOLE-001 REQ-CON-010 / REQ-CON-015 / REQ-CON-016 / AC-CON-010 / AC-CON-011 (unit part).
// Every name and address below is a synthetic fixture.

function user(email: string, team: ConsoleUser['team'] = '공통', isAdmin = false): ConsoleUser {
  return { email, name: email.split('@')[0], team, isAdmin };
}

const o = user('o@try-n.com', '방글라데시팀');
const adm = user('adm@try-n.com', '공통', true);
const k = user('k@try-n.com', '한국팀');
const g = user('g@try-n.com', '방글라데시팀');
const n = user('n@try-n.com'); // not in the people directory -> 공통

function item(overrides: Partial<ConsoleItem> = {}): ConsoleItem {
  return {
    id: 'item-1',
    category: 'sites',
    type: 'account',
    status: 'run',
    access_method: 'shared-credential',
    visibility: '전체',
    team: '한국팀',
    owners: [{ name: '담당 오', email: 'O@try-n.com' }],
    url: 'https://example.com',
    title: '항목',
    title_en: 'Item',
    description: '',
    description_en: '',
    tags: [],
    links: [],
    note: '확인할 일 메모',
    note_en: 'note',
    version: 1,
    updatedAt: '2026-11-15T00:00:00.000Z',
    updatedBy: '담당 오',
    ...overrides,
  };
}

describe('ownership and editing', () => {
  it('matches owners by email, case-insensitively', () => {
    expect(isOwner(o, item())).toBe(true);
    expect(isOwner(k, item())).toBe(false);
  });

  it('never treats a name-only owner as an owner', () => {
    const named = user('dup@try-n.com');
    expect(isOwner(named, item({ owners: [{ name: 'dup' }] }))).toBe(false);
  });

  it('lets owners and admins edit, nobody else', () => {
    expect(canEdit(o, item())).toBe(true);
    expect(canEdit(adm, item())).toBe(true);
    expect(canEdit(k, item())).toBe(false);
  });

  it('refuses a non-admin removing themselves from the owners (self-lockout)', () => {
    expect(ownerChangeAllowed(o, [{ name: 'x', email: 'other@try-n.com' }])).toBe(false);
    expect(ownerChangeAllowed(o, [{ name: 'o', email: 'o@try-n.com' }])).toBe(true);
    expect(ownerChangeAllowed(adm, [])).toBe(true);
  });
});

describe('credAccess matrix (AC-CON-010)', () => {
  const rows: Array<[ConsoleItem['visibility'], ConsoleItem['team'], Record<string, 'ok' | 'denied'>]> = [
    ['전체', '한국팀', { o: 'ok', adm: 'ok', k: 'ok', g: 'ok', n: 'ok' }],
    ['팀', '한국팀', { o: 'ok', adm: 'ok', k: 'ok', g: 'denied', n: 'denied' }],
    ['팀', '공통', { o: 'ok', adm: 'ok', k: 'ok', g: 'ok', n: 'ok' }],
    ['본인', '방글라데시팀', { o: 'ok', adm: 'ok', k: 'denied', g: 'denied', n: 'denied' }],
  ];
  const users = { o, adm, k, g, n };
  for (const [visibility, team, expected] of rows) {
    for (const [who, result] of Object.entries(expected)) {
      it(`${visibility} / ${team}: ${who} -> ${result}`, () => {
        expect(credAccess(users[who as keyof typeof users], item({ visibility, team }))).toBe(result);
      });
    }
  }
});

describe('resolveConsoleUser', () => {
  const people = [{ email: 'k@try-n.com', name: '케이', name_en: 'K', team: '한국팀' as const }];

  it('takes the team from the people directory and admin rights from the allow-list only', () => {
    expect(resolveConsoleUser({ email: 'K@try-n.com', name: 'K' }, { adminEmails: [], people })).toEqual({
      email: 'k@try-n.com',
      name: 'K',
      team: '한국팀',
      isAdmin: false,
    });
    expect(resolveConsoleUser({ email: 'adm@try-n.com', name: 'A' }, { adminEmails: ['adm@try-n.com'], people })).toMatchObject({
      isAdmin: true,
      team: '공통',
    });
  });
});

describe('toListItem (no credential values, private note gated)', () => {
  it('omits the note for a non-owner and includes it for the owner', () => {
    const forK = toListItem(k, item(), { hasLoginId: true, hasPassword: true });
    expect('note' in forK).toBe(false);
    expect('note_en' in forK).toBe(false);
    expect(forK).toMatchObject({ canEdit: false, hasLoginId: true, hasPassword: true, credAccess: 'ok' });

    const forO = toListItem(o, item(), { hasLoginId: false, hasPassword: false });
    expect(forO.note).toBe('확인할 일 메모');
    expect(forO.canEdit).toBe(true);
  });

  it('never copies unexpected fields (credential values, record meta) into the payload', () => {
    const dirty = { ...item(), password: 'canary-Pw-7f3e', login_id: 'canary-id-91ab', _rev: 3, _mt: 1 } as unknown as ConsoleItem;
    const out = toListItem(adm, dirty, { hasLoginId: true, hasPassword: true });
    expect(JSON.stringify(out)).not.toContain('canary');
    expect(out).not.toHaveProperty('_rev');
    expect(out).not.toHaveProperty('deletedAt');
  });

  it('reports denied credential access for a team-restricted item', () => {
    expect(toListItem(g, item({ visibility: '팀' }), { hasLoginId: true, hasPassword: true }).credAccess).toBe('denied');
  });

  it('drops soft-deleted items from lists', () => {
    const items = [item({ id: 'a' }), item({ id: 'b', deletedAt: '2026-11-15T01:00:00.000Z', deletedBy: 'o' })];
    expect(toListItems(o, items, []).map((i) => i.id)).toEqual(['a']);
  });

  it('derives hasLoginId / hasPassword from the secret records', () => {
    const sealed = { v: 1 as const, kv: 1 as const, iv: 'i', tag: 't', ct: 'c' };
    const out = toListItems(o, [item({ id: 'a' })], [
      { itemId: 'a', password: sealed, updatedAt: '2026-11-15T00:00:00.000Z', updatedBy: 'o' },
    ]);
    expect(out[0]).toMatchObject({ hasLoginId: false, hasPassword: true });
  });
});
