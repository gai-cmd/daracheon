import { describe, it, expect } from 'vitest';
import { checkEnv, ENV_REGISTRY } from '@/lib/env-check';

describe('env-check', () => {
  it('registry has no duplicate names', () => {
    const names = ENV_REGISTRY.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never throws on empty env and reports all as missing', () => {
    const r = checkEnv({});
    expect(r.presentCount).toBe(0);
    expect(r.totalCount).toBe(ENV_REGISTRY.length);
    expect(r.missingCritical.length).toBeGreaterThan(0);
  });

  it('flags a missing feature var (THESIS_TOKEN — 오늘의 실제 사례)', () => {
    const env = Object.fromEntries(ENV_REGISTRY.map((s) => [s.name, 'set']));
    delete env.THESIS_TOKEN;
    const r = checkEnv(env);
    expect(r.missingFeature.map((i) => i.name)).toContain('THESIS_TOKEN');
    expect(r.missingCritical).toHaveLength(0);
  });

  it('treats empty / whitespace-only as absent', () => {
    const r = checkEnv({ ADMIN_SESSION_SECRET: '   ', BLOB_DATA_PREFIX: '' });
    const names = [...r.missingCritical, ...r.missingFeature].map((i) => i.name);
    expect(names).toContain('ADMIN_SESSION_SECRET');
    expect(names).toContain('BLOB_DATA_PREFIX');
  });

  it('counts all present when fully configured', () => {
    const env = Object.fromEntries(ENV_REGISTRY.map((s) => [s.name, 'x']));
    const r = checkEnv(env);
    expect(r.presentCount).toBe(r.totalCount);
    expect(r.missingCritical).toHaveLength(0);
    expect(r.missingFeature).toHaveLength(0);
  });

  it('never exposes values — only presence booleans', () => {
    const r = checkEnv({ ADMIN_SESSION_SECRET: 'super-secret-value' });
    // 리포트의 어떤 항목도 실제 값 문자열을 담지 않는다.
    const serialized = JSON.stringify(r);
    expect(serialized).not.toContain('super-secret-value');
  });
});
