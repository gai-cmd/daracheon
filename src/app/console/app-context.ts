'use client';

import { createContext, useContext } from 'react';
import type { ConsoleCategory, ConsoleListItem, ConsolePerson } from '@/lib/console/types';
import type { ConsoleMe, ConsoleView, ListFilters, SortState } from '@/lib/console/ui-model';

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
  openMenu: (anchor: HTMLElement, items: MenuEntry[], align?: 'start' | 'end') => void;
}

export type FormFocus = 'title' | 'url' | 'owner' | 'id' | 'pw';

export const AppContext = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp outside ConsoleApp');
  return v;
}
