/**
 * 외부 위탁업체 현장 업로드 → 관리자 승인 워크플로우 데이터 모델.
 * 컬렉션: media-submissions (blob JSON). 승인 시에만 media.json 으로
 * 복사되어 /media 프론트에 노출된다 — pending/rejected 는 절대 노출 불가.
 */

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface SubmissionFile {
  url: string;
  type: 'photo' | 'video';
  contentType: string;
  size: number;
  name?: string;
  /** 사진 EXIF GPS (있을 때만) — 촬영 지점 포인트 기록(관리자 지도용) */
  lat?: number;
  lng?: number;
}

export interface SubmissionLocation {
  lat: number;
  lng: number;
  /** meters */
  accuracy?: number;
}

export interface SubmissionWeather {
  tempC: number;
  humidity?: number;
  windKmh?: number;
  /** WMO weather code (Open-Meteo) */
  code?: number;
  text?: string;
  fetchedAt: string;
}

export interface MediaSubmission {
  id: string;
  status: SubmissionStatus;
  title: string;
  note?: string;
  files: SubmissionFile[];
  partnerName: string;
  /** partner-accounts 레코드 id — 계정별 제출 목록 분리 기준 */
  partnerAccountId?: string;
  location?: SubmissionLocation;
  weather?: SubmissionWeather;
  /** 파일 lastModified 기준 촬영 추정 시각 (기기 시간, ISO) */
  capturedAt?: string;
  /** 제출 시점 기기 시간 (ISO) — 서버 시간과의 편차 확인용 */
  clientTime?: string;
  /** 서버 수신 시각 (ISO) — 신뢰 기준 시간 */
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
  /** 승인 시 media.json 에 생성된 항목 id 들 */
  mediaIds?: string[];
}

export const SUBMISSIONS_FILE = 'media-submissions';

/** WMO weather code → 한국어 요약 (Open-Meteo current.weather_code) */
export function wmoToText(code: number): string {
  if (code === 0) return '맑음';
  if (code === 1) return '대체로 맑음';
  if (code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if (code === 45 || code === 48) return '안개';
  if (code >= 51 && code <= 57) return '이슬비';
  if (code >= 61 && code <= 67) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code === 85 || code === 86) return '소낙눈';
  if (code >= 95) return '뇌우';
  return `날씨코드 ${code}`;
}

/**
 * Open-Meteo 현재 날씨 조회 — 무료·API 키 불필요.
 * 실패해도 제출 자체는 막지 않도록 null 반환 (날씨는 부가 정보).
 */
export async function fetchWeather(
  lat: number,
  lng: number
): Promise<SubmissionWeather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const cur = json.current;
    if (!cur || typeof cur.temperature_2m !== 'number') return null;
    return {
      tempC: cur.temperature_2m,
      humidity: cur.relative_humidity_2m,
      windKmh: cur.wind_speed_10m,
      code: cur.weather_code,
      text: typeof cur.weather_code === 'number' ? wmoToText(cur.weather_code) : undefined,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[partner] weather fetch failed:', err);
    return null;
  }
}

/**
 * 촬영 시각 기준 날씨 조회 — EXIF 촬영시각이 과거(현장에서 찍고 나중에 업로드)
 * 여도 그 시점의 날씨를 붙인다. Open-Meteo forecast API 의 past_days(최대 92일)
 * hourly 데이터에서 촬영 시각과 같은 시간대(로컬)를 매칭. capturedAt 은 EXIF
 * 로컬 시각(타임존 없음)이고 timezone=auto 응답도 촬영지 로컬이므로 문자열
 * 시간 비교가 성립한다. 매칭 실패·92일 초과 시 현재 날씨로 폴백.
 */
export async function fetchWeatherAt(
  lat: number,
  lng: number,
  capturedAt?: string
): Promise<SubmissionWeather | null> {
  if (capturedAt) {
    try {
      const captured = new Date(capturedAt);
      const ageDays = (Date.now() - captured.getTime()) / 86_400_000;
      if (Number.isFinite(ageDays) && ageDays > 1 / 24 && ageDays <= 92) {
        const pastDays = Math.min(92, Math.max(1, Math.ceil(ageDays)));
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
          `&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
          `&past_days=${pastDays}&forecast_days=1&timezone=auto`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as {
            hourly?: {
              time?: string[];
              temperature_2m?: number[];
              relative_humidity_2m?: number[];
              weather_code?: number[];
              wind_speed_10m?: number[];
            };
          };
          const hours = json.hourly?.time ?? [];
          const wantHour = `${capturedAt.slice(0, 13)}:00`; // "YYYY-MM-DDTHH:00"
          const i = hours.indexOf(wantHour);
          const temp = i >= 0 ? json.hourly?.temperature_2m?.[i] : undefined;
          if (i >= 0 && typeof temp === 'number') {
            const code = json.hourly?.weather_code?.[i];
            return {
              tempC: temp,
              humidity: json.hourly?.relative_humidity_2m?.[i],
              windKmh: json.hourly?.wind_speed_10m?.[i],
              code,
              text: typeof code === 'number' ? wmoToText(code) : undefined,
              fetchedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.warn('[partner] historical weather fetch failed:', err);
    }
  }
  return fetchWeather(lat, lng);
}

/**
 * 콘텐츠 URL 화이트리스트 — 프로젝트 불변 원칙(외부 CDN 금지) 강제.
 * Vercel Blob 또는 저장소 번들 정적 경로만 허용.
 */
export function isAllowedContentUrl(url: string): boolean {
  if (url.startsWith('/uploads/')) return true; // 로컬 dev fs fallback
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
