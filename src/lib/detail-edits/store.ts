/**
 * 상세페이지 시안 편집기 — 저장소 계층.
 *
 * 기존 조엘라이프 저장 계층(src/lib/db.ts 의 단일 객체 API)만 쓴다. 새 Blob 스토어·토큰·환경변수 없음.
 *   현재 문서  `detail-edits__<slug>`           → StoredDoc
 *   이력       `detail-edits-history__<slug>`   → { items: HistoryItem[] }  (버전 오름차순, 최대 50개)
 *
 * 낙관적 동시성: 쓰기 직전에 readSingleForWrite 로 저장 버전을 다시 읽어 baseVersion 과 비교한다.
 * Blob 에는 조건부 쓰기(CAS)가 없으므로 서로 다른 서버리스 인스턴스 사이의 동시 쓰기는 완전히 막지 못한다 —
 * 같은 인스턴스 안에서는 슬러그별 프로세스 락으로 직렬화하고, 남는 창은 README 에 명시했다.
 */
import { readSingleForWrite, readSingleUncached, writeSingle } from '@/lib/db';
import {
  LIMITS,
  countsOf,
  docBodySchema,
  emptyBody,
  emptyPublicDoc,
  parseStoredDoc,
  pickBody,
  type EditBody,
  type HistoryItem,
  type HistoryMeta,
  type PublicDoc,
  type StoredDoc,
} from './schema';

export interface StoreNames {
  doc: string;
  history: string;
}

const DEFAULT_NAMES: StoreNames = { doc: 'detail-edits', history: 'detail-edits-history' };

/** 이력 파일 크기 안전망 — 항목 수 상한(50)과 별개로, 큰 문서가 쌓여 파일이 비대해지는 것을 막는다. */
const HISTORY_MAX_BYTES = 8 * 1024 * 1024;
const HISTORY_MIN_KEEP = 5;

export type SaveResult =
  | { ok: true; version: number; updatedAt: string; historySaved: boolean }
  | { ok: false; code: 'VERSION_CONFLICT'; currentVersion: number };

export type RestoreResult = SaveResult | { ok: false; code: 'NOT_FOUND' };

interface HistoryFile {
  items: HistoryItem[];
}

/* ── 슬러그별 프로세스 락 (같은 인스턴스 안의 읽기-검사-쓰기 직렬화) ── */

const locks = new Map<string, Promise<void>>();

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = prev.then(() => gate);
  locks.set(key, tail);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === tail) locks.delete(key);
  }
}

export interface DetailEditStore {
  /** 공개 읽기 — 장애·손상 시 빈 문서(degraded=true). 절대 throw 하지 않는다. */
  readPublic(slug: string): Promise<{ doc: PublicDoc; degraded: boolean }>;
  /** 관리자 읽기 — 최신본(없으면 빈 문서, version 0). 저장소 장애는 throw. */
  readAdmin(slug: string): Promise<StoredDoc>;
  /** 목록 화면용 요약 — 장애 시 null. */
  readSummary(slug: string): Promise<StoredDoc | null>;
  save(
    slug: string,
    input: { baseVersion: number; doc: EditBody; actor: string; note?: string },
  ): Promise<SaveResult>;
  listHistory(slug: string): Promise<HistoryMeta[]>;
  readHistoryEntry(slug: string, version: number): Promise<(HistoryMeta & { doc: EditBody }) | null>;
  restore(slug: string, input: { version: number; baseVersion: number; actor: string }): Promise<RestoreResult>;
}

