import { put, list, del } from '@vercel/blob';
import { encryptString, isEncryptionConfigured } from './backup-crypto';

/**
 * Tier 2-B: 별도 Blob 스토어(private)로의 스냅샷 이중화.
 *
 * 2026-07-26 사고 대응. 그동안 스냅샷이 라이브 데이터와 **같은 스토어**
 * (`daracheon-db`, public) 안 `<prefix>/_snapshots/` 에만 있었다. 즉 원본과
 * 백업이 한 바구니였다 — 그 스토어를 대상으로 한 잘못된 스크립트 한 번이면
 * 둘 다 사라진다(실제로 같은 날 105개 blob 을 지우는 마이그레이션을 수행했다).
 *
 * 이 모듈은 스냅샷을 **다른 스토어**에 한 벌 더 둔다. 그 스토어는 private 로
 * 생성돼 있어 URL 을 알아도 인증 없이는 읽히지 않는다 — public 스토어인
 * 라이브 저장소에서 벌어졌던 노출(인증 없이 고객 PII 전체 다운로드)이 구조적으로
 * 불가능하다.
 *
 * 필요 환경변수:
 *   BACKUP_BLOB_READ_WRITE_TOKEN — 보조 스토어의 read-write 토큰
 *   BACKUP_SECONDARY_KEEP        — 보관 회차 수(기본 30)
 *
 * 미설정이면 조용히 skip 한다 — 다른 티어와 동일한 규약이며, 호출자는 skip 사유를
 * 응답에 실어 운영자가 "왜 안 되는지"를 즉시 알 수 있게 한다.
 */

const SNAPSHOT_PREFIX = 'snapshots/';
const DEFAULT_KEEP = 30;

export interface SecondaryMirrorResult {
  ok: boolean;
  pathname?: string;
  bytes?: number;
  encrypted?: boolean;
  pruned?: number;
  error?: string;
  skipped?: string;
}

export function isSecondaryStoreConfigured(): boolean {
  return !!process.env.BACKUP_BLOB_READ_WRITE_TOKEN;
}

function resolveKeep(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_KEEP;
  const parsed = Number(raw);
  // 0 이나 음수는 "전부 지운다"는 뜻이 되어 백업을 무력화하므로 받지 않는다.
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_KEEP;
  return Math.floor(parsed);
}

/**
 * 스냅샷 본문을 보조 스토어에 저장하고 보존 정책을 적용한다.
 * 실패해도 throw 하지 않는다 — 주 백업(Tier 1)의 성공을 보조 저장 실패로
 * 뒤집으면 안 되고, 실패 사실은 결과 객체로 호출자가 경보에 실어 보낸다.
 */
export async function mirrorToSecondaryStore(
  snapshotId: string,
  body: string
): Promise<SecondaryMirrorResult> {
  const token = process.env.BACKUP_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, skipped: 'BACKUP_BLOB_READ_WRITE_TOKEN 미설정 — 보조 스토어 이중화 비활성' };
  }

  // private 스토어라 URL 노출 위험은 없지만, 키가 있으면 저장 시점에도 암호화한다
  // (스토어 접근 권한이 새더라도 본문은 열리지 않도록 — 다층 방어).
  const encrypted = isEncryptionConfigured();
  let payload: string;
  try {
    payload = encrypted ? encryptString(body) : body;
  } catch (err) {
    return { ok: false, error: `암호화 실패: ${err instanceof Error ? err.message : String(err)}` };
  }

  const pathname = `${SNAPSHOT_PREFIX}${snapshotId}.json`;
  try {
    await put(pathname, payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      token,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 보존 정책 — 오래된 회차 정리. 실패해도 저장 자체는 성공으로 본다.
  let pruned = 0;
  try {
    const keep = resolveKeep(process.env.BACKUP_SECONDARY_KEEP);
    const { blobs } = await list({ prefix: SNAPSHOT_PREFIX, limit: 1000, token });
    const sorted = blobs
      .map((b) => ({ pathname: b.pathname, url: b.url }))
      .sort((a, b) => b.pathname.localeCompare(a.pathname)); // id 에 ISO 타임스탬프가 있어 사전순 = 시간순
    for (const stale of sorted.slice(keep)) {
      await del(stale.url, { token });
      pruned++;
    }
  } catch (err) {
    console.warn('[backup-secondary] 보존 정리 실패(저장은 성공):', err);
  }

  return { ok: true, pathname, bytes: payload.length, encrypted, pruned };
}
