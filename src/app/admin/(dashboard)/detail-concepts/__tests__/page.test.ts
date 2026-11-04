import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// 목록 페이지 — 11개 시안 행, 버전·수정자·건수, 편집/공개 보기 링크, 읽기 실패 격리.

vi.mock('@/lib/db', async () => (await import('@/lib/detail-edits/__tests__/test-helpers')).dbMock);

import { detailEditStore } from '@/lib/detail-edits/store';
import { DETAIL_PAGES } from '@/lib/detail-edits/pages';
import { mem, resetMemDb } from '@/lib/detail-edits/__tests__/test-helpers';
import DetailConceptsPage from '../page';

async function render(): Promise<string> {
  return renderToStaticMarkup(await DetailConceptsPage());
}

beforeEach(() => {
  resetMemDb();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('/admin/detail-concepts 목록', () => {
  it('11개 시안을 모두 보여 주고 편집·공개 보기 링크를 건다', async () => {
    const html = await render();
    for (const page of DETAIL_PAGES) {
      expect(html).toContain(`시안 ${page.no} · `);
      expect(html).toContain(`href="/admin/detail-concepts/edit/${page.slug}"`);
      expect(html).toContain(`href="https://daeracheon-detail-concepts.vercel.app/${page.slug}"`);
    }
    expect((html.match(/>편집</g) ?? []).length).toBe(11);
    expect((html.match(/>공개 보기</g) ?? []).length).toBe(11);
    expect(html).toContain('수정 없음');
  });

  it('제목 아래에 표지 설명의 첫 문장만 보여 준다 (둘째 문장 이후는 없다)', async () => {
    const html = await render();
    for (const page of DETAIL_PAGES) {
      expect(html).toContain(page.subtitle);
    }
    // 시안 8 의 설명은 여러 문장이다 — 첫 문장만 나오고 슬로건 문장은 나오지 않는다.
    expect(html).toContain('광동제약·정관장·조선비책을 벤치마킹해 카피와 디자인을 모두 새로 만들었습니다.');
    expect(html).not.toContain('굵은 고딕 대제목');
    // 시안 1 도 마찬가지 (두 문장 중 앞 문장만).
    expect(html).toContain('남색 보자기와 금색.');
    expect(html).not.toContain('누구에게 어떤 마음으로');
  });

  it('저장된 시안은 버전·수정자·건수를 보여 준다', async () => {
    await detailEditStore.save('s7_black', {
      baseVersion: 0,
      doc: {
        texts: [{ k: 't:ab12cd:0', o: 'x', html: '<b>y</b>' }, { k: 't:ab12cd:1', o: 'x2', html: 'z' }],
        images: [{ k: 'i:ab12cd:0', o: 'a.jpg' }],
        bgs: [],
        hidden: [{ k: 's:ab12cd:0', o: '섹션' }],
      },
      actor: 'editor@try-n.com',
    });
    const html = await render();
    expect(html).toContain('v1');
    expect(html).toContain('editor@try-n.com');
    expect(html).toContain('글 2 · 이미지 1 · 배경 0 · 숨김 1');
  });

  it('구역 배치(layout) 항목이 있는 시안에만 배치 건수가 덧붙는다', async () => {
    await detailEditStore.save('s7_black', {
      baseVersion: 0,
      doc: {
        texts: [], images: [], bgs: [], hidden: [],
        layout: {
          sequence: [{ k: 's:ab12cd:0' }, { c: 'c1' }],
          clones: [{ id: 'c1', of: 's:ab12cd:0' }],
          gaps: [{ k: 's:ab12cd:0', top: 8 }],
        },
      },
      actor: 'editor@try-n.com',
    });
    const html = await render();
    expect(html).toContain('글 0 · 이미지 0 · 배경 0 · 숨김 0 · 배치 4');
    // 저장이 없는 다른 시안에는 붙지 않는다
    expect((html.match(/배치 \d+/g) ?? []).length).toBe(1);
  });

  it('한 시안의 저장 문서가 손상되어도 목록은 나온다 ("읽기 실패" 표시)', async () => {
    mem.set('detail-edits__s7_black', { schema: 1, page: 's7_black', version: 'x' });
    const html = await render();
    expect(html).toContain('읽기 실패');
    expect(html).toContain('href="/admin/detail-concepts/edit/s1_gift"');
  });

  it('비운영에서 오버라이드 오리진이 있으면 공개 보기 링크가 그 오리진을 가리킨다', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DETAIL_CONCEPTS_ORIGIN', 'http://127.0.0.1:4101');
    expect(await render()).toContain('href="http://127.0.0.1:4101/s7_black"');
    vi.unstubAllEnvs();
  });
});
