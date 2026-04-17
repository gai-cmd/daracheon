import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Factory, Globe, ArrowRight, CheckCircle2, Mail, Phone, MapPin, Calendar, ShieldCheck } from "lucide-react";
import SEO from "../components/SEO";
import { renderImage } from "../utils/image";
import { useSiteImages } from "../hooks/useSiteImages";

export default function Company() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { images } = useSiteImages();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch("/api/company");
        if (response.ok) {
          const companyData = await response.json();
          setData(companyData);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
      setLoading(false);
    };

    fetchCompanyData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">Loading...</div>;

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">데이터를 불러올 수 없습니다.</div>;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "factory": return <Factory className="w-8 h-8" />;
      case "globe": return <Globe className="w-8 h-8" />;
      default: return <Factory className="w-8 h-8" />;
    }
  };

  const getFlowIcon = (index: number) => {
    switch (index) {
      case 0: return <Factory className="w-8 h-8" />;
      case 1: return <ShieldCheck className="w-8 h-8" />;
      case 2: return <Globe className="w-8 h-8" />;
      case 3: return <CheckCircle2 className="w-8 h-8" />;
      default: return <CheckCircle2 className="w-8 h-8" />;
    }
  };

  return (
    <div className="bg-luxury-cream min-h-screen font-noto-sans text-luxury-black">
      <SEO 
        title="회사소개 - ZOEL LIFE(ZOEL LIFE) | ZOEL LIFE"
        description={`${data.subheadline} ZOEL LIFE(ZOEL LIFE)의 프리미엄 침향 브랜드를 소개합니다.`}
        keywords="ZOEL LIFE, ZOEL LIFE, 회사소개, 침향 전문 기업"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "ZOEL LIFE",
              "url": "https://www.daracheon.com/",
              "logo": "https://www.daracheon.com/logo.png",
              "description": "프리미엄 침향 전문 기업 ZOEL LIFE",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "1588-0000",
                "contactType": "customer service"
              },
              "foundingDate": "2002"
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "회사소개", "item": "https://www.daracheon.com/company" }
              ]
            }
          ]
        }}
      />

      {/* Hero Section */}
      <header className="relative pt-40 pb-24 px-4 bg-luxury-black text-luxury-cream overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury-gold/20 via-transparent to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-micro mb-6 text-luxury-gold tracking-[0.3em] uppercase"
          >
            OUR STORY
          </motion.div>
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
              hidden: {}
            }}
            className="text-4xl md:text-6xl lg:text-7xl font-noto-serif font-light mb-8 leading-tight"
          >
            ZOEL LIFE(ZOEL LIFE)
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-luxury-cream/70 font-light max-w-3xl mx-auto"
          >
            {data.subheadline}
          </motion.p>
        </div>
      </header>

      <main>
        {/* Company Info Section */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            {data.partners?.map((partner: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-luxury-gold/10 text-luxury-gold text-xs font-bold tracking-widest uppercase mb-6">
                    {getIcon(partner.icon)}
                    {partner.role}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-noto-serif mb-8">{partner.name}</h2>
                  <p className="text-luxury-black/70 leading-relaxed mb-10 text-lg">
                    {partner.description}
                  </p>
                  
                  <div className="space-y-6 mb-10">
                    {partner.strengths?.map((strength: string, sIdx: number) => (
                      <div key={sIdx} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-luxury-gold" />
                        <span className="text-luxury-black/80 font-medium">{strength}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white border border-luxury-gold/20 rounded-2xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-luxury-gold shrink-0 mt-1" />
                      <div>
                        <div className="text-xs text-luxury-black/40 uppercase tracking-wider mb-1">Location</div>
                        <div className="text-sm font-medium">{partner.location}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-luxury-gold shrink-0 mt-1" />
                      <div>
                        <div className="text-xs text-luxury-black/40 uppercase tracking-wider mb-1">Established</div>
                        <div className="text-sm font-medium">{partner.established}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-luxury-gold shrink-0 mt-1" />
                      <div>
                        <div className="text-xs text-luxury-black/40 uppercase tracking-wider mb-1">Email</div>
                        <div className="text-sm font-medium">{partner.contact.email}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-luxury-gold shrink-0 mt-1" />
                      <div>
                        <div className="text-xs text-luxury-black/40 uppercase tracking-wider mb-1">Contact</div>
                        <div className="text-sm font-medium">{partner.contact.phone}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl"
                >
                  {renderImage(images['companyOffice'] || images['companyHero'], partner.name, "w-full h-full object-cover")}
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-10 left-10 text-luxury-cream">
                    <div className="text-sm tracking-widest uppercase opacity-70 mb-2">CEO</div>
                    <div className="text-2xl font-noto-serif">{partner.ceo}</div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-40 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            {renderImage(images['companyHero'], "Nature Vision Background", "w-full h-full object-cover")}
            <div className="absolute inset-0 bg-luxury-black/70 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-black via-transparent to-luxury-black opacity-60"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-luxury-cream">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-micro mb-8 text-luxury-gold tracking-[0.4em] uppercase"
            >
              OUR VISION
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-noto-serif font-light leading-tight italic"
            >
              "{data.vision}"
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100px" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-px bg-luxury-gold mx-auto mt-12"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
