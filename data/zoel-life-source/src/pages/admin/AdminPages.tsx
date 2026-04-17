import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Upload, Leaf } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { uploadFileToStorage } from "../../utils/storage";
import { useSiteImages } from "../../hooks/useSiteImages";

// Empty default structure for new pages
const emptyPageStructure = {
  heroTitle: "",
  heroSubtitle: "",
  sections: [
    { id: "1", title: "새 섹션", content: "" }
  ]
};

export default function AdminPages() {
  const [activeTab, setActiveTab] = useState("about");
  const [pageData, setPageData] = useState<any>(emptyPageStructure);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const { images, updateImage } = useSiteImages();

  const pages = [
    { id: "about", label: "침향이란" },
    { id: "brandStory", label: "브랜드 스토리" },
    { id: "process", label: "생산 공정" },
    { id: "company", label: "ZOEL LIFE 소개" },
  ];

  const defaultTabContent: Record<string, { title: string; subtitle: string }> = {
    field: {
      title: '',
      subtitle: ''
    },
    history: {
      title: '대라천 침향 역사',
      subtitle: '시간이 증명하는 침향의 깊이'
    },
    original: {
      title: '자연의 진실된 가치',
      subtitle: '타협하지 않는 ZOEL LIFE의 경영철학'
    },
    certification: {
      title: '신뢰의 지표',
      subtitle: '국제가 인정하는 ZOEL LIFE의 품질'
    },
    quality: {
      title: '과학으로 입증된 안전',
      subtitle: '최소 26년의 시간이 만드는 한 방울의 가치'
    }
  };

  const processBrandStoryData = (pageData: any) => {
    if (!pageData || !pageData.tabs) return pageData;
    
    const updatedTabs = pageData.tabs.map((tab: any) => {
      const defaults = defaultTabContent[tab.id];
      if (defaults) {
        return {
          ...tab,
          title: tab.title || defaults.title,
          subtitle: tab.subtitle || defaults.subtitle
        };
      }
      return tab;
    });

    return { ...pageData, tabs: updatedTabs };
  };

  const fetchPageContent = async (pageId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, "pages", pageId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().pageData) {
        let data = docSnap.data().pageData;
        if (pageId === "brandStory") {
          data = processBrandStoryData(data);
        }
        setPageData(data);
      } else {
        // Default structures for different pages
        if (pageId === "brandStory") {
          // Fetch from API to get the initial structure
          const res = await fetch("/api/brandStory");
          const apiData = await res.json();
          setPageData(processBrandStoryData(apiData));
        } else {
          setPageData(emptyPageStructure);
        }
      }
    } catch (error) {
      console.error("Error fetching page content:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPageContent(activeTab);
  }, [activeTab]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await setDoc(doc(db, "pages", activeTab), {
        pageData,
        updatedAt: new Date().toISOString()
      });
      setFeedback({ type: 'success', message: '저장되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error saving page content:", error);
      setFeedback({ type: 'error', message: '저장 중 오류가 발생했습니다.' });
    }
    setSaving(false);
  };

  // Helper for brandStory nested updates
  const updateBrandTab = (tabId: string, field: string, value: any) => {
    if (!pageData.tabs) return;
    setPageData({
      ...pageData,
      tabs: pageData.tabs.map((t: any) => t.id === tabId ? { ...t, [field]: value } : t)
    });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, "pages");
      await updateImage(`${activeTab}Hero`, url);
      setFeedback({ type: 'success', message: '이미지가 업로드되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error uploading hero image:", error);
      setFeedback({ type: 'error', message: '이미지 업로드에 실패했습니다.' });
    } finally {
      setUploadingHero(false);
    }
  };

  const addSection = () => {
    const newSection = { id: Date.now().toString(), title: "새 섹션", content: "" };
    const sections = pageData.sections || [];
    setPageData({ ...pageData, sections: [...sections, newSection] });
  };

  const removeSection = (id: string) => {
    setPageData({
      ...pageData,
      sections: (pageData.sections || []).filter((s: any) => s.id !== id)
    });
    setDeleteConfirm(null);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...pageData.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }
    setPageData({ ...pageData, sections: newSections });
  };

  const updateSection = (id: string, field: string, value: string) => {
    setPageData({
      ...pageData,
      sections: pageData.sections.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-noto-serif text-luxury-black">페이지 편집</h2>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setActiveTab(page.id)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === page.id
                ? "border-luxury-gold text-luxury-black"
                : "border-transparent text-luxury-black/60 hover:text-luxury-black"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-luxury-black">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-luxury-black">
              {pages.find(p => p.id === activeTab)?.label} 내용 편집
            </h3>
            {feedback && (
              <span className={`text-sm px-3 py-1 rounded-full ${
                feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {feedback.message}
              </span>
            )}
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="btn-gold flex items-center gap-2"
          >
            <Save size={18} /> {saving ? "저장 중..." : "저장"}
          </button>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">불러오는 중...</div>
        ) : (
          <div className="space-y-8">
            {activeTab === "brandStory" ? (
              <div className="space-y-12">
                {pageData.tabs?.map((tab: any) => (
                  <div key={tab.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                    <h4 className="text-lg font-medium text-luxury-gold border-b pb-2">{tab.label} 탭 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">제목</label>
                        <input 
                          type="text" 
                          value={tab.title} 
                          onChange={e => updateBrandTab(tab.id, 'title', e.target.value)}
                          className="w-full border rounded p-2 text-luxury-black" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">부제목</label>
                        <input 
                          type="text" 
                          value={tab.subtitle} 
                          onChange={e => updateBrandTab(tab.id, 'subtitle', e.target.value)}
                          className="w-full border rounded p-2 text-luxury-black" 
                        />
                      </div>
                    </div>
                    {tab.content !== undefined && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">본문 내용</label>
                        <ReactQuill 
                          theme="snow" 
                          value={tab.content || ""} 
                          onChange={(content) => updateBrandTab(tab.id, 'content', content)}
                          modules={modules}
                          className="h-64 mb-12"
                        />
                      </div>
                    )}

                    {tab.id === 'field' && tab.locations && (
                      <div className="space-y-6 pt-6 border-t">
                        <div className="bg-white p-6 rounded-xl border border-luxury-gold/20 space-y-6">
                          <h5 className="text-md font-bold text-luxury-gold flex items-center gap-2">
                            <Leaf size={18} /> 메인 스토리 편집 (현장 탭)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-600 mb-1">메인 제목</label>
                              <input 
                                type="text" 
                                value={tab.mainTitle || "25년의 기다림이 시작되는 곳"} 
                                onChange={e => updateBrandTab(tab.id, 'mainTitle', e.target.value)}
                                className="w-full border rounded p-2 font-bold" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-gray-700">5대 거점 지역 카드 편집</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tab.locations.map((loc: any, idx: number) => (
                              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 group hover:border-luxury-gold/50 transition-colors">
                                <div className="flex justify-between items-center border-b pb-2">
                                  <span className="text-xs font-bold text-luxury-gold uppercase tracking-widest">Location Card {idx + 1}</span>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSave()}
                                      className="text-[10px] bg-luxury-gold/10 text-luxury-gold px-2 py-1 rounded hover:bg-luxury-gold hover:text-white transition-colors flex items-center gap-1"
                                    >
                                      <Save size={10} /> 개별 저장
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">지역명 (Title)</label>
                                    <input 
                                      type="text"
                                      value={loc.name}
                                      onChange={e => {
                                        const newLocs = [...tab.locations];
                                        newLocs[idx] = { ...newLocs[idx], name: e.target.value };
                                        updateBrandTab(tab.id, 'locations', newLocs);
                                      }}
                                      className="w-full border-b border-gray-100 py-1 text-base font-medium focus:outline-none focus:border-luxury-gold bg-transparent"
                                      placeholder="지역명을 입력하세요"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">설명 (Description)</label>
                                    <textarea 
                                      value={loc.desc}
                                      onChange={e => {
                                        const newLocs = [...tab.locations];
                                        newLocs[idx] = { ...newLocs[idx], desc: e.target.value };
                                        updateBrandTab(tab.id, 'locations', newLocs);
                                      }}
                                      className="w-full border border-gray-100 rounded-lg p-3 text-sm h-28 focus:outline-none focus:border-luxury-gold bg-gray-50/50"
                                      placeholder="지역에 대한 설명을 입력하세요"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2">
                                    <button 
                                      onClick={() => fetchPageContent(activeTab)}
                                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                    >
                                      <Trash2 size={12} /> 초기화 (Cancel)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Note: Complex structures like timeline/certs are edited as JSON or simplified for now */}
                    <p className="text-xs text-gray-400 italic">* 타임라인, 인증 목록 등 복잡한 구조는 현재 기본 데이터로 유지됩니다.</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-medium mb-4 text-luxury-gold">히어로 섹션</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">히어로 이미지</label>
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {images[`${activeTab}Hero`] ? (
                          <img src={images[`${activeTab}Hero`]} alt="Hero" className="w-48 h-32 object-cover rounded border" />
                        ) : (
                          <div className="w-48 h-32 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm shrink-0">이미지 없음</div>
                        )}
                        <div className="flex-1 w-full space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL 직접 입력</label>
                            <input
                              type="text"
                              value={images[`${activeTab}Hero`] || ""}
                              onChange={(e) => updateImage(`${activeTab}Hero`, e.target.value)}
                              placeholder="https://..."
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">또는</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              ref={heroInputRef}
                              onChange={handleHeroUpload}
                              className="hidden" 
                            />
                            <button 
                              type="button"
                              onClick={() => heroInputRef.current?.click()}
                              disabled={uploadingHero}
                              className="px-4 py-2 border rounded text-sm flex items-center gap-2 hover:bg-gray-100 bg-white disabled:opacity-50"
                            >
                              <Upload size={16} />
                              {uploadingHero ? "업로드 중..." : "파일 업로드"}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">권장 사이즈: 1920x1080px</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">히어로 제목</label>
                      <input 
                        type="text" 
                        value={pageData.heroTitle} 
                        onChange={e => setPageData({...pageData, heroTitle: e.target.value})} 
                        className="w-full border rounded p-2" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">히어로 부제목</label>
                      <input 
                        type="text" 
                        value={pageData.heroSubtitle} 
                        onChange={e => setPageData({...pageData, heroSubtitle: e.target.value})} 
                        className="w-full border rounded p-2" 
                      />
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-luxury-gold">본문 섹션</h4>
                    <button onClick={addSection} className="px-3 py-1.5 bg-luxury-black text-luxury-cream rounded text-sm flex items-center gap-1 hover:bg-luxury-gold transition-colors">
                      <Plus size={16} /> 섹션 추가
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {pageData.sections?.map((section: any, index: number) => (
                      <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-700">섹션 {index + 1}</span>
                            <input 
                              type="text" 
                              value={section.title} 
                              onChange={e => updateSection(section.id, 'title', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-64"
                              placeholder="섹션 제목 (관리용)"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 text-gray-500 hover:text-luxury-black disabled:opacity-30">
                              <ArrowUp size={18} />
                            </button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === pageData.sections.length - 1} className="p-1 text-gray-500 hover:text-luxury-black disabled:opacity-30">
                              <ArrowDown size={18} />
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                            {deleteConfirm === section.id ? (
                              <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                                <span className="text-xs text-red-600 font-medium">삭제?</span>
                                <button onClick={() => removeSection(section.id)} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700">확인</button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-300">취소</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(section.id)} className="p-1 text-red-500 hover:text-red-700">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-0 bg-white">
                          <ReactQuill 
                            theme="snow" 
                            value={section.content || ""} 
                            onChange={(content) => updateSection(section.id, 'content', content)}
                            modules={modules}
                            className="h-64 mb-12"
                          />
                        </div>
                      </div>
                    ))}
                    {(!pageData.sections || pageData.sections.length === 0) && (
                      <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                        등록된 섹션이 없습니다. 섹션을 추가하여 내용을 작성해주세요.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
