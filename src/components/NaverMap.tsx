'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    naver: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (el: HTMLElement, opts: object) => unknown;
        Marker: new (opts: object) => unknown;
        InfoWindow: new (opts: object) => { open: (map: unknown, marker: unknown) => void };
      };
    };
  }
}

const LAT = 37.4579;
const LNG = 126.8983;
const NAVER_SEARCH_URL =
  'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B8%88%EC%B2%9C%EA%B5%AC%20%EB%B2%9A%EA%BD%83%EB%A1%9C36%EA%B8%B8%2030?searchType=address';

interface MapProps {
  title?: string;
  address?: string;
}

function SubwayRow({ color, station, exit, walk }: { color: string; station: string; exit: string; walk: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 700, flexShrink: 0 }}>1</span>
      <span style={{ color: '#fff' }}>{station}</span>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{exit}</span>
      <span style={{ color: 'rgba(212,168,67,0.85)', fontSize: '0.78rem', marginLeft: 'auto' }}>{walk}</span>
    </div>
  );
}

function MapFooter({ address }: { address: string }) {
  return (
    <div style={{ background: 'rgba(10,11,16,0.8)', border: '1px solid rgba(212,168,67,0.15)', borderTop: 'none', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.65)', marginBottom: 2 }}>지하철 안내</div>
      <SubwayRow color="#0052A4" station="금천구청역" exit="2번 출구" walk="도보 약 10분" />
      <SubwayRow color="#0052A4" station="독산역" exit="1번 출구" walk="도보 약 15분" />
      <a href={NAVER_SEARCH_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '8px 14px', background: '#03C75A', color: '#fff', fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.06em', textDecoration: 'none', fontWeight: 700, width: 'fit-content' }}>
        N 네이버 지도에서 보기 →
      </a>
    </div>
  );
}

/* ── API 키 있을 때: Naver Maps JS API ── */
function NaverJsMap({ title, address }: Required<MapProps>) {
  const mapRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!;

  function initMap() {
    if (!mapRef.current || !window.naver?.maps) return;
    const pos = new window.naver.maps.LatLng(LAT, LNG);
    const map = new window.naver.maps.Map(mapRef.current, { center: pos, zoom: 17, mapTypeControl: false, scaleControl: false, mapDataControl: false });
    const marker = new window.naver.maps.Marker({ position: pos, map });
    const info = new window.naver.maps.InfoWindow({
      content: `<div style="padding:10px 14px;font-size:13px;line-height:1.6;min-width:160px;"><strong>${title}</strong><br/><span style="color:#666;font-size:11px;">${address}</span></div>`,
      borderColor: '#d4a843',
    });
    info.open(map, marker);
  }

  useEffect(() => {
    if (window.naver?.maps) initMap();
  }, []);

  return (
    <>
      <Script strategy="afterInteractive" src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`} onLoad={initMap} />
      <div ref={mapRef} style={{ width: '100%', aspectRatio: '4/3', display: 'block' }} />
      <MapFooter address={address} />
    </>
  );
}

/* ── API 키 없을 때: iframe ── */
function NaverIframeMap({ address }: { address: string }) {
  return (
    <>
      <iframe
        title="오시는 길"
        src={NAVER_SEARCH_URL}
        width="100%"
        style={{ aspectRatio: '4/3', border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <MapFooter address={address} />
    </>
  );
}

export default function NaverMap({
  title = '대라천 · ZOEL LIFE 본사',
  address = '서울특별시 금천구 벚꽃로36길 30, 1511호',
}: MapProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (clientId) return <NaverJsMap title={title} address={address} />;
  return <NaverIframeMap address={address} />;
}
