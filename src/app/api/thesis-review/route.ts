import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSingleUncached, readSingleForWrite, writeSingle } from '@/lib/db';

// 침향 논문 아카이브(/thesis) 검수 상태 저장소.
// 논문별 읽음/판정/의견을 Vercel Blob(db.ts, BLOB_DATA_PREFIX 하위 thesis-review.json)에 보관.
// /thesis 와 동일한 thesis_auth 쿠키로만 접근 — 하드코딩 비밀값 없음(env THESIS_TOKEN 만 사용).
// 저장 데이터는 논문 메타·공개 DOI 뿐(고객 PII 아님).

export const dynamic = 'force-dynamic';

const THESIS_COOKIE = 'thesis_auth';
const STORE = 'thesis-review';

// 판정: strong=근거 충분, partial=부분적, weak=근거 불충분, ''=미판정
const EntrySchema = z.object({
  doi: z.string().min(3).max(200),
  read: z.boolean().optional(),
  verdict: z.enum(['strong', 'partial', 'weak', '']).optional(),
  opinion: z.string().max(4000).optional(),
  reviewer: z.string().max(60).optional(),
});

export interface ReviewEntry {
  read: boolean;
  verdict: 'strong' | 'partial' | 'weak' | '';
  opinion: string;
  reviewer: string;
  updatedAt: string;
}
export interface ReviewStore {
  entries: Record<string, ReviewEntry>;
  updatedAt: string;
}

const EMPTY: ReviewStore = { entries: {}, updatedAt: '' };

function authed(req: NextRequest): boolean {
  const token = process.env.THESIS_TOKEN;
  if (!token) return false; // env 미설정 → fail-closed
  return req.cookies.get(THESIS_COOKIE)?.value === token;
}

const noStore = { headers: { 'Cache-Control': 'no-store, must-revalidate' } };

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401, ...noStore });
  const data = (await readSingleUncached<ReviewStore>(STORE)) ?? EMPTY;
  return NextResponse.json(data, noStore);
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401, ...noStore });

  let body: unknown;
  try { body = await req.json(); } catch { body = null; }
  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400, ...noStore });
  }
  const { doi, ...patch } = parsed.data;

  // 쓰기 베이스: readSingleForWrite (Blob 장애 시 throw → 500, stale 덮어쓰기 방지)
  const current = (await readSingleForWrite<ReviewStore>(STORE)) ?? { entries: {}, updatedAt: '' };
  const now = new Date().toISOString();
  const prev: ReviewEntry = current.entries[doi] ?? { read: false, verdict: '', opinion: '', reviewer: '', updatedAt: '' };
  const next: ReviewEntry = {
    read: patch.read ?? prev.read,
    verdict: patch.verdict ?? prev.verdict,
    opinion: patch.opinion ?? prev.opinion,
    reviewer: patch.reviewer ?? prev.reviewer,
    updatedAt: now,
  };
  const updated: ReviewStore = { entries: { ...current.entries, [doi]: next }, updatedAt: now };

  await writeSingle(STORE, updated);
  return NextResponse.json({ ok: true, doi, entry: next }, noStore);
}
