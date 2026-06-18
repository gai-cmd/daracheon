'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import type { ScanLocation } from '@/lib/qr/types';

/**
 * 스캔 접속 위치 지도 (네이버 지도 — 기존 사이트 인프라/CSP 재사용).
 * Vercel 엣지가 추정한 도시 단위 위/경도 클러스터를 원(circle) 마커로 표시.
 * 위치 데이터가 없으면(로컬/헤더 미제공) 지도 대신 안내 문구.
 */

// window.naver 의 전역 타입은 NaverMap.tsx 가 선언하므로 여기선 로컬 캐스트로만 접근
// (전역 재선언 시 modifier/shape 충돌). Circle/LatLngBounds 등 추가 API 를 로컬 타입으로.
interface NaverMapsApi {
  LatLng: new (lat: number, lng: number) => unknown;
  LatLngBounds: new () => { extend: (latlng: unknown) => void };
  Map: new (el: HTMLElement, opts: object) => {
    fitBounds: (b: unknown) => void;
    setCenter: (latlng: unknown) => void;
    setZoom: (z: number) => void;
    destroy?: () => void;
  };
  Circle: new (opts: object) => unknown;
  Marker: new (opts: object) => unknown;
  Position?: Record<string, number>;
}
function getNaverMaps(): NaverMapsApi | undefined {
  return (window as unknown as { naver?: { maps?: NaverMapsApi } }).naver?.maps;
}

export default function QrScanMap({ locations, totalScans }: { locations: ScanLocation[]; totalScans?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  function draw() {
    const maps = getNaverMaps();
    if (!ref.current || !maps || locations.length === 0) return;
    const max = Math.max(...locations.map((l) => l.count), 1);
    // 이전 지도/오버레이 제거 (재생성 시 중첩 방지)
    ref.current.innerHTML = '';
    const map = new maps.Map(ref.current, {
      zoom: 7,
      center: new maps.LatLng(locations[0].lat, locations[0].lng),
      // ── 인터랙션 명시 (이동·확대·축소) ──
      draggable: true,
      pinchZoom: true,
      scrollWheel: true,
      keyboardShortcuts: true,
      disableDoubleClickZoom: false,
      disableDoubleTapZoom: false,
      disableKineticPan: false,
      zoomControl: true,
      zoomControlOptions: maps.Position ? { position: maps.Position.TOP_RIGHT } : undefined,
      mapTypeControl: false,
      scaleControl: false,
      mapDataControl: false,
      logoControl: true,
    });
    const bounds = new maps.LatLngBounds();
    for (const l of locations) {
      const pos = new maps.LatLng(l.lat, l.lng);
      bounds.extend(pos);
      // 스캔 수에 비례한 반경 (8~28px 상당)
      const radius = 600 + (l.count / max) * 4000;
      new maps.Circle({
        map,
        center: pos,
        radius,
        fillColor: '#d4a843',
        fillOpacity: 0.35,
        strokeColor: '#b88c2d',
        strokeOpacity: 0.8,
        strokeWeight: 1,
      });
      new maps.Marker({
        map,
        position: pos,
        title: `${l.label}: ${l.count}회`,
        icon: {
          content: `<div style="background:#1F1F1F;color:#fff;font-size:11px;padding:2px 6px;border-radius:10px;white-space:nowrap;transform:translate(-50%,-50%)">${l.label} ${l.count}</div>`,
        },
      });
    }
    if (locations.length > 1) map.fitBounds(bounds);
    else {
      map.setCenter(new maps.LatLng(locations[0].lat, locations[0].lng));
      map.setZoom(11);
    }
  }

  // 데이터 '내용'이 바뀔 때만 재생성 (매 렌더/폴링마다 재생성 → 이동·줌 리셋되던 문제 방지)
  const sig = JSON.stringify(locations);
  useEffect(() => {
    if (ready && getNaverMaps()) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig]);

  // 지도에 표시된 스캔 수 vs 전체 스캔 수 — 좌표 없는 스캔은 지도에 안 찍히므로 정직하게 표기.
  const mappedScans = locations.reduce((s, l) => s + l.count, 0);
  const hiddenScans = typeof totalScans === 'number' ? Math.max(0, totalScans - mappedScans) : 0;

  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h4 className="mb-2 text-sm font-semibold text-gray-800">접속 위치 지도</h4>
        <p className="text-xs text-gray-400">
          {hiddenScans > 0
            ? `스캔 ${hiddenScans}건이 있으나 IP 기반 위치 좌표가 없어 지도에 표시할 수 없습니다.`
            : '아직 위치 데이터가 없습니다. (스캔이 쌓이면 도시별 접속 위치가 지도에 표시됩니다)'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">접속 위치 지도</h4>
        <span className="text-[11px] text-gray-400">원 크기 = 스캔 수</span>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-amber-700">
        ⚠ 위치는 GPS가 아니라 <b>IP 기반 추정값</b>입니다. 실제 위치와 다를 수 있고, 특히 <b>모바일은 통신사 위치</b>로 잡혀 크게 어긋날 수 있습니다.
        {hiddenScans > 0 && <> 좌표가 없어 지도에 표시되지 않은 스캔이 <b>{hiddenScans}건</b> 있습니다.</>}
      </p>
      {clientId ? (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
            onLoad={() => setReady(true)}
          />
          <div ref={ref} style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden' }} />
        </>
      ) : (
        <ul className="space-y-1 text-xs text-gray-600">
          {locations.map((l) => (
            <li key={l.label} className="flex justify-between">
              <span>{l.label}</span>
              <span className="font-medium">{l.count}회</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
