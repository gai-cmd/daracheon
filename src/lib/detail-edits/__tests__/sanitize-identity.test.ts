import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { DETAIL_SLUGS } from '../pages';
import { sanitizeDetailHtml } from '../sanitize';

// 동일성(계약 §1): 실제 시안 11개의 "글자 덩어리" innerHTML 을 서버 정제기에 통과시켜도 달라지지 않아야 한다.
// 달라지면 편집하지 않은 글자까지 저장될 때 서식이 깎인다 — 그래서 허용 목록은 데이터에 맞춰 넓힌다(느슨하게 풀지 않는다).
//
// 글자 덩어리의 정의는 클라이언트 코어(CORE 트랙)의 것을 흉내 낸 근사다: 자식이 전부 글자이거나 허용 인라인 태그이고,
// 그 아래 후손도 전부 허용 인라인 태그인 요소. (코어의 실제 분류와 완전히 같지는 않다 — 코어 쪽 동일성 점검은 CORE 몫이다.)
// jsdom 은 isomorphic-dompurify 를 통해 들어오는 간접 의존성이다(새 의존성 아님). 없으면 건너뛰고 그 사실을 출력한다.

const BACKUP = '/Users/gai/personal/works/daeracheon-detail-concepts-deploy.bak-20261104';
const INLINE = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'small', 'mark', 'sup', 'sub', 'br', 'span', 'a', 'code', 'abbr']);
const SKIP_ANCESTORS = new Set(['script', 'style', 'noscript', 'template', 'svg', 'math', 'iframe', 'canvas', 'object', 'embed']);

interface JsdomLike {
  JSDOM: new (html: string) => { window: { document: DocLike; close(): void } };
}
interface NodeLike {
  nodeType: number;
  tagName?: string;
  childNodes: ArrayLike<NodeLike>;
  parentElement: NodeLike | null;
  innerHTML: string;
  textContent: string | null;
}
interface DocLike {
  body: { querySelectorAll(sel: string): ArrayLike<NodeLike> };
}

function loadJsdom(): JsdomLike | null {
  try {
    return createRequire(import.meta.url)('jsdom') as JsdomLike;
  } catch {
    return null;
  }
}

const jsdom = loadJsdom();
const available = fs.existsSync(path.join(BACKUP, 's7_black.html')) && jsdom !== null;

const tag = (n: NodeLike) => (n.tagName ?? '').toLowerCase();

/** 글자 덩어리 후보의 innerHTML 목록(중복 제거). */
function textBlocks(html: string): string[] {
  const { window } = new jsdom!.JSDOM(html);
  const doc = window.document;
  const out = new Set<string>();
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    if (SKIP_ANCESTORS.has(tag(el))) continue;
    const kids = Array.from(el.childNodes);
    if (!kids.every((n) => n.nodeType === 3 || (n.nodeType === 1 && INLINE.has(tag(n))))) continue;
    let skipped = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (SKIP_ANCESTORS.has(tag(p))) {
        skipped = true;
        break;
      }
    }
    if (skipped) continue;
    if (!(el.textContent ?? '').trim()) continue;
    const inner = el.innerHTML;
    // 후손 중 허용 밖 태그가 있으면 글자 덩어리가 아니다 (코어는 그 글자를 따로 쪼갠다).
    if (/<(?!\/?(?:b|strong|i|em|u|s|small|mark|sup|sub|br|span|a|code|abbr)[\s>/])/i.test(inner)) continue;
    out.add(inner);
  }
  window.close(); // 창을 닫지 않으면 시안을 거듭할수록 느려진다
  return [...out];
}

describe('서버 정제기 동일성 — 실제 시안 11개', () => {
  if (!available) {
    it('시안 백업 또는 jsdom 이 없어 동일성 점검을 건너뜀', () => {
      console.info('[sanitize-identity.test] 시안 백업/jsdom 없음 — 실제 시안 동일성 점검을 건너뜁니다.');
      expect(available).toBe(false);
    });
    return;
  }

  it.each(DETAIL_SLUGS.map((slug) => ({ slug })))(
    '$slug: 글자 덩어리를 정제해도 innerHTML 이 그대로다',
    ({ slug }) => {
      const blocks = textBlocks(fs.readFileSync(path.join(BACKUP, `${slug}.html`), 'utf-8'));
      expect(blocks.length, `${slug}: 글자 덩어리를 찾지 못함`).toBeGreaterThan(50);
      const changed = blocks.filter((b) => sanitizeDetailHtml(b) !== b);
      expect(changed.slice(0, 3), `${slug}: 정제로 달라진 덩어리 ${changed.length}/${blocks.length}`).toEqual([]);
    },
    // 다른 작업과 CPU 를 나눠 쓰면 시안당 수십 초까지 느려질 수 있다 (한가할 때는 시안당 1초 안팎).
    120_000,
  );
});
