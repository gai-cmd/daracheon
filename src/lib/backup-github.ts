/**
 * Tier 2 백업: GitHub 저장소의 별도 브랜치에 스냅샷 JSON 을 커밋.
 *
 * Vercel Blob 전체가 리셋/삭제되는 최악의 경우에도 GitHub 레포의 커밋
 * 히스토리에는 전 데이터가 남아 있어 복원 가능.
 *
 * 요구 환경변수:
 *   GITHUB_BACKUP_TOKEN   — Personal Access Token (Fine-grained, repo:contents write)
 *   GITHUB_BACKUP_REPO    — owner/repo (예: "gai-cmd/daracheon")
 *   GITHUB_BACKUP_BRANCH  — 백업 전용 브랜치 (default: "backups")
 */

const API = 'https://api.github.com';

function getConfig() {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO;
  const branch = process.env.GITHUB_BACKUP_BRANCH ?? 'backups';
  if (!token || !repo) return null;
  return { token, repo, branch };
}

function gh(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
}

/** 브랜치가 없으면 main 의 현재 커밋에서 분기해 생성. */
async function ensureBranch(token: string, repo: string, branch: string): Promise<void> {
  // 2026-08-11: 브랜치 존재 확인을 Git Database API(/git/ref/...)에서 Repos API 로 교체.
  // fine-grained PAT 는 git-db 계열 호출에 404 를 돌려줘 "cannot fetch main ref: 404"
  // 로 미러 전체가 죽었다. /branches/{branch} 와 contents API 는 fine-grained 지원.
  const check = await gh(`/repos/${repo}/branches/${encodeURIComponent(branch)}`, token);
  if (check.ok) return;
  if (check.status !== 404) {
    throw new Error(`ensureBranch check failed: ${check.status} ${await check.text()}`);
  }
  // 브랜치 없음 → main SHA 로 생성 시도. 생성만은 git-db API 가 유일한 경로라
  // fine-grained 토큰에서 실패할 수 있다 — 그 경우 수동 1회 생성을 안내한다.
  const mainRef = await gh(`/repos/${repo}/branches/main`, token);
  if (!mainRef.ok) {
    // 404 진단용으로 대상 repo 문자열(비밀 아님)과 토큰 형태·응답 본문을 싣는다.
    // /branches/main 404 = 토큰이 repo 자체에 접근 불가(값 오류·선택 누락·손상 붙여넣기).
    const body = (await mainRef.text().catch(() => '')).slice(0, 120);
    const tokenShape = `${token.slice(0, 11)}…(len=${token.length})`;
    throw new Error(
      `cannot fetch main branch: ${mainRef.status} repo="${repo}" token=${tokenShape} body=${body}`
    );
  }
  const mainData = (await mainRef.json()) as { commit: { sha: string } };
  const create = await gh(`/repos/${repo}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainData.commit.sha }),
  });
  if (!create.ok) {
    throw new Error(
      `createBranch failed: ${create.status} — fine-grained 토큰은 브랜치 생성이 막힐 수 있습니다. ` +
        `저장소에서 '${branch}' 브랜치를 수동으로 한 번 만들어 주세요.`
    );
  }
}

export interface GitHubBackupResult {
  ok: boolean;
  path?: string;
  sha?: string;
  url?: string;
  error?: string;
}

/**
 * 스냅샷 본문을 GitHub 의 backups 브랜치에 커밋.
 * 경로: backups/YYYY/MM/DD-HHMMSS-<label>.json
 */
export async function pushSnapshotToGitHub(
  label: string,
  body: string
): Promise<GitHubBackupResult> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: 'GITHUB_BACKUP_TOKEN/REPO not set' };

  try {
    await ensureBranch(cfg.token, cfg.repo, cfg.branch);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const hms =
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0');
  const path = `backups/${y}/${m}/${d}-${hms}-${label}.json`;

  const contentBase64 = Buffer.from(body, 'utf-8').toString('base64');

  const res = await gh(`/repos/${cfg.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, cfg.token, {
    method: 'PUT',
    body: JSON.stringify({
      message: `backup: ${label} ${y}-${m}-${d} ${hms} UTC`,
      content: contentBase64,
      branch: cfg.branch,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `GitHub PUT failed: ${res.status} ${await res.text()}` };
  }
  const data = (await res.json()) as { content: { path: string; sha: string; html_url?: string } };
  return { ok: true, path: data.content.path, sha: data.content.sha, url: data.content.html_url };
}

export interface GitHubBackupEntry {
  path: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
  label: string;
  createdAt: string;
}

/**
 * GitHub backups 브랜치의 스냅샷 목록 조회 (최신 200개).
 */
export async function listGitHubBackups(): Promise<GitHubBackupEntry[]> {
  const cfg = getConfig();
  if (!cfg) return [];

  // 최신 커밋부터 역순으로 — 각 커밋이 1 파일 추가이므로 커밋 목록 = 파일 목록.
  const res = await gh(
    `/repos/${cfg.repo}/commits?sha=${encodeURIComponent(cfg.branch)}&per_page=200`,
    cfg.token
  );
  if (!res.ok) return [];
  const commits = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author: { date: string } };
  }>;

  const entries: GitHubBackupEntry[] = [];
  for (const c of commits) {
    // 커밋의 변경 파일 확인
    const detail = await gh(`/repos/${cfg.repo}/commits/${c.sha}`, cfg.token);
    if (!detail.ok) continue;
    const det = (await detail.json()) as {
      files?: Array<{ filename: string; status: string; size?: number; raw_url: string; blob_url: string; sha: string }>;
    };
    for (const f of det.files ?? []) {
      if (!f.filename.startsWith('backups/') || !f.filename.endsWith('.json')) continue;
      if (f.status === 'removed') continue;
      const basename = f.filename.split('/').pop() ?? f.filename;
      const label = basename.replace(/\.json$/, '').split('-').slice(3).join('-') || 'backup';
      entries.push({
        path: f.filename,
        sha: f.sha,
        size: f.size ?? 0,
        url: f.raw_url,
        htmlUrl: f.blob_url,
        label,
        createdAt: c.commit.author.date,
      });
    }
  }
  // sha 중복 제거 (한 커밋에 여러 파일이면 각각 추가됨 — 현재 1파일/1커밋 패턴)
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });
}

/**
 * 특정 GitHub 백업 파일 내용 다운로드.
 */
export async function fetchGitHubBackup(path: string): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  const res = await gh(
    `/repos/${cfg.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(cfg.branch)}`,
    cfg.token
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  return Buffer.from(data.content, data.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8');
}

export function isGitHubBackupConfigured(): boolean {
  return getConfig() !== null;
}
