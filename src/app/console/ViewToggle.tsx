'use client';

import { useRef } from 'react';
import type { ViewMode } from '@/lib/console/ui-model';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { nextInGroup } from './radio-keys';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

const MODES = ['list', 'cards'] as const;

/**
 * 보기 방식 목록 | 카드 (SPEC-CONSOLE-002 REQ-CS2-022). radiogroup, 선택된 쪽만 탭 순서에 있고 화살표·Home·End 로
 * 옮긴다. 너비를 고정해 바꿔도 목록 머리가 움직이지 않는다.
 */
export default function ViewToggle() {
  const { t } = useUi();
  const app = useApp();
  const refs = { list: useRef<HTMLButtonElement>(null), cards: useRef<HTMLButtonElement>(null) };
  const pick = (m: ViewMode, focus: boolean) => {
    app.setViewMode(m);
    if (focus) refs[m].current?.focus();
  };
  return (
    <div
      className={cx(s.seg, s.viewSeg)}
      role="radiogroup"
      aria-label={t('view.label')}
      onKeyDown={(e) => {
        const next = nextInGroup(e, app.viewMode, MODES);
        if (next) pick(next, true);
      }}
    >
      {MODES.map((m) => (
        <button
          key={m}
          ref={refs[m]}
          type="button"
          role="radio"
          aria-checked={app.viewMode === m}
          tabIndex={app.viewMode === m ? 0 : -1}
          title={t(`view.${m}`)}
          onClick={() => pick(m, false)}
        >
          <Icon name={m === 'list' ? 'list' : 'grid'} size={15} />
          <span>{t(`view.${m}`)}</span>
        </button>
      ))}
    </div>
  );
}
