// 채널 피드 파서 (SPEC-CONSOLE-002 REQ-CS2-034, design.md §2.13, CS2-D23). 새 의존성 없이 정규식으로
// 유튜브 채널 Atom, 네이버 블로그 RSS, 일반 RSS 2.0, 일반 Atom 에서 제목·주소·날짜·썸네일만 읽는다.
// 문서형 선언(<!DOCTYPE …>)은 통째로 버리고 엔티티 선언을 해석하지 않는다(XXE·엔티티 폭증 없음).
// 결과의 제목은 글자로만 쓴다 — 화면에 HTML 로 넣지 않는다.

export interface ParsedFeedItem {
  title: string;
  url: string;
  publishedAt: string | null;
  /** 썸네일 원본 주소(퍼센트 인코딩 그대로). 허용 목록 검사는 부르는 쪽이 한다. */
  thumbSrc: string | null;
}

const TITLE_MAX = 200;
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** XML 기본 엔티티와 숫자 엔티티만 푼다. 정의되지 않은 이름 엔티티는 그대로 둔다. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]+);/g, (m, body: string) => {
    if (body[0] !== '#') return NAMED[body] ?? m;
    const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return m;
    return String.fromCodePoint(code);
  });
}

/** CDATA 바깥은 엔티티를 풀고, CDATA 안은 그대로 이어 붙인다. */
function unwrap(inner: string): string {
  let out = '';
  let last = 0;
  for (const m of inner.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)) {
    out += decodeEntities(inner.slice(last, m.index)) + m[1];
    last = m.index! + m[0].length;
  }
  return out + decodeEntities(inner.slice(last));
}

const esc = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 이름 뒤에 공백, '/', '>' 가 와야 한다 — <content> 가 <content:encoded> 를, <link> 가 <linkfoo> 를 잡지 않게.
const open = (name: string) => `<${esc(name)}(?=[\\s/>])`;

/** 처음 나오는 <name>…</name> 의 안쪽 원문. */
function inner(block: string, name: string): string | null {
  const m = block.match(new RegExp(`${open(name)}[^>]*>([\\s\\S]*?)</${esc(name)}\\s*>`, 'i'));
  return m ? m[1] : null;
}

/** <name …> 여는 태그들의 속성 목록. */
function tags(block: string, name: string): Record<string, string>[] {
  return [...block.matchAll(new RegExp(`${open(name)}([^>]*)>`, 'gi'))].map((m) => attrs(m[1]));
}

function attrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? '');
  return out;
}

const textOf = (raw: string) =>
  unwrap(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function httpUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? v : null;
  } catch {
    return null;
  }
}

function linkOf(block: string): string | null {
  const links = tags(block, 'link').filter((a) => a.href);
  // Atom: rel 이 없으면 alternate 와 같다.
  const alt = links.find((a) => !a.rel || a.rel.toLowerCase() === 'alternate') ?? links[0];
  if (alt) return httpUrl(alt.href);
  const text = inner(block, 'link');
  return text === null ? null : httpUrl(textOf(text));
}

function dateOf(block: string): string | null {
  for (const name of ['pubDate', 'published', 'updated', 'dc:date']) {
    const raw = inner(block, name);
    if (raw === null) continue;
    const t = Date.parse(textOf(raw));
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return null;
}

const isImageType = (t: string | undefined) => !!t && t.toLowerCase().startsWith('image/');

function thumbOf(block: string): string | null {
  const thumb = tags(block, 'media:thumbnail').find((a) => a.url);
  if (thumb) return thumb.url;
  const content = tags(block, 'media:content').find((a) => a.url && (a.medium === 'image' || isImageType(a.type)));
  if (content) return content.url;
  const enclosure = tags(block, 'enclosure').find((a) => a.url && isImageType(a.type));
  if (enclosure) return enclosure.url;
  for (const name of ['description', 'content:encoded', 'summary', 'content', 'media:description']) {
    const raw = inner(block, name);
    if (raw === null) continue;
    const img = unwrap(raw).match(/<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    if (img) return decodeEntities(img[1] ?? img[2]);
  }
  return null;
}

/** 제목이 빈 항목의 대신 제목: 주소 경로의 끝 조각. */
function lastSegment(url: string): string {
  const seg = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(seg) || url;
  } catch {
    return seg || url;
  }
}

/** 피드 문서를 항목 목록으로. 피드가 아닌 문서(HTML 오류 페이지 등)는 null. 날짜 있는 항목이 최신순으로 먼저. */
export function parseFeed(xml: string): ParsedFeedItem[] | null {
  // CDATA 는 지우지 않고 남기면서, 그 밖의 주석·문서형 선언·처리 명령을 지운다.
  const doc = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<!DOCTYPE(?:[^[>]|\[[\s\S]*?\])*>|<\?[\s\S]*?\?>/gi, (m) =>
    m.startsWith('<![CDATA[') ? m : ''
  );
  if (!/<(rss|feed|rdf:RDF)(?=[\s>])/i.test(doc)) return null;

  const items: ParsedFeedItem[] = [];
  for (const m of doc.matchAll(/<(item|entry)(?=[\s>])[^>]*>([\s\S]*?)<\/\1\s*>/gi)) {
    const block = m[2];
    const url = linkOf(block);
    if (!url) continue;
    const titleRaw = inner(block, 'title');
    let title = titleRaw === null ? '' : textOf(titleRaw);
    if (!title) title = lastSegment(url);
    items.push({ title: [...title].slice(0, TITLE_MAX).join(''), url, publishedAt: dateOf(block), thumbSrc: thumbOf(block) });
  }
  // 날짜 있는 항목 최신순, 날짜 없는 항목은 원래 순서대로 뒤에.
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => {
      const ta = a.it.publishedAt ? Date.parse(a.it.publishedAt) : null;
      const tb = b.it.publishedAt ? Date.parse(b.it.publishedAt) : null;
      if (ta === null && tb === null) return a.i - b.i;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return tb - ta || a.i - b.i;
    })
    .map((x) => x.it);
}
