import crypto from 'crypto';
import { readData, readDataForWrite, writeDataMerged } from '@/lib/db';
import type { QrCode, QrTarget } from './types';
import type { QrStyleId } from './presets';

/**
 * QR 코드 레코드 저장/조회 (배열 blob `qr-codes`).
 * FAQ 라우트와 동일한 read/merge 패턴을 따른다 (검증된 유실·부활 방지 인프라 재사용).
 */

const FILE = 'qr-codes';
const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LEN = 6;

export async function listQrCodes(): Promise<QrCode[]> {
  const list = await readData<QrCode>(FILE);
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getQrCode(id: string): Promise<QrCode | null> {
  const list = await readData<QrCode>(FILE);
  return list.find((q) => q.id === id) ?? null;
}

/** 핫패스(리다이렉트)용 — unstable_cache 캐시된 readData 라 빠르고, 쓰기 시 무효화됨. */
export async function getQrBySlug(slug: string): Promise<QrCode | null> {
  const list = await readData<QrCode>(FILE);
  return list.find((q) => q.slug === slug) ?? null;
}

function randomSlug(): string {
  const bytes = crypto.randomBytes(SLUG_LEN);
  let s = '';
  for (let i = 0; i < SLUG_LEN; i++) s += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return s;
}

async function generateUniqueSlug(existing: QrCode[]): Promise<string> {
  const taken = new Set(existing.map((q) => q.slug));
  for (let i = 0; i < 20; i++) {
    const s = randomSlug();
    if (!taken.has(s)) return s;
  }
  // 극히 비현실적 — 길이를 늘려 보장.
  return randomSlug() + randomSlug().slice(0, 2);
}

export interface CreateQrInput {
  name: string;
  description?: string;
  placement?: string;
  routingMode: 'single' | 'rotate';
  targets: QrTarget[];
  utmContent?: string;
  collectInfo?: boolean;
  collectBenefitText?: string;
  couponEnabled?: boolean;
  couponDiscount?: string;
  couponValidDays?: number;
  reviewMode?: boolean;
  reviewProduct?: string;
  defaultStyle: QrStyleId;
  active?: boolean;
  /** 선택: 사람이 읽기 쉬운 커스텀 slug (영숫자/하이픈). 비우면 자동 생성. */
  customSlug?: string;
}

function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

export async function createQrCode(input: CreateQrInput): Promise<QrCode> {
  const existing = await readDataForWrite<QrCode>(FILE);

  let slug: string;
  if (input.customSlug) {
    slug = sanitizeSlug(input.customSlug);
    if (!slug) throw new Error('유효한 커스텀 코드가 아닙니다 (영숫자/하이픈만).');
    if (existing.some((q) => q.slug === slug)) throw new Error(`이미 사용 중인 코드입니다: ${slug}`);
  } else {
    slug = await generateUniqueSlug(existing);
  }

  const now = new Date().toISOString();
  const qr: QrCode = {
    id: `qr-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
    slug,
    name: input.name.trim(),
    ...(input.description ? { description: input.description.trim() } : {}),
    ...(input.placement ? { placement: input.placement.trim() } : {}),
    routingMode: input.routingMode,
    targets: normalizeTargets(input.targets),
    ...(input.utmContent ? { utmContent: input.utmContent.trim() } : {}),
    ...(input.collectInfo ? { collectInfo: true } : {}),
    ...(input.collectBenefitText ? { collectBenefitText: input.collectBenefitText.trim() } : {}),
    ...(input.couponEnabled ? { couponEnabled: true } : {}),
    ...(input.couponDiscount ? { couponDiscount: input.couponDiscount.trim() } : {}),
    ...(typeof input.couponValidDays === 'number' ? { couponValidDays: input.couponValidDays } : {}),
    ...(input.reviewMode ? { reviewMode: true } : {}),
    ...(input.reviewProduct ? { reviewProduct: input.reviewProduct.trim() } : {}),
    defaultStyle: input.defaultStyle,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  existing.push(qr);
  await writeDataMerged(FILE, existing);
  return qr;
}

export type UpdateQrPatch = Partial<Omit<QrCode, 'id' | 'slug' | 'createdAt'>>;

export async function updateQrCode(id: string, patch: UpdateQrPatch): Promise<QrCode | null> {
  const list = await readDataForWrite<QrCode>(FILE);
  const idx = list.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  const updated: QrCode = {
    ...list[idx],
    ...patch,
    ...(patch.targets ? { targets: normalizeTargets(patch.targets) } : {}),
    // slug 는 불변 — patch 에 들어와도 무시.
    slug: list[idx].slug,
    id: list[idx].id,
    createdAt: list[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  await writeDataMerged(FILE, list);
  return updated;
}

export async function deleteQrCode(id: string): Promise<boolean> {
  const list = await readDataForWrite<QrCode>(FILE);
  const idx = list.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  await writeDataMerged(FILE, list, { removedIds: [id] });
  return true;
}

/* ───────── 목적지 해석 + 보안 sanitize + UTM ───────── */

// open-redirect 차단용 고정 검증 베이스(apex). 경로는 origin 무관하므로 검증은
// 고정 도메인으로, 실제 리다이렉트 URL 은 요청 origin 으로 만든다(스테이징/프리뷰 호환).
const VALIDATE_BASE = 'https://zoellife.com';

/**
 * 내부 경로만 허용. startsWith('/') 만으론 부족(`/\evil.com`, `/%2f%2fevil` 등) 하므로
 * new URL 로 파싱해 origin 이 우리 도메인과 일치하는지까지 확인 → open-redirect/외부유출 차단.
 * 통과 시 정규화된 pathname+search+hash 반환, 실패 시 null.
 */
export function sanitizeInternalPath(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const p = raw.trim();
  if (!p) return null;
  if (/[\x00-\x1f\x7f]/.test(p)) return null; // 제어문자/CR/LF (헤더 인젝션 방지)
  if (p.includes('\\')) return null; // 일부 브라우저가 '/' 로 해석
  if (!p.startsWith('/')) return null;
  if (p.startsWith('//')) return null; // 프로토콜-상대 = 외부
  try {
    const u = new URL(p, VALIDATE_BASE);
    if (u.origin !== VALIDATE_BASE) return null; // 같은 도메인만
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

function normalizeTargets(targets: QrTarget[]): QrTarget[] {
  const out: QrTarget[] = [];
  for (const t of targets ?? []) {
    const path = sanitizeInternalPath(t.path);
    if (!path) continue;
    out.push({
      path,
      ...(t.label ? { label: t.label.trim() } : {}),
      ...(typeof t.weight === 'number' && t.weight > 0 ? { weight: t.weight } : {}),
    });
  }
  return out;
}

/** 라우팅 모드에 따라 목적지 경로 1개 선택. rotate=가중 랜덤(상태 비저장 → 핫패스에 쓰기 없음). */
export function resolveDestination(qr: QrCode): string {
  const targets = qr.targets.filter((t) => sanitizeInternalPath(t.path));
  if (targets.length === 0) return '/';
  if (qr.routingMode === 'single') return targets[0].path;

  // rotate: 가중 랜덤
  const weights = targets.map((t) => (typeof t.weight === 'number' && t.weight > 0 ? t.weight : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < targets.length; i++) {
    r -= weights[i];
    if (r < 0) return targets[i].path;
  }
  return targets[targets.length - 1].path;
}

/** 목적지에 UTM 파라미터를 붙여 절대 URL 로 만든다 (GA4 캠페인 귀속 + 우리 분석 일관성). */
export function buildRedirectUrl(origin: string, qr: QrCode, destPath: string): string {
  const url = new URL(destPath, origin);
  // 사용자가 이미 utm 을 넣었으면 존중, 없으면 채움.
  const set = (k: string, v: string) => {
    if (!url.searchParams.has(k)) url.searchParams.set(k, v);
  };
  set('utm_source', 'qr');
  set('utm_medium', 'offline');
  set('utm_campaign', qr.slug);
  set('utm_content', qr.utmContent || qr.placement || 'sticker');
  return url.toString();
}
