import { describe, it, expect, vi } from 'vitest';

// GET /api/admin/users feeds the user-management table and the blog author dropdown, so any
// signed-in admin role can call it. It must never carry credentials: no password hash and no
// TOTP seed (a plain base32 secret that would let the reader mint valid 2FA codes).
// All fixtures are synthetic.

vi.mock('@/lib/db', () => ({
  readData: vi.fn(async () => [
    {
      email: 'boss@zoellife.com',
      role: 'super_admin',
      passwordHash: 'HASH-FIXTURE',
      totpSecret: 'TOTP-SECRET-FIXTURE',
      totpEnabled: true,
      displayName: 'Boss',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      email: 'writer@zoellife.com',
      role: 'editor',
      passwordHash: 'HASH-FIXTURE-2',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ]),
  readDataForWrite: vi.fn(),
  writeDataMerged: vi.fn(),
}));
// Imported by the route for its write handlers only; stubbed to keep this test free of mail/blob code.
vi.mock('@/lib/audit', () => ({ logAdmin: vi.fn() }));
vi.mock('@/lib/mail', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/backup', () => ({ snapshotBeforeDestructive: vi.fn() }));

import { GET } from '../route';

describe('GET /api/admin/users', () => {
  it('never returns passwordHash or totpSecret', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const raw = JSON.stringify(await res.clone().json());
    expect(raw).not.toContain('HASH-FIXTURE');
    expect(raw).not.toContain('TOTP-SECRET-FIXTURE');
    const body = (await res.json()) as { users: Array<Record<string, unknown>>; total: number };
    for (const u of body.users) {
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).not.toHaveProperty('totpSecret');
    }
  });

  it('keeps everything the admin UI needs, including whether 2FA is on', async () => {
    const body = (await (await GET()).json()) as { users: Array<Record<string, unknown>>; total: number };
    expect(body.total).toBe(2);
    expect(body.users[0]).toMatchObject({
      email: 'boss@zoellife.com',
      role: 'super_admin',
      totpEnabled: true,
      displayName: 'Boss',
    });
    expect(body.users[1]).toMatchObject({ email: 'writer@zoellife.com', role: 'editor' });
  });
});
