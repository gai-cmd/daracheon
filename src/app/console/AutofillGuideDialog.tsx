'use client';

import type { ReactNode } from 'react';
import { guideFor, type BrowserInfo } from '@/lib/console/browser-guide';
import Dialog from './Dialog';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

/**
 * 자동 입력 끄기 안내 (SPEC-CONSOLE-002 REQ-CS2-018/019, design.md §2.6). 이 사이트는 브라우저 설정을
 * 바꿀 수 없으므로, 그 브라우저의 끄는 순서를 보여 주고 데스크톱에서는 설정 주소를 복사해 줄 뿐이다
 * (웹 페이지는 chrome:// 같은 내부 주소로 이동할 수 없음). 닫기(X·Esc)는 "나중에"와 같다.
 */
export default function AutofillGuideDialog({
  info,
  onAck,
  onLater,
  onCopyAddress,
  busy,
  overlay,
}: {
  info: BrowserInfo;
  onAck: () => void;
  onLater: () => void;
  onCopyAddress: (address: string) => void;
  busy?: boolean;
  overlay?: ReactNode;
}) {
  const { t } = useUi();
  const g = guideFor(info);
  return (
    <Dialog title={t('guide.title')} onClose={onLater} overlay={overlay}>
      <div className={s.guide}>
        <p className={s.guideLead}>
          <Icon name="info" size={16} />
          <span>{t('guide.lead')}</span>
        </p>
        <p className={s.fine}>{t('guide.why')}</p>
        <h3 className={s.pnLabel}>{t('guide.forX', { b: t(g.nameKey) })}</h3>
        <ol className={s.guideSteps}>
          {g.steps.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
        {g.settingsUrl ? (
          <div className={s.guideAddr}>
            <span className={s.vtext}>
              <span className={s.vlabel}>{t('guide.addr')}</span>
              <code className={cx(s.vval, s.mono)}>{g.settingsUrl}</code>
            </span>
            <button type="button" className={cx(s.btn, s.primary)} onClick={() => onCopyAddress(g.settingsUrl!)}>
              <Icon name="copy" size={16} />
              {t('guide.open')}
            </button>
          </div>
        ) : null}
      </div>
      <div className={s.dlgFoot}>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={onLater}>
          {t('guide.later')}
        </button>
        <button type="button" className={cx(s.btn, s.primary)} disabled={busy} onClick={onAck}>
          {t('guide.ack')}
        </button>
      </div>
    </Dialog>
  );
}
