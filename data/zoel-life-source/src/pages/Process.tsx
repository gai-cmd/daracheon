import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { renderImage } from "../utils/image";
import SEO from "../components/SEO";
import * as LucideIcons from "lucide-react";
import { useSiteImages } from "../hooks/useSiteImages";

const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <LucideIcons.HelpCircle className={className} />;
  return <Icon className={className} />;
};

export default function Process() {
  const [steps, setSteps] = useState<any[]>([]);
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { images } = useSiteImages();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hero data from Firebase
        const docRef = doc(db, "pages", "process");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().pageData) {
          setHeroData(docSnap.data().pageData);
        }

        // Fetch process steps from backend API
        const response = await fetch("/api/process");
        const stepsData = await response.json();
        setSteps(stepsData);
      } catch (error) {
        console.error("Error fetching process data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">Loading...</div>;

  const hero = heroData || {
    heroTitle: "생산 공정",
    heroSubtitle: "자연이 허락한 시간, 정직한 땀방울의 결실"
  };

  const certifications = [
    { name: "CITES", description: "멸종위기 야생동식물 국제거래 협약 인증", icon: "Globe" },
    { name: "HACCP", description: "식품안전관리인증기준 준수", icon: "ShieldCheck" },
    { name: "Organic", description: "친환경 유기농 재배 방식 채택", icon: "Leaf" },
    { name: "Patent", description: "독자적인 침향 추출 및 가공 특허 기술", icon: "Award" }
  ];

  return (
    <div className="bg-luxury-cream min-h-screen font-noto-sans">
      <SEO 
        title={`${hero.heroTitle} - 완벽을 향한 장인 정신 | ZOEL LIFE`}
        description="베트남 직영 농장에서부터 최종 출하까지, ZOEL LIFE만의 엄격한 기준과 전통 방식을 고집하는 생산 공정을 소개합니다. 유기농 침향의 탄생 과정을 확인하세요."
        keywords="ZOEL LIFE 생산 공정, 침향 제조, 베트남 침향 농장, 수지유도 기술, CITES, HACCP, 유기농 침향 재배, 침향 가공 기술"
      />
      
      {/* Hero Section */}
      <header className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {renderImage(images['processHero'], "생산 공정", "w-full h-full object-cover")}
          <div className="absolute inset-0 bg-luxury-black/60"></div>
        </div>
        <div className="relative z-10 text-center px-4 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-micro mb-6 drop-shadow-md text-luxury-cream uppercase tracking-[0.3em]"
          >
            Craftsmanship & Process
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-noto-serif font-light mb-6 tracking-tight text-luxury-cream drop-shadow-lg"
          >
            {hero.heroTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-luxury-cream/90 font-light tracking-wide drop-shadow-md max-w-2xl mx-auto"
          >
            {hero.heroSubtitle}
          </motion.p>
        </div>
      </header>

      <main>
        {/* Process Timeline Section */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-noto-serif font-light text-luxury-black mb-6">생산 공정 단계</h2>
            <div className="w-16 h-[1px] bg-luxury-gold mx-auto mb-8"></div>
            <p className="text-luxury-black/60 font-light max-w-2xl mx-auto">
              베트남 직영 농장에서부터 최종 출하까지, ZOEL LIFE만의 엄격한 기준과 전통 방식을 고집합니다.
            </p>
          </div>

          <div className="relative">
            {/* Vertical Line for Desktop */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[1px] bg-luxury-gold/20 hidden lg:block"></div>

            <div className="space-y-24 lg:space-y-32">
              {steps.map((step, idx) => (
                <motion.article 
                  key={step.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className={`relative flex flex-col lg:flex-row items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Step Number Circle */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-12 lg:top-1/2 lg:-translate-y-1/2 z-10">
                    <div className="w-16 h-16 rounded-full bg-luxury-black border border-luxury-gold flex items-center justify-center text-luxury-gold font-playfair text-2xl shadow-xl">
                      {step.id}
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className={`w-full lg:w-1/2 ${idx % 2 === 0 ? 'lg:pr-24 text-center lg:text-right' : 'lg:pl-24 text-center lg:text-left'}`}>
                    <div className="inline-block p-4 rounded-full bg-luxury-gold/10 mb-6">
                      <IconComponent name={step.icon} className="w-8 h-8 text-luxury-gold" />
                    </div>
                    <h3 className="text-2xl font-noto-serif font-light text-luxury-black mb-4">{step.title}</h3>
                    <p className="text-luxury-black/70 font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                      {step.description}
                    </p>
                  </div>

                  {/* Visual Side (Placeholder for images) */}
                  <div className="w-full lg:w-1/2 mt-12 lg:mt-0 flex justify-center">
                    <div className="w-full max-w-md aspect-video bg-luxury-black/5 rounded-2xl border border-luxury-gold/10 flex items-center justify-center overflow-hidden group">
                      <div className="text-luxury-gold/20 group-hover:scale-110 transition-transform duration-700">
                        <IconComponent name={step.icon} className="w-24 h-24 opacity-20" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/10 to-transparent"></div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Certification Section */}
        <section className="py-32 bg-luxury-black text-luxury-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-noto-serif font-light mb-6">품질 및 안전 인증</h2>
              <div className="w-12 h-[1px] bg-luxury-gold mx-auto mb-8"></div>
              <p className="text-luxury-cream/60 font-light max-w-xl mx-auto">
                국제적인 기준을 준수하며 투명하고 안전한 생산 과정을 보증합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {certifications.map((cert, idx) => (
                <motion.article 
                  key={cert.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-20 h-20 rounded-full border border-luxury-gold/30 flex items-center justify-center mx-auto mb-6 group-hover:border-luxury-gold transition-colors duration-500">
                    <IconComponent name={cert.icon} className="w-8 h-8 text-luxury-gold" />
                  </div>
                  <h4 className="text-xl font-playfair text-luxury-gold mb-3">{cert.name}</h4>
                  <p className="text-sm text-luxury-cream/50 font-light leading-relaxed">
                    {cert.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA or Message */}
        <section className="py-24 text-center px-4">
          <p className="text-luxury-black/40 font-light italic mb-8">
            "자연의 시간을 기다리는 정직함이 ZOEL LIFE의 품질을 만듭니다."
          </p>
          <div className="w-1 h-12 bg-luxury-gold/30 mx-auto"></div>
        </section>
      </main>
    </div>
  );
}
