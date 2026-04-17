import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  Factory, History, Leaf, Award, ShieldCheck, MapPin, CheckCircle2, ArrowRight, 
  Quote, Trees, FileCheck, Microscope, Truck, Droplets, Sun, Wind, Zap, 
  Thermometer, FlaskConical, Trophy, Timer, Search, HardDrive, BarChart3,
  Edit2, X, Check
} from "lucide-react";
import SEO from "../components/SEO";
import { renderImage } from "../utils/image";
import { useSiteImages } from "../hooks/useSiteImages";
import { StoryContent, FieldContent, HistoryContent, CertificationContent, QualityContent, ProcessContent } from "../components/BrandStoryContent";

export default function BrandStory() {
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { images } = useSiteImages();
  const [activeTab, setActiveTab] = useState("field");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isFieldEditMode, setIsFieldEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const defaultTabContent: Record<string, { title: string; subtitle: string }> = {
    story: {
      title: '브랜드 스토리',
      subtitle: '자연의 진실된 가치를 담은 대라천 \'참\'침향의 철학'
    },
    field: {
      title: '100% 베트남산, 아갈로차 침향나무만!',
      subtitle: '200ha 규모, 400만 그루의 침향나무가 자라는 생명의 터전'
    },
    history: {
      title: '대라천 침향 역사',
      subtitle: '25년, 시간으로 증명하는 침향의 깊이'
    },
    certification: {
      title: '다양한 인증',
      subtitle: '국제가 인정하는 ZOEL LIFE의 품질'
    },
    quality: {
      title: '검증된 품질',
      subtitle: '과학으로 입증된 안전성'
    },
    process: {
      title: '생산 공정',
      subtitle: '14단계의 엄격한 프리미엄 공정'
    }
  };

  const processData = (pageData: any) => {
    if (!pageData || !pageData.tabs) return pageData;
    
    const updatedTabs = pageData.tabs.map((tab: any) => {
      const defaults = defaultTabContent[tab.id];
      if (defaults) {
        const baseTab = {
          ...tab,
          title: tab.id === 'field' ? defaults.title : (tab.title || defaults.title),
          subtitle: tab.id === 'field' ? defaults.subtitle : (tab.subtitle || defaults.subtitle)
        };

        // Add visual defaults if missing
        if (tab.id === 'field') {
          baseTab.heroImage = null;
          baseTab.treeImage = null;
          baseTab.locationsTitle = tab.locationsTitle || "5대 주요 거점";
          baseTab.locationsSubtitle = tab.locationsSubtitle || "베트남 전역에 걸친 ZOEL LIFE의 체계적인 생산 네트워크";
          if (baseTab.locations) {
            baseTab.locations = baseTab.locations.map((loc: any, i: number) => ({
              ...loc,
              image: null
            }));
          }
        }

        if (tab.id === 'history') {
          if (baseTab.timeline) {
            const timelineImages = [
              "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400",
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400"
            ];
            const timelineIcons = [Trees, Factory, FileCheck, Trophy];
            baseTab.timeline = baseTab.timeline.map((item: any, i: number) => ({
              ...item,
              image: item.image || timelineImages[i % timelineImages.length],
              icon: timelineIcons[i % timelineIcons.length]
            }));
          }
        }

        if (tab.id === 'original') {
          if (baseTab.philosophy) {
            const philImages = [
              "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600"
            ];
            baseTab.philosophy = baseTab.philosophy.map((item: any, i: number) => ({
              ...item,
              image: item.image || philImages[i % philImages.length]
            }));
          }
        }

        if (tab.id === 'certification') {
          const certIcons = [ShieldCheck, Award, Leaf, FlaskConical, CheckCircle2, Trophy];
          if (baseTab.certs) {
            baseTab.certs = baseTab.certs.map((cert: any, i: number) => ({
              ...cert,
              icon: certIcons[i % certIcons.length]
            }));
          }
        }

        if (tab.id === 'quality') {
          baseTab.processSteps = [
            { id: 1, name: "식목", icon: Trees, duration: "1년차" },
            { id: 2, name: "유기농관리", icon: Sun, duration: "5~20년" },
            { id: 3, name: "수지앉힘", icon: Droplets, duration: "2~10년" },
            { id: 4, name: "수확", icon: Zap, duration: "수시" },
            { id: 5, name: "원목입고", icon: Truck, duration: "당일" },
            { id: 6, name: "세척", icon: Droplets, duration: "1차" },
            { id: 7, name: "절단", icon: Factory, duration: "정밀" },
            { id: 8, name: "수지목분리", icon: Search, duration: "수작업" },
            { id: 9, name: "이물질제거", icon: Wind, duration: "2차" },
            { id: 10, name: "세척3회", icon: Droplets, duration: "3차" },
            { id: 11, name: "자연광건조", icon: Sun, duration: "72시간" },
            { id: 12, name: "분쇄", icon: HardDrive, duration: "1~2mm" },
            { id: 13, name: "고온증류", icon: Thermometer, duration: "72시간" },
            { id: 14, name: "수지채취", icon: FlaskConical, duration: "숙성/출고" },
          ];
          baseTab.heavyMetals = [
            { name: "납 (Pb)", result: "불검출" },
            { name: "비소 (As)", result: "불검출" },
            { name: "수은 (Hg)", result: "불검출" },
            { name: "카드뮴 (Cd)", result: "불검출" },
            { name: "안티몬 (Sb)", result: "불검출" },
            { name: "바륨 (Ba)", result: "불검출" },
            { name: "크롬 (Cr)", result: "불검출" },
            { name: "셀레늄 (Se)", result: "불검출" },
          ];
        }

        return baseTab;
      }
      return tab;
    });

    return { ...pageData, tabs: updatedTabs };
  };

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("isAdmin") === "true");
    
    // Listen for real-time updates from Firestore
    const unsubscribe = onSnapshot(doc(db, "pages", "brandStory"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().pageData) {
        setData(processData(docSnap.data().pageData));
        setLoading(false);
      } else {
        // Fallback to API if Firestore document doesn't exist yet
        fetch("/api/brandStory")
          .then(res => res.json())
          .then(apiData => {
            setData(processData(apiData));
            setLoading(false);
          })
          .catch(err => {
            console.error("Error fetching brand story:", err);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEditLocation = (index: number, loc: any) => {
    setEditingLocationIndex(index);
    setEditForm({ name: loc.name, desc: loc.desc });
  };

  const handleEditSection = (sectionId: string, initialData: any) => {
    setEditingSection(sectionId);
    setEditForm({ ...currentTabData, ...initialData });
  };

  const handleSaveSection = async (sectionId: string) => {
    setSavingEdit(true);
    try {
      // Create a deeply cloned copy of tabs to avoid any React/Symbol references
      const rawTabs = JSON.parse(JSON.stringify(data.tabs));
      
      // Find exact index to update
      const tabIndex = rawTabs.findIndex((t: any) => t.id === activeTab);
      if (tabIndex !== -1) {
          const updatedTab = { ...rawTabs[tabIndex] };
          
          if (sectionId === 'tabHeader' || sectionId === 'panorama' || sectionId === 'fieldHeader') {
            updatedTab.title = editForm.title;
            updatedTab.subtitle = editForm.subtitle;
          }
          if (sectionId === 'locationsHeader') {
            updatedTab.locationsTitle = editForm.locationsTitle;
            updatedTab.locationsSubtitle = editForm.locationsSubtitle;
          }
          if (sectionId === 'panorama') {
            updatedTab.heroImage = editForm.heroImage || updatedTab.heroImage;
          }
          if (sectionId === 'mainStory' || sectionId === 'mainStoryContent') {
            updatedTab.mainTitle = sectionId === 'mainStory' ? editForm.mainTitle : updatedTab.mainTitle;
            updatedTab.content = editForm.content;
            updatedTab.stat1Label = sectionId === 'mainStory' ? editForm.stat1Label : updatedTab.stat1Label;
            updatedTab.stat1Value = sectionId === 'mainStory' ? editForm.stat1Value : updatedTab.stat1Value;
            updatedTab.stat2Label = sectionId === 'mainStory' ? editForm.stat2Label : updatedTab.stat2Label;
            updatedTab.stat2Value = sectionId === 'mainStory' ? editForm.stat2Value : updatedTab.stat2Value;
          }
          
          rawTabs[tabIndex] = updatedTab;
      }
      
      const updatedTabs = rawTabs;

      // Explicitly construct a plain object payload
      const payload = {
        pageData: JSON.parse(JSON.stringify({ tabs: updatedTabs })),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "pages", "brandStory"), payload);
      
      // Update local state by creating a NEW array reference
      setData((prev: any) => ({
        ...prev,
        tabs: [...updatedTabs],
        _timestamp: Date.now()
      }));
      
      setEditingSection(null);
    } catch (error) {
      console.error("Error saving section:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveLocation = async (index: number) => {
    setSavingEdit(true);
    try {
      const updatedTabs = data.tabs.map((tab: any) => {
        if (tab.id === 'field') {
          const updatedLocations = [...tab.locations];
          updatedLocations[index] = { ...updatedLocations[index], name: editForm.name, desc: editForm.desc };
          return { ...tab, locations: updatedLocations };
        }
        return tab;
      });

      const updatedData = { ...data, tabs: updatedTabs };
      await setDoc(doc(db, "pages", "brandStory"), {
        pageData: updatedData,
        updatedAt: new Date().toISOString()
      });
      
      // Data will be updated via onSnapshot listener
      setEditingLocationIndex(null);
    } catch (error) {
      console.error("Error saving location:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">Loading...</div>;

  if (!data || !data.tabs) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">데이터를 불러올 수 없습니다.</div>;

  const tabs = [
    { id: "story", label: "브랜드 스토리", icon: <Leaf className="w-5 h-5" /> },
    { id: "field", label: "대라천 침향 현장", icon: <MapPin className="w-5 h-5" /> },
    { id: "history", label: "대라천 침향 역사", icon: <History className="w-5 h-5" /> },
    { id: "certification", label: "다양한 인증", icon: <Award className="w-5 h-5" /> },
    { id: "quality", label: "검증된 품질", icon: <ShieldCheck className="w-5 h-5" /> },
    { id: "process", label: "생산 공정", icon: <Factory className="w-5 h-5" /> },
  ];

  const currentTabData = data.tabs.find((t: any) => t.id === activeTab) || data.tabs[0];

  return (
    <div className="bg-luxury-cream min-h-screen font-noto-sans text-luxury-black relative">
      <SEO 
        title="브랜드 스토리 - 25년의 집념, 자연의 진실된 가치 | ZOEL LIFE"
        description="대라천 '참'침향의 진실된 가치와 25년의 집념이 담긴 이야기를 전합니다."
        keywords="ZOEL LIFE 스토리, 침향 농장, NTV 연혁, 침향 인증, 프리미엄 침향, 베트남 침향, ZOEL LIFE 침향"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "ZOEL LIFE",
              "url": "https://www.daracheon.com/",
              "logo": "https://www.daracheon.com/logo.png",
              "description": "베트남 직영 농장에서 25년간 연구한 최고급 침향 전문 브랜드"
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "브랜드 스토리", "item": "https://www.daracheon.com/brand-story" }
              ]
            }
          ]
        }}
      />

      {/* Admin Toggle (Dev/Admin access) */}
      <div className="fixed bottom-4 left-4 z-[100]">
        <button 
          onClick={() => {
            const newState = !isAdmin;
            setIsAdmin(newState);
            sessionStorage.setItem("isAdmin", String(newState));
          }}
          className="px-4 py-2 bg-luxury-black/80 backdrop-blur-md text-luxury-gold/80 hover:text-luxury-gold text-[10px] rounded-full border border-luxury-gold/30 transition-all shadow-2xl flex items-center gap-2 group"
        >
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {isAdmin ? "관리자 모드 활성" : "관리자 모드 비활성"}
        </button>
      </div>

      {/* Hero Section */}
      <header className="relative h-[35vh] min-h-[300px] flex items-center justify-center text-luxury-cream overflow-hidden">
        <div className="absolute inset-0 z-0">
          {renderImage(images['brandStoryHero'], "Tropical Forest", "w-full h-full object-cover", "farm")}
          <div className="absolute inset-0 bg-luxury-black/60 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10 px-4 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs mb-4 text-luxury-gold tracking-[0.3em] uppercase font-bold"
          >
            BRAND STORY
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 leading-tight"
          >
            대라천 '참'침향
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
            조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, <br className="hidden md:block" />
            자연이 허락한 수십 년 이상의 기다림을 선물합니다.
          </motion.p>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-[120px] space-y-3">
            <div className="mb-10 px-4 w-fit">
              <a href="/brand-story" className="block">
                <h2 className="text-2xl font-noto-serif font-bold text-luxury-black tracking-tight hover:text-luxury-gold transition-colors">Brand Story</h2>
                <div className="w-full h-0.5 bg-luxury-gold mt-2"></div>
              </a>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditingSection(null);
                  setEditingLocationIndex(null);
                  setIsFieldEditMode(false);
                }}
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
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div className="text-center lg:text-left max-w-4xl relative group">
                {isAdmin && editingSection !== 'tabHeader' && (
                  <button
                    onClick={() => handleEditSection('tabHeader', { title: currentTabData.title, subtitle: currentTabData.subtitle })}
                    className="absolute -top-12 right-0 lg:-left-16 lg:right-auto flex items-center gap-2 px-4 py-2 bg-luxury-gold text-luxury-black rounded-full shadow-lg hover:scale-105 transition-all z-10 font-bold text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    탭 제목/부제목 편집
                  </button>
                )}

                {editingSection === 'tabHeader' ? (
                  <div className="space-y-4 bg-white p-8 rounded-3xl border border-luxury-gold/20 shadow-2xl mb-12">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-luxury-gold uppercase tracking-wider">제목 (Title)</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-cream/30 border border-luxury-gold/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 text-xl font-noto-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-luxury-gold uppercase tracking-wider">부제목 (Subtitle)</label>
                      <textarea
                        value={editForm.subtitle}
                        onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-cream/30 border border-luxury-gold/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 h-32 resize-none text-lg"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-6 py-2 text-sm font-medium text-luxury-black/60 hover:text-luxury-black transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveSection('tabHeader')}
                        disabled={savingEdit}
                        className="px-8 py-2 bg-luxury-black text-luxury-gold rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-luxury-gold hover:text-luxury-black transition-all"
                      >
                        {savingEdit ? "저장 중..." : <><Check className="w-4 h-4" /> 변경사항 저장</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab !== 'field' && (
                      <>
                        <motion.h2 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[30px] font-noto-serif font-medium mb-8 text-luxury-black leading-tight"
                        >
                          {currentTabData.title}
                        </motion.h2>
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-xl text-luxury-black/60 font-light leading-relaxed"
                        >
                          {currentTabData.subtitle}
                        </motion.p>
                      </>
                    )}
                  </>
                )}
              </div>

            {/* Tab Specific Visuals */}
            {activeTab === "story" && <StoryContent />}

            {activeTab === "field" && (
              <div className="space-y-24">
                {/* Panorama Header */}
                <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group">
                  <img 
                    src={currentTabData.heroImage} 
                    alt="Vietnam Plantation" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent flex items-center justify-center p-12">
                {editingSection === 'panorama' || editingSection === 'fieldHeader' ? (
                  <div className="max-w-xl w-full bg-luxury-black/80 p-8 rounded-2xl border border-luxury-gold/30 space-y-4 z-20">
                    <div className="space-y-6 text-center">
                      <div className="space-y-2">
                        <label className="text-[10px] text-luxury-gold uppercase font-bold tracking-widest opacity-50">Main Title</label>
                        <input 
                          type="text"
                          value={editForm.title || currentTabData.title}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-transparent border-b border-luxury-gold/30 py-2 text-xl font-noto-serif font-bold text-white text-center focus:outline-none focus:border-luxury-gold transition-all"
                          placeholder="Enter main title..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-luxury-gold uppercase font-bold tracking-widest opacity-50">Subtitle</label>
                        <textarea 
                          value={editForm.subtitle || currentTabData.subtitle}
                          onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                          className="w-full bg-transparent border-b border-luxury-gold/30 py-2 text-lg md:text-xl text-white/80 text-center focus:outline-none focus:border-luxury-gold h-20 resize-none transition-all"
                          placeholder="Enter subtitle..."
                        />
                      </div>
                    </div>
                    {editingSection === 'panorama' && (
                      <div className="space-y-2 text-left">
                        <label className="text-xs text-luxury-gold uppercase font-bold">이미지 URL</label>
                        <input 
                          type="text"
                          value={editForm.heroImage || currentTabData.heroImage}
                          onChange={e => setEditForm({...editForm, heroImage: e.target.value})}
                          className="w-full bg-white/10 border border-luxury-gold/30 rounded px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSaveSection(editingSection || 'panorama')}
                        disabled={savingEdit}
                        className="flex-1 bg-luxury-gold text-luxury-black py-2 rounded font-medium text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
                      >
                        <Check className="w-4 h-4" /> {savingEdit ? "저장 중..." : "저장"}
                      </button>
                      <button 
                        onClick={() => setEditingSection(null)}
                        className="flex-1 bg-white/10 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4" /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl text-center relative group/header">
                    <div className="relative inline-block">
                      <h3 style={{ fontSize: '30px' }} className="font-noto-serif font-medium text-luxury-black mb-4">
                        {currentTabData.title}
                      </h3>
                      {isAdmin && (
                        <button 
                          onClick={() => handleEditSection('fieldHeader', { 
                            title: currentTabData.title,
                            subtitle: currentTabData.subtitle
                          })}
                          className="absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-luxury-gold text-luxury-black flex items-center justify-center shadow-2xl opacity-0 group-hover/header:opacity-100 transition-all hover:scale-110 z-10"
                          title="제목/부제목 수정"
                        >
                          <Edit2 className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {currentTabData.subtitle.split('\n').map((line: string, i: number) => (
                        <p 
                          key={i} 
                          className={`${i === 0 ? 'text-[#C9A84C] text-[7px] md:text-[9px]' : 'text-luxury-black/60 text-sm md:text-base'} drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] font-medium`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleEditSection('panorama', { 
                          heroImage: currentTabData.heroImage,
                          title: currentTabData.title,
                          subtitle: currentTabData.subtitle
                        })}
                        className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-all hover:bg-white hover:text-luxury-black backdrop-blur-sm border border-white/20"
                      >
                        <MapPin className="w-3 h-3" /> 배경이미지 수정
                      </button>
                    )}
                  </div>
                )}
                  </div>
                </div>

                {/* Left Text Right Image */}
                <div className="flex flex-col items-center gap-16 group">
                  <div className="max-w-4xl text-center space-y-8 relative">
                    <div className="inline-block px-6 py-2 bg-luxury-gold/10 text-luxury-gold text-sm font-bold tracking-widest uppercase rounded-full">THE SOURCE</div>
                    
                    {editingSection === 'mainStory' || editingSection === 'mainStoryContent' ? (
                      <div className="bg-white p-8 rounded-2xl border border-luxury-gold/30 space-y-6 shadow-2xl text-left">
                        {editingSection === 'mainStory' && (
                          <div className="space-y-2">
                            <label className="text-xs text-luxury-gold uppercase font-bold">메인 제목</label>
                            <input 
                              type="text"
                              value={editForm.mainTitle}
                              onChange={e => setEditForm({...editForm, mainTitle: e.target.value})}
                              className="w-full border border-gray-200 rounded px-3 py-2 text-luxury-black font-bold focus:outline-none focus:border-luxury-gold"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-xs text-luxury-gold uppercase font-bold">본문 내용</label>
                          <textarea 
                            value={editForm.content}
                            onChange={e => setEditForm({...editForm, content: e.target.value})}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-luxury-black h-48 focus:outline-none focus:border-luxury-gold leading-relaxed"
                            placeholder="본문 내용을 입력하세요..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveSection(editingSection || 'mainStory')}
                            disabled={savingEdit}
                            className="flex-1 bg-luxury-gold text-luxury-black py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-luxury-black hover:text-white transition-colors"
                          >
                            <Check className="w-4 h-4" /> {savingEdit ? "저장 중..." : "저장"}
                          </button>
                          <button 
                            onClick={() => setEditingSection(null)}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-4 h-4" /> 취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-5xl md:text-6xl lg:text-7xl font-noto-serif font-bold leading-tight text-luxury-black drop-shadow-md">
                          {currentTabData.mainTitle ? (
                            currentTabData.mainTitle.split('\n').map((line: string, i: number) => (
                              <span key={i}>{line}<br /></span>
                            ))
                          ) : (
                            <>25년의 기다림이 <br />시작되는 곳</>
                          )}
                        </h3>
                        <div className="relative group/content overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl bg-white">
                          <table className="w-full text-left border-collapse">
                            <tbody>
                              <tr>
                                <td className="py-8 px-8 md:px-12 text-xl text-luxury-black/70 font-light leading-relaxed prose prose-lg">
                                  <div dangerouslySetInnerHTML={{ __html: currentTabData.content }} />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {isAdmin && (
                            <button 
                              onClick={() => handleEditSection('mainStoryContent', { content: currentTabData.content })}
                              className="absolute right-4 top-4 w-10 h-10 rounded-full bg-luxury-gold text-luxury-black flex items-center justify-center opacity-0 group-hover/content:opacity-100 transition-opacity shadow-lg z-10"
                              title="본문 내용 수정"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => handleEditSection('mainStory', { 
                              mainTitle: currentTabData.mainTitle || "25년의 기다림이 시작되는 곳",
                              content: currentTabData.content
                            })}
                            className="absolute top-0 -right-12 w-10 h-10 rounded-full bg-luxury-gold text-luxury-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="w-full max-w-5xl">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-luxury-gold/10 rounded-3xl blur-3xl group-hover:bg-luxury-gold/20 transition-all"></div>
                      {renderImage(currentTabData.treeImage, "Agarwood Tree", "relative w-full aspect-video object-cover rounded-3xl shadow-2xl", "tree")}
                    </div>
                  </div>
                </div>

                {/* Location Cards */}
                <div className="space-y-12">
                  <div className="text-center space-y-4 relative group">
                    {editingSection === 'locationsHeader' ? (
                      <div className="bg-white p-8 rounded-2xl border border-luxury-gold/30 space-y-6 shadow-2xl text-left max-w-2xl mx-auto">
                        <div className="space-y-2">
                          <label className="text-xs text-luxury-gold uppercase font-bold">섹션 제목</label>
                          <input 
                            type="text"
                            value={editForm.locationsTitle}
                            onChange={e => setEditForm({...editForm, locationsTitle: e.target.value})}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-luxury-black font-bold focus:outline-none focus:border-luxury-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-luxury-gold uppercase font-bold">섹션 부제목</label>
                          <input 
                            type="text"
                            value={editForm.locationsSubtitle}
                            onChange={e => setEditForm({...editForm, locationsSubtitle: e.target.value})}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-luxury-black focus:outline-none focus:border-luxury-gold"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveSection('locationsHeader')}
                            disabled={savingEdit}
                            className="flex-1 bg-luxury-gold text-luxury-black py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-luxury-black hover:text-white transition-colors"
                          >
                            <Check className="w-4 h-4" /> {savingEdit ? "저장 중..." : "저장"}
                          </button>
                          <button 
                            onClick={() => setEditingSection(null)}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-4 h-4" /> 취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-4xl md:text-5xl font-sans font-bold mb-4 text-luxury-black">
                          {currentTabData.locationsTitle || "5대 주요 거점"}
                        </h3>
                        <p className="text-luxury-black/70">
                          {currentTabData.locationsSubtitle || "베트남 전역에 걸친 ZOEL LIFE의 체계적인 생산 네트워크"}
                        </p>
                        {isAdmin && (
                          <button 
                            onClick={() => handleEditSection('locationsHeader', { 
                              locationsTitle: currentTabData.locationsTitle || "5대 주요 거점",
                              locationsSubtitle: currentTabData.locationsSubtitle || "베트남 전역에 걸친 ZOEL LIFE의 체계적인 생산 네트워크"
                            })}
                            className="absolute top-0 -right-12 w-10 h-10 rounded-full bg-luxury-gold text-luxury-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => setIsFieldEditMode(!isFieldEditMode)}
                        className={`mt-4 px-6 py-2 rounded-full border transition-all flex items-center gap-2 mx-auto ${
                          isFieldEditMode 
                            ? "bg-luxury-gold text-luxury-black border-luxury-gold shadow-lg" 
                            : "bg-transparent text-luxury-gold border-luxury-gold hover:bg-luxury-gold/10"
                        }`}
                      >
                        <Edit2 size={16} /> {isFieldEditMode ? "편집 모드 종료" : "거점 정보 직접 편집하기"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentTabData.locations.map((loc: any, idx: number) => (
                      <motion.div
                        key={loc.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative h-[350px] rounded-2xl overflow-hidden shadow-lg cursor-default hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                      >
                        {renderImage(loc.image, loc.name, "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", "region")}
                        <div className="absolute inset-0 bg-luxury-black/40 group-hover:bg-luxury-black/60 transition-colors duration-300"></div>
                        
                        {(editingLocationIndex === idx || (isFieldEditMode && isAdmin)) ? (
                          <div className="absolute inset-0 p-6 bg-luxury-black/80 flex flex-col justify-center space-y-4 z-20">
                            <div className="space-y-2">
                              <label className="text-xs text-luxury-gold uppercase font-bold">지역명 (Title)</label>
                              <input 
                                type="text"
                                defaultValue={loc.name}
                                id={`loc-name-${idx}`}
                                className="w-full bg-white/10 border border-luxury-gold/30 rounded px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-luxury-gold uppercase font-bold">설명 (Description)</label>
                              <textarea 
                                defaultValue={loc.desc}
                                id={`loc-desc-${idx}`}
                                className="w-full bg-white/10 border border-luxury-gold/30 rounded px-3 py-2 text-white h-24 focus:outline-none focus:border-luxury-gold text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const nameInput = document.getElementById(`loc-name-${idx}`) as HTMLInputElement;
                                  const descInput = document.getElementById(`loc-desc-${idx}`) as HTMLTextAreaElement;
                                  
                                  const newLocations = [...currentTabData.locations];
                                  newLocations[idx] = { ...newLocations[idx], name: nameInput.value, desc: descInput.value };
                                  
                                  const newTabs = data.tabs.map((t: any) => 
                                    t.id === 'field' ? { ...t, locations: newLocations } : t
                                  );
                                  
                                  setSavingEdit(true);
                                  setDoc(doc(db, "pages", "brandStory"), { pageData: { ...data, tabs: newTabs } })
                                    .then(() => {
                                      setEditingLocationIndex(null);
                                    })
                                    .finally(() => setSavingEdit(false));
                                }}
                                disabled={savingEdit}
                                className="flex-1 bg-luxury-gold text-luxury-black py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
                              >
                                <Check className="w-4 h-4" /> {savingEdit ? "저장 중..." : "저장 (Save)"}
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingLocationIndex(null);
                                  if (isFieldEditMode) setIsFieldEditMode(false);
                                }}
                                className="flex-1 bg-white/10 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                              >
                                <X className="w-4 h-4" /> 취소 (Cancel)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center transform transition-transform duration-300 group-hover:translate-y-[-10px]">
                              <div className="flex items-center gap-2 text-luxury-gold mb-4">
                                <MapPin className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-[0.2em] uppercase">VIETNAM</span>
                              </div>
                              <h3 className="text-4xl md:text-5xl font-noto-serif font-bold text-white mb-4">{loc.name}</h3>
                              <p className="text-white/80 text-base font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[280px]">{loc.desc}</p>
                            </div>
                            
                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLocation(idx, loc);
                                }}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-luxury-gold text-luxury-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && <HistoryContent />}

            {activeTab === "certification" && <CertificationContent />}

            {activeTab === "quality" && <QualityContent />}

            {activeTab === "process" && <ProcessContent />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
);
}

function ParallaxSlogan() {
  const parallaxRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ["start end", "end start"]
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={parallaxRef} className="relative h-[60vh] rounded-[3rem] overflow-hidden flex items-center justify-center group">
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1920" 
          alt="Natural Value"
          className="w-full h-[120%] object-cover brightness-[0.4]"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <div className="relative z-10 text-center space-y-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <span className="text-luxury-gold text-sm font-bold tracking-[0.5em] uppercase border-b border-luxury-gold/30 pb-2">
            BRAND SLOGAN
          </span>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-9xl font-noto-serif font-bold text-white tracking-tighter leading-none"
        >
          자연의 <br className="md:hidden" />
          <span className="text-luxury-gold">진실된</span> 가치
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-luxury-cream/60 text-lg md:text-xl font-light tracking-widest max-w-2xl mx-auto"
        >
          ZOEL LIFE가 추구하는 변하지 않는 본질의 미학
        </motion.p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/20 via-transparent to-luxury-black/40 pointer-events-none"></div>
    </div>
  );
}
