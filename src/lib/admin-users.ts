import crypto from 'crypto';

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface AdminUser {
  email: string;
  role: AdminRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  failedAttempts?: number;
  lockedUntil?: string;
  totpSecret?: string;
  totpEnabled?: boolean;
}

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const iterations = 100_000;
  const hash = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256');
  return `pbkdf2$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  const salt = Buffer.from(parts[2], 'base64');
  const expected = Buffer.from(parts[3], 'base64');
  const got = crypto.pbkdf2Sync(plain, salt, iterations, expected.length, 'sha256');
  return crypto.timingSafeEqual(expected, got);
}
