'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import { absTime, hasCredential, hostOf, ownersText, relTime, safeUrl } from '@/lib/console/ui-model';
import { fetchActivity, revealCredential, type ActivityEvent, type CredentialField } from './api';
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
 * One TeamPass-style secret row (REQ-CON-016/017, AC-CON-009; SPEC-CONSOLE-002 REQ-CS2-013). Masked by
 * default; the eye asks the server for the value (purpose "view") and keeps it only in this component's
 * state; copy asks again with purpose "copy" and writes straight to the clipboard without rendering it or
 * keeping it in state. The eye is not offered for the password while the item hides it from this viewer.
 * Nothing is requested until a button is pressed, and the value is dropped when the panel closes or
 * shows another item (the component unmounts).
 */
function SecretRow({ item, field }: { item: ConsoleListItem; field: CredentialField }) {
  const { t } = useUi();
  const app = useApp();
  const [value, setValue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isPw = field === 'password';
  const present = isPw ? item.hasPassword : item.hasLoginId;
  const label = isPw ? t('card.pw') : t('card.id');
  // 서버도 같은 조건에서 보기를 거절한다 (REQ-CS2-004). 편집 권한자 = 관리자 또는 담당자 (CS2-D2).
  const viewHidden = isPw && item.hide_password && !item.canEdit;

  if (!present) {
    return (
      <VRow label={label} value={<span className={cx(s.vval, s.none)}>{isPw ? t('pwNone') : t('idNone')}</span>}>
        {item.canEdit ? (
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
    else app.toast(t(`credErr.${credErrKey(r.status, r.data.error)}`));
  };
  const copy = async () => {
    setBusy(true);
    const r = await revealCredential(item.id, field, 'copy');
    setBusy(false);
    if (!r.ok) {
      app.toast(t(`credErr.${credErrKey(r.status, r.data.error)}`));
      return;
    }
    const ok = await app.writeClipboard(r.data.value);
    app.toast(ok ? (isPw ? t('card.pwCopied') : t('card.idCopied')) : t('copyFail'));
  };
  const shown = value !== null;
  const eyeLabel = isPw ? (shown ? t('card.hidePw') : t('card.showPw')) : shown ? t('card.hideId') : t('card.showId');
  const copyLabel = isPw ? t('card.copyPw') : t('card.copyId');

  return (
    <VRow label={label} value={<span className={cx(s.vval, s.mono)}>{shown ? value : MASK}</span>}>
      {viewHidden ? null : (
        <button type="button" className={s.ibtn} aria-label={eyeLabel} title={eyeLabel} aria-pressed={shown} disabled={busy} onClick={() => void toggle()}>
          <Icon name={shown ? 'eyeOff' : 'eye'} />
        </button>
      )}
      <button type="button" className={s.ibtn} aria-label={copyLabel} title={copyLabel} disabled={busy} onClick={() => void copy()}>
        <Icon name="copy" />
      </button>
    </VRow>
  );
}

function credErrKey(status: number, error?: string): string {
  return status === 403 ? 'forbidden' : status === 429 ? 'rate_limited' : error === 'not_set' ? 'not_set' : status === 503 ? 'unavailable' : 'failed';
}

/** 이 항목의 최근 자격증명 사건 (REQ-CS2-016). 편집 권한자에게만 그리고, 펼칠 때 한 번 불러온다 (CS2-D9). */
function Activity({ item }: { item: ConsoleListItem }) {
  const { lang, t } = useUi();
  const [state, setState] = useState<'idle' | 'loading' | 'error' | ActivityEvent[]>('idle');
  const asked = useRef(false);
  const load = () => {
    if (asked.current) return;
    asked.current = true;
    setState('loading');
    void fetchActivity(item.id).then((r) => {
      if (r.ok) setState(r.data.events ?? []);
      else {
        asked.current = false;
        setState('error');
      }
    });
  };
  return (
    <details className={s.activity} onToggle={(e) => (e.currentTarget.open ? load() : undefined)}>
      <summary>
        <Icon name="list" size={16} />
        <span>{t('card.activity')}</span>
        <Icon name="chevron" size={14} className={s.actChev} />
      </summary>
      {state === 'loading' || state === 'idle' ? (
        <p className={s.fine}>{t('card.activityLoading')}</p>
      ) : state === 'error' ? (
        <p className={s.fine} role="alert">
          {t('card.activityFail')}
        </p>
      ) : !state.length ? (
        <p className={s.fine}>{t('card.activityEmpty')}</p>
      ) : (
        <ul className={s.actList}>
          {state.map((ev, i) => (
            <li key={`${ev.at}-${i}`}>
              <span className={s.actWho}>{ev.actor}</span>
              <span className={cx(s.actWhat, ev.action === 'deny' && s.danger)}>
                {t(`act.${ev.action}`)}
                {ev.field ? ` · ${ev.field === 'password' ? t('card.pw') : t('card.id')}` : ''}
              </span>
              <time className={s.actWhen} dateTime={ev.at} title={absTime(lang, ev.at)}>
                {relTime(lang, ev.at, true)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

function CredentialBlock({ item }: { item: ConsoleListItem }) {
  const { lang, t } = useUi();
  const app = useApp();
  const [opening, setOpening] = useState(false);
  const href = safeUrl(item.url);
  const owners = ownersText(item.owners ?? [], app.people, lang) || t('anAdmin');
  const ok = item.credAccess === 'ok';
  const stored = hasCredential(item);

  // @MX:NOTE: [AUTO] 순서가 규칙이다: 복사 → 빈 탭(noopener 없이 열어 null 여부로 차단 판단) → opener 끊기 → 이동.
  // 로그인 열기 (REQ-CS2-014, CS2-D8): 아이디 복사가 먼저(새 탭이 포커스를 가져가면 클립보드 쓰기가 거절됨),
  // 그다음 opener 없는 빈 탭을 열어 주소로 보낸다. 탭이 막히면 토스트 안 링크로 대신한다.
  const openLogin = async () => {
    if (!href) return;
    let msg = t('card.openedNoId');
    if (item.hasLoginId) {
      setOpening(true);
      const r = await revealCredential(item.id, 'login_id', 'copy');
      setOpening(false);
      if (r.ok) msg = (await app.writeClipboard(r.data.value)) ? t('card.idCopiedOpen') : t('copyFail');
      else msg = t(`credErr.${credErrKey(r.status, r.data.error)}`);
    }
    const w = window.open('', '_blank');
    if (w) {
      w.opener = null;
      w.location.replace(href);
    }
    app.toast(msg, w ? undefined : { href, hrefLabel: t('card.openLink') });
  };

  return (
    <section className={s.pnSec} data-cred-card="true">
      <h3 className={s.pnLabel}>{t('pAccount')}</h3>
      <div className={s.vault}>
        <VRow label={t('card.url')} value={<span className={cx(s.vval, !href && s.none)} title={href ? item.url : undefined}>{href ? item.url : t('noUrl')}</span>}>
          {href ? (
            <button type="button" className={s.ibtn} aria-label={t('card.copyUrl')} title={t('card.copyUrl')} onClick={() => app.copyText(item.url, t('copied'))}>
              <Icon name="copy" />
            </button>
          ) : null}
        </VRow>
        {!ok ? (
          <div className={s.credLock}>
            <Icon name="lock" size={16} />
            <span>{t('credDenied', { v: t(`vis.${item.visibility}`), o: owners })}</span>
          </div>
        ) : stored ? (
          <>
            <SecretRow item={item} field="login_id" />
            <SecretRow item={item} field="password" />
          </>
        ) : (
          <div className={s.credEmpty}>
            <span>{t('card.empty')}</span>
            {item.canEdit ? (
              <button type="button" className={cx(s.btn, s.xs, s.ghost)} onClick={() => app.requestEdit(item.id, 'id')}>
                {t('card.enterCred')}
              </button>
            ) : null}
          </div>
        )}
        <VRow
          label={t('pLastUp')}
          value={
            <span className={s.vval} title={absTime(lang, item.updatedAt)}>
              {`${relTime(lang, item.updatedAt)} · ${item.updatedBy || t('seedImport')}`}
            </span>
          }
        />
      </div>
      {ok ? (
        <div className={s.cardActs}>
          {stored && href ? (
            <button type="button" className={cx(s.btn, s.primary)} disabled={opening} onClick={() => void openLogin()}>
              <Icon name="external" size={15} />
              {t('card.openLogin')}
            </button>
          ) : null}
          <button type="button" className={s.linkbtn} onClick={app.openAutofillGuide}>
            {t('guide.menu')}
            <Icon name="chevron" size={14} className={s.chevR} />
          </button>
        </div>
      ) : null}
      {ok && stored && item.hide_password && !item.canEdit ? <p className={s.fine}>{t('card.hiddenNote')}</p> : null}
      {ok && stored && !item.canEdit && (!item.hasPassword || !item.hasLoginId) ? <p className={s.fine}>{t('pwLater')}</p> : null}
      <p className={s.fine}>{t('credFine')}</p>
      {item.canEdit ? <Activity item={item} /> : null}
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
