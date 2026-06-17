import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getQrBySlug, resolveDestination, buildRedirectUrl, sanitizeInternalPath } from '@/lib/qr/store';
import ScanConsent from '@/components/qr/ScanConsent';

export const dynamic = 'force-dynamic';

// 동의 화면 — QR 스캔 시 collectInfo QR 에 한해 /q 가 이곳으로 보낸다.
// 진입 차단이 아니라 '동의하고 혜택' / '동의 없이 계속' 둘 다 제공.
export default async function ScanConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const qr = await getQrBySlug(slug);
  if (!qr || !qr.active) redirect('/');

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const toRaw = typeof sp.to === 'string' ? sp.to : null;
  const destPath = (toRaw && sanitizeInternalPath(toRaw)) || resolveDestination(qr);
  const destUrl = buildRedirectUrl(origin, qr, destPath);

  return <ScanConsent benefitText={qr.collectBenefitText} destUrl={destUrl} />;
}
