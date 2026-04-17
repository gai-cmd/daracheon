import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Factory, Globe } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Link } from "react-router-dom";
import { renderImage } from "../utils/image";
import SEO from "../components/SEO";
import { useSiteImages } from "../hooks/useSiteImages";
import { handleFirestoreError, OperationType } from "../utils/firebaseError";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<any>({
    heroTitle: "",
    heroSubtitle: ""
  });
  const { images } = useSiteImages();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch home page text data
        const docRef = doc(db, "pages", "home");
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "pages/home");
        }
        if (docSnap && docSnap.exists() && docSnap.data().pageData) {
          setHomeData(docSnap.data().pageData);
        }

        // Fetch main products
        const productsQuery = query(collection(db, "products"), where("isMain", "==", true), orderBy("order"), limit(3));
        let productsSnap;
        try {
          productsSnap = await getDocs(productsQuery);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, "products");
        }
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch media
        const mediaQuery = query(collection(db, "media"), where("type", "==", "photo"), orderBy("order"), limit(4));
        let mediaSnap;
        try {
          mediaSnap = await getDocs(mediaQuery);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, "media");
        }
        setMedia(mediaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchHomeData();
  }, []);

  const { videoHero, imgBrand1, imgBrand2, imgAgarwood, imgProcess, imgFarm, heroImage1, heroImage2 } = images;
  const { heroTitle, heroSubtitle } = homeData;

  // Fallback products if none are set as main
  const displayProducts = products.length > 0 ? products : [];

  // Fallback media
  const displayMedia = media.length >= 4 ? media : [];

  return (
    <div className="bg-[#0A0A0F] text-luxury-cream font-noto-sans selection:bg-luxury-gold selection:text-white">
      <SEO 
        title="ZOEL LIFE - 25년 전통 프리미엄 침향 전문 브랜드 | 베트남 직영 농장 침향"
        description="ZOEL LIFE는 베트남 직영 농장에서 25년간 연구한 최고급 침향(Agarwood) 제품을 제공합니다. 대한약전 외 한약규격집 등재 침향나무 Aquilaria agallocha Roxburgh(팥꽃나무과 Thymeleaceae) 수지 침착 수간목."
        keywords="침향,ZOEL LIFE,ZOEL LIFE,아가우드,agarwood,沈香,침향나무,Aquilaria agallocha,팥꽃나무과,Thymeleaceae,침향환,침향분말,침향오일,베트남침향,프리미엄침향,수지유도체,침향효능,침향구매"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "ZOEL LIFE",
              "url": "https://www.daracheon.com",
              "logo": "https://www.daracheon.com/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "070-4140-4086",
                "contactType": "customer service"
              }
            },
            {
              "@type": "WebSite",
              "name": "ZOEL LIFE",
              "url": "https://www.daracheon.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.daracheon.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "LocalBusiness",
              "name": "ZOEL LIFE",
              "image": "https://www.daracheon.com/logo.png",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "벚꽃로36길 30, 1511호",
                "addressLocality": "서울특별시",
                "addressCountry": "KR"
              },
              "telephone": "070-4140-4086"
            }
          ]
        }}
      />
      {/* 1. Hero Section */}
      <header 
        className="relative h-[50vh] w-full overflow-hidden bg-luxury-black"
        style={{ 
          backgroundImage: heroImage1 ? `url(${heroImage1})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {videoHero ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            src={videoHero}
          />
        ) : heroImage1 ? (
          <img
            src={heroImage1}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 opacity-60">
            콘텐츠 준비 중
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-luxury-black/90" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-32">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-noto-serif text-luxury-gold tracking-[0.2em] text-xl md:text-3xl mb-4"
          >
            자연이 빚은 최고의 향
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="font-noto-serif text-luxury-cream text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8"
          >
            대라천 '참'침향
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="w-px h-24 bg-luxury-gold/50 mt-8"
          />
        </div>
      </header>

      <main>
        {/* 1.5. Consumer Alert & Trust Banner */}
        <section className="py-16 bg-luxury-black border-b border-luxury-gold/20">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="inline-block px-4 py-1 mb-6 text-[14px] font-bold tracking-widest text-luxury-black uppercase bg-luxury-gold rounded-full">
              긴급 소비자 안내
            </div>
            <h2 className="mb-10 text-3xl font-light text-white font-noto-serif md:text-4xl">진짜 침향, 이젠 학명부터 확인하세요!</h2>
            <div className="mb-16 text-left max-w-4xl mx-auto p-8 border border-luxury-gold/30 rounded-2xl bg-luxury-gold/5">
              <p className="text-lg text-gray-300 font-medium leading-relaxed mb-8">
                대한민국 국가법령정보센터의 식품의약품안전처(식약처) 고시 ‘대한민국약전외한약(생약)규격집’과 ‘식약처 식품공전’ 두 곳에서 동일하게 등록된 공식 침향은 <span className="text-luxury-gold">Aquilaria Agallocha Roxburgh</span>(AAR)입니다.
              </p>
              <ul className="text-base text-gray-400 font-light leading-relaxed space-y-6 list-disc pl-5">
                <li>식약처 고시 '대한민국약전외한약(생약)규격집'에서는 침향의 학명을 '아퀼라리아 아갈로차 록스버그(<span className="text-luxury-gold">Aquilaria Agallocha Roxburgh</span>)'로 정의하고 있습니다.</li>
                <li>'식약처 식품공전'에서는 아퀼라리아 아갈로차 록스버그(<span className="text-luxury-gold">Aquilaria Agallocha Roxburgh</span>)와 아퀼라리아 말라센시스 람(Aquilaria Malaccensis Lam)이 식용 가능한 침향으로 등록돼 있습니다.</li>
                <li>대한한국 최대 한약재 시장인 경동시장에서는 아갈로차(<span className="text-luxury-gold">Agallocha</span>) 위주로 거래되고 있습니다.</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: ShieldCheck, text: "CITES 보호 수종" },
                { icon: Factory, text: "식약처 인정 정품 침향 사용" },
                { icon: CheckCircle2, text: "HACCP 인증" },
                { icon: CheckCircle2, text: "GMP 인증" },
                { icon: Globe, text: "베트남 원산지 증명서" },
                { icon: ShieldCheck, text: "침향 학명 인증서(아갈로차)" },
                { icon: CheckCircle2, text: "유기농 인증서" },
                { icon: ShieldCheck, text: "유해물질성적서" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-3 text-luxury-gold">
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-white font-medium text-sm md:text-base">{item.text}</span>
                </div>
              ))}
            </div>
            
            <Link to="/process" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest text-luxury-black uppercase transition-all bg-luxury-gold hover:bg-luxury-gold/90 rounded-full">
              대라천 '참'침향 인증 확인하기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 2. Badges Strip */}
        <section className="py-8 bg-luxury-black border-b border-luxury-gold/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-1 md:gap-1">
              {/* VCO */}
              <article className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-[3px] border-luxury-sage flex items-center justify-center p-2 relative">
                  <div className="absolute inset-1 rounded-full border border-luxury-sage/50"></div>
                  <span className="font-playfair text-luxury-sage font-bold text-center leading-tight text-sm">VCO<br/>ORGANIC</span>
                </div>
                <span className="text-luxury-cream/70 text-xs tracking-widest uppercase font-noto-sans">베트남 유기농</span>
              </article>
              {/* NTV */}
              <article className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-[3px] border-luxury-gold flex items-center justify-center p-2 relative bg-gradient-to-br from-luxury-gold/10 to-transparent">
                  <div className="absolute inset-1 rounded-full border border-luxury-gold/50"></div>
                  <span className="font-playfair text-luxury-gold font-bold text-center leading-tight text-sm">NTV<br/>VALUE</span>
                </div>
                <span className="text-luxury-cream/70 text-xs tracking-widest uppercase font-noto-sans">Nature Truth Value</span>
              </article>
              {/* GMP */}
              <article className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 border-[3px] border-luxury-sage flex items-center justify-center p-2 transform -rotate-3 relative">
                  <div className="absolute inset-1 border border-luxury-sage/50"></div>
                  <span className="font-playfair text-luxury-sage font-bold text-center leading-tight text-sm">GMP<br/>CERT</span>
                </div>
                <span className="text-luxury-cream/70 text-xs tracking-widest uppercase font-noto-sans">GMP Certified</span>
              </article>
              {/* HACCP */}
              <article className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 border-[3px] border-luxury-sage flex items-center justify-center p-2 transform rotate-3 relative">
                  <div className="absolute inset-1 border border-luxury-sage/50"></div>
                  <span className="font-playfair text-luxury-sage font-bold text-center leading-tight text-sm">HACCP<br/>CERT</span>
                </div>
                <span className="text-luxury-cream/70 text-xs tracking-widest uppercase font-noto-sans">HACCP Certified</span>
              </article>
            </div>
          </div>
        </section>

        {/* 3. What is Agarwood */}
        <section className="py-20 bg-luxury-black text-luxury-cream relative overflow-hidden">
          {heroImage2 && (
            <div className="absolute inset-0 z-0 opacity-10">
              {renderImage(heroImage2, "Agarwood Background", "w-full h-full object-cover")}
            </div>
          )}
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h3 className="font-playfair text-luxury-gold tracking-[0.2em] text-sm mb-4">AGARWOOD</h3>
              <h2 className="font-noto-serif text-4xl md:text-5xl font-light">신들의 나무, 침향</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "동서양의 역사적 가치", desc: "수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다." },
                { title: "20년 이상의 긴 시간", desc: "20년 이상 오랜 기간 생육된 침향나무에서 채취한 침향은 수지 함량이 높아 약재로서의 효능과 가치가 매우 높게 평가되고 있습니다." },
                { title: "논문에서 발표하는 침향", desc: "침향에 대한 연구가 전 세계적으로 활발하게 진행되고 있습니다. SCI급 논문에서도 침향에 대한 실제적인 효과에 대해 발표하고 있습니다." }
              ].map((item, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  className="p-8 border border-luxury-gold/20 bg-luxury-black hover:bg-luxury-gold/5 transition-colors duration-500"
                >
                  <div className="text-luxury-gold font-playfair text-3xl mb-4">0{i + 1}</div>
                  <h4 className="font-noto-serif text-2xl mb-3">{item.title}</h4>
                  <p className="text-luxury-cream/70 font-light leading-relaxed">{item.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* 3.5. Benefits of Agarwood */}
        <section className="py-20 bg-luxury-black text-luxury-cream relative overflow-hidden border-t border-luxury-gold/10">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h3 className="font-playfair text-luxury-gold tracking-[0.2em] text-sm mb-4">BENEFITS</h3>
              <h2 className="font-noto-serif text-4xl md:text-5xl font-light">침향의 효능에 주목!</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "기를 뚫어 순환 효과", desc: "침향은 아래로 떨어지는 기운을 통해 몸속 전체의 기혈 순환을 원활하게 하여, 막힌 기를 뚫어주고 오장육부의 기능을 정상화하는 데 도움을 줍니다." },
                { title: "강력한 원기 회복 및 자양강장", desc: "동의보감에 기록된 바와 같이, 침향은 찬 기운을 몰아내고 따뜻한 성질로 몸의 기운을 보강하여 피로 해소와 활력 증진에 도움을 줍니다." },
                { title: "신경 안정 및 숙면 유도", desc: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할을 합니다. 예민해진 신경을 이완시켜 스트레스를 완화하고 심리적 안정과 불면증 개선에 효과적입니다." },
                { title: "항염 및 혈관 건강 개선", desc: "침향은 항염 작용을 통해 염증 물질(사이토카인)을 억제하고, 혈전 형성을 방지하여 만성 염증 치료와 혈관 건강 증진에 도움을 줍니다." },
                { title: "뇌 질환 예방", desc: "침향은 뇌혈류 개선 및 뇌세포 보호에 도움을 주어, 뇌졸중과 같은 혈관 질환 예방 및 퇴행성 뇌 질환 예방에 긍정적인 영향을 미칠 수 있습니다." },
                { title: "소화 기능 향상 및 복통 완화", desc: "침향은 기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추는 데 도움을 줍니다." }
              ].map((item, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="p-6 border border-luxury-gold/10 bg-luxury-black/50 hover:border-luxury-gold/30 transition-all duration-500 group"
                >
                  <div className="text-luxury-gold/30 group-hover:text-luxury-gold font-playfair text-2xl mb-3 transition-colors">0{i + 1}</div>
                  <h4 className="font-noto-serif text-xl mb-3 text-luxury-cream group-hover:text-luxury-gold transition-colors">{item.title}</h4>
                  <p className="text-luxury-cream/60 font-light leading-relaxed text-sm">{item.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Brand Story */}
        <section className="py-20 bg-[#0A0A0F] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1 }}
                  className="aspect-[3/4] overflow-hidden"
                >
                  {renderImage(imgBrand1, "Brand Story", "w-full h-full object-cover")}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute -bottom-10 -right-10 w-2/3 aspect-square border-8 border-[#0A0A0F] overflow-hidden hidden md:block"
                >
                  {renderImage(imgBrand2, "Brand Heritage", "w-full h-full object-cover")}
                </motion.div>
              </div>
              <div className="lg:pl-10">
                <h3 className="font-playfair text-luxury-gold tracking-[0.2em] text-sm mb-4">HERITAGE</h3>
                <h2 className="font-noto-serif text-4xl md:text-5xl font-light text-luxury-cream mb-8 leading-tight">
                  수십 년 이상의 집념,<br />완벽을 향한 여정
                </h2>
                <p className="text-luxury-cream/70 font-light leading-relaxed mb-12 text-lg">
                  조엘라이프는 "자연의 진실된 가치"를 모토로 한 프리미엄 침향 브랜드 [대라천 '참'침향]을 소개합니다. 침향은 수천 년 전부터 귀하게 여겨져 온 천연의 선물로, 침향나무가 스스로 상처를 치유하며 만들어내는 고귀한 수지입니다. 조엘라이프는 이 고귀한 가치를 현대 과학과 결합하여 인류의 건강과 행복에 기여하고자 합니다.
                </p>
                <div className="space-y-8 border-l border-luxury-gold/30 pl-8">
                  <article>
                    <div className="font-playfair text-luxury-gold text-xl mb-1">1999</div>
                    <div className="font-noto-serif text-lg text-luxury-cream">베트남 침향 연구 시작</div>
                  </article>
                  <article>
                    <div className="font-playfair text-luxury-gold text-xl mb-1">2010</div>
                    <div className="font-noto-serif text-lg text-luxury-cream">독자적 수지유도 기술 특허 획득</div>
                  </article>
                  <article>
                    <div className="font-playfair text-luxury-gold text-xl mb-1">2024</div>
                    <div className="font-noto-serif text-lg text-luxury-cream">프리미엄 브랜드 '대라천 참침향' 론칭</div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Production Process */}
        <section className="py-20 bg-[#0A0A0F] text-luxury-cream overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="font-playfair text-luxury-gold tracking-[0.2em] text-sm mb-4">CRAFTSMANSHIP</h3>
              <h2 className="font-noto-serif text-4xl md:text-5xl font-light">완벽을 향한 6단계 공정</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-10 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px before:h-full before:w-[1px] before:bg-luxury-gold/20">
                {[
                  { step: "01", title: "씨앗 발아 및 묘목 육성" },
                  { step: "02", title: "베트남 직영 농장 식재" },
                  { step: "03", title: "20년이상 오르가닉 침향목 육성" },
                  { step: "04", title: "3~5년간 특허 수지유도제 3~5회 주입" },
                  { step: "05", title: "벌목 및 원물 정밀 채취" },
                  { step: "06", title: "최고급 제품 가공 및 검수" }
                ].map((item, i) => (
                  <motion.article 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-8 relative z-10"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0F] border border-luxury-gold flex items-center justify-center shrink-0 font-playfair text-luxury-gold text-sm">
                      {item.step}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-noto-serif text-xl">{item.title}</h4>
                    </div>
                  </motion.article>
                ))}
              </div>
              <div className="order-1 lg:order-2">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1 }}
                  className="aspect-[4/3] overflow-hidden border border-luxury-gold/20 p-2"
                >
                  {renderImage(imgProcess, "Process", "w-full h-full object-cover")}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Origin / Farm */}
        <section className="relative py-40 overflow-hidden bg-luxury-black">
          <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
            {renderImage(imgFarm, "Farm Origin", "w-full h-full object-cover opacity-40")}
          </motion.div>
          <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
            <h3 className="font-playfair text-luxury-gold tracking-[0.2em] text-sm mb-4">ORIGIN</h3>
            <h2 className="font-noto-serif text-4xl md:text-6xl font-light text-luxury-cream mb-8 leading-tight">
              청정 자연이 품은<br />생명의 땅
            </h2>
            <p className="text-luxury-cream/80 text-lg font-light leading-relaxed">
              동나이, 하띤, 푸꾸옥. 베트남 최고의 청정 지역에 위치한 ZOEL LIFE 직영 농장. 최적의 기후와 토양, 그리고 장인의 정성이 만나 세계 최고 품질의 침향이 탄생합니다.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
