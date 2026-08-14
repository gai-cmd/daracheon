/**
 * 외부 판매 채널 링크 — 네이버 스마트스토어.
 *
 * SMARTSTORE_PRODUCT_URL: 모든 구매 CTA 가 이 주소로 직행한다. 2026-08-13 에는
 * nid.naver.com 로그인 페이지를 먼저 띄우고 url 파라미터로 되돌아오게 했으나,
 * 로그인 모듈이 구매 진입을 막는 장벽이 되어 2026-08-14 에 제거했다.
 * 스마트스토어는 비로그인 상태에서도 상품 상세를 보여주고, 결제 단계에서
 * 네이버가 알아서 로그인을 요구하므로 앞단 로그인 강제는 불필요하다.
 */
export const SMARTSTORE_PRODUCT_URL =
  'https://smartstore.naver.com/agarwooding/products/13678448200';

/** 네이버 브랜드 그린 — 스토어 진입 버튼 전용. */
export const NAVER_GREEN = '#03c75a';
