import type { NextRequest } from 'next/server';
import { logAdmin } from '@/lib/audit';
import {
  csrfGuard,
  errorResponse,
  jsonResponse,
  notFound,
  parseJson,
  readBodyLimited,
  requireAdmin,
  resolveSlug,
} from '@/lib/detail-edits/http';
import {
  LIMITS,
  bodyBytes,
  countsOf,
  putBodySchema,
  summarizeIssues,
  type EditBody,
} from '@/lib/detail-edits/schema';
import { SanitizerUnavailableError, sanitizeDetailHtml } from '@/lib/detail-edits/sanitize';
import { detailEditStore } from '@/lib/detail-edits/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

/** GET /api/admin/detail-edits/<slug> — 현재 문서(updatedBy 포함). 없으면 version 0 의 빈 문서. */
export async function GET(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound();
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const doc = await detailEditStore.readAdmin(slug);
    return jsonResponse({ success: true, doc });
  } catch (err) {
    console.error(`[detail-edits] GET ${slug} 실패`, err);
    return errorResponse(503, 'STORE_UNAVAILABLE', '저장소를 읽지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** 편집 텍스트의 html 을 서버에서 정제한다 (클라이언트 정제를 신뢰하지 않는다). */
function sanitizeBody(doc: EditBody): EditBody {
  return {
    ...doc,
    texts: doc.texts.map((t) => (t.html === undefined ? t : { ...t, html: sanitizeDetailHtml(t.html) })),
  };
}

/**
 * PUT /api/admin/detail-edits/<slug> — 본문 `{ baseVersion, note?, doc }`.
 * baseVersion 이 저장 버전과 다르면 409. 성공하면 version+1 로 저장하고 이력에 남긴다.
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound();
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  const body = await readBodyLimited(request, LIMITS.bodyBytes);
  if (!body.ok) return body.response;
  const json = parseJson(body.text);
  if (!json.ok) return errorResponse(400, 'INVALID', '요청 본문이 올바른 JSON 이 아닙니다.');

  const parsed = putBodySchema.safeParse(json.value);
  if (!parsed.success) {
    return errorResponse(400, 'INVALID', '저장할 내용이 올바르지 않습니다.', {
      issues: summarizeIssues(parsed.error),
    });
  }

  let doc: EditBody;
  try {
    doc = sanitizeBody(parsed.data.doc);
  } catch (err) {
    if (err instanceof SanitizerUnavailableError) {
      return errorResponse(503, 'SANITIZER_UNAVAILABLE', 'HTML 정제기를 사용할 수 없어 저장하지 않았습니다.');
    }
    throw err;
  }
  if (bodyBytes(doc) > LIMITS.docBytes) {
    return errorResponse(413, 'TOO_LARGE', '저장할 내용이 너무 큽니다.');
  }

  try {
    const result = await detailEditStore.save(slug, {
      baseVersion: parsed.data.baseVersion,
      doc,
      actor: auth.session.email,
      note: parsed.data.note,
    });
    if (!result.ok) {
      return errorResponse(409, 'VERSION_CONFLICT', '다른 곳에서 먼저 저장되었습니다. 최신본을 확인해 주세요.', {
        currentVersion: result.currentVersion,
      });
    }

    await logAdmin('settings', 'update', {
      targetId: `detail-edits:${slug}`,
      summary: `상세페이지 시안 편집 저장: ${slug} v${result.version}`,
      meta: { kind: 'detail-edits', page: slug, version: result.version, counts: countsOf(doc) },
    }).catch(() => {});

    return jsonResponse({
      success: true,
      version: result.version,
      updatedAt: result.updatedAt,
      ...(result.historySaved ? {} : { warning: 'HISTORY_NOT_SAVED' }),
    });
  } catch (err) {
    console.error(`[detail-edits] PUT ${slug} 실패`, err);
    return errorResponse(503, 'STORE_UNAVAILABLE', '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
