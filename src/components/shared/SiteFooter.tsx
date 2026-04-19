import Link from 'next/link';
import { footerNavigation } from '@/data/navigation';
import { company } from '@/data/company';
import BrandMark from './BrandMark';

export default function SiteFooter() {
  return (
    <footer className="bg-[#07080c] pt-20 pb-10 border-t border-gold-500/12">
      <div className="max-w-page mx-auto px-6 lg:px-16">
        {/* Top: Brand + footer cols */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-[60px] mb-12">
          <div>
            <BrandMark size="sm" />
            <p className="mt-5 text-[0.88rem] leading-[1.9] font-light max-w-[360px] text-white/60">
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
                  className="font-mono text-[0.64rem] tracking-en-nav uppercase text-white/40 hover:text-gold-400 transition-colors"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>

          {Object.values(footerNavigation).map((col) => (
            <FooterCol key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        {/* Company Info (사업자 정보 — 기존값 유지) */}
        <div className="pt-8 pb-8 border-t border-white/[0.08] text-[0.7rem] leading-6 text-white/40">
          <p>{company.nameEn} 주식회사 | 대표: {company.ceo} | 사업자등록번호: {company.businessReg}</p>
          <p>주소: {company.address}</p>
          <p>전화: {company.phone} | 이메일: {company.email}</p>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4
                        font-mono text-[0.64rem] tracking-en-nav uppercase text-white/40">
          <span>© 2026 ZOEL LIFE Co., Ltd. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/support#privacy" className="hover:text-gold-400 transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/support#terms" className="hover:text-gold-400 transition-colors">
              이용약관
            </Link>
            <Link href="/admin" className="hover:text-gold-400 transition-colors">
              관리자
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h5 className="font-mono text-[0.66rem] tracking-[0.3em] uppercase text-gold-500 mb-5">
        {title}
      </h5>
      <ul className="list-none flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label + link.href}>
            <Link href={link.href} className="text-[0.86rem] font-light text-white/60 no-underline hover:text-gold-400 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
