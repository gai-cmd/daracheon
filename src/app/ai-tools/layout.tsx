import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Nav from './Nav';
import styles from './ai-tools.module.css';

export const metadata: Metadata = {
  title: 'AI툴 관리 CRM',
  robots: { index: false, follow: false },
};

export default async function AiToolsLayout({ children }: { children: ReactNode }) {
  // 미들웨어가 세션을 강제하고 x-admin-email 헤더를 심는다.
  const h = await headers();
  const email = h.get('x-admin-email') ?? undefined;
  return (
    <div className={styles.root} data-reading-surface>
      <Nav email={email} />
      <div className={styles.container}>{children}</div>
    </div>
  );
}
