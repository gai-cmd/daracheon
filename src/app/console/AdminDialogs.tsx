'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { REGULAR_CATEGORY_ICONS } from '@/lib/console/categories';
import {
  CONSOLE_CHANNEL_KINDS,
  CONSOLE_TEAMS,
  MAX_CHANNELS,
  type ConsoleAuditEntry,
  type ConsoleChannel,
  type ConsoleChannelKind,
  type ConsolePerson,
  type ConsoleTeam,
} from '@/lib/console/types';
import { absTime } from '@/lib/console/ui-model';
import { api, fetchChannels, saveChannels, type ChannelDraft } from './api';
import { useApp } from './app-context';
import Dialog from './Dialog';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

// Admin-only dialogs (REQ-CON-018/019, SPEC-CONSOLE-002 REQ-CS2-030 채널 관리). The server re-checks admin rights on every call; these
// screens only appear for console admins.

export async function downloadExport(): Promise<boolean> {
  const r = await api<Record<string, unknown>>('GET', '/api/console/export');
  if (!r.ok) return false;
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' }));
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `zoel-console-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
  a.hidden = true;
  (document.querySelector('[data-admin-root="console"]') ?? document.body).append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  return true;
}

interface ImportReport {
  items: number;
  unmatchedOwners: string[];
}

export function ImportDialog({ text, count, onClose, onDone, overlay }: { text: string; count: number; onClose: () => void; onDone: () => void; overlay?: ReactNode }) {
  const { t } = useUi();
  const app = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);

  const replace = async () => {
    setBusy(true);
    setError('');
    const r = await api<{ report: ImportReport }>('POST', '/api/console/import', text);
    setBusy(false);
    if (r.ok) {
      app.toast(t('imp.done', { n: r.data.report.items }));
      onDone();
      if (r.data.report.unmatchedOwners?.length) setReport(r.data.report);
      else onClose();
      return;
    }
    if (r.status === 413) setError(t('imp.errTooLarge'));
    else if (r.data.error === 'invalid_body') setError(t('imp.errJson'));
    else if (r.data.error === 'invalid_import') {
      const e = r.data.errors?.[0];
      setError(t('imp.errInvalid', { r: e ? [e.section, e.index != null ? `#${e.index + 1}` : '', e.field, e.reason].filter(Boolean).join(' ') : '?' }));
    } else setError(r.status === 0 ? t('errNetwork') : t('actionFail'));
  };

  return (
    <Dialog title={t('imp.title')} onClose={onClose} overlay={overlay}>
      {report ? (
        <>
          <p className={s.pnDesc}>{t('imp.done', { n: report.items })}</p>
          <p className={s.hint}>{t('imp.unmatched', { list: report.unmatchedOwners.join(', ') })}</p>
          <div className={s.dlgFoot}>
            <button type="button" className={cx(s.btn, s.primary)} onClick={onClose}>
              {t('done')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={s.pnDesc}>{t('imp.body', { n: app.items.length, m: count })}</p>
          {error ? (
            <p className={s.formErr} role="alert">
              {error}
            </p>
          ) : null}
          <div className={s.dlgFoot}>
            <button
              type="button"
              className={cx(s.btn, s.ghost, s.left)}
              onClick={() => void downloadExport().then((ok) => app.toast(ok ? t('exported') : t('actionFail')))}
            >
              <Icon name="download" size={16} />
              {t('imp.backup')}
            </button>
            <button type="button" className={cx(s.btn, s.ghost)} onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="button" className={cx(s.btn, s.primary)} disabled={busy} onClick={() => void replace()}>
              {busy ? t('imp.working') : t('imp.replace')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}

interface PersonRow extends ConsolePerson {
  key: number;
}

export function PeopleDialog({ onClose, onSaved, overlay }: { onClose: () => void; onSaved: (people: ConsolePerson[]) => void; overlay?: ReactNode }) {
  const { t } = useUi();
  const app = useApp();
  const seq = useRef(0);
  const [rows, setRows] = useState<PersonRow[]>(() => app.people.map((p) => ({ ...p, key: seq.current++ })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key: number, patch: Partial<ConsolePerson>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const save = async () => {
    const people = rows
      .filter((r) => r.name.trim() || r.email.trim())
      .map(({ key: _key, ...p }) => ({ ...p, name: p.name.trim(), name_en: (p.name_en ?? '').trim(), email: p.email.trim().toLowerCase() }));
    setBusy(true);
    setError('');
    const r = await api<{ people: ConsolePerson[] }>('PUT', '/api/console/people', { people });
    setBusy(false);
    if (r.ok) {
      onSaved(r.data.people);
      app.toast(t('people.saved'));
      onClose();
      return;
    }
    const idx = (r.data.errors as { index?: number }[] | undefined)?.[0]?.index;
    setError(idx != null ? t('people.errRow', { n: idx + 1 }) : r.status === 0 ? t('errNetwork') : t('actionFail'));
  };

  return (
    <Dialog title={t('people.title')} onClose={onClose} wide overlay={overlay}>
      <p className={s.hint}>{t('people.desc')}</p>
      <div className={s.form}>
        <div className={cx(s.prow, s.prowH)} aria-hidden="true">
          <span>{t('people.name')}</span>
          <span>{t('people.nameEn')}</span>
          <span>{t('people.email')}</span>
          <span>{t('people.team')}</span>
          <span />
        </div>
        {rows.map((r, i) => (
          <div key={r.key} className={s.prow}>
            <input className={s.input} type="text" maxLength={60} aria-label={`${i + 1} · ${t('people.name')}`} value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} />
            <input
              className={s.input}
              type="text"
              lang="en"
              maxLength={60}
              aria-label={`${i + 1} · ${t('people.nameEn')}`}
              value={r.name_en ?? ''}
              onChange={(e) => set(r.key, { name_en: e.target.value })}
            />
            <input
              className={s.input}
              type="email"
              maxLength={120}
              spellCheck={false}
              autoCapitalize="off"
              aria-label={`${i + 1} · ${t('people.email')}`}
              value={r.email}
              onChange={(e) => set(r.key, { email: e.target.value })}
            />
            <select className={s.input} aria-label={`${i + 1} · ${t('people.team')}`} value={r.team} onChange={(e) => set(r.key, { team: e.target.value as ConsoleTeam })}>
              {CONSOLE_TEAMS.map((v) => (
                <option key={v} value={v}>
                  {t(`teams.${v}`)}
                </option>
              ))}
            </select>
            <button type="button" className={s.ibtn} aria-label={`${t('people.remove')} · ${i + 1}`} title={t('people.remove')} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
              <Icon name="close" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={cx(s.linkbtn, s.moreTg)}
          onClick={() => setRows((rs) => [...rs, { key: seq.current++, name: '', name_en: '', email: '', team: '공통' }])}
        >
          <Icon name="plus" size={16} />
          {t('people.add')}
        </button>
      </div>
      {error ? (
        <p className={s.formErr} role="alert">
          {error}
        </p>
      ) : null}
      <div className={s.dlgFoot}>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={onClose}>
          {t('cancel')}
        </button>
        <button type="button" className={cx(s.btn, s.primary)} disabled={busy} onClick={() => void save()}>
          {busy ? t('saving') : t('save')}
        </button>
      </div>
    </Dialog>
  );
}

/** Category id from the English (or Korean) name; falls back to a time-based id. */
function categoryIdFor(nameEn: string, existing: ReadonlySet<string>): string {
  const base = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  let id = base && base !== 'wiki' ? base : `cat-${Date.now().toString(36)}`;
  let n = 2;
  while (existing.has(id)) id = `${base}-${n++}`.slice(0, 40);
  return id;
}

export function CategoryDialog({ onClose, onAdded, overlay }: { onClose: () => void; onAdded: (id: string) => void; overlay?: ReactNode }) {
  const { t } = useUi();
  const app = useApp();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState<string>('folder');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => nameRef.current?.focus(), []);

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setError(t('cat.errName'));
      nameRef.current?.focus();
      return;
    }
    const id = categoryIdFor(nameEn.trim(), new Set(app.categories.map((c) => c.id)));
    setBusy(true);
    const r = await api<{ category: { id: string } }>('POST', '/api/console/categories', {
      id,
      name: n,
      name_en: nameEn.trim(),
      short: n.slice(0, 24),
      short_en: nameEn.trim().slice(0, 24),
      description: desc.trim(),
      icon,
    });
    setBusy(false);
    if (r.ok) {
      onAdded(r.data.category.id);
      return;
    }
    setError(r.status === 409 ? t('cat.errExists') : r.status === 0 ? t('errNetwork') : t('actionFail'));
  };

  return (
    <Dialog title={t('cat.title')} onClose={onClose} overlay={overlay}>
      <form
        id="cat-form"
        className={s.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className={s.field}>
          <label htmlFor="c-name">{t('cat.name')}</label>
          <input id="c-name" ref={nameRef} className={s.input} type="text" maxLength={60} value={name} aria-invalid={error ? true : undefined} onChange={(e) => setName(e.target.value)} />
          <p className={s.err}>{error}</p>
        </div>
        <div className={s.field}>
          <label htmlFor="c-name-en">{t('cat.nameEn')}</label>
          <input id="c-name-en" className={s.input} type="text" lang="en" maxLength={60} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <div className={s.field}>
          <label htmlFor="c-desc">{t('cat.desc')}</label>
          <input id="c-desc" className={s.input} type="text" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className={s.field}>
          <span className={s.lblT}>{t('cat.icon')}</span>
          <div className={s.seg} role="group" aria-label={t('cat.icon')}>
            {REGULAR_CATEGORY_ICONS.map((ic) => (
              <button key={ic} type="button" aria-label={ic} aria-pressed={icon === ic} onClick={() => setIcon(ic)}>
                <Icon name={ic} />
              </button>
            ))}
          </div>
        </div>
      </form>
      <div className={s.dlgFoot}>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={onClose}>
          {t('cancel')}
        </button>
        <button type="submit" form="cat-form" className={cx(s.btn, s.primary)} disabled={busy}>
          {t('save')}
        </button>
      </div>
    </Dialog>
  );
}

export function AuditDialog({ onClose, overlay }: { onClose: () => void; overlay?: ReactNode }) {
  const { lang, t } = useUi();
  const app = useApp();
  const [entries, setEntries] = useState<ConsoleAuditEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void api<{ entries: ConsoleAuditEntry[] }>('GET', '/api/console/audit').then((r) => {
      if (!live) return;
      if (r.ok) setEntries(r.data.entries);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, []);
  const titleOf = (id?: string) => (id ? app.items.find((i) => i.id === id)?.title ?? id : '');
  return (
    <Dialog title={t('audit.title')} onClose={onClose} wide overlay={overlay}>
      {failed ? (
        <p className={s.formErr}>{t('actionFail')}</p>
      ) : !entries ? (
        <p className={s.hint}>{t('loading')}</p>
      ) : !entries.length ? (
        <p className={s.hint}>{t('audit.empty')}</p>
      ) : (
        <ul className={s.auditList}>
          {entries.map((e) => (
            <li key={e.id}>
              <span title={e.at}>{absTime(lang, e.at)}</span>
              <span title={e.actor}>{e.actor}</span>
              <span className={s.mono} title={titleOf(e.targetId)}>
                {`${e.action}${e.meta?.field ? ` (${e.meta.field})` : ''}${e.targetId ? ` · ${titleOf(e.targetId)}` : ''}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

interface ChannelRow extends ChannelDraft {
  key: number;
}

const NEW_CHANNEL_COLOR = '#1f6f5c';

/**
 * 채널 관리 (SPEC-CONSOLE-002 REQ-CS2-030, design.md §2.10, CS2-D26). 행마다 종류·이름·영문 이름·출처·색·켜기·
 * 위아래·삭제. 저장은 목록 통째로, 서버가 다시 검사한다(틀린 행이 있으면 아무것도 저장하지 않음).
 * initial 이 있으면 불러오지 않는다(정적 렌더 테스트).
 */
export function ChannelsDialog({
  initial,
  onClose,
  onSaved,
  overlay,
}: {
  initial?: ConsoleChannel[];
  onClose: () => void;
  onSaved: (channels: ConsoleChannel[]) => void;
  overlay?: ReactNode;
}) {
  const { t } = useUi();
  const app = useApp();
  const seq = useRef(0);
  const toRows = (list: ConsoleChannel[]): ChannelRow[] =>
    list.map(({ order: _order, ...c }) => ({ ...c, key: seq.current++ }));
  const [rows, setRows] = useState<ChannelRow[] | null>(() => (initial ? toRows(initial) : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (initial) return;
    let live = true;
    void fetchChannels().then((r) => {
      if (!live) return;
      if (r.ok) setRows(toRows(r.data.channels));
      else setError(r.status === 0 ? t('errNetwork') : t('actionFail'));
    });
    return () => {
      live = false;
    };
    // 처음 열 때 한 번만 부른다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: number, patch: Partial<ChannelDraft>) => setRows((rs) => rs && rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) =>
    setRows((rs) => {
      if (!rs || i + d < 0 || i + d >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  const save = async () => {
    if (!rows) return;
    setBusy(true);
    setError('');
    const r = await saveChannels(rows.map(({ key: _key, ...c }) => ({ ...c, source: c.kind === 'zoellife-blog' ? '' : c.source.trim() })));
    setBusy(false);
    if (r.ok) {
      onSaved(r.data.channels);
      app.toast(t('chan.saved'));
      onClose();
      return;
    }
    const e = r.data.errors?.[0];
    if (e?.reason === 'too_many') setError(t('chan.errMax'));
    else if (e && e.index != null && e.index >= 0) {
      const f = e.field === 'label_en' ? 'labelEn' : e.field;
      setError(t('chan.errRow', { n: e.index + 1, f: f && ['kind', 'label', 'labelEn', 'source', 'color'].includes(f) ? t(`chan.${f}`) : e.field ?? '' }));
    } else setError(r.status === 0 ? t('errNetwork') : t('actionFail'));
  };

  return (
    <Dialog title={t('chan.title')} onClose={onClose} wide overlay={overlay}>
      <p className={s.hint}>{t('chan.desc')}</p>
      {!rows ? (
        error ? null : <p className={s.hint}>{t('loading')}</p>
      ) : (
        <div className={s.form}>
          <div className={cx(s.chrow, s.prowH)} aria-hidden="true">
            <span>{t('chan.kind')}</span>
            <span>{t('chan.label')}</span>
            <span>{t('chan.labelEn')}</span>
            <span>{t('chan.source')}</span>
            <span>{t('chan.color')}</span>
            <span>{t('chan.enabled')}</span>
            <span />
          </div>
          {rows.map((r, i) => {
            const n = i + 1;
            return (
              <div key={r.key} className={s.chrow}>
                <select className={s.input} aria-label={`${n} · ${t('chan.kind')}`} value={r.kind} onChange={(e) => set(r.key, { kind: e.target.value as ConsoleChannelKind })}>
                  {CONSOLE_CHANNEL_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`chan.kinds.${k}`)}
                    </option>
                  ))}
                </select>
                <input className={s.input} type="text" maxLength={40} aria-label={`${n} · ${t('chan.label')}`} value={r.label} onChange={(e) => set(r.key, { label: e.target.value })} />
                <input
                  className={s.input}
                  type="text"
                  lang="en"
                  maxLength={40}
                  aria-label={`${n} · ${t('chan.labelEn')}`}
                  value={r.label_en}
                  onChange={(e) => set(r.key, { label_en: e.target.value })}
                />
                {r.kind === 'zoellife-blog' ? (
                  <span className={s.chNoSrc}>{t('chan.noSource')}</span>
                ) : (
                  <input
                    className={s.input}
                    type="text"
                    maxLength={2048}
                    spellCheck={false}
                    autoCapitalize="off"
                    aria-label={`${n} · ${t('chan.source')}`}
                    placeholder={t(`chan.ph.${r.kind}`)}
                    value={r.source}
                    onChange={(e) => set(r.key, { source: e.target.value })}
                  />
                )}
                <input className={s.chColor} type="color" aria-label={`${n} · ${t('chan.color')}`} value={r.color} onChange={(e) => set(r.key, { color: e.target.value })} />
                <input className={s.chOn} type="checkbox" aria-label={`${n} · ${t('chan.enabled')}`} checked={r.enabled} onChange={(e) => set(r.key, { enabled: e.target.checked })} />
                <span className={s.chActs}>
                  <button type="button" className={s.ibtn} aria-label={`${t('moveUp')} · ${n}`} title={t('moveUp')} aria-disabled={i === 0} onClick={() => move(i, -1)}>
                    <Icon name="up" />
                  </button>
                  <button
                    type="button"
                    className={s.ibtn}
                    aria-label={`${t('moveDown')} · ${n}`}
                    title={t('moveDown')}
                    aria-disabled={i === rows.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <Icon name="down" />
                  </button>
                  <button type="button" className={s.ibtn} aria-label={`${t('chan.remove')} · ${n}`} title={t('chan.remove')} onClick={() => setRows((rs) => rs && rs.filter((x) => x.key !== r.key))}>
                    <Icon name="close" />
                  </button>
                </span>
              </div>
            );
          })}
          {rows.length < MAX_CHANNELS ? (
            <button
              type="button"
              className={cx(s.linkbtn, s.moreTg)}
              onClick={() =>
                setRows((rs) => rs && [...rs, { key: seq.current++, label: '', label_en: '', kind: 'youtube', source: '', color: NEW_CHANNEL_COLOR, enabled: true }])
              }
            >
              <Icon name="plus" size={16} />
              {t('chan.add')}
            </button>
          ) : null}
        </div>
      )}
      {error ? (
        <p className={s.formErr} role="alert">
          {error}
        </p>
      ) : null}
      <div className={s.dlgFoot}>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={onClose}>
          {t('cancel')}
        </button>
        <button type="button" className={cx(s.btn, s.primary)} disabled={busy || !rows} onClick={() => void save()}>
          {busy ? t('saving') : t('save')}
        </button>
      </div>
    </Dialog>
  );
}
