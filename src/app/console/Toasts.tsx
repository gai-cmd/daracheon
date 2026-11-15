'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ToastOptions } from './app-context';
import s from './console.module.css';
import { cx } from './cx';

export interface ToastItem extends ToastOptions {
  id: number;
  msg: string;
}

/** Toast queue: at most three visible, 2.8 s plain / 6 s with an action, paused while hovered or focused. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, opts: ToastOptions = {}) => {
    const id = ++seq.current;
    setToasts((ts) => [...ts, { id, msg, ...opts }].slice(-3));
  }, []);
  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);
  return { toasts, push, remove };
}

function Toast({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  // 단추나 링크가 있는 토스트는 누를 시간을 더 준다.
  const interactive = !!(item.action || item.href);
  const left = useRef(item.duration ?? (interactive ? 6000 : 2800));
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = useCallback(() => {
    clearTimeout(timer.current);
    started.current = Date.now();
    timer.current = setTimeout(() => onDone(item.id), left.current);
  }, [item.id, onDone]);
  const pause = () => {
    clearTimeout(timer.current);
    left.current = Math.max(1200, left.current - (Date.now() - started.current));
  };
  useEffect(() => {
    run();
    return () => clearTimeout(timer.current);
  }, [run]);
  return (
    <div
      className={cx(s.toast, interactive && s.hasAct)}
      onMouseEnter={interactive ? pause : undefined}
      onMouseLeave={interactive ? run : undefined}
      onFocus={interactive ? pause : undefined}
      onBlur={interactive ? run : undefined}
    >
      <span>{item.msg}</span>
      {item.href ? (
        <a className={s.tAct} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => onDone(item.id)}>
          {item.hrefLabel ?? item.href}
        </a>
      ) : null}
      {item.action ? (
        <button
          type="button"
          className={s.tAct}
          onClick={() => {
            onDone(item.id);
            item.onAction?.();
          }}
        >
          {item.action}
        </button>
      ) : null}
    </div>
  );
}

export default function Toasts({ toasts, onDone, offsets }: { toasts: ToastItem[]; onDone: (id: number) => void; offsets?: CSSProperties }) {
  return (
    <div className={s.toasts} role="status" aria-live="polite" style={offsets}>
      {toasts.map((x) => (
        <Toast key={x.id} item={x} onDone={onDone} />
      ))}
    </div>
  );
}
