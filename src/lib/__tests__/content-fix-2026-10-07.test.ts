import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fixDataFile, fixPost, fixReviews, fixText, RULES } from '@/lib/content-fix/apply-2026-10-07';

// 기준 커밋(07ff503)의 시드 = 이번 정정 전 운영 데이터와 같은 상태.
const BASE = '07ff503';
const before = (f: string) =>
  JSON.parse(execSync(`git show ${BASE}:data/db/${f}.json`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const after = (f: string) => JSON.parse(readFileSync(`data/db/${f}.json`, 'utf8'));

describe('2026-10-07 data fixes — 운영 엔진(TS) = 로컬 적용 결과(시드)', () => {
  for (const f of ['pages', 'products', 'faq', 'company']) {
    it(`${f}.json: 엔진 결과가 커밋된 시드와 같다`, () => {
      expect(fixDataFile(before(f)).data).toEqual(after(f));
    });
    it(`${f}.json: 두 번째 실행은 변화 없음(멱등)`, () => {
      expect(fixDataFile(after(f)).counts).toEqual({});
    });
  }

  it('reviews.json: 띄어쓰기 규칙만 적용 — 엔진 결과 = 시드, 멱등', () => {
    const { data, counts } = fixReviews(before('reviews'));
    expect(data).toEqual(after('reviews'));
    expect(Object.keys(counts)).toEqual(['reviews-day-spacing']);
    expect(fixReviews(after('reviews')).counts).toEqual({});
  });

  it('점검 문서의 잘못된 표기가 시드에서 사라졌다', () => {
    const all = ['pages', 'products', 'faq'].map((f) => JSON.stringify(after(f))).join('');
    for (const bad of ['대한한국', '진납', '지기관', '5개 성에 농장', '인정 받은', '수 밖에', '제품 뿐', '외한약생약', '유기능', 'Agallocha Roxburgh', 'CITES 국제인증', '겸사', 'GC-MS 로']) {
      expect(all).not.toContain(bad);
    }
  });
});

const blog = (content: string) => fixPost({ slug: 'x', title: '', excerpt: '', tags: [] as string[], content }).post.content;

describe('2026-10-07 blog fixes', () => {
  it('&nbsp; 와 NBSP 로 저장된 공백에도 맞는다', () => {
    expect(blog('<p>Roxburgh&nbsp;인지 확인</p>')).toBe('<p>Roxburgh인지 확인</p>');
    expect(blog('<p>A. Agallocha Roxburgh, A. Malaccensis Lam.</p>')).toBe('<p>A. agallocha Roxburgh, A. malaccensis Lam.</p>');
    expect(blog('<p>인정&nbsp;받은 산지</p>')).toBe('<p>인정받은 산지</p>');
  });

  it('점검 문서 항목', () => {
    const cases: Array<[string, string]> = [
      ['(PubMed, Scopus 등)를 검색', '(PubMed, Scopus 등)을 검색'],
      ['침향곡(침향곡)을', '침향곡을'],
      ['어떤 침향일까요??', '어떤 침향일까요?'],
      ['<strong>어떤 침향일까요?</strong>?', '<strong>어떤 침향일까요?</strong>'],
      ['대한한국의 식품의약처안전처', '대한민국의 식품의약품안전처'],
      ['학약재 규격의 침향', '한약재 규격의 침향'],
      ['말라센시시와 말라센스시', '말라센시스와 말라센시스'],
      ['(Aquilaria agallocha Roxburgh)h로', '(Aquilaria agallocha Roxburgh)로'],
      ['유기능인증서', '유기농 인증서'],
      ['가라앉히는데 도움', '가라앉히는 데 도움'],
      ['나와있는', '나와 있는'],
      ['식품 공전', '식품공전'],
      ['대한민국약전외한약생약규격집', '대한민국약전외한약(생약)규격집'],
      ['수입하는 과정 통해', '수입하는 과정을 통해'],
      ['”&nbsp;라고', '”라고'],
      ['Appendix(부록) II', '부속서 II'],
      ['아는 척 하고 답한다면', '아는 척하고 답한다면'],
      ['나노에멀젼과 나노에멀전', '나노에멀션과 나노에멀션'],
      ['식용 원료로 인정되는 유일한 품종입니다', '한약재 규격(대한민국약전외한약(생약)규격집)에 침향으로 등재된 유일한 품종입니다'],
      ['진랍(眞臘, 현 캄보디아-베트남 중부 이남)', '진랍(眞臘, 현 캄보디아와 베트남 남부 일대)'],
      ['GC-MS 를 이용', 'GC-MS를 이용'],
      ['7 가지 추출법', '7가지 추출법'],
    ];
    for (const [from, to] of cases) expect(blog(from)).toBe(to);
  });

  it('CITES 문구 — 형태별로 사실대로, 조사는 그대로 맞게', () => {
    const cases: Array<[string, string]> = [
      ['<a href="https://cites.org">CITES</a> 부속서 등재(IIA-DNI-007)와 동나이 산림청 관리대장 등록으로 갖췄습니다.',
        '<a href="https://cites.org">CITES</a> 규정에 따른 동나이성 산림청 재배시설 관리대장 등록(관리번호 IIA-DNI-007)으로 갖췄습니다.'],
      ['CITES 부속서 등재(IIA-DNI-007)와 중금속 8종 시험 결과',
        'CITES 규정에 따른 동나이성 산림청 재배시설 관리대장 등재(관리번호 IIA-DNI-007)와 중금속 8종 시험 결과'],
      ['<td>CITES 부속서 등재 IIA-DNI-007</td>', '<td>동나이성 산림청 재배시설 관리번호 IIA-DNI-007</td>'],
      ['<td>IIA-DNI-007 (CITES 부속서 등재)</td>', '<td>IIA-DNI-007 (동나이성 산림청 CITES 재배시설 관리번호)</td>'],
      ['<td>CITES 부속서 등재</td><td>IIA-DNI-007</td>', '<td>CITES 재배시설 등록</td><td>IIA-DNI-007</td>'],
      ['대라천 침향은 부속서 등재 관리번호 IIA-DNI-007과 동나이', '대라천 침향은 동나이성 산림청 재배시설 관리번호 IIA-DNI-007과 동나이'],
      ['CITES 부속서 등재, 중금속 8종 불검출', 'CITES 재배시설 등록, 중금속 8종 불검출'],
      // 종이 부속서에 오른다는 일반 설명은 사실이므로 그대로 둔다.
      ['부속서 등재는 거래를 금지한다는 뜻이 아니라', '부속서 등재는 거래를 금지한다는 뜻이 아니라'],
    ];
    for (const [from, to] of cases) expect(blog(from)).toBe(to);
  });

  it('CITES 단정 표현 완화', () => {
    expect(blog('<p>CITES 인증서는 합법 원료 100% 보증 — 가짜 침향은 CITES 통과 불가능합니다.</p>'))
      .toBe('<p>CITES 서류는 원료가 국제 거래 규정에 따라 정식으로 수출입됐음을 보여 줍니다.</p>');
  });

  it('5-1 학명 안내 — 지정한 글 끝에만 한 번 덧붙이고, 에디터 JSON 에도 문단을 넣는다', () => {
    const post = {
      slug: 'mfds-defines-agarwood-as-aquilaria-agallocha', title: '', excerpt: '', tags: [] as string[],
      content: '<p>본문</p>',
      contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] },
    };
    const once = fixPost(post);
    expect(once.counts['note-binomial-stance']).toBe(1);
    expect(once.post.content).toMatch(/^<p>본문<\/p>\n<p>※ 학명 안내 — 식약처 고시 대한민국약전외한약\(생약\)규격집은 침향의 기원을 Aquilaria agallocha Roxburgh로/);
    expect((once.post.contentJson as { content: unknown[] }).content).toHaveLength(2);
    expect(fixPost(once.post).counts).toEqual({});
    expect(fixPost({ ...post, slug: 'other-post' }).post.content).toBe('<p>본문</p>');
  });

  it('블로그 초안 59편 — 남는 잘못된 표기 없음, 두 번째 실행은 변화 없음', () => {
    const dir = 'marketing/blog-rewrite/work/out';
    let files: string[] = [];
    try { files = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { /* 초안 폴더 없으면 건너뜀 */ }
    for (const f of files) {
      const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
      const post = { slug: d.slug, title: d.title, excerpt: d.excerpt, tags: d.tags ?? [], content: d.content };
      const once = fixPost(post).post;
      expect(once.content, f).not.toMatch(/부속서 등재\s*\(?\s*(관리번호\s*)?IIA-DNI-007|CITES 부속서 등재\(/);
      expect(once.content, f).not.toMatch(/A\. (Agallocha|Malaccensis)/);
      expect(fixPost(once).counts, f).toEqual({});
    }
  });

  it('모든 규칙이 컴파일되고, 바른 표기에 다시 걸리지 않는다', () => {
    for (const r of RULES) {
      if (r.regex) continue;
      const c = {};
      fixText(r.to, [r], c);
      expect(c, r.id).toEqual({});
    }
  });
});
