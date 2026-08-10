/**
 * 환경변수 점검 (읽기 전용·비파괴).
 *
 * 목적: 오늘(2026-07-08) /thesis 가 THESIS_TOKEN 미설정으로 잠긴 것처럼,
 * "환경변수 누락"은 사이트 불안정의 흔한 원인이다. 이 모듈은 런타임 핵심
 * 변수들의 **설정 여부만** 판정해 관리자 진단 화면·서버 로그에 노출한다.
 *
 * 안전 원칙:
 * - 값(secret)은 절대 반환/노출하지 않는다 — 존재 여부(boolean)만.
 * - 절대 throw 하지 않는다 — 점검이 사이트를 멈추게 해선 안 된다.
 * - CLI 스크립트 전용 인자(DRY_RUN·IN_DIR 등)는 대상에서 제외한다.
 */

export type EnvSeverity = 'critical' | 'feature' | 'optional';

export interface EnvSpec {
  name: string;
  severity: EnvSeverity;
  /** 이 변수의 용도 */
  purpose: string;
  /** 미설정 시 나타나는 증상 */
  ifMissing: string;
}

export interface EnvStatus extends EnvSpec {
  present: boolean;
}

export interface EnvReport {
  items: EnvStatus[];
  missingCritical: EnvStatus[];
  missingFeature: EnvStatus[];
  presentCount: number;
  totalCount: number;
}

