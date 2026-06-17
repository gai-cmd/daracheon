/**
 * User-Agent 파싱 (의존성 없는 경량 휴리스틱).
 * 정밀 분석이 목적이 아니라 마케팅 리포트용 대략적 분류(모바일/데스크톱,
 * iOS/Android, 주요 브라우저) + 봇 제외가 목적이라 가벼운 규칙으로 충분.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

export interface ParsedUa {
  device: DeviceType;
  os: string;
  browser: string;
  isBot: boolean;
}

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|kakaotalk-scrap|naverbot|yeti|googlebot|duckduckbot|baiduspider|yandex|petalbot|semrush|ahrefs|preview|monitor|curl|wget|python-requests|axios|headless|lighthouse|gtmetrix|pingdom/i;

function detectOs(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(ua: string): string {
  // 순서 주의: 파생 브라우저를 먼저 판별.
  if (/kakaotalk/i.test(ua)) return 'KakaoTalk';
  if (/naver\(inapp/i.test(ua) || /naver/i.test(ua)) return 'Naver';
  if (/line\//i.test(ua)) return 'LINE';
  if (/instagram/i.test(ua)) return 'Instagram';
  if (/fban|fbav/i.test(ua)) return 'Facebook';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/samsungbrowser/i.test(ua)) return 'Samsung';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/crios/i.test(ua)) return 'Chrome';
  if (/fxios/i.test(ua)) return 'Firefox';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/version\/.*safari/i.test(ua) || /safari/i.test(ua)) return 'Safari';
  return 'Unknown';
}

export function parseUserAgent(uaRaw: string | null | undefined): ParsedUa {
  const ua = (uaRaw ?? '').trim();
  if (!ua) return { device: 'unknown', os: 'Unknown', browser: 'Unknown', isBot: false };

  const isBot = BOT_RE.test(ua);
  if (isBot) return { device: 'bot', os: detectOs(ua), browser: 'Bot', isBot: true };

  const os = detectOs(ua);
  const browser = detectBrowser(ua);

  let device: DeviceType;
  if (/ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)) || /tablet/i.test(ua)) {
    device = 'tablet';
  } else if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    device = 'mobile';
  } else if (os === 'iOS' || os === 'Android') {
    device = 'mobile';
  } else {
    device = 'desktop';
  }

  return { device, os, browser, isBot };
}
