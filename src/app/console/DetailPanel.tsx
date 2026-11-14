'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import { absTime, hostOf, ownersText, relTime, safeUrl } from '@/lib/console/ui-model';
import { revealCredential, type CredentialField } from './api';
import { useApp } from './app-context';
import { AccTag } from './HomeView';
import { BrandMark, Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

const MASK = '••••••••';

export function PanelHead({ url, title, onClose, plus }: { url: string; title: string; onClose: () => void; plus?: boolean }) {
  const { t } = useUi();
  const ref = useRef<HTMLHeadingElement>(null);
  return (
    <div className={s.pnHead}>
      {plus ? <Icon name="plus" size={22} /> : <BrandMark url={url} title={title} size={24} />}
      <h2 id="pn-title" ref={ref} tabIndex={-1}>
        {title}
      </h2>
      <button type="button" className={s.ibtn} aria-label={t('close')} title={t('close')} onClick={onClose}>
        <Icon name="close" className={s.iClose} />
        <Icon name="back" className={s.iBack} />
      </button>
    </div>
  );
}

function VRow({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.vrow}>
      <div className={s.vtext}>
        <span className={s.vlabel}>{label}</span>
        {value}
      </div>
      {children}
    </div>
  );
}

/**
 * One TeamPass-style secret row (REQ-CON-016/017, AC-CON-009). Masked by default; the eye asks the
 * server for the value (purpose "view") and keeps it only in this component's state; copy asks
 * again with purpose "copy". Nothing is requested until a button is pressed, and the value is
 * dropped when the panel closes or shows another item (the component unmounts).
 */
function SecretRow({ item, field, editable }: { item: ConsoleListItem; field: CredentialField; editable: boolean }) {
  const { t } = useUi();
  const app = useApp();
  const [value, setValue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isPw = field === 'password';
  const present = isPw ? item.hasPassword : item.hasLoginId;

  const fail = (status: number, error?: string) => {
    const key =
      status === 403 ? 'forbidden' : status === 429 ? 'rate_limited' : error === 'not_set' ? 'not_set' : status === 503 ? 'unavailable' : 'failed';
    app.toast(t(`credErr.${key}`));
  };

  if (!present) {
    return (
      <VRow label={isPw ? t('pPw') : t('pUser')} value={<span className={cx(s.vval, s.none)}>{isPw ? t('pwNone') : t('idNone')}</span>}>
        {editable ? (
          <button type="button" className={cx(s.btn, s.xs, s.ghost)} onClick={() => app.requestEdit(item.id, isPw ? 'pw' : 'id')}>
            {t('enterIt')}
          </button>
        ) : null}
      </VRow>
    );
  }

  const toggle = async () => {
    if (value !== null) {
      setValue(null);
      return;
    }
    setBusy(true);
    const r = await revealCredential(item.id, field, 'view');
    setBusy(false);
    if (r.ok) setValue(r.data.value);
    else fail(r.status, r.data.error);
  };
  const copy = async () => {
    setBusy(true);
    const r = await revealCredential(item.id, field, 'copy');
    setBusy(false);
    if (r.ok) app.copyText(r.data.value, isPw ? t('pwCopied') : t('idCopied'));
    else fail(r.status, r.data.error);
  };
  const shown = value !== null;
  const eyeLabel = isPw ? (shown ? t('hidePw') : t('showPw')) : shown ? t('hideId') : t('showId');
  const copyLabel = isPw ? t('copyPw') : t('copyId');

  return (
    <VRow label={isPw ? t('pPw') : t('pUser')} value={<span className={cx(s.vval, s.mono)}>{shown ? value : MASK}</span>}>
      <button type="button" className={s.ibtn} aria-label={eyeLabel} title={eyeLabel} aria-pressed={shown} disabled={busy} onClick={() => void toggle()}>
        <Icon name={shown ? 'eyeOff' : 'eye'} />
      </button>
      <button type="button" className={s.ibtn} aria-label={copyLabel} title={copyLabel} disabled={busy} onClick={() => void copy()}>
        <Icon name="copy" />
      </button>
    </VRow>
  );
}

function CredentialBlock({ item }: { item: ConsoleListItem }) {
  const { lang, t } = useUi();
  const app = useApp();
  const href = safeUrl(item.url);
  const owners = ownersText(item.owners ?? [], app.people, lang) || t('anAdmin');
  return (
    <section className={s.pnSec}>
      <h3 className={s.pnLabel}>{t('pAccount')}</h3>
      <div className={s.vault}>
        {item.credAccess === 'ok' ? (
          <>
            <SecretRow item={item} field="login_id" editable={item.canEdit} />
            <SecretRow item={item} field="password" editable={item.canEdit} />
          </>
        ) : (
          <div className={s.credLock}>
            <Icon name="lock" size={16} />
            <span>{t('credDenied', { v: t(`vis.${item.visibility}`), o: owners })}</span>
          </div>
        )}
        <VRow label={t('pUrl')} value={<span className={cx(s.vval, !href && s.none)} title={href ? item.url : undefined}>{href ? item.url : t('noUrl')}</span>}>
          {href ? (
            <button type="button" className={s.ibtn} aria-label={t('copyUrl')} title={t('copyUrl')} onClick={() => app.copyText(item.url, t('copied'))}>
              <Icon name="copy" />
            </button>
          ) : null}
        </VRow>
        <VRow
          label={t('pLastUp')}
          value={
            <span className={s.vval} title={absTime(lang, item.updatedAt)}>
              {`${relTime(lang, item.updatedAt)} · ${item.updatedBy || t('seedImport')}`}
            </span>
          }
        />
      </div>
      {item.credAccess === 'ok' && !item.canEdit && (!item.hasPassword || !item.hasLoginId) ? <p className={s.fine}>{t('pwLater')}</p> : null}
      <p className={s.fine}>{t('credFine')}</p>
    </section>
  );
}

function Actions({ item }: { item: ConsoleListItem }) {
  const { t, L } = useUi();
  const app = useApp();
  const [confirming, setConfirming] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);
  const delRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirming) noRef.current?.focus();
    else if (wasConfirming.current) delRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);
  const title = L(item, 'title');
  const href = safeUrl(item.url);
  if (confirming) {
    return (
      <div
        className={s.pnActions}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }
        }}
      >
        <div className={s.confirm} role="group" aria-label={t('delAsk')}>
          <span>{t('delAsk')}</span>
          <button type="button" className={cx(s.btn, s.dangerSolid)} onClick={() => void app.deleteItem(item.id)}>
            <Icon name="trash" size={16} />
            {t('del')}
          </button>
          <button ref={noRef} type="button" className={cx(s.btn, s.ghost)} onClick={() => setConfirming(false)}>
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={s.pnActions}>
      {href ? (
        <a className={cx(s.btn, s.primary)} href={href} target="_blank" rel="noopener noreferrer" aria-label={t('openX', { t: title })}>
          {t('open')}
          <Icon name="external" size={15} />
        </a>
      ) : null}
      <button type="button" className={cx(s.btn, s.ghost)} onClick={() => app.requestEdit(item.id)}>
        <Icon name="edit" size={16} />
        {t('edit')}
      </button>
      {item.canEdit ? (
        <button ref={delRef} type="button" className={cx(s.btn, s.ghost, s.danger)} onClick={() => setConfirming(true)}>
          <Icon name="trash" size={16} />
          {t('del')}
        </button>
      ) : null}
    </div>
  );
}

