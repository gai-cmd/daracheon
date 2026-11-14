'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

// Native modal <dialog>, rendered inside the console root (design.md §6.2: no portal). Toasts are
// passed in as `overlay` while a dialog is open, because the top layer would hide the root's own.
export default function Dialog({
  title,
  onClose,
  wide,
  children,
  overlay,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const { t } = useUi();
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    // A queued 'close' from an earlier close() (e.g. a dev remount) is ignored while the dialog is open.
    const onCloseEvt = () => {
      if (!d.open) closeRef.current();
    };
    d.addEventListener('close', onCloseEvt);
    return () => {
      d.removeEventListener('close', onCloseEvt);
      if (d.open) d.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={cx(s.dlg, wide && s.wide)}
      aria-labelledby="dlg-title"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className={s.dlgIn}>
        <button type="button" className={cx(s.ibtn, s.dlgX)} aria-label={t('close')} title={t('close')} onClick={() => ref.current?.close()}>
          <Icon name="close" />
        </button>
        <h2 id="dlg-title" className={s.dlgT}>
          {title}
        </h2>
        {children}
      </div>
      {overlay}
    </dialog>
  );
}
