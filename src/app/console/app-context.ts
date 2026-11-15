'use client';

import { createContext, useContext } from 'react';
import type { ConsoleCategory, ConsoleListItem, ConsolePerson } from '@/lib/console/types';
import type { ConsoleMe, ConsoleView, ListFilters, SortState, ViewMode } from '@/lib/console/ui-model';

export interface MenuItem {
  icon?: string;
  label: string;
  run: () => void;
  danger?: boolean;
  /** Radio items carry their checked state. */
  checked?: boolean;
}
export type MenuEntry = MenuItem | 'sep';

export interface ToastOptions {
  action?: string;
  onAction?: () => void;
  duration?: number;
  /** 토스트 안에 새 탭으로 여는 링크 (새 탭이 막혔을 때의 대체 경로, SPEC-CONSOLE-002 REQ-CS2-014). */
  href?: string;
  hrefLabel?: string;
}

export interface RoutePreset {
  filters?: Partial<ListFilters>;
  sort?: SortState;
}

/** Shared state and actions of the console screen, provided by ConsoleApp. */
export interface AppValue {
  me: ConsoleMe;
  categories: ConsoleCategory[];
  people: ConsolePerson[];
  items: ConsoleListItem[];
  teamPins: string[];
  pins: string[];
  panelId: string | null;
  togglePin: (id: string) => void;
  setPins: (ids: string[]) => void;
  openDetail: (id: string, opener?: HTMLElement | null) => void;
  requestEdit: (id: string, focus?: FormFocus) => void;
  startAdd: () => void;
  deleteItem: (id: string) => Promise<void>;
  go: (view: ConsoleView, preset?: RoutePreset) => void;
  toast: (msg: string, opts?: ToastOptions) => void;
  copyText: (text: string, okMsg: string) => void;
  /** 토스트 없이 클립보드에만 쓴다. 성공하면 true (SPEC-CONSOLE-002). */
  writeClipboard: (text: string) => Promise<boolean>;
  /** 자동 입력 끄기 안내 팝업을 연다 (REQ-CS2-018). */
  openAutofillGuide: () => void;
  /** 관리자: 분류 추가 대화상자를 열고, 추가된 분류 id(취소하면 null)를 돌려준다 (REQ-CS2-012). */
  addCategory: () => Promise<string | null>;
  openMenu: (anchor: HTMLElement, items: MenuEntry[], align?: 'start' | 'end') => void;
  /** 모든 항목 목록이 함께 쓰는 보기 방식 (SPEC-CONSOLE-002 REQ-CS2-022~024). 브라우저에 기억한다. */
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

export type FormFocus = 'title' | 'url' | 'owner' | 'id' | 'pw';

export const AppContext = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp outside ConsoleApp');
  return v;
}
