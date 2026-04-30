import crypto from 'crypto';
import { readData, writeData } from '@/lib/db';

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
  const all = await listLeads();
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
  all.push(lead);
  await writeData(FILE, all);
  return lead;
}

export async function verifyToken(token: string): Promise<Lead | { error: 'not_found' | 'expired' }> {
  const all = await listLeads();
  const idx = all.findIndex((l) => l.token === token);
  if (idx === -1) return { error: 'not_found' };
  const lead = all[idx];
  if (isExpired(lead)) {
    if (lead.status !== 'expired') {
      all[idx] = { ...lead, status: 'expired' };
      await writeData(FILE, all);
    }
    return { error: 'expired' };
  }
  if (lead.status === 'pending') {
    all[idx] = { ...lead, status: 'verified', verifiedAt: new Date().toISOString() };
    await writeData(FILE, all);
    return all[idx];
  }
  return lead;
}

export async function recordView(token: string): Promise<Lead | { error: 'not_found' | 'expired' | 'unverified' }> {
  const all = await listLeads();
  const idx = all.findIndex((l) => l.token === token);
  if (idx === -1) return { error: 'not_found' };
  const lead = all[idx];
  if (isExpired(lead)) return { error: 'expired' };
  if (lead.status !== 'verified') return { error: 'unverified' };
  const now = new Date().toISOString();
  all[idx] = {
    ...lead,
    lastViewedAt: now,
    viewCount: lead.viewCount + 1,
  };
  await writeData(FILE, all);
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
