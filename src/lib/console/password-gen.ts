// 공유 계정 비밀번호 생성기 (SPEC-CONSOLE-002 REQ-CS2-011, design.md §2.3).
// 암호학적 난수(crypto.getRandomValues)와 거부 표본추출로 나머지 편향 없이 고른다. 외부 라이브러리 없음.

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
export const PASSWORD_SYMBOLS = '!@#$%^&*-_=+?';
export const PASSWORD_CHARSET = LOWER + UPPER + DIGITS + PASSWORD_SYMBOLS;

/** 바이트 배열을 난수로 채우는 함수. 기본은 crypto.getRandomValues. */
export type RandomFill = (buf: Uint8Array) => Uint8Array;

// 호출할 때마다 전역 crypto 를 읽는다(테스트의 스파이가 걸리도록).
const defaultFill: RandomFill = (buf) => globalThis.crypto.getRandomValues(buf);

/**
 * 0 이상 n 미만의 정수 하나. 256 을 n 으로 나눈 나머지만큼의 위쪽 바이트는 버린다(거부 표본추출).
 * n 은 1~256.
 */
export function randomIndex(n: number, fill: RandomFill = defaultFill): number {
  if (!Number.isInteger(n) || n < 1 || n > 256) throw new RangeError('n must be 1..256');
  const limit = 256 - (256 % n);
  const buf = new Uint8Array(1);
  for (;;) {
    fill(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

// @MX:NOTE: [AUTO] 난수원은 crypto.getRandomValues 뿐이고 Math.random 을 쓰지 않는다 (REQ-CS2-011).
/** 소문자·대문자·숫자·기호가 각각 1자 이상인 비밀번호. 길이는 4 이상(기본 20). */
export function generatePassword(length = 20, fill: RandomFill = defaultFill): string {
  if (!Number.isInteger(length) || length < 4) throw new RangeError('length must be >= 4');
  const pick = (set: string) => set[randomIndex(set.length, fill)];
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(PASSWORD_SYMBOLS)];
  while (chars.length < length) chars.push(pick(PASSWORD_CHARSET));
  // Fisher–Yates 섞기도 같은 난수원으로 한다.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, fill);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
