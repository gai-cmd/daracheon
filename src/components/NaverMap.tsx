const NAVER_MAP_URL =
  'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B8%88%EC%B2%9C%EA%B5%AC%20%EB%B2%9A%EA%BD%83%EB%A1%9C36%EA%B8%B8%2030?searchType=address';

interface MapProps {
  title?: string;
  address?: string;
}

function SubwayRow({
  lineNum,
  color,
  station,
  exit,
  walk,
}: {
  lineNum: string;
  color: string;
  station: string;
  exit: string;
  walk: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: color,
          color: '#fff',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '0.62rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {lineNum}
      </span>
      <span style={{ color: '#fff', fontWeight: 400 }}>{station}</span>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{exit}</span>
      <span style={{ color: 'rgba(212,168,67,0.85)', fontSize: '0.78rem', marginLeft: 'auto' }}>{walk}</span>
    </div>
  );
}

export default function NaverMap({
  title = '대라천 · ZOEL LIFE 본사',
  address = '서울특별시 금천구 벚꽃로36길 30, 1511호',
}: MapProps) {
  return (
    <div>
      {/* 클릭 가능한 지도 영역 */}
      <a
        href={NAVER_MAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none', position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}
        aria-label="네이버 지도에서 위치 보기"
      >
        {/* 배경 그리드 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0f1119',
            backgroundImage:
              'linear-gradient(to right,rgba(212,168,67,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(212,168,67,.07) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        {/* 도로 모양 선 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to right,rgba(212,168,67,.18) 1px,transparent 1px),linear-gradient(to bottom,rgba(212,168,67,.18) 1px,transparent 1px)',
            backgroundSize: '220px 220px',
          }}
        />

        {/* 중앙 핀 */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="30" height="40" viewBox="0 0 30 40" fill="none">
            <path
              d="M15 0C6.716 0 0 6.716 0 15c0 8.5 9.5 18 13.333 21.5a2.333 2.333 0 003.334 0C20.5 33 30 24.5 30 15 30 6.716 23.284 0 15 0z"
              fill="rgba(212,168,67,0.95)"
            />
            <circle cx="15" cy="15" r="5.5" fill="#0f1119" />
          </svg>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.68rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(212,168,67,0.7)',
              background: 'rgba(10,11,16,0.7)',
              padding: '3px 10px',
            }}
          >
            네이버 지도에서 보기
          </span>
        </div>

        {/* 하단 라벨 */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 18,
            padding: '11px 16px',
            background: 'rgba(10,11,16,0.92)',
            backdropFilter: 'blur(10px)',
            borderLeft: '2px solid rgba(212,168,67,0.8)',
          }}
        >
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.88rem', color: '#fff', lineHeight: 1.4 }}>
            {title}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.58rem',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.45)',
              marginTop: 3,
            }}
          >
            {address}
          </div>
        </div>
      </a>

      {/* 지하철 안내 */}
      <div
        style={{
          background: 'rgba(10,11,16,0.7)',
          border: '1px solid rgba(212,168,67,0.12)',
          borderTop: 'none',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(212,168,67,0.65)',
            marginBottom: 2,
          }}
        >
          지하철 안내
        </div>

        <SubwayRow lineNum="1" color="#0052A4" station="금천구청역" exit="2번 출구" walk="도보 약 10분" />
        <SubwayRow lineNum="1" color="#0052A4" station="독산역" exit="1번 출구" walk="도보 약 15분" />

        <a
          href={NAVER_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            padding: '9px 16px',
            background: '#03C75A',
            color: '#fff',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
          네이버 지도에서 보기 →
        </a>
      </div>
    </div>
  );
}
