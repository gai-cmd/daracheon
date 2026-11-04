import type { Metadata } from 'next';
import { getConceptOrigin } from '@/lib/detail-edits/origin';
import { DETAIL_PAGES, displayTitle } from '@/lib/detail-edits/pages';
import { countsOf } from '@/lib/detail-edits/schema';
import { detailEditStore } from '@/lib/detail-edits/store';

export const metadata: Metadata = { title: '상세페이지 시안 편집' };
export const dynamic = 'force-dynamic';

const formatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatAt(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : formatter.format(d);
}

/** 구역 배치 항목이 있을 때만 덧붙인다 — 배치를 쓰지 않은 시안의 표시는 그대로. */
function layoutText(doc: Parameters<typeof countsOf>[0]): string {
  const n = countsOf(doc).layout;
  return n > 0 ? ` · 배치 ${n}` : '';
}

export default async function DetailConceptsPage() {
  const conceptOrigin = getConceptOrigin();
  // 한 시안의 읽기 실패가 목록 전체를 막지 않도록 시안별로 읽는다 (실패 시 null).
  const summaries = await Promise.all(DETAIL_PAGES.map((page) => detailEditStore.readSummary(page.slug)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">상세페이지 시안 편집</h1>
        <p className="mt-1 text-sm text-gray-600">
          시안 페이지를 열어 글자·이미지를 바로 눌러 고치고, 섹션 숨기기·글자 크기와 색 조정·HTML 내려받기·이력 복원을 할 수 있습니다.
          저장하면 공개 시안 주소에 곧 반영됩니다 (최대 1~2분). 편집은 시안 원본 파일을 바꾸지 않으며, 언제든 원본으로 되돌릴 수 있습니다.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">시안</th>
              <th className="px-4 py-3">주소</th>
              <th className="px-4 py-3">버전</th>
              <th className="px-4 py-3">마지막 수정</th>
              <th className="px-4 py-3">수정 건수</th>
              <th className="px-4 py-3">바로가기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {DETAIL_PAGES.map((page, index) => {
              const doc = summaries[index];
              return (
                <tr key={page.slug}>
                  <td className="max-w-md px-4 py-3">
                    <div className="font-medium text-gray-900">{displayTitle(page)}</div>
                    {/* 표지 카드 설명의 첫 문장만 — 목록을 한눈에 훑게 하려고 잘랐다 */}
                    <div className="mt-0.5 text-xs text-gray-500">{page.subtitle}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{page.slug}</td>
                  <td className="px-4 py-3">{doc ? (doc.version > 0 ? `v${doc.version}` : '수정 없음') : '읽기 실패'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {doc && doc.version > 0 ? (
                      <>
                        <div>{formatAt(doc.updatedAt)}</div>
                        {doc.updatedBy ? <div className="text-xs text-gray-500">{doc.updatedBy}</div> : null}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {doc && doc.version > 0
                      ? `글 ${doc.texts.length} · 이미지 ${doc.images.length} · 배경 ${doc.bgs.length} · 숨김 ${doc.hidden.length}${layoutText(doc)}`
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {/* 편집 페이지는 라우트 핸들러(HTML 응답)라서 next/link 대신 일반 링크로 전체 이동한다. */}
                    <a
                      href={`/admin/detail-concepts/edit/${page.slug}`}
                      className="mr-3 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                    >
                      편집
                    </a>
                    <a
                      href={`${conceptOrigin}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-gray-700 underline hover:text-gray-900"
                    >
                      공개 보기
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
