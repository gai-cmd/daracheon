'use client';

import { useEffect, useState } from 'react';
import type {
  FooterColumn,
  NavItem,
  NavigationData,
} from '@/data/navigation';

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function removeIndex<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export default function NavigationAdminPage() {
  const [main, setMain] = useState<NavItem[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/navigation', { cache: 'no-store' })
      .then((r) => r.json() as Promise<NavigationData>)
      .then((data) => {
        if (cancelled) return;
        setMain(data.main ?? []);
        setFooterColumns(data.footerColumns ?? []);
        setLastUpdated(data.updatedAt ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            type: 'err',
            text: `불러오기 실패: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ main, footerColumns }),
      });
      const body = await res.json();
      if (!res.ok) {
        const detail =
          body?.details?.fieldErrors
            ? JSON.stringify(body.details.fieldErrors)
            : body?.error ?? '저장 실패';
        throw new Error(detail);
      }
      setLastUpdated(body.updatedAt ?? null);
      setMessage({ type: 'ok', text: '저장 완료. 전체 사이트에 즉시 반영됩니다.' });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : '저장 실패',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-gray-500">
        <p>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">네비게이션 관리</h1>
        <p className="mt-2 text-sm text-gray-500">
          사이트 상단 메뉴와 푸터 링크 구조를 관리합니다. 저장 즉시 전체 페이지에 반영됩니다.
        </p>
        {lastUpdated && (
          <p className="mt-1 text-xs text-gray-400">
            최종 수정: {new Date(lastUpdated).toLocaleString('ko-KR')}
          </p>
        )}
      </header>

      {message && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ━━━━━━━━━━ Main Nav ━━━━━━━━━━ */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">주메뉴 (헤더)</h2>
          <span className="text-xs text-gray-400">{main.length}개 / 최대 15개</span>
        </div>

        <div className="space-y-3">
          {main.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setMain(moveItem(main, i, i - 1))}
                  disabled={i === 0}
                  className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                  aria-label="위로 이동"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setMain(moveItem(main, i, i + 1))}
                  disabled={i === main.length - 1}
                  className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-white disabled:opacity-30"
                  aria-label="아래로 이동"
                >
                  ▼
                </button>
              </div>
              <input
                value={item.label}
                onChange={(e) => {
                  const n = [...main];
                  n[i] = { ...n[i], label: e.target.value };
                  setMain(n);
                }}
                placeholder="메뉴 라벨 (예: 침향 이야기)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
              />
              <input
                value={item.href}
                onChange={(e) => {
                  const n = [...main];
                  n[i] = { ...n[i], href: e.target.value };
                  setMain(n);
                }}
                placeholder="링크 경로 (예: /about-agarwood)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMain(removeIndex(main, i))}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMain([...main, { label: '새 메뉴', href: '/' }])}
          className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
        >
          + 메뉴 추가
        </button>
      </section>

      {/* ━━━━━━━━━━ Footer ━━━━━━━━━━ */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">푸터 링크</h2>
          <span className="text-xs text-gray-400">
            {footerColumns.length}개 컬럼 / 최대 6개
          </span>
        </div>

        <div className="space-y-6">
          {footerColumns.map((col, ci) => (
            <div key={ci} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setFooterColumns(moveItem(footerColumns, ci, ci - 1))}
                    disabled={ci === 0}
                    className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => setFooterColumns(moveItem(footerColumns, ci, ci + 1))}
                    disabled={ci === footerColumns.length - 1}
                    className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <input
                  value={col.title}
                  onChange={(e) => {
                    const n = [...footerColumns];
                    n[ci] = { ...n[ci], title: e.target.value };
                    setFooterColumns(n);
                  }}
                  placeholder="컬럼 제목 (예: 고객 지원)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFooterColumns(removeIndex(footerColumns, ci))}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                >
                  컬럼 삭제
                </button>
              </div>

              <div className="space-y-2 pl-10">
                {col.links.map((link, li) => (
                  <div
                    key={li}
                    className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const n = [...footerColumns];
                          n[ci] = { ...n[ci], links: moveItem(n[ci].links, li, li - 1) };
                          setFooterColumns(n);
                        }}
                        disabled={li === 0}
                        className="rounded border border-gray-200 bg-white px-1.5 text-xs disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const n = [...footerColumns];
                          n[ci] = { ...n[ci], links: moveItem(n[ci].links, li, li + 1) };
                          setFooterColumns(n);
                        }}
                        disabled={li === col.links.length - 1}
                        className="rounded border border-gray-200 bg-white px-1.5 text-xs disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      value={link.label}
                      onChange={(e) => {
                        const n = [...footerColumns];
                        const links = [...n[ci].links];
                        links[li] = { ...links[li], label: e.target.value };
                        n[ci] = { ...n[ci], links };
                        setFooterColumns(n);
                      }}
                      placeholder="링크 라벨"
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      value={link.href}
                      onChange={(e) => {
                        const n = [...footerColumns];
                        const links = [...n[ci].links];
                        links[li] = { ...links[li], href: e.target.value };
                        n[ci] = { ...n[ci], links };
                        setFooterColumns(n);
                      }}
                      placeholder="경로"
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 font-mono text-xs focus:border-gold-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = [...footerColumns];
                        n[ci] = { ...n[ci], links: removeIndex(n[ci].links, li) };
                        setFooterColumns(n);
                      }}
                      className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-500 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const n = [...footerColumns];
                    n[ci] = { ...n[ci], links: [...n[ci].links, { label: '새 링크', href: '/' }] };
                    setFooterColumns(n);
                  }}
                  className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gold-500 hover:text-gold-600"
                >
                  + 링크 추가
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setFooterColumns([
              ...footerColumns,
              { title: '새 컬럼', links: [{ label: '새 링크', href: '/' }] },
            ])
          }
          className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
        >
          + 컬럼 추가
        </button>
      </section>

      <div className="sticky bottom-0 -mx-6 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
        >
          {saving ? '저장 중…' : '저장하기'}
        </button>
        <span className="ml-4 text-xs text-gray-500">
          저장 시 전체 사이트 (헤더·푸터) 즉시 갱신됩니다.
        </span>
      </div>
    </div>
  );
}
