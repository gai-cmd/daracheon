'use client';

import { useState, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  kicker?: string;
  content: ReactNode;
}

interface Props {
  tabs: TabItem[];
  defaultTab?: string;
}

export default function ProductTabs({ tabs, defaultTab }: Props) {
  const [active, setActive] = useState<string>(defaultTab ?? tabs[0]?.id ?? '');

  if (tabs.length === 0) return null;

  return (
    <div>
      <div className="mx-auto mb-12 flex max-w-[800px] overflow-x-auto border border-gold-500/20">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`
                flex-1 whitespace-nowrap px-5 py-4 font-mono text-[0.66rem] uppercase
                tracking-[0.24em] transition-colors duration-300
                ${idx < tabs.length - 1 ? 'border-r border-gold-500/15' : ''}
                ${
                  isActive
                    ? 'bg-gold-500 font-medium text-lx-black'
                    : 'bg-transparent text-white/60 hover:text-gold-400'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-[900px]">
        {tabs.map((tab) => (
          <div key={tab.id} className={tab.id === active ? 'block' : 'hidden'}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
