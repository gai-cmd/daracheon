/**
 * 브라우저용 최소 EXIF 파서 — 외부 의존성 없이 JPEG APP1(Exif) 세그먼트에서
 * 촬영 시각(DateTimeOriginal)과 GPS 좌표만 추출한다.
 *
 * 한계 (설계상 허용):
 * - HEIC/HEIF·동영상(mp4/mov)은 컨테이너 구조가 달라 파싱하지 않는다 —
 *   호출부가 file.lastModified 와 기기 GPS 로 폴백.
 * - iOS 는 사진 선택 시 프라이버시 정책으로 GPS EXIF 를 제거하는 경우가
 *   많다 — 이때도 기기 GPS 폴백이 동작하므로 위치는 항상 확보된다.
 */

export interface ExifMeta {
  /** 로컬 촬영 시각 "YYYY-MM-DDTHH:MM:SS" (타임존 없음 — 촬영지 로컬) */
  capturedAt?: string;
  lat?: number;
  lng?: number;
}

// EXIF 는 보통 파일 선두 수십 KB 안에 있다. 대형 원본에서도 앞부분만 읽는다.
const HEAD_BYTES = 512 * 1024;

export async function extractJpegExif(file: File): Promise<ExifMeta> {
  if (!/image\/jpe?g/i.test(file.type)) return {};
  try {
    const buf = await file.slice(0, HEAD_BYTES).arrayBuffer();
    return parseExif(new DataView(buf));
  } catch {
    return {};
  }
}

function parseExif(view: DataView): ExifMeta {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {}; // not JPEG

  // JPEG 세그먼트 순회 → APP1 "Exif\0\0" 탐색
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break; // SOS/EOI — 이후 EXIF 없음
    const size = view.getUint16(offset + 2);
    if (size < 2) break;
    if (marker === 0xe1 && offset + 4 + 6 <= view.byteLength) {
      const isExif =
        view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0x0000; // "Exif\0\0"
      if (isExif) {
        return parseTiff(view, offset + 10, offset + 2 + size);
      }
    }
    offset += 2 + size;
  }
  return {};
}

function parseTiff(view: DataView, tiffStart: number, segmentEnd: number): ExifMeta {
  if (tiffStart + 8 > view.byteLength) return {};
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949; // "II"
  if (!little && byteOrder !== 0x4d4d) return {};

  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);

  if (u16(tiffStart + 2) !== 0x002a) return {};
  const ifd0 = tiffStart + u32(tiffStart + 4);

  const bounded = (o: number, need: number) =>
    o >= tiffStart && o + need <= Math.min(view.byteLength, segmentEnd);

  interface Entry {
    tag: number;
    type: number;
    count: number;
    valueOffset: number; // 실제 데이터 시작 절대 오프셋
  }

  function readIfd(ifdOffset: number): Map<number, Entry> {
    const entries = new Map<number, Entry>();
    if (!bounded(ifdOffset, 2)) return entries;
    const n = u16(ifdOffset);
    for (let i = 0; i < n; i++) {
      const e = ifdOffset + 2 + i * 12;
      if (!bounded(e, 12)) break;
      const tag = u16(e);
      const type = u16(e + 2);
      const count = u32(e + 4);
      const typeSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] ?? 1;
      const byteLen = typeSize * count;
      const valueOffset = byteLen <= 4 ? e + 8 : tiffStart + u32(e + 8);
      entries.set(tag, { tag, type, count, valueOffset });
    }
    return entries;
  }

  function readAscii(entry: Entry): string | null {
    if (!bounded(entry.valueOffset, entry.count)) return null;
    let s = '';
    for (let i = 0; i < entry.count; i++) {
      const c = view.getUint8(entry.valueOffset + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  }

  function readRationals(entry: Entry): number[] | null {
    if (entry.type !== 5 || !bounded(entry.valueOffset, entry.count * 8)) return null;
    const out: number[] = [];
    for (let i = 0; i < entry.count; i++) {
      const num = u32(entry.valueOffset + i * 8);
      const den = u32(entry.valueOffset + i * 8 + 4);
      out.push(den === 0 ? 0 : num / den);
    }
    return out;
  }

  const ifd0Entries = readIfd(ifd0);
  const meta: ExifMeta = {};

  // ── 촬영 시각: ExifIFD(0x8769) → DateTimeOriginal(0x9003) ──
  const exifPtr = ifd0Entries.get(0x8769);
  if (exifPtr) {
    const exifEntries = readIfd(tiffStart + u32(exifPtr.valueOffset));
    const dto = exifEntries.get(0x9003) ?? exifEntries.get(0x9004); // Original ?? Digitized
    if (dto && dto.type === 2) {
      const raw = readAscii(dto); // "YYYY:MM:DD HH:MM:SS"
      const m = raw?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (m) meta.capturedAt = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
    }
  }

  // ── GPS: GPSIFD(0x8825) → lat(0x0002/ref 0x0001), lng(0x0004/ref 0x0003) ──
  const gpsPtr = ifd0Entries.get(0x8825);
  if (gpsPtr) {
    const gps = readIfd(tiffStart + u32(gpsPtr.valueOffset));
    const latRefE = gps.get(0x0001);
    const latE = gps.get(0x0002);
    const lngRefE = gps.get(0x0003);
    const lngE = gps.get(0x0004);
    if (latE && lngE) {
      const latParts = readRationals(latE);
      const lngParts = readRationals(lngE);
      const latRef = latRefE ? readAscii(latRefE) : 'N';
      const lngRef = lngRefE ? readAscii(lngRefE) : 'E';
      if (latParts?.length === 3 && lngParts?.length === 3) {
        const lat = latParts[0] + latParts[1] / 60 + latParts[2] / 3600;
        const lng = lngParts[0] + lngParts[1] / 60 + lngParts[2] / 3600;
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
          meta.lat = latRef === 'S' ? -lat : lat;
          meta.lng = lngRef === 'W' ? -lng : lng;
        }
      }
    }
  }

  return meta;
}
