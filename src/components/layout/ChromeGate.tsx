'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const IMMERSIVE_PREFIXES = ['/edition', '/agarwood-edition'];

export default function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const hidden = IMMERSIVE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (hidden) return null;
  return <>{children}</>;
}
