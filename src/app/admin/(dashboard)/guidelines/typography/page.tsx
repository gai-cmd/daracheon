import Link from 'next/link';

/**
 * 관리자 가이드라인 — 블로그 타이포그래피.
 *
 * 값의 단일 출처는 실제 CSS 두 곳:
 *   · 발행 화면: src/app/blog/[slug]/BlogArticle.module.css
 *   · 에디터   : src/components/admin/editor/TinyMCEEditor.tsx (content_style)
 * 이 화면은 그 값을 "보이는 예시"와 함께 정리한 참조 문서다.
 *
 * ⚠ 이 페이지의 다크 견본 패널은 공개 블로그 표면을 재현한다. 어드민은
 * data-admin-root 라이트 영역이라 dark-theme.css 의 bare-element !important
 * 규칙이 이미 제외되므로(table/th/td 셀렉터의 :not([data-admin-root] *)),
 * 견본 안에서는 색·크기를 인라인으로 직접 지정한다.
 */

/* ── 발행 화면 실제 값 (다크 표면 재현용) ───────────────────── */
const GOLD = '#d4a843';
const SPEC_BG = 'linear-gradient(180deg, #0a0b10 0%, #14161f 100%)';
const SANS = 'var(--font-sans), sans-serif';
const SERIF = 'var(--font-serif), serif';
const MONO = 'var(--font-mono), ui-monospace, monospace';

function SpecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: '0.62rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(253,251,247,0.35)',
        margin: '24px 0 8px',
      }}
    >
      {children}
    </div>
  );
}

function Specimen({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      aria-label={label}
      style={{
        background: SPEC_BG,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '28px 30px 32px',
        wordBreak: 'keep-all',
      }}
    >
      {children}
    </div>
  );
}

