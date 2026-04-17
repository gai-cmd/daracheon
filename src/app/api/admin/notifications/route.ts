import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';
import { readAuditLog, type AuditEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface InquiryLite {
  status?: string;
}

interface ReviewLite {
  verified?: boolean;
  status?: string;
}

interface BroadcastLite {
  scheduledAt?: string;
  status?: string;
}

interface ProductLite {
  inStock?: boolean;
}

function countPendingReviews(reviews: ReviewLite[]): number {
  return reviews.filter((r) => r.verified === false || r.status === 'pending').length;
}

function countNewInquiries(inquiries: InquiryLite[]): number {
  return inquiries.filter((i) => i.status === 'new').length;
}

function countUpcomingBroadcasts(broadcasts: BroadcastLite[]): number {
  const now = Date.now();
  return broadcasts.filter((b) => {
    if (b.status === 'canceled' || b.status === 'ended') return false;
    if (!b.scheduledAt) return false;
    return new Date(b.scheduledAt).getTime() > now;
  }).length;
}

function countOutOfStock(products: ProductLite[]): number {
  return products.filter((p) => p.inStock === false).length;
}

export async function GET() {
  try {
    const inquiries = await readData('inquiries');
    const reviews = await readData('reviews');
    const broadcasts = await readData('broadcasts');
    const products = await readData('products');

    const counts = {
      inquiries_new: countNewInquiries(inquiries),
      reviews_pending: countPendingReviews(reviews),
      broadcasts_upcoming: countUpcomingBroadcasts(broadcasts),
      products_out_of_stock: countOutOfStock(products),
    };

    const recentActivity: AuditEntry[] = await readAuditLog(10);

    return NextResponse.json({
      success: true,
      counts,
      recentActivity,
    });
  } catch (error) {
    console.error('[Admin Notifications] error:', error);
    return NextResponse.json(
      { success: false, message: '알림 정보를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
