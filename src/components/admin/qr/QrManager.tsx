'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QrImageStudio from './QrImageStudio';
import QrAnalyticsView from './QrAnalyticsView';
import { QR_STYLES, type QrStyleId } from '@/lib/qr/presets';
import type { QrCode, QrTarget } from '@/lib/qr/types';

/** 목적지 빠른 선택용 사이트 내부 경로 (자유 입력도 허용) */
const PAGE_OPTIONS: { path: string; label: string }[] = [
  { path: '/', label: '홈' },
  { path: '/about-agarwood', label: '침향 이야기' },
  { path: '/brand-story', label: '브랜드 이야기' },
  { path: '/media', label: '침향 농장 이야기' },
  { path: '/products', label: '제품 소개' },
  { path: '/home-shopping', label: 'On-Air 특별관' },
  { path: '/company', label: '회사소개' },
  { path: '/reviews', label: '고객 후기' },
  { path: '/process', label: '생산 공정' },
  { path: '/showroom', label: '쇼룸' },
  { path: '/blog', label: '블로그' },
];

interface Draft {
  id?: string;
  name: string;
  placement: string;
  description: string;
  routingMode: 'single' | 'rotate';
  targets: QrTarget[];
  utmContent: string;
  defaultStyle: QrStyleId;
  active: boolean;
  customSlug: string;
}

function emptyDraft(): Draft {
  return {
    name: '',
    placement: '',
    description: '',
    routingMode: 'single',
    targets: [{ path: '/', label: '홈' }],
    utmContent: '',
    defaultStyle: 'white-black',
    active: true,
    customSlug: '',
  };
}

function destSummary(qr: QrCode): string {
  if (qr.targets.length === 0) return '/';
  if (qr.routingMode === 'single' || qr.targets.length === 1) return qr.targets[0].path;
  return `분산 ${qr.targets.length}곳: ${qr.targets.map((t) => t.path).join(', ')}`;
}

