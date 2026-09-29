'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageUploadField from '@/components/admin/ImageUploadField';
import VideoUploadField from '@/components/admin/VideoUploadField';
import { saveAdminPage } from '@/lib/adminSave';
import {
  HOME_MAIN_LIMITS,
  isInstagramPermalink,
  isOwnAsset,
  isYoutubeId,
  resolveHomeMain,
  safeHref,
  type HomeMain,
  type HomeMainLink,
  type HomeMainSectionKey,
  type HomeMainTiles,
} from '@/lib/home-main';
import { cleanVideoTitle } from '@/lib/sns';

/**
 * 메인 페이지(/) 편집 — pages.homeMain.
 *
 * 섹션마다 따로 저장한다. 저장 직전에 서버의 현재 homeMain 을 다시 읽어 이 섹션만 바꿔 끼우므로
 * 다른 섹션(다른 탭·다른 관리자가 저장한 값)은 그대로 남는다.
 * '기본값으로 되돌리기'는 그 섹션을 저장 객체에서 지워 코드 기본값(src/lib/home-main.ts)이 나오게 한다.
 * 자체 완결 UI 라 전역 var(--lx-*) 토큰 대신 Tailwind 고정 색만 쓴다(dark-theme.css 리맵 함정).
 */

type Stored = Record<string, unknown>;

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500';
const SMALL_BTN = 'rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30';
const DEL_BTN = 'rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50';
const ADD_BTN =
  'rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600 disabled:opacity-40';

const MARKUP_HINT = '엔터 = 줄바꿈, *텍스트* = 금색 강조';
const IMAGE_HINT = '외부 링크(유튜브·인스타 이미지 주소)는 쓸 수 없고 업로드한 이미지만 표시됩니다.';
const VIDEO_HINT = '4MB 이하 H.264 mp4 권장 — 업로드 한도에 걸릴 수 있고, 큰 영상은 모바일 데이터 소모가 큽니다.';
const BLANK_HINT = '비워 두면 기본 문구가 나옵니다.';

const SECTIONS: { key: HomeMainSectionKey; title: string }[] = [
  { key: 'intro', title: '인트로' },
  { key: 'news', title: '소식 제목' },
  { key: 'stats', title: '통계' },
  { key: 'marquee', title: '흐르는 띠' },
  { key: 'tiles', title: '타일 6개' },
  { key: 'closing', title: '마무리 띠' },
  { key: 'youtube', title: '공식 채널 - 유튜브' },
  { key: 'instagram', title: '공식 채널 - 인스타그램' },
];

type TileField = { name: string; label: string; kind: 'text' | 'title' | 'href' | 'image' | 'video' };

const KICKER: TileField = { name: 'kicker', label: '작은 제목', kind: 'text' };
const TITLE: TileField = { name: 'title', label: '제목', kind: 'title' };
const SUB: TileField = { name: 'sub', label: '설명', kind: 'text' };
const HREF: TileField = { name: 'href', label: '링크', kind: 'href' };
const HOVER_VIDEO: TileField = { name: 'video', label: '커서를 올리면 재생되는 영상', kind: 'video' };

const TILE_FORMS: { key: keyof HomeMainTiles; title: string; note?: string; fields: TileField[] }[] = [
  {
    key: 'hero',
    title: '① 농장 영상 (큰 타일)',
    fields: [
      { name: 'chip', label: '왼쪽 위 표시', kind: 'text' },
      KICKER,
      TITLE,
      SUB,
      HREF,
      { name: 'video', label: '자동 재생 영상', kind: 'video' },
      { name: 'poster', label: '영상 대기 이미지(포스터)', kind: 'image' },
    ],
  },
  { key: 'onair', title: '② On-Air', fields: [KICKER, TITLE, SUB, HREF, HOVER_VIDEO] },
  { key: 'stats', title: '③ 숫자', note: '숫자 4줄은 위 “통계” 섹션에서 편집합니다.', fields: [KICKER] },
  {
    key: 'ring',
    title: '④ 진짜 침향 구별법',
    fields: [
      KICKER,
      TITLE,
      { name: 'latin', label: '학명 줄', kind: 'text' },
      { name: 'note', label: '설명', kind: 'text' },
      HREF,
      { name: 'image', label: '표본 이미지', kind: 'image' },
    ],
  },
  {
    key: 'brand',
    title: '⑤ 브랜드 이야기',
    fields: [KICKER, TITLE, SUB, HREF, { name: 'image', label: '배경 이미지', kind: 'image' }, HOVER_VIDEO],
  },
  {
    key: 'showroom',
    title: '⑥ 전시장',
    fields: [KICKER, TITLE, HREF, HOVER_VIDEO, { name: 'poster', label: '영상 대기 이미지(포스터)', kind: 'image' }],
  },
];

