/**
 * 상세페이지 시안 편집기 — 인-플레이스 편집 페이지(`/admin/detail-concepts/edit/<slug>`) 구성.
 *
 * 흐름: 시안 사이트의 정적 HTML 을 서버에서 가져와(fetch) 스크립트를 모두 걷어 내고,
 *       `<base>` + 편집기 스크립트 2개를 주입한 뒤 CSP 와 함께 zoellife 오리진으로 돌려준다.
 *       문서 오리진이 zoellife 라서 관리자 세션 쿠키가 편집기의 API 호출에 같은 오리진으로 실린다.
 *
 * 안전장치(겹겹이):
 *   1) 허용 목록 슬러그만, 고정 오리진(getConceptOrigin)만 fetch — 리다이렉트는 따라가지 않는다
 *   2) 응답이 200·text/html·2MB 이하일 때만 사용
 *   3) 변환기가 script·on* 속성·srcdoc·<base>·meta refresh·뷰어 스니펫을 제거
 *   4) CSP `script-src 'self'` — 변환기가 놓친 인라인 스크립트/핸들러도 실행되지 않는다
 *
 * 변환기는 HTML 사양의 토크나이저 규칙(태그/속성/주석/원시 텍스트 요소)을 따르는 1-패스 문자열 변환이며
 * DOM 파서(jsdom)를 쓰지 않는다 — 요청마다 jsdom 을 올리지 않고, 런타임 로드 실패 위험도 피한다.
 * 알려진 한계: script 데이터의 "이중 이스케이프" 상태(`<!-- <script> ... </script> -->`)는 구현하지 않았다.
 * 그 경우 변환기는 더 일찍 script 를 끝낸 것으로 보지만, 스크립트 내용은 어느 쪽이든 출력하지 않고
 * 남은 부분은 마크업으로 계속 정화하므로 안전한 방향으로만 어긋난다.
 */
import { getConceptOrigin } from './origin';

export const UPSTREAM_TIMEOUT_MS = 8000;
export const UPSTREAM_MAX_BYTES = 2 * 1024 * 1024;

/* ── CSP ─────────────────────────────────────────────────── */

/**
 * 편집 페이지 CSP (계약 §4 + 분석 트랙 보정).
 * img-src·media-src 에는 시안 오리진을 항상 적는다. 로컬 E2E 처럼 시안 오리진이 http 이면
 * `https:` 스킴 소스만으로는 이미지 351장이 막히기 때문이고, 운영(https)에서는 중복 허용이라 무해하다.
 */
export function buildEditCsp(conceptOrigin: string): string {
  return [
    "default-src 'none'",
    "script-src 'self'",
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net ${conceptOrigin}`,
    `font-src ${conceptOrigin} https://fonts.gstatic.com https://cdn.jsdelivr.net data:`,
    `img-src https: data: blob: ${conceptOrigin}`,
    `media-src https: ${conceptOrigin}`,
    "connect-src 'self'",
    `base-uri ${conceptOrigin}`,
    "form-action 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
  ].join('; ');
}

/* ── 업스트림 fetch ──────────────────────────────────────── */

export type UpstreamResult =
  | { ok: true; html: string }
  | { ok: false; reason: 'STATUS' | 'CONTENT_TYPE' | 'TOO_LARGE' | 'FAILED'; status?: number };

/** 시안 사이트에서 슬러그의 HTML 을 가져온다. 조건(200·text/html·2MB 이하)을 어기면 사용하지 않는다. */
export async function fetchConceptHtml(slug: string, origin: string = getConceptOrigin()): Promise<UpstreamResult> {
  try {
    const res = await fetch(`${origin}/${slug}`, {
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: 'text/html' },
    });
    if (res.status !== 200) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: 'STATUS', status: res.status };
    }
    if (!/^text\/html\b/i.test(res.headers.get('content-type') ?? '')) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: 'CONTENT_TYPE' };
    }
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > UPSTREAM_MAX_BYTES) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: 'TOO_LARGE' };
    }
    if (!res.body) return { ok: true, html: '' };

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > UPSTREAM_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: 'TOO_LARGE' };
      }
      chunks.push(value);
    }
    return { ok: true, html: new TextDecoder('utf-8').decode(Buffer.concat(chunks)) };
  } catch (err) {
    console.error(`[detail-edits] 시안 HTML 가져오기 실패: ${slug}`, err);
    return { ok: false, reason: 'FAILED' };
  }
}

/* ── HTML 변환 ───────────────────────────────────────────── */

export interface TransformOptions {
  slug: string;
  /** `<base href>` 로 쓸 시안 오리진 */
  conceptOrigin: string;
  /** 편집기 스크립트를 싣는 zoellife 오리진 (요청 오리진) */
  scriptOrigin: string;
}

const SPACE = new Set([' ', '\t', '\n', '\f', '\r']);
const isSpace = (c: string | undefined): boolean => c !== undefined && SPACE.has(c);
const isAlpha = (c: string | undefined): boolean => c !== undefined && /[A-Za-z]/.test(c);

