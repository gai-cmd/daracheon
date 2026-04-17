import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { renderImage } from "../utils/image";
import SEO from "../components/SEO";
import { useSiteImages } from "../hooks/useSiteImages";
import { BookOpen, FileText, MapPin, MessageSquare, Info, Sparkles, Shield, Star, Heart } from "lucide-react";

export default function AboutAgarwood() {
  const [activeTab, setActiveTab] = useState("definition");
  const [activeSubTab, setActiveSubTab] = useState("definition");
  const { images } = useSiteImages();

  const tabs = [
    { id: "definition", label: "침향이란?", icon: <Info className="w-5 h-5" /> },
    { id: "literature", label: "문헌에 실린 침향", icon: <BookOpen className="w-5 h-5" /> },
    { id: "papers", label: "논문에 실린 침향", icon: <FileText className="w-5 h-5" /> },
    { id: "field", label: "매체에 실린 침향", icon: <MapPin className="w-5 h-5" /> },
    { id: "reviews", label: "고객이 말한 침향", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-luxury-cream min-h-screen font-noto-sans text-luxury-black">
      <SEO 
        title="침향이란? 침향의 정의·효능·등급·역사 완벽 가이드 | ZOEL LIFE"
        description="침향(沈香, Agarwood)은 침향나무 <span className='text-luxury-gold'>Aquilaria agallocha Roxburgh</span>(팥꽃나무과 Thymeleaceae)의 수지가 침착된 수간목입니다. 대한약전 외 한약(생약)규격집(식품의약품안전청, 2002) 공식 등재."
        keywords="침향이란,침향 정의,침향 효능,침향 등급,沈香,Agarwood,Aquilaria agallocha,AQUILARIAE LIGNUM,침수향,Aloeo wood,대한약전,한약규격집,ZOEL LIFE"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "headline": "침향이란? 침향의 정의·효능·등급·역사 완벽 가이드 | ZOEL LIFE",
              "description": "침향(沈香, Agarwood)은 침향나무 <span className='text-luxury-gold'>Aquilaria agallocha Roxburgh</span>(팥꽃나무과 Thymeleaceae)의 수지가 침착된 수간목입니다. 대한약전 외 한약(생약)규격집(식품의약품안전청, 2002) 공식 등재.",
              "author": { "@type": "Organization", "name": "ZOEL LIFE" }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": "침향이란 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "침향(沈香,AQUILARIAE LIGNUM)은 침향나무 <span className='text-luxury-gold'>Aquilaria agallocha Roxburgh</span>(팥꽃나무과 Thymeleaceae)의 수지가 침착된 수간목입니다. 대한약전 외 한약규격집에 공식 등재되어 있으며 침수향 또는 Aloeo wood라고도 불립니다." } },
                { "@type": "Question", "name": "침향의 성상은?", "acceptedAnswer": { "@type": "Answer", "text": "흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있습니다. 불 속에 넣으면 상쾌한 향기를 내며 탄다." } },
                { "@type": "Question", "name": "침향의 품질 기준은?", "acceptedAnswer": { "@type": "Answer", "text": "건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상. 등급양품은 흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 합니다." } },
                { "@type": "Question", "name": "침향의 효능은?", "acceptedAnswer": { "@type": "Answer", "text": "한의학에서 기의 순환, 소화 기능 개선, 정신 안정, 통증 완화에 활용. 항염, 항산화, 신경 보호 효과 보고." } },
                { "@type": "Question", "name": "ZOEL LIFE의 침향은 어디서?", "acceptedAnswer": { "@type": "Answer", "text": "베트남 직영 농장, 25년간 연구 경험" } }
              ]
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.joellife.co.kr/" },
                { "@type": "ListItem", "position": 2, "name": "침향 이야기", "item": "https://www.joellife.co.kr/about-agarwood" }
              ]
            }
          ]
        }}
      />
      
      {/* Hero Section */}
      <header className="relative h-[35vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {renderImage(images['aboutAgarwoodHero'], "침향 숲", "w-full h-full object-cover")}
          <div className="absolute inset-0 bg-luxury-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-4 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs mb-4 text-luxury-gold tracking-[0.3em] uppercase font-bold"
          >
            AGARWOOD STORY
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 leading-tight text-luxury-cream"
          >
            이젠 진짜 침향 이야기
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-16 h-px bg-luxury-gold mx-auto mb-6"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-luxury-cream/90 font-light max-w-3xl mx-auto leading-relaxed"
          >
            식약처 고시 '대한민국약전외한약(생약)규격집'과 <br className="hidden md:block" />
            '식약처 식품공전'에 공식 등록돼 있는 바로 그 침향입니다.
          </motion.p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-[120px] space-y-3">
            <div className="mb-10 px-4 w-fit">
              <h2 className="text-2xl font-noto-serif font-bold text-luxury-black tracking-tight">Agarwood Story</h2>
              <div className="w-full h-0.5 bg-luxury-gold mt-2"></div>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-medium transition-all relative group ${
                  activeTab === tab.id 
                    ? "bg-luxury-black text-luxury-gold shadow-2xl shadow-luxury-black/20" 
                    : "text-luxury-black/60 hover:bg-luxury-cream hover:text-luxury-black"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? "text-luxury-gold" : "text-luxury-gold/60"}`}>
                  {tab.icon}
                </span>
                <span className="font-noto-serif">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabSidebar"
                    className="absolute -left-2 top-4 bottom-4 w-1 bg-luxury-gold rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1" role="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              {activeTab === "definition" && (
                <div className="space-y-0 font-noto-sans text-[#d4a574] bg-[#1a1a2e]">
                  {/* Hero Section */}
                  <section className="relative py-12 flex items-center justify-center text-center px-4 overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                      <img src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200" alt="Agarwood Oil" className="absolute inset-0 w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-transparent to-[#1a1a2e]" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto">
                      <h1 className="text-4xl md:text-6xl font-sans text-[#d4a574] mb-6">침향(沈香)이란 무엇인가?</h1>
                      <p className="text-lg md:text-xl text-white mb-8 font-light">
                        자연이 수십 년에 걸쳐 빚어낸 신비의 향,<br />
                        물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)
                      </p>
                      <div className="space-y-6 text-white leading-relaxed">
                        <p className="text-base md:text-lg">
                          침향(沈香, <span className="text-white font-bold">Agarwood</span>)은 팥꽃나무과(Thymeleaceae)에 속하는 <span className="text-luxury-gold">Aquilaria</span> 속 나무가<br />
                          외부 상처나 곰팡이 감염에 대응하여 분비한 수지(樹脂)가<br />
                          수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목(香木)입니다.
                        </p>
                        <div className="pt-6 border-t border-[#d4a574]/30">
                          <p className="text-xl md:text-2xl font-medium text-[#d4a574] mb-4">
                            진짜 침향, 이제는 학명을 반드시 확인하세요.
                          </p>
                          <p className="text-sm md:text-base opacity-90 font-light max-w-3xl mx-auto">
                            대한민국 국가법령정보센터의 식품의약품안전처(식약처) 고시 ‘대한민국약전외한약(생약)규격집’과 ‘식약처 식품공전’ 두 곳에서 동일하게 등록된 공식 침향은 아퀼라리아 아갈로차 록스버그(<span className="text-luxury-gold">Aquilaria <span className="font-bold">Agallocha</span> Roxburgh</span>)입니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Official Standards */}
                  <section className="relative py-10 px-6 overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                      <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200" alt="Agarwood Tree with Resin" className="absolute inset-0 w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-[#1a1a2e]/80" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto border-2 border-[#d4a574] bg-[#1a1a2e]/60 backdrop-blur-sm p-10 rounded-3xl text-white">
                      <h2 className="text-3xl font-noto-serif mb-8 flex items-center justify-center text-[#d4a574]"><Info className="mr-3"/> 📋 대한민국약전외한약(생약)규격집 공식 등재</h2>
                      <ul className="space-y-4 text-lg">
                        <li><strong>정식명:</strong> 침수향(沈水香), AQUILARIAE LIGNUM</li>
                        <li><strong>학명:</strong> <span className="text-luxury-gold">Aquilaria Agallocha Roxburgh</span></li>
                        <li><strong>과명:</strong> 팥꽃나무과 Thymeleaceae</li>
                        <li><strong>정의:</strong> "이 약은 침향나무의 수지가 침착된 수간목이다"</li>
                        <li><strong>성상:</strong> 흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있다</li>
                        <li><strong>기준:</strong> 건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상</li>
                        <li><strong>특징:</strong> 흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다</li>
                      </ul>
                    </div>
                  </section>

                  {/* Encyclopedia Section */}
                  <section className="relative py-10 px-6 overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                      <img src="https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=1200" alt="Agarwood as Medicine" className="absolute inset-0 w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-[#1a1a2e]/80" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto border-2 border-[#d4a574] bg-[#1a1a2e]/60 backdrop-blur-sm p-10 rounded-3xl text-white">
                      <h2 className="text-3xl font-noto-serif mb-8 flex items-center justify-center text-[#d4a574]"><BookOpen className="mr-3"/> 📋 한국민족문화대백과사전 수록</h2>
                      <div className="space-y-6 text-lg leading-relaxed">
                        <p className="font-medium text-xl border-b border-[#d4a574]/30 pb-4">
                          서향과에 속하는 상록성 교목인 침향과 백목향의 목재
                        </p>
                        <div className="space-y-4 text-base opacity-90">
                          <p>
                            약재의 하나이다. 성분은 정유로서 벤질아세톤, P-메토실 벤질아세톤 등이 알려져 있다. 동물실험에서는 진정작용이 인정되고 있으며 달인 물은 결핵균을 완전히 억제시키고 티프스균·적리균에 대해서도 강력한 억제효과를 나타내고 있다.
                          </p>
                          <p>
                            이 약은 주로 하복부에 냉감을 많이 느끼고 월경불순이 있거나, 남자에게 있어 정력이 감퇴되고 소변을 자주 보는 증상에 탁월한 반응을 일으킨다. 또, 이런 증상에 수반하여 하복통이 심한 사람에게 많이 활용되는 약재이다.
                          </p>
                          <p>
                            호흡기질환으로 만성기관지천식에 호흡곤란이 있을 때에 다른 약물과 배합해서 보조효과를 얻게 된다. 이른바 선천적인 신장기능이 쇠잔하여 천식이 유발되었을 때에 많이 쓰이는데, 이 경우에는 다른 약보다 이 약으로 좋은 치료결과를 얻게 된다.
                          </p>
                          <p>
                            또, 급성위장염에 위장이 차고 딸꾹질을 그칠 사이 없이 하여 구토를 일으킬 때에 건위제와 배합하여 사용한다. 이 밖에도 혈관운동성장애로 안면이 붓고 배뇨가 곤란할 때에 다른 약물과 배합해서 사용한다. 그리고 노인이 기운이 허약하여 변비가 있을 때에도 활용된다. 대표적인 처방으로는 침향강기산이 있다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Formation Process */}
                  <section className="relative py-12 px-6 overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                      <img src="https://images.unsplash.com/photo-1501333190117-bf58ad114a5f?w=1200" alt="Agarwood Plantation" className="absolute inset-0 w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-[#1a1a2e]/90" />
                    </div>
                    <div className="relative z-10 max-w-6xl mx-auto">
                      <h2 className="text-4xl font-noto-serif text-center mb-4">침향은 어떻게 만들어지나요?</h2>
                      <p className="text-center text-white/70 mb-16">자연의 치유 본능이 만든 기적의 향</p>
                      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
                        {[ {icon: <Info/>, title: "상처 발생", desc: "나무에 자연적/인공적 상처 발생"}, {icon: <Info/>, title: "균 감염", desc: "곰팡이와 미생물이 침투"}, {icon: <Info/>, title: "수지 분비", desc: "방어 수지(oleoresin) 분비"}, {icon: <Info/>, title: "숙성", desc: "수십~수백 년간 축적·경화"} ].map((step, i) => (
                          <div key={i} className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-[#d4a574] text-[#1a1a2e] flex items-center justify-center text-2xl font-bold mb-4">{i+1}</div>
                            <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                            <p className="text-white/90 text-sm">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Reasons */}
                  <section className="py-12 px-6 bg-[#faf8f0] text-[#1a1a2e]">
                    <h2 className="text-4xl font-noto-serif text-center mb-12 text-[#5C3D2E]">침향이 특별한 4가지 이유</h2>
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {[ {icon: <Sparkles className="w-6 h-6"/>, title: "독특한 향", desc: "심신 안정에 도움을 주는 복합적이고 깊은 향"}, {icon: <Shield className="w-6 h-6"/>, title: "희소성", desc: "자연이 허락한 극소수의 나무에서만 얻을 수 있는 귀한 보물"}, {icon: <Star className="w-6 h-6"/>, title: "가치", desc: "왕실과 귀족들이 향유하던 최고의 가치"}, {icon: <Heart className="w-6 h-6"/>, title: "약용", desc: "전통 의학의 지혜와 현대 과학적 효능 입증"} ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border-t-4 border-[#5C3D2E] shadow-lg hover:-translate-y-2 transition-transform text-center">
                          <h4 className="text-xl font-bold mb-4 text-gray-900 flex items-center justify-center gap-2">
                            <span className="text-[#5C3D2E]">{item.icon}</span>
                            {item.title}
                          </h4>
                          <p className="text-gray-900 text-sm">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Efficacy */}
                  <section className="py-12 px-6 bg-[#1a1a2e]">
                    <h2 className="text-4xl font-noto-serif text-center mb-4">침향의 효능에 주목!</h2>
                    <p className="text-center text-white/70 mb-8">전통 의학의 지혜를 현대 과학으로 검증합니다</p>
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[
                        { 
                          num: "01", 
                          title: "기를 뚫어 순환 효과", 
                          desc: "침향은 아래로 떨어지는 기운을 통해 몸속 전체의 기혈 순환을 원활하게 하여, 막힌 기를 뚫어주고 오장육부의 기능을 정상화하는 데 도움을 줍니다." 
                        },
                        { 
                          num: "02", 
                          title: "강력한 원기 회복 및 자양강장", 
                          desc: "동의보감에 기록된 바와 같이, 침향은 찬 기운을 몰아내고 따뜻한 성질로 몸의 기운을 보강하여 피로 해소와 활력 증진에 도움을 줍니다." 
                        },
                        { 
                          num: "03", 
                          title: "신경 안정 및 숙면 유도", 
                          desc: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할을 합니다. 예민해진 신경을 이완시켜 스트레스를 완화하고 심리적 안정과 불면증 개선에 효과적입니다." 
                        },
                        { 
                          num: "04", 
                          title: "항염 및 혈관 건강 개선", 
                          desc: "침향은 항염 작용을 통해 염증 물질(사이토카인)을 억제하고, 혈전 형성을 방지하여 만성 염증 치료와 혈관 건강 증진에 도움을 줍니다." 
                        },
                        { 
                          num: "05", 
                          title: "뇌 질환 예방", 
                          desc: "침향은 뇌혈류 개선 및 뇌세포 보호에 도움을 주어, 뇌졸중과 같은 혈관 질환 예방 및 퇴행성 뇌 질환 예방에 긍정적인 영향을 미칠 수 있습니다." 
                        },
                        { 
                          num: "06", 
                          title: "소화 기능 향상 및 복통 완화", 
                          desc: "침향은 기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추는 데 도움을 줍니다." 
                        }
                      ].map((item, i) => (
                        <div key={i} className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] p-8 rounded-2xl border border-[#d4a574]/30">
                          <div className="text-3xl font-bold text-luxury-gold mb-4">{item.num}</div>
                          <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                          <p className="text-white text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
              {activeTab === "literature" && (
                <article className="space-y-12">
                  <header>
                    <h2 className="text-3xl font-noto-serif text-luxury-black mb-6">문헌에 실린 침향</h2>
                    <p className="text-luxury-black/70 leading-relaxed">
                      침향(沈香)은 수천 년간 동서양의 의학 문헌에서 그 가치를 인정받아 온 귀중한 약재입니다. 한국의 전통 의학 문헌부터 동양의 고전까지, 침향에 대한 기록을 정리하였습니다.
                    </p>
                  </header>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: "동의보감(東醫寶鑑)", source: "허준, 1613년", desc: "성질이 따뜻하고 맛이 매우며 독이 없다. 찬 바람이 몸에 들어와 마비가 된 것을 낫게 하고 풍수독종을 없앤다.", tag: "풍수독종" },
                      { title: "향약집성방(鄕藥集成方)", source: "유효통 등, 1433년", desc: "하초의 냉기를 다스리고, 위장을 따뜻하게 하며, 구토와 딸꾹질을 멈추게 한다.", tag: "위장질환" },
                      { title: "본초강목(本草綱目)", source: "이시진, 1578년", desc: "상초의 천식을 치료하고, 중초의 냉을 없애며, 하초의 허한을 보한다. 기를 잘 통하게 하는 약재 중 으뜸이다.", tag: "기순환" },
                      { title: "대한약전 외 한약규격집", source: "식약청, 2002년", desc: "침향나무 수지가 침착된 수간목. 등급양품은 흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다.", tag: "규격" },
                      { title: "신농본초경(神農本草經)", source: "후한시대", desc: "약재 중 상품에 속하며, 오래 복용하면 몸이 가벼워지고 수명이 늘어난다.", tag: "보양" },
                      { title: "명의별록(名醫別錄)", source: "도홍경, 약 500년", desc: "풍수독종을 다스리고 나쁜 기운을 제거하며 심복통을 치료한다.", tag: "해독" },
                      { title: "본초경집주(本草經集注)", source: "도홍경, 약 500년", desc: "물에 가라앉는 것이 상품이며, 반쯤 뜨는 것을 잔향이라 한다.", tag: "품질" },
                      { title: "해약본초(海藥本草)", source: "이순, 당대", desc: "심복통, 곽란, 중악을 치료하고 청이명목 효과가 있다.", tag: "곽란" },
                      { title: "일화자본초(日華子本草)", source: "일화자, 오대십국", desc: "열독을 조절하고 심복통을 치료하며 대장기벽을 다스린다.", tag: "대장" },
                      { title: "본초비요(本草備要)", source: "왕앙, 1694년", desc: "성질이 온화하며 신장의 기를 보하고 대장의 기를 통하게 한다.", tag: "신장" },
                      { title: "증류본초(證類本草)", source: "당신미, 1082년", desc: "냉기로 인한 마비와 풍습을 다스리며, 온화한 성질로 비위를 보한다.", tag: "비위" },
                      { title: "본초숭원(本草崇原)", source: "장지총, 1663년", desc: "향기가 제경맥을 통하여 기혈순환을 돕는다.", tag: "기혈" },
                      { title: "의림촬요(醫林撮要)", source: "1785년", desc: "침향순기산: 침향을 주 약재로 하여 기의 울체를 풀고 소화기능을 개선한다.", tag: "소화" },
                      { title: "태평혜민화제국방", source: "송대, 1110년", desc: "침향강기환: 신장과 방광의 기능을 보하고 하초의 냉기를 다스린다.", tag: "하초" },
                      { title: "비급천금요방(備急千金要方)", source: "손사막, 652년", desc: "제반 기병을 다스리며, 특히 위장의 냉기를 제거하는 데 효과적이다.", tag: "위장" },
                      { title: "외대비요(外臺秘要)", source: "왕도, 752년", desc: "곽란과 전근을 다스리고, 심복통에 탁월한 효과가 있다.", tag: "심복통" },
                      { title: "본초연의(本草衍義)", source: "구종석, 1116년", desc: "물에 가라앉는 것이 최상품이며, 향기가 맑고 은은하다.", tag: "품질" },
                      { title: "탕액본초(湯液本草)", source: "왕호고, 1289년", desc: "우선 기를 내리고, 다음으로 비위를 보하며, 그 다음으로 신장을 이롭게 한다.", tag: "강기" },
                      { title: "경악전서(景岳全書)", source: "장개빈, 1624년", desc: "최고의 강기약으로, 가슴이 답답하고 기가 위로 치밀어 오르는 증상을 치료한다.", tag: "강기" },
                      { title: "본초정(本草正)", source: "장개빈, 1624년", desc: "양 중의 음약이며, 기를 내리되 기를 흩트리지 않는다.", tag: "보음" },
                      { title: "약성론(藥性論)", source: "진장기, 627년", desc: "냉풍마비를 치료하고, 골절의 회복을 돕고, 독사에 물린 것을 해독한다.", tag: "해독" },
                      { title: "동의수세보원(東醫壽世保元)", source: "이제마, 1894년", desc: "소음인의 위장 기능 개선에 사용되며, 심하비만을 다스린다.", tag: "소음인" },
                      { title: "방약합편(方藥合編)", source: "황도연, 1884년", desc: "모든 기를 조절하는 약재 중 으뜸이며, 특히 하초의 원양을 보한다.", tag: "보양" },
                      { title: "본초정의(本草正義)", source: "장산뢰, 1920년", desc: "하기하면서도 원기를 보충하는 유일한 약재다.", tag: "보양" },
                      { title: "중약대사전(中藥大辭典)", source: "1977년", desc: "주요 약리작용으로 진통, 진정, 항균, 항진균, 혈압강하 효과가 과학적으로 확인됨.", tag: "약리" },
                      { title: "향약제생집성방", source: "1399년", desc: "우리 땅의 약재와 함께 침향을 배합하여 민간에서 쓸 수 있는 처방을 정리.", tag: "민간" },
                      { title: "수진방(袖珍方)", source: "1326년", desc: "침향온위환: 위장의 냉기와 구토를 치료하는 처방.", tag: "위장" },
                      { title: "의학입문(醫學入門)", source: "이천, 1575년", desc: "원기를 돋우고 양기를 북돋으며, 제경맥을 따뜻하게 한다.", tag: "보양" },
                      { title: "본초구진(本草求眞)", source: "황궁수, 1769년", desc: "모든 기를 고르게 하면서 몸을 따뜻하게 하는 약재이다.", tag: "보양" },
                      { title: "중화본초(中華本草)", source: "1999년", desc: "현대 약리학 연구를 종합하여 침향의 항염, 항균, 진정, 진통, 소화촉진 작용을 기록.", tag: "약리" }
                    ].map((item, i) => (
                      <div key={i} className="bg-[#2a2a4e] border border-[#d4a574]/30 p-6 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <BookOpen className="w-8 h-8 text-[#d4a574] opacity-70" />
                          <span className="bg-[#d4a574]/20 text-[#d4a574] text-[10px] px-2 py-1 rounded-full font-bold">{item.tag}</span>
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-[#d4a574]">{item.title}</h4>
                        <p className="text-white/60 text-xs mb-3">{item.source}</p>
                        <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </article>
              )}
              {activeTab === "papers" && (
                <article className="space-y-12">
                  <header>
                    <h2 className="text-3xl font-noto-serif text-luxury-black mb-6">논문에 실린 침향</h2>
                    <p className="text-luxury-black/70 leading-relaxed">
                      침향(沈香)은 현대 과학 논문에서 그 가치를 인정받아 온 귀중한 약재입니다. 최신 학술 연구를 통해 침향의 효능을 정리하였습니다.
                    </p>
                  </header>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: "Chemical Constituents and Pharmacological Activity of Agarwood", info: "Molecules, 2018 · 인용 222회", desc: "침향의 화학 성분과 약리 활성을 종합적으로 분석한 국제적 대표 논문.", url: "https://www.mdpi.com/1420-3049/23/2/342", tag: "학술" },
                      { title: "Natural Products in Agarwood and Aquilaria Plants", info: "Natural Product Reports, 2021 · 인용 210회", desc: "침향과 Aquilaria 식물의 천연물, 생물학적 활성, 생합성 경로를 총정리한 논문.", url: "https://pubs.rsc.org/en/content/articlelanding/2021/np/d0np00042f", tag: "학술" },
                      { title: "Aquilaria Species: Distribution, Phytochemicals, Pharmacological Uses", info: "Molecules, 2021 · 인용 62회", desc: "Aquilaria 종의 분포, 성분, 약리효과, 등급체계를 종합 분석.", url: "https://pubmed.ncbi.nlm.nih.gov/34946790/", tag: "학술" },
                      { title: "침향의 항염 특성: 식물화학, 분자 메커니즘, 치료 응용", info: "Drug Design, Development and Therapy, 2026", desc: "침향의 항염 메커니즘을 분자 수준에서 체계적으로 분석한 최신 논문.", url: "https://doi.org/10.2147/DDDT.S511712", tag: "항염" },
                      { title: "침향의 신경보호 효과 종합 분석", info: "Phytochemistry Reviews (Springer), 2025 · 인용 3회", desc: "침향의 신경보호 특성과 알츠하이머·파킨슨병 등 신경퇴행성 질환 치료 가능성 탐구.", url: "https://link.springer.com/article/10.1007/s11101-025-10117-6", tag: "신경보호" },
                      { title: "Aquilaria 종의 약리학적 활성 잠재력 분석", info: "Tropical Journal of Natural Product Research, 2025", desc: "Aquilaria 종의 약리학적 특성과 한방 제제 개발 가능성 분석.", url: "https://www.researchgate.net/publication/395124490", tag: "학술" },
                      { title: "침향 정유의 추출 방법이 수율·성분·생물활성에 미치는 영향", info: "Journal of Essential Oil Research, 2025 · 인용 11회", desc: "다양한 추출 방법에 따른 침향 정유의 진정, 수면유도 약리활성 비교.", url: "https://doi.org/10.1080/10412905.2024.2447706", tag: "진정" },
                      { title: "침향 성분의 약리학적 개요 및 독성", info: "EDUCATUM Journal of Science, Mathematics and Technology, 2021 · 인용 17회", desc: "침향의 약리 특성과 안전성 프로파일을 종합 정리.", url: "https://ejournal.upsi.edu.my/index.php/EJSMT/article/view/4836", tag: "약리" },
                      { title: "침향의 식물화학, 약리 활성 및 분석법 개요", info: "Traditional Medicine, 2022 · 인용 18회", desc: "침향의 전통적 사용법, 유도방법, 성분, 약리활성을 종합 분석.", url: "https://www.traditionalmedicines.org/full-text/an-overview-of-agarwood-phytochemical-constituents-pharmacological-activities-and-analyses", tag: "약리" },
                      { title: "Aquilaria crassna 추출물의 면역조절 및 생물학적 효과 평가", info: "Herbal Formula Science (대한한의학방제학회지), 2022 · 인용 3회", desc: "침향 추출물이 면역 세포를 활성화시켜 면역 기능을 강화하는 효과를 확인.", url: "https://www.koreascience.kr/article/JAKO202206840762342.page", tag: "면역" },
                      { title: "GC-MS를 이용한 다양한 침향의 화학 성분 분석", info: "대한본초학회지, 2011 · 인용 4회", desc: "산지별 침향의 화학 성분 차이를 GC-MS로 정밀 분석.", url: "https://koreascience.kr/article/JAKO201122238508185.page", tag: "성분분석" },
                      { title: "오향(五香)의 항진균 및 살충 활성", info: "대한목재보존학회지, 2001 · 인용 15회", desc: "침향을 포함한 오향의 강력한 항진균 및 살충 활성을 과학적으로 검증.", tag: "항균" },
                      { title: "비특이성 면역을 강화하는 한약재의 문헌적 고찰", info: "조선대학교 석사논문, 2006", desc: "침향이 비특이적 면역 반응을 강화하는 대표적 한약재임을 문헌적으로 고찰.", tag: "면역" },
                      { title: "고지방사료 비만 당뇨 마우스에서 침향 첨가 녹차의 생리활성", info: "학위논문, 2017", desc: "침향을 첨가한 녹차 추출물이 비만과 당뇨 합병증 개선에 효과적임을 동물실험으로 입증.", tag: "대사" },
                      { title: "경옥고 가미방에 침향 첨가 시 항산화·면역력 활성 영향", info: "학술지, 2016", desc: "경옥고에 침향을 첨가한 가미방이 항산화와 면역력 활성을 유의미하게 향상.", tag: "면역" },
                      { title: "아디포넥틴 분비 촉진 메커니즘", info: "서울대학교 학위논문, 2019", desc: "침향 유래 phenylethylchromone이 아디포넥틴 분비를 촉진하여 대사증후군 개선 가능성 제시.", tag: "대사" },
                      { title: "한방신경정신과 영역의 수면장애 관련 연구현황", info: "동의신경정신과학회지, 2012", desc: "침향이 수면장애 치료에 사용되는 한방 약재로 활용됨을 임상 연구에서 확인.", tag: "진정" },
                      { title: "아로마테라피가 중년여성의 수면향상과 우울에 미치는 영향", info: "조선대학교, 2014", desc: "침향을 포함한 아로마테라피가 중년여성의 수면의 질 향상과 우울감 감소에 유의미한 효과.", tag: "진정" },
                      { title: "Comprehensive Analysis: Botany, Ethnomedicinal", info: "Natural Products Journal, 2026", desc: "말레이시아 Aquilaria 종의 식물학, 전통 의약 사용법, 약리 효과를 종합 분석.", tag: "학술" },
                      { title: "침향 한의학적 활용과 웰니스 산업 연계 방안", info: "한국웰니스학회지, 2026", desc: "침향의 전통 한의학적 가치를 현대 웰니스 산업과 연계하는 방안 제시.", tag: "웰니스" }
                    ].map((item, i) => {
                      const CardWrapper = item.url ? "a" : "div";
                      const cardProps = item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {};
                      
                      return (
                        <CardWrapper key={i} {...cardProps} className={`bg-[#faf8f0] border border-[#d4a574]/20 p-6 rounded-2xl ${item.url ? "hover:scale-[1.02] transition-transform shadow-sm cursor-pointer" : "shadow-sm"}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-8 h-8 text-[#d4a574] opacity-70" />
                            <span className="bg-[#d4a574]/10 text-[#d4a574] text-[10px] px-2 py-1 rounded-full font-bold">{item.tag}</span>
                          </div>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-luxury-black font-bold text-sm leading-snug">{item.title}</h4>
                          </div>
                          <p className="text-luxury-black/70 text-[11px] mb-3">{item.info}</p>
                          <p className="text-luxury-black/90 text-xs leading-relaxed">{item.desc}</p>
                        </CardWrapper>
                      );
                    })}
                  </div>
                  <footer className="bg-white p-8 rounded-2xl border border-luxury-gold/20 shadow-sm text-center">
                    <p className="text-luxury-black/70 mb-2">
                      위 문헌과 논문은 침향의 전통적·과학적 가치를 뒷받침하는 대표적인 자료들입니다. ZOEL LIFE는 이러한 학술적 근거를 바탕으로, 대한약전 규격에 부합하는 최고 품질의 침향만을 엄선하여 제공합니다.
                    </p>
                    <p className="text-luxury-black/40 text-xs">최종 수정일: 2026-04-01</p>
                  </footer>
                </article>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