export function createDetailEditStore(names: StoreNames = DEFAULT_NAMES): DetailEditStore {
  const docFile = (slug: string) => `${names.doc}__${slug}`;
  const historyFile = (slug: string) => `${names.history}__${slug}`;

  async function readHistoryFile(slug: string): Promise<HistoryFile> {
    const raw = await readSingleForWrite<{ items?: unknown }>(historyFile(slug));
    const items = Array.isArray(raw?.items) ? (raw.items as HistoryItem[]) : [];
    // 손상된 항목은 건너뛴다 (복원 대상이 될 수 없는 것들).
    return {
      items: items.filter(
        (it) =>
          it &&
          typeof it === 'object' &&
          Number.isInteger(it.version) &&
          it.version >= 1 &&
          it.doc &&
          typeof it.doc === 'object',
      ),
    };
  }

  /** 저장 버전 항목을 이력에 반영: 같은 버전은 교체, 오래된 것부터 개수·용량 상한까지 버린다. */
  function pushHistory(file: HistoryFile, item: HistoryItem): HistoryFile {
    const items = file.items.filter((it) => it.version !== item.version);
    items.push(item);
    items.sort((a, b) => a.version - b.version);
    while (items.length > LIMITS.history) items.shift();
    while (items.length > HISTORY_MIN_KEEP && Buffer.byteLength(JSON.stringify({ items }), 'utf8') > HISTORY_MAX_BYTES) {
      items.shift();
    }
    return { items };
  }

  const toMeta = (it: HistoryItem): HistoryMeta => ({
    version: it.version,
    updatedAt: it.updatedAt,
    updatedBy: it.updatedBy,
    note: it.note ?? '',
    counts: countsOf(it.doc),
  });

  async function saveLocked(
    slug: string,
    input: { baseVersion: number; doc: EditBody; actor: string; note: string },
  ): Promise<SaveResult> {
    const rawCurrent = await readSingleForWrite<unknown>(docFile(slug));
    const current = rawCurrent === null ? null : parseStoredDoc(rawCurrent, slug);
    if (rawCurrent !== null && current === null) {
      // 저장본이 있는데 해석되지 않으면 덮어쓰지 않는다 (손상 데이터를 조용히 지우지 않기 위해).
      throw new Error(`[detail-edits] ${docFile(slug)}: 저장된 문서를 해석할 수 없습니다.`);
    }
    const currentVersion = current?.version ?? 0;
    if (input.baseVersion !== currentVersion) {
      return { ok: false, code: 'VERSION_CONFLICT', currentVersion };
    }

    const version = currentVersion + 1;
    const updatedAt = new Date().toISOString();
    const next: StoredDoc = {
      schema: 1,
      page: slug,
      version,
      updatedAt,
      updatedBy: input.actor,
      ...pickBody(input.doc),
    };
    await writeSingle(docFile(slug), next);

    // 이력은 현재 문서 저장 뒤에 남긴다 — 이력 실패가 저장 자체를 되돌리지는 않는다.
    let historySaved = true;
    try {
      const file = await readHistoryFile(slug);
      const item: HistoryItem = {
        version,
        updatedAt,
        updatedBy: input.actor,
        note: input.note,
        doc: pickBody(next),
      };
      await writeSingle(historyFile(slug), pushHistory(file, item));
    } catch (err) {
      historySaved = false;
      console.error(`[detail-edits] ${slug} v${version}: 이력 저장 실패`, err);
    }
    return { ok: true, version, updatedAt, historySaved };
  }

  return {
    async readPublic(slug) {
      try {
        const raw = await readSingleUncached<unknown>(docFile(slug));
        if (raw === null) return { doc: emptyPublicDoc(slug), degraded: false };
        const parsed = parseStoredDoc(raw, slug);
        if (!parsed) {
          console.error(`[detail-edits] ${docFile(slug)}: 저장된 문서가 스키마와 맞지 않아 빈 문서로 대체`);
          return { doc: emptyPublicDoc(slug), degraded: true };
        }
        // updatedBy 는 공개 응답에 절대 싣지 않는다 — 필드를 하나씩 골라 새 객체를 만든다.
        const doc: PublicDoc = {
          schema: 1,
          page: parsed.page,
          version: parsed.version,
          updatedAt: parsed.updatedAt,
          ...pickBody(parsed),
        };
        return { doc, degraded: false };
      } catch (err) {
        console.error(`[detail-edits] ${slug}: 공개 읽기 실패 — 빈 문서로 대체`, err);
        return { doc: emptyPublicDoc(slug), degraded: true };
      }
    },

    async readAdmin(slug) {
      const raw = await readSingleForWrite<unknown>(docFile(slug));
      if (raw === null) return { schema: 1, page: slug, version: 0, updatedAt: null, ...emptyBody() };
      const parsed = parseStoredDoc(raw, slug);
      if (!parsed) throw new Error(`[detail-edits] ${docFile(slug)}: 저장된 문서를 해석할 수 없습니다.`);
      return parsed;
    },

    async readSummary(slug) {
      try {
        const raw = await readSingleUncached<unknown>(docFile(slug));
        if (raw === null) return { schema: 1, page: slug, version: 0, updatedAt: null, ...emptyBody() };
        return parseStoredDoc(raw, slug);
      } catch (err) {
        console.error(`[detail-edits] ${slug}: 요약 읽기 실패`, err);
        return null;
      }
    },

    save(slug, input) {
      return withLock(slug, () =>
        saveLocked(slug, {
          baseVersion: input.baseVersion,
          doc: input.doc,
          actor: input.actor,
          note: input.note ?? '',
        }),
      );
    },

    async listHistory(slug) {
      const file = await readHistoryFile(slug);
      return file.items.map(toMeta).sort((a, b) => b.version - a.version);
    },

    async readHistoryEntry(slug, version) {
      const file = await readHistoryFile(slug);
      const item = file.items.find((it) => it.version === version);
      const body = item ? docBodySchema.safeParse(item.doc) : null;
      if (!item || !body?.success) return null;
      return { ...toMeta(item), doc: body.data };
    },

    restore(slug, input) {
      return withLock(slug, async () => {
        const file = await readHistoryFile(slug);
        const item = file.items.find((it) => it.version === input.version);
        const body = item ? docBodySchema.safeParse(item.doc) : null;
        if (!item || !body?.success) return { ok: false, code: 'NOT_FOUND' } as const;
        // 복원 = 해당 버전 문서와 같은 내용을 "새 버전"으로 쓴다. 이력은 지우지 않는다.
        return saveLocked(slug, {
          baseVersion: input.baseVersion,
          doc: body.data,
          actor: input.actor,
          note: `v${input.version} 복원`,
        });
      });
    },
  };
}

/** 기본 저장소 (운영 파일명). */
export const detailEditStore: DetailEditStore = createDetailEditStore();
