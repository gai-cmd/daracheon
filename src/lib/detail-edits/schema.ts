/**
 * 상세페이지 시안 편집기 — 편집 문서(schema 1) 검증.
 *
 * 한도(계약 §1): texts<=1500, images<=200, bgs<=50, hidden<=100, html<=8000자, alt<=300자,
 * 문서 전체 JSON<=400KB. 알 수 없는 속성은 전부 거절한다(zod `.strict()`).
 * 키(`k`)의 의미는 서버가 모른다(불투명) — 형식(정규식)과 배열 내 중복만 본다.
 *
 * 구역 배치(계약 부록 A1, `layout`): sequence<=200, clones<=40, gaps<=200, secbg<=200.
 * `layout` 은 선택 항목이다 — 없는 문서(2차 웨이브 이전)는 그대로 유효하고 저장 JSON 도 바뀌지 않는다.
 */
import { z } from 'zod';
import { CONCEPT_ORIGIN, corsAllowedOrigins, isProduction } from './origin';

export const LIMITS = {
  texts: 1500,
  images: 200,
  bgs: 50,
  hidden: 100,
  html: 8000,
  alt: 300,
  note: 200,
  /** 문서(texts·images·bgs·hidden) JSON 바이트 상한 */
  docBytes: 400 * 1024,
  /** 요청 본문 바이트 상한 = 문서 상한 + 봉투(baseVersion·note) 여유 */
  bodyBytes: 400 * 1024 + 2048,
  /** 원문 발췌·원본 URL 상한 (계약상 발췌는 80자지만 UTF-16/코드포인트 차이를 흡수) */
  excerpt: 200,
  origUrl: 2048,
  srcUrl: 1024,
  fsMin: 10,
  fsMax: 200,
  runMax: 99,
  /** 이력 보존 개수 */
  history: 50,
  /** 구역 배치(layout) 한도 — 부록 A1 */
  layoutSequence: 200,
  layoutClones: 40,
  layoutGaps: 200,
  layoutSecbg: 200,
  /** 구역 위·아래 간격(px) 상한 */
  gapMax: 400,
} as const;

/** 편집 키. 복제본 안의 편집은 `cN!` 접두가 붙는다(부록 A1). */
const KEY_RE = /^(c[0-9]{1,3}!)?(t|i|b|s):[0-9a-z]{4,16}:[0-9]{1,4}$/;
/** 원본 구역 키(접두 없음). sequence 의 `k`, clones 의 `of` */
const SECTION_KEY_RE = /^s:[0-9a-z]{4,16}:[0-9]{1,4}$/;
const CLONE_ID_RE = /^c[0-9]{1,3}$/;
/** 항목 참조 = 원본 구역 키 또는 복제본 id. gaps·secbg 의 `k` */
const ITEM_REF_RE = /^(?:s:[0-9a-z]{4,16}:[0-9]{1,4}|c[0-9]{1,3})$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/* ── 이미지 src 허용 규칙 ───────────────────────────────────── */

