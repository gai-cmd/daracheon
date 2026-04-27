import Link from 'next/link';
import { company } from '@/data/company';
import styles from './Footer.module.css';

const socialEntries = Object.entries(company.social).filter(([, url]) => url.trim() !== '');

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brandLogoLink}>
            <img
              src="/images/logo-brand.png"
              alt="조엘라이프 ZOEL LIFE"
              className={styles.brandLogoImg}
            />
            <span className={styles.brandLogoName}>조엘라이프(주)</span>
          </Link>
          <p className={styles.brandDesc}>
            조엘라이프의 대라천 &apos;참&apos;침향은 베트남 직영 농장 기반의 침향 전문기업에서
            생산됩니다. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시
            &apos;대한민국약전외한약(생약)규격집&apos;과 식약처 &apos;식품공전&apos;에 등록된 공식 침향만을 다룹니다.
          </p>
          {socialEntries.length > 0 && (
            <div className={styles.social}>
              {socialEntries.map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className={styles.companyInfo}>
          <p>ZOEL LIFE 주식회사 | 대표: {company.ceo} | 사업자등록번호: {company.businessReg}</p>
          <p>주소: {company.address}</p>
          <p>전화: {company.phone} | 이메일: {company.email}</p>
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
