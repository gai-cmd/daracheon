'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { categoryChoices } from '@/lib/console/categories';
import { generatePassword } from '@/lib/console/password-gen';
import {
  CONSOLE_ITEM_TYPES,
  CONSOLE_TEAMS,
  CONSOLE_VISIBILITIES,
  type ConsoleAccessMethod,
  type ConsoleItemType,
  type ConsoleListItem,
  type ConsoleTeam,
  type ConsoleVisibility,
} from '@/lib/console/types';
import {
  LINK_ACCESS_METHODS,
  applyKind,
  categoryName,
  hostOf,
  isMine,
  kindOf,
  linkMemoryFor,
  needsCredDeleteConfirm,
  normUrl,
  ownersFromText,
  urlKey,
  type ItemKind,
} from '@/lib/console/ui-model';
import { api } from './api';
import { useApp, type FormFocus } from './app-context';
import { PanelHead } from './DetailPanel';
import Dialog from './Dialog';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

const MASK = '••••••••';
/** 분류 select 의 관리자 전용 마지막 선택지 값 (REQ-CS2-012). 실제 분류 id 와 겹치지 않는다. */
const NEW_CATEGORY = '__new_category__';
const SHARE_TARGETS = [
  ['전체', 'share.all'],
  ['팀', 'share.team'],
  ['본인', 'share.self'],
] as const;

/**
 * 양식 맨 위 종류 선택: 링크 | 공유 계정 (REQ-CS2-009, REQ-CS2-021). radiogroup 안의 두 radio,
 * 선택된 쪽만 탭 순서에 있고 화살표 키로 옮긴다.
 */
