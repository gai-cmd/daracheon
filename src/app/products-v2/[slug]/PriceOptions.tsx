'use client';

import { useState } from 'react';
import type { DraftPriceOption } from './data';
import styles from './page.module.css';

function formatKRW(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`;
}

export default function PriceOptions({ options }: { options: DraftPriceOption[] }) {
  const [activeId, setActiveId] = useState(options[0]?.id);
  const active = options.find((o) => o.id === activeId) ?? options[0];

  if (!active) return null;

  return (
    <div className={styles.priceBox}>
      {options.length > 1 && (
        <div className={styles.optionRow} role="radiogroup" aria-label="구성 선택">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === active.id}
              className={`${styles.optionBtn} ${o.id === active.id ? styles.optionActive : ''}`}
              onClick={() => setActiveId(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className={styles.price}>{formatKRW(active.priceKRW)}</div>
    </div>
  );
}