const BLOB_HOST_RE =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.public\.blob\.vercel-storage\.com$/;
const UPLOAD_PATH_RE = /^\/uploads\/detail-concepts\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:png|jpe?g|webp|gif)$/i;
const CONCEPT_PATH_RE = /^\/[A-Za-z0-9._~%/+@!$&'()*,;=:-]*$/;
// 공백·제어문자·역슬래시는 URL 파서가 조용히 바꿔 먹는 문자들 — 애초에 거절한다.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS_RE = /[\u0000- \u007f-\u009f\\]/;

/**
 * 이미지/배경 `src` 로 저장해도 되는 값인가.
 *  1) https://<스토어>.public.blob.vercel-storage.com/uploads/detail-concepts/<파일>.(png|jpg|jpeg|webp|gif)
 *  2) 시안 사이트 오리진의 절대 URL (시안 원본 자산으로 되돌리기) — 쿼리·해시 없음
 *  3) 비운영에서만 루트 상대 `/uploads/detail-concepts/<파일>` (로컬 fs 업로드)
 * `javascript:`·`data:`·프로토콜 상대(`//host`) 등은 모두 위 허용 목록에 걸리지 않아 거절된다.
 */
export function isAllowedAssetSrc(src: unknown): boolean {
  if (typeof src !== 'string' || src.length === 0 || src.length > LIMITS.srcUrl) return false;
  if (FORBIDDEN_CHARS_RE.test(src)) return false;

  if (src.startsWith('/')) {
    if (isProduction()) return false;
    return UPLOAD_PATH_RE.test(src);
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.username || url.password || url.search || url.hash) return false;

  if (url.protocol === 'https:' && BLOB_HOST_RE.test(url.hostname)) {
    return !url.port && UPLOAD_PATH_RE.test(url.pathname);
  }

  const conceptOrigins = new Set<string>([CONCEPT_ORIGIN, ...corsAllowedOrigins()]);
  if (conceptOrigins.has(url.origin)) {
    return CONCEPT_PATH_RE.test(url.pathname);
  }
  return false;
}

const srcSchema = z.string().refine(isAllowedAssetSrc, { message: '허용되지 않는 이미지 주소입니다.' });

/* ── 항목 스키마 ────────────────────────────────────────────── */

const keySchema = z.string().regex(KEY_RE, '키 형식이 올바르지 않습니다.');

const textEditSchema = z
  .object({
    k: keySchema,
    o: z.string().max(LIMITS.excerpt),
    html: z.string().max(LIMITS.html).optional(),
    fs: z.number().int().min(LIMITS.fsMin).max(LIMITS.fsMax).nullable().optional(),
    color: z.string().regex(COLOR_RE).nullable().optional(),
    run: z.number().int().min(0).max(LIMITS.runMax).optional(),
  })
  .strict();

const imageEditSchema = z
  .object({
    k: keySchema,
    o: z.string().max(LIMITS.origUrl),
    src: srcSchema.optional(),
    alt: z.string().max(LIMITS.alt).optional(),
  })
  .strict();

const bgEditSchema = z
  .object({
    k: keySchema,
    o: z.string().max(LIMITS.origUrl),
    src: srcSchema.optional(),
  })
  .strict();

const hiddenEditSchema = z
  .object({
    k: keySchema,
    o: z.string().max(LIMITS.excerpt),
  })
  .strict();

/** 같은 배열 안에서 키가 겹치면 적용 결과가 모호해지므로 거절한다. */
function uniqueKeys<T extends { k: string }>(items: T[], ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.k)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'k'], message: '중복된 키입니다.' });
    }
    seen.add(item.k);
  });
}

/* ── 구역 배치(layout) — 부록 A1 ────────────────────────────── */

const gapPxSchema = z.number().int().min(0).max(LIMITS.gapMax).nullable().optional();

/** sequence 항목: 원본 구역 `{k}` 또는 복제본 `{c}` 중 정확히 하나. */
const sequenceItemSchema = z
  .object({
    k: z.string().regex(SECTION_KEY_RE, '구역 키 형식이 올바르지 않습니다.').optional(),
    c: z.string().regex(CLONE_ID_RE, '복제본 id 형식이 올바르지 않습니다.').optional(),
  })
  .strict()
  .refine((item) => (item.k === undefined) !== (item.c === undefined), {
    message: 'k 와 c 중 정확히 하나만 있어야 합니다.',
  });

const cloneSchema = z
  .object({
    id: z.string().regex(CLONE_ID_RE, '복제본 id 형식이 올바르지 않습니다.'),
    of: z.string().regex(SECTION_KEY_RE, '복제 원본은 원본 구역 키여야 합니다.'),
  })
  .strict();

const gapSchema = z
  .object({
    k: z.string().regex(ITEM_REF_RE, '항목 참조 형식이 올바르지 않습니다.'),
    top: gapPxSchema,
    bottom: gapPxSchema,
  })
  .strict();

const secbgSchema = z
  .object({
    k: z.string().regex(ITEM_REF_RE, '항목 참조 형식이 올바르지 않습니다.'),
    color: z.string().regex(COLOR_RE, '색은 #RRGGBB 형식이어야 합니다.'),
  })
  .strict();

const itemRefOf = (item: { k?: string; c?: string }): string => (item.k !== undefined ? `k:${item.k}` : `c:${item.c}`);

