import Link from 'next/link';
import type { FooterColumn } from '@/data/navigation';
import { company } from '@/data/company';

interface FooterProps {
  footerColumns: FooterColumn[];
}

export default function Footer({ footerColumns }: FooterProps) {
  return (
    <footer className="bg-[#0a0b10] text-white/50 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 pb-16 border-b border-white/[0.08]">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <span className="font-serif text-xl font-medium text-gold-500 tracking-[0.15em]">
                大羅天
              </span>
              <span className="block font-display text-[0.6rem] text-gold-300 tracking-[0.3em] font-light mt-0.5">
                ZOEL LIFE
              </span>
            </Link>
            <p className="text-sm leading-7 max-w-md">
              자연의 진실된 가치. 베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향.
              CITES 국제인증, 특허 기술, Organic HACCP 인증으로 증명합니다.
            </p>
            <div className="flex gap-5 mt-6">
              {Object.entries(company.social).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs tracking-[0.1em] text-white/30 hover:text-gold-500 transition-colors capitalize"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>

          {/* Footer columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h5 className="font-serif text-sm font-normal text-gold-300 tracking-[0.1em] mb-5">
                {col.title}
              </h5>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-gold-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Company Info */}
        <div className="pt-8 pb-8 border-b border-white/[0.08] text-[0.7rem] leading-6 text-white/30">
          <p>ZOEL LIFE 주식회사 | 대표: {company.ceo} | 사업자등록번호: {company.businessReg}</p>
          <p>주소: {company.address}</p>
          <p>전화: {company.phone} | 이메일: {company.email}</p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-[0.72rem] tracking-wider">
          <span>&copy; 2026 ZOEL LIFE Co., Ltd. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/support#privacy" className="hover:text-gold-500 transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/support#terms" className="hover:text-gold-500 transition-colors">
              이용약관
            </Link>
            <Link href="/admin" className="hover:text-gold-500 transition-colors">
              관리자
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
