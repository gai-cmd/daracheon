import { beforeEach, describe, expect, it, vi } from 'vitest';

// SPEC-CONSOLE-001 M6 — operational registration (design.md §8): env-check lists the console
// variables by presence only, and the snapshot layer backs up every console document.

vi.mock('@vercel/blob', () => ({ list: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async () => []),
  readSingle: vi.fn(async () => null),
  writeSingle: vi.fn(async () => undefined),
  restoreData: vi.fn(async () => undefined),
  isBlobEnabled: () => false,
}));

import { checkEnv, ENV_REGISTRY } from '@/lib/env-check';
import { DB_FILES, SINGLETON_FILES, restoreFromPayload, type SnapshotPayload } from '@/lib/backup';
import { restoreData } from '@/lib/db';
import { CONSOLE_DOCS } from '../types';

const CONSOLE_VARS = ['CONSOLE_SESSION_SECRET', 'CONSOLE_SECRETS_KEY', 'CONSOLE_ADMIN_EMAILS'];

describe('env-check — console variables', () => {
  it.each(CONSOLE_VARS)('registers %s as a feature variable', (name) => {
    const spec = ENV_REGISTRY.find((s) => s.name === name);
    expect(spec).toBeDefined();
    expect(spec!.severity).toBe('feature');
    expect(spec!.purpose.length).toBeGreaterThan(0);
    expect(spec!.ifMissing.length).toBeGreaterThan(0);
  });

  it('reports console variables as missing feature vars when unset', () => {
    const names = checkEnv({}).missingFeature.map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(CONSOLE_VARS));
  });

  it('reports presence only — never the values', () => {
    const env = {
      CONSOLE_SESSION_SECRET: 'session-secret-value-0123456789abcdef',
      CONSOLE_SECRETS_KEY: 'ab'.repeat(32),
      CONSOLE_ADMIN_EMAILS: 'someone@example.test',
    };
    const report = checkEnv(env);
    for (const name of CONSOLE_VARS) expect(report.items.find((i) => i.name === name)?.present).toBe(true);
    const serialized = JSON.stringify(report);
    for (const value of Object.values(env)) expect(serialized).not.toContain(value);
  });
});

describe('backup — console documents', () => {
  const collections = Object.values(CONSOLE_DOCS).filter((d) => d !== CONSOLE_DOCS.settings);

  it('backs up every console collection', () => {
    expect([...DB_FILES]).toEqual(expect.arrayContaining(collections));
  });

  it('backs up console-settings as a singleton, not as a collection', () => {
    expect([...SINGLETON_FILES]).toContain(CONSOLE_DOCS.settings);
    expect([...DB_FILES]).not.toContain(CONSOLE_DOCS.settings);
  });

  it('has no duplicate keys across the two lists', () => {
    const all = [...DB_FILES, ...SINGLETON_FILES];
    expect(new Set(all).size).toBe(all.length);
  });

  describe('restore', () => {
    beforeEach(() => vi.mocked(restoreData).mockClear());

    const payload: SnapshotPayload = {
      createdAt: '2026-11-15T00:00:00.000Z',
      label: 'daily',
      version: '1.2',
      data: {
        'console-items': [{ id: 'i1' }],
        'console-audit-log': [{ id: 'a1' }],
      },
    };

    it('restores console collections but leaves console-audit-log alone by default (like audit-log)', async () => {
      const r = await restoreFromPayload(payload);
      expect(r.restored).toContain('console-items');
      expect(r.skipped).toContain('console-audit-log');
      expect(vi.mocked(restoreData).mock.calls.map((c) => c[0])).not.toContain('console-audit-log');
    });

    it('restores console-audit-log only when restoreAuditLog is set', async () => {
      const r = await restoreFromPayload(payload, { restoreAuditLog: true });
      expect(r.restored).toContain('console-audit-log');
    });
  });
});
