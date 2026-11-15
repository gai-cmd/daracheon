// Data model of the team console (/console). SPEC-CONSOLE-001 design.md §3.
// Every document is stored through src/lib/db.ts under the existing secret Blob prefix.

export const CONSOLE_TEAMS = ['한국팀', '방글라데시팀', '공통'] as const;
export const CONSOLE_ITEM_TYPES = ['project', 'link', 'channel', 'account'] as const;
export const CONSOLE_STATUSES = ['ok', 'run', 'needs-url', 'planned'] as const;
export const CONSOLE_ACCESS_METHODS = ['public', 'sso', 'invite', 'shared-credential', 'internal-login'] as const;
export const CONSOLE_VISIBILITIES = ['전체', '팀', '본인'] as const;
export const CONSOLE_CATEGORY_KINDS = ['resource', 'knowledge'] as const;
export const CONSOLE_CREDENTIAL_FIELDS = ['login_id', 'password'] as const;

export type ConsoleTeam = (typeof CONSOLE_TEAMS)[number];
export type ConsoleItemType = (typeof CONSOLE_ITEM_TYPES)[number];
export type ConsoleStatus = (typeof CONSOLE_STATUSES)[number];
export type ConsoleAccessMethod = (typeof CONSOLE_ACCESS_METHODS)[number];
export type ConsoleVisibility = (typeof CONSOLE_VISIBILITIES)[number];
export type ConsoleCategoryKind = (typeof CONSOLE_CATEGORY_KINDS)[number];
export type ConsoleCredentialField = (typeof CONSOLE_CREDENTIAL_FIELDS)[number];

/** Document names (Blob JSON files) used by the console. */
export const CONSOLE_DOCS = {
  items: 'console-items',
  categories: 'console-categories',
  people: 'console-people',
  settings: 'console-settings',
  secrets: 'console-secrets',
  audit: 'console-audit-log',
  /** 사람별 화면 기록(자동 입력 끄기 안내 확인). email 키 (SPEC-CONSOLE-002 REQ-CS2-006). */
  userPrefs: 'console-user-prefs',
} as const;

/** 자동 입력 끄기 안내 버전. 안내 내용이 크게 바뀌면 올려서 모두에게 다시 띄운다 (CS2-D7). */
export const AUTOFILL_GUIDE_VERSION = 1;

export interface ConsoleOwner {
  name: string;
  /** Ownership is decided by email only; an owner without email owns nothing. */
  email?: string;
}

export interface ConsoleLink {
  label: string;
  label_en: string;
  url: string;
}

export interface ConsoleItem {
  id: string;
  category: string;
  type: ConsoleItemType;
  status: ConsoleStatus;
  access_method: ConsoleAccessMethod;
  visibility: ConsoleVisibility;
  team: ConsoleTeam;
  owners: ConsoleOwner[];
  /** '' means the address is not confirmed yet. */
  url: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  tags: string[];
  links: ConsoleLink[];
  /** Private note: returned only to owners and console admins. */
  note: string;
  note_en: string;
  /**
   * 담당자·관리자가 아닌 사람에게 비밀번호 보기를 막고 복사만 허용한다 (SPEC-CONSOLE-002 REQ-CS2-001).
   * 없으면 false. access_method 가 'shared-credential' 이 아니면 서버가 false 로 저장한다.
   */
  hide_password?: boolean;
  version: number;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

/** 사람별 화면 기록 한 건. email 과 안내 확인 표시만 담는다 (REQ-CS2-006). */
export interface ConsoleUserPrefs {
  /** 소문자 email. 문서 키. */
  email: string;
  autofillGuide?: { version: number; at: string };
}

export interface ConsoleCategory {
  id: string;
  kind: ConsoleCategoryKind;
  icon: string;
  name: string;
  name_en: string;
  short: string;
  short_en: string;
  description: string;
  description_en: string;
}

export interface ConsolePerson {
  email: string;
  name: string;
  name_en: string;
  team: ConsoleTeam;
  /** Job memo, returned to console admins only. */
  role?: string;
}

export interface ConsoleSettings {
  teamPins: string[];
}

/** One AES-256-GCM sealed field. `kv` is the key version (only 1 for now). */
export interface SealedField {
  v: 1;
  kv: 1;
  iv: string;
  tag: string;
  ct: string;
}

export interface ConsoleSecretRecord {
  itemId: string;
  login_id?: SealedField;
  password?: SealedField;
  updatedAt: string;
  updatedBy: string;
}

export type ConsoleAuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'item.create'
  | 'item.update'
  | 'item.delete'
  | 'item.restore'
  | 'credential.view'
  | 'credential.copy'
  | 'credential.deny'
  | 'credential.rate_limited'
  | 'import'
  | 'people.update'
  | 'category.create'
  | 'settings.update';

export type ConsoleActorRole = 'console-admin' | 'console-member' | 'unknown';

export interface ConsoleAuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: ConsoleActorRole;
  module: 'console';
  action: ConsoleAuditAction;
  targetId?: string;
  summary?: string;
  /** Field names and reason codes only. Never a value, ciphertext, token or OAuth code. */
  meta?: Record<string, string | number | boolean>;
}

/** The signed-in console user as resolved on the server for one request. */
export interface ConsoleUser {
  email: string;
  name: string;
  /** From CONSOLE_ADMIN_EMAILS only, evaluated per request. */
  isAdmin: boolean;
  /** From the people directory; '공통' when the user is not listed. */
  team: ConsoleTeam;
}

export type CredentialAccess = 'ok' | 'denied';

/** Item shape sent to the browser in lists (never carries credential values). */
export type ConsoleListItem = Omit<ConsoleItem, 'note' | 'note_en' | 'deletedAt' | 'deletedBy' | 'hide_password'> & {
  /** 목록에서는 항상 boolean (REQ-CS2-001). */
  hide_password: boolean;
  note?: string;
  note_en?: string;
  hasLoginId: boolean;
  hasPassword: boolean;
  canEdit: boolean;
  credAccess: CredentialAccess;
};