// Right-side detail panel (REQ-CON-020). Mounted with key=item.id, so revealed values never carry
// over to another item.
export default function DetailPanel({ item, onClose }: { item: ConsoleListItem; onClose: () => void }) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const title = L(item, 'title');
  const href = safeUrl(item.url);
  const shared = item.access_method === 'shared-credential';
  const owners = ownersText(item.owners ?? [], app.people, lang);
  const desc = L(item, 'description');
  const note = L(item, 'note');
  const links = (item.links ?? []).filter((l) => safeUrl(l.url));
  const accNote = t(`accNote.${item.access_method}`, { o: owners || t('anAdmin') });

  return (
    <>
      <PanelHead url={item.url} title={title} onClose={onClose} />
      <div className={s.pnBody}>
        <div className={s.pnMeta}>
          <AccTag item={item} />
          <span className={s.tag}>{t(`teams.${item.team}`)}</span>
          {!item.url ? (
            <span className={cx(s.flag, s.warn)}>
              <span className={s.dot} aria-hidden="true" />
              {t('noUrl')}
            </span>
          ) : null}
          {item.status === 'planned' ? <span className={s.flag}>{t('flagPlanned')}</span> : null}
        </div>
        <Actions item={item} />
        {desc ? <p className={s.pnDesc}>{desc}</p> : null}
        {shared ? (
          <CredentialBlock item={item} />
        ) : href ? (
          <div className={s.addr}>
            <div className={s.vtext}>
              <span className={s.vlabel}>{t('pAddress')}</span>
              <span className={s.vval} title={item.url}>
                {item.url}
              </span>
            </div>
            <button type="button" className={s.ibtn} aria-label={t('copyUrl')} title={t('copyUrl')} onClick={() => app.copyText(item.url, t('copied'))}>
              <Icon name="copy" />
            </button>
          </div>
        ) : null}
        {!href ? (
          <div className={s.miss}>
            <span>{t('noUrlBox')}</span>
            {item.canEdit ? (
              <button type="button" className={cx(s.btn, s.ghost)} onClick={() => app.requestEdit(item.id, 'url')}>
                {t('fillUrl')}
              </button>
            ) : null}
          </div>
        ) : null}
        <dl className={s.info}>
          <dt>{t('pOwner')}</dt>
          <dd>{owners || t('noOwner')}</dd>
          <dt>{t('pTeam')}</dt>
          <dd>{t(`teams.${item.team}`)}</dd>
          {shared ? null : (
            <>
              <dt>{t('pUpdated')}</dt>
              <dd title={absTime(lang, item.updatedAt)}>{`${relTime(lang, item.updatedAt)} · ${item.updatedBy || t('seedImport')}`}</dd>
            </>
          )}
        </dl>
        {links.length ? (
          <section className={s.pnSec}>
            <h3 className={s.pnLabel}>{t('pLinks')}</h3>
            <ul className={s.links}>
              {links.map((l, i) => (
                <li key={`${i}-${l.url}`}>
                  <a href={safeUrl(l.url)!} target="_blank" rel="noopener noreferrer">
                    <BrandMark url={l.url} title={L(l, 'label')} size={18} />
                    <span className={s.lT}>
                      <span className={s.lN}>{L(l, 'label') || hostOf(l.url)}</span>
                      <span className={s.lH}>{hostOf(l.url)}</span>
                    </span>
                    <Icon name="external" size={15} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className={s.pnSec}>
          <h3 className={s.pnLabel}>{t('pHow')}</h3>
          <div className={s.how}>
            <p>{accNote}</p>
          </div>
        </section>
        {note && item.canEdit ? (
          <section className={s.pnSec}>
            <h3 className={s.pnLabel}>{t('pNote')}</h3>
            <p className={s.note}>{note}</p>
          </section>
        ) : null}
      </div>
    </>
  );
}
