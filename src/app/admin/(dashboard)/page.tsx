'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productCategories } from '@/data/products';
import type { Product } from '@/data/products';
import type { Review } from '@/data/reviews';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import MiniBarChart from '@/components/admin/MiniBarChart';

/* ─── Types ─── */

interface Inquiry {
  id: string;
  name: string;
  email: string;
  category: string;
  subject?: string;
  message: string;
  date: string;
  status: string;
}

interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  module: string;
  action: string;
  summary?: string;
}

const MODULE_LABELS: Record<string, string> = {
  products: '제품',
  reviews: '리뷰',
  inquiries: '문의',
  media: '미디어',
  faq: 'FAQ',
  settings: '설정',
  broadcasts: '방송',
  auth: '인증',
  upload: '업로드',
};

const ACTION_LABELS: Record<string, string> = {
  create: '등록',
  update: '수정',
  delete: '삭제',
  bulk_update: '일괄 수정',
  bulk_delete: '일괄 삭제',
  login: '로그인',
  logout: '로그아웃',
  reply: '답변',
  status_change: '상태 변경',
};

interface StatCard {
  icon: string;
  value: string | number;
  label: string;
  badge: string;
  badgeVariant: 'emerald' | 'amber' | 'sky' | 'rose';
  href: string;
}

interface QuickLink {
  icon: string;
  label: string;
  href: string;
  description: string;
}

const quickLinks: QuickLink[] = [
  { icon: '◈', label: '제품 관리', href: '/admin/products', description: '제품 등록/수정' },
  { icon: '◇', label: '리뷰 관리', href: '/admin/reviews', description: '리뷰 승인/삭제' },
  { icon: '◆', label: '문의 관리', href: '/admin/inquiries', description: '고객 문의 답변' },
  { icon: '▣', label: '미디어 관리', href: '/admin/media', description: '이미지/영상 관리' },
  { icon: '▤', label: 'FAQ 관리', href: '/admin/faq', description: 'FAQ 등록/수정' },
  { icon: '⚙', label: '설정', href: '/admin/settings', description: '사이트 설정' },
];

/* ─── Skeleton Components ─── */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-lg bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-8 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-24 rounded bg-gray-200" />
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="w-16 h-4 rounded bg-gray-200" />
      <div className="flex-1 h-7 rounded-full bg-gray-200" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="py-4 first:pt-0 last:pb-0 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/* ─── Badge variant styles ─── */

const badgeStyles: Record<StatCard['badgeVariant'], string> = {
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-500 text-white',
  sky: 'bg-sky-600 text-white',
  rose: 'bg-rose-600 text-white',
};

