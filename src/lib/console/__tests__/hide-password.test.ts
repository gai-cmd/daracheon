import { describe, it, expect } from 'vitest';
import { validateItemFields } from '../validate';
import { toListItem, toListItems } from '../permissions';
import { mapImportFile } from '../import-map';
import { AUTOFILL_GUIDE_VERSION, CONSOLE_DOCS, type ConsoleItem, type ConsoleUser } from '../types';

// SPEC-CONSOLE-002 M1 — hide_password 단위 판정 (REQ-CS2-001·002, AC-CS2-001·002 단위 부분).
// 이름·주소·id 는 모두 지어낸 값이다(공개 저장소).

const CATS = new Set(['wiki', 'sites']);

function fields(overrides: Record<string, unknown> = {}) {
  return {
    category: 'sites',
    type: 'account',
    status: 'ok',
    access_method: 'shared-credential',
    visibility: '전체',
    team: '공통',
    owners: [{ name: '테스트 담당', email: 'owner@try-n.com' }],
    url: 'https://example.com/login',
    title: '공유 계정',
    ...overrides,
  };
}

function stored(overrides: Partial<ConsoleItem> = {}): ConsoleItem {
  const v = validateItemFields(fields(), { categoryIds: CATS });
  if (!v.ok) throw new Error('fixture invalid');
  const { hide_password: _h, ...rest } = v.value;
  return { id: 'S1', ...rest, version: 1, updatedAt: '2026-11-15T00:00:00.000Z', updatedBy: '테스트 담당', ...overrides };
}

const member: ConsoleUser = { email: 'member@try-n.com', name: 'M', team: '한국팀', isAdmin: false };

describe('validateItemFields hide_password (REQ-CS2-001)', () => {
  it('refuses a non-boolean value with field hide_password', () => {
    for (const bad of ['yes', 'true', 1, 0, null, {}]) {
      const r = validateItemFields(fields({ hide_password: bad }), { categoryIds: CATS });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors).toContainEqual({ field: 'hide_password', reason: 'type' });
    }
  });

  it('keeps true only for a shared-credential item, false otherwise and when absent', () => {
    const on = validateItemFields(fields({ hide_password: true }), { categoryIds: CATS });
    expect(on.ok && on.value.hide_password).toBe(true);
    const absent = validateItemFields(fields(), { categoryIds: CATS });
    expect(absent.ok && absent.value.hide_password).toBe(false);
    for (const access of ['public', 'sso', 'invite', 'internal-login']) {
      const r = validateItemFields(fields({ access_method: access, hide_password: true }), { categoryIds: CATS });
      expect(r.ok && r.value.hide_password).toBe(false);
    }
  });
});

describe('toListItem hide_password (REQ-CS2-001)', () => {
  it('is always a boolean: absent -> false, stale true on a non-shared item -> false', () => {
    expect(toListItem(member, stored(), { hasLoginId: false, hasPassword: false }).hide_password).toBe(false);
    expect(toListItem(member, stored({ hide_password: true }), { hasLoginId: true, hasPassword: true }).hide_password).toBe(true);
    const stale = stored({ access_method: 'public', hide_password: true });
    expect(toListItem(member, stale, { hasLoginId: false, hasPassword: false }).hide_password).toBe(false);
  });

  it('list payload carries credential presence for the shared-account view (REQ-CS2-017 data)', () => {
    const list = toListItems(member, [stored({ id: 'S1' }), stored({ id: 'S2' })], [
      { itemId: 'S1', login_id: { v: 1, kv: 1, iv: 'i', tag: 't', ct: 'c' }, updatedAt: '', updatedBy: '' },
    ]);
    expect(list.map((i) => [i.id, i.hasLoginId, i.hasPassword, i.hide_password])).toEqual([
      ['S1', true, false, false],
      ['S2', false, false, false],
    ]);
  });
});

describe('mapImportFile hide_password (REQ-CS2-002)', () => {
  const ctx = {
    now: '2026-11-15T00:00:00.000Z',
    actor: '관리 자',
    storedCategories: [{ id: 'sites', icon: 'globe', name: '사이트', name_en: 'Sites' }],
    storedPeople: [],
  };
  const rec = (id: string, overrides: Record<string, unknown> = {}) => ({ id, ...fields(), owners: [], ...overrides });

  it('reads a boolean, treats absence as false and refuses the whole file on a non-boolean', () => {
    const ok = mapImportFile({ items: [rec('A', { hide_password: true }), rec('B'), rec('C', { access_method: 'public', hide_password: true })] }, ctx);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.items.map((i) => [i.id, i.hide_password])).toEqual([
      ['A', true],
      ['B', false],
      ['C', false],
    ]);
    const bad = mapImportFile({ items: [rec('A'), rec('B', { hide_password: 'true' })] }, ctx);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors).toContainEqual({ section: 'items', index: 1, field: 'hide_password', reason: 'type' });
  });
});

describe('console-user-prefs constants (REQ-CS2-006)', () => {
  it('names the document and the guide version', () => {
    expect(CONSOLE_DOCS.userPrefs).toBe('console-user-prefs');
    expect(AUTOFILL_GUIDE_VERSION).toBe(1);
  });
});
