import type { Metadata } from 'next';
import QrManager from '@/components/admin/qr/QrManager';

export const metadata: Metadata = { title: 'QR코드 관리' };
export const dynamic = 'force-dynamic';

// 인쇄될 QR 은 항상 프로덕션 도메인을 인코딩해야 한다(로컬/프리뷰 도메인 금지).
function siteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, '')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
  return raw || 'https://zoellife.com';
}

export default function QrCodesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">QR코드 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          오프라인 고객을 홈페이지로 유입시키는 영구 QR을 만들고, 원본(PNG·SVG·PDF)을 내려받아 스티커로 제작하고,
          스캔 분석을 확인합니다. 인쇄된 QR은 그대로 두고 목적지만 언제든 바꿀 수 있어 트래픽을 자유롭게 분산할 수 있습니다.
        </p>
      </header>
      <QrManager siteOrigin={siteOrigin()} />
    </div>
  );
}
