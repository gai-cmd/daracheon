import Link from 'next/link';
import styles from './Footer.module.css';

interface CompanyInfo {
  name: string;
  ceo: string;
  businessReg: string;
  mailOrderReg?: string;
  importBizReg?: string;
  privacyOfficer?: string;
  address: string;
  phone: string;
  email: string;
  brandDesc?: string;
}

interface Props {
  socialLinks?: Array<{ label: string; url: string }>;
  company: CompanyInfo;
}

const DEFAULT_BRAND_DESC =
  "조엘라이프의 대라천 '참'침향은 베트남 직영 농장 기반의 침향 전문기업에서 생산됩니다. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시 '대한민국약전외한약(생약)규격집'과 식약처 '식품공전'에 등록된 공식 침향만을 다룹니다.";

export default function Footer({ socialLinks = [], company }: Props) {
  const activeSocial = socialLinks.filter((s) => s.url.trim() !== '');
  const brandDesc = company.brandDesc?.trim() || DEFAULT_BRAND_DESC;

  // 값이 비어있는 항목은 라벨까지 통째로 숨김.
  // 구분자는 실제로 노출되는 항목 사이에만 자동 삽입.
  const contactCombined = [
    company.phone && `전화: ${company.phone}`,
    company.email && `이메일: ${company.email}`,
  ]
    .filter(Boolean)
    .join(' | ');
  const infoItems = [
    { key: 'ceo', label: '대표', value: company.ceo },
    { key: 'businessReg', label: '사업자등록번호', value: company.businessReg },
    { key: 'mailOrderReg', label: '통신판매업신고번호', value: company.mailOrderReg },
    { key: 'importBizReg', label: '수입・판매업 영업등록증', value: company.importBizReg },
    { key: 'privacyOfficer', label: '개인정보보호책임자', value: company.privacyOfficer },
    { key: 'address', label: '주소', value: company.address },
    { key: 'contact', label: '', value: contactCombined, raw: true },
  ].filter((item) => item.value && item.value.trim() !== '');

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
            <span className={styles.brandLogoText}>
              <span className={styles.brandLogoKr}>조엘라이프(주)</span>
              <span className={styles.brandLogoEn}>ZOEL LIFE</span>
            </span>
          </Link>
          <p className={styles.brandDesc}>{brandDesc}</p>
          {activeSocial.length > 0 && (
            <div className={styles.social}>
              {activeSocial.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Company Info — 값이 빈 항목은 라벨까지 표시되지 않음 */}
        {infoItems.length > 0 && (
          <div className={styles.companyInfo}>
            <p className={styles.companyInfoRow}>
              {infoItems.map((item, i) => (
                <span key={item.key} style={{ display: 'contents' }}>
                  {i > 0 && (
                    <span className={styles.infoSep} aria-hidden>·</span>
                  )}
                  <span className={styles.infoBlock}>
                    {item.raw ? item.value : `${item.label}: ${item.value}`}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )}

        <div className={styles.bottom}>
          <span>© 2026 ZOEL LIFE Co., Ltd. All rights reserved.</span>
          <div className={styles.bottomLinks}>
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/terms">이용약관</Link>
            <Link href="/admin">관리자</Link>
            <a href="/thesis">thesis</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
