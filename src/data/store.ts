/**
 * 외부 판매 채널 링크 — 네이버 스마트스토어.
 *
 * SMARTSTORE_LOGIN_URL: 클릭 시 네이버 로그인 모듈을 먼저 띄우고, 로그인이
 * 끝나면 스토어 제품 페이지로 이동한다 (2026-08-13 요청). 서드파티 사이트가
 * 네이버 세션 SSO 를 직접 제어할 수는 없으므로, 네이버 공식 로그인 페이지의
 * url 리다이렉트 파라미터를 사용한다 — 네이버 서비스들이 쓰는 표준 패턴.
 */
export const SMARTSTORE_PRODUCT_URL =
  'https://smartstore.naver.com/agarwooding/products/13678448200';

export const SMARTSTORE_LOGIN_URL =
  `https://nid.naver.com/nidlogin.login?mode=form&url=${encodeURIComponent(SMARTSTORE_PRODUCT_URL)}`;

/** 네이버 브랜드 그린 — 스토어 진입 버튼 전용. */
export const NAVER_GREEN = '#03c75a';