export default function QrManager({ siteOrigin }: { siteOrigin: string }) {
  const [codes, setCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'analytics'>('list');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [studioFor, setStudioFor] = useState<QrCode | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/qr', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success) setCodes(j.codes ?? []);
    } catch {
      setToast('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const qrUrl = useCallback((slug: string) => `${siteOrigin}/q/${slug}`, [siteOrigin]);

  /* ───── form helpers (모두 함수형 setState — 연속 변경 race 방지) ───── */
  const patchDraft = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const updateTarget = (i: number, p: Partial<QrTarget>) =>
    setDraft((d) =>
      d ? { ...d, targets: d.targets.map((t, idx) => (idx === i ? { ...t, ...p } : t)) } : d,
    );
  const addTarget = () =>
    setDraft((d) => (d ? { ...d, targets: [...d.targets, { path: '/products', weight: 1 }] } : d));
  const removeTarget = (i: number) =>
    setDraft((d) => (d ? { ...d, targets: d.targets.filter((_, idx) => idx !== i) } : d));

  const openCreate = () => setDraft(emptyDraft());
  const openEdit = (qr: QrCode) =>
    setDraft({
      id: qr.id,
      name: qr.name,
      placement: qr.placement ?? '',
      description: qr.description ?? '',
      routingMode: qr.routingMode,
      targets: qr.targets.length ? qr.targets : [{ path: '/' }],
      utmContent: qr.utmContent ?? '',
      defaultStyle: qr.defaultStyle,
      active: qr.active,
      customSlug: '',
    });

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setToast('이름을 입력하세요.');
      return;
    }
    const targets = draft.targets.filter((t) => t.path.trim());
    if (targets.length === 0) {
      setToast('목적지를 최소 1개 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        placement: draft.placement.trim() || undefined,
        description: draft.description.trim() || undefined,
        routingMode: draft.routingMode,
        targets: draft.routingMode === 'single' ? [targets[0]] : targets,
        utmContent: draft.utmContent.trim() || undefined,
        defaultStyle: draft.defaultStyle,
        active: draft.active,
        ...(draft.id ? {} : draft.customSlug.trim() ? { customSlug: draft.customSlug.trim() } : {}),
      };
      const r = draft.id
        ? await fetch(`/api/admin/qr/${draft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const j = await r.json();
      if (!j?.success) {
        setToast(j?.message ?? '저장에 실패했습니다.');
        return;
      }
      setToast(draft.id ? '수정되었습니다.' : 'QR이 생성되었습니다.');
      setDraft(null);
      await fetchCodes();
    } catch {
      setToast('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (qr: QrCode) => {
    // 옵티미스틱 (함수형)
    setCodes((prev) => prev.map((c) => (c.id === qr.id ? { ...c, active: !c.active } : c)));
    try {
      const r = await fetch(`/api/admin/qr/${qr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !qr.active }),
      });
      const j = await r.json();
      if (!j?.success) {
        setCodes((prev) => prev.map((c) => (c.id === qr.id ? { ...c, active: qr.active } : c)));
        setToast(j?.message ?? '상태 변경 실패');
      }
    } catch {
      setCodes((prev) => prev.map((c) => (c.id === qr.id ? { ...c, active: qr.active } : c)));
      setToast('상태 변경 실패');
    }
  };

  const remove = async (qr: QrCode) => {
    if (!confirm(`'${qr.name}' QR을 삭제하시겠습니까?\n\n⚠️ 이미 인쇄·배포한 스티커가 있다면 스캔 시 홈으로 이동합니다.`)) return;
    try {
      const r = await fetch(`/api/admin/qr/${qr.id}`, { method: 'DELETE' });
      const j = await r.json();
      if (j?.success) {
        setToast('삭제되었습니다.');
        setCodes((prev) => prev.filter((c) => c.id !== qr.id));
      } else {
        setToast(j?.message ?? '삭제 실패');
      }
    } catch {
      setToast('삭제 중 오류가 발생했습니다.');
    }
  };

  const copyUrl = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(qrUrl(slug));
      setToast('유입 URL이 복사되었습니다.');
    } catch {
      setToast('복사 실패 — 직접 선택해 복사하세요.');
    }
  };

  const sortedCodes = useMemo(() => codes, [codes]);

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex gap-2 border-b border-warm-200">
        {(['list', 'analytics'] as const).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setTab(tk)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === tk ? 'border-gold-400 text-gold-700' : 'border-transparent text-warm-500 hover:text-warm-700'
            }`}
          >
            {tk === 'list' ? 'QR 목록 & 원본' : '분석'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-warm-600">
              인쇄된 QR(<code className="rounded bg-warm-100 px-1">/q/코드</code>)은 영구 고정 — 목적지는 언제든 바꿀 수 있습니다.
            </p>
            <button type="button" className="adm-btn-primary" onClick={openCreate}>
              + 새 QR 만들기
            </button>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-warm-400">불러오는 중…</p>
          ) : sortedCodes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-warm-300 bg-warm-50 p-10 text-center">
              <p className="text-sm text-warm-600">아직 만든 QR이 없습니다.</p>
              <button type="button" className="adm-btn-primary mt-3" onClick={openCreate}>
                첫 QR 만들기
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-warm-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-warm-50 text-left text-xs text-warm-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">이름 / 위치</th>
                    <th className="px-4 py-3 font-medium">유입 URL</th>
                    <th className="px-4 py-3 font-medium">목적지</th>
                    <th className="px-4 py-3 font-medium">상태</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {sortedCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-warm-900">{qr.name}</p>
                        {qr.placement && <p className="text-xs text-warm-500">{qr.placement}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-warm-100 px-1.5 py-0.5 text-xs text-warm-700">/q/{qr.slug}</code>
                          <button
                            type="button"
                            onClick={() => copyUrl(qr.slug)}
                            className="text-xs text-gold-600 hover:text-gold-700"
                            title="전체 URL 복사"
                          >
                            복사
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-warm-600">{destSummary(qr)}</span>
                        {qr.routingMode === 'rotate' && (
                          <span className="ml-1 rounded bg-gold-50 px-1 text-[10px] text-gold-700">분산</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(qr)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            qr.active ? 'bg-sage-100 text-sage-700' : 'bg-warm-200 text-warm-600'
                          }`}
                        >
                          {qr.active ? '활성' : '비활성'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" className="text-xs font-medium text-gold-700 hover:underline" onClick={() => setStudioFor(qr)}>
                            원본
                          </button>
                          <button type="button" className="text-xs font-medium text-warm-700 hover:underline" onClick={() => openEdit(qr)}>
                            편집
                          </button>
                          <button type="button" className="text-xs font-medium text-terracotta hover:underline" onClick={() => remove(qr)}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'analytics' && <QrAnalyticsView />}

      {/* ───── 원본 다운로드 모달 ───── */}
      {studioFor && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setStudioFor(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-warm-900">{studioFor.name} — QR 원본</h3>
                <p className="text-xs text-warm-500">/q/{studioFor.slug}</p>
              </div>
              <button type="button" className="text-warm-400 hover:text-warm-700" onClick={() => setStudioFor(null)}>
                ✕
              </button>
            </div>
            <QrImageStudio url={qrUrl(studioFor.slug)} slug={studioFor.slug} defaultStyle={studioFor.defaultStyle} />
          </div>
        </div>
      )}

      {/* ───── 생성/편집 모달 ───── */}
      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setDraft(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-warm-900">{draft.id ? 'QR 편집' : '새 QR 만들기'}</h3>

            <datalist id="qr-page-options">
              {PAGE_OPTIONS.map((o) => (
                <option key={o.path} value={o.path}>
                  {o.label}
                </option>
              ))}
            </datalist>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-warm-700">이름 *</span>
                  <input
                    className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
                    value={draft.name}
                    onChange={(e) => patchDraft({ name: e.target.value })}
                    placeholder="예: 제품 박스 후면 스티커"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-warm-700">부착 위치/매체</span>
                  <input
                    className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
                    value={draft.placement}
                    onChange={(e) => patchDraft({ placement: e.target.value })}
                    placeholder="예: 제품 패키지 / 명함 / 전단 / 박람회"
                  />
                </label>
              </div>

              {!draft.id && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-warm-700">커스텀 코드 (선택)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-warm-500">/q/</span>
                    <input
                      className="flex-1 rounded-lg border border-warm-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
                      value={draft.customSlug}
                      onChange={(e) => patchDraft({ customSlug: e.target.value })}
                      placeholder="비우면 자동 생성 (영숫자/하이픈)"
                    />
                  </div>
                  <span className="mt-1 block text-[11px] text-warm-500">⚠️ 인쇄 후에는 코드를 바꿀 수 없습니다(영구 고정).</span>
                </label>
              )}

              {/* 라우팅 모드 */}
              <div>
                <span className="mb-1 block text-sm font-medium text-warm-700">유입 방식</span>
                <div className="flex gap-2">
                  {(
                    [
                      { v: 'single', t: '단일 목적지' },
                      { v: 'rotate', t: '여러 페이지로 분산 (트래픽 골고루)' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => patchDraft({ routingMode: m.v })}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                        draft.routingMode === m.v ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-warm-300 bg-white text-warm-700'
                      }`}
                    >
                      {m.t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 목적지 (유입 URL 변경/추가) */}
              <div>
                <span className="mb-1 block text-sm font-medium text-warm-700">
                  목적지 {draft.routingMode === 'rotate' ? '(여러 개 + 가중치)' : ''}
                </span>
                <div className="space-y-2">
                  {(draft.routingMode === 'single' ? draft.targets.slice(0, 1) : draft.targets).map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        list="qr-page-options"
                        className="flex-1 rounded-lg border border-warm-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
                        value={t.path}
                        onChange={(e) => updateTarget(i, { path: e.target.value })}
                        placeholder="/products"
                      />
                      {draft.routingMode === 'rotate' && (
                        <>
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded-lg border border-warm-300 px-2 py-2 text-sm"
                            value={t.weight ?? 1}
                            onChange={(e) => updateTarget(i, { weight: Math.max(1, Number(e.target.value) || 1) })}
                            title="가중치 (클수록 자주 노출)"
                          />
                          {draft.targets.length > 1 && (
                            <button type="button" className="text-terracotta" onClick={() => removeTarget(i)} title="삭제">
                              ✕
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {draft.routingMode === 'rotate' && (
                  <button type="button" className="mt-2 text-xs font-medium text-gold-700 hover:underline" onClick={addTarget}>
                    + 목적지 추가
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-warm-700">기본 디자인</span>
                  <select
                    className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm"
                    value={draft.defaultStyle}
                    onChange={(e) => patchDraft({ defaultStyle: e.target.value as QrStyleId })}
                  >
                    {QR_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-warm-700">UTM content (선택)</span>
                  <input
                    className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm"
                    value={draft.utmContent}
                    onChange={(e) => patchDraft({ utmContent: e.target.value })}
                    placeholder="예: box-a / flyer-2026"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.active} onChange={(e) => patchDraft({ active: e.target.checked })} />
                <span className="text-sm text-warm-700">활성 (스캔 시 목적지로 이동)</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="adm-btn-secondary" disabled={saving} onClick={() => setDraft(null)}>
                취소
              </button>
              <button type="button" className="adm-btn-primary" disabled={saving} onClick={save}>
                {saving ? '저장 중…' : draft.id ? '수정 저장' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-[100] rounded-lg bg-warm-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