/** 교차 규칙: 중복 금지, 복제본-순서 대응, 복제본을 가리키는 참조는 그 복제본이 있어야 한다. */
function layoutRules(layout: LayoutShape, ctx: z.RefinementCtx): void {
  const sequence = layout.sequence ?? [];
  const clones = layout.clones ?? [];
  const bad = (path: Array<string | number>, message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

  const cloneIds = new Set<string>();
  clones.forEach((clone, index) => {
    if (cloneIds.has(clone.id)) bad(['clones', index, 'id'], '중복된 복제본 id 입니다.');
    cloneIds.add(clone.id);
  });

  const seen = new Set<string>();
  const inSequence = new Set<string>();
  sequence.forEach((item, index) => {
    const ref = itemRefOf(item);
    if (seen.has(ref)) bad(['sequence', index], 'sequence 에 같은 항목이 두 번 있습니다.');
    seen.add(ref);
    if (item.c !== undefined) {
      inSequence.add(item.c);
      if (!cloneIds.has(item.c)) bad(['sequence', index, 'c'], '존재하지 않는 복제본입니다.');
    }
  });
  clones.forEach((clone, index) => {
    if (!inSequence.has(clone.id)) bad(['clones', index, 'id'], '복제본이 sequence 에 없습니다.');
  });

  const refsOf = (name: 'gaps' | 'secbg') => {
    const keys = new Set<string>();
    (layout[name] ?? []).forEach((entry, index) => {
      if (keys.has(entry.k)) bad([name, index, 'k'], '중복된 항목입니다.');
      keys.add(entry.k);
      // 복제본 id 를 가리키는데 그 복제본이 없으면 거절 — id 가 재사용될 때 남은 값이 엉뚱한 복제본에 적용되는 것을 막는다.
      if (CLONE_ID_RE.test(entry.k) && !cloneIds.has(entry.k)) bad([name, index, 'k'], '존재하지 않는 복제본입니다.');
    });
  };
  refsOf('gaps');
  refsOf('secbg');
}

export const layoutSchema = z
  .object({
    sequence: z.array(sequenceItemSchema).max(LIMITS.layoutSequence).optional(),
    clones: z.array(cloneSchema).max(LIMITS.layoutClones).optional(),
    gaps: z.array(gapSchema).max(LIMITS.layoutGaps).optional(),
    secbg: z.array(secbgSchema).max(LIMITS.layoutSecbg).optional(),
  })
  .strict()
  .superRefine(layoutRules);

type LayoutShape = {
  sequence?: Array<{ k?: string; c?: string }>;
  clones?: Array<{ id: string; of: string }>;
  gaps?: Array<{ k: string; top?: number | null; bottom?: number | null }>;
  secbg?: Array<{ k: string; color: string }>;
};

const CLONE_PREFIX_RE = /^(c[0-9]{1,3})!/;

export const docBodySchema = z
  .object({
    texts: z.array(textEditSchema).max(LIMITS.texts).superRefine(uniqueKeys),
    images: z.array(imageEditSchema).max(LIMITS.images).superRefine(uniqueKeys),
    bgs: z.array(bgEditSchema).max(LIMITS.bgs).superRefine(uniqueKeys),
    hidden: z.array(hiddenEditSchema).max(LIMITS.hidden).superRefine(uniqueKeys),
    layout: layoutSchema.optional(),
  })
  .strict()
  .superRefine((doc, ctx) => {
    // `cN!` 접두 키는 layout.clones 에 cN 이 있어야 한다(없으면 고아 — 서버가 거절한다).
    const cloneIds = new Set((doc.layout?.clones ?? []).map((clone) => clone.id));
    for (const name of ['texts', 'images', 'bgs', 'hidden'] as const) {
      doc[name].forEach((item, index) => {
        const prefix = CLONE_PREFIX_RE.exec(item.k)?.[1];
        if (prefix && !cloneIds.has(prefix)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name, index, 'k'],
            message: '존재하지 않는 복제본의 키입니다.',
          });
        }
      });
    }
  });

/** PUT /api/admin/detail-edits/<slug> 본문 */
export const putBodySchema = z
  .object({
    baseVersion: z.number().int().min(0).max(1_000_000),
    note: z.string().max(LIMITS.note).optional(),
    doc: docBodySchema,
  })
  .strict();

