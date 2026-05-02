'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import VideoUploadField from '@/components/admin/VideoUploadField';
import { saveAdminPage } from '@/lib/adminSave';
import { agarwoodEditionKo } from '@/content/edition/agarwood.ko';
import type {
  EditionContent,
  EditionChapter,
  EditionGalleryItem,
  EditionProduct,
} from '@/content/edition/types';

const SUBDIR = 'edition';

// DB(pages.editionAgarwood) 가 비어있으면 기본 시드(/src/content/edition/agarwood.ko.ts)를
// 에디터에 로드해, 어드민이 빈 폼이 아닌 실제 카탈로그 콘텐츠를 편집점으로 사용한다.
// 공개 카탈로그(/edition/[token]/agarwood)도 동일 시드를 fallback 으로 쓰므로 기준이 같다.
const DEFAULT_CONTENT: EditionContent = agarwoodEditionKo;

const EMPTY_CONTENT: EditionContent = {
  cover: {
    kicker: 'Daracheon · Limited Digital Edition',
    title: '진짜 침향,',
    titleHighlight: '219,000시간의 기다림',
    subtitle: '',
    edition: 'Edition 01',
    backgroundImage: '',
  },
  foreword: {
    greeting: '',
    body: [''],
    signature: '대라천 · ZOEL LIFE',
    signatureRole: 'Brand Office',
  },
  chapters: [],
  gallery: { num: '', tag: '', title: '', subtitle: '', items: [] },
  lineup: { num: '', tag: '', title: '', subtitle: '', items: [] },
  closing: {
    kicker: 'Final Page · Get in Touch',
    title: '',
    body: '',
    cta: [],
    contact: [],
  },
};

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

