import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { isBlobEnabled } from '@/lib/db';
import { createDetailEditStore } from '../store';

// 실제 db.ts 의 로컬 fs 저장소(Blob 토큰 없음)로 왕복을 확인하는 스모크 테스트.
// 운영 파일명과 겹치지 않도록 무작위 접두사를 쓰고, 끝나면 만든 파일을 모두 지운다.
// Blob 토큰이 설정되어 있으면(= 운영 저장소를 건드릴 수 있으면) 아무것도 쓰지 않고 실패한다.

const PREFIX = `de-fs-test-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const SLUG = 's11_astra';
const DB_DIR = path.join(process.cwd(), 'data', 'db');
const created = [`${PREFIX}__${SLUG}.json`, `${PREFIX}-history__${SLUG}.json`].map((f) => path.join(DB_DIR, f));

afterAll(() => {
  for (const file of created) {
    try {
      fs.unlinkSync(file);
    } catch {
      /* 만들어지지 않았으면 무시 */
    }
  }
});

describe('fs 저장소 왕복 (db.ts 실물)', () => {
  it('Blob 토큰이 없다 (운영 저장소에 닿지 않는다)', () => {
    expect(isBlobEnabled()).toBe(false);
  });

  it('저장 → 공개/관리자 읽기 → 이력 → 복원', async () => {
    if (isBlobEnabled()) throw new Error('BLOB_READ_WRITE_TOKEN 이 설정되어 있어 실저장소 테스트를 중단합니다.');
    const store = createDetailEditStore({ doc: PREFIX, history: `${PREFIX}-history` });

    const r1 = await store.save(SLUG, {
      baseVersion: 0,
      doc: { texts: [{ k: 't:ab12cd:0', o: 'x', html: '<b>하나</b>' }], images: [], bgs: [], hidden: [] },
      actor: 'fs@test.invalid',
      note: '첫 저장',
    });
    expect(r1).toMatchObject({ ok: true, version: 1, historySaved: true });
    expect(fs.existsSync(created[0])).toBe(true);
    expect(fs.existsSync(created[1])).toBe(true);

    const r2 = await store.save(SLUG, {
      baseVersion: 1,
      doc: { texts: [], images: [], bgs: [], hidden: [{ k: 's:ab12cd:0', o: '섹션' }] },
      actor: 'fs@test.invalid',
    });
    expect(r2).toMatchObject({ ok: true, version: 2 });

    const stale = await store.save(SLUG, { baseVersion: 1, doc: { texts: [], images: [], bgs: [], hidden: [] }, actor: 'x@test.invalid' });
    expect(stale).toEqual({ ok: false, code: 'VERSION_CONFLICT', currentVersion: 2 });

    const pub = await store.readPublic(SLUG);
    expect(pub.degraded).toBe(false);
    expect(pub.doc.version).toBe(2);
    expect(pub.doc.hidden).toHaveLength(1);
    expect(JSON.stringify(pub.doc)).not.toContain('fs@test.invalid');
    expect((await store.readAdmin(SLUG)).updatedBy).toBe('fs@test.invalid');

    expect((await store.listHistory(SLUG)).map((m) => m.version)).toEqual([2, 1]);

    const restored = await store.restore(SLUG, { version: 1, baseVersion: 2, actor: 'fs@test.invalid' });
    expect(restored).toMatchObject({ ok: true, version: 3 });
    expect((await store.readAdmin(SLUG)).texts[0].html).toBe('<b>하나</b>');
  });
});
