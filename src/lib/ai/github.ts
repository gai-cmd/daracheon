/**
 * GitHub REST API helpers for the admin AI agent.
 *
 * The AI route reads/writes source files in the connected GitHub repo via
 * Contents & Search APIs. Every write is a commit on `main`, which triggers
 * the Vercel Git integration to build & deploy a new version (~2–3 min).
 *
 * Requirements (Vercel env):
 *  - GITHUB_TOKEN : fine-grained PAT with Contents: read/write on the repo
 *  - GITHUB_REPO  : "owner/name" (optional; defaults to gai-cmd/daracheon)
 *  - GITHUB_BRANCH: default branch (optional; defaults to main)
 */

const DEFAULT_REPO = 'gai-cmd/daracheon';
const DEFAULT_BRANCH = 'main';
const API = 'https://api.github.com';

function ghConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH ?? DEFAULT_BRANCH;
  if (!token) throw new Error('GITHUB_TOKEN 환경변수가 설정되지 않았습니다.');
  return { token, repo, branch };
}

function ghHeaders(token: string): HeadersInit {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'daracheon-admin-ai',
  };
}

/* ─────────────────────────────────────────────────────────
   Path safety — hard allowlist / denylist
   ───────────────────────────────────────────────────────── */

const ALLOWED_PREFIXES = ['src/', 'public/', 'data/', 'scripts/'];
const ALLOWED_ROOT_FILES = new Set([
  'tailwind.config.ts',
  'next.config.ts',
  'postcss.config.js',
  'tsconfig.json',
  'vercel.json',
]);
const DENY_SUBSTRINGS = [
  '..',
  '.env',
  '.git/',
  '.github/workflows/',
  'node_modules/',
  '.next/',
  '.vercel/',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

export function isPathAllowed(path: string): { ok: true } | { ok: false; reason: string } {
  const clean = path.replace(/^\/+/, '').trim();
  if (!clean) return { ok: false, reason: '빈 경로입니다.' };
  if (clean.includes('\\')) return { ok: false, reason: '경로 구분자는 / 만 사용' };
  for (const sub of DENY_SUBSTRINGS) {
    if (clean.includes(sub)) return { ok: false, reason: `금지된 경로 패턴: ${sub}` };
  }
  if (ALLOWED_ROOT_FILES.has(clean)) return { ok: true };
  for (const prefix of ALLOWED_PREFIXES) {
    if (clean.startsWith(prefix)) return { ok: true };
  }
  return {
    ok: false,
    reason: `허용되지 않은 경로. 허용 대상: ${ALLOWED_PREFIXES.join(', ')}${[...ALLOWED_ROOT_FILES].join(', ')}`,
  };
}

/* ─────────────────────────────────────────────────────────
   Base64 helpers (UTF-8 safe)
   ───────────────────────────────────────────────────────── */

function b64Encode(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64');
}
function b64Decode(s: string): string {
  return Buffer.from(s, 'base64').toString('utf8');
}

/* ─────────────────────────────────────────────────────────
   Contents API
   ───────────────────────────────────────────────────────── */

export interface RepoFile {
  path: string;
  sha: string;
  size: number;
  content: string;          // decoded UTF-8
  htmlUrl: string;
}

interface ContentFileResponse {
  type: 'file';
  path: string;
  sha: string;
  size: number;
  encoding: 'base64';
  content: string;
  html_url: string;
}

interface ContentDirEntry {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  name: string;
  path: string;
  sha: string;
  size: number;
}

export async function readRepoFile(path: string): Promise<RepoFile> {
  const { token, repo, branch } = ghConfig();
  const url = `${API}/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: 'no-store' });
  if (res.status === 404) throw new Error(`파일 없음: ${path}`);
  if (!res.ok) throw new Error(`GitHub read 실패 (${res.status}): ${await res.text().catch(() => '')}`);
  const body = (await res.json()) as ContentFileResponse | ContentFileResponse[];
  if (Array.isArray(body)) throw new Error(`${path} 는 디렉터리입니다. list_source_files를 쓰세요.`);
  if (body.type !== 'file') throw new Error(`파일이 아닙니다: ${path} (type=${body.type})`);
  return {
    path: body.path,
    sha: body.sha,
    size: body.size,
    content: b64Decode(body.content.replace(/\n/g, '')),
    htmlUrl: body.html_url,
  };
}

export async function listRepoDir(path: string): Promise<ContentDirEntry[]> {
  const { token, repo, branch } = ghConfig();
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const url = clean
    ? `${API}/repos/${repo}/contents/${encodeURI(clean)}?ref=${encodeURIComponent(branch)}`
    : `${API}/repos/${repo}/contents?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: 'no-store' });
  if (res.status === 404) throw new Error(`디렉터리 없음: ${path}`);
  if (!res.ok) throw new Error(`GitHub list 실패 (${res.status}): ${await res.text().catch(() => '')}`);
  const body = (await res.json()) as ContentDirEntry[] | ContentFileResponse;
  if (!Array.isArray(body)) throw new Error(`${path} 는 파일입니다. read_source_file을 쓰세요.`);
  return body;
}

