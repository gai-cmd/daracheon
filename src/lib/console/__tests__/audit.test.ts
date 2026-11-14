import { describe, it, expect, beforeEach, vi } from 'vitest';

// SPEC-CONSOLE-001 console audit document (design.md §5.2, AC-CON-016 trimming part).

const db = vi.hoisted(() => ({
  docs: new Map<string, Array<Record<string, unknown>>>(),
  failWrites: false,
}));

// Mirrors the merge semantics of writeDataMerged that matter here: a record present in the fresh
// copy but missing from the new array is revived, unless its key is in removedIds.
vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async (name: string) => [...(db.docs.get(name) ?? [])]),
  readDataUncached: vi.fn(async (name: string) => [...(db.docs.get(name) ?? [])]),
  writeDataMerged: vi.fn(async (name: string, next: Array<Record<string, unknown>>, opts: { removedIds?: string[] } = {}) => {
    if (db.failWrites) throw new Error('blob write failed');
    const removed = new Set(opts.removedIds ?? []);
    const fresh = db.docs.get(name) ?? [];
    const nextIds = new Set(next.map((r) => r.id));
    const revived = fresh.filter((r) => !nextIds.has(r.id) && !removed.has(r.id as string));
    db.docs.set(name, [...revived, ...next.filter((r) => !removed.has(r.id as string))]);
  }),
}));

import {
  CONSOLE_AUDIT_MAX_ENTRIES,
  appendConsoleAudit,
  countRecentCredentialReveals,
  readRecentConsoleAudit,
} from '../audit';

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);

beforeEach(() => {
  db.docs = new Map();
  db.failWrites = false;
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

describe('appendConsoleAudit', () => {
  it('appends an entry stamped with id, time and module console', async () => {
    const entry = await appendConsoleAudit({
      actor: 'a@try-n.com',
      actorRole: 'console-member',
      action: 'credential.view',
      targetId: 'item-1',
      meta: { field: 'password' },
    });
    expect(entry).toMatchObject({ module: 'console', action: 'credential.view', at: new Date(NOW).toISOString() });
    expect(typeof entry.id).toBe('string');
    expect(db.docs.get('console-audit-log')).toHaveLength(1);
  });

  it('throws when the write fails (callers fail closed)', async () => {
    db.failWrites = true;
    await expect(
      appendConsoleAudit({ actor: 'a@try-n.com', actorRole: 'console-member', action: 'credential.view' })
    ).rejects.toThrow();
  });

  it(`keeps at most ${5000} entries and trimmed entries never come back`, async () => {
    expect(CONSOLE_AUDIT_MAX_ENTRIES).toBe(5000);
    db.docs.set(
      'console-audit-log',
      Array.from({ length: 5000 }, (_, i) => ({
        id: `old-${i}`,
        at: new Date(NOW - 1_000_000 + i).toISOString(),
        actor: 'a@try-n.com',
        actorRole: 'console-member',
        module: 'console',
        action: 'item.update',
      }))
    );
    await appendConsoleAudit({ actor: 'a@try-n.com', actorRole: 'console-member', action: 'item.create' });
    await appendConsoleAudit({ actor: 'a@try-n.com', actorRole: 'console-member', action: 'item.delete' });

    const log = db.docs.get('console-audit-log')!;
    expect(log).toHaveLength(5000);
    expect(log.some((e) => e.id === 'old-0' || e.id === 'old-1')).toBe(false);
    expect(log.at(-1)).toMatchObject({ action: 'item.delete' });
  });
});

describe('reading', () => {
  beforeEach(() => {
    const at = (msAgo: number) => new Date(NOW - msAgo).toISOString();
    db.docs.set('console-audit-log', [
      { id: '1', at: at(11 * 60_000), actor: 'u@try-n.com', action: 'credential.view', module: 'console' },
      { id: '2', at: at(9 * 60_000), actor: 'u@try-n.com', action: 'credential.copy', module: 'console' },
      { id: '3', at: at(60_000), actor: 'U@try-n.com', action: 'credential.view', module: 'console' },
      { id: '4', at: at(30_000), actor: 'u@try-n.com', action: 'credential.deny', module: 'console' },
      { id: '5', at: at(20_000), actor: 'other@try-n.com', action: 'credential.view', module: 'console' },
    ]);
  });

  it('counts a user’s view and copy entries inside the window only', async () => {
    expect(await countRecentCredentialReveals('u@try-n.com', { windowMs: 10 * 60_000 })).toBe(2);
  });

  it('returns the most recent entries first', async () => {
    expect((await readRecentConsoleAudit(3)).map((e) => e.id)).toEqual(['5', '4', '3']);
  });
});
