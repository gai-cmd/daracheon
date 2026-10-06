/**
 * 블로그 본문 HTML 의 <img> 대체텍스트(alt) 를 읽고 고치는 순수 함수.
 * 어드민 편집 화면의 '이미지 대체텍스트' 패널이 쓴다. 대상 <img> 태그의 alt 속성만
 * 바꾸고 나머지 HTML 은 한 바이트도 건드리지 않는다 (DOM 재직렬화 없이 문자열 치환).
 * 속성은 따옴표를 인식하며 앞에서부터 차례로 읽는다 — 다른 속성값 안의 'alt'·'src'
 * 글자나 따옴표 안의 '>' 에 속지 않도록.
 */

export interface BodyImage {
  index: number;
  src: string;
  /** null = alt 속성 없음, '' = 빈 alt */
  alt: string | null;
}

interface AttrToken {
  name: string;
  /** 디코딩 전 원문 값. 값 없는 속성은 '' */
  raw: string;
  start: number;
  end: number;
}

// 따옴표 안의 '>' 를 태그 끝으로 보지 않는다.
const IMG_TAG = /<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;

// TinyMCE 기본 entity_encoding('named')이 쓰는 이름 엔티티 표 — tinymce 7.9.2 의
// namedEntities 원문(코드값 32진수, 이름 쌍) 그대로. 테스트가 설치된 tinymce 소스와 대조한다.
export const TINYMCE_NAMED_ENTITIES = [
  '50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,5a,ordf,5b,laquo,5c,not,5d,shy',
  '5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm',
  '5r,raquo,5s,frac14,5t,frac12,5u,frac34,5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig',
  '67,Ccedil,68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,6i,Ograve',
  '6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN',
  '6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc',
  '7b,euml,7c,igrave,7d,iacute,7e,icirc,7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml',
  '7n,divide,7o,oslash,7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta',
  'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,st,Nu,su,Xi,sv,Omicron',
  't0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,t9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta',
  'tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho',
  'u2,sigmaf,u3,sigma,u4,tau,u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull',
  '816,hellip,81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym',
  '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,8ek,hArr',
  '8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,8gh,sum,8gi,minus',
  '8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,8hb,int,8hk,there4,8hs,sim',
  '8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,nsub,8k6,sube,8k7,supe,8kl,oplus',
  '8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades',
  '9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp',
  '803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo',
  '80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro',
].join(',');

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
{
  const parts = TINYMCE_NAMED_ENTITIES.split(',');
  for (let k = 0; k < parts.length; k += 2) NAMED[parts[k + 1]] = String.fromCharCode(parseInt(parts[k], 32));
}

// DOM 을 쓰지 않는 디코더 — 서버·브라우저·테스트에서 같은 결과. 모르는 이름은 원문 그대로 둔다.
function decodeEntities(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
    if (e[0] !== '#') return NAMED[e] ?? m;
    const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseAttrs(tag: string): AttrToken[] {
  const out: AttrToken[] = [];
  const n = tag.length;
  let i = 4; // '<img' 다음
  while (i < n) {
    while (i < n && /[\s/]/.test(tag[i])) i++;
    if (i >= n || tag[i] === '>') break;
    const start = i;
    while (i < n && !/[\s/>=]/.test(tag[i])) i++;
    const name = tag.slice(start, i).toLowerCase();
    let j = i;
    while (j < n && /\s/.test(tag[j])) j++;
    let raw = '';
    if (tag[j] === '=') {
      j++;
      while (j < n && /\s/.test(tag[j])) j++;
      const q = tag[j];
      if (q === '"' || q === "'") {
        const close = tag.indexOf(q, j + 1);
        raw = tag.slice(j + 1, close === -1 ? n : close);
        i = close === -1 ? n : close + 1;
      } else {
        const s = j;
        while (j < n && !/[\s>]/.test(tag[j])) j++;
        raw = tag.slice(s, j);
        i = j;
      }
    }
    if (i === start) i++; // 이상한 문자에서 멈추지 않도록
    out.push({ name, raw, start, end: i });
  }
  return out;
}

export function listBodyImages(html: string): BodyImage[] {
  return Array.from(html.matchAll(IMG_TAG), (m, index) => {
    const attrs = parseAttrs(m[0]);
    const src = attrs.find((a) => a.name === 'src');
    const alt = attrs.find((a) => a.name === 'alt');
    return { index, src: src ? decodeEntities(src.raw) : '', alt: alt ? decodeEntities(alt.raw) : null };
  });
}

export function setBodyImageAlt(html: string, index: number, alt: string): string {
  const attr = `alt="${escapeAttr(alt)}"`;
  let i = -1;
  // replace 에 문자열이 아닌 함수를 넘겨 alt 안의 '$&'·'$1' 이 치환 패턴으로 해석되지 않게 한다.
  return html.replace(IMG_TAG, (tag) => {
    i += 1;
    if (i !== index) return tag;
    const existing = parseAttrs(tag).find((a) => a.name === 'alt');
    if (existing) return tag.slice(0, existing.start) + attr + tag.slice(existing.end);
    return `${tag.slice(0, 4)} ${attr}${tag.slice(4)}`;
  });
}

// lib/blog/sanitize.ts 의 ALLOWED_IMAGE_HOST_SUFFIXES·isSafeImageUrl 과 같은 기준.
// 이 기준을 벗어난 이미지는 어드민 저장 시 새니타이저가 본문에서 지운다.
export function isStoredImageUrl(src: string): boolean {
  if (src.startsWith('/uploads/') || src.startsWith('/images/') || src.startsWith('/public/')) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return host === 'blob.vercel-storage.com' || host.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