function KindControl({ kind, onChange }: { kind: ItemKind; onChange: (k: ItemKind) => void }) {
  const { t } = useUi();
  const refs = { link: useRef<HTMLButtonElement>(null), shared: useRef<HTMLButtonElement>(null) };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next: ItemKind = e.key === 'Home' ? 'link' : e.key === 'End' ? 'shared' : kind === 'link' ? 'shared' : 'link';
    onChange(next);
    refs[next].current?.focus();
  };
  return (
    <div className={s.field}>
      <span className={s.lblT} id="f-kind-l">
        {t('kind.label')}
      </span>
      <div className={cx(s.seg, s.wide, s.kindSeg)} role="radiogroup" aria-labelledby="f-kind-l" onKeyDown={onKey}>
        {(['link', 'shared'] as const).map((k) => (
          <button
            key={k}
            ref={refs[k]}
            type="button"
            role="radio"
            aria-checked={kind === k}
            tabIndex={kind === k ? 0 : -1}
            onClick={() => onChange(k)}
          >
            <Icon name={k === 'link' ? 'external' : 'key'} size={16} />
            {t(`kind.${k}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ id, label, hint, err, children, after }: { id: string; label: string; hint?: string; err?: string; children: ReactNode; after?: ReactNode }) {
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? (
        <p className={s.fHint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <p className={s.err} id={`${id}-err`}>
        {err ?? ''}
      </p>
      {after}
    </div>
  );
}

interface LinkRow {
  key: number;
  label: string;
  url: string;
  orig?: { label: string; label_en: string };
}

type Errors = Partial<Record<'title' | 'url' | 'links' | 'owners' | 'form', string>>;

// Add / edit form in the detail panel (REQ-CON-010/013/014). By default only the address and the
// linked addresses are open; "더 보기" reveals the rest. Credential fields are write-only: an empty
// field keeps what is stored, and a stored value is never shown here.
export default function ItemForm({
  item,
  defaultCategory,
  focus,
  onCancel,
  onSaved,
  onConflict,
}: {
  item: ConsoleListItem | null;
  defaultCategory: string;
  focus?: FormFocus;
  onCancel: () => void;
  onSaved: (item: ConsoleListItem, isNew: boolean) => void;
  onConflict: (latest: ConsoleListItem) => void;
}) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const isNew = !item;
  const choices = useMemo(() => categoryChoices(app.categories), [app.categories]);
  const meOwner = { name: app.me.name, email: app.me.email };

  const [category, setCategory] = useState(item?.category ?? defaultCategory);
  const [title, setTitle] = useState(item?.title ?? '');
  const [url, setUrl] = useState(item?.url ?? '');
  const [desc, setDesc] = useState(item?.description ?? '');
  const seq = useRef(0);
  const [links, setLinks] = useState<LinkRow[]>(() =>
    (item?.links ?? []).map((l) => ({ key: seq.current++, label: l.label, url: l.url, orig: { label: l.label, label_en: l.label_en } }))
  );
  const [loginId, setLoginId] = useState('');
  const [pw, setPw] = useState('');
  const [pwShown, setPwShown] = useState(false);
  const [clearPw, setClearPw] = useState(false);
  const [more, setMore] = useState(focus === 'owner');
  const [type, setType] = useState<ConsoleItemType>(item?.type ?? 'link');
  const [team, setTeam] = useState<ConsoleTeam>(item?.team ?? app.me.team);
  // A name round-trips only when the people list maps it back to the same email; otherwise the email is shown.
  const [owners, setOwners] = useState(() =>
    (item ? item.owners : [meOwner])
      .map((o) => (o.email && !app.people.some((p) => p.name === o.name && p.email.toLowerCase() === o.email!.toLowerCase()) ? o.email : o.name))
      .join(', ')
  );
  const [tags, setTags] = useState((item?.tags ?? []).join(', '));
  const [access, setAccess] = useState<ConsoleAccessMethod>(item?.access_method ?? 'public');
  // 링크일 때의 형식·접속 방식 기억 (CS2-D12). 공유 계정으로 갈 때 갱신하고 링크로 돌아올 때 되살린다.
  const [linkMemory, setLinkMemory] = useState(() => linkMemoryFor(item));
  const [hidePw, setHidePw] = useState(item?.hide_password ?? false);
  const [askDel, setAskDel] = useState(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const [vis, setVis] = useState<ConsoleVisibility>(item?.visibility ?? '전체');
  const [note, setNote] = useState(item?.note ?? '');
  const [titleEn, setTitleEn] = useState(item?.title_en ?? '');
  const [descEn, setDescEn] = useState(item?.description_en ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<ConsoleListItem | null>(null);
  const [dup, setDup] = useState<ConsoleListItem | null>(null);

  const refs = {
    title: useRef<HTMLInputElement>(null),
    url: useRef<HTMLInputElement>(null),
    owner: useRef<HTMLInputElement>(null),
    id: useRef<HTMLInputElement>(null),
    pw: useRef<HTMLInputElement>(null),
  };
  const addLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const target = focus ?? (item && !item.url ? 'url' : 'title');
    const el = refs[target === 'title' ? 'title' : target].current;
    el?.focus({ preventScroll: true });
    // focus once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDup = (raw: string) => {
    const nu = normUrl(raw);
    const k = nu ? urlKey(nu) : '';
    setDup((k && app.items.find((x) => x.id !== item?.id && x.url && urlKey(x.url) === k)) || null);
  };
  useEffect(() => {
    if (item) checkDup(item.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kind = kindOf({ access_method: access });
  const shared = kind === 'shared';
  const chooseKind = (k: ItemKind) => {
    if (k === kind) return;
    const r = applyKind({ type, access_method: access }, k, linkMemory);
    setType(r.state.type);
    setAccess(r.state.access_method);
    setLinkMemory(r.memory);
  };

  const pickCategory = async (v: string) => {
    if (v !== NEW_CATEGORY) {
      setCategory(v);
      return;
    }
    // 선택값은 그대로 두고 분류 대화상자를 연다. 추가되면 새 분류, 취소하면 이전 분류 (REQ-CS2-012).
    const id = await app.addCategory();
    if (id) setCategory(id);
  };

  const makePassword = () => {
    setPw(generatePassword());
    setPwShown(true);
    setClearPw(false);
    app.toast(t('pwGenerated'));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    const tt = title.trim();
    if (!tt) errs.title = t('errTitle');
    const nu = normUrl(url);
    if (nu === null) errs.url = t('errUrl');
    const outLinks: { label: string; label_en: string; url: string }[] = [];
    for (const r of links) {
      const label = r.label.trim();
      const raw = r.url.trim();
      if (!label && !raw) continue;
      const lu = normUrl(raw);
      if (!raw || !lu) {
        errs.links = t('errUrl');
        continue;
      }
      outLinks.push({ label: label || hostOf(lu), label_en: r.orig && r.orig.label === label ? r.orig.label_en : '', url: lu });
    }
    const ownerList = ownersFromText(owners, app.people);
    if (item && !app.me.isAdmin && !isMine({ owners: ownerList }, app.me.email)) errs.owners = t('errOwnerSelf');
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.owners) setMore(true);
      const first = errs.title ? refs.title : errs.url ? refs.url : errs.owners ? refs.owner : null;
      first?.current?.focus();
      return;
    }
    setErrors({});
    const finalUrl = nu ?? '';
    const status = !finalUrl ? (item && !item.url ? item.status : 'needs-url') : !item || item.status === 'needs-url' ? 'ok' : item.status;
    const noteT = note.trim();
    const body: Record<string, unknown> = {
      category,
      type,
      status,
      access_method: access,
      visibility: vis,
      team,
      owners: ownerList,
      url: finalUrl,
      title: tt,
      title_en: titleEn.trim(),
      description: desc.trim(),
      description_en: descEn.trim(),
      tags: tags
        .split(/[,，]/)
        .map((x) => x.trim())
        .filter(Boolean),
      links: outLinks,
      note: noteT,
      note_en: item && item.note === noteT ? item.note_en ?? '' : '',
      hide_password: shared ? hidePw : false,
    };
    if (shared) {
      if (loginId.trim()) body.login_id = loginId.trim();
      if (pw) body.password = pw;
      else if (clearPw) body.clearPassword = true;
    }
    if (item) body.version = item.version;
    // 저장된 계정 정보가 있는 항목을 링크로 저장하면 서버가 그 정보를 지운다. 요청 전에 묻는다 (CS2-D11).
    if (needsCredDeleteConfirm(item, kind)) {
      pending.current = body;
      setAskDel(true);
      return;
    }
    void send(body);
  };

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    const r = item
      ? await api<{ item: ConsoleListItem }>('PATCH', `/api/console/items/${encodeURIComponent(item.id)}`, body)
      : await api<{ item: ConsoleListItem }>('POST', '/api/console/items', body);
    setBusy(false);
    if (r.ok) {
      onSaved(r.data.item, isNew);
      return;
    }
    if (r.status === 409 && r.data.item) {
      // Keep the typed values on screen; the reload button swaps in the latest version.
      setConflict(r.data.item);
      return;
    }
    const next: Errors = {};
    for (const er of r.data.errors ?? []) {
      if (er.field === 'title') next.title = t('errTitle');
      else if (er.field === 'url') next.url = t('errUrl');
      else if (er.field === 'links') next.links = t('errUrl');
      else if (er.field === 'owners') next.owners = er.reason === 'self_removal' ? t('errOwnerSelf') : t('errOwners');
    }
    if (next.owners) setMore(true);
    if (r.status === 503 && r.data.error === 'credentials_not_configured') next.form = t('credNotConfigured');
    else if (r.status === 403) next.form = t('editNoOwner');
    else if (r.status === 0) next.form = t('errNetwork');
    else if (!Object.keys(next).length) next.form = t('errSave');
    setErrors(next);
  };

  const pwState = clearPw ? t('pwCleared') : item?.hasPassword ? t('pwKeep') : '';

  const catField = (
    <Field id="f-cat" label={t('fCat')}>
      <select id="f-cat" className={s.input} value={category} onChange={(e) => void pickCategory(e.target.value)}>
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {categoryName(lang, c, true)}
          </option>
        ))}
        {app.me.isAdmin ? <option value={NEW_CATEGORY}>{t('newCategory')}</option> : null}
      </select>
    </Field>
  );

  const urlField = (
    <Field
      id="f-url"
      label={shared ? t('fLoginUrl') : t('fUrl')}
      hint={t('fUrlHint')}
      err={errors.url}
      after={
        dup ? (
          <div className={s.dup} aria-live="polite">
            <Icon name="info" size={16} />
            <span>{t('dupUrl')}</span>
            <button type="button" className={s.linkbtn} onClick={() => app.openDetail(dup.id)}>
              {t('dupSee', { t: L(dup, 'title') })}
            </button>
          </div>
        ) : null
      }
    >
      <input
        id="f-url"
        ref={refs.url}
        className={s.input}
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={2000}
        spellCheck={false}
        autoComplete="off"
        value={url}
        aria-invalid={errors.url ? true : undefined}
        aria-describedby="f-url-hint f-url-err"
        onChange={(e) => setUrl(e.target.value)}
        onBlur={(e) => checkDup(e.target.value)}
      />
    </Field>
  );

  const descField = (
    <Field id="f-desc" label={shared ? t('fMemo') : t('fDesc')} hint={shared ? t('fMemoHint') : undefined}>
      <textarea
        id="f-desc"
        className={s.input}
        rows={2}
        maxLength={500}
        value={desc}
        aria-describedby={shared ? 'f-desc-hint' : undefined}
        onChange={(e) => setDesc(e.target.value)}
      />
    </Field>
  );

  const linksField = (
    <div className={s.field} role="group" aria-labelledby="f-links-l">
      <span className={s.lblT} id="f-links-l">
        {t('fLinks')}
      </span>
      <p className={s.fHint}>{t('fLinksHint')}</p>
      <div className={s.lrows}>
        {links.map((r, i) => (
          <div key={r.key} className={s.lrow}>
            <input
              className={s.input}
              type="text"
              autoComplete="off"
              maxLength={80}
              placeholder={t('fLinkLabel')}
              aria-label={`${t('fLinks')} · ${t('fLinkLabel')}`}
              value={r.label}
              onChange={(e) => setLinks((ls) => ls.map((x) => (x.key === r.key ? { ...x, label: e.target.value } : x)))}
            />
            <input
              className={cx(s.input, s.lUrl)}
              type="url"
              inputMode="url"
              maxLength={2000}
              placeholder="https://"
              spellCheck={false}
              aria-label={`${t('fLinks')} · ${t('fLinkUrl')}`}
              value={r.url}
              onChange={(e) => setLinks((ls) => ls.map((x) => (x.key === r.key ? { ...x, url: e.target.value } : x)))}
            />
            <span className={s.bslot}>
              <button
                type="button"
                className={s.ibtn}
                aria-label={t('rmLink')}
                title={t('rmLink')}
                onClick={() => {
                  setLinks((ls) => ls.filter((x) => x.key !== r.key));
                  if (links.length <= 1 || i === links.length - 1) addLinkRef.current?.focus();
                }}
              >
                <Icon name="close" />
              </button>
            </span>
          </div>
        ))}
      </div>
      <p className={s.err}>{errors.links ?? ''}</p>
      <button
        ref={addLinkRef}
        type="button"
        className={cx(s.linkbtn, s.moreTg)}
        disabled={links.length >= 20}
        onClick={() => setLinks((ls) => [...ls, { key: seq.current++, label: '', url: '' }])}
      >
        <Icon name="plus" size={16} />
        {t('addLink')}
      </button>
    </div>
  );

  // 공유 계정 칸 (REQ-CS2-010). 브라우저 비밀번호 관리자가 채우거나 저장하지 않도록 칸마다 속성을 단다 (REQ-CS2-020).
  const credFields = (
    <>
      <Field id="f-id" label={t('fId')} hint={item?.hasLoginId ? t('idKeep') : undefined}>
        <input
          id="f-id"
          ref={refs.id}
          className={s.input}
          type="text"
          maxLength={200}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          placeholder={item?.hasLoginId ? MASK : ''}
          value={loginId}
          aria-describedby={item?.hasLoginId ? 'f-id-hint' : undefined}
          onChange={(e) => setLoginId(e.target.value)}
        />
      </Field>
      <Field
        id="f-pw"
        label={t('fPw')}
        hint={t('pwHint')}
        after={
          pw ? null : (
            <div className={s.pwLine}>
              {pwState ? (
                <p className={s.fHint} id="f-pw-state">
                  {pwState}
                </p>
              ) : null}
              {item?.hasPassword ? (
                <button type="button" className={cx(s.linkbtn, s.danger)} onClick={() => setClearPw((v) => !v)}>
                  {clearPw ? t('pwUndoClear') : t('pwClear')}
                </button>
              ) : null}
            </div>
          )
        }
      >
        <div className={s.pwWrap}>
          <input
            id="f-pw"
            ref={refs.pw}
            className={s.input}
            type={pwShown ? 'text' : 'password'}
            autoComplete="new-password"
            data-1p-ignore=""
            data-lpignore="true"
            maxLength={500}
            spellCheck={false}
            autoCapitalize="off"
            placeholder={item?.hasPassword && !clearPw ? MASK : ''}
            value={pw}
            aria-describedby="f-pw-hint f-pw-state"
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            type="button"
            className={s.ibtn}
            aria-label={pwShown ? t('hidePw') : t('showPw')}
            title={pwShown ? t('hidePw') : t('showPw')}
            aria-pressed={pwShown}
            aria-controls="f-pw"
            onClick={() => setPwShown((v) => !v)}
          >
            <Icon name={pwShown ? 'eyeOff' : 'eye'} />
          </button>
          <button type="button" className={s.ibtn} aria-label={t('genPw')} title={t('genPw')} aria-controls="f-pw" onClick={makePassword}>
            <Icon name="sparkles" />
          </button>
        </div>
      </Field>
    </>
  );

  const shareFields = (
    <>
      <div className={s.field}>
        <span className={s.lblT} id="f-share-l">
          {t('share.label')}
        </span>
        <div className={s.radios} role="radiogroup" aria-labelledby="f-share-l">
          {SHARE_TARGETS.map(([v, key]) => (
            <label key={v} className={s.radio}>
              <input type="radio" name="f-share" value={v} checked={vis === v} onChange={() => setVis(v)} />
              <span>{v === '팀' ? t('share.teamX', { team: t(`teams.${team}`) }) : t(key)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className={s.field}>
        <div className={s.check}>
          <input type="checkbox" id="f-hide" checked={hidePw} aria-describedby="f-hide-hint" onChange={(e) => setHidePw(e.target.checked)} />
          <label htmlFor="f-hide">{t('hidePwLabel')}</label>
        </div>
        <p className={s.fHint} id="f-hide-hint">
          {t('hidePwHint')}
        </p>
      </div>
    </>
  );

  return (
    <>
      <PanelHead url={item?.url ?? ''} title={isNew ? t('formAdd') : t('formEdit')} onClose={onCancel} plus={isNew} />
      <div className={s.pnBody}>
        <form id="item-form" className={s.form} noValidate onSubmit={submit}>
          {conflict ? (
            <div className={s.formErr} role="alert">
              <p>{t('conflict')}</p>
            </div>
          ) : null}
          {errors.form ? (
            <p className={s.formErr} role="alert">
              {errors.form}
            </p>
          ) : null}
          <KindControl kind={kind} onChange={chooseKind} />
          {catField}
          <Field id="f-title" label={t('fTitle')} err={errors.title}>
            <input
              id="f-title"
              ref={refs.title}
              className={s.input}
              type="text"
              autoComplete="off"
              maxLength={200}
              value={title}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby="f-title-err"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          {urlField}
          {shared ? (
            <div className={s.cred}>
              <div className={s.credH}>
                <Icon name="key" size={16} />
                {t('fCred')}
              </div>
              {credFields}
            </div>
          ) : null}
          {descField}
          {shared ? shareFields : linksField}

          <button type="button" className={cx(s.btn, s.ghost, s.moreTg)} aria-expanded={more} aria-controls="f-more" onClick={() => setMore((v) => !v)}>
            <span>{more ? t('fLess') : t('fMore')}</span>
            <Icon name="chevron" size={16} />
          </button>
          <div className={s.form} id="f-more" hidden={!more}>
            {shared ? linksField : null}
            <div className={s.row2}>
              <Field id="f-type" label={t('fType')}>
                <select id="f-type" className={s.input} value={type} onChange={(e) => setType(e.target.value as ConsoleItemType)}>
                  {CONSOLE_ITEM_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {t(`types.${v}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="f-team" label={t('fTeam')}>
                <select id="f-team" className={s.input} value={team} onChange={(e) => setTeam(e.target.value as ConsoleTeam)}>
                  {CONSOLE_TEAMS.map((v) => (
                    <option key={v} value={v}>
                      {t(`teams.${v}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field id="f-owner" label={t('fOwner')} hint={t('fOwnerHint')} err={errors.owners}>
              <input
                id="f-owner"
                ref={refs.owner}
                className={s.input}
                type="text"
                autoComplete="off"
                maxLength={600}
                list="f-people"
                value={owners}
                aria-invalid={errors.owners ? true : undefined}
                aria-describedby="f-owner-hint f-owner-err"
                onChange={(e) => setOwners(e.target.value)}
              />
            </Field>
            <datalist id="f-people">
              {app.people.map((p) => (
                <option key={p.email} value={p.name}>
                  {p.email}
                </option>
              ))}
            </datalist>
            <Field id="f-tags" label={t('fTags')} hint={t('fTagsHint')}>
              <input id="f-tags" className={s.input} type="text" autoComplete="off" maxLength={900} value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            {shared ? null : (
              <div className={s.row2}>
                <Field id="f-access" label={t('fAccessF')}>
                  <select id="f-access" className={s.input} value={access} onChange={(e) => setAccess(e.target.value as ConsoleAccessMethod)}>
                    {LINK_ACCESS_METHODS.map((v) => (
                      <option key={v} value={v}>
                        {`${t(`access.${v}`)} — ${t(`legend.${v}`)}`}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="f-vis" label={t('fVis')}>
                  <select id="f-vis" className={s.input} value={vis} onChange={(e) => setVis(e.target.value as ConsoleVisibility)}>
                    {CONSOLE_VISIBILITIES.map((v) => (
                      <option key={v} value={v}>
                        {t(`vis.${v}`)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <Field id="f-note" label={t('fNote')} hint={t('fNoteHint')}>
              <textarea id="f-note" className={s.input} rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field id="f-title-en" label={t('fTitleEn')} hint={t('fEnHint')}>
              <input id="f-title-en" className={s.input} type="text" lang="en" autoComplete="off" maxLength={200} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </Field>
            <Field id="f-desc-en" label={t('fDescEn')}>
              <textarea id="f-desc-en" className={s.input} rows={2} lang="en" maxLength={500} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
            </Field>
          </div>
        </form>
      </div>
      <div className={s.pnFoot}>
        <div className={s.left}>
          {conflict ? (
            <button type="button" className={cx(s.btn, s.ghost)} onClick={() => onConflict(conflict)} data-reload="true">
              {t('conflictReload')}
            </button>
          ) : null}
        </div>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={onCancel}>
          {t('cancel')}
        </button>
        <button type="submit" form="item-form" className={cx(s.btn, s.primary)} disabled={busy}>
          {busy ? t('saving') : t('save')}
        </button>
      </div>
      {askDel ? (
        <Dialog title={t('credDel.title')} onClose={() => setAskDel(false)}>
          <p className={s.dlgP}>{t('credDel.body')}</p>
          <div className={s.dlgFoot}>
            <button type="button" className={cx(s.btn, s.ghost)} onClick={() => setAskDel(false)}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className={cx(s.btn, s.dangerSolid)}
              onClick={() => {
                const body = pending.current;
                pending.current = null;
                setAskDel(false);
                if (body) void send(body);
              }}
            >
              {t('credDel.ok')}
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
