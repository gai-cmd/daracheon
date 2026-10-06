/**
 * 2026-10-03 운영 데이터(Blob) 문구 일회성 정정 — 코드 배포로는 바뀌지 않는 값.
 *
 *  1) pages.showroom: 'Daracheon' → 'Daeracheon' (hero.titleEn · intro.tag · visit.addressEn)
 *     /showroom 과 /brand-story 쇼룸 챕터가 같은 데이터를 읽는다.
 *  2) products[daerachoen-cham-agarwood-oil-capsule].description: 함량을 포장 표시사항 기준으로.
 *
 * 원칙: 기대한 원래 문구일 때만 바꾼다. 이미 바뀌었거나(멱등) 어드민에서 다른 문구로
 * 고친 경우는 건드리지 않는다. 실행 주체: /api/cron/content-fix (Vercel Cron).
 * 운영 반영이 확인되면 이 파일·라우트·vercel.json 크론 항목을 함께 제거한다.
 */

export const SHOWROOM_EDITS: ReadonlyArray<readonly [path: string, from: string, to: string]> = [
  ['hero.titleEn', 'Daracheon Agarwood Showroom', 'Daeracheon Agarwood Showroom'],
  ['intro.tag', 'Daracheon Agarwood Showroom', 'Daeracheon Agarwood Showroom'],
  [
    'visit.addressEn',
    'Dong Nai Province, Vietnam — Daracheon Direct Showroom',
    'Dong Nai Province, Vietnam — Daeracheon Direct Showroom',
  ],
];

export const CAPSULE_SLUG = 'daerachoen-cham-agarwood-oil-capsule';
export const CAPSULE_FROM =
  '100% 아갈로차 품종 오일 원액의 하루 섭취 권장량은 2~3mL이며 이 캡슐 제품에는 정확하게 3mL가 포함돼 있습니다.';
export const CAPSULE_TO =
  '포장 표시 기준 1캡슐(507.5mg)에는 침향나무 수지가 침착된 수간목오일이 3,000mcg(3mg, 0.59%) 들어 있으며, 1일 1회 1캡슐을 섭취합니다.';

export type FixStatus = 'changed' | 'already' | 'mismatch' | 'missing';
export interface FixReport {
  field: string;
  status: FixStatus;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

/** pages 객체를 제자리에서 고친다. 바뀐 항목이 하나라도 있으면 changed=true. */
export function fixShowroomCopy(pages: Obj | null | undefined): { changed: boolean; report: FixReport[] } {
  const report: FixReport[] = [];
  const showroom = pages && isObj(pages.showroom) ? pages.showroom : null;
  for (const [path, from, to] of SHOWROOM_EDITS) {
    const field = `pages.showroom.${path}`;
    const keys = path.split('.');
    const last = keys.pop()!;
    let parent: unknown = showroom;
    for (const k of keys) parent = isObj(parent) ? parent[k] : undefined;
    if (!isObj(parent) || typeof parent[last] !== 'string') {
      report.push({ field, status: 'missing' });
    } else if (parent[last] === to) {
      report.push({ field, status: 'already' });
    } else if (parent[last] !== from) {
      report.push({ field, status: 'mismatch' });
    } else {
      parent[last] = to;
      report.push({ field, status: 'changed' });
    }
  }
  return { changed: report.some((r) => r.status === 'changed'), report };
}

/** products 배열에서 캡슐 description 문장만 교체(제자리). */
export function fixCapsuleCopy(products: unknown[]): { changed: boolean; report: FixReport[] } {
  const field = `products.${CAPSULE_SLUG}.description`;
  // 2026-10-06 slug 정정(daerachoen → daeracheon) 이후에도 같은 제품을 찾는다.
  const cap = products.find((p): p is Obj => isObj(p) && (p.slug === CAPSULE_SLUG || p.slug === 'daeracheon-cham-agarwood-oil-capsule'));
  let status: FixStatus;
  if (!cap || typeof cap.description !== 'string') status = 'missing';
  else if (cap.description.includes(CAPSULE_TO)) status = 'already';
  else if (!cap.description.includes(CAPSULE_FROM)) status = 'mismatch';
  else {
    cap.description = cap.description.replace(CAPSULE_FROM, CAPSULE_TO);
    status = 'changed';
  }
  return { changed: status === 'changed', report: [{ field, status }] };
}
