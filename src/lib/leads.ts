import crypto from 'crypto';
import { readData, readDataForWrite, readDataUncached, writeDataMerged, appendData } from '@/lib/db';

export type LeadStatus = 'pending' | 'verified' | 'expired';

export interface Lead {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  token: string;
  status: LeadStatus;
  source?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  };
  ip?: string;
  userAgent?: string;
  createdAt: string;
  verifiedAt?: string;
  lastViewedAt?: string;
  viewCount: number;
  expiresAt: string;
}

const FILE = 'leads';
const EXPIRY_DAYS = 14;

function urlSafeToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

function isExpired(lead: Lead): boolean {
  return Date.parse(lead.expiresAt) < Date.now();
}

export async function listLeads(): Promise<Lead[]> {
  return readData<Lead>(FILE);
}

export async function findByEmail(email: string): Promise<Lead | undefined> {
  const all = await listLeads();
  const normalized = email.trim().toLowerCase();
  return all.find((l) => l.email === normalized);
}

export async function findByToken(token: string): Promise<Lead | undefined> {
  if (!token) return undefined;
  const all = await listLeads();
  return all.find((l) => l.token === token);
}

export async function createLead(input: {
  email: string;
  name: string;
  company?: string;
  role?: string;
  source?: Lead['source'];
  ip?: string;
  userAgent?: string;
}): Promise<Lead> {
  const now = new Date();
  const lead: Lead = {
    id: `lead-${now.getTime()}-${urlSafeToken(6)}`,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    company: input.company?.trim() || undefined,
    role: input.role?.trim() || undefined,
    token: urlSafeToken(24),
    status: 'pending',
    source: input.source,
    ip: input.ip,
    userAgent: input.userAgent,
    createdAt: now.toISOString(),
    viewCount: 0,
    expiresAt: new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  // 내구성 append — outbox 사본을 먼저 남기고 배열에 merged write.
  // 배열 쓰기가 어떤 경위로 레코드를 잃어도 outbox union 이 자동 복원 (고객 유입 유실 방지).
  await appendData(FILE, lead);
  return lead;
}

export async function verifyToken(token: string): Promise<Lead | { error: 'not_found' | 'expired' }> {
  // 상태 갱신 후 같은 파일을 덮어쓰는 쓰기 흐름 — 쓰기 베이스 전용 read.
  // (listLeads 의 캐시/시드 폴백을 베이스로 쓰면 동시 추가 리드가 유실된다)
  const all = await readDataForWrite<Lead>(FILE);
  const idx = all.findIndex((l) => l.token === token);
  if (idx === -1) return { error: 'not_found' };
  const lead = all[idx];
  if (isExpired(lead)) {
    if (lead.status !== 'expired') {
      all[idx] = { ...lead, status: 'expired' };
      await writeDataMerged(FILE, all);
    }
    return { error: 'expired' };
  }
  if (lead.status === 'pending') {
    all[idx] = { ...lead, status: 'verified', verifiedAt: new Date().toISOString() };
    await writeDataMerged(FILE, all);
    return all[idx];
  }
  return lead;
}

export async function recordView(token: string): Promise<Lead | { error: 'not_found' | 'expired' | 'unverified' }> {
  // 조회수 증가는 비핵심 — blob 일시 장애로 페이지가 깨지면 안 된다.
  // 쓰기 베이스 read 가 throw 하면 display read(readDataUncached)로 폴백해
  // 리드만 찾아 렌더하고 카운트 증가는 건너뛴다(best-effort).
  let all: Lead[];
  let canWrite = true;
  try {
    all = await readDataForWrite<Lead>(FILE);
  } catch (err) {
    console.warn('[leads] recordView: 쓰기 베이스 read 실패 — 조회수 증가 생략, 표시만', err);
    all = await readDataUncached<Lead>(FILE);
    canWrite = false;
  }
  const idx = all.findIndex((l) => l.token === token);
  if (idx === -1) return { error: 'not_found' };
  const lead = all[idx];
  if (isExpired(lead)) return { error: 'expired' };
  if (lead.status !== 'verified') return { error: 'unverified' };
  if (!canWrite) return lead; // 폴백 경로: 증가 없이 표시용으로 반환
  const now = new Date().toISOString();
  all[idx] = {
    ...lead,
    lastViewedAt: now,
    viewCount: lead.viewCount + 1,
  };
  try {
    await writeDataMerged(FILE, all);
  } catch (err) {
    console.warn('[leads] recordView: 조회수 쓰기 실패 — 표시는 계속', err);
    return lead;
  }
  return all[idx];
}

export function recentByEmail(leads: Lead[], email: string, withinMs: number): Lead[] {
  const cutoff = Date.now() - withinMs;
  const normalized = email.trim().toLowerCase();
  return leads.filter((l) => {
    if (l.email !== normalized) return false;
    const ts = Date.parse(l.createdAt);
    return Number.isFinite(ts) && ts > cutoff;
  });
}