export interface CommitResult {
  sha: string;
  commitSha: string;
  htmlUrl: string;
  path: string;
}

export async function writeRepoFile(params: {
  path: string;
  content: string;
  message: string;
  sha?: string;          // required for updates, omit for creates
  authorName?: string;
  authorEmail?: string;
}): Promise<CommitResult> {
  const { token, repo, branch } = ghConfig();
  const url = `${API}/repos/${repo}/contents/${encodeURI(params.path)}`;
  const body: Record<string, unknown> = {
    message: params.message,
    content: b64Encode(params.content),
    branch,
  };
  if (params.sha) body.sha = params.sha;
  if (params.authorName && params.authorEmail) {
    body.committer = { name: params.authorName, email: params.authorEmail };
    body.author = { name: params.authorName, email: params.authorEmail };
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub write 실패 (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    content: { path: string; sha: string; html_url: string };
    commit: { sha: string; html_url: string };
  };
  return {
    sha: json.content.sha,
    commitSha: json.commit.sha,
    htmlUrl: json.content.html_url,
    path: json.content.path,
  };
}

export async function deleteRepoFile(params: {
  path: string;
  message: string;
  sha: string;
  authorName?: string;
  authorEmail?: string;
}): Promise<{ commitSha: string }> {
  const { token, repo, branch } = ghConfig();
  const url = `${API}/repos/${repo}/contents/${encodeURI(params.path)}`;
  const body: Record<string, unknown> = {
    message: params.message,
    sha: params.sha,
    branch,
  };
  if (params.authorName && params.authorEmail) {
    body.committer = { name: params.authorName, email: params.authorEmail };
    body.author = { name: params.authorName, email: params.authorEmail };
  }
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...ghHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub delete 실패 (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { commit: { sha: string } };
  return { commitSha: json.commit.sha };
}

/* ─────────────────────────────────────────────────────────
   Code search
   ───────────────────────────────────────────────────────── */

export interface CodeSearchMatch {
  path: string;
  htmlUrl: string;
  score: number;
  textMatches?: Array<{ fragment: string; matches: Array<{ text: string; indices: [number, number] }> }>;
}

export async function searchRepoCode(query: string, limit = 20): Promise<CodeSearchMatch[]> {
  const { token, repo } = ghConfig();
  const q = `${query} repo:${repo}`;
  const url = `${API}/search/code?q=${encodeURIComponent(q)}&per_page=${Math.max(1, Math.min(50, limit))}`;
  const res = await fetch(url, {
    headers: { ...ghHeaders(token), accept: 'application/vnd.github.text-match+json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub search 실패 (${res.status}): ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    items: Array<{
      path: string;
      html_url: string;
      score: number;
      text_matches?: Array<{
        fragment: string;
        matches: Array<{ text: string; indices: [number, number] }>;
      }>;
    }>;
  };
  return body.items.map((it) => ({
    path: it.path,
    htmlUrl: it.html_url,
    score: it.score,
    textMatches: it.text_matches,
  }));
}
