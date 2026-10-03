import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import {
  fixShowroomCopy, fixCapsuleCopy, CAPSULE_SLUG, CAPSULE_FROM, CAPSULE_TO,
} from '@/lib/content-fix/copy-2026-10';

// 수정 전 운영 원본과 같은 시드(d55ee1d)로 재현 — 기대 문구가 글자 단위로 맞는지 검증.
function seedAt(rev: string, file: string) {
  return JSON.parse(execSync(`git show ${rev}:data/db/${file}.json`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

describe('content fix 2026-10 — showroom Daeracheon', () => {
  it('fixes the three showroom fields from the pre-fix data', () => {
    const pages = seedAt('d55ee1d', 'pages');
    const { changed, report } = fixShowroomCopy(pages);
    expect(changed).toBe(true);
    expect(report.map((r) => r.status)).toEqual(['changed', 'changed', 'changed']);
    expect(JSON.stringify(pages.showroom)).not.toMatch(/Daracheon/);
    expect(pages.showroom.hero.titleEn).toBe('Daeracheon Agarwood Showroom');
  });

  it('is idempotent and leaves admin-edited values alone', () => {
    const pages = seedAt('d55ee1d', 'pages');
    fixShowroomCopy(pages);
    expect(fixShowroomCopy(pages).report.every((r) => r.status === 'already')).toBe(true);

    const edited = seedAt('d55ee1d', 'pages');
    edited.showroom.intro.tag = '관리자가 바꾼 문구';
    const r = fixShowroomCopy(edited).report.find((x) => x.field.endsWith('intro.tag'));
    expect(r?.status).toBe('mismatch');
    expect(edited.showroom.intro.tag).toBe('관리자가 바꾼 문구');
  });

  it('reports missing when showroom data is absent', () => {
    expect(fixShowroomCopy({}).changed).toBe(false);
    expect(fixShowroomCopy(null).report.every((r) => r.status === 'missing')).toBe(true);
  });
});

describe('content fix 2026-10 — capsule content', () => {
  it('replaces only the wrong sentence, keeping the rest of the description', () => {
    const products = seedAt('d55ee1d', 'products');
    const before: string = products.find((p: { slug: string }) => p.slug === CAPSULE_SLUG).description;
    const { changed } = fixCapsuleCopy(products);
    const after: string = products.find((p: { slug: string }) => p.slug === CAPSULE_SLUG).description;
    expect(changed).toBe(true);
    expect(after).toContain(CAPSULE_TO);
    expect(after).not.toContain('3mL');
    expect(after).toBe(before.replace(CAPSULE_FROM, CAPSULE_TO));
    expect(fixCapsuleCopy(products).report[0].status).toBe('already');
  });

  it('does not touch other products', () => {
    const products = seedAt('d55ee1d', 'products');
    const others = JSON.stringify(products.filter((p: { slug: string }) => p.slug !== CAPSULE_SLUG));
    fixCapsuleCopy(products);
    expect(JSON.stringify(products.filter((p: { slug: string }) => p.slug !== CAPSULE_SLUG))).toBe(others);
  });
});
