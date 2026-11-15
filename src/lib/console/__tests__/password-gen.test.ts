import { afterEach, describe, expect, it, vi } from 'vitest';
import { PASSWORD_CHARSET, PASSWORD_SYMBOLS, generatePassword, randomIndex } from '../password-gen';

// SPEC-CONSOLE-002 AC-CS2-011: 20자, 네 종류 각 1자 이상, 허용 문자만, crypto.getRandomValues 사용,
// 거부 표본추출(나머지 편향 없음).
describe('generatePassword', () => {
  afterEach(() => vi.restoreAllMocks());

  it('10,000번 모두 20자이고 소문자·대문자·숫자·기호가 1자 이상, 허용 문자 밖 문자 없음', () => {
    const allowed = new Set(PASSWORD_CHARSET);
    const symbols = new Set(PASSWORD_SYMBOLS);
    for (let i = 0; i < 10_000; i++) {
      const pw = generatePassword();
      expect(pw).toHaveLength(20);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect([...pw].some((c) => symbols.has(c))).toBe(true);
      for (const c of pw) expect(allowed.has(c)).toBe(true);
    }
  });

  it('난수원으로 crypto.getRandomValues 를 쓴다', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    generatePassword();
    expect(spy).toHaveBeenCalled();
  });

  it('허용 범위 밖 바이트는 버리고 범위 안 바이트로만 정한다', () => {
    // n = 26 이면 256 - 256 % 26 = 234 이상은 버린다.
    const bytes = [250, 240, 234, 5];
    let used = 0;
    const fill = (b: Uint8Array) => {
      for (let i = 0; i < b.length; i++) b[i] = bytes[used++];
      return b;
    };
    expect(randomIndex(26, fill)).toBe(5);
    expect(used).toBe(4);
    // 경계 바로 아래 값은 받는다: 233 % 26 = 25
    const one = (b: Uint8Array) => {
      b[0] = 233;
      return b;
    };
    expect(randomIndex(26, one)).toBe(25);
  });

  it('같은 범위 안 바이트열이면 버려진 바이트가 결과에 영향을 주지 않는다', () => {
    // 0 은 어떤 n 에서도 범위 안이고, 255 는 2의 거듭제곱이 아닌 n 에서 버려진다.
    // 2의 거듭제곱 n 에서는 버림이 없어 255 가 들어가므로, 비교는 거부가 일어나는 n 만 쓰는 randomIndex 로 한다.
    const zeros = (b: Uint8Array) => b.fill(0);
    let k = 0;
    const withJunk = (b: Uint8Array) => {
      b[0] = k++ % 2 === 0 ? 255 : 0;
      return b;
    };
    for (const n of [3, 10, 13, 26, 75]) {
      k = 0;
      expect(randomIndex(n, withJunk)).toBe(randomIndex(n, zeros));
    }
  });
});
