import { describe, it, expect } from 'vitest';
import { isConsoleNext, sanitizeNextPath } from '@/lib/google-oauth';

// SPEC-CONSOLE-001 REQ-CON-002 / AC-CON-003 / design.md §2.1: which return paths select the
// console mode of the shared Google OAuth flow.

describe('isConsoleNext / sanitizeNextPath', () => {
  it.each([
    ['/console', true, '/console'],
    ['/console/', true, '/console/'],
    ['/console/x', true, '/console/x'],
    ['/console/x?tab=1#h', true, '/console/x?tab=1#h'],
    ['/console?next=1', true, '/console?next=1'],
    ['/console/%252E%252E/x', true, '/console/%252E%252E/x'],
    // not console paths -> the existing /admin rule
    ['/console-evil', false, '/admin'],
    ['/consolex', false, '/admin'],
    ['/Console', false, '/admin'],
    ['//evil.io/console', false, '/admin'],
    ['https://evil.io/console', false, '/admin'],
    ['/console\\evil.io', false, '/admin'],
    ['/%2Fevil.io', false, '/admin'],
    ['/console%2F..%2Fadmin', false, '/admin'],
    ['/console\u0000', false, '/admin'],
    ['/console/\n', false, '/admin'],
    ['console', false, '/admin'],
    ['', false, '/admin'],
    // dot segments in literal or percent-encoded form
    ['/console/../admin', false, '/admin'],
    ['/console/%2E%2E/admin', false, '/admin'],
    ['/console/./../admin', false, '/admin'],
    ['/console/.', false, '/admin'],
    ['/console/%2e', false, '/admin'],
    ['/console/%2e%2E/x', false, '/admin'],
    ['/console/.%2e/x', false, '/admin'],
    ['/console/..?x=1', false, '/admin'],
    // admin values still pass through unchanged
    ['/admin/blog', false, '/admin/blog'],
  ])('%j -> isConsoleNext %s, sanitize %j', (raw, consoleMode, sanitized) => {
    expect(isConsoleNext(raw)).toBe(consoleMode);
    expect(sanitizeNextPath(raw)).toBe(sanitized);
  });

  it('rejects non-strings', () => {
    expect(isConsoleNext(null)).toBe(false);
    expect(isConsoleNext(undefined)).toBe(false);
  });

  it('keeps every accepted console path under /console after URL normalisation (open-redirect guard)', () => {
    const accepted = ['/console', '/console/', '/console/x', '/console/%252E%252E/x', '/console/a/b?c=d'];
    for (const next of accepted) {
      expect(isConsoleNext(next)).toBe(true);
      const u = new URL(next, 'https://zoellife.com/api/admin/auth/google/callback');
      expect(u.origin).toBe('https://zoellife.com');
      expect(u.pathname === '/console' || u.pathname.startsWith('/console/')).toBe(true);
    }
  });
});
