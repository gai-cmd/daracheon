/**
 * 백업 암호화 — AES-256-GCM.
 *
 * Tier 2 (GitHub) · Tier 3 (Email) 는 외부 시스템으로 나가므로 고객 PII
 * (inquiries) · 관리자 해시(admin-users) 가 포함된 스냅샷을 평문으로
 * 둘 수 없음. BACKUP_ENCRYPTION_KEY (32바이트 hex) 로 암호화 후 전송한다.
 *
 * 암호문 레이아웃:
 *   [12B IV] [16B auth tag] [N B ciphertext]
 *   base64 encoding 또는 hex encoding 으로 전송.
 *
 * 키 생성:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * 복구 절차:
 *   관리자가 암호화된 파일을 다운로드 → /admin/backup "암호 해제 후 복원"
 *   선택 → BACKUP_ENCRYPTION_KEY 를 서버에서 읽어 복호화 후 복원.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM 표준
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) throw new Error('BACKUP_ENCRYPTION_KEY not set');
  // 64 hex chars (32 bytes) 형식이 정식. 짧으면 scrypt 로 늘려 안전하게.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  // 임의 문자열이면 salt 고정 scrypt 로 key derivation (느리지만 admin 액션이라 OK)
  return scryptSync(raw, 'daracheon-backup-salt-v1', 32);
}

export interface EncryptedBlob {
  cipher: string; // base64
  iv: string; // hex
  tag: string; // hex
  alg: 'aes-256-gcm';
  v: 1;
}

/** 문자열을 암호화. 반환: JSON 래퍼 문자열 (저장·전송용). */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedBlob = {
    cipher: ct.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    alg: 'aes-256-gcm',
    v: 1,
  };
  return JSON.stringify(payload);
}

/** 암호화 문자열(JSON) → 평문. 무결성 검증 자동 (GCM tag). */
export function decryptString(encoded: string): string {
  const key = getKey();
  let payload: EncryptedBlob;
  try {
    payload = JSON.parse(encoded) as EncryptedBlob;
  } catch {
    throw new Error('암호화 블롭 파싱 실패 — 형식이 올바르지 않음');
  }
  if (payload.alg !== 'aes-256-gcm' || payload.v !== 1) {
    throw new Error(`지원하지 않는 암호화 포맷: ${payload.alg}/v${payload.v}`);
  }
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const ct = Buffer.from(payload.cipher, 'base64');
  if (iv.length !== IV_LEN) throw new Error('IV 길이 오류');
  if (tag.length !== TAG_LEN) throw new Error('Auth tag 길이 오류');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf-8');
}

export function isEncryptionConfigured(): boolean {
  return !!process.env.BACKUP_ENCRYPTION_KEY;
}

/** 입력 문자열이 암호화 블롭인지 빠른 판정. */
export function looksEncrypted(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed.startsWith('{')) return false;
  try {
    const p = JSON.parse(trimmed) as Partial<EncryptedBlob>;
    return p.alg === 'aes-256-gcm' && typeof p.cipher === 'string' && typeof p.iv === 'string' && typeof p.tag === 'string';
  } catch {
    return false;
  }
}
