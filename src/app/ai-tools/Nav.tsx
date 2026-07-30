'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ai-tools.module.css';

const LINKS = [
  { href: '/ai-tools', label: '대시보드', exact: true },
  { href: '/ai-tools/tools', label: '툴 목록', exact: false },
];

export default function Nav({ email }: { email?: string }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>🧭 AI툴 관리</span>
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.navLink} ${active ? styles.navActive : ''}`}
          >
            {l.label}
          </Link>
        );
      })}
      <span className={styles.navSpacer} />
      {email && <span className={styles.navUser}>{email}</span>}
    </nav>
  );
}
