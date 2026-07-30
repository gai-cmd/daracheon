import { describe, it, expect } from 'vitest';
import { toJpy, formatJpy, formatAmount } from '@/lib/ai-tools/currency';

describe('ai-tools currency', () => {
  it('환산: USD → JPY (기본 환율 155)', () => {
    expect(toJpy(220, 'USD')).toBe(34100);
  });

  it('환산: JPY 는 그대로', () => {
    expect(toJpy(1000, 'JPY')).toBe(1000);
  });

  it('미확정(null/undefined) 금액은 null 로 환산', () => {
    expect(toJpy(null, 'USD')).toBeNull();
    expect(toJpy(undefined, 'USD')).toBeNull();
  });

  it('KRW/BDT 도 환산된다', () => {
    expect(toJpy(30000, 'KRW')).toBe(3300); // 30000 * 0.11
    expect(toJpy(1000, 'BDT')).toBe(1400); // 1000 * 1.4
  });

  it('formatJpy: 미확정은 대시', () => {
    expect(formatJpy(null)).toBe('—');
    expect(formatJpy(34100)).toBe('¥34,100');
  });

  it('formatAmount: 통화 기호 + 천단위 구분', () => {
    expect(formatAmount(220, 'USD')).toBe('$220');
    expect(formatAmount(30000, 'KRW')).toBe('₩30,000');
    expect(formatAmount(null, 'USD')).toBe('—');
  });
});
