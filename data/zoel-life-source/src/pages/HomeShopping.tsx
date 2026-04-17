import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, ShieldCheck, Factory, Globe, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function HomeShopping() {
  return (
    <div className="bg-luxury-black min-h-screen font-noto-sans text-luxury-cream">
      <SEO 
        title="홈쇼핑 특별관 - ZOEL LIFE 침향 특별 할인 | TV홈쇼핑 방영 제품"
        description="ZOEL LIFE 홈쇼핑 특별관에서 TV홈쇼핑 방영 침향 제품을 특별 가격으로 만나보세요."
        keywords="침향 홈쇼핑, ZOEL LIFE 침향, 침향환, 침향단, 침향 비누, 프리미엄 침향, TV홈쇼핑 침향"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "OfferCatalog",
              "name": "ZOEL LIFE TV홈쇼핑 특별관",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "침향환" },
                { "@type": "ListItem", "position": 2, "name": "침향단" },
                { "@type": "ListItem", "position": 3, "name": "침향 비누" }
              ]
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "홈쇼핑 특별관", "item": "https://www.daracheon.com/home-shopping" }
              ]
            }
          ]
        }}
      />

      {/* 1. Top Banner */}
      <div className="bg-luxury-gold text-luxury-black py-3 text-center font-bold tracking-widest uppercase text-sm">
        TV홈쇼핑 특별 방송 기념 - 한정 수량 특별가 공개
      </div>

      {/* 2. Consumer Alert & Trust Banner */}
      <section className="py-20 border-b border-luxury-gold/20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-1 mb-6 text-xs font-bold tracking-widest text-luxury-black uppercase bg-luxury-gold rounded-full">
            긴급 소비자 안내
          </div>
          <h2 className="mb-6 text-3xl font-light text-white font-noto-serif md:text-4xl">가짜 침향, 당신의 건강을 위협합니다</h2>
          <p className="mb-12 text-lg text-gray-400 font-light leading-relaxed">
            최근 뉴스에서 가짜 침향 유통 문제가 보도되고 있습니다.<br />
            식약처가 인정한 침향은 단 2종(Aquilaria crassna, Aquilaria malaccensis)뿐이며, 오직 이 종들만이 식용 가능합니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: CheckCircle2, text: "DNA 유전자 검증 완료" },
              { icon: ShieldCheck, text: "CITES 국제인증" },
              { icon: Factory, text: "식약처 인정 정품 침향 사용" },
              { icon: CheckCircle2, text: "HACCP 인증" },
              { icon: Globe, text: "25년 직영 농장 운영" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3 text-luxury-gold">
                <item.icon className="w-5 h-5" />
                <span className="text-white font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. News Citation */}
      <section className="py-16 bg-[#0A0A0F]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="mb-4 text-sm tracking-[0.2em] text-luxury-gold uppercase font-playfair">뉴스에서도 주목한 침향의 진실</h3>
          <div className="p-8 border border-luxury-gold/20 rounded-2xl bg-luxury-black shadow-sm">
            <p className="mb-4 text-lg font-medium text-luxury-cream">"연합뉴스TV 2026.03.28 보도 - 가짜 침향 가려낸다…한약재도 유전자 검사"</p>
            <p className="text-luxury-cream/70 font-light">ZOEL LIFE 침향은 이미 DNA 유전자 분석을 통해 검증된 정품 침향만을 사용합니다.</p>
          </div>
        </div>
      </section>

      {/* 4. Special Price Section */}
      <section className="py-20 text-center">
        <h2 className="text-4xl font-noto-serif text-luxury-gold mb-6">방송 중 특별가 공개</h2>
        <p className="text-xl text-gray-400">지금 방송을 시청하고 특별한 혜택을 확인하세요.</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-luxury-gold">
          <Clock className="w-6 h-6" />
          <span className="text-2xl font-bold tracking-widest">방송 종료까지 00:00:00</span>
        </div>
      </section>

      {/* 5. Product Lineup */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-noto-serif text-center mb-16">대표 제품 라인업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["침향환", "침향단", "침향 비누"].map((product, i) => (
            <div key={i} className="bg-luxury-black p-8 rounded-2xl border border-luxury-gold/20 text-center">
              <div className="w-full h-48 bg-gray-800 rounded-lg mb-6 flex items-center justify-center text-gray-500">이미지</div>
              <h3 className="text-2xl font-noto-serif mb-4">{product}</h3>
              <p className="text-luxury-gold font-bold text-xl mb-6">방송 중 특별가 공개</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Button */}
      <section className="py-20 text-center">
        <a href="tel:080-000-0000" className="inline-flex items-center gap-4 px-12 py-6 text-2xl font-bold text-luxury-black uppercase transition-all bg-luxury-gold hover:bg-luxury-gold/90 rounded-full shadow-lg hover:scale-105">
          <Phone className="w-8 h-8" /> 지금 바로 전화주문: 080-XXX-XXXX
        </a>
      </section>

      {/* 7. Certification Badges */}
      <section className="py-16 border-t border-luxury-gold/20">
        <div className="max-w-4xl mx-auto flex justify-center gap-12 text-luxury-gold">
          {["CITES", "HACCP", "DNA 검증"].map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <ShieldCheck className="w-12 h-12" />
              <span className="text-sm font-bold">{badge}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