function Section({
  id,
  num,
  title,
  lead,
  children,
}: {
  id: string;
  num: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-6">
      <h2 className="mb-1 text-lg font-bold text-gray-900">
        <span className="mr-2 font-mono text-sm font-medium text-[#b8862c]">{num}</span>
        {title}
      </h2>
      {lead && <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-gray-600">{lead}</p>}
      {children}
    </section>
  );
}

const TH = 'whitespace-nowrap bg-gray-50 px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-gray-500';
const TD = 'border-t border-gray-100 px-3 py-2 align-top text-gray-700';
const TDK = `${TD} whitespace-nowrap font-semibold text-gray-900`;

export default function TypographyGuidelinePage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-gray-400">
        <Link href="/admin/guidelines" className="hover:text-[#b8862c]">
          관리자 가이드라인
        </Link>
        <span>/</span>
        <span className="text-gray-600">타이포그래피</span>
      </nav>

      <header className="mb-8 border-b border-gray-200 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b8862c]">
          ZOEL LIFE · Blog Typography
        </p>
        <h1 className="text-2xl font-bold text-gray-900">블로그 타이포그래피 기준</h1>
        <p className="mt-3 max-w-[76ch] text-sm leading-relaxed text-gray-600">
          블로그에 글을 올릴 때 폰트·크기·색을 통일하기 위한 기준입니다.{' '}
          <b className="text-gray-900">
            에디터에서 크기·색을 따로 지정하지 않으면 아래 값이 자동 적용됩니다
          </b>{' '}
          — 블록 서식(본문 / 제목 1·2·3 / 인용 / 코드)만 골라 쓰면 사이트 전체와 톤이 맞습니다.
        </p>
      </header>

      {/* 목차 */}
      <nav className="mb-10 flex flex-wrap gap-2" aria-label="목차">
        {[
          ['#fonts', '1 사용 폰트'],
          ['#head', '2 글 머리 영역'],
          ['#blocks', '3 본문 블록'],
          ['#leading', '4 행간 원칙'],
          ['#caption', '5 사진 캡션'],
          ['#editor', '6 에디터 설정'],
          ['#normalize', '7 색 자동 보정'],
          ['#rules', '8 실전 규칙'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-[#d4a843] hover:text-[#b8862c]"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── 1. 사용 폰트 ── */}
      <Section id="fonts" num="1" title="사용 폰트 (3종, 셀프호스트)">
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>용도</th>
                <th className={TH}>폰트</th>
                <th className={TH}>로드 굵기</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TDK}>본문 · 요약 · 캡션</td>
                <td className={TD}>
                  <b style={{ fontFamily: SANS }}>Noto Sans KR</b> (고딕)
                </td>
                <td className={`${TD} font-mono tabular-nums`}>200 / 300 / 400 / 500 / 600 / 700 / 900</td>
              </tr>
              <tr>
                <td className={TDK}>제목 계열 (글 제목, 본문 제목 1·2·3)</td>
                <td className={TD}>
                  <b style={{ fontFamily: SERIF }}>Noto Serif KR</b> (명조)
                </td>
                <td className={`${TD} font-mono tabular-nums`}>300 / 400 / 500 / 600</td>
              </tr>
              <tr>
                <td className={TDK}>날짜 · 태그 · 라벨</td>
                <td className={TD}>
                  <b style={{ fontFamily: MONO }}>JetBrains Mono</b> (모노)
                </td>
                <td className={`${TD} font-mono tabular-nums`}>400 / 500 / 600</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-6 py-2">
          {[
            ['Noto Sans KR · 본문용', SANS, 300],
            ['Noto Serif KR · 제목용', SERIF, 300],
          ].map(([name, family, weight]) => (
            <div key={String(name)} className="border-b border-gray-100 py-4 last:border-b-0">
              <div className="mb-1 font-mono text-[0.68rem] uppercase tracking-wider text-gray-400">
                {name}
              </div>
              <div
                style={{
                  fontFamily: String(family),
                  fontWeight: Number(weight),
                  fontSize: '1.25rem',
                  lineHeight: 1.5,
                  wordBreak: 'keep-all',
                  color: '#141413',
                }}
              >
                침향은 물에 가라앉는 향이라 하여 침향입니다 — Agarwood 0123456789
              </div>
            </div>
          ))}
          <div className="py-4">
            <div className="mb-1 font-mono text-[0.68rem] uppercase tracking-wider text-gray-400">
              JetBrains Mono · 라벨용
            </div>
            <div style={{ fontFamily: MONO, fontSize: '1rem', color: '#141413' }}>
              2026.08.14 · #침향오일 · 0123456789
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. 글 머리 영역 ── */}
      <Section
        id="head"
        num="2"
        title="발행 화면 — 글 머리 영역"
        lead="다크 배경 위에 글 제목·요약·작성자·날짜가 놓입니다. 크기는 화면 폭에 따라 자동으로 늘어나는 범위값입니다."
      >
        <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['요소', '폰트', '크기', '굵기', '색', '행간'].map((h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TDK}>글 제목</td>
                <td className={TD}>Noto Serif KR</td>
                <td className={`${TD} tabular-nums`}>28.8 ~ 48px (자동)</td>
                <td className={`${TD} tabular-nums`}>300</td>
                <td className={TD}>흰색 #fff</td>
                <td className={`${TD} tabular-nums`}>1.28 모바일 / 1.15 PC</td>
              </tr>
              <tr>
                <td className={TDK}>요약(발췌)</td>
                <td className={TD}>Noto Sans KR</td>
                <td className={`${TD} tabular-nums`}>15.2 ~ 16.8px</td>
                <td className={`${TD} tabular-nums`}>300</td>
                <td className={TD}>흰색 72%</td>
                <td className={`${TD} tabular-nums`}>1.7</td>
              </tr>
              <tr>
                <td className={TDK}>작성자 이름</td>
                <td className={TD}>Noto Sans KR</td>
                <td className={`${TD} tabular-nums`}>14.1px</td>
                <td className={`${TD} tabular-nums`}>500</td>
                <td className={TD}>흰색 88%</td>
                <td className={TD}>—</td>
              </tr>
              <tr>
                <td className={TDK}>날짜 · 읽기 시간</td>
                <td className={TD}>상속(고딕)</td>
                <td className={`${TD} tabular-nums`}>13.1px</td>
                <td className={`${TD} tabular-nums`}>400</td>
                <td className={TD}>회갈색 #9b938a</td>
                <td className={TD}>—</td>
              </tr>
              <tr>
                <td className={TDK}>태그(#키워드)</td>
                <td className={TD}>JetBrains Mono</td>
                <td className={`${TD} tabular-nums`}>11.2px</td>
                <td className={`${TD} tabular-nums`}>400</td>
                <td className={TD}>흰색 70% · 골드 테두리</td>
                <td className={TD}>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4 rounded-lg border border-l-4 border-gray-200 border-l-[#788C5D] bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
          <b className="text-[#5f7047]">메타 키워드 참고</b> — SEO 키워드는 화면에 그려지지 않고{' '}
          <code className="rounded bg-gray-100 px-1 font-mono text-xs">&lt;meta keywords&gt;</code>
          ·JSON-LD 로만 나갑니다. 화면에 보이는 것은 본문 하단의 <b>#태그 필</b>입니다.
        </div>

        <Specimen label="글 머리 영역 견본">
          <SpecLabel>Specimen — 글 제목 (Serif 300)</SpecLabel>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 40,
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#fff',
            }}
          >
            침향, 천년의 향이 몸에 스며드는 시간
          </div>
          <SpecLabel>요약 (Sans 300 · 흰색 72%)</SpecLabel>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 16.8,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            대라천 &lsquo;참&rsquo;침향이 베트남 직영 농장에서 식탁까지 오는 과정을 따라가며, 침향
            오일의 성분과 복용법을 정리했습니다.
          </div>
          <SpecLabel>태그 필 (Mono 11.2px)</SpecLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#침향', '#침향오일'].map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: MONO,
                  fontSize: 11.2,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(212,168,67,0.3)',
                  borderRadius: 999,
                  padding: '4px 11px',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Specimen>
      </Section>

      {/* ── 3. 본문 블록 ── */}
      <Section
        id="blocks"
        num="3"
        title="발행 화면 — 본문 블록 스타일"
        lead="본문 기본값: Noto Sans KR · 14.4 ~ 16.3px · 굵기 300 · 흰색 72% · 행간 1.95"
      >
        <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['블록 서식', '폰트', '크기', '굵기', '색', '행간', '위/아래 여백'].map((h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['제목 1 (h1)', 'Noto Serif KR', '25.6 ~ 35.2px', '300', '흰색 #fff', '1.3', '56 / 20px'],
                ['제목 2 (h2)', 'Noto Serif KR', '19.2 ~ 24px', '600', '골드 #d4a843', '1.35', '56 / 16px'],
                ['제목 3 (h3)', 'Noto Serif KR', '17.3px', '600', '흰색 #fff', '1.4', '34 / 12px'],
                ['본문 (p)', 'Noto Sans KR', '14.4 ~ 16.3px', '300', '흰색 72%', '1.95', '아래 20px'],
                ['리드 문단', 'Noto Sans KR', '본문 × 1.08', '300', '흰색 88% · 골드 선', '1.85', '아래 32px'],
                ['인용 (blockquote)', 'Sans · 이탤릭', '16.3px', '300', '흰색 85% · 골드 선', '1.85', '32px'],
                ['코드(인라인)', 'JetBrains Mono', '본문 × 0.88', '400', '골드 · 연한 박스', '상속', '—'],
                ['코드 블록 (pre)', 'JetBrains Mono', '본문 × 0.88', '400', '크림 85%', '1.7', '24px'],
                ['표 (table)', 'Noto Sans KR', '14.4px', '400', '흰색 72% · 헤더 골드', '1.65', '28px'],
                ['목록 (ul/ol)', '본문과 동일', '동일', '300', '동일 · 글머리표 골드', '1.95', '항목 간 8px'],
                ['사진 캡션', 'Noto Sans KR', '13.6px', '300', '크림 55% · 가운데', '1.6', '이미지 아래 12px'],
                ['링크 (a)', '상속', '상속', '상속', '골드 #d4a843 + 밑줄', '상속', '—'],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className={TDK}>{row[0]}</td>
                  {row.slice(1).map((cell, i) => (
                    <td key={i} className={`${TD} tabular-nums`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Specimen label="본문 블록 견본">
          <SpecLabel>제목 1 — Serif 300 · 1.3</SpecLabel>
          <div style={{ fontFamily: SERIF, fontSize: 35, fontWeight: 300, lineHeight: 1.3, letterSpacing: '-0.02em', color: '#fff' }}>
            침향나무가 향을 만드는 방법
          </div>
          <SpecLabel>제목 2 — Serif 600 · 골드 · 1.35</SpecLabel>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.01em', color: GOLD }}>
            수지가 쌓이는 20년의 기다림
          </div>
          <SpecLabel>제목 3 — Serif 600 · 1.4</SpecLabel>
          <div style={{ fontFamily: SERIF, fontSize: 17.3, fontWeight: 600, lineHeight: 1.4, color: '#fff' }}>
            Aquilaria Agallocha Roxburgh
          </div>
          <SpecLabel>본문 — Sans 300 · 1.95</SpecLabel>
          <div style={{ fontFamily: SANS, fontSize: 16.3, fontWeight: 300, lineHeight: 1.95, letterSpacing: '-0.005em', color: 'rgba(255,255,255,0.72)' }}>
            침향나무는 상처를 입으면 스스로를 지키기 위해 수지를 분비합니다. 이 수지가 오랜 시간 굳어
            만들어지는 것이 침향입니다.{' '}
            <b style={{ color: '#fff', fontWeight: 600 }}>굵게 강조</b>하면 흰색으로 밝아지고,{' '}
            <span style={{ color: GOLD, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              링크는 골드 밑줄
            </span>
            로 표시되며, 인라인 코드는{' '}
            <span
              style={{
                fontFamily: MONO,
                fontSize: 14,
                color: GOLD,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(212,168,67,0.18)',
                borderRadius: 3,
                padding: '1px 6px',
              }}
            >
              0.59%
            </span>{' '}
            처럼 보입니다.
          </div>
          <SpecLabel>인용 — 이탤릭 · 1.85</SpecLabel>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 16.3,
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.85,
              color: 'rgba(255,255,255,0.85)',
              borderLeft: '2px solid #b88c2d',
              paddingLeft: 20,
            }}
          >
            &ldquo;침향은 물에 가라앉는 향이라 하여 沈香이라 부른다.&rdquo;
          </div>
          <SpecLabel>목록 — 글머리표 골드 · 항목 간 8px</SpecLabel>
          <ul
            style={{
              fontFamily: SANS,
              fontSize: 16.3,
              fontWeight: 300,
              lineHeight: 1.95,
              color: 'rgba(255,255,255,0.72)',
              paddingLeft: '1.5em',
              listStyle: 'disc',
            }}
          >
            <li style={{ marginBottom: 8 }}>침향나무 수지 오일 0.59% 함유</li>
            <li>성분: 침향오일, 적송오일, 오메가3, 비타민E</li>
          </ul>
          <SpecLabel>표 — 14.4px · 행간 1.65 · 헤더 골드</SpecLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.4, lineHeight: 1.65, border: '1px solid rgba(212,168,67,0.18)' }}>
            <thead>
              <tr>
                {['구분', '내용', '비고'].map((h) => (
                  <th
                    key={h}
                    style={{
                      background: 'rgba(184,140,45,0.16)',
                      color: GOLD,
                      fontFamily: SANS,
                      fontWeight: 600,
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(212,168,67,0.32)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['복용법', '1일 1회 1캡슐', '충분한 물과 함께'],
                ['유통기한', '3년', '냉장 보관 권장'],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td
                      key={cell}
                      style={{
                        color: 'rgba(255,255,255,0.72)',
                        fontFamily: SANS,
                        fontWeight: 300,
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(212,168,67,0.16)',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <SpecLabel>코드 블록 — Mono · 행간 1.7</SpecLabel>
          <pre
            style={{
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.7,
              color: 'rgba(253,251,247,0.85)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,168,67,0.16)',
              borderRadius: 10,
              padding: '14px 16px',
              overflowX: 'auto',
              margin: 0,
            }}
          >{`아쿠일라리아 아갈로차 록스버그
Aquilaria Agallocha Roxburgh — 침향나무 학명`}</pre>
        </Specimen>
      </Section>

      {/* ── 4. 행간 원칙 ── */}
      <Section
        id="leading"
        num="4"
        title="행간 원칙 — 글자가 클수록 조인다"
        lead="블록 서식마다 행간이 다르게 적용되며, 에디터 미리보기에도 같은 비율이 걸려 있어 편집 화면과 발행 화면의 줄 리듬이 일치합니다."
      >
        <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 text-sm font-semibold text-gray-700">블록별 행간 (line-height 배율)</div>
          <svg viewBox="0 0 560 236" width="100%" style={{ maxWidth: 560, display: 'block' }} role="img" aria-label="블록별 행간 비교 막대 차트">
            <g fontFamily="var(--font-sans), sans-serif" fontSize="12" fill="#3D3D3A">
              {[
                ['제목 1', 120, '1.3', '#D97757', 8],
                ['제목 2', 140, '1.35', '#D97757', 36],
                ['제목 3', 160, '1.4', '#D97757', 64],
                ['사진 캡션', 240, '1.6', '#C9B896', 92],
                ['표 셀', 260, '1.65', '#C9B896', 120],
                ['코드 블록', 280, '1.7', '#C9B896', 148],
                ['인용 · 리드', 340, '1.85', '#788C5D', 176],
                ['본문', 380, '1.95', '#788C5D', 204],
              ].map(([label, w, val, fill, y]) => (
                <g key={String(label)}>
                  <text x="110" y={Number(y) + 10} textAnchor="end">
                    {label}
                  </text>
                  <rect x="118" y={Number(y)} width={Number(w)} height="14" rx="3" fill={String(fill)} />
                  <text x={118 + Number(w) + 8} y={Number(y) + 10} fontFamily="var(--font-mono), monospace" fontSize="11">
                    {val}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        <h3 className="mb-2 text-base font-semibold text-gray-900">
          같은 문장을 블록별로 놓으면 이렇게 달라집니다
        </h3>
        <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-gray-600">
          아래는 <b className="text-gray-900">완전히 같은 문장</b>을 제목 1 → 제목 2 → 제목 3 → 본문
          순서로 적용한 것입니다. 크기가 작아질수록 줄과 줄 사이가 넓어지는 것을 눈으로 비교해 보세요.
        </p>
        <Specimen label="블록별 같은 문장 비교 견본">
          {[
            ['제목 1 — 35px · 행간 1.3 (촘촘)', SERIF, 35, 300, 1.3, '#fff'],
            ['제목 2 — 24px · 행간 1.35', SERIF, 24, 600, 1.35, GOLD],
            ['제목 3 — 17.3px · 행간 1.4', SERIF, 17.3, 600, 1.4, '#fff'],
            ['본문 — 16.3px · 행간 1.95 (여유)', SANS, 16.3, 300, 1.95, 'rgba(255,255,255,0.72)'],
          ].map(([label, family, size, weight, lh, color]) => (
            <div key={String(label)}>
              <SpecLabel>{label}</SpecLabel>
              <div
                style={{
                  fontFamily: String(family),
                  fontSize: Number(size),
                  fontWeight: Number(weight),
                  lineHeight: Number(lh),
                  color: String(color),
                }}
              >
                침향은 상처 입은 나무가 스스로를 지키려 만들어낸 수지가 오랜 시간 굳어 생긴 향입니다
              </div>
            </div>
          ))}
        </Specimen>

        <div className="mt-4 rounded-lg border border-l-4 border-gray-200 border-l-[#d4a843] bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
          <b className="text-[#b8862c]">왜 이렇게 하나</b> — 큰 글자에 넓은 행간을 그대로 쓰면 제목이
          흩어져 한 덩어리로 안 읽히고, 작은 본문에 좁은 행간을 쓰면 답답해집니다. 그래서 크기별로 다른
          비율을 씁니다. <b className="text-gray-900">편집할 때 따로 조정할 필요 없습니다</b> — 블록
          서식만 고르면 자동 적용됩니다.
        </div>
      </Section>

      {/* ── 5. 사진 캡션 ── */}
      <Section id="caption" num="5" title="사진 캡션(사진설명) 사용법">
        <ol className="mb-4 max-w-[72ch] list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
          <li>
            에디터에서 이미지를 클릭하면 뜨는 퀵바(또는 상단 툴바)의{' '}
            <b className="text-gray-900">말풍선 아이콘 — 이미지 캡션 넣기/빼기</b>를 누르면 이미지
            아래에 캡션 입력칸이 생깁니다.
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">캡션을 입력하세요</code>{' '}
            자리에 사진설명을 입력합니다.
          </li>
          <li>
            <b className="text-gray-900">
              입력하지 않으면(비워두거나 안내문 그대로면) 발행 화면에는 아무것도 나타나지 않습니다
            </b>{' '}
            — 저장·표시 시점에 자동으로 제거됩니다.
          </li>
          <li>이미지 대화상자의 &ldquo;캡션 표시&rdquo; 체크박스도 동일하게 동작합니다.</li>
        </ol>

        <Specimen label="사진과 캡션 견본">
          <SpecLabel>사진 + 캡션이 발행 화면에 보이는 모습</SpecLabel>
          <figure style={{ margin: 0 }}>
            <svg viewBox="0 0 640 240" role="img" aria-label="사진 자리 예시" style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid rgba(212,168,67,0.14)', borderRadius: 12 }}>
              <defs>
                <linearGradient id="phG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2a2d3a" />
                  <stop offset="1" stopColor="#4a3f26" />
                </linearGradient>
              </defs>
              <rect width="640" height="240" fill="url(#phG)" />
              <text x="320" y="126" textAnchor="middle" fontFamily="var(--font-sans), sans-serif" fontSize="15" fill="rgba(253,251,247,0.45)">
                (본문에 올린 사진)
              </text>
            </svg>
            <figcaption
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontFamily: SANS,
                fontSize: 13.6,
                fontWeight: 300,
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                color: 'rgba(253,251,247,0.55)',
              }}
            >
              베트남 직영 농장의 침향나무 — 수지가 맺힌 단면 (캡션을 입력한 경우에만 이렇게 표시됩니다)
            </figcaption>
          </figure>
        </Specimen>
      </Section>

      {/* ── 6. 에디터 설정 ── */}
      <Section id="editor" num="6" title="에디터 설정값">
        <div className="mb-5 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>항목</th>
                <th className={TH}>값</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['블록 서식 목록', '본문(p) · 제목 1(h1) · 제목 2(h2) · 제목 3(h3) · 인용(blockquote) · 코드(pre)'],
                ['글자 크기 선택지', '12 / 14 / 16(기본) / 18 / 20 / 24 / 28 / 32px'],
                ['이미지 업로드', '붙여넣기 · 드래그 · 파일선택 모두 자동 업로드 (외부 CDN 금지 정책)'],
                ['영상', 'YouTube 주소 붙여넣기 → 16:9 임베드 자동 변환'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className={TDK}>{k}</td>
                  <td className={TD}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 text-base font-semibold text-gray-900">
          글자 색 팔레트 (8색 — 밝은 톤 큐레이션)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            ['골드', '#D4A843'],
            ['연골드', '#E8C97A'],
            ['크림', '#FDFBF7'],
            ['밝은 회색', '#C9C4B8'],
            ['레드', '#E06A5A'],
            ['살구', '#F0A98E'],
            ['그린', '#8FBF8F'],
            ['블루', '#8FB8E0'],
          ].map(([name, hex]) => (
            <span
              key={hex}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1.5 pr-3 text-xs text-gray-700"
            >
              <i
                className="inline-block h-5 w-5 rounded-full border border-black/10"
                style={{ background: hex }}
                aria-hidden
              />
              {name} <span className="font-mono text-gray-400">{hex}</span>
            </span>
          ))}
        </div>
      </Section>

      {/* ── 7. 색 자동 보정 ── */}
      <Section
        id="normalize"
        num="7"
        title="색을 고를 때 주의 — 발행 시 자동 보정"
        lead="발행 화면은 다크 배경이라, 저장된 글자·배경 색을 밝기 기준으로 한 번 걸러냅니다."
      >
        <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>에디터에서 지정한 색</th>
                <th className={TH}>발행 화면 처리</th>
                <th className={TH}>이유</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TDK}>어두운 글자색</td>
                <td className={TD}>
                  <b className="text-gray-900">제거</b> → 기본색 적용
                </td>
                <td className={TD}>검정·짙은 갈색은 다크 배경에 묻힘</td>
              </tr>
              <tr>
                <td className={TDK}>밝은 배경색</td>
                <td className={TD}>
                  <b className="text-gray-900">제거</b>
                </td>
                <td className={TD}>다크 테마와 충돌</td>
              </tr>
              <tr>
                <td className={TDK}>다크에서 의도된 조합</td>
                <td className={TD}>유지</td>
                <td className={TD}>예: 표의 골드 헤더(골드 배경 + 흰 글자)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-l-4 border-gray-200 border-l-[#d4a843] bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
          <b className="text-[#b8862c]">요점</b> — 글자색은 위 팔레트 8색 안에서 고르는 것이 안전하고,
          색을 지정하지 않으면 기본값(본문 흰색 72%, 제목은 3번 표의 색)이 적용됩니다. 에디터 팔레트가
          밝은 톤 위주인 이유입니다.
        </div>
      </Section>

      {/* ── 8. 실전 규칙 ── */}
      <Section id="rules" num="8" title="요약 — 통일을 위한 실전 규칙">
        <ol className="max-w-[72ch]">
          {[
            '크기·색을 손대지 말고 블록 서식만 사용한다 (본문 / 제목 1·2·3 / 인용 / 코드).',
            '강조는 굵게(흰색으로 밝아짐) 또는 팔레트의 골드를 쓴다.',
            '섹션 구분은 제목 2(골드 명조), 소구분은 제목 3(흰 명조)을 쓴다.',
            '사진에는 캡션(사진설명)을 입력한다 — 안 쓰면 표시되지 않으므로 부담 없음.',
            '글자 크기 선택지는 표·주석 등 예외 상황에만 쓴다 (기본 16px 유지).',
          ].map((rule, i) => (
            <li
              key={rule}
              className="flex gap-3 border-b border-gray-100 py-3 text-sm leading-relaxed text-gray-700 last:border-b-0"
            >
              <span className="mt-0.5 shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold text-[#b8862c]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </Section>

      <footer className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-200 pt-5 text-xs text-gray-400">
        <span>대라천(조엘라이프) 블로그 타이포그래피 기준</span>
        <span>최종 갱신 2026-08-14</span>
      </footer>
    </div>
  );
}
