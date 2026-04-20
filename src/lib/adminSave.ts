// Admin page save helper — shared by all 6 admin page editors.
// Parses the API's {stage, message, detail} error envelope so users
// get actionable toast messages instead of a generic '저장 실패'.

export type SaveResult = { ok: true; totalMs?: number } | { ok: false; msg: string };

interface ApiErrorBody {
  success?: false;
  stage?: string;
  message?: string;
  detail?: string | Record<string, unknown>;
}

interface ApiSuccessBody {
  success: true;
  totalMs?: number;
  revalidated?: string[];
}

function formatError(body: ApiErrorBody | null, status: number): string {
  if (!body?.message) return `HTTP ${status}`;
  const stage = body.stage ? `[${body.stage}] ` : '';
  const detail = body.detail
    ? ` — ${typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)}`
    : '';
  return `${stage}${body.message}${detail}`;
}

export async function saveAdminPage(key: string, data: unknown): Promise<SaveResult> {
  let res: Response;
  try {
    res = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data }),
    });
  } catch (err) {
    return { ok: false, msg: `네트워크 오류: ${err instanceof Error ? err.message : String(err)}` };
  }

  const body = (await res.json().catch(() => null)) as ApiErrorBody | ApiSuccessBody | null;
  if (!res.ok || !body || (body as ApiErrorBody).success === false) {
    return { ok: false, msg: formatError(body as ApiErrorBody | null, res.status) };
  }
  return { ok: true, totalMs: (body as ApiSuccessBody).totalMs };
}
