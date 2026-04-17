import { NextRequest, NextResponse } from 'next/server';
import { readData, readSingle } from '@/lib/db';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface SearchResponse {
  query: string;
  results: {
    products: SearchResultItem[];
    inquiries: SearchResultItem[];
    reviews: SearchResultItem[];
    media: SearchResultItem[];
    broadcasts: SearchResultItem[];
    faq: SearchResultItem[];
  };
  total: number;
}

// Product DB shape (partial)
interface ProductRecord {
  id: string;
  name: string;
  nameEn?: string;
  category?: string;
  [key: string]: unknown;
}

// Inquiry DB shape (partial)
interface InquiryRecord {
  id: string;
  name: string;
  email?: string;
  subject?: string;
  message?: string;
  category?: string;
  [key: string]: unknown;
}

// Review DB shape (partial)
interface ReviewRecord {
  id: string;
  author: string;
  title?: string;
  content?: string;
  product?: string;
  [key: string]: unknown;
}

// Media DB shape (partial)
interface MediaRecord {
  id: string;
  title: string;
  source?: string;
  [key: string]: unknown;
}

// Broadcast DB shape (partial)
interface BroadcastRecord {
  id: string;
  channel: string;
  host?: string;
  description?: string;
  [key: string]: unknown;
}

// FAQ DB shape (partial)
interface FaqRecord {
  id: string;
  question: string;
  answer?: string;
  [key: string]: unknown;
}

// Company DB shape (partial)
interface CompanyRecord {
  name?: string;
  nameEn?: string;
  nameKr?: string;
  [key: string]: unknown;
}

function matches(value: unknown, q: string): boolean {
  if (typeof value !== 'string') return false;
  return value.toLowerCase().includes(q);
}

function matchesAny(obj: Record<string, unknown>, fields: string[], q: string): boolean {
  return fields.some((field) => matches(obj[field], q));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const raw = searchParams.get('q') ?? '';
  const q = raw.trim().toLowerCase();

  if (q.length < 2) {
    return NextResponse.json(
      { error: '검색어는 최소 2자 이상 입력해주세요.' },
      { status: 400 }
    );
  }

  // --- Products ---
  const allProducts = await readData('products');
  const productResults: SearchResultItem[] = allProducts
    .filter((p) => matchesAny(p as unknown as Record<string, unknown>, ['name', 'nameEn', 'category'], q))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.category,
      href: '/admin/products',
    }));

  // --- Inquiries ---
  const allInquiries = await readData('inquiries');
  const inquiryResults: SearchResultItem[] = allInquiries
    .filter((i) =>
      matchesAny(i as unknown as Record<string, unknown>, ['name', 'email', 'subject', 'message', 'category'], q)
    )
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.name,
      subtitle: i.email,
      href: '/admin/inquiries',
    }));

  // --- Reviews ---
  const allReviews = await readData('reviews');
  const reviewResults: SearchResultItem[] = allReviews
    .filter((r) =>
      matchesAny(r as unknown as Record<string, unknown>, ['author', 'title', 'content', 'product'], q)
    )
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title ?? r.author,
      subtitle: r.product,
      href: '/admin/reviews',
    }));

  // --- Media ---
  const allMedia = await readData('media');
  const mediaResults: SearchResultItem[] = allMedia
    .filter((m) => matchesAny(m as unknown as Record<string, unknown>, ['title', 'source'], q))
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.source,
      href: '/admin/media',
    }));

  // --- Broadcasts ---
  const allBroadcasts = await readData('broadcasts');
  const broadcastResults: SearchResultItem[] = allBroadcasts
    .filter((b) => matchesAny(b as unknown as Record<string, unknown>, ['channel', 'host', 'description'], q))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.channel,
      subtitle: b.host,
      href: '/admin/broadcasts',
    }));

  // --- FAQ ---
  const allFaq = await readData('faq');
  const faqResults: SearchResultItem[] = allFaq
    .filter((f) => matchesAny(f as unknown as Record<string, unknown>, ['question', 'answer'], q))
    .slice(0, 5)
    .map((f) => ({
      id: f.id,
      title: f.question,
      subtitle: undefined,
      href: '/admin/faq',
    }));

  // --- Company (단일 객체, 검색 결과에는 포함하지 않고 total 계산에도 제외) ---
  const company = await readSingle('company');
  const companyMatches =
    company !== null &&
    matchesAny(company as unknown as Record<string, unknown>, ['name', 'nameEn', 'nameKr'], q);

  // company 히트는 설정 페이지로 안내 — results 구조에 포함하지 않음 (미션 범위 외)
  void companyMatches;

  const results = {
    products: productResults,
    inquiries: inquiryResults,
    reviews: reviewResults,
    media: mediaResults,
    broadcasts: broadcastResults,
    faq: faqResults,
  };

  const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const response: SearchResponse = {
    query: raw.trim(),
    results,
    total,
  };

  return NextResponse.json(response);
}
