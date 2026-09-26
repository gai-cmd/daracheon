'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export interface IndexProduct {
  slug: string;
  name: string;
  nameEn?: string;
  category?: string;
  image: string;
}

/**
 * 타이포그래피 목록형 제품 인덱스.
 * 마우스가 있는 기기에서는 줄에 올리면 제품 사진이 커서를 따라 떠다닌다.
 * 터치 기기에서는 각 줄 왼쪽에 작은 사진이 붙는 평범한 목록으로 보인다(CSS 로 분기).
 */
export default function ProductIndex({ products }: { products: IndexProduct[] }) {
  const floatRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  // 커서를 바로 붙이지 않고 lerp 로 살짝 늦게 따라가게 해 부드럽게 만든다.
  useEffect(() => {
    if (active === null) return;
    let frame = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = () => {
      const k = reduce ? 1 : 0.16;
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      const el = floatRef.current;
      if (el) el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -55%)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const onMove = (e: MouseEvent) => {
    target.current = { x: e.clientX, y: e.clientY };
  };
  const onEnter = (i: number) => (e: MouseEvent) => {
    if (active === null) {
      // 처음 들어올 때는 커서 위치에서 바로 시작 — 화면 구석에서 날아오지 않게.
      target.current = { x: e.clientX, y: e.clientY };
      pos.current = { x: e.clientX, y: e.clientY };
    }
    setActive(i);
  };

  return (
    <>
      <ol className={styles.pIndex} onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
        {products.map((p, i) => (
          <li key={p.slug} data-reveal="" style={{ ['--d' as string]: `${i * 70}ms` }}>
            <Link
              href={`/products/${p.slug}`}
              className={styles.pRow}
              data-dim={active !== null && active !== i ? '' : undefined}
              onMouseEnter={onEnter(i)}
            >
              <span className={styles.pNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.pThumb}>
                <Image src={p.image} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
              </span>
              <span className={styles.pName}>
                {p.name}
                {p.nameEn && <span className={styles.pNameEn}>{p.nameEn}</span>}
              </span>
              {p.category && <span className={styles.pCat}>{p.category}</span>}
              <span className={styles.pGo} aria-hidden="true">
                ↗
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div ref={floatRef} className={styles.pFloat} data-show={active !== null ? '' : undefined} aria-hidden="true">
        {products.map((p, i) => (
          <span key={p.slug} className={styles.pFloatImg} data-on={active === i ? '' : undefined}>
            <Image src={p.image} alt="" fill sizes="300px" style={{ objectFit: 'cover' }} />
          </span>
        ))}
      </div>
    </>
  );
}
