// Server-side validation of console input (SPEC-CONSOLE-001 REQ-CON-013, design.md §3.2).
// The server port of the prototype's validateDataset, with one deliberate difference: an unknown
// enum value or an over-long field is an error, never silently replaced by a default.
// Only whitelisted fields are read, so credential values and record metadata never pass through.

import { isConsoleDomainEmail } from './config';
import {
  CONSOLE_ACCESS_METHODS,
  CONSOLE_ITEM_TYPES,
  CONSOLE_STATUSES,
  CONSOLE_TEAMS,
  CONSOLE_VISIBILITIES,
  type ConsoleItem,
  type ConsoleLink,
  type ConsoleOwner,
  type ConsolePerson,
} from './types';

export const CONSOLE_LIMITS = {
  title: 200,
  description: 500,
  note: 500,
  url: 2000,
  tags: 20,
  tagLength: 40,
  links: 20,
  linkLabel: 80,
  owners: 10,
  ownerName: 100,
  items: 3000,
  personName: 60,
  role: 200,
} as const;

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export interface ValidationError {
  field: string;
  reason: string;
}

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] };

/** Editable item fields (everything the server does not stamp itself). */
export type ConsoleItemFields = Pick<
  ConsoleItem,
  | 'category'
  | 'type'
  | 'status'
  | 'access_method'
  | 'visibility'
  | 'team'
  | 'owners'
  | 'url'
  | 'title'
  | 'title_en'
  | 'description'
  | 'description_en'
  | 'tags'
  | 'links'
  | 'note'
  | 'note_en'
> & { hide_password: boolean };

/** Absolute http(s) or mailto URL only. Relative, protocol-relative and script URLs are refused. */
export function isSafeConsoleUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return SAFE_PROTOCOLS.has(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

class Collector {
  errors: ValidationError[] = [];
  fail(field: string, reason: string) {
    this.errors.push({ field, reason });
  }
  /** Optional string field: missing -> '', wrong type / too long -> error. */
  text(raw: Record<string, unknown>, field: string, max: number): string {
    const v = raw[field];
    if (v === undefined || v === null) return '';
    if (typeof v !== 'string') {
      this.fail(field, 'type');
      return '';
    }
    const t = v.trim();
    if (t.length > max) this.fail(field, 'too_long');
    return t;
  }
  oneOf<T extends string>(raw: Record<string, unknown>, field: string, allowed: readonly T[]): T {
    const v = raw[field];
    if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
      this.fail(field, 'unknown_value');
      return allowed[0];
    }
    return v as T;
  }
}

function validateOwners(c: Collector, raw: unknown): ConsoleOwner[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    c.fail('owners', 'type');
    return [];
  }
  if (raw.length > CONSOLE_LIMITS.owners) c.fail('owners', 'too_many');
  const owners: ConsoleOwner[] = [];
  for (const o of raw.slice(0, CONSOLE_LIMITS.owners)) {
    if (!isRecord(o) || typeof o.name !== 'string' || !o.name.trim() || o.name.trim().length > CONSOLE_LIMITS.ownerName) {
      c.fail('owners', 'name');
      continue;
    }
    const owner: ConsoleOwner = { name: o.name.trim() };
    if (o.email !== undefined && o.email !== null && o.email !== '') {
      const email = typeof o.email === 'string' ? o.email.trim().toLowerCase() : '';
      if (!isConsoleDomainEmail(email)) {
        c.fail('owners', 'email');
        continue;
      }
      owner.email = email;
    }
    owners.push(owner);
  }
  return owners;
}

function validateTags(c: Collector, raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.some((t) => typeof t !== 'string')) {
    c.fail('tags', 'type');
    return [];
  }
  const tags = (raw as string[]).map((t) => t.trim()).filter(Boolean);
  if (tags.length > CONSOLE_LIMITS.tags) c.fail('tags', 'too_many');
  if (tags.some((t) => t.length > CONSOLE_LIMITS.tagLength)) c.fail('tags', 'too_long');
  return tags;
}