/* ─── Render ─── */

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [prodRes, revRes, inqRes, bcRes, notifRes] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/reviews'),
          fetch('/api/admin/inquiries'),
          fetch('/api/admin/broadcasts'),
          fetch('/api/admin/notifications'),
        ]);
        const prodData = await prodRes.json();
        const revData = await revRes.json();
        const inqData = await inqRes.json();
        const bcData = await bcRes.json();
        const notifData = await notifRes.json();

        setProducts(prodData.products || prodData.items || prodData || []);
        setReviews(revData.reviews || revData.items || revData || []);
        setInquiries(inqData.inquiries || inqData.items || inqData || []);
        setBroadcasts(bcData.broadcasts || bcData.items || bcData || []);
        setRecentActivity(Array.isArray(notifData?.recentActivity) ? notifData.recentActivity : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  function formatActivityAt(iso: string): string {
    const d = new Date(iso);
    const diffMin = (Date.now() - d.getTime()) / 60000;
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${Math.floor(diffMin)}분 전`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /* ── Derived stats ── */
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayNewInquiries = inquiries.filter(
    (inq) => inq.date?.slice(0, 10) === todayStr && inq.status === 'new'
  ).length;

  const pendingReviews = reviews.filter((r) => !r.verified).length;

  const upcomingBroadcasts = broadcasts.filter(
    (b) => (b.status === 'scheduled' || b.status === 'live') &&
      new Date(b.scheduledAt) >= now
  ).length;

  const outOfStockProducts = products.filter((p) => !p.inStock).length;

  const statCards: StatCard[] = [
    {
      icon: '◆',
      value: todayNewInquiries,
      label: '오늘 신규 문의',
      badge: todayNewInquiries > 0 ? '확인 필요' : '이상 없음',
      badgeVariant: todayNewInquiries > 0 ? 'amber' : 'emerald',
      href: '/admin/inquiries',
    },
    {
      icon: '◇',
      value: pendingReviews,
      label: '승인 대기 리뷰',
      badge: pendingReviews > 0 ? `${pendingReviews}건 대기` : '모두 처리됨',
      badgeVariant: pendingReviews > 0 ? 'amber' : 'emerald',
      href: '/admin/reviews',
    },
    {
      icon: '▶',
      value: upcomingBroadcasts,
      label: '예정된 방송',
      badge: upcomingBroadcasts > 0 ? '방송 예정' : '예정 없음',
      badgeVariant: upcomingBroadcasts > 0 ? 'sky' : 'amber',
      href: '/admin/broadcasts',
    },
    {
      icon: '⚠',
      value: outOfStockProducts,
      label: '재고 없는 제품',
      badge: outOfStockProducts > 0 ? '재고 확인' : '재고 정상',
      badgeVariant: outOfStockProducts > 0 ? 'rose' : 'emerald',
      href: '/admin/products',
    },
  ];

  /* ── Category distribution ── */
  interface CategoryStat { label: string; count: number }

  const categoryStats: CategoryStat[] = productCategories
    .filter((c) => c.id !== 'all')
    .map((cat) => ({
      label: cat.label,
      count: products.filter((p) => p.category === cat.id).length,
    }));

  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);

  /* ── Widget data ── */
  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const pendingReviewList = reviews
    .filter((r) => !r.verified)
    .slice(0, 5);

  const upcomingBroadcastList = broadcasts
    .filter((b) => (b.status === 'scheduled' || b.status === 'live') && new Date(b.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  /* ── Monthly trend (last 6 months) ── */
  function getLast6Months(): string[] {
    const months: string[] = [];
    const d = new Date(now);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  const last6Months = getLast6Months();

  function formatMonthLabel(ym: string): string {
    const [, m] = ym.split('-');
    return `${parseInt(m)}월`;
  }

  const inquiryTrendData = last6Months.map((ym) => ({
    label: formatMonthLabel(ym),
    value: inquiries.filter((inq) => inq.date?.slice(0, 7) === ym).length,
  }));

  const reviewTrendData = last6Months.map((ym) => ({
    label: formatMonthLabel(ym),
    value: reviews.filter((rev) => rev.date?.slice(0, 7) === ym).length,
  }));

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  function formatScheduledAt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const inquiryStatusColors: Record<string, string> = {
    new: 'bg-amber-500 text-white',
    replied: 'bg-sky-600 text-white',
    resolved: 'bg-emerald-600 text-white',
    pending: 'bg-gray-500 text-white',
    'in-progress': 'bg-blue-600 text-white',
    closed: 'bg-gray-600 text-white',
  };

  const inquiryStatusLabel: Record<string, string> = {
    new: '신규',
    replied: '답변됨',
    resolved: '처리완료',
    pending: '대기',
    'in-progress': '진행중',
    closed: '종료',
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-900">
          大羅天 관리자 대시보드
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          프리미엄 침향 전문 브랜드 — 운영 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Top Stat cards (4개 — 실제 운영 지표) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-50 text-lg text-gold-600">
                    {card.icon}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[card.badgeVariant]}`}
                  >
                    {card.badge}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-1 text-sm text-gray-500">{card.label}</p>
              </Link>
            ))}
      </div>

      {/* Middle row: Recent Inquiries + Pending Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Inquiries (5건) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg font-semibold text-gray-900">최근 문의</h3>
            <Link href="/admin/inquiries" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              전체 보기
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : recentInquiries.length === 0
                ? <li className="py-6 text-center text-sm text-gray-400">문의가 없습니다.</li>
                : recentInquiries.map((inq) => (
                    <li key={inq.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">{inq.name}</span>
                            <span className="text-xs text-gray-400">{inq.date?.slice(0, 10)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{inq.subject ?? inq.message}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${inquiryStatusColors[inq.status] ?? 'bg-gray-500 text-white'}`}>
                          {inquiryStatusLabel[inq.status] ?? inq.status}
                        </span>
                      </div>
                    </li>
                  ))}
          </ul>
        </div>

        {/* Pending Reviews (5건) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg font-semibold text-gray-900">승인 대기 리뷰</h3>
            <Link href="/admin/reviews" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              전체 보기
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : pendingReviewList.length === 0
                ? <li className="py-6 text-center text-sm text-gray-400">승인 대기 리뷰가 없습니다.</li>
                : pendingReviewList.map((review) => (
                    <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{review.author}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`text-[10px] ${i < review.rating ? 'text-gold-500' : 'text-gray-200'}`}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{review.title}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-gray-400">{review.date}</span>
                      </div>
                    </li>
                  ))}
          </ul>
        </div>
      </div>

      {/* Middle row 2: Upcoming Broadcasts + Reviews Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Broadcasts (3건) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg font-semibold text-gray-900">다가오는 방송</h3>
            <Link href="/admin/broadcasts" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              전체 보기
            </Link>
          </div>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            : upcomingBroadcastList.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">예정된 방송이 없습니다.</p>
              : (
                <ul className="space-y-3">
                  {upcomingBroadcastList.map((bc) => (
                    <li key={bc.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            bc.status === 'live' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white'
                          }`}>
                            {bc.status === 'live' ? 'ON AIR' : '예정'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{bc.channel}</span>
                        </div>
                        {bc.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-1">{bc.description}</p>
                        )}
                        {bc.specialPrice && (
                          <p className="mt-1 text-xs text-gold-600 font-medium">
                            특별가: {bc.specialPrice.toLocaleString()}원
                            {bc.discountRate ? ` (${bc.discountRate}% 할인)` : ''}
                          </p>
                        )}
                      </div>
                      <time className="shrink-0 text-[11px] text-gray-400 text-right leading-5">
                        {formatScheduledAt(bc.scheduledAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
        </div>

        {/* Reviews Summary (평균 별점 + 최근 5건) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-gray-900">리뷰 요약</h3>
            <Link href="/admin/reviews" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              전체 보기
            </Link>
          </div>

          {/* Average rating */}
          {!loading && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <span className="font-display text-3xl text-gold-500">{avgRating}</span>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.round(Number(avgRating)) ? 'text-gold-500' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">전체 {reviews.length}건 평균</p>
              </div>
            </div>
          )}

          <ul className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : recentReviews.length === 0
                ? <li className="py-6 text-center text-sm text-gray-400">리뷰가 없습니다.</li>
                : recentReviews.map((review) => (
                    <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{review.author}</span>
                            {review.verified && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                승인됨
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{review.title}</p>
                        </div>
                        <div className="shrink-0 flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-[10px] ${i < review.rating ? 'text-gold-500' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
          </ul>
        </div>
      </div>

      {/* Bottom row: Category distribution + Quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-gray-900 mb-5">
            제품 카테고리별 분포
          </h3>
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonBar key={i} />)
              : categoryStats.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-4">
                    <span className="w-16 shrink-0 text-sm font-medium text-gray-600">
                      {cat.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-7 w-full rounded-full bg-gray-100">
                        <div
                          className="flex h-7 items-center rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-3 text-xs font-semibold text-white transition-all duration-500"
                          style={{
                            width: `${Math.max((cat.count / maxCategoryCount) * 100, 12)}%`,
                          }}
                        >
                          {cat.count}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-gray-900 mb-5">
            빠른 링크
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-lg border border-gray-100 p-4 transition-all hover:border-gold-200 hover:shadow-sm"
              >
                <span className="text-xl text-gold-500">{link.icon}</span>
                <p className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-gold-600">
                  {link.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly trend charts */}
      <div>
        <h3 className="font-serif text-lg font-semibold text-gray-900 mb-4">월별 추이 (최근 6개월)</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {loading ? (
            <>
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-5 w-24 rounded bg-gray-200 mb-4" />
                <div className="h-28 w-full rounded bg-gray-100" />
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-5 w-24 rounded bg-gray-200 mb-4" />
                <div className="h-28 w-full rounded bg-gray-100" />
              </div>
            </>
          ) : (
            <>
              <MiniBarChart
                data={inquiryTrendData}
                color="#b5892a"
                title="문의 추이"
                unit="건"
              />
              <MiniBarChart
                data={reviewTrendData}
                color="#4f7cac"
                title="리뷰 추이"
                unit="건"
              />
            </>
          )}
        </div>
      </div>

      {/* Recent activity (audit log) */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-gray-900">최근 활동</h3>
          <span className="text-xs text-gray-400">최근 10건</span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">아직 기록된 활동이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <span
                  className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                    a.action === 'delete' || a.action === 'bulk_delete'
                      ? 'bg-red-400'
                      : a.action === 'create'
                      ? 'bg-emerald-400'
                      : a.action === 'login' || a.action === 'logout'
                      ? 'bg-blue-400'
                      : 'bg-gold-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-gray-800">
                    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-gray-600 mr-2">
                      {MODULE_LABELS[a.module] ?? a.module}
                    </span>
                    <span className="mr-2 text-gray-500">{ACTION_LABELS[a.action] ?? a.action}</span>
                    {a.summary && <span className="text-gray-700">— {a.summary}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {a.actor}
                  </p>
                </div>
                <time className="ml-2 shrink-0 text-xs text-gray-400">{formatActivityAt(a.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