function isRecord(v: unknown): v is Stored {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function removeIndex<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

function hrefWarn(v: string): string | null {
  return v.trim() && !safeHref(v) ? '사이트 내부 경로(/…) 또는 http(s) 주소만 쓸 수 있습니다. 이대로면 기본 링크가 나옵니다.' : null;
}

function assetWarn(v: string): string | null {
  return v.trim() && !isOwnAsset(v.trim()) ? '외부 주소는 쓸 수 없습니다. 파일을 업로드해 주세요. 이대로면 기본값이 나옵니다.' : null;
}

/** 유튜브 주소를 붙여 넣으면 영상 ID(11자)만 뽑는다. */
function youtubeIdFrom(input: string): string {
  const v = input.trim();
  const m = v.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : v;
}

/** 섹션 저장 전 검사 — 빨간 안내가 남아 있으면 저장하지 않는다. */
function sectionProblem(key: HomeMainSectionKey, hm: HomeMain): string | null {
  const firstLinkWarn = (links: HomeMainLink[]) => links.map((l) => hrefWarn(l.href)).find(Boolean) ?? null;
  switch (key) {
    case 'intro':
      return firstLinkWarn([hm.intro.primary, hm.intro.secondary]);
    case 'closing':
      return firstLinkWarn([hm.closing.primary, hm.closing.secondary]);
    case 'stats': {
      if (!hm.stats.length) return '통계를 한 줄 이상 입력하세요.';
      const bad = hm.stats.findIndex((s) => !Number.isFinite(s.value) || s.value < 0 || !s.label.trim());
      return bad >= 0 ? `통계 ${bad + 1}번째 줄: 0 이상의 숫자와 이름을 모두 입력하세요.` : null;
    }
    case 'marquee':
      return hm.marquee.some((m) => m.trim()) ? null : '문구를 한 개 이상 입력하세요.';
    case 'tiles':
      for (const form of TILE_FORMS) {
        const values = hm.tiles[form.key] as unknown as Record<string, string>;
        for (const f of form.fields) {
          const v = values[f.name] ?? '';
          const warn = f.kind === 'href' ? hrefWarn(v) : f.kind === 'image' || f.kind === 'video' ? assetWarn(v) : null;
          if (warn) return `${form.title} · ${f.label}: ${warn}`;
        }
      }
      return null;
    case 'youtube': {
      const urlWarn = hrefWarn(hm.youtube.url);
      if (urlWarn) return `채널 주소: ${urlWarn}`;
      const bad = hm.youtube.videos.findIndex((v) => !isYoutubeId(v.id.trim()) || !isOwnAsset(v.thumbnail.trim()));
      return bad >= 0 ? `유튜브 ${bad + 1}번째 영상: 영상 ID(11자)와 업로드한 썸네일이 모두 필요합니다.` : null;
    }
    case 'instagram': {
      const urlWarn = hrefWarn(hm.instagram.url);
      if (urlWarn) return `계정 주소: ${urlWarn}`;
      const bad = hm.instagram.posts.findIndex((p) => !isInstagramPermalink(p.permalink.trim()) || !isOwnAsset(p.image.trim()));
      return bad >= 0 ? `인스타그램 ${bad + 1}번째 게시물: 원문 링크와 업로드한 표지가 모두 필요합니다.` : null;
    }
    default:
      return null;
  }
}

/** 편집 중인 값 → 저장할 섹션 값. */
function sectionValue(key: HomeMainSectionKey, hm: HomeMain): unknown {
  switch (key) {
    case 'stats':
      return hm.stats.map((s) => ({ value: s.value, unit: s.unit.trim(), label: s.label.trim() }));
    case 'marquee':
      return hm.marquee.map((m) => m.trim()).filter(Boolean);
    case 'youtube':
      return {
        name: hm.youtube.name,
        handle: hm.youtube.handle,
        url: hm.youtube.url,
        videos: hm.youtube.videos.map((v) => ({
          id: v.id.trim(),
          title: v.title,
          publishedAt: v.publishedAt,
          thumbnail: v.thumbnail.trim(),
        })),
      };
    case 'instagram':
      // id 는 원문 링크에서 다시 뽑는다(링크를 바꿔도 어긋나지 않게).
      return {
        handle: hm.instagram.handle,
        url: hm.instagram.url,
        posts: hm.instagram.posts.map((p) => ({
          permalink: p.permalink.trim(),
          image: p.image.trim(),
          caption: p.caption ?? '',
        })),
      };
    default:
      return hm[key];
  }
}

/* ───────────── 작은 입력 부품 ───────────── */

function TextField({
  label,
  value,
  onChange,
  hint,
  warn,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  warn?: string | null;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {multiline ? (
        <textarea rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      ) : (
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      )}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
      {warn && <span className="mt-1 block text-xs text-red-600">{warn}</span>}
    </label>
  );
}

function LinkFields({ title, value, onChange }: { title: string; value: HomeMainLink; onChange: (v: HomeMainLink) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
      <TextField label={`${title} — 글자`} value={value.label} onChange={(label) => onChange({ ...value, label })} />
      <TextField
        label={`${title} — 링크`}
        value={value.href}
        onChange={(href) => onChange({ ...value, href })}
        placeholder="/products 또는 https://…"
        warn={hrefWarn(value.href)}
      />
    </div>
  );
}

function MediaField({
  kind,
  label,
  value,
  onChange,
  disableAi,
}: {
  kind: 'image' | 'video';
  label: string;
  value: string;
  onChange: (v: string) => void;
  disableAi?: boolean;
}) {
  return (
    <div>
      {kind === 'video' ? (
        <VideoUploadField label={label} value={value} onChange={onChange} />
      ) : (
        <ImageUploadField label={label} value={value} onChange={onChange} subdir="home-main" disableAi={disableAi} />
      )}
      <p className="mt-1 text-xs text-gray-500">{kind === 'video' ? VIDEO_HINT : IMAGE_HINT}</p>
      {assetWarn(value) && <p className="mt-1 text-xs text-red-600">{assetWarn(value)}</p>}
    </div>
  );
}

function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className={SMALL_BTN} aria-label="위로">
        ▲
      </button>
      <button type="button" onClick={() => onMove(index + 1)} disabled={index === count - 1} className={SMALL_BTN} aria-label="아래로">
        ▼
      </button>
      <button type="button" onClick={onRemove} className={DEL_BTN}>
        삭제
      </button>
    </div>
  );
}

