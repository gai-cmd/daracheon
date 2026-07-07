import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PARTNER_COOKIE, verifyPartnerToken } from '@/lib/partner-auth';
import PartnerUploadClient from './PartnerUploadClient';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const store = await cookies();
  const session = await verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
  if (!session) redirect('/partner/login');

  return <PartnerUploadClient partnerName={session.name} />;
}