/** POST /api/admin/detail-edits/<slug>/history 본문 (복원) */
export const restoreBodySchema = z
  .object({
    version: z.number().int().min(1).max(1_000_000),
    baseVersion: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export type TextEdit = z.infer<typeof textEditSchema>;
export type ImageEdit = z.infer<typeof imageEditSchema>;
export type BgEdit = z.infer<typeof bgEditSchema>;
export type HiddenEdit = z.infer<typeof hiddenEditSchema>;
export type EditBody = z.infer<typeof docBodySchema>;
export type PutBody = z.infer<typeof putBodySchema>;
export type RestoreBody = z.infer<typeof restoreBodySchema>;

/** 저장된 현재 문서 (관리자용 — updatedBy 포함) */
export interface StoredDoc extends EditBody {
  schema: 1;
  page: string;
  version: number;
  updatedAt: string | null;
  updatedBy?: string;
}

/** 공개 응답 문서 — updatedBy 를 절대 담지 않는다. */
export type PublicDoc = Omit<StoredDoc, 'updatedBy'>;

export interface HistoryCounts {
  texts: number;
  images: number;
  bgs: number;
  hidden: number;
  /** layout 항목 수 = sequence + clones + gaps + secbg 의 길이 합 (layout 이 없으면 0) */
  layout: number;
}

export interface HistoryMeta {
  version: number;
  updatedAt: string;
  updatedBy: string;
  note: string;
  counts: HistoryCounts;
}

export interface HistoryItem {
  version: number;
  updatedAt: string;
  updatedBy: string;
  note: string;
  doc: EditBody;
}

export function countsOf(doc: EditBody): HistoryCounts {
  const layout = doc.layout;
  return {
    texts: doc.texts.length,
    images: doc.images.length,
    bgs: doc.bgs.length,
    hidden: doc.hidden.length,
    layout:
      (layout?.sequence?.length ?? 0) +
      (layout?.clones?.length ?? 0) +
      (layout?.gaps?.length ?? 0) +
      (layout?.secbg?.length ?? 0),
  };
}

/**
 * 문서 본문 필드만 골라 새 객체를 만든다. `layout` 은 있을 때만 싣는다 —
 * 그래서 layout 없는 문서의 저장 JSON 은 2차 웨이브와 바이트 단위로 같다.
 */
export function pickBody(doc: EditBody): EditBody {
  return {
    texts: doc.texts,
    images: doc.images,
    bgs: doc.bgs,
    hidden: doc.hidden,
    ...(doc.layout !== undefined ? { layout: doc.layout } : {}),
  };
}

export function emptyBody(): EditBody {
  return { texts: [], images: [], bgs: [], hidden: [] };
}

/** 저장된 문서가 없을 때 공개 API 가 돌려주는 빈 문서. */
export function emptyPublicDoc(page: string): PublicDoc {
  return { schema: 1, page, version: 0, updatedAt: null, ...emptyBody() };
}

/** 문서 본문의 직렬화 바이트 수 (400KB 상한 판정용). */
export function bodyBytes(doc: EditBody): number {
  return Buffer.byteLength(JSON.stringify(doc), 'utf8');
}

/**
 * 저장소에서 읽은 임의 값이 현재 스키마의 문서인가. 아니면 null.
 * (손상·구버전 문서는 "없음"으로 취급해 공개 페이지가 원본으로 보이게 한다 — fail-open.)
 */
export function parseStoredDoc(raw: unknown, page: string): StoredDoc | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.schema !== 1 || r.page !== page) return null;
  if (typeof r.version !== 'number' || !Number.isInteger(r.version) || r.version < 0) return null;
  if (r.updatedAt !== null && typeof r.updatedAt !== 'string') return null;
  const body = docBodySchema.safeParse({
    texts: r.texts,
    images: r.images,
    bgs: r.bgs,
    hidden: r.hidden,
    ...(r.layout !== undefined ? { layout: r.layout } : {}),
  });
  if (!body.success) return null;
  return {
    schema: 1,
    page,
    version: r.version,
    updatedAt: r.updatedAt as string | null,
    ...(typeof r.updatedBy === 'string' ? { updatedBy: r.updatedBy } : {}),
    ...body.data,
  };
}

/** zod 오류를 응답용 `{path, message}` 목록으로 줄인다 (최대 20건). */
export function summarizeIssues(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.slice(0, 20).map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
