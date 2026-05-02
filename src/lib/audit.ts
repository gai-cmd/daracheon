import { cookies } from 'next/headers';
import { readData, writeData } from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export type AuditModule =
  | 'products'
  | 'reviews'
  | 'inquiries'
  | 'media'
  | 'faq'
  | 'settings'
  | 'mail-settings'
  | 'broadcasts'
  | 'auth'
  | 'upload'
  | 'announcement'
  | 'export';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'bulk_update'
  | 'bulk_delete'
  | 'login'
  | 'login_failed'
  | 'login_locked'
  | 'logout'
  | 'reply'
  | 'status_change'
  | 'test';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  module: AuditModule;
  action: AuditAction;
  targetId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}

const LOG_FILE = 'audit-log';
const MAX_ENTRIES = 2000;

export async function resolveActor(): Promise<{ email: string; role: string }> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (session) return { email: session.email, role: session.role };
  } catch {
    /* fall through */
  }
  return { email: 'system', role: 'system' };
}

export async function logAdmin(
  module: AuditModule,
  action: AuditAction,
  options: {
    targetId?: string;
    summary?: string;
    meta?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const { email, role } = await resolveActor();
    const entry: AuditEntry = {
      id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: email,
      actorRole: role,
      module,
      action,
      ...(options.targetId ? { targetId: options.targetId } : {}),
      ...(options.summary ? { summary: options.summary } : {}),
      ...(options.meta ? { meta: options.meta } : {}),
    };

    const entries = await readData(LOG_FILE);
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    await writeData(LOG_FILE, entries);
  } catch (error) {
    console.error('[Audit] failed to write entry:', error);
  }
}

export async function readAuditLog(limit = 100): Promise<AuditEntry[]> {
  const entries = await readData<AuditEntry>(LOG_FILE);
  return entries.slice(-limit).reverse();
}
