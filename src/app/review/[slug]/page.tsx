import { redirect } from 'next/navigation';
import { getQrBySlug } from '@/lib/qr/store';
import ReviewWrite from '@/components/qr/ReviewWrite';

export const dynamic = 'force-dynamic';

// 얇은 트랜잭션(후기 작성) 화면 — 색인 대상이 아니다. 루트의 index:true·홈 canonical
// 상속을 끊어 검색·AI 크롤러에서 제외.
export const metadata = { robots: { index: false, follow: false } };

// QR 후기 유도 — 스캔 시 /q 가 reviewMode QR 을 이곳으로 보낸다.
export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const qr = await getQrBySlug(slug);
  if (!qr || !qr.active) redirect('/reviews');

  const couponHint = qr.couponEnabled ? qr.couponDiscount?.trim() || '할인' : null;
  return <ReviewWrite slug={qr.slug} product={qr.reviewProduct ?? ''} couponHint={couponHint} />;
}
