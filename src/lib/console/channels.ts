// 채널 목록의 검사·정규화·공개 주소 (SPEC-CONSOLE-002 REQ-CS2-030, design.md §2.10, CS2-D25).
// 채널 값은 데이터다 — 이 파일에 실제 채널 id·블로그 id·주소를 적지 않는다.

import { readSingleUncached } from '@/lib/db';
import { CONSOLE_CHANNEL_KINDS, CONSOLE_DOCS, MAX_CHANNELS, type ConsoleChannel, type ConsoleChannelKind, type ConsoleSettings } from './types';

const LABEL_MAX = 40;
const URL_MAX = 2048;
const YOUTUBE_ID = /^UC[\w-]{22}$/;
const NAVER_ID = /^[a-z0-9_-]{1,40}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

export interface ChannelError {
  /** 행 번호(0부터). 목록 전체 오류는 -1. */
  index: number;
  field: string;
  reason: string;
}

export type ChannelsResult = { ok: true; channels: ConsoleChannel[] } | { ok: false; errors: ChannelError[] };

/** 'ch-' + 무작위 소문자·숫자 8자. */
export function newChannelId(): string {
  return `ch-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

function isHttpsUrl(v: string): boolean {
  if (v.length > URL_MAX) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && !!u.hostname;
  } catch {
    return false;
  }
}

/** 종류별 출처 규칙. 맞으면 null, 아니면 이유. */
function sourceProblem(kind: ConsoleChannelKind, source: string): string | null {
  switch (kind) {
    case 'youtube':
      return YOUTUBE_ID.test(source) ? null : 'format';
    case 'naver':
      return NAVER_ID.test(source) ? null : 'format';
    case 'rss':
    case 'instagram':
      return isHttpsUrl(source) ? null : 'https_url';
    case 'zoellife-blog':
      return source === '' ? null : 'must_be_empty';
  }
}

const isKind = (v: unknown): v is ConsoleChannelKind => typeof v === 'string' && (CONSOLE_CHANNEL_KINDS as readonly string[]).includes(v);

/**
 * 관리자가 보낸 채널 목록 전체를 검사한다. 하나라도 틀리면 아무것도 저장하지 않도록 오류 목록을 돌려준다.
 * 새 행(id 없음)에는 id 를 붙이고, existingIds 에 없는 id 는 unknown_id 로 거절한다. order 는 행 순서로 다시 매긴다.
 */
export function validateChannels(raw: unknown, existingIds: ReadonlySet<string>, makeId: () => string = newChannelId): ChannelsResult {
  if (!Array.isArray(raw)) return { ok: false, errors: [{ index: -1, field: 'channels', reason: 'type' }] };
  if (raw.length > MAX_CHANNELS) return { ok: false, errors: [{ index: -1, field: 'channels', reason: 'too_many' }] };
  const errors: ChannelError[] = [];
  const seen = new Set<string>();
  const used = new Set(existingIds);
  const channels: ConsoleChannel[] = [];

  raw.forEach((r, index) => {
    const err = (field: string, reason: string) => errors.push({ index, field, reason });
    if (!r || typeof r !== 'object' || Array.isArray(r)) return err('row', 'type');
    const row = r as Record<string, unknown>;

    let id: string;
    if (row.id === undefined || row.id === null || row.id === '') {
      do id = makeId();
      while (used.has(id) || seen.has(id));
    } else if (typeof row.id !== 'string' || !existingIds.has(row.id)) {
      return err('id', 'unknown_id');
    } else if (seen.has(row.id)) {
      return err('id', 'duplicate');
    } else id = row.id;
    seen.add(id);

    const label = typeof row.label === 'string' ? row.label.trim() : '';
    if (!label || label.length > LABEL_MAX) err('label', label ? 'too_long' : 'required');
    const labelEn = row.label_en === undefined || row.label_en === null ? '' : typeof row.label_en === 'string' ? row.label_en.trim() : null;
    if (labelEn === null || labelEn.length > LABEL_MAX) err('label_en', labelEn === null ? 'type' : 'too_long');
    if (!isKind(row.kind)) return err('kind', 'invalid');
    const source = row.source === undefined || row.source === null ? '' : typeof row.source === 'string' ? row.source.trim() : null;
    const problem = source === null ? 'type' : sourceProblem(row.kind, source);
    if (problem) err('source', problem);
    if (typeof row.color !== 'string' || !COLOR.test(row.color)) err('color', 'format');
    if (row.enabled !== undefined && typeof row.enabled !== 'boolean') err('enabled', 'type');

    channels.push({
      id,
      label,
      label_en: labelEn ?? '',
      kind: row.kind,
      source: source ?? '',
      color: typeof row.color === 'string' ? row.color.toLowerCase() : '',
      enabled: row.enabled !== false,
      order: index,
    });
  });

  return errors.length ? { ok: false, errors } : { ok: true, channels };
}

/** 저장된 채널 목록에서 형식이 틀린 행을 버리고 order 순으로 돌려준다. */
export function normalizeStoredChannels(raw: unknown): ConsoleChannel[] {
  if (!Array.isArray(raw)) return [];
  const out: ConsoleChannel[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const c = r as Partial<ConsoleChannel>;
    if (typeof c.id !== 'string' || !c.id || seen.has(c.id)) continue;
    if (!isKind(c.kind) || typeof c.source !== 'string' || sourceProblem(c.kind, c.source)) continue;
    if (typeof c.label !== 'string' || !c.label || typeof c.color !== 'string' || !COLOR.test(c.color)) continue;
    seen.add(c.id);
    out.push({
      id: c.id,
      label: c.label,
      label_en: typeof c.label_en === 'string' ? c.label_en : '',
      kind: c.kind,
      source: c.source,
      color: c.color.toLowerCase(),
      enabled: c.enabled !== false,
      order: typeof c.order === 'number' && Number.isFinite(c.order) ? c.order : out.length,
    });
  }
  return out.sort((a, b) => a.order - b.order);
}

/** 설정 문서의 채널 목록 (형식이 틀린 행은 버림). */
export async function readChannels(): Promise<ConsoleChannel[]> {
  const s = await readSingleUncached<Partial<ConsoleSettings>>(CONSOLE_DOCS.settings);
  return normalizeStoredChannels(s?.channels);
}

/** 채널의 공개 주소 (CS2-D25). 가져오기에 실패한 채널과 인스타그램의 링크 타일이 이 주소로 간다. */
export function channelHome(c: Pick<ConsoleChannel, 'kind' | 'source'>): string {
  switch (c.kind) {
    case 'youtube':
      return `https://www.youtube.com/channel/${c.source}`;
    case 'naver':
      return `https://blog.naver.com/${c.source}`;
    case 'rss':
      try {
        return new URL(c.source).origin;
      } catch {
        return '';
      }
    case 'instagram':
      return c.source;
    case 'zoellife-blog':
      return '/blog';
  }
}
