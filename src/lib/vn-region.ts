/**
 * 좌표 → 대략 지역명 (외부 지오코딩 API 없이, 대라천 베트남 직영 농장 5곳 기준).
 * 정확 좌표를 공개하지 않으면서 "실제 베트남 현장"임을 지역명으로만 알린다.
 * 공개 게시글 칩·사진 워터마크에서 공용으로 쓴다(서버·클라이언트 모두 import 가능한 순수 함수).
 */

interface Site {
  name: string;
  lat: number;
  lng: number;
}

// 직영 농장 5개 산지 대략 좌표.
const SITES: Site[] = [
  { name: '하띤', lat: 18.34, lng: 105.9 }, // Ha Tinh
  { name: '냐짱', lat: 12.24, lng: 109.19 }, // Nha Trang
  { name: '람동', lat: 11.94, lng: 108.44 }, // Lam Dong (Da Lat)
  { name: '동나이', lat: 10.95, lng: 106.82 }, // Dong Nai
  { name: '푸꾸옥', lat: 10.22, lng: 103.96 }, // Phu Quoc
];

/** 가장 가까운 산지가 약 1°(~110km) 이내면 "베트남 <산지>", 베트남 범위면 "베트남 현장", 그 외 "현장". */
export function regionLabel(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '현장';
  let best: Site | null = null;
  let bestD = Infinity;
  for (const s of SITES) {
    const d = Math.hypot(lat - s.lat, lng - s.lng);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (best && bestD < 1.0) return `베트남 ${best.name}`;
  // 베트남 본토 대략 경계 안이면 일반 표기.
  if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) return '베트남 현장';
  return '현장';
}
