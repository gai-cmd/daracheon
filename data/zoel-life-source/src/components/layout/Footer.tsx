import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-luxury-black text-luxury-cream pt-24 pb-12 border-t border-luxury-gold/20 font-noto-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-playfair text-3xl tracking-[0.15em] text-luxury-gold mb-6 block">
              ZOEL LIFE
            </Link>
            <p className="text-luxury-cream/60 text-sm leading-relaxed max-w-md font-light">
              자연의 진실된 가치. 베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향.
              CITES 국제인증, 특허 기술, Organic·HACCP 인증으로 증명합니다.
            </p>
          </div>
          
          <div>
            <h3 className="font-noto-serif text-lg text-luxury-cream mb-6">고객 지원</h3>
            <ul className="space-y-4">
              <li><Link to="/support" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">공지사항</Link></li>
              <li><Link to="/support" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">배송/반품 안내</Link></li>
              <li><Link to="/reviews" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">고객 후기</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-noto-serif text-lg text-luxury-cream mb-6">브랜드</h3>
            <ul className="space-y-4">
              <li><Link to="/about-agarwood" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">침향이란?</Link></li>
              <li><Link to="/brand-story" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">브랜드 이야기</Link></li>
              <li><Link to="/process" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">생산 공정</Link></li>
              <li><Link to="/company" className="text-sm text-luxury-cream/60 hover:text-luxury-gold transition-colors">회사 소개</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-luxury-gold/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="text-xs text-luxury-cream/60 space-y-2 font-light">
              <p className="text-luxury-cream font-medium">ZOEL LIFE 주식회사 (영문: ZOEL LIFE Co., Ltd)</p>
              <p>사업자등록번호: 749-86-03668 | 대표: 박병주</p>
              <p>주소: 서울특별시 금천구 벚꽃로36길 30, 1511호</p>
              <p>고객센터: 070-4140-4086 | 이메일: bj0202@gmail.com</p>
              <p className="mt-4 pt-4 border-t border-luxury-gold/10">
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-6">
            </div>
          </div>
          <div className="mt-12 flex justify-between items-center text-xs text-luxury-cream/40 font-light">
            <span>&copy; {new Date().getFullYear()} Joel Life Co., Ltd. All rights reserved.</span>
            <Link to="/admin" className="hover:text-luxury-gold transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