export default function EditionContentEditor() {
  const [content, setContent] = useState<EditionContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        if (!res.ok) {
          setSeeded(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const ed = data?.pages?.editionAgarwood as EditionContent | undefined;
        if (ed) {
          setContent({
            ...EMPTY_CONTENT,
            ...ed,
            cover: { ...EMPTY_CONTENT.cover, ...ed.cover },
            foreword: { ...EMPTY_CONTENT.foreword, ...ed.foreword, body: ed.foreword?.body ?? [''] },
            chapters: ed.chapters ?? [],
            gallery: ed.gallery ?? EMPTY_CONTENT.gallery,
            lineup: ed.lineup ?? EMPTY_CONTENT.lineup,
            closing: { ...EMPTY_CONTENT.closing, ...ed.closing, cta: ed.closing?.cta ?? [], contact: ed.closing?.contact ?? [] },
          });
        } else {
          // DB 비어있음 — 기본 시드로 출발(이미 useState 초기값) + 안내 배너 노출.
          setSeeded(true);
        }
      } catch (e) {
        console.error(e);
        setSeeded(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function loadDefaults() {
    setContent(DEFAULT_CONTENT);
    setSeeded(true);
    setToast({ kind: 'ok', msg: '기본 시드 콘텐츠를 에디터에 로드했습니다. 저장 시 DB 에 반영됩니다.' });
  }
  function clearAll() {
    if (!confirm('현재 편집 중인 모든 콘텐츠를 빈 폼으로 초기화할까요? (저장 전까지 DB 반영 안 됨)')) return;
    setContent(EMPTY_CONTENT);
    setSeeded(false);
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setToast(null);
    const res = await saveAdminPage('editionAgarwood', content);
    if (res.ok) {
      setToast({ kind: 'ok', msg: '저장되었습니다.' });
    } else {
      setToast({ kind: 'err', msg: res.msg });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) {
    return <div className="p-8 text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">디지털 에디션 — 침향 카탈로그</h1>
          <p className="mt-1 text-sm text-gray-500">
            /agarwood-edition 신청 → 인증 메일 → /edition/[token]/agarwood 에서 노출되는 콘텐츠.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/edition/preview/agarwood"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gold-500 bg-white px-4 py-2.5 text-xs font-semibold text-gold-700 hover:bg-gold-50"
            title="DB 에 저장된 콘텐츠로 카탈로그 미리보기 (새 탭)"
          >
            미리보기 ↗
          </a>
          <button
            type="button"
            onClick={loadDefaults}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:border-gold-500 hover:text-gold-600"
            title="src/content/edition/agarwood.ko.ts 의 기본 시드를 에디터에 다시 로드"
          >
            기본 시드 불러오기
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600"
          >
            빈 폼 초기화
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-gold-600 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {seeded && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          DB 에 저장된 카탈로그 콘텐츠가 없어 <code className="font-mono text-xs">src/content/edition/agarwood.ko.ts</code> 의
          기본 시드(표지·머리말·8개 챕터·갤러리·라인업·마무리)를 에디터에 로드했습니다. 수정 후 <strong>저장</strong> 을 눌러야 DB 에 반영됩니다.
        </div>
      )}

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            toast.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* COVER */}
      <Section title="표지 (Cover)" subtitle="첫 화면 풀블리드 페이지">
        <Grid>
          <Field label="키커 (Kicker)">
            <input
              value={content.cover.kicker}
              onChange={(e) => setContent({ ...content, cover: { ...content.cover, kicker: e.target.value } })}
              className={inputCls}
            />
          </Field>
          <Field label="에디션 표기 (예: Edition 01 · 2026 Spring)">
            <input
              value={content.cover.edition}
              onChange={(e) => setContent({ ...content, cover: { ...content.cover, edition: e.target.value } })}
              className={inputCls}
            />
          </Field>
        </Grid>
        <Grid>
          <Field label="타이틀">
            <input
              value={content.cover.title}
              onChange={(e) => setContent({ ...content, cover: { ...content.cover, title: e.target.value } })}
              className={inputCls}
            />
          </Field>
          <Field label="타이틀 하이라이트 (이탤릭 골드)">
            <input
              value={content.cover.titleHighlight ?? ''}
              onChange={(e) => setContent({ ...content, cover: { ...content.cover, titleHighlight: e.target.value } })}
              className={inputCls}
            />
          </Field>
        </Grid>
        <Field label="서브타이틀 (한 문단)">
          <textarea
            value={content.cover.subtitle}
            onChange={(e) => setContent({ ...content, cover: { ...content.cover, subtitle: e.target.value } })}
            rows={3}
            className={inputCls}
          />
        </Field>
        <Field label="배경 이미지">
          <ImageUploadField
            value={content.cover.backgroundImage ?? ''}
            onChange={(url) =>
              setContent({ ...content, cover: { ...content.cover, backgroundImage: url } })
            }
            subdir={SUBDIR}
          />
        </Field>
      </Section>

      {/* FOREWORD */}
      <Section title="머리말 (Foreword)" subtitle="개인화 인사 + 짧은 도입글">
        <Field label="인사말 (큰 이탤릭)">
          <textarea
            value={content.foreword.greeting}
            onChange={(e) => setContent({ ...content, foreword: { ...content.foreword, greeting: e.target.value } })}
            rows={2}
            className={inputCls}
          />
        </Field>
        <ArrayField
          label="본문 문단"
          items={content.foreword.body}
          onChange={(next) => setContent({ ...content, foreword: { ...content.foreword, body: next } })}
          render={(value, onItemChange) => (
            <textarea value={value} onChange={(e) => onItemChange(e.target.value)} rows={3} className={inputCls} />
          )}
          empty=""
          addLabel="+ 문단 추가"
        />
        <Grid>
          <Field label="서명">
            <input
              value={content.foreword.signature}
              onChange={(e) => setContent({ ...content, foreword: { ...content.foreword, signature: e.target.value } })}
              className={inputCls}
            />
          </Field>
          <Field label="서명 역할">
            <input
              value={content.foreword.signatureRole}
              onChange={(e) =>
                setContent({ ...content, foreword: { ...content.foreword, signatureRole: e.target.value } })
              }
              className={inputCls}
            />
          </Field>
        </Grid>
      </Section>

      {/* CHAPTERS */}
      <Section
        title="챕터 (Chapters)"
        subtitle={`현재 ${content.chapters.length}개 챕터. 자유롭게 추가·정렬·삭제 가능.`}
      >
        <div className="space-y-4">
          {content.chapters.map((ch, i) => (
            <ChapterEditor
              key={i}
              index={i}
              total={content.chapters.length}
              value={ch}
              onChange={(next) => {
                const arr = [...content.chapters];
                arr[i] = next;
                setContent({ ...content, chapters: arr });
              }}
              onMove={(dir) =>
                setContent({ ...content, chapters: moveItem(content.chapters, i, i + dir) })
              }
              onRemove={() => setContent({ ...content, chapters: removeIndex(content.chapters, i) })}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              setContent({
                ...content,
                chapters: [
                  ...content.chapters,
                  {
                    num: String(content.chapters.length + 1).padStart(2, '0'),
                    tag: `Chapter ${content.chapters.length + 1}`,
                    title: '',
                    subtitle: '',
                    body: [''],
                    highlights: [],
                    images: [],
                  },
                ],
              })
            }
            className="w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gold-500 hover:text-gold-600"
          >
            + 챕터 추가
          </button>
        </div>
      </Section>

      {/* GALLERY */}
      <Section title="갤러리 (Gallery)" subtitle="인증서·문서 이미지 모음">
        <Grid>
          <Field label="번호 (예: 06)">
            <input
              value={content.gallery?.num ?? ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  gallery: { ...(content.gallery ?? EMPTY_CONTENT.gallery!), num: e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="태그 (예: Chapter VI · Documents)">
            <input
              value={content.gallery?.tag ?? ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  gallery: { ...(content.gallery ?? EMPTY_CONTENT.gallery!), tag: e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
        </Grid>
        <Field label="제목">
          <input
            value={content.gallery?.title ?? ''}
            onChange={(e) =>
              setContent({
                ...content,
                gallery: { ...(content.gallery ?? EMPTY_CONTENT.gallery!), title: e.target.value },
              })
            }
            className={inputCls}
          />
        </Field>
        <Field label="서브타이틀">
          <input
            value={content.gallery?.subtitle ?? ''}
            onChange={(e) =>
              setContent({
                ...content,
                gallery: { ...(content.gallery ?? EMPTY_CONTENT.gallery!), subtitle: e.target.value },
              })
            }
            className={inputCls}
          />
        </Field>
        <GalleryItems
          items={content.gallery?.items ?? []}
          onChange={(items) =>
            setContent({
              ...content,
              gallery: { ...(content.gallery ?? EMPTY_CONTENT.gallery!), items },
            })
          }
        />
      </Section>

      {/* LINEUP */}
      <Section title="제품 라인업 (Lineup)" subtitle="카탈로그 후반부 제품 카드 그리드">
        <Grid>
          <Field label="번호">
            <input
              value={content.lineup?.num ?? ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  lineup: { ...(content.lineup ?? EMPTY_CONTENT.lineup!), num: e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="태그">
            <input
              value={content.lineup?.tag ?? ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  lineup: { ...(content.lineup ?? EMPTY_CONTENT.lineup!), tag: e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
        </Grid>
        <Field label="제목">
          <input
            value={content.lineup?.title ?? ''}
            onChange={(e) =>
              setContent({
                ...content,
                lineup: { ...(content.lineup ?? EMPTY_CONTENT.lineup!), title: e.target.value },
              })
            }
            className={inputCls}
          />
        </Field>
        <Field label="서브타이틀">
          <input
            value={content.lineup?.subtitle ?? ''}
            onChange={(e) =>
              setContent({
                ...content,
                lineup: { ...(content.lineup ?? EMPTY_CONTENT.lineup!), subtitle: e.target.value },
              })
            }
            className={inputCls}
          />
        </Field>
        <LineupItems
          items={content.lineup?.items ?? []}
          onChange={(items) =>
            setContent({
              ...content,
              lineup: { ...(content.lineup ?? EMPTY_CONTENT.lineup!), items },
            })
          }
        />
      </Section>

      {/* CLOSING */}
      <Section title="마무리 (Closing)" subtitle="마지막 페이지 + CTA + 영업 담당 연락처">
        <Field label="키커">
          <input
            value={content.closing.kicker}
            onChange={(e) => setContent({ ...content, closing: { ...content.closing, kicker: e.target.value } })}
            className={inputCls}
          />
        </Field>
        <Field label="제목">
          <input
            value={content.closing.title}
            onChange={(e) => setContent({ ...content, closing: { ...content.closing, title: e.target.value } })}
            className={inputCls}
          />
        </Field>
        <Field label="본문">
          <textarea
            value={content.closing.body}
            onChange={(e) => setContent({ ...content, closing: { ...content.closing, body: e.target.value } })}
            rows={3}
            className={inputCls}
          />
        </Field>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">CTA 버튼 ({content.closing.cta.length})</label>
          {content.closing.cta.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input
                value={c.label}
                onChange={(e) => {
                  const arr = [...content.closing.cta];
                  arr[i] = { ...arr[i], label: e.target.value };
                  setContent({ ...content, closing: { ...content.closing, cta: arr } });
                }}
                placeholder="라벨"
                className={inputCls}
              />
              <input
                value={c.href}
                onChange={(e) => {
                  const arr = [...content.closing.cta];
                  arr[i] = { ...arr[i], href: e.target.value };
                  setContent({ ...content, closing: { ...content.closing, cta: arr } });
                }}
                placeholder="https://… 또는 mailto:…"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() =>
                  setContent({ ...content, closing: { ...content.closing, cta: removeIndex(content.closing.cta, i) } })
                }
                className="rounded border border-red-200 px-3 text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent({
                ...content,
                closing: { ...content.closing, cta: [...content.closing.cta, { label: '', href: '' }] },
              })
            }
            className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
          >
            + CTA 추가
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">담당자 연락처 ({content.closing.contact.length})</label>
          {content.closing.contact.map((c, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
              <Grid>
                <Field label="이름">
                  <input
                    value={c.name}
                    onChange={(e) => {
                      const arr = [...content.closing.contact];
                      arr[i] = { ...arr[i], name: e.target.value };
                      setContent({ ...content, closing: { ...content.closing, contact: arr } });
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="역할">
                  <input
                    value={c.role}
                    onChange={(e) => {
                      const arr = [...content.closing.contact];
                      arr[i] = { ...arr[i], role: e.target.value };
                      setContent({ ...content, closing: { ...content.closing, contact: arr } });
                    }}
                    className={inputCls}
                  />
                </Field>
              </Grid>
              <Grid>
                <Field label="이메일">
                  <input
                    value={c.email}
                    onChange={(e) => {
                      const arr = [...content.closing.contact];
                      arr[i] = { ...arr[i], email: e.target.value };
                      setContent({ ...content, closing: { ...content.closing, contact: arr } });
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="전화 (옵션)">
                  <input
                    value={c.phone ?? ''}
                    onChange={(e) => {
                      const arr = [...content.closing.contact];
                      arr[i] = { ...arr[i], phone: e.target.value };
                      setContent({ ...content, closing: { ...content.closing, contact: arr } });
                    }}
                    className={inputCls}
                  />
                </Field>
              </Grid>
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    closing: { ...content.closing, contact: removeIndex(content.closing.contact, i) },
                  })
                }
                className="text-xs text-red-500 hover:underline"
              >
                담당자 삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent({
                ...content,
                closing: {
                  ...content.closing,
                  contact: [...content.closing.contact, { name: '', role: '', email: '' }],
                },
              })
            }
            className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
          >
            + 담당자 추가
          </button>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-gold-500 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-gold-600 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */
const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function ArrayField<T>({
  label,
  items,
  onChange,
  render,
  empty,
  addLabel,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  render: (value: T, onItemChange: (next: T) => void) => React.ReactNode;
  empty: T;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} ({items.length})
      </label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1">
            {render(item, (next) => {
              const arr = [...items];
              arr[i] = next;
              onChange(arr);
            })}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onChange(moveItem(items, i, i - 1))}
              className="rounded border border-gray-200 px-2 py-0.5 text-xs"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onChange(moveItem(items, i, i + 1))}
              className="rounded border border-gray-200 px-2 py-0.5 text-xs"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => onChange(removeIndex(items, i))}
              className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, empty])}
        className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
      >
        {addLabel}
      </button>
    </div>
  );
}

function ChapterEditor({
  value,
  onChange,
  onMove,
  onRemove,
  index,
  total,
}: {
  value: EditionChapter;
  onChange: (next: EditionChapter) => void;
  onMove: (dir: 1 | -1) => void;
  onRemove: () => void;
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <span className="text-gold-600">{open ? '▼' : '▶'}</span>
          Chapter {value.num || index + 1} — {value.title || '(제목 없음)'}
        </button>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">
            ▲
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs disabled:opacity-30">
            ▼
          </button>
          <button type="button" onClick={onRemove} className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">
            삭제
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 p-4">
          <Grid>
            <Field label="번호 (예: 01)">
              <input value={value.num} onChange={(e) => onChange({ ...value, num: e.target.value })} className={inputCls} />
            </Field>
            <Field label="태그 (예: Chapter I · Origin)">
              <input value={value.tag} onChange={(e) => onChange({ ...value, tag: e.target.value })} className={inputCls} />
            </Field>
          </Grid>
          <Field label="제목">
            <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} className={inputCls} />
          </Field>
          <Field label="서브타이틀">
            <input
              value={value.subtitle ?? ''}
              onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
              className={inputCls}
            />
          </Field>
          <ArrayField
            label="본문 문단"
            items={value.body ?? []}
            onChange={(next) => onChange({ ...value, body: next })}
            render={(v, ch) => <textarea value={v} onChange={(e) => ch(e.target.value)} rows={3} className={inputCls} />}
            empty=""
            addLabel="+ 문단 추가"
          />

          {/* Highlights */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">하이라이트 / 통계 ({value.highlights?.length ?? 0})</label>
            {(value.highlights ?? []).map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={h.label}
                  onChange={(e) => {
                    const arr = [...(value.highlights ?? [])];
                    arr[i] = { ...arr[i], label: e.target.value };
                    onChange({ ...value, highlights: arr });
                  }}
                  placeholder="라벨 (예: Founded)"
                  className={inputCls}
                />
                <input
                  value={h.value}
                  onChange={(e) => {
                    const arr = [...(value.highlights ?? [])];
                    arr[i] = { ...arr[i], value: e.target.value };
                    onChange({ ...value, highlights: arr });
                  }}
                  placeholder="값 (예: 1998)"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...value, highlights: removeIndex(value.highlights ?? [], i) })}
                  className="rounded border border-red-200 px-3 text-xs text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({ ...value, highlights: [...(value.highlights ?? []), { label: '', value: '' }] })
              }
              className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
            >
              + 하이라이트 추가
            </button>
          </div>

          {/* Pull quote */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">인용구 (Pull Quote)</label>
            <input
              value={value.pull?.quote ?? ''}
              onChange={(e) => onChange({ ...value, pull: { ...(value.pull ?? { quote: '' }), quote: e.target.value } })}
              placeholder="강조할 한 줄 (비우면 미표시)"
              className={inputCls}
            />
            <input
              value={value.pull?.source ?? ''}
              onChange={(e) =>
                onChange({ ...value, pull: { quote: value.pull?.quote ?? '', source: e.target.value } })
              }
              placeholder="출처 (옵션)"
              className={inputCls}
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">이미지 ({value.images?.length ?? 0})</label>
            {(value.images ?? []).map((img, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <ImageUploadField
                  value={img.src}
                  onChange={(url) => {
                    const arr = [...(value.images ?? [])];
                    arr[i] = { ...arr[i], src: url };
                    onChange({ ...value, images: arr });
                  }}
                  subdir={SUBDIR}
                />
                <input
                  value={img.alt}
                  onChange={(e) => {
                    const arr = [...(value.images ?? [])];
                    arr[i] = { ...arr[i], alt: e.target.value };
                    onChange({ ...value, images: arr });
                  }}
                  placeholder="대체 텍스트(alt)"
                  className={inputCls}
                />
                <input
                  value={img.caption ?? ''}
                  onChange={(e) => {
                    const arr = [...(value.images ?? [])];
                    arr[i] = { ...arr[i], caption: e.target.value };
                    onChange({ ...value, images: arr });
                  }}
                  placeholder="캡션 (옵션)"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...value, images: removeIndex(value.images ?? [], i) })}
                  className="text-xs text-red-500 hover:underline"
                >
                  이미지 삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({ ...value, images: [...(value.images ?? []), { src: '', alt: '' }] })
              }
              className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
            >
              + 이미지 추가
            </button>
          </div>

          {/* Video */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">영상 (옵션)</label>
            <VideoUploadField
              value={value.video?.src ?? ''}
              onChange={(url) =>
                onChange({ ...value, video: url ? { ...(value.video ?? {}), src: url } : undefined })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryItems({
  items,
  onChange,
}: {
  items: EditionGalleryItem[];
  onChange: (items: EditionGalleryItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">갤러리 항목 ({items.length})</label>
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <ImageUploadField
            value={it.src}
            onChange={(url) => {
              const arr = [...items];
              arr[i] = { ...arr[i], src: url };
              onChange(arr);
            }}
            subdir={SUBDIR}
          />
          <Grid>
            <Field label="라벨">
              <input
                value={it.label ?? ''}
                onChange={(e) => {
                  const arr = [...items];
                  arr[i] = { ...arr[i], label: e.target.value };
                  onChange(arr);
                }}
                className={inputCls}
              />
            </Field>
            <Field label="서브">
              <input
                value={it.sub ?? ''}
                onChange={(e) => {
                  const arr = [...items];
                  arr[i] = { ...arr[i], sub: e.target.value };
                  onChange(arr);
                }}
                className={inputCls}
              />
            </Field>
          </Grid>
          <input
            value={it.alt}
            onChange={(e) => {
              const arr = [...items];
              arr[i] = { ...arr[i], alt: e.target.value };
              onChange(arr);
            }}
            placeholder="alt 텍스트"
            className={inputCls}
          />
          <div className="flex gap-1">
            <button type="button" onClick={() => onChange(moveItem(items, i, i - 1))} className="rounded border border-gray-200 px-2 py-0.5 text-xs">▲</button>
            <button type="button" onClick={() => onChange(moveItem(items, i, i + 1))} className="rounded border border-gray-200 px-2 py-0.5 text-xs">▼</button>
            <button type="button" onClick={() => onChange(removeIndex(items, i))} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500">삭제</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { src: '', alt: '' }])}
        className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
      >
        + 갤러리 항목 추가
      </button>
    </div>
  );
}

function LineupItems({
  items,
  onChange,
}: {
  items: EditionProduct[];
  onChange: (items: EditionProduct[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">라인업 항목 ({items.length})</label>
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <Grid>
            <Field label="카테고리 (예: CAPSULE)">
              <input
                value={it.category}
                onChange={(e) => {
                  const arr = [...items];
                  arr[i] = { ...arr[i], category: e.target.value };
                  onChange(arr);
                }}
                className={inputCls}
              />
            </Field>
            <Field label="제품명">
              <input
                value={it.name}
                onChange={(e) => {
                  const arr = [...items];
                  arr[i] = { ...arr[i], name: e.target.value };
                  onChange(arr);
                }}
                className={inputCls}
              />
            </Field>
          </Grid>
          <Field label="설명">
            <textarea
              value={it.description}
              onChange={(e) => {
                const arr = [...items];
                arr[i] = { ...arr[i], description: e.target.value };
                onChange(arr);
              }}
              rows={2}
              className={inputCls}
            />
          </Field>
          <div className="flex gap-1">
            <button type="button" onClick={() => onChange(moveItem(items, i, i - 1))} className="rounded border border-gray-200 px-2 py-0.5 text-xs">▲</button>
            <button type="button" onClick={() => onChange(moveItem(items, i, i + 1))} className="rounded border border-gray-200 px-2 py-0.5 text-xs">▼</button>
            <button type="button" onClick={() => onChange(removeIndex(items, i))} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500">삭제</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { category: '', name: '', description: '' }])}
        className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-gold-500"
      >
        + 라인업 항목 추가
      </button>
    </div>
  );
}
