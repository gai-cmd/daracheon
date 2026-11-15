// Console permission rules (SPEC-CONSOLE-001 design.md §4.2). Pure functions: the caller resolves
// the user once per request (admin rights from CONSOLE_ADMIN_EMAILS, team from the people list).

import type {
  ConsoleItem,
  ConsoleListItem,
  ConsoleOwner,
  ConsolePerson,
  ConsoleSecretRecord,
  ConsoleUser,
  CredentialAccess,
} from './types';

const lower = (s: string) => s.trim().toLowerCase();

/** Builds the per-request user. Admin rights come from the allow-list only, never from stored data. */
export function resolveConsoleUser(
  session: { email: string; name: string },
  ctx: { adminEmails: readonly string[]; people: readonly ConsolePerson[] }
): ConsoleUser {
  const email = lower(session.email);
  const person = ctx.people.find((p) => typeof p?.email === 'string' && lower(p.email) === email);
  return {
    email,
    name: session.name,
    team: person?.team ?? '공통',
    isAdmin: ctx.adminEmails.includes(email),
  };
}

export function isOwner(user: ConsoleUser, item: Pick<ConsoleItem, 'owners'>): boolean {
  const me = lower(user.email);
  return (item.owners ?? []).some((o) => typeof o.email === 'string' && lower(o.email) === me);
}

export function canEdit(user: ConsoleUser, item: Pick<ConsoleItem, 'owners'>): boolean {
  return user.isAdmin || isOwner(user, item);
}

/** A non-admin may not save an owner list without themselves (self-lockout guard). */
export function ownerChangeAllowed(user: ConsoleUser, nextOwners: readonly ConsoleOwner[]): boolean {
  return user.isAdmin || isOwner(user, { owners: [...nextOwners] });
}

/** Who may view or copy an item's shared credential (REQ-CON-016). */
export function credAccess(user: ConsoleUser, item: Pick<ConsoleItem, 'owners' | 'visibility' | 'team'>): CredentialAccess {
  if (user.isAdmin || isOwner(user, item)) return 'ok';
  if (item.visibility === '본인') return 'denied';
  if (item.visibility === '팀' && item.team !== '공통' && item.team !== user.team) return 'denied';
  return 'ok';
}

// @MX:ANCHOR: [AUTO] hide_password 판정의 단일 지점 — 목록·내보내기·자격증명 라우트가 함께 쓴다.
// @MX:REASON: 여기서 access_method 조건을 빼면 링크 항목에 남은 표식이 되살아나고, 목록 표시와
// 서버의 보기 거절(REQ-CS2-004)이 서로 어긋난다.
/** 이 항목이 비밀번호 보기를 막는지 (SPEC-CONSOLE-002 REQ-CS2-001·004). 공유 계정 항목에서만 참이 될 수 있다. */
export function hidesPassword(item: Pick<ConsoleItem, 'access_method' | 'hide_password'>): boolean {
  return item.access_method === 'shared-credential' && item.hide_password === true;
}

/**
 * The browser-facing shape of one item. Built field by field (a response DTO), so a stray
 * credential value or record metadata on the stored object can never be copied out.
 */
export function toListItem(
  user: ConsoleUser,
  item: ConsoleItem,
  presence: { hasLoginId: boolean; hasPassword: boolean }
): ConsoleListItem {
  const editable = canEdit(user, item);
  const out: ConsoleListItem = {
    id: item.id,
    category: item.category,
    type: item.type,
    status: item.status,
    access_method: item.access_method,
    visibility: item.visibility,
    team: item.team,
    owners: (item.owners ?? []).map((o) => (o.email ? { name: o.name, email: o.email } : { name: o.name })),
    url: item.url,
    title: item.title,
    title_en: item.title_en,
    description: item.description,
    description_en: item.description_en,
    tags: [...(item.tags ?? [])],
    links: (item.links ?? []).map((l) => ({ label: l.label, label_en: l.label_en, url: l.url })),
    // 저장값이 없거나 공유 계정이 아닌 항목은 false (REQ-CS2-001).
    hide_password: hidesPassword(item),
    version: item.version,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
    hasLoginId: presence.hasLoginId,
    hasPassword: presence.hasPassword,
    canEdit: editable,
    credAccess: credAccess(user, item),
  };
  if (editable) {
    out.note = item.note;
    out.note_en = item.note_en;
  }
  return out;
}

/** List payload: soft-deleted items are dropped, credential presence comes from the secret records. */
export function toListItems(
  user: ConsoleUser,
  items: readonly ConsoleItem[],
  secrets: readonly ConsoleSecretRecord[]
): ConsoleListItem[] {
  const byItem = new Map(secrets.map((s) => [s.itemId, s]));
  return items
    .filter((i) => !i.deletedAt)
    .map((i) => {
      const s = byItem.get(i.id);
      return toListItem(user, i, { hasLoginId: !!s?.login_id, hasPassword: !!s?.password });
    });
}
