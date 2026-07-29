import crypto from 'crypto';

/**
 * 답변 메일 열람 추적 (tracking pixel).
 *
 * 메일 HTML 끝에 1x1 투명 GIF 를 심고, 고객 메일 클라이언트가 그 이미지를
 * 불러오면 /api/mail/open 이 열람으로 기록한다.
 *
 * ⚠️ 정확도 한계 — 이 값은 "열람했다"는 증거이지 "열람하지 않았다"는 증거가
 * 아니다. 반드시 이 전제로 UI 문구를 쓸 것:
 *   - 이미지 자동 로드를 끈 클라이언트(네이버·다음 기본값, Outlook 일부)는
 *     실제로 읽어도 기록되지 않는다 → 미열람으로 보여도 안 읽은 게 아니다.
 *   - Gmail 은 이미지를 구글 프록시로 선(先)캐시하므로, 열람 없이 프록시
 *     프리페치만으로 1회 기록될 수 있다 → 과다 집계 쪽 오차.
 * 그래서 필드명은 opened*(열람) 이지만 표시는 "열람 확인 / 확인 안 됨" 으로 한다.
 *
 * 위조 방지: inquiryId 를 HMAC 서명해 토큰으로 쓴다. 서명이 없으면 누구나
 * 임의 문의를 열람 처리할 수 있다.
 */

const TOKEN_VERSION = 'v1';

function secret(): string | null {
  // 전용 시크릿 우선, 없으면 관리자 세션 시크릿 폴백 — QR/시리얼과 동일 규약.
  // (프로젝트 규약: 리터럴 하드코딩 금지)
  const s = process.env.MAIL_TRACK_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

function sign(inquiryId: string, key: string): string {
  return crypto
    .createHmac('sha256', key)
    .update(`${TOKEN_VERSION}:${inquiryId}`)
    .digest('base64url')
    .slice(0, 32);
}

/** 추적 토큰 생성. 시크릿 미설정 시 null → 픽셀을 심지 않는다. */
export function buildTrackToken(inquiryId: string): string | null {
  const key = secret();
  if (!key) return null;
  return `${inquiryId}.${sign(inquiryId, key)}`;
}

/** 토큰 검증 → inquiryId. 위조·시크릿 미설정 시 null. */
export function verifyTrackToken(token: string): string | null {
  const key = secret();
  if (!key) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const inquiryId = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(inquiryId, key);
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? inquiryId : null;
}

/** 메일 본문에 삽입할 추적 픽셀 HTML. 미설정이면 빈 문자열. */
export function trackingPixelHtml(inquiryId: string): string {
  const token = buildTrackToken(inquiryId);
  if (!token) return '';
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://zoellife.com';
  const url = `${site}/api/mail/open/${encodeURIComponent(token)}.gif`;
  return `<img src="${url}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
}

/** 1x1 투명 GIF 바이트. */
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/** 어드민·Slack 공용 열람 상태 표시 문구. */
export function openStatusLabel(inq: { openedAt?: string; openCount?: number }): string {
  if (!inq.openedAt) return '확인 안 됨';
  const n = inq.openCount ?? 1;
  return n > 1 ? `열람 확인 (${n}회)` : '열람 확인';
}
