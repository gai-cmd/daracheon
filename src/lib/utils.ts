export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

/**
 * priceDisplay('180,000원') 처럼 화면에 이미 공개된 표시 가격에서 숫자 KRW 금액을 뽑는다.
 * price(숫자) 가 0 인 레거시 레코드의 Offer 를 복원하는 용도.
 * - '가격 문의' / '문의' 등 비숫자 표기는 null (없는 가격을 만들어내지 않는다)
 * - '180,000~250,000원' 처럼 숫자 그룹이 2개 이상이면 null (단일 Offer 로 단정하지 않는다)
 */
export function parseDisplayPrice(display?: string | null): number | null {
  if (!display) return null;
  const groups = display.match(/\d[\d,]*/g);
  if (!groups || groups.length !== 1) return null;
  const n = Number(groups[0].replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
