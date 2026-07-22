'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapPoint {
  id: string;
  title: string;
  lat: number;
  lng: number;
  kind: 'pending' | 'published';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

/**
 * 관리자 현장 위치 지도 — 승인/대기 현장 소식의 촬영 지점을 핀으로 모아 표시.
 * Leaflet + OpenStreetMap (무료·API키 불필요). 마커는 divIcon 이라 외부 이미지 불필요.
 * leaflet JS 는 useEffect 안에서 동적 import (SSR window 회피).
 */
export default function FieldMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    let cancelled = false;
    let map: import('leaflet').Map | null = null;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      const latlngs: [number, number][] = [];
      for (const p of points) {
        const color = p.kind === 'published' ? '#16a34a' : '#d97706';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${escapeHtml(p.title)}</b><br>${p.kind === 'published' ? '게시됨' : '승인 대기'}`);
        latlngs.push([p.lat, p.lng]);
      }
      if (latlngs.length === 1) map.setView(latlngs[0], 13);
      else map.fitBounds(latlngs, { padding: [30, 30] });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
        위치가 기록된 현장 소식이 없습니다. (사진 EXIF GPS 또는 기기 위치가 있어야 표시)
      </p>
    );
  }

  return (
    <div
      ref={ref}
      style={{ height: 360, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
    />
  );
}
