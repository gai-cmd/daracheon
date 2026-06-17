import type { QrStyleId } from './presets';
import type { DeviceType } from './device';

/**
 * QR 코드 관리 — 도메인 타입 (api/lib/ui 단일 출처).
 *
 * 핵심 원칙: slug 는 인쇄 후 절대 바뀌지 않는다(영구 QR). 목적지(targets)·
 * 라우팅·디자인·활성여부는 어드민에서 언제든 변경 가능 → "고정 QR, 가변 목적지".
 */

export type QrRoutingMode = 'single' | 'rotate';

export interface QrTarget {
  /** 우리 사이트 내부 경로. 반드시 '/' 로 시작 (open-redirect/외부유출 차단 + 도메인 SEO 보존). */
  path: string;
  /** 어드민 표기용 라벨 (예: "제품 소개", "브랜드 이야기") */
  label?: string;
  /** rotate 모드 가중치 (기본 1). 클수록 더 자주 선택. */
  weight?: number;
}

export interface QrCode {
  id: string;
  /** URL 에 들어가는 불변 단축코드 (/q/<slug>). 생성 후 변경 불가. */
  slug: string;
  name: string;
  description?: string;
  /** 스티커가 붙는 위치/매체 (예: "제품 박스 후면", "명함", "전단") — 마케팅 분류용 */
  placement?: string;
  routingMode: QrRoutingMode;
  /** single: targets[0] 고정. rotate: 가중 랜덤 분산. */
  targets: QrTarget[];
  /** utm_content 오버라이드 (예: 스티커 버전 A/B). 비우면 slug 기반 기본값. */
  utmContent?: string;
  /** 스캔 시 개인정보(연령·성별 등) 동의 수집 화면을 띄울지. 진입은 막지 않고 혜택으로 유도. */
  collectInfo?: boolean;
  /** 동의 유도 문구 (예: "동의 시 추가 구매 할인 혜택"). 비우면 기본 문구. */
  collectBenefitText?: string;
  /** 어드민 미리보기 기본 프리셋 (3종 모두 항상 다운로드 가능) */
  defaultStyle: QrStyleId;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QrEventType = 'scan' | 'pageview' | 'cta' | 'consent';

/** 연령대 선택지 */
export type AgeBand = '10대' | '20대' | '30대' | '40대' | '50대' | '60대+' | '비공개';
export type Gender = '남성' | '여성' | '비공개';

export interface QrEvent {
  id: string;
  type: QrEventType;
  /** ISO timestamp */
  at: string;
  /** 유입 QR slug (scan 직접 / pageview·cta 는 세션의 출처 slug) */
  slug: string;
  /** QR 세션 id — scan → 이후 동선을 묶는 키 */
  qsid: string;
  /** 방문자 식별 해시 (재방문 판정용, 원문 IP 미저장) */
  vid: string;

  // ── scan 전용 ──
  /** 선택된 목적지 경로 */
  dest?: string;
  /** 이 vid 가 이전에 스캔한 적 있는가 */
  isRevisit?: boolean;

  // ── scan 시 스탬프되는 환경 정보 (geo/device/locale) ──
  country?: string;
  region?: string;
  city?: string;
  /** 접속 위치 위/경도 (지도 표시용 대략값) */
  lat?: number;
  lng?: number;
  device?: DeviceType;
  os?: string;
  browser?: string;
  lang?: string;
  referrer?: string;

  // ── pageview 전용 ──
  /** 사이트 내 이동 경로 */
  path?: string;

  // ── cta 전용 ──
  ctaType?: string;
  ctaLabel?: string;
  ctaHref?: string;

  // ── consent 전용 (스캔 시 동의 수집) ──
  /** 동의 여부 (false = 동의 화면에서 '동의 없이 계속') */
  consented?: boolean;
  age?: AgeBand;
  gender?: Gender;
  /** 선택 입력 연락처 (이메일/전화) — 동의 시에만 */
  contact?: string;
  name?: string;
}

/* ───────── 분석 집계 결과 (어드민 분석 탭에 그대로 전달) ───────── */

export interface CountBucket {
  key: string;
  label?: string;
  count: number;
}

export interface QrAnalytics {
  /** 대상 slug (없으면 전체 합산) */
  slug?: string;
  range: { from: string; to: string };
  totals: {
    scans: number;
    uniqueVisitors: number;
    revisits: number;
    pageviews: number;
    ctaClicks: number;
    /** scan 세션 중 사이트 내 추가 페이지를 1개 이상 본 비율 (0..1) */
    engagementRate: number;
  };
  /** 일자별 스캔 추이 (YYYY-MM-DD → count) */
  scansByDay: CountBucket[];
  /** 시간대(0~23)별 스캔 */
  scansByHour: CountBucket[];
  /** 요일별 스캔 (월~일) */
  byWeekday: CountBucket[];
  byDevice: CountBucket[];
  byOs: CountBucket[];
  byBrowser: CountBucket[];
  byCountry: CountBucket[];
  /** 접속 지역 (시·도) */
  byRegion: CountBucket[];
  byCity: CountBucket[];
  /** 접속 언어 */
  byLanguage: CountBucket[];
  byReferrer: CountBucket[];
  /** 목적지 경로별 분산 결과 */
  byDestination: CountBucket[];
  /** 유입 후 가장 많이 본 페이지 */
  topPages: CountBucket[];
  /** CTA 유형별 클릭 */
  byCta: CountBucket[];
  /** 유입 퍼널: 스캔 → 사이트 탐색(2P+) → CTA */
  funnel: { scans: number; engaged: number; cta: number };
  /** 동의 수집 (연령·성별) — collectInfo QR 한정 */
  byAge: CountBucket[];
  byGender: CountBucket[];
  consent: {
    /** 동의 화면을 본 횟수(동의+거부) */
    prompts: number;
    /** 동의한 횟수 */
    consented: number;
    /** 연락처를 남긴 횟수 */
    withContact: number;
  };
  /** 지도 표시용 접속 위치 클러스터 */
  scanLocations: ScanLocation[];
  /** slug 별 스캔 (전체 보기에서 QR 랭킹) */
  bySlug?: CountBucket[];
}

export interface ScanLocation {
  lat: number;
  lng: number;
  count: number;
  label: string; // 도시/지역 이름
}