function validateLinks(c: Collector, raw: unknown): ConsoleLink[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    c.fail('links', 'type');
    return [];
  }
  if (raw.length > CONSOLE_LIMITS.links) c.fail('links', 'too_many');
  const links: ConsoleLink[] = [];
  for (const l of raw) {
    if (!isRecord(l) || !isSafeConsoleUrl(l.url) || (l.url as string).trim().length > CONSOLE_LIMITS.url) {
      c.fail('links', 'url');
      continue;
    }
    const label = typeof l.label === 'string' ? l.label.trim() : '';
    const label_en = typeof l.label_en === 'string' ? l.label_en.trim() : '';
    if (label.length > CONSOLE_LIMITS.linkLabel || label_en.length > CONSOLE_LIMITS.linkLabel) {
      c.fail('links', 'too_long');
      continue;
    }
    links.push({ label, label_en, url: (l.url as string).trim() });
  }
  return links;
}

/** Validates the editable fields of one item against the known category ids. */
export function validateItemFields(raw: unknown, opts: { categoryIds: ReadonlySet<string> }): Validated<ConsoleItemFields> {
  if (!isRecord(raw)) return { ok: false, errors: [{ field: 'item', reason: 'shape' }] };
  const c = new Collector();

  const category = typeof raw.category === 'string' ? raw.category : '';
  if (!opts.categoryIds.has(category)) c.fail('category', 'unknown_value');

  const title = c.text(raw, 'title', CONSOLE_LIMITS.title);
  if (!title && !c.errors.some((e) => e.field === 'title')) c.fail('title', 'required');

  const url = c.text(raw, 'url', CONSOLE_LIMITS.url);
  if (url && !isSafeConsoleUrl(url)) c.fail('url', 'scheme');

  const access_method = c.oneOf(raw, 'access_method', CONSOLE_ACCESS_METHODS);
  // hide_password (SPEC-CONSOLE-002 REQ-CS2-001): 없으면 false, boolean 이 아니면 오류,
  // 공유 계정이 아니면 false 로 저장한다 (CS2-D4).
  const hide = raw.hide_password;
  if (hide !== undefined && typeof hide !== 'boolean') c.fail('hide_password', 'type');

  const value: ConsoleItemFields = {
    category,
    type: c.oneOf(raw, 'type', CONSOLE_ITEM_TYPES),
    status: c.oneOf(raw, 'status', CONSOLE_STATUSES),
    access_method,
    visibility: c.oneOf(raw, 'visibility', CONSOLE_VISIBILITIES),
    team: c.oneOf(raw, 'team', CONSOLE_TEAMS),
    owners: validateOwners(c, raw.owners),
    url,
    title,
    title_en: c.text(raw, 'title_en', CONSOLE_LIMITS.title),
    description: c.text(raw, 'description', CONSOLE_LIMITS.description),
    description_en: c.text(raw, 'description_en', CONSOLE_LIMITS.description),
    tags: validateTags(c, raw.tags),
    links: validateLinks(c, raw.links),
    note: c.text(raw, 'note', CONSOLE_LIMITS.note),
    note_en: c.text(raw, 'note_en', CONSOLE_LIMITS.note),
    hide_password: access_method === 'shared-credential' && hide === true,
  };
  return c.errors.length ? { ok: false, errors: c.errors } : { ok: true, value };
}

/** Validates one people-directory entry. An `admin` flag is not read (admins come from env only). */
export function validatePersonFields(raw: unknown): Validated<ConsolePerson> {
  if (!isRecord(raw)) return { ok: false, errors: [{ field: 'person', reason: 'shape' }] };
  const c = new Collector();

  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!isConsoleDomainEmail(email)) c.fail('email', 'domain');

  const name = c.text(raw, 'name', CONSOLE_LIMITS.personName);
  if (!name && !c.errors.some((e) => e.field === 'name')) c.fail('name', 'required');

  const person: ConsolePerson = {
    email,
    name,
    name_en: c.text(raw, 'name_en', CONSOLE_LIMITS.personName),
    team: c.oneOf(raw, 'team', CONSOLE_TEAMS),
  };
  const role = c.text(raw, 'role', CONSOLE_LIMITS.role);
  if (role) person.role = role;
  return c.errors.length ? { ok: false, errors: c.errors } : { ok: true, value: person };
}
