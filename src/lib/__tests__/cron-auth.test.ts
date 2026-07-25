import { describe, it, expect, afterEach } from 'vitest';
import { authorizeCron, type HeaderCarrier } from '@/lib/cron-auth';

// 2026-07-26 사고 회귀 방지: 위조 가능한 x-vercel-cron 헤더 단독으로
// 크론 엔드포인트가 열리면 안 된다(그 경로로 고객 PII 전체 DB 유출이 실증됨).

function req(headers: Record<string, string>): HeaderCarrier {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { headers: { get: (name: string) => lower[name.toLowerCase()] ?? null } };
}

const ORIGINAL = process.env.CRON_SECRET;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
});

describe('authorizeCron — CRON_SECRET 설정된 경우', () => {
  const SECRET = 'test-cron-secret-0123456789';

  it('Bearer 시크릿이 일치하면 통과한다', () => {
    process.env.CRON_SECRET = SECRET;
    const r = authorizeCron(req({ authorization: `Bearer ${SECRET}` }));
    expect(r).toEqual({ ok: true, via: 'secret' });
  });

  it('x-cron-secret 헤더로도 통과한다', () => {
    process.env.CRON_SECRET = SECRET;
    expect(authorizeCron(req({ 'x-cron-secret': SECRET })).ok).toBe(true);
  });

  it('x-vercel-cron 헤더 단독은 거부한다 (사고 회귀 방지)', () => {
    process.env.CRON_SECRET = SECRET;
    const r = authorizeCron(req({ 'x-vercel-cron': '1' }));
    expect(r.ok).toBe(false);
  });

  it('틀린 시크릿은 거부한다', () => {
    process.env.CRON_SECRET = SECRET;
    expect(authorizeCron(req({ authorization: 'Bearer wrong-value' })).ok).toBe(false);
  });

  it('헤더가 전혀 없으면 거부한다', () => {
    process.env.CRON_SECRET = SECRET;
    expect(authorizeCron(req({})).ok).toBe(false);
  });
});

describe('authorizeCron — CRON_SECRET 미설정(레거시 폴백)', () => {
  it('x-vercel-cron 을 임시 허용하되 legacy-header 로 표시한다', () => {
    delete process.env.CRON_SECRET;
    const r = authorizeCron(req({ 'x-vercel-cron': '1' }));
    expect(r).toEqual({ ok: true, via: 'legacy-header' });
  });

  it('아무 헤더도 없으면 거부한다', () => {
    delete process.env.CRON_SECRET;
    expect(authorizeCron(req({})).ok).toBe(false);
  });

  it('빈 문자열 CRON_SECRET 은 미설정으로 취급한다', () => {
    process.env.CRON_SECRET = '   ';
    expect(authorizeCron(req({ 'x-vercel-cron': '1' })).ok).toBe(true);
  });
});
