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
  /** 비밀번호 변경/재설정 시각 — 이 시각 이전에 발급된 세션은 무효 (유출 세션 차단) */
  passwordChangedAt?: string;
}

export const PARTNER_ACCOUNTS_FILE = 'partner-accounts';

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(id);
}

/**
 * 세션이 가리키는 계정이 지금도 유효한지 재확인 (서버 라우트 전용).
 * - 계정 삭제/비활성화 차단
 * - 비밀번호 변경/재설정(passwordChangedAt) 이전에 발급된 세션 차단
 *   → 유출·구기기 세션은 비번만 바꾸면 전부 무효화된다.
 * 조회 실패 시 null (fail-closed — 업로드는 재시도 가능한 작업).
 *
 * 성능: 계정 목록 blob 읽기는 웜 인스턴스 30초 캐시. 파일별 업로드 토큰
 * 발급마다 blob list+fetch(+tombstone list) 왕복이 붙어 다중 사진 업로드가
 * 파일당 1~3초씩 느려지던 병목 제거. 비활성화/비번변경의 차단 반영이
 * 인스턴스당 최대 30초 지연되는 트레이드오프는 수용 (판정 자체는 매 호출
 * 최신 세션 issuedAt 으로 수행).
 */
let accountsCache: { at: number; accounts: PartnerAccount[] } | null = null;
const ACCOUNTS_CACHE_MS = 30_000;

export async function findValidPartnerAccount(session: {
  accountId: string;
  issuedAt: number;
}): Promise<PartnerAccount | null> {
  try {
    let accounts: PartnerAccount[];
    if (accountsCache && Date.now() - accountsCache.at < ACCOUNTS_CACHE_MS) {
      accounts = accountsCache.accounts;
    } else {
      const { readDataUncached } = await import('@/lib/db');
      accounts = await readDataUncached<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
      accountsCache = { at: Date.now(), accounts };
    }
    const account = accounts.find((a) => a.id === session.accountId);
    if (!account || !account.active) return null;
    if (
      account.passwordChangedAt &&
      session.issuedAt < new Date(account.passwordChangedAt).getTime()
    ) {
      return null;
    }
    return account;
  } catch {
    return null;
  }
}

/** 계정 데이터 변경(로그인 기록 제외한 생성·수정·비번변경) 직후 호출해 캐시 무효화 */
export function invalidatePartnerAccountsCache() {
  accountsCache = null;
}
