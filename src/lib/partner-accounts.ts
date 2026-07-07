/**
 * 외부 위탁업체 계정 — 관리자 화면에서 생성/비활성/삭제한다.
 * 컬렉션: partner-accounts (blob JSON). 비밀번호는 admin-users 와 동일한
 * pbkdf2 해시(hashPassword/verifyPassword 재사용)로 저장 — 평문 보관 금지.
 */

export interface PartnerAccount {
  id: string;
  /** 로그인 아이디 (소문자 정규화, 유니크) */
  loginId: string;
  /** 표시 이름 — 업체명/현장 담당자명. 제출물 attribution 에 사용 */
  name: string;
  passwordHash: string;
  active: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastLoginAt?: string;
  failedAttempts?: number;
  lockedUntil?: string;
}

export const PARTNER_ACCOUNTS_FILE = 'partner-accounts';

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(id);
}