/** 시작 태그가 열면 내용을 원시 텍스트로 읽는 요소 (script 는 따로 처리해 통째로 제거). */
const RAW_TEXT = new Set(['style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes']);

interface Attr {
  name: string;
  raw: string;
  value: string;
}

interface Tag {
  rawName: string;
  name: string;
  attrs: Attr[];
  selfClosing: boolean;
  end: number;
}

/** `<` 위치에서 시작/끝 태그를 읽는다. 문서 끝에서 태그가 끝나지 않으면 null (브라우저도 그 태그를 버린다). */
function readTag(src: string, start: number): Tag | null {
  const n = src.length;
  let p = start + 1;
  if (src[p] === '/') p++;
  const nameStart = p;
  while (p < n && !isSpace(src[p]) && src[p] !== '/' && src[p] !== '>') p++;
  const rawName = src.slice(nameStart, p);
  const attrs: Attr[] = [];
  let selfClosing = false;
  for (;;) {
    const skipStart = p;
    while (p < n && (isSpace(src[p]) || src[p] === '/')) p++;
    if (p >= n) return null;
    if (src[p] === '>') {
      selfClosing = p > skipStart && src[p - 1] === '/';
      p++;
      break;
    }
    const attrStart = p;
    p++; // 첫 글자는 '=' 여도 이름의 일부다 (HTML 사양)
    while (p < n && !isSpace(src[p]) && src[p] !== '/' && src[p] !== '>' && src[p] !== '=') p++;
    const attrName = src.slice(attrStart, p).toLowerCase();
    let q = p;
    while (q < n && isSpace(src[q])) q++;
    let value = '';
    if (src[q] === '=') {
      q++;
      while (q < n && isSpace(src[q])) q++;
      const quote = src[q];
      if (quote === '"' || quote === "'") {
        const close = src.indexOf(quote, q + 1);
        if (close < 0) return null;
        value = src.slice(q + 1, close);
        p = close + 1;
      } else {
        const valueStart = q;
        while (q < n && !isSpace(src[q]) && src[q] !== '>') q++;
        value = src.slice(valueStart, q);
        p = q;
      }
    }
    attrs.push({ name: attrName, raw: src.slice(attrStart, p), value });
  }
  return { rawName, name: rawName.toLowerCase(), attrs, selfClosing, end: p };
}

/** `<!--` 위치의 주석을 읽는다. 끝이 없으면 null. */
function readComment(src: string, start: number): { data: string; end: number } | null {
  const bodyStart = start + 4;
  if (src.startsWith('>', bodyStart)) return { data: '', end: bodyStart + 1 };
  if (src.startsWith('->', bodyStart)) return { data: '', end: bodyStart + 2 };
  const a = src.indexOf('-->', bodyStart);
  const b = src.indexOf('--!>', bodyStart);
  if (a < 0 && b < 0) return null;
  const useA = b < 0 || (a >= 0 && a < b);
  const at = useA ? a : b;
  return { data: src.slice(bodyStart, at), end: at + (useA ? 3 : 4) };
}

/** `</name` 뒤에 공백·`/`·`>` 가 오는 첫 위치 (원시 텍스트 요소의 끝). 없으면 -1. */
function findRawEnd(src: string, from: number, name: string): number {
  // toLowerCase() 는 일부 문자에서 길이가 바뀌어 인덱스가 어긋나므로, 원문에 대고 대소문자 무시 정규식을 쓴다.
  const re = new RegExp(`</${name}(?=[\\s/>]|$)`, 'gi');
  re.lastIndex = from;
  const m = re.exec(src);
  return m ? m.index : -1;
}

