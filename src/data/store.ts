/**
 * 외부 판매 채널 링크 — 네이버 스마트스토어.
 *
 * SMARTSTORE_PRODUCT_URL: 모든 구매 CTA 가 이 주소로 직행한다. 2026-08-13 에는
 * nid.naver.com 로그인 페이지를 먼저 띄우고 url 파라미터로 되돌아오게 했으나,
 * 로그인 모듈이 구매 진입을 막는 장벽이 되어 2026-08-14 에 제거했다.
 * 스마트스토어는 비로그인 상태에서도 상품 상세를 보여주고, 결제 단계에서
 * 네이버가 알아서 로그인을 요구하므로 앞단 로그인 강제는 불필요하다.
 *
 * 2026-10-19: 네이버 쇼핑 마케팅 링크(mkt.shopping.naver.com)로 교체 — 외부 유입
 * 링크로 잡혀 판매수수료가 2%p 낮게 적용된다.
 */
export const SMARTSTORE_PRODUCT_URL =
  'https://mkt.shopping.naver.com/link/6ad5a17057f8153efa4ec3e9';

/**
 * 저장된 콘텐츠(블로그 본문 등)에 박힌 옛 스마트스토어 주소를 렌더 시점에
 * SMARTSTORE_PRODUCT_URL 로 바꾼다. 라이브 데이터는 직접 고치지 않는다는
 * 원칙 때문에 Blob 의 원문은 그대로 두고 화면에서만 치환한다.
 */
const LEGACY_SMARTSTORE_URL_RE =
  /https?:\/\/(?:m\.)?smartstore\.naver\.com\/agarwooding(?![\w-])(?:[/?#][^"'\s<>]*)?/gi;

export function rewriteSmartstoreLinks(html: string): string {
  if (!html) return html;
  return html.replace(LEGACY_SMARTSTORE_URL_RE, SMARTSTORE_PRODUCT_URL);
}

/** 네이버 브랜드 그린 — 스토어 진입 버튼 전용. */
export const NAVER_GREEN = '#03c75a';
