import Link from 'next/link';
import type { FooterColumn } from '@/data/navigation';
import { company } from '@/data/company';
import styles from './Footer.module.css';

interface FooterProps {
  footerColumns: FooterColumn[];
}

export default function Footer({ footerColumns }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brandLine}>
              <span className={styles.brandDot} aria-hidden="true" />
              <span className={styles.brandWord}>조엘라이프㈜</span>
            </Link>
            <span className={styles.brandSub}>대라천&apos;참&apos;침향</span>
            <p className={styles.brandDesc}>
              조엘라이프의 대라천 &apos;참&apos;침향은 베트남 직영 농장 기반의 침향 전문기업에서
              생산됩니다. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시
              &apos;대한민국약전외한약(생약)규격집&apos;과 식약처 &apos;식품공전&apos;에 등록된 공식 침향만을 다룹니다.
            </p>
            <div className={styles.social}>
              {Object.entries(company.social).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                  {platform}
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label + link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Company Info */}
        <div className={styles.companyInfo}>
          <p>
            ZOEL LIFE 주식회사 | 대표: {company.ceo} | 사업자등록번호: {company.businessReg}
          </p>
          <p>주소: {company.address}</p>
          <p>
            전화: {company.phone} | 이메일: {company.email}
          </p>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 ZOEL LIFE Co., Ltd. All rights reserved.</span>
          <div className={styles.bottomLinks}>
            <Link href="/support#privacy">개인정보처리방침</Link>
            <Link href="/support#terms">이용약관</Link>
            <Link href="/admin">관리자</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