/** 속성값의 숫자 문자 참조(`&#114;` 등)를 풀어 비교한다 — 브라우저는 값을 해석한 뒤 판단하기 때문이다. */
function decodeNumericRefs(value: string): string {
  return value.replace(/&#x([0-9a-f]{1,6});?|&#([0-9]{1,7});?/gi, (_m, hex?: string, dec?: string) => {
    const code = hex ? parseInt(hex, 16) : parseInt(dec ?? '', 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const isDangerousAttr = (name: string): boolean => name.startsWith('on') || name === 'srcdoc';

export function transformConceptHtml(html: string, opts: TransformOptions): string {
  const { slug, conceptOrigin, scriptOrigin } = opts;
  const headInjection =
    `<base href="${escapeAttr(conceptOrigin)}/">` +
    '<meta name="robots" content="noindex,nofollow">' +
    `<meta name="de-page" content="${escapeAttr(slug)}">`;
  const bodyInjection =
    `<script src="${escapeAttr(scriptOrigin)}/detail-edit/apply.js" data-mode="edit" data-api="${escapeAttr(scriptOrigin)}"></script>` +
    `<script src="${escapeAttr(scriptOrigin)}/detail-edit/editor.js"></script>`;

  const out: string[] = [];
  const n = html.length;
  let i = 0;
  let headInjected = false;
  let htmlAt = -1;
  let doctypeAt = -1;
  let bodyEndAt = -1;

  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) {
      out.push(html.slice(i));
      break;
    }
    if (lt > i) out.push(html.slice(i, lt));
    i = lt;
    const next = html[i + 1];

    // ── <! : 주석 · doctype · 가짜 주석 ──
    if (next === '!') {
      if (html.startsWith('<!--', i)) {
        const comment = readComment(html, i);
        if (!comment) break; // 끝나지 않은 주석: 브라우저도 문서 끝까지 주석으로 본다 — 버린다
        const marker = comment.data.trim();
        if (marker === 'de:begin') {
          const endMarker = /<!--\s*de:end\s*-->/g;
          endMarker.lastIndex = comment.end;
          const m = endMarker.exec(html);
          i = m ? m.index + m[0].length : comment.end; // 짝이 없으면 시작 표지만 지운다
          continue;
        }
        if (marker === 'de:end') {
          i = comment.end;
          continue;
        }
        out.push(html.slice(i, comment.end));
        i = comment.end;
        continue;
      }
      const gt = html.indexOf('>', i + 2);
      if (gt < 0) break;
      out.push(html.slice(i, gt + 1));
      if (/^<!doctype/i.test(html.slice(i, i + 9))) doctypeAt = out.length;
      i = gt + 1;
      continue;
    }

    // ── <? : 가짜 주석 ──
    if (next === '?') {
      const gt = html.indexOf('>', i + 2);
      if (gt < 0) break;
      out.push(html.slice(i, gt + 1));
      i = gt + 1;
      continue;
    }

    // ── 끝 태그 ──
    if (next === '/') {
      if (isAlpha(html[i + 2])) {
        const tag = readTag(html, i);
        if (!tag) break;
        if (tag.name !== 'script') {
          if (tag.name === 'body') bodyEndAt = out.length;
          out.push(html.slice(i, tag.end));
        }
        i = tag.end;
        continue;
      }
      if (html[i + 2] === '>') {
        i += 3; // `</>` 는 무시
        continue;
      }
      const gt = html.indexOf('>', i + 2);
      if (gt < 0) break;
      out.push(html.slice(i, gt + 1)); // 가짜 주석
      i = gt + 1;
      continue;
    }

    // ── 시작 태그 ──
    if (isAlpha(next)) {
      const tag = readTag(html, i);
      if (!tag) break;
      const start = i;
      i = tag.end;
      const { name } = tag;

      if (name === 'script') {
        // 내용째 제거. 끝 태그가 없으면 브라우저도 문서 끝까지를 스크립트로 보므로 나머지를 버린다.
        const rawEnd = findRawEnd(html, i, 'script');
        if (rawEnd < 0) break;
        const endTag = readTag(html, rawEnd);
        if (!endTag) break;
        i = endTag.end;
        continue;
      }
      if (name === 'base') continue;
      if (
        name === 'meta' &&
        tag.attrs.some((a) => a.name === 'http-equiv' && decodeNumericRefs(a.value).trim().toLowerCase() === 'refresh')
      ) {
        continue;
      }
      if (name === 'style' && tag.attrs.some((a) => a.name === 'id' && decodeNumericRefs(a.value).trim() === 'de-hide')) {
        const rawEnd = findRawEnd(html, i, 'style');
        if (rawEnd < 0) break;
        const endTag = readTag(html, rawEnd);
        if (!endTag) break;
        i = endTag.end;
        continue;
      }

      // 위험한 속성만 덜어 내고 나머지는 원문 그대로 둔다.
      if (tag.attrs.some((a) => isDangerousAttr(a.name))) {
        const kept = tag.attrs.filter((a) => !isDangerousAttr(a.name));
        out.push(`<${tag.rawName}${kept.map((a) => ` ${a.raw}`).join('')}${tag.selfClosing ? ' /' : ''}>`);
      } else {
        out.push(html.slice(start, tag.end));
      }

      if (name === 'html') htmlAt = out.length;
      if (name === 'head' && !headInjected) {
        out.push(headInjection); // 계약: <head> 의 첫 자식
        headInjected = true;
      }

      if (name === 'plaintext') {
        out.push(html.slice(i));
        break;
      }
      if (RAW_TEXT.has(name)) {
        const rawEnd = findRawEnd(html, i, name);
        if (rawEnd < 0) {
          out.push(html.slice(i));
          break;
        }
        out.push(html.slice(i, rawEnd)); // 끝 태그는 다음 반복에서 처리
        i = rawEnd;
      }
      continue;
    }

    // ── 그 밖의 '<' 는 글자 ──
    out.push('<');
    i += 1;
  }

  // 편집기 스크립트: 마지막 </body> 앞, 없으면 문서 끝.
  if (bodyEndAt >= 0) out.splice(bodyEndAt, 0, bodyInjection);
  else out.push(bodyInjection);

  // <head> 시작 태그가 없는 문서: <html> 뒤 → doctype 뒤 → 맨 앞 순서로 주입 (파서가 head 를 암묵 생성한다).
  if (!headInjected) {
    const at = htmlAt >= 0 ? htmlAt : doctypeAt >= 0 ? doctypeAt : 0;
    out.splice(at, 0, headInjection);
  }

  return out.join('');
}
