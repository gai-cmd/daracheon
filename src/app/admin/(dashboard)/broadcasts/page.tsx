'use client';

import { useEffect, useMemo, useState } from 'react';
import { saveAdminPage } from '@/lib/adminSave';
import VideoUploadField from '@/components/admin/VideoUploadField';

type BroadcastType = 'home-shopping' | 'sponsored';

interface BroadcastShowInfo {
  title?: string | null;
  episode?: string | null;
  logo?: string | null;
  hosts?: string[] | null;
  panels?: string[] | null;
  guests?: string[] | null;
  experts?: string[] | null;
  recordingAt?: string | null;
  vcrAt?: string | null;
  synopsis?: string | null;
}

interface BroadcastPreviewHighlight {
  timestamp?: string | null;
  title: string;
  description?: string | null;
}

interface BroadcastPreview {
  enabled?: boolean;
  isPublic?: boolean;
  headline?: string | null;
  summary?: string | null;
  highlights?: BroadcastPreviewHighlight[] | null;
  keyPoints?: string[] | null;
  updatedAt?: string | null;
}

interface Broadcast {
  id: string;
  broadcastType?: BroadcastType;
  published?: boolean;
  channel: string;
  scheduledAt: string;
  durationMinutes: number;
  host?: string | null;
  productIds: string[];
  specialPrice?: number | null;
  regularPrice?: number | null;
  discountRate?: number | null;
  vodUrl?: string | null;
  inlineUntil?: string | null;
  description?: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  soldOut?: boolean | null;
  salesCount?: number | null;
  feedback?: string | null;
  showInfo?: BroadcastShowInfo | null;
  preview?: BroadcastPreview | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<BroadcastType, string> = {
  'home-shopping': '홈쇼핑',
  sponsored: '협찬방송',
};

function getType(b: { broadcastType?: BroadcastType }): BroadcastType {
  return b.broadcastType ?? 'home-shopping';
}

function isPublished(b: { published?: boolean }): boolean {
  return b.published !== false;
}

function csvToArr(s: string): string[] {
  return s
    .split(/[,·、\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrToCsv(a: string[] | null | undefined): string {
  return Array.isArray(a) ? a.join(', ') : '';
}

interface ProductLite {
  id: string;
  name: string;
}

interface HomeShoppingHero {
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

const DEFAULT_HERO: HomeShoppingHero = {
  titleLine1: 'TV 홈쇼핑',
  titleEmphasis: '편성표 · 다시보기',
  lede: '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간 방송은 각 홈쇼핑 앱과 ZOEL LIFE 웹에서 동시 송출됩니다.',
};

const STATUS_LABELS: Record<Broadcast['status'], string> = {
  scheduled: '편성 예정',
  live: '방송 중',
  ended: '방송 종료',
  canceled: '취소됨',
};

const STATUS_COLORS: Record<Broadcast['status'], string> = {
  scheduled: 'bg-sage-700 text-white border-sage-800',
  live: 'bg-red-700 text-white border-red-800',
  ended: 'bg-stone-500 text-white border-stone-600',
  canceled: 'bg-amber-700 text-white border-amber-800',
};

function fmtDateTimeLocal(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDisplay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emptyDraft(type: BroadcastType = 'home-shopping'): Broadcast {
  return {
    id: '',
    broadcastType: type,
    published: true,
    channel: '',
    scheduledAt: new Date().toISOString(),
    durationMinutes: 60,
    productIds: [],
    status: 'scheduled',
    createdAt: '',
    updatedAt: '',
  };
}

export default function AdminBroadcastsPage() {
  const [items, setItems] = useState<Broadcast[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | Broadcast['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | BroadcastType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [draft, setDraft] = useState<Broadcast | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [hero, setHero] = useState<HomeShoppingHero>(DEFAULT_HERO);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    try {
      const res = await fetch('/api/admin/broadcasts', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch (err) {
      console.error('[Admin Broadcasts] fetch error:', err);
      setToast('방송 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      const list = (data.products || data.items || []) as Array<{ id: string; name: string }>;
      setProducts(list.map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error('[Admin Broadcasts] products fetch error:', err);
    }
  }

  async function loadHero() {
    try {
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      if (res.status === 404) return;
      const data = (await res.json()) as { pages?: { homeShopping?: { hero?: HomeShoppingHero } } };
      const h = data.pages?.homeShopping?.hero;
      if (h) setHero({ ...DEFAULT_HERO, ...h });
    } catch (err) {
      console.error('[Admin Broadcasts] hero fetch error:', err);
    } finally {
      setHeroLoading(false);
    }
  }

  async function saveHero() {
    setHeroSaving(true);
    try {
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      const body = res.ok
        ? ((await res.json()) as { pages?: { homeShopping?: { hero?: HomeShoppingHero } } })
        : { pages: {} };
      const current = body.pages?.homeShopping ?? {};
      const merged = { ...current, hero };
      const result = await saveAdminPage('homeShopping', merged);
      if (!result.ok) {
        setToast(`히어로 저장 실패: ${result.msg}`);
        return;
      }
      setToast(`히어로 저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`);
    } catch (err) {
      console.error('[Admin Broadcasts] hero save error:', err);
      setToast(`히어로 저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setHeroSaving(false);
    }
  }

  useEffect(() => {
    refresh();
    loadProducts();
    loadHero();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (typeFilter !== 'all' && getType(b) !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !b.channel.toLowerCase().includes(q) &&
          !(b.host ?? '').toLowerCase().includes(q) &&
          !(b.description ?? '').toLowerCase().includes(q) &&
          !(b.showInfo?.title ?? '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, statusFilter, typeFilter, searchQuery]);

  function openAdd() {
    setDraft(emptyDraft());
    setIsAddMode(true);
  }

  function openEdit(item: Broadcast) {
    setDraft(JSON.parse(JSON.stringify(item)));
    setIsAddMode(false);
  }

  function closeEdit() {
    setDraft(null);
    setIsAddMode(false);
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.channel.trim() || !draft.scheduledAt) {
      setToast('방송사와 일시는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const endpoint = '/api/admin/broadcasts';
      const method = isAddMode ? 'POST' : 'PUT';
      const payload: Record<string, unknown> = { ...draft };
      if (isAddMode) delete (payload as Record<string, unknown>).id;

      // 방송 시간(분) 정규화 — 입력 중 NaN/빈값이거나 onBlur 클램프가 아직
      // 반영되지 않은 채 저장을 눌러도 항상 유효한 정수를 보내도록 보정.
      // (NaN 은 JSON 직렬화 시 null → 서버 zod min(5) 에서 0 으로 강제돼 저장이 거부되던 버그 대응)
      const dm = Number(payload.durationMinutes);
      payload.durationMinutes = Number.isFinite(dm) && dm >= 5 ? Math.min(480, Math.floor(dm)) : 60;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '저장에 실패했습니다.');
        return;
      }
      setToast(isAddMode ? '방송이 등록되었습니다.' : '방송이 수정되었습니다.');
      closeEdit();
      await refresh();
    } catch (err) {
      console.error('[Admin Broadcasts] save error:', err);
      setToast('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '삭제에 실패했습니다.');
        return;
      }
      setToast('방송이 삭제되었습니다.');
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      console.error('[Admin Broadcasts] delete error:', err);
      setToast('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  function toggleProductId(id: string) {
    if (!draft) return;
    const exists = draft.productIds.includes(id);
    setDraft({
      ...draft,
      productIds: exists ? draft.productIds.filter((x) => x !== id) : [...draft.productIds, id],
    });
  }

  /** 리스트 행에서 미리보기 공개 즉시 토글. PUT 으로 preview.isPublic 만 갱신. */
  async function togglePreviewPublic(b: Broadcast) {
    if (!b.preview?.enabled) {
      setToast('미리보기가 ‘사용’으로 설정되어 있어야 공개할 수 있습니다.');
      return;
    }
    const next = !(b.preview?.isPublic ?? false);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, preview: { isPublic: next } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '미리보기 공개 상태 변경에 실패했습니다.');
        return;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === b.id ? { ...it, preview: { ...(it.preview ?? {}), isPublic: next } } : it
        )
      );
      setToast(next ? '미리보기를 공개했습니다.' : '미리보기를 비공개로 전환했습니다.');
    } catch (err) {
      console.error('[Admin Broadcasts] toggle preview error:', err);
      setToast('미리보기 공개 상태 변경 중 오류가 발생했습니다.');
    }
  }

  /** 리스트 행에서 직접 공개/비공개 즉시 토글. PUT 으로 published 만 갱신. */
  async function togglePublished(b: Broadcast) {
    const next = !isPublished(b);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, published: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '공개 상태 변경에 실패했습니다.');
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === b.id ? { ...it, published: next } : it)));
      setToast(next ? '공개로 전환되었습니다.' : '비공개로 전환되었습니다.');
    } catch (err) {
      console.error('[Admin Broadcasts] toggle published error:', err);
      setToast('공개 상태 변경 중 오류가 발생했습니다.');
    }
  }

  /** 리스트 행에서 매진/판매중 즉시 토글. PUT 으로 soldOut 만 갱신. */
  async function toggleSoldOut(b: Broadcast) {
    const next = !(b.soldOut ?? false);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, soldOut: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? '매진 상태 변경에 실패했습니다.');
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === b.id ? { ...it, soldOut: next } : it)));
      setToast(next ? '매진으로 표시했습니다.' : '매진 표시를 해제했습니다.');
    } catch (err) {
      console.error('[Admin Broadcasts] toggle soldOut error:', err);
      setToast('매진 상태 변경 중 오류가 발생했습니다.');
    }
  }

  function updateShowInfo(patch: Partial<BroadcastShowInfo>) {
    if (!draft) return;
    const cur = draft.showInfo ?? {};
    setDraft({ ...draft, showInfo: { ...cur, ...patch } });
  }

  function updatePreview(patch: Partial<BroadcastPreview>) {
    if (!draft) return;
    const cur = draft.preview ?? {};
    setDraft({ ...draft, preview: { ...cur, ...patch } });
  }

  function addHighlight() {
    if (!draft) return;
    const cur = draft.preview?.highlights ?? [];
    updatePreview({ highlights: [...cur, { timestamp: '', title: '', description: '' }] });
  }

  function updateHighlight(i: number, patch: Partial<BroadcastPreviewHighlight>) {
    if (!draft) return;
    const cur = (draft.preview?.highlights ?? []).slice();
    cur[i] = { ...cur[i], ...patch };
    updatePreview({ highlights: cur });
  }

  function removeHighlight(i: number) {
    if (!draft) return;
    const cur = (draft.preview?.highlights ?? []).filter((_, idx) => idx !== i);
    updatePreview({ highlights: cur });
  }

  function moveHighlight(i: number, dir: -1 | 1) {
    if (!draft) return;
    const cur = (draft.preview?.highlights ?? []).slice();
    const j = i + dir;
    if (j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    updatePreview({ highlights: cur });
  }

  return (
    <div className="space-y-6">
      {/* Hero text editor (inline) */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">HERO · 홈쇼핑 페이지 헤더</h2>
          <span className="text-xs text-gray-400">/home-shopping 상단 텍스트</span>
        </div>
        <p className="mb-5 text-sm text-gray-500">제목 · 강조 · 부제목을 수정하면 공개 페이지에 즉시 반영됩니다.</p>

        {heroLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목 1행</label>
                <input
                  type="text"
                  value={hero.titleLine1}
                  onChange={(e) => setHero({ ...hero, titleLine1: e.target.value })}
                  placeholder="TV 홈쇼핑"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목 강조 (em)</label>
                <input
                  type="text"
                  value={hero.titleEmphasis}
                  onChange={(e) => setHero({ ...hero, titleEmphasis: e.target.value })}
                  placeholder="편성표 · 다시보기"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">부제목 (lede)</label>
              <textarea
                rows={3}
                value={hero.lede}
                onChange={(e) => setHero({ ...hero, lede: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveHero}
                disabled={heroSaving}
                className="adm-btn-primary px-6 disabled:opacity-50"
              >
                {heroSaving ? '저장 중...' : '히어로 저장'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-gray-500">총 {items.length}건</p>
          <p className="mt-1 text-sm text-gray-400">홈쇼핑 방송 편성 일정과 성과를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="adm-btn-primary px-4 inline-flex items-center gap-2"
        >
          + 방송 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {(['all', 'home-shopping', 'sponsored'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  typeFilter === t
                    ? 'border-[#7c5b1c] bg-[#7c5b1c] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'all' ? '유형 전체' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="방송사/MC/설명/프로그램명 검색..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:w-72"
          />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {(['all', 'scheduled', 'live', 'ended', 'canceled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? 'border-[#1F1F1F] bg-[#1F1F1F] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? '상태 전체' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">등록된 방송이 없습니다.</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-3 text-xs font-medium text-gold-600 hover:underline"
          >
            + 첫 방송 등록하기
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-[0.72rem] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-3 text-left font-medium">유형</th>
                <th className="px-4 py-3 text-left font-medium">방송사 / 프로그램</th>
                <th className="px-4 py-3 text-left font-medium">일시</th>
                <th className="px-4 py-3 text-left font-medium">진행</th>
                <th className="px-4 py-3 text-left font-medium">특가</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-3 py-3 text-center font-medium">공개</th>
                <th className="px-3 py-3 text-center font-medium">요약 공개</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => {
                const t = getType(b);
                const pub = isPublished(b);
                const isSponsored = t === 'sponsored';
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 ${pub ? '' : 'bg-gray-50/60'}`}>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-wide shadow-sm ${
                          isSponsored
                            ? 'bg-violet-600 text-white ring-1 ring-violet-700'
                            : 'bg-amber-500 text-white ring-1 ring-amber-600'
                        }`}
                      >
                        {TYPE_LABELS[t]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {isSponsored && b.showInfo?.title ? b.showInfo.title : b.channel}
                        {isSponsored && b.showInfo?.episode && (
                          <span className="ml-1.5 text-xs text-gray-500">· {b.showInfo.episode}</span>
                        )}
                      </div>
                      {(b.description || (isSponsored && b.channel)) && (
                        <div className="mt-0.5 line-clamp-1 max-w-xs text-xs text-gray-400">
                          {isSponsored && b.channel ? `[${b.channel}] ` : ''}
                          {b.description ?? ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {fmtDisplay(b.scheduledAt)}
                      <div className="text-xs text-gray-400">{b.durationMinutes}분</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {isSponsored
                        ? (b.showInfo?.hosts?.join(' · ') || b.host || '-')
                        : (b.host || '-')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {isSponsored ? (
                        <span className="text-xs text-gray-400">— (협찬방송)</span>
                      ) : (
                        <>
                          <div>
                            {b.specialPrice ? `${b.specialPrice.toLocaleString('ko-KR')}원` : '-'}
                            {b.discountRate ? (
                              <span className="ml-2 rounded bg-red-700 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                                -{b.discountRate}%
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSoldOut(b)}
                            title={b.soldOut ? '매진 — 클릭 시 판매중으로' : '판매중 — 클릭 시 매진 표시'}
                            className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-wide transition ${
                              b.soldOut
                                ? 'border-red-700 bg-red-700 text-white hover:bg-red-800'
                                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {b.soldOut ? '● 매진' : '판매중'}
                          </button>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => togglePublished(b)}
                        title={pub ? '공개 — 클릭 시 비공개' : '비공개 — 클릭 시 공개'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          pub ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            pub ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <div className={`mt-0.5 text-[0.6rem] font-medium ${pub ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {pub ? '공개' : '비공개'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {b.preview?.enabled ? (
                        <>
                          <button
                            type="button"
                            onClick={() => togglePreviewPublic(b)}
                            title={b.preview?.isPublic ? '요약 공개 — 클릭 시 비공개' : '요약 비공개 — 클릭 시 공개'}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                              b.preview?.isPublic ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                b.preview?.isPublic ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <div className={`mt-0.5 text-[0.6rem] font-medium ${b.preview?.isPublic ? 'text-amber-700' : 'text-gray-400'}`}>
                            {b.preview?.isPublic ? '공개' : '비공개'}
                          </div>
                        </>
                      ) : (
                        <span className="text-[0.6rem] text-gray-300">미작성</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(b)}
                        className="adm-btn-secondary mr-2 inline-flex px-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="inline-flex rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-800"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{ colorScheme: 'light' }}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white text-gray-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold">{isAddMode ? '방송 등록' : '방송 수정'}</h2>
              <button type="button" onClick={closeEdit} className="text-2xl text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* 유형 + 공개 토글 */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">유형 *</span>
                    {(['home-shopping', 'sponsored'] as const).map((t) => {
                      const active = getType(draft) === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraft({ ...draft, broadcastType: t })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? t === 'sponsored'
                                ? 'bg-violet-600 text-white'
                                : 'bg-amber-500 text-white'
                              : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {TYPE_LABELS[t]}
                        </button>
                      );
                    })}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium">공개</span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, published: !isPublished(draft) })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                        isPublished(draft) ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          isPublished(draft) ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className={`font-semibold ${isPublished(draft) ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {isPublished(draft) ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  {getType(draft) === 'sponsored'
                    ? '협찬방송: 프로그램명·회차·출연진·시놉시스 중심으로 노출됩니다. 가격 입력은 선택.'
                    : '홈쇼핑: 정가·특가·할인율을 강조한 카드로 노출됩니다.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {getType(draft) === 'sponsored' ? '협찬 채널 (방송사) ' : '방송사 '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.channel}
                    onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
                    placeholder={getType(draft) === 'sponsored' ? 'KBS · MBC · TV조선 ...' : '롯데홈쇼핑'}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {getType(draft) === 'sponsored' ? '대표 진행자 (요약)' : 'MC / 호스트'}
                  </label>
                  <input
                    type="text"
                    value={draft.host ?? ''}
                    onChange={(e) => setDraft({ ...draft, host: e.target.value })}
                    placeholder={getType(draft) === 'sponsored' ? '현영' : '박미선'}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    방송 일시 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    step={60}
                    value={fmtDateTimeLocal(draft.scheduledAt)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft({ ...draft, scheduledAt: v ? new Date(v).toISOString() : '' });
                    }}
                    style={{ colorScheme: 'light' }}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">방송 시간(분)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={480}
                    step={5}
                    value={Number.isFinite(draft.durationMinutes) ? draft.durationMinutes : ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // 빈 문자열은 잠시 허용해서 입력 중간 단계가 막히지 않도록.
                      const next = raw === '' ? Number.NaN : Number(raw);
                      setDraft({ ...draft, durationMinutes: next });
                    }}
                    onBlur={() => {
                      // blur 시 유효 범위로 클램프 (NaN/0 → 60).
                      const v = Number(draft.durationMinutes);
                      const safe = Number.isFinite(v) && v >= 5 ? Math.min(480, Math.floor(v)) : 60;
                      if (safe !== draft.durationMinutes) setDraft({ ...draft, durationMinutes: safe });
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* 가격 (홈쇼핑 전용) */}
              {getType(draft) === 'home-shopping' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">정가</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.regularPrice ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, regularPrice: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">특가</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.specialPrice ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, specialPrice: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">할인율(%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.discountRate ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, discountRate: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              )}

              {/* 협찬방송 전용: 프로그램 정보 + 출연진 + 시놉시스 */}
              {getType(draft) === 'sponsored' && (
                <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                    프로그램 정보 (협찬방송 전용)
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">프로그램명</label>
                      <input
                        type="text"
                        value={draft.showInfo?.title ?? ''}
                        onChange={(e) => updateShowInfo({ title: e.target.value })}
                        placeholder="퍼펙트 라이프"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">회차</label>
                      <input
                        type="text"
                        value={draft.showInfo?.episode ?? ''}
                        onChange={(e) => updateShowInfo({ episode: e.target.value })}
                        placeholder="287회"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">프로그램 로고 URL (선택)</label>
                    <input
                      type="url"
                      value={draft.showInfo?.logo ?? ''}
                      onChange={(e) => updateShowInfo({ logo: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">진행 (쉼표 구분)</label>
                      <input
                        type="text"
                        value={arrToCsv(draft.showInfo?.hosts)}
                        onChange={(e) => updateShowInfo({ hosts: csvToArr(e.target.value) })}
                        placeholder="현영, 오지호"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">패널</label>
                      <input
                        type="text"
                        value={arrToCsv(draft.showInfo?.panels)}
                        onChange={(e) => updateShowInfo({ panels: csvToArr(e.target.value) })}
                        placeholder="이성미, 신승환"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">게스트</label>
                      <input
                        type="text"
                        value={arrToCsv(draft.showInfo?.guests)}
                        onChange={(e) => updateShowInfo({ guests: csvToArr(e.target.value) })}
                        placeholder="배동성♥전진주 부부"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">전문가</label>
                      <input
                        type="text"
                        value={arrToCsv(draft.showInfo?.experts)}
                        onChange={(e) => updateShowInfo({ experts: csvToArr(e.target.value) })}
                        placeholder="유병욱, 선재광, 안태환, 심선아"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">시놉시스 (방송 개요)</label>
                    <textarea
                      rows={3}
                      value={draft.showInfo?.synopsis ?? ''}
                      onChange={(e) => updateShowInfo({ synopsis: e.target.value })}
                      placeholder="건강한 중장년의 라이프스타일을 다루는 정보·교양 프로그램..."
                      className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* PREVIEW · 방송 미리보기 / 다시보기 요약 (YouTube 챕터 스타일) */}
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    방송 미리보기 · 다시보기 요약
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <span className="font-medium">사용</span>
                      <button
                        type="button"
                        onClick={() => updatePreview({ enabled: !(draft.preview?.enabled ?? false) })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          draft.preview?.enabled ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            draft.preview?.enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <span className="font-medium">공개</span>
                      <button
                        type="button"
                        onClick={() => updatePreview({ isPublic: !(draft.preview?.isPublic ?? false) })}
                        disabled={!draft.preview?.enabled}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          draft.preview?.isPublic ? 'bg-emerald-500' : 'bg-gray-300'
                        } disabled:opacity-40`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            draft.preview?.isPublic ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className={`font-semibold ${draft.preview?.isPublic ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {draft.preview?.isPublic ? 'ON · 공개 중' : 'OFF · 비공개'}
                      </span>
                    </label>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  방송 후 공개 토글을 켜면 <code>/home-shopping</code> 페이지에 ‘방송 다시보기 요약’ 카드로 노출됩니다. (YouTube 챕터 스타일)
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">강조 헤드라인 (한 줄 카피)</label>
                  <input
                    type="text"
                    value={draft.preview?.headline ?? ''}
                    onChange={(e) => updatePreview({ headline: e.target.value })}
                    placeholder="수령 25년 침향, 왜 ‘심신을 다스리는 으뜸 약재’로 불리는가"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">본문 요약 (1~2 문단)</label>
                  <textarea
                    rows={4}
                    value={draft.preview?.summary ?? ''}
                    onChange={(e) => updatePreview({ summary: e.target.value })}
                    placeholder="이번 회차가 다루는 침향의 핵심 내용을 1~2 문단으로 요약합니다."
                    className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                {/* CHAPTERS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">챕터 · 타임라인</label>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      + 챕터 추가
                    </button>
                  </div>
                  {(draft.preview?.highlights ?? []).length === 0 ? (
                    <p className="rounded-md border border-dashed border-amber-200 bg-white/50 px-3 py-4 text-center text-xs text-gray-400">
                      아직 챕터가 없습니다. ‘+ 챕터 추가’ 버튼으로 시작하세요.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {(draft.preview?.highlights ?? []).map((h, i) => (
                        <li key={i} className="rounded-md border border-amber-200 bg-white p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => moveHighlight(i, -1)}
                                disabled={i === 0}
                                className="rounded border border-gray-200 px-1.5 text-[10px] text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                title="위로"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveHighlight(i, 1)}
                                disabled={i === (draft.preview?.highlights?.length ?? 0) - 1}
                                className="rounded border border-gray-200 px-1.5 text-[10px] text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                title="아래로"
                              >
                                ↓
                              </button>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={h.timestamp ?? ''}
                                  onChange={(e) => updateHighlight(i, { timestamp: e.target.value })}
                                  placeholder="00:00"
                                  className="w-20 rounded-md border border-gray-200 px-2 py-1 text-xs font-mono"
                                />
                                <input
                                  type="text"
                                  value={h.title}
                                  onChange={(e) => updateHighlight(i, { title: e.target.value })}
                                  placeholder="챕터 제목"
                                  className="flex-1 min-w-[180px] rounded-md border border-gray-200 px-2 py-1 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeHighlight(i)}
                                  className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                                >
                                  삭제
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={h.description ?? ''}
                                onChange={(e) => updateHighlight(i, { description: e.target.value })}
                                placeholder="챕터 부설명 (선택)"
                                className="w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* KEY POINTS */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    핵심 포인트 (한 줄당 1개 · 침향 효능 강조)
                  </label>
                  <textarea
                    rows={5}
                    value={(draft.preview?.keyPoints ?? []).join('\n')}
                    onChange={(e) =>
                      updatePreview({
                        keyPoints: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder={'동의보감·본초강목이 ‘理氣安神’의 으뜸 약재로 기록한 천 년의 한방 원료\n수령 25년 이상 자연 숙성된 침향에서만 풍부하게 검출되는 세스퀴테르펜\n자율신경 안정 → 수면의 질 개선 · 만성 피로 회복'}
                    className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    각 줄이 공개 페이지에서 ‘침향 핵심 포인트’ 불릿으로 표시됩니다.
                  </p>
                </div>

                {draft.preview?.updatedAt && (
                  <p className="text-[11px] text-gray-400">
                    마지막 편집: {fmtDisplay(draft.preview.updatedAt)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">방송 영상 (YouTube / Vimeo URL 또는 mp4 업로드)</label>
                <VideoUploadField
                  value={draft.vodUrl ?? ''}
                  onChange={(url) => setDraft({ ...draft, vodUrl: url })}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  공개 페이지 라이브 카드 우측 16:9 프레임에 표시됩니다. YouTube/Vimeo URL 은 임베드,
                  업로드 mp4·webm·mov 는 native 플레이어로 재생. 최대 200MB.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  인라인 영상 유효기간 <span className="font-normal text-gray-400">(이후 외부 유튜브 링크로 전환)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    step={60}
                    value={fmtDateTimeLocal(draft.inlineUntil)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft({ ...draft, inlineUntil: v ? new Date(v).toISOString() : null });
                    }}
                    style={{ colorScheme: 'light' }}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  {draft.inlineUntil && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, inlineUntil: null })}
                      className="shrink-0 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      해제
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  비워두면 영구히 인라인 재생됩니다. 설정한 날짜·시각이 지나면 공개 페이지에서
                  영상이 인라인 재생 대신 <b>외부 유튜브 링크</b>로 전환됩니다(협찬 노출 기간 만료 대응).
                </p>
                {draft.inlineUntil &&
                  new Date(draft.inlineUntil).getTime() < Date.now() && (
                    <p className="mt-1 text-[11px] font-medium text-amber-600">
                      ⚠ 현재 유효기간이 지났습니다 — 공개 페이지에서 외부 링크로 노출 중입니다.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">판매 제품 연결</label>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 제품이 없습니다.</p>
                ) : (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-gray-200 p-3">
                    {products.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.productIds.includes(p.id)}
                          onChange={() => toggleProductId(p.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">설명</label>
                <textarea
                  rows={3}
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">상태</label>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as Broadcast['status'] })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="scheduled">편성 예정</option>
                    <option value="live">방송 중</option>
                    <option value="ended">방송 종료</option>
                    <option value="canceled">취소</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">판매량(개)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.salesCount ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDraft({
                        ...draft,
                        salesCount: raw === '' ? null : Number(raw),
                      });
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
                <div>
                  <div className="text-xs font-semibold text-red-700">매진(완판) 표시</div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    켜면 공개 편성표·달력에서 <code>완료</code> 대신 <b>매진</b> 뱃지(빨강)로 노출됩니다.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, soldOut: !(draft.soldOut ?? false) })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                      draft.soldOut ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                        draft.soldOut ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className={`font-semibold ${draft.soldOut ? 'text-red-700' : 'text-gray-400'}`}>
                    {draft.soldOut ? '매진' : '판매중'}
                  </span>
                </label>
              </div>

              {(draft.status === 'ended' || draft.feedback) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">방송 후 피드백</label>
                  <textarea
                    rows={3}
                    value={draft.feedback ?? ''}
                    onChange={(e) => setDraft({ ...draft, feedback: e.target.value })}
                    className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="adm-btn-primary px-4 disabled:opacity-60"
              >
                {saving ? '저장 중...' : isAddMode ? '등록' : '수정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">방송 삭제</h3>
            <p className="mb-5 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{deleteTarget.channel}</span> ({fmtDisplay(deleteTarget.scheduledAt)}) 방송을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="adm-btn-destructive-solid px-4 disabled:opacity-60"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
