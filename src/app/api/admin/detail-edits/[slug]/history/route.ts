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
import { restoreBodySchema, summarizeIssues } from '@/lib/detail-edits/schema';
import { detailEditStore } from '@/lib/detail-edits/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET /api/admin/detail-edits/<slug>/history
 *   (기본)        → { versions: [{ version, updatedAt, updatedBy, note, counts }] } 최신순
 *   ?version=N    → { entry: { ...meta, doc } } | 404
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound();
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const versionParam = request.nextUrl.searchParams.get('version');
  try {
    if (versionParam === null) {
      const versions = await detailEditStore.listHistory(slug);
      return jsonResponse({ success: true, versions });
    }
    if (!/^[0-9]{1,7}$/.test(versionParam)) {
      return errorResponse(400, 'INVALID', 'version 은 정수여야 합니다.');
    }
    const entry = await detailEditStore.readHistoryEntry(slug, Number(versionParam));
    if (!entry) return errorResponse(404, 'NOT_FOUND', '해당 버전이 이력에 없습니다.');
    return jsonResponse({ success: true, entry });
  } catch (err) {
    console.error(`[detail-edits] history GET ${slug} 실패`, err);
    return errorResponse(503, 'STORE_UNAVAILABLE', '이력을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/**
 * POST /api/admin/detail-edits/<slug>/history — 본문 `{ version, baseVersion }`.
 * 복원: 이력의 해당 버전과 같은 내용을 "새 버전"으로 저장한다 (이력은 지우지 않는다).
 * 응답은 PUT 과 같다 (200 / 409 / 400 / 413).
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound();
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  const body = await readBodyLimited(request, 4096);
  if (!body.ok) return body.response;
  const json = parseJson(body.text);
  if (!json.ok) return errorResponse(400, 'INVALID', '요청 본문이 올바른 JSON 이 아닙니다.');
  const parsed = restoreBodySchema.safeParse(json.value);
  if (!parsed.success) {
    return errorResponse(400, 'INVALID', '복원 요청이 올바르지 않습니다.', {
      issues: summarizeIssues(parsed.error),
    });
  }

  try {
    const result = await detailEditStore.restore(slug, {
      version: parsed.data.version,
      baseVersion: parsed.data.baseVersion,
      actor: auth.session.email,
    });
    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return errorResponse(404, 'NOT_FOUND', '해당 버전이 이력에 없습니다.');
      }
      return errorResponse(409, 'VERSION_CONFLICT', '다른 곳에서 먼저 저장되었습니다. 최신본을 확인해 주세요.', {
        currentVersion: result.currentVersion,
      });
    }

    await logAdmin('settings', 'update', {
      targetId: `detail-edits:${slug}`,
      summary: `상세페이지 시안 이력 복원: ${slug} v${parsed.data.version} → v${result.version}`,
      meta: { kind: 'detail-edits', page: slug, version: result.version, restoredFrom: parsed.data.version },
    }).catch(() => {});

    return jsonResponse({
      success: true,
      version: result.version,
      updatedAt: result.updatedAt,
      ...(result.historySaved ? {} : { warning: 'HISTORY_NOT_SAVED' }),
    });
  } catch (err) {
    console.error(`[detail-edits] history POST ${slug} 실패`, err);
    return errorResponse(503, 'STORE_UNAVAILABLE', '복원하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
