import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { authenticate, lookupSerial, normalizeSerial, type SerialAuth, type AuthVerdict } from '@/lib/qr/serials';
import { getClientEnv, isPrefetch } from '@/lib/qr/collect';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '정품 인증', robots: { index: false } };

const GOLD = '#d4a843';

// 판정별 색/아이콘/문구 — 정직 원칙: 읽기 실패는 '확인불가'(정품 아님 아님),
// 단순 재조회는 중립, 의심은 비난이 아니라 '문의 권유'.
const VIEW: Record<AuthVerdict, { color: string; icon: string; title: string }> = {
  'genuine-first': { color: '#4ade80', icon: '✓', title: '등록된 정품 코드입니다' },
  'genuine-rescan': { color: '#4ade80', icon: '✓', title: '등록된 정품 코드입니다' },
  suspicious: { color: '#fbbf24', icon: '⚠', title: '확인이 필요한 코드입니다' },
  voided: { color: '#f87171', icon: '⚠', title: '무효 처리된 코드입니다' },
  'not-registered': { color: '#f87171', icon: '⚠', title: '등록되지 않은 코드입니다' },
  invalid: { color: '#9ca3af', icon: '?', title: '올바르지 않은 코드입니다' },
  unavailable: { color: '#9ca3af', icon: '…', title: '일시적으로 확인할 수 없습니다' },
};

function detail(a: SerialAuth): string[] {
  const first = a.firstScanAt ? a.firstScanAt.slice(0, 10) : '';
  const region = a.firstScanRegion ? ` · ${a.firstScanRegion}` : '';
  switch (a.verdict) {
    case 'genuine-first':
      return ['지금 처음으로 인증되었습니다.', '구매처에서 받으신 제품이 맞다면 정상입니다.'];
    case 'genuine-rescan':
      return [`최초 인증: ${first}${region}`, '이미 한 번 이상 조회된 코드입니다. 본인이 다시 확인하신 경우라면 정상입니다.'];
    case 'suspicious':
      return [`최초 인증: ${first}${region}`, '이 코드가 여러 지역 또는 여러 번 스캔되었습니다.', '정품 여부가 의심되시면 구매처 또는 고객센터로 문의해 주세요.'];
    case 'voided':
      return ['판매사가 무효 처리한 코드입니다. 구매처 또는 고객센터로 문의해 주세요.'];
    case 'not-registered':
      return ['저희 시스템에 등록되지 않은 코드입니다.', '정품이 아닐 수 있으니 구매처에 문의해 주세요.'];
    case 'invalid':
      return ['코드 형식이 올바르지 않습니다. 라벨의 코드를 다시 확인해 주세요.'];
    case 'unavailable':
      return ['잠시 후 다시 시도해 주세요. (일시적 확인 지연이며, 정품 여부와는 무관합니다)'];
  }
}

export default async function AuthPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = normalizeSerial(decodeURIComponent(slug));
  const h = await headers();
  const env = getClientEnv(h);
  const vid = (await cookies()).get('zql_vid')?.value;

  // 봇/프리페치는 기록하지 않고 읽기 전용 (인증 카운트 오염 방지)
  let result: SerialAuth;
  if (env.isBot || isPrefetch(h)) {
    result = await lookupSerial(code);
  } else {
    result = await authenticate(code, {
      at: new Date().toISOString(),
      country: env.country,
      region: env.region,
      city: env.city,
      device: env.device,
      vid,
    });
  }

  const v = VIEW[result.verdict];
  const lines = detail(result);
  const genuine = result.verdict === 'genuine-first' || result.verdict === 'genuine-rescan';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0a0b10' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#14161f', border: `1px solid ${v.color}55`, borderRadius: 18, padding: '32px 24px', color: '#fdfbf7', textAlign: 'center' }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.28em', color: GOLD, textTransform: 'uppercase', marginBottom: 16 }}>ZOEL LIFE · 정품 인증</div>
        <div style={{ width: 72, height: 72, margin: '0 auto 14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, background: `${v.color}1f`, color: v.color }}>{v.icon}</div>
        <h1 style={{ fontSize: 21, fontWeight: 700, margin: '0 0 6px', color: v.color }}>{v.title}</h1>

        {result.product && genuine && (
          <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 2px' }}>{result.product}</p>
        )}
        {result.lot && genuine && <p style={{ fontSize: 13, color: 'rgba(253,251,247,0.55)' }}>LOT {result.lot}</p>}

        <div style={{ margin: '16px 0', padding: '14px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', fontSize: 14.5, lineHeight: 1.65, color: 'rgba(253,251,247,0.85)' }}>
          {lines.map((l, i) => <p key={i} style={{ margin: i ? '6px 0 0' : 0 }}>{l}</p>)}
        </div>

        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: 'rgba(253,251,247,0.4)', marginBottom: 16 }}>{result.code}</div>

        {/* 정직 고지 */}
        <p style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(253,251,247,0.4)', marginBottom: 16 }}>
          본 인증은 코드의 <b>등록 여부</b>를 확인하는 것으로, 포장·내용물의 물리적 진위를 100% 보장하지는 않습니다. 의심스러운 점이 있으면 고객센터로 문의해 주세요.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/company#contact" style={{ flex: 1, padding: '12px', borderRadius: 12, background: GOLD, color: '#1a1206', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>고객센터 문의</Link>
          <Link href="/" style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(253,251,247,0.2)', color: 'rgba(253,251,247,0.7)', fontSize: 14, textDecoration: 'none' }}>홈으로</Link>
        </div>
      </div>
    </div>
  );
}