function SectionCard({
  id,
  title,
  desc,
  stored,
  saving,
  busy,
  onSave,
  onReset,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  stored: boolean;
  saving: boolean;
  /** 다른 섹션 저장 중이거나 첫 로드 실패 — 동시 저장이 서로를 덮어쓰지 않도록 버튼을 막는다. */
  busy: boolean;
  onSave: () => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            stored ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {stored ? '저장한 값 사용 중' : '기본값 사용 중'}
        </span>
      </div>
      <div className="space-y-4">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          기본값으로 되돌리기
        </button>
        <button type="button" onClick={onSave} disabled={busy} className="adm-btn-primary px-6 disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}

/* ───────────── 화면 ───────────── */

export default function AdminHomeMainPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<HomeMainSectionKey | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // 서버에 저장돼 있는 homeMain 원본 — 섹션별 '저장한 값 / 기본값' 표시에 쓴다.
  const [stored, setStored] = useState<Stored>({});
  const [hm, setHm] = useState<HomeMain>(() => resolveHomeMain(null));
  // 첫 로드가 실패하면 화면의 기본값이 저장값처럼 보여, 저장 시 실제 저장값을 덮어쓸 수 있다 — 저장을 막는다.
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        if (res.status === 404) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { pages?: { homeMain?: unknown } };
        const raw = data.pages?.homeMain;
        setStored(isRecord(raw) ? raw : {});
        setHm(resolveHomeMain(raw));
      } catch (err) {
        console.error('Failed to fetch homeMain:', err);
        setLoadFailed(true);
        setToast({ msg: '데이터 로드 실패 — 새로고침 전까지 저장할 수 없습니다', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function patch<K extends keyof HomeMain>(key: K, value: HomeMain[K]) {
    setHm((prev) => ({ ...prev, [key]: value }));
  }

  function setTileField(key: keyof HomeMainTiles, name: string, value: string) {
    setHm((prev) => ({ ...prev, tiles: { ...prev.tiles, [key]: { ...prev.tiles[key], [name]: value } } }));
  }

  /** 서버의 현재 homeMain 에서 이 섹션만 바꿔(value 가 undefined 면 지워) 저장한다. */
  async function writeSection(key: HomeMainSectionKey, value: unknown): Promise<boolean> {
    setSaving(key);
    try {
      // no-store — 이전 응답이 재사용되면 다른 섹션을 옛 값으로 덮어쓸 수 있다.
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      if (!res.ok && res.status !== 404) throw new Error(`현재 데이터를 읽지 못해 저장을 멈췄습니다 (HTTP ${res.status})`);
      const body = res.ok ? ((await res.json()) as { pages?: { homeMain?: unknown } }) : {};
      const current = body.pages?.homeMain;
      const next: Stored = isRecord(current) ? { ...current } : {};
      if (value === undefined) delete next[key];
      else next[key] = value;

      const result = await saveAdminPage('homeMain', next);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return false;
      }
      setStored(next);
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
      return true;
    } catch (err) {
      console.error(`Save homeMain.${key} error:`, err);
      setToast({ msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      return false;
    } finally {
      setSaving(null);
    }
  }

  function saveSection(key: HomeMainSectionKey) {
    const problem = sectionProblem(key, hm);
    if (problem) {
      setToast({ msg: problem, type: 'error' });
      return;
    }
    void writeSection(key, sectionValue(key, hm));
  }

  async function resetSection(key: HomeMainSectionKey, title: string) {
    if (!confirm(`'${title}' 섹션을 기본값으로 되돌립니다. 저장해 둔 값은 지워집니다. 계속할까요?`)) return;
    // 저장된 값이 없으면 화면만 되돌린다.
    if (key in stored && !(await writeSection(key, undefined))) return;
    patch(key, resolveHomeMain(null)[key]);
  }

  const card = (key: HomeMainSectionKey, desc?: string) => {
    const title = SECTIONS.find((s) => s.key === key)?.title ?? key;
    return {
      id: `sec-${key}`,
      title,
      desc,
      stored: key in stored,
      saving: saving === key,
      busy: saving !== null || loadFailed,
      onSave: () => saveSection(key),
      onReset: () => void resetSection(key, title),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 w-full rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { intro, news, tiles, closing, youtube, instagram } = hm;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] max-w-md rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl font-bold text-gray-900">메인 페이지 편집</h1>
          <Link href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-gold-700 underline underline-offset-2">
            메인 열기 ↗
          </Link>
        </div>
        <p className="mb-4 text-gray-500">
          공개 메인(/)의 문구·링크·영상·이미지와 공식 채널 목록을 섹션별로 저장합니다. 저장하지 않은 섹션은 처음 올린 기본 문구가
          나옵니다. 대표 제품·언론 보도·블로그 칸은 각 메뉴의 데이터를 자동으로 보여 줍니다.
        </p>
        <nav className="mb-8 flex flex-wrap gap-2 text-sm">
          {SECTIONS.map((s) => (
            <a key={s.key} href={`#sec-${s.key}`} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-600 hover:border-gold-500 hover:text-gold-700">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-8">
          {/* 인트로 */}
          <SectionCard {...card('intro', '첫 화면 맨 위 — 작은 배지, 큰 제목, 부제, 버튼 2개.')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
              <TextField label="배지 칩" value={intro.badgeChip} onChange={(v) => patch('intro', { ...intro, badgeChip: v })} />
              <TextField label="배지 문구" value={intro.badgeText} onChange={(v) => patch('intro', { ...intro, badgeText: v })} />
            </div>
            <TextField
              label="큰 제목"
              multiline
              value={intro.headline}
              onChange={(v) => patch('intro', { ...intro, headline: v })}
              hint={`${MARKUP_HINT}. ${BLANK_HINT}`}
            />
            <TextField
              label="부제"
              multiline
              value={intro.subline}
              onChange={(v) => patch('intro', { ...intro, subline: v })}
              hint="엔터 = 데스크톱에서만 줄바꿈, *구절* = 줄이 바뀌어도 한 줄로 묶음(학명 등). 비워 두면 기본 문구가 나옵니다."
            />
            <LinkFields title="첫 번째 버튼" value={intro.primary} onChange={(v) => patch('intro', { ...intro, primary: v })} />
            <LinkFields title="두 번째 버튼" value={intro.secondary} onChange={(v) => patch('intro', { ...intro, secondary: v })} />
          </SectionCard>

          {/* 소식 제목 */}
          <SectionCard {...card('news', '인트로 아래 “소식” 묶음의 제목.')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
              <TextField label="칩" value={news.chip} onChange={(v) => patch('news', { ...news, chip: v })} />
              <TextField label="라벨" value={news.label} onChange={(v) => patch('news', { ...news, label: v })} />
            </div>
            <TextField
              label="제목"
              value={news.title}
              onChange={(v) => patch('news', { ...news, title: v })}
              hint={`*텍스트* = 금색 강조. ${BLANK_HINT}`}
            />
          </SectionCard>

          {/* 통계 */}
          <SectionCard {...card('stats', `“숫자로 보는 대라천” 타일의 숫자 — 최대 ${HOME_MAIN_LIMITS.stats}줄. 숫자는 0 이상, 정수 권장(올라가는 애니메이션은 정수로 끝납니다).`)}>
            {hm.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[120px_120px_1fr_auto]">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">숫자</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={Number.isNaN(s.value) ? '' : s.value}
                    onChange={(e) => {
                      const n = [...hm.stats];
                      n[i] = { ...s, value: e.target.value === '' ? NaN : Number(e.target.value) };
                      patch('stats', n);
                    }}
                    className={INPUT}
                  />
                </label>
                <TextField
                  label="단위"
                  value={s.unit}
                  onChange={(v) => {
                    const n = [...hm.stats];
                    n[i] = { ...s, unit: v };
                    patch('stats', n);
                  }}
                />
                <TextField
                  label="이름"
                  value={s.label}
                  onChange={(v) => {
                    const n = [...hm.stats];
                    n[i] = { ...s, label: v };
                    patch('stats', n);
                  }}
                />
                <ItemControls
                  index={i}
                  count={hm.stats.length}
                  onMove={(to) => patch('stats', moveItem(hm.stats, i, to))}
                  onRemove={() => patch('stats', removeIndex(hm.stats, i))}
                />
              </div>
            ))}
            <button
              type="button"
              disabled={hm.stats.length >= HOME_MAIN_LIMITS.stats}
              onClick={() => patch('stats', [...hm.stats, { value: 0, unit: '', label: '' }])}
              className={ADD_BTN}
            >
              + 줄 추가
            </button>
          </SectionCard>

          {/* 흐르는 띠 */}
          <SectionCard {...card('marquee', `둘러보기 그리드 맨 아래를 옆으로 흐르는 문구 — 최대 ${HOME_MAIN_LIMITS.marquee}개. 빈 칸은 저장할 때 빠집니다.`)}>
            {hm.marquee.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-right text-xs text-gray-400">{i + 1}</span>
                <input
                  type="text"
                  value={m}
                  onChange={(e) => {
                    const n = [...hm.marquee];
                    n[i] = e.target.value;
                    patch('marquee', n);
                  }}
                  className={INPUT}
                />
                <ItemControls
                  index={i}
                  count={hm.marquee.length}
                  onMove={(to) => patch('marquee', moveItem(hm.marquee, i, to))}
                  onRemove={() => patch('marquee', removeIndex(hm.marquee, i))}
                />
              </div>
            ))}
            <button
              type="button"
              disabled={hm.marquee.length >= HOME_MAIN_LIMITS.marquee}
              onClick={() => patch('marquee', [...hm.marquee, ''])}
              className={ADD_BTN}
            >
              + 문구 추가
            </button>
          </SectionCard>

          {/* 타일 6개 */}
          <SectionCard {...card('tiles', `“대라천 둘러보기” 그리드의 타일. 제목은 ${MARKUP_HINT}. ${BLANK_HINT}`)}>
            {TILE_FORMS.map((form) => {
              const values = tiles[form.key] as unknown as Record<string, string>;
              return (
                <div key={form.key} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-800">{form.title}</h3>
                  {form.note && <p className="text-xs text-gray-500">{form.note}</p>}
                  {form.fields.map((f) =>
                    f.kind === 'image' || f.kind === 'video' ? (
                      <MediaField
                        key={f.name}
                        kind={f.kind}
                        label={f.label}
                        value={values[f.name] ?? ''}
                        onChange={(v) => setTileField(form.key, f.name, v)}
                      />
                    ) : (
                      <TextField
                        key={f.name}
                        label={f.label}
                        multiline={f.kind === 'title'}
                        value={values[f.name] ?? ''}
                        onChange={(v) => setTileField(form.key, f.name, v)}
                        placeholder={f.kind === 'href' ? '/media 또는 https://…' : undefined}
                        warn={f.kind === 'href' ? hrefWarn(values[f.name] ?? '') : null}
                      />
                    ),
                  )}
                </div>
              );
            })}
          </SectionCard>

          {/* 마무리 띠 */}
          <SectionCard {...card('closing', '페이지 맨 아래 한 줄과 버튼 2개.')}>
            <TextField
              label="문구"
              value={closing.line}
              onChange={(v) => patch('closing', { ...closing, line: v })}
              hint={`*텍스트* = 금색 강조. ${BLANK_HINT}`}
            />
            <LinkFields title="첫 번째 버튼" value={closing.primary} onChange={(v) => patch('closing', { ...closing, primary: v })} />
            <LinkFields title="두 번째 버튼" value={closing.secondary} onChange={(v) => patch('closing', { ...closing, secondary: v })} />
          </SectionCard>

          {/* 공식 채널 - 유튜브 */}
          <SectionCard
            {...card(
              'youtube',
              `위에서부터 순서대로 보입니다 — 소식의 “공식 채널” 칸에는 앞의 2편, 둘러보기의 유튜브 타일에는 전체(최대 ${HOME_MAIN_LIMITS.videos}편). 제목에 한글이 없는 영상은 표시되지 않습니다. 목록을 비우면 기본 목록이 나옵니다.`,
            )}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="채널 이름" value={youtube.name} onChange={(v) => patch('youtube', { ...youtube, name: v })} />
              <TextField label="핸들" value={youtube.handle} onChange={(v) => patch('youtube', { ...youtube, handle: v })} placeholder="@채널핸들" />
            </div>
            <TextField
              label="채널 주소"
              value={youtube.url}
              onChange={(v) => patch('youtube', { ...youtube, url: v })}
              placeholder="https://www.youtube.com/@…"
              warn={hrefWarn(youtube.url)}
            />
            {youtube.videos.map((v, i) => {
              const setVideo = (next: Partial<typeof v>) => {
                const n = [...youtube.videos];
                n[i] = { ...v, ...next };
                patch('youtube', { ...youtube, videos: n });
              };
              return (
                <div key={i} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">영상 {i + 1}</span>
                    <ItemControls
                      index={i}
                      count={youtube.videos.length}
                      onMove={(to) => patch('youtube', { ...youtube, videos: moveItem(youtube.videos, i, to) })}
                      onRemove={() => patch('youtube', { ...youtube, videos: removeIndex(youtube.videos, i) })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_170px]">
                    <TextField
                      label="영상 ID"
                      value={v.id}
                      onChange={(id) => setVideo({ id: youtubeIdFrom(id) })}
                      placeholder="11자 ID 또는 유튜브 주소 붙여넣기"
                      warn={v.id.trim() && !isYoutubeId(v.id.trim()) ? '영상 ID는 11자입니다 (주소를 붙여 넣으면 자동으로 뽑습니다).' : null}
                    />
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">게시일</span>
                      <input
                        type="date"
                        value={v.publishedAt.slice(0, 10)}
                        onChange={(e) => setVideo({ publishedAt: e.target.value })}
                        className={INPUT}
                      />
                    </label>
                  </div>
                  <TextField
                    label="제목"
                    value={v.title}
                    onChange={(title) => setVideo({ title })}
                    warn={v.title.trim() && !/[가-힣]/.test(cleanVideoTitle(v.title)) ? '제목에 한글이 없어 메인에 표시되지 않습니다.' : null}
                  />
                  <MediaField kind="image" label="썸네일 (16:9)" value={v.thumbnail} onChange={(thumbnail) => setVideo({ thumbnail })} disableAi />
                </div>
              );
            })}
            <button
              type="button"
              disabled={youtube.videos.length >= HOME_MAIN_LIMITS.videos}
              onClick={() =>
                patch('youtube', { ...youtube, videos: [...youtube.videos, { id: '', title: '', publishedAt: '', thumbnail: '' }] })
              }
              className={ADD_BTN}
            >
              + 영상 추가
            </button>
          </SectionCard>

          {/* 공식 채널 - 인스타그램 */}
          <SectionCard
            {...card(
              'instagram',
              `둘러보기의 인스타그램 타일에 세로(9:16) 표지로 넘어갑니다 — 최대 ${HOME_MAIN_LIMITS.posts}개. 목록을 비우면 기본 목록이 나옵니다.`,
            )}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="계정 핸들" value={instagram.handle} onChange={(v) => patch('instagram', { ...instagram, handle: v })} placeholder="@계정" />
              <TextField
                label="계정 주소"
                value={instagram.url}
                onChange={(v) => patch('instagram', { ...instagram, url: v })}
                placeholder="https://www.instagram.com/…"
                warn={hrefWarn(instagram.url)}
              />
            </div>
            {instagram.posts.map((p, i) => {
              const setPost = (next: Partial<typeof p>) => {
                const n = [...instagram.posts];
                n[i] = { ...p, ...next };
                patch('instagram', { ...instagram, posts: n });
              };
              return (
                <div key={i} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">게시물 {i + 1}</span>
                    <ItemControls
                      index={i}
                      count={instagram.posts.length}
                      onMove={(to) => patch('instagram', { ...instagram, posts: moveItem(instagram.posts, i, to) })}
                      onRemove={() => patch('instagram', { ...instagram, posts: removeIndex(instagram.posts, i) })}
                    />
                  </div>
                  <TextField
                    label="원문 링크"
                    value={p.permalink}
                    onChange={(permalink) => setPost({ permalink })}
                    placeholder="https://www.instagram.com/reel/…/"
                    warn={
                      p.permalink.trim() && !isInstagramPermalink(p.permalink.trim())
                        ? 'https://www.instagram.com/ 으로 시작하는 게시물 주소만 쓸 수 있습니다.'
                        : null
                    }
                  />
                  <TextField label="캡션" value={p.caption ?? ''} onChange={(caption) => setPost({ caption })} />
                  <MediaField kind="image" label="표지 (세로 9:16)" value={p.image} onChange={(image) => setPost({ image })} disableAi />
                </div>
              );
            })}
            <button
              type="button"
              disabled={instagram.posts.length >= HOME_MAIN_LIMITS.posts}
              onClick={() =>
                patch('instagram', {
                  ...instagram,
                  posts: [...instagram.posts, { id: '', permalink: '', image: '', caption: '' }],
                })
              }
              className={ADD_BTN}
            >
              + 게시물 추가
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
