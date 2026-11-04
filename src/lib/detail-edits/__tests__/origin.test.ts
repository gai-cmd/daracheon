import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONCEPT_ORIGIN,
  corsAllowedOrigins,
  corsOriginFor,
  getConceptOrigin,
  isSameSiteWrite,
  requestOrigin,
} from '../origin';

afterEach(() => {
  vi.unstubAllEnvs();
});

const req = (headers: Record<string, string>) => new Request('https://zoellife.com/api/x', { method: 'PUT', headers });

describe('시안 오리진', () => {
  it('기본은 상수', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', '');
    expect(CONCEPT_ORIGIN).toBe('https://daeracheon-detail-concepts.vercel.app');
    expect(getConceptOrigin()).toBe(CONCEPT_ORIGIN);
  });

  it('운영에서는 오버라이드 환경변수를 무시한다', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    expect(getConceptOrigin()).toBe(CONCEPT_ORIGIN);
    expect(corsAllowedOrigins()).toEqual([CONCEPT_ORIGIN]);
    expect(corsOriginFor('http://127.0.0.1:4101')).toBeNull();
  });

  it('비운영에서만 오버라이드를 인정한다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    expect(getConceptOrigin()).toBe('http://127.0.0.1:4101');
    expect(corsAllowedOrigins()).toEqual([CONCEPT_ORIGIN, 'http://127.0.0.1:4101']);
    expect(corsOriginFor('http://127.0.0.1:4101')).toBe('http://127.0.0.1:4101');
    vi.stubEnv('NODE_ENV', 'test');
    expect(getConceptOrigin()).toBe('http://127.0.0.1:4101');
  });

  it.each([
    ['경로 포함', 'http://127.0.0.1:4101/x'],
    ['계정정보', 'http://u:p@127.0.0.1:4101'],
    ['다른 스킴', 'ftp://127.0.0.1'],
    ['javascript', 'javascript:alert(1)'],
    ['쓰레기', 'not a url'],
    ['쿼리', 'http://127.0.0.1:4101?x=1'],
  ])('비운영이어도 형식이 틀린 오버라이드는 무시: %s', (_n, value) => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', value);
    expect(getConceptOrigin()).toBe(CONCEPT_ORIGIN);
    expect(corsAllowedOrigins()).toEqual([CONCEPT_ORIGIN]);
  });

  it('CORS: 허용 오리진만 그대로 돌려주고 나머지는 null', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(corsOriginFor(CONCEPT_ORIGIN)).toBe(CONCEPT_ORIGIN);
    for (const o of [null, '', 'null', 'https://evil.test', 'https://zoellife.com', `${CONCEPT_ORIGIN}.evil.test`, `${CONCEPT_ORIGIN}/`]) {
      expect(corsOriginFor(o), String(o)).toBeNull();
    }
  });
});

describe('쓰기 요청 CSRF 판정 (Origin host === Host)', () => {
  it('같은 호스트면 통과', () => {
    expect(isSameSiteWrite(req({ origin: 'https://zoellife.com', host: 'zoellife.com' }))).toBe(true);
    expect(isSameSiteWrite(req({ origin: 'http://127.0.0.1:3100', host: '127.0.0.1:3100' }))).toBe(true);
  });
  it('다른 호스트·시안 오리진·서브도메인·포트 불일치는 거절', () => {
    expect(isSameSiteWrite(req({ origin: CONCEPT_ORIGIN, host: 'zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'https://evil.test', host: 'zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'https://www.zoellife.com', host: 'zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'http://127.0.0.1:3101', host: '127.0.0.1:3100' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'https://zoellife.com.evil.test', host: 'zoellife.com' }))).toBe(false);
  });
  it('Origin 이나 Host 가 없거나 해석 불가면 거절', () => {
    expect(isSameSiteWrite(req({ host: 'zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'https://zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'null', host: 'zoellife.com' }))).toBe(false);
    expect(isSameSiteWrite(req({ origin: 'zoellife.com', host: 'zoellife.com' }))).toBe(false);
  });
  it('요청 오리진 — Host 헤더 우선, 스킴은 요청 URL', () => {
    expect(requestOrigin(new Request('https://zoellife.com/admin/x?y=1'))).toBe('https://zoellife.com');
    expect(requestOrigin(new Request('http://127.0.0.1:3100/a'))).toBe('http://127.0.0.1:3100');
    // NextRequest 는 URL 의 127.0.0.1 을 localhost 로 바꾼다 — Host 헤더가 실제 접속 주소를 지킨다.
    expect(requestOrigin(req({ host: '127.0.0.1:3100' }) as unknown as Request)).toBe('https://127.0.0.1:3100');
    expect(requestOrigin(new Request('http://localhost:3100/a', { headers: { host: '127.0.0.1:3100' } }))).toBe('http://127.0.0.1:3100');
  });
  it('이상한 Host 헤더는 무시하고 요청 URL 의 오리진으로 돌아간다', () => {
    for (const host of ['evil.test/x', 'a b', 'evil.test"><script>', 'a@evil.test', 'x:99999999', '']) {
      expect(requestOrigin(new Request('https://zoellife.com/a', { headers: { host } })), host).toBe('https://zoellife.com');
    }
  });
});