// 런타임(사이트) 핵심 변수. severity 는 "미설정 시 영향" 기준.
export const ENV_REGISTRY: EnvSpec[] = [
  // ── critical: 미설정 시 사이트가 깨지거나 보안이 약해짐 ──
  {
    name: 'ADMIN_SESSION_SECRET',
    severity: 'critical',
    purpose: '관리자 세션 토큰 HMAC 서명 키',
    ifMissing: '개발용 약한 키로 폴백 — 운영 세션 위조 위험',
  },
  {
    name: 'PARTNER_SESSION_SECRET',
    // 2026-07-26 정정: 이전엔 critical + '개발용 약한 키로 폴백' 이었으나 오탐이다.
    // partner-auth.ts 는 PARTNER_SESSION_SECRET || ADMIN_SESSION_SECRET 을 쓰고,
    // 둘 다 없고 Vercel 환경이면 throw 한다 — 약한 키는 로컬에서만 도달한다.
    // 매일 찍히는 거짓 CRITICAL 은 알람 피로를 만들어 진짜 신호를 가린다.
    severity: 'feature',
    purpose: '파트너 포털 세션 서명 키(미설정 시 ADMIN_SESSION_SECRET 재사용)',
    ifMissing: 'ADMIN_SESSION_SECRET 으로 폴백 — 동작엔 문제 없으나 두 세션의 키가 묶여 함께 로테이션됨',
  },
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    severity: 'critical',
    purpose: 'Vercel Blob 콘텐츠 읽기/쓰기 토큰',
    ifMissing: '콘텐츠·이미지 업로드·저장 동작 불가',
  },
  {
    name: 'BLOB_DATA_PREFIX',
    severity: 'critical',
    purpose: '콘텐츠 JSON prefix(고객 PII 보호용 비밀 경로)',
    ifMissing: '라이브 콘텐츠 대신 시드로 폴백 / 저장 경로 오류',
  },
  {
    name: 'CRON_SECRET',
    severity: 'critical',
    purpose: '크론(일일 백업 등) 호출 인증',
    ifMissing: '크론 엔드포인트 무인증 노출 또는 백업 미실행',
  },

  // ── feature: 미설정 시 해당 기능만 꺼짐/제한 ──
  {
    name: 'THESIS_TOKEN',
    severity: 'feature',
    purpose: '논문 아카이브(/thesis) 게이트 토큰',
    ifMissing: '/thesis 잠금(401)',
  },
  {
    name: 'THESIS_PASSWORD',
    severity: 'feature',
    purpose: '논문 아카이브 잠금 해제 비밀번호',
    ifMissing: '/thesis 잠금 해제 불가',
  },
  {
    name: 'BACKUP_ENCRYPTION_KEY',
    severity: 'feature',
    purpose: '오프사이트 백업(Tier2 GitHub·Tier3 메일) AES-256-GCM 암호화 키',
    ifMissing: '오프사이트 백업 암호화 불가 — 평문 전송 위험으로 스킵',
  },
  {
    name: 'RESEND_API_KEY',
    severity: 'feature',
    purpose: '메일 발송(Resend)',
    ifMissing: 'Resend 경로 메일 발송 불가(SMTP 폴백 필요)',
  },
  {
    name: 'MAIL_FROM',
    severity: 'feature',
    purpose: '발신 이메일 주소',
    ifMissing: '발송 메일 From 헤더 누락/거부 가능',
  },
  {
    name: 'TELEGRAM_BOT_TOKEN',
    severity: 'feature',
    purpose: '텔레그램 알림 봇 토큰',
    ifMissing: '텔레그램 알림 발송 불가',
  },
  {
    name: 'TELEGRAM_CHAT_ID',
    severity: 'feature',
    purpose: '텔레그램 알림 수신 채팅 ID',
    ifMissing: '텔레그램 알림 발송 불가',
  },
  {
    name: 'GITHUB_BACKUP_TOKEN',
    severity: 'feature',
    purpose: 'Tier2 GitHub 백업 푸시 토큰',
    ifMissing: 'GitHub 오프사이트 백업 미실행',
  },
  // 아래 3개는 각 백업 티어의 "짝" 변수다. 토큰만 있고 이게 없으면 해당 티어가
  // 조용히 skip 된다(backup-github getConfig 는 token+repo 둘 다 요구, secondary 는
  // store id, email 은 수신자). 2026-07-26 백업 11일 침묵 사고의 핵심이 "미설정 시
  // 무음 skip" 이었으므로, 진단 화면에서 티어별 준비 상태가 보이도록 등록한다.
  {
    name: 'GITHUB_BACKUP_REPO',
    severity: 'feature',
    purpose: 'Tier2 GitHub 백업 대상 저장소(owner/repo)',
    ifMissing: 'GITHUB_BACKUP_TOKEN 이 있어도 Tier2 백업 무음 skip',
  },
  {
    name: 'BACKUP_BLOB_STORE_ID',
    severity: 'feature',
    purpose: 'Tier2-B 별도 private Blob 스토어 id(원본과 다른 바구니)',
    ifMissing: '스냅샷이 라이브와 같은 스토어에만 존재 — 스토어 단위 사고 시 원본·백업 동시 소실',
  },
  {
    name: 'BACKUP_EMAIL_RECIPIENT',
    severity: 'feature',
    purpose: 'Tier3 주간 백업 첨부 수신자(미설정 시 ADMIN_EMAIL 폴백)',
    ifMissing: 'ADMIN_EMAIL 도 없으면 Tier3 주간 메일 백업 무음 skip',
  },
  {
    name: 'SERIAL_SCAN_SECRET',
    severity: 'feature',
    purpose: '제품 시리얼 스캔 검증 시크릿',
    ifMissing: '시리얼 스캔 검증 약화/불가',
  },

  // ── optional: 없어도 핵심 동작에 지장 없음(공개/부가) ──
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    severity: 'optional',
    purpose: '사이트 절대 URL(메타·사이트맵)',
    ifMissing: '기본값 사용 — 일부 절대 URL 부정확 가능',
  },
  {
    name: 'NEXT_PUBLIC_GA_ID',
    severity: 'optional',
    purpose: 'Google Analytics 측정 ID',
    ifMissing: 'GA 수집 비활성',
  },
  {
    name: 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID',
    severity: 'optional',
    purpose: '네이버 지도 클라이언트 ID',
    ifMissing: '지도 위젯 미표시',
  },
];

function isPresent(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * 환경변수 설정 여부를 점검한다. 값은 노출하지 않으며 예외를 던지지 않는다.
 * @param env 점검 대상(기본 process.env). 테스트에서 가짜 env 주입 가능.
 */
export function checkEnv(env: Record<string, string | undefined> = process.env): EnvReport {
  const items: EnvStatus[] = ENV_REGISTRY.map((spec) => ({
    ...spec,
    present: isPresent(env[spec.name]),
  }));
  const presentCount = items.filter((i) => i.present).length;
  return {
    items,
    missingCritical: items.filter((i) => !i.present && i.severity === 'critical'),
    missingFeature: items.filter((i) => !i.present && i.severity === 'feature'),
    presentCount,
    totalCount: items.length,
  };
}
